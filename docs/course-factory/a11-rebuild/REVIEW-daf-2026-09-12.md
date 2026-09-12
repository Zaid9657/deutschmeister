# A1.1 — DaF-Fachreview vor dem Verkauf (2026-09-12)

Reviewer role: DaF teacher (Erwachsenenbildung, Integrationskurs) and Goethe *Start Deutsch 1*
examiner. Scope: `src/data/curricula/a11.js` (all 12 Lektionen, every field), the drawn practice
items from `src/data/lessonPools/a11.json` via `src/lib/lesson/buildLesson.js` (attempt 1,
deterministic), measured against `docs/course-standard-2026-09-12.md` §2–§3 and
`docs/course-factory/a11-rebuild/CONTRACT.md`.

Method note: the 7 controlled items per Lektion were **computed, not assumed** — a script imported
`pickPracticeItems(pool, lektion.practiceRule, seedFor('a1.1', nr, 1))` and printed the real picks.
Appendix A lists them. Everything in this review about practice is about what a learner actually
sees on attempt 1.

## Verdict in one paragraph

The **skeleton is professional and the curriculum data is genuinely good**: 12 situations in the
consensus order, 255 unique Wortfeld entries with article and plural, dialogues that are short
(≤ 10 words per line, ≤ 10 lines), 12 distinct primary grammar slugs, notice cards all under 60
words with verbatim dialogue examples, valid dictation and read-aloud indices, real SD1 Teil names.
That is more structure than most €40 online A1 courses have. **But I would not put my name on it
today.** Five findings are hard blockers (a factually false claim about the alphabet; a der/die/das
card whose two examples are dative; a dialogue line that contradicts its own grammar card; an
exercise that marks the correct answer wrong; and — worst — a *free first lesson* whose practice is
five English-respelling items like "Es klingt wie **HOY-tuh**"). Underneath those sits one systemic
problem: **the practice pool is a legacy grammar drill bolted onto a situational syllabus.** Across
the 12 Lektionen the drawn items talk about *die Sonne, die Nation, die Freiheit, das Mädchen, ein
Bild, Fußball, Tom, Anna, ein Schlüssel* — and **`das Mädchen` is drilled in five of the twelve
Lektionen**. Not one drawn item at the Flohmarkt mentions a price, and not one in the Café mentions
a drink. Fix the five blockers, re-tag the pool to the situations, and this becomes a course I would
recommend; ship it as is and the first teacher who opens Lektion 1 will stop reading at "HOY-tuh".

**Counts:** 5 BLOCKER · 45 MAJOR · 25 MINOR (75 findings in the Lektion tables), plus 1 MAJOR course-level finding on `hoursTotal` (§4 below).

---

## Lektion 1 — „Hallo, ich bin …“ (Begrüßung, Vorstellen, Alphabet)

| Feld | Zitat | Problem | Fix (pasteable) | Schwere |
|---|---|---|---|---|
| notice.bodyDe | „Vier Zeichen gibt es nur im Deutschen: **ä, ö, ü** und **ß** (Eszett).“ | Sachlich falsch. ä/ö/ü gibt es u. a. im Schwedischen, Finnischen, Estnischen, Türkischen und Ungarischen. Nur ß ist deutschspezifisch — und fehlt im Schweizer Standard. Eine falsche Tatsachenbehauptung in der allerersten Grammatikkarte des Kurses. | `bodyDe: 'Beim Buchstabieren sagst du jeden Buchstaben einzeln. Vorsicht bei vier Paaren: **E** [eː] und **I** [iː], **G** [geː] und **J** [jɔt], **V** [faʊ] und **W** [veː]. **Y** heißt *Ypsilon*, **ß** heißt *Eszett* oder *scharfes S*. Frag im Zweifel: **Wie buchstabiert man das?**'` | **BLOCKER** |
| practice (gezogen) | „Es klingt wie **"HOY-tuh"**. Schreib das Wort: ___“ · „Es klingt wie **"SHTRAH-suh"**“ · „Es klingt wie **"SHoo-leh"**“ (L2) · „Es klingt wie **"TSvahn-tsig"**“ · „Es klingt wie **"mine"** und bedeutet "my"“ | **5 von 7 Items** der ersten (kostenlosen!) Lektion sind englische Lautschrift-Umschreibungen. Das ist keine deutsche Phonetik, es ist eine Eselsbrücke für Englischsprachige, und es steht im Widerspruch zum `phonetik`-Slot derselben Lektion, der korrekt mit Silbenakzent arbeitet (`HAL-lo`, `DAN-ke`). Kein einziges der fünf Wörter (heute, Straße, Schule, zwanzig, mein) steht im Wortfeld der Lektion. Ein DaF-Kollege hört hier auf zu lesen. | Diktat- statt Umschrift-Items: alle `alphabet-pronunciation`-Items mit dem Muster `Es klingt wie "…"` aus dem Pool ausschließen (Filter in `scripts/build-lesson-pool.mjs`) und durch buchstabierbare Items aus dem Wortfeld ersetzen, z. B. `{ questionDe: 'Hören Sie: F-E-R-R-E-I-R-A. Schreiben Sie den Namen: ___', answer: 'Ferreira' }`, `{ questionDe: 'Buchstabieren Sie: „Gruß“ — welcher Buchstabe fehlt? G-R-U-___', answer: 'ß' }`. Bis der Pool neu gebaut ist: `practiceRule.topics: ['alphabet-pronunciation']` für L1 sperren und L1 aus `verb-sein` speisen. | **BLOCKER** |
| notice.bodyDe | „Wichtig sind auch drei Buchstaben mit anderem Klang: **e** [e:], **i** [i:], **v** [fau].“ | „anderer Klang“ als was? Ohne Kontrastsprache ist die Aussage inhaltsleer, und sie verfehlt genau die Buchstaben, an denen Kursteilnehmer beim Buchstabieren scheitern: E/I, G/J, V/W, Y. Die Lektion heißt „buchstabieren“ und erklärt das Buchstabieren nicht. | siehe Fix oben (ersetzt beide Sätze) | MAJOR |
| dialog / wortfeld | Ana **Ferreira** … „Land: **Marokko**“ (schreiben.sample), Wortfeld L3 „Marokko“ | *Ferreira* ist ein portugiesisch-brasilianischer Name, keiner aus Marokko. In L3 spricht Anas Familie Arabisch. Eine Prüferin merkt so etwas sofort; es wirkt wie zusammengewürfelt. | Entweder `Ana Ferreira` + Land **Portugal/Brasilien** (dann in L3 `Portugiesisch` statt `Arabisch`), oder Name **Ana Chakiri** / **Amina Ben Ali** + Marokko. Empfehlung: `{ speaker: 'Ana', de: 'Guten Tag. Ich heiße Ana Chakiri.' }` und die Buchstabierzeile auf `C-H-A-K-I-R-I` ändern. | MINOR |
| dialog l.0 / wortfeld | „**Guten Tag** und willkommen!“ — en: „Good **afternoon** and welcome!“, Wortfeld: „Guten Tag“ = „Good day“ | Dieselbe Wendung wird zweimal verschieden glossiert. | Wortfeld-`en` auf `'Good day / Good afternoon'` vereinheitlichen und die Dialogglosse identisch setzen. | MINOR |
| wortfeld | `{ de: 'heißen', wordId: null }`, `buchstabieren`, `der Buchstabe` | Drei der 20 Wörter haben `wordId: null`, d. h. **kein Audio** — darunter `heißen`, das Kernverb der Lektion. Der Kontrakt erlaubt bis zu 5, aber die Lücke sitzt auf dem wichtigsten Wort. | `heißen`, `buchstabieren`, `der Buchstabe` in `words` (sub_level `A1.1`) seeden und die UUIDs eintragen, bevor L1 live geht. | MINOR |
| schreiben | `fields: ['Familienname', 'Vorname', 'Land']` | SD1 *Schreiben Teil 1* hat **5 Lücken** in einem Formular, nicht 3. Mit 3 Feldern trainiert die Aufgabe das Format nicht. | `fields: ['Familienname', 'Vorname', 'Land', 'Sprache', 'Unterschrift']` | MAJOR |

**Scores:** German accuracy **3** · Level fit **4** · Dialogue naturalness **4** · Exam alignment **4** · Unit coherence **2**

---

## Lektion 2 — „Ich bin Studentin“ (Angaben zur Person, Beruf, Zahlen)

