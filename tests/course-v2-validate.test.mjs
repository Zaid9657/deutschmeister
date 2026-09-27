// Course v2 validator (E0-2): every rule gets one passing and one failing fixture.
//
// The passing fixture is the SCHEMA §15 worked unit (A2.1 U7 + its ta2 lane pack), read straight
// from docs/course-v2/SCHEMA.md, or the §15.7 choice fixtures (tb1.lv3, gb2.l2); the failing
// fixture is the same document with ONE change. Level-scope rules (COV-1/4/5) run on a synthetic
// twelve-unit A2.1 level against the real ga2 lane registry. The last blocks pin the §15.6
// expectations, the detectors' own examples, the KEY-01 key matrix, the stage gates and the CLI.
//
//   node --test tests/course-v2-validate.test.mjs

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, copyFileSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { exampleContext, choiceContext } from './fixtures/course-v2/schema-example.mjs';
import { runRules, loadRules, RULE_ORDER, normalizeStage, stageOfDoc } from '../scripts/course-v2/lib-validate/runner.mjs';
import { emptyContext, ingest, addDoc, levelSlot } from '../scripts/course-v2/lib-validate/context.mjs';
import { detectInText, detectorProblem, buildLexEnv, EMPTY_ENV, stemVowelChanged } from '../scripts/course-v2/lib-validate/detectors.mjs';
import { BANK_KEY_RE, SCHEMA_PATTERNS } from '../scripts/course-v2/lib-validate/ids.mjs';
import { coverage } from '../scripts/course-v2/rules/LEX-01.mjs';
import { entryForms, knownForms, licensedForms, umlaut } from '../scripts/course-v2/lib-validate/lexicon.mjs';
import { CORE_SIZE, CORE_LEMMAS, CORE_ENTRIES, NUMBER_WORDS } from '../scripts/course-v2/lib-validate/core-lexicon.mjs';
import { strongPraet } from '../scripts/course-v2/lib-validate/strong-verbs.mjs';
import { check } from '../scripts/course-v2/lib/schema.mjs';
import '../scripts/course-v2/lib/schemas/index.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const VALIDATE = join(REPO, 'scripts', 'course-v2', 'validate.mjs');
const DETECTORS = join(REPO, 'content', 'course-v2', 'registries', 'detectors.json');
const FIXTURE = join(REPO, 'content', 'course-v2', 'fixtures', 'a2.1-u07.json');

const RULES = await loadRules();

/** Run one rule on a bundle {ctx, docs, levels}; returns that rule's result row. */
async function rule(id, bundle, { mode = 'file', stage = null } = {}) {
  const rep = await runRules({ ctx: bundle.ctx, docs: bundle.docs, levels: bundle.levels || [], mode, label: 'test', notes: [] }, { rules: RULES, only: [id], stage });
  const r = rep.results.find((x) => x.id === id);
  assert.ok(r, `rule ${id} did not run`);
  return r;
}
const n = (r, sev) => r.findings.filter((f) => f.severity === sev).length;
const messages = (r) => r.findings.map((f) => `${f.severity}: ${f.path} ${f.message}`).join('\n');

function assertPass(r) {
  assert.notEqual(r.status, 'skip', `${r.id} skipped: ${r.reason}`);
  assert.equal(n(r, 'blocker'), 0, `${r.id} should have no blocker:\n${messages(r)}`);
}
function assertFail(r, re = null) {
  assert.equal(r.status, 'fail', `${r.id} should fail:\n${messages(r)}`);
  if (re) assert.ok(r.findings.some((f) => f.severity === 'blocker' && re.test(`${f.path} ${f.message}`)), `${r.id}: no blocker matching ${re}:\n${messages(r)}`);
}

const ex = (mutate, opts) => exampleContext(mutate, opts);
const step = (parts, k) => parts.unit.steps[k];

// ── the rule set itself ─────────────────────────────────────────────────────────────────────

describe('rule modules', () => {
  test('every rule file exports id, title, type, scope, stage and run; ids follow the report order', () => {
    assert.ok(RULES.length >= 39);
    for (const r of RULES) {
      assert.match(r.id, /^[A-Z]{2,3}-\d{1,2}$/);
      assert.equal(typeof r.run, 'function');
      assert.ok(['hard', 'ratchet', 'advisory', 'mixed'].includes(r.type), `${r.id} type ${r.type}`);
      assert.ok(['unit', 'level'].includes(r.scope), `${r.id} scope ${r.scope}`);
      assert.ok(['spec', 'S', 'I', 'T'].includes(r.stage), `${r.id} stage ${r.stage}`);
      assert.ok(RULE_ORDER.includes(r.id), `${r.id} missing from RULE_ORDER`);
    }
  });
  test('the rules the task names all exist', () => {
    const want = ['REF-01', 'ID-01', 'KEY-01', 'GRM-01', 'GRM-04', 'TXT-03', 'TXT-04', 'CON-06', 'COV-1',
      'EXM-01', 'EXM-02', 'EXM-03', 'EXM-04', ...Array.from({ length: 11 }, (_, i) => `ITM-${String(i + 1).padStart(2, '0')}`)];
    const have = new Set(RULES.map((r) => r.id));
    for (const id of want) assert.ok(have.has(id), id);
  });
});

// ── references and ids ──────────────────────────────────────────────────────────────────────

describe('REF-01 references resolve', () => {
  test('pass: the §15 example (registries, extras, stubs)', async () => assertPass(await rule('REF-01', ex())));
  test('fail: an unknown can-do', async () => assertFail(await rule('REF-01', ex((p) => { p.unit.spec.canDos[0] = 'cd.a2.gibt-es-nicht'; })), /cd\.a2\.gibt-es-nicht/));
  test('fail: a speaker extra not declared in the file', async () => assertFail(await rule('REF-01', ex((p) => { delete p.unit.extras['x.herr-winter']; })), /x\.herr-winter/));
  test('fail: a block textRef that is not a text of its step', async () => assertFail(await rule('REF-01', ex((p) => { step(p, 3).blocks[0].textRefs.push('a2.1-u07-ls4-t9'); })), /t9/));
  test('pass: the §15.7 choice fixtures', async () => assertPass(await rule('REF-01', choiceContext())));
});

describe('ID-01 ids', () => {
  test('pass: the §15 example', async () => assertPass(await rule('ID-01', ex())));
  test('fail: a duplicate item id', async () => assertFail(await rule('ID-01', ex((p) => { step(p, 0).pool.items[1].id = step(p, 0).pool.items[0].id; })), /duplicate id/));
  test('fail: a reserve item carrying a pool (p) id', async () => assertFail(await rule('ID-01', ex((p) => { step(p, 0).reserve[0].id = 'a2.1-u07-ls1-p99'; })), /well-placed item in reserve/));
  test('fail: an exam text id outside STEP(-LANE)-tN', async () => assertFail(await rule('ID-01', ex((p) => { step(p, 3).texts[0].id = 'a2.1-u07-ls4-text1'; }))));
  test('fail: an extra that is not x.<slug>', async () => assertFail(await rule('ID-01', ex((p) => { p.unit.extras.Winter = p.unit.extras['x.herr-winter']; })), /x\.<slug>/));
  test('pass: the choice fixtures (texts t1…t12, block ids end in the Teil)', async () => assertPass(await rule('ID-01', choiceContext())));
});

