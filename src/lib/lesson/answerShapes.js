// The shapes people give a right answer (two independent scores and two blind corpora, 2026-11-25): a greeting or a
// thank-you around it, a counter-question after it, a small word in the middle, „dieser“ for „der“, the question asked
// indirectly. Each function takes one such shape off and hands back the plain answer; finalCheck.js grades that word for
// word as before, so a fault in the answer itself stays a fault. Before this, 11 of 32 unchanged scene lines were WRONG
// as answers to their own question and 11 were „beyond“ („Danke! Wann ist die Pause?“, „Guten Tag. Ich heiße Ana
// Chakiri.“, „Ich habe Durst. Ich möchte einen Kaffee, bitte.“).

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cap = (s) => s.charAt(0).toLocaleUpperCase('de') + s.slice(1);
const bareEnd = (s) => s.replace(/[\s,;:–-]+$/u, '');

const GREETING = '(?:hallo|hi|hey|moin|servus|gr(?:ü|ue)(?:ß|ss)\\s+gott|(?:einen\\s+)?(?:schönen\\s+)?guten\\s+(?:morgen|tag|abend))';
const THANKS = '(?:danke(?:\\s+(?:schön|sehr))?|vielen\\s+dank|dankeschön)';
const SORRY = '(?:entschuldigung|entschuldige(?:n\\s+sie)?(?:\\s+bitte)?|verzeihung)';

/**
 * How the turn is spoken: 'Sie', 'du' or null. From what its cue and answers say („Möchten Sie …?“, „dein Hobby“), and only
 * then from the partner's name: Paul is the waiter of Lektion 9 and is addressed with Sie.
 */
const registers = new WeakMap();
export function registerOf(turn) {
  if (!registers.has(turn)) registers.set(turn, findRegister(turn));
  return registers.get(turn);
}
function findRegister(turn) {
  const said = [turn.cue?.de, turn.taskDe && '', ...(turn.accepted || []).map((a) => (typeof a === 'string' ? a : a.frame))].join(' ');
  const formal = /\b(?:Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer)\b|\p{L}+en\s+Sie\b|\bsind\s+Sie\b|\bUnd\s+Sie\b/u.test(said);
  const informal = /\b(?:du|dich|dir|dein|deine|deinen|deinem|deiner)\b/iu.test(said);
  if (formal !== informal) return formal ? 'Sie' : 'du';
  if (formal) return null;
  return turn.partner ? (/^(?:Herr|Frau)\s/.test(turn.partner) ? 'Sie' : 'du') : null;
}

/** An answer in the other form of address („Das ist Ihr Geschenk, Lena.“, „…, und du, Herr Weber?“). */
export function addressFault(text, turn) {
  const how = registerOf(turn);
  if (how === 'Sie') return /\b(?:du|dich|dir|dein|deine|deinen|deinem|deiner)\b/iu.test(text);
  if (how === 'du') return /(?<=\p{L}[^.!?]*)\b(?:Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer)\b|\bund\s+Sie\b/u.test(text);
  return false;
}

/** The names an answer may call its partner by: „Herr Weber“, „Lena“. */
const namesOf = (turn) => (turn.partner ? [esc(turn.partner)] : []);

/** A whole segment that is courtesy only: „Danke!“, „Guten Tag, Frau Kaya.“, „Freut mich!“. */
export function courtesyOnly(segment, turn) {
  const name = namesOf(turn).join('|') || '(?!)';
  return new RegExp(`^\\s*(?:(?:${GREETING}|${THANKS}|${SORRY}|bitte(?:\\s+schön)?|freut\\s+mich(?:\\s+(?:sehr|auch))?|gern(?:e)?|sehr\\s+gern(?:e)?|${name})(?:[,\\s]+(?:${name}))?\\s*[,.!]*\\s*)+$`, 'iu').test(segment);
}

/** „Und Sie?“, „Und du?“, „Und Ihnen?“ after an answer to the partner's question, in the partner's own form of address. */
export function counterQuestion(segment, turn) {
  if (!/\?\s*$/.test(turn.cue?.de || '')) return false;
  const formal = registerOf(turn) === 'Sie';
  const how = /\bwie\s+geht\b/i.test(turn.cue.de);
  const who = how ? (formal ? '(?:ihnen|wie\\s+geht\\s+es\\s+ihnen)' : '(?:dir|wie\\s+geht\\s+es\\s+dir)') : (formal ? 'sie' : 'du');
  const name = namesOf(turn).join('|') || '(?!)';
  return new RegExp(`^\\s*und\\s+${who}(?:\\s+(?:denn|auch))?(?:[,\\s]+(?:${name}))?\\s*[?.!]*\\s*$`, 'iu').test(segment);
}

