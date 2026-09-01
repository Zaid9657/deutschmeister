# Product truth check — 2026-08-31 (firsthand, tool-verified)

Everything below was measured this day, firsthand: live SQL against project
`omqyueddktqeyrrqvnyq` (Supabase connector), a Playwright walkthrough of the
production build served locally (`scripts/serve-like-netlify.mjs`, port 4178,
built from the merged main), Firecrawl web/brand searches, and a Perplexity
(sonar-pro via Composio) competitor-research pass. Where something could NOT be
verified from this environment, that is stated — nothing here is assumed from
docs.

## 1 · What the website actually contains (live DB counts, not estimates)

Note: `list_tables` row estimates are stale pg statistics and showed several of
these as 0 — every figure below is a real `COUNT(*)`.

| Asset | Live count | Audio? |
|---|---|---|
| Grammar topics | 64 (8 per level × 8 levels) | — |
| Grammar rules | 453 | — |
| Grammar examples | 673 | **0/673 have audio** (O-8, script exists) |
| Grammar exercises | 672 | — |
| Vocabulary words | 1,935 | **0 have audio files** — `WordCard.jsx` falls back to browser speech synthesis (works, sounds robotic) |
| Sentences (X-Ray corpus) | 945 | — |
| Listening exercises / dialogues | 48 / 480 | ✅ 49 mp3s in the public `audio` bucket, 6–7 per level, resolved by storage-path convention (`listeningHelpers.js`) — the empty `listening_dialogues.audio_url` column is a red herring |
| Reading lessons | 66 | — |
| Podcasts | 24 | ✅ all 24 have `audio_url` |
| Video library | 11 | ✅ all 11 |
| Speaking missions | 64 | live TTS |

Content quality (sampled, not assumed): B1.1 reading ("Die Kunst der
Diskussion") is genuine essay-length German with 6 questions; the B1.1 speaking
mission ("Cancelling a contract", AI plays a reluctant customer-service agent
with a German opening line) is a well-designed scenario; dialogue transcripts
are natural two-speaker German. The library is real, deep, and worth money.

## 2 · What renders (Playwright walkthrough of the production build)

| Page | Verdict |
|---|---|
| `/` | ✅ Case-colored hero, honest counts (64/480/8/24), clean brand |
| `/pricing/` | ✅ Free-vs-Pro table, billing toggle, honest FAQ. **Gap: zero mention of the €89 telc B1 course** — the highest-ticket product is invisible on the money page |
| `/telc-b1-komplettvorbereitung/` | ✅ Full German sales page renders; 4-week plan, €89 box, honest FAQ. (Local build shows the no-variant fallback CTA by design; production has the env var) |
| `/grammar/b1.1/konjunktiv-ii-wurde/` | ✅ Real rule content, breadcrumbs, "Ocean Depth" level chip |
| `/analyze/` | ✅ Hydrates, input + 5 example sentences, above-the-gate demo |
| `/speaking/` | ✅ Real above-the-gate copy (D-2 appears addressed on this surface) |
| `/level-test/` | ✅ Polished 3-section explainer (written/listening/speaking) |

Not verifiable from this environment (proxy blocks the live domain and
Supabase storage over HTTPS): live Netlify function responses (X-Ray analysis,
speaking session, checkout webhook round-trip) and actual mp3 playback. The LS
**test-mode purchase E2E remains the one unverified link in the money path** —
owner action, agent verifies the DB side.

## 3 · Brand & search reality (Firecrawl, measured)

- `site:deutsch-meister.de` — indexed well: homepage, pricing, grammar,
  podcasts, analyze, speaking, level test all present with correct titles.
- **The brand name is crowded.** "DeutschMeister" search: a 700k-word
  dictionary app (Google Play + App Store), **deutschmeister.vn — an AI
  German-learning site with near-identical positioning ("Learn German with AI |
  Goethe & TELC exam prep")**, thedeutschmeister.com (Edinburgh tutor), a
  Pakistani A1 course on Instagram. deutsch-meister.de does not rank in the
  top 8 for its own name. Distribution content must always carry the domain,
  not just the name; a distinctive visual identity (the case colors) matters
  more than the wordmark.
- Two index blemishes found: `/intro` was indexed claiming "Join thousands of
  learners" (an invented usage count — fixed this day, line rewritten to
  content facts); `/listening` (slashless SPA-shell variant) is indexed with
  the shell's generic grammar description instead of `/listening/`'s real one —
  an instance of the known D-1 class (SPA shell on crawlable URLs).

## 4 · What's missing before "ready" (merged with the Perplexity research)

Perplexity (sonar-pro, 2026-08-31) on what German-exam candidates actually pay
for, ranked by willingness-to-pay — mapped against what we have:

1. **Exam-authentic simulation with timed scoring/readiness verdict** — the #1
   gap. We have all the material but no timed Modelltest mode, no score, no
   "you are ready / not ready". The course's week 4 gestures at this manually.
2. **Rubric-based speaking/writing feedback vs the actual telc criteria** — our
   AI speaking gives general feedback; telc's speaking exam is PAIRED — an AI
   partner simulating the paired format would be a genuine first.
3. **A human/live layer** as a premium tier (out of scope for now, noted).
   Plus recurring forum demands: spaced repetition, micro-lessons, mock tests.

Concrete pre-ready gaps, in priority order:
- **Money path E2E unverified** (LS test purchase → purchases row → unlock →
  refund revoke) — blocks launch email 1. Owner + agent, minutes of work.
- **Pricing page doesn't sell the course** — add the course card/cross-link.
- **START49 discount unfinished** in the LS dashboard.
- **0/673 example audio + 0/1,935 word audio** — the cheapest perceived-value
  raise available (owner runs the script; words need a second pass).
- **No timed Modelltest experience** — the researched #1 willingness-to-pay
  feature; a v1 (timed mode over existing exercise sets + a score readout) is
  buildable on current content and would harden the €89 promise.
- Brand crowding → distribution assets lead with domain + case-color identity.

## 5 · Corrections this check produced

- `/intro` "thousands of learners" line removed (claims discipline; was
  indexed by Google).
- "480 listening dialogues with audio" in earlier docs is accurate in effect
  but misleading in mechanism: audio exists per-exercise (49 files), not
  per-dialogue; the `audio_url` column being empty on all 480 rows is normal.
- `words` table has no audio despite a `WordCard` audio path — speech-synthesis
  fallback is what users actually hear. Perceived-quality issue, not a bug.
