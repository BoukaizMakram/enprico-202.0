import { supabaseRest } from '../_lib/supabase.js';
import { withCors } from '../_lib/cors.js';

async function handler(req, res) {
  if (req.method === 'PUT') {
    const { student_id, tutor_id, remaining_hours } = req.body || {};

    if (!student_id || !tutor_id || remaining_hours === null || remaining_hours === undefined) {
      return res.status(400).json({ success: false, message: 'student_id, tutor_id, and remaining_hours required' });
    }

    const hours = parseFloat(remaining_hours);
    if (hours < 0) {
      return res.status(400).json({ success: false, message: 'Hours cannot be negative' });
    }

    // Verify tutor owns this student
    const { data: students } = await supabaseRest('GET', `/rest/v1/profiles?id=eq.${student_id}&assigned_tutor_id=eq.${tutor_id}&select=id`);
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(403).json({ success: false, message: 'Student not assigned to this tutor' });
    }

    // Get active subscription to check plan max
    const { data: subs } = await supabaseRest('GET', `/rest/v1/subscriptions?user_id=eq.${student_id}&status=eq.active&order=created_at.desc&limit=1`);
    if (!Array.isArray(subs) || subs.length === 0) {
      return res.status(400).json({ success: false, message: 'Student has no active subscription' });
    }

    const maxHours = parseFloat(subs[0].hours_per_month);
    if (hours > maxHours) {
      return res.status(400).json({ success: false, message: `Hours cannot exceed plan maximum of ${maxHours}` });
    }

    const usedHours = maxHours - hours;
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const year = now.getFullYear();
    const month = now.getMonth();
    const periodStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const periodEnd = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;

    const hoursData = { remaining_hours: hours, used_hours: usedHours, total_hours: maxHours };

    // Try update existing record
    const { data: updated } = await supabaseRest('PATCH', `/rest/v1/hours_tracking?user_id=eq.${student_id}&month_year=eq.${currentMonth}`, hoursData, { 'Prefer': 'return=representation' });

    let finalStatus;
    if (Array.isArray(updated) && updated.length === 0) {
      // No existing record - insert
      const insertData = { ...hoursData, user_id: student_id, month_year: currentMonth, period_start: periodStart, period_end: periodEnd };
      const result = await supabaseRest('POST', '/rest/v1/hours_tracking', insertData, { 'Prefer': 'return=minimal' });
      finalStatus = result.status;
    } else {
      finalStatus = 200;
    }

    if (finalStatus === 200 || finalStatus === 201 || finalStatus === 204) {
      return res.json({ success: true, message: 'Hours updated successfully' });
    }
    return res.json({ success: false, message: 'Failed to update hours' });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
