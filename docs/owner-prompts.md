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

**DeutschStart A1.1 launch — the whole Lemon Squeezy side in one pass** (2026-09-16 rebuild).
Three things do not exist in the store yet: the €39 A1.1 course, the €6.99 speaking top-up,
and the re-priced AI Coach variants. The old €9.99/€79.99 subscription variants must NOT be
edited — existing subscribers are grandfathered on them while continuously subscribed, and
changing a variant's price changes what they are billed. Paste-ready:

```
You are working in Lemon Squeezy, store 309512 ("DeutschMeister" — NOT the MedMeister store).
Verify you are in store 309512 before changing anything. Do not touch, re-price, archive or
unpublish any existing product or variant except where a step says so explicitly. If a step is
ambiguous or something already exists under a different name, stop and tell me instead of guessing.

Do these four things, then report back.

1) NEW VARIANT on the existing one-time product 1336941
   Name: "DeutschStart A1.1"
   Price: EUR 39.00, one-time
   Tax category: "SaaS - personal use"
   Description: "The 30-day A1.1 course: 12 real-life situations, in-app lessons with instant
   feedback, 4 checkpoints, spaced review, 12 AI-graded writing tasks and 12 guided speaking
   missions. One payment, lifetime access. The first three lessons are free to try."
   Publish it.

2) NEW ONE-TIME PRODUCT (its own product, not a variant of 1336941)
   Name: "60 Sprechminuten"
   Price: EUR 6.99, one-time
   Tax category: "SaaS - personal use"
   Description: "3,600 extra speaking seconds for AI speaking practice. They never expire."
   Publish it.

3) TWO NEW VARIANTS on the EXISTING AI Coach subscription product
   First find the subscription product that currently carries the EUR 9.99/month and
   EUR 79.99/year variants. Do not change those two variants in any way - people are still
   billed on them. Add two NEW variants to that same product:
     "AI Coach Monthly" = EUR 12.99 / month, recurring
     "AI Coach Yearly"  = EUR 129.00 / year, recurring
   Tax category: "SaaS - personal use". Publish both.
   If you cannot find that product, stop and tell me what subscription products exist.

4) REDIRECTS
   Set "Redirect after purchase" to https://deutsch-meister.de/subscription/success
   for the new top-up product and for the AI Coach subscription product. Leave product
   1336941's existing redirect as it is if it already points there.

REPORT BACK, for each of the four new variants (A1.1, top-up, AI Coach Monthly, AI Coach Yearly):
  - the exact variant name
  - the NUMERIC variant id
  - the checkout share-link UUID (the /buy/<uuid> link)
Also confirm: the old EUR 9.99 and EUR 79.99 variants are untouched and still published.
```

Then paste the four id pairs back to the agent. It sets, via the Netlify connector:

| Variant | Functions scope (numeric id) | Builds scope (checkout UUID) |
|---|---|---|
| DeutschStart A1.1 | `LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID` | `VITE_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID` + `PUBLIC_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID` |
| 60 Sprechminuten | `LEMONSQUEEZY_SPEAKING_TOPUP_60_VARIANT_ID` | `VITE_LEMONSQUEEZY_SPEAKING_TOPUP_60_VARIANT_ID` |
| AI Coach Monthly | — (subscriptions route by webhook payload) | `VITE_LEMONSQUEEZY_AI_COACH_MONTHLY_VARIANT_ID` |
| AI Coach Yearly | — | `VITE_LEMONSQUEEZY_AI_COACH_YEARLY_VARIANT_ID` |

Until each id is set the matching buy surface stays hidden by design — there is no fallback id,
so a missing variant can never open a dead checkout.

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

## Render the six new A1.1 listening exercises (REQUIRED before their migration goes live)

**Status: pending — nothing is rendered yet.** `migrations/2026-09-16-a1-1-course-linked-practice.sql`
inserts listening exercises 7–12 for A1.1 (plus 2 reading lessons — those need no audio) so that
every course Lektion links one listening and one reading activity. The exercises are inserted with
`status = 'pending'` and **no audio file exists at their storage paths**. The listening library
lists exercises regardless of status, so do BOTH steps in one sitting, in this order:

1. **Render + upload the six MP3s** (below), then
2. **apply the migration** in the Supabase SQL editor, then mark them completed:

```sql
UPDATE public.listening_exercises SET status = 'completed'
WHERE level = 'A1.1' AND exercise_number BETWEEN 7 AND 12;
-- optionally also set total_duration_seconds per row once you know the file lengths
```

