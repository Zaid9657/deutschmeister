// Before/after measurement of the October 2026 finding classes (re-land 2026-11-19). Read-only.
// node docs/course-factory/live-fixes/measure-reland.mjs <repo root>  — see RELAND-2026-11-19.md
// Before/after measurement of the October finding classes on any checkout: node measure.mjs <repo>
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const repo = process.argv[2];
const imp = (p) => import(pathToFileURL(`${repo}/${p}`).href);
const read = (p) => (existsSync(`${repo}/${p}`) ? readFileSync(`${repo}/${p}`, 'utf8') : '');
const { checkAnswer, checkOptionsFor } = await imp('src/lib/lesson/check.js');
const { derivedItems, ATTEMPT_CYCLE } = await imp('src/lib/lesson/buildLesson.js');
const { CURRICULA } = await imp('src/data/curricula/index.js');
const { buildCheckpoint, paperSeed } = await imp('src/lib/checkpoint/buildCheckpoint.js');
const out = {};
const pools = Object.fromEntries(['a11', 'a12'].map((lv) => [lv, JSON.parse(read(`src/data/lessonPools/${lv}.json`))]));
const servable = (lv) => pools[lv].items.filter((i) => i.minLektion != null);
const grade = (item, a) => checkAnswer(a, item.accepted?.length ? item.accepted : [item.answer], checkOptionsFor(item)).result;
const byId = (id) => [...servable('a11'), ...servable('a12')].find((i) => i.id === id);

