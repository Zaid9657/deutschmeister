# Batch 2 live course fixes — 2026-10-25

Status: Item 1 re-authored after the supervisor rejection. All 64 replacement texts, the revised declared-strategy gate and template guards pass automated checks. Blind semantic review remains **pending**. Items 2–3 implementation and their report sections are retained. Across 74 affected test files: **1157 tests, 1141 pass, 15 baseline failures, 1 pending-review TODO**. This is not an all-green release claim.

## Exit proof

Run both curriculum validators, both determinacy checks, both Lesen checks, duplicate verification, every affected test file and the new tests, and ESLint with zero warnings on every changed JavaScript file. Every A1.1 text must contain 15–45 words, use the checkpoint's taught lexicon and constructions, avoid practised sentences, and have evidence and an authored exclusion rationale. Each paper mixes messages, an ad and a sign/notice and balances Richtig/Falsch 2/2. Only the supervisor's declared strategies are acceptance gates: ≤2/4 per paper and ≤36/64 over the bank. Broad feature × order and feature-pair × order results are reported, without a new ratchet. Skeletons may occur twice bank-wide but never twice in a paper; sentence-initial “nur + number/adjective” must fail. The engine, round serving and the honest pending review fixture remain intact.

No network, database, commit, push, checkout, reset, A1.1 dialogue changes, ratchet increases or writes under `.fablize/`. The two pre-existing untracked batch-1 ledger files remain alone. No goal ledger was created.

## Investigation and baseline

The rejected bank reproduced the quality problem despite its old automated PASS: 64 explicitly authored rows used the same “nur” assignment device, and the checker imposed feature × order and feature-pair × order limits as hard gates. This made a passing surface metric insufficient evidence of reading quality.

Competing explanations: (1) engine duplication — rejected: the source contains 64 separate texts and the engine serves each authored id/text unchanged; rounds 0–7 still pass. (2) the taught lexicon necessarily requires the artificial inversion — rejected: the replacement texts pass the same lexicon plus the validator's deferred-construction checks. (3) the overbroad gate constrained authoring without guarding templates — supported by the old all-family pass/fail loop and the repeated source device, matching the supervisor's causal assessment. The fix changes both the bank and the acceptance model, and adds a planted repeated-template failure.

The old A1.1 `constructionHorizonIndex` call returns zero because A1.1 does not opt into that A1.2 horizon. The checker now additionally calls the validator's shared `deferredConstructionHits`; early possessives and a premature separable construction were removed from the draft. No vocabulary or construction limit was expanded.

The full suite then exposed older invariants that the first draft violated: text-negation shortcuts and a phrase overlapping a Hören dictation. Text edits fixed both without changing the old tests or ratchets. The new reading text also reseated one live pool exercise. That forced a narrow change in `tests/lesson-extra-items.test.mjs`: the original exact historical-seat assertion still checks its legacy/historical cohort, while a separate assertion pins all current seats. Every item in both cohorts still goes through the same word-order checker assertions. Items 2–3 source code and the dialogues were not changed by this revision.

The earlier batch-2 investigation remains applicable: Hören reused targets as distractors before rendering, and feedback alone did not explain the leak. The shared draw caused overlapping sets; missing dialogue data and checker failure did not explain missing tiles, while the frame recognizer and whole-turn selection did. Measurements and fixes for those accepted items remain below.

## 1. Authored A1.1 Lesen

Each of the 16 papers contains two personal messages, one offer/ad and one notice/sign. Checkpoint 1 uses introductions, family/contact updates, form and postal notices, and language-exchange offers within its narrow vocabulary. Later papers add sales, appointments, cancellations, food offers, opening hours, travel and celebrations. Text lengths are **18–31 words**. These are original course texts modelled on the three Start Deutsch 1 Lesen text formats specified by the supervisor; no external material was fetched.

Each unit retains `Steht das im Text? „…“`, the Richtig/Falsch labels, an authored key, a verbatim evidence span and an English explanation of the competing information. Falsch items contradict an explicit fact or denial, rather than relying on an absent detail. These are author judgments, **not invented blind-review results**.

The 14 declared predictions are constant Richtig/Falsch; number → Falsch and inverse; negation → Falsch and inverse; all statement words in the text → Richtig and inverse; overlap above the paper median and inverse; overlap below the paper median and inverse; and statement length above the paper median and inverse. Tokens are case-folded; overlap counts matching statement tokens divided by statement length. The median of four values is the mean of the middle two; comparisons are strict, so equality takes the false branch and the inverse reverses that branch too. Predictions are computed before keys are read.

Observed: **every strategy 2/4 in every paper and 32/64 over the bank; keys 2/2 in every paper**. The broad diagnostics are **50/64 feature × order, 50/64 feature-pair × order, and at most 7/16 whole papers**. These are reported only. The worst reported pair family is `Zahl+ + Aussage wörtlich+ × position`; its rule is `T/0:A, T/1:B; 1:feature, 2:feature, 3:feature, 4:feature`. A1.2's shared gate and pre-existing ratchets are unchanged.

The deterministic skeleton removes salutations, signatures and short headings, preserves a fixed function-word inventory and sentence boundaries, and maps all other tokens—including verbs, nouns, adjectives, names and numbers—to X. There are **64 distinct skeletons, maximum repetition 1**, and no forbidden “nur + number/adjective” sentence opening. It is a coarse anti-template guard, not a linguistic parser or proof of semantic quality.

Tests retain the planted constant/numeric/negation/literal/missing-token/order/pair leaks, add inverse checks and median-overlap/length leaks, and require a 64-unit template mutation to fail. Separate probes check the bank-wide twice limit, the within-paper uniqueness rule, numeral/adjective openings, length, genre mix, practised sentences and deferred constructions. Order/pair mutations remain visible in diagnostics and do not become undeclared acceptance limits.

Round serving is unchanged, including all four papers over rounds 0–7 and malformed-bank refusal. The fixture `tests/fixtures/a11-lesen-review.json` remains `status: "pending"`, `reviewedOn: null`, `units: []`. It is loaded outside the TODO test, so deleting it fails file loading. The supervisor must supply the independent semantic review.

All 64 units follow. Keys are author keys.

