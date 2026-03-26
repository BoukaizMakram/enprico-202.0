import { supabaseRest } from '../../supabase.js';
import { withCors } from '../../cors.js';
import { getUserByEmail, formatArrayForPostgres } from '../../auth.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;
  if (!data) return res.status(400).json({ error: 'Invalid request body' });

  // Validate required fields
  const requiredFields = ['email', 'fullName', 'englishLevel', 'learningGoals', 'preferredDays', 'preferredTimes', 'planType'];
  for (const field of requiredFields) {
    if (!data[field]) return res.status(400).json({ error: `Missing required field: ${field}` });
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) return res.status(400).json({ error: 'Invalid email format' });

  // Validate plan type
  if (!['starter', 'professional'].includes(data.planType)) {
    return res.status(400).json({ error: 'Invalid plan type' });
  }

  // Validate french level
  if (!['beginner', 'intermediate', 'advanced', 'native'].includes(data.englishLevel)) {
    return res.status(400).json({ error: 'Invalid French level' });
  }

  // Check if email already exists
  const existingUser = await getUserByEmail(data.email);
  if (existingUser) {
    // Check if they already have Professional plan
    const { data: activeSubs } = await supabaseRest('GET',
      `/rest/v1/subscriptions?user_id=eq.${existingUser.id}&plan_type=eq.${data.planType}&status=eq.active&limit=1`);

    if (Array.isArray(activeSubs) && activeSubs.length > 0 && data.planType === 'professional') {
      return res.status(409).json({ error: 'You already have the Professional plan. Please log in to your dashboard.' });
    }

    return res.json({
      success: true, existingUser: true, userId: existingUser.id,
      userEmail: existingUser.email, message: 'Existing user - proceed to payment'
    });
  }

  const email = data.email.trim().toLowerCase();

  // Prepare registration data
  const registrationData = {
    email,
    full_name: data.fullName.trim(),
    phone: data.phone ? data.phone.trim() : null,
    french_level: data.englishLevel,
    learning_goals: formatArrayForPostgres(data.learningGoals),
    goals_description: data.goalsDescription ? data.goalsDescription.trim() : null,
    preferred_days: formatArrayForPostgres(data.preferredDays),
    preferred_times: formatArrayForPostgres(data.preferredTimes),
    timezone: data.timezone || null,
    plan_type: data.planType,
    status: 'pending'
  };

  // Check for existing pending registration
  const { data: existingRegs } = await supabaseRest('GET',
    `/rest/v1/pending_registrations?email=eq.${encodeURIComponent(email)}&status=eq.pending&order=created_at.desc&limit=1`);

  if (Array.isArray(existingRegs) && existingRegs.length > 0) {
    // Update existing pending registration
    const existingReg = existingRegs[0];
    registrationData.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { status } = await supabaseRest('PATCH',
      `/rest/v1/pending_registrations?id=eq.${existingReg.id}`, registrationData, { 'Prefer': 'return=representation' });

    if (status === 200) {
      return res.json({ success: true, registrationId: existingReg.id, message: 'Registration updated' });
    }
  }

  // Create new pending registration
  const { status, data: created } = await supabaseRest('POST', '/rest/v1/pending_registrations', registrationData, { 'Prefer': 'return=representation' });

  if (status !== 201) {
    return res.status(500).json({ error: 'Failed to create registration' });
  }

  const result = Array.isArray(created) && created[0] ? created[0] : null;
  if (!result) return res.status(500).json({ error: 'Failed to create registration' });

  return res.json({ success: true, registrationId: result.id, message: 'Registration created' });
}

export default withCors(handler);
