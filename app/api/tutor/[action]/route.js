import { adaptHandler } from '@/lib/api/adapter';
import { getHandler } from '@/lib/api/routes/tutor/index';

async function handler(req, res) {
  const actionHandler = getHandler(req.query.action);
  if (!actionHandler) return res.status(404).json({ error: 'Not found' });
  return actionHandler(req, res);
}

const adapted = adaptHandler(handler);
export const GET = adapted;
export const POST = adapted;
export const PUT = adapted;
export const DELETE = adapted;
export const PATCH = adapted;
export const OPTIONS = adapted;