| Feld | Zitat | Problem | Fix (pasteable) | Schwere |
|---|---|---|---|---|
| canDo ↔ wortfeld | „Ich kann Zahlen von **null bis zehn** verstehen und sagen.“ | Das Wortfeld endet bei **neun**. Die Zehn kommt im ganzen Kurs nie als Wortfeldeintrag vor. Die Kann-Beschreibung ist nicht gedeckt. | `{ de: 'zehn', word: 'zehn', article: null, plural: null, en: 'ten', wordId: null }` nach `neun` einfügen (und wordId nachtragen). | MAJOR |
| dialog | Herr Weber (Nachbar, Treppenhaus): „Ja. **Vorname, Nachname und Wohnort, bitte.**“ · Ana: „Ist das Formular für die Adresse?“ | Kein Nachbar hält im Treppenhaus ein Formular hoch und nimmt Personalien auf. Die Szene ist konstruiert, nur damit die Formularwörter vorkommen. Genau die Unnatürlichkeit, die Lernende als „Lehrbuchdeutsch“ abtun. | Szene in die Hausverwaltung/Anmeldung verlegen: `setting: 'Ana meldet sich im Bürgerbüro an. Herr Weber arbeitet am Schalter.'` und die Zeilen entsprechend: `{ speaker: 'Herr Weber', de: 'Guten Tag. Bitte füllen Sie das Formular aus.' }` / `{ speaker: 'Ana', de: 'Ist das Formular für die Adresse?' }` / `{ speaker: 'Herr Weber', de: 'Ja. Vorname, Nachname und Wohnort, bitte.' }`. | MAJOR |
| schreiben.leitpunkte | `leitpunkte: ['Name', 'Beruf', 'Gruß']` | **„Gruß“ ist kein Leitpunkt.** In SD1 *Schreiben Teil 2* sind die drei Leitpunkte inhaltliche Punkte (Grund, Zeit, Bitte/Frage); Anrede und Gruß werden als Textsortenmerkmal *zusätzlich* bewertet. Wer „Gruß“ als Leitpunkt zählt, trainiert nur zwei Punkte und verliert in der Prüfung Punkte im Kriterium „Inhalt“. Gleicher Fehler in L6, L8, L10, L12. | `leitpunkte: ['Wer Sie sind', 'Was Sie von Beruf sind', 'Wann Sie zu Hause sind']` — und in L6/L8/L10/L12 den Eintrag `'Gruß'` jeweils durch einen Inhaltspunkt ersetzen (siehe dort). | MAJOR |
| wortfeld | `null, eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun` | 10 der 25 Einträge sind Ziffern. Der Zählerstand („+25 → 45/650“) wirkt dadurch besser, als er ist, und die Lektion verliert Platz für echte Berufe/Personalienwörter (`die Staatsangehörigkeit`, `das Geburtsdatum`, `geboren`, `wohnen`). | Zahlen 0–9 als **einen** Wortfeldeintrag führen (`{ de: 'die Zahlen 0–10', … }`) oder in einen eigenen Zahlen-Slot des Players auslagern; die frei werdenden Plätze mit `wohnen`, `das Geburtsdatum`, `die Staatsangehörigkeit`, `der Arzt / die Ärztin` füllen. | MAJOR |
| hoeren | `lines: [4, 7]` → „Ja. Vorname, Nachname und Wohnort, bitte.“ | Diktatzeile mit Aufzählungskommas und Schlusskomma; in Lektion 2 kann niemand Kommasetzung. Die Zeile wird als Fehler gewertet, obwohl das Hörverstehen stimmt. | `hoeren: { kind: 'dictation', lines: [4, 3] }` (→ „Ich bin Lehrer von Beruf.“ / „Ja, ich bin Studentin. Und Sie?“) — oder im Checker Satzzeichen normalisieren. | MINOR |
| notice | „Nach sein steht der Beruf ohne Artikel: Ich bin Lehrer. **Nicht: Ich bin ein Lehrer.**“ | Fachlich richtig und gut formuliert. Keine Beanstandung — Vorbild für die anderen Karten. | — | — |

**Scores:** 4 · 4 · 2 · 3 · 3

---

## Lektion 3 — „Meine Familie“ (Familie & Sprachen)

| Feld | Zitat | Problem | Fix (pasteable) | Schwere |
|---|---|---|---|---|
| dialog | „Und was **sprechen** deine Eltern?“ · „Sie **sprechen** Arabisch“ · „**Spricht** dein Bruder auch Englisch?“ · „Ja, er **spricht** Englisch“ | Der Vokalwechsel e→i (sprechen → spricht) taucht hier viermal als Hauptverb auf — vier Lektionen **vor** der Präsens-Lektion — und wird **im ganzen Kurs nie erklärt**. L7 sagt „Regelmäßige Verben haben feste Endungen“, woraus ein Lernender „ihr sprecht / er *sprecht*“ ableitet. Der Standard nennt „Präsens **incl. Vokalwechsel**“ ausdrücklich als A1.1-Decke; der Kurs deckt sie nicht ab. | In L7 eine zweite Zeile in die notice: `… **Achtung:** einige Verben wechseln den Vokal: sprechen → du **sprichst**, er **spricht**; fahren → du **fährst**, er **fährt**.` und `grammarSlugs` von L7 um `present-tense-regular` hinaus nicht erweiterbar → stattdessen in L3 eine Merkzeile ergänzen: `notice.bodyDe` + `Bei **sprechen** ändert sich der Vokal: er **spricht**. Mehr dazu in Lektion 7.` | MAJOR |
| wortfeld | `{ de: 'der Mann', en: '**husband**' }` · `{ de: 'die Frau', en: '**wife**' }` | Falsche bzw. verengte Glossen. *der Mann* = man/husband, *die Frau* = woman/wife — und der Kurs benutzt „Frau“ ab L1 als Anrede (**Frau** Kaya). Ein Lernender, der „Frau = wife“ gelernt hat, versteht „Frau Kaya“ falsch. In L12 stehen dann zusätzlich `die Ehefrau`/`der Ehemann`. | `en: 'man; husband'` bzw. `en: 'woman; wife; Mrs/Ms'`. | MAJOR |
| dialog | „Das sind meine Eltern und mein Bruder.“ → „Meine **Schwester** ist noch jung.“ | Auf dem Foto sind Eltern und Bruder; die Schwester kommt aus dem Nichts. Kleine, aber in einem Hörverstehens-Input teure Inkohärenz (Richtig/Falsch-Items scheitern daran). | `{ speaker: 'Ana', de: 'Er ist zwanzig. Meine Schwester ist noch klein.' }` → besser: Zeile 1 auf `'Ja. Das sind meine Eltern, mein Bruder und meine Schwester.'` ändern. | MINOR |
| practice (gezogen) | „**Das Mädchen** ist neu. ___ ist nett.“ (fb78281e) | `das Mädchen` wird in **L3, L4, L5, L6 und L7** gezogen — fünf von zwölf Lektionen drillen dasselbe Ausnahmewort. Es steht in keinem Wortfeld. | Siehe kursweiten Fix #3 (Dedup über Lektionen + Themenbindung). Sofortmaßnahme: `das Mädchen` in `nouns-gender`/`personal-pronouns` auf maximal ein Pool-Item reduzieren. | MAJOR |
| practice (gezogen) | „Nicht sicher? Was benutzt du?“ → richtige Antwort: „**Sie — it is always safe**“ | Englisches Meta-Item mit englischen Antwortoptionen in einem deutschen Kurs — und inhaltlich schief: der Kurs selbst lässt Ana, Tim und Lena konsequent **duzen**. „Immer Sie“ ist unter Kursteilnehmern falsch. | Item aus dem Pool nehmen; ersetzen durch `{ questionDe: 'Du sprichst mit Frau Kaya. Was sagst du? ___ Sie Deutsch?', answer: 'Sprechen' }`. | MAJOR |
| schreiben | `fields: ['Vorname', 'Familienstand', 'Sprachen', 'Land']` | `Familienstand` steht nicht im Wortfeld (dort nur `ledig`/`verheiratet`, in **L2**). Das Formularfeld ist unverständlich. | `{ de: 'der Familienstand', word: 'Familienstand', article: 'der', plural: '—', en: 'marital status', wordId: null }` ins Wortfeld von L2 (wo ledig/verheiratet stehen). | MINOR |
| examTeile | `['Sprechen Teil 2', 'Lesen Teil 1']` | Korrekt: Teil 2 ist „um Informationen bitten und geben“ mit Stichwortkarten, und `sprechen.open.promptDe` („Bruder? Schwester? Kinder?“) bildet das Format sauber ab. Vorbildlich. | — | — |

**Scores:** 3 · 4 · 4 · 4 · 3

---

## Lektion 4 — „Auf dem Flohmarkt“ (Einkaufen, Möbel, Preise)

