import { withCors } from '../../cors.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const data = req.body;

  if (!data || !data.sessionId) {
    return res.status(400).json({ error: 'Missing session ID' });
  }

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(data.sessionId)}?expand[]=payment_intent`,
    {
      headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
    }
  );

  const session = await response.json();

  if (response.status !== 200) {
    return res.status(response.status).json({
      error: session?.error?.message || 'Failed to retrieve session'
    });
  }

  if (!['paid', 'no_payment_required'].includes(session.payment_status)) {
    return res.status(400).json({ error: 'Payment not completed', status: session.payment_status });
  }

  return res.json({
    success: true,
    sessionId: session.id,
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total / 100,
    currency: session.currency,
    customerEmail: session.customer_email,
    metadata: session.metadata,
    paymentIntentId: session.payment_intent?.id || session.payment_intent
  });
}

export default withCors(handler);
