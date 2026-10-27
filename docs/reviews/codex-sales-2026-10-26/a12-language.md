**1. Score: 2/5**

DeutschMeister has useful English and German content, but its language strategy follows page families rather than buyers. The documented policy makes discovery and account journeys English while keeping exam acquisition pages German ([language-strategy.md:5](/home/user/deutschmeister/docs/language-strategy.md:5)). Consequently, someone reading a German exam offer reaches an English signup. The lesson player already supports English and German instructions, so a complete localisation rebuild is unnecessary ([strings.js:32](/home/user/deutschmeister/src/lib/lesson/strings.js:32)). The immediate commercial priority is German continuity through the exam purchase journey. Actual language-related abandonment remains **unverified**.

Evidence below distinguishes **live captures** from **repo code checked against local main**. Revenue effects are assumptions, not measured uplift. No files were changed.

**2. Findings, most important first**

**The German acquisition journey changes language precisely when commitment increases.**

The live telc offer says “Kostenloses Konto anlegen” and links to `/signup` (`site__telc-b1-komplettvorbereitung.md:56`). The [live signup](https://deutsch-meister.de/signup) presents “Start your 7-day Pro trial”; the English heading, purchase explanation and confirmation instructions are hardcoded in [SignupPage.jsx:233](/home/user/deutschmeister/src/pages/SignupPage.jsx:233).

This creates two comprehension problems: the language changes, and the exam-specific promise becomes a general Pro trial. Someone capable of reading B1 German has not necessarily demonstrated enough English to understand billing, confirmation or recovery instructions. That is a commercial inference, not a measured demographic fact.

The root cause is explicit: the policy assumes the product serves English-speaking learners ([language-strategy.md:18](/home/user/deutschmeister/docs/language-strategy.md:18)). German acquisition has been added without completing its conversion journey.

The shared `LanguageNotice` compounds this: English readers of an exam page are directed to the **grammar library**, not an equivalent exam explanation ([LanguageNotice.astro:13](/home/user/deutschmeister/astro-site/src/components/LanguageNotice.astro:13)). This is a warning about a boundary, not localisation.

**The apparent language data cannot establish who the buyers are.**

The supplied premise that `profiles.preferred_language` contains only `en` does **not** establish universal English preference:

- The profile language buttons call `i18n.changeLanguage()` without updating the profile ([ProfilePage.jsx:196](/home/user/deutschmeister/src/pages/ProfilePage.jsx:196)).
- That preference is stored locally as `dm_lang`, defaulting to English ([i18n.js:348](/home/user/deutschmeister/src/utils/i18n.js:348)).
- The recorded signup trigger inserts identity and attribution fields, but does not populate `preferred_language` ([migration:44](/home/user/deutschmeister/migrations/2026-09-20-acquisition-attribution.sql:44)).
- Lesson instructions use a separate `dm_lesson_lang`; videos use `dm_video_lang` ([strings.js:32](/home/user/deutschmeister/src/lib/lesson/strings.js:32), [VideoDetailPage.jsx:11](/home/user/deutschmeister/src/pages/VideoDetailPage.jsx:11)).

The field’s **live default and distribution remain unverified**. It is unsafe to interpret it as a survey response.

The relevant distinctions are **search language, interface language and explanation language**. An Arabic, Turkish, Ukrainian, Farsi or Hindi speaker might prefer German purchasing and mother-tongue learning support. A Hindi speaker might instead prefer English throughout. None of these distributions is established by the evidence.

There is exam interest—95 named exam choices in 60 days—but no language breakdown of those choices (FACTS.md, Accounts: **95 named; 129 unset**).

**The public language map is broader than “English homepage, German exams.”**

This inventory covers every Astro template and the public SPA route families. “English” describes the wrapper/explanations; German learning material can appear within it.

| Public pages | Current language and evidence |
|---|---|
| `/`, `/pricing/` | English live: “From Guten Tag to B2…” and “Own a level…” (`site__home.md:44`; `site__pricing.md:44`). |
| `/courses/`, eight `/courses/{level}/` pages | English in code; captured A1.1, A1.2, A2.1 and B1.1 agree ([level template:101](/home/user/deutschmeister/astro-site/src/pages/courses/[level].astro:101); each corresponding capture, line 5). |
| `/grammar/`, level hubs, topic pages | English explanations with German examples; code evidence ([grammar/index.astro:72](/home/user/deutschmeister/astro-site/src/pages/grammar/index.astro:72), [topic template:360](/home/user/deutschmeister/astro-site/src/pages/grammar/[level]/[slug].astro:360)). |
| `/pruefung/` and six exam pages: telc B1/B2, Goethe B1/A2, Start Deutsch 1, DTZ | German live, with English navigation and language notice (`site__pruefung.md:43`; six exam captures, line 5). |
| `/leitfaden/` and guide entries | German hub; **16 German guides and two English guides** in the code registry. English exceptions are `goethe-b1-writing-examples` and `goethe-b1-speaking-presentation` ([registry:102](/home/user/deutschmeister/astro-site/src/data/guides/index.js:102), [writing:23](/home/user/deutschmeister/astro-site/src/data/guides/goethe-b1-writing-examples.js:23), [speaking:19](/home/user/deutschmeister/astro-site/src/data/guides/goethe-b1-speaking-presentation.js:19)). Captured core guides are German. |
| `/vergleich/`, `/vergleich/{babbel,duolingo,lingoda}/`; telc sales page | German code; telc sales page also captured German ([comparison template:123](/home/user/deutschmeister/astro-site/src/pages/vergleich/[slug].astro:123); `site__telc-b1-komplettvorbereitung.md:5`). |
| `/privacy/`; `/impressum/`; story form and thanks; 404 | Respectively English, German, English/English, English in code ([privacy:16](/home/user/deutschmeister/astro-site/src/pages/privacy.astro:16), [impressum:21](/home/user/deutschmeister/astro-site/src/pages/impressum.astro:21), [story:10](/home/user/deutschmeister/astro-site/src/pages/share-your-story/index.astro:10), [thanks:6](/home/user/deutschmeister/astro-site/src/pages/share-your-story/thanks.astro:6), [404:21](/home/user/deutschmeister/astro-site/src/pages/404.astro:21)). |
| Public SPA: signup/login/recovery/verification, FAQ/About, intro, support, video library/detail, podcasts, placement, reading/listening/vocabulary, X-Ray | English default, with partial German controls on several screens; route inventory in [App.jsx:149](/home/user/deutschmeister/src/App.jsx:149) and English crawlable metadata in [seoRoutes.js:51](/home/user/deutschmeister/src/data/seoRoutes.js:51). Signup/verification remain substantially hardcoded English. |

The `/intro` video menu already lists English, Arabic, Spanish, Russian, Hindi and Chinese. Those media choices do not establish translated account journeys or verified playable assets ([IntroPage.jsx:13](/home/user/deutschmeister/src/pages/IntroPage.jsx:13)).

`/de/` is **404**, independently rechecked live and recorded in FACTS.md. `/agb/` and `/widerruf/` are also reported 404 there.

Metadata mostly follows document language correctly: Astro sets `html lang` and `og:locale`; however, it advertises the opposite `og:locale:alternate` universally ([Layout.astro:91](/home/user/deutschmeister/astro-site/src/layouts/Layout.astro:91), [Layout.astro:122](/home/user/deutschmeister/astro-site/src/layouts/Layout.astro:122)). No translated URL pairs are supplied through `hreflang`; the SPA deliberately omits it ([SEO.jsx:47](/home/user/deutschmeister/src/components/SEO.jsx:47)). Missing translated pages are the commercial problem; adding tags alone cannot solve it.

**German money copy needs correction, but register inconsistency is not the biggest sales loss.**

The telc page contains the unnatural phrase “die schwächsten Themen gezielt schließen”; one closes **Wissenslücken**, not topics (`site__telc-b1-komplettvorbereitung.md:84`). Its claim about why “most” candidates fail has no supporting provenance in the page ([telc page:138](/home/user/deutschmeister/astro-site/src/pages/telc-b1-komplettvorbereitung.astro:138)).

German subscription screens still render English-style prices such as `€40.00` and `€9.99/Monat`, although `deEur()` already exists ([SubscriptionPage.jsx:534](/home/user/deutschmeister/src/pages/SubscriptionPage.jsx:534), [pricing.js:52](/home/user/deutschmeister/src/data/pricing.js:52)). These are correctness defects, not grounds for another Pro merchandising project.

The course’s **Sie** requirement applies to tasks, notices, cards and mail—not expressly all marketing ([CLAUDE.md:79](/home/user/deutschmeister/CLAUDE.md:79)). Therefore the telc page’s **du** is not automatically a rule breach. It does conflict with formal billing copy such as “Ihre letzte Zahlung…” ([SubscriptionPage.jsx:418](/home/user/deutschmeister/src/pages/SubscriptionPage.jsx:418)). Any conversion penalty from that register change is **unverified**.

**Arabic is existing draft work, not a ready growth channel.**

[PR #188](https://github.com/Zaid9657/deutschmeister/pull/188) describes five Arabic public pages and Arabic support for lessons 1–3, but explicitly reports no human-reviewed Arabic text and unresolved live verification. The approved plan parks it ([million-plan:285](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:285)). Shipping translated promises before confirming comprehensible delivery would create another incomplete journey.

**3. Sub-scores**

| Question | Score | Evidence |
|---|---:|---|
| **(a) Public language architecture** | **2/5** | German acquisition → English signup; `/de/` 404; inventory above. |
| **(b) Understanding buyers’ languages** | **1/5** | Local toggles do not populate `preferred_language` ([ProfilePage.jsx:196](/home/user/deutschmeister/src/pages/ProfilePage.jsx:196)). |
| **(c) du/Sie discipline** | **3/5** | Formal course standard exists; informal marketing and formal billing coexist. |
| **(d) German money-page correctness** | **2/5** | Awkward wording, unsupported majority claim and English price formatting, cited above. |
| **(e) Minimum useful localisation** | **3/5** | English/German lesson controls already exist; conversion continuity remains incomplete ([strings.js:32](/home/user/deutschmeister/src/lib/lesson/strings.js:32)). |

**4. Recommendations, ranked by plausible revenue per hour**

**Clean sheet: hybrid**—preserve useful English learning support and existing German search URLs; complete a small German exam-buying journey.

Adding more notices would take roughly 1–2 hours but preserve the underlying switches. Replacing the site with German-only discovery would require substantially more rewriting and risks excluding English-dependent beginners. The hybrid directly addresses the observed journey; those impact assessments and effort estimates are **unverified**.

Use this URL architecture:

| Purpose | English | German |
|---|---|---|
| Home | `/` | `/de/` |
| Prices | `/pricing/` | `/de/preise/` |
| Exam acquisition | Selected `/en/exams/{slug}/` | Preserve `/pruefung/{slug}/` |
| telc offer | Later `/en/telc-b1-preparation/` | Preserve existing telc URL |
| Accounts | Existing routes, explicit `?lang=en` | Same routes, `?lang=de` |
| Lessons | Same course/progress | Same course/progress; chosen instruction language |

**[agents]** Maintain a small locale-to-URL registry. Give real translated pairs self-canonicals and reciprocal `hreflang`; preserve German exam terms and examples inside English explanations. Display **Deutsch / English**, and offer only languages supported at the destination.

For sizing, assume the next **300 qualified offer views in the relevant language**, a future owner-approved **€149 pilot**, 19% VAT and 10% refunds: approximately **€113 retained revenue per additional purchase**, before fees and fulfilment. These are the plan’s modelling assumptions ([million-plan:66](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:66)). Exposure timing and uplift are unknown; estimates below overlap and must not be added.

| Rank | Change and exact location | Assumed effect / effort | Authority and measure rule |
|---|---|---|---|
| **1** | Correct telc wording and unsupported claim; use `deEur()` for German displays in `SubscriptionPage.jsx`. | Assume +0.2–0.4 percentage points: **€68–135**, **2h**, €34–68/h. | **[agents]** Verify rendered amounts against `pricing.js`; retain correctness fixes without requiring a sales win. |
| **2** | Translate the complete signup/login/verification experience, including errors and purchase summaries, in the existing account pages and `i18n.js`; carry the German choice from exam CTAs. | Assume +1–2 points: **€338–676**, **12h**, €28–56/h. | **[agents]** UI work only. Verify zero unintended English across the journey; judge commercial effect after reconciled qualified exposure. |
| **3** | Add shared-template `/de/preise/` and a small `/de/` buyer page; localise German navigation in `Layout.astro`. | Assume +0.3–0.7 points: **€101–237**, **10h**, €10–24/h. | **[agents]** Build after account continuity. Stop expanding translated pages if qualified German visits do not reach signup or the offer. |
| **4** | Align default selection across `i18n.js` and lesson `strings.js`, while allowing a separate explanation-language override. Clearly label remaining English-only support. | Assume +0.1–0.3 points: **€34–101**, **6h**, €6–17/h. | **[agents]** Test fresh browser, saved choice, reload and Astro/SPA crossing; measure first-task completion by chosen instruction language. |

Additional decisions:

- **[owner]** Approve German **Sie** for offers and transactional communication; keep course commands formal. Do not commission a sitewide register rewrite.
- **[owner]** Verify checkout, receipt and authentication-email language during the required purchase/refund rehearsal. Checkout URL builders currently pass identity but no explicit locale ([CourseCheckout.astro:34](/home/user/deutschmeister/astro-site/src/components/CourseCheckout.astro:34)). Any payment or authentication changes remain owner-reserved.
- **[owner]** Keep Arabic parked. Reconsider one language only after declared requests reveal a reachable paying segment and a human reviewer is available. Test comprehension and delivery before translating the whole catalogue.
- **[agents]** Add English exam equivalents selectively after evidence of English exam demand. Preserve the two existing English Goethe guides; do not translate every exam page speculatively.

I disagree with the current evaluation’s recommendation to postpone all German money-page work until the pilot shows pull ([sales-evaluation:109](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:109)). German account continuity belongs in pilot preparation. A translated placement test should come later: the approved plan already says experienced exam learners should start with an exam task ([million-plan:178](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:178)).

Paid selling remains subject to the release gate. Measurement must preserve consent controls and use a reconciled denominator before commercial kill rules begin ([CLAUDE.md:58](/home/user/deutschmeister/CLAUDE.md:58), [PROTOCOL:28](/home/user/deutschmeister/docs/agents/PROTOCOL.md:28)).

**5. What could not be verified**

- **Actual language preferences:** obtain an aggregate `preferred_language` distribution, its live column default and trigger definition. Then collect optional, explicitly chosen interface/explanation preferences; do not infer language from names.
- **Language-related lost sales:** reconcile qualified view → signup → confirmation → first task → purchase/refund by language. FACTS reports **65 signups/30 days and zero sales/7 days**, insufficient to attribute losses to localisation.
- **Full live coverage:** uncaptured routes above are code evidence. Verify their rendered language and metadata after hydration.
- **Beginner comprehension and translated delivery:** run observed tasks with English-dependent beginners and German-preferring exam candidates. Inspect Arabic drafts with a qualified human reviewer.
- **Checkout and email language:** verify through the owner’s authorised rehearsal.

The read-only Supabase query could not run because the tool required approval and this session’s approval policy forbids it.

