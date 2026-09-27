# Source of truth for the 50-post pack. Edit here, then: python3 content.py
# (writes posts.json), node render.mjs, node captions.mjs.
# Exam facts are quoted from astro-site/src/data/guides/*.js (factsCheckedOn
# 2026-08-22). Captions: du-Form, no outcome promises, no fee figures.
import json, datetime
from zoneinfo import ZoneInfo

CTA = {  # link_path prefix -> (image footer, caption CTA)
  '/analyze/': ('Satz testen → Link in Bio', 'Deinen eigenen Satz gratis durchleuchten'),
  '/grammar/': ('Regel → Link in Bio', 'Die ganze Regel mit Übungen, kostenlos'),
  '/leitfaden/': ('Leitfaden → Link in Bio', 'Der ganze Leitfaden'),
  '/speaking/': ('Sprechen üben → Link in Bio', 'Sprechen üben ohne Partner'),
  '/level-test/': ('Einstufungstest → Link in Bio', 'Wo stehst du wirklich? Gratis-Einstufungstest'),
}
SERIES = {  # series -> (accent, hashtags)
  'Satz des Tages': ('limette', '#deutschlernen #deutschgrammatik #learngerman #deutschalsfremdsprache #daf'),
  'Fehler-Check':   ('aprikose', '#deutschlernen #deutschfehler #learngerman #deutschgrammatik #daf'),
  'Redemittel':     ('himbeer', '#deutschlernen #redemittel #deutschprüfung #learngerman #daf'),
  'Wortschatz':     ('limette', '#deutschlernen #wortschatz #deutschvokabeln #learngerman #daf'),
  'Prüfungs-Fakt':  ('aprikose', '#deutschprüfung #telc #goethezertifikat #deutschlernen #learngerman'),
  'Lerntipp':       ('himbeer', '#deutschlernen #lerntipps #deutschprüfung #learngerman #daf'),
}

def P(series, level, layout, headline, link, caption, note, **kw):
  return dict(series=series, level=level, layout=layout, headline=headline, link_path=link,
              caption=caption, note=note, **kw)

def ok(t): return {'ok': True, 'text': t}
def no(t): return {'ok': False, 'text': t}

# The three approved samples keep their exact content (ids 001-003).
samples = json.load(open('samples.json'))

pool = {k: [] for k in SERIES}
S = pool['Satz des Tages'].append
S(P('Satz des Tages', 'A2', 'kasus', 'Ich danke [[DAT:dir]].', '/grammar/a2.1/dative-case/',
  '„Ich danke dich“ hört man oft. Richtig ist: Ich danke dir.\n\ndanken will Dativ, genau wie helfen, antworten und gratulieren. Frag dich: Wem danke ich? → Dativ.\n\nWem möchtest du heute danken? Schreib es auf Deutsch in die Kommentare 👇',
  'danken will Dativ. Wie helfen, antworten, gratulieren.', rows=[ok('Ich danke dir.'), no('Ich danke dich.')]))
S(P('Satz des Tages', 'A2', 'kasus', '[[NOM:Das Kleid]] gefällt [[DAT:mir]].', '/grammar/a2.1/dative-case/',
  'Bei „gefallen“ denken viele falsch herum.\n\nDas Ding, das gefällt, ist das Subjekt (Nominativ). Die Person, der es gefällt, steht im Dativ: Das Kleid gefällt mir. Die Schuhe gefallen mir.\n\nWas gefällt dir an Deutschland? Ein Satz reicht 👇',
  'Das Ding ist das Subjekt. Die Person steht im Dativ.', rows=[ok('Das Kleid gefällt mir.'), no('Ich gefalle das Kleid.')]))
S(P('Satz des Tages', 'A1 · A2', 'kasus', 'Ich fahre [[DAT:mit dem]] Bus.', '/grammar/a2.1/prepositions-dative/',
  'mit + Dativ. Immer. Ohne Ausnahme.\n\nmit dem Bus, mit der Bahn, mit dem Fahrrad, mit den Kindern.\n\nDie Dativ-Präpositionen im Paket: aus, bei, mit, nach, seit, von, zu. Einmal auswendig, dann nie wieder raten.\n\nWie kommst du zur Arbeit? Antworte mit „mit“ 👇',
  'mit will immer Dativ: mit dem Bus, mit der Bahn, mit dem Auto.', rows=[ok('Ich fahre mit dem Bus.'), no('Ich fahre mit den Bus.')]))
S(P('Satz des Tages', 'A1 · A2', 'kasus', 'Das ist [[AKK:für meinen]] Bruder.', '/grammar/a1.2/prepositions-accusative/',
  'für + Akkusativ. Immer.\n\nfür meinen Bruder, für meine Mutter, für mein Kind.\n\nDie Akkusativ-Präpositionen: durch, für, gegen, ohne, um. Fünf Wörter, eine Regel.\n\nFür wen lernst du Deutsch? 👇',
  'für will immer Akkusativ. Dazu: durch, gegen, ohne, um.', rows=[ok('für meinen Bruder'), no('für meinem Bruder')]))