| Feld | Zitat | Problem | Fix (pasteable) | Schwere |
|---|---|---|---|---|
| dialog / notice | „Ich kaufe **den** Stuhl und die Lampe.“ | Erster Akkusativ des Kurses — unmarkiert. Der Kontrakt verlangt ausdrücklich: wo eine Lektion A1.2-Grammatik braucht, wird sie als Chunk gelehrt **und die notice sagt das**. Die notice hier spricht nur über Genus. Ein Lernender, der gerade „der Stuhl“ gelernt hat, liest „den Stuhl“ und verliert das Vertrauen in die Karte. | notice.bodyDe um einen Satz ergänzen: `… Nach **kaufen** und **brauchen** wird **der** zu **den**: Ich kaufe **den** Stuhl. Das lernst du hier als festen Ausdruck; die Regel (Akkusativ) kommt in A1.2.` | MAJOR |
| canDo ↔ wortfeld | „Ich kann Preise **bis hundert Euro** verstehen.“ | Das Wortfeld gibt elf–fünfzehn und zwanzig. Dreißig bis hundert kommen im ganzen Kurs nicht vor (nur in `FUNCTION_WORDS`, die der Lernende nie sieht). Kann-Beschreibung nicht gedeckt — und SD1 *Hören Teil 2* prüft genau Preise/Zahlen. | canDo auf `'Ich kann Preise bis zwanzig Euro verstehen.'` senken **oder** `dreißig, vierzig, fünfzig, hundert` ins Wortfeld aufnehmen (empfohlen, denn Teil 2 braucht sie). | MAJOR |
| canDo | „Ich kann sagen, was ich **kaufen möchte**.“ | `möchten` wird erst in L9 als Chunk eingeführt. In L4 kann der Lernende die Kann-Beschreibung noch nicht erfüllen. | `'Ich kann sagen, was ich kaufe.'` | MINOR |
| practice (gezogen) | „Der **Sonne** ist warm.“ · „___ **Nation** feiert.“ · „Welcher Artikel passt? ___ **Mädchen**“ · „Schreib den Satz: [spielen / **Fußball**]“ · „**Tom**, ___ bist mein Freund.“ | **Null Bezug zur Situation.** Der Lernende kommt vom Flohmarkt (Tisch, Stuhl, Lampe, Euro, kosten) und übt Sonne, Nation, Mädchen, Fußball und einen Tom, den es im Kurs nicht gibt. Reinster Grammatik-Drill-Geruch; genau das, was der Standard §2.1 verbietet. | Pool-Items pro Topic mit dem Wortfeld der Lektion neu generieren, z. B. `{ topic:'nouns-gender', questionDe:'___ Lampe kostet acht Euro.', answer:'Die' }`, `{ questionDe:'___ Rucksack ist teuer.', answer:'Der' }`, `{ questionDe:'Der Tisch ist alt. ___ kostet fünfzehn Euro.', answer:'Er' }`. Siehe kursweiten Fix #2. | MAJOR |
| dialog | „**Zusammen sind das** zwanzig Euro.“ | Geht, klingt aber gestelzt; am Stand sagt man „Das macht zusammen zwanzig Euro.“ | `{ speaker: 'Frau Wolf', de: 'Das macht zusammen zwanzig Euro.' }` | MINOR |
| notice.examples | „Das ist eine Lampe. Sie kostet acht Euro.“ | Gut gewählt: zeigt Genus **und** die Pronomenwiederaufnahme. Rechnung im Dialog stimmt (12 + 8 = 20). | — | — |

**Scores:** 4 · 3 · 4 · 4 · 2

---

## Lektion 5 — „Im Klassenzimmer“ (Gegenstände & Farben)

| Feld | Zitat | Problem | Fix (pasteable) | Schwere |
|---|---|---|---|---|
| notice.examples | Karte: „**der** (maskulin), **die** (feminin), **das** (neutral)“ — Beispiele: „Das Wörterbuch ist auf **dem** Tisch.“ / „Die Schere ist in **der** Tasche.“ | Die beiden einzigen Beispiele unter einer der/die/das-Karte zeigen **Dativformen** — und in „in **der** Tasche“ ist `der` ein *femininer* Artikel, obwohl die Karte zwei Zeilen darüber `der = maskulin` sagt. Das ist der klassische Anfängerkiller, und der Kurs baut ihn selbst ein. Kein Lehrwerk würde das durchgehen lassen. | Dialogzeilen so ändern, dass Nominativbeispiele entstehen, und die notice darauf ziehen: `{ speaker: 'Tim', de: 'Das Wörterbuch liegt da. Der Tisch ist frei.' }` und `{ speaker: 'Tim', de: 'Die Schere ist hier. Das Lineal auch.' }`; dann `examples: ['Das Wörterbuch liegt da. Der Tisch ist frei.', 'Die Schere ist hier. Das Lineal auch.']`. | **BLOCKER** |
| dialog | „Und die **Schere**? Wo ist **sie**?“ — en: „And the **scissors**? Where are **they**?“ | Deutsch Singular, englische Glosse Plural. Der Lernende sieht „sie ist“ und liest „they are“ — falsche Regelbildung genau in der Artikellektion. | `en: 'And the scissors? Where is it (die Schere = singular)?'` — oder Glosse auf `'the pair of scissors … where is it?'`. | MINOR |
| wortfeld | `Mäppchen`, `Spitzer`, `Radiergummi`, `Lineal`, `Kreide`, `Schere`, `Tafel` | Sieben von 24 Wörtern stehen **nicht in der Goethe-A1-Wortliste** und sind Grundschulvokabular. Die `provenance` behauptet aber die Wortliste als Quelle. Für einen erwachsenen Prüfungskandidaten sind `Mäppchen` und `Spitzer` verlorene Lernzeit; `Kreide` ist 2026 zudem veraltet. | Ersetzen durch Kurs-/Alltagswörter aus der Wortliste: `der Kurs`, `die Lehrerin` (schon L2), `das Zimmer`, `die Wohnung`, `der Schlüssel`, `das Bild`, `das Papier` (bleibt). Konkret: `Mäppchen`, `Spitzer`, `Radiergummi`, `Kreide` streichen; `{ de:'das Zimmer', article:'das', plural:'Zimmer', en:'room' }`, `{ de:'die Wohnung', article:'die', plural:'Wohnungen', en:'flat, apartment' }`, `{ de:'der Schlüssel', article:'der', plural:'Schlüssel', en:'key' }`, `{ de:'das Bild', article:'das', plural:'Bilder', en:'picture' }` aufnehmen. | MAJOR |
| practice (gezogen) | 5 von 7 Items sind „alle Plurale nehmen **die**“ oder Suffixregeln: „___ **Filme** sind lang“, „___ **Katzen** schlafen“, „___ **Freiheit** ist wichtig“, „___ **Nation** feiert“, „___ **Mädchen**“ | Die Lektion heißt „der bestimmte Artikel im Kursraum“ und übt Freiheit, Nation, Katzen und Filme. Zusätzlich: nur **2 von 7** Items gehören zum `primarySlug` `definite-articles`, 5 zum Nebenslug `nouns-gender`. Der Drill verfehlt den Lernschritt. | `pickPracticeItems` um eine Gewichtung erweitern (mind. 4 der 7 Items aus `practiceRule.topics[0]`) **und** Items mit Wortfeldwörtern generieren: `'___ Tafel ist grün.'` → Die; `'___ Fenster ist offen.'` → Das (existiert schon, 78558634 — nur in L6 gezogen); `'___ Bücher sind neu.'` → Die. | MAJOR |
| canDo | „Ich kann **fragen, wo etwas ist**.“ | Die Antwort darauf („auf dem Tisch“, „in der Tasche“) ist Dativ = A1.2 und wird nirgends markiert. Die Kann-Beschreibung verlangt Produktion, die der Kurs nicht absichert. | canDo auf `'Ich kann fragen, wo etwas ist, und mit „hier“ oder „da“ antworten.'` und die notice um `Antworten kannst du zuerst mit **hier** und **da**. Sätze wie *auf dem Tisch* lernst du in A1.2.` ergänzen. | MAJOR |
| phonetik | `focus: 'Der Laut sch in Schere und Tasche'` | `Tasche` enthält kein anlautendes sch, sondern -sche im Auslaut — als Kontrast brauchbar, aber der Lernende braucht hier vor allem den Kontrast **sch – s – z** (Schere / Sonne / Zehn). | `{ focus: 'sch – s – z: Schere, sechs, zehn', items: ['SCHE-re', 'SECHS', 'ZEHN'] }` | MINOR |

**Scores:** 2 · 3 · 4 · 3 · 2

---

## Lektion 6 — „Der erste Tag im Büro“ (Büro, Technik, Telefon)