| id | type | text | statement | key |
| --- | --- | --- | --- | --- |
| a11-cp1-p1-u1 | message | Hallo Lena, Ana wohnt in Berlin. Ihre Eltern wohnen auch hier. Ich wohne in Bremen. Kommst du auch nach Bremen? Grüße, Tim | Ana wohnt in Berlin. | Richtig |
| a11-cp1-p1-u2 | message | Frau Kaya, guten Morgen! Tim kommt aus Polen und wohnt in Köln. Die Familie von Tim wohnt in Bremen. Grüße, Herr Berg | Tim wohnt in Bremen. | Falsch |
| a11-cp1-p1-u3 | sign | Amt: Herr Weber ist hier. Frau Kaya ist nicht hier. Formulare bitte hier ausfüllen: Name, Adresse und Familienstand. | Herr Weber ist hier. | Richtig |
| a11-cp1-p1-u4 | ad | Englisch mit Lena! Lena spricht Englisch, aber nicht Deutsch. Sprichst du Deutsch und auch Englisch? Wir sprechen zusammen! Telefonnummer: null eins sieben drei. | Lena spricht auch Deutsch. | Falsch |
| a11-cp1-p2-u1 | ad | Deutsch mit Frau Wolf! Frau Wolf ist Lehrerin aus Österreich, nicht Studentin. Sie spricht auch Arabisch. Sie wohnen in Köln? Frau Wolf wohnt hier. Telefonnummer: drei fünf zwei. | Frau Wolf ist Studentin. | Falsch |
| a11-cp1-p2-u2 | message | Hallo Paul, Ali ist acht, Lena ist schon zehn. Die Kinder sprechen Deutsch und Englisch. Wie alt ist die Tochter von Frau Kaya? Grüße, Thomas | Ali ist schon zehn. | Falsch |
| a11-cp1-p2-u3 | notice | Frau Berger ist verheiratet und wohnt in Bremen. Bitte für das Formular nicht die Adresse von Frau Wolf: Sie wohnt in Berlin. | Frau Berger ist verheiratet. | Richtig |
| a11-cp1-p2-u4 | message | Guten Abend, Lena! Paul ist schon zehn. Er spricht Deutsch und Englisch. Die Schwester von Paul ist acht und spricht Deutsch. Grüße, Ana | Paul ist schon zehn. | Richtig |
| a11-cp1-p3-u1 | message | Hallo Ali! Lena wohnt in Polen. Thomas und ich wohnen nicht in Polen, wir wohnen in Berlin. Kommst du auch nach Berlin? Grüße, Paul | Lena wohnt in Polen. | Richtig |
| a11-cp1-p3-u2 | sign | Post für Frau Schmidt bitte zu Frau Brandt! Frau Schmidt wohnt nicht hier. Frau Brandt ist hier und spricht auch Englisch. | Frau Schmidt wohnt hier. | Falsch |
| a11-cp1-p3-u3 | ad | Deutsch mit Thomas: Thomas kommt aus Italien und spricht Deutsch, aber nicht Arabisch. Sprichst du Arabisch? Wir sprechen zusammen Deutsch und Arabisch! Wohnort: Bremen. Telefonnummer: fünf drei zwei. | Thomas kommt aus Italien. | Richtig |
| a11-cp1-p3-u4 | message | Guten Tag, Herr Berg! Frau Kaya kommt aus Marokko. Sie ist Lehrerin, nicht Studentin. Ihre Tochter kommt aus Deutschland und ist Studentin. Grüße, Frau Wolf | Frau Kaya ist Studentin. | Falsch |
| a11-cp1-p4-u1 | notice | Hier ist Familie Weber, nicht Familie Wolf. Frau Wolf wohnt in Berlin. Post für Frau Wolf bitte zu Frau Brandt. | Hier ist Familie Wolf. | Falsch |
| a11-cp1-p4-u2 | message | Hallo Ana, Herr Brandt kommt aus Spanien und wohnt in Köln. Frau Brandt kommt aus Italien. Sie spricht Deutsch mit mir. Grüße, Tim | Herr Brandt kommt aus Spanien. | Richtig |
| a11-cp1-p4-u3 | ad | Arabisch mit Ali: Ali spricht Arabisch und Englisch. Er wohnt in Bremen, nicht in Köln. Du wohnst auch in Bremen? Telefonnummer: null vier zwei eins. | Ali wohnt auch in Köln. | Falsch |
| a11-cp1-p4-u4 | message | Frau Berger, hier ist die Adresse von Paul: Berlin. Paul wohnt mit Frau Brandt in Berlin. Herr Brandt wohnt in Österreich. Grüße, Lena | Paul wohnt in Berlin. | Richtig |
| a11-cp2-p1-u1 | ad | Ich verkaufe einen Tisch und einen Stuhl. Der Tisch kostet zwanzig Euro, der Stuhl acht Euro. Tisch und Stuhl sind weiß. Bitte Mail an Frau Wolf. | Der Stuhl kostet acht Euro. | Richtig |
| a11-cp2-p1-u2 | message | Hallo Tim, die Tasche ist für Ana. Der Rucksack ist hier im Büro. Die Tasche kostet zwölf Euro, der Rucksack kostet zwanzig Euro. Grüße, Paul | Die Tasche kostet zwanzig Euro. | Falsch |
| a11-cp2-p1-u3 | sign | Büro Frau Kaya: Frau Kaya ist nicht im Büro. Frau Wolf ist hier und hat das Telefon. Bitte sprechen Sie mit Frau Wolf. | Frau Kaya ist im Büro. | Falsch |
| a11-cp2-p1-u4 | message | Guten Tag, Frau Brandt, Ihr Wörterbuch ist im Büro. Das Heft ist nicht hier, es ist bei Frau Kaya. Brauchen Sie auch Papier? Das Papier ist hier. Grüße, Lena | Das Wörterbuch ist im Büro. | Richtig |
| a11-cp2-p2-u1 | message | Hallo Paul, der Stuhl ist schwarz. Ich brauche den Stuhl für das Büro. Der Tisch ist weiß und ist für Ana. Grüße, Lena | Der Stuhl ist schwarz. | Richtig |
| a11-cp2-p2-u2 | ad | Lampe für das Büro: acht Euro! Die Lampe ist weiß. Das Regal ist braun und kostet dreißig Euro. Ich verkaufe auch Bücher. Frau Brandt, Telefonnummer fünf zwei drei. | Die Lampe für das Büro ist braun. | Falsch |
| a11-cp2-p2-u3 | message | Frau Wolf, Ihre Tasche ist hier bei mir. Die Tasche ist blau. Das Bild ist rot und ist von Tim. Brauchen Sie das Bild auch? Grüße, Ana | Die Tasche ist rot. | Falsch |
| a11-cp2-p2-u4 | notice | Die Uhr für Frau Kaya ist schwarz und kostet zehn Euro. Die Uhr für Frau Schmidt ist weiß. Bitte die Uhr für Frau Kaya kaufen! | Die Uhr für Frau Kaya ist schwarz. | Richtig |
| a11-cp2-p3-u1 | sign | Frau Schmidt hat die Nummer drei zwei fünf. Bitte nicht die Nummer drei zwei vier! Die Nummer ist von Frau Wolf. Frau Schmidt ist hier im Büro. | Frau Schmidt hat die Nummer drei zwei fünf. | Richtig |
| a11-cp2-p3-u2 | message | Hallo Ana! Das Lineal ist für Tim. Ich brauche die Schere für das Büro. Bitte auch einen Stift für mich! Danke und Grüße, Paul | Das Lineal ist für Tim. | Richtig |
| a11-cp2-p3-u3 | ad | Ich verkaufe ein Handy. Das Handy kostet vierzig Euro. Der Computer kostet hundert Euro. Handy und Computer sind von der Firma. Brauchen Sie ein Handy? Bitte Mail an Frau Wolf. | Das Handy kostet hundert Euro. | Falsch |
| a11-cp2-p3-u4 | message | Hallo Frau Schmidt! Das Buch ist für Tim, nicht für Frau Wolf. Ana hat schon ein Buch. Das Heft ist für Ana. Grüße, Herr Berg | Das Buch ist für Frau Wolf. | Falsch |
| a11-cp2-p4-u1 | message | Hallo Lena, Herr Weber ist Ingenieur. Er ist nicht der Chef. Die Chefin heißt Frau Brandt. Ich brauche ihre Telefonnummer für das Formular. Grüße, Tim | Herr Weber ist nicht Ingenieur. | Falsch |
| a11-cp2-p4-u2 | notice | Firma Berg: Frau Kaya ist nicht hier im Büro. Bitte sprechen Sie mit Frau Wolf. Sie ist Verkäuferin und hat die Telefonnummer von Frau Kaya. | Frau Kaya ist hier im Büro. | Falsch |
| a11-cp2-p4-u3 | message | Frau Schmidt, die Chefin ist hier im Büro. Der Kollege ist bei Frau Wolf. Brauchen Sie den Computer? Das Telefon ist auch hier. Grüße, Paul | Die Chefin ist hier im Büro. | Richtig |
| a11-cp2-p4-u4 | ad | Bücher für das Büro: Das Wörterbuch ist neu. Ich verkaufe es für zwölf Euro. Das Heft ist nicht neu und kostet einen Euro. Mail an Frau Berger. | Das Heft ist nicht neu. | Richtig |
| a11-cp3-p1-u1 | notice | Termin bei Frau Kaya: Bitte um elf Uhr kommen. Frau Kaya arbeitet heute bis zehn Uhr bei der Firma Wolf. Sie hat um elf Uhr Zeit. | Frau Kaya hat um elf Uhr Zeit. | Richtig |
| a11-cp3-p1-u2 | message | Hallo Lena, der Termin ist am Dienstag. Am Montag habe ich frei und arbeite nicht. Hast du am Montag auch Zeit? Wir gehen ins Kino! Grüße, Tim | Tim hat am Montag frei. | Richtig |
| a11-cp3-p1-u3 | ad | Frühstück bei Frau Wolf: Brot und Kaffee für fünf Euro. Tee kostet zwei Euro. Wir haben morgens Zeit für Sie. Kommen Sie zum Frühstück! | Der Tee kostet fünf Euro. | Falsch |
| a11-cp3-p1-u4 | message | Guten Morgen, Herr Berg! Ich arbeite am Montag. Die Pause ist um zwölf Uhr, nicht um zehn Uhr. Die Kollegin hat am Dienstag frei. Haben Sie dann Zeit? Grüße, Frau Brandt | Frau Brandt hat am Montag frei. | Falsch |
| a11-cp3-p2-u1 | message | Hallo Ana, ich bin heute krank. Wir gehen nicht ins Kino. Ich habe am Freitag Zeit. Gehen wir dann? Grüße, Paul | Paul geht heute ins Kino. | Falsch |
| a11-cp3-p2-u2 | notice | Das Büro ist heute nur bis zwölf Uhr auf. Frau Wolf arbeitet bis elf Uhr. Bitte kommen Sie vor zwölf Uhr. Nachmittags ist hier Pause. | Das Büro ist bis zwölf Uhr auf. | Richtig |
| a11-cp3-p2-u3 | ad | Kuchen und Brot von Frau Schmidt: Der Kuchen kostet zehn Euro. Das Brot kostet drei Euro. Frau Schmidt arbeitet morgens und hat nachmittags frei. | Der Kuchen von Frau Schmidt kostet drei Euro. | Falsch |
| a11-cp3-p2-u4 | message | Tim, ich gehe heute ins Kino. Ana hat nicht frei und arbeitet. Kommst du auch? Das Kino ist hier in Bremen. Grüße, Lena | Lena geht heute ins Kino. | Richtig |
| a11-cp3-p3-u1 | ad | Suppe bei Frau Kaya: Die Suppe kostet hier vier Euro, der Salat fünf Euro. Wir haben auch Mineralwasser. Bitte kommen Sie um zwölf Uhr zum Essen. | Die Suppe kostet hier vier Euro. | Richtig |
| a11-cp3-p3-u2 | message | Hallo Paul, ich trinke nicht gern Kaffee. Bitte Tee für mich! Frau Wolf trinkt gern Kaffee und möchte auch Brot. Wir kommen zum Frühstück. Grüße, Lena | Lena trinkt nicht gern Kaffee. | Richtig |
| a11-cp3-p3-u3 | notice | Die Pause ist heute um zehn Uhr! Wir haben Kuchen und Brot. Herr Berg hat Mineralwasser für alle. Bitte kommen Sie pünktlich, wir arbeiten um elf Uhr. | Die Pause ist um elf Uhr. | Falsch |
| a11-cp3-p3-u4 | message | Guten Tag, Frau Brandt! Ich habe Hunger und möchte Suppe. Salat möchte ich nicht. Ali möchte Salat und ein Glas Wasser. Grüße, Thomas | Thomas möchte Salat, nicht Suppe. | Falsch |
| a11-cp3-p4-u1 | message | Hallo Tim, Frau Berger schwimmt nicht gern. Sie tanzt gern. Ich schwimme am Sonntag. Hast du am Sonntag Zeit? Kommst du auch? Grüße, Ana | Frau Berger schwimmt gern. | Falsch |
| a11-cp3-p4-u2 | message | Frau Wolf, die Chefin arbeitet am Mittwoch. Sie hat am Donnerstag frei. Ich habe am Mittwoch frei und komme dann zu Ihnen. Grüße, Herr Berg | Die Chefin arbeitet am Donnerstag. | Falsch |
| a11-cp3-p4-u3 | notice | Fußball am Wochenende: Herr Kaya spielt am Samstag. Am Sonntag spielt Herr Schmidt. Herr Kaya und Herr Schmidt kommen um zehn Uhr. Spielen Sie auch? Bitte kommen Sie pünktlich! | Herr Kaya spielt am Samstag. | Richtig |
| a11-cp3-p4-u4 | ad | Deutsch und Musik mit Frau Brandt! Frau Brandt hört gern Musik und spricht Deutsch mit Ihnen. Herr Wolf spielt gern Fußball. Was machen Sie gern? Telefonnummer: drei zwei fünf. | Frau Brandt hört gern Musik. | Richtig |
| a11-cp4-p1-u1 | ad | Fahrt nach Berlin: Der Bus fährt um acht Uhr. Die Fahrkarte kostet zwanzig Euro. Kinder zahlen zehn Euro. Bitte kaufen Sie die Fahrkarte am Bahnhof. | Die Fahrkarte kostet dreißig Euro. | Falsch |
| a11-cp4-p1-u2 | notice | Der Zug nach Köln fährt heute von Gleis vier. Bitte nicht zu Gleis drei gehen! Der Zug nach Berlin fährt von Gleis drei. Abfahrt nach Köln: neun Uhr. | Der Zug nach Köln fährt von Gleis vier. | Richtig |
| a11-cp4-p1-u3 | message | Hallo Paul, meine Ankunft in Bremen ist um zehn Uhr. Meine Abfahrt in Köln ist schon um sieben Uhr. Holst du mich am Bahnhof ab? Grüße, Lena | Lena kommt um zehn Uhr. | Richtig |
| a11-cp4-p1-u4 | message | Hallo Ana, ich fahre um acht Uhr mit dem Bus nach Berlin. Der Zug fährt nicht nach Berlin, er fährt nach Köln. Kommst du auch nach Berlin? Grüße, Tim | Tim fährt um acht Uhr mit dem Zug. | Falsch |
| a11-cp4-p2-u1 | message | Lena, ich kaufe ein Buch für Ana. Eine Karte kaufe ich nicht. Tim hat schon eine Karte für sie. Wir kommen auch am Freitag. Grüße, Paul | Paul kauft eine Karte für Ana. | Falsch |
| a11-cp4-p2-u2 | message | Hallo Tim! Meine Schwester bringt Wein mit. Mein Bruder bringt Kuchen, aber nicht Wein mit. Wir feiern am Samstag bei Frau Wolf. Kommst du? Grüße, Ana | Die Schwester bringt Wein mit. | Richtig |
| a11-cp4-p2-u3 | ad | Kuchen für Ihre Party: Frau Kaya hat am Freitag Zeit und macht Kuchen für zwanzig Euro. Am Samstag arbeitet sie nicht. Bitte rufen Sie Frau Kaya an. | Frau Kaya arbeitet am Samstag nicht. | Richtig |
| a11-cp4-p2-u4 | notice | Die Party bei Frau Wolf ist am Sonntag, nicht am Samstag. Bitte bringen Sie kein Geschenk mit! Kuchen und Wein sind schon hier. Wir feiern zusammen! | Die Party ist nicht am Sonntag. | Falsch |
| a11-cp4-p3-u1 | notice | Das Büro ist heute zu. Frau Brandt arbeitet morgen ab neun Uhr. Herr Berg kommt um zehn Uhr. Bitte kommen Sie morgen oder rufen Sie an. | Frau Brandt arbeitet morgen ab neun Uhr. | Richtig |
| a11-cp4-p3-u2 | message | Hallo Paul, ich rufe um neun Uhr meine Schwester an. Lena ruft die Schwester um zehn Uhr an. Ich komme später zu dir. Grüße, Tim | Tim ruft um zehn Uhr die Schwester an. | Falsch |
| a11-cp4-p3-u3 | ad | Bücher für Kinder: Ich verkaufe drei Bücher zusammen für zehn Euro. Ein Wörterbuch kostet zwanzig Euro. Bitte nicht vor neun Uhr anrufen. Frau Schmidt | Drei Bücher kosten zusammen zehn Euro. | Richtig |
| a11-cp4-p3-u4 | message | Ana, meine Mama arbeitet heute. Mein Papa hat frei und kocht Suppe. Mama hat morgen frei. Wir essen heute um eins, nicht um zwei Uhr. Kommst du auch? Grüße, Lena | Lena isst heute um zwei Uhr. | Falsch |
| a11-cp4-p4-u1 | notice | Abfahrt nach Österreich heute um elf Uhr! Der Bus um zehn Uhr fährt in die Schweiz. Fahrkarten für die Schweiz: beim Fahrer. Fahrkarten nach Österreich: am Bahnhof. | Der Bus um zehn Uhr fährt nach Österreich. | Falsch |
| a11-cp4-p4-u2 | message | Hallo Ali, das Buch ist von Frau Brandt. Die Karte ist von Paul. Buch und Karte sind für dich zum Geburtstag. Wir kommen am Sonntag! Grüße, Ana | Das Buch ist von Frau Brandt. | Richtig |
| a11-cp4-p4-u3 | message | Guten Morgen, Tim! Herr Berg feiert am Freitag. Frau Kaya feiert schon am Montag. Ich komme am Freitag mit und bringe Kuchen mit. Grüße, Lena | Herr Berg feiert am Montag. | Falsch |
| a11-cp4-p4-u4 | ad | Am Sonntag fahren wir nach Bremen. Die Fahrt kostet zehn Euro. Am Samstag fahren wir nicht. Kommen Sie mit! Bitte rufen Sie Frau Wolf an. | Die Fahrt kostet zehn Euro. | Richtig |

