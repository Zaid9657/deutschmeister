# Owner prompts — paste-ready

Steps that only a browser logged in as the owner can do. Each is a prompt for the
**Claude in Chrome extension** (or a local Claude Code session with the Chrome MCP —
the cloud sessions do not have it). Keep them here so the next launch does not
re-derive them.

## Lemon Squeezy (store 309512 — DeutschMeister, NOT MedMeister)

**Create a product with variants** (used 2026-09-03 for product 1336941):
```
In Lemon Squeezy store 309512 create ONE one-time product "<name>" with variants
<name>=€<price>, … , EUR, tax category "SaaS – personal use". Description: <text>.
Publish. For each variant return the numeric variant id and the checkout share-link UUID.
Do not touch any other product.
```
Then paste the ids to the agent: it sets `LEMONSQUEEZY_<KEY>_VARIANT_ID` (numeric,
functions scope) and `VITE_/PUBLIC_LEMONSQUEEZY_<KEY>_VARIANT_ID` (UUID, builds scope)
via the Netlify connector and redeploys.

**Add the per-sub-level variants** (decision 2026-09-08; product 1336941 already exists):
```
In Lemon Squeezy store 309512, on the existing one-time product 1336941, add three variants:
"German A1.2 Course" = €40, "German A2.1 Course" = €50, "German A2.2 Course" = €50, EUR,
tax category "SaaS – personal use". Publish them. For each new variant return the numeric
variant id and the checkout share-link UUID. Do not touch any other product or variant.
```
Then paste the three id pairs to the agent: it sets `LEMONSQUEEZY_COURSE_A1_2_VARIANT_ID`,
`_A2_1_`, `_A2_2_` (numeric, functions scope) and the `VITE_`/`PUBLIC_` twins (UUID, builds
scope) via the Netlify connector, merges the catalogue PR and redeploys. Afterwards archive the
five 2026-09-03 variants (2088862, 2088867, 2088868, 2088869, 2088871).