describe('KEY-01 bank keys', () => {
  test('pass: the §15 example', async () => assertPass(await rule('KEY-01', ex())));
  test('fail: a speaking key naming another unit', async () => assertFail(await rule('KEY-01', ex((p) => { step(p, 4).task.bankKey = 'a21-u08-s'; }))));
  test('fail: a malformed key', async () => assertFail(await rule('KEY-01', ex((p) => { step(p, 5).task.bankKey = 'a2.1-u07-w'; }))));
  test('BANK_KEY_RE matrix: 8 prefixes × slots × kinds × lanes', () => {
    const prefixes = ['a11', 'a12', 'a21', 'a22', 'b11', 'b12', 'b21', 'b22'];
    const slots = [...Array.from({ length: 12 }, (_, i) => `u${String(i + 1).padStart(2, '0')}`), 'p1', 'p2', 'p3', 'ht', 'dx', 'ma', 'mb', 'mc'];
    const kinds = ['w', 's', 'mo1', 'mo8', 'w1', 's3'];
    const lanes = ['', '-sd1', '-ga2', '-tb1', '-tb2'];
    let count = 0;
    for (const p of prefixes) for (const s of slots) for (const k of kinds) for (const l of lanes) {
      assert.match(`${p}-${s}-${k}${l}`, BANK_KEY_RE);
      count += 1;
    }
    assert.equal(count, 8 * 20 * 6 * 5);
    for (const bad of ['a13-u01-w', 'a21-u13-w', 'a21-u00-s', 'a21-p4-w', 'a21-u07-mo9', 'a21-u07-x', 'a21-u07-w-xx1', 'a2.1-u07-w', 'A21-u07-w', 'a21-u07-mo0']) {
      assert.doesNotMatch(bad, BANK_KEY_RE, bad);
    }
  });
  test('SCHEMA §2 patterns: reserve items, step-level texts, TEXT-lNN lines, assets', () => {
    assert.match('a2.1-u07-ls1-r02', SCHEMA_PATTERNS.item);
    assert.match('a2.1-u07-ls4-ga2-h1-02', SCHEMA_PATTERNS.item);
    assert.match('a2.1-u07-ls4-t1', SCHEMA_PATTERNS.text);
    assert.match('a2.1-u07-ls4-ta2-t1', SCHEMA_PATTERNS.text);
    assert.match('a2.1-mb-ga2-t3', SCHEMA_PATTERNS.text);
    assert.match('a2.1-u07-ls4-t1-l01', SCHEMA_PATTERNS.line);
    assert.match('a2.1-u07-a01', SCHEMA_PATTERNS.asset);
    assert.doesNotMatch('a2.1-u07-ls1-y01', SCHEMA_PATTERNS.item);
    assert.doesNotMatch('a2.1-u07-ls9-t1', SCHEMA_PATTERNS.text);
  });
});

// ── alignment ───────────────────────────────────────────────────────────────────────────────

describe('ALL-02 can-dos and proofs', () => {
  test('pass', async () => assertPass(await rule('ALL-02', ex())));
  test('fail: two can-dos', async () => assertFail(await rule('ALL-02', ex((p) => { p.unit.spec.canDos = p.unit.spec.canDos.slice(0, 2); }))));
});

describe('ALL-03 Lehrwerk placements', () => {
  test('pass: four placements', async () => assertPass(await rule('ALL-03', ex())));
  test('fail: one verified placement, the other unverified, no deviation', async () => assertFail(await rule('ALL-03', ex((p) => {
    p.unit.spec.lehrwerk = ['M A2 L9 Arbeitsleben', 'S3 L4 Telefon (unverified)'];
    p.unit.spec.deviation = null;
  })), /unverified/));
  test('pass: a logged deviation instead', async () => assertPass(await rule('ALL-03', ex((p) => { p.unit.spec.lehrwerk = []; p.unit.spec.deviation = { reason: 'Berufssituation ohne Lehrwerk-Parallele' }; }))));
});

// ── grammar ─────────────────────────────────────────────────────────────────────────────────

describe('GRM-01 new points per unit', () => {
  test('pass: one new point', async () => assertPass(await rule('GRM-01', ex())));
  test('fail: three new points', async () => assertFail(await rule('GRM-01', ex((p) => { p.unit.spec.grammar.new = ['g.reflexiv-akk', 'g.wenn', 'g.perfekt-haben']; }))));
});

describe('GRM-02 spine order', () => {
  test('pass', async () => assertPass(await rule('GRM-02', ex())));
  test('fail: a point declared before its registry position', async () => assertFail(await rule('GRM-02', ex((p) => {
    p.extraSpine.push({ id: 'g.praeteritum', label: 'Präteritum', intro: { receptive: 'a2.2-u05', productive: 'a2.2-u06' }, detectors: [], errorTags: [], lehrwerk: [], consensus: 'strong', ruleCards: [], inventory: [] });
    p.unit.spec.grammar.review.push('g.praeteritum');
  }))));
});

describe('GRM-04 grammar ceiling (detectors)', () => {
  const later = (p) => p.extraSpine.push({ id: 'g.praeteritum-vollverben', label: 'Präteritum', intro: { receptive: 'b1.1-u02', productive: 'b1.1-u03' }, detectors: ['det.praeteritum-vollverb'], errorTags: [], lehrwerk: [], consensus: 'strong', ruleCards: [], inventory: [] });
  test('pass: the example (reflexive licensed here, wenn/Perfekt earlier)', async () => assertPass(await rule('GRM-04', ex(later))));
  test('fail: a B1 construction (Präteritum of a full verb) in an A2.1 input line', async () => assertFail(await rule('GRM-04', ex((p) => {
    later(p);
    step(p, 0).input.lines[0].de = 'Gestern ging Priya früh nach Hause.';
  })), /praeteritum/i));
  test('stage S judges texts only: a later construction in a pool answer is not reported', async () => {
    const b = ex((p) => {
      later(p);
      p.unit.stage = 'S';
      step(p, 0).pool.items[0].answer = 'Sie ging nach Hause.';
      step(p, 0).pool.items[0].accepted = ['Sie ging nach Hause.'];
    });
    assertPass(await rule('GRM-04', b));
    assertFail(await rule('GRM-04', b, { stage: 'T' }));
  });
});

describe('GRM-05 rule cards', () => {
  test('pass (the English-twin advisory aside)', async () => assertPass(await rule('GRM-05', ex())));
  test('fail: a card over the A2 word limit', async () => assertFail(await rule('GRM-05', ex((p) => { p.ruleCard.de = `${p.ruleCard.de} ${'Das Pronomen steht hier. '.repeat(20)}`; }))));
});

// ── lexicon ─────────────────────────────────────────────────────────────────────────────────

describe('LEX-01 known-token coverage', () => {
  test('coverage(): every token known → 100 %', () => {
    const c = coverage('Priya meldet sich.', new Set(['priya', 'meldet', 'sich']));
    assert.equal(c.share, 1);
  });
  test('coverage(): unknown tokens are counted', () => {
    const c = coverage('Priya meldet sich beim Quartiersmanagement.', new Set(['priya', 'meldet', 'sich', 'beim']));
    assert.deepEqual(c.unknown, ['Quartiersmanagement']);
    assert.ok(c.share < 0.95);
  });
  test('the example: advisory only while the cumulative lexicon is a stub (§15.6)', async () => {
    const r = await rule('LEX-01', ex());
    assertPass(r);
  });
  test('an input of unknown words is reported', async () => {
    const base = await rule('LEX-01', ex());
    assert.ok(!base.findings.some((f) => /Quartiersmanagement/.test(f.message)));
    const bad = await rule('LEX-01', ex((p) => { step(p, 0).input.lines[0].de = 'Quartiersmanagement Zuständigkeitsbereich Verwaltungsvorschrift Rechtsbehelfsbelehrung.'; }));
    assert.ok(bad.findings.some((f) => /Quartiersmanagement/.test(f.message)), messages(bad));
  });
  test('extras names are known words', async () => {
    const r = await rule('LEX-01', ex());
    assert.ok(!r.findings.some((f) => /\bWinter\b/.test(f.message)), messages(r));
  });
});

describe('LEX-02 recurrence (ratchet)', () => {
  test('the example: the receptive lemmas occurring once are ratchet entries, never blockers', async () => {
    const r = await rule('LEX-02', ex());
    assertPass(r);
    // SCHEMA §15.6 records 7; this measurement finds 8 (Rückruf, productive, also occurs once in the inputs)
    assert.equal(n(r, 'ratchet'), 8, messages(r));
  });
  test('a new lemma that never recurs adds a ratchet entry', async () => {
    const r = await rule('LEX-02', ex((p) => {
      p.lexicon.push({ ...p.lexicon[0], id: 'lx.zzz-test', lemma: 'Quittung', plural: 'Quittungen', role: 'receptive' });
      p.unit.spec.lexiconBlocks[0].lemmas.push('lx.zzz-test');
    }));
    assert.equal(n(r, 'ratchet'), 9);
  });
});

describe('LEX-03 production uses known lemmas', () => {
  test('pass (advisory while the lexicon is partial)', async () => assertPass(await rule('LEX-03', ex())));
  test('an unknown lemma in a model text is reported', async () => {
    // while the lexicon is partial the finding is one aggregated advisory per file: count its surfaces
    const forms = (r) => r.findings.reduce((sum, f) => {
      const m = f.message.match(/so far: (.*?)(?: … \(\+(\d+)\))? — /);
      return m ? sum + m[1].split(', ').length + Number(m[2] || 0) : sum;
    }, 0);
    const base = await rule('LEX-03', ex());
    const r = await rule('LEX-03', ex((p) => { step(p, 5).task.modelText += ' Die Rechtsbehelfsbelehrung liegt bei.'; }));
    assert.ok(forms(r) > forms(base), messages(r));
  });
  test('fail: four glossed extras in one text', async () => assertFail(await rule('LEX-03', ex((p) => {
    step(p, 0).input.glosses = ['a', 'b', 'c', 'd'].map((x) => ({ token: x, gloss: { en: x } }));
  })), /4 glossed extras/));
});

