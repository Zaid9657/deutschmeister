# -*- coding: utf-8 -*-
import json, io, os

OUT = "/tmp/claude-0/-home-user-deutschmeister/c2792a5e-db22-5773-87d6-2f95d17dddab/scratchpad/wave4/grammar/temporal-prepositions.json"

topic = {
    "sub_level": "A2.1",
    "topic_order": 12,
    "title_en": "Prepositions of Time",
    "title_de": "Zeit-Präpositionen: wann und wie lange",
    "slug": "temporal-prepositions",
    "description_en": "Learn the time prepositions vor, nach, seit, bis, ab, von … bis, zwischen and gegen, with a quick recap of um, am and im. They answer wann, wie lange, seit wann, bis wann and ab wann. You need them in Goethe A2 Sprechen Teil 3 (planning something together) and in Schreiben Teil 1, the short SMS.",
    "description_de": "Lerne die Zeit-Präpositionen: vor, nach, seit, bis, ab und zwischen. Dazu kommen gegen und von … bis. Im Sprechen Teil 3 planst du damit einen Termin.",
    "estimated_time": 25,
    "icon": "book",
    "is_published": True,
    "prerequisite_slugs": ["dative-case", "prepositions-dative"],
    "related_slugs": ["time-and-dates", "two-way-prepositions", "modal-verbs-past"],
}

def rule(rt, te, td, content, oi, cm=None, mte=None, mtd=None, fne=None, fnd=None, kie=None, kid=None):
    return {
        "rule_type": rt, "title_en": te, "title_de": td, "content": content, "order_index": oi,
        "common_mistakes": cm, "memory_trick_en": mte, "memory_trick_de": mtd,
        "formal_note_en": fne, "formal_note_de": fnd, "key_insight_en": kie, "key_insight_de": kid,
    }

rules = []

rules.append(rule(
    "introduction", "Prepositions of Time Introduction", "Einführung: Zeit-Präpositionen",
    {
        "hook_de": "Wann beginnt dein Kurs? Um acht. Wie lange dauert er? Bis zwölf.",
        "hook_en": "When does your course start? At eight. How long does it run? Until twelve. Every one of these answers starts with a small word for time.",
        "scenario_en": "You arrange a date, name a working day, say how long you have lived somewhere, or postpone a meeting by an hour.",
        "preview_note_en": "Eleven small words cover almost every time answer at A2.",
        "preview_highlight": "um · am · im · vor · nach · seit · bis · ab · von … bis · zwischen · gegen",
        "why_it_matters_en": "Goethe A2 Sprechen Teil 3 is planning something together — every turn needs a time answer. Schreiben Teil 1 (the SMS) usually names a day and a time too, and Hören Teil 1 gives opening hours and departure times.",
        "preview_example_de": "Ich arbeite von 9 bis 17 Uhr. Ab Montag habe ich Urlaub.",
        "preview_example_en": "I work from 9 to 5. From Monday on I'm on holiday.",
        "german_difference_en": "German marks the case after these words: in time expressions vor, nach, seit, ab and zwischen take the dative (vor einem Jahr, nach der Arbeit), while English simply says 'a year ago', 'after work'. As two-way prepositions, vor and zwischen take the accusative for direction (vor das Haus) — that is the other reading, from the lesson Two-Way Prepositions.",
        "english_comparison_en": "English 'for two years' becomes seit zwei Jahren — and German keeps the present tense: Ich lerne seit zwei Jahren Deutsch."
    },
    -1,
    kie="You already know um, am and im from A1 and seit from Präpositionen mit Dativ. This topic adds the rest and sorts them by question.",
    kid="um, am und im kennst du aus A1. seit kennst du aus den Dativ-Präpositionen. Hier kommt der Rest.",
))

rules.append(rule(
    "table", "Quick Recap: um, am, im", "Kurze Wiederholung: um, am, im",
    {
        "type": "case_table",
        "headers": ["Präposition", "Wann?", "Beispiel"],
        "rows": [
            ["um", "Uhrzeit", "um acht Uhr, um halb neun"],
            ["am", "Wochentag", "am Montag, am Wochenende"],
            ["am", "Datum", "am 3. Mai, am 1. Januar"],
            ["am", "Tageszeit", "am Morgen, am Abend"],
            ["im", "Monat", "im Juli, im Dezember"],
            ["im", "Jahreszeit", "im Sommer, im Winter"],
            ["in der", "Ausnahme: Nacht", "Ich arbeite in der Nacht."],
            ["ohne Präposition", "heute, morgen, gestern", "Heute habe ich frei."],
        ],
        "highlight_row": -1,
        "description_de": "Das kennst du aus A1. Nach am und im kommt der Dativ: am Montag, im Juli.",
        "description_en": "You know these from A1. am and im are already dative forms (an + dem, in + dem). Note the one exception: in der Nacht, not am Nacht."
    },
    1,
    mte="Point in the day → um. Day or date → am. Month or season → im.",
    mtd="Uhrzeit → um. Tag oder Datum → am. Monat oder Jahreszeit → im.",
))

