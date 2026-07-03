# V19+

Netflix-style OTT streaming platform — browse movies, series, and documentaries with subscriptions, watch history, and an admin CMS.

## Stack

| App | Tech | Port |
|-----|------|------|
| API | NestJS + Prisma + PostgreSQL | 4000 |
| Web | Next.js 14 (consumer) | 3000 |
| Admin | Next.js 14 (CMS) | 3001 |

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL (or use Docker: `docker compose -f docker-compose.db.yml up -d`)

### Setup

```bash
# Install dependencies
npm install

# Copy environment file and edit as needed
cp .env.example .env

# Start PostgreSQL, then push schema and seed
npm run db:push --workspace=apps/backend
npm run db:seed --workspace=apps/backend

# Run all apps (API + web + admin)
npm run dev
```

### URLs

- Consumer app: http://localhost:3000
- Admin panel: http://localhost:3001
- API health: http://localhost:4000/api/health

### Default accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@v19plus.com | `ADMIN_PASSWORD` env or `admin123` |
| Demo user | demo@v19plus.com | `demo1234` |

## Project structure

```
apps/
  backend/   # NestJS API (primary backend)
  web/       # Consumer Next.js app
  admin/     # Admin CMS Next.js app
packages/
  types/     # Shared TypeScript types
  utils/     # Shared utilities
backend/     # Legacy Express API (deprecated)
frontend/    # Legacy Vite SPA (deprecated)
```

The monorepo under `apps/` is the active stack. Legacy `backend/` and `frontend/` are kept for reference during migration.

## Environment notes

- `DATABASE_URL` must be a PostgreSQL connection string.
- Set `FRONTEND_URL=http://localhost:3000` for OAuth redirects and payment callbacks.
- Stripe and Razorpay run in **simulation mode** in development when keys are not configured. In production, valid keys are required.
- Change `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `ADMIN_PASSWORD` before deploying.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API, web, and admin concurrently |
| `npm run build` | Build all workspaces |
| `npm run db:seed --workspace=apps/backend` | Seed database with sample content |
| `npm run mobile:init` | Initialize Capacitor Android project |
| `npm run mobile:android` | Open Android Studio to build APK |

## Production deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full guide:

- **Database:** Supabase PostgreSQL
- **API:** Render
- **Web + Admin:** Vercel (two projects)
- **Mobile:** Capacitor Android APK
