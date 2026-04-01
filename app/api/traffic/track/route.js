import { adaptHandler } from '@/lib/api/adapter';
import handler from '@/lib/api/routes/traffic/track';

const adapted = adaptHandler(handler);
export const POST = adapted;
export const OPTIONS = adapted;