rules.append(rule(
    "table", "Eight More Time Prepositions", "Acht Präpositionen für die Zeit",
    {
        "type": "case_table",
        "headers": ["Präposition", "Frage", "Kasus", "Beispiel"],
        "rows": [
            ["vor", "Wann?", "Dativ", "vor einem Jahr"],
            ["nach", "Wann?", "Dativ", "nach der Arbeit"],
            ["seit", "Seit wann?", "Dativ", "seit drei Jahren"],
            ["ab", "Ab wann?", "Dativ", "ab Montag, ab dem 1. Mai"],
            ["zwischen", "Wann?", "Dativ", "zwischen zwei und drei Uhr"],
            ["bis", "Bis wann?", "Akkusativ (meist ohne Artikel)", "bis Freitag, bis morgen"],
            ["von … bis", "Wie lange?", "von + Dativ … bis + Akkusativ", "von 9 bis 17 Uhr"],
            ["gegen", "Wann? (ungefähr)", "Akkusativ", "gegen acht Uhr"],
        ],
        "highlight_row": -1,
        "description_de": "Bei Zeitangaben verlangen fünf Präpositionen den Dativ. Das sind vor, nach, seit, ab und zwischen. Du kennst dem, der, einem und einer schon.",
        "description_en": "In time expressions five of them take the dative you already met in the lesson Dative Case: dem, der, einem, einer, and plural den + -n (vor zwei Jahren). Careful: as two-way prepositions vor and zwischen take the accusative for direction (vor das Haus) — that reading, from the lesson Two-Way Prepositions, is not what this table is about. bis and gegen are accusative and von is dative, but with a bare day or clock time you never see the ending."
    },
    2,
    kie="You already know gegen for an approximate time from the lesson Prepositions + Accusative: um names the exact time, gegen an approximate one. New here is only its place beside um, ab and bis in one system.",
    kid="gegen für ungefähre Zeit kennst du schon aus A1. Neu ist der Platz neben um, ab und bis.",
))

rules.append(rule(
    "table", "Five Questions, Five Answers", "Fünf Fragen, fünf Antworten",
    {
        "type": "case_table",
        "headers": ["Frage", "Bedeutung", "Antwort"],
        "rows": [
            ["Wann?", "der Moment", "Um acht Uhr. Am Montag. Im Mai."],
            ["Wie lange?", "die Zeit von A bis B", "Von 9 bis 17 Uhr. Zwei Stunden."],
            ["Seit wann?", "Start früher, jetzt noch da", "Seit drei Jahren."],
            ["Bis wann?", "das Ende", "Bis Freitag."],
            ["Ab wann?", "Start morgen oder später", "Ab Montag."],
        ],
        "highlight_row": -1,
        "description_de": "Höre zuerst die Frage. Die Frage sagt dir die Präposition.",
        "description_en": "Listen to the question first: it selects the preposition for you. Seit wann? can only be answered with seit, Bis wann? only with bis."
    },
    3,
    fne="In Sprechen Teil 3 the partner asks Wann? and Wie lange? in almost every turn. In Hören Teil 1 the announcements answer Ab wann? and Bis wann?",
    fnd="Im Sprechen Teil 3 kommen die Fragen Wann? und Wie lange? fast immer. Im Hören Teil 1 hörst du Ab wann? und Bis wann?",
))

rules.append(rule(
    "explanation_comparison", "seit or vor?", "seit oder vor?",
    {
        "type": "case_table",
        "headers": ["Satz", "Bedeutung", "Zeitform"],
        "rows": [
            ["Ich arbeite seit einem Jahr in Bremen.", "Start früher, jetzt noch da", "Präsens"],
            ["Vor einem Jahr habe ich angefangen.", "ein Moment früher, fertig", "Perfekt"],
            ["Ich wohne seit Mai in Köln.", "Ich wohne jetzt noch dort.", "Präsens"],
            ["Vor einem Monat habe ich die Wohnung gefunden.", "Der Moment ist vorbei.", "Perfekt"],
        ],
        "highlight_row": -1,
        "description_de": "seit steht mit Präsens. Das kennst du. Neu ist: vor steht meistens mit Perfekt.",
        "description_en": "You met 'seit + present tense' in Prepositions + Dative. Here is the other half: vor marks a finished point and normally takes the Perfekt. seit = still going, vor = over and done."
    },
    4,
    mte="seit = a line up to now. vor = a dot in the past.",
    mtd="seit ist eine Linie bis jetzt. vor ist ein Punkt früher.",
    kie="Both take the dative, so the endings are identical: seit einem Jahr, vor einem Jahr. Only the meaning and the tense differ.",
    kid="Beide verlangen den Dativ: seit einem Jahr, vor einem Jahr. Nur die Bedeutung ist anders.",
))

