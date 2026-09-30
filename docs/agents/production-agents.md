# Production agents

The area agents in `.claude/agents/` (see `PROTOCOL.md`) are sessions that open PRs. The agents
here are different: they run **in production**, as Netlify functions, on a schedule, with no
session attached. They share two things:

- **`OWNER_ALERT_EMAIL`** — the one inbox every production agent writes to. Unset means fail
  closed: an agent records what it found and sends nothing.
- **`public.agent_incidents`** — one ledger of problems, each owned by one area
  (`owner_agent`), so an area agent starts its run by reading its open incidents instead of
  rediscovering them (`migrations/2026-09-29-agent-incidents.sql`, service role only). The
  support agent (below) keeps its state on the tickets themselves and writes no incidents.

## Sentinel

`netlify/functions/sentinel.mjs` (checks: `netlify/functions/_shared/sentinelLib.mjs`, tests:
`tests/sentinel.test.mjs`). Hourly at **:50** (`schedule('50 * * * *')`, mirrored in
`netlify.toml`). It looks at what fails silently, records every problem in `agent_incidents`, and
mails the owner **one digest per run containing only the problems it has not mailed before** — or,
when Supabase itself is unreachable, one short stateless fallback mail instead (below).

**Status: ships off.** It does nothing until `SENTINEL_ENABLED=true`, and it sends no digest
until `migrations/2026-09-29-agent-incidents.sql` is applied (no claim, no digest — only the hourly
"Supabase unreachable" fallback naming the missing table). Apply the migration first.

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
- **Supabase unreachable — the one stateless mail.** The ledger is the database, so when the DB probe
  (the first `profiles` count) fails or the claim errors, nothing can be claimed and **no digest** is
  sent. Instead the run sends ONE short mail: subject
  `[DM sentinel] Supabase unreachable — <first error line>`, body with the hint
  "check get_project status; restore_project if INACTIVE" (the Supabase connector; the project was
  paused on 2026-09-14). It is not deduplicated: it **repeats every hour** while the database stays
  down, on purpose — it is critical. If the error names `agent_incidents`, the migration is simply not
  applied yet. It obeys `SENTINEL_ENABLED`, `SENTINEL_MUTE=db-down`, and the `OWNER_ALERT_EMAIL` /
  `RESEND_API_KEY` fail-closed rules; `?dry=1` reports it (`dbError`) and sends nothing.
- If Resend fails after a successful claim, the incident stays recorded with `notified_at` null and
  is not retried (at most one lost mail, never a duplicate).

### Silencing

- **One check:** add its `check_id` prefix to `SENTINEL_MUTE`, e.g. `SENTINEL_MUTE=signups,page:/faq/`.
  The incidents are still claimed and recorded, just never mailed; the digest footer counts them.
- **The Supabase-unreachable fallback:** `SENTINEL_MUTE=db-down` (it has no ledger row to resolve).
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

## Support agent

`netlify/functions/support-agent.mjs` (rules: `netlify/functions/_shared/supportAgentLib.mjs`, the
send path: `adminSupportLib.sendTicketReply`, the catalogue it may quote:
`_shared/supportCatalog.mjs` + `_shared/pricing.mjs`, tests: `tests/support-agent.test.mjs`). Every
5 minutes (`schedule('*/5 * * * *')`, mirrored in `netlify.toml`). It drafts replies to open support
tickets from verified facts only, holds each reply so a person can stop it, never answers the
topics a machine must not answer, and mails the owner one message per event.

**Status: ships off.** `SUPPORT_AGENT_MODE` unset means `off`: every run is a no-op. It needs **no
migration**: drafts are `support_ticket_messages` rows the existing CHECK constraints allow, and
its state lives in `support_tickets.tags` and `support_tickets.context.ai_agent`. It does not use
`agent_incidents`.

### Modes

| `SUPPORT_AGENT_MODE` | What happens |
|---|---|
| unset / `off` / anything else | Nothing. The kill switch. |
| `draft` | Drafts, escalates, tags and mails the owner. **Never mails a customer.** A draft made in this mode is never sent automatically, even after switching to `send`. |
| `send` | As `draft`, and a held draft is mailed to the customer once the hold has passed and nobody acted on the ticket. |

Fails closed: without `OWNER_ALERT_EMAIL` **or** `RESEND_API_KEY` the run does nothing at all (no
draft, no customer mail, no owner mail) and logs `fail closed: … not set`. A reply nobody can be told
about is a reply nobody can stop.

