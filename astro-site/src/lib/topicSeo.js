// Per-topic SEO enrichment rendered by src/pages/grammar/[level]/[slug].astro.
// Keyed by `${level}/${slug}`. Content lives in code (not the Supabase grammar
// tables) so it can target search queries without touching lesson data.
//
// - snippetIntro: featured-snippet-style lead rendered as the first paragraph
//   of the page, above the topic's own description. ~2 sentences that directly
//   answer the main question of the cluster.
// - faqHeading + faqs: rendered as an FAQ section near the end of the page and
//   emitted as FAQPage JSON-LD alongside the existing schemas.
//
// Not every topic has an entry (new topics start without one); a missing entry
// just skips the FAQ/snippet sections. Answers are grounded in each lesson's own
// rules and examples — when lesson content changes materially, update these too.
export const TOPIC_SEO = {
  "a1.1/alphabet-pronunciation": {
    "snippetIntro": "The German alphabet has the same 26 letters as English plus four extra characters: ä, ö, ü and ß. The letters look familiar but several sound different — W is pronounced like an English V (Wasser), V like an F (Vater), J like a Y (ja) and Z like TS (zehn).",
    "faqHeading": "Common questions about the German alphabet and pronunciation",
    "faqs": [
      {
        "q": "How many letters are in the German alphabet?",
        "a": "German uses the same 26 basic letters as English, plus four additional characters: the three umlauts ä, ö and ü, and the ß (Eszett or sharp S). Most people therefore count 30 characters in total. The umlauts and the ß are not decorations — they change meaning, so schon (already) and schön (beautiful) are two different words."
      },
      {
        "q": "How is the German letter ß pronounced?",
        "a": "The ß is called Eszett or scharfes S and is pronounced like the double S in miss — a sharp, unvoiced S sound. It is never a B, even though it looks a little like one. You hear it in Straße (street) and in ich heiße (my name is). It always follows a long vowel or a diphthong."
      },
      {
        "q": "What do the umlauts ä, ö and ü sound like in German?",
        "a": "Each umlaut has its own sound. Ä is close to the E in bed, as in Mädchen (girl). Ö resembles the ER in her said without the R, as in schön (beautiful). Ü is like the EW in few with rounded lips, as in über (over). Umlauts are separate sounds, so never replace them with ae, oe or ue when speaking."
      },
      {
        "q": "Why does the German W sound like a V?",
        "a": "German simply assigns different sounds to those two letters than English does. W is pronounced like the English V, so Wasser sounds like vasser. V is usually pronounced like an English F, so Vater sounds like fater. Once you swap those two sounds in your head, a large part of German pronunciation becomes predictable."
      },
      {
        "q": "How do you pronounce sch, sp and st in German?",
        "a": "The combination sch is one sound, like the English SH in Schule (school). At the beginning of a word or syllable, sp and st are pronounced as shp and sht, which is why sprechen sounds like shprechen and Straße like shtraße. In the middle or at the end of a word they keep their plain S sound."
      }
    ]
  },
  "a1.1/nouns-gender": {
    "snippetIntro": "German has three grammatical genders: masculine (der), feminine (die), and neuter (das). Every noun in the German language has one of these genders — not just people, but also objects and ideas — and it decides which article and endings you use.",
    "faqHeading": "Common questions about German genders",
    "faqs": [
      {
        "q": "Does German have gendered nouns?",
        "a": "Yes. Every German noun has one of three grammatical genders: masculine, feminine, or neuter. You see the gender in the article that comes before the noun — der Mann (masculine), die Frau (feminine), das Kind (neuter). Unlike English, this applies to objects and ideas too, not just people."
      },
      {
        "q": "How many genders does German have?",
        "a": "German has three genders: masculine (der), feminine (die), and neuter (das). English only marks natural gender on pronouns like he, she, and it, but German assigns a grammatical gender to every single noun — including things like tables, lamps, and windows."
      },
      {
        "q": "Is German a gendered language?",
        "a": "Yes — German is a gendered language. The gender of a noun affects the article (der, die, das), the endings of adjectives that describe it, and the pronoun that replaces it. That is why learning the gender together with each new word is one of the most useful habits for German learners."
      },
      {
        "q": "How do I know the gender of a German word?",
        "a": "Sometimes the ending tells you: nouns ending in -ung, -heit, or -keit are feminine, and nouns ending in -chen or -lein are neuter, for example. Many genders simply have to be memorized, though — so always learn a noun together with its article: der Tisch, not just Tisch."
      },
      {
        "q": "Are the genders of German nouns logical?",
        "a": "Mostly not — grammatical gender is not the same as biological gender. Das Mädchen (the girl) is neuter, and der Löffel (the spoon) is masculine. Word endings and word groups give useful patterns, but for many nouns the gender is a convention you learn with the word itself."
      },
      {
        "q": "Does the gender of words in German change the rest of the sentence?",
        "a": "Yes. The gender decides which article you use (der, die, das), which endings adjectives take (ein kleiner Tisch vs. eine kleine Lampe), and which pronoun stands in for the noun (er, sie, es). It also feeds into the case system once you meet the accusative and dative."
      }
    ]
  },
  "a1.1/definite-articles": {
    "snippetIntro": "German has three definite articles in the singular — der for masculine, die for feminine and das for neuter — and one shared form, die, for all plurals. Which one you use depends on the gender of the noun, so der Tisch, die Lampe and das Buch all translate the single English word the.",
    "faqHeading": "Common questions about der, die and das",
    "faqs": [
      {
        "q": "When do I use der, die or das?",
        "a": "You choose the article by the gender of the noun, not by the meaning of the sentence. Masculine nouns take der (der Mann), feminine nouns take die (die Frau) and neuter nouns take das (das Kind). All plural nouns take die, whatever their singular gender: der Mann becomes die Männer and das Kind becomes die Kinder."
      },
      {
        "q": "Why does German have three words for the?",
        "a": "Because German marks grammatical gender on the article. English lost that marking centuries ago and kept a single the, while German kept three forms that show whether the following noun is masculine, feminine or neuter. The article therefore carries real information: der Tisch tells a listener immediately that Tisch is masculine."
      },
      {
        "q": "Is die used for both feminine and plural nouns?",
        "a": "Yes, and that overlap is genuinely useful. Die marks every feminine singular noun (die Frau) and also every plural noun of any gender (die Männer, die Frauen, die Kinder). If you know a noun is plural, you can use die without knowing its singular gender. Only the verb form and context tell the two uses apart."
      },
      {
        "q": "Do German articles change in a sentence?",
        "a": "Yes. The forms der, die, das are the nominative forms used for the subject. When the noun becomes a direct object, masculine der changes to den — Ich sehe den Mann. Feminine, neuter and plural articles stay the same in the accusative, so only the masculine form visibly changes at this level."
      },
      {
        "q": "Can I guess a German article from the English word?",
        "a": "No, and trying to is a common source of mistakes. Gender does not transfer between languages: die Sonne (the sun) is feminine in German but masculine in Spanish and French. The safest method is to learn each new noun as a two-word unit, der Tisch rather than Tisch, so the article is stored with the word."
      }
    ]
  },
  "a1.1/indefinite-articles": {
    "snippetIntro": "German says a or an with ein for masculine and neuter nouns and eine for feminine nouns: ein Mann, ein Kind, eine Frau. There is no plural form — you simply drop the article (Kinder = children) — and the negative counterpart kein or keine means not a or no.",
    "faqHeading": "Common questions about ein, eine and kein",
    "faqs": [
      {
        "q": "When do I use ein and when eine?",
        "a": "Use eine before feminine nouns (eine Frau, eine Frage) and ein before both masculine and neuter nouns (ein Mann, ein Haus). Masculine and neuter share the same form in the nominative, so there are only two words to learn. In the plural German uses no indefinite article at all: Ich sehe Kinder im Park."
      },
      {
        "q": "What is the difference between der and ein in German?",
        "a": "Der, die and das point to a specific thing already known to the listener, while ein and eine introduce one unspecified example. Das Buch means that particular book; ein Buch means some book. The usual pattern matches English: you introduce something with ein and refer back to it with der — Ich sehe einen Mann. Der Mann ist groß."
      },
      {
        "q": "How do you say not a or no in German?",
        "a": "Use kein, which is simply ein with a k in front, and it follows exactly the same gender endings. Ich habe kein Geld (no money, neuter), Ich habe keine Zeit (no time, feminine), Ich habe keine Kinder (no children, plural). Kein negates nouns; for verbs and adjectives you need nicht instead."
      },
      {
        "q": "Why do Germans say Sie ist Lehrerin without an article?",
        "a": "Because German drops the article before professions, nationalities and religions after sein or werden. Sie ist Lehrerin means she is a teacher, and adding eine sounds wrong to native ears. The same applies to Ich bin Student and Ich bin Deutscher. English needs the a here, German does not, which makes this a frequent learner mistake."
      },
      {
        "q": "Does ein change in the accusative case?",
        "a": "Only in the masculine. Ein becomes einen when a masculine noun is the direct object, so Ich habe einen Hund. Feminine eine, neuter ein and the negative forms for feminine and neuter stay unchanged: Ich habe eine Frage, Ich sehe ein Haus. Kein follows the identical pattern and becomes keinen in the masculine accusative."
      }
    ]
  },
  "a1.1/personal-pronouns": {
    "snippetIntro": "German has nine personal pronouns in the nominative: ich, du, er, sie, es, wir, ihr, sie and the formal Sie. The key difference from English is that German has three words for you — informal du for one person, informal ihr for a group, and formal Sie, which is always capitalised.",
    "faqHeading": "Common questions about German personal pronouns",
    "faqs": [
      {
        "q": "What is the difference between du and Sie in German?",
        "a": "Du is the informal you for one person: friends, family, children, classmates and pets. Sie is the formal you for strangers, teachers, bosses, officials and anyone in a shop, bank or office, and it is always written with a capital S. When you are unsure, start with Sie — the other person will offer du if they want it."
      },
      {
        "q": "Why does sie mean she, they and you in German?",
        "a": "The three words are genuinely identical in writing apart from capitalisation, so you tell them apart by the verb and the context. Sie ist nett means she is nice (singular verb ist), Sie sind nett with a small s means they are nice, and capitalised Sie sind nett means you are nice, formal. Capital Sie only appears mid-sentence for the formal you."
      },
      {
        "q": "When do I use ihr instead of du?",
        "a": "Use ihr when you address two or more people informally — a group of friends, your family, a class of children. Du is strictly one person. So you say Wie heißt du? to one friend but Wie heißt ihr? to several. English uses you for both, which is why English speakers often forget the plural form entirely."
      },
      {
        "q": "Do German objects use he and she?",
        "a": "Yes, because the pronoun follows the grammatical gender of the noun rather than whether the thing is alive. Der Tisch is masculine, so you refer back to it with er: Der Tisch ist neu. Er ist groß. Die Lampe becomes sie and das Buch becomes es. Using es for every object is one of the most common beginner mistakes."
      },
      {
        "q": "Is it rude to say du to a stranger in German?",
        "a": "It can be, especially with older people, officials or in professional settings, where du sounds over-familiar. The safe default with adults you do not know is Sie. Younger people, students and informal workplaces often switch to du quickly, and Germans mark the change explicitly by saying Du kannst du sagen, so wait for that invitation."
      }
    ]
  },
  "a1.1/verb-sein": {
    "snippetIntro": "Sein means to be and is the most important German verb: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind. It is completely irregular, so all six forms have to be memorised, and it is used for names, age, jobs, nationality, location, feelings and descriptions.",
    "faqHeading": "Common questions about the German verb sein",
    "faqs": [
      {
        "q": "How do you conjugate sein in German?",
        "a": "The present-tense forms are ich bin, du bist, er/sie/es ist, wir sind, ihr seid and sie/Sie sind. Sein is irregular, so the stem changes completely and no ending rule helps you. English behaves the same way with am, are and is, so the fastest approach is to learn all six German forms as a fixed chant."
      },
      {
        "q": "What is the difference between sein and haben?",
        "a": "Sein means to be and describes what or how something is: Ich bin müde (I am tired). Haben means to have and describes possession: Ich habe ein Auto. German splits them differently from English in fixed expressions — feelings such as hunger and thirst take haben, so I am hungry becomes Ich habe Hunger, never Ich bin hungrig with Hunger."
      },
      {
        "q": "Why is Ich bin ein Student wrong?",
        "a": "Because German uses no article before professions after sein. The correct sentence is Ich bin Student, and likewise Sie ist Lehrerin and Ich bin Deutscher. The article only reappears when you add an adjective, as in Ich bin ein guter Student. English always needs the a here, which is why learners insert ein by reflex."
      },
      {
        "q": "What do you use sein for in German?",
        "a": "Sein covers identity and states: your name (Ich bin Anna), your age (Ich bin 25 Jahre alt), your job (Ich bin Student), your nationality (Ich bin Deutscher), your location (Ich bin in Berlin), your feelings (Ich bin müde) and general descriptions (Das ist gut). It links a subject to a description rather than expressing an action."
      },
      {
        "q": "Is sein the same as the possessive sein his?",
        "a": "They are two different words that happen to look alike. The verb sein means to be and appears in forms such as bin, bist and ist. The possessive sein means his or its and stands directly before a noun: sein Buch, sein Vater. Word position tells them apart instantly, since the possessive is always followed by a noun."
      }
    ]
  },
  "a1.1/verb-haben": {
    "snippetIntro": "Haben means to have and conjugates as ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben. The only irregularity is that du and er drop the b of the stem, and German uses haben in many expressions where English uses to be, such as Ich habe Hunger for I am hungry.",
    "faqHeading": "Common questions about the German verb haben",
    "faqs": [
      {
        "q": "How do you conjugate haben in German?",
        "a": "The forms are ich habe, du hast, er/sie/es hat, wir haben, ihr habt and sie/Sie haben. Three forms keep the full stem hab-, and only du hast and er hat drop the b. Everything else follows the ordinary present-tense endings, so haben is far more regular than sein and easier to memorise."
      },
      {
        "q": "Why do Germans say Ich habe Hunger instead of I am hungry?",
        "a": "German treats hunger as a thing you possess rather than a state you are in, so it uses haben plus a noun. The pattern covers a whole family of expressions: Ich habe Durst (thirsty), Ich habe Angst (scared), Du hast Recht (right), Wir haben Glück (lucky). Translating them word for word with sein produces sentences no German would say."
      },
      {
        "q": "When do I use haben and when sein?",
        "a": "Use haben for possession and for the fixed noun expressions such as Hunger, Durst, Angst, Recht, Glück and Zeit. Use sein for identity, location, feelings expressed with adjectives and descriptions: Ich bin müde, Ich bin in Berlin. A quick test: if the German sentence contains a noun after the verb, haben is usually correct."
      },
      {
        "q": "What does Du hast Recht mean in German?",
        "a": "It means you are right. Literally it says you have right, because German expresses being correct as possessing correctness. It is a set phrase, so Recht is capitalised and no article appears. The same construction gives Ich habe Recht (I am right) and, with the opposite meaning, Du hast Unrecht (you are wrong)."
      },
      {
        "q": "Is haben used for the past tense in German?",
        "a": "Yes, and that is the second reason it matters so much. Later on, haben becomes the helping verb of the Perfekt, the everyday past tense: Ich habe gearbeitet (I have worked), Wir haben gelernt. Learning the six present-tense forms now pays off twice, because the same forms carry the past tense for most German verbs."
      }
    ]
  },
  "a1.1/present-tense-regular": {
    "snippetIntro": "Regular German verbs form the present tense by removing -en from the infinitive and adding personal endings: -e, -st, -t, -en, -t, -en. So spielen becomes ich spiele, du spielst, er spielt, wir spielen, ihr spielt, sie spielen — a single pattern that covers hundreds of verbs.",
    "faqHeading": "Common questions about the German present tense",
    "faqs": [
      {
        "q": "How do you conjugate regular verbs in German?",
        "a": "Take the infinitive, remove the -en to get the stem, then add the ending for each person. Wohnen becomes wohn-, giving ich wohne, du wohnst, er/sie/es wohnt, wir wohnen, ihr wohnt and sie/Sie wohnen. The same three steps work for lernen, machen, spielen, fragen, sagen and hundreds of other regular verbs."
      },
      {
        "q": "Does German have a present continuous like I am playing?",
        "a": "No — German has only one present tense, and it covers both English forms. Er spielt Fußball means both he plays football and he is playing football, with context deciding. If you need to stress that something is happening right now, German adds an adverb such as gerade: Er spielt gerade Fußball."
      },
      {
        "q": "Why do wir and sie have the same verb ending?",
        "a": "Both take -en, which is identical to the infinitive form, so wir spielen and sie spielen look the same as spielen itself. The pronoun is what tells them apart, which is one reason German almost never drops the subject pronoun. The formal Sie shares this form too, so Sie spielen can mean they play or you play."
      },
      {
        "q": "Can German verbs be used without a pronoun?",
        "a": "Normally no. Unlike Spanish or Italian, German keeps the subject pronoun because several endings overlap — wir, sie and Sie all take -en, and er and ihr both take -t. Without ich, du or wir the sentence would be ambiguous. The only common exception is the imperative: Komm! or Spiel!"
      },
      {
        "q": "What happens when a verb stem ends in -t or -d?",
        "a": "German inserts a linking -e so the ending stays pronounceable. Arbeiten has the stem arbeit-, so you get du arbeitest, er arbeitet and ihr arbeitet rather than the unsayable arbeitst. The same happens with finden: du findest, er findet. The wir and sie forms need no extra e because they already end in -en."
      }
    ]
  },
  "a1.2/basic-sentence-structure": {
    "snippetIntro": "In a German main clause the conjugated verb always stands in second position — not as the second word, but as the second element. Position one can hold the subject, a time expression, a place or an object, and whatever fills it, the verb follows immediately: Ich lerne Deutsch, but Morgen fliege ich nach Berlin.",
    "faqHeading": "Common questions about German word order",
    "faqs": [
      {
        "q": "What is the verb-second rule in German?",
        "a": "It means the conjugated verb occupies the second position of every main clause. Position one is a single element, which may be several words long, such as die Kinder or morgen früh. In Ich lerne Deutsch the verb lerne is second, and in Deutsch lerne ich the verb is still second even though the object came first."
      },
      {
        "q": "Why does the subject come after the verb in German sentences?",
        "a": "Because something else has taken position one. If you start with a time or place expression, the verb must still be second, so the subject is pushed to third place: Morgen fliege ich nach Berlin, In Berlin wohne ich. English keeps the subject in front (Tomorrow I fly), German inverts it. This inversion is obligatory, not stylistic."
      },
      {
        "q": "Is German word order free?",
        "a": "It is flexible but not free. You may move the subject, object, time or place expression into position one to change emphasis, and case endings keep the meaning clear. The verb, however, cannot move: it is fixed in position two in main clauses. So German word order is best described as flexible around a fixed verb."
      },
      {
        "q": "How do I decide what goes in first position in German?",
        "a": "Put whatever you want to emphasise or link to the previous sentence there. The neutral choice is the subject: Ich fliege morgen nach Berlin. Fronting a time expression stresses when — Morgen fliege ich nach Berlin. Fronting a place stresses where — In Berlin wohne ich. Only one element may occupy that slot, and the verb follows it."
      },
      {
        "q": "Where does the second verb go in a German sentence?",
        "a": "When a sentence has two verbs, only the conjugated one stays in position two and the other moves to the very end. That is why Ich kann heute Abend ins Kino gehen puts gehen last. The pattern is often called the Satzklammer, or sentence bracket, because the two verb parts frame everything in between."
      }
    ]
  },
  "a1.2/nominative-case": {
    "snippetIntro": "The nominative is the German case for the subject — the person or thing doing the action — and it answers the question wer? (who?) or was? (what?). Its articles are der, die, das and die in the plural, the dictionary forms, and it is also used after the verbs sein, werden and bleiben.",
    "faqHeading": "Common questions about the German nominative case",
    "faqs": [
      {
        "q": "What is the nominative case in German?",
        "a": "It is the case that marks the subject of a sentence, the element performing the action. In Der Hund bellt, the dog is doing the barking, so der Hund is nominative. You find it by asking wer? or was? before the verb. The nominative uses the base article forms der, die, das and die."
      },
      {
        "q": "How do I find the subject of a German sentence?",
        "a": "Ask wer? or was? together with the verb. In Der Mann liest ein Buch, asking wer liest? gives der Mann, so that is the nominative subject. A reliable cross-check is verb agreement: the subject always controls the verb ending, so if you change der Mann to die Männer, the verb must change to lesen."
      },
      {
        "q": "Why does the nominative stay the same after sein?",
        "a": "Because sein, werden and bleiben do not act on anything — they link two descriptions of the same thing. Das ist ein Buch has ein Buch in the nominative, not the accusative, because it describes das rather than receiving an action. The same holds for Er wird Arzt and Er bleibt mein Freund."
      },
      {
        "q": "What is the difference between nominative and accusative in German?",
        "a": "The nominative marks the doer, the accusative marks the receiver of the action. Der Mann liest has der Mann as subject, while Ich sehe den Mann has den Mann as object. Only masculine articles visibly change: der becomes den and ein becomes einen. Feminine, neuter and plural articles look identical in both cases."
      },
      {
        "q": "Are dictionary forms of German nouns always nominative?",
        "a": "Yes. Dictionaries and vocabulary lists always give the nominative singular with its article, such as der Tisch or die Lampe, because that is the baseline form all other cases are built from. When you learn a noun, you are learning its nominative, and later cases apply changes to that starting point."
      }
    ]
  },
  "a1.2/accusative-intro": {
    "snippetIntro": "The accusative is the German case for the direct object — the person or thing receiving the action — and it answers wen? or was?. Only masculine articles change form in the accusative: der becomes den, ein becomes einen and kein becomes keinen, while feminine, neuter and plural articles stay exactly the same.",
    "faqHeading": "Common questions about the German accusative case",
    "faqs": [
      {
        "q": "What is the accusative case in German?",
        "a": "It marks the direct object, the thing an action is done to. In Ich sehe den Mann, the man is what gets seen, so den Mann is accusative. You identify it by asking wen? (whom?) or was? (what?) after the verb. Verbs such as sehen, haben, kaufen and essen typically take an accusative object."
      },
      {
        "q": "Which German articles change in the accusative?",
        "a": "Only the masculine ones. Der becomes den, ein becomes einen, kein becomes keinen and mein becomes meinen. Feminine die, neuter das and plural die remain unchanged, as do eine and ein. That single -en ending on masculine words is the entire visible difference between nominative and accusative at this level."
      },
      {
        "q": "When do I use den instead of der in German?",
        "a": "Use den when a masculine noun is the direct object of a verb. Compare Der Mann liest, where the man is acting, with Ich sehe den Mann, where he is being seen. In a restaurant, Ich möchte den Kaffee marks the coffee as the thing you want; saying der Kaffee would make the coffee the subject."
      },
      {
        "q": "How do I know if a German noun is the object?",
        "a": "Ask who or what is doing the action and who or what is receiving it. In Der Hund beißt den Mann, the dog does the biting so it is nominative, and the man receives it so he is accusative. Because German marks case on articles, the sentence stays clear even if the word order changes."
      },
      {
        "q": "Why do feminine and neuter nouns look the same in both cases?",
        "a": "German simply never developed separate accusative forms for them, so die Frau and das Buch are identical as subject and object. This means word order and verb logic carry the meaning instead: in Ich sehe die Frau, ich is clearly the subject because it is nominative. Only the masculine articles give you a visible case marker."
      }
    ]
  },
  "a1.2/numbers-counting": {
    "snippetIntro": "German numbers from 21 upwards are said in reverse order compared with English: the units come before the tens, joined by und and written as one word. So 21 is einundzwanzig, literally one-and-twenty, and 45 is fünfundvierzig. Numbers 0 to 12 are memorised, and 13 to 19 simply add -zehn.",
    "faqHeading": "Common questions about German numbers",
    "faqs": [
      {
        "q": "Why do Germans say numbers backwards?",
        "a": "German keeps an older Germanic order in which the smaller unit is named first and joined to the ten with und. Einundzwanzig is literally one-and-twenty, and English once did the same, as in the nursery rhyme four and twenty blackbirds. Modern English reversed it, German did not. Everything is written as a single word: zweiunddreißig."
      },
      {
        "q": "How do you count from 1 to 20 in German?",
        "a": "eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn, elf, zwölf, then dreizehn, vierzehn, fünfzehn, sechzehn, siebzehn, achtzehn, neunzehn and zwanzig. From 13 up you add -zehn to the basic number, but note two spelling shortcuts: 16 is sechzehn without the s, and 17 is siebzehn without the -en."
      },
      {
        "q": "How do you say 21 in German?",
        "a": "Einundzwanzig — literally one-and-twenty. You take the unit (ein), add und, then the ten (zwanzig), and write the whole thing as one word. The same formula builds every number up to 99: fünfundvierzig for 45, achtundfünfzig for 58, sechsundneunzig for 96. Note that eins loses its final s inside these compounds."
      },
      {
        "q": "What are the German tens from 20 to 90?",
        "a": "zwanzig, dreißig, vierzig, fünfzig, sechzig, siebzig, achtzig, neunzig. Most are the base number plus -zig, but four need attention: 20 is zwanzig rather than zweizig, 30 is spelled dreißig with ß, 60 drops the s of sechs to give sechzig, and 70 shortens sieben to sieb- in siebzig."
      },
      {
        "q": "How do you give a phone number in German?",
        "a": "Germans usually read phone numbers digit by digit, so 0692 becomes null, sechs, neun, zwei. Some speakers group them in pairs, which reintroduces the reversed order and can confuse learners. When you take down a number, asking Können Sie das bitte einzeln sagen? — can you say it digit by digit — avoids the problem entirely."
      }
    ]
  },
  "a1.2/question-words": {
    "snippetIntro": "German question words all begin with W: wer (who), was (what), wo (where), wann (when), warum (why), wie (how), woher (where from) and wohin (where to). They take position one in the sentence and the conjugated verb follows immediately in position two, as in Wo wohnst du?",
    "faqHeading": "Common questions about German question words",
    "faqs": [
      {
        "q": "What are the German question words?",
        "a": "The core set is wer (who), was (what), wo (where), wann (when), warum (why) and wie (how). Alongside these you need woher (where from), wohin (where to), wie viel and wie viele (how much and how many), and welcher, welche, welches (which). All of them begin with W, the German counterpart to the English WH words."
      },
      {
        "q": "What is the word order in a German question?",
        "a": "The W-word takes position one and the conjugated verb comes straight after it in position two, with the subject in third place: Wo wohnst du?, Was machst du heute?, Warum lernst du Deutsch? This is exactly the verb-second rule you use in statements, so no separate question structure has to be learned."
      },
      {
        "q": "What is the difference between wo, woher and wohin?",
        "a": "All three ask about place, but from different angles. Wo asks about a static location: Wo wohnst du? — where do you live. Woher asks about origin or movement away from somewhere: Woher kommst du? — where are you from. Wohin asks about destination: Wohin gehst du? — where are you going. English uses where for all three."
      },
      {
        "q": "Why do Germans say Wie heißt du for what is your name?",
        "a": "Because German asks it with the verb heißen, to be called, so the literal question is how are you called. The matching answer uses the same verb: Ich heiße Anna. You can also ask Wie ist dein Name?, but Wie heißt du? is far more common in speech, and Was ist dein Name? sounds unnatural to many Germans."
      },
      {
        "q": "How do I ask a yes-or-no question in German?",
        "a": "Leave out the W-word and move the verb to the very front: Wohnst du in Berlin? or Hast du Zeit? Nothing else changes, and German needs no equivalent of the English helper do. The answer is ja, nein, or doch when you are contradicting a negative question such as Kommst du nicht?"
      }
    ]
  },
  "a1.2/negation": {
    "snippetIntro": "German has two negation words: kein negates nouns that would otherwise take ein, eine or no article, while nicht negates everything else — verbs, adjectives, adverbs and prepositional phrases. So you say Ich habe kein Auto (I have no car) but Ich verstehe nicht (I do not understand).",
    "faqHeading": "Common questions about German negation",
    "faqs": [
      {
        "q": "What is the difference between nicht and kein?",
        "a": "Kein negates a noun and takes the place of ein or eine: Ich habe kein Auto, Ich habe keine Zeit. Nicht negates a verb, an adjective, an adverb or a whole statement: Ich verstehe nicht, Das ist nicht gut. A quick test — if the positive sentence would use ein, eine or no article at all before the noun, use kein."
      },
      {
        "q": "How do you say no in German before a noun?",
        "a": "Use kein with the same gender endings as ein. Kein Auto for neuter, keine Zeit for feminine, keinen Hund for a masculine accusative object, and keine Kinder for the plural. Note that kein has a plural form even though ein does not, so Ich habe keine Kinder is the standard way to say I have no children."
      },
      {
        "q": "Where does nicht go in a German sentence?",
        "a": "Its default place is after the conjugated verb and after any definite object: Ich verstehe nicht, Ich kenne den Mann nicht. It goes directly before what it negates when that is an adjective or a prepositional phrase: Das ist nicht gut, Ich bin nicht in Berlin. When the whole sentence is negated, nicht drifts towards the end."
      },
      {
        "q": "Can you use double negatives in German?",
        "a": "No. Standard German allows only one negation per clause, so Ich habe nichts gesagt means I said nothing, and adding a second negative word would reverse the meaning rather than reinforce it. English non-standard speech tolerates I did not say nothing; German does not. Pick either nicht, kein or nichts and use it once."
      },
      {
        "q": "Why is Ich spreche nicht Deutsch usually wrong?",
        "a": "Because Deutsch here works like a noun with no article, and nouns without an article are negated with kein: Ich spreche kein Deutsch. That is the natural sentence for saying you do not speak German. Nicht would only appear if you were contrasting languages, as in Ich spreche nicht Deutsch, sondern Englisch."
      }
    ]
  },
  "a1.2/modal-verbs-intro": {
    "snippetIntro": "German modal verbs — können, müssen, wollen, sollen, dürfen and mögen — express ability, necessity, desire, obligation and permission. The modal is conjugated and takes position two, while the main verb moves to the end of the sentence in its infinitive form: Ich kann Deutsch sprechen.",
    "faqHeading": "Common questions about German modal verbs",
    "faqs": [
      {
        "q": "What are the German modal verbs?",
        "a": "There are six: können (can, to be able to), müssen (must, to have to), wollen (to want to), sollen (should, to be supposed to), dürfen (may, to be allowed to) and mögen (to like). The polite form möchte, meaning would like, comes from mögen and is the one you use for ordering: Ich möchte ein Bier."
      },
      {
        "q": "Where does the verb go with a modal verb in German?",
        "a": "The modal is conjugated and stays in position two, and the second verb moves to the very end as an infinitive. Ich spreche Deutsch becomes Ich kann Deutsch sprechen, and Er arbeitet heute becomes Er muss heute arbeiten. Everything else sits between the two verbs, which is why longer sentences feel like they hold their meaning back until the end."
      },
      {
        "q": "What is the difference between müssen and sollen?",
        "a": "Müssen expresses a real necessity that comes from circumstances or from yourself: Ich muss heute arbeiten. Sollen expresses an expectation, advice or an instruction coming from someone else: Ich soll mehr Sport machen — my doctor says so. English blurs both into have to and should, so choosing between them depends on where the pressure comes from."
      },
      {
        "q": "What is the difference between wollen and möchten?",
        "a": "Wollen states a plain intention and can sound blunt: Ich will schlafen means I want to sleep. Möchte is the polite would like and is the safe choice in shops, restaurants and any request: Ich möchte einen Kaffee. Ordering with Ich will einen Kaffee is grammatically correct but comes across as demanding to German ears."
      },
      {
        "q": "How do modal verbs conjugate in German?",
        "a": "They are irregular in the singular, usually with a vowel change, and the ich and er forms are identical with no ending: ich kann, du kannst, er kann; ich muss, du musst, er muss. The plural forms are regular: wir können, ihr könnt, sie können. That missing -t on the er form is what surprises most learners."
      }
    ]
  },
  "a1.2/prepositions-accusative": {
    "snippetIntro": "Five German prepositions always take the accusative case: für, um, durch, gegen and ohne. Any noun after them must be accusative, so masculine der becomes den and ein becomes einen — für den Vater, ohne einen Freund — while feminine, neuter and plural forms remain unchanged.",
    "faqHeading": "Common questions about accusative prepositions in German",
    "faqs": [
      {
        "q": "Which German prepositions always take the accusative?",
        "a": "Five of them: für (for), um (around, at), durch (through), gegen (against) and ohne (without). Many learners memorise them with the mnemonic FUGDO — für, um, gegen, durch, ohne. They are absolutely reliable — there is no context in which these five switch to another case, which makes them one of the easiest rules in German."
      },
      {
        "q": "What changes after für, um, durch, gegen and ohne?",
        "a": "Only masculine articles visibly change, because only they have a separate accusative form. Der becomes den, ein becomes einen, kein becomes keinen and mein becomes meinen: für den Vater, ohne einen Bruder, durch meinen Garten. Feminine, neuter and plural articles are identical to their nominative forms, so für die Frau and für das Kind need no change."
      },
      {
        "q": "Why is it für meinen Vater and not für mein Vater?",
        "a": "Because für always triggers the accusative and Vater is masculine, so the possessive mein must take the masculine accusative ending -en. Possessives follow exactly the same pattern as ein, so ein becomes einen and mein becomes meinen. With a feminine noun nothing changes: für meine Mutter is correct as it stands."
      },
      {
        "q": "Does um always mean around in German?",
        "a": "No, it has two everyday uses. With places it means around: Die Kinder laufen um den Tisch. With clock times it means at: Wir treffen uns um acht Uhr. In the time expression there is no visible article, so the accusative rule is invisible, but it still applies whenever a noun with an article follows."
      },
      {
        "q": "How do I remember which case a German preposition takes?",
        "a": "Learn the preposition and its case as one unit, the same way you learn a noun with its article. Say für den, ohne den, durch den aloud until the accusative feels automatic. Because these five never vary, the habit transfers directly, and later you only have to learn the dative and two-way prepositions as separate groups."
      }
    ]
  },
  "a2.1/dative-case": {
    "snippetIntro": "The German dative case marks the indirect object — the person or thing that receives something. It answers the question wem? (to whom?), and it changes the articles for every gender: der becomes dem, die becomes der, das becomes dem, and plural die becomes den plus an -n on the noun, as in Ich gebe dem Mann das Buch.",
    "faqHeading": "Common questions about the German dative case",
    "faqs": [
      {
        "q": "When do I use the dative case in German?",
        "a": "Use dative for the receiver of an action, for certain verbs, and after certain prepositions. In Ich gebe dem Mann das Buch, the book is accusative (what is given) and dem Mann is dative (who gets it). Verbs like helfen, danken and gehören always take dative: Ich helfe meinem Vater, Das gehört einem Freund."
      },
      {
        "q": "What is the difference between accusative and dative in German?",
        "a": "Accusative marks the direct object — what is affected, answering wen? or was?. Dative marks the indirect object — who receives it, answering wem?. In Er dankt dem Lehrer there is only a dative object, because danken takes dative. A sentence can hold both: Ich gebe dem Mann (dative) das Buch (accusative)."
      },
      {
        "q": "How do German articles change in the dative case?",
        "a": "All four genders change, unlike accusative where only masculine shifts. Masculine der becomes dem and ein becomes einem; feminine die becomes der and eine becomes einer; neuter das becomes dem; plural die becomes den, and the noun usually adds -n, as in mit den Kindern. Masculine and neuter share one dative form."
      },
      {
        "q": "Which German verbs take the dative case?",
        "a": "A fixed group of verbs takes a dative object with no accusative at all. The most common are helfen, danken, gehören, gefallen, antworten, folgen and glauben. So you say Ich helfe meinem Vater, not meinen Vater, and Er dankt dem Lehrer. Learn each of these verbs together with dative, the way you learn a noun with its article."
      },
      {
        "q": "How do I know if a noun is dative in German?",
        "a": "Ask wem? (to whom or for whom?) about the sentence. If the noun answers that question, it is dative. Three other signals confirm it: a dative verb such as helfen or gehören, a dative preposition such as mit, von, zu or bei, and the article forms dem, der, einem, einer or den plus -n."
      }
    ]
  },
  "a2.1/prepositions-dative": {
    "snippetIntro": "Eight German prepositions always take the dative case: aus, bei, mit, nach, seit, von, zu and gegenüber. The noun after them must switch to dative articles — dem, der, dem, den plus -n — which is why you say Ich fahre mit dem Zug and Das ist ein Brief von meiner Mutter, never mit den Zug.",
    "faqHeading": "Common questions about German dative prepositions",
    "faqs": [
      {
        "q": "Which German prepositions take the dative case?",
        "a": "The core eight are aus, bei, mit, nach, seit, von, zu and gegenüber. They are locked to dative permanently — the case never depends on meaning. Whether mit means with a person (mit einer Kollegin) or by a means of transport (mit dem Bus), the following noun still takes dative articles."
      },
      {
        "q": "How do I remember the dative prepositions?",
        "a": "Learn them as one short chant: aus, bei, mit, nach, seit, von, zu — plus gegenüber. Many learners sing them to a tune, because the group is small and fixed. Pair each one with a model phrase you will actually say, such as mit dem Zug, von meiner Mutter, zu meinem Freund, and the case follows automatically."
      },
      {
        "q": "What is the difference between zu and nach in German?",
        "a": "Use nach with countries and cities without an article and with nach Hause: Ich fahre nach Berlin. Use zu for people, businesses and specific places: Ich gehe zu meinem Freund, zum Arzt, zum Supermarkt. Both take dative, so only the choice of word changes, never the endings that follow."
      },
      {
        "q": "What are the German dative contractions?",
        "a": "Four contractions are standard, not slang, and are preferred in speech and writing: von plus dem becomes vom, zu plus dem becomes zum, zu plus der becomes zur, and bei plus dem becomes beim. So you say Ich gehe zur Schule and Ich bin beim Arzt. Keep the full form only for emphasis on a specific item."
      },
      {
        "q": "Do dative prepositions ever take the accusative?",
        "a": "No. These eight are one-way prepositions and never switch case. That makes them easier than the nine two-way prepositions (in, an, auf, über, unter, vor, hinter, neben, zwischen), which alternate between accusative for movement and dative for location. With mit, von, zu and the rest, there is nothing to decide."
      }
    ]
  },
  "a2.1/two-way-prepositions": {
    "snippetIntro": "German has nine two-way prepositions — in, an, auf, über, unter, vor, hinter, neben and zwischen — that take either accusative or dative. Use accusative for movement toward a new place (wohin?) and dative for a fixed position (wo?): Ich lege das Buch auf den Tisch versus Das Buch liegt auf dem Tisch.",
    "faqHeading": "Common questions about German two-way prepositions",
    "faqs": [
      {
        "q": "What are the nine two-way prepositions in German?",
        "a": "They are in, an, auf, über, unter, vor, hinter, neben and zwischen. A common memory trick pictures a house: you go IN it, hang something AN the wall, stand AUF the roof, fly ÜBER it, hide UNTER it, park VOR or HINTER it, plant a tree NEBEN it, and squeeze ZWISCHEN two of them."
      },
      {
        "q": "How do I know whether to use accusative or dative with a two-way preposition?",
        "a": "Ask a question. If wohin? (where to?) fits, something is moving to a new place, so use accusative: Ich gehe in den Park. If wo? (where?) fits, the thing simply is somewhere, so use dative: Ich bin im Park. The verb usually tells you which question applies."
      },
      {
        "q": "What is the difference between in den Park and im Park?",
        "a": "In den Park is accusative and means into the park — you are crossing the boundary and arriving. Im Park is a contraction of in dem Park, dative, and means inside the park, where you already are. Ich gehe in den Park describes the trip; Ich spiele im Park describes what happens after arrival."
      },
      {
        "q": "Why does German have verb pairs like legen and liegen?",
        "a": "Each pair splits action from state. Legen, stellen, setzen and hängen mean someone places something and take accusative: Sie hängt das Bild an die Wand. Liegen, stehen, sitzen and hängen mean something already is somewhere and take dative: Das Bild hängt an der Wand. The verb choice and the case always match."
      },
      {
        "q": "Is movement inside one place accusative or dative?",
        "a": "Dative. What matters is crossing into a new location, not motion itself. Ich laufe im Park uses dative because the running stays inside the park. Ich laufe in den Park uses accusative because the park is the destination you enter. Ask whether the preposition names a destination or the setting."
      }
    ]
  },
  "a2.1/possessive-pronouns": {
    "snippetIntro": "German possessives are mein (my), dein (your), sein (his/its), ihr (her), unser (our), euer (your plural) and ihr/Ihr (their/your formal). Unlike English, they take endings that match the gender, number and case of the noun that follows, using exactly the same pattern as ein/eine: mein Hund, meine Katze, seinen Hund.",
    "faqHeading": "Common questions about German possessive pronouns",
    "faqs": [
      {
        "q": "What are the possessive pronouns in German?",
        "a": "There are eight base forms, one per personal pronoun: ich to mein, du to dein, er to sein, sie to ihr, es to sein, wir to unser, ihr to euer, and sie/Sie to ihr/Ihr. Each one then takes an ending. Note that sein covers both his and its, while ihr covers both her and their."
      },
      {
        "q": "How do German possessive endings work?",
        "a": "They copy the ein/eine pattern exactly. Nominative: mein Hund (masculine), meine Katze (feminine), mein Buch (neuter), meine Bücher (plural). Accusative changes only masculine to meinen: Ich sehe seinen Hund. Dative gives meinem, meiner, meinem and meinen. Learn the endings once and they work for dein, sein, ihr, unser and euer too."
      },
      {
        "q": "What is the difference between sein and ihr in German?",
        "a": "Sein means his or its and refers back to a masculine or neuter owner; ihr means her or their and refers back to a feminine or plural owner. The ending agrees with the thing owned, not the owner: seine Mutter is his mother, ihr Vater is her father. Capitalised Ihr means your in the formal Sie form."
      },
      {
        "q": "Why is it mein Hund but meine Katze?",
        "a": "Because the ending agrees with the noun that follows. Hund is masculine, so the nominative form has no ending: mein Hund. Katze is feminine, so it takes -e: meine Katze. It works exactly like ein Hund versus eine Katze. The owner never changes the ending — only the gender, number and case of the possession do."
      },
      {
        "q": "How do I say your in German?",
        "a": "It depends on who you are addressing. Use dein for one person you know well (Wo ist dein Buch?), euer for several people you know well (euer Haus), and capitalised Ihr for the formal Sie, singular or plural (Ist das Ihr Mantel?). All three then take the normal ein-type endings."
      }
    ]
  },
  "a2.1/separable-verbs": {
    "snippetIntro": "German separable verbs are made of a stressed prefix plus a base verb, such as aufstehen or ankommen. In a main clause the conjugated verb stays in position two and the prefix jumps to the very end of the sentence: aufstehen becomes Ich stehe jeden Tag um 7 Uhr auf.",
    "faqHeading": "Common questions about German separable verbs",
    "faqs": [
      {
        "q": "What is a separable verb in German?",
        "a": "It is a verb built from a prefix and a base verb that split apart in main clauses. Aufstehen (to get up) is one word in the infinitive, but becomes Ich stehe um 7 Uhr auf when you use it. The prefix usually changes the meaning: stehen means to stand, aufstehen means to get up."
      },
      {
        "q": "How do I know if a German prefix separates?",
        "a": "Listen to the stress. Separable prefixes are stressed — AUFstehen, ANkommen, ABfahren — and they always split. Inseparable prefixes are unstressed and never split: be-, ge-, er-, ver-, ent-, emp-, miss- and zer-, as in besuchen and verstehen. The common separable prefixes are ab-, an-, auf-, aus-, ein-, mit-, vor- and zu-."
      },
      {
        "q": "Where does the prefix go in a German sentence?",
        "a": "To the very end of the main clause, after every other element. Ich rufe dich später an puts an behind both the object and the time expression. If the sentence has more information, the prefix still waits at the end: Der Zug fährt heute um 8 Uhr vom Hauptbahnhof ab."
      },
      {
        "q": "Do separable verbs split in every sentence?",
        "a": "No. They stay joined whenever the verb is not the conjugated one. After a modal you use the full infinitive: Ich muss früh aufstehen. In a subordinate clause the prefix rejoins at the end: ..., weil ich früh aufstehe. In the perfect tense the ge- slots between them: Wir sind um 10 Uhr angekommen."
      },
      {
        "q": "How do separable verbs work in the perfect tense?",
        "a": "The ge- of the past participle sits between the prefix and the stem, and the whole word stays together: ankommen becomes angekommen, aufstehen becomes aufgestanden, anrufen becomes angerufen. So Der Zug ist um 8 Uhr abgefahren. The auxiliary haben or sein takes position two and the participle goes to the end."
      }
    ]
  },
  "a2.1/perfect-tense-haben": {
    "snippetIntro": "The German Perfekt is the normal past tense in conversation, and most verbs form it with haben plus a past participle. Conjugate haben in position two and send the participle to the end: regular verbs build it as ge- plus stem plus -t, so spielen gives Ich habe Fußball gespielt.",
    "faqHeading": "Common questions about the German perfect tense with haben",
    "faqs": [
      {
        "q": "How do you form the perfect tense in German?",
        "a": "Take three steps. Conjugate haben in position two (ich habe, du hast, er hat), build the past participle, and put that participle at the very end of the sentence. For regular verbs the participle is ge- plus the stem plus -t: ge + spiel + t gives gespielt, as in Ich habe Fußball gespielt."
      },
      {
        "q": "What is the difference between regular and irregular past participles?",
        "a": "Regular (weak) verbs follow ge- plus stem plus -t: gemacht, gekauft, gelernt, gewohnt. Irregular (strong) verbs end in -en and often change their stem vowel: essen gives gegessen, trinken gives getrunken, schreiben gives geschrieben, nehmen gives genommen. The strong forms have to be memorised, so learn each verb with its participle."
      },
      {
        "q": "Which German verbs have no ge- in the participle?",
        "a": "Two groups. Verbs ending in -ieren drop it completely: studieren gives studiert, telefonieren gives telefoniert, reparieren gives repariert. Verbs with an inseparable prefix also drop it: besuchen gives besucht, verstehen gives verstanden, erzählen gives erzählt. In both cases the unstressed first syllable already carries what ge- would mark."
      },
      {
        "q": "When should I use Perfekt instead of Präteritum?",
        "a": "Use Perfekt for almost everything you say out loud about the past — it is the standard spoken past tense across most of Germany. Präteritum belongs mainly to written narrative, plus the everyday exceptions sein, haben and the modal verbs, where Germans say ich war, ich hatte and ich konnte rather than the Perfekt forms."
      },
      {
        "q": "How do I ask a question in the German perfect tense?",
        "a": "Move the conjugated form of haben to the front or keep it after the question word, and leave the participle at the end. So Was hast du gemacht? asks what did you do, and Hast du das Buch gelesen? asks whether you read the book. The participle never moves out of final position."
      }
    ]
  },
  "a2.1/perfect-tense-sein": {
    "snippetIntro": "A specific group of German verbs forms the perfect tense with sein instead of haben: verbs of movement from place to place, verbs of change of state, and sein and bleiben themselves. That is why you say Ich bin nach Berlin gefahren and Sie ist gestern angekommen, but Ich habe Pizza gegessen.",
    "faqHeading": "Common questions about the German perfect tense with sein",
    "faqs": [
      {
        "q": "How do I know if a German verb takes haben or sein?",
        "a": "Ask whether the verb describes going somewhere or becoming something. Movement to a new place takes sein: gehen, kommen, fahren, fliegen, laufen, reisen. Change of state also takes sein: werden, sterben, aufwachen, einschlafen. Sein and bleiben take sein too. Everything else — activities with no destination — takes haben."
      },
      {
        "q": "Which German verbs use sein in the perfect tense?",
        "a": "The main movement verbs are gehen (gegangen), kommen (gekommen), fahren (gefahren), fliegen (geflogen), laufen (gelaufen), reisen (gereist), steigen (gestiegen) and fallen (gefallen). Add the change-of-state verbs werden (geworden), sterben (gestorben), aufwachen and einschlafen, plus sein (gewesen) and bleiben (geblieben)."
      },
      {
        "q": "Why is it ich bin gegangen and not ich habe gegangen?",
        "a": "Because gehen describes moving from one place to another, and German marks that class of verbs with sein as the auxiliary. The participle itself does not change — only the helper verb does. Compare Wir sind nach Hause gegangen (movement, sein) with Ich habe geschlafen (activity, haben)."
      },
      {
        "q": "Can a German verb take both haben and sein?",
        "a": "Yes, when the meaning shifts. Schwimmen with a destination takes sein — Ich bin ans andere Ufer geschwommen — but as a general activity it takes haben: Ich habe eine Stunde geschwommen. Fahren works the same way: Ich bin nach Berlin gefahren, but Ich habe das Auto gefahren, where the car is a direct object."
      },
      {
        "q": "Where do bin and the participle go in the sentence?",
        "a": "The conjugated form of sein takes position two, exactly like haben, and the participle waits at the end. Der Zug ist um 8 Uhr abgefahren places ist second and abgefahren last. With separable verbs the ge- sits inside the participle, so ankommen gives Sie ist gestern angekommen."
      }
    ]
  },
  "a2.1/imperative-mood": {
    "snippetIntro": "German has three imperative forms because it has three ways to say you. For du use the bare verb stem (Komm!), for ihr use the normal ihr-form (Kommt!), and for formal Sie use the infinitive followed by Sie (Kommen Sie!). Adding bitte softens any of them: Komm bitte her!",
    "faqHeading": "Common questions about the German imperative",
    "faqs": [
      {
        "q": "How do you form commands in German?",
        "a": "Pick the form that matches your listener. For du, take the du-form and drop the -st: du kommst gives Komm!, du machst gives Mach!. For ihr, use the ordinary ihr-form: Kommt!, Macht!. For Sie, use the infinitive plus Sie: Kommen Sie!, Machen Sie!. Only the Sie-form keeps the pronoun."
      },
      {
        "q": "What are the three imperative forms in German?",
        "a": "They mirror the three you-pronouns: du for one person you know well, ihr for several people you know well, and Sie for formal address, singular or plural. The same command therefore has three shapes: Komm bitte her!, Kommt bitte her!, and Kommen Sie bitte her!. Using the wrong one can sound rude or oddly stiff."
      },
      {
        "q": "Do stem-changing verbs keep their vowel change in the imperative?",
        "a": "Only the e to i or ie change survives. Lesen gives Lies!, sprechen gives Sprich!, geben gives Gib!, nehmen gives Nimm!. The a to ä change disappears in the du-imperative: fahren gives Fahr!, not Fähr!, and schlafen gives Schlaf!. The ihr- and Sie-forms are unaffected either way."
      },
      {
        "q": "How do I make a German command polite?",
        "a": "Add bitte, which fits naturally after the verb or the object: Komm bitte her!, Kommen Sie bitte her!, Mach bitte die Tür zu!. Choosing the Sie-form is itself the strongest politeness signal with strangers. For requests, a question with können is even softer: Könnten Sie mir bitte helfen?"
      },
      {
        "q": "What is the imperative of sein and haben in German?",
        "a": "Sein is fully irregular: Sei ruhig! for du, Seid ruhig! for ihr, and Seien Sie ruhig! for Sie. Haben is more predictable but still worth memorising: Hab Geduld!, Habt Geduld!, Haben Sie Geduld!. These two show up constantly in instructions and encouragement, so learn all six forms as a set."
      }
    ]
  },
  "a2.2/reflexive-verbs": {
    "snippetIntro": "German reflexive verbs use a pronoun that points back at the subject: mich, dich, sich, uns, euch, sich. The pronoun changes with the person, so waschen gives Ich wasche mich, Du wäschst dich, Er wäscht sich — and many German verbs such as sich freuen or sich beeilen are always reflexive even though their English equivalents are not.",
    "faqHeading": "Common questions about German reflexive verbs",
    "faqs": [
      {
        "q": "What are reflexive verbs in German?",
        "a": "They are verbs whose action points back at the subject, marked by a reflexive pronoun. Ich wasche mich jeden Morgen means I wash myself every morning. The pronouns are mich, dich, sich, uns, euch and sich. Many German verbs need this pronoun even where English does not, such as Wir müssen uns beeilen for we have to hurry."
      },
      {
        "q": "What are the German reflexive pronouns?",
        "a": "In the accusative they are mich (ich), dich (du), sich (er/sie/es), uns (wir), euch (ihr) and sich (sie/Sie). Only the third person and the formal Sie use sich, and it is written lowercase even in the formal form. The dative set is identical except that mich becomes mir and dich becomes dir."
      },
      {
        "q": "When do reflexive verbs take dative instead of accusative?",
        "a": "Use the dative pronoun when the sentence already has a direct object. Ich wasche mich has no other object, so mich is accusative. Ich wasche mir die Hände has die Hände as the direct object, so the reflexive shifts to mir. The same logic gives Du wäschst dir die Hände and Ich putze mir die Zähne."
      },
      {
        "q": "Which German verbs are always reflexive?",
        "a": "A useful core group includes sich freuen (to be glad), sich erinnern (to remember), sich fühlen (to feel), sich setzen (to sit down), sich beeilen (to hurry), sich interessieren (to be interested), sich ärgern (to be annoyed) and sich entschuldigen (to apologise). Learn each with its pronoun and preposition: Er freut sich auf den Urlaub."
      },
      {
        "q": "Where does the reflexive pronoun go in a German sentence?",
        "a": "Normally straight after the conjugated verb: Ich freue mich auf das Wochenende. If the subject follows the verb, the pronoun comes after the subject noun but can precede a subject pronoun. With a modal, the pronoun still follows the conjugated verb: Wir müssen uns beeilen. In the imperative it stays too: Beeil dich!"
      }
    ]
  },
  "a2.2/simple-past-sein-haben": {
    "snippetIntro": "German has two past tenses, and for sein and haben speakers almost always use the Präteritum rather than the Perfekt. The forms are war, warst, war, waren, wart, waren and hatte, hattest, hatte, hatten, hattet, hatten — so you say Ich war gestern sehr müde and Er hatte keine Zeit für mich.",
    "faqHeading": "Common questions about war and hatte in German",
    "faqs": [
      {
        "q": "How do you say was and were in German?",
        "a": "Use the Präteritum of sein: ich war, du warst, er/sie/es war, wir waren, ihr wart, sie/Sie waren. Note that ich and er/sie/es share the same ending-free form war. So Ich war gestern sehr müde means I was very tired yesterday, and Du warst nicht zu Hause means you were not at home."
      },
      {
        "q": "What is the past tense of haben in German?",
        "a": "It is hatte: ich hatte, du hattest, er/sie/es hatte, wir hatten, ihr hattet, sie/Sie hatten. The pattern matches sein, with ich and er/sie/es identical. Er hatte keine Zeit für mich means he had no time for me. Note the double t, which distinguishes hatte from the subjunctive hätte (would have)."
      },
      {
        "q": "What is the difference between Präteritum and Perfekt in German?",
        "a": "Both describe the past, but they split by register and by verb. Perfekt dominates spoken German for ordinary verbs: Ich habe gegessen, Ich bin gefahren. Präteritum dominates written narrative — and for sein, haben and the modal verbs it is the spoken norm too, which is why you hear ich war, ich hatte and ich konnte."
      },
      {
        "q": "Can I say ich bin gewesen instead of ich war?",
        "a": "It is grammatically correct, and in southern Germany and Austria you will hear it. Everywhere else ich war is the natural choice and sounds far less heavy. The same applies to haben: ich hatte is preferred over ich habe gehabt. When in doubt with these two verbs, reach for the Präteritum."
      },
      {
        "q": "Which other German verbs are usually used in the Präteritum?",
        "a": "Besides sein and haben, the modal verbs behave the same way: ich konnte, ich musste, ich wollte, ich durfte, ich sollte and ich mochte are far more common than their Perfekt forms. Werden also often appears as wurde. For every other verb, the spoken past stays Perfekt: Wir waren letztes Jahr in Italien, aber wir haben nichts gesehen."
      }
    ]
  },
  "a2.2/coordinating-conjunctions": {
    "snippetIntro": "German has five coordinating conjunctions — und, aber, oder, denn and sondern — and none of them changes the word order. The clause after them keeps the normal subject-verb pattern, as in Ich bleibe zu Hause, denn ich bin krank, where bin stays in second position instead of moving to the end.",
    "faqHeading": "Common questions about German coordinating conjunctions",
    "faqs": [
      {
        "q": "What are the coordinating conjunctions in German?",
        "a": "There are five: und (and), aber (but), oder (or), denn (because) and sondern (but rather). They join two clauses of equal rank and leave word order untouched, which makes them the easiest connectors to learn. Ich trinke Kaffee und esse Kuchen keeps the verb in its usual position in both halves."
      },
      {
        "q": "Do German coordinating conjunctions change word order?",
        "a": "No. They sit in what grammarians call position zero, outside the clause, so they do not count as the first element. The subject follows and the conjugated verb stays second: Das Essen ist gut, aber teuer, and Möchtest du Tee oder Kaffee?. This is exactly what separates them from subordinating conjunctions like weil."
      },
      {
        "q": "What is the difference between aber and sondern in German?",
        "a": "Aber joins two things that are both true: Es ist teuer, aber gut. Sondern corrects a negative statement, so the first part must contain nicht or kein: Nicht Kaffee, sondern Tee — not coffee, but tea instead. If you cannot say not X in the first half, aber is the word you need."
      },
      {
        "q": "What is the difference between denn and weil?",
        "a": "Both mean because, but they behave differently. Denn is coordinating and keeps normal word order: Ich bleibe, denn ich bin müde. Weil is subordinating and pushes the verb to the end: Ich bleibe, weil ich müde bin. Denn feels slightly more formal or written; weil is the everyday spoken choice."
      },
      {
        "q": "Do I need a comma before und in German?",
        "a": "Usually not. German drops the comma before und and oder when they join two main clauses, and it is never used when the second half shares the subject, as in Ich trinke Kaffee und esse Kuchen. Aber, denn and sondern, by contrast, do take a comma: Das Essen ist gut, aber teuer."
      }
    ]
  },
  "a2.2/subordinating-conjunctions": {
    "snippetIntro": "German subordinating conjunctions such as dass, weil, wenn, ob and obwohl send the conjugated verb to the end of their clause. That is why Er kommt heute becomes Ich weiß, dass er heute kommt, and Ich bin krank becomes Ich bleibe zu Hause, weil ich krank bin.",
    "faqHeading": "Common questions about German subordinating conjunctions",
    "faqs": [
      {
        "q": "What are subordinating conjunctions in German?",
        "a": "They introduce a dependent clause that cannot stand alone, and they force the conjugated verb to the final position. The most common are dass (that), weil (because), wenn (when/if), ob (whether), obwohl (although), während (while), bevor (before) and nachdem (after). Each clause is separated from the main clause by a comma."
      },
      {
        "q": "Why does the verb go to the end after weil?",
        "a": "Because weil marks its clause as subordinate, and German signals that rank by moving the conjugated verb to the last slot. Ich bin krank on its own has bin in second position; after weil it becomes weil ich krank bin. The rule applies to every subordinating conjunction, not just weil."
      },
      {
        "q": "What is the difference between wenn and ob in German?",
        "a": "Both can translate as if, but they are not interchangeable. Wenn introduces a condition or a repeated time: Wenn es regnet, bleibe ich zu Hause. Ob introduces an indirect yes-no question: Ich weiß nicht, ob er morgen kommt. If you could replace if with whether in English, German needs ob."
      },
      {
        "q": "Where do modal verbs go in a subordinate clause?",
        "a": "The conjugated modal goes last, after the infinitive it governs. Er muss heute arbeiten becomes ..., weil er heute arbeiten muss. Sie kann gut singen becomes ..., dass sie gut singen kann. The rule is simple: the infinitive keeps its place at the end, and the conjugated verb slots in behind it."
      },
      {
        "q": "Can a German sentence start with a subordinate clause?",
        "a": "Yes, and then the main clause inverts. The whole subordinate clause counts as the first element, so the main verb comes immediately after the comma, before the subject: Wenn es regnet, bleibe ich zu Hause. Compare the other order, Ich bleibe zu Hause, wenn es regnet, where nothing inverts."
      }
    ]
  },
  "a2.2/subordinate-word-order": {
    "snippetIntro": "In a German main clause the conjugated verb sits in position two, but in a subordinate clause it moves to the very end. So Er lernt jeden Tag Deutsch becomes Ich weiß, dass er jeden Tag Deutsch lernt — the conjunction opens the clause, everything else follows in normal order, and the verb closes it.",
    "faqHeading": "Common questions about German subordinate clause word order",
    "faqs": [
      {
        "q": "What is the word order in a German subordinate clause?",
        "a": "Conjunction, then subject, then objects, time and place expressions, and finally the conjugated verb. For example ..., dass ich dir morgen das Buch gebe places gebe last. Nothing else changes rank — only the verb moves. A comma always separates the subordinate clause from the main clause."
      },
      {
        "q": "What triggers verb-final word order in German?",
        "a": "Subordinating conjunctions such as dass, weil, wenn, ob, obwohl, als, bevor, nachdem and während, plus relative pronouns and indirect questions. Coordinating conjunctions do not: after und, aber, oder, denn and sondern the verb stays in second position. Learning which list a connector belongs to is what makes the order predictable."
      },
      {
        "q": "What happens to separable verbs in a subordinate clause?",
        "a": "The prefix rejoins the verb and the whole word moves to the end as one piece. Ich stehe früh auf becomes ..., weil ich früh aufstehe. The same happens with ankommen and mitbringen: ..., dass wir um 10 Uhr ankommen. This is often easier than the main clause, where the prefix has to travel separately."
      },
      {
        "q": "How does the perfect tense work in a subordinate clause?",
        "a": "The participle comes first and the conjugated auxiliary goes last. Ich habe das Buch gelesen becomes ..., dass ich das Buch gelesen habe. Er ist nach Berlin gefahren becomes ..., weil er nach Berlin gefahren ist. The auxiliary habe, bin, hat or ist always takes the final slot."
      },
      {
        "q": "What happens when the subordinate clause comes first?",
        "a": "The main clause then inverts, because the entire subordinate clause fills the first position. Wenn ich Zeit habe, komme ich zu dir puts komme directly after the comma, ahead of ich. The same applies with obwohl: Obwohl es regnet, gehen wir spazieren. Learners often call this the verb-comma-verb pattern."
      }
    ]
  },
  "a2.2/comparative": {
    "snippetIntro": "The German comparative is formed by adding -er to the adjective and using als for than: schnell becomes schneller, so Mein Auto ist schneller als dein Auto. Short adjectives with a, o or u usually add an umlaut as well — alt becomes älter, groß becomes größer — and gut, viel and gern are irregular.",
    "faqHeading": "Common questions about the German comparative",
    "faqs": [
      {
        "q": "How do you form the comparative in German?",
        "a": "Add -er to the adjective, no matter how long the word is. Schnell gives schneller, klein gives kleiner, billig gives billiger, and even interessant gives interessanter. German never uses a separate word the way English uses more, so more interesting is simply interessanter, not mehr interessant."
      },
      {
        "q": "When do German adjectives add an umlaut in the comparative?",
        "a": "Most one-syllable adjectives containing a, o or u take one: alt gives älter, jung gives jünger, groß gives größer, kurz gives kürzer, lang gives länger, warm gives wärmer, kalt gives kälter, stark gives stärker. Longer adjectives never do, so langsam stays langsamer. Treat the umlauting group as a short list to memorise."
      },
      {
        "q": "Do I use als or wie for comparisons in German?",
        "a": "Use als for than, when two things are unequal: Er ist älter als ich, Sie läuft schneller als er. Use wie only for as, when two things are equal, in the pattern so ... wie: Er ist so alt wie ich. Mixing them up is one of the most noticeable learner errors."
      },
      {
        "q": "What are the irregular comparatives in German?",
        "a": "Six matter most. Gut becomes besser, viel becomes mehr, and gern becomes lieber — all completely different words, like good/better in English. Hoch drops its c to give höher, nah adds an umlaut to give näher, and teuer drops its e to give teurer. So Das Essen hier ist besser."
      },
      {
        "q": "Do comparative adjectives take endings before a noun?",
        "a": "Yes. When the comparative stands before a noun it keeps the -er and then adds the normal adjective ending on top: ein schnelleres Auto, ein älterer Mann, die bessere Lösung. After sein and other linking verbs no ending is needed, which is why Mein Auto ist schneller has the bare form."
      }
    ]
  },
  "a2.2/superlative": {
    "snippetIntro": "German has two superlative forms with the same meaning. Use am plus the adjective plus -sten after a verb (Er ist am schnellsten), and der/die/das plus the adjective plus -ste before a noun (Das ist das schnellste Auto). Adjectives ending in d, t, s, ß or z add -esten: am ältesten.",
    "faqHeading": "Common questions about the German superlative",
    "faqs": [
      {
        "q": "How do you form the superlative in German?",
        "a": "Add -sten to the adjective after am, or -ste before a noun with a definite article. Schnell gives am schnellsten and das schnellste Auto. After d, t, s, ß or z insert an e for pronunciation: alt gives am ältesten, kalt gives am kältesten, kurz gives am kürzesten."
      },
      {
        "q": "What is the difference between am schnellsten and der schnellste?",
        "a": "They mean the same thing but fit different sentence positions. Am schnellsten follows a verb, usually sein: Er ist am schnellsten, Das Essen hier ist am besten. Der, die or das plus -ste comes directly before a noun: Das ist das schnellste Auto, Sie ist die beste Spielerin."
      },
      {
        "q": "Do German superlatives take umlauts?",
        "a": "Yes — the same adjectives that umlaut in the comparative do so in the superlative. Alt gives älter and am ältesten, groß gives größer and am größten, kurz gives kürzer and am kürzesten, kalt gives kälter and am kältesten. Learning each adjective as a full chain saves you from guessing later."
      },
      {
        "q": "What are the irregular superlatives in German?",
        "a": "They match the irregular comparatives. Gut gives besser and am besten or der beste; viel gives mehr and am meisten; gern gives lieber and am liebsten; hoch gives höher and am höchsten; nah gives näher and am nächsten. Am liebsten is especially useful, since it means most of all or as a favourite."
      },
      {
        "q": "How do I say the most in German?",
        "a": "German does not use a separate word the way English uses most. Even long adjectives take the ending: the most interesting film is der interessanteste Film, not der meiste interessante Film. Am meisten exists, but it is the superlative of viel and means the greatest quantity, as in Er arbeitet am meisten."
      }
    ]
  },
  "a2.2/future-tense": {
    "snippetIntro": "German forms the future tense (Futur I) with the conjugated verb werden in position two and the main verb as an infinitive at the end: Ich werde morgen kommen. Werden is irregular — ich werde, du wirst, er wird, wir werden, ihr werdet, sie werden — and in everyday speech the present tense with a time word often replaces it.",
    "faqHeading": "Common questions about the German future tense",
    "faqs": [
      {
        "q": "How do you form the future tense in German?",
        "a": "Conjugate werden and put the main verb at the end as an infinitive. Ich werde morgen nach Berlin fahren follows the pattern subject, werden, middle information, infinitive. It maps neatly onto English will: Du wirst das verstehen means you will understand that, and Es wird regnen means it will rain."
      },
      {
        "q": "How is werden conjugated in German?",
        "a": "It is irregular in the du- and er-forms: ich werde, du wirst, er/sie/es wird, wir werden, ihr werdet, sie/Sie werden. The stem vowel shifts from e to i in the singular, and the du-form drops the d entirely. These forms are worth drilling, since werden also builds the passive later on."
      },
      {
        "q": "Can I use the present tense for the future in German?",
        "a": "Yes, and Germans usually do when a time expression makes the future clear. Ich komme morgen is as correct and far more common than Ich werde morgen kommen. Likewise Wir reisen im Sommer works for Wir werden im Sommer reisen. Both are standard; the present simply sounds lighter."
      },
      {
        "q": "When should I use Futur I instead of the present tense?",
        "a": "Reach for werden when there is no time word to signal the future, when you are making a prediction or a promise (Es wird regnen, Ich werde dir helfen), or when you want to sound emphatic or formal. Written German and announcements also favour the full future form."
      },
      {
        "q": "Where does the infinitive go in a German future sentence?",
        "a": "At the very end, after every object, time and place expression. Wir werden nächstes Jahr heiraten keeps heiraten last. In a subordinate clause the order flips again and werden moves to the final slot: ..., dass wir nächstes Jahr heiraten werden. Werden always carries the conjugation, and the main verb never changes."
      }
    ]
  },
  "b1.1/genitive-case": {
    "snippetIntro": "The German genitive is the case that shows possession and answers the question wessen? (whose?), as in das Auto des Mannes (the man's car). Masculine and neuter nouns take des plus an -s or -es ending on the noun itself, while feminine and plural nouns simply take der with no change to the noun.",
    "faqHeading": "Common questions about the German genitive",
    "faqs": [
      {
        "q": "How does the genitive case work in German?",
        "a": "The genitive marks the possessor, and German puts the possessed thing first: das Auto des Mannes, literally the car of the man. The article changes to des (masculine and neuter) or der (feminine and plural), and masculine and neuter nouns also add -s or -es. It answers the question wessen? — whose?"
      },
      {
        "q": "When do I add -s and when do I add -es in the genitive?",
        "a": "Add -es when the noun ends in -s, -ß, -x, -z, -tz or -sch, and usually with one-syllable nouns: des Hauses, des Platzes, des Tisches, des Mannes, des Kindes. Add only -s with multi-syllable words, words ending in a vowel and many loanwords: des Lehrers, des Autos, des Kinos. It is purely about what is easier to pronounce."
      },
      {
        "q": "Do feminine nouns change in the genitive?",
        "a": "No. Only the article changes. Die Frau becomes der Frau, and die Mutter becomes der Mutter — the noun itself stays untouched. The same is true of plurals: die Kinder becomes der Kinder, as in die Spielzeuge der Kinder. Only masculine and neuter nouns pick up the extra -s or -es ending."
      },
      {
        "q": "Can I use von instead of the genitive in German?",
        "a": "In everyday spoken German, yes — von plus dative is extremely common: das Auto von dem Mann instead of das Auto des Mannes. But the genitive is still expected in writing, news, academic texts and after prepositions like wegen, trotz and während. Understanding it is essential for reading, even if you often avoid it when speaking."
      },
      {
        "q": "What is the word order with the German genitive?",
        "a": "The possessed item comes first, then the possessor in the genitive: die Tür des Hauses (the door of the house), die Tasche der Frau (the woman's bag). This is the opposite of the English apostrophe-s pattern, so resist translating word for word. Only names work the English way: Annas Buch, Peters Auto."
      }
    ]
  },
  "b1.1/genitive-prepositions": {
    "snippetIntro": "Wegen (because of), während (during), trotz (despite) and statt/anstatt (instead of) are the four core German prepositions that take the genitive case, joined by außerhalb and innerhalb. The noun after them must appear in genitive form — wegen des Regens, während der Pause — which means des or der on the article and an -s or -es on masculine and neuter nouns.",
    "faqHeading": "Common questions about genitive prepositions",
    "faqs": [
      {
        "q": "Which German prepositions take the genitive?",
        "a": "The most common are wegen (because of), während (during), trotz (despite) and statt or anstatt (instead of). Add außerhalb (outside of) and innerhalb (within) and you cover almost everything a B1 learner meets. All of them force the following noun into the genitive: wegen des Wetters, innerhalb eines Jahres."
      },
      {
        "q": "How do I use wegen in a German sentence?",
        "a": "Wegen takes the genitive: wegen des Regens bleibe ich zu Hause (because of the rain I stay home). Feminine nouns just change the article — wegen der Arbeit. With indefinite articles you get wegen eines Problems. There are also fixed pronoun forms you should learn as words: meinetwegen, deinetwegen, seinetwegen, ihretwegen."
      },
      {
        "q": "What is the difference between während and wenn?",
        "a": "Während as a preposition takes a genitive noun and means during a period of time: während der Pause trinke ich Kaffee. Wenn is a conjunction introducing a whole clause and means if or whenever, with the verb at the end. So it is während der Pause but wenn ich Pause habe."
      },
      {
        "q": "Is wegen dem Wetter wrong in German?",
        "a": "It is very widespread in casual speech, but standard written German requires wegen des Wetters. The dative version is treated as colloquial and is marked wrong in exams and formal writing. The same applies to trotz and während: trotz des schlechten Wetters and während der Pause are the safe, correct forms."
      },
      {
        "q": "Where does the genitive preposition go in the sentence?",
        "a": "The whole phrase behaves like one unit and can sit at the start or after the verb. At the start it takes position one, so the verb still comes second: Wegen des Regens bleibe ich zu Hause. Later in the sentence nothing shifts: Ich bleibe wegen des Regens zu Hause. Both are correct."
      }
    ]
  },
  "b1.1/relative-clauses-nom-acc": {
    "snippetIntro": "German relative clauses use der, die and das as relative pronouns, and the pronoun takes its gender from the noun it refers back to but its case from its job inside the relative clause. If it is the subject it is nominative (der Mann, der dort steht); if it is the direct object it is accusative, where only the masculine form changes to den.",
    "faqHeading": "Common questions about German relative clauses",
    "faqs": [
      {
        "q": "How do German relative clauses work?",
        "a": "A relative clause adds information about a noun and is introduced by a relative pronoun that looks like the definite article. Der Mann, der dort steht, ist mein Bruder. Two things decide the form: the gender and number come from the noun outside the clause, the case comes from the role the pronoun plays inside it. The verb always moves to the end."
      },
      {
        "q": "When do I use der and when den in a relative clause?",
        "a": "Use der when the pronoun is the subject, doing the action: Der Mann, der singt, ist berühmt. Use den when it is the direct object, receiving the action: Der Mann, den ich sehe, ist groß. Test it by rebuilding the clause as a full sentence — ich sehe den Mann shows you need the accusative den."
      },
      {
        "q": "Do German relative pronouns need a comma?",
        "a": "Yes, always. German puts a comma before every relative clause and another one after it if the sentence continues: Die Frau, die Deutsch spricht, kommt aus Berlin. Unlike English, the comma is not optional and does not depend on whether the information is essential. Leaving it out is a genuine punctuation error."
      },
      {
        "q": "Where does the verb go in a German relative clause?",
        "a": "At the very end, because a relative clause is a subordinate clause. Das Kind, das im Garten spielt, ist meine Tochter — spielt comes last. With modal or compound verbs the conjugated verb is still final: Der Film, den ich sehen wollte, läuft nicht mehr. This verb-final pattern is the clearest signal you are in a subordinate clause."
      },
      {
        "q": "Can you drop the relative pronoun in German like in English?",
        "a": "No. English lets you say the book I bought, dropping that, but German always requires the pronoun: das Buch, das ich gekauft habe. Omitting it makes the sentence ungrammatical. This is one of the most frequent English-speaker mistakes, so treat the relative pronoun as obligatory in every single relative clause."
      }
    ]
  },
  "b1.1/relative-clauses-dat-gen": {
    "snippetIntro": "When a relative pronoun is the indirect object it takes the dative — dem (masculine and neuter), der (feminine) and denen (plural) — as in der Mann, dem ich helfe. For possession German uses the genitive forms dessen (masculine and neuter) and deren (feminine and plural), both meaning whose: der Mann, dessen Auto rot ist.",
    "faqHeading": "Common questions about dative and genitive relative clauses",
    "faqs": [
      {
        "q": "When do I use dem and denen in a relative clause?",
        "a": "Use them when the pronoun is the dative object inside the clause, typically after dative verbs like helfen, danken, geben and schreiben. Der Mann, dem ich helfe, ist mein Nachbar. Plural takes the special form denen: Die Leute, denen ich schreibe, wohnen in Berlin. Note that plural dative denen is not the same as the article den."
      },
      {
        "q": "What is the difference between dessen and deren?",
        "a": "Both mean whose, and the choice depends on the gender of the owner, not the thing owned. Dessen goes with masculine and neuter nouns: der Mann, dessen Auto rot ist. Deren goes with feminine nouns and all plurals: die Frau, deren Haus groß ist; die Kinder, deren Eltern arbeiten. The noun after them never takes an article."
      },
      {
        "q": "How do I know which case a relative pronoun needs?",
        "a": "Turn the relative clause back into a standalone sentence and check the pronoun's role there. Ich helfe dem Mann gives dative, so you get der Mann, dem ich helfe. Ich sehe den Mann gives accusative, so you get der Mann, den ich sehe. The gender always comes from the noun outside the clause."
      },
      {
        "q": "Does the noun after dessen or deren take an article?",
        "a": "No — dessen and deren replace the article completely, just like sein and ihr do. You say der Mann, dessen Auto rot ist, never dessen das Auto. Adjectives after them take strong endings because nothing else marks the case: die Frau, deren neues Haus groß ist."
      },
      {
        "q": "What about relative pronouns after prepositions?",
        "a": "The preposition comes first and decides the case: die Frau, mit der ich spreche (mit takes dative), or das Thema, über das wir reden (über with accusative here). Unlike English you can never strand the preposition at the end, so the woman I am speaking with becomes die Frau, mit der ich spreche."
      }
    ]
  },
  "b1.1/konjunktiv-ii-wurde": {
    "snippetIntro": "Würde plus an infinitive is the standard way to build Konjunktiv II in German and corresponds to English would: Ich würde gern nach Deutschland reisen. Würde is conjugated in position two while the infinitive moves to the end of the clause, and this construction covers polite requests, wishes, advice and hypothetical situations.",
    "faqHeading": "Common questions about Konjunktiv II with würde",
    "faqs": [
      {
        "q": "How do I use würde in German?",
        "a": "Conjugate würde like a normal verb in second position and send the main verb to the end as an infinitive: Ich würde gern nach Berlin fahren. The forms are ich würde, du würdest, er/sie/es würde, wir würden, ihr würdet, sie/Sie würden. In questions würde comes first: Würden Sie mir helfen?"
      },
      {
        "q": "Is Konjunktiv II a tense in German?",
        "a": "No, it is a mood, not a tense. It does not tell you when something happened but signals that the speaker is treating the situation as unreal, hypothetical or merely polite. That is why Wenn ich reich wäre, würde ich ein Haus kaufen describes a present-day imaginary situation despite using forms borrowed from the past."
      },
      {
        "q": "How do I make polite requests in German?",
        "a": "Swap the imperative for Konjunktiv II and the sentence immediately softens. Helfen Sie mir! sounds like an order, while Würden Sie mir bitte helfen? is genuinely polite. The same works informally: Würdest du mir das Buch geben? Adding bitte and using würde is the standard formula in shops, offices and emails."
      },
      {
        "q": "Where does the verb go in a würde sentence?",
        "a": "In a main clause würde takes position two and the infinitive goes to the very end: Er würde das nie tun. In a question würde moves to the front. In a subordinate clause introduced by wenn or dass, würde travels all the way to the end after the infinitive: ..., weil ich gern reisen würde."
      },
      {
        "q": "When should I not use würde?",
        "a": "Avoid it with sein and haben, where German strongly prefers wäre and hätte: say Wenn ich reich wäre, not wenn ich reich sein würde. The modal verbs behave the same way, giving könnte, müsste, sollte and dürfte. Everywhere else, würde plus infinitive is the natural and safe choice."
      }
    ]
  },
  "b1.1/konjunktiv-ii-ware-hatte": {
    "snippetIntro": "Wäre means would be and hätte means would have — they are the Konjunktiv II forms of sein and haben, and German uses them instead of würde sein or würde haben. They appear in wenn-clauses with the verb at the end (Wenn ich reich wäre) and in main clauses for wishes and polite offers (Ich hätte gern einen Kaffee).",
    "faqHeading": "Common questions about wäre and hätte",
    "faqs": [
      {
        "q": "What is the difference between wäre and würde?",
        "a": "Wäre is the Konjunktiv II of sein, so it already means would be and needs no würde. Würde plus infinitive is the general pattern for almost all other verbs. Say Wenn ich reich wäre, würde ich reisen — wäre for the sein part, würde for reisen. Wenn ich reich sein würde is considered clumsy."
      },
      {
        "q": "How do I conjugate wäre and hätte?",
        "a": "Wäre goes ich wäre, du wärest or wärst, er/sie/es wäre, wir wären, ihr wäret or wärt, sie/Sie wären. Hätte goes ich hätte, du hättest, er/sie/es hätte, wir hätten, ihr hättet, sie/Sie hätten. In both, the ich and er forms are identical, and the umlaut is what marks them as Konjunktiv II."
      },
      {
        "q": "How do I say if I were in German?",
        "a": "Use wenn plus wäre with the verb at the end of the clause: Wenn ich du wäre... (if I were you). The main clause then follows the comma with its verb first: Wenn ich Zeit hätte, würde ich dir helfen. You can also drop wenn and start with the verb: Hätte ich Zeit, würde ich dir helfen."
      },
      {
        "q": "What does ich hätte gern mean?",
        "a": "It means I would like and it is the polite, standard way to order or ask for something: Ich hätte gern einen Kaffee. It is softer than ich will and slightly more formal than ich möchte. In a café, restaurant or shop this phrase alone will carry most of your ordering needs."
      },
      {
        "q": "Can I use wäre and hätte on their own without würde?",
        "a": "Yes, and you often should. Das wäre schön! is a complete Konjunktiv II sentence, as is Ich hätte Zeit. When the main clause is about being or having, wäre or hätte does the whole job — you only reach for würde when a different main verb needs the subjunctive."
      }
    ]
  },
  "b1.1/infinitive-with-zu": {
    "snippetIntro": "German expresses the English to-infinitive with zu plus the infinitive, placed together at the end of the clause: Ich versuche, Deutsch zu lernen. With separable verbs the zu slides inside the word, between prefix and stem, giving forms like anzurufen and aufzustehen rather than zu anrufen.",
    "faqHeading": "Common questions about zu plus infinitive",
    "faqs": [
      {
        "q": "When do I use zu before an infinitive in German?",
        "a": "Use it after verbs and expressions that introduce a second action, such as versuchen, hoffen, beginnen, aufhören, vergessen and vorhaben, and after impersonal phrases like es ist wichtig or es ist schwer. Ich hoffe, dich bald zu sehen. The zu and the infinitive always sit together at the end of the clause."
      },
      {
        "q": "Where does zu go with separable verbs?",
        "a": "It goes inside the verb, between the separable prefix and the stem: anrufen becomes anzurufen, aufstehen becomes aufzustehen, einkaufen becomes einzukaufen. So you say Vergiss nicht, mich anzurufen! and Es ist schwer, früh aufzustehen. Writing zu anrufen as two words is one of the most common learner errors here."
      },
      {
        "q": "Which German verbs do not take zu?",
        "a": "The modal verbs — können, müssen, wollen, sollen, dürfen, mögen — never take zu: Ich kann Deutsch sprechen, not zu sprechen. The same applies to werden and to sehen, hören and lassen when they govern another verb: Ich höre ihn singen. Everything else that chains two verbs generally needs zu."
      },
      {
        "q": "Do I need a comma before zu in German?",
        "a": "Modern German rules make the comma optional in short constructions but strongly recommend it when the zu-clause has its own objects or additions. Write Ich versuche, Deutsch zu lernen with a comma; Sie hört auf zu rauchen is fine without one. Using the comma whenever the clause carries extra words is the safest habit."
      },
      {
        "q": "What is the difference between zu plus infinitive and dass?",
        "a": "Use zu plus infinitive when both actions share the same subject: Ich hoffe, dich zu sehen. Use a dass-clause when the subjects differ: Ich hoffe, dass du kommst. English blurs this with I hope to see you versus I hope you come, so checking who does what decides the German structure."
      }
    ]
  },
  "b1.1/um-zu-ohne-zu": {
    "snippetIntro": "Um ... zu means in order to and expresses purpose, ohne ... zu means without doing something, and anstatt or statt ... zu means instead of doing something. All three wrap around the clause: the connector opens it, any objects follow, and zu plus the infinitive closes it — Ich lerne Deutsch, um in Deutschland zu arbeiten.",
    "faqHeading": "Common questions about um zu and ohne zu",
    "faqs": [
      {
        "q": "How do I say in order to in German?",
        "a": "Use um ... zu. The word um opens the clause, and zu plus the infinitive closes it: Er spart Geld, um ein Auto zu kaufen. It answers the question warum? or wozu? and always states a purpose. English often drops the in order and says just to, but German still needs the full um ... zu frame."
      },
      {
        "q": "What is the difference between um zu and damit?",
        "a": "Both express purpose, but um ... zu requires the same subject in both halves: Ich lerne Deutsch, um in Deutschland zu arbeiten. When the subjects differ you must use damit with a full clause: Ich erkläre es langsam, damit du mich verstehst. If in doubt, damit always works; um ... zu only works with a shared subject."
      },
      {
        "q": "How does ohne zu work in German?",
        "a": "Ohne ... zu describes an action that does not accompany the main one, and it matches the English without plus -ing: Er ging, ohne zu bezahlen (he left without paying). Objects sit between the two parts: Sie arbeitet, ohne Pause zu machen. With separable verbs the zu goes inside: ohne nachzudenken."
      },
      {
        "q": "When do I use anstatt zu or statt zu?",
        "a": "Use them to name the action someone did not do, replaced by another: Anstatt zu arbeiten, spielt er (instead of working, he plays). Both spellings are correct and interchangeable. As with um and ohne, the clause needs the same subject as the main sentence, and separable verbs take zu inside: anstatt fernzusehen."
      },
      {
        "q": "Does the verb go to the end with um zu?",
        "a": "Yes — the infinitive with zu always lands at the very end of its clause, and everything else comes before it: Sie geht früh ins Bett, um fit zu sein. If the um-clause starts the sentence, the main clause follows with its verb in second position after the comma. A comma before um is always required."
      }
    ]
  },
  "b1.2/passive-voice-present": {
    "snippetIntro": "The German present passive is built with a conjugated form of werden plus the past participle at the end of the clause: Das Auto wird gewaschen (the car is being washed). The person or thing receiving the action becomes the subject, and if you need to name the doer you add von plus the dative: Das Haus wird von der Firma gebaut.",
    "faqHeading": "Common questions about the German passive",
    "faqs": [
      {
        "q": "How do you form the passive voice in German?",
        "a": "Conjugate werden for the subject and put the past participle at the end: Ich werde gefragt, du wirst eingeladen, es wird gemacht, wir werden informiert. The participle never changes. So Der Mann wäscht das Auto becomes Das Auto wird gewaschen, moving the object into subject position and dropping the doer."
      },
      {
        "q": "What is the difference between werden and sein in the passive?",
        "a": "Werden plus participle is the process passive and describes an action happening: Die Tür wird geöffnet (the door is being opened). Sein plus participle is the state passive and describes the resulting condition: Die Tür ist geöffnet (the door is open). German keeps these apart much more clearly than English does."
      },
      {
        "q": "How do I say by whom in a German passive sentence?",
        "a": "Use von plus the dative for a person or agent: Das Buch wird von dem Lehrer gelesen, Die Arbeit wird von mir gemacht. For an impersonal cause or means, durch plus accusative is used instead: Die Stadt wurde durch ein Erdbeben zerstört. Very often German simply leaves the agent out entirely."
      },
      {
        "q": "When should I use the passive in German?",
        "a": "Use it when the action matters more than the doer, or when the doer is unknown or irrelevant — instructions, processes, news reports and rules. Hier wird Deutsch gesprochen states what happens without naming anyone. In everyday conversation German often prefers active sentences with man: Man spricht hier Deutsch."
      },
      {
        "q": "Can German verbs without an object be used in the passive?",
        "a": "Yes, and this impersonal passive has no direct English equivalent. Hier wird getanzt means dancing goes on here, and Es wird gearbeitet means work is being done. The sentence starts with es or another element and werden appears in the third person singular. It is common on signs and in announcements."
      }
    ]
  },
  "b1.2/passive-voice-past": {
    "snippetIntro": "German has two past passive forms: the Präteritum passive with wurde plus the participle (Das Auto wurde gewaschen) and the Perfekt passive with sein plus participle plus worden (Das Auto ist gewaschen worden). They mean the same thing; the wurde form dominates in writing and narration, while the ist ... worden form is more usual in speech.",
    "faqHeading": "Common questions about the German past passive",
    "faqs": [
      {
        "q": "How do I form the past passive in German?",
        "a": "For the Präteritum, use wurde plus the past participle: ich wurde gefragt, du wurdest eingeladen, wir wurden informiert, Das Haus wurde 1990 gebaut. For the Perfekt, use a form of sein plus the participle plus worden: Ich bin gefragt worden, Der Brief ist geschickt worden. Both translate as was or has been done."
      },
      {
        "q": "Why is it worden and not geworden?",
        "a": "When werden is a full verb meaning to become, its participle is geworden: Er ist Arzt geworden. When it is only the auxiliary building a passive, the shortened form worden is used: Das Auto ist gewaschen worden. The missing ge- is the signal that you are looking at a passive, not at someone becoming something."
      },
      {
        "q": "Does the German passive perfect use haben or sein?",
        "a": "Always sein, never haben — even for verbs that normally take haben in the active. Man hat das Haus gebaut becomes Das Haus ist gebaut worden, not hat gebaut worden. This catches many learners out, so memorise the fixed frame: sein plus past participle plus worden."
      },
      {
        "q": "What is the difference between wurde gebaut and ist gebaut worden?",
        "a": "None in meaning — both say the house was built. The difference is register and region: wurde gebaut is the normal choice in written German, reports and narratives, while ist gebaut worden is more common in spoken German, especially in the south. Choose the wurde form for essays and exams."
      },
      {
        "q": "How do I put a past passive sentence in the right word order?",
        "a": "The conjugated auxiliary takes position two and the rest goes to the end: Das Auto wurde gestern gewaschen. In the Perfekt, the participle and worden both close the clause, in that order: Das Auto ist gestern gewaschen worden. In a subordinate clause, the conjugated form moves last: ..., weil das Auto gewaschen worden ist."
      }
    ]
  },
  "b1.2/verbs-with-prepositions": {
    "snippetIntro": "Many German verbs are locked to one fixed preposition that you must learn as part of the word: warten auf (to wait for), denken an (to think about), sich freuen auf (to look forward to), Angst haben vor (to be afraid of). The preposition also fixes the case, and when the object is a thing you replace it with a da-compound such as darauf or daran.",
    "faqHeading": "Common questions about German verbs with prepositions",
    "faqs": [
      {
        "q": "Why does German use different prepositions than English?",
        "a": "Because the verb and preposition form a single fixed unit that developed independently in each language. German waits on someone (warten auf), thinks at something (denken an) and depends from something (abhängen von). Translating the English preposition directly gives wrong forms like warten für or denken über, so learn each combination as one vocabulary item."
      },
      {
        "q": "Which case follows a verb preposition in German?",
        "a": "The preposition decides. Auf, für, über and um take the accusative here: Ich warte auf dich, Er interessiert sich für Geschichte. Vor, von, mit, nach and zu take the dative: Ich habe Angst vor Hunden. With two-way prepositions like auf and an in these fixed combinations, the accusative is the usual choice."
      },
      {
        "q": "What are da-compounds in German?",
        "a": "They replace preposition plus pronoun when you refer to a thing rather than a person. Ich warte auf den Bus becomes Ich warte darauf, and Ich denke an die Prüfung becomes Ich denke daran. If the preposition starts with a vowel, an -r- is inserted: darauf, daran, darüber. For people you keep the pronoun: Ich warte auf ihn."
      },
      {
        "q": "How do I ask a question with a verb preposition?",
        "a": "For things use a wo-compound: Worauf wartest du? (What are you waiting for?), Woran denkst du? For people keep the preposition and use a question word in the right case: Auf wen wartest du? An wen denkst du? The rule mirrors the da-compound rule — things get wo-, people get wen or wem."
      },
      {
        "q": "What is the difference between sich freuen auf and sich freuen über?",
        "a": "Sich freuen auf plus accusative looks forward to something still to come: Ich freue mich auf das Wochenende. Sich freuen über plus accusative reacts to something that has already happened: Ich freue mich über dein Geschenk. Same verb, different preposition, different time reference — a good example of why the preposition carries meaning."
      }
    ]
  },
  "b1.2/adjective-declension-strong": {
    "snippetIntro": "Strong adjective declension is used when no article or determiner stands before the adjective, so the adjective itself must show gender, case and number: kalter Kaffee, frisches Brot, frische Milch. The endings largely copy the definite article — -er like der, -e like die, -es like das — with masculine accusative switching to -en, as in Ich trinke kalten Kaffee.",
    "faqHeading": "Common questions about strong adjective endings",
    "faqs": [
      {
        "q": "When do I use strong adjective endings in German?",
        "a": "Whenever nothing before the adjective marks gender and case. That covers bare nouns (kalter Kaffee, frisches Brot), nouns after numbers (zwei kleine Kinder), and nouns after viel, wenig, etwas and nichts. It also applies after prepositions with no article: bei schönem Wetter, mit großer Freude."
      },
      {
        "q": "What are the strong adjective endings in the nominative?",
        "a": "Masculine takes -er (kalter Kaffee ist gut), feminine takes -e (frische Milch schmeckt gut), neuter takes -es (kaltes Bier ist erfrischend) and plural takes -e (kleine Kinder spielen). Notice they echo the last letters of der, die, das and die, which is the fastest way to remember them."
      },
      {
        "q": "How do strong endings change in the accusative and dative?",
        "a": "In the accusative only the masculine changes, to -en: Ich trinke kalten Kaffee, while frische Milch, kaltes Bier and kleine Kinder stay as they are. In the dative you get -em for masculine and neuter and -er for feminine, mirroring dem and der: mit kaltem Wasser, bei großer Hitze."
      },
      {
        "q": "Why is it kalter Kaffee but der kalte Kaffee?",
        "a": "Because the work of marking masculine nominative has to be done exactly once. With no article, the adjective carries it and takes the strong -er. With der already showing gender and case, the adjective relaxes into the weak -e. German never marks the same information twice in a row."
      },
      {
        "q": "Do adjectives after numbers take strong endings?",
        "a": "Yes. Numbers like zwei, drei and fünf give no gender or case information, so the adjective must: zwei kleine Kinder, drei große Häuser, fünf neue Bücher. The same logic applies after viel and wenig when uncountable — viel frisches Obst, wenig kaltes Wasser — since they do not decline either."
      }
    ]
  },
  "b1.2/adjective-declension-weak-mixed": {
    "snippetIntro": "After der, die, das and words that decline like them, German adjectives take weak endings — only -e or -en: der neue Film, die alte Kirche, den alten Mann. After ein, kein and the possessives the pattern is mixed: mostly weak, but strong endings appear in the three slots where ein itself has no ending, giving ein kalter Kaffee and ein kaltes Bier.",
    "faqHeading": "Common questions about weak and mixed adjective endings",
    "faqs": [
      {
        "q": "What is the difference between weak and mixed adjective declension?",
        "a": "Weak endings follow der, die, das, dieser, jeder, welcher, alle and beide, which fully show gender and case, so the adjective only needs -e or -en. Mixed endings follow ein, kein, mein and the other possessives, which lack an ending in three places, so the adjective steps in with -er or -es there."
      },
      {
        "q": "When is the adjective ending just -e in German?",
        "a": "In the weak pattern, -e appears in the nominative singular of all three genders and in the accusative for feminine and neuter: der neue Film, die alte Kirche, das kleine Kind, and Ich sehe die alte Kirche. Every other weak slot, including all plurals and all datives, takes -en."
      },
      {
        "q": "Why is it ein kleiner Mann but der kleine Mann?",
        "a": "Because ein has no ending in the masculine nominative and therefore does not reveal the gender. The adjective takes over with the strong -er: ein kleiner Mann. Der already marks masculine nominative, so the adjective drops back to the weak -e: der kleine Mann. The same happens in the neuter: ein kleines Kind versus das kleine Kind."
      },
      {
        "q": "Is there one rule for all German adjective endings?",
        "a": "Yes, and it covers all three patterns: ask whether anything before the adjective already shows gender and case. If yes, the adjective is weak. If no, the adjective is strong. Mixed declension is simply this rule applied word by word to ein, where the answer flips between the cases."
      },
      {
        "q": "What ending do adjectives take in the plural?",
        "a": "With any determiner in front, plural adjectives take -en in every case: die neuen Filme, meine alten Freunde, mit den kleinen Kindern. Without a determiner they take strong endings instead: neue Filme sind teuer, kleine Kinder spielen gern. The plural is therefore the simplest part of the system to master."
      }
    ]
  },
  "b1.2/simple-past-narrative": {
    "snippetIntro": "The Präteritum is the German narrative past used in books, news reports and fairy tales: Er ging zur Tür und öffnete sie. Weak verbs add -te plus a personal ending to the stem (machte, sagte, arbeitete), while strong verbs change their stem vowel and take no -te at all (gehen becomes ging, kommen becomes kam).",
    "faqHeading": "Common questions about the German Präteritum",
    "faqs": [
      {
        "q": "When do Germans use Präteritum instead of Perfekt?",
        "a": "Präteritum dominates written German — novels, news, reports and fairy tales, which is why they begin Es war einmal ein König. Perfekt dominates spoken German for the same events. The exceptions are sein, haben and the modal verbs, where war, hatte, konnte and musste are normal even in conversation."
      },
      {
        "q": "How do I form the Präteritum of regular verbs?",
        "a": "Take the stem, add -te and then the personal ending: ich machte, du machtest, er machte, wir machten, ihr machtet, sie machten. If the stem ends in -t or -d, an extra -e appears for pronunciation: arbeitete, arbeitetest. The ich and er forms are always identical, which is true across the whole Präteritum."
      },
      {
        "q": "How do irregular verbs work in the German simple past?",
        "a": "Strong verbs change their stem vowel and take no -te: gehen becomes ging, kommen becomes kam, sehen becomes sah, nehmen becomes nahm, schreiben becomes schrieb, sprechen becomes sprach. The endings are then ich and er with nothing, du with -st, wir and sie with -en, ihr with -t: ich ging, du gingst, wir gingen."
      },
      {
        "q": "Why are the ich and er forms the same in Präteritum?",
        "a": "Because the Präteritum stem itself carries the tense marking, and German drops the personal ending in the first and third person singular. So ich ging and er ging are identical, as are ich machte and er machte. Context or an explicit subject tells you who acted, which is why the subject is never omitted."
      },
      {
        "q": "Do I need Präteritum to read German?",
        "a": "Yes — it is unavoidable. Any novel, newspaper article or fairy tale will be written in it: Sie sagte nichts und verließ das Zimmer. Even if you speak mostly in Perfekt, you must recognise forms like ging, kam, fand and geschah on sight, since they look nothing like their infinitives."
      }
    ]
  },
  "b1.2/indirect-questions": {
    "snippetIntro": "An indirect question in German is a question embedded in a statement, and the conjugated verb moves to the end of the clause: Ich weiß nicht, wo er ist. Questions with a W-word keep that word as the connector (wo, was, wann, warum, wie, wer), while yes-or-no questions use ob, meaning if or whether.",
    "faqHeading": "Common questions about indirect questions in German",
    "faqs": [
      {
        "q": "How do I form an indirect question in German?",
        "a": "Start with an introductory phrase, add a comma, keep the question word and send the verb to the end. Wo ist er? becomes Ich weiß nicht, wo er ist. Was macht sie? becomes Ich frage mich, was sie macht. The inversion of the direct question disappears completely — subject first, verb last."
      },
      {
        "q": "When do I use ob in German?",
        "a": "Use ob when the original question had no W-word and could be answered with yes or no. Kommt er? becomes Ich weiß nicht, ob er kommt. Hat er Zeit? becomes Weißt du, ob er Zeit hat? Ob translates as whether or if, and like every subordinating conjunction it pushes the verb to the end."
      },
      {
        "q": "What is the difference between ob and wenn?",
        "a": "Both can translate as if, but they are not interchangeable. Ob introduces an indirect yes-or-no question: Ich frage mich, ob er kommt. Wenn introduces a condition or a repeated time: Wenn er kommt, essen wir. If you could replace the English if with whether, German needs ob."
      },
      {
        "q": "Why do indirect questions sound more polite in German?",
        "a": "Because they wrap the request in a softening frame instead of firing it directly. Wie spät ist es? is blunt; Kannst du mir sagen, wie spät es ist? gives the listener room to respond. Phrases like Ich möchte wissen, Ich frage mich and Können Sie mir sagen are standard politeness tools in shops, offices and emails."
      },
      {
        "q": "Where does the verb go in a German indirect question?",
        "a": "At the very end of the embedded clause, because it is a subordinate clause. Ich verstehe nicht, warum sie traurig ist — ist comes last. With modal verbs the conjugated modal goes last and the infinitive just before it: Er fragt, ob du helfen kannst. A comma always separates the two parts."
      }
    ]
  },
  "b1.2/n-declension": {
    "snippetIntro": "N-declension nouns, also called weak masculine nouns, add -(e)n in every case except the nominative singular: der Student, den Studenten, dem Studenten, des Studenten. The group is almost entirely masculine and mostly names people — Kollege, Kunde, Junge, Nachbar, Mensch, Herr — plus male nationality words ending in -e such as Franzose and Türke.",
    "faqHeading": "Common questions about N-declension nouns",
    "faqs": [
      {
        "q": "What are N-declension nouns in German?",
        "a": "They are masculine nouns that take -(e)n in the accusative, dative and genitive, unlike normal nouns which stay unchanged. Der Student becomes den Studenten, dem Studenten and des Studenten. Because the ending appears in three of the four cases, they are also called weak nouns — the noun itself does the case marking."
      },
      {
        "q": "How do I recognise an N-declension noun?",
        "a": "Most are masculine nouns for people, and a great many end in -e: der Kollege, der Kunde, der Junge, der Franzose, der Türke. Others end in -ent, -ant, -ist or -oge: der Student, der Praktikant, der Polizist, der Biologe. Der Mensch, der Nachbar and der Herr belong too and simply have to be memorised."
      },
      {
        "q": "What is the ending for der Herr?",
        "a": "Herr is irregular within the group: it adds only -n in the singular, giving den Herrn, dem Herrn and des Herrn, but -en in the plural, giving die Herren. This is why letters are addressed Sehr geehrter Herr Meier in the nominative but you say Ich habe mit Herrn Meier gesprochen in the dative."
      },
      {
        "q": "Why is it den Studenten and not den Student?",
        "a": "Because Student belongs to the N-declension, and these nouns mark the accusative on the noun itself, not just on the article. Ich sehe den Studenten is correct; den Student is a mistake. The same shows up with the indefinite article: Ich kenne einen Franzosen, not einen Franzose."
      },
      {
        "q": "Do N-declension nouns take -s in the genitive?",
        "a": "No — that is the key difference from ordinary masculine nouns. Where normal nouns give des Mannes, N-declension nouns give des Studenten, des Kollegen, des Kunden. Das ist das Auto des Kunden is correct, while des Kundes is wrong. The -(e)n ending covers accusative, dative and genitive alike."
      }
    ]
  },
  "b2.1/konjunktiv-ii-past": {
    "snippetIntro": "The German past Konjunktiv II expresses unreal past situations and regrets, and it is built with hätte or wäre plus a past participle: Ich hätte das gewusst (I would have known that). You use hätte with verbs that take haben in the Perfekt and wäre with motion and change-of-state verbs, exactly as in Er wäre gekommen.",
    "faqHeading": "Common questions about Konjunktiv II in the past",
    "faqs": [
      {
        "q": "How do you form Konjunktiv II in the past in German?",
        "a": "Take hätte or wäre and add the past participle. Verbs that build the Perfekt with haben use hätte: Ich hätte das gemacht. Motion and change-of-state verbs use wäre: Er wäre geblieben. The forms are hätte, hättest, hätte, hätten, hättet, hätten and wäre, wärst, wäre, wären, wärt, wären."
      },
      {
        "q": "How do you say I would have in German?",
        "a": "Say ich hätte plus a past participle, or ich wäre plus a past participle for motion verbs. Ich hätte geholfen means I would have helped, and ich wäre gekommen means I would have come. The choice between hätte and wäre follows the same logic as the Perfekt, so if the verb takes sein there, it takes wäre here."
      },
      {
        "q": "Does German have only one past subjunctive form?",
        "a": "Yes. Unlike the indicative, which has Perfekt, Präteritum and Plusquamperfekt, Konjunktiv II has a single past form: hätte or wäre plus the past participle. So Wenn ich Zeit gehabt hätte covers if I had had time, and hätte ich geholfen covers I would have helped. One form does all past unreal work."
      },
      {
        "q": "What is the word order in a wenn clause with Konjunktiv II past?",
        "a": "In the wenn clause, hätte or wäre stands at the very end, after the participle: Wenn ich das gewusst hätte. In the main clause it takes position one or two: wäre ich nicht gegangen. A full example is Wenn er gekommen wäre, hätten wir gefeiert, meaning if he had come, we would have celebrated."
      },
      {
        "q": "When do you use Konjunktiv II past instead of würde?",
        "a": "Use würde only for present or future unreal ideas. For anything already over, German requires hätte or wäre plus the participle, so würde gekommen sein is not standard. Say Ich wäre gekommen, not Ich würde gekommen sein. Regret about a finished event always pushes you into the past Konjunktiv II form."
      }
    ]
  },
  "b2.1/konjunktiv-i-reported-speech": {
    "snippetIntro": "Konjunktiv I is the German mood used for indirect speech, signalling that you are reporting someone else without vouching for the claim: Er sagt, er sei krank. It is formed from the infinitive stem plus -e in the third person singular, giving sei, habe, könne, müsse, gehe and komme, and it dominates news reporting and academic writing.",
    "faqHeading": "Common questions about Konjunktiv I and reported speech",
    "faqs": [
      {
        "q": "When is Konjunktiv I used in German?",
        "a": "Konjunktiv I is used for indirect speech, above all in journalism, official reports and academic prose: Der Minister erklärte, die Lage sei ernst. It marks the words as reported rather than asserted by the writer. In everyday spoken German people usually just use the indicative or dass clauses instead."
      },
      {
        "q": "How do you form Konjunktiv I in German?",
        "a": "Take the infinitive stem and add -e for er, sie or es: haben gives habe, können gives könne, müssen gives müsse, wollen gives wolle, gehen gives gehe and kommen gives komme. The verb sein is irregular and gives sei, seist, sei, seien, seiet, seien. The third person singular is by far the most common form."
      },
      {
        "q": "What is the difference between Konjunktiv I and Konjunktiv II?",
        "a": "Konjunktiv I reports what someone else said: Sie sagte, sie habe keine Zeit. Konjunktiv II expresses unreal or hypothetical situations and polite requests: Ich hätte keine Zeit. They come from different stems, the present stem for Konjunktiv I and the Präteritum stem for Konjunktiv II, and they do different jobs."
      },
      {
        "q": "Why does reported speech sometimes switch to Konjunktiv II?",
        "a": "Because some Konjunktiv I forms look identical to the indicative and would not be recognised as reported speech. Ich habe and wir haben are the same in both moods, so German substitutes the unambiguous Konjunktiv II: sie hätten keine Zeit. The rule is simple, if Konjunktiv I equals the indicative, switch to Konjunktiv II."
      },
      {
        "q": "Do you need dass with Konjunktiv I?",
        "a": "No. Konjunktiv I already signals reported speech, so you can drop dass and keep normal main clause word order: Er sagt, er sei krank. If you do use dass, the verb moves to the end: Er sagt, dass er krank sei. Both are correct, but the version without dass sounds more typical of written reporting."
      }
    ]
  },
  "b2.1/passive-alternatives": {
    "snippetIntro": "German can express passive meaning without werden by using sich lassen plus an infinitive, sein plus zu plus an infinitive, adjectives in -bar, or the pronoun man. Das Problem lässt sich lösen, das Problem ist zu lösen and das Problem ist lösbar all convey what a werden passive with können would say, but sound lighter and more idiomatic.",
    "faqHeading": "Common questions about German passive alternatives",
    "faqs": [
      {
        "q": "How do you avoid the passive in German?",
        "a": "Use one of four alternatives. sich lassen plus infinitive: Das lässt sich machen. sein plus zu plus infinitive: Die Regeln sind zu beachten. An adjective in -bar: Der Text ist gut lesbar. Or the pronoun man: Man macht das so. Each carries passive meaning while keeping an active verb form."
      },
      {
        "q": "What does sich lassen mean in German?",
        "a": "With an infinitive, sich lassen means can be done. Das Problem lässt sich lösen is equivalent to das Problem kann gelöst werden, the problem can be solved. It is extremely common in spoken German because it is shorter than the werden passive with können and sounds far less bureaucratic."
      },
      {
        "q": "What does sein plus zu plus infinitive mean?",
        "a": "It means something can be done or must be done, and context decides which. Die Arbeit ist bis morgen zu erledigen expresses obligation, the work has to be finished by tomorrow. Der Fehler ist nicht zu übersehen expresses possibility, the mistake cannot be overlooked. This construction is typical of instructions and formal writing."
      },
      {
        "q": "What does the German suffix -bar mean?",
        "a": "The suffix -bar works like English -able or -ible and turns a verb into an adjective meaning able to be done. machen gives machbar, lesen gives lesbar, essen gives essbar, trinken gives trinkbar and erreichen gives erreichbar. It is highly productive, though some verbs prefer -lich instead, as in verständlich from verstehen."
      },
      {
        "q": "Are passive alternatives more common than the werden passive?",
        "a": "In speech, yes. Germans usually say Das lässt sich machen rather than Das kann gemacht werden, because the alternatives are shorter and less formal. The werden passive still dominates technical and official texts. Mixing both gives your writing variety and stops long strings of gemacht werden constructions from piling up."
      }
    ]
  },
  "b2.1/participial-adjectives": {
    "snippetIntro": "German turns participles into adjectives: Partizip I, formed from the infinitive plus -d, describes an action in progress, as in das schlafende Kind, while Partizip II describes a completed state, as in das gebrochene Fenster. Both take the normal adjective endings that agree with the gender, case and number of the noun they precede.",
    "faqHeading": "Common questions about German participial adjectives",
    "faqs": [
      {
        "q": "How do you form the present participle in German?",
        "a": "Add -d to the infinitive: schlafen gives schlafend, lachen gives lachend, kommen gives kommend, wachsen gives wachsend and brennen gives brennend. Before a noun the participle then takes an adjective ending, so schlafend plus -e becomes das schlafende Kind. It corresponds roughly to the English -ing adjective."
      },
      {
        "q": "What is the difference between Partizip I and Partizip II as adjectives?",
        "a": "Partizip I shows an action still happening, Partizip II shows one already finished. Der schlafende Mann is sleeping right now, der eingeschlafene Mann has fallen asleep. Die kochende Suppe is on the boil, die gekochte Suppe is already cooked. Der ankommende Zug is arriving, der angekommene Zug has arrived."
      },
      {
        "q": "Can you use the German present participle like the English -ing form?",
        "a": "Only as an adjective or adverb, not as a verb tense. German has no continuous tense, so I am sleeping is simply ich schlafe, never ich bin schlafend. But das schlafende Kind is perfectly normal, because there the participle modifies a noun and carries an adjective ending."
      },
      {
        "q": "Do participial adjectives take normal adjective endings?",
        "a": "Yes, exactly the same endings as any other adjective. They agree with gender, case and number, and the ending also depends on whether a definite article, indefinite article or nothing precedes. Compare das gebrochene Fenster with ein gebrochenes Fenster and with die geschriebenen Briefe in the plural."
      },
      {
        "q": "Which verbs can become participial adjectives in German?",
        "a": "Almost any verb can form Partizip I, since you only add -d. Partizip II as an adjective works best with verbs that describe a resulting state, especially transitive ones: brechen gives gebrochen, schreiben gives geschrieben, kochen gives gekocht, öffnen gives geöffnet and verlieren gives verloren, as in die verlorene Zeit."
      }
    ]
  },
  "b2.1/extended-attributes": {
    "snippetIntro": "An extended attribute packs a whole relative clause into the space between the article and the noun: instead of der Mann, der am Fenster steht, German writes der am Fenster stehende Mann. The structure is article plus extension plus participle plus noun, and the participle carries the adjective ending that matches the noun.",
    "faqHeading": "Common questions about German extended attributes",
    "faqs": [
      {
        "q": "What is an extended attribute in German?",
        "a": "It is a compressed relative clause placed before the noun. Der am Fenster stehende Mann means the man who is standing at the window. Everything between the article and the noun modifies the participle stehende, which behaves like an adjective. Extended attributes are typical of academic, legal, scientific and news German."
      },
      {
        "q": "How do you turn a relative clause into an extended attribute?",
        "a": "Take Der Mann, der am Fenster steht, ist mein Vater. Delete the relative pronoun and the commas, turn the finite verb into a participle with an adjective ending, and place it plus its extensions directly before the noun. The result is Der am Fenster stehende Mann ist mein Vater."
      },
      {
        "q": "How do you read a long extended attribute?",
        "a": "Find the noun first. In Die seit vielen Jahren in der Firma arbeitende Frau, spot the article die, then jump to the noun Frau, and treat everything in between as the attribute. Locate the participle arbeitende and unpack it as a relative clause: the woman who has been working in the company for many years."
      },
      {
        "q": "Which participle do you use in an extended attribute?",
        "a": "Partizip I, the infinitive plus -d, for an ongoing or active meaning: die seit Jahren wartende Frau, the woman who has been waiting for years. Partizip II for a completed or passive meaning: das geschriebene Buch, the book that has been written. The choice mirrors the voice of the original relative clause."
      },
      {
        "q": "Are extended attributes used in spoken German?",
        "a": "Rarely. Speakers prefer a plain relative clause because it is easier to process in real time. Extended attributes belong to written registers where information has to be dense, such as journalism, legal texts and research papers. Recognising them when reading matters far more than producing them yourself."
      }
    ]
  },
  "b2.1/double-infinitive": {
    "snippetIntro": "When a German modal verb appears in the perfect tense with a dependent infinitive, the modal itself becomes an infinitive: Ich habe kommen können, not Ich habe kommen gekonnt. This double infinitive puts the main verb first and the modal last, and it applies to können, müssen, wollen, sollen, dürfen and mögen, as well as to lassen.",
    "faqHeading": "Common questions about the German double infinitive",
    "faqs": [
      {
        "q": "What is the double infinitive in German?",
        "a": "It is the pattern that appears when a modal verb stands in the perfect tense and governs another verb. Instead of a past participle, the modal appears as an infinitive: Ich habe nicht kommen können, I was not able to come. Both verbs sit at the end, main verb first, modal second."
      },
      {
        "q": "Why is it Ich habe kommen können and not Ich habe kommen gekonnt?",
        "a": "Because the dependent infinitive triggers the substitute infinitive. A modal used alone does form a normal participle: Ich habe es gekonnt, I was able to do it. As soon as a second verb depends on the modal, German swaps gekonnt for können, giving Ich habe es machen können."
      },
      {
        "q": "Where does haben go in a subordinate clause with a double infinitive?",
        "a": "Before the two infinitives, not at the end. Normally the finite verb closes a subordinate clause, but here that rule is overridden: weil ich habe kommen können, not weil ich kommen können habe. This exception is one of the clearest signals of an advanced command of German word order."
      },
      {
        "q": "Which German verbs take a double infinitive?",
        "a": "All six modals, können, müssen, wollen, sollen, dürfen and mögen, plus lassen and often sehen and hören. Examples are Er hat früh aufstehen müssen, Sie hat mich besuchen wollen, Du hast das machen sollen and Ich habe das Auto reparieren lassen."
      },
      {
        "q": "Can you use a double infinitive with Konjunktiv II?",
        "a": "Yes, and it is very common. Combine hätte with the two infinitives: Sie hätte es wissen können, she could have known it, or Ich hätte kommen müssen, I would have had to come. The pattern is the same as in the perfect tense, only the auxiliary changes from habe to hätte."
      }
    ]
  },
  "b2.1/causative-constructions": {
    "snippetIntro": "German uses lassen plus an infinitive as its causative construction, covering three English meanings: having something done, letting someone do something, and making something happen. Ich lasse mein Auto reparieren means I have my car repaired, while Ich lasse ihn gehen means I let him go, and context alone decides which reading applies.",
    "faqHeading": "Common questions about lassen and causative constructions",
    "faqs": [
      {
        "q": "What does lassen mean in German?",
        "a": "On its own lassen means to leave or to let. With an infinitive it becomes causative and covers three ideas: having a service done, as in Ich lasse mein Auto reparieren; giving permission, as in Ich lasse ihn gehen; and leaving someone alone, as in the imperative Lass mich in Ruhe."
      },
      {
        "q": "How do you say to have something done in German?",
        "a": "Use lassen plus the infinitive of the action, with the person doing the work usually left unmentioned. Ich lasse mein Auto reparieren means I have my car repaired by a mechanic. Er lässt das Haus renovieren means he is having the house renovated. A reflexive pronoun adds a beneficiary: Ich lasse mir einen Anzug machen."
      },
      {
        "q": "How is lassen conjugated in German?",
        "a": "It is a strong verb with a vowel change in the second and third person singular: ich lasse, du lässt, er lässt, wir lassen, ihr lasst, sie lassen. The Präteritum is ließ, ließt, ließ, ließen, ließt, ließen. The Perfekt with a dependent infinitive uses the double infinitive, as in hat reparieren lassen."
      },
      {
        "q": "Why is it hat reparieren lassen and not hat reparieren gelassen?",
        "a": "Because lassen behaves like a modal verb here. When it governs another infinitive, its past participle gelassen is replaced by the infinitive form, producing a double infinitive: Ich habe mein Auto reparieren lassen. You only see gelassen when lassen stands alone, as in Ich habe den Schlüssel zu Hause gelassen."
      },
      {
        "q": "How do you tell whether lassen means have done or let?",
        "a": "Look at whether the person performing the action is named. Sie lässt sich die Haare schneiden names no agent, so it means she has her hair cut. Sie lässt die Kinder spielen names the doers, the children, so it means she lets them play. Word order and context, not the verb form, carry the difference."
      }
    ]
  },
  "b2.1/nominalization": {
    "snippetIntro": "Nominalization turns German verbs and adjectives into nouns, and it drives the abstract style of formal writing. Any infinitive becomes a capitalized neuter noun with das, as in das Lesen, adjectives become neuter nouns with an -e ending, as in das Schöne, and many verbs form feminine nouns in -ung, such as die Entwicklung.",
    "faqHeading": "Common questions about German nominalization",
    "faqs": [
      {
        "q": "What is nominalization in German?",
        "a": "It is the process of using a verb or an adjective as a noun. Lesen becomes das Lesen, reading, and schön becomes das Schöne, the beautiful thing. Nominalized words are always capitalized and take an article. German uses this constantly in academic writing, official documents and abstract discussion."
      },
      {
        "q": "What gender is a nominalized infinitive in German?",
        "a": "Always neuter, and always with das. das Lesen, das Schwimmen, das Arbeiten, das Reisen and das Lernen all follow the same pattern. Because it names the activity itself, it has no plural. A typical sentence is Das Lesen macht mir Spaß, meaning reading is fun for me."
      },
      {
        "q": "How do you turn a German adjective into a noun?",
        "a": "Capitalize it and add the adjective ending required by the article. With das you get -e: schön gives das Schöne, gut gives das Gute, neu gives das Neue, wichtig gives das Wichtige. Example: Das Schöne an der Stadt ist die Altstadt. Superlatives work too, as in Ich habe das Wichtigste vergessen."
      },
      {
        "q": "Are German -ung nouns always feminine?",
        "a": "Yes, without exception. die Entwicklung, die Hoffnung, die Überraschung, die Bedeutung, die Erklärung and die Lösung are all feminine. The suffix attaches to a verb stem and names the action or its result, so it is one of the most reliable gender rules in the whole language."
      },
      {
        "q": "When should you use nominalization in German?",
        "a": "Use it for formal, abstract or academic style, where German prefers nouns to verbs: Die Entwicklung der Wirtschaft ist positiv. In conversation the plain verb usually sounds better. Overusing nominalization creates the heavy bureaucratic tone Germans call Nominalstil, so keep verbal phrasing for anything meant to sound natural."
      }
    ]
  },
  "b2.2/advanced-conjunctions": {
    "snippetIntro": "Advanced German conjunctions such as zumal, sofern, falls, indem, obgleich and wenngleich refine the relationship between clauses far more precisely than weil and obwohl. Nearly all of them are subordinating, so they push the finite verb to the end of the clause, as in Er hilft gern, zumal er Zeit hat.",
    "faqHeading": "Common questions about advanced German conjunctions",
    "faqs": [
      {
        "q": "What does zumal mean in German?",
        "a": "zumal means especially since or all the more so because. It introduces a reason that reinforces something already stated: Er hilft gern, zumal er Zeit hat, meaning he gladly helps, especially since he has time. It is subordinating, so the finite verb goes to the end of its clause."
      },
      {
        "q": "What is the difference between sofern and falls?",
        "a": "sofern means provided that and frames a positive condition that must hold: Sofern das Wetter gut ist, gehen wir wandern. falls means in case or if and frames a mere possibility: Falls du Hilfe brauchst, ruf an. Both send the verb to the end, but sofern sounds noticeably more formal."
      },
      {
        "q": "How do you say unless in German?",
        "a": "Use es sei denn. It marks an exception: Ich komme, es sei denn, ich bin krank, meaning I will come unless I am sick. Unlike most conjunctions here, it keeps main clause word order with the verb in second position. A more formal option is außer wenn, which does send the verb to the end."
      },
      {
        "q": "What does indem mean in German?",
        "a": "indem expresses the means by which something happens and translates as by doing something. Er lernt schnell, indem er viel liest means he learns quickly by reading a lot. The verb goes to the end. Do not confuse it with in dem, written as two words, which is a preposition plus a relative pronoun."
      },
      {
        "q": "Which German conjunctions mean although?",
        "a": "obwohl is the everyday choice. obgleich is formal, obschon is literary, wenngleich means even though in written style, and wenn auch means even if. All of them are subordinating: Obgleich es regnet, gehen wir. Choosing among them is a matter of register rather than meaning."
      }
    ]
  },
  "b2.2/modal-particles": {
    "snippetIntro": "German modal particles are short unstressed words such as doch, mal, ja, halt, eben, schon, wohl and eigentlich that add the speaker attitude rather than new information. They sit in the middle of the sentence, after the verb and any pronouns, and they turn flat textbook German into something that sounds native, as in Komm doch mit.",
    "faqHeading": "Common questions about German modal particles",
    "faqs": [
      {
        "q": "What does doch mean in German?",
        "a": "doch has three jobs. Stressed and standing alone it contradicts a negative statement: A says Du warst nicht da, B replies Doch, ich war da. Unstressed in a sentence it means after all or you know: Das ist doch klar. In commands it softens and encourages: Komm doch mit, do come along."
      },
      {
        "q": "What does mal mean in German?",
        "a": "As a modal particle, mal makes a request casual and low-stakes, roughly like adding just or quickly in English. Kannst du mir mal helfen means can you give me a hand. It is short for einmal, but here it does not really mean once, it simply takes the pressure out of an imperative or a question."
      },
      {
        "q": "What does ja mean in the middle of a German sentence?",
        "a": "There it is not the word yes. Unstressed, ja marks something as already known to both speakers: Du weißt ja, wo ich wohne. Stressed, it expresses surprise or strong emphasis: Das ist ja fantastisch, meaning wow, that really is fantastic. Intonation alone separates the two readings."
      },
      {
        "q": "Where do modal particles go in a German sentence?",
        "a": "In the middle field, after the finite verb and after any pronouns, and before the rest of the sentence. So it is Kannst du mir mal helfen, with mal following the pronoun mir. Particles are never stressed, never in first position, and several can stack, as in Komm doch mal vorbei."
      },
      {
        "q": "What is the difference between halt and eben?",
        "a": "Very little in meaning: both express resignation about an unchangeable fact, roughly just or simply. Das ist halt so and Das ist eben so both mean that is just how it is. halt is more common in southern Germany and Austria, eben more common in the north, and both are strictly informal."
      }
    ]
  },
  "b2.2/functional-verb-structures": {
    "snippetIntro": "Funktionsverbgefüge are fixed noun plus verb combinations such as zur Verfügung stellen, in Frage kommen and eine Entscheidung treffen, where the noun carries the meaning and the verb mainly supplies grammar. They replace a simple verb with a more formal phrase, so bereitstellen becomes zur Verfügung stellen in business and official German.",
    "faqHeading": "Common questions about German functional verb structures",
    "faqs": [
      {
        "q": "What is a Funktionsverbgefüge in German?",
        "a": "It is a set phrase built from a noun and a light verb, where the noun holds the meaning. eine Entscheidung treffen means to make a decision, the equivalent of the single verb entscheiden. The verb by itself is nearly empty of content, which is why these phrases must be learned as fixed chunks."
      },
      {
        "q": "What does zur Verfügung stellen mean?",
        "a": "It means to provide or to make available, and it is standard in business correspondence: Wir stellen Ihnen die Unterlagen zur Verfügung, we will provide you with the documents. The related phrase zur Verfügung stehen means to be available. The simple verbs geben or bereitstellen say the same thing far less formally."
      },
      {
        "q": "What does das kommt nicht in Frage mean?",
        "a": "It means that is out of the question, a firm refusal. The positive form in Frage kommen means to be an option or to be a possibility. Note that in Frage stellen with stellen instead of kommen means something quite different, namely to question or to cast doubt on something."
      },
      {
        "q": "Which verbs appear most often in these structures?",
        "a": "stellen, bringen, kommen, nehmen, treffen, spielen, üben and leisten. Typical examples are unter Beweis stellen for beweisen, zum Ausdruck bringen for ausdrücken, in Betracht ziehen for berücksichtigen, in Anspruch nehmen for nutzen, eine Rolle spielen for wichtig sein, Kritik üben for kritisieren and einen Beitrag leisten for beitragen."
      },
      {
        "q": "Should you use functional verb structures in everyday German?",
        "a": "Sparingly. They belong to business emails, official documents, academic writing and formal presentations, where they sound competent and precise. In conversation the simple verb is better, so say Wir entscheiden das rather than Wir treffen eine Entscheidung. Recognising them while reading matters more than sprinkling them into casual speech."
      }
    ]
  },
  "b2.2/subjunctive-fixed-expressions": {
    "snippetIntro": "A small group of German idioms preserves old Konjunktiv I forms that no longer follow productive rules, such as Gott sei Dank, Es lebe die Freiheit, Sei es, wie es sei and Koste es, was es wolle. These are memorized chunks rather than live grammar, and they appear in wishes, concessions and formal instructions.",
    "faqHeading": "Common questions about fixed subjunctive expressions",
    "faqs": [
      {
        "q": "What does Gott sei Dank mean in German?",
        "a": "It means thank God and expresses relief. The form sei is Konjunktiv I of sein, a fossilised wish meaning may thanks be to God. Related blessings follow the same pattern: Gott behüte means God forbid, and Möge er in Frieden ruhen means may he rest in peace."
      },
      {
        "q": "What does Sei es, wie es sei mean?",
        "a": "It means be that as it may, a concessive phrase for accepting a situation you cannot resolve. The variant Wie dem auch sei means however that may be. Both use Konjunktiv I of sein and are used to close off a side issue and move on to the main point."
      },
      {
        "q": "What does Koste es, was es wolle mean?",
        "a": "It means cost what it may, or whatever the cost, and it expresses determination. wolle is Konjunktiv I of wollen. The parallel phrase Komme, was da wolle means come what may. Both keep the verb in first position, an old subjunctive pattern that survives only in fixed expressions."
      },
      {
        "q": "Why does Es lebe use the subjunctive?",
        "a": "Because it is a wish, not a statement of fact. Es lebe die Freiheit means long live freedom, literally may freedom live. This use of Konjunktiv I for wishes was once general in German but now survives mostly in toasts, slogans and recipes, as in the instruction Man nehme, meaning one takes."
      },
      {
        "q": "Are these expressions still used in modern German?",
        "a": "Yes, though they are frozen. Gott sei Dank is completely everyday, while Sei es, wie es sei and Es sei darauf hingewiesen belong to formal speech and writing. You cannot extend the pattern to new verbs, so learn each phrase whole rather than trying to build your own."
      }
    ]
  },
  "b2.2/complex-sentence-building": {
    "snippetIntro": "Complex German sentences stack subordinate clauses inside one another, and the guiding rule never changes: every subordinate clause sends its finite verb to the end. In Ich weiß, dass er, obwohl er krank war, zur Arbeit ging, the obwohl clause is nested inside the dass clause, and each keeps its own verb in final position.",
    "faqHeading": "Common questions about complex German sentences",
    "faqs": [
      {
        "q": "How do you build complex sentences in German?",
        "a": "Start from a main clause with the verb in second position, then attach subordinate clauses, each with its verb at the end. Clauses can be sequential, as in Nachdem er kam, bevor sie ging, redeten sie; nested, as in Ich weiß, dass er, obwohl er krank war, kam; or parallel, joined by und."
      },
      {
        "q": "Where does the verb go in nested German clauses?",
        "a": "Each clause keeps its own verb at its own end. In Der Mann, der gestern kam, nachdem er angerufen hatte, ist mein Bruder, kam ends the relative clause, hatte ends the temporal clause, and ist is the main verb in second position of the main clause. Track the verbs and the structure becomes clear."
      },
      {
        "q": "Can a relative clause contain another clause in German?",
        "a": "Yes, and it is common in written German. Das Buch, das ich gestern gekauft habe, nachdem ich es empfohlen bekommen hatte, ist spannend embeds a nachdem clause inside a relative clause. Commas mark every boundary, which is why German comma rules are grammatical rather than a matter of style."
      },
      {
        "q": "How do you read a long German sentence?",
        "a": "Find the main clause verb first, since it sits in position two of the outermost clause. Then take each comma-marked stretch as one unit and read to its final verb. Working outward from the main clause, rather than left to right, makes even a four-clause sentence manageable."
      },
      {
        "q": "How many subordinate clauses can a German sentence have?",
        "a": "Grammatically there is no limit, but readability sets one. Academic and legal German regularly stacks three or four, as in Weil er klug ist und weil er fleißig arbeitet, hat er Erfolg. Good modern style prefers two levels at most and splits anything longer into separate sentences."
      }
    ]
  },
  "b2.2/register-style": {
    "snippetIntro": "German has three broad registers: colloquial Umgangssprache, neutral Standardsprache and formal gehobene Sprache, and choosing the wrong one can make you sound rude or stiff. Haste mal nen Euro, Hast du einen Moment Zeit and Hätten Sie einen Augenblick Zeit für mich all ask the same thing at three different social distances.",
    "faqHeading": "Common questions about German register and style",
    "faqs": [
      {
        "q": "What are the registers of German?",
        "a": "Three. Umgangssprache is casual speech with friends and family, marked by contractions, modal particles and slang. Standardsprache is neutral, grammatically correct German for the general public. Gehobene Sprache is formal German for business, academic and official contexts, using Sie, complex structures and elevated vocabulary."
      },
      {
        "q": "What is the difference between kriegen and bekommen?",
        "a": "They mean the same thing, to get or receive, but sit at different levels. kriegen is colloquial, bekommen is standard, and erhalten is formal. The same ladder shows up elsewhere: kapieren, verstehen, nachvollziehen; checken, prüfen, überprüfen; and mega or voll, sehr, äußerst."
      },
      {
        "q": "Is weil with main clause word order wrong in German?",
        "a": "It is non-standard but extremely common in speech. Many Germans say weil ich hab keine Zeit with the verb in second position. In writing and any formal context you must use subordinate order: weil ich keine Zeit habe. Treat the spoken version as something to recognise, not something to imitate in exams."
      },
      {
        "q": "When should you use the genitive in German?",
        "a": "In standard and formal German, especially in writing: das Auto meines Vaters. Colloquially most speakers replace it with von plus dative, das Auto von meinem Vater. Both are understood, but the genitive signals education and care, so it belongs in essays, reports and professional correspondence."
      },
      {
        "q": "How do you make a German request more polite?",
        "a": "Move up the register and into Konjunktiv II. Hast du Zeit becomes Haben Sie Zeit with the formal pronoun, and then Hätten Sie einen Augenblick Zeit für mich, which adds hypothetical distance. Longer, less direct wording reads as more respectful, exactly the opposite of the clipped Haste mal nen Euro."
      }
    ]
  },
  "b2.2/future-perfect": {
    "snippetIntro": "The German Futur II describes an action that will be finished before a point in the future, and it is formed with werden plus a past participle plus haben or sein at the very end: Bis morgen werde ich das Buch gelesen haben. In practice it is used just as often to express a confident assumption about the past.",
    "faqHeading": "Common questions about the German future perfect",
    "faqs": [
      {
        "q": "How do you form the future perfect in German?",
        "a": "Conjugate werden, then add the past participle, then the infinitive haben or sein at the end. Verbs that take haben in the Perfekt keep haben: ich werde gemacht haben. Motion and change-of-state verbs take sein: ich werde gegangen sein. The auxiliary infinitive always closes the sentence."
      },
      {
        "q": "When do you use Futur II in German?",
        "a": "For two things. First, completion before a future deadline: Um 18 Uhr werde ich gegessen haben, by six I will have eaten. Second, and more often in speech, an assumption about something already finished: Sie wird es vergessen haben, she has probably forgotten. Context and particles like wohl separate the two."
      },
      {
        "q": "What does Er wird wohl schon gegangen sein mean?",
        "a": "It means he has probably already left. This is Futur II used for a supposition about the past, not about the future. The particle wohl reinforces the guess. German speakers use this construction far more for probability than for genuine future completion, which is why it sounds so idiomatic."
      },
      {
        "q": "Do you need haben or sein in the German future perfect?",
        "a": "Use whichever auxiliary the verb takes in the Perfekt. lesen takes haben, so werde gelesen haben. gehen takes sein, so werde gegangen sein. The same applies to fahren, kommen, bleiben, laufen and fliegen, all verbs of motion or change of state that select sein."
      },
      {
        "q": "Is Futur II common in spoken German?",
        "a": "The assumption use is common, the deadline use much less so. For real future completion Germans often prefer the present tense with a time phrase: Bis morgen bin ich fertig instead of Bis morgen werde ich fertig sein. But Das wird wohl stimmen, meaning that is probably true, is heard constantly."
      }
    ]
  },
  "b2.2/review-integration": {
    "snippetIntro": "Genuine B2 fluency shows when several structures work together in one sentence, as in Er sagte, er sei krank gewesen und habe nicht kommen können, which combines Konjunktiv I, the past and a double infinitive. The foundations remain the four cases, the tense and mood system, and the verb position rules that govern every German clause.",
    "faqHeading": "Common questions about integrating German grammar",
    "faqs": [
      {
        "q": "What are the four German cases and what do they do?",
        "a": "Nominative answers wer or was and marks the subject. Accusative answers wen or was and marks the direct object, plus durch, für, gegen, ohne and um. Dative answers wem and marks the indirect object, plus aus, bei, mit, nach, seit, von and zu. Genitive answers wessen and shows possession, plus wegen, während, trotz and statt."
      },
      {
        "q": "What is the difference between tense and mood in German?",
        "a": "Tense tells you when: Präsens ich mache, Perfekt ich habe gemacht, Präteritum ich machte, Futur II werde gemacht haben. Mood tells you the reality status: the indicative states facts, Konjunktiv II marks unreal or polite ideas with würde, wäre and hätte, and Konjunktiv I marks reported speech with sei and habe."
      },
      {
        "q": "What decides verb position in a German sentence?",
        "a": "The clause type. Main clauses put the finite verb in position two: Ich gehe morgen. Yes or no questions put it first: Gehst du. Subordinate and relative clauses put it last: weil ich gehe, der Mann, der geht. The one systematic exception is the double infinitive, where haben moves in front of both infinitives."
      },
      {
        "q": "When do you use Perfekt and when Präteritum in German?",
        "a": "Perfekt dominates speech and informal writing: Ich habe das gemacht. Präteritum dominates narrative and journalistic writing: Ich machte das. The exceptions are sein, haben and the modals, whose Präteritum forms war, hatte, konnte and musste are normal in speech too, because they are shorter than the Perfekt."
      },
      {
        "q": "How do advanced German structures combine in one sentence?",
        "a": "Freely, as long as each clause obeys its own verb rule. Der von uns gestern eingestellte Mitarbeiter beginnt morgen packs an extended attribute into the subject. Wenn ich das gewusst hätte, wäre ich gekommen combines a conditional clause with past Konjunktiv II. Building sentences like these deliberately is the fastest route to B2 confidence."
      }
    ]
  }
};
