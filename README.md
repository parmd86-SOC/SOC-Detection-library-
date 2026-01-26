# SOC Detection Library

A production-grade web application for managing security detections, use cases, and MITRE ATT&CK mappings. Built for Security Operations Centers (SOCs) to replace Excel-based detection libraries with a robust database-backed solution.

## Features

- ✅ **Use Case Management**: CRUD operations for security detections
- ✅ **MITRE ATT&CK Integration**: Automatic sync and mapping to MITRE techniques
- ✅ **Multi-SIEM Support**: Store queries for Sentinel (KQL), Chronicle (YARA-L), and other SIEMs
- ✅ **Log Source Tracking**: Link detections to data sources
- ✅ **Investigation Guides**: Document response procedures for analysts
- ✅ **Priority Levels**: Categorize detections by severity
- ✅ **Excel Import**: Bulk import from existing spreadsheets
- ✅ **Multi-Tenant Ready**: Schema supports multiple organizations

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: Supabase Postgres
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **UI**: TailwindCSS + shadcn/ui
- **Validation**: Zod

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (Supabase recommended)
- Supabase project for authentication

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd soc-detection-library
npm install
```

### 2. Environment Setup

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Getting Supabase Credentials:**
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy the Project URL and `anon` public key
4. Copy the `service_role` secret key (keep this secure!)
5. Get the database connection string from Settings → Database

### 3. Database Setup

Generate Prisma client and push the schema:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or use migrations (recommended for production)
npm run db:migrate
```

### 4. Seed Initial Data

```bash
npm run seed
```

This creates:
- Default tenant
- 5 sample log sources
- 3 example use cases with queries

### 5. Sync MITRE ATT&CK Data

```bash
npm run mitre:sync
```

This fetches the latest MITRE ATT&CK framework data (~600+ techniques) and caches it locally. The sync can also be triggered from the admin UI.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Create First User

Since this is a fresh Supabase project, you'll need to create your first user:

**Option A: Via Supabase Dashboard**
1. Go to Authentication → Users in Supabase dashboard
2. Click "Add User"
3. Enter email and password
4. Use these credentials to login

**Option B: Via Sign Up (if enabled)**
- Modify the login page to include sign-up functionality
- Or use Supabase Auth API directly

## Project Structure

```
soc-detection-library/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── use-cases/           # Use case CRUD
│   │   ├── log-sources/         # Log source management
│   │   ├── mitre/               # MITRE technique search
│   │   └── admin/               # Admin endpoints
│   ├── use-cases/               # Use case pages
│   │   ├── page.tsx            # List view
│   │   ├── new/                # Create form
│   │   └── [id]/               # Detail/edit view
│   ├── admin/                   # Admin pages
│   │   └── mitre/              # MITRE sync UI
│   ├── login/                   # Auth page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── prisma.ts               # Prisma client
│   ├── supabase/               # Supabase clients
│   ├── validations.ts          # Zod schemas
│   ├── mitre-sync.ts          # MITRE sync logic
│   └── utils.ts                # Helper functions
├── prisma/
│   └── schema.prisma           # Database schema
├── scripts/
│   ├── seed.ts                 # Seed data
│   ├── sync-mitre.ts          # MITRE sync CLI
│   └── import-excel.ts        # Excel import
└── public/                      # Static assets
```

## API Routes

All routes require authentication (except where noted).

### Use Cases

- `GET /api/use-cases` - List use cases (supports search/filters)
- `POST /api/use-cases/create` - Create use case
- `GET /api/use-cases/[id]` - Get use case details
- `PATCH /api/use-cases/[id]` - Update use case
- `DELETE /api/use-cases/[id]` - Delete use case
- `PUT /api/use-cases/[id]/log-sources` - Update log source associations
- `PUT /api/use-cases/[id]/mitre` - Update MITRE technique mappings
- `PUT /api/use-cases/[id]/queries` - Bulk upsert queries

### Log Sources

- `GET /api/log-sources` - List all log sources
- `POST /api/log-sources` - Create log source

### MITRE

- `GET /api/mitre/techniques?search=` - Search cached techniques
- `GET /api/admin/mitre/sync` - Get sync status
- `POST /api/admin/mitre/sync` - Run MITRE sync

## Data Model

### Core Tables

**tenants**: Multi-tenant support (default tenant used in MVP)

**use_cases**: Security detections/use cases
- `use_case_code`: Unique identifier (e.g., UC-001)
- `title`: Detection name
- `description`: What it detects
- `investigation_guide`: Response procedures
- `priority`: LOW | MEDIUM | HIGH | CRITICAL

**log_sources**: Data sources (e.g., "Windows Security Events")

**use_case_log_sources**: Many-to-many relationship

**use_case_queries**: SIEM queries
- Unique per use_case + siem_type
- Supports: SENTINEL, CHRONICLE, OTHER

