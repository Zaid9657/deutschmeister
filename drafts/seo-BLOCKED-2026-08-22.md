# SEO routines — BLOCKED at setup (2026-08-22)

Written when the routine machinery was committed, not by a routine run. It records the measured
state of the connectors so the first real run has a baseline to compare against, and so the owner
knows exactly what to fix.

## What was measured

| Check | Command | Result |
|---|---|---|
| DataForSEO reachable | `curl -o /dev/null -w "%{http_code}" https://api.dataforseo.com/v3/appendix/user_data` | **`CONNECT tunnel failed, response 403`** |
| Google Search Console reachable | `curl -o /dev/null -w "%{http_code}" https://searchconsole.googleapis.com/` | `404` — domain answers, API reachable |
| DataForSEO MCP tools in session | agent tool list | **absent** |
| GSC MCP tools in session | agent tool list | **absent** |

## What it means

**DataForSEO is blocked at the network layer, not the credential layer.** The proxy refuses the
CONNECT before any credential is consulted, so adding `DATAFORSEO_USERNAME` and
`DATAFORSEO_PASSWORD` will change nothing on its own. `api.dataforseo.com` must be added to the
environment's outbound allowlist first. This is the identical failure the sibling MedMeister
project documented against its own environment.

**GSC is not blocked.** The domain answers, so that half needs only a service-account key in
`GSC_SERVICE_ACCOUNT_JSON` — `.claude/hooks/session-start.sh` will materialise it to
`~/.gsc-credentials.json` on the next fresh session, and `.mcp.json` already points the server
there. Note that GSC will have little to say at first: it only reports on pages Google has already
crawled, and the four guides plus the hub shipped the same day this was written.

## What was deliberately NOT done

No keyword volumes, no rank positions and no citation checks are recorded here, and
`drafts/geo-tracking.csv` is empty apart from its header. A web search can be made to *look* like a
rank measurement, and doing that would have made every future comparison worthless while appearing
productive. Rule 1 of these routines is that a missing connector produces a blocked report, not a
substitute.

One consequence worth stating plainly: the four guides shipped on 2026-08-22 were chosen on obvious
exam-name intent — people search "telc B1 Prüfung" by name — but **not on measured volume**. That
validation is the first job of the first successful run.

## Owner checklist

1. Add `api.dataforseo.com` to the environment's network allowlist. Verify: the curl above returns
   an HTTP status (401 is fine), not a tunnel error.
2. Set `DATAFORSEO_USERNAME` / `DATAFORSEO_PASSWORD` (the **API** credentials, not the dashboard
   login) on the environment.
3. Set `GSC_SERVICE_ACCOUNT_JSON` and grant that service account access to the deutsch-meister.de
   Search Console property.
4. Start a **fresh** session — environment variables only land on new boots — and confirm one
   authenticated call each way.
5. Only then create the two Routines, using the bootstrap texts in
   `docs/seo-routines/README.md`.
