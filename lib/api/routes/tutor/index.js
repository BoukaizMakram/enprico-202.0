import studentsHandler from './students.js';
import hoursHandler from './hours.js';
import examsHandler from './exams.js';
import exercisesHandler from './exercises.js';
import notificationsHandler from './notifications.js';
import studyMaterialsHandler from './study-materials.js';
import paymentRequestsHandler from './payment-requests.js';

const handlers = {
  'students': studentsHandler,
  'hours': hoursHandler,
  'exams': examsHandler,
  'exercises': exercisesHandler,
  'notifications': notificationsHandler,
  'study-materials': studyMaterialsHandler,
  'payment-requests': paymentRequestsHandler,
};

export function getHandler(action) {
  return handlers[action] || null;
}
