**1. Score: 2/5**

DeutschMeister has useful mechanisms, but its commercial copy gives buyers too little reason to choose them. The homepage sells a learning journey; pricing sells ownership; the telc page sells a plan that differs substantially from the implemented programme. Meanwhile, competitors already advertise exam simulations, AI feedback and cheaper packages. The root cause is **a commercial narrative organised around the catalogue rather than the buyer’s exam task**. This is an evaluator’s inference, not a measured explanation of lost sales. Actual willingness to pay remains unproven: the telc package is unavailable, and there were zero sales in the last seven days (`FACTS.md:14,29`).

Evidence shorthand: `C/` means the supplied capture directory. Repository findings below match local `main` unless marked “branch”; code does not establish deployment. I opened the mobile PNGs and changed no files.

**2. Findings, most important first**

**A. The pages give six different answers to “What am I buying?”**

Quotes below preserve the wording, with spacing normalised.

| Page | Stated proposition | Evidence |
|---|---|---|
| Home | “From Guten Tag to B2, one stop at a time.” | `C/site__home.md:44` |
| Pricing | “Own a level, or rent the whole line.” | `C/site__pricing.md:44` |
| telc package | “Du weißt, dass du üben musst. Der Plan sagt dir, was.” | `C/site__telc-b1-komplettvorbereitung.md:49` |
| Exam collection | “Auf welche Prüfung bereitest du dich vor?” | `C/site__pruefung.md:49` |
| telc exam page | “telc Deutsch B1: Deine Vorbereitung mit DeutschMeister” | `C/site__pruefung-telc-b1.md:49` |
| Courses | “One level. One payment. Yours for good.” | `C/site__courses.md:44` |

These communicate navigation, payment structure and general reassurance. They barely communicate the practice that could justify paying.

The clearest disconnect is the telc package. Its live page describes grammar foundations in weeks one and two; implemented day one is a timed test, followed by writing, revision and speaking (`C/site__telc-b1-komplettvorbereitung.md:69–84`; `src/data/programs/telcB1Komplett.js:203–220`).

**Why it costs sales:** the copy hides the strongest reason to buy. It also explicitly describes the package as a plan over Pro’s library (`C/site__telc-b1-komplettvorbereitung.md:112`). At the current displayed €89, that asks buyers to value the plan at **€59.03 above three monthly Pro payments**. At the approved future €149 pilot price, the difference becomes **€119.03**. These are arithmetic comparisons, not equivalent-entitlement valuations (`src/data/pricing.js:24,81`; `docs/strategy/million-plan-2026-10.md:136`).

**B. The comparison set misses the alternatives appearing in buyer searches.**

`/vergleich/` says: “Wir vergleichen uns fair mit den größten Namen,” then compares Babbel, Duolingo and Lingoda (`C/site__vergleich.md:53–75`).

The supplied search snapshots show a different market:

| Query | Leading alternatives |
|---|---|
| telc B1 Vorbereitung online | telc #1; telc-trainer #2; BO Vorbereitung #3; DeutschAkademie #4; TestHelden #7 |
| Goethe B1 Vorbereitung online | Goethe preparation #1; official practice materials #2; BO #4; TestGerman #9 |
| DTZ Vorbereitung online | BO #1; g.a.s.t. #2; eTrainer #5 |

Evidence: the corresponding `C/search__telc-b1-vorbereitung-online.md:7–31`, `search__goethe-b1-vorbereitung-online.md:7–39`, and `search__dtz-vorbereitung-online.md:7–23`. These establish snapshot visibility, not search volume or market share.

Those alternatives advertise concrete offers: telc-trainer “19,99€” with writing feedback; TestHelden “Komplettpaket…39 €”; DeutschAkademie “ab 89 €” with teacher feedback (`C/comp__telc-trainer.md:15,143`; `comp__testhelden-telc-b1.md:292`; `comp__deutschakademie-telc-b1.md:22,64`).

