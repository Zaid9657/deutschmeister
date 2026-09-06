# -*- coding: utf-8 -*-
"""Builds S/wave4/grammar/adjective-endings-intro.json (CREATE shape)."""
import json, re, os, sys

OUT = "/tmp/claude-0/-home-user-deutschmeister/c2792a5e-db22-5773-87d6-2f95d17dddab/scratchpad/wave4/grammar/adjective-endings-intro.json"

def rule(rt, ten, tde, content, oi, cm=None, mte=None, mtd=None, fne=None, fnd=None, kie=None, kid=None):
    return {
        "rule_type": rt, "title_en": ten, "title_de": tde, "content": content,
        "order_index": oi, "common_mistakes": cm,
        "memory_trick_en": mte, "memory_trick_de": mtd,
        "formal_note_en": fne, "formal_note_de": fnd,
        "key_insight_en": kie, "key_insight_de": kid,
    }

topic = {
    "sub_level": "A2.1",
    "topic_order": 9,
    "title_en": "Adjective Endings (Basics)",
    "title_de": "Adjektivendungen nach der und ein",
    "slug": "adjective-endings-intro",
    "description_en": "Give adjectives the right ending after der/die/das and after ein/kein/mein in Nominativ, Akkusativ and Dativ. You need them to describe a flat, a job or a person in Goethe A2 Schreiben Teil 2 (E-Mail) and Sprechen Teil 2. After sein the adjective keeps no ending at all: Der Kaffee ist gut.",
    "description_de": "Lerne die Endungen nach der, die, das und nach ein, kein, mein. Du brauchst sie im Schreiben Teil 2 und im Sprechen Teil 2. Nach ist bleibt das Adjektiv ohne Endung.",
    "estimated_time": 25,
    "icon": "book",
    "is_published": True,
    "prerequisite_slugs": ["dative-case", "possessive-pronouns"],
    "related_slugs": ["accusative-intro", "adjective-declension-weak-mixed"],
}

rules = []

# -1 introduction
rules.append(rule(
    "introduction",
    "Adjective Endings Introduction",
    "Einführung: Adjektivendungen",
    {
        "hook_de": "Der Kaffee ist gut. Das ist ein guter Kaffee. Vor dem Nomen bekommt das Adjektiv eine Endung.",
        "hook_en": "Der Kaffee ist gut. Das ist ein guter Kaffee. Before a noun the German adjective takes an ending; after the verb it takes none.",
        "scenario_en": "You need the endings every time the adjective stands in front of the noun: den neuen Job, eine kleine Wohnung, mit dem alten Auto.",
        "preview_note_en": "Two positions, two rules: after the verb no ending, before the noun an ending.",
        "preview_highlight": "Der Kaffee ist gut. → der gute Kaffee",
        "why_it_matters_en": "Goethe A2 Schreiben Teil 2 (E-Mail) and Sprechen Teil 2 ask you to describe things: a small flat, a new job, a friendly colleague. Without endings the description sounds wrong from the first word.",
        "preview_example_de": "gut → der gute Kaffee, ein guter Kaffee, mit dem guten Kaffee",
        "preview_example_en": "good → the good coffee, a good coffee, with the good coffee",
        "german_difference_en": "English never changes the adjective: good coffee, a good coffee, with the good coffee. German changes the ending three times, because the ending carries gender, case and number.",
        "english_comparison_en": "English marks nothing on the adjective, German marks a lot. The good news: after der/die/das there are only two endings in the whole system, -e and -en.",
    },
    -1,
))

# 1 explanation_core
rules.append(rule(
    "explanation_core",
    "Two Positions, Two Rules",
    "Zwei Positionen, zwei Regeln",
    {
        "content_de": "Das Adjektiv steht nach dem Verb: Der Kaffee ist gut. Dann hat es keine Endung. Das Adjektiv steht vor dem Nomen: der gute Kaffee. Dann hat es eine Endung. Prüfe also immer zuerst: vor dem Nomen oder nach dem Verb?",
        "content_en": "Slot A — after the verb (predicative): Der Kaffee ist gut. Die Wohnung ist klein. Die Kinder sind laut. No ending, ever, in any gender or number. Slot B — in front of the noun (attributive): der gute Kaffee, die kleine Wohnung, die lauten Kinder. Here an ending is obligatory. So always check the slot first, and only then the table. (\"Position 1\" is kept for its usual meaning, the first slot in the sentence — see basic-sentence-structure.)",
    },
    1,
    mte="Before the noun: ending. After the verb: no ending.",
    mtd="Vor dem Nomen: Endung. Nach dem Verb: keine Endung.",
    kie="After forms of sein (ist, sind, war) the adjective never takes an ending. This is the one place where German is simpler than the table suggests.",
    kid="Nach ist, sind und war hat das Adjektiv nie eine Endung. Das ist der einfache Teil vom Thema.",
))

