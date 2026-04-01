import examsHandler from './exams.js';
import exercisesHandler from './exercises.js';

const handlers = {
  'exams': examsHandler,
  'exercises': exercisesHandler,
};

export function getHandler(action) {
  return handlers[action] || null;
}
