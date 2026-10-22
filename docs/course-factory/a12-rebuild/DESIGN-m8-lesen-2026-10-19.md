# M8 Lesen — Codex design verdicts (2026-10-19)

Two consultations after DaF review #11 (MAJOR M8). The first chose the item design and froze the closure gate for review #12; the second chose new authored texts over dialogue windows and set the bank size. Both are quoted as Codex returned them; the prompts follow each.

## Verdict 1 — the item design and the frozen gate

**Verdict: choose E—a small, authored mix of person and detail questions with genuinely competing information. Do not mechanically convert the existing items to B.** I verified `7c6f37e`, reproduced **64/64 sentence-overlap successes**, and changed no files.

**1. Format and validity**

B is **not worthless**. Finding a relevant statement and assigning *ich* to its speaker is legitimate elementary reading. But here, making that the entire section transfers the shortcut from **answer → sentence** to **question → sentence → speaker**.

My additional in-memory probe compared question-predicate tokens with each speaker’s closest sentence:

| Checkpoint | Eligible subject-report lines¹ | Candidate window/report combinations: wins / ties / losses |
|---|---:|---:|
| CP1 | 7 | 27 / 0 / 0 |
| CP2 | 6 | 24 / 2 / 0 |
| CP3 | 6 | 28 / 0 / 0 |
| CP4 | 11 | 53 / 0 / 0 |

¹The supplied counts include possessive reports: *Meine Schule*, *Mein Hals*, *Mein Onkel*. Their subjects are not the speakers. CP3 also has two reports in one line.

Furthermore, **all seven CP1 subject-report lines belong to Ana**; CP4 has ten Ana lines and one Lena line. Option shuffling cannot repair that.

My judgment on the alternatives:

- **A:** Valid detail reading when both options are plausible answers and the reader must associate the correct value with its referent. The existing **3/1/2/0** supply cannot support four items per checkpoint; those counts also precede window conflicts and dictation exclusions.
- **B:** Valid narrow attribution practice; **insufficient unchanged for M8 closure**.
- **C:** Sensible ingredients, but “B everywhere, A when available” inherits B’s problem, particularly in CP4.
- **D:** Authored paraphrases can help. However, **always making the paraphrase correct creates the inverse shortcut: choose the less similar option**. Automatic synonym substitution is also unsafe for meaning and teaching horizon.
- **E, recommended:** Author questions and competing relations together. Use B and A where suitable, including nonnumeric details. Both speakers or both candidate details should participate in relevant information; distinguish them through attribution, polarity, object, destination or another taught relation. **One shared content word is not sufficient.**

