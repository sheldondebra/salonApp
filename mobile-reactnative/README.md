# SalonApp Mobile (React Native)

Foundation shell for the future iOS/Android client. Shares the same Laravel API (`/api/v1`) as the web app.

## Bootstrap (when ready to implement)

```bash
npx create-expo-app@latest . --template blank-typescript
npm install @tanstack/react-query axios expo-secure-store
```

## Recommended structure

```
mobile-reactnative/
├── src/
│   ├── api/           # Axios client + Sanctum token storage
│   ├── config/        # API base URL, env
│   ├── features/      # Booking, auth, profile
│   ├── navigation/    # React Navigation stacks
│   └── components/
├── app.json
└── package.json
```

## API contract

- Auth: `POST /api/v1/auth/token` → Bearer token in `Authorization` header
- Tenant: pass `X-Tenant-Id` or resolve via deep link slug
- Health: `GET /api/v1/health`

## Environment

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Use your machine LAN IP instead of `localhost` on physical devices.
