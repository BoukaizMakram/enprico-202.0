import { supabaseRest } from '@/lib/api/supabase.js';
import { withCors } from '@/lib/api/cors.js';

async function handler(req, res) {
  // GET /api/student/notifications?user_id=... -> list notifications
  if (req.method === 'GET') {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ success: false, message: 'user_id required' });

    const { status, data } = await supabaseRest(
      'GET',
      `/rest/v1/student_notifications?user_id=eq.${userId}&order=created_at.desc&limit=50`
    );
    if (status === 200) {
      const list = Array.isArray(data) ? data : [];
      const unread = list.filter((n) => !n.is_read).length;
      return res.json({ success: true, data: list, unread });
    }
    return res.json({ success: false, message: 'Failed to fetch notifications', data: [], unread: 0 });
  }

  // POST /api/student/notifications -> mark read
  if (req.method === 'POST') {
    const body = req.body || {};
    const userId = body.user_id;
    if (!userId) return res.status(400).json({ success: false, message: 'user_id required' });

    // Mark a single notification or all as read.
    let path = `/rest/v1/student_notifications?user_id=eq.${userId}&is_read=eq.false`;
    if (body.id) {
      path = `/rest/v1/student_notifications?id=eq.${body.id}&user_id=eq.${userId}`;
    }

    const { status } = await supabaseRest(
      'PATCH',
      path,
      { is_read: true },
      { Prefer: 'return=minimal' }
    );
    if (status >= 200 && status < 300) return res.json({ success: true });
    return res.status(500).json({ success: false, message: 'Failed to update notification' });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