/** The answer without the courtesy before and after it. */
export function withoutCourtesy(text, turn) {
  const name = namesOf(turn).join('|') || '(?!)';
  const question = /\?\s*$/.test(String(typeof turn.accepted?.[0] === 'string' ? turn.accepted[0] : turn.accepted?.[0]?.frame || ''));
  const wants = turn.slot === 'thing' || /\b(?:möchte|nehme|brauche|hätte)\b/i.test(String(typeof turn.accepted?.[0] === 'string' ? turn.accepted[0] : turn.accepted?.[0]?.frame || ''));
  const out = new Set();
  const lead = new RegExp(`^(?:${GREETING}|${THANKS}|${SORRY}|freut\\s+mich|(?:du|sie),?\\s+(?:${name})|${name})(?:[,\\s]+(?:${name}))?(?:\\s*[,.!:–]+\\s*|\\s+)(?=\\p{L}|\\d)`, 'iu');
  // An opener with its comma: „Also, …“, „Ich glaube, …“, „Ja, …“ before a statement (never before a question, never a „nein“).
  const opener = question ? (registerOf(turn) === 'du' ? /^(?:also|moment|na\s+gut|sag\s+mal|du|ach|oh|übrigens|eine\s+frage)\s*[,:!]+\s*(?=\p{L}|\d)/iu : /^(?:also|moment|ach|oh|übrigens|eine\s+frage)\s*[,:!]+\s*(?=\p{L}|\d)/iu)
    : /^(?:ja|also|moment|na\s+ja|ach|oh|natürlich|ich\s+glaube|ich\s+denke|ich\s+finde)\s*[,!]+\s*(?=\p{L}|\d)/iu;
  let s = String(text).trim();
  const heads = [s];
  for (let i = 0; i < 3; i += 1) {
    const t0 = s.replace(lead, '');
    const t = t0 === s ? s.replace(opener, '') : t0;
    if (t === s) break;
    s = cap(t.trim());
    heads.push(s);
  }
  for (const h of heads) {
    out.add(h);
    const end = (h.match(/[.!?]+\s*$/) || [''])[0].trim();
    const tails = [
      new RegExp(`[,\\s]+(?:${name})(?=\\s*[.!?]*$)`, 'iu'),
      ...(question || wants ? [/[,\s]+bitte(?=\s*[.!?]*$)/iu] : []),
      new RegExp(`(?<=[.!?])\\s+${THANKS}(?:[,\\s]+(?:${name}))?\\s*[.!]*$`, 'iu'),
      ...(wants || /\bdanke\b/i.test(JSON.stringify(turn.accepted || [])) ? [new RegExp(`[,\\s]+${THANKS}\\s*[.!]*$`, 'iu')] : []),
      /[,.!\s]+freut\s+mich(?:\s+sehr)?\s*[.!]*$/iu,
    ];
    let t = h;
    for (let i = 0; i < 2; i += 1) {
      for (const re of tails) {
        const r = t.replace(re, '');
        if (r !== t && /\p{L}|\d/u.test(r)) { t = bareEnd(r); t = /[.!?]$/.test(t) ? t : `${t}${question ? '?' : end.replace(/[?]/g, '') || '.'}`; out.add(t); }
      }
    }
    const parts = h.match(/^(.*?)[,.!\s]+(und\s+(?:ihnen|sie|dir|du|wie\s+geht\s+es\s+(?:ihnen|dir))\b.*)$/iu);
    if (parts && counterQuestion(parts[2], turn)) out.add(/[.!?]$/.test(parts[1]) ? parts[1] : `${bareEnd(parts[1])}.`);
  }
  // „Und wann ist die Pause?“: a question asked on.
  for (const h of [...out]) if (question && /^[Uu]nd\s+\p{Ll}/u.test(h)) out.add(cap(h.replace(/^und\s+/iu, '')));
  out.delete(String(text).trim());
  return [...out];
}

const SMALL_IN_QUESTION = new Set(['denn', 'eigentlich', 'bitte', 'mal', 'auch', 'jetzt', 'heute', 'noch', 'vielleicht', 'gerade', 'genau', 'so', 'hier']);
const LAST_IN_QUESTION = new Set(['denn', 'eigentlich', 'hier', 'da', 'dort', 'jetzt', 'heute']);
const SMALL_IN_STATEMENT = new Set(['auch', 'jetzt', 'heute', 'noch', 'gerade', 'eigentlich', 'leider', 'natürlich', 'schon', 'immer', 'oft', 'meistens',
  'normalerweise', 'zurzeit', 'momentan', 'genau', 'doch', 'bitte', 'hier', 'ursprünglich', 'meist', 'dann', 'übrigens', 'wirklich']);