| Feld | Zitat | Problem | Fix (pasteable) | Schwere |
|---|---|---|---|---|
| dialog l.5 vs. notice | Dialog: „**Ein Handy haben wir nicht.**“ — notice: „Die Verneinung ist **kein**: Das ist kein Telefon.“ | Der Dialog verneint ein unbestimmtes Akkusativobjekt mit `nicht`; die Grammatikkarte derselben Lektion sagt, dass man dafür `kein` benutzt. Falsches Modell, direkt neben der richtigen Regel. Standarddeutsch ist hier `Wir haben kein Handy.` | `{ speaker: 'Herr Weber', de: 'Wir haben kein Handy.', en: 'We do not have a mobile phone.' }` — und, weil die notice-Beispiele verbatim aus dem Dialog stammen müssen, danach `examples: ['Danke. Ich brauche einen Computer und ein Telefon.', 'Wir haben kein Handy.']`. | **BLOCKER** |
| dialog l.3 | „**Ein Computer ist im Büro. Ein Telefon auch.**“ | Kein Muttersprachler stellt ein unbestimmtes Subjekt so voran. Natürlich: „Im Büro **steht** ein Computer“ oder „Es **gibt** einen Computer und ein Telefon.“ Die Zeile klingt nach Übersetzung. | `{ speaker: 'Herr Weber', de: 'Im Büro sind ein Computer und ein Telefon.', en: 'There is a computer and a telephone in the office.' }` | MAJOR |
| notice.bodyDe | „Nach **brauchen** wird maskulin zu **einen**: Ich brauche **einen** Computer.“ | Lehrt die Regel falsch herum: `einen` hängt nicht an *brauchen*, sondern am Akkusativobjekt (kaufen, haben, möchten, suchen …). Wer das so lernt, sagt später „Ich kaufe **ein** Computer“. Da L4 schon „Ich kaufe den Stuhl“ zeigt, ist der Widerspruch im Kurs bereits angelegt. | `… Nach Verben wie **brauchen**, **haben**, **kaufen**, **möchten** wird maskulin **ein → einen**: Ich brauche **einen** Computer. (Die Regel dahinter heißt Akkusativ und kommt in A1.2.)` | MAJOR |
| wortfeld | `{ de: 'die Nummer', en: 'number (**ordinal**)' }` | Falsche Glosse: `die Nummer` ist keine Ordinalzahl. Ordinalzahlen sind A1.2. | `en: 'number'` | MAJOR |
| dialog l.7 | „**Null drei zwei eins.** Die Chefin ruft um zehn an.“ | Vierstellige „Telefonnummer“ — unglaubwürdig, und die Lektion behauptet in der canDo „Ich kann eine Telefonnummer verstehen und **notieren**“. SD1 *Sprechen Teil 1* verlangt, eine echte Nummer zu diktieren. Außerdem springt die Zeile mitten im Nummern-Turn zum Chefin-Anruf. | Aufteilen: `{ speaker: 'Herr Weber', de: 'Null vier zwei – drei drei acht eins.' }` und `{ speaker: 'Herr Weber', de: 'Die Chefin ruft um zehn an.' }` (Dialog hat dann 11 Zeilen — im Rahmen). | MAJOR |
| schreiben.leitpunkte | `['Was Sie brauchen', 'Ihre Telefonnummer', '**Gruß**']` | „Gruß“ ist kein Leitpunkt (siehe L2). | `['Was Sie brauchen', 'Ihre Telefonnummer', 'Wann Sie im Büro sind']` | MAJOR |
| wortfeld | `brauchen`, `anrufen`, `das Handy`, `das Telefon` — alle `wordId: null` | Die **vier Kernwörter** der Lektion sind ohne Audio; der Rest (Chefin, Ingenieurin, Verkäuferin) hat welches. Der Lernende hört genau die Wörter nicht, die er sprechen soll. | Vier Wörter in `words` seeden, IDs eintragen. | MINOR |
| dialog | „Die Pause ist **um eins**.“ | Uhrzeit mit `um` — Lernschritt aus L8, hier zwei Lektionen zu früh und unmarkiert. Vertretbar als Chunk, sollte aber in der notice stehen. | notice-Schlusszeile: `**um eins**, **um zehn** — die Uhrzeit lernst du in Lektion 8.` | MINOR |

**Scores:** 2 · 4 · 2 · 4 · 3

---

## Lektion 7 — „Freizeit und Hobbys“

| Feld | Zitat | Problem | Fix (pasteable) | Schwere |
|---|---|---|---|---|
| wortfeld | `gern, immer, nie, vielleicht, natürlich, wirklich, bestimmt, gut, glücklich, frei` | **10 von 20 Einträgen sind Partikeln/Adverbien/Adjektive.** Eine Hobby-Lektion ohne `lesen, schwimmen, kochen, tanzen, Fahrrad fahren, ins Kino gehen, Fußball, der Freund, die Freundin`. Die Kann-Beschreibung „Ich kann über meine Hobbys sprechen“ ist mit `Musik`, `Sport`, `spielen`, `hören` kaum erfüllbar — vier Hobbywörter auf zwanzig. | `wirklich`, `bestimmt`, `natürlich`, `glücklich`, `gut` streichen und ersetzen: `{de:'lesen',en:'to read'}`, `{de:'schwimmen',en:'to swim'}`, `{de:'kochen',en:'to cook'}`, `{de:'tanzen',en:'to dance'}`, `{de:'der Fußball', article:'der', plural:'Fußbälle', en:'football'}`, `{de:'das Kino', article:'das', plural:'Kinos', en:'cinema'}`. | MAJOR |
| dialog l.2 | Lena: „Mein Hobby ist Sport. **Ich spiele immer am Samstag.**“ | *spielen* ohne Objekt ist unvollständig — was spielt sie? So sagt das niemand. | `{ speaker: 'Lena', de: 'Mein Hobby ist Sport. Ich spiele samstags Fußball.', en: 'My hobby is sport. I play football on Saturdays.' }` (dann `der Fußball` und `samstags` ins Wortfeld). | MAJOR |
| dialog l.7 | Tim: „**Wir hören zusammen Musik, vielleicht am Wochenende?**“ | Aussagesatz mit Fragezeichen als Einladung — im Deutschen unidiomatisch. Eine Einladung ist eine Frage. | `{ speaker: 'Tim', de: 'Hören wir am Wochenende zusammen Musik?', en: 'Shall we listen to music together at the weekend?' }` | MAJOR |
| pretest.accepted | `accepted: ['**Ich**', 'Mein Hobby ist', 'Meine Hobbys sind']` | Das Präfix `Ich` akzeptiert **jeden** Satz, der mit „Ich“ beginnt — „Ich bin müde“ besteht den Pretest zur Freizeit. Dieselbe Schwäche in L11 (`'Um'`) und L12 (`'Am'`). | `accepted: ['Ich höre gern', 'Ich spiele gern', 'Ich mache gern', 'Mein Hobby ist', 'Meine Hobbys sind']` — und in L11 `['Ich stehe um', 'Ich wache um']`, in L12 `['Am', 'Mein Geburtstag ist am', 'Ich habe am']` → besser `['Mein Geburtstag ist am', 'Ich habe am']`. | MAJOR |
| practice (gezogen) | „Sie ___ ein Buch. (kaufen)“ · „Du ___ in Berlin. (wohnen)“ · „Was ___ er? (fragen)“ · „Ihr ___ 'Tschüss'. (sagen)“ · „**Das Mädchen** ist neu.“ · „**Anna** ist deine Freundin.“ | Konjugationstabelle mit fünf verschiedenen Verben, von denen **keines** im Wortfeld der Lektion steht (`spielen`, `hören` werden nicht gezogen). Zusätzlich eine fünfte Wiederholung von `das Mädchen` und eine Figur „Anna“, die nicht zum Kurspersonal (Ana!) gehört — ein Buchstabe Unterschied, maximal verwirrend. | Items auf `spielen/hören/machen/lernen/wohnen` mit Wortfeldkontext neu generieren: `'Ich ___ gern Musik. (hören)'` → höre; `'Lena ___ am Samstag Fußball. (spielen)'` → spielt; `'___ ihr am Wochenende Musik? (hören)'` → Hört. Figur `Anna` kursweit auf `Lena` normieren. | MAJOR |
| notice | „**gern** steht nach dem Verb: Ich höre **gern** Musik.“ | Richtig und knapp. | — | — |
| sprechen.open | `missionOrder: null` (auch L10, L11, L12) | Vier der zwölf Lektionen haben keine hinterlegte Speaking-Mission; der Sprechteil fällt dort auf den generischen Prompt zurück. | Vier fehlende Missionen in `speaking_missions` (A1.1) anlegen oder die vorhandenen 1–8 bewusst mehrfach zuweisen und das im Feld dokumentieren. | MINOR |

**Scores:** 4 · 3 · 2 · 4 · 3

---

## Lektion 8 — „Termine und Uhrzeit“

| Feld | Zitat | Problem | Fix (pasteable) | Schwere |
|---|---|---|---|---|
| dialog l.2–3 | Ana: „Und wann ist dein Termin **heute**?“ — Lena: „Der Termin ist **am Montag** um Viertel vor acht.“ | Frage und Antwort widersprechen sich. In einem Hörtext ist das ein Fehler, kein Stilproblem: jedes Richtig/Falsch-Item dazu ist unlösbar. | `{ speaker: 'Ana', de: 'Und wann ist dein Termin nächste Woche?', en: 'And when is your appointment next week?' }` | MAJOR |
| practice (gezogen) | 5 von 7 Items sind `present-tense-regular`, nur **2** sind `time-and-dates` | Der `primarySlug` der Lektion ist `time-and-dates` — und die Lektion übt fast nur Konjugation. Dabei hat der Pool **26** Zeit-Items. Reiner Auswahlfehler des Builders (keine Gewichtung auf `topics[0]`). | `pickPracticeItems` um „mindestens 4 Items aus `topics[0]`“ erweitern (vor dem typed-Floor anwenden). Interim: `practiceRule: { topics: ['time-and-dates'], typedMin: 4 }` für L8. | MAJOR |
| wortfeld | `verspätet`, `rechtzeitig`, `die Verspätung`, `pünktlich`, `zu spät` | Fünf Einträge für dasselbe semantische Feld; `rechtzeitig` und `verspätet` stehen nicht in der A1-Wortliste und sind B1-nah. Gleichzeitig fehlen `halb`, `vor`, `nach` als Uhrzeitwörter — obwohl die notice mit ihnen arbeitet. | `rechtzeitig` und `verspätet` streichen; aufnehmen: `{de:'halb',en:'half (past)'}`, `{de:'Viertel nach',en:'quarter past'}`, `{de:'Viertel vor',en:'quarter to'}`. | MAJOR |
| wortfeld | `Montag, Dienstag, Mittwoch` (L8) · `Donnerstag` (L11) · `Freitag` (L10) · `Samstag, Sonntag` (L7) | Die sieben Wochentage sind über **vier** Lektionen verstreut. Kein Lehrwerk macht das; die Woche ist ein Set und wird als Set gelernt und geprüft (SD1 Hören Teil 1). | Alle sieben in L8 zusammenziehen (`Donnerstag`, `Freitag` aus L11/L10 hierher; in L7 `Samstag`/`Sonntag` als Wiederholung markieren oder streichen). | MAJOR |
| dialog l.4 | Ana: „**Bist du pünktlich?**“ | Klingt wie ein Charaktertest, nicht wie eine Verabredung. Gemeint ist „Kommst du pünktlich?“ | `{ speaker: 'Ana', de: 'Kommst du pünktlich?', en: 'Will you be on time?' }` | MINOR |
| dialog l.5 | „Ja, immer. **Mein Wecker ist gut.**“ | Unidiomatisch. „Mein Wecker klingelt früh.“ / „Ich habe einen guten Wecker.“ | `{ speaker: 'Lena', de: 'Ja, immer. Mein Wecker klingelt um sechs.', en: 'Yes, always. My alarm goes off at six.' }` | MINOR |
| notice | „**halb** neun (= 8.30!)“ | Genau der Punkt, an dem Englisch- und Romanischsprachige scheitern, sauber und mit Ausrufezeichen markiert. Vorbildlich. Fehlt nur die offizielle Form, die in SD1-Durchsagen vorkommt. | Ergänzen: `Offiziell (Bahn, Radio): **acht Uhr dreißig**.` | MINOR |
| schreiben.leitpunkte | `[… , '**Gruß**']` | siehe L2 | `['Warum Sie schreiben', 'Neuer Tag und neue Uhrzeit', 'Eine Frage an Lena']` | MAJOR |

