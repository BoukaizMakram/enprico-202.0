import examsHandler from './exams.js';
import exercisesHandler from './exercises.js';
import notificationsHandler from './notifications.js';
import messagesHandler from './messages.js';

const handlers = {
  'exams': examsHandler,
  'exercises': exercisesHandler,
  'notifications': notificationsHandler,
  'messages': messagesHandler,
};

export function getHandler(action) {
  return handlers[action] || null;
}
