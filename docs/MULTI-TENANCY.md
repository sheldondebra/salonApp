# Multi-Tenancy

## Model: single database, shared schema

Each tenant is a row in `tenants`. Tenant-owned tables include `tenant_id` (UUID) with:

- `BelongsToTenant` trait applying a global scope
- `TenantContext` set by `ResolveTenant` middleware
- Spatie Permission `team_id` aligned to `tenant_id`

## URL strategies

### Workplace subdomain + business slug

```
https://workplace.yourdomain.com/{business-slug}/dashboard
```

Resolution:

1. Parse host → workplace platform (not a tenant)
2. Parse first path segment → `tenants.slug`
3. Bind `TenantContext` for the request lifecycle

### Custom domain (CNAME)

```
https://book.beautystudio.com
```

1. Customer CNAMEs to your platform (`cname.yourdomain.com`)
2. Row in `tenant_domains` with `type = custom`, `domain = book.beautystudio.com`
3. SSL via your edge provider (Vercel/Cloudflare)
4. `verified_at` set after DNS verification job

## Tenant lifecycle states

| Status | Meaning |
|--------|---------|
| `pending` | Created, not yet active |
| `active` | Full access |
| `suspended` | Read-only or blocked |
| `cancelled` | Offboarding |

## Middleware chain (API)

```
ResolveTenant → Authenticate (Sanctum) → EnsureTenantAccess → CheckPermission
```

- **Super admin** routes skip `EnsureTenantAccess` and use `role:super_admin`
- **Cross-tenant** access is never implicit; super admin uses explicit tenant switch header `X-Tenant-Id` when impersonating

## Frontend tenant context

Next.js middleware (`src/middleware.ts`) mirrors host/slug resolution and sets cookies/headers for the API client.

## Data isolation checklist

- [ ] All tenant tables have `tenant_id` + index
- [ ] Global scopes on tenant models
- [ ] Foreign keys include `tenant_id` where applicable
- [ ] Queue jobs carry `tenant_id` in payload
- [ ] File storage paths prefixed by tenant UUID
