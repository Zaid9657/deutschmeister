# DeutschMeister

German-learning platform at [deutsch-meister.de](https://deutsch-meister.de) —
grammar lessons (A1.1–B2.2), AI speaking practice, Sentence X-Ray analysis,
listening/reading exercises, level test, podcasts, and subscriptions.

## Architecture

Two front ends are **merged into one `dist/` at deploy time**:

| Layer | Tech | Lives in | Serves |
|---|---|---|---|
| SPA | Vite 5 + React 18 + react-router | `src/`, `index.html` | The app itself: auth, dashboard, lessons, speaking, X-Ray (`/app.html` shell) |
| Static site | Astro 5 (SSG) | `astro-site/` | SEO pages: `/`, `/pricing/`, `/grammar/**`, `/vergleich/*`, `/leitfaden/*`, `/privacy/`, `/impressum/`, 404 |
| Functions | Netlify Functions | `netlify/functions/` | AI speaking pipeline, X-Ray, Lemon Squeezy webhook, emails, podcast feed |
| Database | Supabase | schema SQL at root + `migrations/` | Content, auth, progress, subscriptions |

### Build choreography (netlify.toml `[build] command`)

1. `npm run build` — optimizes images, builds the SPA into `dist/`.
2. `cd astro-site && npm install && npm run build` — builds the static site
   (fetches grammar content from Supabase at build time).
3. Astro output (`grammar/`, `vergleich/`, `leitfaden/`, `pricing/`, `_astro/`,
   `404.html`, homepage, sitemap) is copied into `dist/`.
4. The SPA shell `dist/index.html` is renamed to **`dist/app.html`**; the Astro
   homepage becomes `dist/index.html`.
5. `scripts/prerender-spa-routes.mjs` clones `app.html` per public SPA route
   and injects route-specific meta + visible copy for crawlers.
6. `scripts/ping-indexnow.mjs` notifies search engines (best-effort).

### Routing

`netlify.toml` holds an **allow-list** of SPA routes rewriting to `/app.html`;
anything unmatched falls through to a real HTTP 404. **When you add a `<Route>`
in `src/App.jsx`, you must also add it to the netlify.toml allow-list** (and, if
it should be crawlable, to `scripts/prerender-spa-routes.mjs` and
`public/sitemap-spa.xml`).

## Local development

```bash
# SPA
npm ci
npm run dev            # http://localhost:5173

# Astro site
cd astro-site
npm ci
cp .env.example .env   # set PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY
npm run dev            # http://localhost:4321
```

Netlify functions run via `netlify dev` (Netlify CLI) with the env vars below.

## Environment variables

See `.env.example` for the full annotated list. Highlights:

| Variable | Used by |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | All Netlify functions (service role bypasses RLS) |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | SPA client |
| `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` | Astro build-time content fetch |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | Speaking pipeline (STT → Claude → TTS), X-Ray, evaluations |
| `RESEND_API_KEY` | All email sending |
| `CAMPAIGN_SECRET`, `UNSUB_SECRET` | **Required** — email endpoints fail closed without them |
| `WEBHOOK_SECRET` | Supabase → send-welcome-email webhook |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Payment webhook signature verification |
| `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` | Analytics (loads only after cookie consent) |
| `INDEXNOW_KEY` | Post-deploy search-engine ping |

## Netlify functions

| Function | Route | Auth |
|---|---|---|
| `speaking-session` / `speaking-turn` / `evaluate-speaking` / `save-speaking-message` / `check-speaking-usage` / `increment-speaking-usage` | `/api/speaking/*` | Supabase JWT |
| `analyze-sentence` | direct | JWT or anonymous quota |
| `lemonsqueezy-webhook` | direct | HMAC signature |
| `verify-subscription` | direct | Supabase JWT |
| `daily-sentence` | cron 07:00 UTC + `/api/daily-sentence` | scheduler payload or `?secret=` |
| `send-daily-test` | `/api/send-daily-test` | owner-only without `x-campaign-secret` |
| `send-campaign` | direct | `x-campaign-secret` |
| `send-welcome-email` | direct | bearer `WEBHOOK_SECRET` |
| `unsubscribe` | `/unsubscribe` | HMAC token |
| `podcast-feed` | `/podcast-feed.xml` | public |

## Database

Schema SQL at the repo root is **historical** (already applied by hand). New
changes go into `migrations/` — see `migrations/README.md` for how to apply
them in the Supabase SQL editor and what to re-test afterwards.

## Quality gates

```bash
npm run lint              # ESLint (errors fail; legacy warnings tolerated)
npm run check:duplicates  # SPA/Astro shared data files must stay identical
npm run build             # Vite build
npm run lighthouse        # Lighthouse against a local preview
```

CI (`.github/workflows/ci.yml`) runs lint, the duplicate check, a syntax check
of every Netlify function, and the SPA build on each PR. The Astro build runs
only on Netlify (it needs Supabase credentials).

See `EVALUATION.md` for the full audit: category scores, known issues, and the
improvement roadmap.