describe('LEX-04 off-list share', () => {
  test('pass', async () => assertPass(await rule('LEX-04', ex())));
  test('fail: most entries off-list', async () => assertFail(await rule('LEX-04', ex((p) => { p.lexicon.forEach((e, i) => { if (i < 20) e.list_ref = 'off-list:test'; }); }))));
});

describe('LEX-05 new entries per unit', () => {
  test('pass: 28 entries, 14 productive', async () => assertPass(await rule('LEX-05', ex())));
  test('fail: ten entries removed', async () => assertFail(await rule('LEX-05', ex((p) => {
    const drop = new Set(p.lexicon.slice(0, 10).map((e) => e.id));
    p.lexicon = p.lexicon.filter((e) => !drop.has(e.id));
    for (const b of p.unit.spec.lexiconBlocks) b.lemmas = b.lemmas.filter((l) => !drop.has(l));
  }))));
});

describe('LEX-07 lexicon hygiene', () => {
  test('pass', async () => assertPass(await rule('LEX-07', ex())));
  test('fail: a noun without plural_kind and a wordId set in authoring', async () => assertFail(await rule('LEX-07', ex((p) => { delete p.lexicon[0].plural_kind; p.lexicon[1].wordId = 42; }))));
});

// ── texts ───────────────────────────────────────────────────────────────────────────────────

describe('TXT-02 exam text bands', () => {
  test('pass: ga2.h1 and ta2.h1 texts within their bands', async () => assertPass(await rule('TXT-02', ex())));
  test('fail: a ga2.h1 text cut to five words', async () => assertFail(await rule('TXT-02', ex((p) => {
    const t = step(p, 3).texts[0];
    t.lines = [{ ...t.lines[0], de: 'Ihr Termin fällt leider aus.', say: undefined }];
  }))));
});

describe('TXT-03 input sizes', () => {
  test('pass: 8–10 lines per dialogue', async () => assertPass(await rule('TXT-03', ex())));
  test('fail: a three-line situation input', async () => assertFail(await rule('TXT-03', ex((p) => { step(p, 0).input.lines = step(p, 0).input.lines.slice(0, 3); }))));
});

describe('TXT-04 instruction length', () => {
  test('pass', async () => assertPass(await rule('TXT-04', ex())));
  test('fail: a 120-character practice prompt', async () => assertFail(await rule('TXT-04', ex((p) => { step(p, 0).pool.items[0].promptDe = `Frau Kowalski sagt: „Bitte melden Sie ___ bei mir, sobald Sie wieder im Büro sind, denn es ist wirklich sehr dringend.“`; })), /characters/));
  test('exam stems follow examStemChars, not the 90-character limit', async () => {
    const long = 'Was soll Frau Nair nach der Nachricht der Praxis am Donnerstagvormittag unbedingt tun?'; // 86
    assertPass(await rule('TXT-04', ex((p) => { step(p, 3).blocks[0].items[0].promptDe = `${long} Bitte.`; })));
    assertFail(await rule('TXT-04', ex((p) => { step(p, 3).blocks[0].items[0].promptDe = `${long} ${long}`; })), /exam stem/);
  });
  test('fail: a Teil template instruction over 200 characters', async () => assertFail(await rule('TXT-04', ex((p) => { p.ga2Lane.teile.h1.instructionsDe = 'Sie hören fünf kurze Texte. '.repeat(9); })), /template ga2\.h1/));
});

// ── items ───────────────────────────────────────────────────────────────────────────────────

describe('ITM-01 the answer follows from the German prompt', () => {
  test('pass', async () => assertPass(await rule('ITM-01', ex())));
  test('fail: a typed gap without a gap', async () => assertFail(await rule('ITM-01', ex((p) => { step(p, 0).pool.items[0].promptDe = 'Frau Kowalski sagt: „Bitte melden Sie bei mir.“'; })), /without a gap/));
  test('fail: an English prompt (quality.js)', async () => assertFail(await rule('ITM-01', ex((p) => { step(p, 0).pool.items[1].promptDe = 'Jan is late today. He ___ himself.'; }))));
  test('pass: zuordnen/insert items answer from the block choices', async () => assertPass(await rule('ITM-01', choiceContext())));
});

describe('ITM-02 choice items', () => {
  test('pass', async () => assertPass(await rule('ITM-02', ex())));
  test('fail: a non-exam MC with two options', async () => assertFail(await rule('ITM-02', ex((p) => {
    const it = step(p, 0).inputItems.find((i) => i.type === 'multiple_choice');
    it.options = it.options.filter((o) => o === it.answer).concat(['Nein.']);
  })), /needs 3 options/));
  test('fail: the key missing from the options', async () => assertFail(await rule('ITM-02', ex((p) => {
    const it = step(p, 0).inputItems.find((i) => i.type === 'multiple_choice');
    it.answer = 'etwas ganz anderes';
    it.accepted = ['etwas ganz anderes'];
  })), /not one of the options/));
});

describe('ITM-03 key balance', () => {
  test('pass: ga2.h1 keys b, c, a, c, b', async () => assertPass(await rule('ITM-03', ex())));
  test('fail: every a/b/c key the same', async () => assertFail(await rule('ITM-03', ex((p) => {
    for (const it of step(p, 3).blocks[0].items) { it.answer = it.options[0]; it.accepted = [it.options[0]]; }
  }))));
});

describe('ITM-04 R/F statements are not copied from the text', () => {
  const rf = (promptDe) => (p) => {
    step(p, 0).inputItems.push({ id: 'a2.1-u07-ls1-i09', type: 'richtig_falsch', role: 'input', topic: 'hoeren', promptDe, options: ['richtig', 'falsch'], answer: 'richtig', accepted: ['richtig'], explanation: { de: 'So steht es im Gespräch.', en: 'That is what the dialogue says.' }, origin: 'agent' });
  };
  test('pass: a paraphrased statement', async () => assertPass(await rule('ITM-04', ex(rf('Priya soll sich später noch einmal melden.')))));
  test('fail: a statement copied from an input line', async () => {
    const b = ex();
    const line = b.parts.unit.steps[0].input.lines[1].de;
    assertFail(await rule('ITM-04', ex(rf(line))), /verbatim|one token/);
  });
});

describe('ITM-05 task shapes', () => {
  test('pass', async () => assertPass(await rule('ITM-05', ex())));
  test('fail: five sentence-building items with one POS-masked key', async () => assertFail(await rule('ITM-05', ex((p) => {
    const sb = step(p, 0).pool.items.filter((i) => i.type === 'sentence_building');
    for (const it of sb) { it.answer = 'Ich melde mich morgen.'; it.tiles = ['mich', 'ich', 'morgen', 'melde']; it.accepted = ['Ich melde mich morgen.', 'Morgen melde ich mich.']; }
  }))));
});

describe('ITM-06 pools and reserves', () => {
  test('pass: 11 + 5 = 16, the A2 mix, reserve 4', async () => assertPass(await rule('ITM-06', ex())));
  test('fail: a pool of 15', async () => assertFail(await rule('ITM-06', ex((p) => { step(p, 0).pool.items.pop(); })), /= 15/));
  test('fail: a reserve of 3', async () => assertFail(await rule('ITM-06', ex((p) => { step(p, 0).reserve = step(p, 0).reserve.slice(0, 3); })), /reserve holds 3/));
  test('fail: a reserve item repeating a pool item’s POS-masked key', async () => assertFail(await rule('ITM-06', ex((p) => {
    const sb = step(p, 0).pool.items.find((i) => i.type === 'sentence_building');
    step(p, 0).reserve[0] = { ...sb, id: 'a2.1-u07-ls1-r01' };
  })), /POS-masked key/));
});

describe('ITM-07 exact on numbers and names', () => {
  test('pass', async () => assertPass(await rule('ITM-07', ex())));
  test('fail: a phone number answer without exact', async () => assertFail(await rule('ITM-07', ex((p) => {
    step(p, 0).pool.items[0] = { ...step(p, 0).pool.items[0], promptDe: 'Die Nummer von Herrn Winter: ___', answer: '0341 90 12 33', accepted: ['0341 90 12 33'] };
    delete step(p, 0).pool.items[0].exact;
  }))));
});

