# NewsForge

> Autonomous AI content pipeline agent — built for
> the OOBE × Ace Data Cloud bounty on Superteam Earn.

## What it does

NewsForge wakes up every 15 minutes and autonomously:

1. Fetches live news on a topic (ACE Serp API)
2. Writes a full 400-word article (ACE Chat API)
3. Generates a cover image (ACE Image/Flux API)
4. Generates an audio summary (ACE Fish/Suno API)

Zero human input. Fully autonomous.

## Bounty Details

- **Bounty:** OOBE × Ace Data Cloud Autonomous Agent
- **Category:** Category 2 — Ace Data Cloud Usage
- **Platform:** Superteam Earn
- **Deadline:** June 10, 2026

## ACE Services Used (4 total, 3 required)

| Step | Service | Endpoint |
|------|---------|----------|
| 1 | ACE Serp Google API | News fetching |
| 2 | ACE Chat API (GPT-4o-mini) | Article writing |
| 3 | ACE Image/Flux API | Cover image generation |
| 4 | ACE Fish/Suno API | Audio generation |

## Live Demo

- **Dashboard:** [Add Vercel/Railway URL after deploy]
- **GitHub:** https://github.com/sidneycodes1/newsforge
- **Agent visible at:** Synapse Explorer (Category 2)

## Setup

### Prerequisites
- Node.js 18+
- pnpm or npm
- ACE Data Cloud account (free tier)

### Installation

```bash
git clone https://github.com/sidneycodes1/newsforge
cd newsforge
npm install
cp .env.example .env.local
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| ACE_PLATFORM_TOKEN | Yes | From platform.acedata.cloud |
| CRON_SCHEDULE | Yes | e.g. "*/15 * * * *" |
| AGENT_TOPIC | Yes | Topic to cover |
| DATABASE_PATH | Yes | SQLite DB path |
| OUTPUTS_DIR | Yes | Output folder path |

### Run locally

```bash
# Terminal 1 — Dashboard
npm run dev

# Terminal 2 — Agent worker
npm run agent
```

### Trigger a manual run

Click "Trigger Now" in the dashboard at
localhost:3000 (or your deployed URL).

## Deployment

### Dashboard — Vercel
1. Import repo at vercel.com
2. Add all env vars
3. Deploy (auto-detects Next.js)

### Agent Worker — Railway
1. New project → Deploy from GitHub
2. Add all env vars
3. Start command: `npm run agent`

## How it works
