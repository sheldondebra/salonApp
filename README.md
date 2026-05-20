# SalonApp — Multi-Tenant Beauty Booking SaaS

Production-ready monorepo foundation for a Fresha-style beauty booking platform.

## Repository structure

```
salonapp/
├── backend-laravel/     # Laravel 11 REST API (Sanctum, RBAC, multi-tenant)
├── frontend-nextjs/       # Next.js 14 web app (portals, Shadcn, Tailwind)
├── mobile-reactnative/  # React Native shell (future mobile clients)
├── docs/                # Architecture & setup guides
└── docker-compose.yml   # Local PostgreSQL + Redis
```

## Portals & URLs

| Portal        | URL pattern                                      |
|---------------|--------------------------------------------------|
| Marketing     | `https://domain.com`                             |
| Super Admin   | `https://domain.com/admin`                       |
| Tenant        | `https://workplace.domain.com/{business-slug}`   |
| Staff         | `https://workplace.domain.com/{slug}/staff`      |
| Client        | `https://workplace.domain.com/{slug}/book`       |
| Client account| `https://workplace.domain.com/{slug}/account`    |
| Auth          | `/login`, `/register`, `/auth/callback`          |
| Pricing       | `/pricing`                                       |
| Custom domain | CNAME → tenant primary domain                    |

## Quick start

### Prerequisites

- PHP 8.2+, Composer
- Node.js 20+, npm
- Docker (PostgreSQL + Redis)

### 1. Infrastructure

```bash
cd salonapp
docker compose up -d
```

### 2. Backend API

```bash
cd backend-laravel
cp .env.example .env
# Local: DB_CONNECTION=pgsql + docker-compose credentials
# Neon: DB_CONNECTION=pgsql, pooler host, DB_SSLMODE=require
composer install
php artisan key:generate
php artisan migrate          # required before db:seed (creates cache, sessions, etc.)
php artisan db:seed          # not "php artisan seed"
php artisan serve
```

**Neon / fresh Postgres:** `CACHE_STORE=database` needs the `cache` table — always run `migrate` first. Permissions are seeded via `db:seed` (there is no `permissions:sync` command). Optional: `php artisan permission:cache-reset` after seeding.

API base: `http://localhost:8000/api/v1`

### 3. Frontend

```bash
cd frontend-nextjs
cp .env.example .env.local
npm install
npm run dev
```

App: `http://localhost:3000`

The frontend proxies `/api/v1/*` → `http://127.0.0.1:8000` so login works without CORS issues. **Both servers must be running.**

**CORS error in the browser?** Do not set `NEXT_PUBLIC_API_URL=http://localhost:8000`. Use `npm run dev` (not `dev:clean` unless broken). Login must hit `http://localhost:3000/api/v1/...`, not port 8000.

### Login not working?