describe('ITM-08 caseSensitive only where capitalisation is the task', () => {
  test('pass: the Sie form', async () => {
    const r = await rule('ITM-08', ex((p) => { step(p, 0).pool.items[0].caseSensitive = true; step(p, 0).pool.items[0].promptDe = 'Herr Winter, bitte melden ___ sich bei mir.'; step(p, 0).pool.items[0].answer = 'Sie'; step(p, 0).pool.items[0].accepted = ['Sie']; }));
    assert.equal(r.findings.length, 0, messages(r));
  });
  test('flag: caseSensitive on an ordinary word (advisory)', async () => {
    const r = await rule('ITM-08', ex((p) => { step(p, 0).pool.items[1].caseSensitive = true; }));
    assert.ok(r.findings.length >= 1, messages(r));
  });
});

describe('ITM-09 sentence building orders', () => {
  test('pass: both orders accepted', async () => assertPass(await rule('ITM-09', ex())));
  test('fail: an accepted order the tiles cannot build', async () => assertFail(await rule('ITM-09', ex((p) => {
    const sb = step(p, 0).pool.items.find((i) => i.id === 'a2.1-u07-ls1-p05');
    sb.accepted.push('Ich melde mich heute.');
  }))));
});

describe('ITM-10 accepted forms explained', () => {
  test('pass', async () => assertPass(await rule('ITM-10', ex())));
  test('fail: acceptedWhy for a form that is not accepted', async () => assertFail(await rule('ITM-10', ex((p) => { step(p, 0).pool.items[0].acceptedWhy = { dich: 'du-Form' }; }))));
});

describe('ITM-11 static explanations', () => {
  test('pass', async () => assertPass(await rule('ITM-11', ex())));
  test('fail: an item without its English explanation', async () => assertFail(await rule('ITM-11', ex((p) => { delete step(p, 0).pool.items[0].explanation.en; }))));
});

// ── content ─────────────────────────────────────────────────────────────────────────────────

describe('CON-06 facts', () => {
  test('pass: verified', async () => assertPass(await rule('CON-06', ex())));
  test('fail: the SCHEMA fixture as written (verification "partial")', async () => assertFail(await rule('CON-06', ex(null, { verified: false })), /partial/));
  test('fail: a fact checked more than 180 days ago', async () => assertFail(await rule('CON-06', ex((p) => { p.unit.facts[0].factsCheckedOn = '2025-01-01'; }))));
});

// ── exam fidelity ───────────────────────────────────────────────────────────────────────────

describe('EXM-01 blocks match their template', () => {
  test('pass: ga2.h1 5 items / 3 options / 2 plays', async () => assertPass(await rule('EXM-01', ex())));
  test('fail: a full ga2.h1 block with four items', async () => assertFail(await rule('EXM-01', ex((p) => { step(p, 3).blocks[0].items.pop(); })), /4 items/));
  test('pass: tb1.lv3 (12 ads, x twice) and gb2.l2 (8 sentences, 6 gaps)', async () => assertPass(await rule('EXM-01', choiceContext())));
  test('fail: a choice key answering two items without reuse', async () => assertFail(await rule('EXM-01', choiceContext((p) => { p.lv3.examBlock.items[1].answer = 'a'; p.lv3.examBlock.items[1].accepted = ['a']; })), /answers 2 items/));
  test('fail: an answer that is neither a choice key nor the no-match key', async () => assertFail(await rule('EXM-01', choiceContext((p) => { p.lv3.examBlock.items[0].answer = 'z'; })), /neither a choice key/));
  test('fail: the no-match key also a choice key', async () => assertFail(await rule('EXM-01', choiceContext((p) => { p.lv3.examBlock.choices[11].key = 'x'; })), /also a choice key/));
  test('fail: noMatch flag disagreeing with the answer', async () => assertFail(await rule('EXM-01', choiceContext((p) => { delete p.lv3.examBlock.items[7].noMatch; })), /noMatch missing/));
  test('fail: eleven choices where the template has twelve', async () => assertFail(await rule('EXM-01', choiceContext((p) => { p.lv3.examBlock.choices.pop(); })), /11 choices/));
  test('fail: a gap marker removed from the gb2.l2 text', async () => assertFail(await rule('EXM-01', choiceContext((p) => { p.l2.texts[0].text = p.l2.texts[0].text.replace('⟦04⟧ ', ''); })), /⟦04⟧/));
  test('fail: a gap marker doubled', async () => assertFail(await rule('EXM-01', choiceContext((p) => { p.l2.texts[0].text += ' ⟦02⟧'; })), /2 gap markers/));
  test('reduced length follows the scaffold (minItems, choicesMin)', async () => {
    const reduced = (items, choices) => choiceContext((p) => {
      const b = p.lv3.examBlock;
      b.length = 'reduced';
      b.items = b.items.slice(0, items);
      b.choices = b.choices.slice(0, choices);
      p.lv3.texts = p.lv3.texts.slice(0, choices);
      b.textRefs = b.textRefs.slice(0, choices);
      b.items.forEach((it) => { if (!it.noMatch && !b.choices.some((c) => c.key === it.answer)) { it.answer = 'x'; it.accepted = ['x']; it.noMatch = true; } });
    });
    // b1.2 is outside scaffoldAllowedIn (b1.1): a reduced block there is itself a finding
    assertFail(await rule('EXM-01', reduced(6, 8)), /allows a scaffold only in b1\.1/);
  });
});

describe('EXM-02 scaffolding and pictorial Teile', () => {
  test('pass', async () => assertPass(await rule('EXM-02', ex())));
  test('fail: a scaffolded block in a .2 course', async () => assertFail(await rule('EXM-02', choiceContext((p) => { p.l2.blocks[0].scaffolded = true; })), /\.2 courses/));
  test('fail: a pictorial Teil in .1 without images and not scaffolded', async () => assertFail(await rule('EXM-02', ex((p) => { p.ga2Lane.teile.h1.pictorial = true; })), /pictorial/));
  test('pass: the pictorial Teil as its scaffolded text variant', async () => assertPass(await rule('EXM-02', ex((p) => { p.ga2Lane.teile.h1.pictorial = true; step(p, 3).blocks[0].scaffolded = true; }))));
});

describe('EXM-03 writing tasks', () => {
  test('pass: 3 Leitpunkte, halbformell', async () => assertPass(await rule('EXM-03', ex())));
  test('fail: a greeting as a Leitpunkt', async () => assertFail(await rule('EXM-03', ex((p) => { step(p, 5).task.leitpunkte[2].de = 'Grüßen Sie am Ende freundlich.'; })), /Anrede and Gruß/));
  test('fail: two Leitpunkte', async () => assertFail(await rule('EXM-03', ex((p) => { step(p, 5).task.leitpunkte.pop(); })), /2 Leitpunkte/));
  test('fail: no word band on a free-text Teil', async () => assertFail(await rule('EXM-03', ex((p) => { delete step(p, 5).task.wordBand; })), /wordBand/));
  test('form_fill: sd1.s1 needs exactly five fields', async () => {
    const form = (fields) => (p) => {
      p.ga2Lane.teile.s9 = { id: 'ga2.s9', module: 'schreiben', family: 'fam.w-nachricht', task: 'form_fill', items: 5, textType: 'tt.wortkarte', points: 5, pictorial: false, instructionsDe: 'Füllen Sie das Formular aus.', paraphraseOf: 'test', scaffoldAllowedIn: [], transfersTo: [], source: 'test', stand: '2026-09-27' };
      const t = step(p, 5).task;
      t.template = 'ga2.s9';
      delete t.wordBand;
      t.form = { fields: Array.from({ length: fields }, (_, i) => ({ id: `f${i + 1}`, labelDe: `Feld ${i + 1}`, answer: `Wert ${'ABCDE'[i]}`, accepted: [`Wert ${'ABCDE'[i]}`] })), documents: [] };
    };
    assertPass(await rule('EXM-03', ex(form(5))));
    assertFail(await rule('EXM-03', ex(form(4))), /exactly 5/);
  });
});

