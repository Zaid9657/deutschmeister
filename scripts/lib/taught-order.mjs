import buildLesson from '../../src/lib/lesson/buildLesson.js';
import { ALPHABET } from '../../src/data/curricula/a11.sets.js';
import { germanNumberWord } from '../../src/lib/lesson/readaloud.js';

// Recognize language forms independently of the set being validated. Deleting a curriculum
// member must not delete the validator's knowledge that e.g. fünfzig is a number.
const fold = (text) => String(text).toLocaleLowerCase('de').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const numberWords = new Map(Array.from({ length: 101 }, (_, n) => [germanNumberWord(n), n]));
const time = `(?:\\d+(?::\\d+)?|ein|${Array.from({ length: 25 }, (_, n) => germanNumberWord(n)).join('|')})`;
const minute = `(?:\\d+|${Array.from({ length: 60 }, (_, n) => germanNumberWord(n)).join('|')})`;
const tokens = (text) => String(text || '').normalize('NFC').toLocaleLowerCase('de').match(/[\p{L}]+|\d+(?::\d+)?/gu) || [];
const strings = (item) => [item?.de, item?.taskDe, item?.sample, item?.questionDe, item?.promptDe, item?.text, item?.audioText, item?.answer, ...(item?.accepted || []), ...(item?.options || []), ...(item?.parts || []).flatMap((p) => p?.forms || [])].filter((s) => typeof s === 'string');

/** Language forms are recognized independently of FUNCTION_WORDS, meta rows, and test stimuli. */
export function prerequisiteForms(text, { spelling = false } = {}) {
  const out = new Set();
  const source = String(text || '').normalize('NFC');
  for (const word of tokens(source)) {
    const number = numberWords.get(fold(word));
    if (number !== undefined) out.add(number > 20 && number < 100 && number % 10 ? 'number:compounds' : `number:${number}`);
    // A phone sequence is digits, while dates and years are not a licence to teach numbers.
    if (/^0\d+$/.test(word)) for (const digit of word) out.add(`number:${digit}`);
    else if (/^\d+$/.test(word) && Number(word) <= 100) {
      const n = Number(word);
      out.add(n > 20 && n < 100 && n % 10 ? 'number:compounds' : `number:${n}`);
    }
  }
  if (spelling || /\b[bB]uchstabier|\p{L}(?:-\p{L}){2,}/u.test(source)) for (const m of ALPHABET.members) out.add(`letter:${m.written}`);
  for (const m of ALPHABET.members) if (new RegExp(`(?<!\\p{L})${m.said}(?!\\p{L})`, 'u').test(source)) out.add(`letter:${m.written}`);
  const plain = fold(source);
  if (new RegExp(`\\bum\\s+${time}\\b|\\b${time}\\s+Uhr\\b|\\d{1,2}:\\d{2}|wie spaet ist es`, 'iu').test(plain)) out.add('clock:full-hour');
  if (/\bhalb\s+(?:\p{L}+|\d+)/iu.test(source)) out.add('clock:half-hour');
  if (/\bViertel\s+(?:nach|vor)\b/iu.test(source)) out.add('clock:quarter-hour');
  if (new RegExp(`\\bUhr\\s+${minute}\\b`, 'iu').test(plain)) out.add('clock:official-minutes');
  return out;
}

export function setShapeFindings(lesson) {
  const out = [];
  const fail = (s) => out.push(`L${lesson.nr}: ${s}`);
  const sets = lesson.guided?.sets || [];
  if (!Array.isArray(sets)) return [`L${lesson.nr}: guided.sets must be an array`];
  const ids = new Set();
  for (const set of sets) {
    if (!set || !/^[a-z0-9-]+$/.test(set.id || '') || ids.has(set.id)) { fail('set needs a distinct stable id'); continue; }
    ids.add(set.id);
    if (!['letters', 'numbers', 'clock'].includes(set.kind) || !set.titleDe?.trim() || !set.titleEn?.trim()) fail(`set ${set.id} needs kind and bilingual titles`);
    const members = set.members;
    if (!Array.isArray(members) || members.length < 2 || members.some((m) => !m?.written?.trim() || !m?.said?.trim() || (!!m.noteDe !== !!m.noteEn)) || new Set(members.map((m) => m?.written)).size !== members.length) fail(`set ${set.id} needs distinct written/spoken members and bilingual notes`);
    if (set.kind === 'numbers' && Array.isArray(members)) for (const m of [...members, ...(set.rule?.examples || []), ...(set.rule?.transfer || [])]) {
      if (!/^\d+$/.test(m?.written || '') || germanNumberWord(Number(m.written)) !== fold(m?.said || '')) fail(`set ${set.id} has an incorrect number mapping`);
    }
    for (const pair of set.contrasts || []) if (!Array.isArray(pair) || pair.length !== 2 || pair[0] === pair[1] || pair.some((s) => !members?.some((m) => m?.written === s))) fail(`set ${set.id} has an invalid contrast`);
    if (set.rule && (!set.rule.de?.trim() || !set.rule.en?.trim())) fail(`set ${set.id} needs a bilingual rule`);
  }
  for (const w of lesson.wortfeld || []) if (w.meta === true && (!w.set || !sets.some((s) => s?.id === w.set))) fail(`meta heading ${w.de} must reference a delivered set`);
  return out;
}

