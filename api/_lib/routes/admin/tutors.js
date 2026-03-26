import { supabaseRest, supabaseAuth } from '../../supabase.js';
import { withCors } from '../../cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { status, data } = await supabaseRest('GET', '/rest/v1/profiles?role=eq.tutor&order=created_at.desc');
    if (status === 200) return res.json({ success: true, data });
    return res.json({ success: false, message: 'Failed to fetch tutors', data: [] });
  }

  if (req.method === 'POST') {
    const { email, password, full_name } = req.body || {};
    if (!email || !password || !full_name) return res.status(400).json({ success: false, message: 'Email, password, and full name required' });

    // Create auth user
    const authResult = await supabaseAuth('POST', '/auth/v1/admin/users', {
      email, password, email_confirm: true,
      user_metadata: { full_name, role: 'tutor' },
    });
    if (authResult.status !== 200 && authResult.status !== 201) {
      return res.json({ success: false, message: authResult.data?.msg || 'Failed to create tutor auth account' });
    }

    const userId = authResult.data.id;

    // Create profile
    const { status } = await supabaseRest('POST', '/rest/v1/profiles?on_conflict=id', {
      id: userId, email, full_name, role: 'tutor',
    }, { 'Prefer': 'return=representation,resolution=merge-duplicates' });

    if (status === 200 || status === 201) return res.json({ success: true, message: 'Tutor created successfully' });
    return res.json({ success: false, message: 'Auth account created but profile creation failed' });
  }

  if (req.method === 'PUT') {
    const { id, full_name, email, phone } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'Tutor ID required' });

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (Object.keys(updateData).length === 0) return res.status(400).json({ success: false, message: 'No data to update' });

    const { status } = await supabaseRest('PATCH', `/rest/v1/profiles?id=eq.${id}`, updateData, { 'Prefer': 'return=minimal' });
    if (status === 200 || status === 204) return res.json({ success: true, message: 'Tutor updated successfully' });
    return res.json({ success: false, message: 'Failed to update tutor' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'Tutor ID required' });

    const errors = [];

    const profileResult = await supabaseRest('DELETE', `/rest/v1/profiles?id=eq.${id}`);
    if (profileResult.status !== 200 && profileResult.status !== 204) errors.push('Failed to delete profile');

    const authResult = await supabaseAuth('DELETE', `/auth/v1/admin/users/${id}`);
    if (authResult.status !== 200 && authResult.status !== 204) errors.push('Failed to delete auth user');

    // Unassign students
    await supabaseRest('PATCH', `/rest/v1/profiles?assigned_tutor_id=eq.${id}`, { assigned_tutor_id: null });

    if (errors.length === 0) return res.json({ success: true, message: 'Tutor deleted successfully' });
    return res.json({ success: false, message: errors.join(', ') });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
