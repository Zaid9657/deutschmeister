#!/usr/bin/env python3
"""Build words-a2.1-fixes.json from the 248 live A2.1 rows.

Every `old` is copied byte-exact out of the source file; one entry per (id, field).
No row is deleted or re-categorised.
"""
import json, os, re

S = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.abspath(os.path.join(S, "..", "source", "words-a2.1.json"))
rows = json.load(open(SRC, encoding="utf-8"))
by_german = {}
for r in rows:
    by_german.setdefault(r["german"], []).append(r)

fixes = []          # (id, field, new, reason)
seen = set()

R_ARTICLE_IN_GERMAN = (
    "german carries the article inside the headword while the article column already holds it "
    "('der' + 'der Bahnhof'). utils/wordDisplay.js only papers over the double article at render "
    "time (displayGerman/hasArticlePrefix); the stored headword must be bare, as it already is in "
    "the Furniture and Transportation categories and at A1.1/A1.2 — otherwise SRS answer matching, "
    "sorting and any future export all see two different headword shapes at the same level."
)
R_PLURAL_ARTICLE = (
    "plural carries the definite article ('die Gewitter'); every other category at this level and "
    "both A1 levels store the bare plural form, and SrsTrainer.jsx renders it after a literal "
    "'Plural: ' label, so this shows as 'Plural: die Gewitter'."
)
R_PLURAL_NULL_STRING = (
    "plural stores the literal string \"null\" instead of JSON null; vocabularyService.js does "
    "`word.plural || ''` and SrsTrainer.jsx guards on `word.plural !== 'null'`, so the string leaks "
    "into any consumer that does not repeat that guard — same fix as the nine A1.2 rows in Wave 3."
)
R_SINGULARE_TANTUM = (
    "singulare tantum in everyday use: the stored plural is not a form an A2 learner should be "
    "drilled on. A1.2 convention (Schokolade/Sonne/Haut/Butter/Milch/Obst, Wave 3) is JSON null, "
    "not a dash."
)

def add(german, field, new, reason, idx=0):
    cands = by_german[german]
    r = cands[idx]
    key = (r["id"], field)
    assert key not in seen, key
    seen.add(key)
    fixes.append({"id": r["id"], "field": field, "old": r[field], "new": new, "reason": reason})

# ---------------------------------------------------------------- class 1
# article baked into `german` (117 rows)
for r in rows:
    a = r["article"]
    if a and r["german"].lower().startswith(a.lower() + " "):
        fixes.append({"id": r["id"], "field": "german", "old": r["german"],
                      "new": r["german"][len(a) + 1:], "reason": R_ARTICLE_IN_GERMAN})
        seen.add((r["id"], "german"))

# ---------------------------------------------------------------- class 2
# plural stores the literal string "null" (5 rows) -> JSON null
for r in rows:
    if r["plural"] == "null":
        fixes.append({"id": r["id"], "field": "plural", "old": "null", "new": None,
                      "reason": R_PLURAL_NULL_STRING + " All five are singularia tantum "
                                "(Freizeit, Verkehr, Schnee, Teilzeit, Vollzeit), so the correct "
                                "value is null rather than a real plural."})
        seen.add((r["id"], "plural"))

# ---------------------------------------------------------------- class 3
# plural carries the article (35 rows, all of Weather + Work & Jobs)
NO_PLURAL = {"das Wetter", "der Donner", "der Nebel", "der Regen", "der Himmel", "die Sonne"}
for r in rows:
    p = r["plural"]
    if p and re.match(r"^(der|die|das)\s", p):
        if r["german"] in NO_PLURAL:
            new, reason = None, R_SINGULARE_TANTUM
        else:
            new, reason = p.split(" ", 1)[1], R_PLURAL_ARTICLE
        fixes.append({"id": r["id"], "field": "plural", "old": p, "new": new, "reason": reason})
        seen.add((r["id"], "plural"))

# ---------------------------------------------------------------- class 4
# remaining plural values that are not real everyday plurals
add("der Alltag", "plural", None,
    R_SINGULARE_TANTUM + " 'Alltage' is not used; der Alltag has no everyday plural.")
add("der Kundenservice", "plural", None,
    R_SINGULARE_TANTUM + " Kundenservice is uncountable in the 'customer service desk' sense the "
    "gloss and example use; 'Kundenservices' would only work for several companies' departments.")

