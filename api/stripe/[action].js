import createCheckoutSessionHandler from '../_lib/routes/stripe/create-checkout-session.js';
import verifySessionHandler from '../_lib/routes/stripe/verify-session.js';

const handlers = {
  'create-checkout-session': createCheckoutSessionHandler,
  'verify-session': verifySessionHandler,
};

export default async function (req, res) {
  const handler = handlers[req.query.action];
  if (!handler) return res.status(404).json({ error: 'Not found' });
  return handler(req, res);
}
