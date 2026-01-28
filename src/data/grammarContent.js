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
