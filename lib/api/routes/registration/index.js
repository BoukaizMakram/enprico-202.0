import createPendingHandler from './create-pending.js';
import completeRegistrationHandler from './complete-registration.js';

const handlers = {
  'create-pending': createPendingHandler,
  'complete-registration': completeRegistrationHandler,
};

export function getHandler(action) {
  return handlers[action] || null;
}