### Environment

| Variable | Required | Meaning |
|---|---|---|
| `SUPPORT_AGENT_MODE` | yes | `off` (default) · `draft` · `send`. |
| `OWNER_ALERT_EMAIL` | yes | Where the owner mail goes. Unset → inert. Shared with the sentinel. |
| `RESEND_API_KEY` | yes | Already set for the other mailers. Unset → inert. |
| `ANTHROPIC_API_KEY` | for drafts | Already set (evaluate-writing, explain-answer). Unset → no drafts; each ticket is mailed to the owner as "not answered". Model: `claude-sonnet-4-6`, the same constant as `evaluate-writing.mjs`. |
| `SUPPORT_AGENT_HOLD_MINUTES` | no | How long a send-mode draft waits before it may go out. Default **10**; 1–1440, anything else → 10. |
| `SUPPORT_AGENT_NOTIFY_DRAFTS` | no | `false` stops the "new ticket + draft queued" mail. Escalations, follow-ups, blocked drafts, failed sends and content requests are always mailed. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Already set. Missing → 500. |
| `CAMPAIGN_SECRET` | manual runs | `?secret=` for a manual run. The scheduler needs none (`next_run` marker). |

Preview without writing: `…/.netlify/functions/support-agent?secret=<CAMPAIGN_SECRET>&dry=1` reports
what it would do (no model call); add `&preview=1` to also call the model and return the drafts it
would store, with the validator's verdict. Neither writes, tags or mails anything.

### What one run does

1. **Pending drafts first.** A held AI reply is sent only when **all** hold: it was drafted in `send`
   mode, the mode is still `send`, `SUPPORT_AGENT_HOLD_MINUTES` have passed, it still passes the
   validator, and **nobody acted on the ticket since it was drafted** — no team message or note, no
   admin action row (status change, close, stop), no status / assignee / priority change, no new
   customer message. Anything that can never become sendable (a human acted, the customer wrote
   again, older than 24 h, no email address, no draft metadata) stops the draft instead. The send
   is `sendTicketReply`, the same path the admin "Antworten" button uses: the draft row is claimed by
   a conditional update (internal + queued → public) **before** Resend is called; `sent` or
   `failed` is recorded on the row; a **failed send does not count as an answer** (no
   `first_response_at`, status unchanged) and is mailed to the owner.
