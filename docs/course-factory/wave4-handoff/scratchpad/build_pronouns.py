# -*- coding: utf-8 -*-
"""Builder for pronouns-accusative-dative.json (A2.1, topic_order 10)."""
import json, io, os

RULE_NULLS = dict(common_mistakes=None, memory_trick_en=None, memory_trick_de=None,
                  formal_note_en=None, formal_note_de=None, key_insight_en=None, key_insight_de=None)


def rule(rule_type, title_en, title_de, content, order_index, **kw):
    r = dict(rule_type=rule_type, title_en=title_en, title_de=title_de, content=content,
             order_index=order_index)
    r.update(RULE_NULLS)
    r.update(kw)
    # keep reference key order: rule_type,title_en,title_de,content,order_index,common_mistakes,...
    ordered = {}
    for k in ['rule_type', 'title_en', 'title_de', 'content', 'order_index', 'common_mistakes',
              'memory_trick_en', 'memory_trick_de', 'formal_note_en', 'formal_note_de',
              'key_insight_en', 'key_insight_de']:
        ordered[k] = r[k]
    return ordered


topic = {
    "sub_level": "A2.1",
    "topic_order": 10,
    "title_en": "Accusative & Dative Pronouns",
    "title_de": "Pronomen im Akkusativ und Dativ",
    "slug": "pronouns-accusative-dative",
    "description_en": "Use mich/dich/ihn and mir/dir/ihm as objects and after prepositions. You need them in Goethe A2 Schreiben Teil 1 (SMS) and Sprechen Teil 3, where you ask for help and make plans together. This topic adds the accusative forms, the object order (Ich gebe es ihm) and the pronoun after fuer, mit and von.",
    "description_de": "Lerne mich, dich, ihn und mir, dir, ihm als Objekte. Bei Goethe A2 brauchst du sie in Schreiben Teil 1. In Sprechen Teil 3 fragst du: Kannst du mir helfen?",
    "estimated_time": 25,
    "icon": "book",
    "difficulty": 2,
    "is_published": True,
    "prerequisite_slugs": ["dative-case", "prepositions-dative"],
    "related_slugs": ["personal-pronouns", "prepositions-accusative", "imperative-mood"],
}
# fix the ASCII placeholder in description_en
topic["description_en"] = topic["description_en"].replace("fuer", "für")

rules = []

rules.append(rule(
    "introduction", "Object Pronouns Introduction", "Einführung: Objektpronomen",
    {
        "hook_de": "Kennst du Frau Meier? Ja, ich kenne sie gut. Ich helfe ihr oft.",
        "hook_en": "Do you know Frau Meier? Yes, I know her well. I often help her. German uses two different words here: sie (accusative) and ihr (dative).",
        "scenario_en": "As soon as a person or a thing is known, you stop repeating the noun and say ihn, sie, ihm or ihr instead.",
        "preview_note_en": "The verb or the preposition decides the case: wen? (accusative) or wem? (dative).",
        "preview_highlight": "Ich kenne sie. Ich helfe ihr.",
        "why_it_matters_en": "In Goethe A2 Schreiben Teil 1 you write short messages like Kannst du mir helfen? Almost every one of them contains an object pronoun.",
        "preview_example_de": "Ich rufe dich an. Ich danke dir.",
        "preview_example_en": "I'll call you. I thank you.",
        "german_difference_en": "English keeps one form for both cases: help me, call me. German splits them: Hilf mir! but Ruf mich an!",
        "english_comparison_en": "English me covers mich and mir, and you covers dich, dir, euch, Sie and Ihnen. German picks the form the verb or the preposition needs.",
    },
    -1,
))

rules.append(rule(
    "table", "Both Cases in One Table", "Beide Fälle in einer Tabelle",
    {
        "type": "case_table",
        "headers": ["Nominativ", "Akkusativ (wen?)", "Dativ (wem?)", "Beispiel"],
        "rows": [
            ["ich", "mich", "mir", "Er kennt mich. Er hilft mir."],
            ["du", "dich", "dir", "Ich rufe dich an. Ich danke dir."],
            ["er", "ihn", "ihm", "Ich frage ihn. Ich schreibe ihm."],
            ["sie (eine Frau)", "sie", "ihr", "Ich besuche sie. Das gefällt ihr."],
            ["es", "es", "ihm", "Ich nehme es. (das Buch)"],
            ["wir", "uns", "uns", "Er besucht uns. Er hilft uns."],
            ["ihr", "euch", "euch", "Ich rufe euch an. Ich danke euch."],
            ["sie (Plural)", "sie", "ihnen", "Ich kenne sie. Ich helfe ihnen."],
            ["Sie (formell)", "Sie", "Ihnen", "Ich rufe Sie an. Ich danke Ihnen."],
        ],
        "highlight_row": -1,
        "description_de": "Die Formen kennst du schon: mich, dich, ihn und mir, dir, ihm. Neu ist die Frage: Welchen Fall will das Verb? Frage wen? für den Akkusativ und wem? für den Dativ.",
        "description_en": "Nothing in the grid itself is new: you learnt mich/dich/ihn in Accusative Case Intro and the whole table in Dative Case. What is new is the question it answers — which case does the verb or the preposition want? — and the Beispiel column, which shows each form at work. Note that uns and euch are identical in both cases, and that es as a dative pronoun (ihm) is rare.",
    },
    1,
    memory_trick_en="Accusative often ends in -ch or -n: mich, dich, ihn. Dative often ends in -r or -m: mir, dir, ihm (plural ihnen/Ihnen is the exception). And uns/euch are the same in both cases.",
    memory_trick_de="Akkusativ: mich, dich, ihn. Dativ: mir, dir, ihm. Der Dativ endet oft auf -r oder -m. uns und euch sind immer gleich.",
    key_insight_en="This is a consolidation table: the forms are old, the choice between the two columns is the new skill.",
    key_insight_de="Die Formen sind alt. Neu ist die Wahl: Akkusativ oder Dativ?",
))

