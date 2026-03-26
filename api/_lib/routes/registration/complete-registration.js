import { supabaseRest } from '../../supabase.js';
import { withCors } from '../../cors.js';
import { createSupabaseUser, createUserProfile, getPendingRegistration, markRegistrationCompleted, generateUserPassword, getUserByEmail, createSubscriptionIfNeeded } from '../../auth.js';
import { sendEmail, welcomeEmailHtml, adminNotificationHtml, hoursAddedEmailHtml, getPlanName } from '../../email.js';

const PLANS = {
  starter: { price: 160, hours: 8 },
  professional: { price: 288, hours: 16 }
};

async function getStripeSession(sessionId) {
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` } }
  );
  if (response.status !== 200) return null;
  return response.json();
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const data = req.body;
  if (!data || !data.sessionId) return res.status(400).json({ error: 'Missing session ID' });

  const session = await getStripeSession(data.sessionId);
  if (!session || !['paid', 'no_payment_required'].includes(session.payment_status)) {
    return res.status(400).json({ error: 'Payment not verified' });
  }

  const metadata = session.metadata || {};
  const isNewUser = metadata.is_new_user === 'true';
  const planType = metadata.plan_type || 'starter';
  const registrationId = metadata.registration_id || null;
  const existingUserId = metadata.user_id || null;
  const sessionId = data.sessionId;

  const plan = PLANS[planType] || PLANS.starter;
  const planName = getPlanName(planType);

  // ============================================
  // New User Flow
  // ============================================
  if (isNewUser && registrationId) {
    const registration = await getPendingRegistration(registrationId);
    if (!registration) return res.status(400).json({ error: 'Registration not found' });

    const generatedPassword = generateUserPassword(registration.full_name, plan.hours);

    // Already completed - resend email as backup
    if (registration.status === 'completed') {
      const existingUser = await getUserByEmail(registration.email);
      if (existingUser) {
        const firstName = registration.full_name.split(' ')[0];
        try {
          await sendEmail(registration.email, 'Welcome to Enprico - Your Account Details',
            welcomeEmailHtml(firstName, registration.email, generatedPassword, planName));
          await sendEmail('learn@enprico.com', `New Payment Received: ${planName} (NEW USER)`,
            adminNotificationHtml(registration.email, planName, plan.price, plan.hours, sessionId, 'NEW USER', new Date().toISOString()));
        } catch (e) { console.error('Email error:', e); }

        return res.json({
          success: true, alreadyCompleted: true, userEmail: registration.email,
          fullName: registration.full_name, temporaryPassword: generatedPassword,
          planType, hours: plan.hours, message: 'Your account is ready. Check your email for login credentials.'
        });
      }
    }

    // Check if user already exists in auth
    const existingUser = await getUserByEmail(registration.email);
    if (existingUser) {
      await markRegistrationCompleted(registrationId, sessionId);
      await createSubscriptionIfNeeded(existingUser.id, planType, plan, sessionId, session);
      return res.json({
        success: true, existingUser: true, userId: existingUser.id,
        userEmail: registration.email, fullName: registration.full_name,
        planType, hours: plan.hours, message: 'Hours added to your account.'
      });
    }

    // Create new user
    const user = await createSupabaseUser(registration.email, generatedPassword, registration.full_name);
    if (!user || !user.id) {
      return res.status(500).json({ error: 'Failed to create user account. Please contact support.' });
    }

    const userId = user.id;

    await createUserProfile(userId, {
      email: registration.email, full_name: registration.full_name,
      phone: registration.phone, french_level: registration.french_level,
      learning_goals: registration.learning_goals, goals_description: registration.goals_description,
      preferred_days: registration.preferred_days, preferred_times: registration.preferred_times,
      timezone: registration.timezone
    });

    await createSubscriptionIfNeeded(userId, planType, plan, sessionId, session);
    await markRegistrationCompleted(registrationId, sessionId);

    // Send emails
    const firstName = registration.full_name.split(' ')[0];
    let emailSent = false;
    try {
      await sendEmail(registration.email, 'Welcome to Enprico - Your Account Details',
        welcomeEmailHtml(firstName, registration.email, generatedPassword, planName));
      emailSent = true;
    } catch (e) { console.error('Welcome email error:', e); }

    try {
      await sendEmail('learn@enprico.com', `New Payment Received: ${planName} (NEW USER)`,
        adminNotificationHtml(registration.email, planName, plan.price, plan.hours, sessionId, 'NEW USER', new Date().toISOString()));
    } catch (e) { console.error('Admin notification error:', e); }

    return res.json({
      success: true, newUser: true, userId, userEmail: registration.email,
      fullName: registration.full_name, temporaryPassword: generatedPassword,
      planType, hours: plan.hours, emailSent, message: 'Account created successfully!'
    });
  }

  // ============================================
  // Existing User Flow
  // ============================================
  if (existingUserId) {
    await createSubscriptionIfNeeded(existingUserId, planType, plan, sessionId, session);

    const customerEmail = session.customer_email || session.customer_details?.email || '';

    if (customerEmail) {
      try {
        await sendEmail(customerEmail, 'Payment Confirmed - Hours Added to Your Account',
          hoursAddedEmailHtml(planName, plan.hours));
      } catch (e) { console.error('Hours added email error:', e); }
    }

    try {
      await sendEmail('learn@enprico.com', `New Payment Received: ${planName} (EXISTING USER)`,
        adminNotificationHtml(customerEmail, planName, plan.price, plan.hours, sessionId, 'EXISTING USER', new Date().toISOString()));
    } catch (e) { console.error('Admin notification error:', e); }

    return res.json({
      success: true, existingUser: true, userId: existingUserId,
      planType, hours: plan.hours, message: 'Hours added to your account.'
    });
  }

  return res.status(400).json({ error: 'Invalid session metadata' });
}

export default withCors(handler);
