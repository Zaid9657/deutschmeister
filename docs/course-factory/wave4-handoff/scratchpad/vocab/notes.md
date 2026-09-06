# A2.1 Wortliste — additions + fixes (Wave 4, PR B)

Deliverables in `S/wave4/vocab/`: `words-a2.1-additions.json`, `words-a2.1-fixes.json`,
`validate.mjs` (0 errors / 16 warnings, all deliberate — see below), plus the two data
builders (`build-additions.py`, `build-fixes.py`) that generated the JSON, kept so the
reviewer can see every string in one place and re-generate after a round-2 change.
`_index-bare.txt` is a scratch dump of the 1919 article-stripped headwords in
`all-words-index.json`, used for the collision sweep.

## Additions — 175 rows, 8 new categories

| category | rows | | category | rows |
|---|---|---|---|---|
| Health & Body | 22 | | Clothing & Appearance | 22 |
| Home & Moving | 22 | | Family & Relationships | 21 |
| Offices & Forms | 22 | | Media & Communication | 22 |
| Travel & Holidays | 22 | | Celebrations & Invitations | 22 |

112 nouns (64 %), 38 verbs (22 %), 25 adjectives/adverbs (14 %) — the brief's 60/25/15.
Every headword is new at **every** level: the validator strips `der|die|das` from all 1919
index entries and rejects any match, so there is **no** "already at a2.2/b1.x but re-added"
case to note. Nouns carry article + plural; verbs are bare infinitives with the Perfekt in
`english` only where it is irregular or separable (`(hat gestrichen)`, `(ist aufgewachsen)`);
the two plurale-tantum rows (`Zahnschmerzen`, `Rückenschmerzen`) follow the live A1.2 shape:
`article` null, `plural` null, `"(Pl.)"` in the gloss. Every example sentence is ≤ 12 words,
contains its headword, and stays inside `level-a2.1.md`.

Family & Relationships has 21 rather than 22 because A1.1/A1.2 already own nearly every
kinship word (Onkel, Tante, Enkel, Neffe, Nichte, Schwiegermutter/-vater, Stiefvater/-mutter,
Zwilling, Beziehung, Freundschaft, Streit, Trennung, verheiratet, ledig …). The remaining
in-list A2 candidates were `Erwachsene`/`Jugendliche`/`Verwandte`, all adjectival nouns whose
declension is exactly the null-article pattern A2.1 bans — deliberately excluded.

## Fixes — 206 entries over 248 audited rows, one entry per (id, field)

| defect class | field | count |
|---|---|---|
| article baked into the headword ("der Bahnhof" + article "der") | german | 117 |
| plural carries the article ("die Gewitter") — all of Weather + Work & Jobs | plural | 29 |
| plural is the literal string `"null"` (Freizeit, Verkehr, Schnee, Teilzeit, Vollzeit) | plural | 5 |
| plural is not a real everyday plural → JSON null (Wetter, Donner, Nebel, Regen, Himmel, Sonne) | plural | 6 |
| same, outside the article class (Alltag, Kundenservice) | plural | 2 |
| English gloss starts with "the" (only Restaurant & Ordering does this) | english | 15 |
| example sentence breaks the level constraint or is wrong German | example_sentence | 32 |

The 32 sentence fixes by violation: strong/null-article adjective endings 13; Futur I /
`werden` 3; Nebensatz (`bis …`, `dass …`) 2; Genitiv 2; infinitive with `zu` / `um … zu` 2;
Präteritum of a full verb (`gab`, `gehörte`) 2; Superlativ (`liebstes`) 1; reflexive in
production (`entspanne ich mich`) 1; ungrammatical Ersatzinfinitiv (`warten gemusst`) 1;
Satzklammer word order (`umgeworfen gestern`) 1; unidiomatic collocation (`sagt Regen an`) 1;
off-list vocabulary (`Controller`) 1; headword missing / sentence duplicated across two cards 2.

