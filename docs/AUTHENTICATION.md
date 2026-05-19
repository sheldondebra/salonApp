# Authentication

## Stack

- **Laravel Sanctum** — API tokens (mobile, WordPress) + SPA authentication (Next.js)
- **Spatie Laravel Permission** — Roles & permissions with tenant teams

## User types (`user_type`)

| Type | Portal | Tenant required |
|------|--------|-----------------|
| `super_admin` | `/admin` | No |
| `tenant_owner` | Tenant dashboard | Yes |
| `staff` | Staff portal | Yes |
| `client` | Client booking | Yes |

## Token flows

### Web (Next.js)

1. `POST /api/v1/auth/login` → Sanctum cookie session (CSRF via `/sanctum/csrf-cookie`)
2. Subsequent requests include session cookie + `X-Tenant-Id` when in tenant context

### Mobile / WordPress

1. `POST /api/v1/auth/token` → personal access token
2. `Authorization: Bearer {token}`
3. WordPress uses `X-Api-Key` + `X-Api-Secret` on integration routes

## Default roles (seeded)

**Global**

- `super_admin` — platform management

**Per tenant (team_id = tenant.id)**

- `tenant_owner` — full tenant settings
- `manager` — staff + bookings management
- `staff` — own calendar + appointments
- `client` — self-service booking only

Permissions are granular (`bookings.view`, `services.manage`, etc.) — seeded in `RolesAndPermissionsSeeder`, not enforced in features yet.

## Security notes

- Password hashing via Laravel defaults (bcrypt)
- Token abilities scoped per client type (future)
- Revoke tokens on password change
- Never authorize from `user_metadata` equivalents in JWT; use server-side roles only
