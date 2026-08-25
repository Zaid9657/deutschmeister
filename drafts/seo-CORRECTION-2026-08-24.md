# SEO connectors — correction and first measurement (2026-08-24)

Supersedes the connector half of [`seo-BLOCKED-2026-08-22.md`](./seo-BLOCKED-2026-08-22.md).
That file is a dated measurement record and is **not** edited — per this project's correction
discipline, a wrong past row is corrected by a new row plus a note, so the trend stays auditable.

Written during a `claude-seo` audit run, not by one of the two scheduled Routines.

## What changed

| Check | 2026-08-22 | 2026-08-24 |
|---|---|---|
| `curl …api.dataforseo.com/v3/appendix/user_data` | `CONNECT tunnel failed, 403` | **`401`** — the API answered |
| `DATAFORSEO_USERNAME` / `DATAFORSEO_PASSWORD` | unset | **both set** |
| DataForSEO MCP in session | absent | **present, authenticated, in credit** |
| GSC MCP in session | absent | **present and authenticated** |
| `mcp__gsc__list_properties` | not run | **`https://medmeister.eu/` only** |

**The DataForSEO network blocker is gone.** The 2026-08-22 diagnosis was correct when written — the
proxy refused the CONNECT before any credential was consulted. The environment's outbound allowlist
has since been fixed. A live batched `keywords_data/google_ads/search_volume` call returned real
German volumes, which proves authentication *and* remaining credit, not just reachability.

**GSC is now the blocker, and it is neither a network nor a credential problem.**
`deutsch-meister.de` is not a verified Search Console property on the account this connector is
authorised for — the only property returned is `https://medmeister.eu/`. Consequences: **no
impressions, clicks, average position, URL Inspection, Indexing API, sitemap-submission status or
CrUX field data for this site.** That disables §1d of `geo-weekly.md` and §1a of
`measurement-fortnightly.md` outright.

Note the verification files are already committed and deployed
(`public/google4d10fa3ea1dd99b5.html`, `public/BingSiteAuth.xml`), so the property may well exist
under a **different Google account**. The owner action is to confirm which account owns it and grant
the service account access there — not to verify from scratch.

### A routine-design consequence, now fixed

`geo-weekly.md`'s Phase 0 required *both* connectors and said "then **stop**". With GSC permanently
unavailable, that gate could never pass, so the routine would have halted forever while DataForSEO
sat working and unused. Phase 0 now degrades per connector: a dead GSC skips the GSC-derived
numbers and continues; only both-dead halts. The rule against substituting a web search for a
measurement is unchanged.

## First measurement: were the four Leitfäden the right four?

`seo-BLOCKED-2026-08-22.md` closed with a standing question — the four guides were chosen on
obvious exam-name intent, **not on measured volume**, and it called validating that "the first job
of the first successful run." This is that run.

Source: DataForSEO `keywords_data/google_ads/search_volume/live`, location 2276 (Germany),
language `de`, measured 2026-08-24. Volumes are Google Ads monthly averages, which are bucketed and
should be read as magnitudes, not precise counts.

| Guide | Query | Monthly volume | Competition |
|---|---|---|---|
| **`/leitfaden/telc-b1/`** | `telc b1 prüfung` | **12,100** | LOW (33) |
| | `telc b1` | 2,900 | LOW (32) |
| | `telc b1 modelltest` | 1,600 | LOW (15) |
| **`/leitfaden/telc-b2/`** | `telc b2 prüfung` | **8,100** | MEDIUM (39) |
| | `telc b2 modelltest` | 1,300 | LOW (14) |
| **`/leitfaden/dtz/`** | `dtz prüfung` | **2,900** | LOW (16) |
| | `deutsch test für zuwanderer` | 2,400 | MEDIUM (57) |
| | `dtz modelltest` | 720 | LOW (10) |
| | `dtz test` | 210 | LOW (7) |
| **`/leitfaden/goethe-b1/`** | `goethe zertifikat b1` | **1,000** | LOW (30) |
| | `goethe b1` | 720 | LOW (20) |
| | `goethe zertifikat b1 modelltest` | 70 | LOW (9) |

**Verdict: all four guides are validated, and the intent-based choice was sound.** Ranked by
combined head + modifier volume: telc-b1 (~16.6k) > telc-b2 (~9.4k) > dtz (~6.2k) > goethe-b1
(~1.8k). Competition is LOW on almost every term — unusual at this volume, and the strongest
argument for continuing to invest here.

Two observations that follow from the data rather than from intuition:

1. **goethe-b1 is roughly an order of magnitude smaller than telc-b1.** It is not a mistake — 1,800
   combined at LOW competition is worth a page — but it should not receive equal ongoing
   investment, and the guides hub should not imply the four are equivalent in demand.
2. **"Modelltest" is a real, unclaimed modifier**: 1,600 + 1,300 + 720 + 70 ≈ **3,690/month
   combined, at competition indices of 9–15** — the lowest-competition cluster measured. This is
   practice-test intent, which is close to the product. Whether the existing guides address it is a
   content question for the next cycle, not something to conclude here.

Also measured, for context: `deutsch lernen online` 1,300 (MEDIUM 59), `einbürgerungstest deutsch`
320, `akkusativ dativ übungen` 170. `deutsch b1 prüfung` and `deutsch b2 prüfung` returned no
volume row.

## What was deliberately NOT done

- **No rank positions and no AI-citation checks.** Those belong to `geo-weekly.md`'s fixed 12-query
  set, run two engines × two runs. Measuring them ad hoc here, outside that protocol, would produce
  numbers that cannot be compared with the ledger. `drafts/geo-tracking.csv` is untouched.
- **No GSC-derived figure of any kind**, estimated or substituted.
- **No competitor pricing re-verified** — every vendor domain is still blocked by the proxy, so the
  "Stand: Mai 2026" stamp on `/vergleich/` stays exactly where it is.

## Owner checklist (replaces the 2026-08-22 list)

1. ~~Add `api.dataforseo.com` to the network allowlist.~~ **Done.**
2. ~~Set `DATAFORSEO_USERNAME` / `DATAFORSEO_PASSWORD`.~~ **Done.**
3. **Find out which Google account owns the `deutsch-meister.de` Search Console property.** The
   verification file is already live, so it probably exists somewhere. Then grant the service
   account in `GSC_SERVICE_ACCOUNT_JSON` access to it (Search Console → Settings → Users and
   permissions).
4. Once GSC returns the property, the two Routines can run at full scope. Until then `geo-weekly`
   runs partially and says so; `measurement-fortnightly` loses its first half entirely.
