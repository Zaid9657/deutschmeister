// Export prompt-only batches (no keys/explanations) for the blind corpus, from <repo> and the served tiles of <repo> and <baseline>.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [repo, baseline, outDir] = process.argv.slice(2);
const imp = (root, p) => import(pathToFileURL(`${root}/${p}`).href);
const { isTypedItem } = await imp(repo, 'src/lib/lesson/buildLesson.js');
const rows = [];
for (const lv of ['a11', 'a12']) {
  const items = JSON.parse(readFileSync(`${repo}/src/data/lessonPools/${lv}.json`, 'utf8')).items.filter((i) => i.minLektion != null);
  for (const it of items) {
    if (lv === 'a12' && !['sentence_building', 'error_correction'].includes(it.type)) continue;
    rows.push({ group: `${lv}-${it.type === 'fill_blank' && isTypedItem(it) ? 'gap' : isTypedItem(it) ? 'build' : 'choice'}`,
      row: { id: it.id, kind: isTypedItem(it) ? 'typed' : 'choice', type: it.type, lektion: it.minLektion, promptDe: it.questionDe,
        ...(it.questionEn && it.questionEn !== it.questionDe ? { promptEn: it.questionEn } : {}), ...(isTypedItem(it) ? {} : { options: it.options }) } });
  }
}
const seen = new Map();
for (const root of [repo, baseline]) {
  const { derivedItems, ATTEMPT_CYCLE } = await imp(root, 'src/lib/lesson/buildLesson.js');
  const { CURRICULA } = await imp(root, 'src/data/curricula/index.js');
  for (const c of Object.values(CURRICULA)) for (const l of c.lektionen) for (let a = 1; a <= ATTEMPT_CYCLE; a += 1) {
    for (const it of derivedItems(l, a).filter((x) => x.type === 'word_order')) {
      const key = [...it.tokens].sort().join('|');
      if (!seen.has(key)) seen.set(key, { id: `tile-${seen.size + 1}`, kind: 'tiles', lektion: l.nr, level: c.level, tiles: it.tokens, _answer: it.answer });
    }
  }
}
for (const t of seen.values()) { const { _answer, ...row } = t; rows.push({ group: 'tiles', row }); }
const groups = {};
for (const { group, row } of rows) (groups[group] ||= []).push(row);
const batches = [];
for (const [g, list] of Object.entries(groups)) {
  const size = g.endsWith('gap') ? 90 : 65;
  for (let i = 0; i < list.length; i += size) batches.push([`${g}-${i / size + 1}`, list.slice(i, i + size)]);
}
for (const [name, list] of batches) { mkdirSync(`${outDir}/${name}`, { recursive: true }); writeFileSync(`${outDir}/${name}/items.jsonl`, list.map((r) => JSON.stringify(r)).join('\n') + '\n'); console.log(name, list.length); }
writeFileSync(`${outDir}/tile-answers.json`, JSON.stringify(Object.fromEntries([...seen.values()].map((t) => [t.id, t._answer])), null, 1));