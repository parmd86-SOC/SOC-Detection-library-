# Quick Start Guide - 5 Minutes to Running App

This guide gets you running in ~5 minutes. For detailed setup, see SETUP_GUIDE.md.

## Prerequisites

✅ Node.js 18+ installed
✅ A Supabase account (free tier is fine)

## Steps

### 1. Install Dependencies (1 min)

```bash
cd soc-detection-library
npm install
```

### 2. Setup Supabase (2 min)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your database password
3. Once ready, go to Settings → API:
   - Copy Project URL
   - Copy `anon` public key  
   - Copy `service_role` secret key
4. Go to Settings → Database:
   - Copy Connection String (URI format)
   - Replace `[YOUR-PASSWORD]` with your password

### 3. Configure Environment (30 sec)

```bash
cp .env.example .env
nano .env  # or use your editor
```

Paste your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

### 4. Initialize Database (1 min)

```bash
# Generate Prisma client
npm run db:generate

# Create tables
npm run db:push

# Add sample data
npm run seed

# Load MITRE ATT&CK data (optional, takes ~1 min)
npm run mitre:sync
```

### 5. Create Your User (30 sec)

In Supabase Dashboard:
1. Authentication → Users → Add User
2. Email: `admin@test.com`, Password: `your-password`
3. Check "Auto Confirm User"
4. Create user

### 6. Run! (5 sec)

```bash
npm run dev
```

Open http://localhost:3000 and login with your credentials!

## What You'll See

✅ 3 sample use cases pre-loaded
✅ 5 log sources ready to use
✅ ~600 MITRE techniques cached (if you ran mitre:sync)

## Next Steps

- **Create a use case**: Click "New Use Case"
- **Import Excel**: Run `npm run import:template` to create a template
- **Read docs**: Check README.md for full documentation

## Troubleshooting

**"Cannot connect to database"**
→ Check DATABASE_URL has correct password

**"Prisma client not found"**
→ Run `npm run db:generate`

**Can't login**
→ Make sure you created a user in Supabase dashboard

**Need help?**
→ Check SETUP_GUIDE.md for detailed instructions

---

**Total time**: ~5 minutes ⚡

Ready to replace that Excel spreadsheet! 🎉
