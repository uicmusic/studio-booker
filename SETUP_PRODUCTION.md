# 🚀 Production Setup Guide - Studio Booker

This guide will help you set up Studio Booker for production with Supabase authentication and Vercel deployment.

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ GitHub account
- ✅ Supabase account (free tier)
- ✅ Vercel account (free tier)
- ✅ Node.js 20+ installed

---

## Step 1: Setup Supabase Project

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"New Project"**
3. Fill in:
   - **Name**: `studio-booker-uic`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you (e.g., Singapore for Indonesia)
4. Click **"Create new project"**
5. Wait 2-3 minutes for project setup

### 1.2 Get Supabase Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 1.3 Run Database Migration

1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New query"**
3. Copy entire content from `supabase/migrations/001_initial_schema.sql`
4. Paste into SQL Editor
5. Click **"Run"** or press `Ctrl+Enter`
6. You should see: "Success. No rows returned"

### 1.4 Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure:
   - ✅ Enable Email Signup: **ON**
   - ✅ Confirm Email: **ON** (recommended)
   - ✅ Secure Email Change: **ON**
4. For development, you can use Supabase's default email templates
5. Click **"Save"**

### 1.5 Setup Email Domain Restriction

To only allow `@uic.edu` emails:

1. Go to **Authentication** → **Policies**
2. Find your `users` table
3. Add new policy or update existing:

```sql
-- Only allow @uic.edu emails
CREATE POLICY "Only UIC emails allowed"
ON auth.users
FOR INSERT
WITH CHECK (email LIKE '%@uic.edu');
```

Or use Supabase UI:
1. Go to **Authentication** → **Email Templates**
2. Customize signup email if needed

---

## Step 2: Update Environment Variables

### 2.1 Local Development (.env.local)

```bash
# Copy this to .env.local
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc...your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc...your-service-role-key"

NEXTAUTH_SECRET="generate-random-secret"
NEXTAUTH_URL="http://localhost:3001"

DATABASE_URL="file:./prisma/dev.db"
```

### 2.2 Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy the output to `.env.local`

### 2.3 Production (Vercel Environment Variables)

You'll set these in Vercel dashboard during deployment.

---

## Step 3: Update Code for Supabase Auth

### Files to Update:

The following files have been prepared:
- ✅ `lib/supabase.ts` - Supabase client
- ✅ `lib/auth.ts` - Auth helpers (to be updated)
- ✅ `app/api/auth/[...nextauth]/route.ts` - Will migrate to Supabase Auth

### Migration Plan:

We'll migrate from NextAuth Credentials to Supabase Auth:

**Current (Development):**
```typescript
// NextAuth with credentials
signIn("credentials", { email, password })
```

**New (Production):**
```typescript
// Supabase Auth
supabase.auth.signInWithPassword({ email, password })
```

---

## Step 4: Setup GitHub Repository

### 4.1 Initialize Git

```bash
cd /Users/alexanderkosasih/UIC-Workplace/studio-booker
git init
git add .
git commit -m "Initial commit - Studio Booker"
```

### 4.2 Create GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `studio-booker-uic`
3. Visibility: **Private** (recommended for security)
4. Click **"Create repository"**

### 4.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/studio-booker-uic.git
git branch -M main
git push -u origin main
```

---

## Step 5: Deploy to Vercel

### 5.1 Connect to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `studio-booker-uic`
4. Click **"Import"**

### 5.2 Configure Build Settings

Vercel will auto-detect Next.js. Verify:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (default)

### 5.3 Add Environment Variables

In Vercel project settings → **Environment Variables**, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://studio-booker-uic.vercel.app
```

### 5.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your app is live! 🎉

---

## Step 6: Create Admin User

### 6.1 Manual User Creation (via Supabase)

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: `admin@uic.edu`
   - **Password**: Choose temporary password
   - **User Metadata**:
     ```json
     {
       "name": "Admin UIC",
       "role": "ADMIN"
     }
     ```
4. Click **"Create user"**

### 6.2 Or Use SQL

```sql
-- This will be handled by the auth trigger
-- Just create auth user, public.users will auto-create
```

---

## Step 7: User Management Flow

### Admin Creates Student Account:

**Option A: Via Supabase Dashboard**
1. Admin logs into Supabase
2. Authentication → Users → Add User
3. Fill student details
4. Give temporary password to student
5. Student changes password on first login

**Option B: Via Admin Panel (To Be Built)**
1. Admin logs into Studio Booker
2. Go to Admin Panel → Manage Users
3. Click "Add Student"
4. Enter email, name
5. System generates random password
6. Admin copies password and gives to student

---

## Step 8: Testing Production Auth

### Test Login Flow:

1. Go to your Vercel URL
2. Click "Login"
3. Enter credentials:
   - Email: `admin@uic.edu`
   - Password: (temporary password)
4. Should redirect to Dashboard

### Test Student Signup:

1. Try to signup with non-UIC email
2. Should be rejected
3. Try with `@uic.edu` email
4. Should receive confirmation email
5. Confirm email → Can login

---

## 🔧 Troubleshooting

### Issue: "Invalid API key"
**Solution**: Check Supabase keys in Vercel env vars

### Issue: "Email already exists"
**Solution**: User already registered, use password reset

### Issue: "Row level security policy violation"
**Solution**: Check RLS policies in Supabase

### Issue: Email not sending
**Solution**: Check Supabase Email settings, use custom SMTP if needed

---

## 📱 Next Steps

After deployment:

1. ✅ Test all features locally with Supabase
2. ✅ Deploy to Vercel
3. ✅ Create admin account
4. ✅ Add student accounts
5. ✅ Test booking flow
6. ✅ Share URL with students!

---

## 🎯 User Management Features (To Build)

We'll create an Admin Panel for user management:

- [ ] List all users (students/lecturers)
- [ ] Add new user (with auto-generated password)
- [ ] Edit user details
- [ ] Delete/deactivate user
- [ ] Reset user password
- [ ] Export user list (CSV)

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs (Dashboard → Logs)
2. Check Vercel logs (Dashboard → Deployments)
3. Check browser console for errors

---

**Ready to setup? Let me know when you have Supabase project created and I'll help with the next steps!** 🚀
