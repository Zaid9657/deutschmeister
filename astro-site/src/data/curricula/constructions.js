/**
 * THE DEFERRED CONSTRUCTIONS OF A COURSE — one definition, three readers.
 *
 * A course defers FORMS (a word the learner has not met) and it defers
 * CONSTRUCTIONS (a pattern the learner has met every word of). The second kind
 * is the one that slips through a word list: `ein`/`eine` before a noun is A1.1
 * Lektion 6, a finite verb with its prefix at the end of the sentence is
 * Lektion 11, `mein`/`dein` before a noun is Lektion 12 — and every single word
 * of „ein und eine stehen bei einer Sache.“ is ordinary at Lektion 5.
 *
 * DaF review #10 (MAJOR 3) built that guard for the RULE CARDS. DaF review #11
 * (MAJOR 3) measured what it does not cover: the same round deleted „Meine
 * Schwester ist noch jung.“ from the A1.1 L3 card and left it standing as L3's
 * DICTATION line — the sentence is too hard to READ and easy enough to TYPE.
 * A card and a dictation must answer that question with the same code, so the
 * patterns live here and are imported by
 *   • `tests/rule-card-overrides.test.mjs` (the card guard), and
 *   • `scripts/validate-curriculum.mjs` (RULE 15b, the production lines).
 *
 * THE INTRODUCING LEKTION IS NEVER TYPED HERE. It is read from the curriculum —
 * the Lektion whose `primarySlug` is the pattern's slug (`introducedAt` below) —
 * so moving a Lektion moves the guard with it.
 *
 * Two deliberate narrowings, both measured against the 24 shipped cards:
 *   • the indefinite-article and possessive patterns ignore a METALANGUAGE noun
 *     — „Jedes Nomen hat ein Genus“ is the A1.1 L4 notice TITLE and the card
 *     that must repeat it; the pattern is about naming a THING with an article,
 *     not about the course talking about grammar;
 *   • `ihr`/`Ihr` is not in the possessive pattern: it is also the L3 subject
 *     pronoun and the polite possessive of the Sie-register the whole course
 *     speaks, so the pattern would fire on „Wie ist Ihr Name?“.
 */

/**
 * Grammar vocabulary and the other closed lists a card may name beyond its
 * Wortfeld. Moved here from `tests/rule-card-overrides.test.mjs` (DaF review
 * #11, MAJOR 3) so the card guard and RULE 15b read ONE list; the test still
 * imports it for its own lexis checks.
 */
