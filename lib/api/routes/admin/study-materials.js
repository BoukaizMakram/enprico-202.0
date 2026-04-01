import { supabaseRest } from '@/lib/api/supabase.js';
import { withCors } from '@/lib/api/cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { status, data } = await supabaseRest('GET', '/rest/v1/study_materials?order=created_at.desc');
    if (status === 200) return res.json({ success: true, data });
    return res.json({ success: false, message: 'Failed to fetch study materials', data: [] });
  }

  if (req.method === 'POST') {
    const { title, description, file_url, file_type } = req.body || {};
    if (!title || !file_url) return res.status(400).json({ success: false, message: 'Title and file_url required' });

    const { status } = await supabaseRest('POST', '/rest/v1/study_materials', {
      title, description: description || '', file_url, file_type,
    }, { 'Prefer': 'return=minimal' });

    if (status === 200 || status === 201) return res.json({ success: true, message: 'Study material uploaded' });
    return res.json({ success: false, message: 'Failed to upload study material' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'ID required' });

    const { status } = await supabaseRest('DELETE', `/rest/v1/study_materials?id=eq.${id}`);
    if (status === 200 || status === 204) return res.json({ success: true, message: 'Study material deleted' });
    return res.json({ success: false, message: 'Failed to delete study material' });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
