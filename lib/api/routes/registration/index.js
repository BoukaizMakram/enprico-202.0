import createPendingHandler from './create-pending.js';
import completeRegistrationHandler from './complete-registration.js';
import saveLeadHandler from './save-lead.js';

const handlers = {
  'create-pending': createPendingHandler,
  'complete-registration': completeRegistrationHandler,
  'save-lead': saveLeadHandler,
};

export function getHandler(action) {
  return handlers[action] || null;
}
