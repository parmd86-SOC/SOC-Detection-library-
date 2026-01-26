# Architecture Documentation

## System Overview

The SOC Detection Library is a full-stack web application designed to replace Excel-based detection management with a robust, scalable database solution. It enables security teams to manage detections, map them to MITRE ATT&CK, and maintain SIEM queries across multiple platforms.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React hooks (useState, useEffect)
- **Routing**: Next.js file-based routing

### Backend
- **API Layer**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **Validation**: Zod

### External Integrations
- **MITRE ATT&CK**: GitHub STIX repository
- **Data Import**: Excel/CSV via XLSX library

## Architecture Patterns

### 1. Server-Side Rendering (SSR) & Client Components

```
┌─────────────────────────────────────────┐
│          Browser (Client)               │
│  ┌─────────────────────────────────┐   │
│  │   Client Components             │   │
│  │   - Form interactions           │   │
│  │   - Real-time UI updates        │   │
│  │   - Client-side routing         │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                   ↕ HTTP
┌─────────────────────────────────────────┐
│       Next.js Server (Edge/Node)        │
│  ┌─────────────────────────────────┐   │
│  │   Server Components             │   │
│  │   - Initial page render         │   │
│  │   - SEO optimization            │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   API Routes                    │   │
│  │   - Business logic              │   │
│  │   - Database operations         │   │
│  │   - Authentication checks       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                   ↕ SQL
┌─────────────────────────────────────────┐
│      Supabase (PostgreSQL)              │
│  - User authentication                  │
│  - Database storage                     │
│  - Real-time subscriptions (future)     │
└─────────────────────────────────────────┘
```

### 2. Data Flow Architecture

**Read Operations:**
```
User Request → Middleware (Auth) → Page Component → API Route → 
Prisma → PostgreSQL → Response → Render → User
```

**Write Operations:**
```
User Form Submit → Client Validation → API Route → 
Zod Validation → Prisma → PostgreSQL → Success Response → 
UI Update (Optimistic/Refresh)
```

### 3. Authentication Flow

```
┌─────────────┐
│   Browser   │
│             │
│  1. /login  │──────┐
└─────────────┘      │
                     ↓
              ┌──────────────┐
              │  middleware  │
              │  Check auth  │
              └──────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    Authenticated           Not Authenticated
         │                       │
         ↓                       ↓
    /use-cases              Redirect to /login
         │                       
         ↓                       
  ┌──────────────┐              
  │ Supabase     │              
  │ Auth Cookie  │              
  └──────────────┘              
```

### 4. Database Schema Design

**Multi-Tenant Architecture:**
```
tenants (1) ──────────────────┐
                              │
                              ↓
use_cases (N) ────┬───── use_case_log_sources (N:M) ───→ log_sources (N)
                  │
                  ├───── use_case_mitre (N:M) ──────────→ mitre_techniques_cache (N)
                  │
                  └───── use_case_queries (N) ─────────→ (SENTINEL/CHRONICLE/OTHER)
```

**Key Design Decisions:**

1. **Normalized Schema**: Separate tables for entities with proper relationships
2. **JSON Fields**: Used for tactics/platforms in MITRE cache (read-heavy, rarely queried individually)
3. **Composite Unique Constraints**: `(use_case_id, siem_type)` ensures one query per SIEM type
4. **Cascading Deletes**: Deleting a use case removes all associations
5. **Indexes**: Strategic indexes on search fields and foreign keys

### 5. API Design

**RESTful Conventions:**

```
Resource: Use Cases
├── GET    /api/use-cases              List (with pagination & filters)
├── POST   /api/use-cases/create       Create new
├── GET    /api/use-cases/:id          Get single
├── PATCH  /api/use-cases/:id          Update
├── DELETE /api/use-cases/:id          Delete
├── PUT    /api/use-cases/:id/log-sources    Replace associations
├── PUT    /api/use-cases/:id/mitre          Replace associations
└── PUT    /api/use-cases/:id/queries        Bulk upsert
```

**Response Format:**
```typescript
// Success
{
  data: T | T[],
  pagination?: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

// Error
{
  error: string,
  details?: any
}
```

### 6. MITRE ATT&CK Integration

**Sync Process:**