**mitre_techniques_cache**: Local MITRE ATT&CK cache
- `technique_id`: T#### or T####.### (primary key)
- Full STIX data stored in `raw_stix` JSON field
- Auto-synced from official MITRE repository

**use_case_mitre**: Many-to-many mapping

## Importing from Excel

### Excel/CSV Format

Create a spreadsheet with these columns:

| Column | Required | Description |
|--------|----------|-------------|
| use_case_code | Yes | Unique code (e.g., UC-001) |
| use_case_title | Yes | Detection name |
| description | No | What it detects |
| investigation_guide | No | Response steps |
| priority | No | LOW/MEDIUM/HIGH/CRITICAL |
| log_sources | No | Semicolon-separated (e.g., "Windows Security;Firewall") |
| mitre_techniques | No | Semicolon-separated IDs (e.g., "T1059;T1059.003") |
| sentinel_query | No | KQL query text |
| chronicle_query | No | YARA-L query text |
| other_siem_query | No | Other SIEM query |

### Import Command

```bash
npm run import:excel path/to/your-data.xlsx
```

**Notes:**
- MITRE techniques must exist in cache (run `mitre:sync` first)
- Log sources are auto-created if they don't exist
- Existing use cases are updated (based on use_case_code)

## MITRE ATT&CK Sync

The app automatically syncs MITRE ATT&CK techniques from the official STIX repository.

### How It Works

1. Fetches `enterprise-attack.json` from [mitre-attack/attack-stix-data](https://github.com/mitre-attack/attack-stix-data)
2. Parses STIX objects for attack-pattern types
3. Extracts technique IDs, names, descriptions, tactics, and platforms
4. Stores in `mitre_techniques_cache` table
5. Caches full STIX object as JSON for advanced use

### Sync Frequency

- **Automatic**: Runs if data is >30 days old
- **Manual**: Via admin UI or CLI with `--force` flag
- **Smart Sync**: Skips if recent (override with force)

### CLI Sync

```bash
# Smart sync (skips if < 30 days old)
npm run mitre:sync

# Force sync (always runs)
npm run mitre:sync -- --force
```

## Database Migrations

For production environments, use Prisma migrations instead of `db:push`:

```bash
# Create a migration
npx prisma migrate dev --name init

# Apply migrations in production
npx prisma migrate deploy
```

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Post-Deployment Setup

```bash
# Run migrations
npx prisma migrate deploy

# Seed data
npm run seed

# Sync MITRE data
npm run mitre:sync
```

## Development

### Database Management

```bash
# Open Prisma Studio (visual DB editor)
npm run db:studio

# Reset database (WARNING: destroys all data)
npx prisma migrate reset

# Format Prisma schema
npx prisma format
```

### Adding New Fields

1. Update `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name add_field_name`
3. Update TypeScript types and validation schemas
4. Update API routes and UI components

## Common Tasks

### Add a New Log Source

Via UI: Navigate to a use case → Log Sources tab → Select from list

Via API:
```bash
curl -X POST http://localhost:3000/api/log-sources \
  -H "Content-Type: application/json" \
  -d '{"name": "Proxy Logs"}'
```

### Search MITRE Techniques

Via UI: Use case detail → MITRE Mapping tab → Search

Via API:
```bash
curl http://localhost:3000/api/mitre/techniques?search=powershell
```

### Export Use Cases

Currently not implemented. Future enhancement: Export to Excel/JSON via API.

## Troubleshooting

**Prisma Client Errors**
```bash
npm run db:generate
```

**Database Connection Issues**
- Verify DATABASE_URL in `.env`
- Check Supabase project is active
- Ensure IP is whitelisted in Supabase (or disable IP restrictions)

**Authentication Not Working**
- Verify Supabase URL and keys
- Check Supabase project auth settings
- Ensure cookies are enabled

**MITRE Sync Fails**
- Check internet connection
- Verify GitHub is accessible
- Try with `--force` flag

## Security Considerations

- **Service Role Key**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code
- **Row Level Security**: Enable RLS in Supabase for production
- **Authentication**: All API routes should verify auth (currently basic implementation)
- **Input Validation**: All inputs validated with Zod schemas
- **SQL Injection**: Protected by Prisma's parameterized queries

## Future Enhancements

- [ ] Role-based access control (Admin, Analyst, Viewer)
- [ ] Export to Excel/PDF
- [ ] Detection versioning and change tracking
- [ ] Bulk edit operations
- [ ] Advanced search and filters
- [ ] Detection testing/validation framework
- [ ] Integration with SIEM APIs for query deployment
- [ ] Metrics and analytics dashboard
- [ ] Email notifications for changes
- [ ] API key authentication for external integrations

## License

MIT

## Support

For issues and questions, please create a GitHub issue.

## Credits

- MITRE ATT&CK® data from [mitre-attack/attack-stix-data](https://github.com/mitre-attack/attack-stix-data)
- UI components from [shadcn/ui](https://ui.shadcn.com)