# 2 table (weak)
rules.append(rule(
    "table",
    "After der/die/das: only -e or -en",
    "Nach der, die, das: nur -e oder -en",
    {
        "type": "case_table",
        "headers": ["Fall", "maskulin", "feminin", "neutrum", "Plural"],
        "rows": [
            ["Nominativ", "der gute Mann", "die gute Frau", "das gute Kind", "die guten Kinder"],
            ["Akkusativ", "den guten Mann", "die gute Frau", "das gute Kind", "die guten Kinder"],
            ["Dativ", "dem guten Mann", "der guten Frau", "dem guten Kind", "den guten Kindern"],
        ],
        "highlight_row": -1,
        "description_de": "Nach der, die, das gibt es nur zwei Endungen: -e und -en. Im Dativ steht immer -en. Im Plural steht auch immer -en.",
        "description_en": "After der/die/das there are only two endings in the whole table: -e and -en. The dative row is -en everywhere, and the plural column is -en everywhere. Note the dative plural also keeps the noun's -n: den guten Kindern (you know that -n from dative-case).",
    },
    2,
    mte="Dative is easy: always -en. Plural too: always -en.",
    mtd="Dativ ist einfach: immer -en. Plural auch: immer -en.",
    kie="Only five cells take -e: the three nominative singulars plus accusative feminine and neuter. Every other cell in the table is -en.",
    kid="Nur fünf Felder haben -e: Nominativ Singular und Akkusativ feminin und neutrum. Alle anderen Felder haben -en.",
))

# 3 table (mixed)
rules.append(rule(
    "table",
    "After ein/kein/mein: -er and -es appear",
    "Nach ein, kein, mein: die Endungen -er und -es",
    {
        "type": "case_table",
        "headers": ["Fall", "maskulin", "feminin", "neutrum", "Plural (kein, mein)"],
        "rows": [
            ["Nominativ", "ein guter Mann", "eine gute Frau", "ein gutes Kind", "meine guten Kinder"],
            ["Akkusativ", "einen guten Mann", "eine gute Frau", "ein gutes Kind", "meine guten Kinder"],
            ["Dativ", "einem guten Mann", "einer guten Frau", "einem guten Kind", "meinen guten Kindern"],
        ],
        "highlight_row": -1,
        "description_de": "ein und kein haben zwei Formen ohne Endung: ein Mann, ein Kind. Dort bekommt das Adjektiv -er oder -es. Alle anderen Endungen sind wie nach der, die, das. kein geht auch im Plural: Das sind keine guten Ideen.",
        "description_en": "ein and kein carry no ending of their own in the masculine nominative (ein Mann) and in the neuter (ein Kind, nominative and accusative alike). There the adjective steps in and shows the gender instead: ein guter Mann (like der), ein gutes Kind (like das). That is two new endings, -er and -es, in three cells; everywhere else the endings are identical to the der/die/das table.",
    },
    3,
    mte="No ending on the article? Then the adjective supplies it: guter (like der), gutes (like das).",
    mtd="ein und kein zeigen nicht immer den Fall. Dann hilft das Adjektiv: guter, gutes.",
    kie="ein has no plural form. In the plural use kein, mein or dein — and there the adjective always ends in -en.",
    kid="ein hat keinen Plural. Im Plural nimmst du kein oder mein. Die Endung ist dort immer -en: keine guten Ideen.",
))

# 4 pattern
rules.append(rule(
    "pattern",
    "Find the Ending in Three Steps",
    "So findest du die Endung: drei Schritte",
    {
        "type": "steps",
        "steps": [
            {
                "step": 1,
                "title_de": "Steht das Adjektiv vor dem Nomen?",
                "title_en": "Does the adjective stand in front of the noun?",
                "detail_de": "Nein? Dann kommt keine Endung. Der Kaffee ist gut. Ja? Dann geh zu Schritt 2.",
                "detail_en": "No — it stands after ist/sind/war? Then there is no ending: Der Kaffee ist gut. Yes — it stands in front of a noun? Then go on to step 2.",
            },
            {
                "step": 2,
                "title_de": "Welcher Artikel steht davor?",
                "title_en": "Which article stands in front of it?",
                "detail_de": "der, die, das oder den, dem → Tabelle 1. ein, kein, mein → Tabelle 2.",
                "detail_en": "der, die, das, den, dem → use table 1 (only -e and -en). ein, eine, einen, kein, mein, dein → use table 2 (the one with -er and -es).",
            },
            {
                "step": 3,
                "title_de": "Welcher Fall? Und maskulin, feminin, neutrum oder Plural?",
                "title_en": "Which case — and which gender, or plural?",
                "detail_de": "Suche das Feld in der Tabelle. Beispiel: Ich helfe dem ___ Mann. Dativ, maskulin, Artikel dem. Die Endung ist -en: dem alten Mann.",
                "detail_en": "Look the cell up in the table. Example: Ich helfe dem ___ Mann. The verb helfen takes the dative, the noun is masculine, the article is dem → the cell says -en → dem alten Mann.",
            },
        ],
        "description_de": "Drei Fragen, immer in der gleichen Reihenfolge. Dann findest du jede Endung.",
        "description_en": "Three questions, always in the same order: position, article, cell. Work through them and every ending in this topic falls out.",
    },
    4,
    kie="Step 2 is the step learners skip. The article decides which of the two tables you are in, so read the article before you read the noun.",
    kid="Schritt 2 vergessen viele Lerner. Der Artikel zeigt die richtige Tabelle. Lies also zuerst den Artikel.",
))