AI feedback is already a competitive claim. [TestGerman](https://www.testgerman.de/) advertises writing and speaking correction from €19.90/month, confirmed in a fresh fetch and `C/comp__testgerman.md:493`. [Official telc training](https://www.telc.net/sprachpruefungen/deutsch/live-online-pruefungstraining-deutsch-b1/) offers live small-group instruction.

**Why it costs sales:** “cheaper than classroom preparation” leaves the cheaper digital alternatives unanswered. The defensible proposition is the coordinated practice sequence; its superiority remains unverified.

**C. Real differentiators exist, but their claims need boundaries.**

| Mechanism | What the implementation supports—and its limit |
|---|---|
| Sentence X-Ray | Distinct grammatical-case colours and explanations. Visible product mechanism; exclusivity unverified (`src/pages/SentenceXRay.jsx:43–101`). |
| Writing feedback | Exam-style prompt, four criteria, Leitpunkt checks and concrete corrections. The prompt calls this an exercise estimate, not official assessment. Official-rubric equivalence is unverified (`netlify/functions/evaluate-writing.mjs:293–325`). |
| Speaking feedback | Five categories plus mission criteria where supplied. It evaluates transcripts and explicitly excludes acoustic pronunciation, pace and pauses. This is not demonstrated official exam scoring (`netlify/functions/evaluate-speaking.mjs:75–94`). |
| Unseen retest | Day 20 selects form two; tests check different items and comparable structure. Equal difficulty and predictive validity remain unverified (`src/data/programs/telcB1Komplett.js:243`; `tests/telc-pilot.test.mjs:96–125`). |
| Typo tolerance | Selected spelling slips receive a TYPO result; safeguards reject changed numbers, negation and grammatical distinctions. It is bounded tolerance (`src/lib/lesson/check.js:389–431`). |
| Dated plan | Remaining work and an entered exam date produce weekly workload targets. The telc page uses this component; it does not prove exam readiness (`src/lib/course/plan.js:71–109`; `src/pages/TelcB1KursPage.jsx:201`). |

**Why it costs sales:** “AI speaking” describes a feature category. Showing *write → receive corrections → revise → practise weaknesses → attempt new tasks* explains what the buyer can actually do. That sequence is implemented but underrepresented publicly (`src/data/programs/telcB1Komplett.js:197–243`).

**D. The serious copy defects concern credibility, language continuity and precision.**

The live claim “Die meisten fallen nicht durch, weil ihnen Grammatik fehlt” supplies an unsupported explanation of failure. The same claim appears on the telc exam hub (`C/site__telc-b1-komplettvorbereitung.md:51`; `astro-site/src/data/exams/index.js:66`). Its prevalence and causal basis are **unverified**.

“20-Tage-Plan,” “Vier Wochen” and “jeden Tag eine Aufgabe” also obscure the actual structure: twenty study units across four weeks, sometimes with multiple activities (`C/site__telc-b1-komplettvorbereitung.md:53,60`; `src/data/programs/telcB1Komplett.js:210`). “20 Trainingseinheiten in vier Wochen” is clearer.

The sampled German is generally understandable. Editorial issues include compounds such as “telc B1 Prüfung,” better rendered consistently as “telc-B1-Prüfung.” More consequentially, public pages address readers as **du**, while the implemented programme uses **Sie** (`astro-site/src/data/exams/index.js:66`; `src/data/programs/telcB1Komplett.js:200–204`). Public du is not itself prohibited by the course rule; the journey still changes register.

Home, pricing and courses are English. German exam pages retain English navigation and an English notice explaining that the page is German (`C/site__home.md:44`; `site__pricing.md:44`; `site__courses.md:44`; `astro-site/src/components/LanguageNotice.astro:13–17`).

**Why it costs sales:** these transitions create avoidable interpretation work. Actual language preference and conversion loss are unverified; German search wording alone does not establish inability to read English.

**E. The train metaphor helps orientation but weakens the exam purchase argument.**

A line makes sequential levels visible. However, “Die Linie,” “Einzelfahrschein,” “stop” and “rent” require buyers to translate brand language into access rules (`astro-site/src/components/linie/LineSection.astro:33–39`; `Ticket.astro:33–50`).

For an exam buyer, showing B1/B2 as “Im Bau” can suggest unavailable preparation, although Pro includes B-level materials (`C/site__courses.md:181–189`). That is an ambiguity, not proof that buyers misunderstand.

My judgement: retain the line as secondary navigation. Lead exam pages with tasks, feedback, access and prerequisites. The mobile homepage also visibly clips explanatory copy and the account CTA; that defect deserves correction independently of metaphor preferences (`FACTS.md:30`; supplied `shots/home.png`).

I agree with the existing evaluation’s 2/5 positioning score. I disagree with its claim that `firstRun` ignores exam choice: local main already selects an eligible learner’s exam writing task or mock (`docs/strategy/sales-evaluation-2026-10-26.md:60,106`; `src/lib/firstRun.js:107–130`). Deployment remains unverified.

**3. Sub-scores**

| Sub-question | Score | Evidence |
|---|---:|---|
| (a) Value proposition | 2/5 | Payment ownership dominates the main commercial headlines; telc copy mismatches its programme (`C/site__pricing.md:44`; programme:203). |
| (b) Competitive positioning | 1/5 | Named comparisons omit the leading exam-search alternatives (`C/site__vergleich.md:53–75`; telc search:7–31). |
| (c) Real differentiation | 3/5 | Useful integrated mechanisms exist; outcome advantage is unverified (`src/data/programs/telcB1Komplett.js:197–243`). |
| (d) Copy quality | 2/5 | Mixed language, register and unsupported failure explanation (exam registry:66; programme:200). |
| (e) Train metaphor | 2/5 | Clear level sequence; indirect language for an exam purchase (`LineSection.astro:33–39`). |

**4. Recommendations, ranked by expected revenue per hour**

**Clean sheet: hybrid**—build an exam-specific commercial narrative around existing practice. Evolving the current wording is cheaper but leaves the catalogue framing; replacing the entire homepage with an exam-only business creates unnecessary scope before demand is proven. Estimated effort: evolve 3–5 hours, replacement 25–40, focused hybrid 8–14; these are planning estimates.

Proposed positioning **[owner]**:

> Für Erwachsene mit telc-B1-Termin und Deutschkenntnissen ungefähr auf B1 bietet DeutschMeister ein geführtes Prüfungstraining: Briefe schreiben und überarbeiten, Sprechen üben und gemessene Lücken bearbeiten—mit 20 Trainingseinheiten und einem zweiten Kurztest mit neuen Aufgaben.

The segment comes from the approved plan:74; mechanisms from `telcB1Komplett.js:197–243`. This promises practice, not passing.

Three German hero options **[owner]**:

1. **„telc B1: Üben Sie die Prüfung mit einem klaren Plan.“**
2. **„Ihr telc-B1-Termin steht. Was üben Sie heute?“**
3. **„Briefe überarbeiten. Sprechen üben. Mit neuen Aufgaben erneut testen.“**

These test exam specificity, planning relief and the practice mechanism respectively; their effectiveness is unverified.

For ranking only: assume the €149 pilot opens, 19% VAT and 10% refunds, giving approximately **€113 revenue per purchase** before operating costs. Effects below concern the next **300 relevant offer exposures**, are hypothetical and overlap. Before launch, their immediate sales effect is €0. Effort excludes release-gate and acquisition work.

| Rank | Change and exact location | Modelled effect; effort; authority | Measure / kill rule |
|---|---|---|---|
| 1 | Replace grammar-week descriptions with programme-derived activities; remove unsupported failure claims. `telc-b1-komplettvorbereitung.astro:112–174`; `data/exams/index.js:66`. | +0.5 percentage points ≈€169; **2h**, ≈€85/h. **[agents]** factual correction. | Four of five target readers must explain what they practise first. Revise if they cannot. |
| 2 | Add a labelled example letter, AI correction, revision and next activity beside the telc offer. Same page:168. | +1.5 points ≈€507; **8h**, ≈€63/h. **[owner]** approves published proof; agents prepare. | Four of five readers must identify the correction and next action. No testimonial or outcome implication. |
| 3 | Fix mobile hero containment. `index.astro:86–112`. | +0.25 points ≈€85; **1.5h**, ≈€57/h. **[agents]**. | No clipped copy or CTA at 320/360/390px with consent banner visible. |
| 4 | Add a concise German decision section explaining package versus Pro, access duration and current availability. Telc FAQ:62–81. | +0.4 points ≈€135; **3h**, ≈€45/h. **[owner]** approves framing/terms. | Four of five readers correctly explain what expires and what remains. |
| 5 | Replace the classroom-only price anchor with a short explanation of when self-study, this sequence or teacher-led preparation fits. Telc page:201. | +0.25 points ≈€85; **3h**, ≈€28/h. **[owner]** approves comparative messaging. | Stop if readers still cannot articulate a reason to pay beyond library access. |

Derive prices from `pricing.js`; publish counts through `marketing.js` with programme provenance. Keep the release gate, comparison-page freeze and Pro optimisation freeze intact (`million-plan-2026-10.md:128–142,275–289`).

Screen headlines through comprehension interviews first. Do not run three underpowered homepage experiments. Commercial judgement requires reconciled qualified exposures, payments and refunds; the approved pilot rule changes the package once below three sales after at least 300 qualified views (`million-plan-2026-10.md:193–194`).

**5. What remains unverified**

- **Learning effectiveness and grading accuracy:** have the planned assessor blind-rate twenty letters; inspect speaking feedback and retest difficulty separately. Code proves mechanisms, not outcomes (`million-plan-2026-10.md:173`).
- **Live authenticated behaviour:** test signup → first exam task → feedback → matching offer with controlled accounts. Signed-out captures cannot establish this.
- **Buyer language and metaphor preference:** observe booked candidates explaining the offer without prompts. Goethe B1’s 45 preferences versus ten telc B1 preferences are not paid demand (`FACTS.md:9`).
- **Founder provenance:** the brief says solo founder; live About says “team of doctors.” The branch standardises the plural, but consistency does not verify truth (`C/site__ueber-uns.md:45`; branch `src/data/marketing.js:229–233`). **[owner]** resolves the fact before using it as proof.
- **Conversion effects:** every euro estimate above is unverified. Preserve consent-gated analytics (`public/consent.js:13–36`); any new measurement basis or public endpoint requires **[owner]** approval.

