# Adversarial review — Wave 4 PR B, A2.1 Wortliste (round 2, delta)

Scope: verify the round-2 claims in `notes.md` against the actual files. Everything the author
says was changed, was changed — and the content is now clean. One change went further than the
review asked and tore a hole in the gate.

## What I did

1. `node validate.mjs` → `gated 248 post-fix live rows + 175 additions (9 reflexive headwords …)`,
   **ERRORS 0, WARNINGS 21, exit 0** (12 singularia-tantum + 9 vowel-change headword notices; I
   hand-checked all 9 — `verlieren/verloren`, `dürfen/darf`, `können/kann`, `mögen/mag` — all correct).
2. Re-verified byte-exactness of all 208 `old` values against `source/words-a2.1.json`
   independently of the validator: **0 failures**, 208 unique `(id, field)` pairs.
3. Re-read all 34 sentence fixes, the 6 swapped headwords, the 3 article-null celebration rows and
   the 5 minor sentence rewrites; recomputed article/plural/gloss for each new row.
4. **Probed the gate with 20 known-banned and 8 known-legal strings** (harness deleted after use).
5. Re-ran my own independent strong-adjective sweep (contractions in the determiner set, adverbs
   *not*) over all 423 post-fix + new sentences, since the gate can no longer be trusted for it.

```
probe: 20 banned strings, 8 slipped through; 8 legal strings, 0 wrongly rejected
FALSE NEGATIVE [strong adj after adverb gerne]   Ich trage gerne sportliche Schuhe.
FALSE NEGATIVE [strong adj after adverb immer]   Er trägt immer elegante Schuhe.
FALSE NEGATIVE [strong adj after adverb gestern] Ich habe gestern gutes Brot gekauft.
FALSE NEGATIVE [strong adj after adverb sehr]    Das ist sehr schöne Kleidung.
FALSE NEGATIVE [strong adj after nicht]          Das sind nicht neue Schuhe.
FALSE NEGATIVE [Genitiv der+Frau (no -s)]        Das Auto der Frau ist neu.
FALSE NEGATIVE [Genitiv am Ende der Woche]       Das Gehalt kommt am Ende der Woche.
FALSE NEGATIVE [Komparativ]                      Mein Bruder ist größer als ich.
```

## Findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | vocab/validate.mjs (`DET`) | **BLOCKING (round-2 regression)** | `…|aufs|fürs|übers|unters|durchs|ums|heute|morgen|gestern|immer|oft|gern|gerne|sehr|nur|schon|noch|wieder|gleich|bald|hier|dort|jetzt|dann|leider|vielleicht|wirklich|meistens|nicht|auch)$` | Round-1 finding #6 asked for the **contractions** (`im am zum zur vom beim ins ans`) — correct, they mark a real determiner. The patch also added **24 adverbs**, and `strongAdjective()` treats the token before the adjective as *proof a determiner is present*. An adverb in that slot proves the opposite: no determiner ⇒ strong ending ⇒ banned. Five probes slip through, including `Ich trage gerne sportliche Schuhe.` — the exact string written in the comment two lines above `ADJ_BEFORE_NOUN` as the thing this check exists to catch. The gate that caught `das Picknick` would no longer catch it if the adverb `gerne` stood in front. | Delete the 24 adverb alternatives; keep the contractions. I verified this costs nothing: with the adverbs removed the run is still **ERRORS 0** on all 423 sentences, so they were never needed. |
| 2 | vocab/validate.mjs (BANNED, Komparativ) | MINOR (pre-existing, latent) | `/\b\w+er\s+als\b/i` | JS `\w` without `/u` excludes `ä ö ü ß`, so `größer als`, `älter als`, `wärmer als`, `kürzer als` all pass. No corpus hit today (I checked all 423), so latent — but the umlauted comparatives are the frequent ones. | `/[a-zäöüß]+er\s+als\b/i`. |
| 3 | vocab/validate.mjs (BANNED, Genitiv) | MINOR (pre-existing, latent) | `[A-ZÄÖÜ][a-zäöüß]+\s+(?:des|der)\s+[A-ZÄÖÜ][a-zäöüß]+(?:s|es)\b` | The `-s` requirement means feminine/plural Genitives never fire: `am Ende der Woche`, `das Auto der Frau`, `die Farbe der Jacke`. The round-1 defect class (`die Ankunft des Zuges`) is caught; its feminine twin is not. 0 corpus hits today. | Add an alternative for `Noun + der + Noun` where the first noun is a head noun (or accept the false-positive risk and warn). |
| 4 | vocab/validate.mjs (`REFL_STEMS`) | MINOR | `freu(?=e\\b|st\\b|t\\b|en\\b)` | Inside a regex **literal** `\\b` is a literal backslash + `b`, not a word boundary, so this lookahead can never match and `freuen` is invisible to the reflexive check. Warn-only path and no corpus hit (`freundlich` is the only `freu` in either file), so latent. | `freu(?=e\b|st\b|t\b|en\b)`. |
| 5 | words-a2.1-additions.json (`Bewegung`) | MINOR (**my round-1 advice was wrong**) | `Die Bewegung ist gut für den Rücken.` | Generic mass nouns take the zero article in German; with `die` it reads "the movement", not "exercise". My round-1 #11 applied the brief's "nouns with an article/possessive" to a case where it does not hold. | Revert to `Bewegung ist gut für den Rücken.` and note in `notes.md` that the article rule exempts generic mass nouns (`Bewegung`, `Schmuck`, `Halbpension` already ship bare). |
| 6 | words-a2.1-additions.json (`Hochzeitstag`) | MINOR | `Der Hochzeitstag von meinen Eltern ist morgen.` | Grammatical and correctly avoids the Genitiv, but stilted — `von + Dat` for a possessor of a date reads translated. | `Meine Eltern haben morgen Hochzeitstag.` (5 w, same grammar budget). |
| 7 | words-a2.1-additions.json (`sorgen`) | MINOR | `"english": "to take care (of)"` | The preposition is load-bearing (`sorgen für` + Akk) and the near neighbour `sich sorgen` is a banned reflexive. A bare `sorgen` card invites `sorgen um`. | Headword `sorgen für`, or gloss `to take care of (sorgt für)`. |
| 8 | vocab/validate.mjs (live `containsHeadword`) | MINOR | `warn(\`${label}: example_sentence may not contain the headword\`)` | Downgrading to a warning is the right call for vowel-change stems, but it also means a genuinely headword-less live row would now pass silently. All 9 current warnings are correct German (hand-checked). | Keep, but assert the warning **count** (`9`) so a new one has to be looked at. |

