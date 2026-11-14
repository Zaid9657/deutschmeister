# Build report 7 — 2026-11-14

BUILD-BRIEF-7 completed in A → B → C order, with the existing-test exceptions below.
Read CLAUDE.md, TEAM v5, PROTOCOL v5, steward guidance and all eleven draft notes before design.
No commit, dependency installation, SQL, deployment or production write. Existing test files and
assertions are unchanged. CLAUDE.md, both dependency symlinks and astro-site/package-lock.json
are untouched. All twelve lessons compare equal to HEAD outside `proof`; A1.2 is unchanged.

## Part A — judge

The common `check.js` still decides every answer. No shared checker tolerance was widened.
The proof builder resolves these declarative rules before judging:

- Cumulative courtesies derive from Wortfeld entries up to this lesson, classified by the
  existing English gloss. Exact courtesy sentences can precede/follow content, including an
  inline courtesy. Required parts are tried first, so a courtesy cannot replace a required goal.
- `firstContact: true` permits a taught greeting at the front, including a comma introduction.
  Return questions derive from taught return-question input and the taught address pronouns;
  guided read text and earlier input count, as well as Wortfeld examples.
- Addresses are exact dialogue speaker names at either comma-delimited edge. The adaptable
  own-name learner role is excluded; titled speakers remain eligible. Listed Tim/Lena address
  variants were removed from the drafts; the adapter handles them.
- `order: "any"` backtracks over remaining parts. Ordered dialogue gaps remain ordered.
  Every required part must be consumed once. Ambiguous final noun fragments cannot turn the
  object of an activity sentence into another independent fact.
- `maxSentences: 2` declares complete multi-sentence alternatives for one part. A single half
  or duplicate half does not fulfil that part. `ellipsisOpening` supports a shared subject or
  subject + copula only after that opening appeared in the preceding checked clause.
  `sharedTail` handles a final shared gern; `distinctActions` prevents repeating one activity
  to satisfy a request for two things.
- Optional `context` forms, and `allowModelContext` sentences resolved from the re-teach pointer,
  allow documented complete-model answers without losing the required parts. A context sentence
  never satisfies an unshown goal. Context words go through RULE 35 too.
- `Ich heisse …` uses the introduction adapter after ss normalization, then the common checker.
  Empty/non-name responses such as `Ich heiße nicht` fail. ae/oe/ue and ss retain the course's
  equivalence; short missing-umlaut words (`Tur`, `grun`) still fail exactly as in `check.js`.
  Written full hours `9.00 Uhr` / `6:00 Uhr` normalize to the equivalent hour before checking;
  the period inside the time no longer splits a sentence.
- Hints name the missed part. Formal/informal advice appears only on a detected register miss;
  an ordinary wrong formal question does not receive "Say it formally."
- The microphone control is off for production proofs, including all new L2–12 tasks. New tasks
  also reject model-only microphone reducer events with `micOff: true`. They use typing/selection.
  **Existing-test exception:** L1's heard-spelling/own-spelling microphone task and legacy
  model-score reducer compatibility remain as asserted in lesson-proof.test.mjs. The production
  microphone control no longer exposes that legacy model-only route. No claim of new spoken
  open-answer equivalence is made.
- Notice re-teach bodies display without literal ** markers; referenceKinds receives the lesson
  and offers the clock board only after a clock set was delivered. A merchandise Uhr in L4
  does not open a future clock board.

Part A checkpoint: existing proof-parts, lesson-proof, proof-content plus proof-judge7 suites
passed; lint passed. A broader run caught the reference component import-stub mismatch; the
lookup was moved behind the existing taughtSet import, preserving every assertion. Its regression
then passed. The final full gate below includes all these suites.

| Rule | Right answer / behavior that passes | Wrong answer / behavior that fails |
| --- | --- | --- |
| Cumulative courtesy | L4: Entschuldigung! Was ist das? Was kostet sie? Danke. | Same answer missing the price question |
| First contact | Guten Tag! followed by a complete answer when declared | Greeting alone; a greeting where no first contact is declared |
| Polite return | L7: Ich lese gern. Und du? | Und du? alone |
| Addresses | Tim, wo ist das Wörterbuch? / Wo ist das Wörterbuch, Tim? | Tom, wo ist das Wörterbuch? |
| Part order | Reversed origin/job facts with order:any | Reversed alternating dialogue gaps; a duplicated fact with another missing |
| Sentence groups | Ich spreche Arabisch. Ich spreche Deutsch. | Only one language; Deutsch repeated twice |
| Frames | Der Stift ist rot. / Der Stift ist blau. from the same colour frame | Das Stift ist rot.; an untaught slot value |
| Name / spelling | Ich heisse Sam Miller.; fuenf / fünf | Ich heiße; Ich heiße nicht; short grun / Tur |
| Clock punctuation | Der Termin ist am Freitag um 9.00 Uhr. | Wrong day, wrong hour, or swapped am/um |
| Register hint | Was bist du von Beruf? gets formal advice on a formal task | Wie ist Ihr Beruf? remains wrong, without false informal advice |
| Spoken path | New tasks use checked typing/selection | pct:1 model-only microphone event cannot pass a new task |
| Context | Complete re-teach plus every required part | Courtesy/context alone or a missing required part |

### Frame and slot shape

```js
{
  sets: { colours: ['rot', 'blau'] },
  parts: [{
    label: { de: 'die Farbe', en: 'the colour' },
    frames: [{ pattern: 'Der Stift ist {colour}.', slots: { colour: 'colours' } }]
  }]
}
```

`expandProofPart` expands finite named sets; proofTasks (used by buildGuided) supplies ordinary
forms to the same checker. Short forms can coexist with frames. Writers' long L5/L7 lists were
factored into named taught-value/phrase sets and frames; they are not regex acceptance rules.
The validator expands the same frames, checks every resulting German form against the cumulative
Wortfeld, validates slot existence and limits sentence groups. Mutation tests reject an untaught
slot value, a missing set, a missing slot reference and an invalid sentence limit.

| Lesson | Original listed forms | Stored short forms | Frames | Expanded checked forms |
| --- | ---: | ---: | ---: | ---: |
| L5 | 441 | 10 | 55 | 440 |
| L7 | 592 | 26 | 102 | 586 |

The L5/L7 expanded counts differ from the writers' initial counts because address variants moved
into the adapter and the complete two-sentence L7 free-time model became an alternative.

## Part B — what tasks can ask

`instructionVocabulary` derives once from existing pretest, scene/read, writing/speaking and
set-check prompts. It applies only to proof prompts, never to accepted production, slot values,
audio stimuli or choices. The Sie requirement remains. An instruction can therefore be understood
in German-only view; a fictional content word is still rejected. Number words derive from delivered
members and the delivered unit-before-ten set rule. The 21–99 allowance does not exist in L2.
The prior RULE 36 prerequisite checks remain in force over built expanded tasks.

A task can declare `type: "listening"`, `mode: "choice"`, `"write"` or `"parts"`, and finite
`instances` containing audioText plus checked answer/options or labelled production parts.
A successful checked playback is required on every submitted attempt. No playback leaves both
tries and evidence unchanged. No text fallback is offered. Existing PlayButton handles absence
of a German voice; the proof explicitly says retry or use another device. Choice distractors
receive no typo credit. Typed answers retain the common checker's normal behavior.

`proofTaskFor` derives the instance and option rotation from the saved try count. The first two
misses lead through hint → re-teach; after hiding the model, another instance is selected and
choices are reordered. Only counts and heard-listening evidence survive reload; stimulus, typed
answer, transcript and audio do not enter the run. Historical passes without heard evidence do
not complete listening tasks. Self-confirmation and microphone scores cannot complete them.

| Listening conversion | Instance 1 | Instance after re-teach | Delivery |
| --- | --- | --- | --- |
| L2 goal 2 | Hear Weber's wrong number; reject it and give the complete form number in words | Weber reads the right number; reaction must change to Ja | Converted, validated draft only: L2 merge blocked by existing assertion |
| L4 goal 2 | Table €40 / shelf €16 | Table €35 / shelf €23 | Merged; price contrasts use taught compounds |
| L6 goal 2 | Office 042 3381 / mobile 0176 234567 | Office 042 3318 / mobile 0167 234567 | Merged; both numbers must be identified |
| L10 goal 2 | Delayed / platform five | On time / platform four | Merged; understood facts, not copied stimulus |

Part B checkpoint: five proof suites and lint passed; listening state, old-evidence, changed-instance,
option rotation and instruction-only vocabulary tests passed. The additional rendered listening
test verifies disabled submission before playback and no visible stimulus or text-fallback control.

## Part C — course integration and answer tables

All eleven converted drafts pass check-guided-draft.mjs. **L3–12 are merged** into a11.js and
synced with sync-shared.mjs. **L2 remains without a live proof:** the unchanged
`tests/course-path-lock.test.mjs` assertion at line 88 explicitly requires "L2 has no proof and
completes as before". Merging L2 made that assertion fail; preserving it restored green. Its
complete converted draft and answer tests remain ready for a later authorized test update.

698 concrete cases were run through try-proof-answer.mjs in 45 task calls, then independently
through judgeProof and answerProof in proof-rollout7.test.mjs. The table below contains the writers'
complete quoted submissions (ellipsis fragments, quoted labels/hints and prose placeholders are
not executable answers), explicit engine-limit examples, and cumulative-courtesy/missing-part
regressions for each production task. CORRECT and TYPO both mean the goal is shown.

Former WRONG examples that become CORRECT/TYPO are the documented adapter limitations or
superseded requirements: earlier courtesies, exact names, independent order, sentence groups,
source-model context, or the artificial required thanks in L6. Grammar, wrong-value, missing-part
and wrong-register answers still fail. The formerly accepted repeated hobby is now refused when
a task asks for two different activities. Untaught beruflich, zwo, Jahre, Liest (the untaught
irregular form), and a new month name are not licensed by adding accepted forms.

| Lesson | Live status | Cases | Pass (including TYPO) | Refused |
| --- | --- | ---: | ---: | ---: |
| L2 | draft only — existing test | 91 | 53 | 38 |
| L3 | merged | 54 | 32 | 22 |
| L4 | merged | 52 | 28 | 24 |
| L5 | merged | 64 | 34 | 30 |
| L6 | merged | 44 | 25 | 19 |
| L7 | merged | 68 | 35 | 33 |
| L8 | merged | 53 | 26 | 27 |
| L9 | merged | 55 | 28 | 27 |
| L10 | merged | 50 | 23 | 27 |
| L11 | merged | 76 | 33 | 43 |
| L12 | merged | 91 | 46 | 45 |

