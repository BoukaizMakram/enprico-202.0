import { supabaseRest } from '../_lib/supabase.js';
import { withCors } from '../_lib/cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const tutorId = req.query.tutor_id;
    if (!tutorId) return res.status(400).json({ success: false, message: 'tutor_id required' });

    const { status, data: students } = await supabaseRest('GET', `/rest/v1/profiles?assigned_tutor_id=eq.${tutorId}&role=eq.student&order=full_name.asc`);
    if (status !== 200) return res.json({ success: false, message: 'Failed to fetch students', data: [] });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const result = await Promise.all(students.map(async (student) => {
      const sid = student.id;

      const [subResult, hoursResult] = await Promise.all([
        supabaseRest('GET', `/rest/v1/subscriptions?user_id=eq.${sid}&status=eq.active&order=created_at.desc&limit=1`),
        supabaseRest('GET', `/rest/v1/hours_tracking?user_id=eq.${sid}&month_year=eq.${currentMonth}&limit=1`),
      ]);

      const sub = Array.isArray(subResult.data) && subResult.data[0] ? subResult.data[0] : null;
      const hoursData = Array.isArray(hoursResult.data) && hoursResult.data[0] ? hoursResult.data[0] : null;

      return {
        id: sid,
        full_name: student.full_name,
        email: student.email,
        plan_type: sub ? sub.plan_type : null,
        plan_hours: sub ? parseFloat(sub.hours_per_month) : 0,
        remaining_hours: hoursData ? parseFloat(hoursData.remaining_hours) : 0,
        total_hours: hoursData ? parseFloat(hoursData.total_hours) : 0,
        used_hours: hoursData ? parseFloat(hoursData.used_hours) : 0,
        hours_tracking_id: hoursData ? hoursData.id : null,
      };
    }));

    return res.json({ success: true, data: result });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