```
1. Fetch STIX Bundle
   ↓
   https://raw.githubusercontent.com/mitre-attack/
   attack-stix-data/master/enterprise-attack/enterprise-attack.json
   
2. Parse STIX Objects
   ↓
   Filter: type === 'attack-pattern'
   Filter: !deprecated && !revoked
   
3. Extract Data
   ↓
   - Technique ID (from external_references)
   - Name, Description
   - Tactics (from kill_chain_phases)
   - Platforms (from x_mitre_platforms)
   - Full STIX object (raw JSON storage)
   
4. Upsert to Database
   ↓
   UPDATE if exists, INSERT if new
   
5. Cache Management
   ↓
   Check last_synced_at < 30 days
   Skip if recent (unless --force)
```

**Why Local Cache:**
- Fast typeahead search (no API rate limits)
- Offline capability
- Reduced latency
- Full STIX data for future features

## Security Architecture

### 1. Authentication & Authorization

```
┌────────────────────────────────────────┐
│  Client (Browser)                      │
│  - Stores: Supabase auth cookie        │
│  - Never has: Service role key         │
└────────────────────────────────────────┘
                 ↕ HTTPS
┌────────────────────────────────────────┐
│  Middleware                            │
│  - Validates: Supabase JWT token       │
│  - Redirects: Unauthorized → /login    │
└────────────────────────────────────────┘
                 ↕
┌────────────────────────────────────────┐
│  API Routes (Server-Side)              │
│  - Uses: Service role key              │
│  - Performs: Database operations       │
│  - Validates: All inputs with Zod      │
└────────────────────────────────────────┘
                 ↕
┌────────────────────────────────────────┐
│  Database                              │
│  - Future: Row Level Security (RLS)    │
│  - Current: All access via service key │
└────────────────────────────────────────┘
```

### 2. Input Validation

**Two-Layer Validation:**

1. **Client-Side** (UX):
   - HTML5 form validation
   - React controlled components
   - Immediate feedback

2. **Server-Side** (Security):
   - Zod schema validation
   - Type-safe at runtime
   - All API routes protected

Example:
```typescript
// Schema definition
const createUseCaseSchema = z.object({
  use_case_code: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  // ... more fields
})

// Runtime validation
const validated = createUseCaseSchema.parse(body)
// Throws if invalid, returns typed data if valid
```

### 3. SQL Injection Protection

- **Prisma ORM**: All queries parameterized automatically
- **No raw SQL**: Except where explicitly needed (none currently)
- **Type-safe queries**: TypeScript ensures query correctness

### 4. XSS Protection

- **React**: Auto-escapes by default
- **No `dangerouslySetInnerHTML`**: Not used in codebase
- **Content Security Policy**: Can be added via Next.js headers

## Performance Considerations

### 1. Database Optimization

**Indexes:**
```sql
-- Search performance
CREATE INDEX idx_use_cases_code ON use_cases(use_case_code);
CREATE INDEX idx_use_cases_title ON use_cases(title);
CREATE INDEX idx_mitre_name ON mitre_techniques_cache(name);

-- Join performance
CREATE INDEX idx_log_source_id ON use_case_log_sources(log_source_id);
CREATE INDEX idx_technique_id ON use_case_mitre(technique_id);
```

**Query Optimization:**
- Pagination (limit/offset)
- Selective field loading (Prisma select/include)
- Eager loading for relations (include)

### 2. Caching Strategies

**MITRE Data:**
- Cached in database (not re-fetched per request)
- 30-day refresh cycle
- Full-text search on cached data

**Future Enhancements:**
- Redis for session cache
- Static page generation for public content
- CDN for static assets

### 3. Bundle Optimization

**Next.js Automatic:**
- Code splitting per route
- Tree shaking unused code
- Minification in production

**Manual Optimizations:**
- Dynamic imports for heavy components
- Image optimization via Next.js Image component

## Scalability Considerations

### Current Architecture (MVP)

- **Concurrent Users**: 10-100 (Supabase free tier)
- **Database Size**: Up to 500MB (free tier)
- **API Calls**: Serverless autoscaling

### Scaling Path