# 5 tip (frozen chunks + exam)
rules.append(rule(
    "tip",
    "Fixed Phrases You Already Know",
    "Feste Wendungen mit Endung",
    {
        "content_de": "Einige Wendungen sind fest. Du lernst sie ohne Regel. Guten Morgen! Guten Tag! Guten Abend! Guten Appetit! Schönes Wochenende! Liebe Grüße. Viele Grüße. Diese Wendungen brauchst du in der E-Mail und in der SMS.",
        "content_en": "A handful of everyday phrases carry an ending with no article in front: Guten Morgen! Guten Tag! Guten Abend! Guten Appetit! Schönes Wochenende! and the two sign-offs Liebe Grüße / Viele Grüße. They follow a third pattern (no article at all) that you meet properly at B1. For A2, learn them whole and use them.",
    },
    5,
    fne="In Goethe A2 Schreiben Teil 1 (SMS) and Teil 2 (E-Mail) you open with Hallo or Guten Tag and close with Liebe Grüße or Viele Grüße. Both sign-offs carry an adjective ending, so an examiner sees the pattern before reading your first sentence.",
    fnd="Im Schreiben Teil 1 und Teil 2 beginnst du mit Hallo. Am Ende schreibst du Liebe Grüße oder Viele Grüße.",
    kie="Do not try to derive these from the two tables — they belong to the third (article-less) pattern. Learn each one whole.",
    kid="Diese Wendungen kommen nicht aus den zwei Tabellen. Lerne sie komplett.",
))

# 6 dialogue
rules.append(rule(
    "dialogue",
    "Dialogue: The New Job",
    "Dialog: der neue Job",
    {
        "lines": [
            {"speaker": "Anna", "de": "Wie ist dein neuer Job?", "en": "How is your new job?",
             "highlight": "dein neuer — ein-Wort, Nominativ maskulin"},
            {"speaker": "Ben", "de": "Sehr gut. Die Kollegen sind nett und freundlich.", "en": "Very good. The colleagues are nice and friendly.",
             "highlight": "nett und freundlich — nach sind, keine Endung"},
            {"speaker": "Anna", "de": "Und wo arbeitest du jetzt?", "en": "And where do you work now?",
             "highlight": "kein Adjektiv, nur die Frage mit wo"},
            {"speaker": "Ben", "de": "Ich arbeite in einem hellen Büro.", "en": "I work in a bright office.",
             "highlight": "einem hellen — ein-Wort, Dativ neutrum"},
            {"speaker": "Anna", "de": "Hast du einen langen Weg?", "en": "Do you have a long commute?",
             "highlight": "einen langen — ein-Wort, Akkusativ maskulin"},
            {"speaker": "Ben", "de": "Nein. Ich nehme immer die schnelle U-Bahn.", "en": "No. I always take the fast underground.",
             "highlight": "die schnelle — der-Wort, Akkusativ feminin"},
        ],
        "context_de": "Anna fragt Ben. Ben hat einen neuen Job.",
        "context_en": "Anna asks Ben about his new job — the kind of small talk Sprechen Teil 2 is built on.",
        "grammar_focus_en": "Six lines, five different cells: dein neuer Job (mixed, nom. masc. -er), nett und freundlich (predicative, no ending), einem hellen Büro (mixed, dat. neut. -en), einen langen Weg (mixed, acc. masc. -en), die schnelle U-Bahn (weak, acc. fem. -e). Notice how only the -er in 'dein neuer' looks new; the rest is -e and -en.",
    },
    6,
    kie="In Goethe A2 Sprechen Teil 2 you describe your everyday life to a partner. The adjective endings are what make 'Ich habe einen langen Weg' sound German rather than translated.",
    kid="Im Sprechen Teil 2 beschreibst du deinen Alltag. Adjektive machen die Antwort interessant.",
))

# 7 common_mistakes
rules.append(rule(
    "common_mistakes",
    "Five Ending Mistakes",
    "Fünf Fehler mit den Endungen",
    {
        "content_de": "Die Endungen sind klar. Trotzdem kommen fünf Fehler sehr oft.",
        "content_en": "The two tables are short, but five mistakes still come up in almost every A2 class: the missing -er after ein, the -e where -en belongs in the accusative, a bare adjective in the dative, an ending after ist, and -e instead of -es in the neuter.",
    },
    7,
    cm=[
        {"wrong": "Das ist ein guten Freund.", "correct": "Das ist ein guter Freund.",
         "explanation_de": "Nominativ maskulin: ein hat keine Endung. Dann nimmt das Adjektiv -er.",
         "explanation_en": "Masculine nominative: ein carries no ending, so the adjective has to show the gender with -er."},
        {"wrong": "Ich kaufe den neue Pullover.", "correct": "Ich kaufe den neuen Pullover.",
         "explanation_de": "Im Akkusativ maskulin steht immer -en. Der Artikel den zeigt den Fall.",
         "explanation_en": "Accusative masculine is always -en. The article den already shows the case, and the adjective follows it."},
        {"wrong": "Ich wohne in einem klein Zimmer.", "correct": "Ich wohne in einem kleinen Zimmer.",
         "explanation_de": "Im Dativ ist die Endung immer -en. Das gilt für alle Formen.",
         "explanation_en": "In the dative the ending is always -en, in every gender and in the plural. A bare adjective is never right in front of a noun."},
        {"wrong": "Der Kaffee ist guter.", "correct": "Der Kaffee ist gut.",
         "explanation_de": "Nach ist hat das Adjektiv keine Endung. Es steht nicht vor dem Nomen.",
         "explanation_en": "After ist the adjective is predicative: it does not stand in front of a noun, so it takes no ending."},
        {"wrong": "Wir haben ein neue Auto.", "correct": "Wir haben ein neues Auto.",
         "explanation_de": "Neutrum: ein hat keine Endung. Dann nimmt das Adjektiv -es.",
         "explanation_en": "Neuter: ein carries no ending, so the adjective shows it with -es (like das Auto)."},
    ],
    kie="Four of the five mistakes come from one habit: reading the noun before the article. The article decides the table.",
    kid="Vier von fünf Fehlern haben den gleichen Grund. Lerner lesen zuerst das Nomen, nicht den Artikel.",
))