rules.append(rule(
    "explanation_core", "The Verb Decides the Case", "Das Verb bestimmt den Fall",
    {
        "type": "verb_list",
        "groups": [
            {
                "category_en": "Verbs with an accusative object (wen?)",
                "category_de": "Verben mit Akkusativ (wen?)",
                "verbs": [
                    {"de": "anrufen", "en": "to call (on the phone)", "example": "Ich rufe dich an."},
                    {"de": "besuchen", "en": "to visit", "example": "Wir besuchen euch."},
                    {"de": "fragen", "en": "to ask", "example": "Frag ihn bitte!"},
                    {"de": "kennen", "en": "to know (a person)", "example": "Ich kenne sie gut."},
                    {"de": "verstehen", "en": "to understand", "example": "Verstehst du mich?"},
                    {"de": "brauchen", "en": "to need", "example": "Ich brauche es heute."},
                    {"de": "abholen", "en": "to pick up", "example": "Ich hole dich ab."},
                ],
            },
            {
                "category_en": "Verbs with a dative object (wem?)",
                "category_de": "Verben mit Dativ (wem?)",
                "verbs": [
                    {"de": "helfen", "en": "to help", "example": "Er hilft mir oft."},
                    {"de": "danken", "en": "to thank", "example": "Ich danke Ihnen."},
                    {"de": "gefallen", "en": "to please, to like", "example": "Die Wohnung gefällt uns."},
                    {"de": "gehören", "en": "to belong to", "example": "Das Fahrrad gehört ihm."},
                    {"de": "schmecken", "en": "to taste good", "example": "Die Suppe schmeckt mir."},
                    {"de": "passen", "en": "to suit, to fit", "example": "Der Termin passt dir nicht."},
                    {"de": "antworten", "en": "to answer (a person)", "example": "Antworte ihr bitte!"},
                ],
            },
        ],
        "description_en": "Most verbs take an accusative object. A small group takes the dative — you met that group in Dative Case; here each verb comes with a pronoun.",
        "description_de": "Die meisten Verben nehmen den Akkusativ. Die Dativ-Verben kennst du aus Thema 1. Jetzt steht ein Pronomen dabei.",
    },
    2,
    key_insight_en="helfen, danken and gefallen always take the dative; anrufen and besuchen always take the accusative. Learn every new verb together with its case.",
    key_insight_de="helfen, danken und gefallen nehmen immer den Dativ. anrufen und besuchen nehmen immer den Akkusativ.",
))

rules.append(rule(
    "pattern", "Two Objects: What Comes First?", "Zwei Objekte: Was kommt zuerst?",
    {
        "type": "steps",
        "steps": [
            {"step": 1, "title_de": "Wiederholung: Zwei Nomen, Dativ vor Akkusativ.",
             "title_en": "Review: two nouns, dative before accusative.",
             "detail_de": "Das kennst du aus Thema 1: Ich gebe dem Kind das Buch.",
             "detail_en": "Review from Dative Case, not new material: Ich gebe dem Kind das Buch — the person (dative) before the thing (accusative). Steps 2 and 3 exist in Dative Case too, as one English sentence; what is new here is the German treatment, the split into steps and the practice."},
            {"step": 2, "title_de": "Ein Pronomen: Das Pronomen steht vorne.",
             "title_en": "One pronoun: the pronoun goes first.",
             "detail_de": "Ich gebe ihm das Buch. Ich gebe es dem Kind.",
             "detail_en": "Ich gebe ihm das Buch. Ich gebe es dem Kind. A pronoun always stands in front of a noun object, whatever its case is."},
            {"step": 3, "title_de": "Zwei Pronomen: Akkusativ vor Dativ.",
             "title_en": "Two pronouns: accusative before dative.",
             "detail_de": "Ich gebe es ihm. Nicht: Ich gebe ihm es.",
             "detail_en": "Ich gebe es ihm. Not: Ich gebe ihm es. This is the one situation where the order flips."},
            {"step": 4, "title_de": "Merke: kurz vor lang.",
             "title_en": "Remember: short before long.",
             "detail_de": "Pronomen sind kurz. Kurze Wörter stehen vorne. Schritt 3 ist eine Extra-Regel.",
             "detail_en": "Pronouns are short words, and short words move to the front. That idea covers step 2. Step 3 is a separate fact you have to learn: with two pronouns both words are short, so shortness decides nothing and the accusative simply comes first."},
        ],
        "description_en": "Three situations. Pronouns move forward — and when both objects are pronouns, a second rule decides: the accusative comes first.",
        "description_de": "Drei Situationen. Pronomen stehen vorne. Bei zwei Pronomen kommt der Akkusativ zuerst.",
    },
    3,
    key_insight_en="Dative before accusative is the noun rule from Dative Case; it flips only when both objects are pronouns: Ich gebe es ihm.",
    key_insight_de="Nur bei zwei Pronomen steht der Akkusativ vorne: Ich gebe es ihm.",
))

