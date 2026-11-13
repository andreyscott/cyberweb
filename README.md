# cyberSec_

A cybersecurity acronym dictionary with quizzes and spaced-repetition flashcards.
Built with Next.js 16 and TypeScript, designed to run free at launch and scale to
thousands of concurrent users by changing plans, not code.

## Features

- **Dictionary**: 120 acronyms with meaning, origin, and scope; A–Z, by domain, and by framework (NIST CSF, MITRE ATT&CK, OWASP, OSI…). Acronyms with several meanings (MAC, PAM, SOC, CSP) are flagged.
- **Instant search**: press `/` or `Ctrl+K`. Runs in the browser, so it costs no server time.
- **Quizzes**: quick 10, 90-second timed sprint, by domain, scenario mode, and missed questions. Every answer is explained. 266 questions (26 hand-written scenarios plus 2 generated per acronym).
- **Readiness score**: per-domain mastery from your quiz history, pointing you at your weakest area.
- **Flashcards**: FSRS scheduling (the algorithm Anki uses), stored in IndexedDB on the device.
- **Optional sync**: progress events are queued locally and sent to Postgres when a database is configured.

## Run it locally

Requires Node.js 20.9 or later.

```bash
npm install
cp .env.example .env.local   # optional: the site runs without a database
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run validate` (checks the dataset), `npm run typecheck`, `npm run build`.

## Deploy for free

1. Push this folder to a GitHub repository.
2. **Vercel** (Hobby, free): import the repo. Set `NEXT_PUBLIC_SITE_URL` to your URL. Deploy.
3. **Neon** (Free, optional): create a project, then add two variables in Vercel:
   - `DATABASE_URL`: the **pooled** connection string (host contains `-pooler`)
   - `DATABASE_URL_UNPOOLED`: the direct string
4. Create the tables from your machine: `npm run db:generate && npm run db:migrate`.
5. Check `https://your-site/api/health` returns `"database": "up"`.

Without step 3 everything still works; progress simply stays on each user's device.

## When the site starts making money

**Vercel's Hobby plan is for personal, non-commercial use only.** Once you add ads,
paid tiers, or affiliate links, move to a paid plan. The code doesn't change.

| Trigger | Free setup | Upgrade to | What changes |
|---|---|---|---|
| Site earns money (ads, subscriptions) | Vercel Hobby | **Vercel Pro** ($20/month per developer seat, usage-based beyond the included credit) | Nothing in code. Also unlocks spend limits, longer logs, more WAF rules. |
| Database storage passes 1 GB or compute hours run out | Neon Free | **Neon Launch** (usage-based) | Nothing in code. Raise `DB_POOL_MAX` only if `/api/health` latency climbs. |
| Sync abuse or a global rate limit is needed | In-memory limiter | **Upstash Redis** (free tier, then pay per request) | Replace `src/lib/rate-limit.ts` with `@upstash/ratelimit`; same function signature. |
| Need to see errors in production | Vercel's 1-hour logs | **Sentry** (free developer tier) | Add `@sentry/nextjs`. |
| Want to stay free while earning | — | **Cloudflare Workers** via the OpenNext adapter (check their current free-tier terms) | Add the adapter config; swap `attachDatabasePool` for Neon's serverless driver. |

### Why this scales to 1,000+ requests per second

- Every dictionary page is **pre-rendered at build time** (`generateStaticParams`, `dynamicParams = false`) and served from the CDN. Reading a definition never runs a function or touches the database.
- **Search runs in the browser** from a static `/search-index.json` (short fields only).
- **Quizzes and flashcards run in the browser**; answers are written to IndexedDB first.
- The only server write is `/api/sync`: batched (up to 200 events), idempotent (client UUIDs + `ON CONFLICT DO NOTHING`), validated with Zod, rate limited, and connected through **Neon's PgBouncer pooler** with a small per-instance pool registered via `attachDatabasePool`, so connections aren't dropped or leaked under load.

Verify before launch with k6: `BASE_URL=https://your-preview-url npm run loadtest`.
It ramps to 1,000 requests/second and fails if p95 latency exceeds 300 ms or more than 0.1% of requests fail.
Run it against a preview deployment, not production, and watch your plan's usage.

## Project layout

```
src/
  data/          acronyms.ts, questions.ts, taxonomy.ts (domains + models), types.ts
  lib/           content (queries), quiz (generator), readiness, search, srs (FSRS),
                 local-db (IndexedDB via Dexie), sync (outbox), rate-limit
  db/            schema.ts (Drizzle), client.ts (pooled pg)
  components/    SearchDialog, QuizPlayer, Flashcards, AcronymBrowser, progress…
  app/           pages, api/sync, api/health, search-index.json, sitemap, robots, manifest
scripts/         validate-content.ts, loadtest.js
```

## Adding or fixing an acronym

Edit `src/data/acronyms.ts`, then run `npm run validate`. It fails on duplicate slugs,
unknown domains, or broken `related` links. For an acronym with several meanings,
give each its own slug (`mac-address`, `mac-crypto`); the site links them automatically.
Two quiz questions are generated for every entry; add scenario questions in
`src/data/questions.ts`. Keep origins factual and dated, and open a pull request so
someone reviews each change.

## Security

- Security headers in `next.config.ts`: CSP, HSTS, `nosniff`, `frame-ancestors 'none'`, a strict Referrer-Policy and Permissions-Policy.
- All API input validated with Zod; request size capped at 64 KB.
- No secrets in the client; only `NEXT_PUBLIC_SITE_URL` is public.
- Target: OWASP ASVS 5.0 Level 1 before adding accounts.

## Roadmap

1. **Offline mode**: add Serwist (`@serwist/next`) to precache the app shell, `/flashcards`, and the search index. Note Serwist currently needs `next build --webpack`.
2. **Accounts** (Auth.js or a hosted provider): attach `device_id` history to a `user_id` so progress follows users across devices.
3. **Admin editor** for content, once more people contribute than can use pull requests.
4. **More question types**: "which acronym fits this scenario", image-based questions, exam-style final test.
