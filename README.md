# Startup Scout

Finds UK startups that run Next.js (or another modern JS framework) somewhere other than Vercel, scores why they need Vercel now, and drafts the first outreach for a person to review. Nothing is sent.

It is the outbound counterpart to Vercel's open-source [Lead Agent](https://github.com/vercel-labs/lead-agent), which handles inbound leads. This project started from that template.

**Live:** https://startup-scout-eight.vercel.app

## How it works

```
Run Scout (page)
     ↓
POST /api/scout  ← BotID check, one run at a time
     ↓
start(workflowScout)  ← Workflow SDK: every step retried and checkpointed
     ↓
1. Find      newest active UK companies from the public YC directory + pasted domains
2. Check     host and framework from response headers and HTML (site + app subdomain)
3. Score     0–100 with itemised reasons; sites already on Vercel are excluded
4. Research  founders, open roles and news from the company's public YC page (no AI)
5. Draft     email, LinkedIn note and call opener  ← AI SDK + AI Gateway
     ↓
Vercel Blob (one file per lead)  →  GET /api/leads  →  table + detail panel
```

Only step 5 uses a model, and it only sees facts that steps 1–4 observed.

## Tech stack

- **Framework**: [Next.js 16](https://nextjs.org)
- **Durable execution**: [Workflow SDK](https://workflow-sdk.dev)
- **AI**: [AI SDK 7](https://ai-sdk.dev) (`generateText` with `Output.object`) through [AI Gateway](https://vercel.com/ai-gateway)
- **Storage**: [Vercel Blob](https://vercel.com/docs/vercel-blob) (private store); a local `.data/` folder in development
- **Bot protection**: [BotID](https://vercel.com/docs/botid)
- **Design**: Geist type and tokens (`app/geist.css`)

## Scoring rules

| Signal | Points |
| --- | --- |
| Runs Next.js on a host other than Vercel | 40 |
| Runs another modern JS framework off Vercel | 15 |
| YC batch in the last 12 months | 20 |
| YC batch in the last 3 years | 10 |
| Hiring now | 15 |
| Team of 5 to 75 people | 10 |
| Builds AI products | 10 |
| Already on Vercel | Excluded |

Drafts are written only for leads with a stack signal (one of the first two rows).

## Getting started

Prerequisites: Node.js 20+, pnpm, and the [Vercel CLI](https://vercel.com/docs/cli).

```bash
pnpm install
vercel link
vercel env pull .env.local   # VERCEL_OIDC_TOKEN authenticates AI Gateway
pnpm dev
```

Open http://localhost:3000 and click **Run Scout**. Inspect runs with `npx workflow web`.

Optional: `SENDER_NAME` sets the name drafts are signed with (default `Ayo`).

## Code map

| Path | What it does |
| --- | --- |
| `workflows/scout/` | The workflow and its steps |
| `lib/sources.ts` | YC directory and pasted domains |
| `lib/stack.ts` | Hosting and framework detection rules |
| `lib/score.ts` | Scoring rules |
| `lib/research.ts` | Founders, roles and news from YC pages |
| `lib/drafts.ts` | The drafting prompt and model call |
| `lib/store.ts` | Blob or local file storage |
| `components/scout.tsx` | The page |

## Limits

- Public sources only. No LinkedIn scraping, no guessed email addresses, no sending.
- A CDN such as Cloudflare can hide the real host; those rows are labelled "(CDN)".
- Up to 50 companies per run; drafts for the top 10.

Built by Ayo Ahmed as an independent project; not affiliated with Vercel. Vercel, Next.js and related marks are trademarks of Vercel, Inc.
