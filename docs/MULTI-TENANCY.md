# Multi-Tenancy

## Model: single database, shared schema

Each tenant is a row in `tenants`. Tenant-owned tables include `tenant_id` with:

- `BelongsToTenant` trait applying a global scope when `TenantContext` is set
- `TenantResolver` service for host/slug/header resolution
- Spatie Permission `team_id` aligned to `tenant_id`

## Tenant tables

| Table | Purpose |
|-------|---------|
| `tenants` | Business record, slug, status, plan, **branding columns** |
| `tenant_domains` | Custom CNAME + workplace host mappings, verification |
| `tenant_user` | User membership pivot (`is_owner`) |

### Branding columns (`tenants`)

`logo_url`, `banner_url`, `primary_color`, `accent_color`, `tagline`, `business_email`, `business_phone`, `address_line1`, `city`, `country`, `website_url`

Used by public booking pages and tenant settings. Extensible `settings` JSON remains for future flags.

## URL strategies

### 1. Workplace host + business slug

```
https://workplace.yourdomain.com/{business-slug}/dashboard
https://workplace.yourdomain.com/{business-slug}/book
```

Resolution: `TenantResolver` reads first path segment on workplace host (skips reserved slugs like `admin`, `login`).

API: `GET /api/v1/{tenantSlug}/context`

### 2. Custom domain (CNAME)

```
https://book.beautystudio.com
```

1. Customer CNAMEs to your platform
2. Row in `tenant_domains` (`type = custom`, `domain = book.beautystudio.com`)
3. Set `verified_at` after DNS verification (optional in local dev via `TENANT_ALLOW_UNVERIFIED_DOMAINS=true`)
4. API resolves tenant from `Host` — **no slug in URL**

API: `GET /api/v1/booking/context`

Next.js: custom domain root rewrites to branded `/book-custom` page.

### 3. Platform impersonation

Super/office admin may pass `X-Tenant-Id: {id}` to scope a request to a tenant.

## Middleware chain

| Alias | Class | Purpose |
|-------|-------|---------|
| `tenant.resolve` | `ResolveTenant` | Run `TenantResolver`, set `TenantContext` |
| `tenant.resolved` | `EnsureTenantResolved` | 404 if no tenant |
| `tenant.active` | `EnsureTenantIsActive` | 403 if tenant not active (public booking) |
| `tenant.access` | `EnsureTenantAccess` | Authenticated user must belong to tenant |

Auth routes (`/auth/login`, `/me`) are **outside** tenant middleware and unchanged.

## API routes

```
GET  /api/v1/booking/context          # custom domain
GET  /api/v1/booking/services
POST /api/v1/booking/appointments

GET  /api/v1/{tenantSlug}/context     # workplace / slug
GET  /api/v1/{tenantSlug}/services
...
```

## Data isolation

- Global scope on all `BelongsToTenant` models when context is set
- `tenant_id` auto-filled on create from context
- Use `Model::withoutGlobalScope('tenant')` only in seeders/admin with explicit `tenant_id` filters

## Tenant lifecycle

| Status | Meaning |
|--------|---------|
| `pending` | Created, not yet active |
| `active` | Full access + public booking |
| `suspended` | Blocked |
| `cancelled` | Offboarding |

Only `active` tenants resolve for public booking routes.
