# Setup Commands

## Initial scaffold (already run)

```bash
# Laravel
composer create-project laravel/laravel backend-laravel "^11.0"
cd backend-laravel
composer require laravel/sanctum spatie/laravel-permission
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"

# Next.js
npx create-next-app@14 frontend-nextjs --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd frontend-nextjs
npx shadcn@2.3.0 init -y
```

## Recommended Shadcn components (when building UI)

```bash
cd frontend-nextjs
npx shadcn@2.3.0 add button card input label select command popover dialog dropdown-menu avatar badge separator sheet sidebar tabs table sonner
```

## Environment

### `backend-laravel/.env`

```env
APP_NAME=Schedelux
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=salonapp
DB_USERNAME=salonapp
DB_PASSWORD=salonapp_secret

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_HOST=127.0.0.1

SANCTUM_STATEFUL_DOMAINS=localhost:3000,workplace.localhost:3000
SESSION_DOMAIN=localhost

TENANT_WORKPLACE_HOST=workplace.localhost
TENANT_ROOT_DOMAIN=localhost

# Ops Monitor (API health dashboard at http://localhost:8000/ops)
OPS_MONITOR_ENABLED=true
OPS_MONITOR_USERNAME=ops
OPS_MONITOR_PASSWORD=changeme
```

### `frontend-nextjs/.env.local`

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WORKPLACE_HOST=workplace.localhost:3000
NEXT_PUBLIC_ROOT_DOMAIN=localhost
```

## Ops Monitor (API health dashboard)

Built-in Laravel dashboard (Telescope-style) for local/staging debugging:

1. Open **http://localhost:8000/ops/login**
2. Sign in with `OPS_MONITOR_USERNAME` / `OPS_MONITOR_PASSWORD` from `.env`
3. Use **Overview**, **API Routes**, **Requests**, **Errors**, and **Laravel Log**

Every `/api/*` request is recorded automatically (status, duration, route, error message). Set `OPS_MONITOR_ENABLED=false` in production unless you need it.

```bash
php artisan ops:prune-logs   # remove logs older than retention (default 14 days)
```

## Database

```bash
docker compose up -d
cd backend-laravel
php artisan migrate:fresh --seed
```

## Local hosts (multi-tenant testing)

Add to `/etc/hosts`:

```
127.0.0.1 workplace.localhost
```

## Notifications (MNotify SMS + email)

SMS and transactional email are queued. Run a queue worker alongside the API:

```bash
cd backend-laravel
php artisan queue:work
```

Optional MNotify keys in `backend-laravel/.env` (without them, SMS is logged in demo mode):

```env
MNOTIFY_API_KEY=
MNOTIFY_SENDER_ID=Schedelux
MNOTIFY_BASE_URL=https://api.mnotify.com/api
MNOTIFY_BALANCE_URL=https://apps.mnotify.net/smsapi/balance
```

Booking reminders run hourly via the scheduler (`bookings:send-reminders`). For local cron:

```bash
php artisan schedule:work
```

- **Tenant:** Settings → Notifications (SMS wallet balance, ledger, toggles, delivery log)
- **Platform:** Admin → SMS → **Reseller hub** — configure MNotify API (encrypted, masked after save), **Test connection**, **Reload SMS balance**
- **Dashboard:** Platform overview shows last synced MNotify balance
- **Demo credits:** `php artisan db:seed --class=SmsResellerSeeder` (500 credits per tenant after migration)

## Run dev servers

```bash
# Terminal 1
cd backend-laravel && php artisan serve

# Terminal 2
cd frontend-nextjs && npm run dev

# Terminal 3 (queues)
cd backend-laravel && php artisan queue:work
```

## Reports

- **Salon workspace:** `/{tenant-slug}/reports` (requires analytics permission)
- **Platform admin:** `/admin/reports`

Use date presets and filters, then **Apply filters**. Data is tenant-scoped on the salon side; admin sees platform-wide MRR, tenant growth, and SMS usage.

## Health checks

- API: `GET http://localhost:8000/up`
- API v1: `GET http://localhost:8000/api/v1/health`
- Web: `http://localhost:3000`

## Demo logins (after `migrate:fresh --seed`)

| Portal | URL | Email | Password |
|--------|-----|-------|----------|
| General Office | http://localhost:3000/admin | `office@salonapp.com` | `password` |
| Super Admin | http://localhost:3000/admin | `admin@salonapp.com` | `password` |
| Salon workspace | http://localhost:3000/luxe-bloom/dashboard | `owner@luxebloom.demo` | `password` |

Salon owner accounts (e.g. your own signup) cannot use General Office — that area is platform staff only.
