// node export-slips.mjs <repo> <outDir> — prompt-only batch for the slip rules (transposed letters,
// a letter missing from a short word, Arabic-Indic digits). Typed pool items, dictated lines and
// corrections from A1.1 and A1.2; no key, no explanation leaves the repo.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [repo, outDir] = process.argv.slice(2);
const imp = (p) => import(pathToFileURL(`${repo}/${p}`).href);
const { isTypedItem } = await imp('src/lib/lesson/buildLesson.js');
const { CURRICULA } = await imp('src/data/curricula/index.js');
const FUNCTION = /^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|kein|keine|ich|du|er|sie|es|wir|ihr|bin|bist|ist|sind|seid|habe|hast|hat|haben|habt|in|im|an|am|zu|zum|zur|von|vom|bei|mit|aus|auf|und|oder|nicht)$/i;
const NUMBER = /\d|null|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwanzig|dreißig|hundert/i;
const pick = (list, n, step = Math.max(1, Math.floor(list.length / n))) => list.filter((_, i) => i % step === 0).slice(0, n);
const rows = [];
for (const lv of ['a11', 'a12']) {
  const items = JSON.parse(readFileSync(`${repo}/src/data/lessonPools/${lv}.json`, 'utf8')).items
    .filter((i) => i.minLektion != null && isTypedItem(i)).sort((a, b) => a.id.localeCompare(b.id));
  const word = items.filter((i) => i.type === 'fill_blank' && !/\s/.test(i.answer.trim()) && !FUNCTION.test(i.answer.trim()) && !NUMBER.test(i.answer));
  const short = word.filter((i) => i.answer.replace(/[^\p{L}]/gu, '').length <= 4);
  const long = word.filter((i) => i.answer.replace(/[^\p{L}]/gu, '').length >= 5);
  const numbers = items.filter((i) => NUMBER.test(i.answer));
  const build = items.filter((i) => i.type === 'sentence_building');
  const fix = items.filter((i) => i.type === 'error_correction');
  for (const it of [...pick(short, 8), ...pick(long, 8), ...pick(numbers, 6), ...pick(build, 5), ...pick(fix, 4)]) {
    rows.push({ id: it.id, kind: it.type === 'error_correction' ? 'correction' : 'typed', type: it.type, lektion: it.minLektion, promptDe: it.questionDe,
      ...(it.questionEn && it.questionEn !== it.questionDe ? { promptEn: it.questionEn } : {}) });
  }
}
const heard = [];
for (const c of Object.values(CURRICULA)) for (const l of c.lektionen) {
  for (const i of l.hoeren?.kind === 'dictation' ? l.hoeren.lines || [] : []) {
    const de = l.dialog?.lines?.[i]?.de;
    if (de) heard.push({ id: `dictation-${c.level}-l${String(l.nr).padStart(2, '0')}-${i}`, kind: 'dictation', lektion: l.nr, level: c.level, heardDe: de });
  }
}
rows.push(...pick(heard.filter((h) => NUMBER.test(h.heardDe)), 6), ...pick(heard.filter((h) => !NUMBER.test(h.heardDe)), 4));
mkdirSync(`${outDir}/slips-1`, { recursive: true });
writeFileSync(`${outDir}/slips-1/items.jsonl`, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
console.log('slips-1', rows.length, rows.reduce((m, r) => ({ ...m, [r.kind]: (m[r.kind] || 0) + 1 }), {}));
