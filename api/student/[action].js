import examsHandler from '../_lib/routes/student/exams.js';
import exercisesHandler from '../_lib/routes/student/exercises.js';

const handlers = {
  'exams': examsHandler,
  'exercises': exercisesHandler,
};

export default async function (req, res) {
  const handler = handlers[req.query.action];
  if (!handler) return res.status(404).json({ error: 'Not found' });
  return handler(req, res);
}