rules.append(rule(
    "tip", "Pronouns After Prepositions", "Pronomen nach Präpositionen",
    {
        "content_de": "Hier bestimmt die Präposition den Fall. für, ohne, gegen + Akkusativ: für dich, ohne mich, gegen ihn. mit, bei, von, zu + Dativ: mit ihm, bei uns, von dir.",
        "content_en": "After a preposition the preposition picks the case, not the verb: für, ohne and gegen take the accusative (für dich, ohne mich, gegen ihn), while mit, bei, von and zu take the dative (mit ihm, bei uns, von dir, zu euch). The prepositions are the ones you already know — only the pronoun form is new.",
    },
    4,
    formal_note_en="After a preposition these pronouns refer to people. For things German uses da-forms (dafür, damit) — that comes later, so stay with people here.",
    formal_note_de="Diese Pronomen stehen für Personen. Für Dinge lernst du später dafür und damit.",
    key_insight_en="mit mir is the most frequent combination of all: Kommst du mit mir?",
    key_insight_de="mit mir hörst du sehr oft. Beispiel: Kommst du mit mir?",
))

rules.append(rule(
    "dialogue", "Dialogue: Help at the Office", "Dialog: Hilfe im Büro",
    {
        "type": "dialogue",
        "lines": [
            {"speaker": "Anna", "de": "Hallo Tom, kannst du mir kurz helfen?",
             "en": "Hi Tom, can you help me for a moment?", "grammar_note": "helfen + Dativ: mir"},
            {"speaker": "Tom", "de": "Klar, ich helfe dir gern. Was brauchst du?",
             "en": "Sure, I'm happy to help you. What do you need?", "grammar_note": "dir (Dativ), brauchen + Akkusativ"},
            {"speaker": "Anna", "de": "Ich suche den Schlüssel. Hast du ihn?",
             "en": "I'm looking for the key. Do you have it?", "grammar_note": "ihn = der Schlüssel (Akkusativ)"},
            {"speaker": "Tom", "de": "Nein, Frau Meier hat ihn. Ruf sie an!",
             "en": "No, Frau Meier has it. Give her a call!", "grammar_note": "sie = Frau Meier (Akkusativ nach anrufen)"},
            {"speaker": "Anna", "de": "Gut. Passt dir der Termin am Montag?",
             "en": "Good. Does the appointment on Monday suit you?", "grammar_note": "passen + Dativ: dir"},
            {"speaker": "Tom", "de": "Ja, Montag passt mir. Ich schicke dir eine E-Mail.",
             "en": "Yes, Monday suits me. I'll send you an email.", "grammar_note": "Pronomen (dir) vor Nomen (eine E-Mail)"},
            {"speaker": "Anna", "de": "Danke, das ist nett von dir.",
             "en": "Thanks, that's kind of you.", "grammar_note": "von + Dativ: von dir"},
        ],
        "description_en": "Seven lines, seven pronouns. This is exactly the register of Sprechen Teil 3, where two people arrange something together.",
        "description_de": "Sieben Zeilen, sieben Pronomen. So sprichst du auch in Sprechen Teil 3.",
    },
    5,
    key_insight_en="Notice line 6: the pronoun dir stands before the noun eine E-Mail — that is rule 3, step 2.",
    key_insight_de="Zeile 6 zeigt die Reihenfolge: erst dir, dann eine E-Mail.",
))

rules.append(rule(
    "tip", "Pronouns in the Goethe A2 Exam", "Pronomen in der Prüfung (Goethe A2)",
    {
        "type": "verb_list",
        "groups": [
            {
                "category_en": "Schreiben Teil 1 (short message)",
                "category_de": "Schreiben Teil 1 (SMS / Mitteilung)",
                "verbs": [
                    {"de": "Kannst du mir bitte helfen?", "en": "Can you help me, please?", "function": "asking for help"},
                    {"de": "Ich rufe dich heute Abend an.", "en": "I'll call you this evening.", "function": "announcing a call"},
                    {"de": "Ich hole dich um acht ab.", "en": "I'll pick you up at eight.", "function": "arranging to meet"},
                ],
            },
            {
                "category_en": "Schreiben Teil 2 (formal email)",
                "category_de": "Schreiben Teil 2 (E-Mail, formell)",
                "verbs": [
                    {"de": "Ich danke Ihnen für die Einladung.", "en": "Thank you for the invitation.", "function": "thanking (dative)"},
                    {"de": "Der Termin passt mir leider nicht.", "en": "Unfortunately the appointment doesn't suit me.", "function": "turning something down"},
                ],
            },
            {
                "category_en": "Sprechen Teil 3 (planning together)",
                "category_de": "Sprechen Teil 3 (zusammen planen)",
                "verbs": [
                    {"de": "Passt es dir am Samstag?", "en": "Does Saturday suit you?", "function": "making a suggestion"},
                    {"de": "Ich komme gern mit euch.", "en": "I'm happy to come with you.", "function": "agreeing"},
                    {"de": "Kannst du sie auch fragen?", "en": "Can you ask her too?", "function": "asking a question"},
                ],
            },
        ],
        "description_en": "Eight sentences straight from the exam tasks. Learn them as chunks — each one carries an object pronoun.",
        "description_de": "Acht Sätze aus den Prüfungsteilen. Lerne sie als feste Chunks.",
    },
    6,
    key_insight_en="In Hören Teil 1 the pronoun often carries the answer: Ich hole dich ab means the speaker comes to you, not the other way round.",
    key_insight_de="In Hören Teil 1 ist das Pronomen wichtig. Frage dich: Wer holt wen ab?",
))