# 99 summary
rules.append(rule(
    "summary",
    "Quick Reference",
    "Kurzübersicht",
    {
        "points": [
            "Nach ist, sind, war: keine Endung. Der Kaffee ist gut.",
            "Vor dem Nomen: immer eine Endung. Der gute Kaffee.",
            "Nach der, die, das gibt es nur -e und -en.",
            "-e steht im Nominativ Singular: der gute Mann, das gute Kind.",
            "-e steht auch im Akkusativ feminin und neutrum: die gute Frau.",
            "Alle anderen Felder haben -en: den guten Mann, dem guten Kind.",
            "Im Plural steht immer -en: die guten Kinder.",
            "Dativ Plural: den guten Kindern. Das Nomen bekommt auch ein -n.",
            "Nach ein, kein, mein sind zwei Endungen neu: -er und -es.",
            "-er ist maskulin: ein guter Mann. -es ist neutrum: ein gutes Kind.",
            "Alle anderen Felder sind wie nach der, die, das.",
            "ein hat keinen Plural. Nimm kein oder mein: keine guten Ideen.",
            "Feste Wendungen: Guten Morgen! Guten Appetit! Schönes Wochenende! Liebe Grüße.",
        ]
    },
    99,
))

# ---------------------------------------------------------------------------
examples_src = [
    ("Der neue Lehrer ist sehr nett.", "The new teacher is very nice.", "Der neue Lehrer",
     "der + Nominativ masculine → -e. The second adjective, nett, stands after ist and takes no ending.",
     "der + Nominativ maskulin → -e. Das zweite Adjektiv nett steht nach ist und hat keine Endung.",
     {"Der": "the (masculine, nominative)", "neue": "new (weak ending -e)", "Lehrer": "teacher",
      "ist": "is", "sehr": "very", "nett": "nice (after ist: no ending)"}, 1, "basic"),
    ("Die Wohnung ist neu und hell.", "The flat is new and bright.", "ist neu und hell",
     "Both adjectives stand after ist, so both stay endingless — in every gender.",
     "Beide Adjektive stehen nach ist. Sie haben keine Endung.",
     {"Die": "the (feminine, nominative)", "Wohnung": "flat, apartment", "ist": "is",
      "neu": "new (no ending)", "und": "and", "hell": "bright (no ending)"}, 1, "basic"),
    ("Ich kaufe den grünen Pullover.", "I am buying the green sweater.", "den grünen Pullover",
     "kaufen takes the accusative; der Pullover is masculine, so der becomes den and the adjective takes -en.",
     "kaufen steht mit Akkusativ. Aus der Pullover wird den Pullover. Das Adjektiv bekommt -en.",
     {"Ich": "I", "kaufe": "buy, am buying", "den": "the (masculine, accusative)",
      "grünen": "green (weak ending -en)", "Pullover": "sweater"}, 2, "basic"),
    ("Ich helfe dem alten Mann.", "I am helping the old man.", "dem alten Mann",
     "helfen takes the dative (you know it from dative-case); in the dative the ending is always -en.",
     "helfen steht mit Dativ. Im Dativ ist die Endung immer -en.",
     {"Ich": "I", "helfe": "help (helfen + Dativ)", "dem": "the (masculine, dative)",
      "alten": "old (weak ending -en)", "Mann": "man"}, 2, "intermediate"),
    ("Die neuen Kollegen sind sehr freundlich.", "The new colleagues are very friendly.", "Die neuen Kollegen",
     "Plural after die: always -en. freundlich stands after sind and stays endingless.",
     "Plural nach die: immer -en. freundlich steht nach sind und hat keine Endung.",
     {"Die": "the (plural)", "neuen": "new (plural ending -en)", "Kollegen": "colleagues",
      "sind": "are", "sehr": "very", "freundlich": "friendly (after sind: no ending)"}, 2, "basic"),
    ("Peter ist ein guter Freund.", "Peter is a good friend.", "ein guter Freund",
     "ein carries no ending in the masculine nominative, so the adjective shows the gender with -er.",
     "ein hat im Nominativ maskulin keine Endung. Das Adjektiv nimmt -er.",
     {"Peter": "Peter (name)", "ist": "is", "ein": "a (masculine, nominative)",
      "guter": "good (mixed ending -er)", "Freund": "friend"}, 2, "intermediate"),
    ("Das ist ein gutes Buch.", "That is a good book.", "ein gutes Buch",
     "das Buch is neuter and ein has no ending there, so the adjective takes -es.",
     "das Buch ist neutrum. ein hat keine Endung. Das Adjektiv nimmt -es.",
     {"Das": "that", "ist": "is", "ein": "a (neuter)", "gutes": "good (mixed ending -es)",
      "Buch": "book"}, 2, "intermediate"),
    ("Ich möchte einen warmen Tee trinken.", "I would like to drink a warm tea.", "einen warmen Tee",
     "Accusative masculine after ein: einen + -en. The modal verb möchte sends trinken to the end.",
     "Akkusativ maskulin nach ein: einen und -en. Das Modalverb möchte schickt trinken ans Ende.",
     {"Ich": "I", "möchte": "would like to", "einen": "a (masculine, accusative)",
      "warmen": "warm (mixed ending -en)", "Tee": "tea", "trinken": "to drink"}, 3, "intermediate"),
    ("Ich wohne in einer ruhigen Straße.", "I live in a quiet street.", "einer ruhigen Straße",
     "wo? → in + Dativ. Feminine dative: einer + -en.",
     "wo? → in mit Dativ. Feminin im Dativ: einer und -en.",
     {"Ich": "I", "wohne": "live", "in": "in (wo? → Dativ)", "einer": "a (feminine, dative)",
      "ruhigen": "quiet (mixed ending -en)", "Straße": "street"}, 3, "intermediate"),
    ("Guten Appetit! Die Suppe ist wirklich lecker.", "Enjoy your meal! The soup is really tasty.", "Guten Appetit",
     "Guten Appetit is a fixed phrase with no article — learn it whole. lecker stands after ist and takes no ending.",
     "Guten Appetit ist eine feste Wendung ohne Artikel. lecker steht nach ist und hat keine Endung.",
     {"Guten": "good (fixed phrase, no article)", "Appetit": "appetite", "Die": "the (feminine)",
      "Suppe": "soup", "ist": "is", "wirklich": "really", "lecker": "tasty (after ist: no ending)"}, 2, "everyday"),
]

