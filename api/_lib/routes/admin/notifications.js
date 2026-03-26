import { supabaseRest } from '../../supabase.js';
import { withCors } from '../../cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { status, data } = await supabaseRest('GET', '/rest/v1/tutor_notifications?order=created_at.desc');
    if (status === 200) return res.json({ success: true, data });
    return res.json({ success: false, message: 'Failed to fetch notifications', data: [] });
  }

  if (req.method === 'POST') {
    const { title, message, tutor_id } = req.body || {};
    if (!title || !message) return res.status(400).json({ success: false, message: 'Title and message required' });

    let httpCode;
    if (tutor_id) {
      const result = await supabaseRest('POST', '/rest/v1/tutor_notifications', { title, message, tutor_id }, { 'Prefer': 'return=minimal' });
      httpCode = result.status;
    } else {
      // Send to all tutors
      const { data: tutors } = await supabaseRest('GET', '/rest/v1/profiles?role=eq.tutor&select=id');
      httpCode = 201;
      if (Array.isArray(tutors) && tutors.length > 0) {
        const notifications = tutors.map(t => ({ title, message, tutor_id: t.id }));
        const result = await supabaseRest('POST', '/rest/v1/tutor_notifications', notifications, { 'Prefer': 'return=minimal' });
        httpCode = result.status;
      }
    }

    if (httpCode === 200 || httpCode === 201) return res.json({ success: true, message: 'Notification sent' });
    return res.json({ success: false, message: 'Failed to send notification' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'ID required' });

    const { status } = await supabaseRest('DELETE', `/rest/v1/tutor_notifications?id=eq.${id}`);
    if (status === 200 || status === 204) return res.json({ success: true, message: 'Notification deleted' });
    return res.json({ success: false, message: 'Failed to delete notification' });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
