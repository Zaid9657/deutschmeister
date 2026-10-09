# DeutschMeister SEO Routines

Two scheduled Claude Code Routines are meant to drive SEO/GEO work on deutsch-meister.de.
**Their prompt bodies live in this directory**, not in the Routines UI — the UI holds only a
three-line bootstrap that tells the agent to read and execute the file here.

| Routine                 | Prompt file                                                  | Suggested schedule (UTC) | Job                                                             |
| ----------------------- | ------------------------------------------------------------ | ------------------------ | ---------------------------------------------------------------- |
| GEO weekly              | [`geo-weekly.md`](./geo-weekly.md)                           | `0 7 * * 1` (Mon)        | Measure AI-search + organic visibility, then ship the top fix   |
| Fortnightly measurement | [`measurement-fortnightly.md`](./measurement-fortnightly.md) | `0 9 1,15 * *`           | Rank/keyword measurement → a report and prioritised content briefs |

## ⚠️ Status (2026-10-08): the GSC property exists. Both connectors are blocked on credentials, not on the network.

Re-measured in an agent session in this repo on **2026-10-08**, superseding the 2026-08-24 table
further down:

| Check                                                          | Result (2026-10-08)                     | Meaning                                                                                         |
| -------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `curl https://api.dataforseo.com/v3/appendix/user_data`         | **`401`**                               | Network open: the API itself answered (the good answer, per the rule below).                   |
| `DATAFORSEO_USERNAME` / `DATAFORSEO_PASSWORD`                  | **not set**                             | The `${VAR}` references in `.mcp.json` resolve to nothing.                                      |
| DataForSEO connector, `GET /v3/appendix/user_data`             | **`40100` not authorized**              | No authenticated call: no volumes, SERPs or audits from agent sessions.                         |
| `curl https://searchconsole.googleapis.com/webmasters/v3/sites` | **`401`**                               | Network open.                                                                                   |
| `GSC_SERVICE_ACCOUNT_JSON`                                     | **not set**                             | `.claude/hooks/session-start.sh` skips, so `~/.gsc-credentials.json` is never written.          |
| `mcp__gsc__list_properties`                                    | **error: the credentials file does not exist** | The connector stops before it asks Google anything.                                      |
| The Search Console property itself                             | **exists**                              | URL-prefix `https://deutsch-meister.de/`, verified 2026-09-06, owner account `kontakt@medmeister.eu`. |

The property row comes from Search Console's own mail, not from the connector: all nine
`sc-noreply` notices between 2026-09-06 and 2026-10-07 are addressed to the owner of
`https://deutsch-meister.de/` at `kontakt@medmeister.eu` (read on 2026-10-07 by the seo agent).

**What changed since 2026-08-24.** That day the connector's account listed only
`https://medmeister.eu/`, so this file said `deutsch-meister.de` was not a verified property. It was
verified on 2026-09-06, under `kontakt@medmeister.eu`. Whether a service account has been added as a
user on it since cannot be read from here until a credential arrives, so Step 1 makes sure. The
08-24 "DataForSEO works" no longer holds either: both variables were set then, and neither is set in
agent sessions now. The network fix still holds (a `401`, not a tunnel error).

Consequences: **no impressions, clicks, average position, URL Inspection, Indexing API,
sitemap-submission status or CrUX field data for this site, and no DataForSEO volumes or SERPs.**
That disables every GSC step in both Routines (`geo-weekly.md` §1d and `measurement-fortnightly.md`
§1a in particular) and the DataForSEO steps too; with both connectors unavailable `geo-weekly.md`
Phase 0 writes the BLOCKED report and stops. Never substitute another source.

The owner actions are Step 1 and Step 2 below: give a service account access to the existing
property, then put the credentials into the environment. Do not verify the property again.

### The 2026-08-24 measurement (superseded)