export const META_NOUNS = [
  // grammar vocabulary — the card talks about German, so it needs these words
  'Artikel', 'Nomen', 'Verb', 'Satz', 'Satzende', 'Frage', 'Antwort', 'Aussage', 'Endung',
  'Plural', 'Singular', 'Buchstabe', 'Name', 'Uhr', 'Uhrzeit', 'Wort', 'Form', 'Formen',
  'Person', 'Pronomen', 'Genus', 'Stamm', 'Vokal', 'Infinitiv', 'Akkusativ', 'Regel',
  'Verneinung', 'Vorsilbe', 'Position', 'Beispiel', 'Gruppe', 'Anrede', 'Kurzantwort',
  'Wortfolge', 'Subjekt', 'Stimme', 'Sonderfall', 'Bedeutung', 'Ordnungszahl', 'Fehler',
  // ADDED 2026-09-13 (round 10): the umlaut plural of Wort. The matcher resolves
  // suffixes, never umlauts, so "die die-Wörter" needs the plural spelled out.
  'Wörter',
  // ADDED 2026-09-13: the clock card needs the units it teaches, and neither is a
  // Wortfeld entry of A1.1 L8 (the Wortfeld carries Uhrzeit, halb, Viertel nach/vor).
  'Stunde', 'Minute',
  // ADDED 2026-09-13: "Die Sache ist schon bekannt" is what definite-articles
  // teaches; A1.1 L5's Wortfeld names the objects, not the word for a thing.
  'Sache',
  // ADDED 2026-09-13: A1.1 L11 teaches the Satzklammer by name in its notice.
  'Satzklammer',
  // ADDED 2026-09-13: the words the cards use to talk about a sentence and about
  // the course itself — "das Verb steht auf Platz 1" is the wording review #3
  // pinned, "die Vorsilbe steht am Ende" is A1.1 L11's notice, and a card may say
  // what happens "in Übungen".
  'Platz', 'Ende', 'Übung',
  // ADDED 2026-09-13: Ja and Nein quoted as words ("nicht nur Ja plus Verb").
  'Ja', 'Nein',
  // ADDED 2026-09-13 FOR A1.2: the rest of the metalanguage the twelve A1.2
  // notices themselves use. Each is a term ABOUT German, never a thing in the
  // situation: the three cases and the two other parts of speech A1.2 names
  // (Nominativ/Dativ/Objekt, Adjektiv, Modalverb), the tense and form words
  // (Präsens, Perfekt, Partizip, Vergangenes → Vergangenheitsform via `Form`),
  // the sentence words (Präposition, Fragewort → `Wort`, Aussagesatz → `Satz`,
  // Wendung, Vergleich), the four things a W-question asks after (Ort, Richtung,
  // Grund, Dauer — the notice's own gloss list), and the two words a card needs
  // to point at the course (Lektion, Kurs).
  'Nominativ', 'Dativ', 'Objekt', 'Adjektiv', 'Modalverb', 'Präsens', 'Perfekt', 'Partizip',
  'Präposition', 'Wendung', 'Vergleich', 'Ort', 'Richtung', 'Grund', 'Dauer', 'Lektion', 'Kurs',
  'Imperativ',
  // ADDED 2026-09-13 (round 3, A1.2 card rewrite): the rest of the metalanguage the
  // rewritten A1.2 cards quote FROM their own notices. `Stelle` and `Angabe` are
  // L1's own wording ("an zweiter Stelle", "Steht eine Angabe vorn"); `Maskulinum`
  // and `Neutrum` are L3's and L10's; `Hunderter` is L2's; `Aufforderung` is L8's;
  // `Menge` is L5's gloss for wie viel; `Erlaubnis`, `Notwendigkeit`, `Absicht`,
  // `Auftrag` and `Fähigkeit` are L9's five modal glosses; `Vergangenes` and
  // `Vergangenheitsform` are L12's. `Dialog` is how a card labels a quoted line.
  'Stelle', 'Angabe', 'Maskulinum', 'Neutrum', 'Hunderter', 'Aufforderung', 'Menge',
  'Erlaubnis', 'Notwendigkeit', 'Absicht', 'Auftrag', 'Fähigkeit', 'Vergangenes',
  'Vergangenheitsform', 'Dialog',
];
const META_NOUN_SET = new Set(META_NOUNS.map((w) => w.toLowerCase()));

/** True when `word` is metalanguage — the course talking ABOUT German. */
export const isMetaNoun = (word) =>
  META_NOUN_SET.has(String(word || '').replace(/[^A-Za-zÄÖÜäöüß]/g, '').toLowerCase());

/**
 * THE SEPARABLE PREFIXES — a closed class of German, and the one list this module
 * is allowed to keep. A verb stem list is not (see `separable-verbs-intro`).
 */
export const SEPARABLE_PREFIXES = [
  'an', 'auf', 'aus', 'ein', 'mit', 'ab', 'zu', 'los', 'weg', 'vor', 'zurück', 'nach', 'her', 'hin',
];

/** A clause that ends in one of those prefixes — the shape of a closed Satzklammer. */
const SATZKLAMMER_RE = new RegExp(`[^.!?]*\\b(?:${SEPARABLE_PREFIXES.join('|')})\\s*[.!?]`, 'g');

/**
 * Verb-SHAPED, the way `frontableOrders` in `src/data/lessonPools/quality.js` reads
 * a finite verb: a present-tense personal ending on a lower-case word. The first
 * word of a sentence is lower-cased before the test (a V1 question — „Stehen Sie
 * um sechs auf?“ — puts the finite verb there), every other word is not, so a
 * capitalised noun can never be read as a verb.
 */
const FINITE_VERB_RE = /^[a-zäöüß]{2,}(?:e|st|t|en|et)$/;
/**
 * THE OTHER CLOSED CLASS: the German FUNCTION WORDS that carry what looks like a
 * present-tense ending (-e, -en, -er, -es, -st, -t) and are not verbs — articles,
 * determiners, pronouns, the common adverbs and prepositions. Listing them is
 * allowed for the same reason listing the prefixes is: a function word class is
 * closed, a verb lexicon is not. Without it „Die Tür ist zu.“ reads as a clamp,
 * because `die` ends in -e.
 */
