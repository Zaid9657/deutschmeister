# Batch 1 live course fixes — 2026-10-25

Status: Batch 1 implemented and verified locally. Required test group: 379/379 pass. Across the 48 affected files, 942/945 unique tests pass after the final reruns; three unchanged Windows baseline failures are reproduced and documented below. No database, network, commits, pushes, checkout or reset.

## Exit proof

Both pools rebuilt before their curriculum validators. Every hard rule must be zero; every ratchet must equal its measurement and must not rise. Both determinacy runs, duplicate checks, the requested and affected test files, and ESLint on changed JavaScript must pass. Regression tests must exercise each finding class, the named real probes, and cue-removal mutations. A1.1 dialogue text must remain byte-for-byte unchanged.

## Baseline and investigation

Both baseline validators exited 0. Direct checker probes returned `wrong` for all three fronted objects, `Es` in the isolated mother sentence, and `Die Schlüssel sind gelb.`. `missingOpeningCue` returned `null` for each object probe.

Competing hypotheses: (1) spelling/case normalisation caused the refusals; rejected because the canonical answers pass and the missing alternatives differ syntactically. (2) wrong source data alone; incomplete because the shared detector and tile generator reproduce the defects on synthetic sentences too. (3) incomplete shared task constraints and derivation; confirmed: the object detector required a final single-noun object, its finite-verb regex missed `feiern`, the determiner detector mistook `mit bestimmtem Artikel` for a named repair, and the tile builder always wrote `[chosen.de]`. The full chain is authoring → build repair → generated pool/draw → accepted list → shared checker. The fixes and mutations below test that chain.

The previous `.fablize` goal state was preserved in `batch-1-previous-*` before starting this task's separate three-story ledger.

## 1. Sentence openings

Rule: every sentence-building statement or question names its opening, including predicates, pronoun objects, separable verbs and multi-noun phrases; imperative tasks retain their licensed verb/bitte openings and optional -e. No object-fronting guess is added to an answer key. The cue writer also handles lists at the start of a prompt. The `feiern`/`sammeln` verb-ending family is recognised, and `acht` is not mistaken for a verb. The two old negative assertions denying predicate/pronoun fronting are strengthened to require cues (not removed): `Lehrer bin ich.` and `Dich rufe ich an.` are valid German.

Required probes gain `(Beginnen Sie mit „Ich“)` for `extra-a11-l11-08` and `extra-a11-l09-05`, and `(Beginnen Sie mit „Wir“)` for `extra-a11-l12-14`. `tests/live-course-batch1.test.mjs` scans every servable sentence-building item in both pools, checks the answer follows its opening, tests imperative alternatives and removes each required probe's cue to force a failure. It also probes the time phrase `Um acht Uhr`. `assessment-integrity.test.mjs` retains the independent existing generator/checkpoint guard. The complete item inventory is below.

## 2. Derived word-order tiles

Rule: derive only from a closed set of grammatical frames whose orders are enumerated; unsupported lines are omitted from tile practice. Fixed greetings, simple copular predicates, separable shopping questions and simple origin/destination questions are supported. This applies at every level. The checker compares licensed tile orders without penalising capitals/punctuation carried by a moved tile, and gives no typing-error forgiveness to a tile permutation. The generator consumes the former draw's random stream before fallback selection, preserving subsequent listening draws where source lines are unchanged. A missing tile slot uses the existing matching builder with different taught words, a separate seed and unique id.

Test: the new generator-level regression walks every curriculum and all three attempts, grades all supported alternatives through the real checker, rejects an extra token, and checks unique task ids and disjoint matching words. Independent real probes accept `Studentin bin ich.`, `Du kaufst morgen ein?`, `Morgen kaufst du ein?`, `Kaufst morgen du ein?`, `Bestimmt ist deine Party schön!`, `Bestimmt schön ist deine Party!` and `Schön ist deine Party bestimmt!`. Unsupported coordination probes (`Nein. Hier ist keine Lampe und kein Spiegel.`, `Ich kaufe den Stuhl und die Lampe.`) produce no tile item. No A1.1 dialogue was edited. Before/after draws are tabulated below.

## 3. Ambiguous pronouns and repairs

Cross-level scan found one pronoun-choice gap without an antecedent: `___ ist meine Mutter.` → `Meine Mutter ist hier. ___ spricht Deutsch.` (bank correction, with English and both explanations). A1.2 has no additional pronoun-choice member.

The determiner rule now recognises the actual named-repair formula, rather than any occurrence of `Artikel`. Eleven A1.1 authored tasks with `mit bestimmtem Artikel` now say `Korrigieren Sie den Artikel:`. Seven further A1.1 prompts name `das Verb`, `das Wort Gute` or `das Wort um`. `namedRepairAccepts` remains the last acceptance filter for both levels, checks the canonical answer unconditionally, and enforces the named repair slot for these additional elements. The shared instruction lexer strips only the complete `Korrigieren Sie das Wort …:` formula, leaving the named token and sentence visible to vocabulary checks; the regression keeps `Das Wort ist neu.` intact. No vocabulary whitelist was expanded.

Tests scan both levels' servable repair tasks and accepted answers, distinguish the old definite-article suffix from a named repair, accept `Der Schlüssel ist gelb.` and reject a change to the verb when the prompt names the article. The greeting mutation `Gute Tag` → `Gute Nacht` fails because it changes the noun instead of `Gute`. The pronoun scan detects conflicting agreement options without a preceding antecedent; restoring the isolated mother prompt fails. Nineteen further A1.2 source prompts now name `(Verb)`, `(Wort …)`, `(Verb auf Position 2)`, `(Infinitiv am Satzende)` or `(Verb auf Position 2 oder Wort denn)`. These suffixes preserve the established named-repair format and existing instruction assertions. The guard preserves all previously licensed repairs, including `gern/gerne`, `gezahlt`, `nicht ein`, `ist … gewesen`, and the causal alternatives with `weil/da`; it checks that unrequested sentence elements survive. All accepted arrays remain unchanged. The complete item inventory is below.

## 4. Grammar cards

Rules/cards: (a) s/ß/x/z stems take `-t` in the du-form: added `Endet der Stamm auf s, ß, x oder z, steht in der du-Form nur -t (ich tanze → du tanzt).` with the equivalent English exception. (b) `Bei der Ja/Nein-Frage …` → `Bei der neutralen Ja/Nein-Frage …` and `Eine Bestätigungsfrage hat die Wortfolge der Aussage, gesprochen und geschrieben.` Confirmation questions are explicitly valid in speech AND writing in English too. `Sie kommen aus Österreich?` leaves the mistakes list; the actual incorrect example is now `Sie aus Österreich kommen?`. The old written-question assertion remains and the surrounding explanation qualifies it as a neutral question. (c) `Das Pronomen fällt weg` → `Das Pronomen fällt meist weg; betont bleibt es stehen.` English: `Keep polite Sie; du drops -st. Familiar pronouns are usually omitted but possible for emphasis.`

The L8 notice keeps the pinned phrase `Beide normalerweise ohne Pronomen; zur Betonung möglich` and adds the synonym `(betont)`, teaching the card's exact word without a vocabulary exemption. `Imperativ vorn:` is shortened to `Imperativ:` to retain the existing 60-word limit; the card states position 1. Its English twin already states that emphasis permits the pronoun. Both old imperative-notice assertions remain intact. Source: `scripts/rule-card-overrides.mjs`; generated cards rebuilt by the pool command. The bilingual regression and the existing word-budget, example, vocabulary, register and future-form card guards all pass (43 combined card/Batch-1 tests at this stage).

## 5. A1.2 content and English constraints

Housing: `Vier: Küche, Badezimmer, Wohnzimmer und Schlafzimmer.` → `Zwei Zimmer: Wohnzimmer und Schlafzimmer. Küche und Badezimmer sind auch da.` English: `Two rooms: living room and bedroom. There is also a kitchen and a bathroom.` This uses taught words and stays within the 12-word dialogue-line limit.

L6 model: after `ich bin krank.` added `Ich komme heute nicht.` The suggested `Ich kann heute nicht kommen.` was tried, but the validator correctly reported `RULE 20: 1 Wörter in Modelltexten, die ihre Lektion noch nicht lehrt, Ratchet ist 0 — L6 schreiben.sample „kann“`. The final version states today's cancellation with the already-taught present tense; no vocabulary exception or ratchet increase was introduced.

English hints: the final build pass translates the binding opening and every restriction inside that cue (negation position and later-clause openings), plus tense, article, contraction, named repair and sentence-type constraints. It runs after authored corrections so no later overwrite can drop the cue. A missing translation of a new cue clause stops the build. The universal hint test covers both pools and removes the corner item's English opening as a failing mutation.

## 6. Final tests

Both titles now say `Abschlusstest A1.x (Kurzversion)`. Both intros say that Hören/Lesen alone are automatically scored, 60% refers to those two parts, the writing task is a self-check outside the score, and speaking is absent. The text explicitly says this does not reproduce the full Start Deutsch 1 exam and awards no official certificate. A1.1 describes its actual form and absent free message; A1.2 describes its message and absent form. The brief's statement that neither test has a form does not match this checkout's A1.1 data.

