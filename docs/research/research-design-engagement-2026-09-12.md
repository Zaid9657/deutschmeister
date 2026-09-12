# Design & engagement patterns that make an online language course "finishable"

Research memo for deutsch-meister.de (React SPA + Astro, web only). All sources checked 2026-09-12. "Not found" = no primary/verifiable source located.

## 0. Evidence-quality legend

- **A** = randomised/A-B test with published numbers (mostly Duolingo blog/KDD, HarvardX).
- **B** = platform correlational data (Coursera, Ruzuku, Duolingo shareholder letters).
- **C** = vendor description / design case study, no effect size.
- Key caveat from Duolingo's own numbers: their *causal* lifts are small (+0.38 % to +3.3 %); the big multipliers ("3.6× more likely to finish") are correlations of already-motivated users (https://blog.duolingo.com/how-duolingo-streak-builds-habit/ ; critique https://hosdocumentary.com/articles/duolingo-streak).

## 1. Course home / path visualisation

| Pattern | Who | What's on the node | Evidence | Downsides |
|---|---|---|---|---|
| **Linear "path" (map)** — units → levels (circles), each level = ~5 lessons, progress ring, gold tick when done, lock when not; chests every few nodes; unit header with 1-line "what you'll learn" + Guidebook (tips) link; unit-end trophy/review; characters animate beside nodes | Duolingo since 1 Nov 2022 (https://blog.duolingo.com/new-duolingo-home-screen-design/, node anatomy https://www.reddit.com/r/duolingo/comments/vru9wz/, https://www.cnet.com/tech/services-and-software/8-changes-duolingo-made-for-easier-language-learning-in-2022/) | Practice/review interleaved in the path so there are no "cracked skills" | Duolingo's own retrospective: path did **not** immediately move DAU/monetisation; the +17 % learning-time / 3× highly-engaged figures often attributed to the path are from the **leaderboards** launch (https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth ; https://www.lennysnewsletter.com/p/the-secret-to-duolingos-growth). Path effect size: **not found**. | Removed learner choice; "one thing at a time" was the point |
| **Syllabus sidebar + % + "Next lesson" CTA** (list) | Teachable/Kajabi/Thinkific; Babbel "Learning plan" tab; Busuu "Learn" tab shows "Beginner A1 · Chapter 1 · 1 of 6 lessons" | Lesson state, duration, lock/drip | C for the widgets; B for what predicts completion: Ruzuku — learners who finish a lesson in week 1 complete at 78.3 % vs 17.2 % (https://www.ruzuku.com/learn/articles/online-course-statistics); Coursera — on-deadline in first 2 weeks ≈ 2× completion (https://www.coursera.org/about/press/wp-content/uploads/2020/10/Coursera_DriversOfQuality_Book_MCR-1126-V4-lr.pdf) | None; it is the credible default |
| **Mastery levels per skill** (Familiar → Proficient → Mastered), "Up next", course level aggregating proficient skills | Khan Academy (https://support.khanacademy.org/hc/en-us/articles/360054115071, mastery challenges https://support.khanacademy.org/hc/en-us/articles/360037494231) ; Brilliant "Learning Paths" with checkpoints (https://brilliant.org/help/features/) | Only *demonstrated* proficiency counts, not views | C (Khan cites its own efficacy research, no isolated number) | More UI states to explain |
| **Calendar / week structure** | Coursera weeks with soft, resettable deadlines (https://blog.coursera.org/coursera-update-striking-a-balance-with-start/, "Reset deadlines" https://blog.coursera.org/improvements-to-sessions-experience-for-learners/); Busuu Study Plan | Due dates, "behind / on track" | B (Coursera: sessions "drove completions"; no % published) | Rigid dates deter enrolment (Coursera's stated reason for softening) |
| **Endowed progress** — start bars pre-filled with what the learner already did | Generic | — | A: Nunes & Drèze 2006, 34 % vs 19 % completion (https://doi.org/10.1086/500480) | Feels fake if the endowment is unexplained |

## 2. Lesson screen & micro-interactions

| Element | Practice | Evidence |
|---|---|---|
| Top progress bar, one exercise per screen, big primary button bottom | Duolingo, Babbel, Busuu, Speak | Goal-gradient (Kivetz/Urminsky/Zheng, via https://productdesignpsychology.com/19-fake-progress-is-real-motivation/) — C/B |
| Correct/incorrect: green/red bottom sheet + distinct sound; combo escalation ("5 in a row") | Duolingo (https://uxplanet.org/analyzing-duolingo-from-product-design-perspective-after-400-days-of-non-stop-practice-c4d4809bdb37; sound family by Ambrose Yu https://ambroseyu.com/work/duolingo-core-product-sounds) | No published A/B for sound; one accessibility critic argues arpeggio-combo sound punishes errors (https://www.linkedin.com/posts/gregoryweinsteinphd_sounddesign-uxr-activity-7349508224259174400-DSqN). Effect size **not found** |
| Show "Session complete" immediately while work finishes in background | Duolingo | 60 %+ perceived-latency cut + DAU lift, secondary account (https://www.uladshauchenka.com/p/duolingo-case-study-the-gamification) — B |
| Character illustration: **2-D vector, geometric shapes, minimal detail, white negative space**; built in Figma; "quick to produce" was the stated goal, not aesthetics | Duolingo art team (https://blog.duolingo.com/shape-language-duolingos-art-style/, https://blog.duolingo.com/designing-new-characters-internship/). Lip-sync via Rive state machines driven by phoneme timings (https://blog.duolingo.com/world-character-visemes/). Per-character "correct answer" reaction animations (https://blog.duolingo.com/building-character/) | C. Duo's 3-D is marketing/ads; in-app remains flat vector. No test of characters vs none published. |
| Haptics | Native apps only; iOS Safari has no Vibration API; Android Chrome `navigator.vibrate` works (https://openpwa.net/reference/platforms/ios-safari/) | — |
| Hearts → Energy (2025) | Duolingo replaced hearts because beginners were 2× likelier to run out mid-lesson; Energy "helps more learners complete lessons" (https://blog.duolingo.com/duolingo-energy/, https://www.theverge.com/news/665315/duolingo-hearts-energy-system) | Penalty mechanics correlate with anxiety and pausing (thesis https://www.diva-portal.org/smash/get/diva2:1971949/FULLTEXT01.pdf) |

## 3. Motivation loop

| Mechanic | Users | Measured effect | Downsides |
|---|---|---|---|
| **Streak** (1 lesson/day, decoupled from daily goal) | Duolingo, Brilliant (3 problems or 1 lesson), Khan (weekly, needs 1 new proficient skill) | A: decoupling streak from goal → +3.3 % D14, +1 % DAU, +40 % learners on 7+-day streak (https://blog.duolingo.com/improving-the-streak/); streak animation +1.7 % D7; 2 freezes +0.38 % DAU (https://blog.duolingo.com/how-duolingo-streak-builds-habit/); Streak Wager +14 % D7; Weekend Amulet +4 % week-later return (https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/). B: 10-day streak = drop-off falls sharply; >600 streak experiments in 4 yrs (https://www.latios.ai/lennys/episodes/jackson-shuttleworth) | Brittle: streak break → churn (850-day-streak user quit, Oulu thesis https://oulurepo.oulu.fi/bitstream/handle/10024/54117/nbnfioulu-202502121605.pdf); fitness-app data: −22 % next-day engagement after break (https://steadypractice.me/research/surveys/streak-psychology). Loss-aversion coefficient itself contested (λ≈1.07–1.96, https://hosdocumentary.com/articles/duolingo-streak) |
| **Streak forgiveness** (freeze, weekend amulet, repair, revival) | Duolingo | Above; Streak Revival June 2026 revived 15.4 M streaks incl. ~8 M lapsed users — one of three named drivers of Q2-2026 DAU growth (https://investors.duolingo.com/static-files/3c8277ee-bc94-4f5d-9b77-0db3e46f88b8) | Cheapens the streak if unlimited |
| **Reminders** — practice reminder 23.5 h after last session; 22:00 "streak saver"; bandit picks copy | Duolingo | A: bandit +0.5 % DAU, +2 % new-user retention (KDD 2020 https://research.duolingo.com/papers/yancey.kdd20.pdf); notification copy +5 % DAU, app-icon badge dot +6 % DAU (https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/) | Fatigue; needs decay of repeated copy |
| **Daily goal with minutes** | Duolingo (5/10/15/20 min), Busuu | No isolated Duolingo lift published (**not found**); higher goals made streaks *less* likely (above) | Over-ambitious defaults hurt |
| **XP / points** | Duolingo, Brilliant, Khan skill points | No isolated effect (**not found**) | Rewards volume over correctness |
| **Leagues / leaderboards** (30 people, weekly, promote/demote) | Duolingo, Brilliant | A: +1 % D1, +2 % D7, +3 % D14, +17 % learning time (https://www.lennysnewsletter.com/p/the-secret-to-duolingos-growth). Systematic review: positive or null, design-dependent (https://onlinelibrary.wiley.com/doi/full/10.1111/jcal.13077) | XP farming of easy lessons, demotion demotivates; users who met all goals still demoted (https://ar5iv.labs.arxiv.org/html/2203.16175); 30 % of surveyed users find them not motivating (Oulu) |
| **Badges** | Duolingo v1 | +4.1 % session starts, +4.5 % completions, +116 % friend adds (secondary, https://relaunch.ai/blog/duolingo-onboarding-teardown-7-b-tests-behind-their-9-conver.html) | Meta-analyses: motivation up, competence flat (https://math.kilowatto.com/en/research/mc-16-duolingo-gamification/) |
| **Certificates** | Busuu (McGraw Hill, per CEFR level after End-of-Level test, retake after 2 weeks, Premium only, https://www.busuu.com/en/languages/certification); Coursera; Teachable/Kajabi | B: paid-certificate learners +8–9 % engagement lasting until pass mark; sunk-cost +17–20 % but fades in weeks (Michigan/Ross, https://record.umich.edu/articles/research-shows-certificates-boost-mooc-completion-rates/, https://psycnet.apa.org/record/2022-26028-002) | Not a substitute for Goethe/telc; say so |
| **Social/friend streak** | Duolingo: 1/3 of DAU have a Friend Streak, >½ follow a friend (https://investors.duolingo.com/static-files/99006c40-d8cf-41ca-b5b1-c5cb1fa5ba88, https://investors.duolingo.com/static-files/4e06bcf5-20f4-44a1-a751-6389e82f3467) | "Early results excellent", no number | Needs a user graph |
| **Shareholder-letter attribution** | Q4-24: product features + DAU/MAU 34.7 %, marketing, Max/Video Call; Q4-25: 52.7 M DAU, growth slowing to ~20 %, Video Call moving to Super; Q2-26: product changes, marketing, Streak Revival (links above; https://investors.duolingo.com/static-files/961ce633-3cee-49d0-bd7a-2c63731d45fb) | — | — |

## 4. Planning to a date

- **Busuu Study Plan** (Premium): pick target CEFR level, study days, minutes/day, reminders, calendar sync → auto-estimated completion date; adjustable to a personal deadline; tracks weekly minutes and projected finish (https://www.busuu.com/en/english/personalized-study-plan-busuu-premium). Effect size **not found**. Uses Cambridge guided-hours per level (A1 90–100 h … B2 500–600 h) to size the plan (https://www.busuu.com/en/english/language-learning-levels).
- **Lingoda Sprint**: 15 or 30 classes/month × 2 months, 100 % attendance, 1 class/day max, >10 min missed = class void → 50 % cash back or 100 % in class credits (rules https://www.lingoda.com/downloads/sprint/69b/2026-Sprint-69b-Rules-April-Start-EN.pdf; Marathon 89 % threshold https://www.lingoda.com/downloads/language-marathon/MarathonChallengeRules_en-03-2020.pdf). Completion rate **not found** (site shows only "students won" counter, https://www.lingoda.com/en/sprint/). Downside: one missed class kills the whole incentive; auto-renews (https://www.expatden.com/germany/lingoda-german-sprint-review/).
- **Coursera**: soft, personalised deadlines with one-click "Reset"; sessions "drove completions" but rigid start dates deterred enrolment (links §1). NYU field experiment: imposed deadlines did **not** raise completion (https://bpb-us-e1.wpmucdn.com/wp.nyu.edu/dist/c/16384/files/2021/07/1-s2.0-S0899825619301757-main.pdf); UVA MOOC data: taking quiz 1 on release day +15.4 pp completion (https://libraetd.lib.virginia.edu/downloads/70795791z?filename=Thesis.pdf).
- **Planning prompts** (when/where/obstacles): +29 % completion, +40 % certificate purchase in 3 HarvardX MOOCs (Yeomans & Reich 2017, https://dl.acm.org/doi/10.1145/3027385.3027416) — but a 4-course replication found no pooled effect (https://rem.rc.iseg.ulisboa.pt/lese/5e3/files/Papers/planning-prompts_Rzepka.pdf). Ask for concrete actions + obstacle plans, not just a time.

## 5. Social proof & accountability inside the course

- Ruzuku: lesson-level discussion 50.9 % vs 37.3 % completion; scheduled cohorts 53.4 % vs 41.9 % self-paced (https://www.ruzuku.com/learn/articles/online-course-statistics) — B.
- Coursera: early forum participation +25 % completion (Drivers of Quality PDF) — B.
- Busuu community corrections; Duolingo Friend Streak/Quests (§3). Sailer & Homner 2020 meta-analysis: competition-*plus*-collaboration is the strongest moderator (g≈0.25–0.49) (via https://math.kilowatto.com/en/research/mc-16-duolingo-gamification/).
- Usage counters ("2,488 exercises") — CLAUDE.md already bans unsourced ones; the research adds nothing to justify them.

## 6. Onboarding, minutes 1–10

Duolingo: why-learning → daily-goal (default 10 min) → self-rated level → optional 3–5-question placement → 3-second "building your course" → first lesson → "1-day streak" celebration → sign-up **after** the lesson (https://gummble.com/blog/duolingo-onboarding-flow-analysis). A: delayed sign-up +20 % DAU; soft-wall→hard-wall +8.2 % (https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/, https://relaunch.ai/blog/duolingo-onboarding-teardown-7-b-tests-behind-their-9-conver.html). Busuu: 5-minute placement test sets CEFR start (https://www.busuu.com/en/english/cefr-language-levels). Speak: Learn → Practice → Apply, start button + sequence, "fewer decisions" is the pitch (https://www.speak.com/blog/how-speak-reinvents-language-learning); no retention numbers published (**not found**). Seedlang: sentence-level video cards + SRS decks, no path (https://yourdailygerman.com/seedlang-language-app-review/).

## 7. Mobile-web without a native app

| Capability | Status | Source |
|---|---|---|
| Web push | Android Chrome yes; iOS 16.4+ only when added to Home Screen, permission from a tap inside the installed app | https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers, https://openpwa.net/reference/platforms/ios-safari/ |
| Install prompt | `beforeinstallprompt` Android only; iOS needs manual Share → Add to Home Screen instructions | same |
| Haptics | iOS Safari none; Android `navigator.vibrate` | same |
| Audio | must unlock AudioContext on first tap; never make sound the only feedback | https://nextjs.org/docs/app/guides/progressive-web-apps |
| Offline | service worker for shell + explicit "download lesson" | same |
| Fallbacks that work everywhere | **Email** reminders (Resend already wired), calendar .ics for study plan, in-app "next due" banner, browser tab title/favicon badge | — |

## 8. Accessibility & low bandwidth (TR / IN / XK / PK)

- Median mobile download (Ookla, Mar 2026): Kosovo 152 Mbps, India 127, Turkey 110; Pakistan ≈25 (2025) — p75 users on entry Androids are far below medians (https://en.wikipedia.org/wiki/List_of_countries_by_Internet_connection_speeds, https://datareportal.com/reports/digital-2026-kosovo, https://worldpopulationreview.com/country-rankings/internet-speeds-by-country). Android/data-price shares: **not found** in this pass.
- Budgets: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 at p75 on real phones; first-screen image <100 KB; AVIF/WebP + `srcset`; Opus/AAC mono audio, preload metadata only, transcripts for every clip (https://www.corewebvitals.io/pagespeed/optimize-core-web-vitals-for-low-end-devices). Duolingo treats Android performance as a growth lever: 200+ perf A/Bs in 2024 credited with "hundreds of thousands" of DAU (https://www.uladshauchenka.com/p/duolingo-case-study-the-gamification).
- WCAG 2.2 AA: never colour-only correctness (matters doubly here because colour = grammatical case in the token system), `prefers-reduced-motion`, no timed exercises by default, visible focus, 44 px targets, RTL-safe layout for Urdu speakers.

## 9. Prioritised list

**Must have**
1. Persistent syllabus + "Next lesson" CTA + per-level % — first-week lesson completion is the strongest completion predictor (Ruzuku 78 % vs 17 %; Coursera 2×).
2. First lesson before sign-up, sign-up framed as "save progress" — +20 % DAU (Duolingo A/B).
3. Exam-date backward plan with weekly minutes and "on track / behind", editable, with one-click reset — Busuu/Coursera pattern; rigid deadlines don't add completion (NYU), soft ones keep structure.
4. Reminder at last-practice-time +23.5 h and a same-evening "last chance" — Duolingo's most durable finding; deliver by email/web-push with iOS install instructions.
5. Streak counted on *any* lesson, decoupled from daily goal, with 1–2 forgiveness days/week — +3.3 % D14 and +40 % 7-day streaks; forgiveness prevents the break-and-quit failure.
6. Endowed progress: pre-fill from placement test and prior activity — 34 % vs 19 %.
7. Mastery states per grammar topic (learned / practised / secure) fed by spaced review — Khan + Babbel Review Manager (intervals 1/4/7/14/60 d/6 mo, https://support.babbel.com/hc/en-us/articles/205600228-Review); Babbel's efficacy studies rest on this loop (https://msutoday.msu.edu/news/2019/07/new-study-gives-insight-on-effectiveness-of-language-learning-apps).
8. Level certificate after an end-of-level test, clearly labelled "not a Goethe/telc result" — +8–9 % engagement to pass mark; UWG-safe wording.
9. Performance budget on entry Androids — Duolingo counts perf as DAU.

**Nice to have**
- Planning prompt at purchase ("when, where, what if…") — +29 % in one trial, null in replication; cheap to A/B.
- Combo/"perfect lesson" celebration with short sound + reduced-motion fallback — no published lift, low cost, but ship a mute toggle.
- Streak-milestone moments (7/30/100 days) — +1.7 % D7 for animation.
- Small cohort accountability (a weekly "who's on track" among learners with the same exam date) — cohort data 53 % vs 42 %.
- Badges tied to *difficulty* (hard-earned achievements retain far better than trivial ones; Trophy platform data https://trophy.so/blog/duolingo-gamification-case-study — vendor, B-).

**Skip (decoration or harmful)**
- Leagues/XP leaderboards — +2–3 % retention at Duolingo scale needs 30-person weekly cohorts you don't have, and the documented XP-farming and demotion demotivation contradict "credible exam prep".
- Hearts/lives — Duolingo itself abandoned them for penalising beginners.
- Animated mascot with lip-sync — Rive + phoneme pipeline is a team-scale investment; no effect published.
- Gems/chests/variable loot — no learning evidence; reads as childish.
- Usage-count social proof — banned already, and no study shows it moves completion.
- Hard "miss one, lose all" commitment refunds (Lingoda style) — no completion data published, single-failure disqualification generates resentment.

## 10. Visual direction (one paragraph)

Borrow Duolingo's *production* lessons, not its look: one exercise per screen, a single primary action, a thin progress bar, feedback that is text + icon + colour (never colour alone), and illustrations built from few vector shapes with white space so they stay legible at 360 px and cost nothing to ship. Keep the existing token system — Fraunces display, hairline rules, one interactive teal, case colours reserved for grammar — because the research says credibility comes from structure (syllabus, mastery states, a dated plan, a certificate with honest wording), while "fun" comes from pace and micro-feedback (instant correct/incorrect, a quiet combo sound, a milestone card at day 7/30), not from mascots or loot. Motion should be short, purposeful, and honour `prefers-reduced-motion`; the emotional peaks are the placement result, the first finished lesson before sign-up, and the "on track for your exam on <date>" banner — an adult, exam-serious version of the streak flame.