const FUNCTION_WORD_RE = new RegExp(`^(?:${[
  // articles and determiners
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'kein', 'keine', 'keinen', 'keinem', 'keiner', 'keines',
  'mein', 'meine', 'meinen', 'meinem', 'meiner', 'dein', 'deine', 'deinen', 'deinem', 'deiner',
  'seine', 'seinen', 'seinem', 'seiner', 'ihre', 'ihren', 'ihrem', 'ihrer', 'unser', 'unsere',
  'unseren', 'unserem', 'unserer', 'euer', 'eure', 'euren', 'eurem', 'eurer',
  'dieser', 'diese', 'dieses', 'diesen', 'diesem', 'jede', 'jeden', 'jedem', 'jeder', 'jedes',
  'alle', 'allen', 'aller', 'alles', 'viele', 'vielen', 'manche', 'welche', 'andere', 'beide',
  // pronouns and the words that stand in for one
  'sie', 'ihnen', 'etwas', 'nichts', 'jemand', 'niemand', 'selbst',
  // adverbs and particles
  'bitte', 'heute', 'morgen', 'gestern', 'jetzt', 'dort', 'dann', 'denn', 'wenn', 'schon',
  'immer', 'wieder', 'oder', 'aber', 'leider', 'oft', 'erst', 'fast', 'nicht', 'gern', 'gerne',
  'zuerst', 'danach', 'vielleicht', 'zusammen', 'natürlich',
  // prepositions and conjunctions
  'unter', 'über', 'hinter', 'neben', 'zwischen', 'gegen', 'ohne', 'seit', 'mit', 'außer',
  // the adjectives that most often stand before a noun in this material
  'gute', 'guten', 'guter', 'gutes', 'beste', 'erste', 'zweite', 'dritte', 'letzte', 'nächste',
  'liebe', 'lieber', 'nette', 'kurze', 'lange', 'neue', 'neuen', 'neuer', 'neues',
].join('|')})$`);

/** Forms of `sein` — the copula can never be the front half of a Satzklammer. */
const COPULA_RE = /^(?:bin|bist|ist|sind|seid)$/;

/**
 * Lower-case words that sit between an article and a noun without being a declined
 * adjective: the quantifiers and determiner-like words that end in -e/-en/-er/-es.
 */
const NOT_AN_ADJECTIVE_RE = /^(?:nicht|auch|noch|schon|bitte|eine|keine|andere|alle|viele|beide|meine|meinen|meinem|meiner|deine|deinen|deinem|deiner|seine|seinen|seinem|seiner|ihre|ihren|ihrem|ihrer|unsere|unseren|unserem|unserer|eure|euren|eurem|eurer|diese|diesen|diesem|dieser|jede|jeden|jedem|jeder)$/;

/**
 * Does this clause carry a token shaped like a finite verb that could be the FRONT
 * half of a Satzklammer? A form of `sein` cannot: it is the copula, so „Der Teppich
 * ist auf der Terrasse.“ and „Die Tür ist zu.“ are a predicate with a preposition
 * and a predicative adjective, not a clamp — and those are the two negative probes
 * this pattern is measured against.
 */
const hasFiniteVerb = (clause) => {
  const tokens = String(clause || '').match(/[A-Za-zÄÖÜäöüß]+/g) || [];
  // The last token is the prefix itself.
  return tokens.slice(0, -1).some((t, i) => {
    const w = i === 0 ? t.toLowerCase() : t;
    const low = w.toLowerCase();
    return FINITE_VERB_RE.test(w) && !FUNCTION_WORD_RE.test(low) && !COPULA_RE.test(low);
  });
};

