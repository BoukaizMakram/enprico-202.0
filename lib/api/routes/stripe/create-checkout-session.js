import { withCors } from '@/lib/api/cors.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const data = req.body;

  if (!data) return res.status(400).json({ error: 'Invalid request body' });

  const { planType, userEmail, successUrl, cancelUrl, registrationId, userId } = data;
  const isNewUser = data.isNewUser === true;

  if (!planType || !userEmail || !successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'Missing required fields: planType, userEmail, successUrl, cancelUrl' });
  }

  if (isNewUser && !registrationId) return res.status(400).json({ error: 'Missing registrationId for new user' });
  if (!isNewUser && !userId) return res.status(400).json({ error: 'Missing userId for existing user' });

  const planPrices = {
    starter: { amount: 25000 },
    professional: { amount: 40000 }
  };

  if (!planPrices[planType]) return res.status(400).json({ error: 'Invalid plan type' });

  const plan = planPrices[planType];

  const metadata = { plan_type: planType, is_new_user: isNewUser ? 'true' : 'false' };
  if (isNewUser) metadata.registration_id = registrationId;
  else metadata.user_id = userId;

  // Build form-encoded body for Stripe API
  const params = new URLSearchParams();
  params.append('payment_method_types[0]', 'card');
  params.append('mode', 'payment');
  params.append('customer_email', userEmail);
  params.append('line_items[0][price_data][currency]', 'cad');
  params.append('line_items[0][price_data][product_data][name]', `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan - Enprico French Tutoring`);
  params.append('line_items[0][price_data][product_data][description]',
    planType === 'starter'
      ? '8 hours of 1-on-1 French tutoring for TEF/TCF (2 hours/week)'
      : '16 hours of 1-on-1 French tutoring for TEF/TCF (4 hours/week)'
  );
  params.append('line_items[0][price_data][unit_amount]', plan.amount.toString());
  params.append('line_items[0][quantity]', '1');
  params.append('success_url', successUrl);
  params.append('cancel_url', cancelUrl);
  params.append('allow_promotion_codes', 'true');

  for (const [key, value] of Object.entries(metadata)) {
    params.append(`metadata[${key}]`, value);
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  const responseData = await response.json();

  if (response.status !== 200) {
    console.error('Stripe error:', responseData);
    return res.status(response.status).json({
      error: responseData?.error?.message || 'Failed to create checkout session'
    });
  }

  return res.json({ sessionId: responseData.id, url: responseData.url });
}

export default withCors(handler);