A1.2's intro, listening/reading/writing instructions, writing task and all three self-check criteria now address Sie. A new test walks every learner-directed field and rejects du/dein/dich/dir and informal imperative instructions; it also asserts the old exam-layout and half-length claims are absent. All existing assertions remain in force. No old exam-claim assertion required weakening or removal.

| Final-test field | Old German → new German |
| --- | --- |
| Both titles | `Abschlusstest A1.x (Kurzversion im Start-Deutsch-1-Format)` → `Abschlusstest A1.x (Kurzversion)` |
| A1.1 intro claim | `Er hat den Aufbau der Prüfung Start Deutsch 1, aber nur die halbe Länge` → `Hören und Lesen werden automatisch bewertet; Sie bestehen diesen Kurstest ab 60 % in diesen beiden Teilen.` |
| A1.1 scope | `Sprechen üben Sie im Speaking-Missions-Trainer, nicht hier.` → `Eine Formularaufgabe zum Schreiben bearbeiten Sie mit einem Selbstcheck; sie zählt nicht zur Punktzahl. Eine freie Mitteilung und Sprechen sind nicht enthalten.` |
| A1.2 intro claim | `Er hat den Aufbau der echten Prüfung Start Deutsch 1, aber nur die halbe Länge` → `Hören und Lesen werden automatisch bewertet; Sie bestehen diesen Kurstest ab 60 % in diesen beiden Teilen.` |
| A1.2 scope | `Sprechen trainierst du …, nicht hier.` → `Eine kurze Mitteilung zum Schreiben bearbeiten Sie mit einem Selbstcheck; sie zählt nicht zur Punktzahl. Ein Formular und Sprechen sind nicht enthalten.` |
| Both intros | Exam-layout claim → `Dieser Test übt einzelne Aufgabenarten von Start Deutsch 1 und bildet nicht die vollständige Prüfung ab.` and `keine offizielle Prüfung, kein Zertifikat über ein Sprachniveau` |
| A1.2 address | `deines A1.2-Kurses` → `Ihres A1.2-Kurses`; `Dein A1.2-Kurs endet hier` → `Als Nächstes können Sie die Übungsprüfung zu Start Deutsch 1 bearbeiten.` |
| Listening instruction | `Du darfst die Aufnahme zweimal abspielen.` → `Sie dürfen die Aufnahme zweimal abspielen.` |
| Reading instructions | `Lies … und entscheide` → `Lesen Sie … und entscheiden Sie` in all three parts |
| Writing instruction | `Schreib deine Antwort … nutze den Selbstcheck.` → `Schreiben Sie Ihre Antwort … nutzen Sie den Selbstcheck.` |
| Writing task | `Du kannst … bei deiner Ärztin … Schreib … Nenne … Warum kannst du … Wann hast du Zeit? Schreib` → `Sie können … bei Ihrer Ärztin … Schreiben Sie … Nennen Sie … Warum können Sie … Wann haben Sie Zeit? Schreiben Sie` |
| Three self-check criteria | `Du hast … geschrieben` → `Sie haben … geschrieben` (three points; greeting/sign-off; short sentences/correct words) |

## 7. A1.1 English can-do

`I can give my phone number and my address.` → `I can give my phone number and say where I live.` in A1.1 L2 metadata. German and every A1.1 dialogue line stay unchanged. Regression: the L2 can-do must contain `where I live`.

## Draw measurements and reproducible audit

`node docs/course-factory/live-fixes/measure-batch1.mjs` compares HEAD source/pools with the working tree in memory, without checkout. Run from the repository root. The native child-process sandbox refused its read-only `git show` spawn (`EPERM`); the same audit succeeded through context-mode. It checks all three lesson attempts and all four rounds of each checkpoint.

| Measurement | A1.1 before → after | A1.2 before → after |
| --- | --- | --- |
| Derived tiles, pinned attempts 1–2 | 24 → 6 | 24 → 0 |
| Derived tiles, all three attempts | 36 → 9 | 36 → 0 |
| Total derived tasks, all three attempts | 108 → 108 | 108 → 108 |
| Practice pool sizes | 379 → 379 | 295 → 295 |
| Changed minLektion stamps | 0 | 0 |
| Changed accepted arrays | 0 | 0 |
| Derived listening draws changed (all three attempts) | 0 | 3 (corrected L2 line text/options only) |

A1.1 practice: L3 attempt 1 reorders the same seven item ids after the antecedent rewrite; all other lesson draws and attempts stay identical. A1.2 practice: all three attempts stay identical. A1.1 checkpoint ids/keys stay identical for all 16 papers. A1.2 checkpoint changes are listed below; new opening cues alter the prompt-based selection fingerprint. Every pinned rule is re-measured by the unchanged validator and existing curriculum/rebuild tests; no ratchet constant was edited.

| Level / lesson / attempt | Tile before → after (German) |
| --- | --- |
| a1.1 / L1 / 1 | Mir geht es gut, danke. → different taught-word matching task |
| a1.1 / L3 / 1 | Hat dein Bruder einen Sohn oder eine Tochter? → different taught-word matching task |
| a1.1 / L4 / 1 | Entschuldigung, was ist das? → different taught-word matching task |
| a1.1 / L5 / 1 | Ist der Stift blau oder schwarz? → different taught-word matching task |
| a1.1 / L6 / 1 | Danke! Wann ist die Pause? → different taught-word matching task |
| a1.1 / L7 / 1 | Vielleicht hören wir am Wochenende zusammen Musik? → different taught-word matching task |
| a1.1 / L8 / 1 | Und wann ist dein Termin? → different taught-word matching task |
| a1.1 / L9 / 1 | Ja, ich habe Hunger. Ich möchte Kuchen, bitte. → different taught-word matching task |
| a1.1 / L10 / 1 | Nein, sie kostet fünfzehn Euro. → different taught-word matching task |
| a1.1 / L11 / 1 | Ich stehe um sechs auf. Ich bin müde. → Kaufst du morgen ein? |
| a1.1 / L1 / 2 | Gut. Wie geht es Ihnen? → different taught-word matching task |
| a1.1 / L2 / 2 | Meine Telefonnummer ist null eins sieben sechs. → Ich bin Studentin. |
| a1.1 / L3 / 2 | Welche Sprachen sprechen deine Eltern? → different taught-word matching task |
| a1.1 / L4 / 2 | Der Tisch kostet fünfzehn Euro. → different taught-word matching task |
| a1.1 / L5 / 2 | Die Schere ist hier. Das Lineal auch. → different taught-word matching task |
| a1.1 / L6 / 2 | Danke. Ich brauche einen Computer und ein Telefon. → different taught-word matching task |
| a1.1 / L7 / 2 | Ja, sehr gern! Und tanzt du auch? → different taught-word matching task |
| a1.1 / L8 / 2 | Kommst du heute pünktlich? Oder hast du Verspätung? → different taught-word matching task |
| a1.1 / L9 / 2 | Ich habe Durst. Ich möchte einen Kaffee, bitte. → different taught-word matching task |
| a1.1 / L10 / 2 | Kostet die Fahrkarte zwanzig Euro? → different taught-word matching task |
| a1.1 / L11 / 2 | Ja, ich rufe dich an. → Kaufst du morgen ein? |
| a1.1 / L12 / 2 | Was möchtest du zum Geburtstag? → Deine Party ist bestimmt schön! |
| a1.1 / L1 / 3 | Buchstabieren Sie bitte Chakiri. → different taught-word matching task |
| a1.1 / L2 / 3 | Guten Tag! Ich bin Herr Weber vom Amt. → Ich bin Studentin. |
| a1.1 / L3 / 3 | Ja, er spricht Englisch und Deutsch. → different taught-word matching task |
| a1.1 / L4 / 3 | Und der Tisch? Was kostet er? → different taught-word matching task |
| a1.1 / L5 / 3 | Die Schere ist hier. Das Lineal auch. → different taught-word matching task |
| a1.1 / L6 / 3 | Danke. Ich brauche einen Computer und ein Telefon. → different taught-word matching task |
| a1.1 / L7 / 3 | Tim, was ist dein Hobby? → different taught-word matching task |
| a1.1 / L8 / 3 | Und wann ist dein Termin? → different taught-word matching task |
| a1.1 / L9 / 3 | Ja, ich habe Hunger. Ich möchte Kuchen, bitte. → different taught-word matching task |
| a1.1 / L10 / 3 | Nein, er ist pünktlich. → different taught-word matching task |
| a1.1 / L11 / 3 | Und wann stehst du morgens auf? → Kaufst du morgen ein? |
| a1.1 / L12 / 3 | Ja, meine Mama und mein Papa kommen. → Deine Party ist bestimmt schön! |
| a1.2 / L1 / 1 | Und die U-Bahn? Fährt sie ins Zentrum? → different taught-word matching task |
| a1.2 / L2 / 1 | Ist die Treppe da? Ich habe viele Bücher. → different taught-word matching task |
| a1.2 / L3 / 1 | Ana, was machst du heute in der Stadt? → different taught-word matching task |
| a1.2 / L4 / 1 | Entschuldigung! Und das Kissen? Ist es da? → different taught-word matching task |
| a1.2 / L5 / 1 | Wann fährt der Zug? Um wie viel Uhr? → different taught-word matching task |
| a1.2 / L6 / 1 | Guten Tag, Frau Chakiri. Was tut Ihnen weh? → different taught-word matching task |
| a1.2 / L7 / 1 | Und das Kind da? Der Mund ist klein. → different taught-word matching task |
| a1.2 / L8 / 1 | Nein, komm jetzt! Der Kühlschrank hat kein Brot. → different taught-word matching task |
| a1.2 / L9 / 1 | Ich möchte ein Ticket. Wo soll ich einsteigen? → different taught-word matching task |
| a1.2 / L10 / 1 | Größe 50. Ohne den Schal ist er billig. → different taught-word matching task |
| a1.2 / L11 / 1 | Wie ist das Wetter im Sommer bei dir? → different taught-word matching task |
| a1.2 / L12 / 1 | Ana, wir haben gestern schön gefeiert! → different taught-word matching task |
| a1.2 / L1 / 2 | Am Platz. Da ist auch die Brücke. → different taught-word matching task |
| a1.2 / L2 / 2 | Was kostet die Wohnung? Wie ist die Miete? → different taught-word matching task |
| a1.2 / L3 / 2 | Und die Kasse? Bezahlst du ein Kilo Brot? → different taught-word matching task |
| a1.2 / L4 / 2 | Nein. Hier ist keine Lampe und kein Spiegel. → different taught-word matching task |
| a1.2 / L5 / 2 | Jede Stunde. Aber wo ist die Haltestelle? → different taught-word matching task |
| a1.2 / L6 / 2 | Haben Sie Fieber oder eine Erkältung? → different taught-word matching task |
| a1.2 / L7 / 2 | Ja. Mein Onkel ist groß und immer glücklich. → different taught-word matching task |
| a1.2 / L8 / 2 | Ja, gleich. Ich sehe zehn Minuten fern. → different taught-word matching task |
| a1.2 / L9 / 2 | Ich möchte ein Ticket. Wo soll ich einsteigen? → different taught-word matching task |
| a1.2 / L10 / 2 | Die Mütze ist billiger als der Schal. → different taught-word matching task |
| a1.2 / L11 / 2 | Im Sommer ist es sonnig, bei dreißig Grad. → different taught-word matching task |
| a1.2 / L12 / 2 | Ja! Ich habe Kuchen und Schokolade gegessen. → different taught-word matching task |
| a1.2 / L1 / 3 | Nein. Dann gehen Sie an der Ecke links. → different taught-word matching task |
| a1.2 / L2 / 3 | Hat die Wohnung auch einen Balkon? → different taught-word matching task |
| a1.2 / L3 / 3 | Und die Kasse? Bezahlst du ein Kilo Brot? → different taught-word matching task |
| a1.2 / L4 / 3 | Nein. Hier ist keine Lampe und kein Spiegel. → different taught-word matching task |
| a1.2 / L5 / 3 | Jede Stunde. Aber wo ist die Haltestelle? → different taught-word matching task |
| a1.2 / L6 / 3 | Guten Tag, Frau Chakiri. Was tut Ihnen weh? → different taught-word matching task |
| a1.2 / L7 / 3 | Ja. Mein Onkel ist groß und immer glücklich. → different taught-word matching task |
| a1.2 / L8 / 3 | Mach den Fernseher aus und hilf mir bitte! → different taught-word matching task |
| a1.2 / L9 / 3 | Entschuldigung. Wo darf ich langsam fahren? → different taught-word matching task |
| a1.2 / L10 / 3 | Gut. Ich gehe durch das Kaufhaus und bezahle. → different taught-word matching task |
| a1.2 / L11 / 3 | Seit einer Woche regnet es. Es ist wolkig. → different taught-word matching task |
| a1.2 / L12 / 3 | Ana, wir haben gestern schön gefeiert! → different taught-word matching task |

