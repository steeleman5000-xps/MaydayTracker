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

### 5. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`

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
2. **Setup tab**: set team names (e.g. USA / Europe)
3. **Players tab**: add all 20 players with handicaps
4. **Rounds tab**: add 3 rounds — enter course name + the stroke index for each hole (from the scorecard)
5. **Matchups tab**: pair up Team A vs Team B players for each round

### During the round

- Share the app URL with everyone
- Each match shows on the scoreboard — tap it to open the scoring sheet
- Enter gross scores hole by hole — match result updates live
- Tap **Finalize Match** when done

### Scoreboard

- Home page shows team totals + per-round breakdown
- Updates in real time across all devices

---

## Handicap math

This uses standard match play handicap allocation:
- `strokes = |handicap_A - handicap_B|`
- The higher-handicap player receives strokes on the holes where the hole's stroke index ≤ strokes
- For differences > 18, the player gets 2 strokes on the hardest holes

Strokes are shown as colored dots (·) next to the stroke index on the scoring sheet.