## Verification of the author's round-2 claims

- **BLOCKING-1 closed.** `das Picknick`: `Bei gutem Wetter …` → `Wir machen am Sonntag ein Picknick im Park.` (8 w, in-level, natural), `old` byte-exact. 34 sentence fixes, count matches.
- **BLOCKING-2 closed.** The gate now patches the 248 rows and runs `checkGerman` + `containsHeadword` over 423 sentences; the reflexive exemption is scoped to `opts.reflexiveHeadword`, set only where `german` contains `sich`, and only silences the reflexive **warning** — additions are unaffected. Verified by re-reading the block, not by trusting the banner.
- **BLOCKING-3 closed as ruled.** `level-a2.1.md` now carries `## Wortliste exception (ruling 2026-09-06…)` scoping reflexives to receptive headwords and keeping them banned in exercises, check statements, production tasks and rule text — which is what I asked for, worded tighter than I asked it.
- **Minors 4, 5, 7, 8, 10 closed and correct.** `Mein Hobby ist Kochen.`; `Dieses alte Möbelstück gehört meiner Großmutter.` (meaning restored); `Können wir bitte die Rechnung haben?`; `Weihnachten/Ostern/Silvester` now `article: null` + `(usually without article)`; `zum Hemd`, `vom Kleid`, `Im blauen Kleid siehst du gut aus.` (weak `-en` after `im` — correct).
- **The six swaps check out.** `der Hochzeitstag/Hochzeitstage`, `die Haustür/Haustüren`, `die Handtasche/Handtaschen`, `aufpassen (auf + Akk)`, `sorgen (für + Akk)`, `einpacken (hat eingepackt)` — articles, plurals, glosses and sentences all correct and in-level; no index collision at any level, no duplicate sentence, category counts unchanged (8 × 22 − 1), ratio still 112/38/25.
- **Content is clean.** My independent strong-adjective sweep over all 423 sentences returns only
  verb+`Sie` and adverb false positives plus the agreed `nächstes/letztes Jahr`; 0 shape failures.

## Overall

The three blocking finds are genuinely closed and the German is now clean end to end — I could not
find a single remaining banned form, wrong article, wrong plural or unnatural fix in the data. The
one failure is that the gate was widened past the request: 24 adverbs in `DET` silently invert the
strong-adjective test, and I proved they buy nothing (removing them leaves the run green). Delete
that one list and this ships. Everything else in this round is latent regex hygiene and one
correction to my own round-1 advice.

VERDICT: FAIL (1 blocking, 7 minor)
