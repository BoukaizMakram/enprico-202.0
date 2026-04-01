'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ============================================
// ADMIN NOTIFICATIONS
// ============================================

export async function sendAdminNotification(type, userEmail, userName, details = '') {
  try {
    await fetch('/api/contact/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Enprico System',
        email: 'learn@enprico.ca',
        subject: type === 'signup' ? `New Signup: ${userName}` : `New Payment: ${userName}`,
        message: type === 'signup'
          ? `A new user has signed up!\n\nName: ${userName}\nEmail: ${userEmail}\n\nTime: ${new Date().toLocaleString()}`
          : `A payment was received!\n\nName: ${userName}\nEmail: ${userEmail}\n${details}\n\nTime: ${new Date().toLocaleString()}`,
      }),
    });
  } catch (e) {
    console.log('Notification email failed:', e);
  }
}

// ============================================
// AUTHENTICATION
// ============================================

export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (!error && data?.user) {
    sendAdminNotification('signup', email, fullName);
  }

  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
}

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  return { data, error };
}

// ============================================
// SUBSCRIPTIONS & PAYMENTS
// ============================================

export async function createSubscription(userId, planType, priceUsd, hoursPerMonth, paymentId = null, paymentProvider = 'stripe') {
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const subscriptionData = {
    user_id: userId,
    plan_type: planType,
    price_usd: priceUsd,
    hours_per_month: hoursPerMonth,
    status: 'active',
    end_date: endDate.toISOString(),
  };

  if (paymentProvider === 'stripe') {
    subscriptionData.stripe_session_id = paymentId;
  } else {
    subscriptionData.paypal_subscription_id = paymentId;
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .insert([subscriptionData])
    .select()
    .single();
  return { data, error };
}

export async function getActiveSubscription(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return { data, error };
}

export async function getUserSubscriptions(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function cancelSubscription(subscriptionId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', auto_renew: false })
    .eq('id', subscriptionId)
    .select()
    .single();
  return { data, error };
}

export async function recordPayment(userId, subscriptionId, amount, transactionId, orderId, paymentProvider = 'stripe') {
  const paymentData = {
    user_id: userId,
    subscription_id: subscriptionId,
    amount_usd: amount,
    status: 'completed',
    paid_at: new Date().toISOString(),
  };

  if (paymentProvider === 'stripe') {
    paymentData.stripe_payment_intent_id = transactionId;
    paymentData.stripe_session_id = orderId;
  } else {
    paymentData.paypal_transaction_id = transactionId;
    paymentData.paypal_order_id = orderId;
  }

  const { data, error } = await supabase
    .from('payments')
    .insert([paymentData])
    .select()
    .single();
  return { data, error };
}

export async function getPaymentHistory(userId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

// ============================================
// HOURS TRACKING
// ============================================

export async function getCurrentMonthHours(userId) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data, error } = await supabase
    .from('hours_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', currentMonth)
    .single();
  return { data, error };
}

export async function getHoursHistory(userId) {
  const { data, error } = await supabase
    .from('hours_tracking')
    .select('*')
    .eq('user_id', userId)
    .order('period_start', { ascending: false });
  return { data, error };
}

export async function getRemainingHours(userId) {
  const { data, error } = await getCurrentMonthHours(userId);
  if (error || !data) return { remaining: 0, total: 0, error };
  return {
    remaining: parseFloat(data.remaining_hours),
    total: parseFloat(data.total_hours),
    used: parseFloat(data.used_hours),
    error: null,
  };
}

// ============================================
// LESSON SESSIONS
// ============================================

export async function scheduleSession(userId, scheduledAt, durationHours, tutorName = null) {
  const { data, error } = await supabase
    .from('lesson_sessions')
    .insert([{
      user_id: userId,
      duration_hours: durationHours,
      scheduled_at: scheduledAt,
      tutor_name: tutorName,
      status: 'scheduled',
    }])
    .select()
    .single();
  return { data, error };
}

export async function completeSession(sessionId) {
  const { data, error } = await supabase
    .from('lesson_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();
  return { data, error };
}

export async function getUpcomingSessions(userId) {
  const { data, error } = await supabase
    .from('lesson_sessions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['scheduled'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true });
  return { data, error };
}

export async function getSessionHistory(userId) {
  const { data, error } = await supabase
    .from('lesson_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: false });
  return { data, error };
}

// ============================================
// DASHBOARD DATA
// ============================================

export async function getDashboardData(userId) {
  try {
    const [profileResult, subscriptionResult, hoursResult, upcomingSessionsResult] = await Promise.all([
      getUserProfile(userId),
      getActiveSubscription(userId),
      getCurrentMonthHours(userId),
      getUpcomingSessions(userId),
    ]);
    return {
      profile: profileResult.data,
      subscription: subscriptionResult.data,
      hours: hoursResult.data,
      upcomingSessions: upcomingSessionsResult.data || [],
      errors: {
        profile: profileResult.error,
        subscription: subscriptionResult.error,
        hours: hoursResult.error,
        upcomingSessions: upcomingSessionsResult.error,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}

// ============================================
// AUTH STATE LISTENER
// ============================================

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

export default supabase;
