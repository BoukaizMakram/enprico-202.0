# 🚀 Quick Start Guide - Enprico Supabase Setup

Follow this checklist to get your Supabase database up and running in under 15 minutes.

---

## ✅ Checklist

### 1. Create Supabase Project
- [ ] Go to https://supabase.com and sign up/log in
- [ ] Click "New Project"
- [ ] Set project name: `enprico`
- [ ] Generate and **SAVE** database password
- [ ] Choose your region
- [ ] Wait 2-3 minutes for project creation

### 2. Run Database Schema
- [ ] Go to **SQL Editor** in Supabase dashboard
- [ ] Open the file `supabase-schema.sql`
- [ ] Copy entire contents
- [ ] Paste into SQL Editor
- [ ] Click **Run** (Ctrl + Enter)
- [ ] Verify: "Success. No rows returned"

### 3. Get API Keys
- [ ] Go to **Settings** → **API**
- [ ] Copy **Project URL**
- [ ] Copy **anon public** key
- [ ] Copy **service_role** key (keep secret!)

### 4. Setup Environment
- [ ] Copy `.env.example` to `.env`
- [ ] Paste your Project URL into `VITE_SUPABASE_URL`
- [ ] Paste your anon key into `VITE_SUPABASE_ANON_KEY`
- [ ] Paste your service_role key into `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Save the file

### 5. Install Dependencies
```bash
npm run setup
```
- [ ] Run the command above
- [ ] Verify: no errors

### 6. Migrate Articles
```bash
npm run migrate
```
- [ ] Run the command above
- [ ] Verify: Articles successfully migrated

### 7. Verify in Supabase
- [ ] Go to **Table Editor** in Supabase
- [ ] Open **articles** table
- [ ] Verify: You see your 3 articles

### 8. Test Connection (Optional)
- [ ] Start your dev server: `npm run dev`
- [ ] Open browser console (F12)
- [ ] Run this test:
```javascript
import { supabase } from './supabase-client.js';
const { data } = await supabase.from('articles').select('*');
console.log('Articles:', data);
```
- [ ] Verify: Articles appear in console

---

## 🎉 You're Done!

Your database is now set up. Next steps:

1. **Update Frontend** - Replace JSON fetching with Supabase queries
2. **Add Authentication** - Enable user login/signup
3. **Storage Setup** - For uploading images
4. **Build Features** - Courses, enrollments, progress tracking

---

## 📚 Need More Help?

- Full guide: `SUPABASE_SETUP.md`
- Supabase docs: https://supabase.com/docs
- Issues? Check the "Common Issues" section in `SUPABASE_SETUP.md`

---

## ⚡ Quick Commands

```bash
# Install dependencies
npm run setup

# Start dev server
npm run dev

# Migrate articles to Supabase
npm run migrate
```

---

## 🔑 Important Files

- `supabase-schema.sql` - Database schema (tables, policies, indexes)
- `supabase-client.js` - Frontend client with helper functions
- `migrate-articles-to-supabase.js` - Migration script
- `.env` - Your secret configuration (never commit!)
- `SUPABASE_SETUP.md` - Detailed documentation

---

**Happy coding! 🚀**