S(P('Satz des Tages', 'A2 · B1', 'kasus', 'Wohin? Oder wo?', '/grammar/a2.1/two-way-prepositions/',
  'Die Wechselpräpositionen (in, an, auf, über, unter, vor, hinter, neben, zwischen) nehmen mal Akkusativ, mal Dativ.\n\nWohin? Bewegung zum Ziel → Akkusativ: Ich lege das Buch auf den Tisch.\nWo? Position → Dativ: Das Buch liegt auf dem Tisch.\n\nSpeicher dir den Post 📌',
  'Bewegung zum Ziel → Akkusativ. Position → Dativ.', rows=[ok('Wohin? Auf [[AKK:den Tisch]].'), ok('Wo? Auf [[DAT:dem Tisch]].')]))
S(P('Satz des Tages', 'B1', 'kasus', '[[GEN:Wegen des]] Regens bleiben wir zu Hause.', '/grammar/b1.1/genitive-prepositions/',
  '„Wegen dem Regen“ hörst du jeden Tag. Im Alltag ist das okay.\n\nIn der Prüfung schreibst du Genitiv: wegen des Regens, trotz des Staus, während der Pause.\n\nDas ist der kleine Unterschied, den Prüfer sehen.',
  'Im Alltag hörst du „wegen dem“. In der Prüfung schreib Genitiv.', rows=[ok('Wegen des Regens …'), no('Wegen dem Regen … (nur Alltag)')]))
S(P('Satz des Tages', 'A2 · B1', 'kasus', 'Ich gebe [[DAT:dem Kind]] [[AKK:den Ball]].', '/grammar/a2.1/pronouns-accusative-dative/',
  'Zwei Objekte in einem Satz? Es gibt eine einfache Reihenfolge.\n\nZwei Nomen: Dativ vor Akkusativ → Ich gebe dem Kind den Ball.\nAkkusativ ist ein Pronomen: Akkusativ zuerst → Ich gebe ihn dem Kind.\n\nWelche Variante war dir neu? 👇',
  'Zwei Nomen: Dativ vor Akkusativ. Ist der Akkusativ ein Pronomen, kommt er zuerst.', rows=[ok('Ich gebe ihm den Ball.'), ok('Ich gebe ihn dem Kind.')]))
S(P('Satz des Tages', 'A2 · B1', 'kasus', 'Ich warte [[AKK:auf den]] Bus.', '/grammar/a2.2/verbs-with-prepositions-intro/',
  '„Ich warte für den Bus“ ist ein direkt übersetzter Fehler.\n\nwarten auf + Akkusativ. Verben mit Präposition lernst du am besten als Paket: warten auf, denken an, sich interessieren für.\n\nWorauf wartest du gerade? 👇',
  'warten auf + Akkusativ. Verb und Präposition als Paket lernen.', rows=[ok('Ich warte auf den Bus.'), no('Ich warte für den Bus.')]))
S(P('Satz des Tages', 'B1', 'kasus', 'Ich freue mich [[AKK:auf das]] Wochenende.', '/grammar/b1.2/verbs-with-prepositions/',
  'sich freuen auf oder sich freuen über? Beides ist richtig, aber es bedeutet etwas anderes.\n\nauf = es kommt noch: Ich freue mich auf das Wochenende.\nüber = es ist schon da: Ich freue mich über das Geschenk.\n\nWorauf freust du dich diese Woche? 👇',
  'auf = es kommt noch. über = es ist schon da.', rows=[ok('auf das Wochenende (kommt noch)'), ok('über das Geschenk (ist schon da)')]))

F = pool['Fehler-Check'].append
F(P('Fehler-Check', 'A2 · B1', 'kasus', 'Nach „weil“ geht das Verb ans Ende.', '/grammar/a2.2/subordinate-word-order/',
  'Einer der häufigsten Fehler, auch bei B1.\n\nweil, dass, wenn, ob leiten einen Nebensatz ein. Das konjugierte Verb geht ans Ende.\n\n✓ …, weil ich keine Zeit habe.\n✗ …, weil ich habe keine Zeit.\n\nSchreib einen weil-Satz über deinen Tag 👇',
  'weil, dass, wenn, ob: Nebensatz. Verb ans Ende.', rows=[ok('…, weil ich keine Zeit habe.'), no('…, weil ich habe keine Zeit.')]))