rules.append(rule(
    "tip", "bis, ab and gegen: Often Without an Article", "bis, ab und gegen: oft ohne Artikel",
    {
        "content_de": "bis steht meistens ohne Artikel: bis Freitag, bis morgen, bis nächste Woche. Mit Artikel brauchst du zu: bis zum 3. Mai, bis zur Pause. Auch ab kommt oft ohne Artikel: ab Montag, ab morgen. Mit Artikel steht ab mit dem Dativ: ab dem 1. Mai. Für die Dauer nimmst du von … bis: von 9 bis 17 Uhr. gegen sagt ungefähr: gegen acht Uhr.",
        "content_en": "bis normally stands with no article at all: bis Freitag, bis morgen, bis nächste Woche. When an article is needed, bis borrows zu: bis zum 3. Mai, bis zur Pause (zum/zur are the contractions from Prepositions + Dative). ab is the same for days: ab Montag, ab morgen — but with an article it takes the dative: ab dem 1. Mai. For a stretch of time use von … bis: von 9 bis 17 Uhr (opening hours, working hours). gegen means 'about': gegen acht Uhr is anywhere near eight."
    },
    5,
    kie="ab and von both mark a start. ab looks forward (ab Montag = from Monday on), von … bis frames a finished stretch (von 9 bis 17 Uhr).",
    kid="ab und von zeigen den Start. ab zeigt nach vorne: ab Montag. von … bis zeigt Anfang und Ende.",
))

rules.append(rule(
    "dialogue", "Dialogue: Planning a Meeting (Sprechen Teil 3)", "Dialog: einen Termin planen (Sprechen Teil 3)",
    {
        "speakers": ["Anna", "Ben"],
        "exchanges": [
            {"speaker": "Anna", "text_de": "Hast du am Samstag Zeit?", "text_en": "Do you have time on Saturday?",
             "grammar_note": "am Samstag — am + Wochentag (dative)"},
            {"speaker": "Ben", "text_de": "Am Samstag arbeite ich von 9 bis 14 Uhr.", "text_en": "On Saturday I work from 9 to 2.",
             "grammar_note": "von … bis — how long, no article"},
            {"speaker": "Anna", "text_de": "Und danach? Vielleicht gegen vier?", "text_en": "And after that? Around four maybe?",
             "grammar_note": "gegen vier — about four o'clock"},
            {"speaker": "Ben", "text_de": "Gut. Ab vier habe ich frei.", "text_en": "Good. From four on I'm free.",
             "grammar_note": "ab vier — start, looking forward"},
            {"speaker": "Anna", "text_de": "Super. Dann bis Samstag!", "text_en": "Great. See you on Saturday, then!",
             "grammar_note": "bis Samstag — end point, no article"},
        ],
        "context_de": "Zwei Freunde planen einen Termin.",
        "context_en": "Two friends arranging when to meet — the Goethe A2 Sprechen Teil 3 task.",
        "grammar_focus_en": "Five time answers in five turns: am Samstag, von 9 bis 14 Uhr, gegen vier, ab vier, bis Samstag. That is exactly the range Sprechen Teil 3 asks for."
    },
    6,
    fne="Bis Samstag! is also the standard goodbye once a date is fixed — useful at the end of Schreiben Teil 1 as well.",
    fnd="Bis Samstag! sagst du am Ende. Das passt auch gut in eine SMS.",
))

rules.append(rule(
    "common_mistakes", "Six Mistakes with Time Prepositions", "Sechs Fehler mit Zeit-Präpositionen",
    {
        "content_de": "Diese sechs Fehler kommen oft. Lies sie einmal laut.",
        "content_en": "These six come up again and again: am for a month, a missing dative -n in the plural, the Perfekt after seit, a missing dative ending after vor and nach, and an article after bis."
    },
    7,
    cm=[
        {"wrong": "Am Juli fahre ich nach Spanien.", "correct": "Im Juli fahre ich nach Spanien.",
         "explanation_de": "Monate haben im: im Juli, im Dezember. am nimmst du für Tage.",
         "explanation_en": "Months take im: im Juli, im Dezember. am is for days and dates."},
        {"wrong": "Ich habe seit drei Tage Urlaub.", "correct": "Ich habe seit drei Tagen Urlaub.",
         "explanation_de": "seit verlangt den Dativ. Im Plural bekommt das Nomen ein -n: drei Tagen.",
         "explanation_en": "seit takes the dative, and dative plural adds -n to the noun: drei Tagen, zwei Jahren."},
        {"wrong": "Ich habe seit vier Jahren Gitarre gespielt.", "correct": "Ich spiele seit vier Jahren Gitarre.",
         "explanation_de": "seit heißt: Es läuft noch. Darum kein Perfekt, sondern Präsens.",
         "explanation_en": "seit describes something still going, so German keeps the present tense — English uses 'have been playing'."},
        {"wrong": "Vor eine Woche war ich krank.", "correct": "Vor einer Woche war ich krank.",
         "explanation_de": "vor verlangt den Dativ: einer Woche, einem Monat, einem Jahr.",
         "explanation_en": "vor takes the dative: einer Woche (f.), einem Monat (m.), einem Jahr (n.)."},
        {"wrong": "Nach die Arbeit gehe ich einkaufen.", "correct": "Nach der Arbeit gehe ich einkaufen.",
         "explanation_de": "nach verlangt den Dativ: der Arbeit, dem Kurs, dem Essen.",
         "explanation_en": "nach takes the dative: der Arbeit, dem Kurs, dem Essen."},
        {"wrong": "Ich bleibe bis dem Freitag.", "correct": "Ich bleibe bis Freitag.",
         "explanation_de": "bis steht meistens ohne Artikel. Mit Artikel brauchst du zu: bis zum Freitag.",
         "explanation_en": "bis usually comes with no article (bis Freitag). If you want the article, bis needs zu: bis zum Freitag."},
    ],
))