| Check                                                     | Result                | Meaning (on 2026-08-24)                                                      |
| --------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------- |
| `curl https://api.dataforseo.com/v3/appendix/user_data`    | **`401`**             | Network allowlist **fixed**. By this file's own rule below, 401 is the good answer. |
| `DATAFORSEO_USERNAME` / `DATAFORSEO_PASSWORD`             | both **set**          | The `${VAR}` references in `.mcp.json` resolve.                              |
| Live batched `keywords_data/google_ads/search_volume`      | **real volumes**      | Authenticated **and in credit**.                                             |
| `mcp__gsc__list_properties`                                | `https://medmeister.eu/` **only** | The authorised account had no `deutsch-meister.de` property (verified later, on 2026-09-06). |

The 2026-08-22 diagnosis before it (the proxy refused CONNECT to `api.dataforseo.com` before any
credential was consulted) was correct when written; the allowlist was fixed by 2026-08-24.

Diagnose at any time with:

```bash
curl -sS "$HTTPS_PROXY/__agentproxy/status"          # a connect_rejected entry names the domain
curl -sS -o /dev/null -w "%{http_code}" https://api.dataforseo.com/v3/appendix/user_data
```

A `401` from that second command is **good** — it means the API itself answered and only the
credential was wrong. `CONNECT tunnel failed, 403` means the network policy.

## Why the prompts live in the repo, not in the Routines UI

A Routine created through the UI or the HTTP API **cannot be edited by an agent** — an agent may
only change Routines it created itself. A prompt that lives only in the UI also drifts silently
from anything written about it in the repo, which is precisely the doc-rot this codebase keeps
catching. Hosting the body here makes each prompt version-controlled and reviewable in a PR, and
future changes ship as ordinary commits. The UI pointer never has to change again.

## The UI bootstrap texts (paste once, then never touch)

**GEO weekly** — cron `0 7 * * 1`:

> You are the DeutschMeister GEO weekly routine. Open the Zaid9657/deutschmeister repo, read
> `docs/seo-routines/geo-weekly.md` on the main branch, and execute it exactly as written. If the
> file is missing or unreadable, stop and report that rather than improvising.

**Fortnightly measurement** — cron `0 9 1,15 * *`:

> You are the DeutschMeister SEO measurement routine. Open the Zaid9657/deutschmeister repo, read
> `docs/seo-routines/measurement-fortnightly.md` on the main branch, and execute it exactly as
> written. If the file is missing or unreadable, stop and report that rather than improvising.

Create both as **fresh-session** Routines (not bound to a session), in the environment this repo's
sessions boot in. Do not create them until the setup below is done and verified, or their first
runs will just write BLOCKED reports.

## One-time setup (owner)

Routines fire as **fresh sessions**, so a `claude mcp add` run once in an interactive session never
reaches them. `.mcp.json` at the repo root declares both servers project-scoped instead — it is
committed and **must stay credential-free**: the values are `${VAR}` references that Claude Code
expands from the environment.

**Step 1 — give the service account access to the existing GSC property (do this first).** The
property exists: URL-prefix `https://deutsch-meister.de/`, verified on 2026-09-06, owned by the
Google account `kontakt@medmeister.eu`. Do not verify it again. Signed in as that account, open
Search Console → `https://deutsch-meister.de/` → Settings → Users and permissions, and add as a user
the service account whose key goes into `GSC_SERVICE_ACCOUNT_JSON` (Step 2). On 2026-08-24 the
connector's service account saw `https://medmeister.eu/` only, so it is not on this property unless
someone has added it since. Until Step 1 and Step 2 are both done there is no impressions, clicks,
position, URL Inspection, Indexing API or CrUX data for this site, and the GSC half of both Routines
writes a BLOCKED note.

*(The former Step 1 — adding `api.dataforseo.com` to the environment's outbound allowlist — is
**done**. It is no longer a blocker; see the status table above.)*

**Step 2 — environment variables.** Set these on the environment, never in a committed file:

| Variable                   | What                                            | Where to get it                                                                                                              |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `DATAFORSEO_USERNAME`      | DataForSEO **API login**                        | dataforseo.com → Settings → API Access                                                                                       |
| `DATAFORSEO_PASSWORD`      | DataForSEO **API password**                     | the same page. This is a **separate credential from the dashboard login password** — the most common setup mistake.          |
| `GSC_SERVICE_ACCOUNT_JSON` | full JSON of a Google service-account key       | Google Cloud → enable the Search Console API → create a service account → JSON key → grant it access to the deutsch-meister.de Search Console property (Step 1). **Not set in the agent sessions' environment on 2026-10-08: no `GSC_*` variable and no `~/.gsc-credentials.json`.** |