F(P('Fehler-Check', 'A2 · B1', 'kasus', '„denn“ oder „weil“?', '/grammar/a2.2/coordinating-conjunctions/',
  'Gleiche Bedeutung, andere Wortstellung.\n\ndenn → normale Wortstellung: …, denn ich habe keine Zeit.\nweil → Verb am Ende: …, weil ich keine Zeit habe.\n\nBeides ist richtig. Nur mischen darfst du nicht.',
  'Gleiche Bedeutung. denn: normale Wortstellung. weil: Verb am Ende.', rows=[ok('…, denn ich habe keine Zeit.'), ok('…, weil ich keine Zeit habe.')]))
F(P('Fehler-Check', 'A2', 'kasus', 'Seit drei Jahren lebe ich hier.', '/grammar/a2.1/temporal-prepositions/',
  'Du wohnst immer noch in Berlin? Dann Präsens.\n\n✓ Ich lebe seit drei Jahren in Berlin.\n✗ Ich habe seit drei Jahren in Berlin gelebt.\n\nWas noch andauert, steht mit „seit“ im Präsens. Viele Sprachen machen das anders, deshalb passiert der Fehler so oft.\n\nSeit wann lernst du Deutsch? 👇',
  'Was heute noch andauert, steht mit „seit“ im Präsens.', rows=[ok('Ich lebe seit drei Jahren hier.'), no('Ich habe seit drei Jahren hier gelebt.')]))
F(P('Fehler-Check', 'B1', 'kasus', '„Als ich klein war …“, nicht „wenn“.', '/grammar/b1.1/temporal-clauses/',
  'als oder wenn? Die Regel passt in zwei Zeilen:\n\nEinmal in der Vergangenheit → als: Als ich klein war, …\nImmer wieder oder in der Zukunft → wenn: Wenn ich Zeit habe, …\n\nErzähl in einem Satz: Als ich nach Deutschland kam, … 👇',
  'Einmal in der Vergangenheit → als. Immer wieder oder Zukunft → wenn.', rows=[ok('Als ich klein war, …'), no('Wenn ich klein war, …')]))
F(P('Fehler-Check', 'A1', 'kasus', 'Ich bin 30 Jahre alt.', '/grammar/a1.1/verb-sein/',
  'Im Deutschen „hast“ du kein Alter. Du „bist“ es.\n\n✓ Ich bin 30 Jahre alt.\n✗ Ich habe 30 Jahre.\n\nKlein, aber es fällt sofort auf, auch in der Vorstellungsrunde der mündlichen Prüfung.',
  'Alter immer mit sein: Ich bin … Jahre alt.', rows=[ok('Ich bin 30 Jahre alt.'), no('Ich habe 30 Jahre.')]))
F(P('Fehler-Check', 'A1', 'kasus', 'Ich habe Hunger.', '/grammar/a1.1/verb-haben/',
  'Hunger, Durst, Angst, Zeit: Die „hast“ du im Deutschen.\n\n✓ Ich habe Hunger.\n✗ Ich bin Hunger.\n\nMit Adjektiv geht auch sein: Ich bin hungrig. Aber Nomen → haben.\n\nWas hast du gerade: Hunger, Durst oder keine Zeit? 😄',
  'Hunger, Durst, Angst, Zeit: mit haben.', rows=[ok('Ich habe Hunger.'), no('Ich bin Hunger.')]))
F(P('Fehler-Check', 'A1 · A2', 'kasus', 'Das Verb steht auf Platz 2.', '/grammar/a1.2/basic-sentence-structure/',
  'Im Hauptsatz steht das Verb auf Position 2, auch wenn vorne kein Subjekt steht.\n\n✓ Morgen fahre ich nach Hamburg.\n✗ Morgen ich fahre nach Hamburg.\n\nDiese Regel macht deine Sätze sofort deutscher.\n\nFang einen Satz mit „Heute“ an 👇',
  'Auch wenn vorne kein Subjekt steht: Verb auf Platz 2.', rows=[ok('Morgen fahre ich nach Hamburg.'), no('Morgen ich fahre nach Hamburg.')]))
F(P('Fehler-Check', 'A1 · A2', 'kasus', 'Ich rufe dich morgen an.', '/grammar/a1.1/separable-verbs-intro/',
  'anrufen, aufstehen, einkaufen: trennbare Verben.\n\nIm Hauptsatz geht die Vorsilbe ans Ende:\n✓ Ich rufe dich morgen an.\n✗ Ich anrufe dich morgen.\n\nWann stehst du morgen auf? Antworte mit einem ganzen Satz 👇',
  'Trennbare Verben: Die Vorsilbe geht ans Satzende.', rows=[ok('Ich rufe dich morgen an.'), no('Ich anrufe dich morgen.')]))