## 2. Hören independence

Rule: the two targets and six distractors form eight distinct taught words. A shortage throws instead of reusing an option. Correctness, keys and explanations for graded Hören are released only when the entire section is complete; the UI now displays that section review.

Test: `tests/live-course-batch2.test.mjs` builds every paper of both levels and runs sequential intersection of printed options, excluding keys already released. Tied candidates receive uniform expected credit, avoiding arbitrary lucky guesses. A planted shared-list item becomes uniquely solvable; a premature-feedback mutation releases the key. Every real paper is exactly at chance, stronger than the requested chance + one item ceiling.

| Measurement | A1.1 before → after | A1.2 before → after |
| --- | --- | --- |
| Overlapping option sets | 16/16 → 0/16 | 16/16 → 0/16 |
| Second answer uniquely inferred by printed intersection | 15/16 → 0/16 | 12/16 → 0/16 |
| Same strategy after first key is released | 15/16 → 0/16 | 12/16 → 0/16 |
| Sequential expected score (two four-option items per paper) | 19/32 → 8/32 | 16/32 → 8/32 |

Before values above were measured from HEAD c286975 source imported in memory using read-only `git show`. The supplied A1.2 evaluation's broader immediate-feedback strategy reported 13/16; the narrower intersection strategy here reproduces 12/16. Neither is described as a measurement of the other.