**Scores:** 4 · 3 · 3 · 4 · 3

---

## Lektion 9 — „Im Café“ (Essen & Trinken, Einladung) — **stärkste Lektion**

| Feld | Zitat | Problem | Fix (pasteable) | Schwere |
|---|---|---|---|---|
| practice (gezogen) | „**Das ist ___ Uhr.**“ — erwartete Antwort **`keine`**, englische Zeile: „That is not a watch.“ | Der **deutsche** Prompt enthält keinen Hinweis auf Verneinung. Wer „eine“ tippt, hat korrektes Deutsch geschrieben und wird als Fehler gewertet — inklusive `tagError`-Eintrag und Re-Queue. Ein Item, das die richtige Antwort bestraft, ist ein Vertrauensbruch. | Pool-Item `bb0ead84-4c69-547b-b8aa-b791b1c0e375` korrigieren: `questionDe: 'Das ist ___ Uhr. (Verneinung: kein/keine)'` und `accepted: ['keine']`. Generell in `scripts/build-lesson-pool.mjs`: jedes Item, dessen `answer` mit `kein` beginnt, muss den Hinweis „(Verneinung)“ im `questionDe` führen. | **BLOCKER** |
| dialog l.0 | Paul (Kellner): „Guten Tag! **Haben Sie Hunger?**“ | Kein Kellner fragt das. Die Standardformeln sind „Was möchten Sie trinken?“, „Was darf es sein?“, „Bitte schön?“. Für eine Prüfungsvorbereitung ist die falsche Formel teuer: in SD1 *Hören Teil 2* kommen genau diese Wendungen. | `{ speaker: 'Paul', de: 'Guten Tag! Was möchten Sie trinken?', en: 'Good afternoon! What would you like to drink?' }` — `haben` bleibt über l.1 („Ich habe Hunger und Durst“), l.2 („Wir haben Brot…“) und den Pretest ausreichend im Input. | MAJOR |
| dialog l.8 | „Gut. **Der Kaffee kommt.**“ | Der Kellner sagt „Kommt sofort.“ | `{ speaker: 'Paul', de: 'Gut. Kommt sofort!', en: 'Good. Coming right up!' }` | MINOR |
| wortfeld | `essen, trinken, das Brot, das Frühstück, möchten` — alle `wordId: null` | Fünf Wörter ohne Audio, darunter die beiden Kernverben und der Chunk `möchten`. Das ist das Maximum, das der Kontrakt erlaubt, und es sitzt wieder auf den wichtigsten Wörtern. | In `words` seeden. | MINOR |
| wortfeld | Getränke 11, Essen 2 (`Brot`, `Frühstück`) | Die Kann-Beschreibung nennt „Hunger“, aber es gibt fast nichts zu essen. SD1 *Lesen Teil 2* (Anzeigen) arbeitet mit Lebensmitteln. | `das Bier`/`der Wein` behalten (A1-Wortliste), aber `die Cola` und `die Flasche` gegen `der Kuchen`, `die Suppe`, `das Brötchen`, `der Salat` tauschen. | MINOR |
| notice | „**Ich möchte …** lernst du hier als festen Chunk; die Form gehört zu den Modalverben in A1.2.“ | Genau so soll es aussehen: Chunk benannt, Vertagung begründet. Das ist die Musterkarte des Kurses. | — | — |

**Scores:** 5 · 5 · 3 · 5 · 4

---

## Lektion 10 — „Am Bahnhof“ (Verkehrsmittel & Reisen)

