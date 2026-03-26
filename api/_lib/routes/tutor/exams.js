import { supabaseRest } from '../../supabase.js';
import { withCors } from '../../cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const tutorId = req.query.tutor_id;
    if (!tutorId) return res.status(400).json({ success: false, message: 'tutor_id required' });

    const { status, data: exams } = await supabaseRest('GET', `/rest/v1/tutor_exams?tutor_id=eq.${tutorId}&order=created_at.desc`);
    if (status !== 200) return res.json({ success: false, message: 'Failed to fetch exams', data: [] });

    // Fetch student names
    const studentIds = [...new Set(exams.map(e => e.student_id))];
    const studentNames = {};

    if (studentIds.length > 0) {
      const { data: students } = await supabaseRest('GET', `/rest/v1/profiles?id=in.(${studentIds.join(',')})&select=id,full_name`);
      if (Array.isArray(students)) {
        students.forEach(s => { studentNames[s.id] = s.full_name; });
      }
    }

    exams.forEach(exam => { exam.student_name = studentNames[exam.student_id] || 'Unknown'; });

    return res.json({ success: true, data: exams });
  }

  if (req.method === 'POST') {
    const { tutor_id, student_id, title, notes, file_url } = req.body || {};
    if (!tutor_id || !student_id || !title) {
      return res.status(400).json({ success: false, message: 'tutor_id, student_id, and title required' });
    }

    const { status } = await supabaseRest('POST', '/rest/v1/tutor_exams', {
      tutor_id, student_id, title, notes: notes || '', file_url: file_url || null, status: 'sent'
    }, { 'Prefer': 'return=minimal' });

    if (status === 200 || status === 201) return res.json({ success: true, message: 'Exam sent successfully' });
    return res.json({ success: false, message: 'Failed to create exam' });
  }

  if (req.method === 'PUT') {
    const { id, score } = req.body || {};
    if (!id || score === null || score === undefined) {
      return res.status(400).json({ success: false, message: 'Exam ID and score required' });
    }

    const { status } = await supabaseRest('PATCH', `/rest/v1/tutor_exams?id=eq.${id}`, {
      score: parseFloat(score), status: 'graded'
    }, { 'Prefer': 'return=minimal' });

    if (status === 200 || status === 204) return res.json({ success: true, message: 'Exam graded successfully' });
    return res.json({ success: false, message: 'Failed to grade exam' });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
