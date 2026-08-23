# SEO routines — connector state re-measured (2026-08-23)

Follow-up to `seo-BLOCKED-2026-08-22.md`, written after the owner said DataForSEO "is connected
because we use it for MedMeister" — which turned out to be true, on a route this repo's routine
docs did not know existed. The routes have shifted; the numbers still have not arrived.

## What was measured today

| Check | Result |
|---|---|
| `api.dataforseo.com` direct HTTPS | still **`CONNECT tunnel failed, 403`** — network policy unchanged |
| DataForSEO MCP tools in session | still absent (blocked by the same policy) |
| **DataForSEO via Zapier** | **connected** — the "DataForSEO" Zapier app is enabled with 25 actions and one live connection (created 2026-07-16, not stale) |
| A search-volume call through it | **`insufficient tasks on account`** |
| A domain-rank call through it (different endpoint family) | **`insufficient tasks on account`** — account-level, not endpoint-level |

## The route nobody documented here

The sibling MedMeister repo's own README (`kp-med/docs/seo-routines/README.md`) states plainly:
the `.mcp.json` MCP route **has never worked** there either — *"every cycle that produced real
DataForSEO data got it through a Zapier connection instead."* That Zapier route is visible from
this session and is the one to use until (or instead of) the network allowlist. The routine
prompts in this directory assume the MCP route; see the README section added alongside this note.

## Why "insufficient tasks" is not yet a diagnosis

MedMeister's README documents this exact error string as a trap: on 2026-08-10 it read as "top up
the account", and on 2026-08-12 the account was found holding **$49.37 with ~908 days of runway**
— the connection was the problem, not the balance. Today's state differs from 08-12 in one way:
back then the Zapier connection had vanished entirely; now one exists and answers, but whatever
DataForSEO account it authenticates against reports no available tasks.

Two possibilities, distinguishable only from the DataForSEO dashboard (the domain is blocked from
agent sessions):

1. **The Zapier connection uses credentials of a different, unfunded DataForSEO account.** The
   documented #1 setup mistake: the API password is a separate credential from the dashboard
   login password.
2. The funded account has actually drained since 2026-08-12 (unlikely at ~$1.63/month measured).

## Owner action (one check, then one of two fixes)

1. Log into dataforseo.com → confirm which account holds the balance, and copy that account's
   **API login + API password** (Settings → API Access).
2. Reconnect the Zapier "DataForSEO" connection with those credentials (the reconnect link is
   available from any agent session via `list_zapier_connections`), **or** top up the account the
   connection actually uses.

The first successful call after that should be the batched Germany/German search-volume request
for the guide keyword set in `measurement-fortnightly.md` Phase 1b — it was prepared and attempted
today and will run unchanged.

## What was deliberately NOT done

No keyword volumes, ranks, difficulties or SERP claims were produced by other means. A web search
can be dressed up as a rank measurement; doing so would poison every future comparison. The
tracking CSV still holds only its header.
