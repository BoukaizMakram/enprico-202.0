import { supabaseRest } from '@/lib/api/supabase.js';
import { withCors } from '@/lib/api/cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const tutorId = req.query.tutor_id;
    if (!tutorId) return res.status(400).json({ success: false, message: 'tutor_id required' });

    const { status, data: exercises } = await supabaseRest('GET', `/rest/v1/exercises?tutor_id=eq.${tutorId}&order=created_at.desc`);
    if (status !== 200) return res.json({ success: false, message: 'Failed to fetch exercises', data: [] });

    // Fetch student names
    const studentIds = [...new Set(exercises.map(e => e.student_id))];
    const studentNames = {};
    if (studentIds.length > 0) {
      const { data: students } = await supabaseRest('GET', `/rest/v1/profiles?id=in.(${studentIds.join(',')})&select=id,full_name`);
      if (Array.isArray(students)) students.forEach(s => { studentNames[s.id] = s.full_name; });
    }

    // Fetch QCM questions
    const exerciseIds = exercises.map(e => e.id);
    const qcmQuestions = {};
    if (exerciseIds.length > 0) {
      const { data: qcmData } = await supabaseRest('GET', `/rest/v1/qcm_questions?exercise_id=in.(${exerciseIds.join(',')})&order=sort_order.asc`);
      if (Array.isArray(qcmData)) {
        qcmData.forEach(q => {
          if (!qcmQuestions[q.exercise_id]) qcmQuestions[q.exercise_id] = [];
          qcmQuestions[q.exercise_id].push(q);
        });
      }
    }

    exercises.forEach(exercise => {
      exercise.student_name = studentNames[exercise.student_id] || 'Unknown';
      if (exercise.type === 'qcm') exercise.questions = qcmQuestions[exercise.id] || [];
    });

    return res.json({ success: true, data: exercises });
  }

  if (req.method === 'POST') {
    const { tutor_id, student_id, title, type, instructions, file_url, video_url, questions } = req.body || {};
    if (!tutor_id || !student_id || !title || !type) {
      return res.status(400).json({ success: false, message: 'tutor_id, student_id, title, and type required' });
    }
    if (!['video', 'pdf', 'text', 'qcm'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type. Must be video, pdf, text, or qcm' });
    }

    const { status, data: created } = await supabaseRest('POST', '/rest/v1/exercises', {
      tutor_id, student_id, title, type, instructions: instructions || '', file_url: file_url || null, video_url: video_url || null, status: 'sent'
    }, { 'Prefer': 'return=representation' });

    if (status !== 200 && status !== 201) {
      return res.json({ success: false, message: 'Failed to create exercise' });
    }

    const exerciseId = Array.isArray(created) && created[0] ? created[0].id : null;

    // Create QCM questions if applicable
    if (type === 'qcm' && Array.isArray(questions) && questions.length > 0 && exerciseId) {
      const qcmInserts = questions.map((q, i) => ({
        exercise_id: exerciseId,
        question: q.question,
        options: JSON.stringify(q.options),
        correct_answer: parseInt(q.correct_answer),
        sort_order: i
      }));
      await supabaseRest('POST', '/rest/v1/qcm_questions', qcmInserts, { 'Prefer': 'return=minimal' });
    }

    return res.json({ success: true, message: 'Exercise created successfully' });
  }

  if (req.method === 'PUT') {
    const { id, score } = req.body || {};
    if (!id || score === null || score === undefined) {
      return res.status(400).json({ success: false, message: 'Exercise ID and score required' });
    }

    const { status } = await supabaseRest('PATCH', `/rest/v1/exercises?id=eq.${id}`, {
      score: parseFloat(score), status: 'graded'
    }, { 'Prefer': 'return=minimal' });

    if (status === 200 || status === 204) return res.json({ success: true, message: 'Exercise graded successfully' });
    return res.json({ success: false, message: 'Failed to grade exercise' });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