F(P('Fehler-Check', 'A2', 'kasus', 'Ich bin nach Hause gegangen.', '/grammar/a2.1/perfect-tense-sein/',
  'Perfekt mit haben oder sein?\n\nBewegung von A nach B oder eine Veränderung des Zustands → sein.\n✓ Ich bin nach Hause gegangen.\n✗ Ich habe nach Hause gegangen.\n\nAuch: Ich bin eingeschlafen. Ich bin gewachsen.\n\nWas hast du gestern gemacht? Ein Satz im Perfekt 👇',
  'Bewegung von A nach B oder Zustandswechsel → Perfekt mit sein.', rows=[ok('Ich bin nach Hause gegangen.'), no('Ich habe nach Hause gegangen.')]))
F(P('Fehler-Check', 'A2', 'kasus', '„kennen“ oder „wissen“?', '/level-test/',
  'Beide heißen im Englischen „to know“. Im Deutschen nicht.\n\nkennen + Person, Ort, Ding: Ich kenne den Weg.\nwissen + Information: Ich weiß, wo er wohnt.\n\n✗ Ich weiß ihn. Das geht nicht.',
  'kennen: Person, Ort, Ding. wissen: Information (dass, wo, wie …).', rows=[ok('Ich kenne den Weg.'), ok('Ich weiß, wo er wohnt.'), no('Ich weiß ihn.')]))

R = pool['Redemittel'].append
R(P('Redemittel', 'B1 · Sprechen', 'list', 'Deine Meinung sagen', '/speaking/',
  'In der mündlichen Prüfung wirst du nach deiner Meinung gefragt. Drei Einstiege, die immer passen:\n\n1. Ich bin der Meinung, dass …\n2. Meiner Meinung nach ist …\n3. Ich finde es wichtig, dass …\n\nAchtung bei Nr. 2: Nach „Meiner Meinung nach“ kommt sofort das Verb.',
  'Nach „Meiner Meinung nach“ kommt sofort das Verb.', items=['Ich bin der Meinung, dass …', 'Meiner Meinung nach ist …', 'Ich finde es wichtig, dass …']))
R(P('Redemittel', 'B1 · Sprechen', 'list', 'Zustimmen und widersprechen', '/speaking/',
  'Ein Gespräch lebt davon, dass du auf deinen Partner eingehst. Genau das wird in der mündlichen Prüfung bewertet.\n\n1. Da hast du recht.\n2. Das sehe ich auch so.\n3. Das sehe ich anders, weil …\n4. Ja, aber …\n\nWelchen Satz benutzt du am meisten? 👇',
  'Auf den Partner eingehen ist Teil der Bewertung.', items=['Da hast du recht.', 'Das sehe ich auch so.', 'Das sehe ich anders, weil …', 'Ja, aber …']))
R(P('Redemittel', 'telc B1 · Teil 3', 'list', 'Gemeinsam etwas planen', '/leitfaden/telc-b1/',
  'Im dritten Teil der mündlichen telc-B1-Prüfung plant ihr zusammen etwas, zum Beispiel ein Fest oder einen Ausflug. Es geht darum, das Gespräch am Laufen zu halten.\n\n1. Wollen wir …?\n2. Was hältst du davon, wenn …?\n3. Gute Idee! Wer kümmert sich um …?\n4. Dann machen wir es so.\n\nSpeichern für die Prüfungsvorbereitung 📌',
  'Nicht perfekt, sondern im Gespräch bleiben.', items=['Wollen wir …?', 'Was hältst du davon, wenn …?', 'Gute Idee! Wer kümmert sich um …?', 'Dann machen wir es so.']))
R(P('Redemittel', 'B1 · Brief', 'list', 'Einen Termin absagen', '/leitfaden/brief-schreiben-b1/',
  'Absagen ist eine typische Schreibaufgabe. Drei Sätze tragen den ganzen Brief:\n\n1. Leider kann ich am … nicht kommen, weil …\n2. Könnten wir einen neuen Termin vereinbaren?\n3. Ich bitte um Ihr Verständnis.\n\nGrund, neuer Vorschlag, höflicher Schluss. Fertig.',
  'Grund, neuer Vorschlag, höflicher Schluss.', items=['Leider kann ich am … nicht kommen, weil …', 'Könnten wir einen neuen Termin vereinbaren?', 'Ich bitte um Ihr Verständnis.']))
R(P('Redemittel', 'B1 · Brief', 'list', 'Der formelle Brief: Anfang und Schluss', '/leitfaden/brief-schreiben-b1/',
  'Halbformell an Vermieter, Amt, Kundenservice oder Kursleitung? Dann Sie-Form und diese Rahmen-Sätze:\n\n1. Sehr geehrte Damen und Herren,\n2. Ich wende mich an Sie, weil …\n3. Über eine baldige Antwort würde ich mich freuen.\n4. Mit freundlichen Grüßen\n\nAnrede und Gruß müssen zusammenpassen.',
  'Sie-Form. Anrede und Gruß müssen zusammenpassen.', items=['Sehr geehrte Damen und Herren,', 'Ich wende mich an Sie, weil …', 'Über eine baldige Antwort würde ich mich freuen.', 'Mit freundlichen Grüßen']))
