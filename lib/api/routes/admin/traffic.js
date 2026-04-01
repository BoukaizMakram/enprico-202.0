import { supabaseRest } from '@/lib/api/supabase.js';
import { withCors } from '@/lib/api/cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { status, data } = await supabaseRest('GET', '/rest/v1/traffic?order=visited_at.desc&limit=500');
    if (status === 200) return res.json({ success: true, data });
    return res.json({ success: false, message: 'Failed to fetch traffic', data: [] });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
