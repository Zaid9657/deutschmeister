# 11 — UX and engagement for a self-paced course player (mobile-first, entry Android)

**Date:** 2026-09-26 · **Scope:** the player and course shell for all eight half-level courses (A1.1–B2.2) · **Status:** research input for the course-v2 blueprint. The spec outline at the end is a starting point for the design pass, not a design.

## Method

- **Web research.** About 35 web searches. Primary sources read in full or in abstract:
  - Duolingo's streak PM on Lenny's Podcast ([transcript](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md));
  - Mazal's growth post ([Lenny's](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth));
  - Gotthilf's A/B tests ([First Round](https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/));
  - Yancey & Settles, KDD 2020 ([PDF](https://research.duolingo.com/papers/yancey.kdd20.pdf));
  - two Duolingo blog posts;
  - abstracts of Villar et al. 2013, Mavletova & Couper 2014 and Baker, Evans & Dee 2016;
  - Russell's 2026 performance budget, Statcounter (Aug 2026), the WebKit Web Push post, and a law-firm FAQ on ZFU practice.
- **Local audit.**
  - `src/data/design-tokens.js` and `src/components/ui/` (Button, Card, Chip).
  - The current player parts, read as infrastructure rather than as a template: `components/lesson/StageShell.jsx`, `FeedbackSheet.jsx`, `LessonProgressBar.jsx`, `ComboChip.jsx`, `lib/course/plan.js`, `milestones.js` and `pages/CourseCertificatePage.jsx`.
- **Cross-reading.** 08 (competitors) and 09 (learning science) were read so this memo does not repeat them. The academic gamification evidence lives in 09 §10 and is cited from there. Audio coverage comes from `inputs/db-snapshot-2026-09-27.md`. No MCP calls were made.
- **How to read company evidence.** Duolingo, Busuu and Coursera figures are self-reported and measure *engagement* (DAU, CURR, D7), not learning. A retention win that costs learning is a loss for a course sold on exam readiness.

---

## Findings

### 1. The device and the hand

- **Android dominates.** Android holds **72.44 %** of mobile OS share in Germany, against 27.54 % for iOS ([Statcounter, Aug 2026](https://gs.statcounter.com/os-market-share/mobile/germany)).
- **Viewports.**
  - The top German mobile viewports are 393–414 CSS px wide; 360 is not in the top six ([Statcounter](https://gs.statcounter.com/screen-resolution-stats/mobile/germany)).
  - **WCAG 1.4.10 still requires reflow at 320 CSS px** ([W3C](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html)), so 360 is a floor, not a target.
- **Performance budget.** The 2026 baseline phone is a **Galaxy A24 4G**, standing for the 75th-percentile user. A JS-heavy page that must load in 3 s on 9 Mbps affords **≈ 1.2 MiB in total, 0.62 MiB of it JS** ([Russell](https://infrequently.org/2025/11/performance-inequality-gap-2026/)).
- **Grip.** Of 1,333 observations, **49 %** of people used one hand, 36 % cradled the phone and 15 % used two thumbs ([Hoober, UXmatters](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php)). The primary action belongs in thumb reach.
- **Targets and inputs.**
  - WCAG 2.5.8 sets a **24 × 24 CSS px** minimum target ([wcag22aa.org](https://wcag22aa.org/new-criteria/target-size/)).
  - iOS Safari zooms into any input set **below 16 px** ([CSS-Tricks](https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/)).
- **Waiting.** Response-time limits are 0.1 s (feels instant), 1 s (keeps flow) and 10 s (holds attention). Beyond 10 s a percent-done indicator is needed ([NN/g](https://www.nngroup.com/articles/response-times-3-important-limits/)). AI grading of speech or text lands in the 1–10 s range, so it needs designed waiting states.
- **Permissions.**
  - Microphone and notification prompts should follow a user action that explains the benefit ([web.dev](https://web.dev/articles/permissions-best-practices)).
  - Chrome moves sites with very low accept rates to a "quieter" prompt ([Chrome](https://developer.chrome.com/blog/notification-permission-data-in-crux)).
  - iOS allows Web Push **only for Home-Screen web apps** (16.4+), and only after a user gesture ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)). For iOS learners, email is the dependable reminder channel.
- **Audio coverage.** 2,561 of 2,597 `words` rows have audio (db snapshot), so an audio button can be standard. New B-level vocabulary will lack audio until the owner's Azure run, so the player needs an honest no-audio or computer-voice state.

### 2. One exercise per screen: what the evidence does and does not say

- **Paging does not win on completion.** On smartphones, *scrolling* questionnaires gave "significantly faster completion times, lower (though not significantly lower) breakoff rates, fewer technical problems, and higher subjective ratings" than *paging* ([Mavletova & Couper 2014](https://academic.oup.com/jssam/article-abstract/2/4/498/2937094)).
- **The case for one item per screen is the feedback loop.**
  - Retrieval with feedback roughly doubles the testing effect (g 0.73 vs 0.39, 09 §1).
  - Segmenting aids retention (d = 0.32, 09 §11).
  - Item-level feedback needs one committed answer at a time.
- **The 2014 cost of paging is gone.** Paging hurt then because each page was a server round trip. A client-side player has no round trip.
- **Rule: page the practice, scroll the input.** A practice item gets its own screen. A dialogue, reading text or rule card is one scrollable screen.
- **The current parts already get this right.** `StageShell` pins one primary action at the bottom. `FeedbackSheet` is a mobile bottom sheet with a single "Continue" and no close control. Keep that behaviour.

### 3. Progress architecture

- **Progress bars can backfire.** Across 32 experiments, a **constant-speed progress indicator did not reduce drop-off**. Fast-to-slow indicators reduced it; **slow-to-fast increased it** ([Villar, Callegaro & Yang 2013](https://openaccess.city.ac.uk/14427/)).
  - What hurts is a bar that stalls or whose denominator grows.
  - We must not fake speed. We can put a short stage first, and we must never let a re-queued mistake push the bar back.
- **Nearness to a goal motivates.**
  - Effort rises as a goal nears (goal gradient: [Kivetz, Urminsky & Zheng 2006](https://journals.sagepub.com/doi/abs/10.1509/jmkr.43.1.39)).
  - Pre-given progress raises completion. A loyalty card with 2 of 10 stamps given was completed by **34 %**, against 19 % for an empty 8-stamp card (Nunes & Drèze 2006, figures via [Coglode](https://www.coglode.com/nuggets/endowed-progress-effect)).
  - So: short nested goals, and honest credit for work already done, such as a Lektion tested out at placement.
- **Show the whole syllabus.**
  - Advance organizers help learning (ES ≈ 0.21) and retention (≈ 0.26) across 135 studies ([Luiten et al. 1980](https://journals.sagepub.com/doi/abs/10.3102/00028312017002211)).
  - Duolingo replaced its free-choice tree with a linear path because learners were unsure "whether they're using Duolingo the 'correct' or 'best' way". The path also builds review into the sequence ([blog](https://blog.duolingo.com/new-duolingo-home-screen-design); the post gives no numbers).
  - So: a linear default route, with every future Lektion visible and titled by what the learner will be able to do.
- **Frame progress as outcomes.** Telling new learners they are "seven times more likely to finish the course" with a 30-day streak was "a huge win" ([transcript](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)). The number is correlational. The transferable part is framing progress as the learner's outcome. For us that means can-dos and exam parts, never XP.

### 4. Onboarding and placement

- **Delay the sign-up.** Moving Duolingo's sign-up "back a few steps led to about a **20 % increase in DAUs**". Tuning its soft and hard walls later added **8.2 %** ([First Round](https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/)).
  - The free A1.1 Lektion 1 should be playable before an account exists. `SaveProgressCard.jsx` already saves progress on sign-up.
  - Paid-course previews belong to the first-lesson-leak decision in `docs/HANDOFF-2026-09-03.md`.
- **Do not trust self-rated levels.**
  - Self-assessment correlates only moderately with measured proficiency: **r = .466** across 67 studies ([Li & Zhang 2021](https://journals.sagepub.com/doi/abs/10.1177/0265532220932481)), and .63 in [Ross 1998](https://eric.ed.gov/?id=EJ566367).
  - Duolingo's adaptive placement misplaced learners until it added **partial credit**: "forgetting a noun should be considered worse than forgetting the article" ([blog](https://blog.duolingo.com/partial-credit-improvements-to-duolingos-placement-test/)).
  - So: placement *recommends a course*, and each Lektion can be tested out.
- **Let the learner choose, and let them decline.** Duolingo's streak-goal tests ([transcript](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)):
  - adding an **opt-out button** was "almost just as big a win" as offering an easier goal;
  - **pre-selecting the harder goal lost** significantly, because the act of choosing drove the engagement;
  - changing "Continue" to "Commit to my goal" was "a massive win".
- **Explain every mechanic in one line.** An eight-word explanation of how the streak works was worth "over 10,000 DAUs". Each mechanic we ship (review, pause days, plan) gets a one-line German explanation at first contact.

### 5. The habit loop: streaks with forgiveness

Duolingo's streak PM reports "over 600 experiments" ([transcript](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)). What they learned:

- **One unit of use.** Moving the streak from an XP target to "just do one lesson a day" was "a huge driver of DAUs". Learners did not value the streak any less.
- **Days 0–7 decide.** Retention climbs with each day until day 7, then "flattens".
- **Flexibility is the biggest lever.**
  - Two freezes beat one. **Three were no better than two**: "we were training them to take more time off."
  - **Two free freezes at the start of a new streak** was one of the biggest wins.
  - **Earn Back** (a few lessons soon after a break restore the streak) "was such a retention winner", where the paid Streak Repair was not.
  - The Weekend Amulet raised D7 retention by 2.1 % and D14 by 4 % ([First Round](https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/)).
- **Counterweights.**
  - "Perfect Streak" turns the streak gold when no freeze was used. It carries no reward, yet it pulls learners back toward daily practice.
  - Lead with the **number**, not the flame.
  - Extra streak concepts shown before day 7 "pretty universally … lose".
- **Keep money out of it.** The PM "would love to get rid of" the monetisation hooks on freezes. A one-time price gives us no reason to sell forgiveness.
- **Independent evidence agrees.**
  - Logs that show an *intact* streak raise later engagement more than logs that show a broken one, and the effect weakens when the streak can be **repaired** ([Silverman & Barasch 2023](https://academic.oup.com/jcr/article-abstract/49/6/1095/6623414)).
  - Missing one day "did not materially affect the habit formation process". The median time to automaticity was 66 days, with a range of 18–254 ([Lally et al. 2010](https://onlinelibrary.wiley.com/doi/abs/10.1002/ejsp.674)).
  - So a daily count with **automatic, free** forgiveness is honest. A reset to 0 punishes the returner and teaches nothing (consistent with 09 #18).

### 6. Reminders

- **Duolingo sends two reminders a day** ([transcript](https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/jackson-shuttleworth/transcript.md)):
  - a practice reminder **23.5 h after yesterday's practice**;
  - a **22:00 "streak saver"**, which learners read "by and large as a positive notification".
- **Protect the channel.** The growth team's rule was to "protect the channel" from opt-outs ([Mazal](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)). One winning copy was worth **+5 % DAU** ([First Round](https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/)).
- **Rotate the copy.** A bandit that chose between reminder templates gained **+0.5 % DAU and +2 % new-user retention**. "Fresh" templates did better. One template sent "day after day … will get repetitive, desensitize users, and fail to improve engagement" ([Yancey & Settles 2020](https://dl.acm.org/doi/10.1145/3394486.3403351)).
- **Time re-entry to landmarks.** Aspirational behaviour rises after temporal landmarks such as a new week or month ([Dai, Milkman & Riis 2014](https://pubsonline.informs.org/doi/10.1287/mnsc.2014.1901)). Send re-entry messages on Mondays.
- **Nudges have limits.** A MOOC self-scheduling nudge (N = 18,043) had **no near-term effect and weakly negative longer-term effects** on engagement, persistence and performance ([Baker, Evans & Dee 2016](https://eric.ed.gov/?id=EJ1194402)). Planning prompts also fade at scale (09 §12). Reminders support a good course but cannot rescue a weak one, and each one should be tested.
- **Channels.**
  - The course-reminder mailer is already live (18:00 UTC, `lifecycle_emails` ledger).
  - Email is the baseline.
  - Web Push is an Android-only extra, asked for after a first lesson.

### 7. Exam-date plans

- **Busuu's plan.** Busuu claims Study Plan users are "**five times more likely** to reach their goals" but gives no methodology ([Busuu](https://www.busuu.com/en/english/personalized-study-plan-busuu-premium)); self-selection is likely. Its mechanics are still a good reference:
  - goal, study days per week and minutes per day;
  - a target date that is set automatically and can be changed;
  - calendar-synced reminders;
  - a weekly dashboard with an ETA.
- **What the evidence supports.** Scheduling rituals alone do not help (Baker et al., §6). Recorded and reported progress does (Harkin et al., d = 0.40, 09 §12).
- **The existing `plan.js` gets the principle right.** It is arithmetic, "never a gate", and paced to `SUSTAINABLE_PER_WEEK = 5`.
  - Its output should face forward. Write „Diese Woche 3 Lektionen – dann sind Sie wieder im Plan", not „2 Lektionen hinter dem Plan".
  - Mock exams should be auto-placed in the final weeks.
  - 08 gap #7 names a dated plan with stated hours as a differentiator no competitor offers.

### 8. Certificates

- **The current page.** `CourseCertificatePage.jsx` prints an English "Certificate of Completion" with the learner's name and counts of Lektionen and checkpoints.
- **The FernUSG risk.**
  - ZFU practice, as reported, treats automatically scored multiple-choice tests as "grundsätzlich keine individuelle Lernerfolgskontrolle".
  - It judges otherwise when the provider "sich die Ergebnisse zu eigen macht und darauf aufbauend **individualisierte Zeugnisse** oder Rückmeldungen erteilt". No court has ruled on AI feedback yet ([Dogan Pfahler FAQ on BGH III ZR 109/24](https://doganpfahler.de/faq-bgh-fernunterricht-fernusg-online-coaching/)).
  - Read together with `docs/course-research-2026-09-03.md` §4 (never promise individual feedback), **a score-bearing certificate is the riskiest artifact in the player**.
- **Value.** Shared credentials have some labour-market value. Coursera reports a Stanford experiment in which learners who shared a credential on LinkedIn were **6 %** more likely to report new employment ([Coursera, via search](https://blog.coursera.org/new-stanford-study)).

### 9. What to skip, and why

| Mechanic | Evidence for it | Why we skip it |
|---|---|---|
| **Leagues / leaderboards** | Duolingo: **+17 % learning time, 3× "highly engaged"** ([Mazal](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)) | Learning time is Duolingo's metric; ours is readiness. Leaderboards and badges lowered motivation and exam scores over 16 weeks (Hanus & Fox, 09 §10). Learners dislike features that cause "anxiety or jealousy" (Bai et al., 09 §10). Competitiveness leaves users "distracted from learning", which "negatively impacts their learning performance" ([Hadi Mogavi et al. 2022](https://arxiv.org/abs/2203.16175), 9 years of forum posts plus 15 interviews). A half-level cohort is too small to fill a league. |
| **Hearts (lives)** | none for learning | Duolingo dropped them itself. Beginners were "**2X more likely to run out of hearts** mid-lesson", and this was "not the most effective way to support learning" ([blog](https://blog.duolingo.com/duolingo-energy/)). Hearts also contradict our checker, which lets a case-only miss (`TYPO`) retry. |
| **XP / points** | Duolingo's original streak ran on XP | Duolingo moved the streak to "one lesson". XP invites farming easy lessons (Hadi Mogavi et al.). Count can-dos instead. |
| **Gems, loot, random rewards** | none | The 2021 JuSchG treats "glücksspielähnliche Mechanismen" as a usage risk in age ratings ([heise](https://www.heise.de/hintergrund/Lootboxen-und-Co-Was-das-neue-Jugendschutzgesetz-fuer-Videospiele-bedeutet-6011613.html)). A one-time purchase has nothing to sell through them. A mechanic Duolingo transplanted from Gardenscapes was "completely neutral" ([Mazal](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)). |
| **Friend streaks** | a third party claims **+22 %** daily-lesson completion ([deconstructoroffun](https://duolingo.deconstructoroffun.com/mechanics/streaks), unverified) | **Deferred.** 09 #20's opt-in "share my weekly report" link gives accountability without a social graph. |

### 10. Audit: our design system in a course player

`design-tokens.js` is brand-wide and stays. It fits a player well.

**What fits:**

- **One interactive colour** (`siegel`) makes every „Prüfen" / „Weiter" unambiguous.
- **Rule 3 (depth = "you can press this") maps onto exercise states exactly.**
  - Answer options rest raised while answerable and go **flat once checked**, because they can no longer be pressed.
  - Rule cards, declension tables and reading texts stay flat, with hairlines.
  - The rule becomes the state signal.
- **Case colours are a teaching asset.** Rule 1 allows them wherever a case is named. Case feedback such as „Nach *mit* steht Dativ: mit **dem** Bus" can mark the article with the `Chip` kasus tone. The chip prints `DAT`, so colour never carries the meaning alone.
- **Motion and targets are covered.** Motion is gated behind `prefers-reduced-motion`, and `Button` has `min-h-11` (44 px).

**What needs work:**

1. **`himbeer` means two things.** `FeedbackSheet` uses it for WRONG, and `Button variant="celebrate"` uses it for a completed goal. In a player both appear within a minute. Proposal: keep `himbeer-wash` for wrong, and give Lektion-complete the **gold Meister-Siegel**, which rule 2 already reserves for the seal.
2. **No role for target-language text.** `type.body.mobile` is 15 px: small for the German sentence being parsed, and below iOS's 16 px input threshold. Add a `prompt` role (≈ 1.25 rem, 1.125 rem on mobile, body face, 600) and a ≥ 16 px `input` rule.
3. **Fraunces at 360 px.** `section.mobile` is 25 px, and a compound like „Wohnungsbesichtigung" overflows a 328 px column. Use `lang="de"` + `hyphens:auto` + `overflow-wrap:anywhere`. Keep Fraunces for Lektion titles, never for exercise text.
4. **Font payload.** `index.html` loads 6 Nunito Sans styles and 3 Fraunces weights with the opsz axis. The player needs about 3. Measure the cost on the A24 profile (unmeasured).
5. **Player primitives live outside `ui/`.** `StageShell` retypes the `label` role as literal classes, and `FeedbackSheet` builds its own sheet. Promote `ProgressBar`, `BottomSheet`, `OptionTile`, `AudioButton`, `RecordButton` and `TextField` to `ui/` so that `tests/brand.test.mjs` guards them.
6. **`viz` is operator-only** per its own comment. Learner-facing readiness needs siegel fills, text labels and a hairline for the pass rule.
7. **No dark theme.** Learners study at 22:00. This is an open question, not a gap to close now.

---

## Implications for the course blueprint

1. **One practice item per screen; input screens scroll.** Every practice screen ends in a check with feedback. (§2)
2. **One primary action per screen, pinned bottom.** It is full-width on mobile and ≥ 48 px high (`Button size="lg"`). Nothing else competes in the thumb zone. (§1)
3. **Floor and budget.**
   - Floor 360 × 640; reflow must work at 320 px.
   - The player route stays within Russell's 3 s JS-heavy budget (≈ 0.62 MiB JS) on an A24 profile.
   - Prefetch the next stage's content and audio.
   (§1)
4. **The progress bar counts first presentations only.**
   - A re-queued mistake shows as „+1 Wiederholung" and never moves the bar back.
   - Every Lektion opens with a short stage.
   (§3)
5. **Nested goals:** item → stage bar → Lektion ring → course (Lektionen and can-dos) → exam practice score per Teil. No XP, points or global level anywhere. (§3, §9)
6. **The syllabus is always visible.**
   - All Lektionen carry can-do titles („Sie können einen Termin beim Arzt vereinbaren").
   - The path is linear by default, with nothing hidden.
   - Unbought half-levels appear as locked chapters on the same map.
   (§3)
7. **Try before signing up.** A1.1 Lektion 1 works without an account and saves on sign-up. Paid previews are the owner's call. (§4)
8. **Placement recommends a course.**
   - A ≤ 10-minute adaptive test with partial credit, plus a can-do self-check.
   - Never self-rating alone.
   - Each Lektion offers „Ich kann das schon" to test out and gain honest credit.
   (§4)
9. **A goal screen with choice and an opt-out.**
   - Ask for the exam (type + date, or „noch kein Termin"), days per week (2 / 3 / 5) and a reminder time.
   - Nothing is pre-selected, and „Später" is real.
   - The CTA is „Plan festlegen".
   (§4)
10. **The streak counts learning days.** Its unit is one *Lernschritt*: one Lektion stage-set **or** the ~5-minute daily review. Show the number, not a flame. (§5)
11. **Forgiveness is automatic and free.**
    - Two „Pausentage" per week are applied automatically, and every new streak starts with them.
    - Earn-back: one review within 48 h of a break restores the streak.
    - No currency and no purchase.
    - A quiet „lückenlos" mark rewards weeks with no pause day used.
    - Nothing extra appears before day 7.
    (§5)
12. **The weekly goal is the headline habit metric** („3 von 3 Lerntagen"). The course home, reminders, the plan and the weekly report all use it. (§5, §7, 09 #18)
13. **Never show a broken streak as „0".**
    - Show the week's goal, the longest run, and „Willkommen zurück – 5 Minuten Wiederholung".
    - Re-entry starts with review, not the backlog (09 #22).
    (§5)
14. **Reminders.**
    - At most one a day, at the learner's chosen time. An evening nudge goes out only if the weekly goal is at risk.
    - Email is the default. Web Push is Android-only and offered after a lesson.
    - After 7 idle days, reminders become weekly on Mondays. After 30 idle days, they stop.
    - Rotate at least 6 templates per kind.
    - Every send goes through `lifecycle_emails` and is A/B-tested.
    (§6)
15. **The plan is arithmetic and never a gate.**
    - It shows days left, Lektionen per week, hours, and the next auto-placed mock.
    - It is phrased forward and never says "behind".
    (§7)
16. **A weekly recorded report** covers can-dos, review accuracy and practice score per part. It has an opt-in share link. It replaces leagues and friend streaks. (§7, §9)
17. **AI-grading states.**
    - Local checks answer in < 100 ms.
    - An AI check shows its stages („wird hochgeladen → wird ausgewertet") within 1 s, and a step or percent indicator past 10 s.
    - Offline: „Gespeichert – wird bewertet, sobald Sie online sind".
    - Every result is labelled „automatische Auswertung".
    (§1)
18. **Microphone pre-prompt.**
    - One screen explains why the microphone is needed, and the system prompt fires only on tap.
    - A denial shows the Android/iOS settings steps and a „ohne Mikrofon weiter" path, where read-aloud becomes listen-and-select.
    (§1)
19. **Replace the certificate with a „Kursbestätigung".**
    - It is based on completion, with no scores, grade or „bestanden".
    - It lists the can-do topics practised and says „automatisch erstellt – kein Prüfungszeugnis, ersetzt keine Prüfung".
    - It is German-first.
    - It needs legal review before launch.
    (§8)
20. **Excluded mechanics:** leagues, hearts/energy, XP, gems, loot, random rewards and public leaderboards. The in-lesson `ComboChip` may stay as a flourish only: never persisted, never on a summary, never something to lose. (§9)
21. **Token work, additive and brand-wide:**
    - resolve the double meaning of `himbeer` (proposal: seal-gold marks Lektion complete);
    - add the `prompt` role and the ≥ 16 px input rule;
    - add `hyphens:auto` for German display text;
    - promote the six player primitives into `ui/` and extend `tests/brand.test.mjs` to cover them.
    (§10)
22. **Instrument before tuning.** Track:
    - learning days in week 1;
    - the share of learners reaching day 7;
    - earn-back use;
    - reminder opt-outs;
    - AI-grading latency (p50 / p95 on Android);
    - microphone-permission denials.
    Then A/B-test how much forgiveness to give. Duolingo's optimum of 2 need not be ours. (§5, §6)

### Player UX spec outline (screens · states · components)

| # | Screen | Key states | Components (tokens) |
|---|---|---|---|
| S0 | **Kursplan** (course home) | first visit · in progress · plan on/off · review due · locked chapters · complete | level code in `data` face; Fraunces title; one `Button primary` „Weiter mit Lektion 4"; plan strip; weekly-goal widget (number first, `accent-limette` fill); Lektion list as `Card interactive` (can-do title, ring, state); checkpoint and mock nodes; `Chip aprikose` „12 fällig" |
| S1 | **Einstieg** (goal + placement) | exam known / unknown · test taken / skipped · recommendation | 3 choice screens (`OptionTile`, nothing pre-selected, „Später"); placement items; recommendation `Card raised` (the screen's one siegel edge) |
| S2 | **Lektion-Start** | new · resume at stage n · tested out | can-do goal, stage list with minutes, „Ich kann das schon" |
| S3a | **Input** (dialogue / text / video) | audio loading · playing · no audio (computer voice) | scrollable; `AudioButton` (replay, slower); gloss taps; flat reference styling |
| S3b | **Rule / notice** | — | flat card with hairlines; kasus `Chip` only where a case is named |
| S3c | **Practice item** | idle → selected → checking → correct / typo (retry) / wrong / revealed → continue · re-queued | `prompt` role; `OptionTile` raised → flat after check; `TextField` ≥ 16 px; `BottomSheet` feedback (text + icon + colour, one „Weiter", „Erklären" link) |
| S3d | **Speaking** | mic pre-prompt · denied · recording (timer + level meter) · playback · submitting · grading (staged) · result · retry · offline-queued | `RecordButton` (tap-to-toggle, ≥ 64 px); per-criterion result card marked automatic |
| S3e | **Writing** | drafting (word count, checklist) · submitting · grading · per-criterion result · revise | multiline `TextField`, sticky checklist, „Überarbeiten" |
| S4 | **Lektion geschafft** | normal · first ever · weekly goal met | can-dos gained, words, „Fehler kommen in die Wiederholung", gold seal moment (reduced-motion safe), next step |
| S5 | **Tägliche Wiederholung** (~5 min) | due > 0 · nothing due · re-entry after ≥ 3 days | S3c shell; the count only shrinks within a session |
| S6 | **Checkpoint / Modelltest** | exam mode (feedback at the end, optional timer) · results per Teil vs the pass rule · „Übungswert, keine Prognose" | part tabs; siegel bars with text labels and a pass-rule hairline (no `viz` palette) |
| S7 | **Fortschritt** (weekly report) | this week · history · share on / off | can-do list, practice score per part, review accuracy |
| S8 | **Kursbestätigung** | not yet · available | printable, German, completion-only wording |
| S9 | **Einstellungen** | reminders (email / push / time / off) · pace · explanation language · sound | — |

---

## Open questions

1. **Paid previews.** Does each paid half-level expose Lektion 1 free, or only A1.1? This is part of the HANDOFF first-lesson-leak decision.
2. **Headline habit metric.** Daily streak or weekly goal? The evidence favours consecutive days for app engagement (Duolingo) and forgiveness for humans (Lally). The weekly goal is proposed as primary for working adults, and this needs an in-app test.
3. **Amount of forgiveness.** Duolingo's optimum of 2 freezes comes from a daily-habit app with a gem economy. Ours needs testing.
4. **Legal.** Is a completion-only „Kursbestätigung" safe under ZFU practice when AI grading exists elsewhere in the course? Does any use of „Zertifikat" raise UWG risk? Counsel should answer both before launch.
5. **Dark mode.** Should the player have one for late-evening study? It would need a brand-wide dark token set, which is an owner decision.
6. **Web Push.** Is it worth building at all, given it reaches Android only and needs a service worker and a permission flow? Or are email and in-app messages enough for v1?
7. **Real AI-grading latency.** How long do `evaluate-writing` and `score-readaloud` take on 4G from an A24-class phone? S3d and S3e depend on the answer.
8. **Offline Lektionen.** Should a whole Lektion (text and audio) be cached for commuters on prepaid data?

## Unverified

- **Duolingo figures are company-reported and not peer-reviewed.** They include:
  - 20 % DAU from delayed sign-up;
  - +8.2 % from soft and hard walls;
  - +5 % from notification copy;
  - the Weekend Amulet's +2.1 % D7 and +4 % D14;
  - leagues' +17 % learning time;
  - 2 vs 3 freezes;
  - "7×" for a 30-day streak;
  - ">10,000 DAUs" for the streak copy.

  Only third-party summaries claim the linear path improved learning outcomes; Duolingo's own post gives no numbers.
- **Numbers from secondary or unfetched sources:**
  - Nunes & Drèze's 34 % vs 19 % (secondary summaries);
  - Hoober's 49 / 36 / 15 % (search snippets of the UXmatters article);
  - the friend-streak "22 %" (a third-party analysis site);
  - the Coursera/Stanford "6 %" (search snippet; the page returned HTTP 400).
- **Busuu's "five times more likely"** has no stated methodology.
- **Legal points:**
  - The ZFU position on automated tests and individualised certificates comes from a law-firm FAQ, not a ZFU document.
  - The UWG risk of „Zertifikat" is our inference.
- **The 360 px assumption.** That Android display-size settings shrink the CSS viewport toward 360 px is unverified. Statcounter's August 2026 top six contains no 360-wide viewport.
- **Font cost.** The byte cost of the current Google Fonts request on the baseline device was not measured.
- **Proposed values, not derived ones:** the reminder back-off (weekly after 7 days, stop after 30) and the 48 h earn-back window.