| Changed A1.2 checkpoint / round | Answer keys before → after (changed slots only) |
| --- | --- |
| a1.2-cp1 / 2 | `a1.2-cp1-bausteine-5`: dreißig → vierhundertachtzig<br>`a1.2-cp1-bausteine-6`: das Kilo Brot → dreißig<br>`a1.2-cp1-sprechen-2`: Vier: Küche, Badezimmer, Wohnzimmer und Schlafzimmer. → Zwei Zimmer: Wohnzimmer und Schlafzimmer. Küche und Badezimmer sind auch da. |
| a1.2-cp1 / 3 | `a1.2-cp1-bausteine-3`: sind → einen Rucksack<br>`a1.2-cp1-bausteine-4`: einen Rucksack → zwanzig<br>`a1.2-cp1-sprechen-1`: Vier: Küche, Badezimmer, Wohnzimmer und Schlafzimmer. → Zwei Zimmer: Wohnzimmer und Schlafzimmer. Küche und Badezimmer sind auch da. |
| a1.2-cp2 / 0 | `a1.2-cp2-bausteine-2`: Wie → die<br>`a1.2-cp2-bausteine-3`: gehen → Wie<br>`a1.2-cp2-bausteine-4`: sprichst → gehen<br>`a1.2-cp2-bausteine-6`: zwanzigste → drei |
| a1.2-cp2 / 1 | `a1.2-cp2-bausteine-1`: Was → den Kuchen<br>`a1.2-cp2-bausteine-2`: Zuerst gehen Sie bis zur Kirche. → Was<br>`a1.2-cp2-bausteine-3`: sprechen → Zuerst gehen Sie bis zur Kirche.<br>`a1.2-cp2-bausteine-4`: den Kuchen → sprechen |
| a1.2-cp2 / 2 | `a1.2-cp2-bausteine-1`: die → Wohin<br>`a1.2-cp2-bausteine-2`: Wohin → Wo ist die Haltestelle?<br>`a1.2-cp2-bausteine-3`: Wo ist die Haltestelle? → Liest<br>`a1.2-cp2-bausteine-4`: Liest → Wir kaufen das Auto nicht.<br>`a1.2-cp2-bausteine-5`: zwanzig → null-sieben-zwei-drei-vier<br>`a1.2-cp2-bausteine-6`: drei → dritte |
| a1.2-cp2 / 3 | `a1.2-cp2-bausteine-4`: Wer → den<br>`a1.2-cp2-bausteine-6`: dritte → zwanzig |
| a1.2-cp4 / 0 | `a1.2-cp4-bausteine-1`: Das Buch ist von meiner Mutter. → den<br>`a1.2-cp4-bausteine-2`: ist → Ich habe einen Onkel.<br>`a1.2-cp4-bausteine-3`: den → Das Buch ist von meiner Mutter.<br>`a1.2-cp4-bausteine-4`: Ich habe einen Onkel. → ist<br>`a1.2-cp4-bausteine-6`: nicht → keine |
| a1.2-cp4 / 1 | `a1.2-cp4-bausteine-1`: mir → von<br>`a1.2-cp4-bausteine-2`: von → telefoniert<br>`a1.2-cp4-bausteine-3`: telefoniert → mir<br>`a1.2-cp4-bausteine-6`: Wer → Welche |
| a1.2-cp4 / 2 | `a1.2-cp4-bausteine-5`: keine → Wann kommt der Bus zum Konzert?<br>`a1.2-cp4-bausteine-6`: Wann → sprichst |
| a1.2-cp4 / 3 | `a1.2-cp4-bausteine-5`: kein → nicht<br>`a1.2-cp4-bausteine-6`: Wann kommt der Bus zum Konzert? → Wer |

A1.1 curriculum source (including every dialogue line) matches HEAD; the audit normalises platform line endings for this source comparison, and `git diff -- src/data/curricula/a11.js` is empty.



## Validator rules and ratchets: before → after

All hard-rule findings are 0 → 0. Each ratchet cell shows `measurement / cap before → measurement / cap after`. Every cap equals its measurement; none increased. Rules 1–9 and other silent hard rules are enforced by the successful validator exits.

| Rule | Meaning | A1.1 before → after | A1.2 before → after |
| --- | --- | --- | --- |
| 1 | 12 lessons, ids/slugs | 0 → 0 (hard) | 0 → 0 (hard) |
| 2 | Situations, can-dos, Handlungsfeld, exam parts | 0 → 0 (hard) | 0 → 0 (hard) |
| 3 | Grammar slugs | 0 → 0 (hard) | 0 → 0 (hard) |
| 4 | Wortfeld shape/size | 0 → 0 (hard) | 0 → 0 (hard) |
| 5 | Dialogue vocabulary/length | 0 → 0 (hard) | 0 → 0 (hard) |
| 6 | Notice shape/length | 0 → 0 (hard) | 0 → 0 (hard) |
| 6b | Notice forms evidenced | 23/23 → 23/23 | 0/0 → 0/0 |
| 7 | Other lesson steps | 0 → 0 (hard) | 0 → 0 (hard) |
| 8 | Curriculum shape/hours | 0 → 0 (hard) | 0 → 0 (hard) |
| 9 | German-only, no promises/fees | 0 → 0 (hard) | 0 → 0 (hard) |
| 10 | Wortfeld coverage | 14/14 → 14/14 | 0/0 → 0/0 |
| 11 | Whole-pool vocabulary | 59/59 → 59/59 | 26/26 → 26/26 |
| 11b | Drawn vocabulary | 0/0 → 0/0 | 0/0 → 0/0 |
| 12 | Can-do rehearsal | 0 → 0 (hard) | 0 → 0 (hard) |
| 13 | Speaking missions | 4/4 → 4/4 | 1/1 → 1/1 |
| 14 | Character consistency | 0 → 0 (hard) | 0 → 0 (hard) |
| 15 | Production grammar preview | 3/3 → 3/3 | 0/0 → 0/0 |
| 15b | Deferred constructions | 0/0 → 0/0 | 0/0 → 0/0 |
| 16 | Exam-part coverage | 0/0 → 0/0 | 0/0 → 0/0 |
| 17 | Model satisfies checklist | 0 → 0 (hard) | 0 → 0 (hard) |
| 18 | Distinct dictation/read-aloud lines | 0/0 → 0/0 | 0/0 → 0/0 |
| 19 | Model/dialogue consistency | 0 → 0 (hard) | 0 → 0 (hard) |
| 20 | Model vocabulary | 0/0 → 0/0 | 0/0 → 0/0 |
| 21 | Leitpunkt vocabulary | 0/0 → 0/0 | 0/0 → 0/0 |
| 22 | Form sentences in message models | 0/0 → 0/0 | 0/0 → 0/0 |
| 23 | Vocabulary without input | 57/57 → 57/57 | 4/4 → 4/4 |
| 23b | Graded vocabulary without input | 0 → 0 (hard) | 0 → 0 (hard) |
| 24 | Nationality predicates | 0 → 0 (hard) | 0 → 0 (hard) |
| 25 | English twins | 0 → 0 (hard) | 0/0 → 0/0 |


