import { supabaseRest } from '../../supabase.js';
import { withCors } from '../../cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ success: false, message: 'user_id required' });

    const { status, data } = await supabaseRest('GET', `/rest/v1/tutor_exams?student_id=eq.${userId}&order=created_at.desc`);
    if (status === 200) return res.json({ success: true, data });
    return res.json({ success: false, message: 'Failed to fetch exams', data: [] });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
