// The closed A1 core that LEX-01 / LEX-03 count as known from A1.1 on (rule-smith 2026-09-27).
//
// WHY. The level lexicons are ALLOCATIONS of what each unit teaches (SCHEMA §6); nobody allocates
// „sein", „einmal" or „die Tür" to a unit, and the lower levels are written in parallel with the
// higher ones. Without a floor, every text trips over words a learner has known since week one.
//
// WHAT MAY STAND HERE — and what may not. Every entry is a Goethe-Zertifikat A1 word-list-level item
// that no unit needs to teach: the irregular auxiliaries and modals (full paradigms, incl. Konjunktiv II),
// closed-class words the text.mjs FUNCTION_WORDS list lacks (pronominal adverbs, indefinites,
// interjections), A1 time/place adverbs, and a small set of A1 everyday content words that classroom
// German presupposes (Moment, Tür, fertig, bringen, beginnen …). NEVER an A2/B1/B2 word, never a word a
// unit allocates as a teaching target, never a proper name (those live in registries/names.json, SCHEMA §4.9,
// read by lexicon.mjs): a missing higher-level lemma is a lexicon
// gap for its allocator, and this file must not become the way around LEX-01. The list is closed at
// ≤ 400 entries (a test pins the count and bans the B-level words that have been proposed so far);
// a new entry needs its A1 justification in the commit that adds it.
//
// Entries are generated through the same morphology as the lexicon (lexicon.mjs entryForms), so
// „bringen" licenses bringt, brachte, gebracht, brächte …; paradigms that morphology cannot generate
// are spelled out in CORE_PARADIGMS. Number words are generated (NUMBER_WORDS).
//
// PRECEDENCE. The lexicon outranks this list: a core lemma that some lexicon allocates to a unit is
// NOT known before that unit (lexicon.mjs knownForms), so the core can never teach a word early. The
// list was pruned on 2026-09-27 of every lemma the eight lexicons already allocate (gehen, Frau, gut …).

/** Irregular paradigms, every form spelled out (one entry each). */
export const CORE_PARADIGMS = {
  sein: 'sein bin bist ist sind seid war warst waren wart gewesen sei seist seien wäre wärst wärest wären wärt wäret',
  haben: 'haben habe hab hast hat habt hatte hattest hatten hattet gehabt hätte hättest hätten hättet',
  werden: 'werden werde wirst wird werdet wurde wurdest wurden wurdet geworden worden würde würdest würden würdet',
  können: 'können kann kannst könnt konnte konntest konnten konntet gekonnt könnte könntest könnten könntet',
  müssen: 'müssen muss musst müsst musste musstest mussten musstet gemusst müsste müsstest müssten müsstet',
  dürfen: 'dürfen darf darfst dürft durfte durftest durften durftet gedurft dürfte dürftest dürften dürftet',
  sollen: 'sollen soll sollst sollt sollte solltest sollten solltet gesollt',
  wollen: 'wollen will willst wollt wollte wolltest wollten wolltet gewollt',
  mögen: 'mögen mag magst mögt mochte mochtest mochten mochtet gemocht möchte möchtest möchten möchtet',
  wissen: 'wissen weiß weißt wisst wusste wusstest wussten wusstet gewusst wüsste wüsstest wüssten wüsstet',
  tun: 'tun tue tu tust tut tat tatest taten tatet getan täte tätest täten',
};

/**
 * Closed-class words FUNCTION_WORDS (text.mjs) lacks, one entry each: pronoun and determiner forms,
 * pronominal adverbs (da-/wo-), indefinites, A1 time/place/degree adverbs, interjections.
 */
const CLOSED = `
dies dessen deren denen jemanden jemandem niemanden niemandem einige einigen einiger einiges
mehrere mehreren solche solchen solcher solches keins meins deins
dabei dafür dahin daneben daran darauf daraus darin darüber davon davor dazu dazwischen
woran worauf woraus worin worüber wovon wofür womit wozu dorthin
außer
einmal zweimal dreimal nochmal erst
unten oben hinten vorne vorn draußen
morgens mittags nachmittags vormittags abends nachts montags dienstags mittwochs donnerstags freitags samstags sonntags
vielleicht natürlich wirklich genau
ach oh na hm hmm äh ähm tja okay ok aha
`;
/**
 * A1 content lemmas, compact: `POS lemma | 3sg | praet | perfekt` (VERB), `NOUN art lemma | plural`,
 * `ADJ lemma`, `ADV lemma`. Each line is one entry, generated through entryForms.
 */
const CONTENT = `
VERB beginnen | beginnt | begann | hat begonnen
VERB bringen | bringt | brachte | hat gebracht
VERB liegen | liegt | lag | hat gelegen
VERB sagen | sagt | sagte | hat gesagt
VERB sitzen | sitzt | saß | hat gesessen
VERB stehen | steht | stand | hat gestanden
VERB rufen | ruft | rief | hat gerufen
VERB dauern | dauert | dauerte | hat gedauert
VERB glauben | glaubt | glaubte | hat geglaubt
VERB stimmen | stimmt | stimmte | hat gestimmt
VERB öffnen | öffnet | öffnete | hat geöffnet
VERB zumachen | macht zu | machte zu | hat zugemacht
VERB aufmachen | macht auf | machte auf | hat aufgemacht
VERB mitbringen | bringt mit | brachte mit | hat mitgebracht
NOUN der Moment | Momente
NOUN die Tür | Türen
NOUN das Haus | Häuser
NOUN der Ort | Orte
NOUN der Mensch | Menschen
NOUN die Leute | Leute
NOUN die Antwort | Antworten
NOUN der Text | Texte
NOUN das Bild | Bilder
NOUN die Zeit | Zeiten
NOUN der Mittag | Mittage
NOUN das Ende | Enden
NOUN der Cent | Cent
NOUN das Auto | Autos
NOUN die Arbeit | Arbeiten
NOUN die Schule | Schulen
NOUN der Gruß | Grüße
NOUN die Dame | Damen
NOUN der Herr | Herren
NOUN das Mal | Male
ADJ fertig
ADJ schnell
ADJ langsam
ADJ früh
ADJ nächst
ADJ letzt
ADJ viel
ADJ wenig
ADJ ganz
ADJ gleich
ADJ andere
ADJ wichtig
ADJ klar
ADJ geehrt
ADJ laut
`;

