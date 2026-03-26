import crypto from 'crypto';
import { supabaseRest, supabaseAuth } from '../_lib/supabase.js';
import { sendEmail, welcomeEmailHtml, adminNotificationHtml, getPlanName } from '../_lib/email.js';
import { createSupabaseUser, createUserProfile, getPendingRegistration, markRegistrationCompleted, generateUserPassword, formatArrayForPostgres } from '../_lib/auth.js';

// Disable Vercel body parser to get raw body for signature verification
export const config = { api: { bodyParser: false } };

const PLANS = {
  starter: { price: 160, hours: 8 },
  professional: { price: 288, hours: 16 }
};

function verifyWebhookSignature(payload, sigHeader, secret) {
  const elements = sigHeader.split(',');
  let timestamp = null;
  const signatures = [];

  for (const element of elements) {
    const [key, value] = element.split('=', 2);
    if (key === 't') timestamp = value;
    else if (key === 'v1') signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp)) > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  return signatures.some(sig => crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(sig)));
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await getRawBody(req);
  const sigHeader = req.headers['stripe-signature'] || '';

  if (!verifyWebhookSignature(payload, sigHeader, webhookSecret)) {
    console.error('Stripe webhook signature verification failed');
    return res.status(400).send('Invalid signature');
  }

  const event = JSON.parse(payload);
  console.log('Stripe webhook received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        console.log('Subscription updated:', event.data.object.id);
        break;
      case 'invoice.paid':
        if (event.data.object.billing_reason !== 'subscription_create') {
          console.log('Invoice paid:', event.data.object.id);
        }
        break;
      case 'invoice.payment_failed':
        console.log('Invoice payment failed for', event.data.object.customer_email);
        break;
      case 'customer.subscription.deleted':
        console.log('Subscription cancelled:', event.data.object.id);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  return res.status(200).json({ received: true });
}

async function handleCheckoutSessionCompleted(session) {
  const metadata = session.metadata || {};
  const isNewUser = metadata.is_new_user === 'true';
  const planType = metadata.plan_type || null;
  const customerEmail = session.customer_email || '';
  const amountTotal = (session.amount_total || 0) / 100;
  const sessionId = session.id || '';
  const stripeSubscriptionId = session.subscription || '';
  const stripeCustomerId = session.customer || '';

  const plan = PLANS[planType];
  if (!plan) { console.error('Invalid plan type:', planType); return; }

  let userId;

  if (isNewUser) {
    const registrationId = metadata.registration_id;
    if (!registrationId) { console.error('New user payment but missing registration_id'); return; }

    const registration = await getPendingRegistration(registrationId);
    if (!registration) { console.error('Pending registration not found:', registrationId); return; }
    if (registration.status === 'completed') { console.log('Registration already completed:', registrationId); return; }

    const generatedPassword = generateUserPassword(registration.full_name, plan.hours);
    const user = await createSupabaseUser(registration.email, generatedPassword, registration.full_name);
    if (!user || !user.id) { console.error('Failed to create user for registration:', registrationId); return; }

    userId = user.id;
    console.log(`Created new user: ${userId} for email: ${registration.email}`);

    await createUserProfile(userId, {
      email: registration.email,
      full_name: registration.full_name,
      phone: registration.phone,
      french_level: registration.french_level,
      learning_goals: registration.learning_goals,
      goals_description: registration.goals_description,
      preferred_days: registration.preferred_days,
      preferred_times: registration.preferred_times,
      timezone: registration.timezone
    });

    await markRegistrationCompleted(registrationId, sessionId);

    // Send welcome email
    const firstName = registration.full_name.split(' ')[0];
    const planName = getPlanName(planType);
    try {
      await sendEmail(registration.email, 'Welcome to Enprico - Your Account Details',
        welcomeEmailHtml(firstName, registration.email, generatedPassword, planName));
    } catch (e) { console.error('Failed to send welcome email:', e); }

    console.log(`New user registration completed: ${userId}`);
  } else {
    userId = metadata.user_id;
    if (!userId) { console.error('Missing user_id in session metadata'); return; }
  }

  // Create subscription
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabaseRest('POST', '/rest/v1/subscriptions', {
    user_id: userId, plan_type: planType, price_usd: plan.price, hours_per_month: plan.hours,
    status: 'active', stripe_session_id: sessionId, stripe_subscription_id: stripeSubscriptionId || null,
    stripe_customer_id: stripeCustomerId || null, end_date: endDate
  }, { 'Prefer': 'return=representation' });

  // Record payment
  await supabaseRest('POST', '/rest/v1/payments', {
    user_id: userId, amount_usd: amountTotal, status: 'completed',
    stripe_session_id: sessionId, paid_at: new Date().toISOString()
  }, { 'Prefer': 'return=minimal' });

  // Send admin notification
  const userType = isNewUser ? 'NEW USER' : 'EXISTING USER';
  const planName = getPlanName(planType);
  try {
    await sendEmail('learn@enprico.ca', `New Payment Received: ${planName} (${userType})`,
      adminNotificationHtml(customerEmail, planName, amountTotal, plan.hours, stripeSubscriptionId || sessionId, userType, new Date().toISOString()));
  } catch (e) { console.error('Failed to send admin notification:', e); }

  console.log(`Successfully processed subscription for user ${userId}, plan ${planType}`);
}
