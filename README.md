# PadosiPro — Full-Stack Developer Assignment

A native mobile app (React Native / Expo) with its own backend (Node.js / TypeScript / Express / Prisma)
implementing the "first journey" of the PadosiPro customer app: register, verify email via OTP,
log in, complete profile, pick tasks, and see them on a home screen.

```
Assignment/
├── backend/   Node.js + TypeScript API (Express, Prisma, SQLite)
└── mobile/    React Native app (Expo, TypeScript)
```

See DESIGN.md for architecture, trade-offs, and what's left for another week.

## Prerequisites

- Node.js 20+ and npm
- For the mobile app: the Expo Go app on your phone (easiest), or an Android emulator
  (Android Studio) / iOS simulator (macOS + Xcode)
- Optional: Docker + Docker Compose, if you would rather run the backend in a container

---

## 1. Backend setup

### Option A - plain Node (fastest, what was used to develop and test this)

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate deploy
npm run seed
npm run dev
```

### Option B - Docker Compose (one command)

```bash
cd backend
cp .env.example .env
docker compose up --build
```

The container runs migrations, seeds the task catalogue, and starts the API on http://localhost:4000.
Note: this was written and documented but not build-verified in the sandbox this was developed in,
since Docker Desktop's engine wasn't reachable there. The plain Node path above was fully verified.

### Environment variables

See backend/.env.example for the full list. Highlights:

- DATABASE_URL - SQLite file path (file:./dev.db by default)
- JWT_SECRET / JWT_EXPIRES_IN - token signing
- OTP_LENGTH, OTP_TTL_MINUTES, OTP_MAX_ATTEMPTS, OTP_RESEND_COOLDOWN_SECONDS - OTP policy
  (defaults: 6 digits, 10 min, 5 attempts, 30s cooldown, per the spec)
- EMAIL_MODE - ethereal (default), smtp, or test

### How do I get the OTP code? (important - read this)

No real email is sent by default, so the code shows up in the terminal running the backend, not in
an inbox. This is intentional (per the spec: "Send real email through SMTP, or a local mail catcher such
as Mailpit or Ethereal") and needs zero setup, but it does mean whoever is testing this needs to be
watching that terminal.

With the default EMAIL_MODE=ethereal, every OTP is printed directly to the console, e.g.:

```
[email] ---- OTP for jane@example.com: 913721 ----
[email] (full email preview, optional: https://ethereal.email/message/xxxxx)
```

Just read the 6-digit code off that line. The Ethereal link is only there if you want to see what an
actual delivered email would have looked like; you do not need to open it.

If you would rather see it in an actual inbox-style UI, run Mailpit locally
(docker run -p 1025:1025 -p 8025:8025 axllent/mailpit), set EMAIL_MODE=smtp with
SMTP_HOST=localhost and SMTP_PORT=1025, and open http://localhost:8025 to read OTP emails there. To
point at a real SMTP provider instead, set the SMTP_* variables accordingly; in that mode the code is
NOT printed to the console, so real codes are never leaked into logs.

### Running backend tests

```bash
cd backend
npm test
```

22 tests cover OTP generation/hashing, expiry, resend cooldown, max-attempt lockout, one-time-use, and
login rules (unverified users rejected, wrong password/email rejected, full happy path), plus input
validation and route auth guards.

---

## 2. Mobile app setup

```bash
cd mobile
npm install
cp .env.example .env
```

Edit mobile/.env so EXPO_PUBLIC_API_URL points at your running backend:

| Target                          | EXPO_PUBLIC_API_URL                  |
|----------------------------------|----------------------------------------|
| Android emulator (AVD)           | http://10.0.2.2:4000                   |
| iOS simulator                    | http://localhost:4000                  |
| Physical device via Expo Go      | http://YOUR-COMPUTERS-LAN-IP:4000      |

Then start the dev server:

```bash
npx expo start
```

- Press a for Android emulator, i for iOS simulator (macOS only), or scan the QR code with Expo Go
  on a physical device (same Wi-Fi network as your computer).
- npx expo start --web also runs it in a browser tab, useful for a quick sanity check (a few native
  gestures/animations will not be pixel-identical to a device, but every screen and flow works).

### Pointing a built APK at a different backend (no rebuild needed)

EXPO_PUBLIC_API_URL is only a default, baked in at build time. The app also stores its own copy of
the API address on-device, editable at runtime from a "Server settings" link on the Register and
Login screens. This matters if you install the APK on a machine or phone other than the one it was
built on: just open the app, tap "Server settings," and enter wherever you are actually running the
backend (for example http://192.168.1.23:4000). No rebuild required.

### How to build the APK

The app was scaffolded with Expo, so the straightforward path is EAS Build (free tier, builds in
the cloud, no local Android SDK required):

```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure -p android
eas build -p android --profile preview
```

eas build:configure will offer to create an eas.json with a preview profile that builds an
installable .apk (rather than the Play-Store-only .aab); accept that default.

Alternative (fully local, requires Android Studio / SDK installed):

```bash
npx expo prebuild -p android
cd android
./gradlew assembleDebug
```

Output: android/app/build/outputs/apk/debug/app-debug.apk (unsigned debug APK, fine for sideloading).

---

## 3. Quick end-to-end smoke test (curl)

With the backend running:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Password123"}'
```

The OTP code is printed to the backend's own console; see "How do I get the OTP code?" above.

```bash
curl -X POST http://localhost:4000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","code":"123456"}'

curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Password123"}'
```

## API summary

| Method | Path                  | Auth | Notes |
|--------|-----------------------|------|-------|
| POST   | /api/auth/register    | -    | Creates an unverified account, sends an OTP |
| POST   | /api/auth/resend-otp  | -    | Subject to the 30s cooldown |
| POST   | /api/auth/verify-otp  | -    | Marks the account verified |
| POST   | /api/auth/login       | -    | Rejects unverified accounts (403 EMAIL_NOT_VERIFIED) |
| GET    | /api/profile          | JWT  | |
| PUT    | /api/profile          | JWT  | |
| GET    | /api/tasks            | JWT  | Full catalogue |
| GET    | /api/tasks/selected   | JWT  | The signed-in user's picks |
| PUT    | /api/tasks/selected   | JWT  | Replaces the user's picks with { taskIds: string[] } |

All errors follow { "error": { "code": "SOME_CODE", "message": "human-readable" } }; validation errors
additionally include fields: [{ field, message }].