rules.append(rule(
    "summary", "Quick Reference: Time Prepositions", "Kurzübersicht: Zeit-Präpositionen",
    {
        "points": [
            "um + Uhrzeit, am + Tag, im + Monat. Aber: in der Nacht.",
            "Bei Zeitangaben verlangen vor, nach, seit, ab und zwischen den Dativ.",
            "Dativ Plural mit -n: seit zwei Jahren, vor drei Monaten.",
            "seit: Start früher, jetzt noch da. Das Verb steht im Präsens.",
            "vor: ein Moment früher. Dazu passt das Perfekt.",
            "bis steht meistens ohne Artikel: bis Freitag, bis morgen.",
            "ab ohne Artikel: ab Montag. Mit Artikel: ab dem 1. Mai.",
            "von … bis zeigt die Dauer: von 9 bis 17 Uhr.",
            "gegen acht Uhr heißt: ungefähr acht Uhr.",
            "Fragen: Wann? Wie lange? Seit wann? Bis wann? Ab wann?",
        ]
    },
    99,
))

# ---------------------------------------------------------------- examples
def ex(oi, de, en, hl, ee, ed, wb, diff, cat):
    return {"sentence_de": de, "sentence_en": en, "grammar_highlight": hl,
            "explanation_en": ee, "explanation_de": ed, "word_breakdown": wb,
            "difficulty": diff, "category": cat, "order_index": oi, "audio_url": None}

examples = [
 ex(1, "Am Montag beginnt mein Kurs um acht Uhr.", "On Monday my course starts at eight.", "Am Montag",
    "am for the weekday, um for the clock time — the two A1 workhorses in one sentence.",
    "am steht beim Wochentag, um bei der Uhrzeit.",
    {"Am": "on (am = an + dem, dative)", "Montag": "Monday", "beginnt": "begins (beginnen)",
     "mein": "my", "Kurs": "course", "um": "at (clock time)", "acht": "eight", "Uhr": "o'clock"},
    1, "basic"),
 ex(2, "Im Sommer fahren wir nach Italien.", "In summer we go to Italy.", "Im Sommer",
    "im for seasons and months: im Sommer, im Juli.",
    "im steht bei Jahreszeiten und Monaten: im Sommer, im Juli.",
    {"Im": "in (im = in + dem, dative)", "Sommer": "summer", "fahren": "go, travel (fahren)",
     "wir": "we", "nach": "to (a country/city)", "Italien": "Italy"},
    1, "basic"),
 ex(3, "Vor einem Jahr bin ich nach Berlin gekommen.", "A year ago I came to Berlin.", "Vor einem Jahr",
    "vor + dative marks a finished point in the past, so the verb is in the Perfekt.",
    "vor verlangt den Dativ: einem Jahr. Der Moment ist vorbei, darum Perfekt.",
    {"Vor": "ago (vor + dative)", "einem": "a (dative, das Jahr)", "Jahr": "year", "bin": "am (sein, auxiliary)",
     "ich": "I", "nach": "to", "Berlin": "Berlin", "gekommen": "come (Partizip II of kommen)"},
    2, "intermediate"),
 ex(4, "Nach der Arbeit gehe ich einkaufen.", "After work I go shopping.", "Nach der Arbeit",
    "nach + dative for 'after': der Arbeit (die Arbeit is feminine).",
    "nach verlangt den Dativ. die Arbeit ist feminin: der Arbeit.",
    {"Nach": "after (nach + dative)", "der": "the (dative, die Arbeit)", "Arbeit": "work",
     "gehe": "go (gehen)", "ich": "I", "einkaufen": "to shop (einkaufen)"},
    2, "intermediate"),
 ex(5, "Mein Bruder studiert seit drei Jahren in München.", "My brother has been studying in Munich for three years.", "seit drei Jahren",
    "seit + dative plural adds -n: drei Jahren. German keeps the present tense here.",
    "seit verlangt den Dativ. Im Plural kommt ein -n dazu: drei Jahren. Das Verb steht im Präsens.",
    {"Mein": "my", "Bruder": "brother", "studiert": "studies (studieren, present)",
     "seit": "for, since (seit + dative)", "drei": "three", "Jahren": "years (dative plural, + -n)",
     "in": "in", "München": "Munich"},
    2, "intermediate"),
 ex(6, "Ich bleibe bis Freitag in Hamburg.", "I'm staying in Hamburg until Friday.", "bis Freitag",
    "bis marks the end point and normally takes no article.",
    "bis zeigt das Ende. Meistens steht kein Artikel dabei.",
    {"Ich": "I", "bleibe": "stay (bleiben)", "bis": "until", "Freitag": "Friday",
     "in": "in", "Hamburg": "Hamburg"},
    2, "intermediate"),
 ex(7, "Ich arbeite von 9 bis 17 Uhr.", "I work from 9 to 5.", "von 9 bis 17 Uhr",
    "von … bis frames how long something lasts — the standard way to give working or opening hours.",
    "von … bis zeigt die Dauer. So sagst du Arbeitszeiten und Öffnungszeiten.",
    {"Ich": "I", "arbeite": "work (arbeiten)", "von": "from", "9": "nine", "bis": "to, until",
     "17": "seventeen (5 p.m.)", "Uhr": "o'clock"},
    2, "intermediate"),
 ex(8, "Ab Montag habe ich Urlaub.", "From Monday on I'm on holiday.", "Ab Montag",
    "ab looks forward from a starting day and stands here without an article.",
    "ab zeigt den Start nach vorne. Hier steht kein Artikel.",
    {"Ab": "from … on", "Montag": "Monday", "habe": "have (haben)", "ich": "I", "Urlaub": "holiday, time off"},
    2, "intermediate"),
 ex(9, "Ich komme heute erst gegen acht Uhr.", "Today I won't get there before about eight.", "gegen acht Uhr",
    "gegen + clock time means 'around, about' — the classic line in a Schreiben Teil 1 SMS.",
    "gegen heißt ungefähr. Das schreibst du oft in einer SMS.",
    {"Ich": "I", "komme": "come (kommen)", "heute": "today", "erst": "only, not before",
     "gegen": "around, about", "acht": "eight", "Uhr": "o'clock"},
    3, "exam"),
 ex(10, "Zwischen zwei und drei Uhr habe ich Pause.", "Between two and three I have a break.", "Zwischen zwei und drei Uhr",
    "zwischen takes the dative; with bare clock times you cannot see the ending.",
    "zwischen verlangt bei der Zeit den Dativ. Bei Uhrzeiten siehst du die Endung nicht.",
    {"Zwischen": "between (zwischen + dative)", "zwei": "two", "und": "and", "drei": "three",
     "Uhr": "o'clock", "habe": "have (haben)", "ich": "I", "Pause": "break"},
    3, "complex"),
]