**Set the post-purchase redirect** (so buyers land on our success page, not LS's receipt):
```
In store 309512, set product <id>'s "Redirect after purchase" URL to
https://deutsch-meister.de/subscription/success and save.
```

**100 % test discount** (used 2026-09-03: DMTEST100, discount 1120253):
```
Create a discount: name "Internal test purchase", code <CODE>, 100 %, restricted to
product <id>, usage limit 3, expires <date> 23:00 UTC. Confirm it shows Active.
```
Deactivate it afterwards: `Deactivate discount <id> in store 309512.`

**Test purchase** (the agent verifies the `purchases` row in Supabase afterwards):
```
Open https://deutsch-meister.de/pricing/ logged in as <email>. Click "Buy <level>",
apply <CODE>, confirm €0.00, complete checkout. Then open /subscription and
/level/<first sub-level> and screenshot both. Report the LS order number.
```
Note: a €0 order cannot be refunded in LS, so the refund → re-lock path is not covered
by this test.

---

## Run the A1.1 course audio

**Why it needs you.** The recordings are rendered with Azure Neural TTS and written to
Supabase Storage with the service-role key. Neither secret exists in a cloud agent session
(and neither `*.supabase.co` nor Azure is reachable through the agent proxy), so the run
happens on your machine. It takes a couple of minutes and costs single-digit cents.

**Before the first run**, apply the word migration once in the Supabase SQL editor:
`migrations/2026-09-13-a1-1-course-words.sql` — it seeds the 18 Wortfeld words that have no
`words` row yet. The audio script looks each one up by `(german, level)` and writes its
`audio_url`; without the migration those 18 clips fail with
`no words row for "…" at a1.1`.

**Environment** (four variables, nothing else):

```bash
export AZURE_SPEECH_KEY=...            # Azure AI Speech resource key
export AZURE_SPEECH_REGION=westeurope  # the resource's region
export SUPABASE_URL=https://<project>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...   # service role — never the anon key
```

**Dry run first** (needs none of the four; calls nothing, writes nothing):

```bash
node scripts/generate-course-audio.mjs a1.1 --dry
```

It prints the plan and the cost before you spend anything:

```
a1.1: 181 clips — 115 dialogue lines, 12 pretest models, 36 Phonetik items, 18 Wortfeld words
a1.1: 4298 characters ≈ 6.88 US cents at $16/1M
…
Summary (dry): rendered 0 / skipped 0 / failed 0 / ≈ 6.88 cents if all 181 are rendered.
```

**The real run:**

```bash
node scripts/generate-course-audio.mjs a1.1
node scripts/generate-example-audio.mjs --table words   # the 31 course words seeded 2026-09-12 have rows but no audio yet
```

Expected last line (first run — the numbers are what you paste back):

```
Summary: rendered 181 / skipped 0 / failed 0 / ≈ 6.88 cents (4298 characters this run).
```

It is idempotent: every manifest entry stores the sha1 of the text it rendered, so a second
run prints `rendered 0 / skipped 181 / failed 0` and re-renders only lines whose German
changed. If it stops early (`Too many failures`), just run it again — it resumes.

**Afterwards, commit the manifest** and sync the Astro twin, or `npm run check:duplicates`
(and CI) fails:

```bash
node scripts/sync-curricula.mjs
git add src/data/curricula/a11.audio.js astro-site/src/data/curricula/a11.audio.js
git commit -m "chore(audio): A1.1 course audio manifest from the Azure run"
```

Then paste the summary line back to the agent. Until the manifest lands, every screen falls
back to the browser voice and honestly labels itself "Computerstimme" instead of "Aufnahme" —
nothing is broken, it is just not yet the promised product.

---

## Course reminder — copy approval + two env flags (P4, 2026-09-13)

`netlify/functions/course-reminder.mjs` mails learners who are mid-course and paused:
latest course activity **20–44 h ago**, inside the last 30 days, **at most 3 reminders per
rolling 7 days**, one claim per learner per day in `lifecycle_emails`. It **ships off** and
cannot send until you do three things — 1 and 2 are yours, 3 is the migration.

**1. Read the copy and say yes or change it.** Controlled **A1 German** (every recipient is an
A1.1 learner — the first version of this mail was B1 and the DaF review of 2026-09-12 §F
rejected it), no pressure, no figures, and no claim about what the learner did or did not do.
Subject and body for a learner whose next step is Lektion 4:

> **Weiter mit Lektion 4: Auf dem Flohmarkt**
>
> Hallo! Du lernst Deutsch — sehr gut.
>
> Lektion 4 heißt **Auf dem Flohmarkt**. Sie ist kurz: ein Schritt pro Bildschirm.
>
> Du kannst jederzeit aufhören. Bis bald.
>
> [ Lektion 4 öffnen → ]  (links to `/course/a1.1`)
>
> — Zaid
>
> _Footer: DeutschMeister · deutsch-meister.de · Diese E-Mails abbestellen_

The greeting is „Hallo!“ while the selection function carries no first name; with one it is
„Hallo Ana, du lernst Deutsch — sehr gut.“ (never „Hallo, du …“, which reads as a vocative).
The Lektion number and title come from the learner's own progress; the fallback for a level
whose titles are not in the mailer yet is „Weiter im Kurs A1.1“, with „Dein Kurs A1.1 geht
weiter. Die Lektionen sind kurz: ein Schritt pro Bildschirm.“ instead of the middle line and no
Lektion named. Nothing in the copy asserts a gap in the learner's practice — the 20-hour floor
makes such a claim impossible to justify, and „du warst vor Kurzem im Kurs“ was exactly that
claim. `tests/course-reminder.test.mjs` fails if a price, a streak threat, the word „gestern“,
an exclamation mark beyond the greeting's, a sentence over 12 words, or any of the three
retired B1 constructions ever enters this copy.

**2. The two environment variables** (Netlify → Site configuration → Environment variables,
**Functions** scope), set in this order:

```
LIFECYCLE_TEST_RECIPIENTS = zaid@deutsch-meister.de      # canary FIRST — only this address is mailed
COURSE_REMINDER_ENABLED   = true                         # the master switch, exactly "true"
```

Already present and reused: `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CAMPAIGN_SECRET`,
`UNSUB_SECRET`. With the canary set, everyone who is not on the list is skipped **and left
unclaimed**, so emptying the list later resumes them from scratch. Watch one or two real
reminders arrive at your own address, then delete `LIFECYCLE_TEST_RECIPIENTS` to go live.

**3. Apply `migrations/2026-09-13-course-reminder.sql`** in the Supabase SQL editor (it widens
the ledger's `kind` CHECK and creates `course_reminder_candidates()`). Until it is applied the
job cannot send even with the flag on — the selection function does not exist and the claim
insert is rejected.

**Dry run any time, sends nothing, claims nothing** (replace `<CAMPAIGN_SECRET>`):

```bash
curl -s "https://deutsch-meister.de/.netlify/functions/course-reminder?dry=1&secret=<CAMPAIGN_SECRET>"
# → {"enabled":true,"dry":true,"kind":"course_reminder_2026-09-14","wouldSend":7}
```

`"enabled":false` means the master switch is not `true`. A dry run is the honest way to see
the queue size before any mail exists.

---

## Course funnel in the weekly truth — apply one migration (2026-09-19)

**Why it needs you.** The Monday truth mail measured one-and-done on the grammar hub, not on the
A1.1 course, so the rebuild's own success metric — Lektion 1 → Lektion 2 continuation — was never
in the row. `migrations/2026-09-19-course-funnel.sql` re-declares `weekly_truth_metrics()` with a
`course` block (same body otherwise, same `SECURITY DEFINER`, same REVOKEs). Until it is applied
the mail prints `Kurs A1.1: nicht gemessen` on that line — nothing else changes. Migrations are
never applied by the build (`migrations/README.md`), so: open the Supabase SQL editor
(Dashboard → SQL Editor → New query), paste the whole file, Run. Then, in the same editor,
run `SELECT public.weekly_truth_metrics()->'course';` once and paste the JSON back to the
agent — it is the first measured baseline (`l01_started`, `l01_finished`, `l02_started`,
`l1_to_l2_pct`, `one_and_done_14d`, `active_learners_7d` …), and next Monday's mail will show the
delta against it. `l1_to_l2_pct` is `null`, not `0`, while nobody has finished Lektion 1.

---

## Generate the A1.1 course art (Higgsfield, owner-local)

**Why it needs you.** The course ships today with flat-vector art drawn in code
(`src/components/illustrations/`) — eight character busts and twelve situation scenes, wired into
the intro screen, the course home, the dialogue and the Wortfeld banner. It works and passes every
test, but it is a placeholder: real photos are one owner-local Claude Code session away, because
this sandbox's egress proxy blocks every CDN host the Higgsfield MCP returns results on
(`docs/design/a11-art-style.md`'s BLOCKED note has the exact denials). Run the prompt below in a
**local** Claude Code session (one that can reach `cloudfront.net` and friends) — it has Higgsfield
MCP access there and can save the generated bytes to disk, which this sandbox cannot.

Paste this whole block as your first message to that local session:

```
Generate the A1.1 course art for deutsch-meister.de through the Higgsfield MCP and land it in the
repo. Read docs/design/a11-art-style.md first — it has the full style block, the cast table and
the twelve scene lines; do not deviate from them. Style block to prefix every prompt:

Flat vector illustration, minimal geometric shapes, soft rounded forms, clean flat fills,
generous white space, warm off-white paper background (#FCFCFA), limited palette of at most
five colours: dark ink (#14201D) for thin lines and details, teal (#0F766E) as the one
accent colour, soft apricot (#FF9E57) and lime green (#7BC943) as warm secondaries, pale
grey-green (#F4F6F5) for quiet shapes, plus one flat skin tone per person. No text, no
letters, no numbers, no signs, no labels. No gradients, no shadows, no shading, no
photorealism, no 3D, no outlines around every shape. People are adults with simple faces:
small dot eyes, a simple mouth, no nose detail, no eyebrows. Consistent three-quarter view,
contemporary German everyday setting, calm and friendly. Flat editorial illustration style,
like a modern textbook.

EIGHT PORTRAITS (bust, head and shoulders, three-quarter view facing slightly left, centred,
plain paper background, friendly neutral expression, square 1:1, 1k) — generate Ana first and
pass her result as an `image_references` style anchor to the other seven:

1. Ana — young adult woman, warm medium-brown skin, dark shoulder-length wavy hair, teal jacket
   over a white top.
2. Frau Kaya — adult woman, light-brown skin, dark hair in a low bun, apricot blouse.
3. Herr Weber — middle-aged man, light skin, short grey hair, round glasses, white shirt with a
   teal tie.
4. Lena — young adult woman, light skin, short blonde hair, lime-green sports hoodie.
5. Frau Wolf — older woman, light skin, grey hair tied back, apricot scarf over a dark cardigan.
6. Tim — young adult man, medium-brown skin, short curly dark hair, teal sweater.
7. Paul — adult man, light skin, short black hair, white shirt with a dark ink-coloured waiter
   apron.
8. Herr Schmidt — middle-aged man, medium-dark skin, short dark hair with a small moustache, teal
   uniform jacket and a flat railway cap.

TWELVE SCENES (4:3 landscape, 2k / ≥1280px wide, same style block + image_references to the
relevant portraits) — the scene line for each Lektion is in docs/design/a11-art-style.md's "The
twelve situations" table (L01 hostel reception … L12 birthday party planning); use those lines
verbatim, one generation per Lektion (a1.1-l01 … a1.1-l12).

CONVERT with sharp (already a dependency) to WebP:
  - portraits → 512px, ≤ 40 KB → public/art/a11/char-<slug>-512.webp
    (slugs: ana, frau-kaya, herr-weber, lena, frau-wolf, tim, paul, herr-schmidt)
  - scenes → 1280px ≤ 90 KB → public/art/a11/scene-l01-1280.webp … scene-l12-1280.webp
  - scenes → 640px ≤ 35 KB (mobile) → public/art/a11/scene-l01-640.webp … scene-l12-640.webp

FILL src/data/curricula/a11.art.js — for each of the 8 `characters[name]` entries set `src` to
the portrait's public path (e.g. `/art/a11/char-ana-512.webp`); for each of the 12
`situations[lektionId]` entries set `src` to the 1280px scene path and `srcSmall` to the 640px
path. Leave every `alt` exactly as written — it is already the real English alt text. Update
`generatedWith` to `{ tool: 'Higgsfield MCP', model: <the model you used>, date: <today>, styleDoc:
'docs/design/a11-art-style.md', status: 'generated' }`. Do not touch anything else in that file,
and do not touch src/components/illustrations/ — both `CharacterAvatar` and `SituationScene`
already render an `<img>` the moment `src` is set, so filling the manifest is the whole job.

Run `npm run lint` and `node --test tests/course-art.test.mjs` when done, and report which of the
20 assets (if any) failed a budget or a download and were left as placeholders.
```

Three notes for whoever runs this:
- **Ana first, as the anchor.** Every other portrait and every scene should pass her result through
  `image_references` with "match this illustration style exactly" — the consistency method
  `docs/design/a11-art-style.md` already specifies. Skipping this is how eight busts stop looking
  like one cast.
- **Budgets are hard limits, not targets.** A file over budget re-runs through `sharp` at a lower
  quality setting before it lands in `public/art/a11/` — never shipped over budget "for now".
  `tests/course-art.test.mjs` does not check file size (nothing to check once the paths don't
  exist in this sandbox), so this is on the local session's own discipline.
  - **Filling the manifest is reversible.** Setting `src`/`srcSmall` back to `null` on any entry
    (or all of them) instantly reverts that character or scene to the code-drawn placeholder —
    nothing else needs to change, so a bad generation can be backed out one entry at a time.
