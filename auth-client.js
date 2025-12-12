/**
 * Simplified Supabase Client for Enprico
 * Focus: Authentication, Payments, Hours Tracking
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase Configuration
const SUPABASE_URL = 'https://bzophrxgmwhobbucnvkf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6b3BocnhnbXdob2JidWNudmtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTk5MjMsImV4cCI6MjA4MTAzNTkyM30.yeT8z4uGHXMrJcMFkqDbOOSjFIO0p6e1HLNIKBoXoKw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Sign up a new user
 */
export async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName
            }
        }
    });

    return { data, error };
}

/**
 * Sign in existing user
 */
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    return { data, error };
}

/**
 * Sign out current user
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * Get current user
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
}

/**
 * Get user profile
 */
export async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    return { data, error };
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    return { data, error };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}

// ============================================
// SUBSCRIPTIONS & PAYMENTS
// ============================================

/**
 * Create a new subscription
 */
export async function createSubscription(userId, planType, priceUsd, hoursPerMonth, paypalSubscriptionId) {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const { data, error } = await supabase
        .from('subscriptions')
        .insert([{
            user_id: userId,
            plan_type: planType,
            price_usd: priceUsd,
            hours_per_month: hoursPerMonth,
            status: 'active',
            paypal_subscription_id: paypalSubscriptionId,
            end_date: endDate.toISOString()
        }])
        .select()
        .single();

    return { data, error };
}

/**
 * Get user's active subscription
 */
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

/**
 * Get all user subscriptions
 */
export async function getUserSubscriptions(userId) {
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return { data, error };
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId) {
    const { data, error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', auto_renew: false })
        .eq('id', subscriptionId)
        .select()
        .single();

    return { data, error };
}

/**
 * Record a payment
 */
export async function recordPayment(userId, subscriptionId, amount, paypalTransactionId, paypalOrderId) {
    const { data, error } = await supabase
        .from('payments')
        .insert([{
            user_id: userId,
            subscription_id: subscriptionId,
            amount_usd: amount,
            status: 'completed',
            paypal_transaction_id: paypalTransactionId,
            paypal_order_id: paypalOrderId,
            paid_at: new Date().toISOString()
        }])
        .select()
        .single();

    return { data, error };
}

/**
 * Get payment history
 */
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

/**
 * Get current month hours for user
 */
export async function getCurrentMonthHours(userId) {
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const { data, error } = await supabase
        .from('hours_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', currentMonth)
        .single();

    return { data, error };
}

/**
 * Get hours history
 */
export async function getHoursHistory(userId) {
    const { data, error } = await supabase
        .from('hours_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('period_start', { ascending: false });

    return { data, error };
}

/**
 * Get remaining hours (quick helper)
 */
export async function getRemainingHours(userId) {
    const { data, error } = await getCurrentMonthHours(userId);

    if (error || !data) {
        return { remaining: 0, total: 0, error };
    }

    return {
        remaining: parseFloat(data.remaining_hours),
        total: parseFloat(data.total_hours),
        used: parseFloat(data.used_hours),
        error: null
    };
}

// ============================================
// LESSON SESSIONS
// ============================================

/**
 * Schedule a lesson session
 */
export async function scheduleSession(userId, scheduledAt, durationHours, tutorName = null) {
    const { data, error } = await supabase
        .from('lesson_sessions')
        .insert([{
            user_id: userId,
            duration_hours: durationHours,
            scheduled_at: scheduledAt,
            tutor_name: tutorName,
            status: 'scheduled'
        }])
        .select()
        .single();

    return { data, error };
}

/**
 * Complete a session (this will automatically deduct hours)
 */
export async function completeSession(sessionId) {
    const { data, error } = await supabase
        .from('lesson_sessions')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

    return { data, error };
}

/**
 * Get user's upcoming sessions
 */
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

/**
 * Get user's session history
 */
export async function getSessionHistory(userId) {
    const { data, error } = await supabase
        .from('lesson_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: false });

    return { data, error };
}

// ============================================
// DASHBOARD DATA (Combined)
// ============================================

/**
 * Get all dashboard data for a user
 */
export async function getDashboardData(userId) {
    try {
        // Get all data in parallel
        const [
            profileResult,
            subscriptionResult,
            hoursResult,
            upcomingSessionsResult
        ] = await Promise.all([
            getUserProfile(userId),
            getActiveSubscription(userId),
            getCurrentMonthHours(userId),
            getUpcomingSessions(userId)
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
                upcomingSessions: upcomingSessionsResult.error
            }
        };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return null;
    }
}

// ============================================
// AUTH STATE LISTENER
// ============================================

/**
 * Listen to authentication state changes
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

export default supabase;
