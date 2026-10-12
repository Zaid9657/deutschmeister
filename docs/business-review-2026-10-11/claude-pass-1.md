# Claude — independent review, pass 1 (written before seeing Codex's)

## 1. Bottom line
- Yes, €10k profit a month is reachable, but **not with the current products at the current traffic.**
  With every fix applied, today's ~150–190 signups a month buying €40–50 tickets top out around
  €0.5–1k a month.
- What must be true:
  1. Sell the outcome the crowd already asks for. Passing the **B1 exam** (41 of 70 named it) should be
     a premium program at €197–397, not "own a level" at €40–50.
  2. The buy path has no dead ends: VAT-inclusive prices, B1 buyable, payment possible before the
     email round trip.
  3. 2–5× qualified traffic, from Telegram, YouTube/IG shorts on B1 exam tasks, the existing exam
     SEO pages and, once the offer converts, paid ads.
- The one move: package what already exists (6 mock exams, AI speaking and writing correction, the
  telc 4-week plan, the exam guides) into one **B1 exam program with a conditional guarantee**, and
  launch it to the 1,165 existing accounts this month.

## 2. Why sales stopped (ranked by evidence)
Base rate: 11 paid subscriptions between 05-21 and 08-27, about 3.3 a month. Zero in the 45 days
since is P ≈ e^-4.95 ≈ 0.7% under the old rate, so **the stop is real, not noise.**

1. **The product that sold was demoted, and its replacement has never sold** (09-03 → today).
   - Pro was the only thing anyone ever bought. On 09-03 it became "the AI add-on", and one-time
     level tickets became the headline.
   - Tickets have sold 0 in 5+ weeks. They sell levels (A1.2, A2.x) nobody asks for, while B1 is "Im
     Bau". *Inferred* (no page analytics), but it is the only change that coincides with the stop
     and persists through it.
2. **The purchase path was broken for most of September.**
   - Signed-out Buy never reached checkout (09-03 → 10-05).
   - The mislabelled "Start 7-day Pro trial" button opened a paid checkout (09-14 → 09-30).
   - `/subscription` falsely said every plan had a trial.
   - *Proven* defects; the size of their effect is unmeasured.
3. **The top of the funnel shrank.** Signups fell from ~45 a week to 22, 31, 16, 10.
   - The homepage signup door removal (10-04) took untagged homepage signups from 22 to 1. *Proven.*
   - Google-attributed signups held at ~13 a week, so this is the site, not SEO.
   - The September dip also coincides with the Supabase project being paused (09-14; auth down while
     paused).
4. **The persuasion layer was removed** (08-22 trust row, social proof and price cards; 10-05 refund
   line). *Not provable*: two sales happened right after the 08-22 rebuild (08-26, 08-27).
5. **The checkout surprises every buyer** (constant, so it caps conversion but did not cause the
   stop). The store is tax-exclusive, so "€9.99" becomes €11.89 at checkout for a German buyer. That
   is a classic abandonment trigger and a PAngV problem.

## 3. Value-equation scorecard (1–10; higher is better for every lever, i.e. "time" 9 = fast, "effort" 9 = easy)

| Offer | Dream outcome | Likelihood | Time | Effort | Weakest lever |
|---|---|---|---|---|---|
| Free A1.1 | 3 | 6 | 8 | 5 | Dream: nobody's goal is "A1.1"; six screens before the first graded answer |
| 7-day trial | 4 | 3 | 6 | 4 | Likelihood: a library to browse, not a path; 0 of 181 converted |
| Pro €9.99 | 4 | 3 | 5 | 4 | Likelihood + commodity: same price as Babbel/Busuu, with no plan, proof or guarantee |
| Level ticket €40–50 | 3 | 4 | 5 | 3 | Dream mismatch (A1.2/A2 vs B1 demand); 65 min/day; signup + confirm before checkout |
| telc B1 €89 | 7 | 4 | 6 | 5 | Likelihood + visibility: right outcome, but no proof or guarantee, buried, German-only page, 0 sales |

