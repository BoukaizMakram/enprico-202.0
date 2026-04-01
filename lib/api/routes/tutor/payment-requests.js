import { supabaseRest } from '@/lib/api/supabase.js';
import { withCors } from '@/lib/api/cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const tutorId = req.query.tutor_id;
    if (!tutorId) return res.status(400).json({ success: false, message: 'tutor_id required' });

    const { status, data } = await supabaseRest('GET', `/rest/v1/payment_requests?tutor_id=eq.${tutorId}&order=created_at.desc`);
    if (status === 200) return res.json({ success: true, data });
    return res.json({ success: false, message: 'Failed to fetch payment requests', data: [] });
  }

  if (req.method === 'POST') {
    const { tutor_id, month_year, total_hours, hourly_rate, total_amount } = req.body || {};
    if (!tutor_id || !month_year || total_hours === null || hourly_rate === null || total_amount === null) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const { status, data } = await supabaseRest('POST', '/rest/v1/payment_requests', {
      tutor_id, month_year, total_hours: parseFloat(total_hours), hourly_rate: parseFloat(hourly_rate),
      total_amount: parseFloat(total_amount), status: 'pending'
    }, { 'Prefer': 'return=minimal' });

    if (status === 200 || status === 201) return res.json({ success: true, message: 'Payment request submitted' });

    let msg = 'Failed to submit payment request';
    if (data && typeof data === 'object' && data.message && data.message.includes('duplicate')) {
      msg = 'A payment request for this month already exists';
    }
    return res.json({ success: false, message: msg });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