2. **New customer messages.** An open ticket whose latest public message is the customer's is handled
   once per message (tag `ai:seen:<message id>`), at most 2 model calls per run (the rest wait,
   unclaimed, for the next run). Messages older than 72 h are left to people and the sentinel's
   SLA check. In order:
   - **A person already has it** (assigned, or a team message / admin action after the message):
     left alone; a follow-up is still mailed to the owner.
   - **Never answered** — deterministic German + English rules, no model call: cancellation /
     Kündigung, refund / Erstattung / Rückerstattung / Geld zurück / Widerruf, account or data
     deletion (Löschung, DSGVO, GDPR), billing dispute / chargeback / Rückbuchung / charged twice,
     legal / complaint / Anwalt / Verbraucherzentrale / scam, abuse. The ticket gets
     `ai:escalated:<reason>`; the owner is mailed once. The model can escalate too (same reasons, or
     `needs-human` when the facts do not answer the question).
   - **Content we do not have** (C1/C2, TestDaF, DSH, ÖSD, an exam level with no track, or a topic
     the model names that is not in the library): `content-request:<topic>`, one owner mail per
     ticket and topic, and the reply still says honestly that it is not available yet.
   - **Otherwise the model drafts** from a facts object built from the customer's own account
     (profile trial dates, level, `is_subscribed`; the latest subscription's status and renewal;
     active purchases; the levels open now, computed as `hasLevelAccess` does) and the catalogue
     (prices from the synced pricing copy, grammar topics from `grammar_topics`, courses, exam
     tracks, mock exams, guides, page links) — nothing else. The thread it sees is public messages
     only. German replies use „Sie“; the signature is „Das DeutschMeister-Team“ / "The
     DeutschMeister team", never a person; the last line discloses that an AI assistant wrote it and
     that replying reaches a person.
   - **Validated before it is stored** (`validateReply`): disclosure present as the last line, team
     signature, no personal-name sign-off, no claim of an action it did not take ("ich habe …
     erstattet", "we've reset"), no refund / cancellation / deletion promise, no euro amount that is
     not a catalogue price, no URL or address outside `deutsch-meister.de` and
     `https://deutsch-meister.lemonsqueezy.com/billing`. A failed check stores the text as a
     **blocked** internal row (never sendable) and mails the owner the reasons.
   - A passing draft is stored as a `support_ticket_messages` row with `author_type = 'system'`,
     `visibility = 'internal'`, `delivery_status = 'queued'` and a body starting `[KI-Entwurf]`,
     plus `context.ai_agent` (draft id, mode, language, send time, the status / assignee / priority
     it was drafted against) and the tag `ai:draft:<id>`. A ticket staff typed in by hand
     (`context.intake = 'admin'`) is always drafted as a suggestion, never auto-sent.

### What gets mailed

One plain-text mail per event to `OWNER_ALERT_EMAIL`, from `DeutschMeister Support-Agent`, each
linking `https://deutsch-meister.de/admin/support?ticket=<id>`. Each is claimed through a ticket tag
(`ai:mail:<kind>:<id>`, a conditional update) **before** it is sent, so a second run never repeats it;
if Resend then fails, the mail is lost (logged), never duplicated.

| Event | Subject starts | When |
|---|---|---|
| Draft queued | `[DM support] KI-Entwurf sendet HH:MM UTC` / `… bereit (Entwurfsmodus)` | a new ticket was drafted (off with `SUPPORT_AGENT_NOTIFY_DRAFTS=false`); the mail holds the draft, the send time and how to stop it |
| Customer wrote again | `[DM support] Kunde hat erneut geschrieben` | a customer message after a team answer (always mailed) |
| Not answered | `[DM support] Nicht beantwortet: <reason>` | escalation (rules or model) |
| Blocked / no model | `[DM support] KI-Antwort nicht gesendet` | validator failed, model error, no email address, no `ANTHROPIC_API_KEY` |
| Content request | `[DM support] Inhalt gewünscht, den es nicht gibt: <topic>` | once per ticket and topic |
| Send failed | `[DM support] Versand fehlgeschlagen` | Resend refused the customer mail; the ticket still counts as unanswered |

### Stopping a reply

- **One reply:** Admin → Support → the ticket → **„KI-Antwort stoppen“** beside the queued draft
  (`admin-support` action `cancel_ai_draft`, capability `support.write`, audited). „In Antwort
  übernehmen“ copies a draft (or a blocked one) into the reply box instead.
- **Implicitly:** any note, reply, status, priority or assignee change, or closing the ticket stops
  every pending draft on it (audited as `support.cancel_ai_draft`, reason `implicit: …`). The agent
  itself also re-checks for human activity before every send.
- **Everything:** `SUPPORT_AGENT_MODE=draft` (keeps drafting, sends nothing) or `off`.

### Switching it on (owner)

1. Confirm `OWNER_ALERT_EMAIL`, `RESEND_API_KEY` and `ANTHROPIC_API_KEY` are set in Netlify →
   Environment variables (functions scope).
2. Preview: `…/support-agent?secret=<CAMPAIGN_SECRET>&dry=1&preview=1` on a day with an open ticket.
3. Set `SUPPORT_AGENT_MODE=draft`. Read the next few drafts in the admin screen and the mails; use
   „In Antwort übernehmen“ when one is good. Nothing reaches a customer in this mode.
4. After a few tickets whose drafts you would have sent unchanged, set `SUPPORT_AGENT_MODE=send`.
   Every reply still waits `SUPPORT_AGENT_HOLD_MINUTES` and every "draft queued" mail says when it
   will go out.
5. To stop at once: `SUPPORT_AGENT_MODE=off` (or `draft`).

### Known limits

- **Customer follow-ups have no in-app path today.** Replies to a support mail go to
  `kontakt@deutsch-meister.de` by email; nothing adds them to the ticket, so "customer wrote again"
  fires only for a follow-up that is logged on the ticket. The rule is in place for when an inbound
  path exists.
- Tag claims are a read-then-conditional-write (`NOT tags @> {tag}`). The agent is the only writer
  of `tags` and runs are 5 minutes apart and end within 30 s, so a lost tag needs a manual run
  overlapping a scheduled one; the worst case is one repeated owner mail, never a repeated customer
  mail (the customer send is claimed on the message row).
- The keyword rules are deliberately broad (e.g. any "cancel", "Beschwerde", "scam"): a false
  positive costs a human reply, a false negative could cost a wrong promise.
