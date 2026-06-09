# Last Team Standing — World Cup 2026

A Last Man Standing pool for the 2026 World Cup group stage. Pick one team to win
each round; win and you survive, lose or draw and you're out; last person standing
wins. All 18 rounds (paired groups, 4 games each) and the full fixture list with
kickoff times are built in.

Picks are hidden **on the server** until each round's lock time (the first kickoff
of that round), so nobody can peek — this is enforced in the backend, not just the UI.

## What you get
- One person creates a pool and becomes admin. Everyone else joins via the same link
  with a name + PIN. Login persists, so refreshing or navigating never logs you out.
- Pick screen shows each fixture with flags and a tap-to-pick checkbox.
- No reusing a team across the tournament (enforced server-side).
- Admin tab: share link, enter results per round, rename a team if ever needed.
- Standings: survivors, knocked-out players, each person's run of picks, auto-winner.

---

## Deploy to Vercel (about 20–30 min, free)

You'll need a free GitHub account and a free Vercel account.

### 1. Put the code on GitHub
- Create a new empty repo on GitHub (e.g. `last-team-standing`).
- Upload this whole folder to it. Either:
  - Drag-and-drop the files in the GitHub web UI ("uploading an existing file"), or
  - From a terminal in this folder:
    ```
    git init
    git add .
    git commit -m "Last Team Standing"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/last-team-standing.git
    git push -u origin main
    ```

### 2. Import into Vercel
- Go to vercel.com, sign in with GitHub, click **Add New → Project**.
- Pick your repo and click **Import**. Vercel auto-detects Next.js. Don't deploy yet —
  add the database first (next step), or deploy now and add it after; either is fine.

### 3. Add the free database (Upstash Redis)
- In your Vercel project, open the **Storage** tab.
- Click **Create Database → Upstash (Redis)**, accept the free plan, and connect it
  to this project. Vercel automatically adds the `KV_REST_API_URL` and
  `KV_REST_API_TOKEN` environment variables — you don't have to copy anything.

### 4. Deploy
- Open the **Deployments** tab and click **Redeploy** (so it picks up the database
  env vars). When it finishes you'll get a URL like
  `https://last-team-standing.vercel.app`.

### 5. Use it
- Visit your URL, create the pool (set your admin PIN, choose the draw rule).
- You'll land on the pool page at `your-url.vercel.app/world-cup-2026` (the slug
  comes from your pool name). Go to the **Admin** tab and copy the share link.
- Send that link to your group. They tap "I'm new", pick a name + PIN, and start picking.

---

## Local development (optional)
```
npm install
cp .env.local.example .env.local   # then paste your Upstash URL + token
npm run dev
```
Open http://localhost:3000.

## Notes
- Draw rule: "strict" treats a draw as elimination (classic LMS); "draw survives" is
  a common softer house rule. Either way, as admin you mark each team Won/Out per
  round, so you always have the final say.
- All 48 teams are confirmed (playoff winners resolved: Bosnia & Herzegovina, Sweden,
  Türkiye, Czechia, DR Congo, Iraq). The rename tool is there only if you ever need it.
- Kickoff/lock times are stored as absolute timestamps and shown in each viewer's own
  local timezone automatically.
```