### Lektion 2 — converted draft; merge excluded by existing test

| Goal (zero-based) | Task | Model | Parts / order | Listening instances |
| ---: | --- | --- | --- | ---: |
| 0 | production | Ich komme aus Marokko. Ich bin Studentin. | 2 / any | 0 |
| 1 | production | Was sind Sie von Beruf? | 1 / ordered | 0 |
| 2 | listening | Nein. Vier neun zwei drei fünf acht. | 2 / ordered | 2 |
| 3 | production | Meine Telefonnummer ist null eins sieben sechs. Ich wohne in Bremen. | 2 / any | 0 |
| 4 | production | Ich komme aus Marokko. Ich bin ledig. | 2 / any | 0 |

| Goal | Answer | Writer / case origin | Actual checker result |
| ---: | --- | --- | --- |
| 0 | Ich komme aus Marokko. Ich bin Studentin. | pass | correct |
| 0 | Ich komme aus Marokko und bin Studentin. | pass | correct |
| 0 | Ich komme aus Marokko und ich bin Studentin | pass | correct |
| 0 | Ich bin aus Marokko. Ich bin Studentin von Beruf. | pass | correct |
| 0 | Aus Marokko. Ich bin Studentin. | pass | correct |
| 0 | Ich komme aus Marokko. Von Beruf bin ich Studentin. | pass | correct |
| 0 | Ich komme aus Marokko und wohne in Bremen. Ich bin Studentin. | pass | correct |
| 0 | Ich komme aus Marokko und bin Marokkanerin. Ich bin Studentin. | pass | correct |
| 0 | ich komme aus marokko ich bin studentin | pass | typo |
| 0 | Marokko. Studentin. | wrong | wrong |
| 0 | Aus Marokko. Studentin. | wrong | wrong |
| 0 | Ich komme aus Marokko. | wrong | wrong |
| 0 | Ich komme aus Marokko und Studentin. | wrong | wrong |
| 0 | Ich bin Studentin. Ich komme aus Marokko. | wrong | correct |
| 0 | Ich heiße Ana. Ich komme aus Marokko. Ich bin Studentin. | wrong | correct |
| 1 | Was sind Sie von Beruf? | pass | correct |
| 1 | Und was sind Sie von Beruf? | pass | correct |
| 1 | Entschuldigung, was sind Sie von Beruf? | pass | correct |
| 1 | Was ist Ihr Beruf? | pass | correct |
| 1 | was sind sie von beruf | pass | typo |
| 1 | Was bist du von Beruf? | wrong | wrong |
| 1 | Was ist dein Beruf? | wrong | wrong |
| 1 | Was ist Sie von Beruf? | wrong | wrong |
| 1 | Wie ist Ihr Beruf? | wrong | wrong |
| 1 | Was sind Sie Beruf? | wrong | wrong |
| 1 | Sind Sie Lehrerin? | wrong | wrong |
| 1 | Was sind Sie? | wrong | wrong |
| 1 | Wo wohnen Sie? | wrong | wrong |
| 1 | Und Sie? Was sind Sie von Beruf? | wrong | correct |
| 2 | Nein. Vier neun zwei drei fünf acht. | pass | correct |
| 2 | Nein, vier neun zwei drei fuenf acht | pass | correct |
| 2 | Nein! Vier, neun, zwei, drei, fünf, acht. | pass | correct |
| 2 | Nein. Vier-neun-zwei-drei-fünf-acht. | pass | correct |
| 2 | nein vier neun zwei drei fünf acht | pass | typo |
| 2 | Nein, meine Telefonnummer ist vier neun zwei drei fünf acht. | pass | typo |
| 2 | Nein, vier neun zwei drei fünf acht, Herr Weber. | pass | typo |
| 2 | Ja. Vier neun zwei drei fünf acht. | wrong | wrong |
| 2 | Nein. | wrong | wrong |
| 2 | Vier neun zwei drei fünf acht. | wrong | wrong |
| 2 | Nein. Vier neun zwei drei acht fünf. | wrong | wrong |
| 2 | Nein, 4 9 2 3 5 8. | wrong | wrong |
| 2 | Nein, 492358 | wrong | wrong |
| 2 | Nein, fünf acht. | wrong | wrong |
| 2 | Nein. Hier neun zwei drei fünf acht. | wrong | wrong |
| 2 | Nein. Vier neun zwo drei fünf acht. | wrong | wrong |
| 2 | Nein. Vier neun zwei drei fünf acht. Danke. | wrong | correct |
| 3 | Meine Telefonnummer ist null eins sieben sechs. Ich wohne in Bremen. | pass | correct |
| 3 | Null eins sieben sechs. In Bremen. | pass | correct |
| 3 | Meine Telefonnummer ist 0176. Ich wohne in Bremen. | pass | correct |
| 3 | Meine Telefonnummer ist 0 1 7 6. In Bremen. | pass | correct |
| 3 | Meine Telefonnummer ist null eins sieben sechs und ich wohne in Bremen. | pass | correct |
| 3 | Die Telefonnummer ist null eins sieben sechs. Mein Wohnort ist Bremen. | pass | correct |
| 3 | Null eins sieben sechs. Ich wohne in Bremen, Herr Weber. | pass | correct |
| 3 | 0176. Bremen. | wrong | wrong |
| 3 | Null eins sieben sechs. Bremen. | wrong | wrong |
| 3 | 0176. In Bremen. | wrong | wrong |
| 3 | Ich wohne aus Bremen. | wrong | wrong |
| 3 | Ich wohnen in Bremen. | wrong | wrong |
| 3 | Ich wohne in Berlin. | wrong | wrong |
| 3 | Ich komme aus Bremen. | wrong | wrong |
| 4 | Ich komme aus Marokko. Ich bin ledig. | pass | correct |
| 4 | Ich bin aus Marokko. Ich bin nicht verheiratet. | pass | correct |
| 4 | Ich komme aus Marokko und bin ledig. | pass | correct |
| 4 | Ich komme aus Marokko und ich bin ledig | pass | correct |
| 4 | Ich bin Marokkanerin. Ich bin ledig. | pass | correct |
| 4 | Ich komme aus Marokko und bin Marokkanerin. Ich bin ledig. | pass | correct |
| 4 | Ich komme aus Marokko und wohne in Bremen. Ich bin ledig. | pass | correct |
| 4 | Ich komme aus Marokko. Mein Familienstand ist ledig. | pass | correct |
| 4 | Marokko; ledig | wrong | wrong |
| 4 | Aus Marokko. Ledig. | wrong | wrong |
| 4 | Ich bin marokkanisch. Ich bin ledig. | wrong | wrong |
| 4 | Ich komme aus Marokko. | wrong | wrong |
| 4 | Ich komme aus Marokko und ledig. | wrong | wrong |
| 0 | Mein Nachname ist Chakiri. Ich komme aus Marokko. Ich bin Studentin. | engine limit / explicit review | correct |
| 3 | Ich wohne in Bremen. Meine Telefonnummer ist null eins sieben sechs. | engine limit / explicit review | correct |
| 4 | Ich bin ledig. Ich komme aus Marokko. | engine limit / explicit review | correct |
| 4 | Ich bin Marokkanerin und ledig. | engine limit / explicit review | correct |
| 4 | Guten Tag, ich heiße Ana Chakiri. Ich komme aus Marokko. Ich bin ledig. Danke! Ana Chakiri | engine limit / explicit review | correct |
| 1 | Was machen Sie beruflich? | engine limit / explicit review | wrong |
| 0 | Danke. Ich komme aus Marokko. Ich bin Studentin. | cumulative courtesy / missing-part regression | correct |
| 0 | Ich komme aus Marokko. Ich bin Studentin. Bitte. | cumulative courtesy / missing-part regression | correct |
| 0 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 1 | Danke. Was sind Sie von Beruf? | cumulative courtesy / missing-part regression | correct |
| 1 | Was sind Sie von Beruf? Bitte. | cumulative courtesy / missing-part regression | correct |
| 1 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 3 | Danke. Meine Telefonnummer ist null eins sieben sechs. Ich wohne in Bremen. | cumulative courtesy / missing-part regression | correct |
| 3 | Meine Telefonnummer ist null eins sieben sechs. Ich wohne in Bremen. Bitte. | cumulative courtesy / missing-part regression | correct |
| 3 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 4 | Danke. Ich komme aus Marokko. Ich bin ledig. | cumulative courtesy / missing-part regression | correct |
| 4 | Ich komme aus Marokko. Ich bin ledig. Bitte. | cumulative courtesy / missing-part regression | correct |
| 4 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |

### Lektion 3 — merged proof

| Goal (zero-based) | Task | Model | Parts / order | Listening instances |
| ---: | --- | --- | --- | ---: |
| 0 | production | Das ist mein Bruder. Er ist zwanzig. | 2 / ordered | 0 |
| 1 | production | Ich spreche Arabisch und Deutsch. | 1 / ordered | 0 |
| 2 | production | Wie alt ist er? Welche Sprachen sprechen sie? | 2 / ordered | 0 |
| 3 | production | Meine Familie kommt aus Marokko. | 1 / ordered | 0 |

