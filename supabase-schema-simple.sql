-- Simplified Enprico Database Schema for Supabase
-- Focus: Authentication, PayPal Payments, Hours Tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES
-- ============================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- SUBSCRIPTIONS (Payment Plans)
-- ============================================
CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'professional', 'enterprise')),

    -- Pricing details
    price_usd DECIMAL(10, 2) NOT NULL,
    hours_per_month INTEGER NOT NULL,

    -- Payment status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),

    -- PayPal details
    paypal_subscription_id TEXT,
    paypal_order_id TEXT,
    paypal_payer_id TEXT,

    -- Subscription period
    start_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- PAYMENT HISTORY
-- ============================================
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions ON DELETE SET NULL,

    -- Payment details
    amount_usd DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

    -- PayPal details
    paypal_transaction_id TEXT UNIQUE,
    paypal_order_id TEXT,
    paypal_payer_email TEXT,

    -- Additional info
    payment_method TEXT DEFAULT 'paypal',
    description TEXT,

    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- HOURS TRACKING
-- ============================================
CREATE TABLE public.hours_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions ON DELETE CASCADE NOT NULL,

    -- Hours allocation
    total_hours INTEGER NOT NULL,
    used_hours DECIMAL(5, 2) DEFAULT 0,
    remaining_hours DECIMAL(5, 2) NOT NULL,

    -- Period tracking
    month_year TEXT NOT NULL, -- Format: "2025-01"
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    -- Ensure one record per user per month
    UNIQUE(user_id, month_year)
);

-- ============================================
-- LESSON SESSIONS (When hours are used)
-- ============================================
CREATE TABLE public.lesson_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,

    -- Session details
    duration_hours DECIMAL(5, 2) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),

    -- Notes
    tutor_name TEXT,
    session_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hours_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Subscriptions: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payments: Users can view their own payment history
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

-- Hours Tracking: Users can view their own hours
CREATE POLICY "Users can view own hours" ON public.hours_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- Lesson Sessions: Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON public.lesson_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.lesson_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hours_tracking_updated_at BEFORE UPDATE ON public.hours_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_sessions_updated_at BEFORE UPDATE ON public.lesson_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to initialize hours tracking when subscription is created
CREATE OR REPLACE FUNCTION initialize_hours_tracking()
RETURNS TRIGGER AS $$
DECLARE
    month_str TEXT;
    period_start_date TIMESTAMP WITH TIME ZONE;
    period_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Only run for active subscriptions
    IF NEW.status = 'active' THEN
        -- Calculate current month period
        month_str := TO_CHAR(NEW.start_date, 'YYYY-MM');
        period_start_date := NEW.start_date;
        period_end_date := (DATE_TRUNC('month', NEW.start_date) + INTERVAL '1 month' - INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;

        -- Insert hours tracking record
        INSERT INTO public.hours_tracking (
            user_id,
            subscription_id,
            total_hours,
            remaining_hours,
            month_year,
            period_start,
            period_end
        ) VALUES (
            NEW.user_id,
            NEW.id,
            NEW.hours_per_month,
            NEW.hours_per_month,
            month_str,
            period_start_date,
            period_end_date
        )
        ON CONFLICT (user_id, month_year)
        DO UPDATE SET
            total_hours = NEW.hours_per_month,
            remaining_hours = NEW.hours_per_month,
            subscription_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_subscription_created
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION initialize_hours_tracking();

-- Function to deduct hours when a session is completed
CREATE OR REPLACE FUNCTION deduct_session_hours()
RETURNS TRIGGER AS $$
DECLARE
    month_str TEXT;
BEGIN
    -- Only deduct hours when session is marked as completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        month_str := TO_CHAR(NEW.scheduled_at, 'YYYY-MM');

        -- Deduct hours from tracking
        UPDATE public.hours_tracking
        SET
            used_hours = used_hours + NEW.duration_hours,
            remaining_hours = remaining_hours - NEW.duration_hours
        WHERE
            user_id = NEW.user_id
            AND month_year = month_str;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_session_completed
    AFTER INSERT OR UPDATE ON public.lesson_sessions
    FOR EACH ROW EXECUTE FUNCTION deduct_session_hours();

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_hours_tracking_user_month ON public.hours_tracking(user_id, month_year);
CREATE INDEX idx_lesson_sessions_user_id ON public.lesson_sessions(user_id);
CREATE INDEX idx_lesson_sessions_scheduled ON public.lesson_sessions(scheduled_at);

-- ============================================
-- SAMPLE PRICING PLANS (Reference Data)
-- ============================================
-- These are the plans from your pricing section
-- Starter: $160/month, 2 hours/week = 8 hours/month (at $20/hour)
-- Professional: $288/month, 4 hours/week = 16 hours/month (at $18/hour)
-- Enterprise: Custom pricing
