// Grammar Content for all 64 topics
// Each topic has 5 stages: Introduction, Examples, Rule Breakdown, Guided Practice, Free Practice
// This file contains content for stages 1-3 (learning stages)

export const grammarContent = {
  // ==========================================
  // A1.1 - Beginner I
  // ==========================================
  'a1.1': {
    'alphabet-pronunciation': {
      stage1: {
        title: { en: 'The German Alphabet', de: 'Das deutsche Alphabet' },
        introduction: {
          en: 'German uses the same 26 letters as English, plus four special characters: ä, ö, ü (umlauts) and ß (Eszett). While many letters sound similar to English, some have distinct German pronunciations that are essential to master.',
          de: 'Das Deutsche verwendet die gleichen 26 Buchstaben wie Englisch, plus vier Sonderzeichen: ä, ö, ü (Umlaute) und ß (Eszett). Während viele Buchstaben ähnlich wie im Englischen klingen, haben einige deutlich deutsche Aussprachen.',
        },
        keyPoints: [
          { en: 'Umlauts (ä, ö, ü) change the sound of vowels', de: 'Umlaute (ä, ö, ü) verändern den Klang der Vokale' },
          { en: 'ß (Eszett) is a sharp "s" sound', de: 'ß (Eszett) ist ein scharfer "s"-Laut' },
          { en: 'W sounds like English "v"', de: 'W klingt wie englisches "v"' },
          { en: 'V sounds like English "f"', de: 'V klingt wie englisches "f"' },
          { en: 'J sounds like English "y"', de: 'J klingt wie englisches "y"' },
        ],
      },
      stage2: {
        title: { en: 'Pronunciation Examples', de: 'Aussprachebeispiele' },
        examples: [
          { german: 'Wasser', translation: 'water', pronunciation: 'VAH-ser', audioHint: 'W sounds like V' },
          { german: 'Vater', translation: 'father', pronunciation: 'FAH-ter', audioHint: 'V sounds like F' },
          { german: 'ja', translation: 'yes', pronunciation: 'yah', audioHint: 'J sounds like Y' },
          { german: 'schön', translation: 'beautiful', pronunciation: 'shurn', audioHint: 'ö is a rounded sound' },
          { german: 'über', translation: 'over/about', pronunciation: 'OO-ber', audioHint: 'ü is like ee with rounded lips' },
          { german: 'Mädchen', translation: 'girl', pronunciation: 'MAID-chen', audioHint: 'ä sounds like the a in "bed"' },
          { german: 'Straße', translation: 'street', pronunciation: 'SHTRAH-seh', audioHint: 'ß is a sharp s' },
          { german: 'ich', translation: 'I', pronunciation: 'ikh', audioHint: 'ch after i is soft' },
        ],
      },
      stage3: {
        title: { en: 'Pronunciation Rules', de: 'Ausspracheregeln' },
        tables: [
          {
            title: { en: 'Special Characters', de: 'Sonderzeichen' },
            headers: [
              { en: 'Character', de: 'Zeichen' },
              { en: 'Sound', de: 'Laut' },
              { en: 'Example', de: 'Beispiel' },
            ],
            rows: [
              ['ä', '/ɛ/ like "e" in bed', 'Käse (cheese)'],
              ['ö', '/ø/ rounded "e"', 'schön (beautiful)'],
              ['ü', '/y/ rounded "ee"', 'grün (green)'],
              ['ß', '/s/ sharp s', 'groß (big)'],
            ],
          },
          {
            title: { en: 'Consonant Differences', de: 'Konsonantenunterschiede' },
            headers: [
              { en: 'Letter', de: 'Buchstabe' },
              { en: 'German Sound', de: 'Deutscher Laut' },
              { en: 'Example', de: 'Beispiel' },
            ],
            rows: [
              ['W', 'like English V', 'Wein (wine)'],
              ['V', 'like English F', 'Vogel (bird)'],
              ['J', 'like English Y', 'Jahr (year)'],
              ['Z', 'like TS', 'Zeit (time)'],
              ['S (before vowel)', 'like English Z', 'Sonne (sun)'],
            ],
          },
        ],
        tips: [
          { en: 'Practice the umlauts by starting with the base vowel (a, o, u) and rounding your lips', de: 'Übe die Umlaute, indem du mit dem Grundvokal (a, o, u) beginnst und deine Lippen rundest' },
          { en: 'The "ch" sound varies: soft after i/e (ich), harder after a/o/u (auch)', de: 'Der "ch"-Laut variiert: weich nach i/e (ich), härter nach a/o/u (auch)' },
        ],
        warnings: [
          { en: 'Don\'t pronounce W like English W - it\'s always like V!', de: 'Sprich W nicht wie englisches W aus - es ist immer wie V!' },
        ],
      },
      stage4: {
        title: { en: 'Guided Practice', de: 'Geführte Übung' },
        instructions: {
          en: 'Test your knowledge of German pronunciation rules. Select the correct answer for each question.',
          de: 'Teste dein Wissen über deutsche Ausspracheregeln. Wähle die richtige Antwort für jede Frage.',
        },
        exercises: [
          {
            type: 'multiple-choice',
            question: { en: 'How is the German "W" pronounced?', de: 'Wie wird das deutsche "W" ausgesprochen?' },
            options: ['Like English "w"', 'Like English "v"', 'Like English "f"', 'Like English "b"'],
            correct: 1,
            explanation: {
              en: 'German "W" is pronounced like English "V". For example, "Wasser" (water) sounds like "VAH-ser".',
              de: 'Das deutsche "W" wird wie das englische "V" ausgesprochen. Zum Beispiel klingt "Wasser" wie "VAH-ser".',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'What sound does "ß" make?', de: 'Welchen Laut macht "ß"?' },
            options: ['A "z" sound', 'A "b" sound', 'A sharp "s" sound', 'A "sh" sound'],
            correct: 2,
            explanation: {
              en: 'ß (Eszett) makes a sharp "s" sound. It\'s used after long vowels, like in "Straße" (street).',
              de: 'ß (Eszett) macht einen scharfen "s"-Laut. Es wird nach langen Vokalen verwendet, wie in "Straße".',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'The German letter "V" sounds like English _____.', de: 'Der deutsche Buchstabe "V" klingt wie englisches _____.' },
            answer: 'f',
            acceptableAnswers: ['f', 'F', '"f"', '"F"'],
            explanation: {
              en: 'German "V" is pronounced like English "F". "Vater" (father) sounds like "FAH-ter".',
              de: 'Das deutsche "V" wird wie das englische "F" ausgesprochen. "Vater" klingt wie "FAH-ter".',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Which word contains an umlaut?', de: 'Welches Wort enthält einen Umlaut?' },
            options: ['Haus', 'Buch', 'schön', 'Brot'],
            correct: 2,
            explanation: {
              en: '"Schön" contains ö, which is an umlaut. Umlauts are ä, ö, and ü - modified vowels with two dots.',
              de: '"Schön" enthält ö, das ein Umlaut ist. Umlaute sind ä, ö und ü - modifizierte Vokale mit zwei Punkten.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'How is "J" pronounced in German?', de: 'Wie wird "J" im Deutschen ausgesprochen?' },
            options: ['Like English "j" in "jump"', 'Like English "y" in "yes"', 'Like English "g" in "gem"', 'Like English "h"'],
            correct: 1,
            explanation: {
              en: 'German "J" sounds like English "Y". "Ja" (yes) is pronounced "yah".',
              de: 'Das deutsche "J" klingt wie das englische "Y". "Ja" wird "yah" ausgesprochen.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'The letter "ü" sounds like "ee" with _____ lips.', de: 'Der Buchstabe "ü" klingt wie "ee" mit _____ Lippen.' },
            answer: 'rounded',
            acceptableAnswers: ['rounded', 'round', 'gerundeten', 'runden'],
            explanation: {
              en: 'To pronounce "ü", say "ee" while rounding your lips as if saying "oo". Try it with "über"!',
              de: 'Um "ü" auszusprechen, sage "ee" während du deine Lippen rundest, als ob du "oo" sagen würdest. Probiere es mit "über"!',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'How is "Z" pronounced in German?', de: 'Wie wird "Z" im Deutschen ausgesprochen?' },
            options: ['Like English "z"', 'Like "ts"', 'Like "s"', 'Like "sh"'],
            correct: 1,
            explanation: {
              en: 'German "Z" sounds like "ts". "Zeit" (time) is pronounced "tsait".',
              de: 'Das deutsche "Z" klingt wie "ts". "Zeit" wird "tsait" ausgesprochen.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'German "S" before a vowel sounds like English _____.', de: 'Das deutsche "S" vor einem Vokal klingt wie englisches _____.' },
            answer: 'z',
            acceptableAnswers: ['z', 'Z', '"z"', '"Z"'],
            explanation: {
              en: 'German "S" at the start of a word before a vowel is voiced, like English "Z". "Sonne" sounds like "ZON-nuh".',
              de: 'Das deutsche "S" am Wortanfang vor einem Vokal ist stimmhaft, wie das englische "Z". "Sonne" klingt wie "ZON-nuh".',
            },
          },
        ],
      },
      stage5: {
        title: { en: 'Mastery Challenge', de: 'Meisterschaftsprüfung' },
        instructions: {
          en: 'Complete these advanced exercises to demonstrate your mastery of German pronunciation.',
          de: 'Schließe diese fortgeschrittenen Übungen ab, um deine Beherrschung der deutschen Aussprache zu demonstrieren.',
        },
        exercises: [
          {
            type: 'word-order',
            question: { en: 'Arrange these letters in alphabetical order (German):', de: 'Ordne diese Buchstaben in alphabetischer Reihenfolge (Deutsch):' },
            words: ['ü', 'ä', 'ö', 'ß'],
            correctOrder: ['ä', 'ö', 'ß', 'ü'],
            explanation: {
              en: 'In German alphabetical order: ä comes after a, ö after o, ß after s, and ü after u.',
              de: 'In deutscher alphabetischer Reihenfolge: ä kommt nach a, ö nach o, ß nach s und ü nach u.',
            },
          },
          {
            type: 'translation',
            question: { en: 'How would you spell the sound "ts" in German?', de: 'Wie würdest du den Laut "ts" auf Deutsch schreiben?' },
            answer: 'z',
            acceptableAnswers: ['z', 'Z'],
            explanation: {
              en: 'The "ts" sound in German is written as "Z". Example: Zeit (time) = "tsait"',
              de: 'Der "ts"-Laut wird im Deutschen als "Z" geschrieben. Beispiel: Zeit = "tsait"',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Put these words in order based on their first letter sound (V sound first):', de: 'Ordne diese Wörter nach ihrem Anfangslaut (V-Laut zuerst):' },
            words: ['Vater', 'Wein', 'Jahr'],
            correctOrder: ['Wein', 'Vater', 'Jahr'],
            explanation: {
              en: 'Wein starts with a V sound (W=V), Vater starts with an F sound (V=F), Jahr starts with a Y sound (J=Y).',
              de: 'Wein beginnt mit einem V-Laut (W=V), Vater beginnt mit einem F-Laut (V=F), Jahr beginnt mit einem J-Laut (J=Y).',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write the German word for "street" (with ß):', de: 'Schreibe das deutsche Wort für "street" (mit ß):' },
            answer: 'Straße',
            acceptableAnswers: ['Straße', 'straße', 'STRASSE', 'Strasse', 'strasse'],
            explanation: {
              en: 'Straße uses ß after the long "a" sound. The ß represents a sharp "s" sound.',
              de: 'Straße verwendet ß nach dem langen "a"-Laut. Das ß repräsentiert einen scharfen "s"-Laut.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Order these words from soft "ch" to hard "ch" sound:', de: 'Ordne diese Wörter von weichem "ch" zu hartem "ch":' },
            words: ['auch', 'ich', 'Buch'],
            correctOrder: ['ich', 'auch', 'Buch'],
            explanation: {
              en: '"ch" after i/e is soft (ich), after a/o/u is harder (auch, Buch). "Ich" has the softest sound.',
              de: '"ch" nach i/e ist weich (ich), nach a/o/u ist härter (auch, Buch). "Ich" hat den weichsten Laut.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write a German word that contains "ö":', de: 'Schreibe ein deutsches Wort mit "ö":' },
            answer: 'schön',
            acceptableAnswers: ['schön', 'Schön', 'König', 'könig', 'mögen', 'Möbel', 'hören', 'Löwe', 'böse', 'Körper', 'öffnen'],
            explanation: {
              en: 'Words with ö include: schön (beautiful), König (king), mögen (to like), hören (to hear), Löwe (lion).',
              de: 'Wörter mit ö sind: schön, König, mögen, hören, Löwe, böse, Körper, öffnen.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write the German word for "yes":', de: 'Schreibe das deutsche Wort für "yes":' },
            answer: 'ja',
            acceptableAnswers: ['ja', 'Ja', 'JA'],
            explanation: {
              en: '"Ja" means yes. Remember, the J sounds like English Y, so it\'s pronounced "yah".',
              de: '"Ja" bedeutet yes. Denke daran, das J klingt wie das englische Y, also wird es "yah" ausgesprochen.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Arrange to spell "beautiful" in German:', de: 'Ordne, um "beautiful" auf Deutsch zu buchstabieren:' },
            words: ['ö', 'h', 's', 'c', 'n'],
            correctOrder: ['s', 'c', 'h', 'ö', 'n'],
            explanation: {
              en: 'Schön means beautiful. Note the "sch" combination makes a "sh" sound, and ö is a rounded vowel.',
              de: 'Schön bedeutet beautiful. Beachte, die "sch"-Kombination macht einen "sch"-Laut, und ö ist ein gerundeter Vokal.',
            },
          },
        ],
      },
    },

    'nouns-gender': {
      stage1: {
        title: { en: 'Grammatical Gender', de: 'Grammatisches Geschlecht' },
        introduction: {
          en: 'Every German noun has a grammatical gender: masculine (der), feminine (die), or neuter (das). This gender often doesn\'t relate to biological gender - a table is masculine, a lamp is feminine, and a girl is neuter! Learning the gender with each noun is essential.',
          de: 'Jedes deutsche Nomen hat ein grammatisches Geschlecht: maskulin (der), feminin (die) oder neutral (das). Dieses Geschlecht hat oft nichts mit dem biologischen Geschlecht zu tun - ein Tisch ist maskulin, eine Lampe ist feminin, und ein Mädchen ist neutral!',
        },
        keyPoints: [
          { en: 'Always learn nouns WITH their article', de: 'Lerne Nomen IMMER mit ihrem Artikel' },
          { en: 'der = masculine, die = feminine, das = neuter', de: 'der = maskulin, die = feminin, das = neutral' },
          { en: 'Some patterns help predict gender', de: 'Einige Muster helfen, das Geschlecht vorherzusagen' },
          { en: 'Compound nouns take the gender of the last word', de: 'Zusammengesetzte Nomen nehmen das Geschlecht des letzten Wortes' },
        ],
      },
      stage2: {
        title: { en: 'Gender Examples', de: 'Geschlechtsbeispiele' },
        examples: [
          { german: 'der Mann', translation: 'the man', pronunciation: 'dair mahn', audioHint: 'masculine' },
          { german: 'die Frau', translation: 'the woman', pronunciation: 'dee frow', audioHint: 'feminine' },
          { german: 'das Kind', translation: 'the child', pronunciation: 'dahs kint', audioHint: 'neuter' },
          { german: 'der Tisch', translation: 'the table', pronunciation: 'dair tish', audioHint: 'masculine - objects can be any gender' },
          { german: 'die Lampe', translation: 'the lamp', pronunciation: 'dee LAHM-peh', audioHint: 'feminine - -e ending often feminine' },
          { german: 'das Mädchen', translation: 'the girl', pronunciation: 'dahs MAID-chen', audioHint: 'neuter - -chen ending always neuter!' },
          { german: 'der Apfel', translation: 'the apple', pronunciation: 'dair AHP-fel', audioHint: 'masculine' },
          { german: 'die Universität', translation: 'the university', pronunciation: 'dee oo-nee-vair-zee-TAYT', audioHint: 'feminine - -tät ending always feminine' },
        ],
      },
      stage3: {
        title: { en: 'Gender Patterns', de: 'Geschlechtsmuster' },
        tables: [
          {
            title: { en: 'Usually Masculine (der)', de: 'Meist maskulin (der)' },
            headers: [
              { en: 'Category/Ending', de: 'Kategorie/Endung' },
              { en: 'Examples', de: 'Beispiele' },
            ],
            rows: [
              ['Male persons & animals', 'der Mann, der Hund'],
              ['Days, months, seasons', 'der Montag, der Januar, der Sommer'],
              ['Endings: -er, -ling, -ismus', 'der Lehrer, der Frühling, der Tourismus'],
              ['Car brands', 'der BMW, der Mercedes'],
            ],
          },
          {
            title: { en: 'Usually Feminine (die)', de: 'Meist feminin (die)' },
            headers: [
              { en: 'Category/Ending', de: 'Kategorie/Endung' },
              { en: 'Examples', de: 'Beispiele' },
            ],
            rows: [
              ['Female persons', 'die Frau, die Mutter'],
              ['Endings: -ung, -heit, -keit', 'die Zeitung, die Freiheit, die Möglichkeit'],
              ['Endings: -tion, -tät, -ie', 'die Nation, die Universität, die Energie'],
              ['Endings: -e (many)', 'die Lampe, die Straße, die Schule'],
            ],
          },
          {
            title: { en: 'Usually Neuter (das)', de: 'Meist neutral (das)' },
            headers: [
              { en: 'Category/Ending', de: 'Kategorie/Endung' },
            ],
            rows: [
              ['Endings: -chen, -lein (diminutives)', 'das Mädchen, das Büchlein'],
              ['Endings: -um, -ment', 'das Museum, das Dokument'],
              ['Infinitives used as nouns', 'das Essen, das Leben'],
              ['Most metals & chemicals', 'das Gold, das Silber'],
            ],
          },
        ],
        tips: [
          { en: 'When in doubt, guess "die" - about 46% of nouns are feminine', de: 'Im Zweifel rate "die" - etwa 46% der Nomen sind feminin' },
          { en: 'Diminutives (-chen, -lein) are ALWAYS neuter, even for people', de: 'Diminutive (-chen, -lein) sind IMMER neutral, auch für Personen' },
        ],
        warnings: [
          { en: 'das Mädchen (girl) is neuter because of -chen ending!', de: 'das Mädchen ist neutral wegen der -chen Endung!' },
          { en: 'Some common words break the patterns - always learn with article', de: 'Einige häufige Wörter brechen die Muster - immer mit Artikel lernen' },
        ],
      },
      stage4: {
        title: { en: 'Guided Practice', de: 'Geführte Übung' },
        instructions: {
          en: 'Practice identifying grammatical gender. Choose the correct article for each noun.',
          de: 'Übe das Erkennen des grammatischen Geschlechts. Wähle den richtigen Artikel für jedes Nomen.',
        },
        exercises: [
          {
            type: 'multiple-choice',
            question: { en: 'Which article goes with "Tisch" (table)?', de: 'Welcher Artikel gehört zu "Tisch"?' },
            options: ['der', 'die', 'das'],
            correct: 0,
            explanation: {
              en: '"Tisch" is masculine: der Tisch. Many objects can be any gender - you must memorize them!',
              de: '"Tisch" ist maskulin: der Tisch. Viele Objekte können jedes Geschlecht haben - du musst sie auswendig lernen!',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Which article goes with "Lampe" (lamp)?', de: 'Welcher Artikel gehört zu "Lampe"?' },
            options: ['der', 'die', 'das'],
            correct: 1,
            explanation: {
              en: '"Lampe" is feminine: die Lampe. Words ending in -e are often feminine.',
              de: '"Lampe" ist feminin: die Lampe. Wörter, die auf -e enden, sind oft feminin.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Which article goes with "Mädchen" (girl)?', de: 'Welcher Artikel gehört zu "Mädchen"?' },
            options: ['der', 'die', 'das'],
            correct: 2,
            explanation: {
              en: '"Mädchen" is neuter: das Mädchen. Words ending in -chen are ALWAYS neuter, even for people!',
              de: '"Mädchen" ist neutral: das Mädchen. Wörter, die auf -chen enden, sind IMMER neutral, auch für Personen!',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Complete: ___ Freiheit (freedom) - hint: -heit ending', de: 'Ergänze: ___ Freiheit - Hinweis: -heit Endung' },
            answer: 'die',
            acceptableAnswers: ['die', 'Die'],
            explanation: {
              en: 'Words ending in -heit are always feminine: die Freiheit.',
              de: 'Wörter, die auf -heit enden, sind immer feminin: die Freiheit.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Which article goes with "Montag" (Monday)?', de: 'Welcher Artikel gehört zu "Montag"?' },
            options: ['der', 'die', 'das'],
            correct: 0,
            explanation: {
              en: 'Days of the week are masculine: der Montag, der Dienstag, etc.',
              de: 'Wochentage sind maskulin: der Montag, der Dienstag, usw.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Complete: ___ Museum - hint: -um ending', de: 'Ergänze: ___ Museum - Hinweis: -um Endung' },
            answer: 'das',
            acceptableAnswers: ['das', 'Das'],
            explanation: {
              en: 'Words ending in -um are usually neuter: das Museum, das Datum.',
              de: 'Wörter, die auf -um enden, sind meist neutral: das Museum, das Datum.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Which gender pattern is correct?', de: 'Welches Geschlechtsmuster ist richtig?' },
            options: [
              '-ung endings are masculine',
              '-ung endings are feminine',
              '-ung endings are neuter',
            ],
            correct: 1,
            explanation: {
              en: 'Words ending in -ung are always feminine: die Zeitung, die Übung, die Wohnung.',
              de: 'Wörter, die auf -ung enden, sind immer feminin: die Zeitung, die Übung, die Wohnung.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Complete: ___ Sommer (summer)', de: 'Ergänze: ___ Sommer' },
            answer: 'der',
            acceptableAnswers: ['der', 'Der'],
            explanation: {
              en: 'Seasons are masculine: der Sommer, der Winter, der Frühling, der Herbst.',
              de: 'Jahreszeiten sind maskulin: der Sommer, der Winter, der Frühling, der Herbst.',
            },
          },
        ],
      },
      stage5: {
        title: { en: 'Mastery Challenge', de: 'Meisterschaftsprüfung' },
        instructions: {
          en: 'Complete these advanced exercises to master German noun gender.',
          de: 'Schließe diese fortgeschrittenen Übungen ab, um das deutsche Nomen-Geschlecht zu meistern.',
        },
        exercises: [
          {
            type: 'word-order',
            question: { en: 'Order these nouns from masculine to feminine to neuter:', de: 'Ordne diese Nomen von maskulin zu feminin zu neutral:' },
            words: ['Mädchen', 'Frau', 'Mann'],
            correctOrder: ['Mann', 'Frau', 'Mädchen'],
            explanation: {
              en: 'der Mann (masculine), die Frau (feminine), das Mädchen (neuter - because of -chen!)',
              de: 'der Mann (maskulin), die Frau (feminin), das Mädchen (neutral - wegen -chen!)',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write the German article for "the newspaper" (Zeitung):', de: 'Schreibe den deutschen Artikel für "the newspaper" (Zeitung):' },
            answer: 'die',
            acceptableAnswers: ['die', 'Die'],
            explanation: {
              en: 'die Zeitung - words ending in -ung are always feminine.',
              de: 'die Zeitung - Wörter, die auf -ung enden, sind immer feminin.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Match: Mann, Frau, Kind with der, die, das:', de: 'Zuordnen: Mann, Frau, Kind mit der, die, das:' },
            words: ['der Kind', 'die Mann', 'das Frau'],
            correctOrder: ['der Mann', 'die Frau', 'das Kind'],
            explanation: {
              en: 'der Mann, die Frau, das Kind - basic gender assignments for people.',
              de: 'der Mann, die Frau, das Kind - grundlegende Geschlechtszuweisungen für Personen.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write the article + noun for "a girl" in German:', de: 'Schreibe den Artikel + Nomen für "a girl" auf Deutsch:' },
            answer: 'ein Mädchen',
            acceptableAnswers: ['ein Mädchen', 'Ein Mädchen', 'ein mädchen'],
            explanation: {
              en: 'ein Mädchen - neuter because of the -chen ending, so "ein" not "eine".',
              de: 'ein Mädchen - neutral wegen der -chen Endung, also "ein" nicht "eine".',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Put these feminine-ending patterns in order (-ung, -heit, -keit):', de: 'Ordne diese femininen Endungsmuster (-ung, -heit, -keit):' },
            words: ['Möglichkeit', 'Zeitung', 'Freiheit'],
            correctOrder: ['Zeitung', 'Freiheit', 'Möglichkeit'],
            explanation: {
              en: 'All three endings (-ung, -heit, -keit) are always feminine: die Zeitung, die Freiheit, die Möglichkeit.',
              de: 'Alle drei Endungen (-ung, -heit, -keit) sind immer feminin: die Zeitung, die Freiheit, die Möglichkeit.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write "the book" in German:', de: 'Schreibe "the book" auf Deutsch:' },
            answer: 'das Buch',
            acceptableAnswers: ['das Buch', 'Das Buch', 'das buch'],
            explanation: {
              en: 'das Buch - "Buch" is neuter. This must be memorized!',
              de: 'das Buch - "Buch" ist neutral. Das muss auswendig gelernt werden!',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write "the teacher" (male) in German:', de: 'Schreibe "the teacher" (männlich) auf Deutsch:' },
            answer: 'der Lehrer',
            acceptableAnswers: ['der Lehrer', 'Der Lehrer', 'der lehrer'],
            explanation: {
              en: 'der Lehrer - male professions ending in -er are masculine.',
              de: 'der Lehrer - männliche Berufe, die auf -er enden, sind maskulin.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Order these neuter words (das ...):', de: 'Ordne diese neutralen Wörter (das ...):' },
            words: ['Kind', 'Buch', 'Mädchen'],
            correctOrder: ['Buch', 'Kind', 'Mädchen'],
            explanation: {
              en: 'All are neuter: das Buch, das Kind, das Mädchen. Alphabetical order for das-words.',
              de: 'Alle sind neutral: das Buch, das Kind, das Mädchen. Alphabetische Reihenfolge für das-Wörter.',
            },
          },
        ],
      },
    },

    'definite-articles': {
      stage1: {
        title: { en: 'Definite Articles: der, die, das', de: 'Bestimmte Artikel: der, die, das' },
        introduction: {
          en: 'Definite articles (the) in German must match the gender of the noun: der (masculine), die (feminine), das (neuter). Unlike English which only has "the", German has three forms - and they change based on the grammatical case!',
          de: 'Bestimmte Artikel (the) im Deutschen müssen mit dem Geschlecht des Nomens übereinstimmen: der (maskulin), die (feminin), das (neutral). Anders als im Englischen, das nur "the" hat, hat Deutsch drei Formen - und sie ändern sich je nach Fall!',
        },
        keyPoints: [
          { en: 'der = masculine nouns', de: 'der = maskuline Nomen' },
          { en: 'die = feminine nouns', de: 'die = feminine Nomen' },
          { en: 'das = neuter nouns', de: 'das = neutrale Nomen' },
          { en: 'die = ALL plural nouns (regardless of gender)', de: 'die = ALLE Pluralnomen (unabhängig vom Geschlecht)' },
        ],
      },
      stage2: {
        title: { en: 'Using Definite Articles', de: 'Bestimmte Artikel verwenden' },
        examples: [
          { german: 'Der Hund ist groß.', translation: 'The dog is big.', pronunciation: 'dair hoont ist grohs', audioHint: 'der for masculine' },
          { german: 'Die Katze schläft.', translation: 'The cat is sleeping.', pronunciation: 'dee KAH-tseh shlayft', audioHint: 'die for feminine' },
          { german: 'Das Buch ist interessant.', translation: 'The book is interesting.', pronunciation: 'dahs bookh ist in-teh-reh-SAHNT', audioHint: 'das for neuter' },
          { german: 'Die Kinder spielen.', translation: 'The children are playing.', pronunciation: 'dee KIN-der SHPEE-len', audioHint: 'die for ALL plurals' },
          { german: 'Der Apfel ist rot.', translation: 'The apple is red.', pronunciation: 'dair AHP-fel ist roht', audioHint: 'der - apple is masculine' },
          { german: 'Die Sonne scheint.', translation: 'The sun is shining.', pronunciation: 'dee ZON-neh shynt', audioHint: 'die - sun is feminine' },
        ],
      },
      stage3: {
        title: { en: 'Definite Article Overview', de: 'Überblick bestimmte Artikel' },
        tables: [
          {
            title: { en: 'Nominative Case (Subject)', de: 'Nominativ (Subjekt)' },
            headers: [
              { en: 'Gender', de: 'Geschlecht' },
              { en: 'Article', de: 'Artikel' },
              { en: 'Example', de: 'Beispiel' },
            ],
            rows: [
              ['Masculine', 'der', 'der Mann (the man)'],
              ['Feminine', 'die', 'die Frau (the woman)'],
              ['Neuter', 'das', 'das Kind (the child)'],
              ['Plural (all)', 'die', 'die Leute (the people)'],
            ],
          },
        ],
        tips: [
          { en: 'Remember: "die" does double duty - feminine AND all plurals', de: 'Merke: "die" hat zwei Funktionen - feminin UND alle Plurale' },
          { en: 'Think of the article as part of the word - learn "der Tisch" not just "Tisch"', de: 'Denke an den Artikel als Teil des Wortes - lerne "der Tisch", nicht nur "Tisch"' },
        ],
        warnings: [
          { en: 'Articles change in different cases (accusative, dative, etc.) - you\'ll learn this later!', de: 'Artikel ändern sich in verschiedenen Fällen (Akkusativ, Dativ, etc.) - das lernst du später!' },
        ],
      },
      stage4: {
        title: { en: 'Guided Practice', de: 'Geführte Übung' },
        instructions: {
          en: 'Practice using definite articles. Choose the correct article for each noun.',
          de: 'Übe die Verwendung bestimmter Artikel. Wähle den richtigen Artikel für jedes Nomen.',
        },
        exercises: [
          {
            type: 'multiple-choice',
            question: { en: 'Complete: ___ Hund ist groß.', de: 'Ergänze: ___ Hund ist groß.' },
            options: ['Der', 'Die', 'Das'],
            correct: 0,
            explanation: {
              en: 'Der Hund - "Hund" is masculine, so we use "der".',
              de: 'Der Hund - "Hund" ist maskulin, also benutzen wir "der".',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Complete: ___ Katze schläft.', de: 'Ergänze: ___ Katze schläft.' },
            options: ['Der', 'Die', 'Das'],
            correct: 1,
            explanation: {
              en: 'Die Katze - "Katze" is feminine, so we use "die".',
              de: 'Die Katze - "Katze" ist feminin, also benutzen wir "die".',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Complete: ___ Buch ist interessant.', de: 'Ergänze: ___ Buch ist interessant.' },
            options: ['Der', 'Die', 'Das'],
            correct: 2,
            explanation: {
              en: 'Das Buch - "Buch" is neuter, so we use "das".',
              de: 'Das Buch - "Buch" ist neutral, also benutzen wir "das".',
            },
          },
          {
            type: 'fill-blank',
            question: { en: '___ Kinder spielen im Park. (plural)', de: '___ Kinder spielen im Park. (Plural)' },
            answer: 'Die',
            acceptableAnswers: ['Die', 'die'],
            explanation: {
              en: 'Die Kinder - ALL plurals use "die", regardless of the singular gender.',
              de: 'Die Kinder - ALLE Plurale benutzen "die", unabhängig vom Geschlecht im Singular.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Which article is used for ALL plural nouns?', de: 'Welcher Artikel wird für ALLE Pluralnomen verwendet?' },
            options: ['der', 'die', 'das', 'den'],
            correct: 1,
            explanation: {
              en: '"Die" is used for all plural nouns, regardless of their singular gender.',
              de: '"Die" wird für alle Pluralnomen verwendet, unabhängig von ihrem Singular-Geschlecht.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: '___ Sonne scheint heute. (feminine)', de: '___ Sonne scheint heute. (feminin)' },
            answer: 'Die',
            acceptableAnswers: ['Die', 'die'],
            explanation: {
              en: 'Die Sonne - "Sonne" is feminine.',
              de: 'Die Sonne - "Sonne" ist feminin.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Complete: ___ Apfel ist rot.', de: 'Ergänze: ___ Apfel ist rot.' },
            options: ['Der', 'Die', 'Das'],
            correct: 0,
            explanation: {
              en: 'Der Apfel - "Apfel" is masculine.',
              de: 'Der Apfel - "Apfel" ist maskulin.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: '___ Wasser ist kalt. (neuter)', de: '___ Wasser ist kalt. (neutral)' },
            answer: 'Das',
            acceptableAnswers: ['Das', 'das'],
            explanation: {
              en: 'Das Wasser - "Wasser" is neuter.',
              de: 'Das Wasser - "Wasser" ist neutral.',
            },
          },
        ],
      },
      stage5: {
        title: { en: 'Mastery Challenge', de: 'Meisterschaftsprüfung' },
        instructions: {
          en: 'Complete these advanced exercises to master definite articles.',
          de: 'Schließe diese fortgeschrittenen Übungen ab, um bestimmte Artikel zu meistern.',
        },
        exercises: [
          {
            type: 'word-order',
            question: { en: 'Create a sentence: "The man reads" - Mann / liest / Der', de: 'Bilde einen Satz: "The man reads" - Mann / liest / Der' },
            words: ['liest', 'Mann', 'Der'],
            correctOrder: ['Der', 'Mann', 'liest'],
            explanation: {
              en: 'Der Mann liest. Subject (Der Mann) + Verb (liest).',
              de: 'Der Mann liest. Subjekt (Der Mann) + Verb (liest).',
            },
          },
          {
            type: 'translation',
            question: { en: 'Translate: "The woman is singing."', de: 'Übersetze: "The woman is singing."' },
            answer: 'Die Frau singt',
            acceptableAnswers: ['Die Frau singt', 'Die Frau singt.', 'die Frau singt'],
            explanation: {
              en: 'Die Frau singt. "Frau" is feminine, so "die" is used.',
              de: 'Die Frau singt. "Frau" ist feminin, also wird "die" benutzt.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Create: "The child plays" - spielt / Kind / Das', de: 'Bilde: "The child plays" - spielt / Kind / Das' },
            words: ['spielt', 'Das', 'Kind'],
            correctOrder: ['Das', 'Kind', 'spielt'],
            explanation: {
              en: 'Das Kind spielt. "Kind" is neuter.',
              de: 'Das Kind spielt. "Kind" ist neutral.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Translate: "The children are playing."', de: 'Übersetze: "The children are playing."' },
            answer: 'Die Kinder spielen',
            acceptableAnswers: ['Die Kinder spielen', 'Die Kinder spielen.', 'die Kinder spielen'],
            explanation: {
              en: 'Die Kinder spielen. Plural always uses "die".',
              de: 'Die Kinder spielen. Plural benutzt immer "die".',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "The sun is shining."', de: 'Schreibe: "The sun is shining."' },
            answer: 'Die Sonne scheint',
            acceptableAnswers: ['Die Sonne scheint', 'Die Sonne scheint.', 'die Sonne scheint'],
            explanation: {
              en: 'Die Sonne scheint. "Sonne" is feminine.',
              de: 'Die Sonne scheint. "Sonne" ist feminin.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Create: "The dog is big" - groß / Der / Hund / ist', de: 'Bilde: "The dog is big" - groß / Der / Hund / ist' },
            words: ['groß', 'Hund', 'ist', 'Der'],
            correctOrder: ['Der', 'Hund', 'ist', 'groß'],
            explanation: {
              en: 'Der Hund ist groß. Standard word order for "to be" sentences.',
              de: 'Der Hund ist groß. Standard-Wortstellung für "sein"-Sätze.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "The book is interesting."', de: 'Schreibe: "The book is interesting."' },
            answer: 'Das Buch ist interessant',
            acceptableAnswers: ['Das Buch ist interessant', 'Das Buch ist interessant.', 'das Buch ist interessant'],
            explanation: {
              en: 'Das Buch ist interessant. "Buch" is neuter.',
              de: 'Das Buch ist interessant. "Buch" ist neutral.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Order: cat / The / sleeps - Die Katze schläft', de: 'Ordne: Katze / Die / schläft' },
            words: ['schläft', 'Katze', 'Die'],
            correctOrder: ['Die', 'Katze', 'schläft'],
            explanation: {
              en: 'Die Katze schläft. Subject + Verb word order.',
              de: 'Die Katze schläft. Subjekt + Verb Wortstellung.',
            },
          },
        ],
      },
    },

    'indefinite-articles': {
      stage1: {
        title: { en: 'Indefinite Articles: ein, eine', de: 'Unbestimmte Artikel: ein, eine' },
        introduction: {
          en: 'Indefinite articles (a/an) in German also depend on gender: ein (masculine/neuter) and eine (feminine). Note that masculine and neuter share the same form "ein" in the nominative case!',
          de: 'Unbestimmte Artikel (a/an) im Deutschen hängen auch vom Geschlecht ab: ein (maskulin/neutral) und eine (feminin). Beachte, dass maskulin und neutral im Nominativ die gleiche Form "ein" teilen!',
        },
        keyPoints: [
          { en: 'ein = masculine AND neuter nouns', de: 'ein = maskuline UND neutrale Nomen' },
          { en: 'eine = feminine nouns', de: 'eine = feminine Nomen' },
          { en: 'There is NO plural indefinite article (like "some" in English)', de: 'Es gibt KEINEN unbestimmten Artikel im Plural (wie "some" im Englischen)' },
          { en: 'kein/keine = negation (not a, no)', de: 'kein/keine = Verneinung (kein/e)' },
        ],
      },
      stage2: {
        title: { en: 'Using Indefinite Articles', de: 'Unbestimmte Artikel verwenden' },
        examples: [
          { german: 'Das ist ein Mann.', translation: 'That is a man.', pronunciation: 'dahs ist ine mahn', audioHint: 'ein for masculine' },
          { german: 'Das ist eine Frau.', translation: 'That is a woman.', pronunciation: 'dahs ist INE-eh frow', audioHint: 'eine for feminine' },
          { german: 'Das ist ein Kind.', translation: 'That is a child.', pronunciation: 'dahs ist ine kint', audioHint: 'ein for neuter too!' },
          { german: 'Ich habe einen Hund.', translation: 'I have a dog.', pronunciation: 'ikh HAH-beh INE-en hoont', audioHint: 'einen in accusative (object)' },
          { german: 'Das ist kein Problem.', translation: 'That is not a problem.', pronunciation: 'dahs ist kine pro-BLAYM', audioHint: 'kein for negation' },
          { german: 'Ich habe keine Zeit.', translation: 'I have no time.', pronunciation: 'ikh HAH-beh KINE-eh tsyte', audioHint: 'keine for feminine negation' },
        ],
      },
      stage3: {
        title: { en: 'Indefinite Article Forms', de: 'Unbestimmte Artikelformen' },
        tables: [
          {
            title: { en: 'Nominative Case', de: 'Nominativ' },
            headers: [
              { en: 'Gender', de: 'Geschlecht' },
              { en: 'Positive', de: 'Positiv' },
              { en: 'Negative', de: 'Negativ' },
            ],
            rows: [
              ['Masculine', 'ein', 'kein'],
              ['Feminine', 'eine', 'keine'],
              ['Neuter', 'ein', 'kein'],
              ['Plural', '— (none)', 'keine'],
            ],
          },
        ],
        tips: [
          { en: 'ein/eine follows the same pattern as kein/keine and possessives (mein, dein, etc.)', de: 'ein/eine folgt dem gleichen Muster wie kein/keine und Possessive (mein, dein, etc.)' },
          { en: 'For plural, just use the noun without an article: "Das sind Bücher" (Those are books)', de: 'Im Plural benutze nur das Nomen ohne Artikel: "Das sind Bücher"' },
        ],
        warnings: [
          { en: 'Don\'t confuse "ein" (article) with "eins" (number one)!', de: 'Verwechsle nicht "ein" (Artikel) mit "eins" (Zahl eins)!' },
        ],
      },
      stage4: {
        title: { en: 'Guided Practice', de: 'Geführte Übung' },
        instructions: {
          en: 'Practice using indefinite articles (ein, eine) and their negations (kein, keine).',
          de: 'Übe die Verwendung unbestimmter Artikel (ein, eine) und ihrer Verneinungen (kein, keine).',
        },
        exercises: [
          {
            type: 'multiple-choice',
            question: { en: 'Complete: Das ist ___ Mann. (a man)', de: 'Ergänze: Das ist ___ Mann. (a man)' },
            options: ['ein', 'eine', 'einen'],
            correct: 0,
            explanation: {
              en: '"Mann" is masculine, so we use "ein" in the nominative case.',
              de: '"Mann" ist maskulin, also benutzen wir "ein" im Nominativ.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Complete: Das ist ___ Frau. (a woman)', de: 'Ergänze: Das ist ___ Frau. (a woman)' },
            options: ['ein', 'eine', 'einen'],
            correct: 1,
            explanation: {
              en: '"Frau" is feminine, so we use "eine".',
              de: '"Frau" ist feminin, also benutzen wir "eine".',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Complete: Das ist ___ Kind. (a child)', de: 'Ergänze: Das ist ___ Kind. (a child)' },
            options: ['ein', 'eine', 'einen'],
            correct: 0,
            explanation: {
              en: '"Kind" is neuter, and neuter uses "ein" (same as masculine in nominative).',
              de: '"Kind" ist neutral, und neutral benutzt "ein" (wie maskulin im Nominativ).',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Das ist ___ Problem. (not a problem)', de: 'Das ist ___ Problem. (kein Problem)' },
            answer: 'kein',
            acceptableAnswers: ['kein', 'Kein'],
            explanation: {
              en: '"Problem" is neuter, so we use "kein" for negation.',
              de: '"Problem" ist neutral, also benutzen wir "kein" für die Verneinung.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Complete: Ich habe ___ Zeit. (no time)', de: 'Ergänze: Ich habe ___ Zeit. (keine Zeit)' },
            options: ['kein', 'keine', 'keinen'],
            correct: 1,
            explanation: {
              en: '"Zeit" is feminine, so we use "keine" for negation.',
              de: '"Zeit" ist feminin, also benutzen wir "keine" für die Verneinung.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Ich brauche ___ Auto. (a car - neuter)', de: 'Ich brauche ___ Auto. (ein Auto - neutral)' },
            answer: 'ein',
            acceptableAnswers: ['ein', 'Ein'],
            explanation: {
              en: '"Auto" is neuter: ein Auto.',
              de: '"Auto" ist neutral: ein Auto.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'How do you say "Those are books" (plural, no article)?', de: 'Wie sagt man "Those are books" (Plural, kein Artikel)?' },
            options: ['Das sind ein Bücher', 'Das sind eine Bücher', 'Das sind Bücher'],
            correct: 2,
            explanation: {
              en: 'There is no plural indefinite article in German - just use the noun alone.',
              de: 'Es gibt keinen unbestimmten Artikel im Plural - benutze nur das Nomen allein.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Das ist ___ Lampe. (a lamp - feminine)', de: 'Das ist ___ Lampe. (eine Lampe - feminin)' },
            answer: 'eine',
            acceptableAnswers: ['eine', 'Eine'],
            explanation: {
              en: '"Lampe" is feminine: eine Lampe.',
              de: '"Lampe" ist feminin: eine Lampe.',
            },
          },
        ],
      },
      stage5: {
        title: { en: 'Mastery Challenge', de: 'Meisterschaftsprüfung' },
        instructions: {
          en: 'Complete these advanced exercises to master indefinite articles.',
          de: 'Schließe diese fortgeschrittenen Übungen ab, um unbestimmte Artikel zu meistern.',
        },
        exercises: [
          {
            type: 'word-order',
            question: { en: 'Create: "That is a man" - Mann / ist / ein / Das', de: 'Bilde: "That is a man" - Mann / ist / ein / Das' },
            words: ['ein', 'Das', 'Mann', 'ist'],
            correctOrder: ['Das', 'ist', 'ein', 'Mann'],
            explanation: {
              en: 'Das ist ein Mann. Standard structure for "This is a..." sentences.',
              de: 'Das ist ein Mann. Standardstruktur für "Das ist ein..." Sätze.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Translate: "I have a dog." (masculine)', de: 'Übersetze: "I have a dog." (maskulin)' },
            answer: 'Ich habe einen Hund',
            acceptableAnswers: ['Ich habe einen Hund', 'Ich habe einen Hund.', 'ich habe einen Hund'],
            explanation: {
              en: 'Ich habe einen Hund. After "haben", the object is accusative, so "ein" becomes "einen" for masculine.',
              de: 'Ich habe einen Hund. Nach "haben" steht das Objekt im Akkusativ, also wird "ein" zu "einen" für maskulin.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Translate: "That is not a problem."', de: 'Übersetze: "That is not a problem."' },
            answer: 'Das ist kein Problem',
            acceptableAnswers: ['Das ist kein Problem', 'Das ist kein Problem.', 'das ist kein Problem'],
            explanation: {
              en: 'Das ist kein Problem. "Problem" is neuter, so "kein" (not "keine").',
              de: 'Das ist kein Problem. "Problem" ist neutral, also "kein" (nicht "keine").',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Create: "I have no time" - Zeit / habe / keine / Ich', de: 'Bilde: "I have no time" - Zeit / habe / keine / Ich' },
            words: ['keine', 'Ich', 'Zeit', 'habe'],
            correctOrder: ['Ich', 'habe', 'keine', 'Zeit'],
            explanation: {
              en: 'Ich habe keine Zeit. Subject + Verb + Object structure.',
              de: 'Ich habe keine Zeit. Subjekt + Verb + Objekt Struktur.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "She is a student." (female)', de: 'Schreibe: "She is a student." (weiblich)' },
            answer: 'Sie ist Studentin',
            acceptableAnswers: ['Sie ist Studentin', 'Sie ist Studentin.', 'sie ist Studentin', 'Sie ist eine Studentin'],
            explanation: {
              en: 'Sie ist Studentin. No article needed for professions in German!',
              de: 'Sie ist Studentin. Kein Artikel für Berufe im Deutschen nötig!',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Create: "That is a woman" - Frau / ist / Das / eine', de: 'Bilde: "That is a woman" - Frau / ist / Das / eine' },
            words: ['eine', 'ist', 'Das', 'Frau'],
            correctOrder: ['Das', 'ist', 'eine', 'Frau'],
            explanation: {
              en: 'Das ist eine Frau. Feminine nouns use "eine".',
              de: 'Das ist eine Frau. Feminine Nomen benutzen "eine".',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "I need a car."', de: 'Schreibe: "I need a car."' },
            answer: 'Ich brauche ein Auto',
            acceptableAnswers: ['Ich brauche ein Auto', 'Ich brauche ein Auto.', 'ich brauche ein Auto'],
            explanation: {
              en: 'Ich brauche ein Auto. "Auto" is neuter, so "ein" (no change in accusative for neuter).',
              de: 'Ich brauche ein Auto. "Auto" ist neutral, also "ein" (keine Änderung im Akkusativ für neutral).',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "He has no idea." (keine Ahnung)', de: 'Schreibe: "He has no idea." (keine Ahnung)' },
            answer: 'Er hat keine Ahnung',
            acceptableAnswers: ['Er hat keine Ahnung', 'Er hat keine Ahnung.', 'er hat keine Ahnung'],
            explanation: {
              en: 'Er hat keine Ahnung. "Ahnung" is feminine, so "keine".',
              de: 'Er hat keine Ahnung. "Ahnung" ist feminin, also "keine".',
            },
          },
        ],
      },
    },

    'personal-pronouns': {
      stage1: {
        title: { en: 'Personal Pronouns', de: 'Personalpronomen' },
        introduction: {
          en: 'German personal pronouns are similar to English (I, you, he, she, etc.), but German has more forms. Most notably, German distinguishes between formal "you" (Sie) and informal "you" (du/ihr). Using the right form is important for politeness!',
          de: 'Deutsche Personalpronomen sind ähnlich wie im Englischen (ich, du, er, sie, etc.), aber Deutsch hat mehr Formen. Besonders wichtig: Deutsch unterscheidet zwischen formellem "Sie" und informellem "du/ihr". Die richtige Form zu benutzen ist wichtig für Höflichkeit!',
        },
        keyPoints: [
          { en: 'ich (I), du (you informal), er/sie/es (he/she/it)', de: 'ich (I), du (you informal), er/sie/es (he/she/it)' },
          { en: 'wir (we), ihr (you all informal), sie (they)', de: 'wir (we), ihr (you all informal), sie (they)' },
          { en: 'Sie (formal you) - always capitalized!', de: 'Sie (formelles Sie) - immer großgeschrieben!' },
          { en: 'Use du with friends, family, children; Sie with strangers, officials', de: 'Benutze du mit Freunden, Familie, Kindern; Sie mit Fremden, Beamten' },
        ],
      },
      stage2: {
        title: { en: 'Pronouns in Context', de: 'Pronomen im Kontext' },
        examples: [
          { german: 'Ich komme aus Deutschland.', translation: 'I come from Germany.', pronunciation: 'ikh KOM-meh ows DOYCH-lahnt', audioHint: 'ich - I' },
          { german: 'Du bist mein Freund.', translation: 'You are my friend. (informal)', pronunciation: 'doo bist mine froynt', audioHint: 'du - informal you' },
          { german: 'Er ist Lehrer.', translation: 'He is a teacher.', pronunciation: 'air ist LAY-rer', audioHint: 'er - he' },
          { german: 'Sie ist Ärztin.', translation: 'She is a doctor.', pronunciation: 'zee ist AIRTS-tin', audioHint: 'sie - she' },
          { german: 'Es ist kalt.', translation: 'It is cold.', pronunciation: 'es ist kahlt', audioHint: 'es - it' },
          { german: 'Wir lernen Deutsch.', translation: 'We are learning German.', pronunciation: 'veer LAIR-nen doych', audioHint: 'wir - we' },
          { german: 'Ihr seid nett.', translation: 'You all are nice. (informal)', pronunciation: 'eer zyte net', audioHint: 'ihr - you all (informal)' },
          { german: 'Sind Sie Herr Müller?', translation: 'Are you Mr. Müller? (formal)', pronunciation: 'zint zee hair MYOO-ler', audioHint: 'Sie - formal you (capitalized!)' },
        ],
      },
      stage3: {
        title: { en: 'Pronoun Reference Chart', de: 'Pronomen-Übersicht' },
        tables: [
          {
            title: { en: 'Personal Pronouns (Nominative)', de: 'Personalpronomen (Nominativ)' },
            headers: [
              { en: 'Person', de: 'Person' },
              { en: 'Singular', de: 'Singular' },
              { en: 'Plural', de: 'Plural' },
            ],
            rows: [
              ['1st person', 'ich (I)', 'wir (we)'],
              ['2nd person informal', 'du (you)', 'ihr (you all)'],
              ['2nd person formal', 'Sie (you)', 'Sie (you all)'],
              ['3rd person', 'er/sie/es (he/she/it)', 'sie (they)'],
            ],
          },
          {
            title: { en: 'When to Use du vs. Sie', de: 'Wann du vs. Sie verwenden' },
            headers: [
              { en: 'Use du/ihr', de: 'Benutze du/ihr' },
              { en: 'Use Sie', de: 'Benutze Sie' },
            ],
            rows: [
              ['Friends, family', 'Strangers, first meetings'],
              ['Children (under ~16)', 'Older adults you don\'t know'],
              ['Students among themselves', 'Teachers, professors'],
              ['Informal settings', 'Professional, formal settings'],
            ],
          },
        ],
        tips: [
          { en: 'When in doubt, use "Sie" - it\'s polite and safe', de: 'Im Zweifel benutze "Sie" - es ist höflich und sicher' },
          { en: 'Germans often say "Wir können uns duzen" to switch to informal', de: 'Deutsche sagen oft "Wir können uns duzen" um zum informellen zu wechseln' },
        ],
        warnings: [
          { en: 'sie (lowercase) = she/they; Sie (uppercase) = formal you. Context matters!', de: 'sie (kleingeschrieben) = sie/they; Sie (großgeschrieben) = formelles Sie. Kontext ist wichtig!' },
        ],
      },
      stage4: {
        title: { en: 'Guided Practice', de: 'Geführte Übung' },
        instructions: {
          en: 'Practice using personal pronouns correctly. Pay attention to formal vs. informal forms.',
          de: 'Übe die korrekte Verwendung von Personalpronomen. Achte auf formelle vs. informelle Formen.',
        },
        exercises: [
          {
            type: 'multiple-choice',
            question: { en: 'Which pronoun means "I"?', de: 'Welches Pronomen bedeutet "I"?' },
            options: ['du', 'ich', 'er', 'wir'],
            correct: 1,
            explanation: {
              en: '"ich" means "I" - the first person singular pronoun.',
              de: '"ich" bedeutet "I" - das Personalpronomen der ersten Person Singular.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Which pronoun would you use with a close friend?', de: 'Welches Pronomen würdest du mit einem guten Freund benutzen?' },
            options: ['Sie', 'du', 'ihr', 'wir'],
            correct: 1,
            explanation: {
              en: 'Use "du" with friends, family, and children - it\'s the informal singular "you".',
              de: 'Benutze "du" mit Freunden, Familie und Kindern - es ist das informelle "du" im Singular.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Which pronoun is formal "you"?', de: 'Welches Pronomen ist das formelle "Sie"?' },
            options: ['du', 'ihr', 'Sie', 'sie'],
            correct: 2,
            explanation: {
              en: '"Sie" (capitalized) is the formal "you" - used with strangers and in professional settings.',
              de: '"Sie" (großgeschrieben) ist das formelle "Sie" - benutzt mit Fremden und in professionellen Situationen.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: '___ komme aus Deutschland. (I come from Germany)', de: '___ komme aus Deutschland.' },
            answer: 'Ich',
            acceptableAnswers: ['Ich', 'ich'],
            explanation: {
              en: 'Ich komme aus Deutschland. "Ich" is always capitalized at the start of a sentence.',
              de: 'Ich komme aus Deutschland. "Ich" wird am Satzanfang immer großgeschrieben.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'What does "sie" (lowercase) mean?', de: 'Was bedeutet "sie" (kleingeschrieben)?' },
            options: ['she only', 'they only', 'she or they', 'formal you'],
            correct: 2,
            explanation: {
              en: '"sie" (lowercase) can mean either "she" or "they" - context determines which!',
              de: '"sie" (kleingeschrieben) kann entweder "sie" (she) oder "sie" (they) bedeuten - der Kontext bestimmt es!',
            },
          },
          {
            type: 'fill-blank',
            question: { en: '___ seid meine Freunde. (You all are - informal plural)', de: '___ seid meine Freunde. (Ihr seid)' },
            answer: 'Ihr',
            acceptableAnswers: ['Ihr', 'ihr'],
            explanation: {
              en: '"Ihr" is informal plural "you" - used when addressing multiple friends/family.',
              de: '"Ihr" ist informelles Plural-"du" - benutzt wenn man mehrere Freunde/Familie anspricht.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'When meeting your professor for the first time, you should use:', de: 'Wenn du deinen Professor zum ersten Mal triffst, solltest du benutzen:' },
            options: ['du', 'ihr', 'Sie', 'wir'],
            correct: 2,
            explanation: {
              en: 'Always use "Sie" with professors, officials, and strangers - it shows respect.',
              de: 'Benutze immer "Sie" mit Professoren, Beamten und Fremden - es zeigt Respekt.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: '___ lernen Deutsch. (We are learning German)', de: '___ lernen Deutsch.' },
            answer: 'Wir',
            acceptableAnswers: ['Wir', 'wir'],
            explanation: {
              en: 'Wir lernen Deutsch. "Wir" is "we" in German.',
              de: 'Wir lernen Deutsch. "Wir" bedeutet "we" im Deutschen.',
            },
          },
        ],
      },
      stage5: {
        title: { en: 'Mastery Challenge', de: 'Meisterschaftsprüfung' },
        instructions: {
          en: 'Complete these advanced exercises to master personal pronouns.',
          de: 'Schließe diese fortgeschrittenen Übungen ab, um Personalpronomen zu meistern.',
        },
        exercises: [
          {
            type: 'word-order',
            question: { en: 'Order pronouns: 1st person, 2nd informal, 2nd formal', de: 'Ordne Pronomen: 1. Person, 2. informell, 2. formell' },
            words: ['Sie', 'ich', 'du'],
            correctOrder: ['ich', 'du', 'Sie'],
            explanation: {
              en: 'ich (1st person I), du (2nd informal), Sie (2nd formal).',
              de: 'ich (1. Person), du (2. Person informell), Sie (2. Person formell).',
            },
          },
          {
            type: 'translation',
            question: { en: 'Translate: "She is a doctor."', de: 'Übersetze: "She is a doctor."' },
            answer: 'Sie ist Ärztin',
            acceptableAnswers: ['Sie ist Ärztin', 'Sie ist Ärztin.', 'sie ist Ärztin'],
            explanation: {
              en: 'Sie ist Ärztin. "Sie" (she) + verb "ist" + profession (no article).',
              de: 'Sie ist Ärztin. "Sie" + Verb "ist" + Beruf (kein Artikel).',
            },
          },
          {
            type: 'translation',
            question: { en: 'Translate: "Are you Mr. Müller?" (formal)', de: 'Übersetze: "Are you Mr. Müller?" (formell)' },
            answer: 'Sind Sie Herr Müller',
            acceptableAnswers: ['Sind Sie Herr Müller', 'Sind Sie Herr Müller?', 'sind Sie Herr Müller'],
            explanation: {
              en: 'Sind Sie Herr Müller? Verb-first for questions, "Sie" for formal.',
              de: 'Sind Sie Herr Müller? Verb am Anfang für Fragen, "Sie" für formell.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Create: "We are learning German" - Deutsch / lernen / Wir', de: 'Bilde: "We are learning German" - Deutsch / lernen / Wir' },
            words: ['lernen', 'Wir', 'Deutsch'],
            correctOrder: ['Wir', 'lernen', 'Deutsch'],
            explanation: {
              en: 'Wir lernen Deutsch. Subject + Verb + Object.',
              de: 'Wir lernen Deutsch. Subjekt + Verb + Objekt.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "He is a teacher."', de: 'Schreibe: "He is a teacher."' },
            answer: 'Er ist Lehrer',
            acceptableAnswers: ['Er ist Lehrer', 'Er ist Lehrer.', 'er ist Lehrer'],
            explanation: {
              en: 'Er ist Lehrer. No article before professions in German.',
              de: 'Er ist Lehrer. Kein Artikel vor Berufen im Deutschen.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Order: all 3rd person pronouns (he, she, it)', de: 'Ordne: alle 3. Person Pronomen (er, sie, es)' },
            words: ['es', 'sie', 'er'],
            correctOrder: ['er', 'sie', 'es'],
            explanation: {
              en: 'er (he), sie (she), es (it) - the three 3rd person singular pronouns.',
              de: 'er, sie, es - die drei Personalpronomen der 3. Person Singular.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "You are my friend." (informal)', de: 'Schreibe: "You are my friend." (informell)' },
            answer: 'Du bist mein Freund',
            acceptableAnswers: ['Du bist mein Freund', 'Du bist mein Freund.', 'du bist mein Freund', 'Du bist meine Freundin'],
            explanation: {
              en: 'Du bist mein Freund. Use "du" for informal singular.',
              de: 'Du bist mein Freund. Benutze "du" für informelles Singular.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "They are nice." (about a group)', de: 'Schreibe: "They are nice." (über eine Gruppe)' },
            answer: 'Sie sind nett',
            acceptableAnswers: ['Sie sind nett', 'Sie sind nett.', 'sie sind nett'],
            explanation: {
              en: 'Sie sind nett. "sie" (lowercase) for "they".',
              de: 'Sie sind nett. "sie" (kleingeschrieben) für "they".',
            },
          },
        ],
      },
    },

    'verb-sein': {
      stage1: {
        title: { en: 'The Verb "sein" (to be)', de: 'Das Verb "sein"' },
        introduction: {
          en: '"Sein" (to be) is the most important German verb. It\'s highly irregular - each form looks completely different! You\'ll use it constantly for introductions, descriptions, professions, and linking ideas.',
          de: '"Sein" ist das wichtigste deutsche Verb. Es ist stark unregelmäßig - jede Form sieht völlig anders aus! Du wirst es ständig für Vorstellungen, Beschreibungen, Berufe und Verknüpfungen benutzen.',
        },
        keyPoints: [
          { en: 'ich bin (I am), du bist (you are), er/sie/es ist (he/she/it is)', de: 'ich bin (I am), du bist (you are), er/sie/es ist (he/she/it is)' },
          { en: 'wir sind (we are), ihr seid (you all are), sie/Sie sind (they/formal you are)', de: 'wir sind (we are), ihr seid (you all are), sie/Sie sind (they/formal you are)' },
          { en: 'Each form must be memorized - no patterns!', de: 'Jede Form muss auswendig gelernt werden - keine Muster!' },
        ],
      },
      stage2: {
        title: { en: 'Using "sein"', de: '"sein" verwenden' },
        examples: [
          { german: 'Ich bin müde.', translation: 'I am tired.', pronunciation: 'ikh bin MOO-deh', audioHint: 'ich bin - I am' },
          { german: 'Du bist klug.', translation: 'You are smart.', pronunciation: 'doo bist klook', audioHint: 'du bist - you are' },
          { german: 'Er ist aus Berlin.', translation: 'He is from Berlin.', pronunciation: 'air ist ows bair-LEEN', audioHint: 'er ist - he is' },
          { german: 'Sie ist Studentin.', translation: 'She is a student.', pronunciation: 'zee ist shtoo-DEN-tin', audioHint: 'sie ist - she is (no article for professions!)' },
          { german: 'Es ist wichtig.', translation: 'It is important.', pronunciation: 'es ist VIKH-tikh', audioHint: 'es ist - it is' },
          { german: 'Wir sind Freunde.', translation: 'We are friends.', pronunciation: 'veer zint FROYN-deh', audioHint: 'wir sind - we are' },
          { german: 'Ihr seid willkommen.', translation: 'You all are welcome.', pronunciation: 'eer zyte vil-KOM-men', audioHint: 'ihr seid - you all are' },
          { german: 'Sie sind sehr nett.', translation: 'They/You (formal) are very nice.', pronunciation: 'zee zint zair net', audioHint: 'sie sind - they are / Sie sind - you (formal) are' },
        ],
      },
      stage3: {
        title: { en: 'Conjugation of "sein"', de: 'Konjugation von "sein"' },
        tables: [
          {
            title: { en: 'Present Tense', de: 'Präsens' },
            headers: [
              { en: 'Pronoun', de: 'Pronomen' },
              { en: 'Form', de: 'Form' },
              { en: 'Example', de: 'Beispiel' },
            ],
            rows: [
              ['ich', 'bin', 'Ich bin hier. (I am here.)'],
              ['du', 'bist', 'Du bist toll. (You are great.)'],
              ['er/sie/es', 'ist', 'Es ist kalt. (It is cold.)'],
              ['wir', 'sind', 'Wir sind da. (We are there.)'],
              ['ihr', 'seid', 'Ihr seid laut. (You all are loud.)'],
              ['sie/Sie', 'sind', 'Sie sind Lehrer. (They are teachers.)'],
            ],
          },
        ],
        tips: [
          { en: 'No article before professions: "Ich bin Lehrer" (not "Ich bin ein Lehrer")', de: 'Kein Artikel vor Berufen: "Ich bin Lehrer" (nicht "Ich bin ein Lehrer")' },
          { en: 'Practice the forms as a song: bin-bist-ist-sind-seid-sind', de: 'Übe die Formen als Lied: bin-bist-ist-sind-seid-sind' },
        ],
        warnings: [
          { en: '"sein" is completely irregular - memorize each form!', de: '"sein" ist völlig unregelmäßig - lerne jede Form auswendig!' },
        ],
      },
      stage4: {
        title: { en: 'Guided Practice', de: 'Geführte Übung' },
        instructions: {
          en: 'Practice conjugating "sein" (to be). Choose the correct form for each pronoun.',
          de: 'Übe die Konjugation von "sein". Wähle die richtige Form für jedes Pronomen.',
        },
        exercises: [
          {
            type: 'multiple-choice',
            question: { en: 'Ich ___ müde. (I am tired)', de: 'Ich ___ müde.' },
            options: ['bin', 'bist', 'ist', 'sind'],
            correct: 0,
            explanation: {
              en: 'ich bin - "bin" is the form for "ich" (I am).',
              de: 'ich bin - "bin" ist die Form für "ich".',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Du ___ klug. (You are smart)', de: 'Du ___ klug.' },
            options: ['bin', 'bist', 'ist', 'sind'],
            correct: 1,
            explanation: {
              en: 'du bist - "bist" is the form for "du" (informal you).',
              de: 'du bist - "bist" ist die Form für "du".',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Er ___ Lehrer. (He is a teacher)', de: 'Er ___ Lehrer.' },
            options: ['bin', 'bist', 'ist', 'sind'],
            correct: 2,
            explanation: {
              en: 'er ist - "ist" is the form for "er/sie/es" (he/she/it).',
              de: 'er ist - "ist" ist die Form für "er/sie/es".',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Wir ___ Freunde. (We are friends)', de: 'Wir ___ Freunde.' },
            answer: 'sind',
            acceptableAnswers: ['sind', 'Sind'],
            explanation: {
              en: 'wir sind - "sind" is used with "wir" (we).',
              de: 'wir sind - "sind" wird mit "wir" benutzt.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Ihr ___ willkommen. (You all are welcome)', de: 'Ihr ___ willkommen.' },
            options: ['bin', 'bist', 'seid', 'sind'],
            correct: 2,
            explanation: {
              en: 'ihr seid - "seid" is the form for "ihr" (informal plural you).',
              de: 'ihr seid - "seid" ist die Form für "ihr".',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Sie ___ nett. (They are nice)', de: 'Sie ___ nett.' },
            answer: 'sind',
            acceptableAnswers: ['sind', 'Sind'],
            explanation: {
              en: 'sie sind - "sind" is used with "sie" (they) and formal "Sie".',
              de: 'sie sind - "sind" wird mit "sie" (they) und formellem "Sie" benutzt.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Es ___ kalt. (It is cold)', de: 'Es ___ kalt.' },
            options: ['bin', 'bist', 'ist', 'sind'],
            correct: 2,
            explanation: {
              en: 'es ist - "ist" is used with "es" (it).',
              de: 'es ist - "ist" wird mit "es" benutzt.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Sind Sie Herr Müller? – Ja, ich ___ Herr Müller.', de: 'Sind Sie Herr Müller? – Ja, ich ___ Herr Müller.' },
            answer: 'bin',
            acceptableAnswers: ['bin', 'Bin'],
            explanation: {
              en: 'ich bin - responding about yourself uses "bin".',
              de: 'ich bin - wenn du über dich selbst antwortest, benutze "bin".',
            },
          },
        ],
      },
      stage5: {
        title: { en: 'Mastery Challenge', de: 'Meisterschaftsprüfung' },
        instructions: {
          en: 'Complete these advanced exercises to master the verb "sein".',
          de: 'Schließe diese fortgeschrittenen Übungen ab, um das Verb "sein" zu meistern.',
        },
        exercises: [
          {
            type: 'word-order',
            question: { en: 'Create: "I am tired" - müde / bin / Ich', de: 'Bilde: "I am tired" - müde / bin / Ich' },
            words: ['müde', 'Ich', 'bin'],
            correctOrder: ['Ich', 'bin', 'müde'],
            explanation: {
              en: 'Ich bin müde. Subject + verb + adjective.',
              de: 'Ich bin müde. Subjekt + Verb + Adjektiv.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Translate: "She is a doctor."', de: 'Übersetze: "She is a doctor."' },
            answer: 'Sie ist Ärztin',
            acceptableAnswers: ['Sie ist Ärztin', 'Sie ist Ärztin.', 'sie ist Ärztin'],
            explanation: {
              en: 'Sie ist Ärztin. No article before professions!',
              de: 'Sie ist Ärztin. Kein Artikel vor Berufen!',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Order the conjugation: ich, du, er forms', de: 'Ordne die Konjugation: ich, du, er Formen' },
            words: ['ist', 'bist', 'bin'],
            correctOrder: ['bin', 'bist', 'ist'],
            explanation: {
              en: 'bin (ich), bist (du), ist (er/sie/es).',
              de: 'bin (ich), bist (du), ist (er/sie/es).',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "We are friends."', de: 'Schreibe: "We are friends."' },
            answer: 'Wir sind Freunde',
            acceptableAnswers: ['Wir sind Freunde', 'Wir sind Freunde.', 'wir sind Freunde'],
            explanation: {
              en: 'Wir sind Freunde. "wir" uses "sind".',
              de: 'Wir sind Freunde. "wir" benutzt "sind".',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "You are welcome." (informal plural)', de: 'Schreibe: "You are welcome." (informell Plural)' },
            answer: 'Ihr seid willkommen',
            acceptableAnswers: ['Ihr seid willkommen', 'Ihr seid willkommen.', 'ihr seid willkommen'],
            explanation: {
              en: 'Ihr seid willkommen. "ihr" uses "seid".',
              de: 'Ihr seid willkommen. "ihr" benutzt "seid".',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Create a question: "Are you a teacher?" (formal)', de: 'Bilde eine Frage: "Are you a teacher?" (formell)' },
            words: ['Lehrer', 'Sie', 'Sind'],
            correctOrder: ['Sind', 'Sie', 'Lehrer'],
            explanation: {
              en: 'Sind Sie Lehrer? Verb first for yes/no questions.',
              de: 'Sind Sie Lehrer? Verb am Anfang für Ja/Nein-Fragen.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "It is important."', de: 'Schreibe: "It is important."' },
            answer: 'Es ist wichtig',
            acceptableAnswers: ['Es ist wichtig', 'Es ist wichtig.', 'es ist wichtig'],
            explanation: {
              en: 'Es ist wichtig. "es" uses "ist".',
              de: 'Es ist wichtig. "es" benutzt "ist".',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Order wir, ihr, sie/Sie forms:', de: 'Ordne wir, ihr, sie/Sie Formen:' },
            words: ['sind', 'seid', 'sind'],
            correctOrder: ['sind', 'seid', 'sind'],
            explanation: {
              en: 'sind (wir), seid (ihr), sind (sie/Sie). Note: wir and sie/Sie share "sind".',
              de: 'sind (wir), seid (ihr), sind (sie/Sie). Beachte: wir und sie/Sie teilen "sind".',
            },
          },
        ],
      },
    },

    'verb-haben': {
      stage1: {
        title: { en: 'The Verb "haben" (to have)', de: 'Das Verb "haben"' },
        introduction: {
          en: '"Haben" (to have) is the second most important German verb. While not as irregular as "sein", it has some special forms. You\'ll use it to express possession, age, and later to form past tenses.',
          de: '"Haben" ist das zweitwichtigste deutsche Verb. Obwohl es nicht so unregelmäßig wie "sein" ist, hat es einige besondere Formen. Du wirst es benutzen um Besitz, Alter auszudrücken und später um Vergangenheitsformen zu bilden.',
        },
        keyPoints: [
          { en: 'ich habe, du hast, er/sie/es hat', de: 'ich habe, du hast, er/sie/es hat' },
          { en: 'wir haben, ihr habt, sie/Sie haben', de: 'wir haben, ihr habt, sie/Sie haben' },
          { en: 'Note: "du hast" and "er hat" drop the -b-!', de: 'Beachte: "du hast" und "er hat" verlieren das -b-!' },
        ],
      },
      stage2: {
        title: { en: 'Using "haben"', de: '"haben" verwenden' },
        examples: [
          { german: 'Ich habe ein Auto.', translation: 'I have a car.', pronunciation: 'ikh HAH-beh ine OW-toh', audioHint: 'ich habe - I have' },
          { german: 'Du hast Recht.', translation: 'You are right. (lit: You have right)', pronunciation: 'doo hahst rekht', audioHint: 'du hast - you have' },
          { german: 'Er hat Hunger.', translation: 'He is hungry. (lit: He has hunger)', pronunciation: 'air haht HOONG-er', audioHint: 'er hat - he has' },
          { german: 'Sie hat Zeit.', translation: 'She has time.', pronunciation: 'zee haht tsyte', audioHint: 'sie hat - she has' },
          { german: 'Wir haben Glück.', translation: 'We are lucky. (lit: We have luck)', pronunciation: 'veer HAH-ben glyook', audioHint: 'wir haben - we have' },
          { german: 'Ihr habt viele Bücher.', translation: 'You all have many books.', pronunciation: 'eer hahpt FEE-leh BYOO-kher', audioHint: 'ihr habt - you all have' },
          { german: 'Sie haben drei Kinder.', translation: 'They have three children.', pronunciation: 'zee HAH-ben dry KIN-der', audioHint: 'sie haben - they have' },
          { german: 'Ich habe keine Ahnung.', translation: 'I have no idea.', pronunciation: 'ikh HAH-beh KINE-eh AH-noong', audioHint: 'common expression' },
        ],
      },
      stage3: {
        title: { en: 'Conjugation of "haben"', de: 'Konjugation von "haben"' },
        tables: [
          {
            title: { en: 'Present Tense', de: 'Präsens' },
            headers: [
              { en: 'Pronoun', de: 'Pronomen' },
              { en: 'Form', de: 'Form' },
              { en: 'Example', de: 'Beispiel' },
            ],
            rows: [
              ['ich', 'habe', 'Ich habe Durst. (I am thirsty.)'],
              ['du', 'hast', 'Hast du Zeit? (Do you have time?)'],
              ['er/sie/es', 'hat', 'Sie hat Angst. (She is afraid.)'],
              ['wir', 'haben', 'Wir haben Spaß. (We\'re having fun.)'],
              ['ihr', 'habt', 'Habt ihr Fragen? (Do you have questions?)'],
              ['sie/Sie', 'haben', 'Sie haben Recht. (You\'re right./They\'re right.)'],
            ],
          },
          {
            title: { en: 'Common Expressions with "haben"', de: 'Häufige Ausdrücke mit "haben"' },
            headers: [
              { en: 'German', de: 'Deutsch' },
              { en: 'English', de: 'Englisch' },
            ],
            rows: [
              ['Hunger haben', 'to be hungry'],
              ['Durst haben', 'to be thirsty'],
              ['Angst haben', 'to be afraid'],
              ['Recht haben', 'to be right'],
              ['Zeit haben', 'to have time'],
              ['Glück haben', 'to be lucky'],
            ],
          },
        ],
        tips: [
          { en: 'Many expressions use "haben" where English uses "to be"', de: 'Viele Ausdrücke benutzen "haben" wo Englisch "to be" benutzt' },
          { en: 'Pattern: habe → hast → hat → haben → habt → haben', de: 'Muster: habe → hast → hat → haben → habt → haben' },
        ],
        warnings: [
          { en: 'Don\'t forget: du hast (not habst!), er hat (not habt!)', de: 'Nicht vergessen: du hast (nicht habst!), er hat (nicht habt!)' },
        ],
      },
      stage4: {
        title: { en: 'Guided Practice', de: 'Geführte Übung' },
        instructions: {
          en: 'Practice conjugating "haben" (to have). Choose the correct form for each pronoun.',
          de: 'Übe die Konjugation von "haben". Wähle die richtige Form für jedes Pronomen.',
        },
        exercises: [
          {
            type: 'multiple-choice',
            question: { en: 'Ich ___ ein Auto. (I have a car)', de: 'Ich ___ ein Auto.' },
            options: ['habe', 'hast', 'hat', 'haben'],
            correct: 0,
            explanation: {
              en: 'ich habe - "habe" is the form for "ich" (I have).',
              de: 'ich habe - "habe" ist die Form für "ich".',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Du ___ Recht. (You are right)', de: 'Du ___ Recht.' },
            options: ['habe', 'hast', 'hat', 'haben'],
            correct: 1,
            explanation: {
              en: 'du hast - "hast" is the form for "du". Note: no "b"!',
              de: 'du hast - "hast" ist die Form für "du". Beachte: kein "b"!',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Er ___ Hunger. (He is hungry)', de: 'Er ___ Hunger.' },
            options: ['habe', 'hast', 'hat', 'haben'],
            correct: 2,
            explanation: {
              en: 'er hat - "hat" is the form for "er/sie/es". The -b- is dropped!',
              de: 'er hat - "hat" ist die Form für "er/sie/es". Das -b- fällt weg!',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Wir ___ Glück. (We are lucky)', de: 'Wir ___ Glück.' },
            answer: 'haben',
            acceptableAnswers: ['haben', 'Haben'],
            explanation: {
              en: 'wir haben - "haben" is used with "wir" (same as infinitive).',
              de: 'wir haben - "haben" wird mit "wir" benutzt (wie der Infinitiv).',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Ihr ___ viele Bücher. (You all have many books)', de: 'Ihr ___ viele Bücher.' },
            options: ['habe', 'hast', 'habt', 'haben'],
            correct: 2,
            explanation: {
              en: 'ihr habt - "habt" is the form for "ihr".',
              de: 'ihr habt - "habt" ist die Form für "ihr".',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Sie ___ drei Kinder. (They have three children)', de: 'Sie ___ drei Kinder.' },
            answer: 'haben',
            acceptableAnswers: ['haben', 'Haben'],
            explanation: {
              en: 'sie haben - "haben" is used with "sie" (they) and formal "Sie".',
              de: 'sie haben - "haben" wird mit "sie" (they) und formellem "Sie" benutzt.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Complete: Sie ___ Zeit. (She has time)', de: 'Ergänze: Sie ___ Zeit.' },
            options: ['habe', 'hast', 'hat', 'haben'],
            correct: 2,
            explanation: {
              en: 'sie hat - "hat" for "she". (sie + verb in 3rd person singular)',
              de: 'sie hat - "hat" für "sie". (sie + Verb in 3. Person Singular)',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Ich ___ keine Ahnung. (I have no idea)', de: 'Ich ___ keine Ahnung.' },
            answer: 'habe',
            acceptableAnswers: ['habe', 'Habe'],
            explanation: {
              en: 'Ich habe keine Ahnung - a common expression meaning "I have no idea".',
              de: 'Ich habe keine Ahnung - ein häufiger Ausdruck.',
            },
          },
        ],
      },
      stage5: {
        title: { en: 'Mastery Challenge', de: 'Meisterschaftsprüfung' },
        instructions: {
          en: 'Complete these advanced exercises to master the verb "haben".',
          de: 'Schließe diese fortgeschrittenen Übungen ab, um das Verb "haben" zu meistern.',
        },
        exercises: [
          {
            type: 'word-order',
            question: { en: 'Create: "I have a car" - Auto / habe / ein / Ich', de: 'Bilde: "I have a car" - Auto / habe / ein / Ich' },
            words: ['ein', 'Ich', 'Auto', 'habe'],
            correctOrder: ['Ich', 'habe', 'ein', 'Auto'],
            explanation: {
              en: 'Ich habe ein Auto. Subject + verb + article + object.',
              de: 'Ich habe ein Auto. Subjekt + Verb + Artikel + Objekt.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Translate: "He is hungry." (using haben)', de: 'Übersetze: "He is hungry." (mit haben)' },
            answer: 'Er hat Hunger',
            acceptableAnswers: ['Er hat Hunger', 'Er hat Hunger.', 'er hat Hunger'],
            explanation: {
              en: 'Er hat Hunger. German uses "haben" + noun for many expressions.',
              de: 'Er hat Hunger. Deutsch benutzt "haben" + Nomen für viele Ausdrücke.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Order the conjugation: ich, du, er forms', de: 'Ordne die Konjugation: ich, du, er Formen' },
            words: ['hat', 'hast', 'habe'],
            correctOrder: ['habe', 'hast', 'hat'],
            explanation: {
              en: 'habe (ich), hast (du), hat (er/sie/es).',
              de: 'habe (ich), hast (du), hat (er/sie/es).',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "Do you have time?" (informal)', de: 'Schreibe: "Do you have time?" (informell)' },
            answer: 'Hast du Zeit',
            acceptableAnswers: ['Hast du Zeit', 'Hast du Zeit?', 'hast du Zeit'],
            explanation: {
              en: 'Hast du Zeit? Verb first for yes/no questions.',
              de: 'Hast du Zeit? Verb am Anfang für Ja/Nein-Fragen.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "We are lucky."', de: 'Schreibe: "We are lucky."' },
            answer: 'Wir haben Glück',
            acceptableAnswers: ['Wir haben Glück', 'Wir haben Glück.', 'wir haben Glück'],
            explanation: {
              en: 'Wir haben Glück. "to be lucky" = "Glück haben" in German.',
              de: 'Wir haben Glück. "to be lucky" = "Glück haben" auf Deutsch.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Create question: "Do you have questions?" (ihr)', de: 'Bilde Frage: "Do you have questions?" (ihr)' },
            words: ['Fragen', 'ihr', 'Habt'],
            correctOrder: ['Habt', 'ihr', 'Fragen'],
            explanation: {
              en: 'Habt ihr Fragen? Verb first for questions.',
              de: 'Habt ihr Fragen? Verb am Anfang für Fragen.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "She is afraid." (Angst haben)', de: 'Schreibe: "She is afraid." (Angst haben)' },
            answer: 'Sie hat Angst',
            acceptableAnswers: ['Sie hat Angst', 'Sie hat Angst.', 'sie hat Angst'],
            explanation: {
              en: 'Sie hat Angst. "to be afraid" = "Angst haben".',
              de: 'Sie hat Angst. "to be afraid" = "Angst haben".',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Order wir, ihr, sie forms:', de: 'Ordne wir, ihr, sie Formen:' },
            words: ['haben', 'haben', 'habt'],
            correctOrder: ['haben', 'habt', 'haben'],
            explanation: {
              en: 'haben (wir), habt (ihr), haben (sie/Sie).',
              de: 'haben (wir), habt (ihr), haben (sie/Sie).',
            },
          },
        ],
      },
    },

    'present-tense-regular': {
      stage1: {
        title: { en: 'Present Tense - Regular Verbs', de: 'Präsens - Regelmäßige Verben' },
        introduction: {
          en: 'Regular German verbs follow a predictable pattern: remove -en from the infinitive to get the stem, then add the appropriate endings for each person. Once you know this pattern, you can conjugate thousands of verbs!',
          de: 'Regelmäßige deutsche Verben folgen einem vorhersehbaren Muster: Entferne -en vom Infinitiv um den Stamm zu bekommen, dann füge die passenden Endungen für jede Person hinzu. Sobald du dieses Muster kennst, kannst du tausende Verben konjugieren!',
        },
        keyPoints: [
          { en: 'Remove -en from infinitive to get the stem', de: 'Entferne -en vom Infinitiv um den Stamm zu bekommen' },
          { en: 'Endings: -e, -st, -t, -en, -t, -en', de: 'Endungen: -e, -st, -t, -en, -t, -en' },
          { en: 'Example: spielen → spiel + ending', de: 'Beispiel: spielen → spiel + Endung' },
        ],
      },
      stage2: {
        title: { en: 'Regular Verb Examples', de: 'Beispiele regelmäßiger Verben' },
        examples: [
          { german: 'Ich spiele Fußball.', translation: 'I play soccer.', pronunciation: 'ikh SHPEE-leh FOOS-bahl', audioHint: 'spielen - ich spiele' },
          { german: 'Du lernst Deutsch.', translation: 'You are learning German.', pronunciation: 'doo lairnst doych', audioHint: 'lernen - du lernst' },
          { german: 'Er macht Sport.', translation: 'He does sports.', pronunciation: 'air mahkht shport', audioHint: 'machen - er macht' },
          { german: 'Sie wohnt in Berlin.', translation: 'She lives in Berlin.', pronunciation: 'zee vohnt in bair-LEEN', audioHint: 'wohnen - sie wohnt' },
          { german: 'Wir kaufen Brot.', translation: 'We are buying bread.', pronunciation: 'veer KOW-fen broht', audioHint: 'kaufen - wir kaufen' },
          { german: 'Ihr trinkt Kaffee.', translation: 'You all drink coffee.', pronunciation: 'eer trinkt KAH-feh', audioHint: 'trinken - ihr trinkt' },
          { german: 'Sie arbeiten viel.', translation: 'They work a lot.', pronunciation: 'zee AR-by-ten feel', audioHint: 'arbeiten - sie arbeiten' },
          { german: 'Ich höre Musik.', translation: 'I listen to music.', pronunciation: 'ikh HUR-eh moo-ZEEK', audioHint: 'hören - ich höre' },
        ],
      },
      stage3: {
        title: { en: 'Regular Verb Conjugation Pattern', de: 'Konjugationsmuster regelmäßiger Verben' },
        tables: [
          {
            title: { en: 'Present Tense Endings', de: 'Präsens-Endungen' },
            headers: [
              { en: 'Pronoun', de: 'Pronomen' },
              { en: 'Ending', de: 'Endung' },
              { en: 'spielen (to play)', de: 'spielen' },
              { en: 'lernen (to learn)', de: 'lernen' },
            ],
            rows: [
              ['ich', '-e', 'spiele', 'lerne'],
              ['du', '-st', 'spielst', 'lernst'],
              ['er/sie/es', '-t', 'spielt', 'lernt'],
              ['wir', '-en', 'spielen', 'lernen'],
              ['ihr', '-t', 'spielt', 'lernt'],
              ['sie/Sie', '-en', 'spielen', 'lernen'],
            ],
          },
          {
            title: { en: 'Common Regular Verbs', de: 'Häufige regelmäßige Verben' },
            headers: [
              { en: 'Infinitive', de: 'Infinitiv' },
              { en: 'Meaning', de: 'Bedeutung' },
            ],
            rows: [
              ['machen', 'to do, to make'],
              ['kaufen', 'to buy'],
              ['wohnen', 'to live (reside)'],
              ['hören', 'to hear, to listen'],
              ['fragen', 'to ask'],
              ['sagen', 'to say'],
              ['suchen', 'to search'],
              ['brauchen', 'to need'],
            ],
          },
        ],
        tips: [
          { en: 'The wir, sie/Sie forms are always identical to the infinitive', de: 'Die wir, sie/Sie Formen sind immer identisch mit dem Infinitiv' },
          { en: 'If the stem ends in -t or -d, add an extra -e- before -st and -t (du arbeitest, er arbeitet)', de: 'Wenn der Stamm auf -t oder -d endet, füge ein extra -e- vor -st und -t hinzu (du arbeitest, er arbeitet)' },
        ],
        warnings: [
          { en: 'This pattern is for REGULAR verbs only - irregular verbs like "sein" and "haben" have their own patterns', de: 'Dieses Muster ist nur für REGELMÄSSIGE Verben - unregelmäßige Verben wie "sein" und "haben" haben eigene Muster' },
        ],
      },
      stage4: {
        title: { en: 'Guided Practice', de: 'Geführte Übung' },
        instructions: {
          en: 'Practice conjugating regular verbs in the present tense. Apply the pattern: stem + ending.',
          de: 'Übe die Konjugation regelmäßiger Verben im Präsens. Wende das Muster an: Stamm + Endung.',
        },
        exercises: [
          {
            type: 'multiple-choice',
            question: { en: 'What is the stem of "spielen" (to play)?', de: 'Was ist der Stamm von "spielen"?' },
            options: ['spiel', 'spielen', 'spiele', 'spielst'],
            correct: 0,
            explanation: {
              en: 'Remove -en from spielen → spiel. This stem is used for all conjugations.',
              de: 'Entferne -en von spielen → spiel. Dieser Stamm wird für alle Konjugationen benutzt.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Ich ___ Fußball. (spielen)', de: 'Ich ___ Fußball. (spielen)' },
            options: ['spiel', 'spiele', 'spielst', 'spielt'],
            correct: 1,
            explanation: {
              en: 'ich spiele - stem (spiel) + ending (-e) for "ich".',
              de: 'ich spiele - Stamm (spiel) + Endung (-e) für "ich".',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Du ___ Deutsch. (lernen)', de: 'Du ___ Deutsch. (lernen)' },
            options: ['lerne', 'lernst', 'lernt', 'lernen'],
            correct: 1,
            explanation: {
              en: 'du lernst - stem (lern) + ending (-st) for "du".',
              de: 'du lernst - Stamm (lern) + Endung (-st) für "du".',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Er ___ Sport. (machen - to do)', de: 'Er ___ Sport. (machen)' },
            answer: 'macht',
            acceptableAnswers: ['macht', 'Macht'],
            explanation: {
              en: 'er macht - stem (mach) + ending (-t) for "er/sie/es".',
              de: 'er macht - Stamm (mach) + Endung (-t) für "er/sie/es".',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Wir ___ Brot. (kaufen - to buy)', de: 'Wir ___ Brot. (kaufen)' },
            options: ['kaufe', 'kaufst', 'kauft', 'kaufen'],
            correct: 3,
            explanation: {
              en: 'wir kaufen - the "wir" form is identical to the infinitive!',
              de: 'wir kaufen - die "wir"-Form ist identisch mit dem Infinitiv!',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Ihr ___ Kaffee. (trinken - to drink)', de: 'Ihr ___ Kaffee. (trinken)' },
            answer: 'trinkt',
            acceptableAnswers: ['trinkt', 'Trinkt'],
            explanation: {
              en: 'ihr trinkt - stem (trink) + ending (-t) for "ihr".',
              de: 'ihr trinkt - Stamm (trink) + Endung (-t) für "ihr".',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Du ___ viel. (arbeiten - to work)', de: 'Du ___ viel. (arbeiten)' },
            options: ['arbeitst', 'arbeitest', 'arbeitt', 'arbeit'],
            correct: 1,
            explanation: {
              en: 'du arbeitest - when stem ends in -t, add -est (not just -st).',
              de: 'du arbeitest - wenn der Stamm auf -t endet, füge -est hinzu (nicht nur -st).',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Sie (they) ___ viel. (arbeiten)', de: 'Sie (sie) ___ viel. (arbeiten)' },
            answer: 'arbeiten',
            acceptableAnswers: ['arbeiten', 'Arbeiten'],
            explanation: {
              en: 'sie arbeiten - the "sie/Sie" form is identical to the infinitive.',
              de: 'sie arbeiten - die "sie/Sie"-Form ist identisch mit dem Infinitiv.',
            },
          },
        ],
      },
      stage5: {
        title: { en: 'Mastery Challenge', de: 'Meisterschaftsprüfung' },
        instructions: {
          en: 'Complete these advanced exercises to master regular verb conjugation.',
          de: 'Schließe diese fortgeschrittenen Übungen ab, um die Konjugation regelmäßiger Verben zu meistern.',
        },
        exercises: [
          {
            type: 'word-order',
            question: { en: 'Create: "I play soccer" - Fußball / spiele / Ich', de: 'Bilde: "I play soccer" - Fußball / spiele / Ich' },
            words: ['spiele', 'Fußball', 'Ich'],
            correctOrder: ['Ich', 'spiele', 'Fußball'],
            explanation: {
              en: 'Ich spiele Fußball. Subject + Verb + Object.',
              de: 'Ich spiele Fußball. Subjekt + Verb + Objekt.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Translate: "She lives in Berlin." (wohnen)', de: 'Übersetze: "She lives in Berlin." (wohnen)' },
            answer: 'Sie wohnt in Berlin',
            acceptableAnswers: ['Sie wohnt in Berlin', 'Sie wohnt in Berlin.', 'sie wohnt in Berlin'],
            explanation: {
              en: 'Sie wohnt in Berlin. wohnen → wohn + t = wohnt',
              de: 'Sie wohnt in Berlin. wohnen → wohn + t = wohnt',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Order the endings: ich, du, er/sie/es', de: 'Ordne die Endungen: ich, du, er/sie/es' },
            words: ['-t', '-st', '-e'],
            correctOrder: ['-e', '-st', '-t'],
            explanation: {
              en: '-e (ich), -st (du), -t (er/sie/es).',
              de: '-e (ich), -st (du), -t (er/sie/es).',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "We are buying bread." (kaufen)', de: 'Schreibe: "We are buying bread." (kaufen)' },
            answer: 'Wir kaufen Brot',
            acceptableAnswers: ['Wir kaufen Brot', 'Wir kaufen Brot.', 'wir kaufen Brot'],
            explanation: {
              en: 'Wir kaufen Brot. "wir" form = infinitive.',
              de: 'Wir kaufen Brot. "wir"-Form = Infinitiv.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "He works a lot." (arbeiten)', de: 'Schreibe: "He works a lot." (arbeiten)' },
            answer: 'Er arbeitet viel',
            acceptableAnswers: ['Er arbeitet viel', 'Er arbeitet viel.', 'er arbeitet viel'],
            explanation: {
              en: 'Er arbeitet viel. Stem ends in -t, so add -et (not just -t).',
              de: 'Er arbeitet viel. Stamm endet auf -t, also füge -et hinzu (nicht nur -t).',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Create: "You all drink coffee" (ihr) - trinkt / Kaffee / Ihr', de: 'Bilde: "You all drink coffee" (ihr) - trinkt / Kaffee / Ihr' },
            words: ['Kaffee', 'trinkt', 'Ihr'],
            correctOrder: ['Ihr', 'trinkt', 'Kaffee'],
            explanation: {
              en: 'Ihr trinkt Kaffee. ihr + stem + t.',
              de: 'Ihr trinkt Kaffee. ihr + Stamm + t.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "I listen to music." (hören)', de: 'Schreibe: "I listen to music." (hören)' },
            answer: 'Ich höre Musik',
            acceptableAnswers: ['Ich höre Musik', 'Ich höre Musik.', 'ich höre Musik'],
            explanation: {
              en: 'Ich höre Musik. hören → hör + e = höre',
              de: 'Ich höre Musik. hören → hör + e = höre',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Order the endings: wir, ihr, sie/Sie', de: 'Ordne die Endungen: wir, ihr, sie/Sie' },
            words: ['-en', '-en', '-t'],
            correctOrder: ['-en', '-t', '-en'],
            explanation: {
              en: '-en (wir), -t (ihr), -en (sie/Sie). Note: wir and sie/Sie both use -en.',
              de: '-en (wir), -t (ihr), -en (sie/Sie). Beachte: wir und sie/Sie benutzen beide -en.',
            },
          },
        ],
      },
    },
  },

  // ==========================================
  // A1.2 - Beginner II (First 3 topics)
  // ==========================================
  'a1.2': {
    'sentence-structure': {
      stage1: {
        title: { en: 'German Sentence Structure', de: 'Deutsche Satzstruktur' },
        introduction: {
          en: 'German sentence structure follows strict rules, especially regarding verb placement. The verb is always the second element in statements (V2 rule). This is different from English and takes practice!',
          de: 'Die deutsche Satzstruktur folgt strengen Regeln, besonders bezüglich der Verbstellung. Das Verb ist in Aussagesätzen immer das zweite Element (V2-Regel). Das ist anders als im Englischen und braucht Übung!',
        },
        keyPoints: [
          { en: 'Verb always in position 2 in statements', de: 'Verb immer in Position 2 in Aussagesätzen' },
          { en: 'Subject can move, but verb stays in position 2', de: 'Subjekt kann sich bewegen, aber Verb bleibt in Position 2' },
          { en: 'Time-Manner-Place order for details', de: 'Zeit-Art-Ort Reihenfolge für Details' },
        ],
      },
      stage2: {
        title: { en: 'Word Order Examples', de: 'Wortstellungsbeispiele' },
        examples: [
          { german: 'Ich gehe nach Hause.', translation: 'I am going home.', pronunciation: 'ikh GAY-eh nahkh HOW-zeh', audioHint: 'Subject-Verb-Object' },
          { german: 'Heute gehe ich nach Hause.', translation: 'Today I am going home.', pronunciation: 'HOY-teh GAY-eh ikh nahkh HOW-zeh', audioHint: 'Time first, verb still 2nd!' },
          { german: 'Nach Hause gehe ich heute.', translation: 'Home I am going today. (emphasis on "home")', pronunciation: 'nahkh HOW-zeh GAY-eh ikh HOY-teh', audioHint: 'Place first for emphasis' },
          { german: 'Er spielt jeden Tag Fußball.', translation: 'He plays soccer every day.', pronunciation: 'air shpeelt YAY-den tahk FOOS-bahl', audioHint: 'Time before object' },
          { german: 'Wir fahren morgen mit dem Zug nach Berlin.', translation: 'We are going to Berlin by train tomorrow.', pronunciation: 'veer FAH-ren MOR-gen mit daym tsook nahkh bair-LEEN', audioHint: 'Time-Manner-Place' },
        ],
      },
      stage3: {
        title: { en: 'Word Order Rules', de: 'Wortstellungsregeln' },
        tables: [
          {
            title: { en: 'Statement Word Order (V2)', de: 'Aussagesatz Wortstellung (V2)' },
            headers: [
              { en: 'Position 1', de: 'Position 1' },
              { en: 'Position 2 (VERB)', de: 'Position 2 (VERB)' },
              { en: 'Middle', de: 'Mitte' },
              { en: 'End', de: 'Ende' },
            ],
            rows: [
              ['Ich', 'spiele', 'heute', 'Fußball.'],
              ['Heute', 'spiele', 'ich', 'Fußball.'],
              ['Fußball', 'spiele', 'ich heute', '—'],
            ],
          },
        ],
        tips: [
          { en: 'Time-Manner-Place (TMP) for extra information after the verb', de: 'Zeit-Art-Ort (TMP) für zusätzliche Informationen nach dem Verb' },
          { en: 'Think of position 2 as the "verb throne" - it never moves!', de: 'Denke an Position 2 als den "Verbthron" - er bewegt sich nie!' },
        ],
        warnings: [
          { en: 'Unlike English, starting with time/place changes nothing about verb position!', de: 'Anders als im Englischen ändert der Beginn mit Zeit/Ort nichts an der Verbposition!' },
        ],
      },
      stage4: {
        title: { en: 'Guided Practice', de: 'Geführte Übung' },
        instructions: {
          en: 'Practice German sentence structure. Remember: the verb is always in position 2!',
          de: 'Übe die deutsche Satzstruktur. Denke daran: das Verb ist immer in Position 2!',
        },
        exercises: [
          {
            type: 'multiple-choice',
            question: { en: 'In German statements, the verb is always in position...', de: 'In deutschen Aussagesätzen steht das Verb immer in Position...' },
            options: ['1', '2', '3', 'anywhere'],
            correct: 1,
            explanation: {
              en: 'The verb is ALWAYS in position 2 in German statements. This is called the V2 rule.',
              de: 'Das Verb steht IMMER in Position 2 in deutschen Aussagesätzen. Das nennt man die V2-Regel.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Which sentence has correct word order?', de: 'Welcher Satz hat die richtige Wortstellung?' },
            options: ['Ich nach Hause gehe.', 'Ich gehe nach Hause.', 'Gehe ich nach Hause.', 'Nach Hause ich gehe.'],
            correct: 1,
            explanation: {
              en: '"Ich gehe nach Hause." - Subject (Ich) + Verb (gehe) + Rest. Verb in position 2!',
              de: '"Ich gehe nach Hause." - Subjekt (Ich) + Verb (gehe) + Rest. Verb in Position 2!',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: '"Heute gehe ich nach Hause." - What is in position 1?', de: '"Heute gehe ich nach Hause." - Was steht in Position 1?' },
            options: ['gehe (verb)', 'ich (subject)', 'Heute (time)', 'Hause (place)'],
            correct: 2,
            explanation: {
              en: '"Heute" (today) is in position 1. The verb "gehe" stays in position 2, pushing "ich" to position 3.',
              de: '"Heute" steht in Position 1. Das Verb "gehe" bleibt in Position 2, und "ich" rutscht auf Position 3.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Complete with correct word order: Morgen ___ ich Fußball. (spielen)', de: 'Ergänze mit korrekter Wortstellung: Morgen ___ ich Fußball. (spielen)' },
            answer: 'spiele',
            acceptableAnswers: ['spiele', 'Spiele'],
            explanation: {
              en: 'Morgen spiele ich Fußball. Time (Morgen) + Verb (spiele) + Subject (ich) + Object.',
              de: 'Morgen spiele ich Fußball. Zeit (Morgen) + Verb (spiele) + Subjekt (ich) + Objekt.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'What is the correct order for extra information (TMP)?', de: 'Was ist die richtige Reihenfolge für zusätzliche Informationen (TMP)?' },
            options: ['Place-Manner-Time', 'Manner-Time-Place', 'Time-Manner-Place', 'Time-Place-Manner'],
            correct: 2,
            explanation: {
              en: 'Time-Manner-Place (TMP): Ich fahre morgen (T) mit dem Zug (M) nach Berlin (P).',
              de: 'Zeit-Art-Ort (TMP): Ich fahre morgen (Z) mit dem Zug (A) nach Berlin (O).',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Position 2 is sometimes called the "verb _____".', de: 'Position 2 wird manchmal "Verb_____" genannt.' },
            answer: 'throne',
            acceptableAnswers: ['throne', 'Throne', 'thron', 'Thron'],
            explanation: {
              en: 'Position 2 is the "verb throne" - the verb sits there and never moves!',
              de: 'Position 2 ist der "Verbthron" - das Verb sitzt dort und bewegt sich nie!',
            },
          },
        ],
      },
      stage5: {
        title: { en: 'Mastery Challenge', de: 'Meisterschaftsprüfung' },
        instructions: {
          en: 'Complete these advanced exercises to master German sentence structure.',
          de: 'Schließe diese fortgeschrittenen Übungen ab, um die deutsche Satzstruktur zu meistern.',
        },
        exercises: [
          {
            type: 'word-order',
            question: { en: 'Create: "I am going home" - nach Hause / gehe / Ich', de: 'Bilde: "I am going home" - nach Hause / gehe / Ich' },
            words: ['nach Hause', 'Ich', 'gehe'],
            correctOrder: ['Ich', 'gehe', 'nach Hause'],
            explanation: {
              en: 'Ich gehe nach Hause. Subject + Verb (position 2) + Rest.',
              de: 'Ich gehe nach Hause. Subjekt + Verb (Position 2) + Rest.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Start with "Heute": I play soccer today', de: 'Beginne mit "Heute": Ich spiele heute Fußball' },
            words: ['Fußball', 'spiele', 'Heute', 'ich'],
            correctOrder: ['Heute', 'spiele', 'ich', 'Fußball'],
            explanation: {
              en: 'Heute spiele ich Fußball. Time first, verb stays 2nd, subject moves to 3rd.',
              de: 'Heute spiele ich Fußball. Zeit zuerst, Verb bleibt 2., Subjekt rutscht auf 3.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Translate: "Tomorrow I am going to Berlin."', de: 'Übersetze: "Tomorrow I am going to Berlin."' },
            answer: 'Morgen fahre ich nach Berlin',
            acceptableAnswers: ['Morgen fahre ich nach Berlin', 'Morgen fahre ich nach Berlin.', 'morgen fahre ich nach Berlin'],
            explanation: {
              en: 'Morgen fahre ich nach Berlin. Time + Verb + Subject + Place.',
              de: 'Morgen fahre ich nach Berlin. Zeit + Verb + Subjekt + Ort.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Apply TMP: We go / tomorrow / by train / to Berlin', de: 'Wende TMP an: Wir fahren / morgen / mit dem Zug / nach Berlin' },
            words: ['nach Berlin', 'mit dem Zug', 'morgen', 'Wir fahren'],
            correctOrder: ['Wir fahren', 'morgen', 'mit dem Zug', 'nach Berlin'],
            explanation: {
              en: 'Wir fahren morgen mit dem Zug nach Berlin. Time-Manner-Place order.',
              de: 'Wir fahren morgen mit dem Zug nach Berlin. Zeit-Art-Ort Reihenfolge.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "He plays soccer every day."', de: 'Schreibe: "He plays soccer every day."' },
            answer: 'Er spielt jeden Tag Fußball',
            acceptableAnswers: ['Er spielt jeden Tag Fußball', 'Er spielt jeden Tag Fußball.', 'er spielt jeden Tag Fußball'],
            explanation: {
              en: 'Er spielt jeden Tag Fußball. Subject + Verb + Time + Object.',
              de: 'Er spielt jeden Tag Fußball. Subjekt + Verb + Zeit + Objekt.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Create a question: "Are you going home?" - du / Gehst / nach Hause', de: 'Bilde eine Frage: "Gehst du nach Hause?"' },
            words: ['nach Hause', 'Gehst', 'du'],
            correctOrder: ['Gehst', 'du', 'nach Hause'],
            explanation: {
              en: 'Gehst du nach Hause? For questions, verb comes first.',
              de: 'Gehst du nach Hause? Bei Fragen steht das Verb am Anfang.',
            },
          },
        ],
      },
    },

    'nominative-case': {
      stage1: {
        title: { en: 'The Nominative Case', de: 'Der Nominativ' },
        introduction: {
          en: 'The nominative case is used for the subject of a sentence - the person or thing doing the action. Articles and pronouns in the nominative case answer the question "Who?" or "What?"',
          de: 'Der Nominativ wird für das Subjekt eines Satzes verwendet - die Person oder Sache, die die Handlung ausführt. Artikel und Pronomen im Nominativ beantworten die Frage "Wer?" oder "Was?"',
        },
        keyPoints: [
          { en: 'Subject of the sentence uses nominative', de: 'Das Subjekt des Satzes verwendet Nominativ' },
          { en: 'After sein (to be), use nominative too', de: 'Nach sein benutze auch Nominativ' },
          { en: 'der/die/das remain unchanged as subject', de: 'der/die/das bleiben als Subjekt unverändert' },
        ],
      },
      stage2: {
        title: { en: 'Nominative Examples', de: 'Nominativ-Beispiele' },
        examples: [
          { german: 'Der Mann liest ein Buch.', translation: 'The man is reading a book.', pronunciation: 'dair mahn leest ine bookh', audioHint: 'Der Mann = subject (nominative)' },
          { german: 'Die Frau singt.', translation: 'The woman is singing.', pronunciation: 'dee frow zingt', audioHint: 'Die Frau = subject' },
          { german: 'Das Kind spielt.', translation: 'The child is playing.', pronunciation: 'dahs kint shpeelt', audioHint: 'Das Kind = subject' },
          { german: 'Er ist ein Lehrer.', translation: 'He is a teacher.', pronunciation: 'air ist ine LAY-rer', audioHint: 'After sein: nominative' },
          { german: 'Wer ist das?', translation: 'Who is that?', pronunciation: 'vair ist dahs', audioHint: 'Wer = nominative question word' },
        ],
      },
      stage3: {
        title: { en: 'Nominative Case Forms', de: 'Nominativformen' },
        tables: [
          {
            title: { en: 'Definite Articles (Nominative)', de: 'Bestimmte Artikel (Nominativ)' },
            headers: [
              { en: 'Gender', de: 'Geschlecht' },
              { en: 'Article', de: 'Artikel' },
              { en: 'Example', de: 'Beispiel' },
            ],
            rows: [
              ['Masculine', 'der', 'der Hund (the dog)'],
              ['Feminine', 'die', 'die Katze (the cat)'],
              ['Neuter', 'das', 'das Pferd (the horse)'],
              ['Plural', 'die', 'die Tiere (the animals)'],
            ],
          },
          {
            title: { en: 'Indefinite Articles (Nominative)', de: 'Unbestimmte Artikel (Nominativ)' },
            headers: [
              { en: 'Gender', de: 'Geschlecht' },
              { en: 'Article', de: 'Artikel' },
            ],
            rows: [
              ['Masculine', 'ein'],
              ['Feminine', 'eine'],
              ['Neuter', 'ein'],
              ['Plural', '— (keine = no)'],
            ],
          },
        ],
        tips: [
          { en: 'Ask "Wer/Was + verb?" to find the nominative subject', de: 'Frage "Wer/Was + Verb?" um das Nominativ-Subjekt zu finden' },
          { en: 'The nominative is your "base" form - other cases change from here', de: 'Der Nominativ ist deine "Grundform" - andere Fälle ändern sich von hier' },
        ],
        warnings: [
          { en: 'After "sein", both sides are nominative: "Er ist ein guter Lehrer"', de: 'Nach "sein" sind beide Seiten Nominativ: "Er ist ein guter Lehrer"' },
        ],
      },
      stage4: {
        title: { en: 'Guided Practice', de: 'Geführte Übung' },
        instructions: {
          en: 'Practice identifying and using the nominative case (subject of the sentence).',
          de: 'Übe das Erkennen und Verwenden des Nominativs (Subjekt des Satzes).',
        },
        exercises: [
          {
            type: 'multiple-choice',
            question: { en: 'The nominative case is used for the...', de: 'Der Nominativ wird für ... verwendet.' },
            options: ['object', 'subject', 'indirect object', 'prepositional phrase'],
            correct: 1,
            explanation: {
              en: 'The nominative marks the SUBJECT - the person or thing doing the action.',
              de: 'Der Nominativ markiert das SUBJEKT - die Person oder Sache, die die Handlung ausführt.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: '"Der Mann liest ein Buch." - What is the subject?', de: '"Der Mann liest ein Buch." - Was ist das Subjekt?' },
            options: ['ein Buch', 'Der Mann', 'liest', 'ein'],
            correct: 1,
            explanation: {
              en: '"Der Mann" is the subject (nominative). He is doing the reading.',
              de: '"Der Mann" ist das Subjekt (Nominativ). Er führt das Lesen aus.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: '___ Frau singt. (The woman - nominative)', de: '___ Frau singt. (Die Frau - Nominativ)' },
            answer: 'Die',
            acceptableAnswers: ['Die', 'die'],
            explanation: {
              en: 'Die Frau singt. "Frau" is feminine, nominative = "die".',
              de: 'Die Frau singt. "Frau" ist feminin, Nominativ = "die".',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Which question word finds the nominative?', de: 'Welches Fragewort findet den Nominativ?' },
            options: ['Wen?', 'Wem?', 'Wer/Was?', 'Wohin?'],
            correct: 2,
            explanation: {
              en: '"Wer?" (who?) or "Was?" (what?) finds the nominative subject.',
              de: '"Wer?" oder "Was?" findet das Nominativ-Subjekt.',
            },
          },
          {
            type: 'fill-blank',
            question: { en: '___ Kind spielt. (The child - neuter nominative)', de: '___ Kind spielt. (Das Kind - neutral Nominativ)' },
            answer: 'Das',
            acceptableAnswers: ['Das', 'das'],
            explanation: {
              en: 'Das Kind spielt. "Kind" is neuter, nominative = "das".',
              de: 'Das Kind spielt. "Kind" ist neutral, Nominativ = "das".',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'After "sein" (to be), what case is used on both sides?', de: 'Nach "sein" welcher Fall wird auf beiden Seiten verwendet?' },
            options: ['Accusative', 'Dative', 'Nominative', 'Genitive'],
            correct: 2,
            explanation: {
              en: 'After "sein", both sides are nominative: "Er ist ein Lehrer" (both Er and Lehrer are nominative).',
              de: 'Nach "sein" sind beide Seiten Nominativ: "Er ist ein Lehrer".',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Er ist ___ Lehrer. (a teacher - nominative)', de: 'Er ist ___ Lehrer. (ein Lehrer - Nominativ)' },
            answer: 'ein',
            acceptableAnswers: ['ein', 'Ein'],
            explanation: {
              en: 'Er ist ein Lehrer. After "sein", use nominative = "ein" for masculine.',
              de: 'Er ist ein Lehrer. Nach "sein" benutze Nominativ = "ein" für maskulin.',
            },
          },
        ],
      },
      stage5: {
        title: { en: 'Mastery Challenge', de: 'Meisterschaftsprüfung' },
        instructions: {
          en: 'Complete these advanced exercises to master the nominative case.',
          de: 'Schließe diese fortgeschrittenen Übungen ab, um den Nominativ zu meistern.',
        },
        exercises: [
          {
            type: 'word-order',
            question: { en: 'Create: "The man reads a book" - ein Buch / liest / Der Mann', de: 'Bilde: "The man reads a book"' },
            words: ['ein Buch', 'Der Mann', 'liest'],
            correctOrder: ['Der Mann', 'liest', 'ein Buch'],
            explanation: {
              en: 'Der Mann liest ein Buch. Subject (nominative) + Verb + Object.',
              de: 'Der Mann liest ein Buch. Subjekt (Nominativ) + Verb + Objekt.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Translate: "The woman is singing."', de: 'Übersetze: "The woman is singing."' },
            answer: 'Die Frau singt',
            acceptableAnswers: ['Die Frau singt', 'Die Frau singt.', 'die Frau singt'],
            explanation: {
              en: 'Die Frau singt. Feminine subject = "die" in nominative.',
              de: 'Die Frau singt. Feminines Subjekt = "die" im Nominativ.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "Who is that?"', de: 'Schreibe: "Who is that?"' },
            answer: 'Wer ist das',
            acceptableAnswers: ['Wer ist das', 'Wer ist das?', 'wer ist das'],
            explanation: {
              en: 'Wer ist das? "Wer" is the nominative question word.',
              de: 'Wer ist das? "Wer" ist das Nominativ-Fragewort.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Create: "The child is playing" - spielt / Das / Kind', de: 'Bilde: "The child is playing"' },
            words: ['Kind', 'spielt', 'Das'],
            correctOrder: ['Das', 'Kind', 'spielt'],
            explanation: {
              en: 'Das Kind spielt. Neuter subject uses "das".',
              de: 'Das Kind spielt. Neutrales Subjekt benutzt "das".',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "He is a teacher."', de: 'Schreibe: "He is a teacher."' },
            answer: 'Er ist Lehrer',
            acceptableAnswers: ['Er ist Lehrer', 'Er ist Lehrer.', 'er ist Lehrer', 'Er ist ein Lehrer'],
            explanation: {
              en: 'Er ist Lehrer. No article for professions after "sein".',
              de: 'Er ist Lehrer. Kein Artikel für Berufe nach "sein".',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Order nominative articles: masculine, feminine, neuter', de: 'Ordne Nominativ-Artikel: maskulin, feminin, neutral' },
            words: ['das', 'die', 'der'],
            correctOrder: ['der', 'die', 'das'],
            explanation: {
              en: 'der (masculine), die (feminine), das (neuter) - the nominative definite articles.',
              de: 'der (maskulin), die (feminin), das (neutral) - die Nominativ-Artikel.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "The animals are playing." (plural)', de: 'Schreibe: "The animals are playing." (Plural)' },
            answer: 'Die Tiere spielen',
            acceptableAnswers: ['Die Tiere spielen', 'Die Tiere spielen.', 'die Tiere spielen'],
            explanation: {
              en: 'Die Tiere spielen. ALL plurals use "die" in nominative.',
              de: 'Die Tiere spielen. ALLE Plurale benutzen "die" im Nominativ.',
            },
          },
        ],
      },
    },

    'accusative-intro': {
      stage1: {
        title: { en: 'Introduction to the Accusative Case', de: 'Einführung in den Akkusativ' },
        introduction: {
          en: 'The accusative case marks the direct object - the thing receiving the action. Only masculine articles change in accusative: der becomes den, ein becomes einen. Feminine, neuter, and plural stay the same.',
          de: 'Der Akkusativ markiert das direkte Objekt - die Sache, die die Handlung erhält. Nur maskuline Artikel ändern sich im Akkusativ: der wird zu den, ein wird zu einen. Feminin, neutral und Plural bleiben gleich.',
        },
        keyPoints: [
          { en: 'Direct object uses accusative', de: 'Direktes Objekt verwendet Akkusativ' },
          { en: 'Only MASCULINE changes: der→den, ein→einen', de: 'Nur MASKULIN ändert sich: der→den, ein→einen' },
          { en: 'Feminine, neuter, plural: no change!', de: 'Feminin, neutral, Plural: keine Änderung!' },
        ],
      },
      stage2: {
        title: { en: 'Accusative Examples', de: 'Akkusativ-Beispiele' },
        examples: [
          { german: 'Ich sehe den Mann.', translation: 'I see the man.', pronunciation: 'ikh ZAY-eh dayn mahn', audioHint: 'den Mann = accusative (masculine)' },
          { german: 'Ich sehe die Frau.', translation: 'I see the woman.', pronunciation: 'ikh ZAY-eh dee frow', audioHint: 'die Frau = no change (feminine)' },
          { german: 'Ich sehe das Kind.', translation: 'I see the child.', pronunciation: 'ikh ZAY-eh dahs kint', audioHint: 'das Kind = no change (neuter)' },
          { german: 'Er hat einen Hund.', translation: 'He has a dog.', pronunciation: 'air haht INE-en hoont', audioHint: 'einen Hund = accusative (masculine)' },
          { german: 'Sie kauft eine Tasche.', translation: 'She is buying a bag.', pronunciation: 'zee kowft INE-eh TAH-sheh', audioHint: 'eine Tasche = no change (feminine)' },
          { german: 'Wir brauchen ein Auto.', translation: 'We need a car.', pronunciation: 'veer BROW-khen ine OW-toh', audioHint: 'ein Auto = no change (neuter)' },
        ],
      },
      stage3: {
        title: { en: 'Accusative Case Forms', de: 'Akkusativformen' },
        tables: [
          {
            title: { en: 'Article Changes in Accusative', de: 'Artikeländerungen im Akkusativ' },
            headers: [
              { en: 'Gender', de: 'Geschlecht' },
              { en: 'Nominative', de: 'Nominativ' },
              { en: 'Accusative', de: 'Akkusativ' },
              { en: 'Change?', de: 'Änderung?' },
            ],
            rows: [
              ['Masculine', 'der / ein', 'den / einen', 'YES'],
              ['Feminine', 'die / eine', 'die / eine', 'no'],
              ['Neuter', 'das / ein', 'das / ein', 'no'],
              ['Plural', 'die / —', 'die / —', 'no'],
            ],
          },
        ],
        tips: [
          { en: 'Ask "Wen/Was + verb + subject?" to find the direct object', de: 'Frage "Wen/Was + Verb + Subjekt?" um das direkte Objekt zu finden' },
          { en: 'Remember: only the masculine changes! Everything else stays the same.', de: 'Merke: nur das Maskulinum ändert sich! Alles andere bleibt gleich.' },
        ],
        warnings: [
          { en: 'Common mistake: using "der" instead of "den" for masculine direct objects', de: 'Häufiger Fehler: "der" statt "den" für maskuline direkte Objekte zu verwenden' },
        ],
      },
      stage4: {
        title: { en: 'Guided Practice', de: 'Geführte Übung' },
        instructions: {
          en: 'Practice the accusative case. Remember: only masculine articles change!',
          de: 'Übe den Akkusativ. Denke daran: nur maskuline Artikel ändern sich!',
        },
        exercises: [
          {
            type: 'multiple-choice',
            question: { en: 'The accusative case is used for the...', de: 'Der Akkusativ wird für ... verwendet.' },
            options: ['subject', 'direct object', 'indirect object', 'prepositional phrase'],
            correct: 1,
            explanation: {
              en: 'The accusative marks the DIRECT OBJECT - the thing receiving the action.',
              de: 'Der Akkusativ markiert das DIREKTE OBJEKT - die Sache, die die Handlung erhält.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Which article changes in the accusative?', de: 'Welcher Artikel ändert sich im Akkusativ?' },
            options: ['die (feminine)', 'das (neuter)', 'der (masculine)', 'die (plural)'],
            correct: 2,
            explanation: {
              en: 'Only MASCULINE changes: der → den, ein → einen. Everything else stays the same!',
              de: 'Nur MASKULIN ändert sich: der → den, ein → einen. Alles andere bleibt gleich!',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Ich sehe ___ Mann. (the man - accusative)', de: 'Ich sehe ___ Mann. (den Mann - Akkusativ)' },
            answer: 'den',
            acceptableAnswers: ['den', 'Den'],
            explanation: {
              en: 'Ich sehe den Mann. Masculine der → den in accusative.',
              de: 'Ich sehe den Mann. Maskulin der → den im Akkusativ.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Ich sehe ___ Frau. (the woman)', de: 'Ich sehe ___ Frau.' },
            options: ['der', 'den', 'die', 'das'],
            correct: 2,
            explanation: {
              en: 'Feminine stays "die" in accusative - no change!',
              de: 'Feminin bleibt "die" im Akkusativ - keine Änderung!',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Er hat ___ Hund. (a dog - masculine accusative)', de: 'Er hat ___ Hund. (einen Hund - maskulin Akkusativ)' },
            answer: 'einen',
            acceptableAnswers: ['einen', 'Einen'],
            explanation: {
              en: 'Er hat einen Hund. ein → einen for masculine accusative.',
              de: 'Er hat einen Hund. ein → einen für maskulin Akkusativ.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Ich sehe ___ Kind. (the child - neuter)', de: 'Ich sehe ___ Kind. (das Kind - neutral)' },
            options: ['der', 'den', 'die', 'das'],
            correct: 3,
            explanation: {
              en: 'Neuter stays "das" in accusative - no change!',
              de: 'Neutral bleibt "das" im Akkusativ - keine Änderung!',
            },
          },
          {
            type: 'fill-blank',
            question: { en: 'Sie kauft ___ Tasche. (a bag - feminine)', de: 'Sie kauft ___ Tasche. (eine Tasche - feminin)' },
            answer: 'eine',
            acceptableAnswers: ['eine', 'Eine'],
            explanation: {
              en: 'eine Tasche - feminine stays "eine" in accusative.',
              de: 'eine Tasche - feminin bleibt "eine" im Akkusativ.',
            },
          },
          {
            type: 'multiple-choice',
            question: { en: 'Which question word finds the accusative?', de: 'Welches Fragewort findet den Akkusativ?' },
            options: ['Wer?', 'Wem?', 'Wen/Was?', 'Wohin?'],
            correct: 2,
            explanation: {
              en: '"Wen?" (whom?) or "Was?" finds the accusative direct object.',
              de: '"Wen?" oder "Was?" findet das Akkusativ-Objekt.',
            },
          },
        ],
      },
      stage5: {
        title: { en: 'Mastery Challenge', de: 'Meisterschaftsprüfung' },
        instructions: {
          en: 'Complete these advanced exercises to master the accusative case.',
          de: 'Schließe diese fortgeschrittenen Übungen ab, um den Akkusativ zu meistern.',
        },
        exercises: [
          {
            type: 'word-order',
            question: { en: 'Create: "I see the man" - den Mann / sehe / Ich', de: 'Bilde: "I see the man"' },
            words: ['den Mann', 'sehe', 'Ich'],
            correctOrder: ['Ich', 'sehe', 'den Mann'],
            explanation: {
              en: 'Ich sehe den Mann. Subject + Verb + Accusative Object.',
              de: 'Ich sehe den Mann. Subjekt + Verb + Akkusativ-Objekt.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Translate: "He has a dog." (masculine)', de: 'Übersetze: "He has a dog." (maskulin)' },
            answer: 'Er hat einen Hund',
            acceptableAnswers: ['Er hat einen Hund', 'Er hat einen Hund.', 'er hat einen Hund'],
            explanation: {
              en: 'Er hat einen Hund. ein → einen for masculine accusative.',
              de: 'Er hat einen Hund. ein → einen für maskulin Akkusativ.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "She is buying a bag." (feminine)', de: 'Schreibe: "She is buying a bag." (feminin)' },
            answer: 'Sie kauft eine Tasche',
            acceptableAnswers: ['Sie kauft eine Tasche', 'Sie kauft eine Tasche.', 'sie kauft eine Tasche'],
            explanation: {
              en: 'Sie kauft eine Tasche. Feminine stays "eine" in accusative.',
              de: 'Sie kauft eine Tasche. Feminin bleibt "eine" im Akkusativ.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Order: nominative → accusative for masculine', de: 'Ordne: Nominativ → Akkusativ für maskulin' },
            words: ['den', 'der'],
            correctOrder: ['der', 'den'],
            explanation: {
              en: 'der (nominative) → den (accusative) for masculine.',
              de: 'der (Nominativ) → den (Akkusativ) für maskulin.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "I see the woman."', de: 'Schreibe: "I see the woman."' },
            answer: 'Ich sehe die Frau',
            acceptableAnswers: ['Ich sehe die Frau', 'Ich sehe die Frau.', 'ich sehe die Frau'],
            explanation: {
              en: 'Ich sehe die Frau. Feminine "die" doesn\'t change.',
              de: 'Ich sehe die Frau. Feminin "die" ändert sich nicht.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "We need a car." (neuter)', de: 'Schreibe: "We need a car." (neutral)' },
            answer: 'Wir brauchen ein Auto',
            acceptableAnswers: ['Wir brauchen ein Auto', 'Wir brauchen ein Auto.', 'wir brauchen ein Auto'],
            explanation: {
              en: 'Wir brauchen ein Auto. Neuter "ein" doesn\'t change in accusative.',
              de: 'Wir brauchen ein Auto. Neutral "ein" ändert sich im Akkusativ nicht.',
            },
          },
          {
            type: 'word-order',
            question: { en: 'Order indefinite articles: ein → einen (which gender changes?)', de: 'Ordne: ein → einen (welches Geschlecht ändert sich?)' },
            words: ['neuter', 'feminine', 'masculine'],
            correctOrder: ['masculine', 'feminine', 'neuter'],
            explanation: {
              en: 'Only masculine changes: ein → einen. Feminine and neuter stay the same.',
              de: 'Nur maskulin ändert sich: ein → einen. Feminin und neutral bleiben gleich.',
            },
          },
          {
            type: 'translation',
            question: { en: 'Write: "I see the child." (neuter)', de: 'Schreibe: "I see the child." (neutral)' },
            answer: 'Ich sehe das Kind',
            acceptableAnswers: ['Ich sehe das Kind', 'Ich sehe das Kind.', 'ich sehe das Kind'],
            explanation: {
              en: 'Ich sehe das Kind. Neuter "das" doesn\'t change in accusative.',
              de: 'Ich sehe das Kind. Neutral "das" ändert sich im Akkusativ nicht.',
            },
          },
        ],
      },
    },
  },
};

// Helper to get content for a specific topic
export const getTopicContent = (level, slug) => {
  return grammarContent[level]?.[slug] || null;
};

// Helper to get stage content
export const getStageContent = (level, slug, stageNumber) => {
  const topic = grammarContent[level]?.[slug];
  if (!topic) return null;
  return topic[`stage${stageNumber}`] || null;
};

// Check if content exists for a topic
export const hasContent = (level, slug) => {
  return !!grammarContent[level]?.[slug];
};