Insight: **the best value equation on the site is the €89 telc B1 course, and it is the least
visible offer.** The grand slam offer grows out of it.

## 4. Grand slam offer

**Avatar:** an adult immigrant in Germany (or about to move), around A2+/B1−, who needs a B1
certificate for **citizenship, permanent residence (Niederlassungserlaubnis), a job or professional
recognition**, with an exam in 4–12 weeks.
- Starving-crowd check:
  - pain: very high (residency, citizenship, income);
  - purchasing power: medium (working adults; the exam fee alone is ~€150–250, to be verified);
  - easy to target: yes (exam-name searches, Telegram/Facebook expat groups by nationality, YouTube);
  - growing: yes (skilled-immigration law, citizenship reform).

**Dream outcome:** "I pass B1 on my date, first try — and the paperwork can move on."

**Problems → solutions**

| Problem | Solution |
|---|---|
| "Am I ready? Which exam?" | Free 10-minute B1 readiness check (level test + mini mock) with a score and exam recommendation |
| "No plan, no time" | A day-by-day plan to *your* exam date, 20–30 min/day (generalise the telc 4-week plan) |
| "Speaking scares me, no partner" | AI oral-exam simulator for Teil 1–3, with a score and model answers (the speaking engine exists) |
| "My writing is full of errors" | AI correction for the Brief/Forum task types, with a corrected version and Redemittel (evaluate-writing exists) |
| "Time pressure in Lesen/Hören" | Timed mock exams scored against the pass mark (telc B1, Goethe B1, DTZ exist in `src/data/mockExams/`) |
| "Grammar gaps" | Targeted B1 drills chosen from mock results (the library exists) |
| "I'll fail and lose fee and time" | Conditional guarantee (§6) |
| "I'll give up alone" | Telegram study group + daily reminder mail (the course-reminder mailer exists) |
| "Exam-day logistics" | The exam guides + a booking/exam-day checklist (guides exist) |

**Delivery vehicles:** DIY + AI (done-with-you by software) for the core; asynchronous group
(Telegram). Optional premium human element, outsourced: 2 × 30-min live mock oral exams with a DaF
tutor at ~€30 each.

**Stack**

| Item | Exists? | Delivery cost |
|---|---|---|
| Readiness check | level test exists; mini mock to cut from the mocks | ~0 |
| Personal exam-date plan | telc plan + A1.1 `ExamDatePlan` exist; generalise | build S–M |
| 3 timed B1 mocks + scoring | exist | ~0 |
| AI oral simulator, fair-use cap stated | exists | AI cost, unmeasured — must cap |
| AI writing correction, cap stated | exists | AI cost |
| B1 grammar/reading/listening library | exists (older format) | 0 |
| Telegram group | owner creates channel/group | owner time, low |
| Bonuses: Redemittel PDF, top-30 topics with model answers, exam-day checklist | to write (Claude can draft) | 0 |

**Price:** **€197 core** (incl. VAT) and **€397 premium** (+2 human mock orals + 2 human writing
reviews). Optional 3 × €69 payment plan.
- Why: escapes the €10/month comparison with Babbel; is below the cost of failing (fee + 2–3 months
  of delay); leaves budget for ads.
- Anchor only on verifiable alternatives (VHS prep course price, exam fee), with source and date.

**Guarantee:** the conditional service guarantee in §6, option A.

**Honest urgency:** a founding-cohort price (e.g. €147 for the first 50 buyers or until a stated date),
and the cohort's Telegram start date.
- Never a strike-through of a price not previously charged (PAngV §11).

**Name (MAGIC):** „**B1-Prüfungsplan: in 8 Wochen zur B1 — telc, Goethe, DTZ**", with the line „Für
Einbürgerung, Niederlassung und Beruf".
- Alternative: „B1 sicher bestehen — der 8-Wochen-Plan". This one is riskier as an outcome claim.

**Second offer (later):** "Start Deutsch 1 für den Ehegattennachzug" (A1 for the spouse visa), built
on the rebuilt A1.1. It is blocked until A1.2 exists.