rules.append(rule(
    "common_mistakes", "Five Common Mistakes", "Fünf häufige Fehler",
    {
        "content_de": "Diese fünf Fehler kommen oft. Prüfe immer das Verb oder die Präposition.",
        "content_en": "These five mistakes come up again and again. Check the verb or the preposition first, then pick the pronoun.",
    },
    7,
    common_mistakes=[
        {"wrong": "Ich helfe dich.", "correct": "Ich helfe dir.",
         "explanation_de": "helfen steht immer mit Dativ: mir, dir, ihm, uns.",
         "explanation_en": "helfen always takes the dative: mir, dir, ihm, uns."},
        {"wrong": "Ich rufe dir an.", "correct": "Ich rufe dich an.",
         "explanation_de": "anrufen steht mit Akkusativ: mich, dich, ihn, sie.",
         "explanation_en": "anrufen takes the accusative: mich, dich, ihn, sie — unlike helfen, which takes the dative."},
        {"wrong": "Ich gebe ihm es.", "correct": "Ich gebe es ihm.",
         "explanation_de": "Zwei Pronomen: zuerst der Akkusativ, dann der Dativ.",
         "explanation_en": "With two pronouns the accusative comes first, then the dative."},
        {"wrong": "Das gefällt mich.", "correct": "Das gefällt mir.",
         "explanation_de": "gefallen steht mit Dativ. Die Sache ist das Subjekt.",
         "explanation_en": "gefallen takes the dative; the thing is the subject: Das gefällt mir."},
        {"wrong": "Ich komme mit du.", "correct": "Ich komme mit dir.",
         "explanation_de": "Nach mit steht der Dativ. Also: mit dir, mit ihm.",
         "explanation_en": "After mit you need the dative form: mit dir, mit ihm, mit uns."},
    ],
))

rules.append(rule(
    "summary", "Quick Reference", "Kurzübersicht",
    {
        "points": [
            "Akkusativ: mich, dich, ihn, sie, es, uns, euch, sie, Sie.",
            "Dativ: mir, dir, ihm, ihr, ihm, uns, euch, ihnen, Ihnen.",
            "Frage wen? für den Akkusativ. Frage wem? für den Dativ.",
            "anrufen, besuchen, fragen, kennen, abholen: Akkusativ.",
            "helfen, danken, gefallen, gehören, passen: Dativ.",
            "Zwei Nomen: Dativ vor Akkusativ. Ich gebe dem Kind das Buch.",
            "Pronomen stehen vorne: Ich gebe ihm das Buch.",
            "Zwei Pronomen: Akkusativ zuerst. Ich gebe es ihm.",
            "für, ohne, gegen + Akkusativ. mit, bei, von, zu + Dativ.",
            "uns und euch sind im Akkusativ und im Dativ gleich.",
        ]
    },
    99,
))


def ex(order_index, sentence_de, sentence_en, highlight, expl_en, expl_de, breakdown, difficulty, category):
    return {
        "sentence_de": sentence_de,
        "sentence_en": sentence_en,
        "grammar_highlight": highlight,
        "explanation_en": expl_en,
        "explanation_de": expl_de,
        "word_breakdown": breakdown,
        "difficulty": difficulty,
        "category": category,
        "order_index": order_index,
        "audio_url": None,
    }