| Goal | Answer | Writer / case origin | Actual checker result |
| ---: | --- | --- | --- |
| 0 | Das ist mein Bruder. Er ist zwanzig. | pass | correct |
| 0 | Mein Bruder. Zwanzig. | pass | correct |
| 0 | Das ist mein Bruder. Er ist 20. | pass | correct |
| 0 | Er ist mein Bruder. Mein Bruder ist zwanzig. | pass | correct |
| 0 | Das ist der Bruder. Er ist zwanzig. | pass | correct |
| 0 | das ist mein bruder er ist zwanzig | pass | typo |
| 0 | Das ist mein Bruder, er ist zwanzig. | pass | typo |
| 0 | Mein Bruder zwanzig | pass | typo |
| 0 | Bruder. 20. | wrong | wrong |
| 0 | Mein Bruder. 20. | wrong | wrong |
| 0 | Bruder. Zwanzig. | wrong | wrong |
| 0 | Das ist mein Bruder. | wrong | wrong |
| 0 | Mein Bruder ist zwanzig. | wrong | wrong |
| 1 | Ich spreche Arabisch und Deutsch. | pass | correct |
| 1 | Ich spreche Deutsch und Arabisch. | pass | correct |
| 1 | Ich spreche Arabisch und auch Deutsch. | pass | correct |
| 1 | ich spreche arabisch und deutsch | pass | typo |
| 1 | Arabisch und Deutsch. | wrong | wrong |
| 1 | Arabisch, Deutsch | wrong | wrong |
| 1 | Ich spreche Arabisch und Englisch. | wrong | wrong |
| 1 | Ich spreche Arabisch. | wrong | wrong |
| 1 | Ich bin Arabisch und Deutsch. | wrong | wrong |
| 1 | Ich spreche Arabisch. Ich spreche Deutsch. | wrong | correct |
| 1 | Ich spreche Deutsch und Deutsch | wrong | wrong |
| 2 | Wie alt ist er? Welche Sprachen sprechen sie? | pass | correct |
| 2 | Wie alt ist dein Bruder? Welche Sprachen sprechen deine Eltern? | pass | correct |
| 2 | Wie alt ist Ihr Bruder? Welche Sprachen sprechen Ihre Eltern? | pass | correct |
| 2 | Wie alt ist er? Was sprechen sie? | pass | correct |
| 3 | Meine Familie kommt aus Marokko. | pass | correct |
| 3 | Sie kommt aus Marokko. | pass | correct |
| 3 | Aus Marokko. | pass | correct |
| 3 | Wir kommen aus Marokko. | pass | correct |
| 3 | Meine Familie ist aus Marokko. | pass | correct |
| 3 | Meine Eltern kommen aus Marokko. | pass | correct |
| 3 | Sie kommen aus Marokko. | pass | correct |
| 3 | Marokko. | wrong | wrong |
| 3 | Meine Familie kommen aus Marokko. | wrong | wrong |
| 3 | Ich komme aus Marokko. | wrong | wrong |
| 3 | Er kommt aus Marokko. | wrong | wrong |
| 3 | Meine Familie wohnt in Marokko. | wrong | wrong |
| 3 | In Marokko. | wrong | wrong |
| 0 | Das ist mein Bruder. Er ist zwanzig Jahre alt. | engine limit / explicit review | wrong |
| 0 | Danke. Das ist mein Bruder. Er ist zwanzig. | cumulative courtesy / missing-part regression | correct |
| 0 | Das ist mein Bruder. Er ist zwanzig. Bitte. | cumulative courtesy / missing-part regression | correct |
| 0 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 1 | Danke. Ich spreche Arabisch und Deutsch. | cumulative courtesy / missing-part regression | correct |
| 1 | Ich spreche Arabisch und Deutsch. Bitte. | cumulative courtesy / missing-part regression | correct |
| 1 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 2 | Danke. Wie alt ist er? Welche Sprachen sprechen sie? | cumulative courtesy / missing-part regression | correct |
| 2 | Wie alt ist er? Welche Sprachen sprechen sie? Bitte. | cumulative courtesy / missing-part regression | correct |
| 2 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 3 | Danke. Meine Familie kommt aus Marokko. | cumulative courtesy / missing-part regression | correct |
| 3 | Meine Familie kommt aus Marokko. Bitte. | cumulative courtesy / missing-part regression | correct |
| 3 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |

### Lektion 4 — merged proof

| Goal (zero-based) | Task | Model | Parts / order | Listening instances |
| ---: | --- | --- | --- | ---: |
| 0 | production | Was ist das? Was kostet sie? | 2 / ordered | 0 |
| 1 | production | Was kostet er? | 1 / ordered | 0 |
| 2 | listening | Tisch 40 Euro, Regal 16 Euro | checked choice | 2 |
| 3 | production | Ich kaufe den Stuhl und die Tasche. | 1 / ordered | 0 |

| Goal | Answer | Writer / case origin | Actual checker result |
| ---: | --- | --- | --- |
| 0 | Was ist das? Was kostet sie? | pass | correct |
| 0 | Entschuldigung, was ist das? Was kostet die Lampe? | pass | correct |
| 0 | Was ist das? Und was kostet sie? | pass | correct |
| 0 | Was ist das, Frau Wolf? Was kostet sie? | pass | correct |
| 1 | Was kostet er? | pass | correct |
| 1 | Was kostet der Rucksack? | pass | correct |
| 1 | Wie viel kostet er? | pass | correct |
| 1 | Und was kostet er? | pass | correct |
| 1 | Was kostet er, Frau Wolf? | pass | correct |
| 1 | Wie teuer ist er? | pass | correct |
| 1 | Und der Rucksack, was kostet er? | pass | correct |
| 1 | was kostet er | pass | typo |
| 1 | Was kostet sie? | wrong | wrong |
| 1 | Was kostet es? | wrong | wrong |
| 1 | Was kostet die Rucksack? | wrong | wrong |
| 1 | Was kostet das Rucksack? | wrong | wrong |
| 1 | Was kosten er? | wrong | wrong |
| 1 | Kostet er zwanzig Euro? | wrong | wrong |
| 1 | Wie kostet er? | wrong | wrong |
| 1 | Was ist er? | wrong | wrong |
| 1 | Was kostet der Tisch? | wrong | wrong |
| 1 | Wie viele kostet er? | wrong | wrong |
| 1 | Was kostet den Rucksack? | wrong | wrong |
| 1 | Und der Rucksack? | wrong | wrong |
| 1 | Und der Rucksack? Was kostet er? | wrong | correct |
| 1 | Was kostet der? | wrong | wrong |
| 2 | Tisch 40 Euro, Regal 16 Euro | pass | correct |
| 2 | Zahlen mit und | wrong | wrong |
| 3 | Ich kaufe den Stuhl und die Tasche. | pass | correct |
| 3 | Ich kaufe die Tasche und den Stuhl. | pass | correct |
| 3 | Ich kaufe einen Stuhl und eine Tasche. | pass | correct |
| 3 | Den Stuhl und die Tasche. | pass | correct |
| 3 | Ich kaufe den Stuhl und die Tasche, Frau Wolf. | pass | correct |
| 3 | Ich kaufe den Stuhl und auch die Tasche. | pass | correct |
| 3 | Stuhl und Tasche. | wrong | wrong |
| 3 | Stuhl + Tasche | wrong | wrong |
| 3 | Ich kaufe Stuhl und Tasche. | wrong | wrong |
| 3 | Ich kaufe der Stuhl und die Tasche. | wrong | wrong |
| 3 | Der Stuhl und die Tasche. | wrong | wrong |
| 3 | Ich kaufe den Stuhl. | wrong | wrong |
| 3 | Ich kaufe ein Stuhl und eine Tasche. | wrong | wrong |
| 3 | Ich kaufe den Stuhl. Ich kaufe die Tasche. | wrong | correct |
| 0 | Entschuldigung! Was ist das? Was kostet sie? | engine limit / explicit review | correct |
| 0 | Danke. Was ist das? Was kostet sie? | cumulative courtesy / missing-part regression | correct |
| 0 | Was ist das? Was kostet sie? Bitte. | cumulative courtesy / missing-part regression | correct |
| 0 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 1 | Danke. Was kostet er? | cumulative courtesy / missing-part regression | correct |
| 1 | Was kostet er? Bitte. | cumulative courtesy / missing-part regression | correct |
| 1 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 3 | Danke. Ich kaufe den Stuhl und die Tasche. | cumulative courtesy / missing-part regression | correct |
| 3 | Ich kaufe den Stuhl und die Tasche. Bitte. | cumulative courtesy / missing-part regression | correct |
| 3 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |

### Lektion 5 — merged proof

| Goal (zero-based) | Task | Model | Parts / order | Listening instances |
| ---: | --- | --- | --- | ---: |
| 0 | production | Der Stift. Die Schere. Das Wörterbuch. | 3 / any | 0 |
| 1 | production | Wo ist das Wörterbuch? Der Stift ist hier. | 2 / ordered | 0 |
| 2 | production | Der Stift ist blau. Der Bleistift ist gelb. | 2 / any | 0 |
| 3 | production | Ist der Stift blau oder schwarz? | 1 / ordered | 0 |