## Exact verification results

All commands ran from `C:\Users\zaid1\deutschmeister-live`, offline. The native worker-based Node test command failed with `spawn EPERM`; all successful test commands use `--experimental-test-isolation=none`. The broad affected-file run was also repeated one file per process to prevent its global storage mocks leaking between files.

Final required-test rerun exited 0 on the final source/pools:

```text
node --test --experimental-test-isolation=none tests/assessment-integrity.test.mjs tests/check-answer.test.mjs tests/curricula.test.mjs tests/rule-card-overrides.test.mjs tests/exams.test.mjs tests/lesson-extra-items.test.mjs tests/lesson-extra-items-a12.test.mjs tests/a12-rebuild.test.mjs tests/checkpoint.test.mjs tests/live-course-batch1.test.mjs tests/a11-content-classes.test.mjs
ℹ tests 379
ℹ suites 0
ℹ pass 379
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 517259.5803
```

The full affected-file coverage is 945 unique tests in 48 files. Final results combine the per-file run with the final required-group rerun: 942 passed, three baseline failures. This is a computed coverage total, not a claim that one combined run printed `fail 0`. The original combined run's storage mocks conflict when worker isolation is disabled; the per-file runs eliminate that interference.

Rebuild order (each exit 0):

```text
node scripts/build-lesson-pool.mjs a1.1
node scripts/validate-curriculum.mjs
node scripts/build-lesson-pool.mjs a1.2
node scripts/validate-curriculum.mjs a1.2
node scripts/sync-curricula.mjs
```

Exact final validator summary lines (each exit 0):

```text
node scripts/validate-curriculum.mjs
✓ A1.1: 12 Lektionen, 263 Wortfeld-Einträge (263 mit wordId, 100 %), 54 h
  RULE 10 Wortfeld-Deckung: 14 ungenutzt von 263 (Ratchet 14)
  RULE 11 Item-Lexik (ganzer Pool, informativ): 59 ungelehrte Tokens (Ratchet 59)
  RULE 11b gezogene Item-Lexik: 0 ungelehrte Tokens (Ratchet 0)
  RULE 12 Kann-Beschreibungen ohne Übung: 0 (harte Regel, kein Ratchet)
  RULE 13 Sprechaufträge ohne Mission: 4 (Ratchet 4) — L7, L10, L11, L12
  RULE 6b Notice-Formen ohne Beleg: 23 (Ratchet 23)
  RULE 15 Vorgriffe in Diktat/Nachsprechen: 3 (Ratchet 3)
  RULE 15b aufgeschobene Konstruktionen in Produktionstexten: 0 (Ratchet 0)
  RULE 16 ungedeckte Prüfungsteile: 0 (Ratchet 0)
  RULE 17 Mustertexte, die ihre eigene Checkliste reißen: 0 (harte Regel, kein Ratchet)
  RULE 18 Lektionen, die Diktat und Vorlesen auf dieselbe Zeile legen: 0 (Ratchet 0)
  RULE 19 Mustertexte gegen den eigenen Dialog: 0 (harte Regel, kein Ratchet)
  RULE 20 ungelehrte Wörter in Mustertexten: 0 (Ratchet 0)
  RULE 21 Leitpunkte ohne gelehrte Lexis: 0 (Ratchet 0)
  RULE 22 Formularsätze in Mitteilungs-Mustertexten: 0 (Ratchet 0)
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 57 von 263 (Ratchet 57)
  RULE 23b Wörter der benoteten Aufgabe ohne Eingabefläche: 0 (harte Regel, kein Ratchet)
  RULE 24 prädikative Nationalitätsadjektive: 0 (harte Regel, kein Ratchet)
  RULE 25 englische Zwillinge fehlen: 0 (harte Regel, kein Ratchet) — Lektionen 0, Pool-Items ohne explanationEn 0 von 379
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
```

```text
node scripts/validate-curriculum.mjs a1.2
✓ A1.2: 12 Lektionen, 206 Wortfeld-Einträge (197 mit wordId, 95 %), 54 h
  RULE 10 Wortfeld-Deckung: 0 ungenutzt von 206 (Ratchet 0)
  RULE 11 Item-Lexik (ganzer Pool, informativ): 26 ungelehrte Tokens (Ratchet 26)
  RULE 11b gezogene Item-Lexik: 0 ungelehrte Tokens (Ratchet 0)
  RULE 12 Kann-Beschreibungen ohne Übung: 0 (harte Regel, kein Ratchet)
  RULE 13 Sprechaufträge ohne Mission: 1 (Ratchet 1) — L11
  RULE 6b Notice-Formen ohne Beleg: 0 (Ratchet 0)
  RULE 15 Vorgriffe in Diktat/Nachsprechen: 0 (Ratchet 0)
  RULE 15b aufgeschobene Konstruktionen in Produktionstexten: 0 (Ratchet 0)
  RULE 16 ungedeckte Prüfungsteile: 0 (Ratchet 0)
  RULE 17 Mustertexte, die ihre eigene Checkliste reißen: 0 (harte Regel, kein Ratchet)
  RULE 18 Lektionen, die Diktat und Vorlesen auf dieselbe Zeile legen: 0 (Ratchet 0)
  RULE 19 Mustertexte gegen den eigenen Dialog: 0 (harte Regel, kein Ratchet)
  RULE 20 ungelehrte Wörter in Mustertexten: 0 (Ratchet 0)
  RULE 21 Leitpunkte ohne gelehrte Lexis: 0 (Ratchet 0)
  RULE 22 Formularsätze in Mitteilungs-Mustertexten: 0 (Ratchet 0)
  RULE 23 Wortfeld-Einträge ohne Eingabefläche: 4 von 206 (Ratchet 4)
  RULE 23b Wörter der benoteten Aufgabe ohne Eingabefläche: 0 (Ratchet 0)
  RULE 24 prädikative Nationalitätsadjektive: 0 (harte Regel, kein Ratchet)
  RULE 25 englische Zwillinge fehlen: 0 (Ratchet 0) — Lektionen 0, Pool-Items ohne explanationEn 0 von 295
  RULE 14 Figuren-Widersprüche: 0 (harte Regel, kein Ratchet)
```

Exact determinacy lines (exit 0):

```text
a1.1: 406 served items, 0 correct alternatives rejected
a1.2: 481 served items, 0 correct alternatives rejected
```

`npm run check:duplicates` exited 0; all 18 comparisons printed `OK:`, including:

```text
OK: src/data/curricula/a11.js === astro-site/src/data/curricula/a11.js
OK: src/data/curricula/a12.js === astro-site/src/data/curricula/a12.js
```

`npx --no-install eslint --no-ignore --max-warnings 0` on every changed JS/JSX/MJS file (including Astro and both audit helpers) exited 0 with no output. `--no-install` prevents package downloads; `--no-ignore` includes the otherwise ignored generated Astro twin. The initial lint command without `--no-ignore` failed with one ignored-file warning; the corrected invocation actually linted that file. `git diff --check` exited 0 with no output.

### Baseline and intermediate failures

The 48-file combined run produced these exact lines before fixes and per-file isolation:

```text
ℹ tests 945
ℹ pass 932
ℹ fail 13
```

The subsequent per-file run removed all eight storage-mock leakage failures (`lesson-attempts` 8/8 and `sync-outbox` 19/19 passed). It exposed additional A1.2 annotation pins while named repairs were being finalised; those were fixed in content/guard logic without changing their assertions. The final required-test rerun below supersedes those transient A1.2 results.

Three remaining affected-suite failures are pre-existing Windows assumptions: `astro-hex` compares Windows backslash paths with slash-based exceptions; `shared-files` compares the same two path conventions; `first-run` requires the literal LF sequence `hasLevelAccess,\n` in a CRLF checkout. None is part of Batch 1 content/acceptance behavior. They were reproduced from HEAD through `baseline-loader.mjs`, a read-only in-memory overlay that preserves this checkout's line endings; no checkout/reset, baseline working tree, or database was used.

Baseline command (executed via context-mode because native child spawning of git was denied):

