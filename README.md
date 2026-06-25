# Mayday Golf Tracker

Ryder Cup-style match play scoring app for 20 players, 3 rounds.

## Setup

### 1. Install Node.js

```bash
brew install node
```

### 2. Install dependencies

```bash
cd ~/Repos/MaydayTracker
npm install
```

### 3. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `mayday-golf` → Continue
3. Disable Google Analytics (not needed) → Create project
4. In the sidebar: **Build → Firestore Database** → Create database
   - Choose **Start in test mode** (we'll use permissive rules)
   - Pick the closest region (e.g. `us-central1`)
5. In the sidebar: **Project Settings** (gear icon) → **Your apps** → click `</>` (Web)
   - Register app as `mayday-web`
   - Copy the `firebaseConfig` values

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the Firebase config values from step 3.
Set `VITE_ADMIN_PIN` to whatever PIN you want for admin access.

### 4b. Enable player sign-in

In Firebase Console:

1. Go to **Build → Authentication**
2. Click **Get started**
3. Open **Sign-in method**
4. Enable **Email/Password**

Players can then use `/my-player` to create an account or sign in with the email assigned to them in Admin → Players.
Admin can still override handicap and tees from Admin → Players.

### 5. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`

### 6. Check before publishing

```bash
npm test
npm run build
```

---

## Deploy to Cloudflare Pages

### Option A — Direct upload (simplest)

```bash
npm run build
npx wrangler pages deploy dist --project-name=mayday-golf
```

Then in Cloudflare dashboard → Pages → mayday-golf → Settings → Custom Domains → add your domain.

### Option B — GitHub CI (recommended for ongoing updates)

1. Push this repo to GitHub
2. In Cloudflare dashboard → **Pages** → **Create a project** → **Connect to Git**
3. Select your repo
4. Build settings:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
5. **Environment variables** → add all `VITE_*` variables from your `.env`
6. Deploy

---

## Usage

### Admin setup (do this before the trip)

1. Go to `/admin` → enter PIN
2. **Trips tab**: add the trip, trip-specific team names, captains, and optional background
3. **Players tab**: add all 20 players with handicaps, or import a CSV
4. **Players tab**: assign Team A rivals from Team B for rivalry singles
5. **Rounds tab**: add 3 rounds — enter course name + the stroke index for each hole (from the scorecard)
6. **Matchups tab**: choose Singles or Fourball, then tap player pills to build matches
7. **Matchups tab**: set the first tee time and apply 10-minute tee-time increments if needed

Player CSV import accepts these headers:

```csv
name,email,team,handicap,teebox,rival
player_a,player_a@example.com,A,12.4,White,player_b
```

Existing players are matched by email first, then name.

### During the round

- Share the app URL with everyone
- Each match shows on the scoreboard — tap it to open the scoring sheet
- Enter gross scores hole by hole — match result updates live
- If a group did not score live, open the match and use **Manual Result** to enter total strokes and assign 1 / .5 points
- Tap **Finalize Match** when done

### Scoreboard

- Home page shows team totals + per-round breakdown
- Updates in real time across all devices

### Audit trail

- Every app write to config, trips, players, rounds, saved courses, solo rounds, matchups, and itinerary events also writes an append-only `auditEvents` document.
- Admin → Audit shows the latest 100 changes with document path, action, actor, changed fields, and before/after payloads.
- Signed-in solo users are attributed by Firebase Auth UID/email. PIN-only admin changes are recorded as unauthenticated app-user changes until admin actions move behind Firebase Auth.

---

## Handicap math

Singles uses standard match play handicap allocation:
- `strokes = |handicap_A - handicap_B|`
- The higher-handicap player receives strokes on the holes where the hole's stroke index ≤ strokes
- For differences > 18, the player gets 2 strokes on the hardest holes

Fourball uses the lowest handicap in the match as the scratch anchor:
- Each of the other 3 players receives the difference between their handicap and the lowest handicap
- The team score for a hole is the lowest net score entered by either partner
- A hole counts once at least one player on each team has a score entered

Strokes are shown as colored dots next to the stroke index on the scoring sheet.
