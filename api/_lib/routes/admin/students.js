import { supabaseRest, supabaseAuth } from '../../supabase.js';
import { withCors } from '../../cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const { status, data } = await supabaseRest('GET', '/rest/v1/profiles?role=eq.student&order=created_at.desc');
    if (status === 200) return res.json({ success: true, data });
    return res.json({ success: false, message: 'Failed to fetch students', debug: { status, data, hasUrl: !!process.env.SUPABASE_URL, hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY } });
  }

  if (req.method === 'PUT') {
    const { id, full_name, email, phone, french_level, timezone, goals_description, assigned_tutor_id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'Student ID required' });

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (french_level !== undefined) updateData.french_level = french_level;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (goals_description !== undefined) updateData.goals_description = goals_description;
    if (assigned_tutor_id !== undefined) updateData.assigned_tutor_id = assigned_tutor_id;

    if (Object.keys(updateData).length === 0) return res.status(400).json({ success: false, message: 'No data to update' });

    const { status } = await supabaseRest('PATCH', `/rest/v1/profiles?id=eq.${id}`, updateData, { 'Prefer': 'return=minimal' });
    if (status === 200 || status === 204) return res.json({ success: true, message: 'Student updated successfully' });
    return res.json({ success: false, message: 'Failed to update student' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'Student ID required' });

    const errors = [];

    // 1. Find and cancel Stripe subscriptions
    const { data: subs } = await supabaseRest('GET', `/rest/v1/subscriptions?user_id=eq.${id}&select=stripe_customer_id,stripe_subscription_id`);
    if (Array.isArray(subs)) {
      for (const sub of subs) {
        if (sub.stripe_subscription_id) {
          await fetch(`https://api.stripe.com/v1/subscriptions/${sub.stripe_subscription_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` },
          });
        }
        if (sub.stripe_customer_id) {
          await fetch(`https://api.stripe.com/v1/customers/${sub.stripe_customer_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` },
          });
        }
      }
    }

    // 2. Mark subscriptions as cancelled
    await supabaseRest('PATCH', `/rest/v1/subscriptions?user_id=eq.${id}`, { status: 'cancelled' });

    // 3. Delete profile
    const profileResult = await supabaseRest('DELETE', `/rest/v1/profiles?id=eq.${id}`);
    if (profileResult.status !== 200 && profileResult.status !== 204) errors.push('Failed to delete profile');

    // 4. Delete auth user
    const authResult = await supabaseAuth('DELETE', `/auth/v1/admin/users/${id}`);
    if (authResult.status !== 200 && authResult.status !== 204) errors.push('Failed to delete auth user');

    if (errors.length === 0) return res.json({ success: true, message: 'Student deleted successfully. Subscription/payment history preserved.' });
    return res.json({ success: false, message: errors.join(', ') });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
