# Schedelux Mobile (`salonmobileapp`)

Expo **SDK 54** app for platform admin, salon owner, staff, and client booking.

## If you see “Welcome to Expo” (Home / Explore)

You are **not** running this project’s bundle. Common causes:

1. Metro started in a **different folder** (old `salonmobileapp` copy or Trash).
2. Expo Go still connected to an **old QR code** (SDK 55 starter).
3. Port **8081** was used by another app.

### Fix (do this exactly)

```bash
cd /Users/sheldondebra/Desktop/salonapp/salonmobileapp
npm install
npm start
```

`npm start` kills ports 8081/8082 and runs `expo start --clear --lan` from **this** folder only.

On your phone:

1. **Force-quit Expo Go**
2. Open Expo Go → scan the **new** QR from the terminal above
3. Confirm the app name is **Schedelux** (slug `schedelux-mobile`)

First launch: **3-slide pink intro** → login. You should **never** see “Welcome to Expo” or Home/Explore tabs.

## API URL

```bash
cp .env.example .env
```

- Simulator: `EXPO_PUBLIC_API_URL=http://127.0.0.1:8000`
- Physical device: use your Mac’s LAN IP, e.g. `http://192.168.1.10:8000`

Laravel: `cd ../backend-laravel && php artisan serve`

## Routes (`src/app/`)

| Screen | Path |
|--------|------|
| Home / intro | `/` |
| Login | `/login` |
| Admin | `/admin` |
| Owner | `/workplace` |
| Staff | `/staff` |
| Client | `/client` |

## Verify

```bash
npm run lint
```

Expected Expo SDK: **54** (matches current Expo Go on the App Store).