| Goal | Answer | Writer / case origin | Actual checker result |
| ---: | --- | --- | --- |
| 0 | Der Stift. Die Schere. Das Wörterbuch. | pass | correct |
| 0 | der stift, die schere, das buch | pass | typo |
| 0 | Der Stift ist da. Die Schere ist hier. Das Lineal auch. | pass | correct |
| 0 | Der Kugelschreiber, die Tafel und das Fenster | pass | typo |
| 0 | Das ist der Tisch. Das ist die Lampe. Das ist das Regal. | pass | correct |
| 0 | Der Stift. Die Bücher. Das Heft. | pass | correct |
| 0 | Der Schere. Die Stift. Das Buch. | wrong | wrong |
| 0 | Der Stift. Die Schere. | wrong | wrong |
| 0 | Das Buch. Der Stift. Die Schere. | wrong | correct |
| 0 | Stift. Schere. Buch. | wrong | wrong |
| 0 | Der Stift. Die Fenster. Das Buch. | wrong | wrong |
| 0 | Ein Stift. Eine Schere. Ein Buch. | wrong | wrong |
| 0 | Der Stift - die Schere - das Buch | wrong | wrong |
| 1 | Wo ist das Wörterbuch? Der Stift ist hier. | pass | correct |
| 1 | wo ist das wörterbuch? hier | pass | typo |
| 1 | Tim, wo ist das Wörterbuch? Der Stift ist da. | pass | typo |
| 1 | Entschuldigung, wo ist das Wörterbuch? Mein Stift ist hier. | pass | correct |
| 1 | Wo ist das Wörterbuch der Stift ist da | pass | typo |
| 1 | Was ist das Wörterbuch? Der Stift ist hier. | wrong | wrong |
| 1 | Wo ist der Wörterbuch? Der Stift ist hier. | wrong | wrong |
| 1 | Wo ist das Wörterbuch? | wrong | wrong |
| 1 | Wo ist das Wörterbuch? Der Stift ist blau. | wrong | wrong |
| 1 | Wo ist das Wörterbuch? Sie ist hier. | wrong | wrong |
| 1 | Wo das Wörterbuch ist? Hier. | wrong | wrong |
| 1 | Tim, wo ist das Wörterbuch? | wrong | wrong |
| 2 | Der Stift ist blau. Der Bleistift ist gelb. | pass | correct |
| 2 | Der Stift ist blau, der Bleistift ist gelb. | pass | typo |
| 2 | blau. gelb. | pass | typo |
| 2 | Mein Stift ist schwarz und mein Bleistift ist rot | pass | typo |
| 2 | Er ist grün. Er ist auch grün. | pass | correct |
| 2 | Der Stift ist weiss. Der Bleistift ist gruen. | pass | correct |
| 2 | Der Stift ist blau. | wrong | wrong |
| 2 | Es ist blau. Es ist gelb. | wrong | wrong |
| 2 | Das Stift ist blau. Der Bleistift ist gelb. | wrong | wrong |
| 2 | Der Stift ist blue. Der Bleistift ist yellow. | wrong | wrong |
| 2 | Der Stift ist hier. Der Bleistift ist da. | wrong | wrong |
| 2 | Der Bleistift ist gelb. Der Stift ist blau. | wrong | correct |
| 3 | Ist der Stift blau oder schwarz? | pass | correct |
| 3 | ist der stift blau | pass | typo |
| 3 | Welche Farbe hat der Stift? | pass | correct |
| 3 | Ist er rot oder blau? | pass | correct |
| 3 | Der Stift ist blau oder schwarz? | wrong | wrong |
| 3 | Ist die Stift blau? | wrong | wrong |
| 3 | Ist es blau? | wrong | wrong |
| 3 | Wo ist der Stift? | wrong | wrong |
| 3 | Was Farbe hat der Stift? | wrong | wrong |
| 3 | Welche Farbe ist der Stift? | wrong | wrong |
| 0 | Das Wörterbuch ist hier. Der Stift ist da. Die Schere ist hier. Das Lineal auch. | engine limit / explicit review | correct |
| 1 | Tim, wo ist das Wörterbuch? Das Wörterbuch ist hier. Der Stift ist da. | engine limit / explicit review | typo |
| 1 | Entschuldigung! Wo ist das Wörterbuch? Der Stift ist hier. | engine limit / explicit review | correct |
| 0 | Der Stift. Die Tur. Das Buch. | engine limit / explicit review | wrong |
| 2 | Der Stift ist blau. Der Bleistift ist grun. | engine limit / explicit review | wrong |
| 0 | Danke. Der Stift. Die Schere. Das Wörterbuch. | cumulative courtesy / missing-part regression | correct |
| 0 | Der Stift. Die Schere. Das Wörterbuch. Bitte. | cumulative courtesy / missing-part regression | correct |
| 0 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 1 | Danke. Wo ist das Wörterbuch? Der Stift ist hier. | cumulative courtesy / missing-part regression | correct |
| 1 | Wo ist das Wörterbuch? Der Stift ist hier. Bitte. | cumulative courtesy / missing-part regression | correct |
| 1 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 2 | Danke. Der Stift ist blau. Der Bleistift ist gelb. | cumulative courtesy / missing-part regression | correct |
| 2 | Der Stift ist blau. Der Bleistift ist gelb. Bitte. | cumulative courtesy / missing-part regression | correct |
| 2 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 3 | Danke. Ist der Stift blau oder schwarz? | cumulative courtesy / missing-part regression | correct |
| 3 | Ist der Stift blau oder schwarz? Bitte. | cumulative courtesy / missing-part regression | correct |
| 3 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |

### Lektion 6 — merged proof

| Goal (zero-based) | Task | Model | Parts / order | Listening instances |
| ---: | --- | --- | --- | ---: |
| 0 | production | Ich brauche einen Computer und ein Telefon. | 1 / ordered | 0 |
| 1 | production | Ich heiße Ana Chakiri. | 1 / ordered | 0 |
| 2 | listening | Büro: 042 3381, Handy: 0176 234567 | checked choice | 2 |
| 3 | production | Wie ist die Telefonnummer? Danke! Wann ist die Pause? | 2 / any | 0 |

| Goal | Answer | Writer / case origin | Actual checker result |
| ---: | --- | --- | --- |
| 0 | Danke. Ich brauche einen Computer und ein Telefon. | pass | correct |
| 0 | danke, ich brauche einen computer und ein telefon | pass | typo |
| 0 | Danke, Herr Weber. Ich brauche ein Telefon und einen Computer. | pass | correct |
| 0 | Danke! Wir brauchen einen Computer und ein Telefon. | pass | correct |
| 0 | Danke. Ich brauche einen Computer und ein Telefon, Herr Weber. | pass | correct |
| 0 | Ich brauche einen Computer und ein Telefon. | wrong | correct |
| 0 | Danke. Ich brauche ein Computer und ein Telefon. | wrong | wrong |
| 0 | Danke. Ich brauche einen Computer und einen Telefon. | wrong | wrong |
| 0 | Danke. Ich brauche einen Computer. | wrong | wrong |
| 0 | Danke. Ich habe einen Computer und ein Telefon. | wrong | wrong |
| 0 | Danke. Ich brauchen einen Computer und ein Telefon. | wrong | wrong |
| 1 | Ich heiße Sam Miller. | pass | correct |
| 1 | ich heiße sam miller | pass | typo |
| 1 | Ich heiße Sam. | pass | correct |
| 1 | Sam Miller | wrong | wrong |
| 1 | Ich heiße | wrong | wrong |
| 1 | Guten Morgen, Herr Weber! | wrong | wrong |
| 2 | Büro: 042 3318, Handy: 0176 234567 | wrong | wrong |
| 2 | Büro: 042 3381, Handy: 0167 234567 | wrong | wrong |
| 2 | Büro: 024 3381, Handy: 0176 234576 | wrong | wrong |
| 3 | Wie ist die Telefonnummer? Danke! Wann ist die Pause? | pass | correct |
| 3 | Und wie ist die Telefonnummer? Danke! Wann ist die Pause? | pass | correct |
| 3 | wie ist die telefonnummer danke wann ist die pause | pass | typo |
| 3 | Wie ist die Nummer vom Büro? Danke, Herr Weber! Und wann ist die Pause? | pass | correct |
| 3 | Entschuldigung, wie ist die Telefonnummer? Danke. Wann machen wir Pause? | pass | correct |
| 3 | Wie ist die Telefonnummer? Wann ist die Pause? | wrong | correct |
| 3 | Was ist die Telefonnummer? Danke! Wann ist die Pause? | wrong | wrong |
| 3 | Wie ist die Telefonnummer? Danke! Wo ist die Pause? | wrong | wrong |
| 3 | Wann ist die Pause? Danke! Wie ist die Telefonnummer? | wrong | correct |
| 3 | Wie ist die Telefonnummer? Danke! Wann die Pause ist? | wrong | wrong |
| 3 | Wie ist die Telefonnummer? Danke! | wrong | wrong |
| 0 | Danke. Ich brauche einen Computer. Ich brauche ein Telefon. | engine limit / explicit review | correct |
| 0 | Guten Morgen, Herr Weber! Danke. Ich brauche einen Computer und ein Telefon. | engine limit / explicit review | correct |
| 1 | Guten Tag! Ich heisse Sam Miller. | engine limit / explicit review | correct |
| 1 | Ich heiße nicht. | engine limit / explicit review | wrong |
| 3 | Herr Weber, wie ist die Telefonnummer? Danke, wann ist die Pause? | engine limit / explicit review | typo |
| 0 | Ich brauche einen Computer und ein Telefon. Bitte. | cumulative courtesy / missing-part regression | correct |
| 0 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 1 | Danke. Ich heiße Ana Chakiri. | cumulative courtesy / missing-part regression | correct |
| 1 | Ich heiße Ana Chakiri. Bitte. | cumulative courtesy / missing-part regression | correct |
| 1 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 3 | Danke. Wie ist die Telefonnummer? Danke! Wann ist die Pause? | cumulative courtesy / missing-part regression | correct |
| 3 | Wie ist die Telefonnummer? Danke! Wann ist die Pause? Bitte. | cumulative courtesy / missing-part regression | correct |
| 3 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |

### Lektion 7 — merged proof

| Goal (zero-based) | Task | Model | Parts / order | Listening instances |
| ---: | --- | --- | --- | ---: |
| 0 | production | Mein Hobby ist Sport. Ich spiele am Wochenende Fußball. | 2 / any | 0 |
| 1 | production | Ich höre gern Musik. Ich lese gern. | 2 / any | 0 |
| 2 | production | Was ist dein Hobby? Gehst du gern ins Kino? | 2 / ordered | 0 |
| 3 | production | Ich bin am Wochenende frei. | 1 / ordered | 0 |

