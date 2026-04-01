import studentsHandler from './students.js';
import registrationsHandler from './registrations.js';
import subscribersHandler from './subscribers.js';
import subscriptionsHandler from './subscriptions.js';
import trafficHandler from './traffic.js';
import tutorsHandler from './tutors.js';
import paymentRequestsHandler from './payment-requests.js';
import studyMaterialsHandler from './study-materials.js';
import notificationsHandler from './notifications.js';

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

export function getHandler(action) {
  return handlers[action] || null;
}
