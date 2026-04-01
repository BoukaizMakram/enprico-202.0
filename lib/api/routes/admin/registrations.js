import { supabaseRest } from '@/lib/api/supabase.js';
import { withCors } from '@/lib/api/cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { status, data } = await supabaseRest('GET', '/rest/v1/pending_registrations?status=eq.pending&order=created_at.desc');
    if (status === 200) return res.json({ success: true, data });
    return res.json({ success: false, message: 'Failed to fetch registrations', data: [] });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'Registration ID required' });

    const { status } = await supabaseRest('DELETE', `/rest/v1/pending_registrations?id=eq.${id}`);
    if (status === 200 || status === 204) return res.json({ success: true, message: 'Registration deleted' });
    return res.json({ success: false, message: 'Failed to delete registration' });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
