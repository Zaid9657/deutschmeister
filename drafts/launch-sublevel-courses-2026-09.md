# Launch push: per-sub-level courses — 3 emails / 7 days + 5 Telegram posts

**Class B — drafts for owner review. Nothing here self-sends or self-posts.** Written
2026-09-08 for the owner decision "stop building, sell what is finished" (tracker
decisions log; `docs/monetization-2026-09-03.md` addendum).

**Status 2026-09-27: Email 1 is staged, not sent** — `drafts/send-launch-sublevel-1.sh`
(`preview` → `test` → `live` once), built by `drafts/launch-sublevel-1.mjs`, which is now
the canonical Email 1 copy. The 2026-09-27 launch audit (docs/SCORECARD.md work order #2)
fixed: the unsourced customer quote that opened Email 1; the claim that B1/B2 are being
"rebuilt to the same standard as A1 and A2" (A1.2 is paused; the paid levels are not on the
course standard); the level-test duration (its page says 15–20 min, not ten); "as it always
was"; Email 3's "format of the Goethe exam" (the final tests are half-length, Goethe-*style*
practice tests we wrote); and Email 3's "Since Monday" (Day 0 is not necessarily a Monday).
Prices in the email bodies below are `{{…}}` placeholders: a send script fills them from
`src/data/pricing.js`, the way `launch-sublevel-1.mjs` does. Never type a price into a body.

**Audience for the emails:** the 1,085 confirmed-email DeutschMeister accounts (measured
2026-09-08; 7 are Pro subscribers and are excluded by the `exclude` rule). English, like
every transactional email the site has sent so far. Sent through the site's own
`send-campaign` function (per-user HMAC unsubscribe footer, `testMode`, `exclude`), exactly
as `drafts/send-launch-email-1.sh` does — never through a Resend broadcast.

**Audience for the Telegram posts:** the MedMeister community is doctors at B2–C1 with an
FSP/KP goal, so an A2 course is the wrong offer there. The posts below therefore sell the
free surfaces and the **telc B1 Komplettvorbereitung** (the one product a doctor with a
B1 requirement actually needs), and mention the level courses once, as a footnote for
partners and family. du-Form, exam-deadline energy, same as
`drafts/social-content-atoms-2026-09.md`.

**Claims discipline:** every price is what `src/data/pricing.js` charges
(`SUBLEVEL_PRICES_EUR` for the `SELLABLE_LEVELS`; B1/B2 are `COMING_SOON_LEVELS`, not
buyable, so never sold in copy). The figures in the Telegram posts were typed on
2026-09-08; re-derive them from `pricing.js` before posting. Included Pro window = `COURSE_PRO_MONTHS` (3 months).
No outcome promises, no exam fees, no usage numbers. Content counts only if quoted:
12 grammar topics per A-level (`GRAMMAR_TOPIC_COUNT` provenance in `marketing.js`).