| Goal | Answer | Writer / case origin | Actual checker result |
| ---: | --- | --- | --- |
| 0 | Mein Hobby ist Sport. Ich spiele am Wochenende Fußball. | pass | correct |
| 0 | mein hobby ist musik. ich höre gern musik | pass | typo |
| 0 | Meine Hobbys sind Lesen und Kochen. Am Wochenende koche ich gern. | pass | correct |
| 0 | Sport. Ich schwimme jede Woche. | pass | correct |
| 0 | Mein Hobby ist schwimmen. Ich schwimme am Wochenende. | pass | typo |
| 0 | Mein Hobby ist Sport und ich spiele am Wochenende Fußball. | pass | typo |
| 0 | Mein Hobby ist Musik. Ich höre Musik gern. | pass | correct |
| 0 | Mein Hobby ist Sport. | wrong | wrong |
| 0 | Ich spiele am Wochenende Fußball. | wrong | wrong |
| 0 | Mein Hobby ist Sport. Ich spielen am Wochenende Fußball. | wrong | wrong |
| 0 | Meine Hobby ist Sport. Ich spiele Fußball. | wrong | wrong |
| 0 | Mein Hobby ist Sport. Am Wochenende ich spiele Fußball. | wrong | wrong |
| 0 | Mein Hobby ist Sport. Ich bin frei. | wrong | wrong |
| 1 | Ich höre gern Musik. Ich lese gern. | pass | correct |
| 1 | Ich lese auch gern. Und ich koche gern. | pass | correct |
| 1 | ich spiele gern fußball und ich schwimme gern | pass | wrong |
| 1 | Ich gehe sehr gern ins Kino. Ich tanze gerne. | pass | correct |
| 1 | Ich lese gern und koche gern. | pass | correct |
| 1 | Ich höre gern Musik. | wrong | wrong |
| 1 | Ich höre Musik. Ich lese. | wrong | wrong |
| 1 | Ich gern höre Musik. Ich lese gern. | wrong | wrong |
| 1 | Ich hören gern Musik. Ich lese gern. | wrong | wrong |
| 1 | Ich höre gern Musik. Ich lese nicht gern. | wrong | wrong |
| 2 | Was ist dein Hobby? Gehst du gern ins Kino? | pass | correct |
| 2 | Tim, was ist dein Hobby? Spielst du jede Woche Fußball? | pass | typo |
| 2 | was ist dein hobby tanzt du auch | pass | typo |
| 2 | Was machst du gern? Und tanzt du auch? | pass | correct |
| 2 | Hast du ein Hobby? Schwimmst du am Wochenende? | pass | correct |
| 2 | Was ist Ihr Hobby? Gehen Sie gern ins Kino? | wrong | wrong |
| 2 | Was ist dein Hobby? | wrong | wrong |
| 2 | Was ist dein Hobby? Du gehst gern ins Kino? | wrong | wrong |
| 2 | Was ist dein Hobby? Spielt du Fußball? | wrong | wrong |
| 2 | Wie ist dein Hobby? Tanzt du? | wrong | wrong |
| 2 | Was ist deine Hobby? Tanzt du? | wrong | wrong |
| 2 | Gehst du gern ins Kino? Was ist dein Hobby? | wrong | wrong |
| 2 | Was ist dein Hobby? Lest du gern? | wrong | wrong |
| 3 | Ich bin am Wochenende frei. | pass | correct |
| 3 | am wochenende bin ich frei | pass | typo |
| 3 | Am Wochenende. | pass | correct |
| 3 | Am Wochenende arbeite ich nicht. | pass | correct |
| 3 | Ich bin morgen frei. | pass | correct |
| 3 | Um neun Uhr bin ich frei. | pass | correct |
| 3 | Am Wochenende arbeite ich nicht, ich bin frei. | pass | correct |
| 3 | Ich habe am Wochenende frei. | pass | correct |
| 3 | Ich bin frei. | wrong | wrong |
| 3 | Ich bin am Wochenende. | wrong | wrong |
| 3 | Am Wochenende ich bin frei. | wrong | wrong |
| 3 | Ich bin im Wochenende frei. | wrong | wrong |
| 3 | Ich arbeite am Wochenende. | wrong | wrong |
| 3 | Ich bist am Wochenende frei. | wrong | wrong |
| 0 | Mein Hobby ist Sport. Ich spiele am Wochenende Fußball. Und Sie? | engine limit / explicit review | correct |
| 1 | Ich lese und koche gern. | engine limit / explicit review | correct |
| 1 | Ich lese gern. Ich lese gern. | engine limit / explicit review | wrong |
| 2 | Was ist dein Hobby? Liest du gern? | engine limit / explicit review | wrong |
| 3 | Am Wochenende arbeite ich nicht. Ich bin frei. | engine limit / explicit review | correct |
| 3 | Ich bin am Samstag frei. | engine limit / explicit review | wrong |
| 0 | Danke. Mein Hobby ist Sport. Ich spiele am Wochenende Fußball. | cumulative courtesy / missing-part regression | correct |
| 0 | Mein Hobby ist Sport. Ich spiele am Wochenende Fußball. Bitte. | cumulative courtesy / missing-part regression | correct |
| 0 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 1 | Danke. Ich höre gern Musik. Ich lese gern. | cumulative courtesy / missing-part regression | correct |
| 1 | Ich höre gern Musik. Ich lese gern. Bitte. | cumulative courtesy / missing-part regression | correct |
| 1 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 2 | Danke. Was ist dein Hobby? Gehst du gern ins Kino? | cumulative courtesy / missing-part regression | correct |
| 2 | Was ist dein Hobby? Gehst du gern ins Kino? Bitte. | cumulative courtesy / missing-part regression | correct |
| 2 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 3 | Danke. Ich bin am Wochenende frei. | cumulative courtesy / missing-part regression | correct |
| 3 | Ich bin am Wochenende frei. Bitte. | cumulative courtesy / missing-part regression | correct |
| 3 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |

### Lektion 8 — merged proof

| Goal (zero-based) | Task | Model | Parts / order | Listening instances |
| ---: | --- | --- | --- | ---: |
| 0 | production | Wie spät ist es? Es ist halb elf. | 2 / ordered | 0 |
| 1 | production | Der Termin ist am Freitag um neun Uhr. | 1 / ordered | 0 |
| 2 | production | Ich stehe um sieben Uhr auf. | 1 / ordered | 0 |
| 3 | production | Am Donnerstag bin ich abends frei. | 1 / ordered | 0 |

| Goal | Answer | Writer / case origin | Actual checker result |
| ---: | --- | --- | --- |
| 0 | Wie spät ist es? Es ist halb elf. | pass | correct |
| 0 | Entschuldigung, wie spät ist es? Halb elf. | pass | correct |
| 0 | Wie spät ist es, bitte? Es ist zehn Uhr dreissig | pass | correct |
| 0 | wie viel uhr ist es es ist zehn uhr dreißig | pass | typo |
| 0 | Wie spät ist es? Es ist halb zehn. | wrong | wrong |
| 0 | Wie spät ist es? Es ist um halb elf. | wrong | wrong |
| 0 | Wie spät ist es? Es ist 10:30 Uhr. | wrong | wrong |
| 0 | Wann ist es? Es ist halb elf. | wrong | wrong |
| 0 | Es ist halb elf. | wrong | wrong |
| 1 | Der Termin ist am Freitag um neun Uhr. | pass | correct |
| 1 | Am Freitag um neun Uhr. | pass | correct |
| 1 | Am Freitag um neun Uhr habe ich Zeit. | pass | correct |
| 1 | der termin ist um 9 uhr am freitag | pass | typo |
| 1 | Der Termin ist um Freitag am neun Uhr. | wrong | wrong |
| 1 | Der Termin ist am Freitag. | wrong | wrong |
| 1 | Der Termin ist am Montag um Viertel vor acht. | wrong | wrong |
| 1 | Der Termin ist am Freitag um zehn Uhr. | wrong | wrong |
| 1 | Der Termin ist Freitag um neun Uhr. | wrong | wrong |
| 2 | Ich stehe um sieben Uhr auf. | pass | correct |
| 2 | Ich stehe morgens immer um sieben auf. | pass | correct |
| 2 | Um sieben Uhr stehe ich auf. | pass | correct |
| 2 | ich stehe um 7 uhr auf | pass | typo |
| 2 | Ich aufstehe um sieben Uhr. | wrong | wrong |
| 2 | Ich stehe um sieben Uhr. | wrong | wrong |
| 2 | Ich stehe am sieben Uhr auf. | wrong | wrong |
| 2 | Ich stehe um sechs Uhr auf. | wrong | wrong |
| 2 | Um sieben Uhr. | wrong | wrong |
| 2 | Ich stehe auf um sieben Uhr. | wrong | wrong |
| 3 | Am Donnerstag bin ich abends frei. | pass | correct |
| 3 | Am Donnerstag habe ich Zeit. | pass | correct |
| 3 | Am Donnerstag am Abend. | pass | correct |
| 3 | ich habe am donnerstag abends zeit | pass | typo |
| 3 | Am Donnerstag ich bin abends frei. | wrong | wrong |
| 3 | Um Donnerstag bin ich abends frei. | wrong | wrong |
| 3 | Am Dienstag bin ich abends frei. | wrong | wrong |
| 3 | Am Donnerstag bin ich morgens frei. | wrong | wrong |
| 3 | Am Donnerstag habe ich keine Zeit. | wrong | wrong |
| 3 | Ich habe Donnerstag Zeit. | wrong | wrong |
| 3 | Am Donnerstagabend habe ich Zeit. | wrong | wrong |
| 1 | Der Termin ist am Freitag um 9.00 Uhr. | engine limit / explicit review | correct |
| 0 | Entschuldigung! Wie spät ist es? Es ist halb elf. | engine limit / explicit review | correct |
| 0 | Danke. Wie spät ist es? Es ist halb elf. | cumulative courtesy / missing-part regression | correct |
| 0 | Wie spät ist es? Es ist halb elf. Bitte. | cumulative courtesy / missing-part regression | correct |
| 0 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 1 | Danke. Der Termin ist am Freitag um neun Uhr. | cumulative courtesy / missing-part regression | correct |
| 1 | Der Termin ist am Freitag um neun Uhr. Bitte. | cumulative courtesy / missing-part regression | correct |
| 1 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 2 | Danke. Ich stehe um sieben Uhr auf. | cumulative courtesy / missing-part regression | correct |
| 2 | Ich stehe um sieben Uhr auf. Bitte. | cumulative courtesy / missing-part regression | correct |
| 2 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 3 | Danke. Am Donnerstag bin ich abends frei. | cumulative courtesy / missing-part regression | correct |
| 3 | Am Donnerstag bin ich abends frei. Bitte. | cumulative courtesy / missing-part regression | correct |
| 3 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |

### Lektion 9 — merged proof

| Goal (zero-based) | Task | Model | Parts / order | Listening instances |
| ---: | --- | --- | --- | ---: |
| 0 | production | Ich habe Durst. Ich möchte einen Tee, bitte. | 2 / ordered | 0 |
| 1 | production | Ich habe Hunger. Ich möchte Suppe, bitte. | 2 / ordered | 0 |
| 2 | production | Haben Sie auch Salat? | 1 / ordered | 0 |
| 3 | production | Ja, bitte. Nein, danke. | 2 / ordered | 0 |