# ---------------------------------------------------------------- exercises
def exc(stage, oi, t, qde, qen, correct, acc, ee, ed, wce, wcd, diff, options=None):
    return {"exercise_type": t, "question_de": qde, "question_en": qen, "options": options,
            "correct_answer": correct, "acceptable_answers": acc,
            "explanation_en": ee, "explanation_de": ed, "hint": None,
            "why_correct_en": wce, "why_correct_de": wcd, "difficulty": diff,
            "stage": stage, "order_index": oi, "related_rule_title": None}

exercises = []

exercises.append(exc(4, 1, "fill_blank",
  "Der Film beginnt ___ acht Uhr.",
  "Fill in the time preposition: The film starts at eight o'clock. (clock time)",
  "um", ["um"],
  "Clock times take um: um acht Uhr.",
  "Bei der Uhrzeit steht um: um acht Uhr.",
  "Question: Wann? Answer: um acht Uhr — um is the preposition for the clock.",
  "Frage: Wann? Antwort: um acht Uhr. um steht bei der Uhrzeit.", 1))

exercises.append(exc(4, 2, "fill_blank",
  "___ Mittwoch habe ich einen Termin.",
  "Fill in the preposition: On Wednesday I have an appointment. (weekday; the answer starts the sentence)",
  "Am", ["Am", "am"],
  "Weekdays take am: am Mittwoch.",
  "Wochentage haben am: am Mittwoch.",
  "am = an + dem, so the weekday is already in the dative.",
  "am ist an + dem. Der Wochentag steht also im Dativ.", 1))

exercises.append(exc(4, 3, "fill_blank",
  "Mein Urlaub beginnt ___ Juli.",
  "Fill in the preposition: My holiday starts in July. (month)",
  "im", ["im"],
  "Months take im: im Juli.",
  "Monate haben im: im Juli.",
  "im = in + dem. For days you would say am, for months im.",
  "im ist in + dem. Bei Tagen sagst du am, bei Monaten im.", 1))

exercises.append(exc(4, 4, "multiple_choice",
  "Ich arbeite ___ zwei Monaten in Berlin.",
  "Choose the preposition: I have been working in Berlin for two months — it started earlier and is still true today. (present tense)",
  "seit", ["seit"],
  "seit marks a stretch that started earlier and is still going, and German keeps the present tense.",
  "seit zeigt: Der Start war früher. Jetzt ist es noch so. Das Verb steht im Präsens.",
  "Only seit fits a present-tense sentence about something still true; vor needs the Perfekt, ab looks forward, bis marks an end.",
  "Nur seit passt zum Präsens. vor braucht Perfekt, ab zeigt nach vorne, bis zeigt das Ende.",
  2, options=["seit", "vor", "ab", "bis"]))

exercises.append(exc(4, 5, "fill_blank",
  "Nach ___ Pause trinke ich einen Kaffee.",
  "Fill in the dative article: After the break I have a coffee. (die Pause, Dativ)",
  "der", ["der"],
  "nach takes the dative: die Pause becomes der Pause.",
  "nach verlangt den Dativ. die Pause ist feminin: der Pause.",
  "Feminine nouns take der in the dative — the same der you know from mit der U-Bahn.",
  "Feminin heißt im Dativ der. Das kennst du von mit der U-Bahn.", 2))

exercises.append(exc(4, 6, "fill_blank",
  "Vor ___ Monat war ich in Wien.",
  "Fill in the dative form: A month ago I was in Vienna. (ein Monat, Dativ)",
  "einem", ["einem"],
  "vor takes the dative: ein Monat becomes einem Monat.",
  "vor verlangt den Dativ. der Monat ist maskulin: einem Monat.",
  "der Monat is masculine, so the dative is einem — the -m pattern from dative-case.",
  "der Monat ist maskulin. Im Dativ heißt das einem. Das ist das -m-Muster.", 2))

