1. **BLOCKER — All spoken turns: the fallback without a transcript can pass wrong answers.** Recognising an opening plus “something” does not establish that an own answer is correct: “Ich brauche müde” could pass. Recognising 80% of a fixed answer can also miss a decisive error. **Fix:** require a gradable transcript for correctness. If recognition fails, offer another recording or typing without marking the learner correct or wrong.

2. **MAJOR — Lektion 4 T5; Lektion 5 T1, T4–5; Lektion 6 T1, T4, all sittings: gap validation is insufficiently specified.** The supplied comments do not establish how `thing`, `object`, `color` and `name` distinguish correct completions from wrong ones. This is an uncertainty, not a demonstrated implementation bug. **Fix:** explicitly require a complete, meaningful answer with the appropriate grammar. Accept “Das ist Papier” and “Ich brauche einen Computer”; reject “Das sind ein Stift” and “Ich brauche teuer.” Accept varied real names, including single names and surnames such as **Braun**, which is also a taught colour.

3. **NOTE — Lektion 4 T1, all sittings: suitable as written.** The question is taught, the imagined stall situation is sufficient, and the German instruction does not supply the answer. The checker’s stated handling of greetings, names and *bitte* covers ordinary polite additions. **Fix:** none.

4. **MAJOR — Lektion 4 T2 and T4, all sittings: correct price questions are missing.** A learner can plausibly use taught **teuer**: “Wie teuer ist die Uhr?” T4 also omits pronoun questions, although the task has identified the object. **Fix:** add:
   - T2: “Wie teuer ist sie/er/es?” and “Wie teuer ist die Uhr/der Rucksack/das Regal?”
   - T4: “Was kostet er/sie?”, “Wie viel kostet er/sie?” and “Wie teuer ist der Stuhl/die Lampe/der Tisch?”

   Use the appropriate gender in each sitting. The existing elliptical questions such as “Und der Stuhl?” are natural in this price conversation.

5. **MAJOR — Lektion 4 T3 and T6, all sittings: the listed answers are narrower than the instruction.** “18 Euro”, “18 €” and “achtzehn Euro” correctly write down the price. Only bare digits are listed; broader handling is not established by the comments. **Fix:** explicitly accept the correct amount with optional currency, both in digits and in correctly written number words. Preserve exact numerical correctness.

6. **MAJOR — Lektion 4 T5–6, all sittings: an unrestricted purchase cannot have a predetermined total.** The learner might buy only the Uhr, yet Frau Wolf then announces a fixed total unrelated to that choice. **Fix:** put the total-listening turn **before** the purchase statement and make its referent explicit:
   - Sitting 1: “Der Stuhl und die Uhr kosten zusammen dreißig Euro.”
   - Sitting 2: “Die Lampe und der Rucksack kosten zusammen siebenundfünfzig Euro.”
   - Sitting 3: “Der Tisch und das Regal kosten zusammen vierundachtzig Euro.”

   Ask the learner to write that combined price. Afterwards, ask what they buy.

7. **MINOR — Lektion 4 remediation, can-do [1]: the article section is not the main remedy for asking a price.** The scene directly teaches the needed questions. **Fix:** change [1] to **“Part 1: the scene.”** Keep the article section for [3], where **den Stuhl** matters. The listening recommendation for [2] is appropriate.

8. **MINOR — Lektion 5 T1, all sittings: the singular task and plural acceptance do not quite match.** The task specifies “eine Sache”, but accepts “Das sind …”. No visible object determines what the learner must name, so the answer must remain their choice. **Fix:** use **“Lena zeigt auf etwas in Ihrer Tasche. Sagen Sie mit einem Satz, was das ist.”** Accept a suitable singular, plural or mass-noun answer, with matching grammar; do not require the example’s Wörterbuch.

9. **MAJOR — Lektion 5 T2, all sittings: a familiar correct answer is missing.** “Das ist hier” and “Das ist da” can naturally refer back to the named object. Neither the listed pronoun replacements nor word-order normalisation supplies this alternative. **Fix:** add both answers. Keep the existing noun replacements and short “Hier”/“Da” answers.