| Goal | Answer | Writer / case origin | Actual checker result |
| ---: | --- | --- | --- |
| 0 | Ich habe Durst. Ich möchte einen Tee, bitte. | pass | correct |
| 0 | Ich habe Durst. Ich möchte Tee. | pass | correct |
| 0 | Ich habe Durst. Ich trinke einen Tee. | pass | correct |
| 0 | ich habe durst und ich möchte eine tasse tee bitte | pass | typo |
| 0 | Ich möchte einen Tee, bitte. | wrong | wrong |
| 0 | Ich bin Durst. Ich möchte einen Tee, bitte. | wrong | wrong |
| 0 | Ich habe Durst. Ich möchte ein Tee, bitte. | wrong | wrong |
| 0 | Ich habe Durst. Ich möchte einen Kaffee, bitte. | wrong | wrong |
| 0 | Ich habe Durst. Tee. | wrong | wrong |
| 0 | Ich habe Durst. Ich möchte einen Tee, bitte. Danke! | wrong | correct |
| 0 | Guten Tag! Ich habe Durst. Ich möchte einen Tee, bitte. | wrong | correct |
| 1 | Ich habe Hunger. Ich möchte Suppe, bitte. | pass | correct |
| 1 | Ja, ich habe Hunger. Ich möchte eine Suppe, bitte. | pass | correct |
| 1 | Ich habe Hunger. Die Suppe, bitte. | pass | correct |
| 1 | ich habe auch hunger ich esse suppe | pass | typo |
| 1 | Ja, ich habe Hunger. Ich möchte Kuchen, bitte. | wrong | wrong |
| 1 | Ich bin Hunger. Ich möchte Suppe, bitte. | wrong | wrong |
| 1 | Ich möchte Suppe, bitte. | wrong | wrong |
| 1 | Ich habe Hunger. Ich möchte einen Suppe, bitte. | wrong | wrong |
| 1 | Ich habe Durst. Ich möchte Suppe, bitte. | wrong | wrong |
| 1 | Ich bin hungrig. Ich möchte Suppe, bitte. | wrong | wrong |
| 2 | Haben Sie auch Salat? | pass | correct |
| 2 | Haben Sie Salat? | pass | correct |
| 2 | Und haben Sie auch Salat? | pass | correct |
| 2 | entschuldigung haben sie auch einen salat bitte | pass | typo |
| 2 | Hast du auch Salat? | wrong | wrong |
| 2 | Ich möchte Salat, bitte. | wrong | wrong |
| 2 | Haben Sie auch ein Salat? | wrong | wrong |
| 2 | Sie haben auch Salat? | wrong | wrong |
| 2 | Und Salat? | wrong | wrong |
| 2 | Gibt es auch Salat? | wrong | wrong |
| 2 | Entschuldigung! Haben Sie auch Salat? | wrong | correct |
| 3 | Ja, bitte. Nein, danke. | pass | correct |
| 3 | Ja, gern. Nein, danke. | pass | correct |
| 3 | Ja, ein Glas Mineralwasser, bitte. Nein, danke. | pass | correct |
| 3 | ja gerne nein danke | pass | typo |
| 3 | Ja! Nein! | wrong | wrong |
| 3 | Ja, bitte. Nein. | wrong | wrong |
| 3 | Nein, danke. Ja, bitte. | wrong | wrong |
| 3 | Ja, bitte. Nein, bitte. | wrong | wrong |
| 3 | Ja, bitte. | wrong | wrong |
| 3 | Ja, bitte. Nein, danke. Ich möchte keinen Wein. | wrong | wrong |
| 3 | Ja, ein Glas Mineralwasser, bitte. Und einen Orangensaft. Nein, danke. Ich esse ein Brot mit Salat. | wrong | correct |
| 0 | Danke. Ich habe Durst. Ich möchte einen Tee, bitte. | cumulative courtesy / missing-part regression | correct |
| 0 | Ich habe Durst. Ich möchte einen Tee, bitte. Bitte. | cumulative courtesy / missing-part regression | correct |
| 0 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 1 | Danke. Ich habe Hunger. Ich möchte Suppe, bitte. | cumulative courtesy / missing-part regression | correct |
| 1 | Ich habe Hunger. Ich möchte Suppe, bitte. Bitte. | cumulative courtesy / missing-part regression | correct |
| 1 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 2 | Danke. Haben Sie auch Salat? | cumulative courtesy / missing-part regression | correct |
| 2 | Haben Sie auch Salat? Bitte. | cumulative courtesy / missing-part regression | correct |
| 2 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 3 | Danke. Ja, bitte. Nein, danke. | cumulative courtesy / missing-part regression | correct |
| 3 | Ja, bitte. Nein, danke. Bitte. | cumulative courtesy / missing-part regression | correct |
| 3 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |

### Lektion 10 — merged proof

| Goal (zero-based) | Task | Model | Parts / order | Listening instances |
| ---: | --- | --- | --- | ---: |
| 0 | production | Wann fährt der Zug nach Österreich? | 1 / ordered | 0 |
| 1 | production | Was kostet die Fahrkarte? | 1 / ordered | 0 |
| 2 | listening | Der Zug ist nicht pünktlich. Er fährt von Gleis fünf. | checked choice | 2 |
| 3 | production | Ich fahre nach Berlin. | 1 / ordered | 0 |

| Goal | Answer | Writer / case origin | Actual checker result |
| ---: | --- | --- | --- |
| 0 | Wann fährt der Zug nach Österreich? | pass | correct |
| 0 | Wann fährt der Zug? | pass | correct |
| 0 | Wann ist die Abfahrt, bitte? | pass | correct |
| 0 | Wann geht der Zug, Herr Schmidt? | pass | correct |
| 0 | entschuldigung um wie viel uhr fährt der zug | pass | typo |
| 0 | Entschuldigung, fährt der Zug nach Österreich? | wrong | wrong |
| 0 | Wann fahrt der Zug? | wrong | wrong |
| 0 | Wann der Zug fährt? | wrong | wrong |
| 0 | Wann fährt die Zug? | wrong | wrong |
| 0 | Wann ist die Ankunft? | wrong | wrong |
| 0 | Wann fährt der Bus? | wrong | wrong |
| 0 | Wann fährt der Zug ab? | wrong | wrong |
| 0 | Danke! Und wann ist die Abfahrt? | wrong | correct |
| 0 | Herr Schmidt, wann fährt der Zug? | wrong | typo |
| 1 | Was kostet die Fahrkarte? | pass | correct |
| 1 | Wie viel kostet eine Fahrkarte nach Österreich? | pass | correct |
| 1 | Entschuldigung, was kostet die Fahrkarte? | pass | correct |
| 1 | Wie teuer ist die Fahrkarte, Herr Schmidt? | pass | correct |
| 1 | kostet die fahrkarte 20 euro | pass | typo |
| 1 | Was kosten die Fahrkarte? | wrong | wrong |
| 1 | Die Fahrkarte kostet zwanzig Euro? | wrong | wrong |
| 1 | Was kostet der Fahrkarte? | wrong | wrong |
| 1 | Wie viele kostet die Fahrkarte? | wrong | wrong |
| 1 | Hat der Zug Verspätung? | wrong | wrong |
| 1 | Kostet die Fahrkarte fünfzehn Euro? | wrong | wrong |
| 1 | Was kostet das? | wrong | wrong |
| 2 | Der Zug ist nicht pünktlich. Er fährt von Gleis fünf. | pass | correct |
| 2 | Der Zug ist pünktlich. Er fährt von Gleis fünf. | wrong | wrong |
| 2 | Der Zug ist nicht pünktlich. Er fährt von Gleis zehn. | wrong | wrong |
| 2 | Der Zug ist pünktlich. Er fährt von Gleis zehn. | wrong | wrong |
| 3 | Ich fahre nach Berlin. | pass | correct |
| 3 | Nach Berlin. | pass | correct |
| 3 | Ich fahre von Bremen nach Berlin | pass | correct |
| 3 | ich fahre mit dem bus nach berlin | pass | typo |
| 3 | Ich fahre in Berlin. | wrong | wrong |
| 3 | Ich fahren nach Berlin. | wrong | wrong |
| 3 | Ich fährt nach Berlin. | wrong | wrong |
| 3 | Ich gehe nach Berlin. | wrong | wrong |
| 3 | Berlin. | wrong | wrong |
| 3 | Ich fahre nach Bremen. | wrong | wrong |
| 3 | Ich komme aus Berlin. | wrong | wrong |
| 0 | Danke. Wann fährt der Zug nach Österreich? | cumulative courtesy / missing-part regression | correct |
| 0 | Wann fährt der Zug nach Österreich? Bitte. | cumulative courtesy / missing-part regression | correct |
| 0 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 1 | Danke. Was kostet die Fahrkarte? | cumulative courtesy / missing-part regression | correct |
| 1 | Was kostet die Fahrkarte? Bitte. | cumulative courtesy / missing-part regression | correct |
| 1 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 3 | Danke. Ich fahre nach Berlin. | cumulative courtesy / missing-part regression | correct |
| 3 | Ich fahre nach Berlin. Bitte. | cumulative courtesy / missing-part regression | correct |
| 3 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |

### Lektion 11 — merged proof

| Goal (zero-based) | Task | Model | Parts / order | Listening instances |
| ---: | --- | --- | --- | ---: |
| 0 | production | Ich dusche jeden Tag. Ich schlafe am Sonntag bis neun. | 2 / ordered | 0 |
| 1 | production | Was hast du gestern gemacht? Ich habe gearbeitet. | 2 / ordered | 0 |
| 2 | production | Ich kaufe am Freitag ein. Kommst du mit? | 2 / ordered | 0 |
| 3 | production | Ich stehe um sechs auf. Ich arbeite am Montag. | 2 / any | 0 |