The offline browser verifier caught and fixed a UI copy error: Hören initially displayed “Feedback follows after Lesen.” It now has its own bilingual receipt and heading in `strings.js`. The existing browser verifier was extended to assert nine neutral receipts and both section reviews; it can emit self-contained HTML with `--html` without starting a server. Audio/AI/auth/persistence boundaries are stubbed; the real page, UI, builder, checker and scorer run in the browser. No external requests or database operations are made.

## 3. Word-order coverage

Rule: supported frames enumerate complete constituent orders. A long dialogue turn can supply a complete short sentence with its line/sentence provenance; the recorded dialogue itself is untouched. Added frames cover copular descriptions, prices, ages, locations/times, bare haben states and simple arrivals, with V1/confirmation alternatives for questions.

Test: every lesson × all three attempt positions must serve a tile task; every alternative is graded by `checkAnswer`. Independent annotated examples enumerate all permutations and reject every unlicensed order through that same checker. Existing batch-1 unsupported-grammar and alternative-order assertions remain intact.

Observed coverage: A1.1 9 → 36 tasks across three attempts; A1.2 0 → 36. For the two attempts reported in batch 1: 6 → 24 and 0 → 24. Each cell below counts tasks across attempts 1, 2 and 3; `3` means one on every attempt.

| Lektion | A1.1 before → after | A1.2 before → after |
| --- | --- | --- |
| 1 | 0 → 3 | 0 → 3 |
| 2 | 3 → 3 | 0 → 3 |
| 3 | 0 → 3 | 0 → 3 |
| 4 | 0 → 3 | 0 → 3 |
| 5 | 0 → 3 | 0 → 3 |
| 6 | 0 → 3 | 0 → 3 |
| 7 | 0 → 3 | 0 → 3 |
| 8 | 0 → 3 | 0 → 3 |
| 9 | 0 → 3 | 0 → 3 |
| 10 | 0 → 3 | 0 → 3 |
| 11 | 3 → 3 | 0 → 3 |
| 12 | 3 → 3 | 0 → 3 |

