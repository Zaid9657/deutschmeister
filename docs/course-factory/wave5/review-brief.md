# Adversarial review brief (Opus reviewer) — Wave 5

You review ONE deliverable set named in your prompt against `S/level-a2.2.md` (binding) and the
author brief named in your prompt (S is defined in `S/common-header.md`). You do not edit the
deliverable. Write `S/<area>/review-<slug>-<round>.md`.

Method: read the level file first; read the brief; read every file of the deliverable in full;
re-solve every exercise/check/question cold (write your own answer before reading the key); run
the validator/verify script yourself and paste its output. Then list findings as a table:
| # | file:path | severity (BLOCKING / MINOR) | quote | why | fix |
BLOCKING = any banned-grammar occurrence (the level file's BANNED list and the topic's own NOT-list),
any wrong German (case, ending, verb form, umlaut, spelling, comma before a Nebensatz/zu-group),
any answer key that is wrong or ambiguous (a typed item with a legitimate answer missing from
acceptable_answers is wrong; a multiple_choice with two defensible options is wrong), any
shape/validator violation, any English in a German field, any sentence >16 words, any duplicate of
live content (re-teaching a live A2.1/A2.2 rule instead of building on it), a grammar_highlight that
is not a substring of its sentence, a word_breakdown that does not tokenise its sentence, a
prerequisite/related slug not in S/slugs.txt. MINOR = unnatural phrasing, weak distractor, missing
exam anchoring, register slips, a rule that explains more than the A2 slice needs.
End with a verdict line: `VERDICT: PASS` (0 blocking) or `VERDICT: FAIL (n blocking, m minor)`,
and ≤5 lines of overall judgement. Be adversarial: a review that finds nothing on a first round is
suspect — say explicitly what you tried (which forms you conjugated, which acceptable_answers you
tried to break).
