// Ways a right answer is said longer (blind corpora of loop round 2, 2026-11-25). On answers no list holds, the final check
// confirmed 49 % and 55 % of the right ones; most of the rest say the turn's own answer with a correctly inflected adjective,
// a degree word, a time phrase or „Gibt es …?“ for „Haben Sie …?“. Each function takes one such addition off and returns the
// answer without it, or nothing; the answer itself is then graded word for word as before. An addition that is wrong German
// (an ending the noun does not ask for) is never taken off.

const plain = (w) => String(w || '').toLocaleLowerCase('de').replace(/ß/g, 'ss').replace(/^[„“"(]+|[.,!?;:)“”"]+$/g, '');
const cap = (s) => s.charAt(0).toLocaleUpperCase('de') + s.slice(1);

// Everyday adjectives beside the taught ones (folded). „teuer“ and „dunkel“ drop their e.
const ADJECTIVES = new Set(`rot blau gelb grün schwarz weiss grau braun bunt hell dunkel dunkl neu alt gross klein jung schön hübsch gut schlecht warm kalt heiss lang
kurz dick dünn schwer leicht teuer teur billig günstig frisch lecker süss still frei schnell langsam laut leise nett lieb krank gesund toll deutsch privat eigen ganz
sauber leer voll kaputt praktisch modern wichtig richtig bequem weich hart rund breit schmal hoch hoh nah weit früh spät halb best hellblau dunkelblau hellgrün`.split(/\s+/));
const EIN = /^(k?ein|mein|dein|sein|ihr|unser|euer|eur)(e|en|em|er|es)?$/;
// The ending of an adjective after a determiner, by the noun's gender: after der/die/das, and after ein, mein, kein.
const AFTER_DEFINITE = { der: { der: 'e', den: 'en', dem: 'en', des: 'en' }, die: { die: 'e', der: 'en' }, das: { das: 'e', dem: 'en', des: 'en' }, pl: { die: 'en', den: 'en', der: 'en' } };
const AFTER_EIN = { der: { '': 'er', en: 'en', em: 'en', es: 'en' }, die: { e: 'e', er: 'en' }, das: { '': 'es', em: 'en', es: 'en' }, pl: { e: 'en', en: 'en', er: 'en' } };
function attributeFits(det, adj, readings) {
  const d = plain(det);
  const a = plain(adj);
  const m = d.match(EIN);
  return readings.some((g) => {
    const want = m ? (m[1] === 'ein' && g === 'pl' ? undefined : AFTER_EIN[g][m[2] || '']) : AFTER_DEFINITE[g]?.[d];
    return want !== undefined && a.endsWith(want) && ADJECTIVES.has(a.slice(0, -want.length));
  });
}

/** „Wo ist mein blauer Stift?“ → „Wo ist mein Stift?“: an adjective with the ending its determiner and noun ask for comes off. */
export function withoutAttribute(text, readings) {
  const w = String(text).trim().split(/\s+/);
  for (let i = 1; i + 1 < w.length; i += 1) {
    if (!/^\p{Ll}\p{L}+$/u.test(w[i]) || !/^\p{Lu}/u.test(w[i + 1])) continue;
    const d = plain(w[i - 1]);
    if (!(EIN.test(d) || /^(?:der|die|das|den|dem)$/.test(d)) || /[.,!?;:]$/.test(w[i - 1])) continue;
    const r = readings(w[i + 1].replace(/[.,!?;:]+$/, ''));
    if (r && attributeFits(w[i - 1], w[i], r)) return [...w.slice(0, i), ...w.slice(i + 1)].join(' ');
  }
  return null;
}

