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
    re: /\b\w+e?[stn]?\b[^.!?]*\s(ein|auf|an|aus|mit|zu|vor|nach)\s*[.!?]/g,
    // …but only when the sentence actually has a FINITE verb that could be the
    // front half of the clamp — otherwise „Der Teppich ist auf der Terrasse.“ is a
    // Satzklammer. Every person of the form, the Sie-form included: the review's
    // own probe is „Stehen Sie um sechs auf?“.
    skip: (m, sentence) => !/\b(kauf|steh|ruf|fang|hör|mach|komm|seh|bring|schlaf|räum|geh|fahr|zieh)(e|st|t|en)\b/i.test(sentence),
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
];

/**
 * Every deferred-construction hit in one sentence, regardless of Lektion: the
 * caller decides which slugs are still in the future. Returns
 * `{ slug, label, hit }`, `hit` being the matched text.
 */
export const constructionHits = (sentence) => {
  const text = String(sentence || '');
  const out = [];
  for (const { slug, label, re, skip } of CONSTRUCTION_PATTERNS) {
    for (const m of text.matchAll(new RegExp(re.source, re.flags))) {
      if (skip && skip(m, text)) continue;
      out.push({ slug, label, hit: m[0].trim() });
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
    .map((h) => ({ ...h, taught: introducedAt(curriculum, h.slug) }))
    .filter((h) => h.taught && h.taught > lektionNr);
