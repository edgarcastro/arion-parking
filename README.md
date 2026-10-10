# Arion Parking

Responsive web app for a cars-only parking lot. Staff (or drivers at a kiosk) type a license plate to park a car; the car drives into a random free spot on a top-down, game-style lot. Tap or click a car to check it out: the app shows entry time, exit time, duration and the fee. An admin area (Firebase Auth) changes the number of spots (20 by default), the hourly rate, and shows the history of past stays.

Built with React + Vite + TypeScript, [HeroUI v3](https://heroui.com) and [Heroicons](https://heroicons.com), Firestore and Firebase Auth, deployed to Firebase Hosting with GitHub Actions. Package manager: **bun**.

## Routes

| Route    | Who    | What |
|----------|--------|------|
| `/`      | public | Lot view: park by plate, click a car to check it out. Arrow keys + Enter also work. |
| `/kiosk` | public | Fullscreen, touch-first version: large targets, keeps the screen awake, resets after 60 s idle. Press and hold the title for 2 s to leave. |
| `/admin` | admins | Sign in, change spots / hourly rate / currency / free grace minutes, browse history. |

## Setup

1. `bun install`
2. Firebase console (project `arion-parking`):
   - Add a **Web app** and copy its config.
   - **Authentication → Sign-in method**: enable *Email/Password*, then add your admin user under *Users*.
   - **Firestore**: create the document `admins/<admin email in lowercase>` (it can be empty). Only emails listed there can change settings or read history.
3. Copy `.env.example` to `.env.local` and fill in the web config.
4. Deploy the security rules and indexes once (and again whenever they change):
   ```sh
   bunx firebase login
   bun run deploy:rules
   ```
5. `bun run dev`

### Local development with emulators

```sh
bun run emulators   # Firestore + Auth emulators, UI on http://localhost:4000
# in .env.local: VITE_USE_EMULATORS=true
bun run dev
```

Create the admin user and the `admins/<email>` doc in the emulator UI.

## Scripts

| Script                 | Description |
|------------------------|-------------|
| `bun run dev`          | Vite dev server |
| `bun run build`        | Typecheck and build to `dist/` |
| `bun run lint`         | oxlint (warnings fail) |
| `bun run typecheck`    | `tsc -b` |
| `bun run test`         | Unit and component tests (Vitest) |
| `bun run test:rules`   | Security rules + parking transaction tests in the Firestore emulator (needs Java 21+) |
| `bun run deploy:rules` | Deploy `firestore.rules` and `firestore.indexes.json` |

## Data model

| Path                   | Contents |
|------------------------|----------|
| `settings/lot`         | `capacity`, `hourlyRate`, `currency`, `graceMinutes` (defaults: 20 spots, free) |
| `activeSpots/{spot}`   | Occupied spot: `plate`, `sessionId`, `entryAt` |
| `activePlates/{plate}` | Parked plate: `spot`, `sessionId` (prevents parking the same plate twice) |
| `sessions/{id}`        | Every stay: `plate`, `spot`, `entryAt`, `exitAt`, `durationMinutes`, `fee`, `status` (`parked` → `left`) |
| `admins/{email}`       | Admin allowlist, managed from the console |

Parking and checking out are single Firestore transactions over the spot, plate and session documents, and `firestore.rules` checks that the three always change together, so two devices can't take the same spot. Fees: every started hour is charged at `hourlyRate`; stays within `graceMinutes` are free.

> The main view is public by design, so the fee is computed in the browser. That's fine for an MVP; move checkout into a Cloud Function if the fee must be tamper-proof.

## CI/CD

- **Pull requests** (`.github/workflows/firebase-hosting-pull-request.yml`): lint, typecheck, unit tests, rules tests in the emulator, then build and deploy a preview channel. The preview URL is posted on the PR.
- **Push to `main`** (`.github/workflows/firebase-hosting-merge.yml`): lint, typecheck, test, build, deploy to the live channel.

Required GitHub settings (*Settings → Secrets and variables → Actions*):

- Secret `FIREBASE_SERVICE_ACCOUNT_ARION_PARKING` (created by `firebase init hosting:github`).
- **Variables** (not secrets, since the web config is public): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.

Firestore rules are deployed with `bun run deploy:rules`, not by CI, because the hosting service account doesn't have permission to change rules.
