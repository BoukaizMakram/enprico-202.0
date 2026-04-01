import { verifyWebhookSignature, handleCheckoutSessionCompleted } from '@/lib/api/routes/stripe/webhook';

export const maxDuration = 30;

export async function POST(request) {
  const payload = await request.text();
  const sigHeader = request.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!verifyWebhookSignature(payload, sigHeader, webhookSecret)) {
    console.error('Stripe webhook signature verification failed');
    return new Response('Invalid signature', { status: 400 });
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

  return Response.json({ received: true });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    },
  });
}