// „viel“, „großen“ and their like before Hunger, Durst, Zeit; degree words before an adjective at the end.
const MUCH = '(?:(?:ein\\s+bisschen|ein\\s+wenig|etwas|(?:sehr|so|ziemlich|besonders|richtig|echt|wirklich|heute|jetzt)\\s+viel|viel|richtig|(?:sehr\\s+)?gro(?:ß|ss)en|riesigen|immer|heute|schon(?:\\s+lange)?|jetzt|gerade|noch|auch)\\s+)+';
const BEFORE_NOUN = new RegExp(`(?<=(?:^|\\s)(?:habe|hast|hab|habe\\s+ich|hast\\s+du)\\s)${MUCH}(?=(?:Hunger|Durst)(?!\\p{L}))`, 'iu');
const AND_NOUN = new RegExp(`(?<=\\sund\\s)${MUCH}(?=(?:Hunger|Durst)(?!\\p{L}))`, 'iu');
const DEGREE = /(?<=\s(?:bin|ist|sind|war)\s(?:(?:noch|schon|auch|heute|jetzt|leider)\s)?)(?:ein\s+bisschen|ein\s+wenig|etwas|recht|ziemlich|ganz|richtig|echt|wirklich|total|sehr|so)\s+(?=\p{Ll}+[.!?]*$)/iu;
/** „Ich habe heute ein bisschen Durst.“ → „Ich habe Durst.“; „Sie ist schon recht alt.“ → „Sie ist schon alt.“ */
export function withoutDegree(text) {
  const s = String(text);
  const t = s.replace(BEFORE_NOUN, '').replace(AND_NOUN, '').replace(DEGREE, '');
  return t === s ? null : t;
}

// When it is, where the turn does not ask for it: after work, after sport, at the moment.
const OCCASION = '(?:nach\\s+(?:der\\s+(?:Arbeit|Schule|Pause|Prüfung)|dem\\s+(?:Sport|Kurs|Deutschkurs|Essen|Training|Fußball|Fußballtraining|Unterricht|Frühstück|Schwimmen))|im\\s+Moment|zurzeit|heute\\s+(?:Morgen|Abend|Nachmittag|Vormittag))';
// Inside the sentence, after its verb: never with the subject right after it („nach der Arbeit ich habe …“ has its verb in the wrong place).
const OCCASION_MID = new RegExp(`(?<!,)\\s+${OCCASION}(?=[\\s.!?,]|$)(?!\\s+(?:ich|du|er|sie|es|wir|ihr)(?!\\p{L}))`, 'iu');
const OCCASION_FRONT = new RegExp(`^((?:ja|nein|oh\\s+ja|doch)[,!.]?\\s+)?${OCCASION}\\s+(\\p{L}+)\\s+(ich|du|er|sie|es|wir)\\s+(.+)$`, 'iu');
/** „Nach der Arbeit habe ich Hunger.“ → „Ich habe Hunger.“ */
export function withoutOccasion(text) {
  const s = String(text).trim();
  const front = s.match(OCCASION_FRONT);
  if (front) return `${front[1] || ''}${front[1] ? front[3].toLocaleLowerCase('de') : cap(front[3].toLocaleLowerCase('de'))} ${front[2]} ${front[4]}`;
  const t = s.replace(OCCASION_MID, '');
  return t === s ? null : t;
}

// Who comes „to my party“ answers „who comes“.
const TO_PARTY = /\s+zu(?:r|m|\s+meine[rm])\s+(?:(?:kleinen|großen)\s+)?(?:Fest|Party|Feier|Geburtstag|Geburtstagsparty|Geburtstagsfeier)(?=[\s.!,]|$)/u;
export const withoutParty = (text) => { const s = String(text); const t = s.replace(TO_PARTY, ''); return t === s ? null : t; };

const SMALL = '(?:(?:hier|heute|auch|noch|denn|bei\\s+Ihnen|vielleicht|bitte|da|mal)\\s+)*';
const HAVE = [
  new RegExp(`^Gibt(?:['’]s|\\s+es)\\s+${SMALL}(.+?)(?:\\s+(?:hier|heute|bei\\s+Ihnen|bitte))?\\s*\\?$`, 'iu'),
  new RegExp(`^(?:Hätten|Haben)\\s+Sie\\s+${SMALL}(.+?)(?:\\s+(?:für\\s+mich|da|hier|heute))?\\s*\\?$`, 'iu'),
  new RegExp(`^Bekomme\\s+ich\\s+${SMALL}(.+?)\\s*\\?$`, 'iu'),
  new RegExp(`^Kann\\s+(?:man|ich)\\s+${SMALL}(.+?)\\s+(?:bekommen|haben|bestellen|kaufen)\\s*\\?$`, 'iu'),
];
/** „Gibt es hier auch eine Suppe?“, „Hätten Sie vielleicht einen Tee für mich?“ → „Haben Sie …?“ */
export function asHaveQuestion(text) {
  const s = String(text).trim();
  for (const re of HAVE) {
    const m = s.match(re);
    if (m && m[1]) { const t = `Haben Sie ${m[1]}?`; return t === s ? null : t; }
  }
  return null;
}