examples = [
    ex(1, "Verstehst du mich?", "Do you understand me?", "mich",
       "verstehen takes an accusative object, so ich becomes mich.",
       "verstehen nimmt den Akkusativ. Aus ich wird mich.",
       {"Verstehst": "do (you) understand (verstehen, du-form)", "du": "you (subject)",
        "mich": "me (accusative of ich)"}, 1, "basic"),
    ex(2, "Kannst du mir bitte helfen?", "Can you help me, please?", "mir",
       "helfen takes the dative, so ich becomes mir. The modal verb sends helfen to the end.",
       "helfen nimmt den Dativ. Aus ich wird mir. Das Modalverb schickt helfen ans Ende.",
       {"Kannst": "can (können, du-form)", "du": "you (subject)", "mir": "me (dative of ich)",
        "bitte": "please", "helfen": "to help (infinitive at the end)"}, 1, "exam"),
    ex(3, "Ich danke Ihnen für die E-Mail.", "Thank you for the email.", "Ihnen",
       "danken takes the dative; Ihnen is the formal you. This is standard in Schreiben Teil 2.",
       "danken nimmt den Dativ. Ihnen ist die formelle Form. So schreibst du in Schreiben Teil 2.",
       {"Ich": "I (subject)", "danke": "thank (danken, ich-form)", "Ihnen": "you (formal, dative)",
        "für": "for (+ accusative)", "die": "the (feminine, accusative)", "E-Mail": "email"}, 2, "exam"),
    ex(4, "Ich rufe dich heute Abend an.", "I'll call you this evening.", "dich",
       "anrufen takes the accusative, so du becomes dich. The prefix an goes to the end.",
       "anrufen nimmt den Akkusativ. Aus du wird dich. Das Präfix an steht am Ende.",
       {"Ich": "I (subject)", "rufe": "call (anrufen, ich-form, verb part)", "dich": "you (accusative of du)",
        "heute": "today", "Abend": "evening", "an": "separable prefix of anrufen"}, 2, "everyday"),
    ex(5, "Ich frage ihn nach dem Weg.", "I'm asking him for directions.", "ihn",
       "fragen takes the accusative: er becomes ihn. nach keeps its dative (dem Weg).",
       "fragen nimmt den Akkusativ: aus er wird ihn. Die Präposition nach nimmt den Dativ: dem Weg.",
       {"Ich": "I (subject)", "frage": "ask (fragen, ich-form)", "ihn": "him (accusative of er)",
        "nach": "for / after (+ dative)", "dem": "the (masculine, dative)", "Weg": "way, directions"},
       2, "intermediate"),
    ex(6, "Die Wohnung gefällt ihr sehr.", "She likes the flat a lot.", "ihr",
       "With gefallen the thing is the subject and the person is dative: ihr = to her.",
       "Bei gefallen ist die Sache das Subjekt. Die Person steht im Dativ: ihr.",
       {"Die": "the (feminine, nominative)", "Wohnung": "flat, apartment",
        "gefällt": "pleases (gefallen, er/sie/es-form)", "ihr": "her (dative of sie)", "sehr": "very much"},
       2, "intermediate"),
    ex(7, "Ich gebe ihm den Schlüssel.", "I'm giving him the key.", "ihm den Schlüssel",
       "One pronoun and one noun: the pronoun (ihm, dative) comes first.",
       "Ein Pronomen und ein Nomen: Das Pronomen (ihm) steht vorne.",
       {"Ich": "I (subject)", "gebe": "give (geben, ich-form)", "ihm": "him (dative of er)",
        "den": "the (masculine, accusative)", "Schlüssel": "key"}, 2, "intermediate"),
    ex(8, "Ich gebe es ihm später.", "I'll give it to him later.", "es ihm",
       "Two pronouns: the accusative (es) comes before the dative (ihm).",
       "Zwei Pronomen: Der Akkusativ (es) steht vor dem Dativ (ihm).",
       {"Ich": "I (subject)", "gebe": "give (geben, ich-form)", "es": "it (accusative)",
        "ihm": "him (dative of er)", "später": "later"}, 3, "complex"),
    ex(9, "Das Geschenk ist für dich.", "The present is for you.", "für dich",
       "After für you always need the accusative: für dich, für mich, für ihn.",
       "Nach für steht immer der Akkusativ: für dich, für mich, für ihn.",
       {"Das": "the (neuter, nominative)", "Geschenk": "present, gift", "ist": "is (sein)",
        "für": "for (+ accusative)", "dich": "you (accusative of du)"}, 1, "basic"),
    ex(10, "Kommst du morgen mit uns?", "Are you coming with us tomorrow?", "mit uns",
       "After mit you need the dative. uns looks the same in both cases.",
       "Nach mit steht der Dativ. uns ist im Akkusativ und Dativ gleich.",
       {"Kommst": "are (you) coming (kommen, du-form)", "du": "you (subject)", "morgen": "tomorrow",
        "mit": "with (+ dative)", "uns": "us (dative of wir)"}, 2, "everyday"),
]


def exr(stage, order_index, etype, q_de, q_en, correct, acceptable, expl_en, expl_de,
        why_en, why_de, difficulty, options=None):
    return {
        "exercise_type": etype,
        "question_de": q_de,
        "question_en": q_en,
        "options": options,
        "correct_answer": correct,
        "acceptable_answers": acceptable,
        "explanation_en": expl_en,
        "explanation_de": expl_de,
        "hint": None,
        "why_correct_en": why_en,
        "why_correct_de": why_de,
        "difficulty": difficulty,
        "stage": stage,
        "order_index": order_index,
        "related_rule_title": None,
    }


exercises = []
A = exercises.append

# ---------------- stage 4: recognition + guided production ----------------
A(exr(4, 1, "fill_blank",
      "Ich kenne ___ nicht. (er, Akkusativ)",
      "Fill in the accusative pronoun for er: I don't know him. (verb: kennen)",
      "ihn", ["ihn"],
      "kennen takes the accusative, so er becomes ihn.",
      "kennen nimmt den Akkusativ. Aus er wird ihn.",
      "er → accusative → ihn: Ich kenne ihn nicht.",
      "er → Akkusativ → ihn: Ich kenne ihn nicht.", 1))

A(exr(4, 2, "fill_blank",
      "Wer hilft ___ heute? (ich, Dativ)",
      "Fill in the dative pronoun for ich: Who is helping me today? (verb: helfen)",
      "mir", ["mir"],
      "helfen is a dative verb, so ich becomes mir.",
      "helfen ist ein Dativ-Verb. Aus ich wird mir.",
      "helfen + Dativ → mir, not mich: Wer hilft mir heute?",
      "helfen + Dativ → mir, nicht mich: Wer hilft mir heute?", 1))