Nothing was deleted or re-categorised. `validate.mjs` applies all 206 fixes to a copy of the
248 live rows and re-checks `UNIQUE (german, level, category)`: 0 collisions, and none of the
175 additions collides with a post-fix row either. Six headwords legitimately exist twice at
a2.1 in different categories (Regal, Spiegel, Haltestelle, Kreuzung, Parkplatz, Ampel) — the
unique key includes the category, so stripping the articles is safe.

## Doubts / decisions for the reviewer

1. **`plural` for singularia tantum: JSON `null`, not `"–"`.** The brief says `"–"` *and*
   "use the convention already live at A1.2" — those disagree. Measured: every A1.2
   singulare tantum (Schokolade, Sonne, Haut, Butter, Milch, Obst, the nine `"null"`-string
   rows) was set to JSON `null` in Wave 3, and `SrsTrainer.jsx` guards with
   `word.plural && word.plural !== 'null'`, so `null` renders no plural line while `"–"`
   would render `Plural: –`. I followed the live data. Flipping to `"–"` is a one-line change
   in both builders, but it should then be applied to A1.1/A1.2 too or the deck diverges.
   The 16 validator WARNs are exactly these rows, surfaced on purpose.
2. **Nine live rows have reflexive headwords — RESOLVED in round 2.** `level-a2.1.md` now
   carries a "Wortliste exception (ruling 2026-09-06, Wave 4 PR B review)": Goethe A2 reflexive
   verbs may stand as RECEPTIVE Wortliste headwords with an example sentence showing the chunk,
   and stay banned in every exercise, check statement, production task and rule text. The nine
   rows are kept unchanged on that basis, and `validate.mjs` encodes the exception (it suppresses
   the reflexive warning only for rows whose own headword is reflexive, and prints the count).
   Original round-1 wording follows for the record:
   ~~Nine live rows have reflexive headwords~~ — `sich anziehen`, `sich ausruhen`,
   `sich beeilen`, `sich fertig machen`, `sich kämmen`, `sich rasieren`, `sich schminken`,
   `sich waschen` (Daily Routine) and `sich bewerben` (Work & Jobs). `level-a2.1.md` bans
   reflexive verbs in production; their example sentences cannot avoid the reflexive without
   changing the headword, which would be a delete/replace the brief forbids. **Escalating**:
   either A2.1 tolerates reflexives as vocabulary (they are in the Goethe A2 Wortliste), or
   these nine rows move to A2.2 in a separate migration.
3. **`sollten` / `solltest`** (rows `der Bürgersteig`, `sollen (Empfehlung)`) read as
   Konjunktiv II advice, but `sollen` has no umlaut, so the form is morphologically the
   Präteritum that topic 11 teaches. Left unchanged; say the word if you want them switched
   to plain `soll`.
4. **`nächstes Jahr` / `letztes Jahr`** (rows `wollen (Wunsch)`, `Führerschein`) are
   null-article adjective endings, but `level-a2.1.md` itself uses `bis nächste Woche` as an
   allowed topic-12 form, so banning them would contradict the level file. Left unchanged.
5. **Off-Wortliste headwords I could not fix**: `Sideboard` (Furniture) is not Goethe A2, and
   `gekonnt` / `gemusst` / `gewollt` plus the six `können (Erlaubnis)`-style parenthesised
   entries are grammar labels rather than words. All are headwords, so fixing them means
   replacing the row — out of scope here.
6. **The 15 English-gloss fixes** are a consistency call, not a translation error: one
   category glosses "the bill", the other nine and both A1 levels gloss bare. Drop that class
   if you would rather keep the diff to hard defects.
7. `Rinderbraten` (row `das Tagesgericht`) and `Fernbedienung` (row `Couchtisch`) are outside
   the A2 Wortliste but only appear inside sentences, not as headwords. Left as-is; both are
   transparent compounds.