/** „Und die Fahrkarte? Was kostet sie?“, „Ich mag den Tisch. Was kostet er?“ → „Was kostet die Fahrkarte?“ */
export function nounForPronoun(text, readings) {
  const parts = String(text).trim().split(/(?<=[.!?])\s+/);
  if (parts.length !== 2 || !/\?$/.test(parts[1])) return null;
  const m = parts[1].match(/^(.*\s)(er|sie|es)(?=[\s?])(.*)$/u);
  if (!m) return null;
  const w = parts[0].split(/\s+/).map((x) => x.replace(/[.,!?;:]+$/, ''));
  const found = w.map((x, i) => ({ x, det: plain(w[i - 1]), r: i > 0 && /^\p{Lu}/u.test(x) ? readings(x) : null })).filter((x) => x.r);
  if (found.length !== 1) return null;
  const g = found[0].r.find((x) => ({ der: 'er', die: 'sie', das: 'es' })[x] === m[2].toLocaleLowerCase('de'));
  if (!g) return null;
  const own = found[0].det.match(/^(mein|dein|sein|ihr|unser)(?:e|en|em|er)?$/);
  const det = own ? `${own[1]}${g === 'die' ? 'e' : ''}` : g;
  return `${m[1]}${det} ${found[0].x}${m[3]}`;
}

// How one is: every word that answers „Wie geht es Ihnen?“ in the place of „gut“.
const WELL = '(?:ganz\\s+gut|sehr\\s+gut|super|prima|toll|bestens|ausgezeichnet|wunderbar|hervorragend|okay|ok|nicht\\s+so\\s+gut|nicht\\s+gut|schlecht|leider\\s+(?:nicht\\s+so\\s+gut|schlecht))';
const WELL_AT = new RegExp(`(?<=(?:geht\\s+es\\s+mir|geht['’]?s\\s+mir|mir\\s+geht\\s+es|mir\\s+geht['’]s|es\\s+geht\\s+mir)\\s+(?:heute\\s+)?)${WELL}(?!\\p{L})`, 'iu');
const WELL_ALONE = new RegExp(`^${WELL}(?=[,.!]|\\s+danke|\\s+und)`, 'iu');
export function asWell(text) {
  const s = String(text).trim().replace(/geht['’]s/giu, 'geht es');
  const t = s.replace(WELL_AT, 'gut').replace(WELL_ALONE, 'Gut');
  return t === String(text).trim() ? null : t;
}

/** „Wie teuer ist das Ticket?“ → „Was kostet die Fahrkarte?“: the price asked another way, and the ticket by its other name. */
export function asCostQuestion(text, { ticket = false } = {}) {
  let s = String(text).trim().replace(/^Wie\s+teuer\s+(ist|sind)\s+(.+?)\s*\?$/iu, (_, v, rest) => `Was ${/ist/i.test(v) ? 'kostet' : 'kosten'} ${rest}?`);
  if (ticket) s = s.replace(/(?<!\p{L})(das|ein|Das|Ein)\s+Ticket(?!\p{L})/u, (_, d) => (/das/i.test(d) ? 'die Fahrkarte' : 'eine Fahrkarte'));
  return s === String(text).trim() ? null : s;
}

/** „Und du, was hast du gestern gemacht?“ → „Was hast du gestern gemacht?“: the turn to the partner before the question. */
export function withoutAndYou(text) {
  const m = String(text).trim().match(/^Und\s+(?:du|Sie)\s*,\s+(\p{L})(.*\?)$/u);
  return m ? `${m[1].toLocaleUpperCase('de')}${m[2]}` : null;
}

/** „Können wir uns am Freitag um zehn treffen?“ → „Hast du am Freitag um zehn Zeit?“ */
export function asTimeQuestion(text) {
  const m = String(text).trim().match(/^(?:Können|Wollen)\s+wir\s+uns\s+(.+?)\s+(?:treffen|sehen)\s*\?$/iu);
  return m ? `Hast du ${m[1]} Zeit?` : null;
}
