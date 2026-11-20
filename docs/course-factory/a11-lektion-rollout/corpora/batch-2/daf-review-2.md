1. **BLOCKER — Lektion 4, Turns 2 and 4, all sittings: valid price questions are missing.** The task does not require a complete sentence, and Turn 4 already accepts an elliptical question such as „Und der Stuhl?“. Add „Wie viel?“ to both turns. Also add these taught, plausible forms:

   | Sitting | Turn 2 | Turn 4 |
   |---|---|---|
   | 1 | „Die Uhr? Was kostet sie?“ | „Was kostet ein Stuhl?“ |
   | 2 | „Der Rucksack? Was kostet er?“ | „Was kostet eine Lampe?“ |
   | 3 | „Das Regal? Was kostet es?“ | „Was kostet ein Tisch?“ |

   Accept the corresponding „Wie viel kostet …?“ forms with the indefinite article. These are correct answers under the supplied tasks.

2. **BLOCKER — Lektion 5, Turn 2, sittings 2 and 3: the accepted „Das ist hier/da“ uses the wrong reference.** For the previously named **die Schere** and **der Stift**, the standard answers are „Sie ist …“ and „Er ist …“. With no pointing or other visual context, „Das“ should not receive credit as their replacement. Remove „Das ist hier.“ and „Das ist da.“ from those two sittings. Add „Die ist hier/da.“ for the scissors and „Der ist hier/da.“ for the pen. Keep the short answers „Hier.“ and „Da.“. Sitting 1’s neuter „Das“ can remain.

3. **BLOCKER — Lektion 5, Turn 4, all sittings: correct demonstrative answers are missing.** Add „Das ist …“ for the Heft, „Die ist …“ for the Tasche and „Der ist …“ for the Stift, with the same colour validation as the existing frames. For example, „Das ist grün.“ is a correct answer about the Heft; it must not fail because the list expects „Es“.

4. **BLOCKER — Lektion 6, Turn 4, all sittings: ordinary greeting-plus-name answers are missing.** The shared rules describe greeting removal for written messages, not generally for this turn. Explicitly accept, for example, „Guten Tag, ich bin [Name].“, „Hallo, ich heiße [Name].“ and „Guten Morgen, hier ist [Name].“ Apply taught, appropriate greetings consistently to the existing name frames. A learner should not fail because they combine two familiar, correct expressions.

5. **MAJOR — Lektion 4, Turns 3 and 5, all sittings: “write the price” permits more than the listed digits.** „18 Euro“, „18 €“ and „achtzehn Euro“ satisfy the task. Either accept equivalent price expressions or change both task versions to explicitly request digits only: **“Write only the number in digits.” / „Schreiben Sie nur die Zahl.“** If keeping the broader task, normalize equivalent prices without accepting a different amount, a range or alternatives. The supplied comments do not establish whether price normalization already handles this; this needs verification, rather than an assumption that the grader rejects every unlisted format.

6. **MAJOR — Lektion 6, Turns 5 and 6, all sittings: telephone spacing must not determine correctness.** „04215730“, „0421 5730“ and „0421-5730“ give the same number. Accept equivalent grouping for every sitting, while preserving every digit, its order and the initial zero. Do not accept „4215730“ or a changed digit. Arabic-Indic digits are already supported; retain that support. As with prices, the comments do not explicitly establish the treatment of grouping, so this is a required verification rather than a demonstrated runtime failure.

7. **MAJOR — Lektion 5, Turn 5, all sittings: the English task and accepted question types differ.** “Ask what colour…” requests an open question; „Ist deine Tasche rot?“ requests confirmation of one colour. Both are useful classroom questions, and the lesson teaches the latter pattern. Change the English cue to **“Ask Lena about the colour of her bag/pen/book.”** The German cue can remain. Also ensure that the taught alternative-question pattern works: „Ist dein Stift blau oder schwarz?“ must be accepted, not rejected because the colour gap contains „oder“.