R(P('Redemittel', 'A2 · B1 · Brief', 'list', 'Der private Brief', '/leitfaden/brief-schreiben-b1/',
  'An Freunde schreibst du in der du-Form, locker, aber vollständig.\n\n1. Liebe Anna, / Lieber Tom,\n2. Danke für deine Nachricht!\n3. Ich freue mich schon auf …\n4. Viele Grüße\n\nUnd trotzdem gilt: alle Leitpunkte der Aufgabe beantworten.',
  'du-Form, locker, aber alle Leitpunkte beantworten.', items=['Liebe Anna, / Lieber Tom,', 'Danke für deine Nachricht!', 'Ich freue mich schon auf …', 'Viele Grüße']))
R(P('Redemittel', 'A2 · B1 · Alltag', 'list', 'Beim Arzt', '/speaking/',
  'Sätze, die du im echten Leben brauchst, nicht nur in der Prüfung:\n\n1. Ich habe seit … Schmerzen.\n2. Mir ist schwindelig.\n3. Können Sie mich krankschreiben?\n4. Wie oft muss ich die Tabletten nehmen?\n\nWelchen Satz hättest du schon mal gebraucht? 👇',
  'Speichern für den nächsten Termin.', items=['Ich habe seit … Schmerzen.', 'Mir ist schwindelig.', 'Können Sie mich krankschreiben?', 'Wie oft muss ich die Tabletten nehmen?']))
R(P('Redemittel', 'A2 · B1 · Sprechen', 'list', 'Wenn du etwas nicht verstehst', '/speaking/',
  'Nachfragen ist Kommunikation, kein Fehler. Besser nachfragen als raten.\n\n1. Können Sie das bitte wiederholen?\n2. Was meinen Sie mit …?\n3. Habe ich Sie richtig verstanden: …?\n4. Könnten Sie bitte langsamer sprechen?',
  'Nachfragen ist Kommunikation. Besser als raten.', items=['Können Sie das bitte wiederholen?', 'Was meinen Sie mit …?', 'Habe ich Sie richtig verstanden: …?', 'Könnten Sie bitte langsamer sprechen?']))

W = pool['Wortschatz'].append
W(P('Wortschatz', 'A2 · B1 · Amt', 'list', '5 Wörter für das Amt', '/grammar/a1.1/nouns-gender/',
  'Behördendeutsch, das du wirklich brauchst. Immer mit Artikel und Plural lernen:\n\nder Antrag · die Anträge\ndas Formular · die Formulare\ndie Unterschrift · die Unterschriften\nder Termin · die Termine\ndie Bescheinigung · die Bescheinigungen\n\nWelches Wort fehlt auf der Liste? 👇',
  'Nomen immer mit Artikel und Plural lernen.', items=['der Antrag · die Anträge', 'das Formular · die Formulare', 'die Unterschrift · die Unterschriften', 'der Termin · die Termine', 'die Bescheinigung · die Bescheinigungen']))
W(P('Wortschatz', 'A2 · B1 · Wohnen', 'list', '5 Wörter rund um die Wohnung', '/grammar/a1.1/nouns-gender/',
  'Wohnungssuche auf Deutsch? Diese Wörter stehen in jeder Anzeige und jedem Vertrag:\n\ndie Miete · die Mieten\nder Vermieter · die Vermieter\ndie Nebenkosten (nur Plural)\ndie Kaution · die Kautionen\nder Mietvertrag · die Mietverträge\n\nSpeichern für die nächste Besichtigung 📌',
  'Diese Wörter stehen in jeder Anzeige.', items=['die Miete · die Mieten', 'der Vermieter · die Vermieter', 'die Nebenkosten (nur Plural)', 'die Kaution · die Kautionen', 'der Mietvertrag · die Mietverträge']))
W(P('Wortschatz', 'B1 · Arbeit', 'list', '5 Wörter für die Jobsuche', '/grammar/a1.1/nouns-gender/',
  'Bewerbung auf Deutsch? Diese fünf Wörter brauchst du ab Tag eins:\n\ndie Bewerbung · die Bewerbungen\nder Lebenslauf · die Lebensläufe\ndas Vorstellungsgespräch · die Vorstellungsgespräche\ndie Probezeit · die Probezeiten\ndas Gehalt · die Gehälter\n\nIn welcher Branche suchst du? 👇',
  'Mit Artikel und Plural, sonst fehlt die Hälfte.', items=['die Bewerbung · die Bewerbungen', 'der Lebenslauf · die Lebensläufe', 'das Vorstellungsgespräch', 'die Probezeit · die Probezeiten', 'das Gehalt · die Gehälter']))