Both dialogue objects compare identical to HEAD c286975, including every A1.1 recorded line. No recording or audio manifest was changed.

## Changed files

All 21 source/report changes (generated pool files have no content diff):

| File | Change |
| --- | --- |
| `src/data/curricula/a11.lesen.js` | 64 independent authored reading units |
| `astro-site/src/data/curricula/a11.lesen.js` | Synced bank twin |
| `src/data/curricula/a11.js` | Attach authored papers to four checkpoints |
| `astro-site/src/data/curricula/a11.js` | Synced curriculum twin |
| `scripts/shared-files.mjs` | Add the new bank's sync pair |
| `scripts/a11-lesen-check.mjs` | Declared strategy, taught-language and template gates; broad diagnostics |
| `tests/helpers/lesenGate.mjs` | Richtig/Falsch strategies and independent-unit order contexts |
| `tests/a11-lesen.test.mjs` | Engine round serving, declared-strategy/template mutations and pending review contract |
| `tests/fixtures/a11-lesen-review.json` | Required, explicitly pending supervisor fixture |
| `src/lib/checkpoint/buildCheckpoint.js` | Authored Richtig/Falsch rendering; disjoint Hören choices |
| `src/lib/checkpoint/feedback.js` | Defer graded Hören feedback |
| `src/pages/lesson/CheckpointPage.jsx` | Hören section receipt and review |
| `src/lib/lesson/strings.js` | Bilingual Hören receipt and review heading |
| `scripts/checkpoint-feedback-browser.mjs` | Both section checks; offline inline HTML output |
| `src/lib/lesson/wordOrder.js` | Extend closed sentence frames and constituent orders |
| `src/lib/lesson/buildLesson.js` | Derive supported complete sentences from dialogue turns |
| `tests/live-course-batch2.test.mjs` | Sequential listening, all-lesson tiles and exhaustive gold permutations |
| `tests/checkpoint.test.mjs` | Explicit legacy fixture for generator assertions |
| `tests/a12-rebuild.test.mjs` | Explicit legacy fixture for generator assertions |
| `tests/lesson-extra-items.test.mjs` | Preserve the historical seat assertion; independently pin and check the reseated live items |
| `docs/course-factory/live-fixes/BATCH-2-REPORT-2026-10-25.md` | This report, created as a skeleton before implementation |

Ignored verification artifacts are confined to `.cache/batch2-browser/` (screenshots and browser profiles). No files under `.fablize/` were edited. No pre-batch assertion was deleted or weakened, no ratchet was raised, and no dependency was added.

## Verification

