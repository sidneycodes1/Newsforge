# NewsForge

NewsForge is an autonomous Solana news agent built for the OOBE x Ace Data Cloud bounty. It runs a repeatable content pipeline without manual intervention, using ACE APIs to fetch news, draft an article, generate an image, and produce audio. The project ships with a live dashboard so judges and recruiters can review runs, outputs, and token usage.

## What is NewsForge?

NewsForge turns a topic into a published news package on a schedule. The frontend shows live status and run history, while the backend agent does the work in the background. It is designed to prove real ACE Data Cloud usage in a production-style repo, not just a demo script.

## How It Works

1. Fetch news - the agent pulls current headlines and source snippets for the selected topic.
2. Write article - ACE generates a short, factual summary with the key takeaways.
3. Generate media - ACE creates a cover image and an audio version of the story.
4. Save results - the run, outputs, and token usage are stored for audit and review.

## Architecture

```text
User -> Next.js Dashboard -> API Routes -> SQLite
                         \-> Node.js Agent -> ACE APIs
                                            -> Output Files
```

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Node.js agent, cron runner, SQLite via better-sqlite-style libsql client |
| APIs | ACE Serp/News, ACE Chat, ACE Image/Flux, ACE Audio |
| Deployment | Railway for the app and agent, GitHub for source control |

## Quick Start

1. Clone the repo: `git clone https://github.com/sidneycodes1/Newsforge`
2. Enter the project: `cd Newsforge`
3. Install dependencies: `npm install`
4. Create your local env file: copy `.env.example` to `.env.local`
5. Start the dashboard: `npm run dev`

## Project Structure

- `frontend/` - Next.js app router pages, UI components, API routes, and server helpers.
- `agent/` - autonomous worker, cron runtime, ACE service calls, and database writes.
- `shared/` - reusable utilities and shared type definitions used by both sides.
- `config/` - environment templates and runtime config that should stay versioned.
- `docs/` - submission docs, architecture notes, and supporting artifacts.
- `scripts/` - maintenance, setup, and validation scripts for local or CI use.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `ACE_PLATFORM_TOKEN` | Yes | Authenticates the agent against ACE Data Cloud |
| `CRON_SCHEDULE` | Yes | Controls how often the agent runs, for example every 15 minutes |
| `DATABASE_PATH` | Yes | Path to the SQLite database used by the dashboard and agent |

Optional variables such as `AGENT_TOPIC`, `NEXT_PUBLIC_API_URL`, and output paths can be set for local testing or deployment overrides.

## Running the Agent

Start the dashboard with `npm run dev`, then launch the agent with `npm run agent` after the database and environment variables are in place. The agent will run on its schedule, write outputs to disk, and update the dashboard with each run. For deployment, Railway should run the agent process while the web service serves the frontend.

## Verify It Works

1. Open the dashboard and confirm the home page loads.
2. Trigger a manual run from the dashboard.
3. Check that the run moves through fetch, article, image, and audio steps.
4. Open Run History and confirm the new run is listed.
5. Open the run detail page and verify the generated outputs are attached.
6. Check the settings page to confirm the topic and schedule can be read and saved.

## Bounty Submission

This repository is submitted under the OOBE x Ace Data Cloud bounty, Category 2: Ace Data Cloud Usage. The implementation demonstrates direct ACE consumption across multiple steps of an autonomous workflow, including news retrieval, article generation, image generation, and audio generation. The dashboard and run history provide visible proof of execution, while token tracking supports review of usage efficiency.

## Live Demo

- Dashboard: https://newsforge-backend.up.railway.app
- Run History: https://newsforge-backend.up.railway.app/history
- Settings: https://newsforge-backend.up.railway.app/settings
- GitHub: https://github.com/sidneycodes1/Newsforge

## Future Improvements

- Phase 2: add onchain receipts so each run can be verified from a public transaction trail.
- Phase 3: add zero-knowledge proofs for stronger provenance and privacy-preserving verification.

## Contributing & Attribution

Contributions should preserve the autonomous agent flow and keep the ACE integration visible for bounty review. If you open a pull request, include a short note explaining what changed, how to test it, and whether it affects token usage or run output. NewsForge is built for the OOBE x Ace Data Cloud bounty and is intended for judge review, recruiter screening, and technical demonstration.
