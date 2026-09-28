# DESIGN.md

## Architecture

**Backend** — Node.js + TypeScript, Express, Prisma ORM, SQLite.

- `src/routes/*` — thin HTTP handlers: validate input (Zod middleware), call a service/Prisma, shape the
  response. No business logic lives here.
- `src/services/otpService.ts` — the one piece of genuinely risky logic (generation, hashing, expiry,
  attempt-limiting, resend cooldown), isolated from Express so it's directly unit/integration-testable.
- `src/services/email.ts` — a tiny abstraction over Nodemailer with three modes: `ethereal` (default,
  zero-config disposable inbox), `smtp` (point at Mailpit or a real provider), `test` (no-op, used by the
  Jest suite so tests never touch the network).
- `src/middleware/auth.ts` — verifies the JWT and attaches `userId` to the request; every profile/task
  route requires it.
- Prisma schema: `User` (credentials + profile fields + verification flag), `OtpCode` (hashed code,
  expiry, attempt counter, one row per issued code — old codes aren't deleted, just superseded, which
  gives a natural audit trail), `Task` (seeded catalogue), `UserTask` (join table for selections).

**Mobile** — React Native (Expo, TypeScript), React Navigation (native-stack), Context API for auth state,
AsyncStorage for the persisted JWT, a small `fetch`-based API client (no need for axios at this size).

- `AuthContext` is the single source of truth for *where the user should be*: `loading` (bootstrapping
  from storage) → `signed-out` → `needs-profile` → `needs-tasks` → `ready`. `RootNavigator` just switches
  on that status — there's no separate "is logged in" boolean plus a pile of ad-hoc redirects scattered
  across screens.
- Screens are grouped by concern (`RegisterScreen`, `VerifyOtpScreen`, `LoginScreen`, `ProfileSetupScreen`,
  `TaskSelectionScreen`, `HomeScreen`), each owning its own loading/error/empty state rather than a shared
  generic wrapper — the states differ enough (retry vs. inline validation vs. empty-search) that a shared
  abstraction would have added more indirection than it saved.
- `TaskSelectionScreen` doubles as both the first-run picker and an "edit tasks" screen reachable from
  Home, since the two are identical except for what happens on confirm (`refreshStatus()` either way).

## Key trade-offs

- **SQLite over Postgres.** The spec explicitly allows it, and it means "one documented command" is
  genuinely one command with no external service to stand up. The schema has no SQLite-specific quirks,
  so swapping the Prisma `datasource` to Postgres later is a non-event.
- **Ethereal over requiring real SMTP credentials.** Anyone cloning the repo can see OTP emails
  immediately with zero setup. The trade-off is that Ethereal never delivers to a real inbox — fine for a
  take-home, not fine for production, which is why `EMAIL_MODE=smtp` exists as a drop-in replacement.
- **OTP codes are never returned by the API, including in error messages.** This made writing black-box
  integration tests slightly more awkward (tests reach into Prisma directly to reset a code's hash to a
  known value, the same way a real "forgot my code" support flow would have to) but it's the correct
  security posture, and I didn't want the test suite to be the reason a shortcut leaked into production
  code.
- **Business Name is optional.** Not every household task falls under a registered business, and the
  spec explicitly leaves this decision to the candidate — required-by-default would block the common case
  (a private individual signing up).
- **No refresh tokens.** A single JWT with a 7-day expiry is what the spec asks for ("JWT with expiry is
  fine"). Silent refresh is real work (rotation, revocation) that wasn't asked for.
- **Task Selection is revisitable, not one-time.** The spec's onboarding flow is stated as one pass
  through, but hard-locking it afterward would make Home a dead end whenever a user's needs change; the
  extra surface area is small (one button, reusing the existing screen).

## What I left out

- **Password reset / forgot-password.** Not in scope per the brief; would need its own OTP-style flow.
- **Rate limiting at the HTTP layer** (e.g. per-IP throttling on `/login` or `/register`). The OTP service
  already enforces the specific limits the spec asked for (attempts, cooldown); broader abuse protection
  (fail2ban-style IP throttling, CAPTCHA) is a production concern I didn't have time to add.
- **Push notifications / real email deliverability** — out of scope for a take-home; Ethereal stands in.
- **Signed release APK.** Building one requires either a free Expo account (EAS Build, cloud-based) or a
  local Android SDK — neither was available in the sandboxed environment this was built in. The exact
  commands to produce one are in the README; I was not able to attach a built `.apk` to this submission.
- **Docker Compose build verification.** Docker Desktop's engine wasn't reachable in this sandbox, so the
  `docker-compose.yml`/`Dockerfile` are written and reviewed but not build-tested end to end. The
  non-Docker path (`npm install && npx prisma migrate deploy && npm run seed && npm run dev`) was fully
  verified, including a live register → verify → login → profile → task-selection round trip.
- **Live device/emulator screenshot of the mobile app.** The sandbox had no Android emulator, iOS
  simulator, or GUI browser attached. I verified the app compiles cleanly (`tsc --noEmit`, zero errors)
  and bundles cleanly for web (`expo export --platform web`, 568 modules, no errors), and reviewed every
  screen's render logic by hand, but I have not visually confirmed pixel-level layout on a real
  screen — please do that pass before submitting, especially small-screen spacing on `TaskSelectionScreen`
  and `ProfileSetupScreen`, and re-check the Ionicons render since these need the vector-icon fonts loaded.
- **Screen recording.** Optional per the brief; skipped for the same reason (no device/emulator to record
  from in this environment).

## What I'd do next with another week

- Swap SQLite for Postgres + a real migrations pipeline (CI running `prisma migrate deploy` against a
  throwaway DB) to catch drift earlier.
- Add rate limiting (`express-rate-limit` or similar) on the auth endpoints.
- Add a forgot-password flow reusing the existing OTP infrastructure (same table, new `purpose`).
- Add component-level tests for the mobile app's validation logic (email/password/mobile regex, OTP
  countdown timer) with React Native Testing Library — none exist yet; the assignment's testing
  requirement is scoped to the backend's risky logic, which is fully covered, but the mobile validation
  rules are currently only exercised manually.
- Persist a refresh token and short-lived access token pair instead of one long-lived JWT.
- Add basic analytics/logging (structured request logging, e.g. pino) for debugging in a real deployment.
