# Supabase Setup Guide for Enprico

Complete guide to set up and integrate Supabase with your Enprico platform.

---

## 📋 Prerequisites

- Node.js installed (v16 or higher)
- A Supabase account (free tier is fine)
- Your existing article markdown files

---

## Step 1: Create/Reset Supabase Project

### Option A: Reset Existing Database

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Tables**
3. Delete all existing tables you want to reset
4. Go to **SQL Editor** and proceed to Step 2

### Option B: Create New Project

1. Go to https://supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Name:** `enprico` (or your preferred name)
   - **Database Password:** Generate and **SAVE THIS**
   - **Region:** Choose closest to your users
4. Wait 2-3 minutes for project creation

---

## Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL Editor
5. Click **"Run"** or press `Ctrl + Enter`
6. ✅ You should see "Success. No rows returned"

This creates:
- Users/profiles table
- Articles table
- Courses and lessons tables
- Enrollments and progress tracking
- Contact form submissions
- Tutoring sessions table
- All security policies (RLS)

---

## Step 3: Get Your API Keys

1. Go to **Settings** → **API**
2. Copy these values (you'll need them):
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGc...` (long string)
   - **service_role key:** `eyJhbGc...` (keep this SECRET!)

---

## Step 4: Install Supabase Client

Open terminal in your project folder:

```bash
npm install @supabase/supabase-js
```

---

## Step 5: Create Environment File

Create a file called `.env` in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# For server-side operations only (keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ IMPORTANT:** Add `.env` to your `.gitignore` file to keep keys secret!

---

## Step 6: Create Supabase Client

Create `supabase-client.js` in your project root (already created for you).

---

## Step 7: Migrate Existing Articles

You have two options:

### Option A: Migrate via Script (Recommended)

1. Run the migration script provided:
```bash
node migrate-articles-to-supabase.js
```

This will read your markdown files and insert them into Supabase.

### Option B: Manual Migration

1. Go to **SQL Editor** in Supabase
2. Copy contents of `migrate-articles.sql`
3. Update the `content` fields with your markdown content
4. Run the query

---

## Step 8: Enable Authentication (Optional)

If you want user login/signup:

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates if desired
4. Optional: Enable social providers (Google, GitHub, etc.)

---

## Step 9: Storage Setup (for images)

1. Go to **Storage**
2. Click **"Create bucket"**
3. Name it `articles` (or `images`)
4. Set it to **Public** bucket
5. Go to **Policies** and add:
   - **SELECT:** Allow public reads
   - **INSERT:** Allow authenticated users

---

## Step 10: Update Frontend Code

Your article loading needs to be updated. Key changes:

### Before (current):
```javascript
// Loading from JSON file
const response = await fetch('content/articles/index.json');
const articles = await response.json();
```

### After (with Supabase):
```javascript
// Loading from Supabase
import { supabase } from './supabase-client.js';

const { data: articles, error } = await supabase
  .from('articles')
  .select('*')
  .eq('published', true)
  .order('published_at', { ascending: false });
```

---

## Step 11: Testing

1. **Test Database Connection:**
```javascript
// Add this to your browser console
import { supabase } from './supabase-client.js';
const { data, error } = await supabase.from('articles').select('*');
console.log(data, error);
```

2. **Test Authentication:**
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'testpassword123'
});
console.log(data, error);
```

---

## Common Issues & Solutions

### ❌ "relation does not exist"
- Make sure you ran the schema SQL completely
- Check the SQL Editor for errors

### ❌ "Row level security policy violation"
- Go to **Authentication** → **Policies**
- Make sure RLS policies are enabled
- Check that policies match your use case

### ❌ "Invalid API key"
- Double-check your `.env` file
- Make sure you're using the `anon` key for client-side
- Restart your dev server after changing `.env`

### ❌ CORS errors
- Supabase handles CORS automatically
- If issues persist, check your Supabase project URL is correct

---

## Database Schema Overview

```
┌─────────────┐
│  profiles   │  (extends auth.users)
└─────────────┘
       │
       ├─────────────────┐
       │                 │
┌─────────────┐   ┌─────────────┐
│ enrollments │   │   tutoring  │
│             │   │  _sessions  │
└─────────────┘   └─────────────┘
       │
       │
┌─────────────┐   ┌─────────────┐
│   courses   │───│   lessons   │
└─────────────┘   └─────────────┘
                         │
                         │
                  ┌─────────────┐
                  │   lesson    │
                  │  _progress  │
                  └─────────────┘

┌─────────────┐   ┌─────────────┐
│  articles   │   │   contact   │
│             │   │_submissions │
└─────────────┘   └─────────────┘
```

---

## Next Steps

After setup is complete, you should:

1. ✅ Update `index.html` to load articles from Supabase
2. ✅ Update `article.html` to load individual articles from Supabase
3. ✅ Implement user authentication
4. ✅ Connect contact form to Supabase
5. ✅ Build course enrollment system
6. ✅ Add admin panel for managing content

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)

---

## Support

If you run into issues:
1. Check Supabase logs: **Logs** → **Postgres Logs**
2. Check browser console for errors
3. Verify API keys are correct
4. Make sure tables were created successfully

Good luck! 🚀
