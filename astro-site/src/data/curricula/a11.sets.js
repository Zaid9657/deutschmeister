// Explicit written → spoken mappings. These are curriculum input, not a vocabulary exemption.
const members = (rows) => rows.map(([written, said, noteDe, noteEn]) => ({ written, said, ...(noteDe ? { noteDe, noteEn } : {}) }));
export const ALPHABET = {
  id: 'alphabet', kind: 'letters', titleDe: 'Das Alphabet', titleEn: 'The alphabet',
  placement: { afterChunk: 1 }, ownName: true,
  members: members([
    ['A', 'Ah'], ['B', 'Beh'], ['C', 'Zeh'], ['D', 'Deh'], ['E', 'Eh'],
    ['F', 'Eff'], ['G', 'Geh'], ['H', 'Hah'], ['I', 'Ih'], ['J', 'Jot'],
    ['K', 'Kah'], ['L', 'Ell'], ['M', 'Emm'], ['N', 'Enn'], ['O', 'Oh'],
    ['P', 'Peh'], ['Q', 'Kuh'], ['R', 'Err'], ['S', 'Ess'], ['T', 'Teh'],
    ['U', 'Uh'], ['V', 'Vau'], ['W', 'Weh'], ['X', 'Iks'], ['Y', 'Ypsilon'],
    ['Z', 'Zett'], ['Ä', 'Äh'], ['Ö', 'Öh'], ['Ü', 'Üh'],
    ['ß', 'Eszett', 'Auch: scharfes S. Groß: ẞ; ohne ß auf der Tastatur: ss.', 'Also called scharfes S. Capital: ẞ; on keyboards without ß: ss.'],
  ]).map((m) => ({ ...m, audio: m.said, said: ({ A: 'A', B: 'Be', C: 'Ce', D: 'De', E: 'E', F: 'Ef', G: 'Ge', H: 'Ha', I: 'I', K: 'Ka', L: 'El', M: 'Em', N: 'En', O: 'O', P: 'Pe', Q: 'Ku', R: 'Er', S: 'Es', T: 'Te', U: 'U', W: 'We', Ä: 'Ä', Ö: 'Ö', Ü: 'Ü' })[m.written] || m.said })),
  // A real word/name, using only letters already introduced by the end of each group.
  spellings: ['Ada', 'Ehe', 'Mai', 'Post', 'Wut', 'süß'],
  contrasts: [['E', 'I'], ['G', 'J'], ['V', 'W']],
};
export const DIGITS = {
  id: 'numbers-0-10', kind: 'numbers', titleDe: 'Die Zahlen 0–10', titleEn: 'Numbers 0–10',
  members: members([['0', 'null'], ['1', 'eins'], ['2', 'zwei'], ['3', 'drei'], ['4', 'vier'], ['5', 'fünf'], ['6', 'sechs'], ['7', 'sieben'], ['8', 'acht'], ['9', 'neun'], ['10', 'zehn']]),
};
export const PRICES = {
  id: 'numbers-11-100', kind: 'numbers', titleDe: 'Die Zahlen 11–100', titleEn: 'Numbers 11–100',
  members: members([
    ['11', 'elf'], ['12', 'zwölf'], ['13', 'dreizehn'], ['14', 'vierzehn'], ['15', 'fünfzehn'],
    ['16', 'sechzehn'], ['17', 'siebzehn'], ['18', 'achtzehn'], ['19', 'neunzehn'], ['20', 'zwanzig'],
    ['30', 'dreißig'], ['40', 'vierzig'], ['50', 'fünfzig'], ['60', 'sechzig'], ['70', 'siebzig'],
    ['80', 'achtzig'], ['90', 'neunzig'], ['100', 'hundert'],
  ]),
  contrasts: [['13', '30'], ['14', '40'], ['15', '50'], ['16', '60'], ['17', '70'], ['18', '80'], ['19', '90']],
  rule: {
    id: 'unit-before-ten',
    de: '21–99: Sagen Sie zuerst den Einer, dann und, dann den Zehner. Schreiben Sie alles als ein Wort. Vor und heißt eins nur ein: einundzwanzig = eins + und + zwanzig.',
    en: '21–99: say the unit first, then und, then the ten. Write one word: einundzwanzig is one-and-twenty. Before und, eins becomes ein. Exact tens keep their own names.',
    examples: members([['21', 'einundzwanzig'], ['27', 'siebenundzwanzig'], ['72', 'zweiundsiebzig']]),
    transfer: members([['34', 'vierunddreißig'], ['61', 'einundsechzig'], ['98', 'achtundneunzig']]),
  },
};
export const FULL_HOUR = {
  id: 'full-hour', kind: 'clock', titleDe: 'Um wie viel Uhr?', titleEn: 'At what time?',
  rule: { id: 'full-hour', de: 'Wann? Sagen Sie um + Zahl (+ Uhr): um neun Uhr, kurz: um neun. Bei 1 heißt es ein Uhr, aber um eins ohne Uhr. Wie spät ist es? Es ist neun Uhr, ohne um.',
    en: 'When? Use um + number (+ Uhr): um neun Uhr, or um neun. For 1, use ein Uhr, but um eins without Uhr. To tell the time, say Es ist neun Uhr, without um.' },
  members: members([['09:00', 'um neun Uhr'], ['10:00', 'um zehn Uhr'], ['11:00', 'um elf Uhr'], ['01:00', 'um ein Uhr', 'Ohne Uhr: um eins.', 'Without Uhr: um eins.']]),
};

// L3 already uses zwanzig for an age, before L4's complete price set.
export const AGE_TWENTY = {
  id: 'age-twenty', kind: 'numbers', titleDe: 'Zehn und zwanzig', titleEn: 'Ten and twenty',
  members: [DIGITS.members.find((m) => m.written === '10'), PRICES.members.find((m) => m.written === '20')],
};

// L4 keeps the complete canonical inventory; only delivery is divided.
const { rule: compoundRule, ...priceMembers } = PRICES;
export const PRICE_FOUNDATIONS = { ...priceMembers, placement: 'before-scene' };
export const PRICE_COMPOUNDS = {
  id: 'numbers-21-99', kind: PRICES.kind, titleDe: 'Zahlen mit und', titleEn: 'Compound numbers',
  members: compoundRule.examples, rule: compoundRule, ruleOnly: true, placement: 'part2',
};
export const letterName = (letter) => ALPHABET.members.find((m) => m.written === letter).said;
