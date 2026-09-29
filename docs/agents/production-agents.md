# Production agents

The area agents in `.claude/agents/` (see `PROTOCOL.md`) are sessions that open PRs. The agents
here are different: they run **in production**, as Netlify functions, on a schedule, with no
session attached. They share two things:

- **`OWNER_ALERT_EMAIL`** — the one inbox every production agent writes to. Unset means fail
  closed: an agent records what it found and sends nothing.
- **`public.agent_incidents`** — one ledger of problems, each owned by one area
  (`owner_agent`), so an area agent starts its run by reading its open incidents instead of
  rediscovering them (`migrations/2026-09-29-agent-incidents.sql`, service role only).

## Sentinel

`netlify/functions/sentinel.mjs` (checks: `netlify/functions/_shared/sentinelLib.mjs`, tests:
`tests/sentinel.test.mjs`). Hourly at **:50** (`schedule('50 * * * *')`, mirrored in
`netlify.toml`). It looks at what fails silently, records every problem in `agent_incidents`, and
mails the owner **one digest per run containing only the problems it has not mailed before**.

**Status: ships off.** It does nothing until `SENTINEL_ENABLED=true`, and it can mail nothing
until `migrations/2026-09-29-agent-incidents.sql` is applied (no claim, no mail).

### Switching it on (owner)

1. Apply `migrations/2026-09-29-agent-incidents.sql` in the Supabase SQL editor.
2. In Netlify → Site configuration → Environment variables (functions scope) set
   `SENTINEL_ENABLED=true`. Leave `OWNER_ALERT_EMAIL` unset for a day if you want a silent canary:
   incidents are recorded, nothing is sent.
3. Preview without writing: `https://deutsch-meister.de/.netlify/functions/sentinel?secret=<CAMPAIGN_SECRET>&dry=1`
   returns the incident list, the passing checks and the skipped ones.
4. Set `OWNER_ALERT_EMAIL` to the inbox. The next :50 run mails what is new.
5. Refresh `tests/fixtures/db-schema.json` from the live schema and delete `agent_incidents` from
   its `pendingApply` block; mark the migration applied in `migrations/README.md`.

### Environment

| Variable | Required | Meaning |
|---|---|---|
| `SENTINEL_ENABLED` | yes | Must be exactly `true`, or every run is a no-op. The kill switch. |
| `OWNER_ALERT_EMAIL` | for mail | Digest recipient. Unset → record only, send nothing. Shared with the support agent. |
| `RESEND_API_KEY` | for mail | Already set for the other mailers. Unset → record only. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Already set. Missing → 500. |
| `CAMPAIGN_SECRET` | manual runs | `?secret=` for a manual or dry run. The scheduler needs none (`next_run` marker). |
| `SITE_URL` | no | Base for the page checks. Default `https://deutsch-meister.de`. |
| `SENTINEL_MUTE` | no | Comma-separated `check_id` prefixes to record but never mail (below). |
| `LIFECYCLE_ACTIVATION_ENABLED`, `CONFIRM_NUDGE_ENABLED`, `COURSE_REMINDER_ENABLED` | read only | A job whose gate is not `true` is skipped: it leaves no evidence by design. |

### Checks

Every check is a pure function over data the handler fetched. It returns incidents and the
`check_id`s it evaluated and found healthy. Only a check that **ran and passed** resolves an open
incident, so a failed read never looks like an all-clear.

