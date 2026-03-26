import studentsHandler from '../_lib/routes/admin/students.js';
import registrationsHandler from '../_lib/routes/admin/registrations.js';
import subscribersHandler from '../_lib/routes/admin/subscribers.js';
import subscriptionsHandler from '../_lib/routes/admin/subscriptions.js';
import trafficHandler from '../_lib/routes/admin/traffic.js';
import tutorsHandler from '../_lib/routes/admin/tutors.js';
import paymentRequestsHandler from '../_lib/routes/admin/payment-requests.js';
import studyMaterialsHandler from '../_lib/routes/admin/study-materials.js';
import notificationsHandler from '../_lib/routes/admin/notifications.js';

const handlers = {
  'students': studentsHandler,
  'registrations': registrationsHandler,
  'subscribers': subscribersHandler,
  'subscriptions': subscriptionsHandler,
  'traffic': trafficHandler,
  'tutors': tutorsHandler,
  'payment-requests': paymentRequestsHandler,
  'study-materials': studyMaterialsHandler,
  'notifications': notificationsHandler,
};

export default async function (req, res) {
  const handler = handlers[req.query.action];
  if (!handler) return res.status(404).json({ error: 'Not found' });
  return handler(req, res);
}
