import { supabaseRest } from '@/lib/api/supabase.js';
import { withCors } from '@/lib/api/cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const tutorId = req.query.tutor_id;
    if (!tutorId) return res.status(400).json({ success: false, message: 'tutor_id required' });

    const { status, data } = await supabaseRest('GET', `/rest/v1/tutor_notifications?tutor_id=eq.${tutorId}&order=created_at.desc`);
    if (status === 200) return res.json({ success: true, data });
    return res.json({ success: false, message: 'Failed to fetch notifications', data: [] });
  }

  if (req.method === 'PUT') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'Notification ID required' });

    const { status } = await supabaseRest('PATCH', `/rest/v1/tutor_notifications?id=eq.${id}`, { is_read: true }, { 'Prefer': 'return=minimal' });
    if (status === 200 || status === 204) return res.json({ success: true, message: 'Notification marked as read' });
    return res.json({ success: false, message: 'Failed to update notification' });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