```text
node --test --experimental-test-isolation=none --import ./docs/course-factory/live-fixes/baseline-loader.mjs tests/astro-hex.test.mjs tests/first-run.test.mjs tests/shared-files.test.mjs
✖ no colour literal in the static site outside the design tokens (11645.2635ms)
✖ the dashboard renders the first-run card in the hero slot and demotes its other primaries (121.6281ms)
✖ shared sync writes only manifest destinations and preserves bytes (150.6143ms)
ℹ tests 30
ℹ suites 0
ℹ pass 27
ℹ fail 3
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 19255.418
✖ failing tests:
test at tests\astro-hex.test.mjs:34:1
✖ no colour literal in the static site outside the design tokens (11645.2635ms)
  AssertionError [ERR_ASSERTION]: use a token class or theme() — design-tokens.js is the one place a hex is written
test at tests\first-run.test.mjs:262:1
✖ the dashboard renders the first-run card in the hero slot and demotes its other primaries (121.6281ms)
  AssertionError [ERR_ASSERTION]: the decision must receive hasLevelAccess
test at tests\shared-files.test.mjs:29:1
✖ shared sync writes only manifest destinations and preserves bytes (150.6143ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
```

Other resolved checks during implementation: the taught cancellation model replaced the rejected `kann` form (RULE 20); imperative optional `-e` survived after excluding imperative openings from the new cue pass; all card vocabulary/budget failures were corrected without changing allowances. A guessed `build-rule-cards.mjs` command failed because no such script exists; the documented pool build successfully regenerated the cards. Context-mode's file-reader root restriction was avoided with absolute native reads. A Fablize Unicode-console error was fixed with `PYTHONIOENCODING=utf-8`.

## Every changed file

Final inventory (source, generated outputs, tests and evidence):

| File | Change |
| --- | --- |
| `src/data/lessonPools/quality.js` | Shared opening, named-repair and English-constraint rules. |
| `scripts/build-lesson-pool.mjs` | Cue placement/final pass, English propagation, mandatory canonical-repair guard. |
| `src/data/lessonPools/a11.corrections.json` | Mother antecedent and explicit cue on the reviewed sister prompt. |
| `src/data/lessonPools/a11.extra.json` | 18 handwritten named repairs. |
| `src/data/lessonPools/a12.extra.json` | 19 handwritten named repairs, preserving old valid alternatives. |
| `src/data/lessonPools/a11.json` | Rebuilt 379-item pool. |
| `src/data/lessonPools/a12.json` | Rebuilt 295-item pool. |
| `src/lib/checkpoint/lexis.js` | Shared complete named-word instruction formula. |
| `src/lib/lesson/wordOrder.js` | New closed grammar and licensed tile alternatives. |
| `src/lib/lesson/buildLesson.js` | Safe tile selection and taught-word matching fallback; stable listening RNG. |
| `src/lib/lesson/check.js` | Exact licensed tile-order checking with tile case/punctuation normalization. |
| `scripts/rule-card-overrides.mjs` | Three bilingual grammar-card fixes. |
| `netlify/functions/_shared/ruleCards.mjs` | Generated cards. |
| `src/data/curricula/a12.js` | Room count, cancellation model, synonymous imperative notice wording. |
| `astro-site/src/data/curricula/a12.js` | Synchronized generated curriculum twin. |
| `src/data/curricula/a11.meta.js` | Residence can-do translation. |
| `src/data/courseTests/abschlusstestA11.js` | Honest title and assessment scope. |
| `src/data/courseTests/abschlusstestA12.js` | Honest title/scope and formal learner instructions. |
| `tests/assessment-integrity.test.mjs` | Require cues for legitimate predicate/pronoun fronting. |
| `tests/a12-rebuild.test.mjs` | Update the room-dialogue annotation to the new factual line; assertions unchanged. |
| `tests/live-course-batch1.test.mjs` | Eight new class regressions, real probes and mutations. |
| `docs/course-factory/live-fixes/measure-batch1.mjs` | Read-only reproducible before/after draw audit. |
| `docs/course-factory/live-fixes/baseline-loader.mjs` | Read-only HEAD overlay to reproduce environment-dependent baseline failures. |
| `docs/course-factory/live-fixes/BATCH-1-REPORT-2026-10-25.md` | This report, created as a skeleton and updated section by section. |
| `.fablize/goals.json` | Original goal state restored; native patching adds only an EOF newline. |
| `.fablize/batch-1-goals.json` | Archived completed Batch 1 goals; original goals restored. |
| `.fablize/batch-1-ledger.jsonl` | Archived Batch 1 evidence ledger; original ledger restored. |

The original `.fablize/goals.json` and `.fablize/ledger.jsonl` were temporarily used by the mandated workflow, then restored from the preserved copies (the goals file gains an EOF newline; its state is unchanged). The temporary `batch-1-previous-*` copies were removed after archiving. The final gate printed `fablize: G003 → complete` and `fablize: all stories complete ✓` after running the eight class regressions with `--verify-cmd` and recorded `--verify-evidence`. No A1.1 dialogue/source, ratchet constant, dependency, database, or deployment file was changed.

## Affected-test manifest

Each of these 48 files was executed with `node --test --experimental-test-isolation=none`, one process per file. The final required group additionally reruns all nine requested files plus the new test and the corrected-field test. The three baseline failure files are documented above; the new content regressions do not suppress them.

```text
a11-content-classes.test.mjs
a12-rebuild.test.mjs
a12-tense.test.mjs
a2-1-abschlusstest.test.mjs
a2-2-abschlusstest.test.mjs
assessment-integrity.test.mjs
astro-hex.test.mjs
b3-answer-checking.test.mjs
b3-lesson-generation.test.mjs
check-answer.test.mjs
checkpoint-feedback.test.mjs
checkpoint.test.mjs
course-art.test.mjs
course-audio.test.mjs
course-certificate.test.mjs
course-front-door.test.mjs
course-home.test.mjs
course-meta.test.mjs
course-next.test.mjs
course-plan.test.mjs
course-player.test.mjs
course-reminder.test.mjs
course-value.test.mjs
curricula.test.mjs
dead-modules.test.mjs
exams.test.mjs
first-run.test.mjs
first-stop.test.mjs
free-door.test.mjs
german-sie.test.mjs
lesson-attempts.test.mjs
lesson-back-skip.test.mjs
lesson-engine.test.mjs
lesson-extra-items-a12.test.mjs
lesson-extra-items.test.mjs
lesson-pool-rules.test.mjs
lesson-run-resume.test.mjs
lesson-scoring.test.mjs
live-course-batch1.test.mjs
rule-card-overrides.test.mjs
shared-files.test.mjs
strong-verb-check.test.mjs
syllabus.test.mjs
sync-outbox.test.mjs
trial-end-claims.test.mjs
unlimited-claims.test.mjs
wortfeld-pacing.test.mjs
writing-course.test.mjs
```

## A1.2 complete changed German pool prompts

Generated pool: 46 changed German prompts; 88 changed English hints. Pool size 295 → 295. No minLektion stamps or accepted arrays changed.