examples = []
for i, (de, en, hl, expl_en, expl_de, wb, diff, cat) in enumerate(examples_src, start=1):
    examples.append({
        "sentence_de": de, "sentence_en": en, "grammar_highlight": hl,
        "explanation_en": expl_en, "explanation_de": expl_de,
        "word_breakdown": wb, "difficulty": diff, "category": cat,
        "order_index": i, "audio_url": None,
    })

# ---------------------------------------------------------------------------
def ex(stage, oi, etype, qde, qen, correct, acceptable, expl_en, expl_de, wce, wcd, diff, options=None):
    return {
        "exercise_type": etype, "question_de": qde, "question_en": qen,
        "options": options, "correct_answer": correct, "acceptable_answers": acceptable,
        "explanation_en": expl_en, "explanation_de": expl_de, "hint": None,
        "why_correct_en": wce, "why_correct_de": wcd,
        "difficulty": diff, "stage": stage, "order_index": oi, "related_rule_title": None,
    }


# ONE acceptable_answers policy (round 2, review finding #3):
#   whole-sentence answer -> {initial capital, initial lowercase} x {".", "", "!"}  (6 forms,
#     12 when two word orders are legitimate); the answer as written is always first.
#   single-word answer inside a sentence -> exactly the one form the slot admits
#     (never sentence-initial, never sentence-final, so no casing/punctuation variants).
def sv(*sentences):
    out = []
    for sent in sentences:
        base = sent[:-1] if sent[-1] in ".!?" else sent
        for form in (base, base[0].lower() + base[1:]):
            for suf in (".", "", "!"):
                if form + suf not in out:
                    out.append(form + suf)
    return out

exercises = []

# --- Stage 4: recognition + guided production -------------------------------
exercises.append(ex(4, 1, "fill_blank",
    "Das ist der ___ Computer. (neu)",
    "Write the adjective with the right ending: That is the new computer. (adjective: neu; article: der; Nominativ, masculine)",
    "neue", ["neue"],
    "der + Nominativ masculine → -e.",
    "der + Nominativ maskulin → -e.",
    "Table 1, top-left cell: der gute Mann → der neue Computer.",
    "Tabelle 1, erstes Feld: der gute Mann → der neue Computer.", 1))

exercises.append(ex(4, 2, "fill_blank",
    "Ich nehme den ___ Kuchen. (frisch)",
    "Write the adjective with the right ending: I am taking the fresh cake. (adjective: frisch; article: den; Akkusativ, masculine)",
    "frischen", ["frischen"],
    "Accusative masculine after den is always -en.",
    "Akkusativ maskulin nach den ist immer -en.",
    "der Kuchen → Akkusativ den Kuchen; the cell says -en → den frischen Kuchen.",
    "der Kuchen → Akkusativ den Kuchen. Das Feld sagt -en: den frischen Kuchen.", 2))

exercises.append(ex(4, 3, "fill_blank",
    "Ich spreche mit der ___ Ärztin. (nett)",
    "Write the adjective with the right ending: I am speaking with the nice (female) doctor. (adjective: nett; preposition mit + Dativ; article: der; feminine)",
    "netten", ["netten"],
    "mit always takes the dative; in the dative the ending is always -en.",
    "mit steht immer mit Dativ. Im Dativ ist die Endung immer -en.",
    "die Ärztin → Dativ der Ärztin; the dative row is -en → der netten Ärztin.",
    "die Ärztin → Dativ der Ärztin. Die Dativ-Zeile hat -en: der netten Ärztin.", 2))

exercises.append(ex(4, 4, "fill_blank",
    "Die ___ Kinder sind laut. (klein)",
    "Write the adjective with the right ending: The small children are loud. (adjective: klein; article: die; Nominativ, plural)",
    "kleinen", ["kleinen"],
    "The plural column is -en everywhere. laut stands after sind and keeps no ending.",
    "Die Plural-Spalte hat immer -en. laut steht nach sind und hat keine Endung.",
    "die Kinder is plural → -en → die kleinen Kinder.",
    "die Kinder ist Plural → -en: die kleinen Kinder.", 2))