**Preconditions (do NOT send before all of them; docs/SCORECARD.md work order #2):**
1. A new 100% code in Lemon Squeezy, restricted to the A2.1 product (DMTEST100 is tied to
   the retired band product).
2. The owner buys A2.1 for €0 on `/pricing/` with a **fresh** account, and sees a Buy button
   on every card the email prices (A1.2, A2.1, A2.2 — a card whose checkout id is unset is
   hidden).
3. The agent verifies the `course_a2_1` purchases row and the 90-day `plan_type='course'` Pro
   row; the owner deactivates the code. Only then `LAUNCH_PRECONDITION_VERIFIED=yes`.

**Send days:** Day 0 → Day 3 → Day 7. Every send first with `"testMode": true`.

**UTM:** every link carries `?utm_source=email&utm_medium=launch&utm_campaign=sublevel-2026-09`
(Telegram: `utm_source=telegram`). GA4 and PostHog are consent-gated, so treat the numbers
as a floor, not the truth; the `purchases` table is the truth.

Email 1 goes out only through `drafts/send-launch-sublevel-1.sh`. Its exclude list is
derived: `subscribed` plus `purchased:<key>` for every product that already owns a level the
email sells (`course_a1_2`, `course_a2_1`, `course_a2_2`, and the retired `course_a1`,
`course_a2`, `course_alle`). Emails 2 and 3 get their own staged scripts on the same
pattern, never a hand-typed curl. **Nothing records campaign recipients: a second live
run of any of them re-mails everyone.**

Pricing page: `https://deutsch-meister.de/pricing/?utm_source=email&utm_medium=launch&utm_campaign=sublevel-2026-09`

---

## Email 1 — Day 0 · Announcement

**Subject:** You can now buy one German level and keep it

**Body (HTML paragraphs):**

*Canonical copy: `drafts/launch-sublevel-1.mjs` (edit it there; this is a mirror). Run
`./drafts/send-launch-sublevel-1.sh preview` to see the filled-in email.*

<p>Not everyone wants a subscription to learn German. If you would rather pay once for the level you are working on and keep it, you now can.</p>

<p>Each DeutschMeister level from {{first sellable level}} to {{last sellable level}} is now its own one-time course. Pay once, keep it for life: every grammar lesson with typed practice, the reading texts with checks, the listening exercises, the vocabulary list and the level's final test, plus <strong>{{COURSE_PRO_MONTHS}} months of Pro</strong> included, so the AI speaking coach, writing feedback and Sentence X-Ray run while you work through it.</p>

<p><strong>{{FREE_LEVELS}} stays free.</strong> Then:</p>

<p>{{one line per sellable level: code — price, from SUBLEVEL_PRICES_EUR}}</p>

<p>{{coming-soon bands}} are listed on the pricing page as coming soon and cannot be bought yet.</p>

<p><a href="https://deutsch-meister.de/pricing/?utm_source=email&amp;utm_medium=launch&amp;utm_campaign=sublevel-2026-09"><strong>See the levels →</strong></a></p>

<p>Not sure which level you are? The <a href="https://deutsch-meister.de/level-test/?utm_source=email&amp;utm_medium=launch&amp;utm_campaign=sublevel-2026-09">level test is free</a> and takes about 15–20 minutes. And if none of this is for you, nothing changes: the free daily sentence and {{FREE_LEVELS}} stay exactly as they are.</p>

<p>— Zaid</p>

---

## Email 2 — Day 3 · Pure value: what "finishing A2" actually means

**Subject:** The A2 checklist (whether you buy anything or not)

**Body:**

<p>People say "I'm A2" the way they say "I'm fine" — it means almost anything. Here is what the Goethe-Zertifikat A2 actually asks of you, so you can check yourself honestly before you book an exam or buy a course.</p>

<p><strong>You can do it if you can:</strong></p>

<p>1. Write a short message with a reason, a suggestion and a question — "Ich kann am Montag nicht kommen, weil ich arbeiten muss. Können wir uns am Dienstag treffen?" — and get the verb to the end after <em>weil</em> every time, not most times.</p>

<p>2. Talk about the past with <em>haben</em>/<em>sein</em> + Partizip II without stopping to think which one: "Ich <strong>bin</strong> nach Berlin gefahren. Ich <strong>habe</strong> dort gearbeitet."</p>

<p>3. Ask politely in the Konjunktiv II — <em>Könnten Sie…? Ich hätte gern…</em> — which is exactly the register the speaking exam rewards.</p>

<p>4. Read a short notice or email and answer richtig/falsch questions about it in under a minute each.</p>

<p>If 1–4 feel easy, you are ready for B1 material. If one of them made you wince, that is your gap — and it is a specific, learnable one, not "my German is bad".</p>

<p>Every A2 grammar topic on DeutschMeister now has typed exercises for exactly these points (not multiple choice — you write the ending, the verb, the sentence). The free <a href="https://deutsch-meister.de/level-test/?utm_source=email&amp;utm_medium=launch&amp;utm_campaign=sublevel-2026-09">level test</a> tells you which half of A2 to start in; the <a href="https://deutsch-meister.de/pricing/?utm_source=email&amp;utm_medium=launch&amp;utm_campaign=sublevel-2026-09">A2.1 and A2.2 courses</a> are {{price a2.1 / a2.2, from SUBLEVEL_PRICES_EUR}}, one time, with {{COURSE_PRO_MONTHS}} months of Pro included.</p>

<p>— Zaid</p>

---

## Email 3 — Day 7 · Straight close (no fake deadline)

**Subject:** One level, one payment, done

**Body:**

<p>Short one. Last week I wrote that you can now buy a single German level on DeutschMeister and keep it: {{one clause per sellable level: code for price, from SUBLEVEL_PRICES_EUR}}, {{COURSE_PRO_MONTHS}} months of Pro included with each.</p>

<p>There is no discount code and no countdown in this email. The price is the price; it is the same next month. I am writing because three things are worth knowing before you decide:</p>

<p><strong>It is yours for good.</strong> Not a subscription. If you stop for two months, nothing expires.</p>

<p><strong>You can buy half a level.</strong> If the level test puts you at A2.2, you do not pay for A2.1.</p>

<p><strong>It ends with a timed test.</strong> Each level closes with a final test in the style of the Goethe-Zertifikat (A1 for A1.2, A2 for A2.1 and A2.2): a half-length practice test we wrote ourselves, not an official Goethe exam. So you know whether you are done rather than hoping.</p>

<p><a href="https://deutsch-meister.de/pricing/?utm_source=email&amp;utm_medium=launch&amp;utm_campaign=sublevel-2026-09"><strong>Pick your level →</strong></a></p>

<p>Questions about which level fits — reply to this email. I read them.</p>

<p>— Zaid</p>

---

## Telegram — 5 posts (MedMeister community; du-Form; owner posts by hand)

Cadence: one every second day, in the general topic. No two product posts in a row.
Link for the telc course: `https://deutsch-meister.de/telc-b1-komplettvorbereitung/?utm_source=telegram&utm_medium=post&utm_campaign=sublevel-2026-09`
Link for the level test: `https://deutsch-meister.de/level-test/?utm_source=telegram&utm_medium=post&utm_campaign=sublevel-2026-09`

### TG1 · Value — der Genitiv, den die Prüfer hören wollen
Kurzer Test für heute: Welche Version klingt nach B1, welche nach A2?
🅰️ „Ich komme später wegen dem Termin."
🅱️ „Ich komme später wegen des Termins."
🅱️ – und zwar nicht, weil 🅰️ falsch klingt (so spricht halb Deutschland), sondern weil *wegen, trotz, während* + Genitiv genau die Form ist, die in der schriftlichen Prüfung zählt. Merksatz: Genitiv-Präpositionen nehmen nie *dem* oder *den*. Immer *des/der* + Nomen.
Wer das in 5 Minuten üben will: Genitiv-Präpositionen mit Tipp-Übungen (nicht ankreuzen – schreiben) gibt's bei deutsch-meister.de unter Grammatik → B1.1. Regeln sind frei.

### TG2 · Product — für alle mit B1-Termin
Falls dein Arbeitgeber oder das Amt **telc B1** von dir will (Partner, Ehegatte, Einbürgerung – kommt in dieser Gruppe öfter vor als man denkt):
Wir haben eine feste 4-Wochen-Vorbereitung gebaut. Ein Task pro Tag, in der Reihenfolge, die zur Prüfung führt, mit einem zeitgesteuerten telc-Modelltest und KI-Feedback auf deine Briefe. Einmalzahlung, 3 Monate Pro inklusive.
👉 {telc link}
Nichts für dich, wenn du auf B2/C1 lernst – dann einfach weiterscrollen.

### TG3 · Value — Konjunktiv II ist keine Grammatik, sondern Höflichkeit
„Kann ich mal den Chef sprechen?" vs. „Könnte ich bitte kurz mit dem Chef sprechen?"
Gleiche Grammatik-Stufe? Nein. Der zweite Satz ist das, was in jeder mündlichen Prüfung – und in jedem Übergabegespräch – Punkte bringt. *könnte, hätte, wäre, würde* sind keine Vergangenheitsformen, sondern der Höflichkeitsmodus.
Drei Sätze, die du dir heute merkst:
• Ich hätte gern einen Termin.
• Könnten Sie mir bitte helfen?
• Wäre es möglich, das zu verschieben?
Mehr davon (mit Tipp-Übungen): deutsch-meister.de → Grammatik → B1.1 → Konjunktiv II.

### TG4 · Free surface — 10 Minuten, dann weißt du dein Level
Ehrliche Frage: Weißt du, ob du B1 oder B2 bist – oder schätzt du?
Der Einstufungstest bei DeutschMeister ist kostenlos, dauert ~10 Minuten und sagt dir nicht nur die Stufe, sondern die Teilstufe (z. B. B1.2). Ohne Konto.
👉 {level test link}
Screenshot vom Ergebnis gern hier in den Kommentaren – wir schauen, wo die Lücken bei den meisten liegen.

### TG5 · Footnote — für Partner und Familie
Kurz, weil es immer wieder gefragt wird: Für Partnerinnen und Partner, die *gerade erst anfangen* – A1/A2 – gibt es bei DeutschMeister jetzt einzelne Stufen zum Einmalkauf (A1.1 frei, A1.2 40 €, A2 je Teilstufe 50 €, Pro 3 Monate inklusive). B1/B2 stehen als „bald verfügbar" drauf und sind bewusst noch nicht kaufbar.
Kein Abo, nichts läuft ab. Alles unter deutsch-meister.de/pricing/. Für euch selbst (FSP/KP) bleibt MedMeister der Weg – das hier ist für die, die zu Hause mitlernen.

---

## After the sends — what to read

- `purchases` grouped by `product_key` (the truth), the Monday `weekly_metrics` row.
- Replies to Email 3: every "which level fits me" reply is a warm lead; answer within a day.
- If A2.1 outsells A2.2 by a wide margin, the level-test hand-off is doing its job; if
  nothing sells in 14 days, the next lever is traffic, not copy.
