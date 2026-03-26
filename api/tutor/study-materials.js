import { supabaseRest } from '../_lib/supabase.js';
import { withCors } from '../_lib/cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { status, data } = await supabaseRest('GET', '/rest/v1/study_materials?order=created_at.desc');
    if (status === 200) return res.json({ success: true, data });
    return res.json({ success: false, message: 'Failed to fetch study materials', data: [] });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