## 5. Price ladder
- **Free:** A1.1 course, the B1 readiness check, the grammar rules, X-Ray 1/day.
- **Entry:** the B1 mock-exam pack, €29 (3 timed mocks + scoring), which upgrades to core with the €29
  credited. Or keep Pro as the entry/continuity product.
- **Core:** B1-Prüfungsplan, €197.
- **Premium:** with Prüfer-Simulation, €397.
- **Continuity:** Pro, repositioned as "Weiterlernen nach der Prüfung"; stop leading with it.
- **Level tickets:** keep for A1/A2, renamed by outcome ("A2 für Goethe A2"). The €40 A1.2 ticket
  should not be the homepage default while A1.2 is a paused draft.

## 6. Guarantees

**A — conditional service guarantee + money back** (recommended)
> **Bestehens-Garantie:** Wenn Sie den Plan vollständig abschließen (alle Tagesaufgaben und drei
> Modelltests mit mindestens 60 %) und die B1-Prüfung trotzdem nicht bestehen, lernen Sie kostenlos
> weiter bis zu Ihrem Wiederholungstermin — und auf Wunsch erstatten wir den vollen Kaufpreis. Senden Sie uns dazu
> innerhalb von 30 Tagen nach Erhalt Ihres Ergebnisses den Bescheid. Ihre gesetzlichen Rechte bleiben
> unberührt.

- Risk: low if the conditions are on the page and the checkout, and are honoured.
- The completion data is already tracked (lesson progress, mock attempts).

**B — 14-day no-questions refund**
> Passt das Programm nicht zu Ihnen, erhalten Sie innerhalb von 14 Tagen nach dem Kauf den vollen
> Preis zurück — ohne Begründung.

- Simple. Abuse risk is limited at €197 with AI caps.

**C — service-only (anti-refund)**
> Keine Rückerstattung, aber Sie behalten den Zugang, bis Sie bestanden haben.

- Weaker for conversion; zero cash risk.

Any of these requires lifting `tests/refund-claims.test.mjs` and `tests/offers.test.mjs` for the
guarantee surfaces. That is an owner decision.

## 7. Friction: top 10 (by money impact)
1. **B1 is not buyable**, though 41/70 want it.
   - Where: `src/data/pricing.js` `COMING_SOON_LEVELS`; `astro-site/src/lib/courseVariants.js:19`.
   - Fix: the B1 program product. Effort M.
2. **Tax-exclusive checkout surprise** ("€9.99" → €11.89).
   - Fix: switch the LS store to tax-inclusive prices (owner, LS dashboard) and add "inkl. MwSt." to
     every price render. Effort S.
3. **Email confirmation before payment**, with the buy intent in localStorage.
   - Where: `src/components/EmailVerificationGate.jsx`, `src/lib/buyIntent.js:33-37`.
   - Fix: guest checkout like telc (pay with an email; the webhook links or creates the account)
     **or** a server-side intent. Effort M.
4. **No offer at the moments of intent.** Level-test result (`LevelTestResults.jsx`), A1.1 completion
   (`CourseCompletePage.jsx:112-119`), mock score, trial day 6 (`trial-lifecycle.mjs:100-117`).
   - Fix: offer the matching product there. Effort S–M.
5. **Exam doors lead to login** (`ExamSubscriptionGuard.jsx:69-71`).
   - Fix: signup with a return path; better, a free mini mock without an account. Effort S.
6. **Anonymous level lock has no price or Buy** (`LockedContentOverlay.jsx:39-84`). Effort S.
7. **Promises ≠ server.**
   - Speaking "30/month" vs 2/day (`marketing.js:54` vs `speaking-session.mjs:26`); trial "Pro" vs
     caps; the day-6 mail.
   - This is a refund/chargeback trust killer. Fix: align (server or copy). Effort S.
8. **Webhook silent drop** for unmapped variants (`lemonsqueezy-webhook.mjs:308-334`).
   - Fix: record and alert. Effort S.
