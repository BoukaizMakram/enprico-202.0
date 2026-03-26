import { supabaseRest, supabaseAuth } from './supabase.js';

export async function createSupabaseUser(email, password, fullName) {
  const { status, data } = await supabaseAuth('POST', '/auth/v1/admin/users', {
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (status !== 200 && status !== 201) {
    console.error(`Failed to create user (HTTP ${status}):`, data);
    return null;
  }
  return data;
}

export async function createUserProfile(userId, profileData) {
  const profile = {
    id: userId,
    email: profileData.email,
    full_name: profileData.full_name,
    phone: profileData.phone || null,
    french_level: profileData.french_level || null,
    learning_goals: profileData.learning_goals ? formatArrayForPostgres(profileData.learning_goals) : null,
    goals_description: profileData.goals_description || null,
    preferred_days: profileData.preferred_days ? formatArrayForPostgres(profileData.preferred_days) : null,
    preferred_times: profileData.preferred_times ? formatArrayForPostgres(profileData.preferred_times) : null,
    timezone: profileData.timezone || null,
    registration_source: 'checkout_2025',
  };

  const { status } = await supabaseRest('POST', '/rest/v1/profiles?on_conflict=id', profile, {
    'Prefer': 'return=representation,resolution=merge-duplicates',
  });
  return status === 200 || status === 201;
}

export async function getPendingRegistration(registrationId) {
  const { status, data } = await supabaseRest('GET', `/rest/v1/pending_registrations?id=eq.${registrationId}`);
  if (status !== 200) return null;
  return Array.isArray(data) && data[0] ? data[0] : null;
}

export async function markRegistrationCompleted(registrationId, stripeSessionId = null) {
  const updateData = {
    status: 'completed',
    completed_at: new Date().toISOString(),
  };
  if (stripeSessionId) updateData.stripe_session_id = stripeSessionId;

  const { status } = await supabaseRest('PATCH', `/rest/v1/pending_registrations?id=eq.${registrationId}`, updateData);
  return status === 200 || status === 204;
}

export function generateUserPassword(fullName, hours) {
  const name = fullName.trim().toLowerCase();
  const parts = name.split(/\s+/);
  let namePrefix;
  if (parts.length >= 2) {
    namePrefix = parts[0][0] + parts[parts.length - 1];
  } else {
    namePrefix = parts[0];
  }
  namePrefix = namePrefix.replace(/[^a-z]/g, '');
  return `${namePrefix}_${hours}_enprico`;
}

export function formatArrayForPostgres(arr) {
  if (typeof arr === 'string') return arr;
  if (!Array.isArray(arr)) return '{}';
  return '{' + arr.map(item => `"${String(item).replace(/"/g, '\\"')}"`).join(',') + '}';
}

export async function getUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const { status, data } = await supabaseAuth('GET', '/auth/v1/admin/users');
  if (status !== 200 || !data?.users) return null;

  for (const user of data.users) {
    if (user.email && user.email.toLowerCase() === normalizedEmail) {
      return { id: user.id, email: user.email };
    }
  }
  return null;
}

export async function createSubscriptionIfNeeded(userId, planType, plan, sessionId, session) {
  // Check if subscription already exists for this session
  const { status, data } = await supabaseRest('GET', `/rest/v1/subscriptions?stripe_session_id=eq.${encodeURIComponent(sessionId)}&limit=1`);
  if (status === 200 && Array.isArray(data) && data.length > 0) return true;

  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const subscriptionData = {
    user_id: userId,
    plan_type: planType,
    price_usd: plan.price,
    hours_per_month: plan.hours,
    status: 'active',
    stripe_session_id: sessionId,
    stripe_subscription_id: session?.subscription || null,
    stripe_customer_id: session?.customer || null,
    end_date: endDate,
  };

  const result = await supabaseRest('POST', '/rest/v1/subscriptions', subscriptionData, {
    'Prefer': 'return=representation',
  });
  return result.status === 201;
}