**Horizontal Scaling:**
```
┌────────────┐     ┌────────────┐     ┌────────────┐
│  Vercel    │     │  Vercel    │     │  Vercel    │
│  Instance  │     │  Instance  │     │  Instance  │
└────────────┘     └────────────┘     └────────────┘
      │                  │                  │
      └──────────────────┴──────────────────┘
                         │
                         ↓
                 ┌───────────────┐
                 │   Supabase    │
                 │   Postgres    │
                 │  (Connection  │
                 │    Pooling)   │
                 └───────────────┘
```

**Vertical Scaling:**
- Supabase Pro: More connections, larger DB
- Dedicated database instance
- Read replicas for reporting

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────┐
│            Vercel Edge Network          │
│  - Global CDN                           │
│  - SSL termination                      │
│  - DDoS protection                      │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│         Serverless Functions            │
│  - Auto-scaling                         │
│  - Regional execution                   │
│  - Cold start optimization              │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│          Supabase Platform              │
│  ┌──────────┐  ┌──────────┐            │
│  │   Auth   │  │    DB    │            │
│  │ Service  │  │ Postgres │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
```

### Environment Variables

**Client-Side (Public):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

**Server-Side (Secret):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## Monitoring & Observability

### Current Implementation

**Logging:**
- Console logs (development)
- Vercel logs (production)
- Database query logs (Prisma)

**Error Handling:**
- Try/catch in all API routes
- User-friendly error messages
- Stack traces in development

### Recommended Additions

**Application Monitoring:**
- Sentry for error tracking
- Vercel Analytics for performance
- Prisma Studio for database inspection

**Database Monitoring:**
- Supabase dashboard for query performance
- Connection pool metrics
- Slow query logs

## Future Architecture Enhancements

### 1. Advanced Authentication

```
Current: Email/Password
Future:
  ├── SSO (SAML/OAuth)
  ├── MFA (TOTP)
  ├── Role-Based Access Control
  └── API Keys for integrations
```

### 2. Real-Time Features

```
Supabase Realtime:
  ├── Live detection updates
  ├── Collaborative editing
  └── Activity feed
```

### 3. Background Jobs

```
Use Case:
  ├── Scheduled MITRE sync
  ├── Weekly detection reports
  └── Alert notifications

Implementation:
  └── Vercel Cron Jobs or
      dedicated worker service
```

### 4. Advanced Search

```
Current: SQL ILIKE
Future:
  ├── Full-text search (PostgreSQL)
  ├── Elasticsearch for complex queries
  └── Faceted search/filters
```

## Development Workflow

```
Local Development
  ├── npm run dev (Next.js dev server)
  ├── npm run db:studio (Prisma Studio)
  └── docker-compose up (Local DB - optional)
       ↓
Git Commit
       ↓
Push to GitHub
       ↓
Vercel Auto-Deploy
  ├── Preview deployment (feature branches)
  └── Production deployment (main branch)
       ↓
Post-Deploy
  ├── npx prisma migrate deploy
  └── npm run mitre:sync (if needed)
```

## Testing Strategy (Future)

**Unit Tests:**
- API route logic
- Validation schemas
- Utility functions

**Integration Tests:**
- Database operations
- MITRE sync process
- Excel import

**E2E Tests:**
- User authentication flow
- CRUD operations
- Search and filter

**Tools:**
- Jest for unit tests
- Playwright for E2E tests
- Prisma test database

## Disaster Recovery

**Backup Strategy:**
- Supabase automatic daily backups
- Point-in-time recovery (Pro plan)
- Export critical data periodically

**Recovery Procedures:**
1. Database restore from Supabase backup
2. Redeploy application via Vercel
3. Re-run MITRE sync if cache lost
4. Verify data integrity

## Compliance & Audit

**Data Privacy:**
- No PII in use case data (by design)
- User emails stored in Supabase Auth
- GDPR considerations for EU users

**Audit Trail:**
- Prisma tracks created_at/updated_at
- Future: Audit log table for all changes
- Future: User activity tracking

---

## Summary

This architecture provides:
✅ Scalability from 10 to 10,000+ users
✅ Security through defense-in-depth
✅ Maintainability via TypeScript and Prisma
✅ Performance through smart caching
✅ Flexibility for future enhancements