9. **Ticket owners bounced to "Trial Expired / Subscribe now"** after 90 days
   (`SubscriptionGuard.jsx:54-63`). Effort S.
10. **Signup asks for more than needed.** 3 fields, no Google login. Fix: drop confirm-password; add
    Google OAuth (owner creates the client). Effort S + owner.

## 8. Copy

**Homepage hero**
- EN:
  - H1 „Your 8-week plan to pass B1 — telc, Goethe or DTZ."
  - Sub „A day-by-day plan to your exam date, mock exams marked like the real one, and an AI examiner
    for speaking and writing. Finish the plan and still fail? Keep learning free until your retake."
  - CTA „Check my B1 readiness — free, 10 min"; secondary „See the plan · €197".
- DE:
  - H1 „Ihr 8-Wochen-Plan zur B1-Prüfung — telc, Goethe oder DTZ."
  - Sub „Ein Tagesplan bis zu Ihrem Prüfungstermin, Modelltests mit echter Bewertung und ein
    KI-Prüfer für Sprechen und Schreiben. Plan geschafft und nicht bestanden? Sie lernen kostenlos
    weiter bis zur Wiederholung."
  - CTA „B1-Check starten — kostenlos".

**Pricing**
- Headline: „Ein Ziel, ein Preis: B1-Prüfungsplan — 197 € einmalig, inkl. MwSt."
- Card bullets: Tagesplan bis zum Termin · 3 Modelltests · KI-Prüfer Sprechen & Schreiben ·
  Telegram-Lerngruppe · Bestehens-Garantie.

**Lock screen**
- Text: „Diese Übung gehört zum B1-Prüfungsplan — Tagesplan, Modelltests und KI-Prüfer, 197 € einmalig
  inkl. MwSt., mit Bestehens-Garantie."
- Buttons: „Plan ansehen" / „Jetzt freischalten".

**Trial day-6 email**
- Subject: „Morgen endet Ihr Test — wann ist Ihre Prüfung?"
- First lines: „Sie haben diese Woche {n} Übungen gemacht. Wenn Ihr Ziel B1 ist, ist der nächste
  Schritt ein Plan bis zu Ihrem Termin …"

## 9. The €10k math
**Net per sale.** VAT-inclusive pricing, DE 19% worst case, LS 5% + €0.50:

| Price | Net per sale |
|---|---|
| €197 | €156.8 |
| €397 | €316.5, minus €60 tutor = €256.5 |
| €29 | €22.7 |

The AI cost per buyer is unmeasured. A cap is needed; assume ≤ €10.

**Month 1** — launch to the existing accounts through an in-app banner, consented email only, and Telegram:
- list: 1.0–2.0% of 1,165 = 12–23 sales;
- new signups: 60 × 3% = 2;
- ≈ 14–25 × €147 ≈ **€2.1k–3.7k net**.

**Month 3** — organic doubled (exam SEO pages, Telegram, shorts):
- 300 signups/month × 4% = 12;
- list re-launch: 5;
- premium: 3;
- ≈ **€3.5–4.5k**.

**Month 6** — paid acquisition once the core converts at ≥3% of leads:
- at a CAC of €50–70 per sale, 90–110 sales a month at €197, or 60 at €297, is **€10k profit**.

**Traffic needed:** ~3,000–5,000 qualified landing visits a month at 2–3% visit → sale. That is
5–10× today.

**Honest framing:** €10k a month is a month 4–6 target. Months 1–3 should prove the offer converts,
with the first 10 sales, then 50.

**B2B accelerator** (owner-time permitting): licences for care recruiters and Pflegeschulen that
need B1/B2 certificates for foreign staff. 3–5 deals × €1–3k could close the gap faster.

## 10. Facts I disagree with or could not verify
- The tax-exclusive pricing comes from order data, not from code. I have not seen the LS setting
  itself.
- Exam fees, VHS prep-course prices and competitor prices need sourcing (with date) before any copy
  uses them (§5 UWG; the repo already stamps competitor prices "Stand: Mai 2026").
- The AI cost per speaking session is unmeasured, and it bounds any "unlimited" claim.