| Item | Old German → new German |
| --- | --- |
| extra-a12-l03-14 | Korrigieren Sie nur den Fehler: „Ich gehe gerner in das Museum.“ (Beginnen Sie mit „Ich“) → Korrigieren Sie nur den Fehler: „Ich gehe gerner in das Museum.“ (Wort gerner) (Beginnen Sie mit „Ich“) |
| extra-a12-l03-09 | Bilden Sie den Satz: [Ana / kaufen / Kuchen / im Geschäft] (mit bestimmtem Artikel) (Präsens) (Beginnen Sie mit „Ana“) → Bilden Sie den Satz (Beginnen Sie mit „Ana“): [Ana / kaufen / Kuchen / im Geschäft] (mit bestimmtem Artikel) (Präsens) |
| extra-a12-l01-01 | Bilden Sie den Satz: [zuerst / gehen / Sie / geradeaus] (Präsens) (Beginnen Sie mit „Zuerst“) → Bilden Sie den Satz (Beginnen Sie mit „Zuerst“): [zuerst / gehen / Sie / geradeaus] (Präsens) |
| extra-a12-l01-02 | Bilden Sie den Satz: [dann / gehen / Sie / an der Ecke / links] (Präsens) (Beginnen Sie mit „Dann“) → Bilden Sie den Satz (Beginnen Sie mit „Dann“): [dann / gehen / Sie / an der Ecke / links] (Präsens) |
| extra-a12-l01-03 | Korrigieren Sie nur den Fehler: „Danach die Brücke kommt.“ (Beginnen Sie mit „Danach“) → Korrigieren Sie nur den Fehler: „Danach die Brücke kommt.“ (Verb auf Position 2) (Beginnen Sie mit „Danach“) |
| extra-a12-l01-04 | Korrigieren Sie nur den Fehler: „Zuerst Sie gehen bis zur Kirche.“ (Beginnen Sie mit „Zuerst“) → Korrigieren Sie nur den Fehler: „Zuerst Sie gehen bis zur Kirche.“ (Verb auf Position 2) (Beginnen Sie mit „Zuerst“) |
| extra-a12-l01-05 | Bilden Sie die Frage: [wie / kommen / ich / zum Rathaus] (Präsens) → Bilden Sie die Frage (Beginnen Sie mit „Wie“): [wie / kommen / ich / zum Rathaus] (Präsens) |
| extra-a12-l01-06 | Bilden Sie die Frage: [wo / sein / die Haltestelle] (Präsens) → Bilden Sie die Frage (Beginnen Sie mit „Wo“): [wo / sein / die Haltestelle] (Präsens) |
| extra-a12-l01-08 | Korrigieren Sie nur den Fehler: „Die Straßenbahn zum Zentrum fährt.“ (Beginnen Sie mit „Die Straßenbahn“) → Korrigieren Sie nur den Fehler: „Die Straßenbahn zum Zentrum fährt.“ (Verb auf Position 2) (Beginnen Sie mit „Die Straßenbahn“) |
| 6d0a5335-94cd-5d2d-b844-0343b6171c63 | Schreiben Sie den Satz: [morgen / ich / aufstehen / früh] (Beginnen Sie mit „Morgen“) → Schreiben Sie den Satz (Beginnen Sie mit „Morgen“): [morgen / ich / aufstehen / früh] |
| fcb99966-b8d2-5eb1-a466-f6c31cfa771e | Schreiben Sie den Satz: [am Montag / wir / einkaufen] (Beginnen Sie mit „Am Montag“) → Schreiben Sie den Satz (Beginnen Sie mit „Am Montag“): [am Montag / wir / einkaufen] |
| 68174fed-dcd5-52e1-93aa-a3efccab10f0 | Schreiben Sie den Satz: [am Samstag / wir / nach Berlin / fliegen] (Beginnen Sie mit „Am Samstag“) → Schreiben Sie den Satz (Beginnen Sie mit „Am Samstag“): [am Samstag / wir / nach Berlin / fliegen] |
| extra-a12-l11-08 | Bilden Sie den Satz: [wir / fahren / bei Regen / mit / Bus] (mit bestimmtem Artikel) (Präsens) (Beginnen Sie mit „Wir“) → Bilden Sie den Satz (Beginnen Sie mit „Wir“): [wir / fahren / bei Regen / mit / Bus] (mit bestimmtem Artikel) (Präsens) |
| extra-a12-l09-12 | Korrigieren Sie nur den Fehler: „Das Taxi fährt von sieben zu zehn Uhr.“ → Korrigieren Sie nur den Fehler: „Das Taxi fährt von sieben zu zehn Uhr.“ (Wort zu) |
| extra-a12-l09-06 | Bilden Sie den Satz: [ich / müssen / den Müll / nach Hause / nehmen] (Beginnen Sie mit „Ich“) → Bilden Sie den Satz (Beginnen Sie mit „Ich“): [ich / müssen / den Müll / nach Hause / nehmen] |
| extra-a12-l09-07 | Bilden Sie die Frage: [wo / dürfen / ich / langsam / fahren] → Bilden Sie die Frage (Beginnen Sie mit „Wo“): [wo / dürfen / ich / langsam / fahren] |
| extra-a12-l09-08 | Korrigieren Sie nur den Fehler: „Ich kann fliegen um neun Uhr.“ → Korrigieren Sie nur den Fehler: „Ich kann fliegen um neun Uhr.“ (Infinitiv am Satzende) |
| 02f3c1af-470a-5019-9539-2dfbc5f6b0d2 | Schreiben Sie den Satz: [wir / am Sonntag / wollen / Fußball / spielen] (Beginnen Sie mit „Wir“) → Schreiben Sie den Satz (Beginnen Sie mit „Wir“): [wir / am Sonntag / wollen / Fußball / spielen] |
| extra-a12-l04-10 | Korrigieren Sie nur den Fehler: „Im Zimmer ist nicht Kissen.“ (Beginnen Sie mit „Im Zimmer“) → Korrigieren Sie nur den Fehler: „Im Zimmer ist nicht Kissen.“ (Wort nicht) (Beginnen Sie mit „Im Zimmer“) |
| extra-a12-l04-11 | Korrigieren Sie nur den Fehler: „Der Vorhang ist kein am Fenster.“ (Beginnen Sie mit „Der Vorhang“) → Korrigieren Sie nur den Fehler: „Der Vorhang ist kein am Fenster.“ (Wort kein) (Beginnen Sie mit „Der Vorhang“) |
| extra-a12-l04-12 | Bilden Sie den Satz: [der Eingang / sein / nicht / schön] (Präsens) (Beginnen Sie mit „Der Eingang“) → Bilden Sie den Satz (Beginnen Sie mit „Der Eingang“): [der Eingang / sein / nicht / schön] (Präsens) |
| extra-a12-l07-13 | Korrigieren Sie nur den Fehler: „Gestern ist mein Onkel glücklich.“ (Beginnen Sie mit „Gestern“) → Korrigieren Sie nur den Fehler: „Gestern ist mein Onkel glücklich.“ (Verb) (Beginnen Sie mit „Gestern“) |
| extra-a12-l07-06 | Bilden Sie die Frage: [wer / sein / die Tante] (Präsens) → Bilden Sie die Frage (Beginnen Sie mit „Wer“): [wer / sein / die Tante] (Präsens) |
| extra-a12-l07-07 | Bilden Sie den Satz: [mein Opa / sein / alt] (Präsens) (Beginnen Sie mit „Mein Opa“) → Bilden Sie den Satz (Beginnen Sie mit „Mein Opa“): [mein Opa / sein / alt] (Präsens) |
| extra-a12-l12-17 | Korrigieren Sie nur den Fehler: „Der Fisch war lecker, aber Tim hat früh gegangen.“ → Korrigieren Sie nur den Fehler: „Der Fisch war lecker, aber Tim hat früh gegangen.“ (Verb) |
| extra-a12-l12-18 | Korrigieren Sie nur den Fehler: „Ich habe die Getränke gebezahlt.“ (Beginnen Sie mit „Ich“) → Korrigieren Sie nur den Fehler: „Ich habe die Getränke gebezahlt.“ (Verb) (Beginnen Sie mit „Ich“) |
| 4681b233-26bd-599d-910a-c76ad0222f80 | Schreiben Sie den Satz im Perfekt: [wir / heute / einkaufen] (Beginnen Sie mit „Wir“) → Schreiben Sie den Satz im Perfekt (Beginnen Sie mit „Wir“): [wir / heute / einkaufen] |
| 142167e5-246c-5ab9-bcd4-f916be43d05d | Schreiben Sie den Satz im Perfekt: [ich / früh / aufstehen] (Beginnen Sie mit „Ich“) → Schreiben Sie den Satz im Perfekt (Beginnen Sie mit „Ich“): [ich / früh / aufstehen] |
| extra-a12-l12-08 | Bilden Sie den Satz: [ich / haben / die Kartoffel / kaufen] (Perfekt) (Beginnen Sie mit „Ich“) → Bilden Sie den Satz (Beginnen Sie mit „Ich“): [ich / haben / die Kartoffel / kaufen] (Perfekt) |
| extra-a12-l12-09 | Bilden Sie den Satz: [Tim / haben / den Reis / kochen] (Perfekt) (Beginnen Sie mit „Tim“) → Bilden Sie den Satz (Beginnen Sie mit „Tim“): [Tim / haben / den Reis / kochen] (Perfekt) |
| extra-a12-l12-10 | Korrigieren Sie nur den Fehler: „Ana hat Milch getrinkt.“ (Beginnen Sie mit „Ana“) → Korrigieren Sie nur den Fehler: „Ana hat Milch getrinkt.“ (Verb) (Beginnen Sie mit „Ana“) |
| extra-a12-l12-11 | Korrigieren Sie nur den Fehler: „Wir haben das Fleisch kaufen.“ (Beginnen Sie mit „Wir“) → Korrigieren Sie nur den Fehler: „Wir haben das Fleisch kaufen.“ (Verb) (Beginnen Sie mit „Wir“) |
| extra-a12-l10-13 | Korrigieren Sie nur den Fehler: „Die Hose gefällt mich.“ → Korrigieren Sie nur den Fehler: „Die Hose gefällt mich.“ (Wort mich) |
| extra-a12-l10-05 | Bilden Sie den Satz: [ich / kaufen / die Jacke / für / meine Oma] (Präsens) (Beginnen Sie mit „Ich“) → Bilden Sie den Satz (Beginnen Sie mit „Ich“): [ich / kaufen / die Jacke / für / meine Oma] (Präsens) |
| extra-a12-l10-06 | Bilden Sie den Satz: [Tim / gehen / ohne / den Mantel] (Präsens) (Beginnen Sie mit „Tim“) → Bilden Sie den Satz (Beginnen Sie mit „Tim“): [Tim / gehen / ohne / den Mantel] (Präsens) |
| extra-a12-l05-11 | Korrigieren Sie nur den Fehler: „Ich würde gern einen Ausflug mache.“ (Beginnen Sie mit „Ich“) → Korrigieren Sie nur den Fehler: „Ich würde gern einen Ausflug mache.“ (Verb) (Beginnen Sie mit „Ich“) |
| extra-a12-l05-07 | Bilden Sie die Frage: [wann / kommen / der Bus / zum Konzert] (Präsens) → Bilden Sie die Frage (Beginnen Sie mit „Wann“): [wann / kommen / der Bus / zum Konzert] (Präsens) |
| extra-a12-l05-08 | Bilden Sie die Frage: [wohin / fahren / wir / im Urlaub] (Präsens) → Bilden Sie die Frage (Beginnen Sie mit „Wohin“): [wohin / fahren / wir / im Urlaub] (Präsens) |
| extra-a12-l05-09 | Korrigieren Sie nur den Fehler in der Frage: „Wann der Film im Kino ist?“ → Korrigieren Sie nur den Fehler in der Frage: „Wann der Film im Kino ist?“ (Verb auf Position 2) |
| 97cb2bd7-3f5d-586f-bee1-032808437aab | Schreiben Sie die Frage: [wie viele / Kinder / du / haben] (Präsens) → Schreiben Sie die Frage (Beginnen Sie mit „Wie“): [wie viele / Kinder / du / haben] (Präsens) |
| edce8810-334e-5234-b03b-a9a90e94cb21 | Schreiben Sie die Frage: [wann / ihr / ankommen] → Schreiben Sie die Frage (Beginnen Sie mit „Wann“): [wann / ihr / ankommen] |
| extra-a12-l06-12 | Korrigieren Sie nur den Fehler: „Ich schlafe nicht gut, denn mein Hals weh tut.“ → Korrigieren Sie nur den Fehler: „Ich schlafe nicht gut, denn mein Hals weh tut.“ (Verb auf Position 2 oder Wort denn) |
| extra-a12-l06-13 | Bilden Sie den Satz: [ich / nehmen / eine Tablette / denn / mein Kopf / wehtun] (Beginnen Sie mit „Ich“; nach „denn“ mit „mein Kopf“) → Bilden Sie den Satz (Beginnen Sie mit „Ich“; nach „denn“ mit „mein Kopf“): [ich / nehmen / eine Tablette / denn / mein Kopf / wehtun] |
| ef8fe41f-51e0-5c6a-88c8-1e5fd291452a | Schreiben Sie den Satz: [wir / am Morgen / fernsehen] (Beginnen Sie mit „Wir“) → Schreiben Sie den Satz (Beginnen Sie mit „Wir“): [wir / am Morgen / fernsehen] |
| extra-a12-l06-08 | Korrigieren Sie nur den Fehler: „Mein Mann schlaft nicht gut, sein Rücken tut weh.“ → Korrigieren Sie nur den Fehler: „Mein Mann schlaft nicht gut, sein Rücken tut weh.“ (Verb) |
| extra-a12-l06-09 | Korrigieren Sie nur den Fehler: „Die Tablette helft gegen Fieber.“ (Beginnen Sie mit „Die Tablette“) → Korrigieren Sie nur den Fehler: „Die Tablette helft gegen Fieber.“ (Verb) (Beginnen Sie mit „Die Tablette“) |

