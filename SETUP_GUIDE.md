# SOC Detection Library - Setup Guide

This guide walks you through setting up the SOC Detection Library from scratch, including both Supabase-hosted and local development options.

## Option 1: Supabase Hosted (Recommended)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Enter project details:
   - Name: `soc-detection-library`
   - Database Password: (generate a strong password and save it)
   - Region: Choose closest to you
4. Click "Create new project" (this takes ~2 minutes)

### Step 2: Get Supabase Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

3. Go to **Project Settings** → **Database** → **Connection string** → **URI**
4. Copy the connection string → `DATABASE_URL`
   - Replace `[YOUR-PASSWORD]` with your database password from Step 1

### Step 3: Configure Your Application

```bash
# Clone the repository
git clone <your-repo>
cd soc-detection-library

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your Supabase credentials
nano .env  # or use your preferred editor
```

Your `.env` should look like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase database
npm run db:push

# Seed initial data (log sources and sample use cases)
npm run seed

# Sync MITRE ATT&CK data (~600 techniques)
npm run mitre:sync
```

This will take 1-2 minutes to complete.

### Step 5: Create Your First User

**In Supabase Dashboard:**

1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter:
   - Email: `admin@yourdomain.com`
   - Password: (create a strong password)
   - Auto Confirm User: ✓ (check this)
4. Click **Create user**

### Step 6: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and login with the credentials you just created.

---

## Option 2: Local Development with Docker

If you prefer to run everything locally (without Supabase for the database):

### Step 1: Install Prerequisites

- Docker Desktop (for local Postgres)
- Node.js 18+
- You still need a Supabase project for authentication

### Step 2: Setup Local Database

```bash
# Start local Postgres
docker-compose up -d

# Wait for database to be ready
sleep 5
```

### Step 3: Configure Environment

```bash
# Create .env.local
cp .env.local.example .env.local

# Edit .env.local - you still need Supabase auth keys, but use local DB:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/soc_detection_library
```

### Step 4: Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed data
npm run seed

# Sync MITRE
npm run mitre:sync
```

### Step 5: Create user in Supabase and run

Follow Step 5 from Option 1, then:

```bash
npm run dev
```

---

## Verifying Your Setup

After completing either option, verify everything works:

1. **Login**: Visit http://localhost:3000 and login
2. **View Use Cases**: You should see 3 sample use cases
3. **View MITRE**: Go to Admin → MITRE and verify ~600 techniques are cached
4. **Create Use Case**: Click "New Use Case" and create a test detection

## Common Issues

### Issue: Cannot connect to database

**Solution:**
- Check `DATABASE_URL` is correct
- For Supabase: Verify password is correct (no special URL encoding needed)
- For Docker: Ensure `docker-compose up -d` succeeded

### Issue: Prisma Client not generated

**Solution:**
```bash
npm run db:generate
```

### Issue: Authentication redirects not working

**Solution:**
- Clear browser cookies for localhost
- Check Supabase URL and keys are correct
- Verify middleware.ts exists

### Issue: MITRE sync fails

**Solution:**
- Check internet connection
- Try force sync: `npm run mitre:sync -- --force`
- Check GitHub is not blocked by firewall

## Next Steps

1. **Import existing detections**: Create Excel file and run `npm run import:excel`
2. **Customize**: Add your log sources, create use cases
3. **Deploy**: See README.md for Vercel deployment instructions

## Production Deployment

For production setup:

1. Use Supabase hosted database (not Docker)
2. Enable Row Level Security (RLS) in Supabase
3. Set proper CORS and security headers
4. Use environment variables in your hosting platform
5. Run migrations: `npx prisma migrate deploy`

## Need Help?

- Check the main README.md for detailed documentation
- Review Supabase documentation: https://supabase.com/docs
- Open an issue on GitHub