exercises.append(exc(4, 7, "multiple_choice",
  "___ Sonntag arbeite ich nicht.",
  "Choose the preposition: On Sunday I don't work. (weekday)",
  "Am", ["Am"],
  "Weekdays take am, months take im.",
  "Wochentage haben am, Monate haben im.",
  "Sonntag is a day, so am is the only fit; Im is for months, Um for clock times, and An can never stand alone before a weekday (an + dem = am).",
  "Sonntag ist ein Tag, also am. An steht nie allein vor dem Tag: an + dem = am.",
  2, options=["Im", "Um", "Am", "An"]))

exercises.append(exc(4, 8, "fill_blank",
  "„Wie lange ist das Museum geöffnet?“ — „___ 10 bis 18 Uhr.“",
  "Answer to Wie lange? Fill in the preposition for the starting point: From 10 to 6. (von … bis; the answer opens the sentence)",
  "Von", ["Von", "von"],
  "Wie lange? is answered with the pair von … bis.",
  "Auf Wie lange? antwortest du mit von … bis.",
  "bis is already there and marks the end, so the start needs von.",
  "bis steht schon da und zeigt das Ende. Der Start braucht von.", 2))

exercises.append(exc(4, 9, "fill_blank",
  "Der Kurs dauert ___ Freitag.",
  "Fill in the preposition for the end point: The course lasts until Friday. (no article)",
  "bis", ["bis"],
  "bis marks the end point and normally stands without an article.",
  "bis zeigt das Ende. Meistens steht kein Artikel dabei.",
  "The answer to Bis wann? is bis + day: bis Freitag.",
  "Die Antwort auf Bis wann? ist bis + Tag: bis Freitag.", 2))

exercises.append(exc(4, 10, "error_correction",
  "Korrigiere den Fehler: Ich bin seit zwei Tage hier.",
  "Correct the mistake: seit takes the dative, and the dative plural adds -n. Keep the word order.",
  "Ich bin seit zwei Tagen hier.",
  ["Ich bin seit zwei Tagen hier.", "Ich bin seit zwei Tagen hier"],
  "Dative plural adds -n to the noun: zwei Tagen.",
  "Im Dativ Plural bekommt das Nomen ein -n: zwei Tagen.",
  "seit is a dative preposition, so der Tag gives the dative plural Tagen.",
  "seit verlangt den Dativ. Der Dativ Plural heißt hier zwei Tagen.", 2))

exercises.append(exc(4, 11, "error_correction",
  "Korrigiere den Fehler: Am Juli fahre ich nach Spanien.",
  "Correct the mistake: months take im, not am. Keep the word order.",
  "Im Juli fahre ich nach Spanien.",
  ["Im Juli fahre ich nach Spanien.", "Im Juli fahre ich nach Spanien"],
  "Months take im: im Juli, im Dezember.",
  "Monate haben im: im Juli, im Dezember.",
  "am is for days and dates (am Montag, am 3. Mai); Juli is a month.",
  "am nimmst du für Tage: am Montag, am 3. Mai. Juli ist ein Monat.", 3))

exercises.append(exc(4, 12, "multiple_choice",
  "Ich komme ___ acht Uhr. Vielleicht 7:50, vielleicht 8:10.",
  "Choose the preposition: I'm coming at about eight — not exactly eight. (approximately)",
  "gegen", ["gegen"],
  "gegen + clock time means 'around, about'.",
  "gegen bei der Uhrzeit heißt: ungefähr.",
  "The second sentence says the time is not exact, so um (exactly eight) is out; seit and bis answer other questions.",
  "Der zweite Satz sagt: nicht genau. Darum passt um nicht. seit und bis antworten auf andere Fragen.",
  3, options=["um", "seit", "bis", "gegen"]))

exercises.append(exc(4, 13, "multiple_choice",
  "___ wann arbeitest du heute? — Bis 17 Uhr.",
  "Choose the question word that asks for the end point: Until when are you working today?",
  "Bis", ["Bis"],
  "Bis wann? asks for the end; the answer repeats bis.",
  "Bis wann? fragt nach dem Ende. Die Antwort hat auch bis.",
  "The answer Bis 17 Uhr names an end point, so the question must be Bis wann?",
  "Die Antwort Bis 17 Uhr zeigt das Ende. Also fragst du Bis wann?",
  3, options=["Seit", "Bis", "Von", "Ab"]))

# ---- stage 5
exercises.append(exc(5, 1, "sentence_building",
  "Schreib den Satz: [wir / am Sonntag / ins Kino / gehen]",
  "Write the sentence: On Sunday we go to the cinema. (both word orders are correct)",
  "Wir gehen am Sonntag ins Kino.",
  ["Wir gehen am Sonntag ins Kino.", "Wir gehen am Sonntag ins Kino",
   "Am Sonntag gehen wir ins Kino.", "Am Sonntag gehen wir ins Kino"],
  "am + weekday. The time phrase may stand in position 1 or after the verb.",
  "am steht beim Wochentag. Die Zeit kann vorne oder nach dem Verb stehen.",
  "The verb stays in position 2 either way: Wir gehen … / Am Sonntag gehen wir …",
  "Das Verb bleibt auf Position 2. Vorne steht wir oder Am Sonntag.", 2))

