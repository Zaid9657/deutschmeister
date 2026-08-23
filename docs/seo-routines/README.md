# DeutschMeister SEO Routines

Two scheduled Claude Code Routines are meant to drive SEO/GEO work on deutsch-meister.de.
**Their prompt bodies live in this directory**, not in the Routines UI — the UI holds only a
three-line bootstrap that tells the agent to read and execute the file here.

| Routine                 | Prompt file                                                  | Suggested schedule (UTC) | Job                                                             |
| ----------------------- | ------------------------------------------------------------ | ------------------------ | ---------------------------------------------------------------- |
| GEO weekly              | [`geo-weekly.md`](./geo-weekly.md)                           | `0 7 * * 1` (Mon)        | Measure AI-search + organic visibility, then ship the top fix   |
| Fortnightly measurement | [`measurement-fortnightly.md`](./measurement-fortnightly.md) | `0 9 1,15 * *`           | Rank/keyword measurement → a report and prioritised content briefs |

## ⚠️ Status: the machinery is here, the connectors are NOT working yet

**Nothing below runs until an owner does the setup, and one prerequisite is a network policy,
not a credential.** Measured in this repo's environment on **2026-08-22**:

| Check                                                     | Result                                  | Meaning                                                                 |
| --------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `curl https://api.dataforseo.com/v3/appendix/user_data`    | **`CONNECT tunnel failed, response 403`** | The proxy refuses the connection **before any credential is consulted**. |
| `curl https://searchconsole.googleapis.com/`               | `404`                                   | Domain reachable — the API answered. GSC can work once it has a key.     |
| DataForSEO / GSC MCP tools present in an agent session     | **No**                                  | Neither server is connected yet.                                        |

So: **perfect DataForSEO credentials will still fail today.** `api.dataforseo.com` has to be added
to the environment's network allowlist first. This is not a guess — it is the same failure the
sibling MedMeister project hit and documented, where the environment's "trusted network access"
preset does not include the domain and the gateway answers 403 to the CONNECT itself.

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

**Step 1 — network policy (do this first, it is the blocker).** Add `api.dataforseo.com` to the
outbound allowlist of the Claude Code environment this repo runs in (claude.ai → Code → the
environment → network settings). Verify with the curl above; you want a status code, not a tunnel
error.

**Step 2 — environment variables.** Set these on the environment, never in a committed file:

| Variable                   | What                                            | Where to get it                                                                                                              |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `DATAFORSEO_USERNAME`      | DataForSEO **API login**                        | dataforseo.com → Settings → API Access                                                                                       |
| `DATAFORSEO_PASSWORD`      | DataForSEO **API password**                     | the same page. This is a **separate credential from the dashboard login password** — the most common setup mistake.          |
| `GSC_SERVICE_ACCOUNT_JSON` | full JSON of a Google service-account key       | Google Cloud → enable the Search Console API → create a service account → JSON key → grant it access to the deutsch-meister.de Search Console property |

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

## The Zapier route (discovered 2026-08-23)

There are not two routes to DataForSEO but three, and the third is the only one that has ever
produced real data in this account's history: **the "DataForSEO" Zapier app**, reachable from any
agent session with the Zapier MCP connected. The sibling MedMeister repo's README says it
outright — its `.mcp.json` MCP route never worked, and *"every cycle that produced real DataForSEO
data got it through a Zapier connection instead."*

| Route | State for this repo (2026-08-23) |
|---|---|
| `.mcp.json` MCP server | dead — `api.dataforseo.com` still 403s at the proxy |
| Direct HTTPS | dead — same policy |
| **Zapier app "DataForSEO"** | **connected** (25 actions: search volume, keyword suggestions/difficulty, parsed SERP, ranked keywords, domain rank, backlinks, LLM-mentions) — but calls currently fail with `insufficient tasks on account`; see `drafts/seo-BLOCKED-2026-08-23.md` for the diagnosis and the owner fix |

When running these routines, check the Zapier route FIRST (`inspect_zapier_actions` → app
"DataForSEO"), and treat `insufficient tasks on account` as a connection-identity question before
a billing one — that string has already mis-diagnosed itself once in the sibling repo.
