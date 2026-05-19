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
APP_NAME=SalonApp
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
```

### `frontend-nextjs/.env.local`

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WORKPLACE_HOST=workplace.localhost:3000
NEXT_PUBLIC_ROOT_DOMAIN=localhost
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

## Run dev servers

```bash
# Terminal 1
cd backend-laravel && php artisan serve

# Terminal 2
cd frontend-nextjs && npm run dev
```

## Health checks

- API: `GET http://localhost:8000/up`
- API v1: `GET http://localhost:8000/api/v1/health`
- Web: `http://localhost:3000`