| Goal | Answer | Writer / case origin | Actual checker result |
| ---: | --- | --- | --- |
| 0 | Ich dusche jeden Tag. Ich schlafe am Sonntag bis neun. | pass | correct |
| 0 | Ich dusche. Am Sonntag schlafe ich bis 9 Uhr. | pass | correct |
| 0 | ich dusche jeden tag ich schlafe bis neun uhr | pass | typo |
| 0 | Ich dusche und frühstücke jeden Tag. Ich schlafe am Sonntag bis neun. | pass | correct |
| 0 | Jeden Tag dusche ich, am Sonntag schlafe ich bis neun | pass | typo |
| 0 | Ich duschen jeden Tag. Ich schlafe am Sonntag bis neun. | wrong | wrong |
| 0 | Ich dusche jeden Tag. Ich schlafe am Sonntag um neun. | wrong | wrong |
| 0 | Ich dusche jeden Tag. Ich schläft am Sonntag bis neun. | wrong | wrong |
| 0 | Ich dusche jeden Tag. Am Sonntag ich schlafe bis neun. | wrong | wrong |
| 0 | Ich dusche jeden Tag. Sonntag schlafe ich bis neun. | wrong | wrong |
| 0 | Ich dusche jeden Tag. Ich schlafe am Sonntag bis zehn. | wrong | wrong |
| 0 | Ich dusche jeden Tag. | wrong | wrong |
| 0 | Ich schlafe am Sonntag bis neun. Ich dusche jeden Tag. | wrong | wrong |
| 0 | Ich dusche. Ich frühstücke. Ich schlafe am Sonntag bis neun. | wrong | wrong |
| 0 | Ich dusche jeden Tag. Ich schlafe am Sonntag bis neun. Mein Bruder schläft auch. | wrong | correct |
| 1 | Was hast du gestern gemacht? Ich habe gearbeitet. | pass | correct |
| 1 | Tim, was hast du gestern gemacht? Ich habe gestern gearbeitet. | pass | typo |
| 1 | was hast du gestern gemacht gestern habe ich gearbeitet | pass | typo |
| 1 | Tim, was hast du gestern gemacht? Ich habe gearbeitet! | pass | typo |
| 1 | Was haben Sie gestern gemacht? Ich habe gearbeitet. | wrong | wrong |
| 1 | Was machst du gestern? Ich habe gearbeitet. | wrong | wrong |
| 1 | Was hast du gestern gemacht? Ich arbeite gestern. | wrong | wrong |
| 1 | Was hast du gestern gemacht? Ich habe arbeiten. | wrong | wrong |
| 1 | Was hast du gestern gemacht? Ich habe gearbeiten. | wrong | wrong |
| 1 | Was hast du gestern gemacht? Ich bin gearbeitet. | wrong | wrong |
| 1 | Was hast du gemacht? Ich habe gearbeitet. | wrong | wrong |
| 1 | Ich habe gearbeitet. | wrong | wrong |
| 1 | Was hast du gestern gemacht? | wrong | wrong |
| 2 | Ich kaufe am Freitag ein. Kommst du mit? | pass | correct |
| 2 | Am Freitag kaufe ich ein. Kommst du am Freitag mit? | pass | correct |
| 2 | ich kaufe am freitag ein kommst du mit | pass | typo |
| 2 | Ja, ich kaufe am Freitag ein. Kommst du mit? | pass | correct |
| 2 | Ich kaufe am Freitag ein, möchtest du mitkommen? | pass | typo |
| 2 | Ich gehe am Freitag einkaufen. Kommst du auch mit? | pass | correct |
| 2 | Ich kaufe am Freitag ein. Kommen Sie mit? | wrong | wrong |
| 2 | Ich einkaufe am Freitag. Kommst du mit? | wrong | wrong |
| 2 | Ich kaufe ein am Freitag. Kommst du mit? | wrong | wrong |
| 2 | Ich kaufe am Freitag ein. Mitkommst du? | wrong | wrong |
| 2 | Ich kaufe am Freitag ein. Kommst du? | wrong | wrong |
| 2 | Ich kaufe am Freitag. Kommst du mit? | wrong | wrong |
| 2 | Ich kaufe am Samstag ein. Kommst du mit? | wrong | wrong |
| 2 | Ich kaufe am Freitag ein. | wrong | wrong |
| 2 | Ich kaufe im Freitag ein. Kommst du mit? | wrong | wrong |
| 2 | Ich kaufe am Freitag ein. Rufst du mich an? | wrong | wrong |
| 3 | Ich stehe um sechs auf. Ich arbeite am Montag. | pass | correct |
| 3 | Ich stehe um 6 Uhr auf. Am Montag arbeite ich. | pass | correct |
| 3 | ich stehe morgens um sechs uhr auf ich arbeite am montag | pass | typo |
| 3 | Um sechs stehe ich auf, am Montag arbeite ich | pass | typo |
| 3 | Ich stehe um sechs Uhr auf und ich arbeite am Montag. | pass | wrong |
| 3 | Ich aufstehe um sechs. Ich arbeite am Montag. | wrong | wrong |
| 3 | Ich stehe auf um sechs. Ich arbeite am Montag. | wrong | wrong |
| 3 | Ich stehe um sechs. Ich arbeite am Montag. | wrong | wrong |
| 3 | Um sechs. Am Montag. | wrong | wrong |
| 3 | Ich stehe um sechs auf. Ich arbeite im Montag. | wrong | wrong |
| 3 | Ich stehe um sieben auf. Ich arbeite am Montag. | wrong | wrong |
| 3 | Ich stehe um sechs auf. Ich arbeite am Dienstag. | wrong | wrong |
| 3 | Ich stehe um sechs auf. | wrong | wrong |
| 3 | Ich stehe um sechs auf. Ich habe am Montag gearbeitet. | wrong | wrong |
| 3 | Ich stehen um sechs auf. Ich arbeite am Montag. | wrong | wrong |
| 3 | Ich stehe um sechs auf. Ich bin müde. Ich arbeite am Montag. | wrong | correct |
| 1 | Was hast du gestern gemacht, Tim? Ich habe gearbeitet. | engine limit / explicit review | correct |
| 3 | Ich stehe um 6:00 Uhr auf. Ich arbeite am Montag. | engine limit / explicit review | correct |
| 3 | Ich stehe um sechs auf und arbeite am Montag. | engine limit / explicit review | correct |
| 1 | Tim, was hast du gestern gemacht? Ich habe gearbeitet. Heute lerne ich Deutsch. | engine limit / explicit review | typo |
| 0 | Danke. Ich dusche jeden Tag. Ich schlafe am Sonntag bis neun. | cumulative courtesy / missing-part regression | correct |
| 0 | Ich dusche jeden Tag. Ich schlafe am Sonntag bis neun. Bitte. | cumulative courtesy / missing-part regression | correct |
| 0 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 1 | Danke. Was hast du gestern gemacht? Ich habe gearbeitet. | cumulative courtesy / missing-part regression | correct |
| 1 | Was hast du gestern gemacht? Ich habe gearbeitet. Bitte. | cumulative courtesy / missing-part regression | correct |
| 1 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 2 | Danke. Ich kaufe am Freitag ein. Kommst du mit? | cumulative courtesy / missing-part regression | correct |
| 2 | Ich kaufe am Freitag ein. Kommst du mit? Bitte. | cumulative courtesy / missing-part regression | correct |
| 2 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 3 | Danke. Ich stehe um sechs auf. Ich arbeite am Montag. | cumulative courtesy / missing-part regression | correct |
| 3 | Ich stehe um sechs auf. Ich arbeite am Montag. Bitte. | cumulative courtesy / missing-part regression | correct |
| 3 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |

### Lektion 12 — merged proof

| Goal (zero-based) | Task | Model | Parts / order | Listening instances |
| ---: | --- | --- | --- | ---: |
| 0 | production | Ich lade Sie ein. | 1 / ordered | 0 |
| 1 | production | Mein Geburtstag ist im Mai. | 1 / ordered | 0 |
| 2 | production | Wir feiern am Freitag. Meine Mama und mein Papa kommen. | 2 / any | 0 |
| 3 | production | Mach's gut. Bis bald. | 2 / any | 0 |