| Check (`check_id`) | Fires when | Owner | Severity | Key (one mail per key) |
|---|---|---|---|---|
| Key pages (`page:<path>:status`) | `/`, `/pricing/`, `/grammar/`, `/grammar/a1.1/verb-sein/`, `/courses/`, `/leitfaden/`, `/leitfaden/telc-b1/`, `/vergleich/`, `/level-test/`, `/faq/`, `/support` do not answer 200 (8 s timeout) | website; **seo** for grammar, leitfaden, vergleich | critical for `/` and `/pricing/`, else high | `page:<path>:status:<day>` |
| … `:title` | empty `<title>` | same | medium | `…:title:<day>` |
| … `:h1` | not exactly one `<h1>` (Astro and prerendered pages; comments and `<noscript>` ignored) | same | medium | `…:h1:<day>` |
| … `:body` | fewer than 250 chars of visible text in `<main>` (Astro) or `<body>` (prerendered) — the `check-built-html.mjs` floor; catches an empty prerender | same | high | `…:body:<day>` |
| … `:shell` | `/support` (a pure SPA route) has no `#root` or no module script; the h1/body rules are skipped for it | website | high | `…:shell:<day>` |
| Payment webhooks (`webhook:<id>`) | a `webhook_logs` row in 48 h with `processed = false` or an `error`, older than 15 min, and no later clean row for the same event (type + `payload->data->>id`) — a retry or replay resolves it | revenue | high | `webhook:<id>` |
| Renewal failures (`payment-failed:<event>`) | a `payment_failures` row in 24 h. **Logged only** (`mailed_elsewhere`): `lemonsqueezy-webhook` already emails the owner | revenue | medium | `payment-failed:<event>` |
| Signups (`signups`) | profiles created in the last 24 h = 0, or < 40 % of the daily average of the 7 days before them **and** that average ≥ 3/day. Head-only counts, never row lists | acquisition | high (zero), medium (drop) | `signups:zero:<day>`, `signups:drop:<day>` |
| Scheduled jobs (`job-trial`, `job-activation`, `job-confirm`, `job-course`, `job-weekly`) | the job's last ledger row is older than the Monitoring thresholds (daily 30 h / 54 h, weekly 8 d / 15 d). The job list and rule are `SCHEDULED_JOBS` / `jobStaleness` in `adminStatusLib.mjs`, shared with the Monitoring screen. No evidence or gated off → skipped with a reason | retention; website for weekly-truth | medium, high past the critical threshold | `<job>:stale:<day>` |
| speaking-closeout (`job-speaking-closeout`) | an `active` speaking session is still open 90 min after its deadline (`speakingCloseout.isStale`) — the hourly closeout did not run | product | medium | `job-speaking-closeout:stale:<day>` |
| Support SLA (`support-sla:<ticket>`) | an open ticket past `sla_due_at` with no `first_response_at` | support | high for urgent/high priority, else medium | `support-sla:<ticket>:<day>` |
| Zero-turn speaking (`flow:speaking-zero-turn`) | ≥ 50 % of the ended, non-placement sessions in 24 h had no learner turn (`adminUsageLib.classifyFailure`); judged only with ≥ 5 sessions | product | high | `flow:speaking-zero-turn:<day>` |
| Evaluation coverage (`flow:eval-coverage`) | completed sessions in 24 h evaluated below the Monitoring `evalCoverage` threshold (`reconcileCoverage`); ≥ 5 sessions | product | medium, high below 0.2 | `flow:eval-coverage:<day>` |
| Database (`db:latency`) | one count round trip above the Monitoring `dbLatencyMs` threshold (2 s / 5 s) | product | medium / high | `db:latency:<day>` |

Webhook processing failures are reported once, by the webhook check under **revenue**; the broken-
flow group does not repeat them.

State-like keys carry the UTC day, so a problem that persists is mailed **once a day**, never once
an hour. Event-like keys (a webhook row, a payment event) are mailed once, ever.

### What gets mailed

- One plain-text digest per run to `OWNER_ALERT_EMAIL`, from `DeutschMeister Sentinel`, holding only
  incidents **this run claimed** (`INSERT … ON CONFLICT (key) DO NOTHING RETURNING`), grouped by
  `owner_agent`, worst first, each with one "what to check" line. No new incident → no mail.
- Never mailed: repeats of an incident already claimed; `mailed_elsewhere` rows (renewal payment
  failures); muted checks; the weekly-truth numbers (only a *missed* weekly-truth run is an
  incident).
- If the claim fails (migration not applied, Supabase down), **nothing is mailed** — the rule is no
  claim, no mail. A Supabase outage therefore reaches you through Netlify's function log, not this
  digest. If Resend fails after the claim, the incident stays recorded with `notified_at` null and is
  not retried (at most one lost mail, never a duplicate).

### Silencing

- **One check:** add its `check_id` prefix to `SENTINEL_MUTE`, e.g. `SENTINEL_MUTE=signups,page:/faq/`.
  The incidents are still claimed and recorded, just never mailed; the digest footer counts them.
- **Everything:** `SENTINEL_ENABLED=false`.
- **One incident, by hand:** `update agent_incidents set resolved_at = now() where key = '…';` — it is
  reopened (not re-mailed) if the check fires the same key again.

### Reading the ledger (area agents)

```sql
-- my open incidents, newest first
select key, severity, title, detail->>'what_to_check' as check_first, first_seen_at, seen_count
from agent_incidents where owner_agent = 'seo' and resolved_at is null order by last_seen_at desc;
```

### Not covered, on purpose

- **Email bounces.** Resend's REST API has no bounce-count endpoint; the only route is listing sent
  emails and counting their `last_event`, and whether the functions' `RESEND_API_KEY` is a
  full-access key (listing needs one; a sending-only key cannot) could not be verified from an agent
  session (`resend.com` is blocked by the egress proxy). Rather than fake a number, bounces are left
  to the retention agent's daily pulse, which reads them through the Resend connector.
- **daily-sentence** writes no ledger, so a missed run is invisible here (skipped, with the reason).
- **Quiet days:** trial/activation/confirmation/course-reminder evidence only exists when someone was
  due that day, so a stale-job incident can be a quiet day. The incident detail repeats the caveat.
- Client-side errors, Web Vitals and Search Console data (the property is not verified — see
  `docs/seo-routines/README.md`).