A(exr(4, 3, "fill_blank",
      "Ich rufe ___ später an. (du, Akkusativ)",
      "Fill in the accusative pronoun for du: I'll call you later. (verb: anrufen)",
      "dich", ["dich"],
      "anrufen takes the accusative, so du becomes dich.",
      "anrufen nimmt den Akkusativ. Aus du wird dich.",
      "anrufen + Akkusativ → dich, not dir: Ich rufe dich später an.",
      "anrufen + Akkusativ → dich, nicht dir: Ich rufe dich später an.", 1))

A(exr(4, 4, "fill_blank",
      "Der Film gefällt ___ sehr. (wir, Dativ)",
      "Fill in the dative pronoun for wir: We like the film a lot. (verb: gefallen)",
      "uns", ["uns"],
      "gefallen takes the dative; wir becomes uns.",
      "gefallen nimmt den Dativ. Aus wir wird uns.",
      "The film is the subject, the person is dative: Der Film gefällt uns.",
      "Der Film ist das Subjekt. Die Person steht im Dativ: uns.", 2))

A(exr(4, 5, "fill_blank",
      "Ich danke ___ für die Blumen. (Sie, formell, Dativ)",
      "Fill in the formal dative pronoun: I thank you for the flowers. (verb: danken)",
      "Ihnen", ["Ihnen"],
      "danken takes the dative; the formal Sie becomes Ihnen with a capital I.",
      "danken nimmt den Dativ. Aus Sie wird Ihnen, immer mit großem I.",
      "Formal Sie → dative Ihnen: Ich danke Ihnen für die Blumen.",
      "Formelles Sie → Dativ Ihnen: Ich danke Ihnen für die Blumen.", 2))

A(exr(4, 6, "fill_blank",
      "Wir besuchen ___ am Samstag. (ihr, Akkusativ)",
      "Fill in the accusative pronoun for ihr (you, plural): We're visiting you on Saturday. (verb: besuchen)",
      "euch", ["euch"],
      "besuchen takes the accusative; ihr becomes euch.",
      "besuchen nimmt den Akkusativ. Aus ihr wird euch.",
      "ihr → accusative → euch (the same form as the dative).",
      "ihr → Akkusativ → euch. Im Dativ ist die Form gleich.", 2))

A(exr(4, 7, "multiple_choice",
      "Der Kuchen schmeckt ___ gut. (ich)",
      "Which pronoun fits? schmecken takes the dative, and the person is ich.",
      "mir", ["mir"],
      "schmecken is a dative verb, like gefallen.",
      "schmecken ist ein Dativ-Verb, genau wie gefallen.",
      "schmecken + dative → mir. mich and ihn are accusative forms; dir is dative but the wrong person.",
      "schmecken + Dativ → mir. mich und ihn sind Akkusativ. dir ist nicht ich.", 2,
      options=["mich", "mir", "ihn", "dir"]))

A(exr(4, 8, "multiple_choice",
      "Ich rufe ___ heute Abend an. (die Kollegin)",
      "Which pronoun fits? anrufen takes the accusative, and the person is die Kollegin (one woman).",
      "sie", ["sie"],
      "die Kollegin is sie (she); anrufen takes the accusative, and the accusative of sie is also sie.",
      "anrufen nimmt den Akkusativ. Die Kollegin ist sie. Der Akkusativ ist auch sie.",
      "ihr and ihnen are dative forms and ihn is the accusative of er (a man) — die Kollegin is a woman, so only sie fits.",
      "ihr und ihnen sind Dativ-Formen. ihn ist der Akkusativ von er. Richtig ist sie.", 2,
      options=["ihr", "ihn", "ihnen", "sie"]))

A(exr(4, 9, "error_correction",
      "Korrigiere: Ich helfe dich.",
      "Correct the sentence: helfen takes the dative. Write the whole sentence.",
      "Ich helfe dir.", ["Ich helfe dir.", "Ich helfe dir", "ich helfe dir."],
      "helfen never takes the accusative, so dich must become dir.",
      "helfen nimmt nie den Akkusativ. Aus dich wird dir.",
      "helfen + dative → dir: Ich helfe dir.",
      "helfen + Dativ → dir: Ich helfe dir.", 2))

A(exr(4, 10, "error_correction",
      "Korrigiere: Das gefällt mich.",
      "Correct the sentence: gefallen takes the dative. Write the whole sentence.",
      "Das gefällt mir.", ["Das gefällt mir.", "Das gefällt mir", "das gefällt mir."],
      "With gefallen the thing is the subject and the person stands in the dative.",
      "Bei gefallen ist die Sache das Subjekt. Die Person steht im Dativ.",
      "gefallen + dative → mir: Das gefällt mir.",
      "gefallen + Dativ → mir: Das gefällt mir.", 2))

A(exr(4, 11, "fill_blank",
      "Der Kaffee ist für ___. (du)",
      "Fill in the pronoun after für: The coffee is for you. (für + accusative)",
      "dich", ["dich"],
      "für always takes the accusative, so du becomes dich.",
      "für nimmt immer den Akkusativ. Aus du wird dich.",
      "für + accusative → für dich, never für dir.",
      "für + Akkusativ → für dich, nie für dir.", 1))

