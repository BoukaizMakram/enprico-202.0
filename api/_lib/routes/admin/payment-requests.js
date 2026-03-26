import { supabaseRest } from '../../supabase.js';
import { withCors } from '../../cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { status, data: requests } = await supabaseRest('GET', '/rest/v1/payment_requests?order=created_at.desc&select=*');
    if (status !== 200) return res.json({ success: false, message: 'Failed to fetch payment requests', data: [] });

    // Fetch tutor names
    const tutorIds = [...new Set(requests.map(r => r.tutor_id))];
    const tutorNames = {};
    if (tutorIds.length > 0) {
      const { data: tutors } = await supabaseRest('GET', `/rest/v1/profiles?id=in.(${tutorIds.join(',')})&select=id,full_name,email`);
      if (Array.isArray(tutors)) tutors.forEach(t => { tutorNames[t.id] = t.full_name; });
    }

    requests.forEach(r => { r.tutor_name = tutorNames[r.tutor_id] || 'Unknown'; });
    return res.json({ success: true, data: requests });
  }

  if (req.method === 'PUT') {
    const { id, status: newStatus, admin_notes } = req.body || {};
    if (!id || !newStatus) return res.status(400).json({ success: false, message: 'ID and status required' });

    const updateData = { status: newStatus };
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

    const { status } = await supabaseRest('PATCH', `/rest/v1/payment_requests?id=eq.${id}`, updateData, { 'Prefer': 'return=minimal' });
    if (status === 200 || status === 204) return res.json({ success: true, message: 'Payment request updated' });
    return res.json({ success: false, message: 'Failed to update payment request' });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
