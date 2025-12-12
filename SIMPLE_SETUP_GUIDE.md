# 🚀 Simple Supabase Setup Guide

Quick setup for authentication, PayPal payments, and student dashboard.

---

## ✅ Quick Checklist (10 minutes)

### 1. Create Supabase Project
- [ ] Go to https://supabase.com
- [ ] Create new project: `enprico`
- [ ] **Save your database password!**
- [ ] Wait for project creation (~2 min)

### 2. Run Database Schema
- [ ] Go to **SQL Editor** in Supabase
- [ ] Copy all contents from `supabase-schema-simple.sql`
- [ ] Paste and click **Run** (Ctrl+Enter)
- [ ] Verify: "Success. No rows returned"

### 3. Get API Keys
- [ ] Settings → API
- [ ] Copy **Project URL**
- [ ] Copy **anon public** key
- [ ] Keep dashboard open

### 4. Update Your Code
- [ ] Open `auth-client.js`
- [ ] Replace line 8: `const SUPABASE_URL = 'YOUR_URL_HERE';`
- [ ] Replace line 9: `const SUPABASE_ANON_KEY = 'YOUR_KEY_HERE';`
- [ ] Save the file

### 5. Test It Out
```bash
# Start dev server
npm run dev
```
- [ ] Go to http://localhost:8000
- [ ] Click **Sign Up** → Create account
- [ ] Log in with your credentials
- [ ] See your dashboard!

---

## 📁 What You Have Now

### Pages Created:
- ✅ **signup.html** - User registration
- ✅ **login.html** - User authentication
- ✅ **dashboard.html** - Student dashboard showing remaining hours

### Database Tables:
1. **profiles** - User information
2. **subscriptions** - Active plans (Starter/Professional/Enterprise)
3. **payments** - PayPal transaction history
4. **hours_tracking** - Monthly hours allocation
5. **lesson_sessions** - Scheduled/completed lessons

---

## 🎯 How It Works

### 1. User Signs Up
- Creates account via `signup.html`
- Email confirmation (configure in Supabase)
- Automatic profile created

### 2. User Subscribes (Next Step - PayPal Integration)
- Choose plan (Starter/Professional/Enterprise)
- PayPal payment
- Subscription record created
- Hours automatically allocated

### 3. User Views Dashboard
- See remaining hours this month
- Track subscription status
- View upcoming sessions
- See payment history

---

## 💡 Next Steps

### Immediate:
1. ✅ Test signup/login flow
2. ✅ View dashboard (will show 0 hours until subscription)

### PayPal Integration (Coming Next):
1. Add PayPal buttons to pricing section
2. Process payments
3. Create subscriptions automatically
4. Allocate hours

### Features to Add:
- [ ] Book lesson sessions
- [ ] View session history
- [ ] Update profile
- [ ] Cancel subscription
- [ ] Add/remove payment methods

---

## 🔧 Important Files

```
auth-client.js          ← All authentication & data functions
supabase-schema-simple.sql ← Database structure
dashboard.html          ← Student dashboard UI
login.html             ← Login page
signup.html            ← Signup page
```

---

## 📊 Database Structure

```
profiles
├─ id (user ID)
├─ email
├─ full_name
└─ created_at

subscriptions
├─ user_id
├─ plan_type (starter/professional/enterprise)
├─ price_usd
├─ hours_per_month
├─ status (active/cancelled)
├─ paypal_subscription_id
└─ start_date / end_date

hours_tracking
├─ user_id
├─ total_hours (e.g. 8 for Starter)
├─ used_hours
├─ remaining_hours
└─ month_year ("2025-01")

payments
├─ user_id
├─ amount_usd
├─ paypal_transaction_id
├─ status (completed/pending/failed)
└─ paid_at

lesson_sessions
├─ user_id
├─ duration_hours
├─ scheduled_at
├─ status (scheduled/completed/cancelled)
└─ tutor_name
```

---

## 🎨 Pricing Plans

From your current pricing section:

| Plan | Price | Hours/Month | $/Hour |
|------|-------|-------------|--------|
| **Starter** | $160/mo | 8 hours | $20 |
| **Professional** | $288/mo | 16 hours | $18 |
| **Enterprise** | Custom | Custom | Custom |

---

## 🔐 Security Features

✅ **Row Level Security (RLS)** - Users can only see their own data
✅ **Automatic Profile Creation** - On signup
✅ **Automatic Hours Allocation** - When subscription created
✅ **Password Requirements** - Minimum 6 characters
✅ **Email Verification** - (configure in Supabase Auth)

---

## 🐛 Troubleshooting

### Can't log in?
- Check email is confirmed (Supabase Auth → Users)
- Verify you ran the schema SQL
- Check browser console for errors

### Dashboard shows 0 hours?
- This is normal without a subscription
- You'll need to add PayPal integration next
- Or manually insert a test subscription in Supabase

### "Failed to load dashboard"?
- Open browser console (F12)
- Check for API key errors
- Verify `auth-client.js` has correct credentials

---

## 📞 Test Account (For Development)

Create a test subscription in Supabase:

```sql
-- After signing up, get your user ID from profiles table
-- Then run this in SQL Editor:

INSERT INTO subscriptions (user_id, plan_type, price_usd, hours_per_month, status, start_date, end_date)
VALUES (
    'YOUR_USER_ID_HERE',
    'starter',
    160.00,
    8,
    'active',
    NOW(),
    NOW() + INTERVAL '1 month'
);
```

This will:
- Create an active subscription
- Automatically create hours_tracking record
- Allow you to test the dashboard

---

## ✨ What's Different from Full Schema?

**Removed** (to keep it simple):
- ❌ Articles system (keeping markdown files)
- ❌ Courses & lessons database
- ❌ Enrollments system
- ❌ Contact form submissions

**Kept** (essentials):
- ✅ User authentication
- ✅ Subscriptions
- ✅ Payment tracking
- ✅ Hours tracking
- ✅ Lesson sessions

---

## 🚀 You're All Set!

Your simple authentication and hours tracking system is ready.

**Next:** Add PayPal payment integration to complete the flow!

Need help? Check Supabase docs: https://supabase.com/docs