A(exr(4, 12, "fill_blank",
      "Ich fahre mit ___ zum Bahnhof. (er)",
      "Fill in the pronoun after mit: I'm going to the station with him. (mit + dative)",
      "ihm", ["ihm"],
      "mit always takes the dative, so er becomes ihm.",
      "mit nimmt immer den Dativ. Aus er wird ihm.",
      "mit + dative → mit ihm, never mit ihn.",
      "mit + Dativ → mit ihm, nie mit ihn.", 2))

A(exr(4, 13, "multiple_choice",
      "Zwei Pronomen: Welcher Satz ist richtig?",
      "Two pronouns (es = das Buch, ihm = der Kollege). Which word order is correct?",
      "Ich gebe es ihm.", ["Ich gebe es ihm."],
      "With two pronouns the accusative comes before the dative.",
      "Bei zwei Pronomen steht der Akkusativ vor dem Dativ.",
      "Accusative pronoun (es) first, dative pronoun (ihm) second: Ich gebe es ihm.",
      "Erst das Akkusativ-Pronomen (es), dann das Dativ-Pronomen (ihm).", 3,
      options=["Ich gebe ihm es.", "Ich gebe es ihn.", "Ich gebe es ihm.", "Ich gebe ihm ihn."]))

# ---------------- stage 5: free production ----------------
A(exr(5, 1, "sentence_building",
      "[ich / anrufen / dich / morgen] → Schreib den Satz.",
      "Write the sentence: I'll call you tomorrow. (verb: anrufen, accusative; the time phrase may open the sentence)",
      "Ich rufe dich morgen an.",
      ["Ich rufe dich morgen an.", "Ich rufe dich morgen an", "Morgen rufe ich dich an.",
       "Morgen rufe ich dich an"],
      "anrufen is separable: rufe in position 2, an at the end, dich right after the verb.",
      "anrufen ist trennbar: rufe auf Position 2, an am Ende. dich steht nach dem Verb.",
      "anrufen + accusative → dich; the prefix an closes the bracket at the end.",
      "anrufen + Akkusativ → dich. Das Präfix an steht am Ende.", 2))

A(exr(5, 2, "sentence_building",
      "[können / ihr / uns / helfen] → Schreib die Frage.",
      "Write the question: Can you (plural) help us? (verb: helfen, dative, start with Könnt)",
      "Könnt ihr uns helfen?", ["Könnt ihr uns helfen?", "Könnt ihr uns helfen"],
      "In a yes/no question the modal verb comes first and helfen goes to the end.",
      "In der Ja/Nein-Frage steht das Modalverb vorne. helfen steht am Ende.",
      "helfen + dative → uns; können opens the bracket, helfen closes it.",
      "helfen + Dativ → uns. können öffnet die Klammer, helfen schließt sie.", 2))

A(exr(5, 3, "sentence_building",
      "[ich / bringen / es / euch] → Schreib den Satz.",
      "Write the sentence: I'm bringing it to you (plural). (two pronouns, start with Ich)",
      "Ich bringe es euch.", ["Ich bringe es euch.", "Ich bringe es euch"],
      "Two pronouns: accusative (es) before dative (euch).",
      "Zwei Pronomen: Akkusativ (es) vor Dativ (euch).",
      "Ich bringe euch es. is wrong — with two pronouns the accusative comes first.",
      "Ich bringe euch es. ist falsch. Bei zwei Pronomen kommt der Akkusativ zuerst.", 3))

A(exr(5, 4, "sentence_building",
      "[wir / danken / Ihnen / für die Hilfe] → Schreib den Satz.",
      "Write the sentence: We thank you for the help. (formal, verb: danken, start with Wir)",
      "Wir danken Ihnen für die Hilfe.",
      ["Wir danken Ihnen für die Hilfe.", "Wir danken Ihnen für die Hilfe"],
      "danken takes the dative; the formal you is Ihnen with a capital I.",
      "danken nimmt den Dativ. Die formelle Form ist Ihnen mit großem I.",
      "danken + dative → Ihnen; für keeps its accusative (die Hilfe).",
      "danken + Dativ → Ihnen. Nach für steht der Akkusativ: die Hilfe.", 2))

A(exr(5, 5, "sentence_building",
      "[das Buch / gehören / ihr] → Schreib den Satz.",
      "Write the sentence: The book belongs to her. (verb: gehören, dative, start with Das)",
      "Das Buch gehört ihr.", ["Das Buch gehört ihr.", "Das Buch gehört ihr"],
      "gehören is a dative verb; the dative of sie (she) is ihr.",
      "gehören ist ein Dativ-Verb. Der Dativ von sie ist ihr.",
      "The book is the subject, the person is dative: Das Buch gehört ihr.",
      "Das Buch ist das Subjekt. Die Person steht im Dativ: ihr.", 2))