1. **Backend** — `cd backend-laravel && php artisan serve` (must show `http://127.0.0.1:8000`)
2. **Frontend** — `cd frontend-nextjs && npm run dev` (use **http://localhost:3000** only)
3. **Database** — `php artisan migrate` then `php artisan db:seed` (Neon or Docker Postgres)
4. **Restart both** after pulling changes (stop with Ctrl+C, start again)
5. Test proxy: `curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"office@salonapp.com","password":"password"}'` — should return JSON with `"token"`
6. **Accounts:** `office@salonapp.com` / `password` → `/admin` · `owner@luxebloom.demo` / `password` → salon dashboard

**One-command API test** (from repo root, with `php artisan serve` running):

```bash
./scripts/check-auth.sh
# office admin: ./scripts/check-auth.sh office@salonapp.com password
```

If login succeeds but the salon dashboard shows “Access restricted”, run `php artisan migrate` (includes fix for global Spatie roles).

### If the UI looks broken or unstyled

1. **One dev server only** — `npm run dev` on port 3000. If busy: `lsof -ti :3000 | xargs kill -9`, then `npm run dev` again.
2. **`/_next/static/chunks/...` 404** — stale browser cache. Stop all dev servers, run `npm run dev:clean` once, then hard-refresh (**Cmd+Shift+R**). Use normal `npm run dev` for daily work (do not wipe `.next` every time).
3. **Env** — do not set `NEXT_PUBLIC_API_URL` to port 8000. Laravel: `php artisan serve`.
4. **Invalid JSX** — never use `<motion>` tags (use `<div>`). Run `npm run verify:ui` before committing.

### Demo accounts (after `db:seed`)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@salonapp.com | password |
| Office Admin | office@salonapp.com | password |
| Tenant Owner | owner@luxebloom.demo | password |
| Demo tenant slug | `luxe-bloom` | — |

Try: [Tenant dashboard](http://localhost:3000/luxe-bloom/dashboard) · [Client booking](http://localhost:3000/luxe-bloom/book) · [Client account](http://localhost:3000/luxe-bloom/account/profile) · [Pricing](http://localhost:3000/pricing) · [Admin](http://localhost:3000/admin)

### Appointment booking (public)

Per-**tenant** booking at `/{tenant}/book` (data isolated by `tenant_id`). Branch step appears only if that tenant enables `settings.multiple_locations` and has 2+ locations — most single-site salons skip it. API: `GET .../context` (includes `booking.location_mode`), `.../availability`, `POST .../appointments`, `POST .../waitlist`.

**Client demo:** `client@example.com` / `password` — loyalty, favorites, and booking history for Luxe Bloom.

### Salon owner signup & billing flow

1. Choose a plan on [/pricing](http://localhost:3000/pricing) → **Get started**
2. Register (`/register?plan=professional&intent=salon`)
3. Pay at `/checkout` (Paystack or Flutterwave, coupons supported)
4. After payment → `/onboarding` to create the salon workspace
5. Super Admin / Office Admin → `/admin` → **Payments** and **Unpaid signups** tabs

**Demo coupons:** `WELCOME20` (20% off) · `SAVE10` ($10 off)

Without API keys, payments run in **demo mode** (auto-redirect to verify).

### Social login (optional)

Configure in `backend-laravel/.env`:

```env
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

Redirect URIs must match `APP_URL/api/v1/auth/social/{provider}/callback`. Apple Sign-In requires additional setup beyond Socialite defaults.

### 4. Mobile (placeholder)

```bash
cd mobile-reactnative
npm install
# Full Expo/RN bootstrap documented in mobile-reactnative/README.md
```

## Feature overview

| Area | Highlights |
|------|------------|
| **Multi-tenant** | Slug workspaces, custom domains, strict `tenant_id` isolation |
| **Auth & RBAC** | Sanctum tokens, Spatie permissions, platform + tenant roles |
| **Booking** | Availability, multi-service, group/recurring, waitlist, public `/book` |
| **Payments** | Paystack & Flutterwave, deposits, subscriptions, coupons |
| **Notifications** | MNotify SMS + queued email (confirm, reminder, cancel, payment, OTP) |
| **Analytics** | Tenant reports + Super Admin MRR / tenant growth |
| **Admin** | General Office: tenants, billing, plans, coupons, SMS log, onboarding |

## Production checklist

See **[Market readiness checklist](docs/MARKET-READINESS.md)** for smoke tests, env vars, and launch steps.

Quick verification:

```bash
# UI rules (no motion tags)
cd frontend-nextjs && npm run verify:ui

# Auth + API (backend must be running)
./scripts/check-auth.sh

# Queue worker (SMS/email)
cd backend-laravel && php artisan queue:work
```

### Key environment variables

| Variable | Purpose |
|----------|---------|
| `FRONTEND_URL` | Checkout redirects, email links |
| `PAYSTACK_*` / `FLUTTERWAVE_*` | Payments (optional demo mode) |
| `MNOTIFY_API_KEY` | SMS (logs only if empty) |
| `QUEUE_CONNECTION` | Use `database` + `queue:work` for notifications |

## Documentation

- [Architecture overview](docs/ARCHITECTURE.md)
- [Database schema](docs/DATABASE.md)
- [Multi-tenancy](docs/MULTI-TENANCY.md)
- [Authentication](docs/AUTHENTICATION.md)
- [Setup commands](docs/SETUP.md)
- [Market readiness](docs/MARKET-READINESS.md)

## License

Proprietary — All rights reserved.
