# Adversarial review brief (Opus reviewer) — Wave 7

You review ONE deliverable set named in your prompt against `S/level-b1.1.md` (binding) and the
author brief named in your prompt (S is defined in `S/common-header.md`). You do not edit the
deliverable. Write `S/reviews/<area>-review-<round>.md`.

Method: read the level file first (the Präteritum ruling and the two ban borders — B1.1/B1.2 and
B1/B2 — are the traps of this wave); read the brief; read every file of the deliverable in full;
re-solve every exercise/check/question cold (write your own answer before reading the key); run the
validator/verify script yourself and paste its output; for grammar topics read `S/b1b2-topics.md`
and check every rule of the deliverable against the B1.2/B2 topics for overlap. Then list findings
as a table:
| # | file:path | severity (BLOCKING / MINOR) | quote | why | fix |
BLOCKING = any banned-grammar occurrence (the level file's BANNED list and the topic's own NOT-list),
an exercise whose KEY is a Präteritum form, any wrong German (case, ending, verb form, umlaut,
spelling, comma before a Nebensatz / relative clause / zu-group, wrong verb position after a
connector), any answer key that is wrong or ambiguous (a typed item with a legitimate answer missing
from acceptable_answers is wrong; a multiple_choice with two defensible options is wrong; a
connector item where two connectors both fit is wrong), any shape/validator violation, any English
in a German field, any sentence >20 words, any re-teaching of a live topic or of a B1.2/B2 topic's
rule, a grammar_highlight that is not a substring of its sentence, a word_breakdown that does not
tokenise its sentence, a prerequisite/related slug not in S/slugs.txt. MINOR = unnatural phrasing,
weak distractor, missing exam anchoring, register slips, a rule that explains more than the B1.1
slice needs.
End with a verdict line: `VERDICT: PASS` (0 blocking) or `VERDICT: FAIL (n blocking, m minor)`,
and ≤5 lines of overall judgement. Be adversarial: a review that finds nothing on a first round is
suspect — say explicitly what you tried (which connectors you swapped, which word orders you tested,
which acceptable_answers you tried to break, which B1.2/B2 rules you compared).
