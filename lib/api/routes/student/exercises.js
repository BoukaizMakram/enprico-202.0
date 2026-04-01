import { supabaseRest } from '@/lib/api/supabase.js';
import { withCors } from '@/lib/api/cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ success: false, message: 'user_id required' });

    const { status, data: exercises } = await supabaseRest('GET', `/rest/v1/exercises?student_id=eq.${userId}&order=created_at.desc`);
    if (status !== 200) return res.json({ success: false, message: 'Failed to fetch exercises', data: [] });

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
      if (exercise.type === 'qcm') exercise.questions = qcmQuestions[exercise.id] || [];
    });

    return res.json({ success: true, data: exercises });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
