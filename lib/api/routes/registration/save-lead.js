import { supabaseRest } from '@/lib/api/supabase.js';
import { withCors } from '@/lib/api/cors.js';
import { formatArrayForPostgres } from '@/lib/api/auth.js';

// Upsert a partial onboarding lead, keyed by browser session_id.
// Called on every field blur so we capture the email + progress even if the
// visitor never pays.
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const data = req.body || {};
  const sessionId = (data.sessionId || '').toString().trim();
  if (!sessionId) return res.status(400).json({ success: false, message: 'Missing sessionId' });

  // Only persist fields that were actually provided.
  const row = { session_id: sessionId, updated_at: new Date().toISOString() };
  if (data.email !== undefined) row.email = (data.email || '').toString().trim().toLowerCase() || null;
  if (data.fullName !== undefined) row.full_name = (data.fullName || '').toString().trim() || null;
  if (data.phone !== undefined) row.phone = (data.phone || '').toString().trim() || null;
  if (data.frenchLevel !== undefined) row.french_level = data.frenchLevel || null;
  if (data.planType !== undefined) row.plan_type = data.planType || null;
  if (data.currentStep !== undefined) row.current_step = Number(data.currentStep) || 1;
  if (data.lastField !== undefined) row.last_field = data.lastField || null;
  if (Array.isArray(data.learningGoals)) row.learning_goals = formatArrayForPostgres(data.learningGoals);

  // Upsert on the unique session_id (merge duplicates).
  const { status } = await supabaseRest(
    'POST',
    '/rest/v1/onboarding_leads?on_conflict=session_id',
    row,
    { Prefer: 'resolution=merge-duplicates,return=minimal' }
  );

  if (status === 201 || status === 200 || status === 204) {
    return res.json({ success: true });
  }
  return res.json({ success: false, message: 'Failed to save lead' });
}

export default withCors(handler);