exercises.append(ex(4, 5, "fill_blank",
    "Das ist ein ___ Film. (interessant)",
    "Write the adjective with the right ending: That is an interesting film. (adjective: interessant; article: ein; Nominativ, masculine)",
    "interessanter", ["interessanter"],
    "ein has no ending in the masculine nominative, so the adjective takes -er.",
    "ein hat im Nominativ maskulin keine Endung. Das Adjektiv nimmt -er.",
    "der Film is masculine; ein shows nothing, so the adjective does: ein interessanter Film.",
    "der Film ist maskulin. ein zeigt nichts, das Adjektiv zeigt -er: ein interessanter Film.", 2))

exercises.append(ex(4, 6, "fill_blank",
    "Wir haben ein ___ Auto. (klein)",
    "Write the adjective with the right ending: We have a small car. (adjective: klein; article: ein; Akkusativ, neuter)",
    "kleines", ["kleines"],
    "Neuter: ein carries no ending, so the adjective takes -es.",
    "Neutrum: ein hat keine Endung. Das Adjektiv nimmt -es.",
    "das Auto is neuter, and neuter looks the same in Nominativ and Akkusativ → ein kleines Auto.",
    "das Auto ist neutrum. Nominativ und Akkusativ sind gleich: ein kleines Auto.", 2))

exercises.append(ex(4, 7, "fill_blank",
    "Ich suche einen ___ Tisch. (billig)",
    "Write the adjective with the right ending: I am looking for a cheap table. (adjective: billig; article: einen; Akkusativ, masculine)",
    "billigen", ["billigen"],
    "Accusative masculine after ein: einen + -en.",
    "Akkusativ maskulin nach ein: einen und -en.",
    "einen already shows the accusative, and the adjective follows with -en: einen billigen Tisch.",
    "einen zeigt den Akkusativ. Das Adjektiv folgt mit -en: einen billigen Tisch.", 3))

exercises.append(ex(4, 8, "error_correction",
    "Korrigiere den Fehler: Ich fahre mit dem neue Bus.",
    "Correct the mistake and write the whole sentence: I go by the new bus. (mit + Dativ, masculine)",
    "Ich fahre mit dem neuen Bus.",
    sv("Ich fahre mit dem neuen Bus."),
    "mit takes the dative and the dative ending is -en, not -e.",
    "mit steht mit Dativ. Im Dativ ist die Endung -en, nicht -e.",
    "dem is the dative article, so the adjective must be neuen: mit dem neuen Bus.",
    "dem ist der Dativ-Artikel. Das Adjektiv heißt neuen: mit dem neuen Bus.", 2))

exercises.append(ex(4, 9, "multiple_choice",
    "Wir suchen ___ Zimmer.",
    "Choose the correct form: We are looking for a quiet room. (Akkusativ, neuter, with ein)",
    "ein ruhiges",
    None,
    "Neuter with ein: the adjective takes -es.",
    "Neutrum mit ein: Das Adjektiv nimmt -es.",
    "das Zimmer is neuter; ein has no ending, so the adjective shows it: ein ruhiges Zimmer.",
    "das Zimmer ist neutrum. ein hat keine Endung, das Adjektiv zeigt -es: ein ruhiges Zimmer.", 2,
    options=["ein ruhiger", "ein ruhige", "ein ruhiges", "einen ruhigen"]))

exercises.append(ex(4, 10, "multiple_choice",
    "Ich sehe ___ Hund.",
    "Choose the correct form: I see the small dog. (Akkusativ, masculine, with der)",
    "den kleinen",
    None,
    "Accusative masculine: der becomes den and the adjective takes -en.",
    "Akkusativ maskulin: Aus der wird den. Das Adjektiv nimmt -en.",
    "sehen takes the accusative; der Hund → den Hund → den kleinen Hund.",
    "sehen steht mit Akkusativ. Aus der Hund wird den Hund: den kleinen Hund.", 2,
    options=["der kleine", "den kleinen", "dem kleinen", "die kleine"]))

exercises.append(ex(4, 11, "multiple_choice",
    "Wir wohnen in ___ Wohnung.",
    "Choose the correct form: We live in a nice flat. (wo? → in + Dativ, feminine, with ein)",
    "einer schönen",
    None,
    "wo? → in + Dativ. Feminine dative: einer + -en.",
    "wo? → in mit Dativ. Feminin im Dativ: einer und -en.",
    "wohnen answers wo?, so in takes the dative: in einer schönen Wohnung.",
    "wohnen antwortet auf wo?. Dann steht in mit Dativ: in einer schönen Wohnung.", 3,
    options=["eine schöne", "einer schöne", "einer schönen", "einen schönen"]))

exercises.append(ex(4, 12, "multiple_choice",
    "Welcher Satz ist richtig?",
    "Which sentence is correct? (the adjective stands after ist)",
    "Das Wetter ist schön.",
    None,
    "After ist the adjective takes no ending at all.",
    "Nach ist hat das Adjektiv keine Endung.",
    "schön does not stand in front of a noun here, so it stays endingless.",
    "schön steht hier nicht vor einem Nomen. Es bleibt ohne Endung.", 1,
    options=["Das Wetter ist schön.", "Das Wetter ist schönes.", "Das Wetter ist schöne.", "Das Wetter ist schönen."]))