## A1.1 complete changed German pool prompts

Generated pool: 64 changed German prompts; 88 changed English hints. Pool size 379 → 379. No minLektion stamps or accepted arrays changed.

| Item | Old German → new German |
| --- | --- |
| extra-a11-l01-16 | Korrigieren Sie: „Gute Morgen, Frau Kaya!“ → Korrigieren Sie das Wort Gute: „Gute Morgen, Frau Kaya!“ |
| extra-a11-l01-17 | Korrigieren Sie: „Gute Abend, Frau Kaya!“ → Korrigieren Sie das Wort Gute: „Gute Abend, Frau Kaya!“ |
| extra-a11-l01-07 | Bilden Sie den Satz: [ich / heißen / Ana] → Bilden Sie den Satz (Beginnen Sie mit „Ich“): [ich / heißen / Ana] |
| extra-a11-l01-08 | Korrigieren Sie: „Gute Tag, Frau Kaya!“ → Korrigieren Sie das Wort Gute: „Gute Tag, Frau Kaya!“ |
| extra-a11-l01-19 | Bilden Sie die Frage: [wie / gehen / es / Ihnen] → Bilden Sie die Frage (Beginnen Sie mit „Wie“): [wie / gehen / es / Ihnen] |
| extra-a11-l01-24 | Bilden Sie die Frage: [wie / gehen / es / dir] → Bilden Sie die Frage (Beginnen Sie mit „Wie“): [wie / gehen / es / dir] |
| extra-a11-l05-09 | Korrigieren Sie: „Ein Schere ist hier.“ (mit bestimmtem Artikel) → Korrigieren Sie den Artikel: „Ein Schere ist hier.“ (mit bestimmtem Artikel) |
| extra-a11-l05-10 | Bilden Sie den Satz: [das / Bild / sein / gelb] → Bilden Sie den Satz (Beginnen Sie mit „Das Bild“): [das / Bild / sein / gelb] |
| extra-a11-l05-12 | Korrigieren Sie: „Das Wohnung ist hier.“ (mit bestimmtem Artikel) → Korrigieren Sie den Artikel: „Das Wohnung ist hier.“ (mit bestimmtem Artikel) |
| extra-a11-l05-20 | Korrigieren Sie: „Das Tür ist weiß.“ (mit bestimmtem Artikel) → Korrigieren Sie den Artikel: „Das Tür ist weiß.“ (mit bestimmtem Artikel) |
| extra-a11-l05-23 | Korrigieren Sie: „Die Schlüssel ist gelb.“ (mit bestimmtem Artikel) → Korrigieren Sie den Artikel: „Die Schlüssel ist gelb.“ (mit bestimmtem Artikel) |
| extra-a11-l04-36 | Korrigieren Sie: „Der Tasche ist teuer.“ (mit bestimmtem Artikel) → Korrigieren Sie den Artikel: „Der Tasche ist teuer.“ (mit bestimmtem Artikel) |
| extra-a11-l04-37 | Korrigieren Sie: „Die Rucksack ist gut.“ (mit bestimmtem Artikel) → Korrigieren Sie den Artikel: „Die Rucksack ist gut.“ (mit bestimmtem Artikel) |
| extra-a11-l04-39 | Korrigieren Sie: „Das Stuhl ist alt.“ (mit bestimmtem Artikel) → Korrigieren Sie den Artikel: „Das Stuhl ist alt.“ (mit bestimmtem Artikel) |
| extra-a11-l04-40 | Korrigieren Sie: „Die Tisch ist alt.“ (mit bestimmtem Artikel) → Korrigieren Sie den Artikel: „Die Tisch ist alt.“ (mit bestimmtem Artikel) |
| extra-a11-l04-41 | Korrigieren Sie: „Der Uhr ist alt.“ (mit bestimmtem Artikel) → Korrigieren Sie den Artikel: „Der Uhr ist alt.“ (mit bestimmtem Artikel) |
| extra-a11-l04-10 | Korrigieren Sie: „Das Lampe kostet acht Euro.“ (mit bestimmtem Artikel) → Korrigieren Sie den Artikel: „Das Lampe kostet acht Euro.“ (mit bestimmtem Artikel) |
| extra-a11-l04-12 | Bilden Sie den Satz: [die Uhr / kosten / zwanzig Euro] → Bilden Sie den Satz (Beginnen Sie mit „Die Uhr“): [die Uhr / kosten / zwanzig Euro] |
| extra-a11-l04-17 | Korrigieren Sie: „Der Lampe ist teuer.“ (mit bestimmtem Artikel) → Korrigieren Sie den Artikel: „Der Lampe ist teuer.“ (mit bestimmtem Artikel) |
| extra-a11-l04-18 | Bilden Sie den Satz: [die Tasche / sein / teuer] → Bilden Sie den Satz (Beginnen Sie mit „Die Tasche“): [die Tasche / sein / teuer] |
| extra-a11-l04-38 | Bilden Sie den Satz: [das Regal / sein / teuer] → Bilden Sie den Satz (Beginnen Sie mit „Das Regal“): [das Regal / sein / teuer] |
| dd1c3d60-8ae7-4c94-8990-19633dcba36f | ___ ist meine Mutter. → Meine Mutter ist hier. ___ spricht Deutsch. |
| extra-a11-l03-07 | Bilden Sie den Satz: [wir / kommen / aus Marokko] → Bilden Sie den Satz (Beginnen Sie mit „Wir“): [wir / kommen / aus Marokko] |
| 5e65eab6-eba1-5797-beb8-e34750c5ceb1 | [das / ist / mein Bruder] → Schreiben Sie den Satz. → [das / ist / mein Bruder] → Schreiben Sie den Satz. (Beginnen Sie mit „Das“) |
| 8908dc09-b16b-57e4-b056-e0f3060766c8 | [das / ist / sein / Schwester] → Schreiben Sie den Satz. → [das / ist / sein / Schwester] → Schreiben Sie den Satz. (Beginnen Sie mit „Das“) |
| d09ae745-12d0-5a21-9648-88fc36a55de1 | [das / ist / unser Auto] → Schreiben Sie den Satz. → [das / ist / unser Auto] → Schreiben Sie den Satz. (Beginnen Sie mit „Das“) |
| 83bab298-abc5-5e7f-a132-1bb60a689b8a | [das / ist / Ihre Adresse] → Schreiben Sie den Satz. → [das / ist / Ihre Adresse] → Schreiben Sie den Satz. (Beginnen Sie mit „Das“) |
| extra-a11-l12-13 | Bilden Sie den Satz: [mein / Geburtstag / sein / im Mai] → Bilden Sie den Satz (Beginnen Sie mit „Mein Geburtstag“): [mein / Geburtstag / sein / im Mai] |
| extra-a11-l12-14 | Bilden Sie den Satz: [wir / feiern / unser / Fest] → Bilden Sie den Satz (Beginnen Sie mit „Wir“): [wir / feiern / unser / Fest] |
| extra-a11-l07-08 | Korrigieren Sie: „Lena spielen am Wochenende Fußball.“ → Korrigieren Sie das Verb: „Lena spielen am Wochenende Fußball.“ |
| 96b41b81-d57b-5bfe-91c8-93ef7d8982ca | Schreiben Sie den Satz: [ich / aufstehen / um 7 Uhr] → Schreiben Sie den Satz (Beginnen Sie mit „Ich“): [ich / aufstehen / um 7 Uhr] |
| 1958acf0-ed11-583e-88e0-6a55fab00172 | Schreiben Sie den Satz: [wir / einkaufen / heute] → Schreiben Sie den Satz (Beginnen Sie mit „Wir“): [wir / einkaufen / heute] |
| 51d74698-b413-58f3-bbc5-1fde9f41f83b | Schreiben Sie den Satz: [er / abholen / dich / um 8 Uhr] → Schreiben Sie den Satz (Beginnen Sie mit „Er“): [er / abholen / dich / um 8 Uhr] |
| extra-a11-l11-01 | Bilden Sie die Frage: [mitkommen / du / am Freitag] → Bilden Sie die Frage (Beginnen Sie mit „Kommst du am Freitag“): [mitkommen / du / am Freitag] |
| extra-a11-l11-05 | Bilden Sie den Satz: [wir / mitbringen / den Kuchen] → Bilden Sie den Satz (Beginnen Sie mit „Wir“): [wir / mitbringen / den Kuchen] |
| extra-a11-l11-08 | Bilden Sie den Satz: [ich / anrufen / meine Mutter] → Bilden Sie den Satz (Beginnen Sie mit „Ich“): [ich / anrufen / meine Mutter] |
| extra-a11-l11-10 | Bilden Sie den Satz: [ich / haben / gestern / gearbeitet] → Bilden Sie den Satz (Beginnen Sie mit „Ich“): [ich / haben / gestern / gearbeitet] |
| extra-a11-l08-17 | Korrigieren Sie: „Ich bin um Freitag beim Arzt.“ → Korrigieren Sie das Wort um: „Ich bin um Freitag beim Arzt.“ |
| extra-a11-l08-18 | Korrigieren Sie: „Der Termin ist um Dienstag.“ → Korrigieren Sie das Wort um: „Der Termin ist um Dienstag.“ |
| extra-a11-l08-07 | Korrigieren Sie: „Der Termin ist um Montag.“ → Korrigieren Sie das Wort um: „Der Termin ist um Montag.“ |
| extra-a11-l08-08 | Bilden Sie den Satz: [der Termin / sein / am Dienstag / um acht Uhr] → Bilden Sie den Satz (Beginnen Sie mit „Der Termin“): [der Termin / sein / am Dienstag / um acht Uhr] |
| extra-a11-l09-05 | Bilden Sie den Satz: [ich / möchten / ein Glas Wasser] → Bilden Sie den Satz (Beginnen Sie mit „Ich“): [ich / möchten / ein Glas Wasser] |
| extra-a11-l02-07 | Bilden Sie den Satz: [ich / sein / Lehrer / von Beruf] → Bilden Sie den Satz (Beginnen Sie mit „Ich“): [ich / sein / Lehrer / von Beruf] |
| extra-a11-l02-17 | Bilden Sie den Satz: [ich / kommen / aus Marokko] → Bilden Sie den Satz (Beginnen Sie mit „Ich“): [ich / kommen / aus Marokko] |
| 0b5c7d74-0e60-51b3-802e-50a4c8457f36 | Schreiben Sie die Frage: [du / müde / sein] → Schreiben Sie die Frage (Beginnen Sie mit „Bist du“): [du / müde / sein] |
| e52a4dca-4065-58a0-ae8f-de107844d5f2 | Schreiben Sie die Frage: [du / in Köln / wohnen] → Schreiben Sie die Frage (Beginnen Sie mit „Wohnst“): [du / in Köln / wohnen] |
| 20edbc50-95ff-5914-9381-9673b2716b68 | Schreiben Sie die Frage: [du / aus Polen / kommen] → Schreiben Sie die Frage (Beginnen Sie mit „Kommst“): [du / aus Polen / kommen] |
| fa2176d8-3252-57b7-8e4e-0c009303f306 | Schreiben Sie die Frage: [du / am Samstag / mitkommen] → Schreiben Sie die Frage (Beginnen Sie mit „Kommst du am Samstag“): [du / am Samstag / mitkommen] |
| 78abfd45-9be5-51ff-a294-12c1aa43d6e9 | Schreiben Sie die höfliche Frage: [Sie / in Berlin / wohnen] → Schreiben Sie die höfliche Frage (Beginnen Sie mit „Wohnen“): [Sie / in Berlin / wohnen] |
| 6f0fbd89-79de-53ab-9b82-67b4f5f734ed | Schreiben Sie die höfliche Frage: [Sie / Kinder / haben] → Schreiben Sie die höfliche Frage (Beginnen Sie mit „Haben“): [Sie / Kinder / haben] |
| extra-a11-l10-07 | Bilden Sie die Frage: [fahren / ihr / mit dem Auto / in die Schweiz] → Bilden Sie die Frage (Beginnen Sie mit „Fahrt ihr“): [fahren / ihr / mit dem Auto / in die Schweiz] |
| extra-a11-l10-08 | Bilden Sie die höfliche Frage: [fahren / Sie / morgen / nach Deutschland] → Bilden Sie die höfliche Frage (Beginnen Sie mit „Fahren“): [fahren / Sie / morgen / nach Deutschland] |
| extra-a11-l10-09 | Bilden Sie den Satz: [sein / die Ankunft / an Gleis vier] (Verb auf Position 1) → Bilden Sie den Satz (Beginnen Sie mit „Ist“): [sein / die Ankunft / an Gleis vier] (Verb auf Position 1) |
| extra-a11-l10-12 | Bilden Sie den Satz: [kommen / der Bus / zum Bahnhof] (Verb auf Position 1) → Bilden Sie den Satz (Beginnen Sie mit „Kommt“): [kommen / der Bus / zum Bahnhof] (Verb auf Position 1) |
| extra-a11-l10-13 | [haben / der Zug / nach Österreich / Verspätung] (Antwort: ja oder nein) → [haben / der Zug / nach Österreich / Verspätung] (Antwort: ja oder nein) (Beginnen Sie mit „Hat“) |
| extra-a11-l10-14 | [kosten / die Fahrkarte / nach Deutschland / zwanzig Euro] (Antwort: ja oder nein) → [kosten / die Fahrkarte / nach Deutschland / zwanzig Euro] (Antwort: ja oder nein) (Beginnen Sie mit „Kostet“) |
| extra-a11-l10-15 | [sein / die Abfahrt / von Gleis vier] (die Satzmelodie steigt) → [sein / die Abfahrt / von Gleis vier] (die Satzmelodie steigt) (Beginnen Sie mit „Ist“) |
| extra-a11-l10-16 | [sein / der Bahnhof / weit] (die Satzmelodie steigt) → [sein / der Bahnhof / weit] (die Satzmelodie steigt) (Beginnen Sie mit „Ist der Bahnhof“) |
| extra-a11-l10-17 | Bilden Sie den Satz mit dem Verb auf Position 1: „Der Zug fährt nach Österreich.“ → Bilden Sie den Satz mit dem Verb auf Position 1: „Der Zug fährt nach Österreich.“ (Beginnen Sie mit „Fährt“) |
| extra-a11-l10-18 | Die Antwort ist: „Ja, der Zug hat Verspätung.“ Schreiben Sie die Frage. → Die Antwort ist: „Ja, der Zug hat Verspätung.“ Schreiben Sie die Frage. (Beginnen Sie mit „Hat“) |
| extra-a11-l10-19 | Bilden Sie den Satz mit dem Verb auf Position 1: „Der Bus fährt nach Deutschland.“ → Bilden Sie den Satz mit dem Verb auf Position 1: „Der Bus fährt nach Deutschland.“ (Beginnen Sie mit „Fährt“) |
| extra-a11-l10-20 | Die Antwort ist: „Ja, der Bus hat Verspätung.“ Schreiben Sie die Frage. → Die Antwort ist: „Ja, der Bus hat Verspätung.“ Schreiben Sie die Frage. (Beginnen Sie mit „Hat“) |
| extra-a11-l10-21 | Bilden Sie den Satz mit dem Verb auf Position 1: „Der Fahrer fährt nach Österreich.“ → Bilden Sie den Satz mit dem Verb auf Position 1: „Der Fahrer fährt nach Österreich.“ (Beginnen Sie mit „Fährt“) |
| extra-a11-l10-22 | Die Antwort ist: „Ja, der Fahrer hat Zeit.“ Schreiben Sie die Frage. → Die Antwort ist: „Ja, der Fahrer hat Zeit.“ Schreiben Sie die Frage. (Beginnen Sie mit „Hat“) |


## Gaps and deferred scope

No network, database, production deployment or audio inspection. A1.1 checkpoint reading shortcut, A1.2 Hören option coupling and A1.1 vocabulary without input are explicitly deferred.
