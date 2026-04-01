import createCheckoutSessionHandler from './create-checkout-session.js';
import verifySessionHandler from './verify-session.js';

const handlers = {
  'create-checkout-session': createCheckoutSessionHandler,
  'verify-session': verifySessionHandler,
};

export function getHandler(action) {
  return handlers[action] || null;
}