A(exr(5, 6, "sentence_building",
      "[ich / besuchen / euch / am Sonntag] → Schreib den Satz.",
      "Write the sentence: I'm visiting you (plural) on Sunday. (verb: besuchen, accusative)",
      "Ich besuche euch am Sonntag.",
      ["Ich besuche euch am Sonntag.", "Ich besuche euch am Sonntag",
       "Am Sonntag besuche ich euch.", "Am Sonntag besuche ich euch"],
      "besuchen takes the accusative; the accusative of ihr is euch.",
      "besuchen nimmt den Akkusativ. Der Akkusativ von ihr ist euch.",
      "The time phrase may also stand in position 1: Am Sonntag besuche ich euch.",
      "Die Zeitangabe kann auch vorne stehen. Beispiel: Am Sonntag besuche ich euch.", 2))

A(exr(5, 7, "sentence_building",
      "[er / geben / mir / den Schlüssel] → Schreib den Satz.",
      "Write the sentence: He gives me the key. (pronoun + noun object, start with Er)",
      "Er gibt mir den Schlüssel.", ["Er gibt mir den Schlüssel.", "Er gibt mir den Schlüssel"],
      "One pronoun and one noun: the pronoun comes first. geben has a vowel change: er gibt.",
      "Ein Pronomen und ein Nomen: Das Pronomen steht vorne. geben hat e→i: er gibt.",
      "mir (pronoun) before den Schlüssel (noun): Er gibt mir den Schlüssel.",
      "mir (Pronomen) steht vor den Schlüssel (Nomen).", 3))

A(exr(5, 8, "sentence_building",
      "[ich / kommen / mit / sie (eine Frau)] → Schreib den Satz.",
      "Write the sentence: I'm coming with her. (mit + dative, start with Ich)",
      "Ich komme mit ihr.", ["Ich komme mit ihr.", "Ich komme mit ihr"],
      "mit always takes the dative, so sie (she) becomes ihr.",
      "mit nimmt immer den Dativ. Aus sie wird ihr.",
      "mit + dative → mit ihr, never mit sie.",
      "mit + Dativ → mit ihr, nie mit sie.", 2))

A(exr(5, 9, "error_correction",
      "Korrigiere: Ich rufe dir an.",
      "Correct the sentence: anrufen takes the accusative. Write the whole sentence.",
      "Ich rufe dich an.", ["Ich rufe dich an.", "Ich rufe dich an", "ich rufe dich an."],
      "anrufen takes an accusative object, so dir must become dich.",
      "anrufen nimmt den Akkusativ. Aus dir wird dich.",
      "anrufen + accusative → dich: Ich rufe dich an.",
      "anrufen + Akkusativ → dich: Ich rufe dich an.", 2))

A(exr(5, 10, "error_correction",
      "Korrigiere: Ich schicke ihm es.",
      "Correct the word order: two pronouns, accusative first. Write the whole sentence.",
      "Ich schicke es ihm.", ["Ich schicke es ihm.", "Ich schicke es ihm", "ich schicke es ihm."],
      "With two pronouns the accusative pronoun comes before the dative pronoun.",
      "Bei zwei Pronomen steht das Akkusativ-Pronomen vor dem Dativ-Pronomen.",
      "es (accusative) before ihm (dative): Ich schicke es ihm.",
      "es (Akkusativ) steht vor ihm (Dativ): Ich schicke es ihm.", 3))

A(exr(5, 11, "sentence_building",
      "[ich / zeigen / es / dem Chef] → Schreib den Satz.",
      "Write the sentence: I'll show it to the boss. (pronoun + noun object, start with Ich)",
      "Ich zeige es dem Chef.", ["Ich zeige es dem Chef.", "Ich zeige es dem Chef"],
      "A pronoun stands before a noun object, whatever its case: es (accusative) before dem Chef (dative).",
      "Ein Pronomen steht vor einem Nomen, egal in welchem Fall.",
      "Ich zeige dem Chef es. is wrong: the pronoun es has to move in front of the noun.",
      "Ich zeige dem Chef es. ist falsch. Das Pronomen es steht vorne.", 3))

A(exr(5, 12, "sentence_building",
      "[die Blumen / sein / von / ich] → Schreib den Satz.",
      "Write the sentence: The flowers are from me. (von + dative, start with Die)",
      "Die Blumen sind von mir.", ["Die Blumen sind von mir.", "Die Blumen sind von mir"],
      "von always takes the dative, so ich becomes mir.",
      "von nimmt immer den Dativ. Aus ich wird mir.",
      "von + dative → von mir, never von mich.",
      "von + Dativ → von mir, nie von mich.", 2))

A(exr(5, 13, "sentence_building",
      "[ich / helfen / ihnen / gern] → Schreib den Satz.",
      "Write the sentence: I'm happy to help them. (verb: helfen, dative plural, start with Ich)",
      "Ich helfe ihnen gern.", ["Ich helfe ihnen gern.", "Ich helfe ihnen gern",
       "Ich helfe ihnen gerne.", "Ich helfe ihnen gerne"],
      "helfen takes the dative; the dative of the plural sie is ihnen (small i).",
      "helfen nimmt den Dativ. Der Dativ von sie (Plural) ist ihnen, klein geschrieben.",
      "ihnen = them (dative plural); Ihnen with a capital I would be the formal you.",
      "ihnen ist der Dativ Plural. Ihnen mit großem I ist die formelle Form.", 3))

doc = {"topic": topic, "rules": rules, "examples": examples, "exercises": exercises}

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "grammar", "pronouns-accusative-dative.json")
with io.open(out, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=1)
    f.write("\n")
print("wrote", out)
