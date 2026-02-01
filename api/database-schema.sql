-- Enprico Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. PENDING REGISTRATIONS TABLE
-- Stores registration data before payment
-- ============================================
CREATE TABLE IF NOT EXISTS public.pending_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    english_level TEXT NOT NULL,
    learning_goals TEXT[] NOT NULL,
    goals_description TEXT,
    preferred_days TEXT[] NOT NULL,
    preferred_times TEXT[] NOT NULL,
    timezone TEXT,
    plan_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    stripe_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_pending_registrations_email ON public.pending_registrations(email);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_status ON public.pending_registrations(status);

-- Enable RLS
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Service role full access" ON public.pending_registrations;

-- Service role can do everything
CREATE POLICY "Service role full access" ON public.pending_registrations
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 2. PROFILES TABLE
-- User profile information
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    english_level TEXT,
    learning_goals TEXT[],
    goals_description TEXT,
    preferred_days TEXT[],
    preferred_times TEXT[],
    timezone TEXT,
    registration_source TEXT DEFAULT 'checkout_2025',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Service role can do everything
CREATE POLICY "Service role full access profiles" ON public.profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 3. SUBSCRIPTIONS TABLE
-- User subscription information
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL,
    price_usd DECIMAL(10, 2) NOT NULL,
    hours_per_month INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    stripe_session_id TEXT,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    paypal_subscription_id TEXT,
    auto_renew BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_session ON public.subscriptions(stripe_session_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role full access subscriptions" ON public.subscriptions;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access subscriptions" ON public.subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 4. PAYMENTS TABLE
-- Payment history
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id),
    amount_usd DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    paypal_transaction_id TEXT,
    paypal_order_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role full access payments" ON public.payments;

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access payments" ON public.payments
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 5. HOURS TRACKING TABLE
-- Monthly hours tracking
-- ============================================
CREATE TABLE IF NOT EXISTS public.hours_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format: "YYYY-MM"
    total_hours DECIMAL(5, 2) NOT NULL DEFAULT 0,
    used_hours DECIMAL(5, 2) NOT NULL DEFAULT 0,
    remaining_hours DECIMAL(5, 2) GENERATED ALWAYS AS (total_hours - used_hours) STORED,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_hours_tracking_user_id ON public.hours_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_hours_tracking_month_year ON public.hours_tracking(month_year);

-- Enable RLS
ALTER TABLE public.hours_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own hours" ON public.hours_tracking;
DROP POLICY IF EXISTS "Service role full access hours_tracking" ON public.hours_tracking;

-- Users can view their own hours
CREATE POLICY "Users can view own hours" ON public.hours_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access hours_tracking" ON public.hours_tracking
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 6. LESSON SESSIONS TABLE
-- Scheduled/completed lesson sessions
-- ============================================
CREATE TABLE IF NOT EXISTS public.lesson_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    duration_hours DECIMAL(3, 1) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    tutor_name TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_user_id ON public.lesson_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_scheduled_at ON public.lesson_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_status ON public.lesson_sessions(status);

-- Enable RLS
ALTER TABLE public.lesson_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own sessions" ON public.lesson_sessions;
DROP POLICY IF EXISTS "Service role full access lesson_sessions" ON public.lesson_sessions;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON public.lesson_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access lesson_sessions" ON public.lesson_sessions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 7. FUNCTION: Initialize hours tracking after subscription
-- ============================================
CREATE OR REPLACE FUNCTION initialize_hours_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Only for new active subscriptions
    IF NEW.status = 'active' THEN
        INSERT INTO public.hours_tracking (
            user_id,
            month_year,
            total_hours,
            used_hours,
            period_start,
            period_end
        )
        VALUES (
            NEW.user_id,
            TO_CHAR(NOW(), 'YYYY-MM'),
            NEW.hours_per_month,
            0,
            DATE_TRUNC('month', NOW())::DATE,
            (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
        )
        ON CONFLICT (user_id, month_year) DO UPDATE SET
            total_hours = hours_tracking.total_hours + EXCLUDED.total_hours,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for hours initialization
DROP TRIGGER IF EXISTS on_subscription_created ON public.subscriptions;
CREATE TRIGGER on_subscription_created
    AFTER INSERT ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION initialize_hours_tracking();

-- ============================================
-- 8. FUNCTION: Deduct hours after session completion
-- ============================================
CREATE OR REPLACE FUNCTION deduct_session_hours()
RETURNS TRIGGER AS $$
BEGIN
    -- Only when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.hours_tracking
        SET
            used_hours = used_hours + NEW.duration_hours,
            updated_at = NOW()
        WHERE
            user_id = NEW.user_id
            AND month_year = TO_CHAR(NOW(), 'YYYY-MM');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for hours deduction
DROP TRIGGER IF EXISTS on_session_completed ON public.lesson_sessions;
CREATE TRIGGER on_session_completed
    AFTER UPDATE ON public.lesson_sessions
    FOR EACH ROW
    EXECUTE FUNCTION deduct_session_hours();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.pending_registrations TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.hours_tracking TO service_role;
GRANT ALL ON public.lesson_sessions TO service_role;

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.hours_tracking TO authenticated;
GRANT SELECT ON public.lesson_sessions TO authenticated;
