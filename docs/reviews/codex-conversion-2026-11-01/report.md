I reviewed all 36 screenshots, the supplied copy and facts, relevant source files, and then the October 26 evaluation. No files changed; no network calls made. Screenshots show a local, signed-out build, not verified production behaviour. [Evidence scope](BRIEF.md)

## 1. Verdict

**Design: 6/10.** The identity is recognisable, typography readable, and primary actions visually distinct. The desktop homepage’s working exercise is useful product proof. The weakness is hierarchy: mobile pricing introduces the free product before showing any paid price; signup’s introduction pushes its submission button below the first screen; the level test explains itself extensively before offering a start. (`home-desktop-fold.png`, `pricing-mobile-fold.png`, `signup-mobile-fold.png`, `level-test-mobile-fold.png`.)

**Buying psychology: 3/10.** The site reduces payment anxiety with “no card” and “no automatic charge,” but gives exam candidates little evidence that the paid programme deserves their money. The telc page sells a schedule, describes an unavailable product, and asserts an unsupported explanation of why people fail. Its strongest mechanism—writing, correction, revision and another test—is clearer in the implementation than in the advertisement. [Programme](../../../src/data/programs/telcB1Komplett.js#L197), [sales copy](../../../astro-site/src/pages/telc-b1-komplettvorbereitung.astro#L138).

**Copy: 5/10.** Payment terms are often admirably explicit. However, “stops,” “tickets,” “rent the line” and “on board” make visitors translate the metaphor into a purchase. German exam copy becomes English account copy. “Die meisten fallen nicht durch…” lacks supporting evidence. These are clarity and credibility problems, not a shortage of personality. (`page-text.json`: home, pricing, telc-package, signup.)

**The biggest reason it does not sell:** the site promotes free exploration while its dedicated exam offer remains unavailable and commercially unproven. That is my diagnosis, not a measured attribution of lost sales. FACTS records zero package sales, zero new subscriptions since August 27, and no qualified-offer or checkout denominator.

The February target requires approximately **4,657 monthly purchases at €249**, assuming 19% VAT and 10% refunds: €188.32 retained revenue per purchase. At 1.5–2.6% purchase conversion, that requires **179,000–310,000 qualified visits monthly**. Those are scenario assumptions, not demonstrated demand. Today’s €59.98 is roughly **14,600 times smaller** than €877,000. Conversion work alone cannot close that gap. [FACTS](FACTS.md)

## 2. The buyer

The latest supplied geographic/device evidence is **September**, not November: 808 Google clicks, at least 67% branded; Indonesia 352, Germany 100, India 47; mobile 438 and desktop 331. Branded searches do not establish purchase intent, and countries establish neither language preference nor purchasing power. [FACTS](FACTS.md)

The recent signup cohort is more useful: **62 registrations, 43 confirmed, 37 attributed to Google, and 31 choosing an exam track**. Only six profiles ever contain an exam date. This supports investigating exam buyers; it does not establish that 31 people have imminent telc exams.

Two buying jobs deserve distinct entrances:

- **Beginner:** “Help me start without choosing the wrong course or committing money.”
- **Exam candidate:** “Help me identify and practise the tasks I struggle with before my exam.”

Residence paperwork, employment and naturalisation are plausible stakes supplied in the brief; their prevalence among actual visitors is **unverified**. Use the learner’s real deadline when provided. Do not imply that buying protects their residence status.

My hypothesis: exam candidates pay for a credible sequence, understandable feedback and reduced preparation uncertainty. Beginners pay after experiencing progress. Validate those hypotheses through purchases and observed sessions.

## 3. Findings, most costly first

### The exam offer cannot currently earn revenue

FACTS explicitly says it is off sale. Meanwhile, `page-text.json` advertises **“89,00 €”**, matching [pricing.js:81](../../../src/data/pricing.js#L81), while FACTS records an approved €149 pilot.

**[owner]** Reconcile product, price, access, seller information and checkout through the existing release gate. Until then replace **“Der Kurs startet in Kürze”** with **“Der Kurs ist derzeit nicht buchbar.”** There is no verified launch date.

At an assumed five qualified prospects monthly and 10% purchase conversion, opening a €149 offer produces approximately **€56/month** after assumed VAT/refunds. Ten pilot orders produce **€1,127 total**. Neither is guaranteed. External clearance effort is unverified; this prerequisite cannot honestly receive a reliable €/hour ranking. [Release gate](../../../docs/strategy/million-plan-2026-10.md#L180)

### The premium is described as organisation, not demonstrated value

The telc FAQ says **“Pro ist die Bibliothek … Der Kurs ist der Plan darüber.”** Three monthly Pro payments total €29.97; the current package asks €59.03 more, and the proposed pilot €119.03 more. That is a substantial premium to explain, although entitlements differ. [Prices](../../../src/data/pricing.js#L24)

Replace grammar-week merchandising with the implemented sequence and one inspectable correction/revision example. Label it **“Demonstrationsbeispiel”**, not a testimonial. Explain what remains after Pro expires.

Mechanism: make the additional purchase tangible. Modelled opportunity: **€451–563 per 1,000 relevant visits**, through signup→checkout improvements in fixes 2 and 7; overlapping estimates.

### Mobile spends attention before delivering the promised action

The cookie banner occupies approximately **142/844 pixels—17%** of the mobile viewport. The telc language notice consumes another roughly 116 pixels. Signup additionally spends space on a second logo, four allowances and an exit to A1.1. (`telc-package-mobile-fold.png`, `signup-mobile-fold.png`.)

Move the form immediately below a short promise; move detailed allowances underneath. Replace the language card with **“Deutsch · Grammar explanations in English”** as a compact utility link. Preserve clear consent choices.

On pricing, show compact paid choices before the large free card. These changes address attention and decision effort. Modelled opportunities: **€91–225/1,000 relevant visits** across fixes 4, 9 and 10—not additive.

### Signup preserves purchase intent better than exam intent

Course purchases already resume through `dm_buy_intent`; do not rebuild that mechanism. However, the return-path validator accepts course paths and rejects exam-task paths. [buyIntent.js:33](../../../src/lib/buyIntent.js#L33), [returnPath.js:17](../../../src/lib/returnPath.js#L17).

Preserve narrowly allowed exam destinations and display **“Nach der Bestätigung geht es mit Ihrer telc-B1-Aufgabe weiter.”** German headings, errors and confirmation instructions should follow German acquisition copy.

The 19 currently unconfirmed registrations are not automatically 19 lost customers. Modelled opportunities: **€451/1,000 relevant visits** for either continuity intervention; actual losses remain unverified.

### Supporting pages introduce contradictory expectations

`/courses/` promises **“Each sub-level is a complete course”**, then marks B1/B2 as under construction. The free course says **“Nothing here locks”**, but lists sequentially locked lessons. Its vocabulary count is 263, versus 339 in the catalogue; those may represent different scopes, which are unexplained. (`page-text.json`: courses, course-a1-1.)

Use **“Choose your starting level”**, distinguish available guided courses from practice materials, and replace the locking sentence with **“Die Lektionen öffnen sich der Reihe nach. Ihr Fortschritt bleibt in diesem Browser gespeichert.”**

Preserve the free course’s prominent Start button and optional saving invitation after meaningful practice. Commitment should follow demonstrated value. Modelled opportunity: **€30–91/1,000 relevant visits** through visitor→signup, fixes 12 and 14.

### Authority and reassurance are not yet dependable

About says **“Developed by doctors in Germany”**; this brief says solo founder. The repository also contains conflicting provenance. Use the sanctioned singular founder line pending owner reconciliation. Medical experience supports empathy; it does not establish examination-assessment expertise. [marketing.js:230](../../../src/data/marketing.js#L230)

`/vergleich/` asks how DeutschMeister compares with famous brands and displays May prices. Replace its lead with **“Welche Unterstützung brauchen Sie: Selbstlernen, KI-Rückmeldung oder Unterricht?”** Retain dated facts until verified.

Empty operator fields are a stronger trust problem than missing decorative badges. [legal.js:8](../../../astro-site/src/data/legal.js#L8) Modelled trust-copy opportunity: **€90/1,000 qualified exam visits**; legal readiness remains a prerequisite, not an attributable uplift.

## 4. Rewrite pack

These are proposed replacements. Prices must render from `pricing.js`; claims and allowances from `marketing.js`, with synchronized Astro twins. Programme-specific counts need verified marketing exports before publication. Keep existing tokens, **siegel** actions and hairline borders.

**Home — English; [owner], fix 12**

> **Learn German for everyday life. Start free.**
>
> Practise introducing yourself, making appointments and everyday conversations. Start the A1.1 course without an account.
>
> **Start A1.1 free**
>
> Preparing for an exam? **Find your exam preparation · DE**
>
> Already learning German? **Find my level**

Keep “Create a free account” accessible in navigation. Put the real exercise directly after this compact introduction on mobile; retain the train line farther down.

**Pricing — English; [agents], fix 9**

> **Choose the German practice you need.**
>
> Buy one course to keep, or use Pro while you need it. A1.1 is free without an account.
>
> **Keep one course**
>
> From **{course price} once**. Includes **{Pro months} months of Pro**. Your purchased level stays available afterward.
>
> **Choose my course**
>
> **Practise with Pro**
>
> **{monthly price}/month**. Access materials across all eight levels, with the published AI allowances. Cancel anytime.
>
> **Start my free trial**
>
> **Start A1.1 without an account**

Display actual availability beside each course. In the supplied build, “Not on sale here yet” means a Buy action must not appear. Signed-in Pro buyers receive the existing priced purchase action.

**Telc package — German/Sie; [agents], fixes 2 and 7**

> **telc B1: Schreiben und Sprechen mit einem klaren Übungsplan.**
>
> Bearbeiten Sie prüfungsnahe Aufgaben, lesen Sie die KI-Rückmeldung und überarbeiten Sie Ihre Texte. Der Plan verbindet Kurztests, Schreibaufgaben und Sprechübungen.
>
> **Der Kurs ist derzeit nicht buchbar.**
>
> Sie können Pro mit einem kostenlosen Konto **{trial days} Tage** testen. Keine Kreditkarte. Keine automatische Abbuchung.
>
> **Pro kostenlos testen**
>
> **Beispielkorrektur ansehen**

After the owner clears release, replace the availability/trial block with:

> **{package price} einmalig · {Pro months} Monate Pro inklusive**
>
> Danach bleiben Ihr Plan und Fortschritt erhalten. Für die Pro-Inhalte benötigen Sie anschließend wieder Pro.
>
> **Konto erstellen und zum Kauf**

No “starting soon,” invented deadline, pass promise or blanket lifetime-content claim.

**Signup — English default; German exam variant; [agents], fixes 4 and 6**

> **Create your free account**
>
> Save your progress and try Pro for **{trial days} days**. No card. No automatic charge.
>
> Email · Password
>
> **Create account and start my trial**
>
> Next: confirm your email.

German variant:

> **Kostenloses Konto erstellen**
>
> Speichern Sie Ihren Fortschritt und testen Sie Pro **{trial days} Tage**. Keine Kreditkarte. Keine automatische Abbuchung.
>
> E-Mail · Passwort
>
> **Konto erstellen und Pro testen**
>
> Anschließend bestätigen Sie Ihre E-Mail-Adresse.

For an explicit purchase, lead with **“Ihr Kauf: {product}, {price}, einmalig”** and button **“Konto erstellen und zum Kauf”**. Keep the existing same-browser confirmation explanation. Detailed allowances belong below the form.

## 5. Ranked fix list: top 15

**Sizing assumptions, not forecasts:** 1,000 relevant visits/month → 20% signup → 20% checkout → 50% paid. Net sale value: **E = €112.69** for the proposed €149 exam offer; **T = €30.25** for a €40 ticket, assuming 19% VAT and 10% refunds. Fees and delivery costs are excluded.

Ranks use modelled monthly revenue gain per implementation hour. “pp” means percentage points. Effects overlap; each row assumes relevant exposure, and exam-sale effects are **€0 while off sale**.

| # | Change and exact location | Mechanism and assumed effect | Effort; authority | Measure / stop rule |
|---|---|---|---|---|
| 1 | After useful guide content, add **“telc-B1-Übungsplan ansehen”**; give the core telc guide the offer route already used by long-tail guides. [Template:118](../../../astro-site/src/pages/leitfaden/[slug].astro#L118), [guide:311](../../../astro-site/src/data/guides/telc-b1.js#L311). | Relevant next step; visitor→signup +3pp: **€338 E/month**. | **2h [agents]** | Track qualified offer arrivals and signups. Never send DTZ readers to a telc purchase. |
| 2 | Apply telc rewrite; replace grammar-week descriptions with programme activities; delete unsupported failure claim. [Page:112](../../../astro-site/src/pages/telc-b1-komplettvorbereitung.astro#L112). | Specificity; signup→checkout +4pp: **€451 E**. | **3h [agents]** | Four of five target readers must explain what they receive; otherwise revise. |
| 3 | Reconcile checkout total, product description and access with canonical data; investigate the two unpaid subscriptions. [Runbook:56](../../../docs/telc-pilot/README.md#L56), `pricing.js:81`. | Certainty; checkout→paid +5pp: **€225 E**. Recovering 1–2 Pro renewals: **€8–15 now**. | **2h [owner]** | If totals already match, close that issue. Count recovered payments, not reminders. |
| 4 | Put signup form immediately under the short promise; remove duplicate logo; move allowance list below. [Signup:233](../../../src/pages/SignupPage.jsx#L233). | Lower effort; visitor→signup +2pp: **€225 E**. | **2h [agents]** | Form and submit reachable with consent visible; monitor confirmed accounts, not submissions alone. |
| 5 | Preserve allow-listed exam-task destinations through confirmation; retain existing course purchase resume. [returnPath:17](../../../src/lib/returnPath.js#L17). | Intent continuity; signup→checkout +4pp: **€451 E**. | **5h [owner]** | Confirmation returns to requested task; reject external redirects. |
| 6 | Translate German account headings, errors and confirmation instructions; carry the chosen interface language. [Signup:249](../../../src/pages/SignupPage.jsx#L249). | Comprehension; visitor→signup +4pp: **€451 E**. | **6h [agents]** | Five German-preferring candidates complete the journey without unintended English. |
| 7 | Show one labelled draft → actual feedback → revision beside telc offer. [Page:168](../../../astro-site/src/pages/telc-b1-komplettvorbereitung.astro#L168). | Product evidence; signup→checkout +5pp: **€563 E**. | **8h [agents]** | Verify example and correction; stop if reviewers find material errors. No outcome implication. |
| 8 | Give prospective referring teachers that demonstration and a matching German offer sheet; use distinct partner tags. [Partner links:39](../../../docs/partners/links.md#L39). | Referral: assumed 100 additional qualified visits ×2% paid: **€225 E**. | **4h [owner]** | Stop after ten relevant conversations without a concrete referral pilot; posting/sending stays owner-controlled. |
| 9 | Apply pricing rewrite; compact paid choices first, free option as a short row. [Pricing:208](../../../astro-site/src/pages/pricing.astro#L208). | Easier comparison; signup→checkout +3pp: **€91 T**. | **2h [agents]** | At 390px, paid price, recurrence and next action visible; no unavailable Buy buttons. |
| 10 | Compact language notice; shorten consent copy to **“Optional analytics cookies. They load only if you accept.”** plus privacy link and equal-access choices. [Notice:9](../../../astro-site/src/components/LanguageNotice.astro#L9), [consent:93](../../../public/consent.js#L93). | Recover usable space; visitor→signup +1pp: **€113 E**. | **3h [owner]** | Preserve consent behaviour; verify keyboard, zoom and mobile reachability. |
| 11 | About: use sanctioned founder line and concrete product demonstration. Vergleich: use needs-based lead above; preserve verification dates. [About:14](../../../src/pages/UeberUnsPage.jsx#L14), [comparison:72](../../../astro-site/src/pages/vergleich/index.astro#L72). | Credibility; checkout→paid +2pp: **€90 E**. | **3h [owner]** | Publish only reconciled founder facts; remove unsupported comparative claims. |
| 12 | Apply home rewrite; courses headline **“Choose your starting level”**; one catalogue with explicit availability. [Homepage deck:17](../../../astro-site/src/data/homepage.js#L17), [courses:55](../../../astro-site/src/pages/courses/index.astro#L55). | Self-selection; visitor→signup +3pp: **€91 T**. | **4h [owner]** | Beginners and exam candidates find their route; verify 320/360/390px containment. |
| 13 | Level test: **“Find a starting level for your German practice”**; put **“Start my free level test”** directly underneath. Replace “Precise placement” with “Suggested starting level.” [Landing:55](../../../src/components/LevelTest/LevelTestLanding.jsx#L55). | Lower commitment uncertainty; visitor→signup +1pp: **€30 T**. | **2h [agents]** | Monitor completed tests and subsequent signups; no compulsory test before purchase. |
| 14 | Free course: retain immediate Start; collapse duplicate welcome material; correct locking/count scope. [Welcome:43](../../../src/components/course/CourseWelcome.jsx#L43). | Confidence and commitment; visitor→signup +1pp: **€30 T**. | **3h [agents]** | First lesson remains accessible; saving stays optional; no new early interruption. |
| 15 | Reconcile offer→signup→checkout→paid→refund; correct consent-event dedupe. [Tracking:55](../../../astro-site/src/lib/track.js#L55), [measurement requirement:227](../../../docs/strategy/million-plan-2026-10.md#L227). | **€0 direct**; makes every sales estimate testable. | **6h initial [owner]** | No commercial kill clock before reconciled denominators; new endpoints require owner approval. |

At today’s volume, assume 5% of 62 signups start checkout and half pay for a €40 ticket. Improving signup→checkout from 5% to 7% adds only **€19/month**; 20% more signups adds about **€9/month**. Those rates are illustrative. Prioritise defects, the release gate, truthful proof and acquiring qualified buyers.

## 6. Agree / disagree with October 26

**Agree:** the offer needs demonstrable value beyond Pro; exam intent must survive signup; German acquisition needs German account continuity; a total redesign is unjustified. These conclusions survive independent inspection.

**Disagree with certainty:** the merged recommendation makes €79 self-service plus €149 human review sound more settled than the evidence permits. That introduces pricing, delivery and staffing assumptions. The blind proposal’s Goethe preference is a useful hypothesis, not a mandate. Neither geography nor exam preferences prove willingness to pay. [Prior evaluation](../codex-sales-2026-10-26/ "PR #234, not merged")

**Missed or underweighted:** the free-course contradictions; the cumulative mobile obstruction from navigation, language notice and consent; and the mismatch between a seven-day promotional frame and FACTS’ finding that **9 of 12 historical payers purchased 20–129 days after trial expiry**. Trial expiry should explain access, not manufacture urgency.

**What changed:** the central sales copy remains the same. The ten long-tail guides and unseen retest are dated October 26 and already discussed in the prior reports; they are not subsequent conversion improvements. The current 390px homepage does not reproduce the reported severe 360px clipping, but that does not prove a fix. The target changed from $1 million annually to monthly; the commercial evidence has not demonstrated corresponding progress.

## 7. What I could not verify

- **Production checkout, taxes, payment methods and entitlement:** owner records the actual purchase/refund/replay journey. Local missing Buy buttons may reflect absent build variables.
- **Buyer qualification, language and price tolerance:** interview booked candidates and reconcile retained purchases by source.
- **Learning validity:** independent assessment of AI feedback and exam tasks. The guide describes four Leitpunkte while [writingTasks.js:27](../../../src/data/writingTasks.js#L27) still contains three.
- **Legal readiness and founder/team facts:** owner supplies the records required by the existing gate.
- **Blank full-page screenshot regions:** scroll-reveal CSS can explain them; they do not prove missing live content. Verify scrolling and reduced-motion rendering.
- **Actual uplift:** every euro estimate above is a hypothesis. With today’s traffic, usability observations and verified transactions are more informative than short, underpowered A/B tests.