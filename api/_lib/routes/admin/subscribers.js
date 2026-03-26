import { supabaseRest } from '../../supabase.js';
import { withCors } from '../../cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { status, data } = await supabaseRest('GET', '/rest/v1/newsletter_subscribers?order=subscribed_at.desc');
    if (status === 200) return res.json({ success: true, data: data || [] });
    return res.json({ success: false, message: 'Failed to fetch subscribers', data: [] });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'Subscriber ID required' });

    const { status } = await supabaseRest('DELETE', `/rest/v1/newsletter_subscribers?id=eq.${id}`);
    if (status === 200 || status === 204) return res.json({ success: true, message: 'Subscriber deleted' });
    return res.json({ success: false, message: 'Failed to delete subscriber' });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