describe('EXM-04 speaking tasks, per part', () => {
  test('pass: cards-ask, 0 minutes', async () => assertPass(await rule('EXM-04', ex())));
  test('fail: five minutes of preparation', async () => assertFail(await rule('EXM-04', ex((p) => { step(p, 4).task.prepMinutes = 5; })), /preparation/));
  test('fail: turns outside the template band', async () => assertFail(await rule('EXM-04', ex((p) => { step(p, 4).task.turns = [4, 12]; })), /turns/));
  test('fail: a multi-Teil round checks every part', async () => assertFail(await rule('EXM-04', ex((p) => {
    const t = step(p, 4).task;
    const part = { template: t.template, mode: t.mode, profile: t.profile, prepMinutes: t.prepMinutes, instructionsDe: t.instructionsDe, cards: t.cards, turns: t.turns };
    step(p, 4).task = { bankKey: t.bankKey, lane: t.lane, aiRole: t.aiRole, openingLine: t.openingLine, hintWords: t.hintWords, modelTurns: t.modelTurns, parts: [part, { ...part, mode: 'monologue' }] };
  })), /parts\[1\]/));
});

describe('EXM-11 Prüfungsfokus slots', () => {
  test('pass: each entry has one slot holding its block or task', async () => assertPass(await rule('EXM-11', ex())));
  test('fail: an entry pointing at the wrong slot', async () => assertFail(await rule('EXM-11', ex((p) => { p.unit.spec.lanes.pruefungsfokus[0].slot = 'sprechen'; })), /holds no/));
  test('fail: an entry without a slot (stage T)', async () => assertFail(await rule('EXM-11', ex((p) => { delete p.unit.spec.lanes.pruefungsfokus[1].slot; })), /no slot/));
});

// ── coverage (level scope) ──────────────────────────────────────────────────────────────────

/** A synthetic twelve-unit A2.1 level with the real ga2 lane; `plan(nr)` gives the unit's Teile. */
function syntheticLevel(plan) {
  const ctx = emptyContext({ root: null, today: '2026-09-27' });
  ingest(ctx, JSON.parse(readFileSync(join(REPO, 'content', 'course-v2', 'registries', 'lanes', 'ga2.json'), 'utf8')), 'registries/lanes/ga2.json');
  const docs = [];
  for (let nr = 1; nr <= 12; nr += 1) {
    const { ls4, sprechen, schreiben } = plan(nr);
    const id = `a2.1-u${String(nr).padStart(2, '0')}`;
    const entries = [
      ...ls4.map((t) => ({ template: `ga2.${t}`, length: 'full', modeDefault: 'lern', slot: 'ls4' })),
      { template: `ga2.${sprechen}`, length: 'full', modeDefault: 'lern', slot: 'sprechen' },
      { template: `ga2.${schreiben}`, length: 'full', modeDefault: 'lern', slot: 'schreiben' },
    ];
    const unit = {
      $schema: 'course-v2/unit@1', id, level: 'a2.1', nr, etappe: Math.ceil(nr / 3), stage: 'T',
      spec: { lanes: { primary: 'ga2', pruefungsfokus: entries, spur: {} } },
      steps: [
        { id: `${id}-ls4`, kind: 'pruefung', texts: [], blocks: ls4.map((t) => ({ id: `${id}-ls4-ga2-${t}`, template: `ga2.${t}`, lane: 'ga2', length: 'full', scaffolded: false, modeDefault: 'lern', textRefs: [], items: [] })) },
        { id: `${id}-ls5`, kind: 'sprechen', task: { bankKey: `a21-u${String(nr).padStart(2, '0')}-s`, lane: 'ga2', template: `ga2.${sprechen}` } },
        { id: `${id}-ls6`, kind: 'schreiben', task: { bankKey: `a21-u${String(nr).padStart(2, '0')}-w`, lane: 'ga2', template: `ga2.${schreiben}` } },
      ],
    };
    docs.push(addDoc(ctx, 'unit', unit, `a2.1/units/u${String(nr).padStart(2, '0')}.json`, { target: true }));
  }
  return { ctx, docs, levels: [levelSlot(ctx, 'a2.1')] };
}
const RECEPTIVE = ['l1', 'h1', 'l2', 'h2', 'l3', 'h3', 'l4', 'h4'];
const balanced = (nr) => ({
  ls4: [RECEPTIVE[(2 * nr) % 8], RECEPTIVE[(2 * nr + 1) % 8]],
  sprechen: ['sp1', 'sp2', 'sp3'][nr % 3],
  schreiben: ['s1', 's2'][nr % 2],
});
const lopsided = () => ({ ls4: ['h1', 'h2'], sprechen: 'sp1', schreiben: 's2' });

describe('COV-1 appearance coverage per live lane', () => {
  test('pass: every ga2 Teil ≥ 2× over twelve units', async () => assertPass(await rule('COV-1', syntheticLevel(balanced), { mode: 'level' })));
  test('fail: Lesen never practised', async () => assertFail(await rule('COV-1', syntheticLevel(lopsided), { mode: 'level' }), /ga2\.l1/));
  test('a file target skips the level-scope rule', async () => assert.equal((await rule('COV-1', syntheticLevel(balanced))).status, 'skip'));
  test('the count blocks only when all twelve units are at stage T; before that it is advisory', async () => {
    const lvl = syntheticLevel(lopsided);
    lvl.docs[4].data.stage = 'I';
    const rep = await rule('COV-1', lvl, { mode: 'level' });
    assert.equal(rep.status, 'warn');
    assert.ok(rep.findings.every((f) => f.severity === 'advisory' && /11\/12 units at stage T/.test(f.message)));
  });
});

describe('COV-3 Prüfungsfokus per unit', () => {
  test('pass: three Teile', async () => assertPass(await rule('COV-3', ex())));
  test('fail: one Teile only', async () => assertFail(await rule('COV-3', ex((p) => { p.unit.spec.lanes.pruefungsfokus = p.unit.spec.lanes.pruefungsfokus.slice(0, 1); }))));
});

describe('COV-4 module balance', () => {
  test('pass: 25 % per module', async () => assertPass(await rule('COV-4', syntheticLevel(balanced), { mode: 'level' })));
  test('fail: no Lesen slot', async () => assertFail(await rule('COV-4', syntheticLevel(lopsided), { mode: 'level' }), /lesen/));
});

describe('COV-5 productive rotation', () => {
  test('pass: sp1–sp3 and s1/s2 rotate', async () => assertPass(await rule('COV-5', syntheticLevel(balanced), { mode: 'level' })));
  test('fail: sp2 and sp3 never appear', async () => assertFail(await rule('COV-5', syntheticLevel(lopsided), { mode: 'level' }), /sp2|sp3|s1/));
});

// ── SCHEMA §15.6: what the validator reports on the fixture ─────────────────────────────────

describe('SCHEMA §15.6 on the worked example (--stage T)', () => {
  test('exactly one blocking rule: CON-06 (verification "partial")', async () => {
    const b = ex(null, { verified: false });
    const rep = await runRules({ ctx: b.ctx, docs: b.docs, levels: b.levels, mode: 'file', label: 'test', notes: [] }, { rules: RULES, stage: 'T' });
    const failing = rep.results.filter((r) => r.status === 'fail').map((r) => r.id);
    assert.deepEqual(failing, ['CON-06'], rep.results.filter((r) => r.status === 'fail').map(messages).join('\n'));
    assert.equal(rep.exitCode, 1);
    const pass = ['REF-01', 'ID-01', 'GRM-01', 'GRM-02', 'LEX-05', 'TXT-02', 'TXT-03', 'TXT-04', 'ITM-02', 'ITM-03', 'ITM-06', 'ITM-07', 'ITM-09', 'ITM-10', 'ITM-11', 'EXM-01', 'EXM-03', 'EXM-04', 'EXM-11'];
    for (const id of pass) assert.equal(rep.results.find((r) => r.id === id)?.status, 'pass', `${id} should pass`);
  });
  test('verified, the example passes every rule', async () => {
    const b = ex();
    const rep = await runRules({ ctx: b.ctx, docs: b.docs, levels: b.levels, mode: 'file', label: 'test', notes: [] }, { rules: RULES });
    assert.equal(rep.summary.blocker, 0, rep.results.map(messages).filter(Boolean).join('\n'));
    assert.equal(rep.exitCode, 0);
  });
});

// ── stages ──────────────────────────────────────────────────────────────────────────────────