// 1 opening cues: servable statement/question sentence-building tasks with no named opening
const opening = /\(Beginnen Sie mit „([^“]+)“/;
for (const lv of ['a11', 'a12']) {
  const sb = servable(lv).filter((i) => i.type === 'sentence_building' && !/\b(?:Imperativ|Bitte)\b/i.test(i.questionDe));
  out[`opening cue missing ${lv}`] = `${sb.filter((i) => !opening.test(i.questionDe)).length}/${sb.length}`;
}
// fronted-object probes (correct German when no opening is named)
const probes = [
  ['extra-a11-l02-07', 'Lehrer bin ich von Beruf.'],
  ['extra-a11-l10-12', 'Kommt der Bus zu dem Bahnhof?'],
  ['extra-a11-l08-17', 'Ich bin am Freitag bei dem Arzt.'],
  ['extra-a12-l01-05', 'Wie komme ich zu dem Rathaus?'],
  ['extra-a12-l05-07', 'Wann kommt der Bus zu dem Konzert?'],
  ['dd1c3d60-8ae7-4c94-8990-19633dcba36f', 'Es'],
  ['extra-a11-l05-23', 'Die Schlüssel sind gelb.'],
];
for (const [id, a] of probes) { const it = byId(id); out[`probe ${id} «${a}»`] = it ? `${grade(it, a)} | prompt: ${it.questionDe.slice(0, 80)}` : 'missing'; }
// 2 generic repair prompts that do not name what to repair
for (const lv of ['a11', 'a12']) {
  const ec = servable(lv).filter((i) => i.type === 'error_correction');
  out[`unnamed repair prompt ${lv}`] = `${ec.filter((i) => /^Korrigieren Sie(?: nur den Fehler)?(?: in der Frage)?:/.test(i.questionDe) && !/\((?:Artikel|Verb|Endung|Possessivartikel|Wort |Infinitiv)/.test(i.questionDe)).length}/${ec.length}`;
}
// 3 tiles: dialogue-line tiles served, and the October probe alternatives
let tiles = 0; const tileLines = [];
for (const c of Object.values(CURRICULA)) for (const l of c.lektionen) for (let a = 1; a <= ATTEMPT_CYCLE; a += 1) {
  for (const it of derivedItems(l, a).filter((x) => x.type === 'word_order')) { tiles += 1; tileLines.push(`${c.level} L${l.nr}/${a}: ${it.answer} (accepted ${it.accepted.length})`); }
}
out['tile tasks served (all levels, 3 attempts)'] = tiles;
out['tile prompt'] = (() => { const l = CURRICULA['a1.1'].lektionen[1]; const it = derivedItems(l, 1).find((x) => x.type === 'word_order'); return it ? it.promptDe : 'none'; })();
for (const [line, alt] of [['Ich bin Studentin.', 'Studentin bin ich.'], ['Kaufst du morgen ein?', 'Morgen kaufst du ein?']]) {
  const it = derivedItems({ id: 'probe', dialog: { lines: [{ de: line }] }, wortfeld: [] }).find((x) => x.type === 'word_order');
  out[`tile probe «${line}» → «${alt}»`] = it ? grade(it, alt) : 'no tile task';
}
// 4 checkpoint Lesen: declared strategies per paper (A1.1), rounds 0-3
const NUM = /\b(\d+|null|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwanzig|dreißig|vierzig|fünfzig|hundert|\w+zehn|\w+zig)\b/i;
const NEG = /\b(nicht|kein\w*|nie)\b/i;
for (const level of ['a1.1', 'a1.2']) {
  const c = CURRICULA[level]; const pool = pools[level === 'a1.1' ? 'a11' : 'a12'];
  const papers = []; let hoerenOverlap = 0; let lesenFromDialog = 0; let lesenTotal = 0;
  for (const cp of c.checkpoints) for (let r = 0; r < 4; r += 1) {
    const items = buildCheckpoint({ curriculum: c, checkpoint: cp, pool, seed: paperSeed(cp, r) });
    const lesen = items.filter((i) => i.section === 'lesen');
    papers.push(lesen);
    const words = items.filter((i) => i.section === 'hoeren' && i.kind === 'wordChoice').map((i) => new Set(i.options));
    if (words.length === 2 && [...words[0]].some((o) => words[1].has(o))) hoerenOverlap += 1;
    const dialog = new Set(c.lektionen.flatMap((l) => (l.dialog?.lines || []).map((x) => x.de)));
    for (const it of lesen) { lesenTotal += 1; if ((it.text || '').split(/(?<=[.!?])\s+|: /).some((s) => dialog.has(s.replace(/^\w+: /, '')))) lesenFromDialog += 1; }
  }
  const tf = papers.map((p) => p.filter((i) => i.kind === 'trueFalse' || (i.options || []).join() === 'Richtig,Falsch'));
  const strat = (name, pred) => {
    const scores = tf.filter((p) => p.length).map((p) => p.filter((i) => pred(i) === i.answer).length);
    out[`${level} Lesen «${name}» per-paper max / bank`] = scores.length ? `${Math.max(...scores)}/4 max; ${scores.filter((x) => x >= 3).length}/${scores.length} papers ≥3; ${scores.reduce((a, b) => a + b, 0)}/${scores.length * 4}` : 'no Richtig/Falsch items';
  };
  const st = (i) => i.statement || (i.promptDe.match(/„([^“]+)“/) || [])[1] || '';
  strat('number → Falsch', (i) => (NUM.test(st(i)) ? 'Falsch' : 'Richtig'));
  strat('negation → Falsch', (i) => (NEG.test(st(i)) ? 'Falsch' : 'Richtig'));
  strat('all statement words in text → Richtig', (i) => (st(i).toLowerCase().replace(/[^\p{L}\s]/gu, '').split(/\s+/).every((w) => (i.text || '').toLowerCase().includes(w)) ? 'Richtig' : 'Falsch'));
  out[`${level} Lesen kinds`] = [...new Set(papers.flat().map((i) => i.kind))].join(',');
  out[`${level} Lesen texts reusing a dialogue sentence`] = `${lesenFromDialog}/${lesenTotal}`;
  out[`${level} Hören papers with overlapping word options`] = `${hoerenOverlap}/${papers.length}`;
}
// 5 claims and notices (source text sweeps)
const sweep = (files, re) => files.reduce((n, f) => n + (read(f).match(re) || []).length, 0);
const surfaces = ['src/data/courseTests/abschlusstestA11.js', 'src/data/courseTests/abschlusstestA12.js', 'src/lib/lesson/strings.js', 'src/data/curricula/a11.meta.js', 'src/pages/CurriculumHomePage.jsx', 'src/pages/CourseHomePage.jsx', 'src/pages/CourseCompletePage.jsx', 'src/pages/CourseCertificatePage.jsx', 'src/pages/Modelltest/ModelltestHub.jsx', 'src/pages/Modelltest/ModelltestOverview.jsx', 'src/pages/Modelltest/ModelltestResult.jsx', 'src/data/offers.js', 'astro-site/src/pages/courses/[level].astro', 'astro-site/src/pages/courses/index.astro', 'astro-site/src/components/linie/Proof.astro', 'astro-site/src/components/linie/Progression.astro'];
out['exam-format overclaims on course surfaces'] = sweep(surfaces, /Start-Deutsch-1-Format|im Format Ihrer Prüfung|in the format of your exam|Aufbau der (?:echten )?Prüfung|halbe Länge|half (?:the )?exam length|exam'?s? pass line|Final test in the|in the \$\{[^}]+\} format|Übungstest im Format|im \S+-Format|Prüfungskriterien|exam criteria/g);
out['du-forms in A1.2 final test'] = (read('src/data/courseTests/abschlusstestA12.js').match(/\b(du|dein\w*|dich|dir|Lies|Schreib|Nenne|nutze|trainierst)\b/g) || []).length;
const a11 = CURRICULA['a1.1']; const a12 = CURRICULA['a1.2'];
const notice = (l) => JSON.stringify(l.notice || {});
out['A1.1 L7 German notice names du tanzt'] = /tanzt/.test(JSON.stringify(a11.lektionen[6].notice?.body ?? a11.lektionen[6].notice?.de ?? notice(a11.lektionen[6])).replace(/"en[^"]*":"[^"]*"/g, ''));
out['absolute pronoun claim „Der Artikel entscheidet, nicht die Person.“'] = sweep(['src/data/curricula/a11.js', 'scripts/rule-card-overrides.mjs'], /Der Artikel entscheidet, nicht die Person\./g);
out['wrong numeral stress ein-und-ZWAN-zig'] = sweep(['src/data/curricula/a11.js', 'src/data/curricula/a12.js'], /ein-und-ZWAN-zig/g);
out['informal runner „beantworte die Fragen“'] = sweep(['src/pages/Modelltest/ModelltestRun.jsx'], /beantworte die Fragen/g);
const cards = read('scripts/rule-card-overrides.mjs');
out['card: du tanzt'] = /du tanzt/.test(cards);
out['card: valid „Sie kommen aus Österreich?“ listed as mistake'] = /wrong: 'Sie kommen aus Österreich\?'/.test(cards);
out['card: absolute „Das Pronomen fällt weg“'] = /Das Pronomen fällt weg[.;]/.test(cards);
out['A1.2 rooms line counts kitchen/bath as rooms'] = /Vier: Küche, Badezimmer/.test(JSON.stringify(a12.lektionen[1].dialog));
out['A1.2 L6 model'] = a12.lektionen[5].schreiben?.sample?.slice(0, 120);
out['A1.1 L2 can-do EN'] = JSON.stringify((await imp('src/data/curricula/a11.meta.js')).A11_META?.lektionIntro?.['a1.1-l02']?.canDoEn);
out['A1.1 checkpoint authored Lesen bank'] = a11.checkpoints.map((cp) => (cp.lesen ? 'yes' : 'no')).join(',');
for (const [k, v] of Object.entries(out)) console.log(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
if (process.argv[3] === '--tiles') console.log(tileLines.join('\n'));