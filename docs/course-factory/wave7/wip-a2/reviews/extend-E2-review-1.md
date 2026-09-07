# Adversarial review — Wave 7 PR A2, author E2 (B1.1 EXTEND), round 1

Deliverable: `S/extend/typed-b1.1/{konjunktiv-ii-wurde, konjunktiv-ii-ware-hatte, infinitive-with-zu,
um-zu-ohne-zu}.json` + `S/extend/notes-E2.md`.
Read in full: `S/common-header.md`, `S/review-brief.md`, `S/level-b1.1.md`, `S/extend-brief.md`,
`S/extend/live-state-b1.1.md`, the four `S/extend/source/*.json` dumps, `S/b1b2-topics.md`, and the
live `grammar-content-cache.json` (913 examples) for shipped conventions.

## Validator output (pasted verbatim)

```
$ node scripts/check-grammar-json.mjs \
    S/extend/typed-b1.1/konjunktiv-ii-wurde.json \
    S/extend/typed-b1.1/konjunktiv-ii-ware-hatte.json \
    S/extend/typed-b1.1/infinitive-with-zu.json \
    S/extend/typed-b1.1/um-zu-ohne-zu.json \
    --cache grammar-content-cache.json
OK: 4 file(s) validated, no violations.
```

## What I ran and what I tried (so this review is falsifiable)