describe('stage gates (BLUEPRINT §9, SCHEMA §8.1)', () => {
  test('normalizeStage', () => {
    assert.equal(normalizeStage('all'), 'T');
    assert.equal(normalizeStage('s'), 'S');
    assert.equal(normalizeStage('spec'), 'spec');
    assert.equal(normalizeStage('X'), undefined);
    assert.equal(normalizeStage(null), null);
  });
  test('--stage S runs the text rules and skips item and exam rules', async () => {
    const b = ex(null, { verified: false });
    const rep = await runRules({ ctx: b.ctx, docs: b.docs, levels: b.levels, mode: 'file', label: 'test', notes: [] }, { rules: RULES, stage: 'S' });
    const status = Object.fromEntries(rep.results.map((r) => [r.id, r.status]));
    for (const id of ['REF-01', 'ID-01', 'TXT-02', 'TXT-03', 'CON-06']) assert.notEqual(status[id], 'skip', id);
    for (const id of ['ITM-01', 'ITM-06', 'EXM-01', 'EXM-11', 'KEY-01']) assert.equal(status[id], 'skip', id);
    assert.equal(status['CON-06'], 'fail');
  });
  test('a stage-less unit is judged as a spec when it holds only its spec, else at T (integration 2026-09-27)', () => {
    const spec = { kind: 'unit', data: { id: 'a2.1-u01', spec: {} } };
    assert.equal(stageOfDoc(spec), 'spec');
    assert.equal(stageOfDoc({ kind: 'unit', data: { id: 'a2.1-u01', spec: {}, steps: [] } }), 'T');
    assert.equal(stageOfDoc({ kind: 'unit', data: { id: 'a2.1-u01', stage: 'S', spec: {} } }), 'S');
    assert.equal(stageOfDoc(spec, 'I'), 'I', '--stage overrides');
    // spec-judging rules run on a spec; item and exam rules do not
    for (const id of ['GRM-01', 'ALL-03', 'COV-3', 'COV-4', 'COV-5', 'LEX-05']) assert.equal(RULES.find((r) => r.id === id).stage, 'spec', id);
    assert.equal(RULES.find((r) => r.id === 'COV-1').stage, 'T');
  });
  test('a unit declaring stage I is judged on the I set without --stage', async () => {
    const b = ex((p) => { p.unit.stage = 'I'; });
    const unitOnly = { ...b, docs: [b.unit] };
    assert.notEqual((await rule('ITM-06', unitOnly)).status, 'skip');
    assert.equal((await rule('EXM-01', unitOnly)).status, 'skip');
  });
});

// ── detectors ───────────────────────────────────────────────────────────────────────────────

describe('detectors.json', () => {
  const doc = JSON.parse(readFileSync(DETECTORS, 'utf8'));
  test('shape: unique ids, honest precision labels, a spine hint and examples on every detector', () => {
    assert.equal(doc.$schema, 'course-v2/detectors@1');
    const ids = new Set();
    for (const d of doc.detectors) {
      assert.match(d.id, /^det\.[a-z0-9-]+$/);
      assert.ok(!ids.has(d.id), `duplicate ${d.id}`);
      ids.add(d.id);
      assert.ok(['exact', 'heuristic', 'advisory'].includes(d.precision), d.id);
      assert.equal(detectorProblem(d), null, d.id);
      assert.ok(Array.isArray(d.spec.spinePoints) && d.spec.spinePoints.length, `${d.id} spinePoints`);
      assert.ok((d.spec.examples?.hit || []).length >= 1, `${d.id} hit examples`);
      assert.ok((d.spec.examples?.miss || []).length >= 1, `${d.id} miss examples`);
    }
    assert.ok(doc.detectors.length >= 100);
  });
  test('every detector hits its hit examples and misses its miss examples', () => {
    const bad = [];
    for (const d of doc.detectors) {
      const env = d.spec.examples?.lexicon ? buildLexEnv(d.spec.examples.lexicon) : EMPTY_ENV;
      for (const s of d.spec.examples.hit) if (!detectInText(d, s, env).length) bad.push(`MISS ${d.id}: ${s}`);
      for (const s of d.spec.examples.miss) if (detectInText(d, s, env).length) bad.push(`FALSE ${d.id}: ${s}`);
    }
    assert.deepEqual(bad, []);
  });
  test('the spine points of the eight plans are covered where a detector exists', () => {
    const spine = JSON.parse(readFileSync(join(REPO, 'content', 'course-v2', 'registries', 'grammar-spine.json'), 'utf8'));
    const pointIds = new Set(spine.points.map((p) => p.id));
    const unknown = doc.detectors.flatMap((d) => d.spec.spinePoints.filter((p) => !pointIds.has(p)).map((p) => `${d.id} → ${p}`));
    assert.deepEqual(unknown, []);
  });
  test('det.vokalwechsel: stem-vowel change, the U1 chunk and es gibt excepted', () => {
    const d = doc.detectors.find((x) => x.id === 'det.vokalwechsel');
    assert.ok(d);
    assert.equal(d.precision, 'exact');
    assert.ok(detectInText(d, 'Du fährst heute.', EMPTY_ENV).length);
    assert.equal(detectInText(d, 'Sprichst du Deutsch?', EMPTY_ENV).length, 0);
    assert.equal(detectInText(d, 'Gibt es hier ein Café?', EMPTY_ENV).length, 0);
    assert.ok(detectInText(d, 'Er backt nicht, sie bäckt.', buildLexEnv([{ lemma: 'backen', pos: 'VERB', verb_forms: { '3sg': 'bäckt' } }])).length);
    assert.equal(stemVowelChanged('mach', 'macht'), false);
    assert.equal(stemVowelChanged('fahr', 'fährt'), true);
    assert.equal(stemVowelChanged('les', 'liest'), true);
  });
});

// ── rule-smith 2026-09-27: morphology, core lexicon, licensed forms (LEX-01/LEX-03), LEX-07, CON-06 ──

const lexCtx = ({ lexicon = {}, spine = [], cards = [], unit = null } = {}) => {
  const ctx = emptyContext({ root: null, today: '2026-09-27' });
  for (const [level, entries] of Object.entries(lexicon)) ingest(ctx, { $schema: 'course-v2/lexicon@1', level, entries }, `fixture:${level}/lexicon.json`);
  if (spine.length) ingest(ctx, { $schema: 'course-v2/spine@1', points: spine }, 'fixture:grammar-spine.json');
  for (const [level, cs] of Object.entries(cards)) ingest(ctx, { $schema: 'course-v2/rulecards@1', level, cards: cs }, `fixture:${level}/rule-cards.json`);
  const doc = unit ? addDoc(ctx, 'unit', unit, `fixture:${unit.level}/units/u${String(unit.nr).padStart(2, '0')}.json`, { target: true }) : null;
  return { ctx, docs: doc ? [doc] : [], unit: doc, levels: unit ? [ctx.levels.get(unit.level)] : [] };
};
const lx = (id, lemma, pos, unit, extra = {}) => ({ id, lemma, pos, role: 'productive', unit, block: 1, list_ref: 'A1', gloss: { en: lemma }, example: lemma, wordId: null, ...extra });
const formsOf = (e) => entryForms(e).forms;