(Applying first is acceptable if the render follows within minutes — until the file exists, the
exercise's play button 404s.)

**How to render.** Azure Neural TTS, exactly like the course audio run above (same
`AZURE_SPEECH_KEY`/`AZURE_SPEECH_REGION`): female turns = `de-DE-KatjaNeural`, male turns =
`de-DE-ConradNeural`, rate `-20%` (the exercises store `speed = '-20%'`), ~1.5 s silence between
turns and ~3 s between dialogues, concatenate each exercise into ONE MP3 and upload it to the
public `audio` bucket at the exact path below (folder is UPPERCASE `A1.1`; storage paths are
case-sensitive). The transcripts here are byte-identical to the `listening_dialogues.transcript`
rows the migration inserts — if you change a word here, change the migration too.

**Exercise 7 → `audio/listening/A1.1/exercise7.mp3`** („Im Bürgerbüro“, 3 Dialoge)

> D1 — F: Guten Tag! Wie heißen Sie? / M: Ich heiße Omar Yildiz. / F: Buchstabieren Sie bitte
> Yildiz. / M: Y-I-L-D-I-Z.
> D2 — F: Was sind Sie von Beruf? / M: Ich bin Lehrer. Ich komme aus Österreich und wohne in Bremen.
> D3 — F: Wie ist Ihre Telefonnummer? / M: Meine Telefonnummer ist null eins sieben drei, vier acht
> neun sechs. / F: Danke. Sind Sie verheiratet? / M: Nein, ich bin ledig.

**Exercise 8 → `audio/listening/A1.1/exercise8.mp3`** („Familie und Sprachen“, 3 Dialoge)

> D1 — F: Hast du Geschwister? / M: Ja, ich habe einen Bruder und eine Schwester. / F: Wie alt ist
> dein Bruder? / M: Er ist achtzehn.
> D2 — M: Welche Sprachen sprichst du? / F: Ich spreche Deutsch, Englisch und Arabisch. / M: Spricht
> deine Mutter auch Deutsch? / F: Nein, sie spricht nur Arabisch.
> D3 — M: Ist das deine Familie? / F: Ja. Das sind meine Eltern und mein Sohn. Mein Vater ist Arzt.

**Exercise 9 → `audio/listening/A1.1/exercise9.mp3`** („Im Deutschkurs“, 3 Dialoge)

> D1 — F: Wo ist das Wörterbuch? / M: Das Wörterbuch ist hier. Es ist gelb. / F: Und wo ist mein
> Heft? / M: Dein Heft ist da.
> D2 — M: Ist der Stift schwarz? / F: Nein, der Stift ist blau. Der Bleistift ist grün.
> D3 — F: Ist die Tafel schwarz? / M: Nein, die Tafel ist grün. Die Tür ist braun. / F: Und das
> Fenster? / M: Das Fenster ist groß.

**Exercise 10 → `audio/listening/A1.1/exercise10.mp3`** („Hobbys am Wochenende“, 3 Dialoge)

> D1 — M: Was ist dein Hobby? / F: Ich spiele gern Fußball. Und du? / M: Ich höre gern Musik und ich
> koche gern.
> D2 — F: Was machst du am Wochenende? / M: Ich schwimme am Samstag. Am Sonntag lese ich. / F: Gehst
> du auch ins Kino? / M: Ja, sehr gern.
> D3 — M: Tanzt du gern? / F: Nein, ich tanze nicht gut. Ich mache jede Woche Sport.

**Exercise 11 → `audio/listening/A1.1/exercise11.mp3`** („Nachrichten auf der Mailbox“, 3 Ansagen —
one speaker each, phone-message pacing)

> A1 — M: Hallo Lena, hier ist Tim. Ich kaufe am Freitag ein. Kommst du mit? Ich rufe dich am Abend
> an.
> A2 — F: Guten Tag, hier ist die Praxis Doktor Berg. Ihr Termin ist am Montag um halb neun. Bitte
> kommen Sie pünktlich.
> A3 — F: Hallo Tim, hier ist Ana. Ich stehe morgen um sechs Uhr auf. Ich hole dich um sieben ab.
> Bring bitte Kuchen mit.

**Exercise 12 → `audio/listening/A1.1/exercise12.mp3`** („Die Geburtstagsfeier“, 3 Dialoge)

> D1 — F: Hallo Tim! Ich habe im Mai Geburtstag. Wir feiern am Samstag. Kommst du? / M: Ja, gern!
> Bringe ich etwas mit? / F: Ja, bring bitte einen Salat mit.
> D2 — M: Was kaufen wir für Ana? / F: Vielleicht ein Buch. Sie liest gern. / M: Gut, ich kaufe das
> Geschenk am Freitag.
> D3 — F: Wie viele Gäste kommen zur Party? / M: Zehn Gäste. Meine Mama und mein Papa kommen auch. /
> F: Schön! Bis Samstag. Mach's gut!

Then paste back: the six storage paths as confirmed uploads and the `UPDATE` row count (6). Total
text is ≈340 words — well inside the free tier, cents at most.

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