All commands ran from `C:\Users\zaid1\deutschmeister-live`, with absolute script/test paths. No network or database was used. The two lesson pools were unchanged, so this revision validated the existing built pools. Normal Node test workers ran successfully; **`--experimental-test-isolation=none` was not needed in this revision**.

| Command (absolute path under the repo root) | Result |
| --- | --- |
| `node scripts/validate-curriculum.mjs` | Exit 0; A1.1 12 Lektionen, 263 Wortfeld entries, 54 h |
| `node scripts/validate-curriculum.mjs a1.2` | Exit 0; A1.2 12 Lektionen, 206 entries, 54 h |
| `node scripts/a12-determinacy.mjs a1.1` | Exit 0; 406 served items, 0 correct alternatives rejected |
| `node scripts/a12-determinacy.mjs a1.2` | Exit 0; 481 served items, 0 correct alternatives rejected |
| `node scripts/a11-lesen-check.mjs -v` | Exit 0; declared max 2/4 and 32/64; 64 skeletons; report-only pair max 50/64, whole papers 7/16 |
| `node scripts/a12-lesen-check.mjs -v` | Exit 0; no findings; existing pair/order ratchet unchanged |
| `npm run check:duplicates` (offline environment) | Exit 0; all 19 pairs, including the new bank twin |
| `npx --offline --no-install eslint --no-ignore --max-warnings 0 <19 changed JS/JSX/MJS files>` | Exit 0, no diagnostics |
| `node --test <absolute test file>` | 74 files; latest full-file results below |

The last text correction was followed by another A1.1 test-file run, both curriculum validators, both determinacy checks and both Lesen checks. Duplicate comparison and bank-file lint were repeated as well. The earlier failures in `a12-rebuild`, `checkpoint` and `lesson-extra-items` were rerun as complete files and passed after the fixes.

Required accepted-item evidence was observed again:

```text
PASS: a1.1 Hören — 16/16 disjoint papers; inference 0/16; sequential expected 8/32 (chance 8/32)
PASS: a1.2 Hören — 16/16 disjoint papers; inference 0/16; sequential expected 8/32 (chance 8/32)
PASS: a1.1 tiles — 12/12 Lektionen × 3 attempts = 36/36 tasks
PASS: a1.2 tiles — 12/12 Lektionen × 3 attempts = 36/36 tasks
```

A direct JSON comparison of every A1.1 and A1.2 dialogue object with HEAD c286975 returned identical, with both comparison processes exiting 0.

Test selection retained the previous 44 affected files and followed literal import/source-file dependencies of all changed files, yielding 30 additional files. Latest complete-file results count each test once: **1157 tests, 1141 pass, 15 fail, 1 TODO**.

| Test file | Tests | Pass | Fail | Todo |
| --- | ---: | ---: | ---: | ---: |
| `tests/a11-content-classes.test.mjs` | 9 | 9 | 0 | 0 |
| `tests/a11-lesen.test.mjs` | 8 | 7 | 0 | 1 |
| `tests/a12-buyer-claims.test.mjs` | 4 | 4 | 0 | 0 |
| `tests/a12-rebuild.test.mjs` | 60 | 60 | 0 | 0 |
| `tests/a12-tense.test.mjs` | 5 | 5 | 0 | 0 |
| `tests/a2-2-abschlusstest.test.mjs` | 24 | 24 | 0 | 0 |
| `tests/assessment-integrity.test.mjs` | 28 | 28 | 0 | 0 |
| `tests/astro-course-front-door.test.mjs` | 4 | 3 | 1 | 0 |
| `tests/astro-hex.test.mjs` | 1 | 0 | 1 | 0 |
| `tests/b3-answer-checking.test.mjs` | 3 | 3 | 0 | 0 |
| `tests/b3-course-persistence.test.mjs` | 9 | 9 | 0 | 0 |
| `tests/b3-lesson-generation.test.mjs` | 5 | 5 | 0 | 0 |
| `tests/b3-player-recovery.test.mjs` | 4 | 4 | 0 | 0 |
| `tests/b4-privacy-navigation.test.mjs` | 10 | 7 | 3 | 0 |
| `tests/brand.test.mjs` | 7 | 7 | 0 | 0 |
| `tests/check-answer.test.mjs` | 23 | 23 | 0 | 0 |
| `tests/checkpoint-feedback.test.mjs` | 3 | 3 | 0 | 0 |
| `tests/checkpoint.test.mjs` | 77 | 77 | 0 | 0 |
| `tests/claims.test.mjs` | 23 | 23 | 0 | 0 |
| `tests/consent.test.mjs` | 2 | 2 | 0 | 0 |
| `tests/course-art.test.mjs` | 10 | 10 | 0 | 0 |
| `tests/course-audio.test.mjs` | 28 | 28 | 0 | 0 |
| `tests/course-certificate.test.mjs` | 9 | 9 | 0 | 0 |
| `tests/course-front-door.test.mjs` | 7 | 7 | 0 | 0 |
| `tests/course-home.test.mjs` | 18 | 18 | 0 | 0 |
| `tests/course-meta.test.mjs` | 25 | 25 | 0 | 0 |
| `tests/course-next.test.mjs` | 6 | 6 | 0 | 0 |
| `tests/course-plan.test.mjs` | 19 | 19 | 0 | 0 |
| `tests/course-player.test.mjs` | 46 | 46 | 0 | 0 |
| `tests/course-reminder.test.mjs` | 19 | 19 | 0 | 0 |
| `tests/course-value.test.mjs` | 8 | 8 | 0 | 0 |
| `tests/curricula.test.mjs` | 82 | 82 | 0 | 0 |
| `tests/dead-modules.test.mjs` | 2 | 2 | 0 | 0 |
| `tests/exams.test.mjs` | 16 | 16 | 0 | 0 |
| `tests/fahrschein.test.mjs` | 4 | 4 | 0 | 0 |
| `tests/first-run.test.mjs` | 26 | 25 | 1 | 0 |
| `tests/free-door.test.mjs` | 4 | 4 | 0 | 0 |
| `tests/language-strategy.test.mjs` | 4 | 4 | 0 | 0 |
| `tests/lesson-attempts.test.mjs` | 8 | 8 | 0 | 0 |
| `tests/lesson-back-skip.test.mjs` | 5 | 5 | 0 | 0 |
| `tests/lesson-engine.test.mjs` | 62 | 62 | 0 | 0 |
| `tests/lesson-extra-items-a12.test.mjs` | 13 | 13 | 0 | 0 |
| `tests/lesson-extra-items.test.mjs` | 28 | 28 | 0 | 0 |
| `tests/lesson-pool-rules.test.mjs` | 48 | 48 | 0 | 0 |
| `tests/lesson-run-resume.test.mjs` | 10 | 10 | 0 | 0 |
| `tests/lesson-scoring.test.mjs` | 14 | 14 | 0 | 0 |
| `tests/linie-design.test.mjs` | 14 | 14 | 0 | 0 |
| `tests/live-course-batch1.test.mjs` | 8 | 8 | 0 | 0 |
| `tests/live-course-batch2.test.mjs` | 3 | 3 | 0 | 0 |
| `tests/llms.test.mjs` | 2 | 1 | 1 | 0 |
| `tests/milestones.test.mjs` | 9 | 9 | 0 | 0 |
| `tests/navigation.test.mjs` | 19 | 19 | 0 | 0 |
| `tests/purchase-route-gates.test.mjs` | 6 | 5 | 1 | 0 |
| `tests/purchase-route-imports.test.mjs` | 4 | 4 | 0 | 0 |
| `tests/purchases.test.mjs` | 23 | 23 | 0 | 0 |
| `tests/readaloud-startup-cancellation.test.mjs` | 6 | 6 | 0 | 0 |
| `tests/readiness.test.mjs` | 9 | 9 | 0 | 0 |
| `tests/rule-card-overrides.test.mjs` | 35 | 35 | 0 | 0 |
| `tests/save-progress-ask.test.mjs` | 16 | 16 | 0 | 0 |
| `tests/shared-files.test.mjs` | 3 | 2 | 1 | 0 |
| `tests/signup-existing-account.test.mjs` | 5 | 5 | 0 | 0 |
| `tests/site-audit-regressions.test.mjs` | 11 | 11 | 0 | 0 |
| `tests/spa-shell-h1.test.mjs` | 1 | 0 | 1 | 0 |
| `tests/support.test.mjs` | 7 | 7 | 0 | 0 |
| `tests/syllabus.test.mjs` | 14 | 14 | 0 | 0 |
| `tests/sync-outbox.test.mjs` | 19 | 19 | 0 | 0 |
| `tests/telc-deep-links.test.mjs` | 6 | 6 | 0 | 0 |
| `tests/telc-pilot-gate.test.mjs` | 5 | 3 | 2 | 0 |
| `tests/telc-pilot.test.mjs` | 14 | 14 | 0 | 0 |
| `tests/trial-end-claims.test.mjs` | 4 | 4 | 0 | 0 |
| `tests/unlimited-claims.test.mjs` | 2 | 2 | 0 | 0 |
| `tests/web-performance.test.mjs` | 9 | 6 | 3 | 0 |
| `tests/wortfeld-pacing.test.mjs` | 2 | 2 | 0 | 0 |
| `tests/writing-course.test.mjs` | 71 | 71 | 0 | 0 |