describe('lexicon morphology: an inflected form of a known lemma is known', () => {
  test('verbs: present with stem change, imperative, Präteritum, Konjunktiv II, participles', () => {
    const f = formsOf({ lemma: 'helfen', pos: 'VERB', verb_forms: { '2sg': 'hilfst', '3sg': 'hilft', praet: 'half', perfekt: 'hat geholfen' } });
    for (const w of ['helfe', 'hilfst', 'hilft', 'helft', 'helfen', 'hilf', 'half', 'halfen', 'hälfe', 'geholfen', 'geholfene', 'helfend']) assert.ok(f.has(w), w);
    const k = formsOf({ lemma: 'kommen', pos: 'VERB', verb_forms: { '3sg': 'kommt', praet: 'kam', perfekt: 'ist gekommen' } });
    for (const w of ['kam', 'kamst', 'kamen', 'käme', 'kämen', 'kämest']) assert.ok(k.has(w), w);
    const s = formsOf({ lemma: 'sagen', pos: 'VERB', verb_forms: { '3sg': 'sagt', praet: 'sagte', perfekt: 'hat gesagt' } });
    assert.ok(s.has('sagte') && s.has('sagten') && s.has('gesagte'));
    assert.ok(!s.has('sägte'), 'a regular weak verb has no umlauted Konjunktiv II');
  });
  test('separable verbs: split, rejoined in a subordinate clause, zu-infinitive; the praet is its FIRST word', () => {
    const e = { lemma: 'anfangen', pos: 'VERB', separable: true, verb_forms: { '2sg': 'fängst an', '3sg': 'fängt an', perfekt: 'hat angefangen' } };
    const { forms, prefix } = entryForms(e);
    assert.equal(prefix, 'an');
    for (const w of ['fange', 'fängst', 'fängt', 'fing', 'fingen', 'finge', 'anfängt', 'anfing', 'anzufangen', 'angefangen', 'angefangene']) assert.ok(forms.has(w), w);
    assert.ok(!forms.has('an'), 'the particle is not a form of the verb (LEX-02 would count every „an")');
    const m = formsOf({ lemma: 'mitkommen', pos: 'VERB', separable: true, verb_forms: { '3sg': 'kommt mit', praet: 'kam mit', perfekt: 'ist mitgekommen' } });
    assert.ok(m.has('kam') && m.has('mitkam') && m.has('mitkäme'));
    assert.ok(!m.has('mit'), '„kam mit" used to make „mit" a form of mitkommen');
    const st = formsOf({ lemma: 'stattfinden', pos: 'VERB', separable: true, verb_forms: { '3sg': 'findet statt', perfekt: 'hat stattgefunden' } });
    assert.ok(st.has('stattfindet') && st.has('fand') && st.has('stattfand'));
  });
  test('the strong-verb table fills a missing praet; never for -ieren or a short key inside a longer verb', () => {
    assert.equal(strongPraet('verstehen'), 'verstand');
    assert.equal(strongPraet('bekommen'), 'bekam');
    assert.equal(strongPraet('fangen'), 'fing');
    assert.equal(strongPraet('tun'), 'tat');
    assert.equal(strongPraet('vertun'), null);
    assert.equal(strongPraet('studieren'), null);
    assert.equal(strongPraet('arbeiten'), null);
    assert.equal(umlaut('kam'), 'käm');
    assert.equal(umlaut('hatt'), 'hätt');
    assert.equal(umlaut('wurd'), 'würd');
    assert.equal(umlaut('lauf'), 'läuf');
  });
  test('adjectives: endings, comparative/superlative incl. umlaut and irregulars, -el/-er stems', () => {
    const alt = formsOf({ lemma: 'alt', pos: 'ADJ' });
    for (const w of ['alte', 'alten', 'älter', 'ältere', 'ältesten']) assert.ok(alt.has(w), w);
    const gut = formsOf({ lemma: 'gut', pos: 'ADJ' });
    for (const w of ['gute', 'besser', 'bessere', 'besten', 'beste']) assert.ok(gut.has(w), w);
    const d = formsOf({ lemma: 'dunkel', pos: 'ADJ' });
    assert.ok(d.has('dunkle') && d.has('dunkler') && d.has('dunklen'));
    const t = formsOf({ lemma: 'teuer', pos: 'ADJ' });
    assert.ok(t.has('teure') && t.has('teurer'));
  });
  test('nouns: plural, dative plural, feminine pair, nominalised adjective', () => {
    const k = formsOf({ lemma: 'Kunde', pos: 'NOUN', article: 'der', plural: 'Kunden', feminine: 'die Kundin' });
    for (const w of ['kunde', 'kunden', 'kundin', 'kundinnen']) assert.ok(k.has(w), w);
    const h = formsOf({ lemma: 'Haus', pos: 'NOUN', article: 'das', plural: 'Häuser' });
    assert.ok(h.has('häuser') && h.has('häusern') && h.has('hauses'));
    assert.ok(formsOf({ lemma: 'Beschäftigte', pos: 'NOUN', plural: 'Beschäftigten' }).has('beschäftigter'));
  });
  test('number words: cardinals and ordinals with every ending', () => {
    for (const w of ['vierundachtzig', 'zweitausendvierundzwanzig', 'ersten', 'zweite', 'dritten', 'vierte', 'siebten', 'zwanzigsten', 'dreißigsten', 'einunddreißigste', 'zweitens']) assert.ok(NUMBER_WORDS.has(w), w);
  });
});

describe('core lexicon (core-lexicon.mjs): a closed A1 floor, outranked by the lexicon', () => {
  test('closed: ≤ 400 entries, no B-level word, no proper name', () => {
    assert.ok(CORE_SIZE <= 400, `core has ${CORE_SIZE} entries`);
    const banned = ['wenigstens', 'zurzeit', 'einander', 'jedoch', 'allerdings', 'nämlich', 'selbst', 'einverstanden', 'Prozent', 'Protokoll', 'Betreff', 'Veranstalter', 'Vertrag', 'sofern', 'vorausgesetzt', 'entsprechen', 'Beschreibung', 'Idee', 'Gruppe', 'Raum', 'besonders', 'anders', 'möglich'];
    const have = new Set(CORE_LEMMAS.map((w) => w.toLowerCase()));
    assert.deepEqual(banned.filter((w) => have.has(w.toLowerCase())), []);
    assert.deepEqual(CORE_LEMMAS.filter((w) => /^[A-ZÄÖÜ]/.test(w) && !CORE_ENTRIES.some((e) => e.lemma === w && e.pos === 'NOUN')), []);
  });
  test('basic words and the auxiliary/modal paradigms are known from A1.1 U1', () => {
    const { ctx } = lexCtx({ lexicon: { 'a1.1': [lx('lx.hallo', 'hallo', 'INTJ', 'a1.1-u01')] } });
    const known = knownForms(ctx, 'a1.1', 1);
    for (const w of ['moment', 'einmal', 'fertig', 'tür', 'türen', 'bringt', 'brachte', 'begann', 'hätte', 'hätten', 'könnten', 'würden', 'wäre', 'müsste', 'dritten', 'zwanzigsten', 'dreißigsten']) assert.ok(known.has(w), w);
    assert.ok(!known.has('einverstanden'));
  });
  test('precedence: a core lemma a lexicon allocates to a later unit is unknown before that unit', () => {
    const { ctx } = lexCtx({ lexicon: { 'a1.1': [lx('lx.hallo', 'hallo', 'INTJ', 'a1.1-u01'), lx('lx.tuer', 'Tür', 'NOUN', 'a1.1-u05', { article: 'die', plural: 'Türen', plural_kind: 'regular' })] } });
    assert.ok(!knownForms(ctx, 'a1.1', 4).has('tür'));
    assert.ok(knownForms(ctx, 'a1.1', 5).has('türen'));
    assert.ok(knownForms(ctx, 'a1.1', 4).has('moment'), 'unallocated core words stay known');
  });
});

describe('licensed forms: the grammar a unit teaches licenses its rule-card examples', () => {
  const spine = [{ id: 'g.konj2-test', label: 'Höfliche Formeln: Ich hätte gern …, Könnten Sie …?', intro: { receptive: 'a1.2-u07', productive: 'a1.2-u07' }, chunkFrom: 'a1.2-u04', detectors: [], errorTags: [], lehrwerk: [], consensus: 'strong', ruleCards: ['rc.konj2-test'], inventory: [] }];
  const cards = { 'a1.2': [{ id: 'rc.konj2-test', spine: 'g.konj2-test', depth: 1, modelSentence: 'Würden Sie mir helfen?', de: 'Diese Formen sind besonders höflich.', en: 'Polite forms.', table: [['neutral', 'höflich'], ['Können Sie?', 'Könnten Sie?']], caseMarks: [] }] };
  const unitAt = (nr, grammar) => ({ $schema: 'course-v2/unit@1', id: `a1.2-u${String(nr).padStart(2, '0')}`, level: 'a1.2', nr, stage: 'I', spec: { grammar } });
  test('a unit naming the point (or placed at/after its chunk) is licensed; prose and table headers are not', () => {
    const { ctx } = lexCtx({ spine, cards });
    const l4 = licensedForms(ctx, unitAt(4, { new: [], chunk: ['g.konj2-test'], review: [] })).forms;
    for (const w of ['würden', 'könnten', 'hätte']) assert.ok(l4.has(w), w);
    for (const w of ['besonders', 'höflich', 'formen', 'neutral']) assert.ok(!l4.has(w), w);
    assert.ok(!licensedForms(ctx, unitAt(3, { new: [], chunk: [], review: [] })).forms.has('würden'), 'not before the point enters');
  });
  test('a card example the lexicon allocates to a later unit is not licensed early', () => {
    const { ctx } = lexCtx({ spine, cards, lexicon: { 'a1.2': [lx('lx.helfen', 'helfen', 'VERB', 'a1.2-u09', { verb_forms: { '3sg': 'hilft', perfekt: 'hat geholfen' } })] } });
    const unit = unitAt(4, { new: [], chunk: ['g.konj2-test'], review: [] });
    assert.ok(!licensedForms(ctx, unit).forms.has('helfen'));
    assert.ok(licensedForms(ctx, { ...unit, id: 'a1.2-u09', nr: 9 }).forms.has('helfen'));
  });
});

