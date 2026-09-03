---
name: steward
description: How PRs are driven to merge in this repo — checks, conventions, and the two local traps (lockfile churn, non-idempotent prerender).
---

# PR steward conventions (deutsch-meister.de)

- **Merge method: squash**, title `<subject> (#N)`. The owner has authorised the agent
  to merge its own PRs once the gates below are green; ask only for schema changes,
  price changes, or anything that sends email.
- **Gates that must be green before a push** (mirror of `.github/workflows/ci.yml`):
  `npm run lint` (zero warnings), `npm run check:duplicates`, `npm test`,
  `node --check` on every function, SPA build, offline Astro build from
  `grammar-content-cache.json`, the netlify.toml copy steps, `prerender-spa-routes.mjs`,
  `check-built-html.mjs dist`. The exact sequence is in CI; run it from a clean `dist/`
  because the prerender script is **not idempotent**.
- **Never commit `astro-site/package-lock.json`** — the session-start hook rewrites it on
  every resume; `git checkout -- astro-site/package-lock.json` before committing.
- After a merge, restart the working branch from `origin/main` (`git checkout -B <branch>
  origin/main`); a merged PR is never reused for new work.
- A doc-only PR still goes through CI; a code PR additionally gets a Playwright screenshot
  of the changed surface (see `docs/HANDOFF-2026-09-03.md` §9 for the executablePath trick).
- Netlify auto-deploys `main`; verify with the Netlify connector (`get-deploy-for-site`),
  not by fetching the site — `deutsch-meister.de` is egress-blocked from agent sessions.
