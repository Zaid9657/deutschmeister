# A1.1 remediation — Phase A baseline (2026-10-05, before any code change)

Checkout `e01708d` (branch `claude/amazing-goodall-j95hp3`).

The audit artefacts the brief cites (`/workspace/a11-audit/*`) do not exist in this environment. Every finding below was re-derived against this checkout.

## Lab performance

**Setup**
- `npm run build` (vite only, no Astro merge).
- Served by `scripts/lighthouse-batch.mjs`, with gzip as on Netlify.
- Chrome 143 (`CHROME_PATH`). System Chrome 154 closes the CDP session under Lighthouse 13.
- Lighthouse default mobile throttling. Three runs per route.
- These are local lab numbers, not production and not field Core Web Vitals.

**Command**
```
node scripts/lighthouse-batch.mjs --pages=/course/a1.1,/course/a1.1/l/1 --runs=3 --out=…/lighthouse-before.json
```

| Route (mobile) | Perf (runs) | LCP (runs) | TBT (runs) | CLS | A11y |
|---|---|---|---|---|---|
| `/course/a1.1` | 70 / 59 / 61 | 3.1 / 5.1 / 5.2 s | 750 / 710 / 580 ms | 0 | 90 |
| `/course/a1.1/l/1` (intro) | 68 / 72 / 72 | 3.1 / 3.1 / 3.1 s | 1000 / 740 / 730 ms | 0 | 100 |

- Desktop scores were 95–99.
- Flagged on the hub: `mainthread-work-breakdown 5.1 s`, `bootup-time 1.3 s`, `aria-progressbar-name`, `aria-prohibited-attr`, `color-contrast`.
- Flagged on the lesson: `unused-javascript ~95 KiB`, `label-content-name-mismatch`.
- `chunks.tsv` lists every emitted JS/CSS file with its size. Largest:

| File | Size |
|---|---|
| entry `index-*.js` | 351 KB |
| `a11-*.js` | 181 KB |
| `vendor-supabase` | 173 KB |
| `vendor-react` | 165 KB |
| second `index-*.js` | 152 KB |
| `a12-*.js` (draft, never rendered) | 102 KB |
| `vendor-ui` (framer-motion) | 102 KB |
| `LessonPlayerPage` | 88 KB |

## Layout

`scripts/course-screens.mjs --tag=before` → `docs/evaluation/screenshots/a11-w3-before-*`.

| Route | 360 | 390 | 768 | 1440 |
|---|---|---|---|---|
| hub: document width | **416** | **446** | 768 | 1440 |
| L1 intro: document width | 360 | 390 | 768 | 1440 |

## Database (read-only queries through the Supabase connector; no writes)

- **Course clips:** 0 of the 168 planned. The `audio` bucket has no `course/` prefix, consistent with the empty `a11.audio.js` manifest.
- **Word recordings:** 230 of the 263 A1.1 Wortfeld words have `words.audio_url` (`audio/words/…`). The 33 without one:
  - L1: heißen, buchstabieren, Buchstabe
  - L2: Zahlen 0–10, Marokkanerin, marokkanisch, geboren, Familienstand
  - L3: sprechen
  - L4: Zahlen 11–100, Flohmarkt, verkaufen, Regal, machen
  - L5: Bild
  - L6: Telefon
  - L7: gehen, Freund, Freundin
  - L8: Viertel nach, Viertel vor, Abend
  - L9: Café, Frühstück, sofort
  - L10: weit, Durchsage
  - L11: nach Hause, mitkommen
  - L12: im Mai, Gast, Gäste einladen, Fest
- **Listening exercises:** 12 rows at A1.1.
  - Six are linked (exercise_number 1–6, status `completed`).
  - Six are unlinked (7–12, status `pending`, audio present) and topically match the six Lektionen that lack a listening link: 7 Bürgerbüro, 8 Familie und Sprachen, 9 Im Deutschkurs, 10 Hobbys am Wochenende, 11 Nachrichten auf der Mailbox, 12 Die Geburtstagsfeier.
- **Reading lessons:** 12 rows at a1.1, of which 10 are linked.
- **Historical learner data:**
  - `lesson_attempts` holds only 5 rows, all `stage='readaloud'` (2 users, 2026-10-04).
  - `lesson_progress` holds 10 a1.1 rows.
  - So almost no historical first-try data exists that a definition change could affect. Old `accuracy` values are left as recorded.

## Reproduction status

| Finding | Status | How |
|---|---|---|
| A: wrong match recorded as `typo` / `correct:true` | **Still present** | `MatchItem.jsx:79-84`, read from source (the only code path) |
| B: retries change first-try % | **Still present** | Node on the real `mastery.js`: 11/12 = 0.917; plus a revealed variant (new id) = 0.846 |
| C: Gold implies all-skill mastery | **Still present** | `RecapStage.jsx` shows a single Gold chip; speaking and writing outcomes never reach the player |
| Content 5A–5E | **Still present** | See plan table; all located in source |
| Audio manifest empty / TTS-only course clips | **Still present** | Manifest plus bucket listing above |
| "the app scores your pronunciation" | **Still present** | `a11.meta.js:335` |
| Hub 416 px at 360 px | **Still present** | Measured above |
| Matching accessible names leak pairs | **Still present** | `MatchItem.jsx:116,137` |
| Unnamed progressbar, `aria-label` on 16 role-less spans, two `<h1>` | **Still present** | Measured in the browser at 360 px |
| Signed-in save path not awaited | **Still present (code)** | `LessonPlayerPage.jsx:259-270`. No production DB defect is claimed: no failed write was observed |
| Lighthouse scores 36/42/44, LCP 6.4 s (review) | **Not comparable** | The review used an uncompressed server. This baseline (gzip) is the comparison point for after |
