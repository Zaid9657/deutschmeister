# Adversarial review — Wave 4 PR B, A2.1 Wortliste (round 1)

Deliverable: `words-a2.1-additions.json` (175), `words-a2.1-fixes.json` (206), `validate.mjs`,
`notes.md`. Binding: `level-a2.1.md`; brief: `vocab-brief.md`.

## What I did (so "nothing found" is not an option)

1. Read `src/components/vocab/SrsTrainer.jsx` (l.144–165), `src/components/WordCard.jsx` and
   `src/utils/wordDisplay.js` and `src/services/vocabularyService.js:29` — confirmed the render
   contract behind doubt 1 and behind the 117 `german` fixes.
2. Ran `node validate.mjs`: **0 errors, 16 warnings, exit 0** (output pasted below).
3. Recomputed **every one of the 175 plurals and articles myself** (umlaut, -n/-en/-e/-er/-s,
   n-declension, singularia tantum) and re-read every gloss and every example sentence.
4. Re-derived the collision sweep independently: exact + near-substring match of all 175
   headwords against all 1919 index entries at all 8 levels (0 exact hits; near hits listed and
   dismissed); addition↔post-fix-live duplicate check on `german` alone (not just the composite
   key); duplicate-example-sentence check within additions, within live, and across the two.
5. **Applied the 206 fixes to a copy of the 248 live rows and ran the author's own
   `checkGerman()` over all 248 post-fix sentences** — something `validate.mjs` never does.
   That is what produced BLOCKING-1/2.
6. Ran a second, wider null-article-adjective detector (any lowercase `-e/-en/-er/-es/-em`
   token before a capitalised noun with no determiner or contraction in front) over all 423
   post-fix + new sentences, to catch what the author's fixed `ADJ_STEMS` list cannot.
7. Verified all 117 `german` fixes mechanically: every article-carrying live row is covered
   (0 missed), no `article`-column/prefix mismatch, no row loses an article it only had inline.

```
additions: 175  (nouns 112, verbs 38, adj/adv/chunks 25)
  Celebrations & Invitations: 22   Clothing & Appearance: 22   Family & Relationships: 21
  Health & Body: 22   Home & Moving: 22   Media & Communication: 22
  Offices & Forms: 22   Travel & Holidays: 22
fixes: 206  {"english":15,"example_sentence":32,"german":117,"plural":42}
=== ERRORS: 0 ===
=== WARNINGS: 16 ===   (all 16 = "noun stored with plural null (singulare tantum?)")
```

## Findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | words-a2.1-fixes.json (missing entry, id `48f83844…`, row `das Picknick`) | **BLOCKING** | `Bei gutem Wetter machen wir ein Picknick.` | Strong/null-article dative adjective ending — the exact class the author fixed 13 times (`aus hellem Holz`, `mit buntem Papier`, `dichter Nebel`). The row got its `german` fix but its sentence was never audited, so a banned-grammar sentence ships. The author's own `strongAdjective()` flags it. | Add a 33rd `example_sentence` fix, e.g. `new: "Bei schönem Wetter…"` ✗ (same defect) → `"Wir machen am Sonntag ein Picknick im Park."` |
| 2 | vocab/validate.mjs (l.115+) | **BLOCKING** | `for (const a of additions) { … checkGerman(label, a.example_sentence) }` | `checkGerman` runs on the 175 additions and the 32 rewritten sentences only. The other **216 live sentences are never gated**, so the brief's "audit all 248 rows" is unverified by the validator that is supposed to prove it — and that is precisely how #1 survived. | After the post-fix patch block, loop the 248 patched rows through `checkGerman` + `containsHeadword`; fix the three false-positive classes in #6 first or it will not go green. |
| 3 | words-a2.1-fixes.json / notes.md §doubt 2 | **BLOCKING (escalated — decision required, not author error)** | `sich waschen`, `sich kämmen`, `sich rasieren`, `sich schminken`, `sich anziehen`, `sich ausruhen`, `sich beeilen`, `sich fertig machen`, `sich bewerben` + their sentences (`Sie kämmt sich jeden Morgen vor dem Spiegel.`) | `level-a2.1.md` names `sich waschen ✗` explicitly and says "any occurrence is a blocking defect". Nine rows and seven sentences ship against the binding file. The brief forbids delete/re-categorise, so it genuinely cannot be fixed inside this deliverable. | **My call: keep the rows, change the level file.** They are Goethe A2 Wortliste core and dropping them costs exam coverage; moving them to A2.2 (author's option B) hides A2 words behind a paywall level for no pedagogical gain. Add one line to `level-a2.1.md`: reflexive verbs may stand as Wortliste headwords with a receptive example sentence, but never in an exercise, a check statement or a rule text. That must land in the same PR, or the level file and the deck contradict each other. |
| 4 | words-a2.1-fixes.json (row `das Hobby`) | MINOR | `Mein Hobby ist Kochen und Lesen.` | Number mismatch introduced *by the fix*: a singular subject with two predicate nouns. Natives say `Meine Hobbys sind Kochen und Lesen.` | `Mein Hobby ist Kochen.` (5 w, keeps the headword singular). |
| 5 | words-a2.1-fixes.json (row `das Möbelstück`) | MINOR | `gehörte meiner Großmutter` → `ist von meiner Großmutter` | Silently changes the meaning (belonged to → is from). `gehören` is an allowed A2.1 dative verb, so the Präteritum defect is removable without touching the sense. | `Dieses alte Möbelstück gehört meiner Großmutter.` |
| 6 | vocab/validate.mjs | MINOR | `/\b(des|der)\s+[A-ZÄÖÜ][a-zäöüß]+(s|es)\b/` ; `DET` ; `am liebsten` | Three false-positive classes that will reject legitimate round-2 content: "Genitiv" fires on nominative `der Bus` / `der Ausweis`; `DET` omits the contractions, so the correct weak endings `am großen Marktplatz` (Rathaus) and `zur kleinen Insel` (Fähre) are reported as strong endings; `am liebsten` is flagged Superlativ although `level-a2.1.md` allows it as a fixed adverb. Also `strongAdjective()` returns only the *first* match per sentence. | Require a following noun-with-Genitiv context for the Genitiv rule; add `im|am|zum|zur|vom|beim|ins|ans` to `DET`; whitelist `am liebsten`/`am meisten`; scan all matches. |
| 7 | words-a2.1-fixes.json (row `die Rechnung`) | MINOR | `Könnte ich bitte die Rechnung haben?` | `level-a2.1.md` whitelists only `könnten Sie …` / `würden Sie …`; 1st-person `Könnte ich` is outside the list, and the author's own validator errors on it — yet it is neither fixed nor mentioned in notes.md. Same-family politeness, so not blocking, but the fix set must be consistent with its own gate. | Either `Ich möchte bitte die Rechnung.` or widen the whitelist in `level-a2.1.md` to `könnte ich …`. |
| 8 | words-a2.1-additions.json (`Weihnachten`, `Ostern`, `Silvester`) | MINOR | `"article": "das"` | Duden lists them as neuter, but nobody says *das Weihnachten*; the SRS front will render `das Weihnachten` while the card's own sentence correctly writes `An Weihnachten …`. The deck already has an article-less shape (`Zahnschmerzen`, `Großeltern`). | `article: null`, gloss `Christmas (usually without article)`; then relax the validator's "capitalised noun without an article" rule to accept that marker. |
| 9 | words-a2.1-additions.json (Wortliste membership) | MINOR | `Witwe`, `Makler`, `Behörde`, `Bescheinigung`, `Geburtsurkunde`, `Steuernummer`, `betreuen`, `erziehen`, `Baumwolle`, `Lautsprecher`, `Umzugskarton`, `mitfeiern` | `level-a2.1.md` bans "vocabulary outside the Goethe A2 Wortliste (when in doubt, choose the more basic word)". notes.md answers only the *index-collision* half of the brief's rule and never states a Wortliste check was done, so the claim "no case to note" is narrower than it reads. Several of these are B1. | Either swap the clearest B1 rows (`Witwe`→`Nachbarin` is taken; `Witwe`, `Makler`, `betreuen`, `Baumwolle`) for A2 core, or add one paragraph to notes.md stating the Wortliste was consulted and why the Behörden set is kept (the brief itself demands an "Offices & Forms" category, which forces some of it). |
| 10 | words-a2.1-additions.json (`Krawatte`, `Stoff`, `aussehen`) | MINOR | `passt gut zu dem Hemd` · `Der Stoff von dem Kleid` · `In dem Kleid siehst du gut aus.` | Uncontracted `zu dem / von dem / in dem` before a neutral noun is unnatural; `level-a2.1.md` teaches `zum/vom/im` as the A1 default. Three of 175 sentences read like textbook glue. | `zum Hemd`, `vom Kleid`, `In dem Kleid` → `Das Kleid steht dir gut.` ✗ (loses headword) → `Du siehst in dem Kleid gut aus.` still uncontracted; use `Im blauen Kleid siehst du gut aus.` |
| 11 | words-a2.1-additions.json (`Notfall`, `Bewegung`, `Wettervorhersage` fix) | MINOR | `Im Notfall rufst du die Nummer 112.` · `Bewegung ist gut für den Rücken.` · `Die Wettervorhersage für morgen meldet viel Regen.` | 1: `eine Nummer rufen` is not the collocation (`wählst du die 112` / `rufst du die 112 an`). 2: brief asks nouns to appear "with an article/possessive"; this one is bare. 3: the replacement collocation is barely better than the `sagt … an` it replaced — a forecast `sagt … voraus` or `Für morgen ist Regen angesagt`. | `Im Notfall wählst du die Nummer 112.` · `Die Bewegung ist gut für den Rücken.` · `Die Wettervorhersage für morgen ist nicht gut.` |

## Judgement on the author's doubts

- **Doubt 1 (`null` vs `"–"`) — author is right, keep `null`.** Verified in the code, not from the
  brief: `SrsTrainer.jsx:161` guards `word.plural && word.plural !== 'null'`, so `"–"` would print
  a literal `Plural: –` line on 16 new cards plus every A1 singulare tantum, and
  `vocabularyService.js:29` maps the same two cases to `''` for `WordCard` (which does not render
  the plural at all). The brief's `"–"` contradicts the live A1.1/A1.2 data it also tells you to
  follow; following the data is correct. The 16 deliberate WARNs are the right way to surface it.
- **Doubt 2 (nine reflexives) — real, correctly escalated, decision in BLOCKING-3.**
- **The six `plural → null` decisions are sound.** `Wetter/Donner/Nebel/Regen` have no everyday
  plural. `Himmel` and `Sonne` *do* have grammatical plurals (`die Himmel`, `die Sonnen`), but both
  are poetic/astronomical, neither is A2, and `die Sonne` is already stored `null` at A1.2 — a
  divergent A2.1 row would show one deck two conventions for the same headword. Keep `null`.
  (`Sekt` → `null` is additionally right because `Sekte` collides with a different word.)
- **Doubts 3, 4, 6, 7 — agree, leave as-is.** `sollte/solltest` is morphologically the topic-11
  Präteritum; `nächstes/letztes Jahr` is the same frozen shape `level-a2.1.md` itself uses in
  `bis nächste Woche`; the 15 gloss fixes are cheap consistency and worth keeping.

## Overall

Strong, unusually honest work: the 117 `german` fixes are complete (I verified all article-carrying
rows are covered, with no article-column mismatch and no row silently losing its article), all 175
articles and plurals recomputed independently are correct, no headword collides at any level, no
duplicate sentence anywhere, and 31 of the 32 sentence rewrites are genuine level violations with
accurate reasons. The failure is one of gate design, not of German: the validator only checks what
is new, so the one live sentence the human eye slipped on (`Picknick`) sails through a green run —
and the same blind spot hides `Könnte ich …`. Close the gate, add the 33rd fix, and get an owner
ruling on the nine reflexives before this ships.

VERDICT: FAIL (3 blocking, 8 minor)
