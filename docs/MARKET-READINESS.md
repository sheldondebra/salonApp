# Market Readiness Checklist

Use this checklist before demo, pilot, or production launch.

## Core flows (manual smoke test)

| Flow | URL / steps | Pass |
|------|-------------|------|
| Salon owner signup | `/pricing` → register → checkout → onboarding | ☐ |
| Tenant dashboard | `/{slug}/dashboard` — stats, charts load | ☐ |
| Public booking | `/{slug}/book` — services, time, confirm | ☐ |
| Booking payment | Pay deposit/full when payments enabled | ☐ |
| Appointments CRUD | `/{slug}/appointments` — list, reschedule, cancel | ☐ |
| Staff / services / clients | CRUD pages under workplace | ☐ |
| Branding & settings | `/{slug}/settings` — save branding, notifications | ☐ |
| Reports | `/{slug}/reports` — filters, charts | ☐ |
| Super Admin | `/admin` — tenants, billing, SMS, reports | ☐ |
| Client account | `/{slug}/account` — profile, bookings, loyalty | ☐ |

## Environment

- [ ] `php artisan migrate` and `php artisan db:seed` on target database
- [ ] `QUEUE_CONNECTION=database` + `php artisan queue:work` for SMS/email
- [ ] Payment keys (`PAYSTACK_*`, `FLUTTERWAVE_*`) or accept demo mode for staging
- [ ] `MNOTIFY_API_KEY` + `MNOTIFY_SENDER_ID` for SMS (demo mode logs without key)
- [ ] `FRONTEND_URL` and `APP_URL` match deployed domains
- [ ] Mail driver configured for transactional email (`MAIL_*`)

## Security & tenancy

- [ ] Every tenant API route uses `ResolveTenant` + `EnsureTenantAccess`
- [ ] Row-level isolation via `tenant_id` global scopes on tenant models
- [ ] Permissions enforced (`analytics.view`, `bookings.*`, `settings.manage`, etc.)
- [ ] No secrets in git — `.env` only on server

## UI quality

- [ ] `cd frontend-nextjs && npm run verify:ui` passes (no `<motion>` tags)
- [ ] Mobile: sidebar menu, tables scroll horizontally, forms usable on 375px width
- [ ] Empty and error states visible when API is down or lists are empty
- [ ] Skip link works (Tab → “Skip to main content”)

## Before production

- [ ] Set `APP_DEBUG=false`, strong `APP_KEY`
- [ ] HTTPS on API and frontend
- [ ] CORS: frontend proxies `/api/v1` or allowlisted origins only
- [ ] Scheduled task: `bookings:send-reminders` (hourly in `bootstrap/app.php`)
- [ ] Backups for Postgres
- [ ] Error monitoring (Sentry, etc.) — optional but recommended

## Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@salonapp.com | password |
| Office Admin | office@salonapp.com | password |
| Tenant Owner | owner@luxebloom.demo | password |
| Client | client@example.com | password |
| Demo tenant | `luxe-bloom` | — |
