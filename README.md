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
# Set DB_CONNECTION=pgsql and database credentials from docker-compose
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan serve
```

API base: `http://localhost:8000/api/v1`

### 3. Frontend

```bash
cd frontend-nextjs
cp .env.example .env.local
npm install
npm run dev
```

App: `http://localhost:3000`

### 4. Mobile (placeholder)

```bash
cd mobile-reactnative
npm install
# Full Expo/RN bootstrap documented in mobile-reactnative/README.md
```

## Documentation

- [Architecture overview](docs/ARCHITECTURE.md)
- [Database schema](docs/DATABASE.md)
- [Multi-tenancy](docs/MULTI-TENANCY.md)
- [Authentication](docs/AUTHENTICATION.md)
- [Setup commands](docs/SETUP.md)

## License

Proprietary — All rights reserved.