| Goal | Answer | Writer / case origin | Actual checker result |
| ---: | --- | --- | --- |
| 0 | Ich lade Sie ein. | pass | correct |
| 0 | Ich lade Sie zum Geburtstag ein. | pass | correct |
| 0 | ich möchte sie einladen | pass | typo |
| 0 | Kommen Sie auch? | pass | correct |
| 0 | Ich lade auch Sie ein! | pass | correct |
| 0 | Ich lade Sie zu meinem Fest ein | pass | correct |
| 0 | Kommen Sie am Freitag? | pass | correct |
| 0 | Möchten Sie kommen? | pass | correct |
| 0 | Kommen Sie zu meinem Geburtstag? | pass | correct |
| 0 | Ich lade dich ein. | wrong | wrong |
| 0 | Kommst du auch? | wrong | wrong |
| 0 | Ich einlade Sie. | wrong | wrong |
| 0 | Ich lade Sie. | wrong | wrong |
| 0 | Ich lade ein Sie. | wrong | wrong |
| 0 | Ich lade auch meine Kollegin ein. | wrong | wrong |
| 0 | Ich lade Ihnen ein. | wrong | wrong |
| 0 | Ich lade Sie zum Party ein. | wrong | wrong |
| 0 | Ich lade Sie zu mein Fest ein. | wrong | wrong |
| 0 | Kommen Sie mit? | wrong | wrong |
| 0 | Wir feiern am Freitag. | wrong | wrong |
| 0 | Ja. Ich lade Sie ein. | wrong | correct |
| 0 | Danke. Ich lade Sie ein. | wrong | correct |
| 1 | Mein Geburtstag ist im Mai. | pass | correct |
| 1 | Ich habe im Mai Geburtstag. | pass | correct |
| 1 | im mai | pass | typo |
| 1 | Im Mai ist mein Geburtstag | pass | correct |
| 1 | Im Mai habe ich Geburtstag! | pass | correct |
| 1 | Ich habe Geburtstag im Mai. | pass | correct |
| 1 | Mein Geburtstag ist in Mai. | wrong | wrong |
| 1 | Mein Geburtstag ist am Mai. | wrong | wrong |
| 1 | Mai. | wrong | wrong |
| 1 | Mein Geburtstag ist am Freitag. | wrong | wrong |
| 1 | Meine Geburtstag ist im Mai. | wrong | wrong |
| 1 | Ich bin im Mai Geburtstag. | wrong | wrong |
| 1 | Ich habe im Mai. | wrong | wrong |
| 1 | Mein Geburtstag ist im Juni. | wrong | wrong |
| 2 | Wir feiern am Freitag. Meine Mama und mein Papa kommen. | pass | correct |
| 2 | Am Freitag. Meine Mama und mein Papa. | pass | correct |
| 2 | ich feiere am freitag meine eltern kommen | pass | typo |
| 2 | Mein Fest ist am Freitag. Mein Papa und meine Mama kommen. | pass | correct |
| 2 | Am Freitag feiern wir, meine Mutter und mein Vater kommen | pass | typo |
| 2 | Wir feiern am Freitag. Ja, meine Mama und mein Papa kommen. | pass | correct |
| 2 | Das Fest ist am Freitag. Meine Mama kommt und mein Papa kommt. | pass | correct |
| 2 | Wir feiern am Freitag. Mein Mama und meine Papa kommen. | wrong | wrong |
| 2 | Wir feiern am Freitag. Mein Mama und mein Papa kommen. | wrong | wrong |
| 2 | Wir feiern am Freitag. Meine Mama und meine Papa kommen. | wrong | wrong |
| 2 | Wir feiern am Freitag. Meine Mama und mein Papa kommt. | wrong | wrong |
| 2 | Wir feiern am Freitag. Mama und Papa kommen. | wrong | wrong |
| 2 | Wir feiern im Freitag. Meine Mama und mein Papa kommen. | wrong | wrong |
| 2 | Wir feiern am Samstag. Meine Mama und mein Papa kommen. | wrong | wrong |
| 2 | Wir feiern am Freitag. | wrong | wrong |
| 2 | Meine Mama und mein Papa kommen. | wrong | wrong |
| 2 | Wir feiern am Freitag. Deine Mama und dein Papa kommen. | wrong | wrong |
| 2 | Freitag. Mama und Papa. | wrong | wrong |
| 2 | Wir feiern am Freitag. Meine Mama kommt. Mein Papa kommt. | wrong | correct |
| 2 | Mein Geburtstag ist im Mai. Wir feiern am Freitag. Ja, meine Mama und mein Papa kommen. | wrong | wrong |
| 3 | Mach's gut. Bis bald. | pass | correct |
| 3 | Mach's gut, Lena. Bis bald! | pass | correct |
| 3 | machs gut bis bald | pass | typo |
| 3 | Mach’s gut! Bis Freitag! | pass | correct |
| 3 | Schönen Tag noch, Lena. Bis bald! | pass | correct |
| 3 | Mach's gut und bis bald! | pass | typo |
| 3 | Mach's gut und schönen Tag noch! Bis bald! | pass | correct |
| 3 | Mach's gut. Bis später. | wrong | wrong |
| 3 | Auf Wiedersehen. Bis bald. | wrong | wrong |
| 3 | Tschüss. Bis bald. | wrong | wrong |
| 3 | Mach's gut. | wrong | wrong |
| 3 | Bis bald. | wrong | wrong |
| 3 | Mach gut. Bis bald. | wrong | wrong |
| 3 | Mach's gut. Bis morgen. | wrong | wrong |
| 3 | Schönen Tag. Bis bald. | wrong | wrong |
| 3 | Schöner Tag noch. Bis bald. | wrong | wrong |
| 3 | Mach's gut. Bis balt. | wrong | wrong |
| 3 | Bis bald! Mach's gut! | wrong | correct |
| 3 | Mach's gut! Bis bald, Lena! | wrong | correct |
| 3 | Mach's gut! Schönen Tag noch! Bis bald! | wrong | correct |
| 0 | Ich feiere am Freitag. Kommen Sie auch? | engine limit / explicit review | correct |
| 1 | Mein Geburtstag ist im Mai. Wir feiern am Freitag. | engine limit / explicit review | correct |
| 3 | Ja! Mach's gut, Lena. Bis bald! | engine limit / explicit review | correct |
| 3 | Tschüss, Lena! Mach's gut! Bis bald! | engine limit / explicit review | correct |
| 0 | Ich lade Sie ein. Bitte. | cumulative courtesy / missing-part regression | correct |
| 0 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 1 | Danke. Mein Geburtstag ist im Mai. | cumulative courtesy / missing-part regression | correct |
| 1 | Mein Geburtstag ist im Mai. Bitte. | cumulative courtesy / missing-part regression | correct |
| 1 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 2 | Danke. Wir feiern am Freitag. Meine Mama und mein Papa kommen. | cumulative courtesy / missing-part regression | correct |
| 2 | Wir feiern am Freitag. Meine Mama und mein Papa kommen. Bitte. | cumulative courtesy / missing-part regression | correct |
| 2 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |
| 3 | Danke. Mach's gut. Bis bald. | cumulative courtesy / missing-part regression | correct |
| 3 | Mach's gut. Bis bald. Bitte. | cumulative courtesy / missing-part regression | correct |
| 3 | Entschuldigung! | cumulative courtesy / missing-part regression | wrong |

## Content the course must add

These gaps were found in the writers' notes. Dialogues, Wortfeld, notices and can-dos were left
unchanged; the proofs retain the writers' chosen cue situations rather than inventing new lessons.

| Lesson | Required content correction |
| --- | --- |
| L3 | Model first-person Ich spreche … in input. Current re-teach shows Sie sprechen … about the parents. |
| L6 | Teach giving one's name on the phone; the proof currently reuses L1 heißen and a Telefon card. Also model a question about the office itself, not only its phone number. |
| L7 | Teach the irregular du liest before asking a learner to build that hobby question; retain taught alternatives meanwhile. |
| L8 | Model Wie spät ist es? with an actual time answer in lesson input. Also model an appointment agreement: current dialogue names availability without making an agreement. |
| L10 | Model Ich fahre … and the departure-time question in dialogue/input. The arrival question and yes/no destination question currently supply only pieces; ab is untaught. |
| L11 | Model when someone works in the present, e.g. Ich arbeite am Montag. The input supplies the separable-verb/time pattern and Ich habe gearbeitet, not this statement. Model a second learner-produced yesterday expression if the can-do is meant literally. |
| L12 | Model inviting the person addressed, rather than saying one invites a third party. Deliver a month set so learners can give their own birthday month: May is the only taught month now. |

Other boundaries: card-based personal-data tasks still use the writer's given identities/cues;
there is no claim to verify arbitrary untaught personal data. The notes' pending phonetics shapes
and the L10 dialogue/announcement ambiguities were not changed by this proof brief.

## Gates and remaining limits

| Gate | Final result |
| --- | --- |
| npm run lint | Pass; zero warnings |
| npm run check:duplicates | Pass, including the Astro curriculum twin |
| npm test | Pass: 312 test files, zero failures/skips |
| Focused judge/listening/rollout/legacy proof/path/guidance checks | Pass; existing assertions unchanged |
| build-lesson-pool.mjs a1.1 → validate-curriculum.mjs | Pass; generated pool unchanged |
| check-guided-draft.mjs 1 … 12 | All twelve pass |
| RULE 35 / 36 / 37 / 39 / 40 | 0 / 0 / 0 / 0 / 0 findings |
| RULE 38 | Two existing authoring advisories: L1 scene 1 (8/5/3 words), scene 3 (3/4/7); no new findings |
| node --check on every CI-listed Netlify function/shared module | Pass |
| Clean Vite build, app.html carve, offline Astro build | Pass |
| merge-site-builds.mjs → prerender-spa-routes.mjs → check-built-html.mjs dist | Pass: 151 pages, 146 sitemap URLs; zero failures and warnings |
| git diff --check | Pass |
| Source preservation | All twelve lessons equal HEAD outside proof; A1.2, protected files and all existing tests untouched |

RULE 38's literal zero request conflicts with the unchanged course: its two L1 findings were
already present, and guided-learning-quality.test.mjs explicitly asserts that existing findings
remain observable. That assertion wins; no question, assertion or threshold was weakened.

The normal offline Astro command initially failed because Vite tried to remove a cache directory
inside read-only symlinked node_modules. The successful build used the same Astro build API and
project config, with only cacheDir overrides to /tmp/dm-astro-vite7 and /tmp/dm-astro-cache7:

```js
import build from './astro-site/node_modules/astro/dist/core/build/index.js';
await build({
  root: new URL('./astro-site/', import.meta.url),
  vite: { cacheDir: '/tmp/dm-astro-vite7' },
  cacheDir: '/tmp/dm-astro-cache7'
});
```

Run with GRAMMAR_CONTENT_CACHE pointing to the repository's grammar-content-cache.json. The log
confirms "Using content cache"; all 143 Astro pages built. No config or dependency file was changed.
Vite empties dist before its build; the carve/merge/prerender/check sequence ran once on that fresh
output. Prerender was not applied twice to an existing build.

Browser screenshot verification could not run: the sandbox refuses local listen with EPERM, and
Chromium exits on its prohibited socket syscall before page launch. No screenshot or browser
hydration claim is made. The real rendered-component test covers listening controls and retrieval;
actual German-voice playback and viewport screenshots remain a browser-environment check.

Open: L2 live integration needs the existing no-proof assertion updated in a later authorized task;
the content corrections above remain a separate brief. L1's historical spoken spelling contract and
the two pre-existing RULE 38 authoring advisories remain as explicitly recorded exceptions.

## Claude's check (2026-11-14)

Gates re-run by Claude on the final tree from a clean `dist/`: pool build, validator, sync, all twelve
draft checks, lint, duplicates, `npm test` (3,064 of 3,064), SPA and offline Astro builds, merge,
prerender, built HTML (151 pages, 0 failures). Protected tests, `CLAUDE.md` and
`astro-site/package-lock.json` unchanged.

Answers the writers had reported as wrongly refused now pass (tried by Claude with
`try-proof-answer.mjs`): a leading „Danke.“, a trailing „Und Ihnen?“, „Ich heisse …“, „Bis bald, Lena!
Machs gut!“ in either order, „… Tee, bitte. Danke!“, „Ich spreche Arabisch. Ich spreche Deutsch.“
Wrong ones still fail („Tschüss. Bis bald.“, Sie forms in a du task), with a hint that names the part.

Changed by Claude after Codex's run:

- **Lektion 2's proof is merged too.** Codex left it out because `tests/course-path-lock.test.mjs`
  used Lektion 2 as its example of "a Lektion without a proof completes as before". The assertion is
  kept; its witness is now Lektion 2 with the proof taken off. All twelve Lektionen have a proof.
- **A missing German voice no longer locks a learner out.** Played in a browser without a German
  voice, the listening goal could never be answered (Check stays off until playback), and with the
  locked path that learner could never leave Lektion 1. In-app browsers often have no voice. Now
  the play control's failure state offers "Read it instead": the stimulus is shown, the answer is
  judged as usual, and the goal is recorded with the evidence flag `read-spelling` /
  `read-listening` instead of `heard-…`. The stimulus is still never shown while playback works.
  Regression test in `tests/proof-listening7.test.mjs`.

Played as a guest in a phone-sized browser without a German voice: Lektion 1's proof end to end
(hint, re-teach, own name, Play fails → "Read it instead" → the spelled name → goal 4 without
sentence marks), "Lesson complete", Lektion 2 opens by link, Lektion 3 stays locked.

Open:

- The proofs of Lektionen 2–12 were not played by hand (a guest cannot reach them without
  finishing the Lektionen before); they rest on the answer tables and the tests.
- No listening goal was heard: the test browser has no German voice.
- The recap does not yet say which goals were read rather than heard.
- "Content the course must add" (above) is not done.