W(P('Wortschatz', 'A2 · Gesundheit', 'list', '5 Wörter für die Arztpraxis', '/speaking/',
  'Vor dem nächsten Arzttermin einmal durchlesen:\n\ndie Praxis · die Praxen\ndas Rezept · die Rezepte\ndie Krankenkasse · die Krankenkassen\ndie Überweisung · die Überweisungen\ndie Versichertenkarte · die Versichertenkarten\n\nAchtung: Überweisung heißt beim Arzt „zum Facharzt geschickt werden“, bei der Bank „Geld senden“.',
  'Überweisung: beim Arzt zum Facharzt, bei der Bank Geld senden.', items=['die Praxis · die Praxen', 'das Rezept · die Rezepte', 'die Krankenkasse · die Krankenkassen', 'die Überweisung · die Überweisungen', 'die Versichertenkarte']))
W(P('Wortschatz', 'A2 · B1', 'list', 'Gleiches Wort, anderer Artikel', '/grammar/a1.1/nouns-gender/',
  'Deshalb lernst du Nomen immer mit Artikel. Hier ändert er die ganze Bedeutung:\n\nder See (Binnengewässer) · die See (das Meer)\nder Leiter (Chef) · die Leiter (zum Steigen)\ndas Steuer (im Auto) · die Steuer (ans Finanzamt)\nder Band (Buch) · die Band (Musik)\n\nKanntest du alle vier? 👇',
  'Der Artikel ändert die ganze Bedeutung.', items=['der See · die See (= das Meer)', 'der Leiter (Chef) · die Leiter', 'das Steuer (Auto) · die Steuer (Geld)', 'der Band (Buch) · die Band (Musik)']))
W(P('Wortschatz', 'A2 · B1', 'list', '9 Verben mit Dativ', '/grammar/a2.1/dative-case/',
  'Diese Verben wollen Dativ. Frag: Wem?\n\nhelfen · danken · antworten\ngefallen · gehören · schmecken\ngratulieren · passen · fehlen\n\nIch gratuliere dir. Das Buch gehört mir. Du fehlst mir.\n\nBau einen Satz mit einem der Verben 👇',
  'Frag „Wem?“ → Dativ. Ich gratuliere dir.', items=['helfen · danken · antworten', 'gefallen · gehören · schmecken', 'gratulieren · passen · fehlen']))
W(P('Wortschatz', 'B1', 'list', '4 Verbinder für bessere Texte', '/grammar/b1.1/adverbial-connectors/',
  'Mit diesen Wörtern klingen deine Texte zusammenhängend statt wie eine Liste:\n\ndeshalb: Ich bin müde. Deshalb gehe ich ins Bett.\ntrotzdem: Es regnet. Trotzdem gehen wir raus.\naußerdem: Die Wohnung ist groß. Außerdem ist sie hell.\ndanach: Ich esse. Danach lerne ich.\n\nWichtig: Danach kommt sofort das Verb.',
  'Nach diesen Wörtern kommt sofort das Verb.', items=['deshalb: Deshalb gehe ich …', 'trotzdem: Trotzdem gehen wir …', 'außerdem: Außerdem ist sie …', 'danach: Danach lerne ich.']))

X = pool['Prüfungs-Fakt'].append
X(P('Prüfungs-Fakt', 'telc B1', 'fact', 'Schriftlich und mündlich zählen getrennt.', '/leitfaden/telc-b1/',
  'Bei telc Deutsch B1 brauchst du 60 % in beiden Teilen, getrennt: mindestens 135 von 225 Punkten schriftlich und 45 von 75 mündlich.\n\nZwischen den Teilen wird nicht verrechnet. Ein starker schriftlicher Teil rettet also kein schwaches Sprechen.\n\nWelcher Teil macht dir mehr Sorgen? 👇',
  '60 % in beiden Teilen. Zwischen den Teilen wird nicht verrechnet.', stats=[{'num': '135', 'label': 'von 225 · schriftlich'}, {'num': '45', 'label': 'von 75 · mündlich'}]))
X(P('Prüfungs-Fakt', 'telc B2', 'fact', 'Sprachbausteine: klein, aber sie zählen.', '/leitfaden/telc-b2/',
  'Die Sprachbausteine bei telc B2 sind ein Lückentext: Konnektoren, Präpositionen, feste Wendungen.\n\nSie bringen maximal 30 der 225 Punkte im schriftlichen Teil. Wenig? Es sind Punkte, die du mit gezielter Grammatik planbar holen kannst.',
  'Konnektoren, Präpositionen, feste Wendungen: Grammatik im Kontext.', stats=[{'num': '30', 'label': 'Punkte max. · Sprachbausteine'}, {'num': '225', 'label': 'Punkte · schriftlicher Teil'}]))