10. **NOTE — Lektion 5 T3, all sittings: suitable as written.** The objects and question pattern are taught, and both possessive and definite-article versions are accepted. English *scissors* correctly corresponds to German singular **die Schere**. **Fix:** none; retain **“Wo ist meine Schere?”**, not a German plural copied from English.

11. **MAJOR — Lektion 5 T4–5, all sittings: colour answers need broader, explicit coverage.** Real belongings can have more than one colour. T5 also excludes the definite-article version of the yes/no question, although that pattern is directly modelled in the scene. **Fix:** accept grammatical combinations such as “Es ist rot und blau” and questions such as “Ist die Tasche rot?”, “Ist der Stift blau oder schwarz?” and “Ist das Buch grün?” Accept other correctly named colours when volunteered; do not require untaught colours.

12. **MINOR — Lektion 5 remediation, can-do [0]: repeating articles alone does not repair missing object vocabulary.** **Fix:** change [0] to **“Part 1: the words + Part 2: der, die, das.”** The recommendations for location questions, colours and classroom questions are appropriate.

13. **NOTE — Lektion 6 T1 and T3, all sittings: answerable with the teaching provided.** **“Ich brauche einen Computer …”** and **“Wann ist die Pause?”** are directly prepared. The additional accepted expressions introduce no requirement to produce untaught German. **Fix:** none to the first models; retain validation of the complete need statement.

14. **MAJOR — Lektion 6 T2, all sittings: a different question is explicitly accepted.** “Ist das mein Büro?” asks for confirmation of ownership, not where the office is. “Und mein Büro?” does not reliably establish the requested location question either. **Fix:** remove both from this item. Keep “Wo ist mein Büro?” and “Wo ist das Büro?” The location pattern is transferable from Lektion 5.

15. **MINOR — Lektion 6 T4, all sittings: answerable, but the first model foregrounds an unpractised telephone routine.** Learners have practised **“Ich heiße …”**; they have not seen a telephone exchange using **“Hier ist …”**. **Fix:** put **“Ich heiße …”** first and use **“Guten Tag, ich heiße Ana Chakiri”** as the example. Keep the other correct introductions accepted. Repeating Lektion 1’s scene then fits the assessed skill. A bare own name is also a natural telephone response.

16. **MAJOR — Lektion 6 T5–6, all sittings: spacing must not determine correctness.** The audio and all six supplied number keys agree, but the comments do not establish whether alternative grouping is accepted. **Fix:** explicitly compare the complete digit sequence after normalising spacing and ordinary phone-number separators. For example, **04215730**, **0421 5730** and **0421 / 5730** must agree; a missing leading zero or changed digit must fail. Retain the stated Arabic-Indic digit support.

17. **MINOR — Instructions across the checks: some German task language is harder than the assessed response.** Examples include **“Sie möchten …”** in Lektion 4, the subordinate clause in Lektion 5 T1, and **“ruft an”** in Lektion 6 T4. English does not necessarily support the intended learners. **Fix:** provide instructions in the learner’s selected support language, including Arabic, and simplify German where possible—for example, **“Stuhl: Fragen Sie nach dem Preis.”** Question-word hints such as **wo** and **wann** are reasonable scaffolding; they do not supply the whole answer.

18. **NOTE — Coverage, register and retakes across all three checks: broadly sound.** Every listed can-do receives a relevant task. Sie with Frau Wolf/Herr Weber and du with Lena fit. The changed prices, objects and telephone numbers provide useful retake variation. **Fix:** retain these choices. For Lektion 6, the remaining repeat recommendations fit once the office question and name model are corrected.

**Course team’s question: No to the current blanket rule.** A taught opening verb does not make the second clause correct: “Ich spreche Arabisch und bin Studentin Deutsch” must not pass. Accept an additional clause only when the **whole answer** is valid and answers the task. “Ich spreche Arabisch und lerne Deutsch” is valid, although **lernen** is not taught in the supplied material; that is no reason to reject a correct volunteered answer.

**Overall verdict: Lektion 4 — fix first; Lektion 5 — fix first; Lektion 6 — fix first.**