describe('LEX-03 on a complete cumulative lexicon (A1.1 U1): real blockers stay, false ones are gone', () => {
  const build = (answer) => lexCtx({
    lexicon: { 'a1.1': [lx('lx.termin', 'Termin', 'NOUN', 'a1.1-u01', { article: 'der', plural: 'Termine', plural_kind: 'regular' }), lx('lx.mai', 'Mai', 'NOUN', 'a1.1-u01', { article: 'der', plural: null, plural_kind: 'singular-only' })] },
    unit: { $schema: 'course-v2/unit@1', id: 'a1.1-u01', level: 'a1.1', nr: 1, stage: 'I', spec: { grammar: { new: [], chunk: [], review: [] } }, steps: [{ id: 'a1.1-u01-ls1', pool: { items: [{ id: 'a1.1-u01-ls1-p01', type: 'fill_blank', answer }, { id: 'a1.1-u01-ls1-p02', type: 'zuordnen', answer: 'c' }] } }] },
  });
  test('inflected ordinals, Konjunktiv II and an option key pass', async () => {
    assertPass(await rule('LEX-03', build('Der Termin ist am dritten Mai. Hätten Sie am zwanzigsten Zeit? Könnten Sie das bitte bringen?')));
  });
  test('an unallocated word still blocks', async () => {
    assertFail(await rule('LEX-03', build('Die Rechtsbehelfsbelehrung liegt bei.')), /Rechtsbehelfsbelehrung/);
  });
});

describe('LEX-07 duplicates vs homographs', () => {
  const withB11 = (entries) => {
    const b = ex();
    ingest(b.ctx, { $schema: 'course-v2/lexicon@1', level: 'b1.1', entries }, 'fixture:b1.1/lexicon.json');
    return { ...b, levels: [b.ctx.levels.get('a2.1'), b.ctx.levels.get('b1.1')] };
  };
  test('a -2 homograph with its own gloss beside the plain entry passes on both levels', async () => {
    const b = withB11([lx('lx.anruf-2', 'Anruf', 'NOUN', 'b1.1-u01', { article: 'der', plural: 'Anrufe', plural_kind: 'regular', gloss: { en: 'appeal (to the public)' } })]);
    assertPass(await rule('LEX-07', b, { mode: 'level' }));
  });
  test('a -2 homograph repeating the gloss is one lemma entered twice', async () => {
    const b = ex();
    const g = b.parts.lexicon.find((e) => e.id === 'lx.anruf').gloss;
    const c = withB11([lx('lx.anruf-2', 'Anruf', 'NOUN', 'b1.1-u01', { article: 'der', plural: 'Anrufe', plural_kind: 'regular', gloss: g })]);
    assertFail(await rule('LEX-07', c, { mode: 'level' }), /homograph lx\.anruf-2 has the same gloss/);
  });
  test('the same id allocated again at a higher level blocks on the higher entry only, naming the promotion', async () => {
    const b = ex();
    const src = b.parts.lexicon.find((e) => e.role === 'receptive');
    const c = withB11([{ ...src, unit: 'b1.1-u02', role: 'productive' }]);
    const r = await rule('LEX-07', c, { mode: 'level' });
    assertFail(r, /already allocated at a2\.1.*promotions/);
    assert.ok(r.findings.filter((f) => f.severity === 'blocker').every((f) => /b1\.1/.test(f.file)), messages(r));
  });
});

describe('CON-06 while a unit is a draft', () => {
  test('partial/pending + https source + a reason in notes → a warning quoting the reason, no blocker', async () => {
    const r = await rule('CON-06', ex((p) => { p.unit.status = 'draft'; }, { verified: false }));
    assertPass(r);
    assert.ok(r.findings.some((f) => f.severity === 'advisory' && /^warning: verification is "partial"/.test(f.message) && /notes:/.test(f.message)), messages(r));
  });
  test('a draft fact without a reason, or without a source, still blocks', async () => {
    assertFail(await rule('CON-06', ex((p) => { p.unit.status = 'draft'; delete p.unit.facts[0].notes; }, { verified: false })), /say in notes/);
    assertFail(await rule('CON-06', ex((p) => { p.unit.status = 'draft'; p.unit.facts[0].sources = []; }, { verified: false })), /without a source/);
  });
});

describe('SCHEMA §8 UnitSpec.lexiconBlocks: 6..20 lemmas per block (B2 carries 15–18)', () => {
  const blockErrors = (n) => {
    const spec = exampleContext().parts.unit.spec;
    spec.lexiconBlocks = spec.lexiconBlocks.map((b, i) => ({ ...b, lemmas: Array.from({ length: n }, (_, k) => `lx.test-${i}-${k}`) }));
    return check('UnitSpec', spec).filter((e) => /lexiconBlocks\[\d\]\.lemmas$/.test(e.path) && /expected 6\.\.20 items/.test(e.message));
  };
  test('17 lemmas per block pass, 21 and 5 do not', () => {
    assert.deepEqual(blockErrors(17), []);
    assert.ok(blockErrors(21).length > 0);
    assert.ok(blockErrors(5).length > 0);
  });
});

// ── CLI ─────────────────────────────────────────────────────────────────────────────────────

describe('validate.mjs CLI', () => {
  const cli = (...args) => spawnSync(process.execPath, [VALIDATE, ...args], { cwd: REPO, encoding: 'utf8' });
  test('the on-disk fixture: exit 1 on CON-06 only', () => {
    const r = cli(FIXTURE, '--json');
    assert.equal(r.status, 1, r.stderr);
    const rep = JSON.parse(r.stdout);
    assert.deepEqual(rep.results.filter((x) => x.status === 'fail').map((x) => x.id), ['CON-06']);
  });
  test('human report names the result and the skipped rules', () => {
    const r = cli(FIXTURE);
    assert.match(r.stdout, /FAIL {2}CON-06/);
    assert.match(r.stdout, /skipped: level-scope rule/);
    assert.match(r.stdout, /result: FAIL/);
  });
  test('--rule narrows the run; exit 0 when no blocker', () => {
    const r = cli(FIXTURE, '--rule', 'REF-01,ID-01');
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /2 rules/);
  });
  test('--stage validation', () => {
    assert.equal(cli(FIXTURE, '--stage', 'Q').status, 2);
    const r = cli(FIXTURE, '--stage', 'S', '--json');
    const rep = JSON.parse(r.stdout);
    assert.equal(rep.stage, 'S');
    assert.equal(rep.results.find((x) => x.id === 'EXM-01').status, 'skip');
  });
  test('a level under --root: every rule runs or says why it skipped', () => {
    const root = mkdtempSync(join(tmpdir(), 'cv2-'));
    try {
      const reg = join(REPO, 'content', 'course-v2', 'fixtures', 'registries');
      cpSync(reg, join(root, 'registries'), { recursive: true });
      mkdirSync(join(root, 'a2.1', 'units'), { recursive: true });
      const unit = JSON.parse(readFileSync(FIXTURE, 'utf8'));
      unit.facts.forEach((f) => { f.verification = 'verified'; });
      writeFileSync(join(root, 'a2.1', 'units', 'u07.json'), JSON.stringify(unit));
      copyFileSync(DETECTORS, join(root, 'registries', 'detectors.json'));
      const r = cli('a2.1', '--root', root, '--json');
      const rep = JSON.parse(r.stdout);
      assert.equal(rep.exitCode, 0, rep.results.filter((x) => x.status === 'fail').map(messages).join('\n'));
      for (const x of rep.results) assert.ok(x.status !== 'skip' || x.reason, `${x.id} skipped without a reason`);
      assert.ok(['pass', 'warn', 'skip'].includes(rep.results.find((x) => x.id === 'COV-1').status));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
  test('--all on the repository content runs every rule without crashing (partial content is a normal state)', () => {
    const r = cli('--all', '--json');
    assert.ok(r.status === 0 || r.status === 1, r.stderr);
    const rep = JSON.parse(r.stdout);
    const crashed = rep.results.flatMap((x) => x.findings).filter((f) => /rule crashed/.test(f.message));
    assert.deepEqual(crashed, []);
    assert.ok(!rep.results.some((x) => x.id === 'LOAD'), 'a content file failed to parse');
  });
});