X(P('Prüfungs-Fakt', 'DTZ', 'fact', 'Der DTZ kennt kein „durchgefallen“.', '/leitfaden/dtz/',
  'Der Deutsch-Test für Zuwanderer prüft A2 und B1 gleichzeitig. Im Zeugnis steht pro Bereich, welches Niveau du erreicht hast.\n\nOb das Ergebnis für deinen Zweck reicht (Einbürgerung, Aufenthalt, Kursabschluss), entscheidet die zuständige Stelle. Kläre das vorher.',
  'Im Zeugnis steht pro Bereich: A2 oder B1.', stats=[{'num': '2', 'label': 'Niveaus in einer Prüfung'}, {'num': '~16', 'label': 'Minuten mündlich, zu zweit'}]))
X(P('Prüfungs-Fakt', 'Start Deutsch 1', 'fact', 'Unter 60 Punkten heißt: alles noch mal.', '/leitfaden/start-deutsch-1/',
  'Start Deutsch 1 (A1) hat 100 Punkte, bestanden ist ab 60.\n\nEs gibt keine Module. Wer unter 60 bleibt, legt bei der Wiederholung alle vier Teile neu ab.\n\nFür den Ehegattennachzug werden Goethe und telc anerkannt. Was im Einzelfall gilt, klärt die Auslandsvertretung.',
  'Keine Module: Bei der Wiederholung legst du alle vier Teile neu ab.', stats=[{'num': '60', 'label': 'von 100 · bestanden'}, {'num': '4', 'label': 'Teile bei Wiederholung'}]))
X(P('Prüfungs-Fakt', 'Goethe A2', 'fact', '60 Punkte und trotzdem nicht bestanden?', '/leitfaden/goethe-a2/',
  'Beim Goethe-Zertifikat A2 gibt es zwei Hürden: mindestens 45 von 75 Punkten schriftlich und mindestens 15 von 25 im Sprechen.\n\nVerfehlst du eine davon, ist die ganze Prüfung nicht bestanden, auch mit 60 Punkten in der Summe.\n\nHeißt: Sprechen nicht bis zum Schluss aufschieben.',
  'Zwei Hürden. Verfehlst du eine, ist die ganze Prüfung nicht bestanden.', stats=[{'num': '45', 'label': 'von 75 · schriftlich'}, {'num': '15', 'label': 'von 25 · Sprechen'}]))
X(P('Prüfungs-Fakt', 'Modelltest', 'fact', 'Offizielle Modelltests kosten nichts.', '/leitfaden/modelltest-deutsch-b1/',
  'telc, das Goethe-Institut und das BAMF stellen Modelltests kostenlos bereit, mit Lösungen und Hörmaterial. Bezahlen musst du nur die Prüfung selbst.\n\nZwei komplette Durchgänge reichen den meisten: einer am Anfang, einer als Generalprobe.',
  'telc, Goethe und BAMF: mit Lösungen und Hörmaterial.', stats=[{'num': '0 €', 'label': 'offizielle Modelltests'}, {'num': '2', 'label': 'Durchgänge reichen meist'}]))

L = pool['Lerntipp'].append
L(P('Lerntipp', 'A1 – B1', 'list', 'Nomen nie ohne Artikel lernen', '/grammar/a1.1/nouns-gender/',
  '„Tisch“ lernen reicht nicht. Lern „der Tisch, die Tische“.\n\n1. Immer Artikel und Plural dazu\n2. Laut sagen, nicht nur lesen\n3. Jeden Tag ein paar neue Wörter statt vieler am Sonntag\n\nWie lernst du deine Vokabeln? 👇',
  'Der Artikel ist Teil des Wortes.', items=['Immer Artikel und Plural dazu', 'Laut sagen, nicht nur lesen', 'Jeden Tag ein paar statt vieler am Sonntag']))
L(P('Lerntipp', 'A2 – B1', 'list', '10 Minuten Sprechen am Tag', '/speaking/',
  'Viele lernen monatelang Grammatik und sprechen kaum. In der mündlichen Prüfung merkt man das sofort.\n\n1. Beschreib laut deinen Tag\n2. Nimm dich auf und hör zu\n3. Übe typische Themen: Reisen, Gesundheit, Medien\n\n10 Minuten täglich. Kein Partner nötig.',
  'Kein Partner nötig. Nur jeden Tag.', items=['Beschreib laut deinen Tag', 'Nimm dich auf und hör zu', 'Übe Themen: Reisen, Gesundheit, Medien']))
L(P('Lerntipp', 'B1 · Lesen', 'list', 'Lesen unter Zeitdruck', '/leitfaden/telc-b1/',
  'Der schriftliche Teil ist lang. Wer beim Lesen zu viel Zeit verbraucht, hat sie beim Schreiben nicht mehr.\n\n1. Erst die Aufgaben lesen, dann den Text\n2. Nicht jedes Wort verstehen wollen\n3. Vorher mit Stoppuhr üben\n\nDu suchst Informationen, du übersetzt nicht.',
  'Du suchst Informationen, du übersetzt nicht.', items=['Erst die Aufgaben, dann den Text', 'Nicht jedes Wort verstehen wollen', 'Vorher mit Stoppuhr üben']))