exercises.append(exc(5, 2, "sentence_building",
  "Schreib den Satz: [ich / im Mai / Geburtstag / haben]",
  "Write the sentence: My birthday is in May (literally: I have birthday in May). (both word orders are correct)",
  "Ich habe im Mai Geburtstag.",
  ["Ich habe im Mai Geburtstag.", "Ich habe im Mai Geburtstag",
   "Im Mai habe ich Geburtstag.", "Im Mai habe ich Geburtstag"],
  "im + month. German says Ich habe Geburtstag, with no article.",
  "im steht beim Monat. Auf Deutsch sagt man: Ich habe Geburtstag.",
  "Whatever comes first, habe stays in position 2.",
  "Vorne steht ich oder Im Mai. Das Verb habe bleibt auf Position 2.", 2))

exercises.append(exc(5, 3, "sentence_building",
  "Schreib den Satz: [ich / seit drei Monaten / einen Deutschkurs / besuchen]",
  "Write the sentence: I have been attending a German course for three months. (present tense; both word orders are correct)",
  "Ich besuche seit drei Monaten einen Deutschkurs.",
  ["Ich besuche seit drei Monaten einen Deutschkurs.", "Ich besuche seit drei Monaten einen Deutschkurs",
   "Seit drei Monaten besuche ich einen Deutschkurs.", "Seit drei Monaten besuche ich einen Deutschkurs"],
  "seit + dative plural (drei Monaten) and the present tense besuche.",
  "seit verlangt den Dativ Plural: drei Monaten. Das Verb steht im Präsens.",
  "German says 'Ich besuche seit …', never the Perfekt, because the course is still running.",
  "Du besuchst den Kurs jetzt noch. Darum steht besuche im Präsens.", 2))

exercises.append(exc(5, 4, "sentence_building",
  "Schreib den Satz im Perfekt: [wir / vor zwei Monaten / nach Hamburg / fahren]",
  "Write the sentence in the Perfekt: We went to Hamburg two months ago. (verb: fahren; both word orders are correct)",
  "Wir sind vor zwei Monaten nach Hamburg gefahren.",
  ["Wir sind vor zwei Monaten nach Hamburg gefahren.", "Wir sind vor zwei Monaten nach Hamburg gefahren",
   "Vor zwei Monaten sind wir nach Hamburg gefahren.", "Vor zwei Monaten sind wir nach Hamburg gefahren"],
  "vor + dative plural (zwei Monaten) marks a finished point, so the Perfekt fits.",
  "vor verlangt den Dativ Plural: zwei Monaten. Der Moment ist vorbei, darum Perfekt.",
  "fahren is a movement verb, so the Perfekt takes sein: sind gefahren.",
  "fahren ist ein Bewegungsverb. Das Perfekt hat sein: sind gefahren.", 3))

exercises.append(exc(5, 5, "sentence_building",
  "Schreib den Satz: [ich / nach dem Kurs / nach Hause / fahren]",
  "Write the sentence: After the course I drive home. (both word orders are correct)",
  "Ich fahre nach dem Kurs nach Hause.",
  ["Ich fahre nach dem Kurs nach Hause.", "Ich fahre nach dem Kurs nach Hause",
   "Nach dem Kurs fahre ich nach Hause.", "Nach dem Kurs fahre ich nach Hause"],
  "The first nach is temporal (+ dative), the second is the fixed phrase nach Hause.",
  "Das erste nach ist Zeit und verlangt den Dativ. Das zweite nach steht in nach Hause.",
  "der Kurs is masculine, so the dative is dem Kurs.",
  "der Kurs ist maskulin. Im Dativ heißt das dem Kurs.", 2))

exercises.append(exc(5, 6, "sentence_building",
  "Schreib den Satz: [ich / von Montag bis Freitag / arbeiten]",
  "Write the sentence: I work from Monday to Friday. (both word orders are correct)",
  "Ich arbeite von Montag bis Freitag.",
  ["Ich arbeite von Montag bis Freitag.", "Ich arbeite von Montag bis Freitag",
   "Von Montag bis Freitag arbeite ich.", "Von Montag bis Freitag arbeite ich"],
  "von … bis also works with weekdays, and both parts stay articleless.",
  "von … bis geht auch mit Wochentagen. Ein Artikel steht nicht dabei.",
  "The pair answers Wie lange? — von names the start, bis the end.",
  "Das Paar antwortet auf Wie lange? von zeigt den Start, bis das Ende.", 2))

exercises.append(exc(5, 7, "sentence_building",
  "Antworte auf „Ab wann arbeitest du in Köln?“: [ich / ab dem 1. Mai / in Köln / arbeiten]",
  "Answer the question Ab wann arbeitest du in Köln? — From 1 May on I work in Cologne. (both word orders are correct)",
  "Ich arbeite ab dem 1. Mai in Köln.",
  ["Ich arbeite ab dem 1. Mai in Köln.", "Ich arbeite ab dem 1. Mai in Köln",
   "Ab dem 1. Mai arbeite ich in Köln.", "Ab dem 1. Mai arbeite ich in Köln"],
  "With a date and an article, ab takes the dative: ab dem 1. Mai.",
  "Mit Artikel steht ab mit dem Dativ: ab dem 1. Mai.",
  "Ab wann? is answered with ab. Without an article ab needs nothing: ab Montag, ab morgen.",
  "Auf Ab wann? antwortest du mit ab. Ohne Artikel steht ab allein: ab Montag.", 3))