export const CONSTRUCTION_PATTERNS = [
  {
    slug: 'indefinite-articles',
    label: 'unbestimmter Artikel vor einem Nomen',
    re: /\b(ein|eine|kein|keine)\s+([A-ZÄÖÜ][a-zäöüß]+)/g,
    skip: (m) => isMetaNoun(m[2]),
  },
  {
    slug: 'separable-verbs-intro',
    label: 'die Satzklammer (Verb vorn, Vorsilbe am Satzende)',
    // STRUCTURAL, NOT A STEM LIST (DaF review #13, MAJOR 3). This pattern used to
    // fire only when the sentence carried one of fourteen hand-written verb stems,
    // so „Bitte **kaufen** Sie das Brot ein.“ was caught and „Bitte **füllen** Sie
    // das Formular aus.“ — a read-aloud line of L2 and the dictation of Checkpoint 1
    // — was not: `füll` was not on the list. A guard whose heart is a list does not
    // report a null, it reports „null over this list“, and the next round reads the
    // difference. So: a sentence-final prefix from the closed PREFIX set, preceded
    // inside the same clause by a token SHAPED like a finite verb. The prefixes are
    // a closed class of German and may be listed; verbs are not.
    re: SATZKLAMMER_RE,
    // …but only when the clause actually has a FINITE VERB that could be the front
    // half of the clamp — otherwise „Der Teppich ist auf der Terrasse.“ would be a
    // Satzklammer (it is not: nothing there is sentence-final). Every person of the
    // form, the Sie-form included: the review's own probe is „Stehen Sie um sechs auf?“.
    skip: (m) => !hasFiniteVerb(m[0]),
  },
  {
    slug: 'possessive-articles',
    label: 'Possessivartikel vor einem Nomen',
    // `sein` is NOT in this list: it is also the infinitive of the copula, which
    // A1.1 Lektion 2 teaches and which every card that names the verb has to
    // write („Nach sein steht der Beruf ohne Artikel“). The possessive `sein` is
    // carried by the card guard's UNTAUGHT_ANSWER_FORMS and, on the production
    // side, by RULE 15's own `possessive-articles` form pattern.
    re: /\b(mein|dein|unser|euer)e?[nmrs]?\s+([A-ZÄÖÜ][a-zäöüß]+)/gi,
    skip: (m) => isMetaNoun(m[2]),
  },
  {
    slug: 'adjective-declension',
    label: 'Adjektiv mit Endung vor einem Nomen',
    // `never: true` — A1.1 teaches Adjektivdeklination in NO Lektion, so it is
    // deferred in every one of them. This is the one construction the course
    // rejects by name: the comment above A1.1 L8's dialogue line reads „NOT »Ich
    // habe einen guten Wecker«: that is Adjektivdeklination im Akkusativ, a fifth
    // Vorgriff the course never names“ — and eight lines below it the Beispieltext
    // of the SAME Lektion carried it three times („ein neuer Termin“, „der neue
    // Tag“, „die neue Uhrzeit“), because no rule read a model text (DaF review #13,
    // MAJOR 2). Measured against the material BEFORE it was written, as round 12
    // did for UNCONDITIONED_RULE: three hits in the L8 sample, one in the L12
    // dialogue line „Mai ist ein schöner Monat!“ (a dialogue, CONTRACT §2 — the
    // production surfaces are what RULE 15b reads), nothing else.
    re: /\b(?:[Ee]in|[Ee]ine|[Ee]inen|[Ee]inem|[Ee]iner|[Kk]ein|[Kk]eine|[Kk]einen|[Dd]er|[Dd]ie|[Dd]as|[Dd]en|[Dd]em)\s+([a-zäöüß]+(?:e|en|er|es))\s+([A-ZÄÖÜ][a-zäöüß]+)/g,
    skip: (m) => isMetaNoun(m[2]) || NOT_AN_ADJECTIVE_RE.test(m[1]),
    never: true,
  },
];

/**
 * Every deferred-construction hit in one sentence, regardless of Lektion: the
 * caller decides which slugs are still in the future. Returns
 * `{ slug, label, hit }`, `hit` being the matched text.
 */
export const constructionHits = (sentence) => {
  const text = String(sentence || '');
  const out = [];
  for (const { slug, label, re, skip, never } of CONSTRUCTION_PATTERNS) {
    for (const m of text.matchAll(new RegExp(re.source, re.flags))) {
      if (skip && skip(m, text)) continue;
      out.push({ slug, label, hit: m[0].trim(), never: !!never });
    }
  }
  return out;
};

/** The Lektion of a curriculum whose `primarySlug` is `slug` — the curriculum's own answer. */
export const introducedAt = (curriculum, slug) => {
  const l = (curriculum?.lektionen || []).find((x) => x.primarySlug === slug);
  return l ? l.nr : null;
};

/**
 * The construction hits of `sentence` that the course only TEACHES after
 * `lektionNr`. One function, used by the card guard and by RULE 15b.
 */
export const deferredConstructionHits = (curriculum, lektionNr, sentence) =>
  constructionHits(sentence)
    .map((h) => ({ ...h, taught: h.never ? null : introducedAt(curriculum, h.slug) }))
    // `never` is the strongest case of deferred: the level teaches the pattern in NO
    // Lektion, so it is in the future of every one of them.
    .filter((h) => h.never || (h.taught && h.taught > lektionNr));