| Feld | Zitat | Problem | Fix (pasteable) | Schwere |
|---|---|---|---|---|
| wortfeld ↔ title/canDo | Titel „**Am Bahnhof**“; canDo „Ich kann **Durchsagen zu Abfahrt und Verspätung** verstehen“, „Ich kann nach einer **Verbindung** fragen“ | Im Wortfeld stehen weder `Bahnhof` noch `Abfahrt`, `Ankunft`, `Gleis`, `umsteigen`, `die Verbindung`, `einfach`, `hin und zurück` — dafür **sieben Ländernamen**. Zwei Kann-Beschreibungen sind lexikalisch nicht gedeckt, und der Lektionstitel selbst fehlt im Wortschatz. | `Polen`, `Spanien`, `Frankreich`, `Italien`, `übermorgen` streichen; aufnehmen: `{de:'der Bahnhof',article:'der',plural:'Bahnhöfe',en:'station'}`, `{de:'die Abfahrt',article:'die',plural:'Abfahrten',en:'departure'}`, `{de:'die Ankunft',article:'die',plural:'Ankünfte',en:'arrival'}`, `{de:'das Gleis',article:'das',plural:'Gleise',en:'platform/track'}`, `{de:'umsteigen',en:'to change (trains)'}`. | MAJOR |
| schreiben.leitpunkte | `['Warum Sie schreiben', 'Wann Sie kommen', '**Gruß**']` | siehe L2 | `['Warum Sie schreiben', 'Wann Sie kommen', 'Was die Kollegin bis dahin machen soll']` | MAJOR |
| practice (gezogen) | „Wie sagt man **'I am hungry'**?“ (englisches Meta-MC, identisch zu L9) · „Ich ___ ein **Auto**“ · „Er ___ **Glück**“ | Zwei der drei `verb-haben`-Items wiederholen wörtlich L9 (`69b3af5c` doppelt gezogen), und das Hunger-Item gehört thematisch ins Café, nicht an den Bahnhof. | Kursweiter Dedup (Fix #3) + `practiceRule` auf `topics: ['yes-no-questions'], typedMin: 4` setzen; der Pool hat 26 Ja/Nein-Items. | MAJOR |
| dialog l.8 | „Danke! **Kommt der Zug morgen auch?**“ | Verständlich, aber holprig; am Schalter fragt man „Fährt der Zug morgen auch?“ (Zug **fährt**, er *kommt* an). | `{ speaker: 'Ana', de: 'Danke! Fährt der Zug morgen auch?', en: 'Thank you! Does the train go tomorrow as well?' }` | MINOR |
| notice | „**fahren** ist unregelmäßig: du fährst, er fährt.“ | Genau richtig markiert — und macht umso sichtbarer, dass dieselbe Markierung bei `sprechen` in L3 fehlt. | — | — |
| examTeile | `['Hören Teil 2', 'Lesen Teil 3', 'Sprechen Teil 2']` | Korrekt: Lesen Teil 3 = Schilder/Aushänge, am Bahnhof ideal. Gute Zuordnung. | — | — |

**Scores:** 5 · 4 · 4 · 4 · 3

---

## Lektion 11 — „Gestern und heute“ (Tagesablauf, trennbare Verben)

| Feld | Zitat | Problem | Fix (pasteable) | Schwere |
|---|---|---|---|---|
| dialog | „Ich habe **gearbeitet**. Und ich habe **eingekauft**.“ … „Gestern habe ich Deutsch **gelernt**.“ | **Drei verschiedene Partizipien** (regelmäßig, trennbar, regelmäßig) sind kein „Chunk“ mehr, sondern ein ungelehrtes Perfektparadigma — inklusive des schwierigsten Falls (`ein**ge**kauft`, ge- **innen**). Die notice nennt nur „Ich habe gearbeitet“ als Chunk. Lernende bilden daraus „ich habe **geeinkauft**“. | Auf **einen** Chunk reduzieren: `{ speaker:'Tim', de:'Ich habe gearbeitet. Und ich war im Supermarkt.' }` und `{ speaker:'Lena', de:'Gut! Gestern habe ich auch gearbeitet.' }`. notice-Schlusssatz: `**Ich habe gearbeitet** ist hier ein fester Ausdruck für *gestern*. Das Perfekt mit allen Verben lernst du in A1.2.` | MAJOR |
| wortfeld | `{ de: '**jeden**', word: 'jeden', en: 'every' }` | Falsches Lemma. Die Grundform ist `jeder/jede/jedes`; `jeden` ist eine flektierte Form (Akkusativ mask. / Zeitangabe „jeden Tag“). Ein Wortschatzeintrag darf keine Kasusform sein — er wird so auch in die SRS-Karten übernommen. | `{ de: 'jeden Tag', word: 'jeden Tag', article: null, plural: null, en: 'every day', wordId: '610abd2d-3525-4505-873f-f4fb125cb388' }` | MAJOR |
| wortfeld | `genau, klar, richtig, sicher, schon, noch nicht, müde, krank` | Acht Füllwörter/Adjektive in einer Tagesablauf-Lektion; es fehlen `frühstücken`, `duschen`, `schlafen`, `nach Hause`, `zur Arbeit`, `der Feierabend`. Die canDo „Ich kann über meinen Tagesablauf sprechen“ ist nicht gedeckt. | `genau`, `klar`, `sicher`, `richtig` streichen; `{de:'frühstücken',en:'to have breakfast'}`, `{de:'duschen',en:'to shower'}`, `{de:'schlafen',en:'to sleep'}`, `{de:'nach Hause',en:'home (direction)'}` aufnehmen. | MAJOR |
| title/situation ↔ primarySlug | `situation: 'Gestern: Tagesablauf (Perfekt mit haben als Chunk)'`, `primarySlug: 'separable-verbs-intro'` | Der Dialog eröffnet mit dem Perfekt, die Grammatikkarte handelt von trennbaren Verben, die Praxis übt trennbare Verben. Der Lernende bekommt zwei Themen und lernt keines sauber. | `situation: 'Tagesablauf: aufstehen, einkaufen, anrufen'` und das Perfekt auf die letzten zwei Dialogzeilen begrenzen (siehe Fix oben). Der Standard-Titel „Gestern (Perfekt mit haben)“ gehört inhaltlich nach A1.2. | MAJOR |
| links | `{ listeningExercise: null, readingOrder: null }` | Einzige Lektion **ohne jedes** verknüpfte Hör- oder Lesematerial (L2 ebenfalls ohne beides). Der Skills-Block des Standards (§2.3 Schritt 5) fehlt hier komplett. | Je eine der vorhandenen A1.1-`listening_exercises`/`reading_lessons` zuweisen oder die Lücke im Syllabus-Grid ehrlich als „—“ ausweisen. | MAJOR |
| dialog | „Rufst du **mich** an?“ / „Ich rufe **dich** an.“ | Akkusativpronomen (mich/dich) — A1.2, unmarkiert. Im Kontext einer Klammer-Lektion vertretbar, sollte aber benannt werden. | notice ergänzen: `**mich** und **dich** lernst du hier als feste Wendung: *Ich rufe dich an.*` | MINOR |
| practice (gezogen) | „Ich ___ dich um 8 Uhr **ab**. (abholen)“ · „Sie ___ die Tür **zu**. (zumachen)“ | `abholen` und `zumachen` stehen in keinem Wortfeld des Kurses — der Lernende soll ein Verb konjugieren, das er nicht kennt. Die vier gezogenen trennbaren Items treffen aber immerhin das Thema; das ist die beste Practice-Ausbeute der zwölf Lektionen. | `abholen` und `mitbringen` ins Wortfeld aufnehmen (beide A1-Wortliste) — dann sind die Items gedeckt. | MINOR |

**Scores:** 4 · 3 · 4 · 4 · 3

---

## Lektion 12 — „Feste feiern“ (Feste, Possessivartikel, Wiederholung)

| Feld | Zitat | Problem | Fix (pasteable) | Schwere |
|---|---|---|---|---|
| canDo ↔ Wortschatz | „Ich kann sagen, **wann ich Geburtstag habe**.“ (+ Wortfeld `das Datum`) | Im gesamten Kurs — 255 Wörter — kommt **kein einziger Monatsname** vor (geprüft: Januar … Dezember alle fehlen), ebenso wenig `der Monat`, `das Jahr` oder Ordinalzahlen. Die Kann-Beschreibung ist unerfüllbar, und SD1 *Sprechen Teil 1* verlangt regelmäßig Alter/Datum. | Zwölf Monatsnamen als **ein** Wortfeldblock in L12 aufnehmen (`{ de:'die Monate: Januar … Dezember', word:'Monate', article:'die', plural:'Monate', en:'the months' }`) plus `{de:'der Monat',article:'der',plural:'Monate'}`; canDo auf `'Ich kann sagen, in welchem Monat ich Geburtstag habe.'` präzisieren (das Datum mit Ordinalzahl bleibt A1.2). | MAJOR |
| sprechen.open.teil | `teil: '**Sprechen Teil 1**'`, promptDe: „Stellen Sie sich vor **und laden Sie den Kurs zu Ihrem Fest ein**.“ | Falsche Prüfungsteil-Zuordnung. SD1 *Sprechen Teil 1* ist ausschließlich „Sich vorstellen“ über Stichwortkarten (Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby) + ein Wort buchstabieren + eine Zahl nennen. Eine Einladung aussprechen ist **Teil 3** (Bitten formulieren und reagieren). Ein Prüfer würde das sofort anstreichen. | `open: { teil: 'Sprechen Teil 3', promptDe: 'Laden Sie eine Kollegin zu Ihrem Fest ein und reagieren Sie auf die Antwort.', hintWords: ['einladen', 'der Geburtstag', 'feiern'], missionOrder: null }` — und `examTeile: ['Lesen Teil 3', 'Sprechen Teil 3', 'Schreiben Teil 2']`. | MAJOR |
| dialog l.6–7 | Lena: „Und was ist **dein Geschenk**?“ — Ana: „**Mein Geschenk?** Vielleicht ein Buch.“ | Semantisch verdreht: Ana hat Geburtstag, also *bekommt* sie Geschenke. „Was ist dein Geschenk?“ fragt nach dem Geschenk, das Ana *macht*. Die Antwort „Vielleicht ein Buch“ passt zu keiner der beiden Lesarten. Der Lernende versteht die Szene nicht — und sie ist der Beispielsatz der Possessivkarte. | `{ speaker:'Lena', de:'Was möchtest du zum Geburtstag?', en:'What would you like for your birthday?' }` / `{ speaker:'Ana', de:'Vielleicht ein Buch. Mein Bruder kauft das Geschenk.', en:'Maybe a book. My brother is buying the present.' }` | MAJOR |
| notice | „**mein** Geschenk, **dein** Bruder, **sein** Handy (er), **ihr** Buch (sie).“ | Es fehlt die **Sie-Form `Ihr`** — obwohl der Dialog in L6 wörtlich „Das ist **Ihr** Büro“ sagt und der ganze Kurs mit Vorgesetzten und Behörden siezt. Außerdem bleibt `ihr` (sie Sg. / sie Pl. / ihr = you) unaufgelöst, obwohl L3 `ihr` als Pronomen eingeführt hat. | `… **ihr** Buch (sie = sie), **Ihr** Büro (Sie, höflich — groß geschrieben!). Vor femininen Nomen und im Plural kommt **-e** dazu: **meine** Mama, **meine** Eltern.` | MAJOR |
| dialog l.1 | „Ich feiere **mit meiner Familie**.“ | Dativ (`meiner`) — A1.2, unmarkiert, und zugleich die Diktatzeile (`hoeren.lines: [1, 3]`): der Lernende soll eine Form **schreiben**, die er nicht gelernt hat. | Entweder `de: 'Ich feiere zu Hause mit der Familie.'` (immer noch Dativ) — besser: `de: 'Meine Familie kommt auch.'` und `hoeren.lines: [1, 3]` beibehalten. | MAJOR |
| dialog l.8 | „**Deine Party ist bestimmt gut!**“ | Unidiomatisch; „Das wird bestimmt schön!“ / „Deine Party wird sicher toll!“ | `{ speaker:'Lena', de:'Deine Party wird bestimmt schön!', en:'Your party is sure to be lovely!' }` | MINOR |
| wortfeld | `der Zwilling`, `das Zuhause`, `die Ehefrau`, `der Ehemann` | `Zwilling` ist nicht in der A1-Wortliste und kommt weder im Dialog noch in einer Aufgabe vor; `Ehefrau`/`Ehemann` doppeln `Mann`/`Frau` aus L3 mit inkonsistenten Glossen. | `der Zwilling`, `die Ehefrau`, `der Ehemann` streichen; aufnehmen: `{de:'der Monat',…}`, `{de:'die Gäste', article:'die', plural:'Gäste', en:'guests'}`, `{de:'die Karte', article:'die', plural:'Karten', en:'card'}`. | MINOR |
| situation | `'Feste und Vergangenes (Chunks) und **Wiederholung**'` | „Wiederholung“ ist angekündigt, aber nichts in der Lektion wiederholt etwas: kein Review-Feld, keine interleavten Topics in `practiceRule` (`['possessive-articles','verb-sein']`). | `practiceRule: { topics: ['possessive-articles','verb-sein','verb-haben','time-and-dates'], typedMin: 4 }` — die Lektion vor dem letzten Checkpoint soll bewusst mischen. | MINOR |

**Scores:** 4 · 4 · 3 · 2 · 3

---

## Bewertungsübersicht

| Lektion | Deutsch | Niveau | Dialog | Prüfung | Kohärenz | Σ /25 |
|---|---|---|---|---|---|---|
| 1 Hallo, ich bin … | 3 | 4 | 4 | 4 | 2 | 17 |
| 2 Ich bin Studentin | 4 | 4 | 2 | 3 | 3 | 16 |
| 3 Meine Familie | 3 | 4 | 4 | 4 | 3 | 18 |
| 4 Auf dem Flohmarkt | 4 | 3 | 4 | 4 | 2 | 17 |
| 5 Im Klassenzimmer | 2 | 3 | 4 | 3 | 2 | **14** |
| 6 Der erste Tag im Büro | 2 | 4 | 2 | 4 | 3 | **15** |
| 7 Freizeit und Hobbys | 4 | 3 | 2 | 4 | 3 | 16 |
| 8 Termine und Uhrzeit | 4 | 3 | 3 | 4 | 3 | 17 |
| 9 Im Café | 5 | 5 | 3 | 5 | 4 | **22** |
| 10 Am Bahnhof | 5 | 4 | 4 | 4 | 3 | **20** |
| 11 Gestern und heute | 4 | 3 | 4 | 4 | 3 | 18 |
| 12 Feste feiern | 4 | 4 | 3 | 2 | 3 | 16 |

**Stärkste:** L9 *Im Café* (klare Chunk-Ansage, sauberes Genus/Artikel-Recycling, richtiger Prüfungsteil), dann L10 *Am Bahnhof* (die Ja/Nein-Frage wird durch den ganzen Dialog getragen, `fahren` korrekt als unregelmäßig markiert).
**Schwächste:** L5 *Im Klassenzimmer* (Dativ-Beispiele unter der Nominativ-Karte, Grundschulwortschatz, 5 von 7 Items thematisch daneben), dann L6 *Büro* (Dialog widerspricht der eigenen Grammatikkarte, unidiomatische Zeilen).

---

## Kursweite Befunde

### 1. Ist die Reihenfolge der 12 Grammatikpunkte stimmig?

**Weitgehend ja — mit zwei Einwänden.** Die Kette Alphabet → sein → Personalpronomen → Genus →
bestimmter Artikel → unbestimmter Artikel → Präsens → Uhrzeit → haben → Ja/Nein-Frage → trennbare
Verben → Possessiva folgt der Lehrwerkslogik und die Begründungen im Dateikopf sind fachlich sauber
formuliert.

Zwei Umstellungen würde ich vornehmen:

- **`verb-haben` (L9) ist vier Lektionen zu spät.** Es wird faktisch ab L2 gebraucht („Haben Sie
  Zeit?“ L8, „Hat der Zug Verspätung?“ L10 kommt sogar **vor** der haben-Lektion — L10 zieht
  `verb-haben` in `grammarSlugs`, aber L9 lehrt es erst). Menschen/Schritte führen sein und haben
  im selben Drittel ein. Empfehlung: `verb-haben` nach L4 ziehen (Flohmarkt: „Haben Sie einen
  Tisch?“) und `nouns-gender` auf L3 vorziehen.
- **Der Vokalwechsel fehlt im Inventar.** Der Standard nennt „Präsens **incl. Vokalwechsel**“ als
  A1.1-Decke. Es gibt keinen Slug dafür, und der Kurs *benutzt* sprechen/fahren/heißen ohne Regel.
  Mindestens als zweiter Absatz in der L7-Karte nachziehen (Fix oben).

Die 12 Slugs werden je genau einmal als `primarySlug` verwendet und alle 12 sind belegt — das
Kontraktziel ist erfüllt.

### 2. Deckt die Wortfeld-Union (255 Wörter) die SD1-Themen ab?

255 eindeutige Einträge, keine Dublette über die 12 Lektionen, jedes Nomen mit Artikel und Plural —
handwerklich sauber. Verteilung: 132 Nomen, 33 Verben, 90 Chunks/Adverbien/Adjektive/Zahlen.

**Gedeckt:** Begrüßung/Verabschiedung · Person & Personalien · Familie · Sprachen & Länder ·
Berufe · Zahlen 0–20 · Möbel/Gegenstände · Farben · Büro & Telefon · Freizeit (dünn) · Wochentage &
Uhrzeit · Getränke · Verkehrsmittel (dünn) · Feste.

**Fehlende SD1-Themen (Goethe A1 Wortliste / BAMF-Handlungsfelder):**

| Fehlendes Thema | Warum es zählt | Vorschlag |
|---|---|---|
| **Monate, Jahr, Datum** | SD1 Sprechen Teil 1 (Alter/Datum), Schreiben Teil 1 (Geburtsdatum). **Kein einziger Monatsname im Kurs.** | in L12 (siehe oben) |
| **Wohnen** (Wohnung, Zimmer, Küche, Bad, Miete, wohnen) | eines der größten SD1-Themen; Lesen Teil 2 lebt von Wohnungsanzeigen | in L5 statt Grundschulmaterial |
| **Gesundheit/Körper** (Arzt, Termin beim Arzt, krank — nur `krank` ist da) | SD1 Hören/Sprechen Teil 3 klassisch | mindestens `der Arzt / die Ärztin`, `die Praxis` in L8 (Termin!) |
| **Lebensmittel/Einkaufen** (Brot ✓, sonst nichts: Obst, Gemüse, Milch, Supermarkt, Kilo, Gramm) | Lesen Teil 2 + Hören Teil 2 | in L9 ergänzen |
| **Kleidung** (Hose, Hemd, Schuhe, tragen) | SD1-Thema | bewusst nach A1.2 verschieben und das im Syllabus so ausweisen |
| **Wetter/Jahreszeiten** | SD1-Thema | nach A1.2, ausweisen |
| **Dienstleistungen** (Post, Bank, Amt, Schalter) | BAMF-Handlungsfeld „Ämter“; L2 behauptet dieses Handlungsfeld bereits | `das Amt`, `der Schalter`, `die Post` in L2 |
| **Bahnhof-Lexik** | eigene Lektion heißt so (siehe L10) | in L10 |

Fazit: **~255 von 650 Wortliste-Einheiten nach der Hälfte des Levels ist eine plausible Quote**, aber
die Auswahl hat vier tote Zonen (Monate, Wohnen, Gesundheit, Lebensmittel) und zwei Füllzonen
(Zahlen als Einzeleinträge, Partikeln in L7/L11). Etwa 20 Einträge sind austauschbar; die Liste oben
sagt wogegen.

### 3. Passen die gezogenen Übungen zur Situation? — **Nein.**

Gemessen über alle 12 Lektionen (Appendix A):

- **Kein einziges** der 84 gezogenen Items enthält ein Wort aus dem Wortfeld der jeweiligen Lektion,
  außer zufällig (`Computer`, `Tasche`, `Stuhl`, `Uhr`, `Auto`, `Kaffee` — 6 Treffer bei 84).
- **`das Mädchen` wird in L3, L4, L5, L6 und L7 gedrillt** — fünf von zwölf Lektionen. Ebenso
  wiederholen sich **acht Items wörtlich** über zwei Lektionen hinweg (z. B. „Ihr ___ müde“ in L3
  **und** L12; „Wie sagt man 'I am hungry'?“ in L9 **und** L10), weil `pickPracticeItems` nur
  *innerhalb* einer Lektion dedupliziert.
- **Der `primarySlug` ist regelmäßig in der Minderheit:** L8 zieht 2 Zeit- gegen 5 Präsens-Items,
  L5 zieht 2 Artikel- gegen 5 Genus-Items, L3 zieht 3 Pronomen- gegen 4 sein-Items. Der Builder
  kennt keine Gewichtung auf `topics[0]`.
- **Englische Meta-Items** landen regelmäßig im Drill: „Was ist der Unterschied?“ (L1), „Wie klingt
  'sp' am Wortanfang?“ (L1), „Was bedeutet 'sie'?“ (L4), „Was sind die 3 Schritte?“ (L8), „Wie sagt
  man 'I am hungry'?“ (L9/L10) — mit englischen Antwortoptionen. In einem Kurs, der sich als
  Prüfungsvorbereitung verkauft, ist das Quizduell-Niveau.
- Personennamen im Pool (`Tom`, `Anna`) kollidieren mit dem Kurspersonal (`Tim`, `Ana`) — ein
  Buchstabe Unterschied.

Der Pool ist erkennbar **vor** dem situativen Curriculum entstanden und wurde nur per `topic`
angedockt. Solange er nicht pro Lektion aus dem Wortfeld neu generiert wird, hebelt Stufe 4 des
Lesson-Engines (7 Items, 3 Minuten — der längste Block der Lektion) die Situationslogik des
gesamten Standards wieder aus.

### 4. `hoursTotal: 54` ist eine Behauptung, kein Inhalt

Der Dateikopf rechnet ehrlich vor: Engine-Zeit = **5,8 h**, dazu „4 h pro Lektion verlinkte Arbeit“
= 48 h. Diese 48 Stunden existieren als Inhalt aber nur teilweise: fünf Lektionen haben
`listeningExercise: null`, drei `readingOrder: null`, vier `missionOrder: null`, L2 und L11 haben
gar keine Verknüpfung. Ein öffentlich ausgewiesenes „54 Stunden“ neben einem Preis ist damit nach
der eigenen Repo-Regel („Measure before you claim“, `src/data/marketing.js`) nicht belegt — und bei
einem Kaufprodukt ist eine überhöhte Umfangsangabe angreifbar. **Empfehlung:** auf der
Syllabus-Seite `5,8 h geführte Lektionszeit + Übungsmaterial` getrennt ausweisen, nicht eine
Summenzahl. (MAJOR, Geschäftsrisiko.)

### 5. Was durchgängig gut ist — damit es beim Umbau nicht verloren geht

- Dialoge: 9–10 Zeilen, max. 10 Wörter pro Zeile, jede Zeile mit `en`-Glosse — exakt Kontrakt.
- Alle `notice.examples` stehen **wörtlich** im jeweiligen Dialog (geprüft), alle unter 60 Wörtern.
- Alle `hoeren.lines` und `sprechen.readAloud` zeigen auf existierende Zeilen (geprüft).
- Register ist konsequent: `du` unter Lernenden (Ana/Tim/Lena), `Sie` mit Frau Kaya, Herrn Weber,
  Herrn Schmidt, Paul. Kein einziger Registerbruch im Dialogkorpus — das ist selten und wertvoll.
- Die `phonetik`-Slots sind fachlich richtig und lektionsbezogen (Wortakzent → Umlaut → sch →
  Diphthong → Satzmelodie). Die Progression ist besser durchdacht als in den meisten Online-Kursen.
- L9s Chunk-Ansage ist die Musterformulierung für alle vorgezogenen A1.2-Formen.

---

## Die 10 wichtigsten Fixes, in dieser Reihenfolge

1. **Lektion 1 aus der englischen Lautumschrift befreien.** 5 von 7 Items der kostenlosen
   Einstiegslektion sind „HOY-tuh“-Items. Alle `alphabet-pronunciation`-Items mit dem Muster
   `Es klingt wie "…"` aus dem Pool filtern und durch Buchstabier-/Diktat-Items aus dem
   L1-Wortfeld ersetzen. *(BLOCKER, L1)*
2. **Die falsche Alphabet-Behauptung streichen** („Vier Zeichen gibt es nur im Deutschen: ä, ö, ü
   und ß“) und die Karte auf die echten Buchstabierfallen E/I, G/J, V/W, Y, Eszett umstellen.
   *(BLOCKER, L1)*
3. **Den Pool pro Lektion aus dem Wortfeld neu generieren** — plus drei Builder-Regeln: mindestens
   4 der 7 Items aus `topics[0]`, kein Item zweimal im ganzen Level (Dedup über bereits gezogene
   IDs), keine englischen Meta-Items. Das ist der eine Fix, der 12 Lektionen gleichzeitig hebt.
   *(MAJOR ×12)*
4. **Die drei Karten reparieren, die sich selbst widersprechen:** L5 (Dativbeispiele unter der
   der/die/das-Karte), L6 (`Ein Handy haben wir nicht` gegen „Die Verneinung ist kein“), L6
   (`einen` als Eigenheit von *brauchen* statt als Akkusativ). *(BLOCKER + 2 MAJOR)*
5. **Das Pool-Item `Das ist ___ Uhr` → `keine` korrigieren** und generell jedes `kein*`-Item im
   deutschen Prompt als Verneinung markieren; sonst bestraft der Kurs richtige Antworten.
   *(BLOCKER, L9)*
6. **Den Vokalwechsel in L7 nachtragen** (sprechen → spricht, fahren → fährt) und in L3 einen
   Merksatz setzen — der Standard fordert ihn als A1.1-Decke, der Kurs benutzt ihn ab L3 ungelehrt.
   *(MAJOR, L3/L7)*
7. **Die vier nicht gedeckten Kann-Beschreibungen schließen:** Zahlen bis zehn (L2), Preise bis
   hundert (L4), Bahnhofs-/Durchsagenlexik (L10), Monatsnamen für den Geburtstag (L12). Eine
   Kann-Beschreibung, die der eigene Wortschatz nicht trägt, ist der Punkt, an dem der öffentliche
   Syllabus unehrlich wird. *(4 × MAJOR)*
8. **„Gruß“ als Leitpunkt aus L2, L6, L8, L10, L12 entfernen** und durch einen echten Inhaltspunkt
   ersetzen; L1s Formular von 3 auf 5 Felder erweitern. SD1 Schreiben Teil 1/2 wird sonst im
   falschen Format geübt. *(MAJOR ×6)*
9. **Die vier unnatürlichen Dialogstellen glätten:** L2 (Nachbar mit Formular im Treppenhaus),
   L6 („Ein Computer ist im Büro“), L7 („Wir hören zusammen Musik, vielleicht am Wochenende?“),
   L9 (Kellner fragt „Haben Sie Hunger?“) — plus L8s Widerspruch *heute* vs. *am Montag* und L12s
   verdrehte Geschenkfrage. *(6 × MAJOR)*
10. **Die Wortfelder von L5, L7, L10, L11 gegen die Wortliste tauschen** (Grundschulmaterial,
    Partikelhäufung, Ländernamen, Füllwörter raus; Wohnen, Hobbys, Bahnhof, Tagesablauf rein) und
    `hoursTotal` auf der Syllabus-Seite in „geführte Zeit“ + „Übungsmaterial“ trennen.
    *(4 × MAJOR + 1 MAJOR Geschäftsrisiko)*

## Würde ich meinen Namen daraufsetzen?

**Heute nicht.** Nach den Fixes 1–6: ja, als solide A1.1-Prüfungsvorbereitung — dann liegt der Kurs
strukturell über dem, was Lingoda oder Goethe Deutsch Online an frei einsehbarer Systematik zeigen.
Nach 1–10: ja, mit Empfehlung. Der Abstand zwischen „nicht verkaufsfähig“ und „empfehlenswert“ ist
hier ungewöhnlich klein, weil das Gerüst stimmt und die Fehler punktuell und benennbar sind — mit
einer Ausnahme: Fix 3 (der Übungspool) ist kein Textfix, sondern eine Generierungsaufgabe, und ohne
ihn bleibt der längste Block jeder Lektion ein Grammatikdrill aus einem anderen Kurs.

---

## Appendix A — Die tatsächlich gezogenen 7 Items je Lektion (attempt 1)

Reproduzierbar mit `pickPracticeItems(pool, lektion.practiceRule, seedFor('a1.1', nr, 1))`.
Topic-Verteilung des Pools: alphabet 15 · definite 25 · indefinite 17 · nouns-gender 25 ·
pronouns 18 · possessive 26 · präsens 23 · separable 26 · time 26 · haben 17 · sein 18 · ja-nein 26.

| L | primarySlug | Items aus `topics[0]` | Themenbezug zur Situation | Auffällig |
|---|---|---|---|---|
| 1 | alphabet-pronunciation | 7/7 | 0/7 | 5 × englische Lautumschrift (heute, Straße, Schule, zwanzig, mein), 1 × englisches Meta-MC |
| 2 | verb-sein | 5/7 | 1/7 (Student) | „Es klingt wie SHoo-leh“, „Wie klingt ie in die?“ |
| 3 | personal-pronouns | 3/7 | 0/7 | Mädchen; „Sie — it is always safe“; Item aus L2 wiederholt |
| 4 | nouns-gender | 3/7 | 0/7 | Sonne, Nation, Mädchen, Fußball, Tom |
| 5 | definite-articles | **2/7** | 0/7 | Filme, Katzen, Freiheit, Nation, Mädchen — 2 Items aus L4 wiederholt |
| 6 | indefinite-articles | 3/7 | 2/7 (Computer, Tasche) | Mädchen (5. Mal), Wohnung, Fenster |
| 7 | present-tense-regular | 4/7 | 0/7 | Mädchen, „Anna“ ≠ Ana, kein `spielen`/`hören` |
| 8 | time-and-dates | **2/7** | 2/7 | 5 × Konjugation; englisches Meta-MC „Was sind die 3 Schritte?“ |
| 9 | verb-haben | 4/7 | 1/7 (Kaffee-frei) | **Item `Das ist ___ Uhr` → keine** (BLOCKER) |
| 10 | yes-no-questions | 3/7 | 1/7 (Auto) | Hunger-Item aus L9 wiederholt |
| 11 | separable-verbs-intro | 4/7 | 2/7 | beste Ausbeute; `abholen`/`zumachen` nicht im Wortschatz |
| 12 | possessive-articles | 4/7 | 0/7 | Schlüssel, Auto, Vater; Item aus L3 wiederholt |

Wiederholte Items über Lektionen hinweg (attempt 1): `0fe8146d` (L2/L3), `fb78281e` (L3/L7),
`299cba23` (L3/L12), `82da8af3` (L4/L5), `e6813842` (L4/L5), `af4fc6ff` (L7/L8), `d8082071`
(L8/L11), `69b3af5c` (L9/L10).
