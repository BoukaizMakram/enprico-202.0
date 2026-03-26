import createPendingHandler from '../_lib/routes/registration/create-pending.js';
import completeRegistrationHandler from '../_lib/routes/registration/complete-registration.js';

const handlers = {
  'create-pending': createPendingHandler,
  'complete-registration': completeRegistrationHandler,
};

export default async function (req, res) {
  const handler = handlers[req.query.action];
  if (!handler) return res.status(404).json({ error: 'Not found' });
  return handler(req, res);
}