All 15 remaining failures were isolated against HEAD c286975 with the existing read-only `baseline-loader.mjs` and the same assertions. No baseline assertion was relaxed and no unrelated source was edited.

| Baseline test file | Failures reproduced | Failing assertion(s) |
| --- | ---: | --- |
| `tests/astro-course-front-door.test.mjs` | 1 | the known front-door CTAs still exist (the scan is not vacuous) |
| `tests/astro-hex.test.mjs` | 1 | no colour literal in the static site outside the design tokens |
| `tests/b4-privacy-navigation.test.mjs` | 3 | consent withdrawal while PostHog downloads prevents initialization and later capture; PostHog capture and identify require the current shared consent choice; course return controls follow the measured bottom navigation and reserve their own height |
| `tests/first-run.test.mjs` | 1 | the dashboard renders the first-run card in the hero slot and demotes its other primaries |
| `tests/llms.test.mjs` | 1 | committed llms files equal the generator output (run node scripts/build-llms.mjs) |
| `tests/purchase-route-gates.test.mjs` | 1 | the route parser reads the real route table |
| `tests/shared-files.test.mjs` | 1 | shared sync writes only manifest destinations and preserves bytes |
| `tests/spa-shell-h1.test.mjs` | 1 | the shell identity <h1> is removed before the app renders its own |
| `tests/telc-pilot-gate.test.mjs` | 2 | the SPA config gives the telc product a checkout id only when the sale is on; the Astro helper gives the telc page a checkout id only when the sale is on |
| `tests/web-performance.test.mjs` | 3 | no source file imports lucide-react as a namespace; every @font-face file exists in public/fonts, and nothing there is unreferenced; both heads preload exactly the token fontPreloads, and nothing points at Google Fonts |

Most are path/newline-sensitive static-source checks; this report relies on reproduction, not an assumption that every failure has the same cause. The first HEAD overlay run of `spa-shell-h1` passed because that loader restores checkout line endings only for its listed text extensions, excluding HTML. A read-only in-memory CRLF overlay for HEAD's `index.html` reproduced the same shell-h1 failure (1 test, 0 pass, 1 fail). No test or HTML file was changed.

Harness recoveries: an initial replacement patch was rejected before writing because it targeted the same file twice; a single Update patch succeeded. The context-mode file reader resolved the repository against its plugin root and denied the read, so the authorized absolute file was read with the native file surface. One initial subprocess accidentally used the context tool's Bun runtime, which refused `node:test`; all verification reported here explicitly launched `node`. The copied-sentence mutation initially lacked a sentence boundary; correcting the probe made it exercise the existing rejection as intended.

Blind review is the one explicit TODO: 8 A1.1 Lesen tests, 7 pass, 0 fail, 1 TODO. No supervisor judgments or semantic-review results were fabricated. The earlier browser evidence and final browser-startup limitation from batch 2 remain historical: this revision changes reading data and checks, and does not claim a new browser run. The accepted UI's previous final browser re-verification gap remains separate from the observed script/test results above.

## Blind review round 1 fixes

Only the 13 requested units changed in `src/data/curricula/a11.lesen.js` and its Astro twin; the other 51 units, all keys and all types are unchanged. Changed passages are shown below (the earlier 64-unit table records the pre-review version).