L(P('Lerntipp', 'B1 · Brief', 'list', 'Checkliste vor dem Abgeben', '/leitfaden/brief-schreiben-b1/',
  'Aufgabenerfüllung und passendes Register wiegen schwerer als einzelne Grammatikfehler. Vor dem Abgeben prüfst du:\n\n1. Alle Leitpunkte beantwortet?\n2. Sie oder du, passt das Register?\n3. Passen Anrede und Gruß zusammen?\n4. Wortzahl der Aufgabe eingehalten?\n\nSpeichern 📌',
  'Aufgabe und Register wiegen schwerer als einzelne Fehler.', items=['Alle Leitpunkte beantwortet?', 'Sie oder du: passt das Register?', 'Passen Anrede und Gruß zusammen?', 'Wortzahl eingehalten?']))
L(P('Lerntipp', 'B1', 'list', 'Den Modelltest richtig nutzen', '/leitfaden/modelltest-deutsch-b1/',
  'Mehr Modelltests heißt nicht mehr Fortschritt.\n\n1. Einmal früh: Wo verlierst du die meisten Punkte?\n2. Dazwischen: nur deine Schwächen trainieren\n3. Einmal kurz vor der Prüfung: Generalprobe unter echten Bedingungen\n\nWie viele Modelltests hast du schon gemacht? 👇',
  'Messen, trainieren, noch einmal messen.', items=['Einmal früh: Wo verlierst du Punkte?', 'Dazwischen: nur Schwächen trainieren', 'Kurz vor der Prüfung: Generalprobe']))
L(P('Lerntipp', 'A1 – B1', 'list', 'Deutsch im Alltag, ohne Extra-Zeit', '/level-test/',
  'Du hast keine Stunde am Tag? Dann nimm Deutsch in das, was du sowieso tust:\n\n1. Handy auf Deutsch umstellen\n2. Einkaufsliste auf Deutsch schreiben\n3. Nachrichten in einfacher Sprache hören\n\nWelchen Trick nutzt du? 👇',
  'Deutsch in das einbauen, was du sowieso tust.', items=['Handy auf Deutsch umstellen', 'Einkaufsliste auf Deutsch schreiben', 'Nachrichten in einfacher Sprache hören']))
L(P('Lerntipp', 'A2 – B1', 'list', 'Führ ein Fehler-Tagebuch', '/analyze/',
  'Die meisten machen immer wieder dieselben fünf Fehler. Finde deine.\n\n1. Jeden Fehler mit Korrektur aufschreiben\n2. Einmal pro Woche die Liste durchgehen\n3. Ein Fehler kommt immer wieder? Das ist dein Thema.\n\nWelcher Fehler passiert dir am häufigsten? 👇',
  'Deine Fehler zeigen dir, was du lernen musst.', items=['Jeden Fehler mit Korrektur aufschreiben', 'Einmal pro Woche durchgehen', 'Kommt er wieder? Das ist dein Thema.']))

# --- order: samples first, then round-robin by most-remaining, never two of a series in a row
# proportional spread: pick the series furthest behind its fair share
order, last = [], 'Redemittel'
total = {s: len(v) for s, v in pool.items()}
while any(pool.values()):
  cands = sorted((s for s in pool if pool[s] and s != last), key=lambda s: -len(pool[s]) / total[s])
  s = cands[0] if cands else last
  order.append(pool[s].pop(0)); last = s

posts = []
for x in samples:
  x = {k: v for k, v in x.items() if k not in ('publish_at', 'id')}
  posts.append(x)
posts += order
assert len(posts) == 50, len(posts)

tz = ZoneInfo('Europe/Berlin')
start = datetime.date(2026, 10, 1)
for i, p in enumerate(posts):
  p['id'] = f'{i+1:03d}'
  p['publish_at'] = datetime.datetime.combine(start + datetime.timedelta(days=i), datetime.time(18, 0), tz).isoformat()
  p['accent'] = SERIES[p['series']][0]
  p.setdefault('hashtags', SERIES[p['series']][1])
  key = next(k for k in CTA if p['link_path'].startswith(k))
  foot, cta = CTA[key]
  if 'footer' not in p: p['footer'] = foot
  if 'cta_ig' not in p:
    p['cta_ig'] = f'{cta}: Link in Bio.'
    p['cta_web'] = f'{cta}:'
json.dump(posts, open('posts.json', 'w'), ensure_ascii=False, indent=2)
print(len(posts), 'posts', posts[0]['publish_at'], '→', posts[-1]['publish_at'])
print([p['series'][:4] for p in posts])