exercises.append(exc(5, 8, "sentence_building",
  "Schreib den Satz: [wir / bis Samstag / in Wien / bleiben]",
  "Write the sentence: We're staying in Vienna until Saturday. (both word orders are correct)",
  "Wir bleiben bis Samstag in Wien.",
  ["Wir bleiben bis Samstag in Wien.", "Wir bleiben bis Samstag in Wien",
   "Bis Samstag bleiben wir in Wien.", "Bis Samstag bleiben wir in Wien"],
  "bis marks the end point, with no article.",
  "bis zeigt das Ende. Ein Artikel steht nicht dabei.",
  "The answer to Bis wann? is bis + day: bis Samstag.",
  "Die Antwort auf Bis wann? ist bis + Tag: bis Samstag.", 3))

exercises.append(exc(5, 9, "fill_blank",
  "SMS an eine Freundin: Ich bin erst ___ neun Uhr zu Hause.",
  "Fill in the preposition (Schreiben Teil 1, SMS): I won't be home before about nine. (approximate time, not an exact one)",
  "gegen", ["gegen"],
  "gegen + clock time means 'around' — very common in a short SMS.",
  "gegen heißt ungefähr. Das passt gut in eine SMS.",
  "um neun Uhr would name an exact time; the cue asks for an approximate one, so gegen fits.",
  "um neun Uhr heißt genau neun. Mit gegen sagst du: ungefähr neun.", 3))

exercises.append(exc(5, 10, "error_correction",
  "Korrigiere den Fehler: Ich bleibe bis dem Sonntag.",
  "Correct the mistake: bis + article needs zu. Keep the word order — two repairs are accepted.",
  "Ich bleibe bis Sonntag.",
  ["Ich bleibe bis Sonntag.", "Ich bleibe bis Sonntag",
   "Ich bleibe bis zum Sonntag.", "Ich bleibe bis zum Sonntag"],
  "bis stands with no article (bis Sonntag). With an article it needs zu: bis zum Sonntag. Both repairs count.",
  "bis steht meistens ohne Artikel: bis Sonntag. Mit Artikel brauchst du zu: bis zum Sonntag.",
  "bis dem is never possible: either drop the article (bis Sonntag) or add zu (bis zum Sonntag).",
  "bis dem gibt es nicht. Streich den Artikel oder nimm zu: bis zum Sonntag.", 3))

exercises.append(exc(5, 11, "sentence_building",
  "Schreib den Satz: [wir / zwischen acht und neun Uhr / frühstücken]",
  "Write the sentence: We have breakfast between eight and nine. (both word orders are correct)",
  "Wir frühstücken zwischen acht und neun Uhr.",
  ["Wir frühstücken zwischen acht und neun Uhr.", "Wir frühstücken zwischen acht und neun Uhr",
   "Zwischen acht und neun Uhr frühstücken wir.", "Zwischen acht und neun Uhr frühstücken wir"],
  "zwischen takes the dative; with bare clock times the ending is invisible.",
  "zwischen verlangt den Dativ. Bei Uhrzeiten siehst du die Endung nicht.",
  "zwischen names two points, so it needs und between them: zwischen acht und neun Uhr.",
  "zwischen nennt zwei Punkte. Dazwischen steht und: zwischen acht und neun Uhr.", 3))

exercises.append(exc(5, 12, "multiple_choice",
  "„Wann hast du Zeit?“ — „___ Samstag ab drei.“",
  "Sprechen Teil 3 (planning together): choose the preposition for the weekday.",
  "Am", ["Am"],
  "Weekdays take am; ab then names the starting hour.",
  "Wochentage haben am. ab nennt danach die Startzeit.",
  "Samstag is a day, so Am is the only fit; Im is for months and Um for clock times.",
  "Samstag ist ein Tag, also Am. Im nimmst du für Monate, Um für die Uhrzeit.",
  3, options=["Am", "Im", "Um", "Seit"]))

exercises.append(exc(5, 13, "multiple_choice",
  "„Seit wann lernst du Deutsch?“ — „___ einem Jahr.“",
  "Choose the preposition that answers 'Seit wann?': for a year now, still going.",
  "Seit", ["Seit"],
  "Seit wann? is answered with seit + dative.",
  "Auf Seit wann? antwortest du mit seit + Dativ.",
  "Vor einem Jahr would answer Wann? and needs the Perfekt; ab looks forward and bis marks an end.",
  "Vor einem Jahr antwortet auf Wann? und braucht Perfekt. ab zeigt nach vorne, bis das Ende.",
  3, options=["Vor", "Bis", "Ab", "Seit"]))

doc = {"topic": topic, "rules": rules, "examples": examples, "exercises": exercises}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with io.open(OUT, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=1)
    f.write("\n")
print("wrote", OUT, len(rules), len(examples), len(exercises))