## Round 2 changes (after `review-1.md`, VERDICT FAIL — 3 blocking, 8 minor)

**BLOCKING-1 — missing `das Picknick` fix.** Added as the 33rd sentence fix:
`Bei gutem Wetter machen wir ein Picknick.` → `Wir machen am Sonntag ein Picknick im Park.`
(strong dative adjective ending, same class as `aus hellem Holz`).

**BLOCKING-2 — the gate only checked what was new.** `validate.mjs` now applies all 208 fixes to
a copy of the 248 live rows and runs `checkGerman()` **plus** `containsHeadword()` over all 248
patched sentences as well as the 175 additions — 423 sentences per run. It prints
`gated 248 post-fix live rows + 175 additions`. That is what the review's own run surfaced, and
running it now reproduces both finds before the fixes and green after. Headword presence on the
248 live rows is a WARNING, not an error: the stem test cannot see a vowel change
(dürfen→darf, können→kann, mögen→mag, verlieren→verloren), which is exactly the 9 remaining
warnings — all verified by hand as correct German.

**BLOCKING-3 — the nine reflexives.** Ruling taken, level file updated; see doubt 2 above.

**Minors.** #4 `Mein Hobby ist Kochen.` (number agreement). #5 reverted to
`Dieses alte Möbelstück gehört meiner Großmutter.` — the reviewer is right that `gehören` is an
allowed A2.1 dative verb, so the Präteritum defect is removable without the `belonged to → is
from` meaning change. #6 three validator false-positive classes fixed: the Genitiv rule now
requires a head noun in front (`der Bus` no longer fires), `DET` gained the contractions
`im|am|zum|zur|vom|beim|ins|ans|…` (so `am großen Marktplatz`, `zur kleinen Insel` are correct
weak endings, not strong ones) plus the common adverbs, `am liebsten`/`am meisten` and the
`könnten Sie`/`würden Sie`/`möchte` chunks are whitelisted per the level file, and
`strongAdjective()` scans every match rather than the first. #7 `Könnte ich bitte die Rechnung
haben?` → `Können wir bitte die Rechnung haben?` — the level file whitelists only
`könnten Sie …`/`würden Sie …`, so first-person `Könnte ich` had no citation and was rewritten
(34th sentence fix). #8 `Weihnachten`/`Ostern`/`Silvester` now carry `article: null` with the
gloss marker `(usually without article)`; the validator accepts that marker alongside `(Pl.)`.
#10 contractions: `zum Hemd`, `vom Kleid`, `Im blauen Kleid siehst du gut aus.` #11
`Im Notfall wählst du die Nummer 112.`, `Die Bewegung ist gut für den Rücken.`,
`Die Wettervorhersage für morgen ist nicht gut.`

**#9 — Wortliste membership.** I did consult the Goethe-Zertifikat A2 Wortliste themes; round 1
only *reported* the index-collision half, which read narrower than intended. Six of the twelve
flagged headwords were swapped for A2 core: `Witwe`→`Hochzeitstag`, `Makler`→`Haustür`,
`betreuen`→`aufpassen`, `erziehen`→`sorgen`, `Baumwolle`→`Handtasche`, `mitfeiern`→`einpacken`.
Six are kept, with reasons: `Behörde`, `Bescheinigung`, `Geburtsurkunde` and `Steuernummer`
belong to the "Offices & Forms" category the brief itself mandates — the Behörden theme cannot
be built from `Amt`/`Formular`/`Ausweis` alone, and these are the words an adult actually meets
at a Bürgeramt; `Lautsprecher` is an everyday device word in the same family as the already-live
`Kopfhörer`/`Akku`/`Ladekabel` at other levels; `Umzugskarton` is a transparent compound of
`Umzug` (already an index headword) and `Karton`. Category counts are unchanged (8 × 22, minus
one in Family & Relationships).

**Final run:** `node validate.mjs` → exit 0, `ERRORS: 0`, `WARNINGS: 21` — 12 deliberate
singularia-tantum notices and 9 vowel-change headword-presence notices on pre-existing live
rows. Counts: 175 additions (112 nouns / 38 verbs / 25 adj-adv), 208 fixes
(`german` 117, `plural` 42, `example_sentence` 34, `english` 15).


## Round 3 changes (after `review-2.md`, VERDICT FAIL — 1 blocking, 7 minor)

**BLOCKING — 24 adverbs in `DET`.** Removed; only the contractions
(`im am zum zur vom beim ins ans aufs fürs übers unters durchs ums`) remain, because those
really do carry an article. The reviewer is right that an adverb in that slot proves the
opposite — no determiner, therefore a strong ending — so `strongAdjective()` was inverted for
`Ich trage gerne sportliche Schuhe.` Removing them costs nothing: the run is still ERRORS 0.

**The gate now tests itself.** `validate.mjs` carries a self-test block: **18 known-banned
probes** (the reviewer's 8 slipped strings — the five adverb/`nicht` strong-adjective cases,
`Das Auto der Frau ist neu.`, `am Ende der Woche`, `größer als` — plus one probe per class this
deliverable actually fixed: Genitiv with -s, dass-Nebensatz, Futur I, strong dative adjective,
um…zu, Präteritum of a full verb, Superlativ, out-of-list Konjunktiv II, reflexive without a
reflexive headword, >12 words) and **11 known-legal probes** (weak endings after `am`/`zur`,
ein-word declension, definite plural `-en`, `könnten Sie`, `am liebsten`, `möchte`, modal
Präteritum, dative `der` both sentence-initial and mid-sentence, and a reflexive sentence WITH
`reflexiveHeadword`). A bad probe must be caught as an error or — for the warn-level reflexive
rule — as a warning; a legal probe must raise no error. Any failure prints
`SELF-TEST FAIL: …` and `process.exit(1)`. Current run: `self-test: 18 banned + 11 legal
probes, 0 failure(s)`.

**Minors.** #2 Komparativ `\w+er als` → `[a-zäöüß]+er\s+als\b` (JS `\w` excludes ä ö ü ß, so
`größer als` was invisible). #3 new `genitivAttribute()` catches the article-only Genitiv
(`Noun + der/des + Noun`, e.g. `am Ende der Woche`, `das Auto der Frau`) that the `-s` rule
could never see; a sentence-initial preposition head (`Auf der Torte …`) is excluded as dative,
and that exclusion is itself a GOOD probe. #4 `freu(?=e\b|st\b…)` — the doubled backslash was a
literal `\b` inside a regex literal, so the lookahead was dead. #5 reverted to
`Bewegung ist gut für den Rücken.` — the reviewer's correction of their own round-1 advice is
right: generic mass nouns take the zero article, and `Schmuck`, `Halbpension`, `Wäsche`,
`Kleidung`, `Blut`, `Ausland`, `Strom`, `Liebe` already ship bare for the same reason. #6
`Meine Eltern haben morgen Hochzeitstag.` #7 gloss now `to take care of (sorgen für + Akk)`, so
the load-bearing preposition is on the card and `sorgen um`/reflexive `sich sorgen` are not
invited. #8 `EXPECTED_WARNINGS` is pinned; a divergence prints a NOTE naming what the expected
set is.

**Warning count is now 22, not 21.** Dropping the adverbs from `DET` costs exactly one new
false positive — `live row "Tagesgericht": possible null-article adjective ending ("heute"):
"Das Tagesgericht ist heute Rinderbraten."` — from the heuristic `ist|sind + word + Noun`
warning pattern. I did **not** re-add an adverb list to silence it: that is the change that
caused the regression, and a warn-level false positive is the cheaper side of the trade.
Final: ERRORS 0, WARNINGS 22 = 12 singularia tantum + 9 vowel-change headword notices +
1 adverb false positive, self-test 0 failures, exit 0.
