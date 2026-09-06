import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
// Reproduce Postgres jsonb::text: object keys sorted by (length, bytes), ", " between members, ": " after keys, ", " between array items.
function pg(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return '[' + v.map(pg).join(', ') + ']';
  if (typeof v === 'object') {
    const keys = Object.keys(v).sort((a, b) => {
      const la = Buffer.byteLength(a), lb = Buffer.byteLength(b);
      if (la !== lb) return la - lb;
      return Buffer.compare(Buffer.from(a), Buffer.from(b));
    });
    return '{' + keys.map(k => JSON.stringify(k) + ': ' + pg(v[k])).join(', ') + '}';
  }
  return JSON.stringify(v);
}
const c = JSON.parse(readFileSync('grammar-content-cache.json', 'utf8'));
const idSet = new Set(JSON.parse(readFileSync(process.argv[2], 'utf8')));
const byId = xs => [...xs].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const md5 = s => createHash('md5').update(s).digest('hex');
const ex = byId(c.exercises.filter(x => idSet.has(x.id)));
const ru = byId(c.rules.filter(x => idSet.has(x.id)));
const em = byId(c.examples.filter(x => idSet.has(x.id)));
console.log('n', ex.length, ru.length, em.length);
console.log('exercises_md5', md5(ex.map(x => x.id + '|' + x.question_de + '|' + x.correct_answer + '|' + (x.acceptable_answers == null ? '' : pg(x.acceptable_answers)) + '|' + (x.options == null ? '' : pg(x.options))).join('')));
console.log('rules_md5', md5(ru.map(r => r.id + '|' + r.title_en + '|' + pg(r.content) + '|' + (r.common_mistakes == null ? '' : pg(r.common_mistakes))).join('')));
console.log('examples_md5', md5(em.map(e => e.id + '|' + e.sentence_de + '|' + pg(e.word_breakdown)).join('')));
