# BeautyOS Mobile (Expo / React Native)

Foundation mobile client for BeautyOS. Connects to the same Laravel API (`/api/v1`) as the Next.js web app.

## Stack

- **Expo SDK 52** + **expo-router** (file-based navigation)
- **TypeScript**
- **expo-secure-store** for Sanctum tokens
- Baby-pink theme aligned with the web SaaS UI

## Role-based portals

After sign-in, navigation routes by role:

| Portal | Roles / types |
|--------|----------------|
| `/admin` | Super Admin, Office Admin |
| `/workplace` | Tenant Owner, Manager |
| `/staff` | Staff |
| `/client` | Client |

## Quick start

```bash
cd mobile-reactnative
cp .env.example .env
npm install
npm start
```

1. Start the API: `cd backend-laravel && php artisan serve`
2. Press `i` (iOS simulator) or `a` (Android emulator)
3. Sign in with a seeded user (e.g. owner or client from `db:seed`)

### Physical devices

Set `EXPO_PUBLIC_API_URL` to your machine LAN IP (not `127.0.0.1`), e.g.:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.42:8000
```

## Project structure

```
mobile-reactnative/
├── app/                    # expo-router screens
│   ├── login.tsx
│   ├── admin/
│   ├── workplace/
│   ├── staff/
│   └── client/
├── src/
│   ├── api/                # HTTP client + /health check
│   ├── auth/               # Session, roles, AuthProvider
│   ├── components/         # Button, Input, Card, Header, etc.
│   ├── config/
│   └── theme/
├── app.json
└── package.json
```

## API contract

| Action | Endpoint |
|--------|----------|
| Login | `POST /api/v1/auth/login` |
| Session | `GET /api/v1/me` |
| Logout | `POST /api/v1/auth/logout` |
| Health | `GET /api/v1/health` |
| Tenant abilities | `GET /api/v1/{tenantSlug}/auth/abilities` |

Headers: `Authorization: Bearer {token}`, optional `X-Tenant-Slug` / `X-Tenant-Id`.

## Client booking (Batch 37)

From the client home screen:

1. Select a salon (from linked tenants)
2. **Book appointment** — service → stylist → date/time → confirm
3. **My bookings** — history, tap to view, cancel, or reschedule

APIs used: `/{slug}/book/*`, `/{slug}/account/bookings`, `GET /account/tenants`.

## Next batches (roadmap)

- **Batch 38** — Staff portal
- **Batch 39** — Tenant owner dashboard
- **Batch 40** — Super Admin mobile dashboard