function parseContent(src) {
  const out = [];
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const [head, ...rest] = line.split('|').map((s) => s.trim());
    const sp = head.indexOf(' ');
    const pos = head.slice(0, sp);
    const lemmaRaw = head.slice(sp + 1);
    if (pos === 'VERB') {
      const [third, praet, perfekt] = rest;
      out.push({ lemma: lemmaRaw, pos, verb_forms: { '3sg': third, praet, perfekt }, separable: /\s/.test(third || '') && !/^gibt$/.test(third) });
    } else if (pos === 'NOUN') {
      const [article, lemma] = lemmaRaw.split(/\s+/);
      const plural = rest[0] && rest[0] !== '–' ? rest[0] : null;
      out.push({ lemma, article, pos, plural });
    } else {
      out.push({ lemma: lemmaRaw, pos });
    }
  }
  // de-duplicate (a lemma listed twice counts once)
  const seen = new Set();
  return out.filter((e) => {
    const k = `${e.pos}|${e.lemma}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Content lemmas as pseudo lexicon entries (run through entryForms by lexicon.mjs). */
export const CORE_ENTRIES = parseContent(CONTENT);

const CLOSED_WORDS = CLOSED.split(/\s+/).filter(Boolean);

/** Closed-class words and spelled-out paradigms as { lemma, forms } (content entries: CORE_ENTRIES). */
export const CORE_FIXED = [
  ...CLOSED_WORDS.map((w) => ({ lemma: w, forms: [w] })),
  ...Object.entries(CORE_PARADIGMS).map(([lemma, f]) => ({ lemma, forms: f.split(/\s+/).filter(Boolean) })),
];

/** The number of entries the core holds (a test pins the ceiling). */
export const CORE_SIZE = CLOSED_WORDS.length + Object.keys(CORE_PARADIGMS).length + CORE_ENTRIES.length;

/** The lemmas of the core, for tests and reports. */
export const CORE_LEMMAS = [...CLOSED_WORDS, ...Object.keys(CORE_PARADIGMS), ...CORE_ENTRIES.map((e) => e.lemma)];

// ── number words ──────────────────────────────────────────────────────────────────────────────
const ONES = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
const TEENS = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const TENS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

function below100(n, final) {
  if (n === 0) return '';
  if (n === 1) return final ? 'eins' : 'ein';
  if (n < 10) return ONES[n];
  if (n < 20) return TEENS[n - 10];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${ONES[o]}und${TENS[t]}` : TENS[t];
}

/** The spelled cardinal(s) of 0 ≤ n ≤ 9999 („hundert" and „einhundert" both). */
export function cardinals(n) {
  if (n === 0) return ['null'];
  const th = Math.floor(n / 1000);
  const h = Math.floor((n % 1000) / 100);
  const r = n % 100;
  const tail = below100(r, true);
  const hs = h ? (h === 1 ? ['hundert', 'einhundert'] : [`${ONES[h]}hundert`]) : [''];
  const ts = th ? (th === 1 ? ['tausend', 'eintausend'] : [`${below100(th, false)}tausend`]) : [''];
  const out = [];
  for (const t of ts) for (const hh of hs) out.push(`${t}${hh}${tail}`);
  return out;
}

/** The ordinal stem(s) of 1 ≤ n ≤ 9999: erst-, dritt-, siebt-/siebent-, zwanzigst- … */
export function ordinalStems(n) {
  const special = { 1: ['erst'], 3: ['dritt'], 7: ['siebt', 'siebent'], 8: ['acht'] };
  const r = n % 100;
  if (n < 20 && special[n]) return special[n];
  if (n < 20) return cardinals(n).map((c) => `${c}t`);
  if (r >= 1 && r < 20 && n > 100) {
    // hundertunderste is not German: 101. = hunderterste, 103. = hundertdritte
    const head = cardinals(n - r).map((c) => c);
    const tails = ordinalStems(r);
    return head.flatMap((h) => tails.map((t) => `${h}${t}`));
  }
  return cardinals(n).map((c) => `${c}st`);
}

function buildNumbers() {
  // „zwo" is the spoken variant of „zwei" in phone numbers and on the phone (review a1.1-u02: the
  // Buchstabier-/Zahlen-Szene says „null-drei-vier-zwo"); a number word, not a lemma to allocate
  const s = new Set(['ein', 'eins', 'zwo', 'million', 'millionen', 'milliarde', 'milliarden']);
  for (let n = 0; n <= 9999; n += 1) for (const c of cardinals(n)) s.add(c);
  for (let n = 1; n <= 9999; n += 1) {
    const endings = n <= 100 || n % 100 === 0 ? ['e', 'en', 'er', 'es', 'em'] : ['e', 'en'];
    for (const st of ordinalStems(n)) {
      for (const e of endings) s.add(`${st}${e}`);
      if (n <= 10) s.add(`${st}ens`); // erstens, zweitens
    }
  }
  return s;
}

/** Cardinal and ordinal number words (lower-case). */
export const NUMBER_WORDS = buildNumbers();