exercises.append(ex(4, 13, "multiple_choice",
    "Ich fahre mit ___ Freunden.",
    "Choose the correct form: I travel with my good friends. (mit + Dativ, plural, with mein)",
    "meinen guten",
    None,
    "Dative plural: meinen + -en (and the noun keeps its -n: Freunden).",
    "Dativ Plural: meinen und -en. Das Nomen behält das -n: Freunden.",
    "mit takes the dative, the noun is plural → meinen guten Freunden.",
    "mit steht mit Dativ, das Nomen ist Plural: meinen guten Freunden.", 3,
    options=["meine guten", "meiner guten", "meinen gute", "meinen guten"]))

# --- Stage 5: free production (13 x sentence_building with cue brackets) ------
exercises.append(ex(5, 1, "sentence_building",
    "Schreib den Satz: [das / sein / kein / gut / Fotos]",
    "Write the sentence: Those are not good photos. (Nominativ, plural, with kein — compare item 6, the singular)",
    "Das sind keine guten Fotos.",
    sv("Das sind keine guten Fotos."),
    "kein has a plural, ein does not. In the plural the ending is always -en.",
    "kein hat einen Plural, ein nicht. Im Plural ist die Endung immer -en.",
    "die Fotos is plural, so the verb is sind and the adjective takes -en: keine guten Fotos.",
    "die Fotos ist Plural. Das Verb heißt sind. Das Adjektiv nimmt -en: keine guten Fotos.", 2))

exercises.append(ex(5, 2, "sentence_building",
    "Schreib den Satz: [ich / kaufen / die / rot / Jacke]",
    "Write the sentence: I am buying the red jacket. (Akkusativ, feminine)",
    "Ich kaufe die rote Jacke.",
    sv("Ich kaufe die rote Jacke."),
    "Feminine accusative after die: the ending is -e.",
    "Akkusativ feminin nach die: Die Endung ist -e.",
    "Feminine looks the same in Nominativ and Akkusativ: die rote Jacke.",
    "Feminin ist im Nominativ und im Akkusativ gleich: die rote Jacke.", 2))

exercises.append(ex(5, 3, "sentence_building",
    "Schreib den Satz: [wir / arbeiten / in / ein / groß / Büro]",
    "Write the sentence: We work in a big office. (wo? → in + Dativ, neuter; both word orders are accepted)",
    "Wir arbeiten in einem großen Büro.",
    sv("Wir arbeiten in einem großen Büro.", "In einem großen Büro arbeiten wir."),
    "wo? → in + Dativ. Neuter dative: einem + -en.",
    "wo? → in mit Dativ. Neutrum im Dativ: einem und -en.",
    "arbeiten answers wo?, so in takes the dative → in einem großen Büro. Both word orders are correct.",
    "arbeiten antwortet auf wo?. Dann steht in mit Dativ: in einem großen Büro.", 3))

exercises.append(ex(5, 4, "sentence_building",
    "Schreib den Satz: [heute / ich / treffen / ein / alt / Freund]",
    "Write the sentence: Today I am meeting an old friend. (Akkusativ, masculine; both word orders are accepted)",
    "Heute treffe ich einen alten Freund.",
    sv("Heute treffe ich einen alten Freund.", "Ich treffe heute einen alten Freund."),
    "treffen takes the accusative: einen + -en. heute may stand in position 1 or after the verb.",
    "treffen steht mit Akkusativ: einen und -en. heute kann auf Position 1 oder nach dem Verb stehen.",
    "Position 1 is free in German, so both orders are correct; the form stays einen alten Freund.",
    "Position 1 ist frei. Beide Sätze sind richtig. Die Form bleibt: einen alten Freund.", 3))

exercises.append(ex(5, 5, "sentence_building",
    "Schreib den Satz: [ich / helfen / die / alt / Frau]",
    "Write the sentence: I am helping the old woman. (helfen + Dativ, feminine)",
    "Ich helfe der alten Frau.",
    sv("Ich helfe der alten Frau."),
    "helfen takes the dative; die becomes der and the adjective takes -en.",
    "helfen steht mit Dativ. Aus die wird der. Das Adjektiv nimmt -en.",
    "You know helfen + Dativ from dative-case; the dative row is -en → der alten Frau.",
    "helfen mit Dativ kennst du aus dem Dativ-Thema. Die Dativ-Zeile hat -en: der alten Frau.", 3))

exercises.append(ex(5, 6, "sentence_building",
    "Schreib den Satz: [das / sein / kein / gut / Idee]",
    "Write the sentence: That is not a good idea. (Nominativ, feminine singular, with kein — item 1 was the plural)",
    "Das ist keine gute Idee.",
    sv("Das ist keine gute Idee."),
    "kein works exactly like ein: feminine nominative keine + -e.",
    "kein funktioniert wie ein. Feminin im Nominativ: keine und -e.",
    "die Idee is feminine singular, keine already shows it, so the adjective takes -e — kein takes -en only in the plural (item 1).",
    "die Idee ist feminin, Singular. keine zeigt das schon. Das Adjektiv nimmt -e.", 2))