| Unit | Old text → new text |
| --- | --- |
| a11-cp1-p1-u1 | „Ihre Eltern wohnen auch hier.“ → „Ihre Eltern wohnen auch in Berlin.“ |
| a11-cp1-p1-u4 | „Telefonnummer: null eins sieben drei.“ → „Telefonnummer: null eins sieben drei zwei vier sechs acht fünf null eins.“ |
| a11-cp1-p2-u1 | „Telefonnummer: drei fünf zwei.“ → „Telefonnummer: null eins sieben sechs drei fünf acht zwei sechs null vier.“ |
| a11-cp1-p3-u2 | „Post für Frau Schmidt bitte zu Frau Brandt!“ removed; after the unchanged residence/language sentences, added „Bitte sprechen Sie mit Frau Brandt.“ |
| a11-cp1-p3-u3 | „Telefonnummer: fünf drei zwei.“ → „Telefonnummer: null eins sieben zwei fünf drei zwei acht sechs vier null.“ |
| a11-cp1-p4-u1 | „Post für Frau Wolf bitte zu Frau Brandt.“ → „Bitte sprechen Sie mit Frau Weber.“ |
| a11-cp1-p4-u3 | „Telefonnummer: null vier zwei eins.“ → „Telefonnummer: null vier zwei eins fünf acht zwei sechs drei vier neun.“ |
| a11-cp1-p4-u4 | „Frau Berger, hier ist die Adresse von Paul: Berlin. Paul wohnt …“ → „Frau Berger, Paul wohnt …“ |
| a11-cp2-p2-u2 | „Telefonnummer fünf zwei drei.“ → „Telefonnummer null eins sieben vier fünf zwei drei sechs acht null zwei.“ |
| a11-cp3-p2-u2 | „Das Büro ist heute nur bis zwölf Uhr auf.“ → „Wir arbeiten heute im Büro bis zwölf Uhr.“; „Nachmittags ist hier Pause.“ → „Nachmittags haben wir Pause.“ |
| a11-cp3-p4-u4 | „Herr Wolf spielt gern Fußball. Was machen Sie gern? Telefonnummer: drei zwei fünf.“ → „Wir hören zusammen Musik. Haben Sie am Freitag Zeit? Bitte Mail an Frau Brandt.“ |
| a11-cp4-p3-u1 | „Das Büro ist heute zu.“ → „Frau Brandt ist heute nicht im Büro.“ |
| a11-cp4-p3-u2 | „Lena ruft die Schwester um zehn Uhr an. Ich komme später zu dir.“ → „Lena ruft meine Schwester um zehn Uhr an. Die Kinder und ich kommen später zu dir.“ |

The only statement change is `a11-cp3-p2-u2`: „Das Büro ist bis zwölf Uhr auf.“ → „Wir arbeiten im Büro bis zwölf Uhr.“ Its evidence and English explanation now describe working hours. The music-ad and sister-message English explanations were also aligned with their new texts; the generated questions/explanations remain consistent.

The old bank passed the existing gate, and the supervisor reported 64/64 matching blind answers: wrong keys and missing lexical forms did not explain these findings. The gap was contextual meaning/contact realism beyond token and construction checks. The new contact gate rejects all six old public phone contacts, including the music ad's number, and accepts the revised bank. Mutation tests cover short prefixes/numbers, complete contacts, named contact alternatives and office-internal numbers. A separate narrow regression checks the reviewed „Post für …“ and „ist/sind … auf/zu“ senses in texts, statements and German explanations; general semantic judgments still require the supervisor.

Verification from the repository root, using absolute script/test paths:

- `node scripts/a11-lesen-check.mjs -v`: exit 0; every declared strategy 2/4 per paper and 32/64 overall; 64 distinct templates, maximum repetition 1.
- `node scripts/validate-curriculum.mjs`: exit 0; existing curriculum ratchets pass.
- `node --test --experimental-test-isolation=none tests/a11-lesen.test.mjs tests/live-course-batch2.test.mjs`: exit 0; **13 tests, 12 pass, 0 fail, 1 TODO**.

Session-baseline comparisons confirm exactly 13 changed units, identical bank twins, and unchanged A1.1 curriculum/dialogue files and `.fablize/` contents. The review fixture is byte-identical and remains `status: "pending"`, `reviewedOn: null`, `units: []`; the TODO is the supervisor's re-review, not a claimed semantic pass. No network, database or Git write operation was used.

## Blind review rounds 2–4 and the final state (supervisor, 2026-10-25)

The supervisor ran the independent blind review with Codex as a DaF/SD1 examiner, read-only. Each unit was solved from text, statement and alphabetically ordered options only, with no key, evidence, rival or explanation. Every round re-reviewed exactly the units whose text had changed since the round before.

| Round | Units | Result | What was fixed afterwards |
|---|---:|---|---|
| 1 | 64 | 51 OK, 13 FIX; every blind answer equal to its key | 13 units, by the engineer (section above) |
| 2 | 13 | 7 OK, 6 FIX | five phone numbers spelled out in words → digits („Telefonnummer: 0173 2468501."); „Hier ist Familie Weber" → „Hier wohnt Familie Weber" (statement and evidence too), by the supervisor |
| 3 | 6 | 5 OK, 1 FIX | the tandem ad offered Arabic its writer does not speak. „lernt" is not taught by checkpoint 1 (the authoring check refused it), so the ad was rewritten with taught words („… spricht Deutsch und Englisch. Sprichst du auch Englisch? Wir sprechen zusammen Deutsch und Englisch!"), by the supervisor |
| 4 | 1 | 1 OK, 0 FIX | — |

Final state:
- All 64 units are reviewed on their current text, with verdict OK and the blind answer equal to the key. tests/fixtures/a11-lesen-review.json holds the reviewer's answer, evidence span and covering round for every unit (status „reviewed").
- The review test in tests/a11-lesen.test.mjs now runs (no longer todo) and passes.
- `node scripts/a11-lesen-check.mjs -v` prints „PASS: A1.1 Lesen — 64 independent units; all gates pass" and „Templates: 64 distinct; maximum repetition 1".
- The reviewer noted that every paper is two Richtig and two Falsch, so the last answer of a paper can be inferred from the other three. This is kept deliberately: unbalanced papers would let a constant answer pass a section under the course's pass rule.
