# Database Schema (Foundation)

PostgreSQL 16. Migrations live in `backend-laravel/database/migrations/`.

## Core tenancy

### `tenants`

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| uuid | uuid | Public identifier |
| name | string | Business display name |
| slug | string | Unique URL slug |
| status | string | pending, active, suspended, cancelled |
| plan | string | Subscription tier key |
| timezone | string | Default TZ |
| currency | char(3) | ISO 4217 |
| settings | jsonb | Branding, booking rules (future) |
| trial_ends_at | timestamp | nullable |
| timestamps | | |

### `tenant_domains`

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| tenant_id | FK | |
| domain | string | Unique host |
| type | enum | subdomain, custom |
| is_primary | boolean | |
| verified_at | timestamp | DNS verified |

## Identity & access

### `users` (extended)

- `uuid`, `phone`, `avatar_url`, `user_type`, `is_active`
- Super admins have `tenant_id` null

### `tenant_user`

Pivot: user membership in a tenant with `is_owner`, `joined_at`.

### Spatie tables

`roles`, `permissions`, `model_has_roles`, etc. with `team_foreign_key` = `tenant_id`.

## Booking foundation (stubs)

- `locations` — physical/virtual sites per tenant
- `service_categories` — grouping for services
- `services` — bookable offerings (duration, price)
- `staff_members` — links user to tenant staff profile
- `appointments` — booking records (status enum, no workflow yet)

## Integrations

- `payment_provider_configs` — encrypted credentials per tenant
- `payment_transactions` — ledger stub
- `sms_messages` — MNotify outbound log stub
- `api_clients` — WordPress / third-party API keys

## Analytics foundation

- `analytics_events` — time-series friendly event store (Grafana export later)

## Indexing strategy

- `(tenant_id, slug)` on business entities
- `(tenant_id, starts_at)` on appointments
- Unique `(domain)` on tenant_domains

See migration files for exact constraints and foreign keys.