exercises.append(ex(5, 7, "sentence_building",
    "Schreib den Satz: [er / bestellen / ein / kalt / Getränk]",
    "Write the sentence: He orders a cold drink. (Akkusativ, neuter)",
    "Er bestellt ein kaltes Getränk.",
    sv("Er bestellt ein kaltes Getränk."),
    "Neuter: ein has no ending, so the adjective takes -es — in the accusative too.",
    "Neutrum: ein hat keine Endung. Das Adjektiv nimmt -es, auch im Akkusativ.",
    "das Getränk is neuter and neuter is identical in Nominativ and Akkusativ → ein kaltes Getränk.",
    "das Getränk ist neutrum. Nominativ und Akkusativ sind gleich: ein kaltes Getränk.", 3))

exercises.append(ex(5, 8, "sentence_building",
    "Schreib den Satz: [ich / schreiben / mein / gut / Freunde]",
    "Write the sentence: I write to my good friends. (schreiben + Dativ, plural)",
    "Ich schreibe meinen guten Freunden.",
    sv("Ich schreibe meinen guten Freunden."),
    "Dative plural: meinen + -en, and the noun adds -n: Freunden.",
    "Dativ Plural: meinen und -en. Das Nomen bekommt ein -n: Freunden.",
    "The person you write to stands in the dative; plural dative always ends -en plus the noun's -n.",
    "Die Person steht im Dativ. Im Dativ Plural steht -en und das Nomen bekommt -n.", 3))

exercises.append(ex(5, 9, "sentence_building",
    "Schreib den Satz: [ich / wünschen / du / ein / schön / Wochenende]",
    "Write the sentence: I wish you a nice weekend. (dative pronoun dir + Akkusativ, neuter)",
    "Ich wünsche dir ein schönes Wochenende.",
    sv("Ich wünsche dir ein schönes Wochenende."),
    "Dativ before Akkusativ: dir first, then ein schönes Wochenende. This closes an A2 e-mail perfectly.",
    "Dativ vor Akkusativ: zuerst dir, dann ein schönes Wochenende. So endest du eine E-Mail.",
    "das Wochenende is neuter → ein schönes; du becomes dir because it is the dative object.",
    "das Wochenende ist neutrum: ein schönes. Aus du wird dir. Das ist das Dativ-Objekt.", 2))

exercises.append(ex(5, 10, "sentence_building",
    "Schreib den Satz: [der / Film / sein / lang / und / interessant]",
    "Write the sentence: The film is long and interesting. (both adjectives stand after ist)",
    "Der Film ist lang und interessant.",
    sv("Der Film ist lang und interessant."),
    "After ist neither adjective takes an ending — compare stage 4 item 5, ein interessanter Film.",
    "Nach ist hat kein Adjektiv eine Endung. Vergleiche: ein interessanter Film.",
    "Both adjectives stand after ist, not in front of a noun, so both stay endingless.",
    "Beide Adjektive stehen nach ist. Sie stehen nicht vor einem Nomen. Sie bleiben ohne Endung.", 2))

exercises.append(ex(5, 11, "sentence_building",
    "Schreib den Satz: [wir / brauchen / ein / gut / Arzt]",
    "Write the sentence: We need a good doctor. (brauchen + Akkusativ, masculine)",
    "Wir brauchen einen guten Arzt.",
    sv("Wir brauchen einen guten Arzt."),
    "Accusative masculine after ein: einen + -en.",
    "Akkusativ maskulin nach ein: einen und -en.",
    "brauchen takes the accusative; der Arzt is masculine → einen guten Arzt.",
    "brauchen steht mit Akkusativ. der Arzt ist maskulin: einen guten Arzt.", 2))

exercises.append(ex(5, 12, "sentence_building",
    "Schreib den Satz: [ich / geben / das / klein / Kind / ein Buch]",
    "Write the sentence: I give the small child a book. (geben + Dativ recipient, neuter; Dativ before Akkusativ)",
    "Ich gebe dem kleinen Kind ein Buch.",
    sv("Ich gebe dem kleinen Kind ein Buch."),
    "geben takes a dative recipient; neuter dative is dem + -en. The dative noun stands before the accusative noun.",
    "geben steht mit Dativ. Neutrum im Dativ: dem und -en. Dativ steht vor Akkusativ.",
    "The child receives the book, so it stands in the dative → dem kleinen Kind, and ein Buch follows.",
    "Das Kind bekommt das Buch. Es steht im Dativ: dem kleinen Kind. Dann kommt ein Buch.", 3))

exercises.append(ex(5, 13, "sentence_building",
    "Schreib den Satz: [wir / fahren / mit / die / neu / Busse]",
    "Write the sentence: We travel by the new buses. (mit + Dativ, plural, with die; both word orders are accepted)",
    "Wir fahren mit den neuen Bussen.",
    sv("Wir fahren mit den neuen Bussen.", "Mit den neuen Bussen fahren wir."),
    "Dative plural after der/die/das: den + -en, and the noun adds -n: Bussen.",
    "Dativ Plural nach der, die, das: den und -en. Das Nomen bekommt ein -n: Bussen.",
    "mit takes the dative; die Busse becomes den Bussen and the adjective takes -en. Both word orders are correct.",
    "mit steht mit Dativ. Aus die Busse wird den Bussen. Das Adjektiv nimmt -en. Position 1 ist frei.", 3))

doc = {"topic": topic, "rules": rules, "examples": examples, "exercises": exercises}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=1)
    f.write("\n")
print("wrote", OUT, len(rules), "rules", len(examples), "examples", len(exercises), "exercises")