function checkedItems(stage) {
  if (stage.kind === 'scene') return stage.chunks.map((c) => ({ id: c.meaning.id, texts: [...c.lines.map((l) => l.de), ...strings(c.meaning), c.say.de], spelling: ['surname', 'first'].includes(c.say.ownName) }));
  if (stage.kind === 'read') return stage.items.map((i) => ({ id: i.id, texts: [stage.text, ...strings(i)] }));
  if (stage.kind === 'proof') return stage.tasks.map((i) => ({ id: i.id, texts: strings(i), spelling: i.listenSpelling || ['surname', 'first'].includes(i.ownName) }));
  if (['sound', 'practice', 'derived', 'dictation'].includes(stage.kind)) return (stage.items || stage.lines || []).map((i, n) => ({ id: i.id || `${stage.key}-${n}`, texts: strings(i) }));
  if (stage.kind === 'writing') return [{ id: stage.key, texts: strings(stage.schreiben), }];
  return [];
}

/** RULE 36: a taught event must precede retrieval in the actual built order, for every draw. */
export function taughtOrderFindings(curriculum, pool, { attempts = [1, 2, 3] } = {}) {
  const findings = [];
  for (const lesson of curriculum.lektionen || []) if (lesson.flow === 'guided') findings.push(...setShapeFindings(lesson));
  if (findings.length && (curriculum.lektionen || []).some((l) => l.flow === 'guided' && setShapeFindings(l).some((s) => /set needs|members|contrast|guided.sets/.test(s)))) return findings;
  for (const attempt of attempts) {
    const taught = new Set();
    const delivered = new Set();
    for (const lesson of curriculum.lektionen || []) {
      if (lesson.flow !== 'guided') continue;
      let built;
      try { built = buildLesson({ curriculum, lektion: lesson, pool, attempt }); }
      catch { findings.push(`L${lesson.nr}: draw ${attempt}: cannot build prerequisite order`); continue; }
      for (const stage of built.stages) {
        if (stage.kind === 'taught-set') {
          // Only what is actually delivered counts. A heading or notice name does not teach letters.
          const members = stage.steps.filter((s) => s.kind === 'member').map((s) => s.member);
          for (const m of members) {
            if (stage.set.kind === 'letters') taught.add(`letter:${m.written}`);
            if (stage.set.kind === 'numbers') taught.add(`number:${m.written}`);
          }
          if (stage.set.kind === 'clock' && stage.set.rule?.id === 'full-hour') taught.add('clock:full-hour');
          if (stage.set.rule?.id === 'unit-before-ten' && stage.steps.some((s) => s.rule?.de && s.rule?.en)) taught.add('number:compounds');
          delivered.add(stage.set.id);
          continue;
        }
        if (stage.kind === 'notice') {
          const text = `${stage.notice?.bodyDe || ''} ${stage.notice?.bodyEn || ''}`;
          const plain = text.replace(/\*/g, '');
          if (/Uhrzeit mit um:\s*um\s+\p{L}+\s+Uhr/u.test(plain) || /clock time takes um/i.test(plain)) taught.add('clock:full-hour');
          if (/halb/.test(text) && /(?:=\s*\d|half.*(?:before|hour)|not 9\.30)/i.test(text)) taught.add('clock:half-hour');
          if (/Viertel nach/.test(text) && /Viertel vor/.test(text) && /\d{1,2}[.:](?:15|45)/.test(text)) taught.add('clock:quarter-hour');
          if (/Stunde \+ Uhr \+ Minuten/.test(text)) taught.add('clock:official-minutes');
        }
        for (const item of checkedItems(stage)) {
          const required = prerequisiteForms(item.texts.join(' '), item);
          const missing = [...required].filter((f) => !taught.has(f));
          for (const heading of lesson.wortfeld.filter((w) => w.meta && w.set)) {
            const set = lesson.guided.sets?.find((s) => s.id === heading.set);
            if (set?.members.some((m) => required.has(`number:${m.written}`) || required.has(`letter:${m.written}`)) && !delivered.has(heading.set)) missing.push(`set:${heading.set}`);
          }
          if (missing.length) findings.push(`L${lesson.nr}: draw ${attempt}: ${stage.kind} ${item.id} before teaching ${[...new Set(missing)].join(', ')}`);
        }
      }
    }
  }
  return findings;
}