8. **MAJOR — Lektion 4 Turn 6; Lektion 5 Turns 1, 4 and 5; Lektion 6 Turns 1 and 4: the open-gap rules remain insufficiently specified.** The supplied comments do not define the actual checks for `thing`, `object`, `color` and `name`. Consequently, they do not establish whether these turns reject malformed answers. This is an unresolved validation point, not evidence that a particular wrong answer currently passes.

   Before shipping, establish these exact expectations, alongside the stated first-round fixes:

   - Accept „Ich kaufe den Stuhl.“; reject „Ich kaufe der Stuhl.“
   - Accept „Ich brauche einen Computer.“; reject „Ich brauche ein Computer.“
   - Accept „Das ist eine Schere.“; reject „Das ist ein Schere.“
   - Accept „Es ist rot und blau.“ about the Heft; reject „Es ist teuer.“ as a colour answer.
   - Accept a plausible personal name, including a surname that is also a taught word; reject a greeting alone or „Ich heiße“ without a name.

   Validate the complete answer and every coordinated object or clause. Do not limit valid purchases or needs to the two objects in the example.

9. **MAJOR — Lektion 5 Turn 4 and Lektion 6 Turns 2–4: some repeat recommendations miss the skill that can cause failure.** For Lektion 5’s colour sentence, repeating only the words will not repair a pronoun or sentence-frame error. Recommend the colour exchanges in the scene as well; ideally distinguish vocabulary feedback from sentence feedback. For Lektion 6 can-do [3], add **Lektion 5’s scene** for „Wo ist …?“ alongside Lektion 6’s pause question. For Lektion 6 can-do [1], Lektion 1 repairs name introduction but offers no telephone practice: add a short telephone exchange in Lektion 6 and recommend that exchange.

10. **MINOR — Lektion 6, Turn 4, all sittings: make the telephone sequence clearer.** A caller can identify himself first, so the current exchange is possible. Nevertheless, the learner’s receiving-call task is clearer if ringing comes first and the learner answers. Replace the initial „Weber, guten Tag!“ with a ringing cue and use **“Your phone rings. Answer with your name.” / „Am Telefon: Sagen Sie Ihren Namen.“** Herr Weber can then speak. The existing first answer, „Ich heiße …“, remains an answerable beginner response.

11. **MINOR — Lektion 4, Turn 6, sittings 2 and 3: the examples ignore the current exchange.** Buying a chair and clock is not inherently wrong at this stall, but the repeated example suggests an unrelated transaction after the learner has discussed other objects. Use:

   - Sitting 2: „Ich kaufe den Rucksack und die Lampe.“
   - Sitting 3: „Ich kaufe das Regal und den Tisch.“

   These remain examples, not compulsory selections.

12. **MINOR — Lektion 5, Turns 1, 2 and 4, all sittings: distinguish imagined props from real personal possessions.** With nothing shown, Lena cannot visibly point to a particular item. Nor will every learner own a Wörterbuch or Heft. Make the role-play assumption explicit in the instruction language: **“Imagine you have these things with you.”** For Turn 1, use **“Choose something from your bag. Lena asks what it is. Answer in one sentence.”** Keep the answer open; do not require the example’s dictionary or possessive.

13. **MAJOR — All three checks, recurring task instructions: ensure learners understand the procedure before scoring.** Expressions such as „mit einem Satz“, „Schreiben Sie“ and „Fragen Sie nach …“ are not established as instruction language in the supplied course history. English cannot be assumed to explain them to Arabic-speaking learners. Introduce these recurring instructions in an ungraded practice step, with accessible explanation or audio in the learner’s instruction language. This should explain the procedure without supplying the target answer.

14. **NOTE — All sittings, remaining turn checks: the core progression and register are sound.** Lektion 4 Turn 1, Lektion 5 Turn 3, and Lektion 6 Turns 2 and 3 have straightforward answers built from taught material. Across all turns, the first accepted sentence frames and partner lines do not require a new German structure to produce the intended answer. Extra accepted variants such as „Ich nehme …“ need not themselves have been taught. The Sie/du distinction fits the partners, and the German cues do not supply a complete target answer. The chair-price cue’s removed article is an appropriate first-round fix.

15. **NOTE — All checks, can-do coverage and listening content: the overall design can remain.** Every can-do receives a relevant task. Lektion 4’s identification-plus-price sequence and separate price question overlap reasonably; the spoken totals avoid an unintended arithmetic test. Lektion 5 samples naming, location, colour and classroom questions. Lektion 6 samples needs, office and break questions, telephone introduction and both number types. All stated listening targets match their listed numbers. Apart from finding 9, the repeat recommendations fit the taught material. There is no need to introduce formal Akkusativ or Dativ explanations into these checks.

Overall verdict: Lektion 4 — fix first; Lektion 5 — fix first; Lektion 6 — fix first.