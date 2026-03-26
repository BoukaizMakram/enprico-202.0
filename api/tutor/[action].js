import studentsHandler from '../_lib/routes/tutor/students.js';
import hoursHandler from '../_lib/routes/tutor/hours.js';
import examsHandler from '../_lib/routes/tutor/exams.js';
import exercisesHandler from '../_lib/routes/tutor/exercises.js';
import notificationsHandler from '../_lib/routes/tutor/notifications.js';
import studyMaterialsHandler from '../_lib/routes/tutor/study-materials.js';
import paymentRequestsHandler from '../_lib/routes/tutor/payment-requests.js';

const handlers = {
  'students': studentsHandler,
  'hours': hoursHandler,
  'exams': examsHandler,
  'exercises': exercisesHandler,
  'notifications': notificationsHandler,
  'study-materials': studyMaterialsHandler,
  'payment-requests': paymentRequestsHandler,
};

export default async function (req, res) {
  const handler = handlers[req.query.action];
  if (!handler) return res.status(404).json({ error: 'Not found' });
  return handler(req, res);
}
