# Role-Based Access Control

## Roles

| Role | Scope |
|------|--------|
| Super Admin | All permissions (platform) |
| Office Admin | Tenant management, analytics, billing |
| Tenant Owner | Full tenant workspace |
| Manager | Operations without billing/settings |
| Staff | Bookings + read services/clients |
| Client | View/create own bookings |

## Permission format

`{resource}.{action}` — e.g. `bookings.view`, `services.create`

Standalone: `billing.manage`, `settings.manage`

Actions: `view`, `create`, `update`, `delete`, `export`

Resources: `tenants`, `bookings`, `services`, `staff`, `clients`, `analytics`

## Configuration

Edit role matrices in `backend-laravel/config/permissions.php`, then:

```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan db:seed --class=DemoSeeder
```

## API protection

```php
Route::middleware('permission:analytics.view')->group(...);
Route::middleware('permission:bookings.view|bookings.create')->group(...); // OR
```

Policies: `AppointmentPolicy`, `ServicePolicy`, `TenantPolicy`, `DashboardPolicy`

Assign tenant role: `PATCH /api/v1/{tenantSlug}/team/{user}/role` (requires `settings.manage` or `staff.update`)

Sanctum token (mobile): `POST /api/v1/auth/token` (same as login)

## Frontend

- `GET /api/v1/{tenantSlug}/auth/abilities` — tenant permissions
- `GET /api/v1/auth/platform/abilities` — platform permissions
- `useAbilities(tenantSlug)` + `Permissions` constants
- `<RequirePermission permission="analytics.view">` wraps pages