On 2026-10-08 neither DataForSEO variable was set in the agent sessions' environment either, and the
DataForSEO connector answered `40100` (not authorized). Env vars land only on **fresh** boots (Step 3).

`.claude/hooks/session-start.sh` writes `GSC_SERVICE_ACCOUNT_JSON` to `$HOME/.gsc-credentials.json`
(chmod 600) at session start, and `.mcp.json` points the GSC server there. When the variable is
unset the hook says so and continues — local sessions and outside contributors are unaffected.

**Step 3 — verify, in this order, in a session in this repo.** Do not skip to step 3c:

1. `curl -sS -o /dev/null -w "%{http_code}" https://api.dataforseo.com/v3/appendix/user_data`
   returns an HTTP status. `401` is fine — the API answered. A tunnel error means step 1 is not done.
2. The session-start hook printed `wrote ~/.gsc-credentials.json` and the file exists. Missing means
   the variable is not reaching containers — env vars land only on **fresh** boots, so a container
   started before you saved it will not have it.
3. One authenticated call each way: GSC `list_properties` returns the deutsch-meister.de property,
   and one cheap DataForSEO call (search volume for a single keyword) returns data.
   **Tool names appearing in the tool list proves nothing** — both servers start and list their
   tools with empty credentials. Only a call that returns data proves the connection.

## Cost model — read before writing a routine that loops

DataForSEO bills **per request, not per keyword**. A `search_volume` call accepts up to 1,000
keywords in one request for the same price as one keyword. A routine that loops one keyword at a
time therefore costs roughly a hundred times what the batched version does for identical output.
Batch every keyword list. The prompts here already do; keep it that way if you edit them.

## Division of labour

- **GSC** answers "what is *already* happening to us": impressions, clicks, average position, and
  which queries we actually surface for. It only knows pages Google has seen, so a brand-new page
  is invisible to it for weeks.
- **DataForSEO** answers "what is out there and who holds it": search volumes, SERP composition,
  competitor positions, and on-page audits. It knows nothing about *our* performance.
- **The GEO pass** answers "do AI answer engines cite us", which neither of the above measures.

## The rules these prompts encode

Adapted from the sibling project's routines, which earned each of them:

1. **Never fabricate data.** A missing connector means the routine writes a BLOCKED report naming
   what was unavailable and stops. It does **not** substitute a plain web search for a rank
   measurement and present the result as one.
2. **Two engines, two runs.** A citation check runs each query twice per engine. Being cited in one
   of two runs is logged as *unstable*, never as a win or a regression — single-run flicker
   otherwise produces phantom movement in every report.
3. **Evidence-ranked fixes**, in this order: add a verifiable, citable figure; shape the answer
   definition-first in the top third of the page; refresh dated claims; and only then schema.
   Schema is hygiene and is never the whole fix for a week.
4. **Class A ships, Class B drafts.** Restructuring facts already on the page is Class A and may
   ship autonomously. Anything asserting a *new* fact about an exam, the law, or the product is
   Class B: it goes to `drafts/` for a human to check, and must not self-merge.
5. **One fix per cycle.** A week's run ships the single highest-leverage change, not five.
6. **A fixed query set.** Changing the queries between cycles makes the numbers incomparable, which
   is the same as having no numbers.

## The ledger

`drafts/geo-tracking.csv` is the append-only record, one row per query per run:

```
date,query,source,ai_answer_present,deutschmeister_cited,position,cited_competitors,action_taken
```

Reports land beside it as `drafts/geo-report-<date>.md`, and blocked runs as
`drafts/seo-BLOCKED-<date>.md`. Never rewrite history in the CSV — a wrong past row is corrected by
a new row plus a note in that run's report, so the trend stays auditable.