- **Re-solved all 40 new exercises cold**, writing my own answer before opening `correct_answer`.
  I disagreed with the key on 0 items outright; I found 1 item whose key set is incomplete (#6) and
  4 items that are ambiguous in the German alone and rescued only by the English cue (#8, #14, #16,
  and the two connector slots below).
- **Tried to break `acceptable_answers`**: (a) final punctuation present/absent — covered on every
  typed item; (b) capitalisation at sentence start — covered; (c) `statt`/`anstatt` orthographic
  variant — covered on um-zu ex 11, correctly *not* needed on ex 15 (the bracket pins `anstatt`);
  (d) adverb/object permutations on every `sentence_building` item — `würde gern die Miete` /
  `würde die Miete gern` is covered, `uns sicher bei der Anmeldung` / `uns bei der Anmeldung sicher`
  is **not** (#6); `hätte mehr Geduld mit ihm` / `hätte mit ihm mehr Geduld` and
  `planen später die Reise` variants are pinned by the bracket order, so I let them stand;
  (e) `würde` vs `wäre/hätte/könnte/sollte/müsste` swaps on every Konjunktiv slot — `solltet` for
  `müsstet` (ware-hatte oi 11) and `würden` for `dürften` (oi 12) are both legitimate German,
  pinned only by `question_en`; (f) `um`/`ohne`/`anstatt` swapped into all four um-zu connector
  slots — `ohne` fits oi 9 and `anstatt` fits oi 10 grammatically and semantically, again pinned
  only by `question_en`; (g) `zu` placement with separable verbs (`abzusagen`, `auszufüllen`,
  `abzuholen`, `umzuziehen`, `aufzuräumen`, `weiterzuentwickeln`) — all correct; (h) comma before
  every zu-group — see #11 for the one place where the course's house rule is stricter than §75.
- **Scripted sweeps**: ban-list regex over every German-bearing field (the only hits are the
  sanctioned `damit` forward references and `bis Freitag`, a temporal *preposition*, not the
  topic-9 conjunction); Konjunktiv II der Vergangenheit / Passiv / Konjunktiv I / Plusquamperfekt /
  Partizip-als-Adjektiv patterns — **0 real hits**; 20-word cap per sentence on every `*_de`,
  `question_de`, `correct_answer`, dialogue `de` and table cell — **0 over**; `related_rule_title`
  resolved against live + new rule titles — **all 4×10 resolve**; per-topic `order_index`
  continuation (16..25 / 9..18, rules 6-8, examples 9..12) — **exact**, matches
  `live-state-b1.1.md`; `options: null` on all 40; `correct_answer ∈ acceptable_answers` on all 40;
  `question_de`/`sentence_de`/multi-word `correct_answer` diffed against every live row of the same
  topic — **0 duplicates**; `word_breakdown` key-by-key against `sentence_de` for all 12 new
  examples — **in order, full coverage, 0 gaps**; `grammar_highlight` — every ellipsis half is a
  substring, and the `X ... Y` form is the shipped convention (116 live examples use it), so I did
  **not** raise it.
- **B1.2/B2 overlap** (`S/b1b2-topics.md`): compared the 9 new rules against B2.1 `konjunktiv-ii-past`
  (hätte/wäre + Partizip II — correctly absent everywhere, including the `dürfte`/`sollte` table),
  `konjunktiv-i-reported-speech`, `passive-alternatives` (its `sein + zu + Infinitiv` table is the
  trap for infinitive-with-zu rule oi 6 — the new rule stays on nouns/adjectives and never touches
  `haben/sein … zu`), `double-infinitive`, `nominalization`, `advanced-conjunctions` (je … desto),
  and B1.2 `simple-past-narrative`. **No B1.2/B2 overlap found.**
- **Präteritum ruling**: no exercise key is a past-tense form. `ging` (um-zu oi 16/18 keys) is on the
  productive strong-verb list and is not the target; `verließ` appears only in an *example* sentence
  (oi 11), which the ruling explicitly permits receptively; the author correctly used Perfekt
  (`hat … verlassen`) where `verlassen` had to be a production target (um-zu oi 14). **Clean.**
- **Topics 9–12 leakage**: no `als/bevor/nachdem/während/bis/seit` conjunction, no
  `obwohl/sodass/falls`, no `deshalb/trotzdem/außerdem` inversion, no two-part connector. `damit`
  appears only as the sanctioned forward reference — with the one exception at #13.

## Findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | `typed-b1.1/konjunktiv-ii-ware-hatte.json` → `examples[3]` (oi 12) | BLOCKING | `"An ihrer Stelle sollte sie zuerst mit der Kollegin sprechen."` + `explanation_de: "An ihrer Stelle steht oft vor einem Rat mit sollte."` | `an deiner/seiner/ihrer Stelle` projects **the speaker** into someone else's position, so the clause subject must be a different person (`An ihrer Stelle würde **ich** …`). With `sie` as the subject the sentence says "in her own place she should…", which is incoherent, and the `explanation_de` generalises the broken pattern into a rule. `level-b1.1.md` sanctions exactly one shape: `"an deiner Stelle würde ich …"`. The same file gets it right at `exercises[6]` (`"An seiner Stelle würde ich zuerst mit dem Chef sprechen."`), so the file contradicts itself. | Rewrite as `"An ihrer Stelle würde ich zuerst mit der Kollegin sprechen."` and fix `explanation_de` to `"An ihrer Stelle + würde ich gibt einen Rat."`; update `word_breakdown` and `grammar_highlight` (`würde ich`) to match. |
| 2 | `typed-b1.1/konjunktiv-ii-ware-hatte.json` → `exercises[0].why_correct_de` (oi 9) | BLOCKING | `"hätte ist die ich-Form von habens Konjunktiv II."` | `habens` is not German. It is a word-for-word calque of the English twin (`"haben's Konjunktiv II"`), i.e. an English possessive smuggled into a learner-facing German field — banned by common-header rule 1 (German ABOUT German is learner-facing German) and by rule 3 (correct standard German). | `"hätte ist die ich-Form des Konjunktivs II von haben."` |
| 3 | `typed-b1.1/infinitive-with-zu.json` → `exercises[7].explanation_de` (oi 16) | BLOCKING | `"Modalverben wie können stehen nie mit zu; direkt der reine Infinitiv folgt."` | After the semicolon this is an independent main clause and must be verb-second. As written it is `direkt` (1) + `der reine Infinitiv` (2) + `folgt` (3) — verb-third, i.e. a word-order error in the very field that teaches word order. | `"Modalverben wie können stehen nie mit zu; der reine Infinitiv folgt direkt."` |
| 4 | `typed-b1.1/um-zu-ohne-zu.json` → `rules[2].content.mistakes[0].correct` (oi 8) | BLOCKING | wrong: `"Sie ruft an, um zu fragen die Öffnungszeiten."` → correct: `"Sie ruft an, um die Öffnungszeiten zu fragen."` | The *corrected* model is not idiomatic German: `fragen` does not take a concrete noun phrase as a direct object (only pronouns/indefinites — `Darf ich Sie etwas fragen?`). One says `nach den Öffnungszeiten fragen` or `die Öffnungszeiten erfragen`. A `common_mistakes` rule that prints a non-standard sentence in the "correct" column teaches the error it claims to fix. | `"Sie ruft an, um nach den Öffnungszeiten zu fragen."` (wrong side: `"Sie ruft an, um zu fragen nach den Öffnungszeiten."`), and mirror the object in both `explanation_de`/`_en`. |
| 5 | `typed-b1.1/konjunktiv-ii-ware-hatte.json` → `rules[2]` (oi 8, `common_mistakes`) | BLOCKING | pairs: `"Ich würde sein sehr froh." → "Ich wäre sehr froh."`; `"Ich würde haben mehr Geduld mit ihm." → "Ich hätte mehr Geduld mit ihm."`; `"Wenn ich hätte mehr Geld, würde ich reisen." → "Wenn ich mehr Geld hätte, …"` | All **three** pairs already ship on the same topic: live rule oi 1 carries `"Ich würde sein glücklich." → "Ich wäre glücklich."`, live rule oi 2 carries `"Ich würde haben Zeit." → "Ich hätte Zeit."`, live rule oi 3 carries `"Wenn ich wäre reich, …" → "Wenn ich reich wäre, …"`. The new rule therefore adds **zero** new content and re-teaches three live rules — the extend-brief's binding line is "read every rule so a new rule never re-teaches an existing one". (Note for the orchestrator: the brief's *Suggested coverage* named exactly these three, so the collision originates in the brief; the author should have flagged it. The fix is to swap the pairs, not to drop the rule.) | Replace with three pairs the topic does **not** already carry, e.g. `"Wenn ich du wärst, …" → "Wenn ich du wäre, …"` (person agreement), `"Ich hätte gern einen Termin, wenn Sie hätten Zeit." → "…, wenn Sie Zeit hätten."` is already covered → instead `"Ich würde können helfen." → "Ich könnte helfen."` (modal Konjunktiv II, extends live rule oi 5), and `"Das wäre nett von du." → "Das wäre nett von dir."` (case after `von`). |
| 6 | `typed-b1.1/konjunktiv-ii-wurde.json` → `exercises[5]` (oi 21) | BLOCKING | cue `[ihr / uns / bei der Anmeldung / sicher / helfen / werden]`, key `"Ihr würdet uns sicher bei der Anmeldung helfen."`, `acceptable_answers` = that sentence ± full stop only | `"Ihr würdet uns bei der Anmeldung sicher helfen."` is equally correct German (a sentence adverb may follow the prepositional phrase), and the bracket order **cues exactly that variant** — it lists `bei der Anmeldung` *before* `sicher`, while the key inverts them. So the item marks its own cue order wrong. This is both a missing legitimate answer and a violation of the extend-brief's "bracket order MIRRORS the target's clause order". | Add `"Ihr würdet uns bei der Anmeldung sicher helfen."` (± full stop) to `acceptable_answers`, **or** reorder the bracket to `[ihr / uns / sicher / bei der Anmeldung / helfen / werden]`. Prefer both. |
| 7 | `typed-b1.1/konjunktiv-ii-ware-hatte.json` → `rules[0].memory_trick_de` (oi 6) | MINOR | `"sollte = sollte, müsste = eigentlich müsste, dürfte = vermutlich, könnte = könnte — alle weicher als ein Befehl."` | Two of the four glosses are circular (`sollte = sollte`, `könnte = könnte`). It is a mechanical translation of the English twin (`sollte = should`), where the gloss carried information; in German it carries none. | `"sollte = ein Rat, müsste = eigentlich nötig, dürfte = eine Vermutung, könnte = ein Vorschlag — alle weicher als ein Befehl."` |
| 8 | `typed-b1.1/konjunktiv-ii-ware-hatte.json` → `exercises[3]` (oi 12) | MINOR | `"Die Kollegen ___ das sicher verstehen."` key `dürften` | `dürfte` is a *cautious* assumption and `sicher` asserts certainty; stacking them is odd German. Worse, `würden` fits the slot perfectly and is the more natural reading (`"Die Kollegen würden das sicher verstehen."`); only the English cue `Base form: dürfen (dürfte)` prevents a correct answer being marked wrong. | Drop `sicher` (`"Die Kollegen ___ das verstehen."`) or replace it with `wohl`; alternatively add `würden` to `acceptable_answers` and rewrite the cue. |
| 9 | `typed-b1.1/konjunktiv-ii-ware-hatte.json` → `exercises[7..9]` (oi 16, 17, 18) vs `rules[2]` (oi 8) | MINOR | oi 17 prompt `"Wenn ich hätte mehr Geld, würde ich reisen."` is **byte-identical** to `rules[2].mistakes[2].wrong`, and its key to `.correct`; oi 16 and 18 differ from mistakes 1 and 2 only in one word (`froh`→`müde`, `ihm`→`ihr`) | All three `error_correction` items are the three pairs printed one rule earlier in the same patch, so the learner reads the answer key before attempting the item. (Live precedent exists — shipped `konjunktiv-ii-wurde` ex 11/12 copy its rule oi 3 verbatim — which is why this is MINOR and not BLOCKING, but the patch adds three rule pairs *and* three exercises that between them test one thing.) | Once #5 is fixed, re-point at least two of the three exercises at mistakes not shown in a rule (e.g. `wärest/wärst` choice, `von dir` case, `Wenn ich du wäre` fixed chunk). |
| 10 | `typed-b1.1/infinitive-with-zu.json` → `exercises[7]`, `exercises[9]` (oi 16, 18) vs `rules[2]` (oi 8) | MINOR | oi 16 `"Ich kann zu schwimmen."` → `"Ich kann schwimmen."` and oi 18 `"Ich habe vor Deutsch zu lernen."` → `"Ich habe vor, Deutsch zu lernen."` are **byte-identical** to `rules[2].mistakes[0]` and `[2]` | Same defect as #9 in the second topic: two of three error-correction keys are printed verbatim in the rule immediately above them. | Vary the verbs/objects (e.g. `"Ich muss zu gehen."`, `"Sie hat Zeit dir zu helfen."`) so the rule shows the pattern and the exercise tests it. |
| 11 | `typed-b1.1/infinitive-with-zu.json` → `rules[2].mistakes[2]` (oi 8) and `exercises[9]` (oi 18) | MINOR | `wrong: "Ich habe vor Deutsch zu lernen."` / `explanation_de: "Vor einem erweiterten Infinitivsatz steht ein Komma."` | Under §75 of the amtliche Regelung the comma before an extended zu-infinitive is obligatory only when the group is introduced by `um/ohne/(an)statt/als/außer`, depends on a **noun**, or is announced by a correlate (`es`, `das`). After a plain verb like `vorhaben` it is a *Kann-Komma* — so the "wrong" sentence is not actually wrong, and an `error_correction` item asks the learner to find an error that is not there. (`level-b1.1.md`'s Register section does mandate the comma as house style, and live rule oi 5 "Comma Rules" already teaches it that way, which is why this is MINOR rather than BLOCKING — but the flat claim is factually loose.) | Move the item to a case where the comma is obligatory (`"Ich habe keine Zeit Deutsch zu lernen."` — noun-dependent; or `"Er ging ohne zu zahlen."`), or soften `explanation_de` to `"In diesem Kurs schreiben wir das Komma vor dem erweiterten Infinitivsatz immer."` |
| 12 | `typed-b1.1/um-zu-ohne-zu.json` → `rules[2].memory_trick_de` (oi 8) | MINOR | `"Verschiedene Subjekte brauchen damit, nicht um ... zu. ohne braucht zu vor dem Infinitiv. Ein Komma öffnet den erweiterten Satz."` | The memory trick advertises three mistakes but the rule's `mistakes` array covers only two of them — no pair in the rule is about different subjects. This is the visible residue of the author's substitution (see the doubt answered below): the trick was written for the brief's intended third pair, the pair was swapped for a word-order pair, and the trick was not updated. | Either restore a different-subject pair (see the doubt answer) or replace the first sentence with `"Das Objekt steht vor zu + Infinitiv."` to match the pair that is actually there. |
| 13 | `typed-b1.1/um-zu-ohne-zu.json` → `rule_patches[0].new.example_de` | MINOR | `"Ich lerne, um zu verstehen. (…) vs. Ich erkläre es, damit du verstehst. (…)"` | The patch rewrites the whole `content` object, so the author *chose* to keep a fully worked `damit`-clause with a conjugated verb inside a topic-8 rule. `notes-E2.md` states the file confines `damit` to "the bare label + 'das lernst du später im Kurs' … (never a modeled damit clause)" — that claim is not true of the artefact the patch ships. It is pre-existing live text and `damit` in a rule body is receptive, so it is not a ban breach; but the notes and the file disagree. | Either drop the `damit` half of `example_de`/`example_en` (`"Ich lerne, um zu verstehen. (ich / ich = gleiches Subjekt)"`) or correct `notes-E2.md`. Also note the same forward reference now appears five times in this one file (rule oi 6 description + row 3 + memory trick, rule oi 8 memory trick, the patch) — trim to two. |
| 14 | `typed-b1.1/um-zu-ohne-zu.json` → `exercises[0..1]` (oi 9, 10) | MINOR | oi 9 `"Sie lernt jeden Abend, ___ die Prüfung zu bestehen."`; oi 10 `"Sie hat die Wohnung verlassen, ___ das Licht auszuschalten."` | Both connector slots take a second connector in the German alone: `ohne` gives a perfectly sensible oi 9 ("studies every evening without passing the exam"), and `anstatt` gives a perfectly sensible oi 10 ("left instead of turning off the light"). Only the English cue rules them out. The review brief flags "a connector item where two connectors both fit"; these survive solely on `question_en`, which is thinner protection than the other 38 items get. | Make the German self-disambiguating: oi 9 → `"Sie lernt jeden Abend, ___ die Prüfung im Juni zu bestehen."` still admits `ohne`; better `"Sie spart jeden Monat Geld, ___ ein Auto zu kaufen."` (purpose only). oi 10 → add a light that must stay on/off in context, or accept `anstatt` in `acceptable_answers`. |
| 15 | `typed-b1.1/um-zu-ohne-zu.json` → `examples[1].explanation_de` (oi 10); also `exercises[1..2].explanation_de`/`why_correct_de` | MINOR | `"anstatt ... zu = anstatt zu tun."` and `"ohne ... zu = ohne etwas zu tun."` / `"ohne ... zu = ohne zu tun."` | The German explanations restate the form instead of explaining it, while the English twins do explain it (`"instead of doing"`, `"without + -ing"`). Three learner-facing German fields carry no information. | e.g. `"anstatt ... zu nennt die Handlung, die nicht passiert."` / `"ohne ... zu sagt, was jemand nicht macht."` |
| 16 | `typed-b1.1/konjunktiv-ii-wurde.json` → `exercises[8]` (oi 23) | MINOR | `"Wir würden das Auto meines Bruders kaufen werden."` → `"Wir würden das Auto meines Bruders kaufen."` | Two single-word deletions produce correct German: dropping `werden` (the key) or dropping `würden` → `"Wir werden das Auto meines Bruders kaufen."` (Futur I, allowed at A2). The German-only prompt is ambiguous; only the English parenthesis `(only one würde per clause)` pins the key. | Use a doubling that has one repair, e.g. `"Wir würden das Auto meines Bruders kaufen würden."`, matching the live rule's own `"Ich würde gern kommen würde."` pattern. |
| 17 | `typed-b1.1/konjunktiv-ii-wurde.json` → `exercises[4]` (oi 20) | MINOR | `"Ich würde gern die Miete senken."` | Register/plausibility: a B1 learner is overwhelmingly a tenant, and a tenant cannot lower the rent — the sentence only works in a landlord's mouth, which the surrounding items (oi 18 `des Vermieters`) do not set up. | `"Ich würde gern die Wohnung kündigen."` or `"Ich würde gern eine billigere Wohnung finden."` |
| 18 | `typed-b1.1/konjunktiv-ii-ware-hatte.json` → `exercises[6].related_rule_title` (oi 15) | MINOR | key `"An seiner Stelle würde ich zuerst mit dem Chef sprechen."`, pointed at `"Common Expressions"` | Live rule oi 4 "Common Expressions" contains `Das wäre schön! / Das wäre alles. / Ich hätte gern… / Wenn ich du wäre…` — it never shows `an … Stelle`, so the cross-reference sends the learner to a rule that does not cover the item. | Point at `"sollte, müsste, dürfte, könnte: Giving Advice Politely"` (the new advice rule) or add an `An deiner Stelle …` row to whichever rule you cite. |
| 19 | `typed-b1.1/um-zu-ohne-zu.json` → `exercises[4..6]` (oi 13, 14, 15) | MINOR | brackets `[… / fit / sein / zu]`, `[… / sich / bedanken / zu]`, `[… / anstatt / einkaufen / zu / gehen]` | The `zu` token sits **after** the infinitive in two brackets and **before** it in the third, inside one file. The extend-brief asks the bracket order to mirror the target; a learner reading the brackets literally would produce `fit sein zu`. | Pick one convention (`zu` immediately before its infinitive, as in oi 15) and apply it to all bracket cues in the file. |
| 20 | `typed-b1.1/*.json` (variety, all four files) | MINOR | `"Anstatt zu arbeiten"` ×3 in the new um-zu material (rule oi 6 row 1, dialogue line 6, exercise oi 17) on top of live exercise 3; `"Er/Sie ging, ohne …"` ×5 (rule oi 8 mistakes 2–3, exercises oi 16, 18, example oi 11's twin); `"Ich habe vor …"` ×5 in infinitive-with-zu (example oi 9, dialogue line 2, exercises oi 9, 13, 18 + rule oi 8); `"mehr Geduld mit ihm/ihr"` ×4 in ware-hatte (rule oi 8, exercises oi 9, 13, 18) | No live row is duplicated (I diffed all of them), but the *new* material recycles four frames so heavily that ten exercises give roughly six distinct sentences of practice. `level-b1.1.md`'s Register section names a wide situational range (Arbeit, Wohnen, Ämter, Gesundheit, Medien, Umwelt) that these files barely touch. | Re-lexicalise: replace one `Anstatt zu arbeiten`, two `Er ging, ohne`, three `Ich habe vor` and two `mehr Geduld` frames with Amt/Arzt/Krankenkasse/Internet scenarios already sanctioned by the level file. |
| 21 | `typed-b1.1/um-zu-ohne-zu.json` → `rules[2]` (oi 8), coverage | MINOR | the three pairs are: object-before-`zu`, missing `zu` after `ohne`, missing comma | The topic's single most common real B1 error — `um … zu` with a different subject — is now tested and shown **nowhere** in the topic (rule oi 6 states the rule but no mistake pair and no exercise exercises it). See the doubt answered below: the author's rationale for the swap is contradicted by their own rule oi 6 row 3. | Restore a different-subject pair whose `correct` side is the forward reference rather than a modelled `damit` clause — see the answer below for the exact wording. |

## The two open doubts from `notes-E2.md`, answered

**(1) The `um-zu-ohne-zu` `common_mistakes` swap — the substitution was not necessary, and it cost
coverage.** The author dropped the brief's third suggested mistake (`um … zu` with a different
subject) on the ground that a worked `"damit du … verstehst"` correction "reads as a taught form"
and would breach the topics-1–8 ban. That reasoning does not hold, for three reasons. (a) The brief
did not ask for a worked `damit` clause — it prescribed the *fix text* verbatim: "say 'das lernst
du im Thema damit'". A `common_mistakes` entry can carry that as its `correct`/`explanation_de`
without ever conjugating a verb after `damit`. (b) The author's **own rule oi 6, row 3** already does
precisely this (`"kein zu-Satz möglich — das lernst du später im Kurs (damit)"`), so the pattern the
rationale calls impossible is shipped in the same file, three rules earlier. (c) The `damit` label
is sanctioned by `level-b1.1.md` itself (topic 8's own line: "um … zu (purpose, only with the same
subject; 'damit' is topic 10)"), so naming it is inside the level, and only a *conjugated damit
clause as a production target* would be outside it. Concretely, this is safe and restores the
coverage:

```
wrong:   "Ich erkläre es noch einmal, um du es besser verstehst."
correct: "Hier geht um ... zu nicht — die Subjekte sind verschieden."
explanation_de: "um ... zu geht nur bei gleichem Subjekt. Für zwei Subjekte lernst du damit später im Kurs."
```

The mechanical word-order pair the author put in its place (#4 above) is not wasted — it should
simply replace one of the two comma/`zu` pairs, which overlap each other, rather than the
different-subject pair. Fixing this also clears finding #12, since the rule's `memory_trick_de`
already promises the different-subject content.

**(2) The `damit` forward reference — the rule is fine, the execution leaks once.** Naming `damit`
plus "das lernst du später im Kurs" is explicitly permitted (extend-brief; `level-b1.1.md` topic 8).
The bare label is used correctly in rule oi 6 (description, row 3, memory trick), in rule oi 8's
memory trick, and in the patched `text_de`. The leak is `rule_patches[0].new.example_de` (#13): the
author rewrote the whole `content` object and carried a fully conjugated `"Ich erkläre es, damit du
verstehst."` into the `new` state, so `notes-E2.md`'s claim of "never a modeled damit clause" is not
true of the shipped artefact. That is receptive rule text, not an exercise target, so it is not a
ban breach — but it must be either removed or acknowledged, because the note is what a later session
will trust. Separately, five `damit` mentions in one topic-8 file over-signposts a topic two lessons
away; two are enough.

## Other checks that came back clean (stated so a later round need not repeat them)

`rule_patches[0].old` is **byte-exact** against `source/um-zu-ohne-zu.json` rule
`adba8282-abd7-4646-9c62-dcd80fd440f7` (deep-equal on all four keys, verified programmatically);
the `new` state drops `ohne dass` and `anstatt dass` as the brief required, fixes the
capitalisation slip (`Beide Sätze das Gleiche Subjekt` → `beide Sätze das gleiche Subjekt`), and
stays inside the level and the 20-word cap. Exactly one `rule_patch` was made and it is the one the
brief named. Every depth patch has exactly 3 rules at oi 6/7/8, exactly one `common_mistakes` with
3 pairs, exactly one 6-line dialogue between two named adults in a telc-B1 situation
(Weiterbildung / Bewerbungsgespräch / Umzug), and 4 examples at oi 9–12. `konjunktiv-ii-wurde`
correctly received **no** depth patch. Stage split is 4/6 on every topic with no `multiple_choice`
anywhere. Names are German-keyboard typeable (Nowak, Keller, Berger, Ahmadi, Julia, Mark). No
English appears in any German field except finding #2. Separable-verb `zu` infixing is correct in
all nine occurrences, and the `weiter zu verbessern` / `weiterzuentwickeln` pair in the
infinitive-with-zu dialogue is correct on both counts (only the second is a separable verb).

VERDICT: FAIL (6 blocking, 15 minor)

Judgement: the mechanical layer is the strongest I have seen this wave — order_index continuation,
word_breakdown coverage, the 20-word cap, the Präteritum ruling, the topic-9–12 border and the
rule_patch byte-exactness are all clean, and the validator passes. The failures are all in the
German itself and in one answer-key set: a broken `an ihrer Stelle` idiom that an explanation then
generalises into a rule (#1), an English possessive calqued into a German field (#2), a verb-third
main clause inside a word-order explanation (#3), a non-idiomatic sentence in a mistakes table's
*correct* column (#4), plus one incomplete `acceptable_answers` whose own bracket cue points at the
missing variant (#6). #5 is the one finding I would escalate rather than simply return: the brief's
suggested coverage for `konjunktiv-ii-ware-hatte` collides head-on with three live rules, and the
author executed it without flagging the collision. Round 2 should be short — five sentence-level
rewrites, one `acceptable_answers` addition, one rule's three pairs re-chosen.