This is a course-checkpoint design judgment, not a claim that these four questions reproduce the Goethe examination. The official model uses several text types and task formats. [Goethe A1 model: Lesen](https://bfu.goethe.de/a1_sd1/lesen.php)

**German:** *Wer braucht …? Wer wohnt nicht hier? Wer hat Kuchen?* are natural. Automatic replacement is not always valid:

- *Den Pullover zieht Ana morgen an* needs **Wer zieht den Pullover morgen an?**
- *Mein Hals tut weh* cannot yield **Wer tut weh?**
- Preserve necessary quantities, complements, tense, modality and separable particles.
- Exclude unresolved *du/Sie*, *wir*, quoted *ich*, unclear referents, and windows supporting both options—including *ich auch*.
- *Wer* normally takes third-person singular; plural answers are grammatically possible, but unsuitable for this proposed single-person choice format.

**2. Review #12 closure gate**

I would freeze the following **project acceptance gate before implementation**. It is not a Goethe-prescribed statistical standard.

Run every strategy on **each of the 16 papers**, using only information visible before answering. Keys enter only afterward for scoring.

| Family | Required strategies | Maximum |
|---|---|---|
| Review #11 | **Zahl:** matching number tokens; **Wörter:** matching tokens; **Anteil:** matching-token fraction; **Satznähe:** maximum fraction against one sentence; **Verbform:** matching finite forms. Test both greater and lesser preference. | **2/4 per paper; 32/64 total**, separately for every strategy |
| Answer presentation | Always A/B; longer/shorter by characters and tokens; larger/smaller number; alphabetical order; negated/nonnegated answer. | Same |
| Speaker shortcuts | First/last speaker; most/fewest turns; most/fewest spoken words; name occurrence frequency with and without speaker labels; name mentioned in the body; **fixed name-priority orders**, not merely “always Ana.” | Same |
| Question-conditioned shortcuts | Speaker of the sentence closest to the question, by count and fraction; maximum and minimum; literal and taught-verb-normalized forms; with and without function words. For A, first/last candidate value and simple distance to question-matching words. | Same |
| Simple combinations | Predeclared one-condition switches between those rules using negation, *Ja/Doch*, *Nein*, question mark, number presence and item format. | Same |

Use review #11’s lowercase Unicode tokenization. **Ties score ½**, but also run deterministic tie-breaks A and B, and first/last occurrence where applicable. Report decisive successes, errors and ties separately.

These limits apply to the declared **surface strategies**. An algorithm that actually resolves subject, negation scope or the requested value–referent relationship may succeed completely; that is the intended operation. No finite heuristic battery proves comprehension.

Required tests:

- An independent audit over **all 64 delivered items**, without importing `optionProfile`, candidate rankings or generator answer annotations.
- An independently reviewed semantic fixture: grammatical question, taught language, unique text-supported answer, evidence and exclusion rationale.
- Full-paper checks for four items, window disjointness, dictation exclusion, reproducibility and **no silent fallback**.
- Mutation tests planting each leak family: all keys at A; all Ana; first-speaker bias; body-name bias; literal-key overlap; inverse paraphrase bias; question-to-speaker overlap; and a conditional leak whose aggregate looks balanced.
- Semantic mutations creating two valid answers, an unresolved pronoun, an invalid possessive-to-*Wer* conversion and an untaught form.
- At least one balanced positive control. A detector that rejects everything is not a safeguard.

For question answering, require **one uniquely supported answer**. Do not infer that another person lacks cake merely because the text says nothing about their cake. This explicitly differs from review #11’s truth/falsity requirement for competing statements.

**3. Content and quantity**

**Yes, edits are needed for the recommended robust design.** Start with **16 approved item/window templates—four per checkpoint**. They can recur across rounds; 64 placements do not require 64 separately edited passages.

For **B-only**, the fixed-name-priority gate already requires at least **2 / 1 / 2 / 1 new or reworked eligible self-report lines** across CP1–CP4: **six source-line changes before addressing question overlap**. That is a lower bound, not a sufficient repair.

The further edits should introduce natural competing relations, distribute useful self-reports across speakers, and make the selected windows self-contained. **An exact minimal line-edit count for E is not established**: it requires selecting and annotating the actual nonoverlapping windows alongside dictation. The material counts cannot supply that number honestly.

**4. Pitfalls to test early**

- **Repeated-name scoring:** current [`guessCeiling`](C:/Users/zaid1/deutschmeister-a12/src/lib/checkpoint/buildCheckpoint.js:2943) counts identical answer text. Four Ana keys produce a ceiling of four; even perfect answers then fail.
- **Names balanced globally, roles unbalanced locally:** “Tim whenever offered, otherwise Ana” can still solve a paper.
- **Counting sentences as independent lines:** two reports from one line cannot supply two disjoint items.
- **Manufactured dialogue:** adding irrelevant self-disclosures solely to balance speakers can damage naturalness.
- **Question simplification:** deleting a quantity or qualifier may make both answers correct.
- **Old fallback and contradiction logic:** prove the negated-event falsifier is unreachable for the new A1.2 path, or repair and test it; changing the visible format alone does not close that half of M8.
- **Displayed option order and explanations:** audit the order learners actually see, and ensure explanatory answer cues appear only after submission.

**Recommendation: author and audit 16 contrastive B/A item–window templates first; approve the generator only after those templates pass the declared surface and semantic gates.**

### Prompt used

```text
You are the DaF teacher and Goethe-Zertifikat A1 examiner who wrote the A1.2 reviews, most recently C:\Users\zaid1\deutschmeister-a12\docs\course-factory\a12-rebuild\REVIEW-daf-11-2026-10-19.md. I need your DESIGN VERDICT before I build anything. Read-only: do not modify any file. Read files by their ABSOLUTE paths (you start in another folder); the course checkout is C:\Users\zaid1\deutschmeister-a12 (branch claude/a12-rebuild, commit 7c6f37e).

THE PROBLEM (your review #11, MAJOR M8). Each A1.2 checkpoint paper has a Lesen section of 4 items, built by C:\Users\zaid1\deutschmeister-a12\src\lib\checkpoint\buildCheckpoint.js (chooseLesenChoice, lesenChoiceItem, optionProfile, windowReports, contradictions). Each item prints one 2–3-line dialogue window of the chapter and asks „Was steht im Text?" between the true report of one first-person line („Ich habe drei Stück Kuchen." → „Ana hat drei Stück Kuchen.") and its one-word falsification. You measured that a sentence-wise token-overlap strategy solves 64/64 items and every paper 4/4. That follows from the construction: the key matches its source sentence except for the person/verb change, and the distractor differs from it in one more word.

CONSTRAINTS (measured on the commit):
- Only FIRST-PERSON lines are reported (a third-person line would stand verbatim in the text, which review #9 ruled out as a statement). The chapter of a checkpoint is 3 Lektionen of about 10 dialogue lines each; reportable lines per checkpoint: cp1 8, cp2 7, cp3 7, cp4 11.
- 16 papers (4 checkpoints × rounds 0–3), 4 Lesen items each, windows may not share a line within a paper, and a dictated line is never reprinted.
- Content edits to the dialogues are possible (no audio exists yet for A1.2), but every new word must be taught by then and the German must be natural; round 11b already edited three L3 lines.
- Material for two candidate formats, counted per checkpoint (cp1/cp2/cp3/cp4):
  A. W-question with two options that BOTH stand in the text („Was braucht Ana für das Museum? — zehn Euro / zwölf Euro"; the distractor is a value the same window states for something else): reportable value lines whose window states a second value of the same kind: 3 / 1 / 2 / 0.
  B. Person question with the window's two speakers as options („Wer braucht zwei Zimmer? — Ana / Herr Berg"; the question is the report with „Wer" for the subject, the verb in the 3rd person singular): reportable first-person lines in a window with exactly two speakers: 8 / 7 / 7 / 11; of those, a window where the OTHER speaker's line shares a content word of the question exists for 3 / 3 / 1 / 2.
- Other candidates I see: C. B everywhere, A where the material allows; D. keep two statements but make the key a paraphrase and the distractor the literal-looking one; E. something you consider better.

WHAT I NEED, in German or English, concise:
1. VERDICT: which format (or mix) is a valid A1.2 reading task here, closes the overlap class you measured, and can be built from this material — and why the others fail. Judge B honestly: does „Wer …?" between two speaker names test reading (mapping ich → speaker, finding the line), or is „the speaker of the line most similar to the question" a shortcut that makes it worthless? Is a Wer-question formed from a report always natural German (Wer braucht …? Wer wohnt nicht hier? Wer hat Kuchen?), and what must be excluded (e.g. lines where both speakers could be the subject, du/Sie lines, plural)?
2. THE CLOSURE GATE you will apply in review #12: the exact strategies to run per paper (your five from review #11 at least — Zahl, Wörter, Anteil, Satznähe, Verbform — plus any the new format needs, e.g. first/last speaker, the speaker who speaks more, the name mentioned in the text body), what each may score (per paper and in total), and the test that must exist (including mutation tests that plant a leak).
3. CONTENT: whether dialogue edits are needed for the chosen format, how many, and which kind (not the lines themselves).
4. PITFALLS you expect, so I can test them before review #12.
End with a one-line recommendation.
```

## Verdict 2 — new authored texts, 16 units per checkpoint

**Use new authored texts for the assessed Lesen section**, including newly written short dialogues where appropriate.

1. **Design.** New texts better serve this course’s transfer objective: familiar language and situations, but unfamiliar information to understand. They also allow natural competing details without reopening approved lesson dialogues. Messages, advertisements and notices fit the range illustrated in the [Goethe A1 model](https://bfu.goethe.de/a1_sd1/lesen.php), though these checkpoints remain course assessments.

   Control three risks: **untaught language** through both validation and human checks of meanings, forms and constructions; **manufactured texts** through a plausible communicative purpose and natural German; **unfamiliar conventions** by using previously demonstrated text types or introducing a separate practice example beforehand. A lesson about an advertisement does not itself establish familiarity with reading advertisements. Apply the teaching horizon to the text, question, options and labels—not just the passage.

2. **Closure gate.** Keep the frozen surface-strategy battery, thresholds (**≤2/4 per paper; ≤32/64 across the 16 papers**), tie handling, independent auditing, mutation tests and positive control. These remain project acceptance criteria, not Goethe standards. Adapt the following:
   
   - Extend speaker shortcuts to first/last named person, most/least frequent name, sender/addressee/signature, first/last candidate detail and position in headings or lists. Retain speaker rules for exchanges.
   - Replace source-window disjointness and dialogue-line dictation exclusions with checks for distinct assessment texts, prior exposure, substantial copying from practice, and answers revealed by other items.
   - Retain reproducibility, four-item completeness, displayed-option auditing and no silent fallback. The old faulty contradiction generator must remain unreachable or be repaired.
   
   Approve complete four-item papers; arbitrary draws from an approved bank can still break the per-paper gate.

3. **Retakes.** Four repeated questions with reordered options are **not sufficient for four transfer attempts**. I revise my earlier allowance for recurrence accordingly. For rounds 0–3 to each provide four unseen items, require **16 distinct, independently reviewed text–question units per checkpoint: 64 overall**, arranged into four disjoint, comparable papers. Track exposure so an attempt receives an unused paper.

   **Eight per checkpoint supports an initial paper and one wholly fresh retake.** Subsequent reuse can serve practice, but cannot substantiate four fresh transfer measurements. Renaming people or changing numbers alone does not create an independent transfer item.

4. **Independent semantic review, item by item.** The reviewer should solve the item before seeing the proposed key, then record:
   
   - The unique supported answer, exact textual evidence and why each alternative fails to answer this question. Relevant competing information must require an actual relation to be understood.
   - Correct attribution, pronoun reference, possession, negation scope, time, modality and quantities; no missing context, world knowledge or remembered character facts.
   - Natural German, appropriate register, grammatical questions and parallel answer options; a credible purpose and familiar text conventions.
   - Teaching evidence for vocabulary **in its used meaning**, forms and constructions throughout every visible component.
   - Plausible distractors, absence of incidental answer cues, suitable reading load, and an explanation consistent with the text.

   For question answering, require unique textual support; do not turn silence about another person into a claim that something is false.

**Recommendation: author new, familiar-format texts and 16 distinct items per checkpoint for four fresh rounds, retaining the frozen gate with the adaptations above.**

### Prompt used

```text
You are the DaF teacher and Goethe-Zertifikat A1 examiner who wrote the A1.2 reviews (latest: C:\Users\zaid1\deutschmeister-a12\docs\course-factory\a12-rebuild\REVIEW-daf-11-2026-10-19.md). Read-only: modify no file. Read files by ABSOLUTE path.

An hour ago you gave this design verdict for the A1.2 checkpoint Lesen section (your MAJOR M8): C:\Users\zaid1\AppData\Local\Temp\claude\C--Users-zaid1-deutschmeister\d70bcaf1-9934-4cc2-9df5-c22b377a6b3a\scratchpad\codex-design12\verdict.md — read it first. In short: author 16 contrastive item templates (4 per checkpoint), person (Wer …?) and detail questions with genuinely competing information, and a closure gate you froze there.

ONE FOLLOW-UP QUESTION before I author anything. Your verdict builds each item on a WINDOW of the Lektion dialogues (C:\Users\zaid1\deutschmeister-a12\src\data\curricula\a12.js). The alternative I am weighing: each checkpoint item prints a NEW short authored text instead — a note, a message, a small ad or notice, or a 3–4-line exchange — set in the chapter's situations and written only with what the chapter has taught (words, forms, constructions; the course's validator checks that). Reasons: (1) the learner has practised the dialogues line by line (dictation, read-aloud, lesson items), so re-reading them partly measures memory, while a new text measures reading transfer — the project's checkpoints are meant to measure transfer; (2) competing information can be designed in from the start instead of edited into dialogues that eleven reviews have already approved; (3) no window-disjointness or dictation-exclusion constraints; (4) the Goethe A1 model uses several short text types.

Answer concisely:
1. Which is the better design for this course — dialogue windows, new authored texts, or a mix — and why? Name the risks of new texts (e.g. untaught language, unnatural texts, a text type the chapter never showed) and what rules would control them.
2. Does your frozen closure gate stand unchanged for new texts, or what changes (e.g. the speaker shortcuts become "first/last named person", "person named most often")?
3. Retakes: each checkpoint has rounds 0–3 drawn per attempt. With 4 templates per checkpoint every round shows the same 4 questions (options reordered). Acceptable, or how many per checkpoint do you require (e.g. 8, drawn 4 per paper), given the transfer concern?
4. What must the independent semantic review of the authored items check, item by item?
End with a one-line recommendation.
```
