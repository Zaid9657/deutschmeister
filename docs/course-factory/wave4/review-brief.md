# Adversarial review brief (Opus reviewer) — Wave 4

You review ONE deliverable set named in your prompt against `S/wave4/level-a2.1.md` (binding) and
the author brief named in your prompt. You do not edit the deliverable. Write
`S/wave4/<area>/review-<round>.md`.

Method: read the level file first; read the brief; read every file of the deliverable in full;
re-solve every exercise/check/question cold (write your own answer before reading the key); run
the validator/verify script yourself and paste its output. Then list findings as a table:
| # | file:path | severity (BLOCKING / MINOR) | quote | why | fix |
BLOCKING = any banned-grammar occurrence, any wrong German (case, ending, verb form, umlaut,
spelling), any answer key that is wrong or ambiguous (a typed item with a legitimate answer
missing from acceptable_answers is wrong), any shape/validator violation, any fact not supported
by the source transcript/text, any English in a German field, any sentence >14 words, any
duplicate of live content named in the brief. MINOR = unnatural phrasing, weak distractor, missing
exam anchoring, register slips. End with a verdict line: `VERDICT: PASS` (0 blocking) or
`VERDICT: FAIL (n blocking, m minor)`, and ≤5 lines of overall judgement. Be adversarial: a
review that finds nothing on a first round is suspect — say explicitly what you tried.