# ---------------------------------------------------------------- class 5
# English gloss carries an article in exactly one category (Restaurant & Ordering, 15 rows);
# the other 233 rows and both A1 levels gloss bare.
R_EN_ARTICLE = (
    "English gloss starts with 'the' while all 233 other A2.1 rows and every A1.1/A1.2 row gloss "
    "bare; the flashcard back therefore reads inconsistently inside one and the same deck."
)
for r in rows:
    if r["category"] == "Restaurant & Ordering" and r["english"].startswith("the "):
        new = r["english"][4:]
        if new == "service/waiter":
            new = "service, waiting staff"
        elif new == "starter/appetizer":
            new = "starter, appetizer"
        elif new == "drinks menu":
            new = "drinks menu"
        fixes.append({"id": r["id"], "field": "english", "old": r["english"], "new": new,
                      "reason": R_EN_ARTICLE})
        seen.add((r["id"], "english"))

# ---------------------------------------------------------------- class 6
# example sentences that break the A2.1 level constraint or are simply wrong German
EX = [
 ("die Ampel", "An der Ampel musst du kurz warten.",
  "'bis die Ampel grün wird' is a Nebensatz with verb-final order; subordinate clauses are A2.2 "
  "and BANNED in production at A2.1. (It also used werden as a full verb.)"),
 ("die Unterführung", "Die Unterführung bringt dich sicher auf die andere Seite.",
  "'um die Straße zu überqueren' is an um...zu infinitive clause — BANNED at A2.1."),
 ("Bettgestell", "Das Bettgestell ist aus Holz.",
  "'aus hellem Holz' is a strong (null-article) adjective ending; A2.1 topic 9 covers der- and "
  "ein-word declension only and bans null-article endings outside the frozen chunks."),
 ("Hocker", "In der Küche stehen zwei Hocker.",
  "'zwei kleine Hocker' is a strong (null-article) plural adjective ending — banned at A2.1."),
 ("Vitrine", "Die Gläser stehen in der Vitrine.",
  "'schöne alte Gläser' is a strong (null-article) plural adjective ending — banned at A2.1."),
 ("basteln", "Die Kinder basteln gerne mit Papier.",
  "'mit buntem Papier' is a strong (null-article) dative adjective ending — banned at A2.1."),
 ("das Viertel", "In diesem Viertel wohnen viele Familien.",
  "'viele schöne alte Gebäude' takes strong plural endings after viele (no article) — banned at A2.1."),
 ("das Mitglied", "Unser Verein hat über hundert Mitglieder.",
  "'hundert aktive Mitglieder' is a strong (null-article) plural adjective ending — banned at A2.1."),
 ("der Spieler", "Jeder Spieler bekommt sieben Karten.",
  "'Controller' is an English gaming loanword outside the Goethe A2 Wortliste; the level file says "
  "to pick the more basic word when in doubt."),
 ("der Verein", "Ich gehe jeden Montag in meinen Verein.",
  "the headword only appeared inside the compound 'Sportverein', so the card never showed the "
  "headword itself; the old sentence also duplicated the 'Mitglied' card's content."),
 ("das Hobby", "Mein Hobby ist Kochen.",
  "'liebstes' is a Superlativ; Komparativ/Superlativ are banned in production at A2.1."),
 ("entspannen", "Ein Spaziergang entspannt nach der Arbeit.",
  "'entspanne ich mich' uses the verb reflexively; reflexive verbs are A2.2 and banned in "
  "production at A2.1. The headword is the plain transitive verb, so no reflexive is needed."),
 ("gewinnen", "Heute gewinnen wir hoffentlich das Spiel.",
  "'Ich hoffe, dass ...' is a dass-Nebensatz with verb-final order — A2.2, banned at A2.1."),
 ("malen", "Am Wochenende male ich gerne Bilder.",
  "'bunte Bilder' is a strong (null-article) plural adjective ending — banned at A2.1."),
 ("sammeln", "Meine Schwester sammelt gerne Briefmarken.",
  "'alte Briefmarken' is a strong (null-article) plural adjective ending — banned at A2.1."),
 ("gemusst", "Das hast du wirklich nicht gemusst.",
  "'Wir haben lange warten gemusst.' is ungrammatical: with a dependent infinitive German requires "
  "the Ersatzinfinitiv ('warten müssen'), never the ge-participle. The participle gemusst is only "
  "correct without an infinitive, which the new sentence shows."),
 ("vegetarisch", "Ist dieses Gericht hier vegetarisch?",
  "'vegetarische Gerichte' is a strong (null-article) plural adjective ending — banned at A2.1; "
  "the predicative use is the form topic 9 actually teaches."),
 ("das Einkaufszentrum", "Das Einkaufszentrum hat sehr viele Geschäfte.",
  "'viele verschiedene Geschäfte' takes strong plural endings after viele — banned at A2.1."),
 ("das Sonderangebot", "Diese Woche gibt es viele Sonderangebote.",
  "'viele tolle Sonderangebote' takes strong plural endings after viele — banned at A2.1."),
 ("Ankunft", "Die Ankunft ist heute um acht Uhr.",
  "'des Zuges' is a Genitiv; the Genitiv is banned at A2.1 (the level prescribes von + Dativ)."),
 ("Haltestelle", "Wir warten an der Haltestelle auf den Bus.",
  "byte-identical example sentence to the 'die Haltestelle' row in City & Directions; two cards in "
  "the same deck showed the same sentence."),
 ("der Blitz", "Beim Gewitter sieht man viele Blitze am Himmel.",
  "'gab' is the Präteritum of a full verb (geben); Präteritum outside sein/haben and the six modals "
  "is B1 and banned at A2.1."),
 ("der Nebel", "Am Morgen war der Nebel sehr dicht.",
  "'dichter Nebel' is a strong (null-article) adjective ending — banned at A2.1; predicative use is "
  "endingless and in-level."),
 ("der Sturm", "Der Sturm hat gestern viele Bäume umgeworfen.",
  "word order: 'gestern' stood behind the Partizip, outside the Satzklammer. The time adverbial "
  "belongs in the Mittelfeld — the Satzklammer is A1 material the card was contradicting."),
 ("die Wettervorhersage", "Die Wettervorhersage für morgen ist nicht gut.",
  "'sagt Regen an' is not idiomatic standard German for a forecast (ansagen is used for "
  "announcements, and regionally); the simplest in-level repair drops the verb rather than swapping in another shaky one."),
 ("die Wolke", "Heute sind viele Wolken am Himmel.",
  "'sind ... zu sehen' is a sein + zu + Infinitiv construction (modal passive); infinitive clauses "
  "with zu are banned at A2.1."),
 ("regnen", "Morgen regnet es den ganzen Tag.",
  "'Es wird ... regnen' is Futur I; Futur is banned at A2.1 — German uses the present with a time "
  "adverbial, which is what the level teaches."),
 ("schneien", "In den Bergen schneit es heute Nacht.",
  "'wird ... schneien' is Futur I — banned at A2.1."),
 ("sonnig", "Am Wochenende ist es sonnig und warm.",
  "'wird sonnig' uses werden, which is not part of the A2.1 grammar (Futur is banned and werden as "
  "a full verb is not introduced); sein + adjective is the in-level form."),
 ("das Gehalt", "Am Ende vom Monat kommt das Gehalt.",
  "'am Ende des Monats' is a Genitiv; the Genitiv is banned at A2.1 and the level names von + Dativ "
  "as the replacement."),
 ("Möbelstück", "Dieses alte Möbelstück gehört meiner Großmutter.",
  "'gehörte' is the Präteritum of a full verb (gehören) — B1, banned at A2.1. gehören is itself an allowed A2.1 dative verb, so the present tense repairs the grammar without changing what the card says."),
 ("das Picknick", "Wir machen am Sonntag ein Picknick im Park.",
  "'Bei gutem Wetter' is a strong (null-article) dative adjective ending — the same class as "
  "'aus hellem Holz' and 'mit buntem Papier'; banned at A2.1. The row got its german fix in "
  "round 1 but its sentence was not audited."),
 ("die Rechnung", "Können wir bitte die Rechnung haben?",
  "level-a2.1.md whitelists only the 'könnten Sie … / würden Sie …' polite chunks; first-person "
  "'Könnte ich …' is outside that list, so the card taught an out-of-level Konjunktiv II. "
  "Present-tense 'Können wir …' is the in-level restaurant phrase."),
 ("der Termin", "Ich habe heute drei Termine.",
  "'drei wichtige Termine' is a strong (null-article) plural adjective ending — banned at A2.1."),
]
for german, new, reason in EX:
    add(german, "example_sentence", new, reason)

fixes.sort(key=lambda f: (f["field"], f["id"]))
with open(os.path.join(S, "words-a2.1-fixes.json"), "w", encoding="utf-8") as fh:
    json.dump(fixes, fh, ensure_ascii=False, indent=2)
    fh.write("\n")

import collections
print(len(fixes), "fixes")
print(collections.Counter(f["field"] for f in fixes))