const PRONOUN = new Set(['ich', 'du', 'er', 'sie', 'es', 'wir', 'das']);
const plain = (w) => String(w || '').toLocaleLowerCase('de').replace(/[.,!?;:]+$/, '');

/**
 * The answer without one small word that stands where German puts it: right after the finite verb, after the pronoun
 * that follows it, or (a question) at the end. `isVerb` says whether a word is a finite verb the course says.
 */
export function withoutSmallWord(text, isVerb) {
  const end = (String(text).trim().match(/[.!?]+$/) || [''])[0];
  const w = String(text).trim().replace(/[.!?]+$/, '').split(/\s+/);
  const question = /\?/.test(end);
  const set = question ? SMALL_IN_QUESTION : SMALL_IN_STATEMENT;
  const out = [];
  for (let i = 2; i < w.length; i += 1) {
    const x = plain(w[i]);
    if (/,$/.test(w[i - 1]) || /,$/.test(w[i])) continue;
    const afterVerb = isVerb(w[i - 1]) || (PRONOUN.has(plain(w[i - 1])) && isVerb(w[i - 2]));
    const last = i === w.length - 1;
    // „Ich wohne hier in Bremen.“, never „Das ist hier Omar.“
    if (!question && x === 'hier' && !['in', 'im', 'bei', 'am', 'auf'].includes(plain(w[i + 1]))) continue;
    if ((set.has(x) && afterVerb && !(last && x === 'auch')) || (question && last && LAST_IN_QUESTION.has(x))) out.push(`${[...w.slice(0, i), ...w.slice(i + 1)].join(' ')}${end}`);
  }
  return out;
}

/** „Was kostet dieser Stuhl?“ is „Was kostet der Stuhl?“: „dieser“ declines as „der“ does. */
export function withoutDemonstrative(text) {
  const s = String(text).replace(/\b(D|d)ies(e[rsnm]?)(?=\s+\p{Lu})/gu, (m, d, e) => ({ er: `${d}er`, e: `${d}ie`, es: `${d}as`, en: `${d}en`, em: `${d}em` })[e] || m);
  return s === String(text) ? [] : [s];
}

const ASK_FORMAL = /^(?:k(?:ö|oe)nn(?:t)?en\s+sie\s+mir\s+(?:bitte\s+)?sagen|wissen\s+sie(?:\s+(?:vielleicht|denn))?|sagen\s+sie\s+mir(?:\s+bitte)?|bitte\s+sagen\s+sie\s+mir|darf\s+ich\s+(?:sie\s+)?fragen|ich\s+(?:möchte|würde\s+gern(?:e)?)\s+wissen)\s*,\s*/iu;
const ASK_INFORMAL = /^(?:k(?:ann|önn?te)st\s+du\s+mir\s+(?:bitte\s+)?sagen|weißt\s+du(?:\s+(?:vielleicht|denn))?|sag\s+mir(?:\s+bitte)?|darf\s+ich\s+(?:dich\s+)?fragen|ich\s+(?:möchte|würde\s+gern(?:e)?)\s+wissen)\s*,\s*/iu;
const W_PHRASE = /^(um\s+wie\s+viel\s+uhr|wie\s+viel\s+euro|wie\s+viel|wie\s+teuer|wie\s+spät|welche\s+farbe|welche\s+sprachen|was|wo|woher|wohin|wann|wie|wer)\s+/iu;
const PREFIX = /^(ab|auf|an|ein|mit|los|aus)(?=\p{L}{3,}$)/iu;

/** „Können Sie mir sagen, was der Stuhl kostet?“ is „Was kostet der Stuhl?“, in the partner's own form of address. */
export function withoutAsking(text, turn) {
  const s = String(text).trim();
  if (!/,/.test(s)) return [];
  const formal = registerOf(turn) === 'Sie';
  const rest = s.replace(formal ? ASK_FORMAL : ASK_INFORMAL, '');
  if (rest === s) return [];
  const body = rest.replace(/[.!?]+$/, '').trim();
  const ob = body.match(/^ob\s+(.+)$/iu);
  const wm = ob ? null : body.match(W_PHRASE);
  if (!ob && !wm) return [];
  const middle = (ob ? ob[1] : body.slice(wm[0].length)).split(/\s+/);
  const verb = middle.at(-1);
  if (!verb || middle.length < 2) return [];
  const out = [];
  const build = (v, after) => {
    const head = ob ? cap(v) : `${cap(wm[1])} ${v}`;
    out.push(`${[head, ...middle.slice(0, -1), ...(after ? [after] : [])].join(' ')}?`);
  };
  build(verb, null);
  const p = verb.match(PREFIX);
  if (p) build(verb.slice(p[1].length), p[1].toLocaleLowerCase('de'));
  return out;
}
