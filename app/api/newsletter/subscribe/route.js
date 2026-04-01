import { adaptHandler } from '@/lib/api/adapter';
import handler from '@/lib/api/routes/newsletter/subscribe';

const adapted = adaptHandler(handler);
export const POST = adapted;
export const OPTIONS = adapted;
