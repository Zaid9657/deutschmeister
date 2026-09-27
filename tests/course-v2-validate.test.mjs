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
import { emptyContext, ingest, addDoc, levelSlot, addDetectors } from '../scripts/course-v2/lib-validate/context.mjs';
import { detectInText, detectorProblem, buildLexEnv, EMPTY_ENV, stemVowelChanged, LEXICALISED_STATES, DETECTOR_OVERLAYS } from '../scripts/course-v2/lib-validate/detectors.mjs';
import { tokens } from '../scripts/course-v2/lib-validate/text.mjs';
import { missingOrders } from '../scripts/course-v2/lib-validate/orders.mjs';
import { knownCompound } from '../scripts/course-v2/lib-validate/compounds.mjs';
import { BANK_KEY_RE, SCHEMA_PATTERNS } from '../scripts/course-v2/lib-validate/ids.mjs';
import { coverage } from '../scripts/course-v2/rules/LEX-01.mjs';
import { entryForms, knownForms, licensedForms, umlaut } from '../scripts/course-v2/lib-validate/lexicon.mjs';
import { CORE_SIZE, CORE_LEMMAS, CORE_ENTRIES, NUMBER_WORDS } from '../scripts/course-v2/lib-validate/core-lexicon.mjs';
import { strongPraet } from '../scripts/course-v2/lib-validate/strong-verbs.mjs';
import { check } from '../scripts/course-v2/lib/schema.mjs';
import { KINDS, kindOf } from '../scripts/course-v2/lib/schemas/index.mjs';

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
    const pass = ['REF-01', 'ID-01', 'GRM-01', 'GRM-02', 'LEX-05', 'TXT-02', 'TXT-03', 'TXT-04', 'ITM-02', 'ITM-06', 'ITM-07', 'ITM-09', 'ITM-10', 'ITM-11', 'EXM-01', 'EXM-11'];
    for (const id of pass) assert.equal(rep.results.find((r) => r.id === id)?.status, 'pass', `${id} should pass`);
    // rail extensions of 2026-09-27 that measure the worked example as advisories only (RAILS §7 item 13):
    // ITM-03 non-exam key positions (every MC keyed at options[0]), EXM-03 two-letter cues („am", „um"),
    // EXM-04 the ga2.sp1 Thema and a three-word card, ITM-13 dictation lengths
    for (const id of ['ITM-03', 'EXM-03', 'EXM-04', 'ITM-13']) {
      const r = rep.results.find((x) => x.id === id);
      assert.ok(['pass', 'warn'].includes(r?.status), `${id}: ${r?.status}`);
      assert.equal(r.findings.filter((f) => f.severity === 'blocker').length, 0, `${id} has no blocker on the worked example`);
    }
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

describe('proper names (registries/names.json, SCHEMA §4.9): known from their level on', () => {
  const NAMES = [
    { form: 'Leipzig', kind: 'place', level: 'a1.1' },
    { form: 'Cospuden', kind: 'place', level: 'a1.1' },
    { form: 'Sächsische Schweiz', kind: 'place', level: 'a1.1' },
    { form: 'Plagwitz', kind: 'place', level: 'b1.2' },
    { form: 'Deutschland', kind: 'place', level: 'a1.1' },
  ];
  const build = (answer, names = NAMES, lexicon = []) => {
    const b = lexCtx({
      lexicon: { 'a1.1': [lx('lx.termin', 'Termin', 'NOUN', 'a1.1-u01', { article: 'der', plural: 'Termine', plural_kind: 'regular' }), ...lexicon] },
      unit: { $schema: 'course-v2/unit@1', id: 'a1.1-u01', level: 'a1.1', nr: 1, stage: 'I', spec: { grammar: { new: [], chunk: [], review: [] } }, steps: [{ id: 'a1.1-u01-ls1', pool: { items: [{ id: 'a1.1-u01-ls1-p01', type: 'fill_blank', answer }] } }] },
    });
    b.ctx.registries.names = names;
    return b;
  };
  test('pass: a listed name, its genitive -s and adjectival -er form, an adjective inside a name', async () => {
    assertPass(await rule('LEX-03', build('Der Termin ist in Leipzig, nicht in der Sächsischen Schweiz. Leipzigs Termin? Der Leipziger Termin? Der Cospudener Termin?')));
    const known = knownForms(build('x').ctx, 'a1.1', 1);
    for (const w of ['leipzig', 'leipzigs', 'leipziger', 'cospudener', 'sächsische', 'sächsischen', 'schweiz', 'schweizer']) assert.ok(known.has(w), w);
  });
  test('fail: a name before its level, and a name that is not listed at all', async () => {
    assertFail(await rule('LEX-03', build('Der Termin ist in Plagwitz.')), /Plagwitz/);
    assertFail(await rule('LEX-03', build('Der Termin ist in Leipzig.', [])), /Leipzig/);
  });
  test('precedence: a name some lexicon allocates to a later unit is unknown before that unit', () => {
    const later = [lx('lx.deutschland', 'Deutschland', 'NOUN', 'a1.1-u05', { article: 'das', plural: null, plural_kind: 'singular-only' })];
    const { ctx } = build('x', NAMES, later);
    assert.ok(!knownForms(ctx, 'a1.1', 1).has('deutschland'));
    assert.ok(knownForms(ctx, 'a1.1', 5).has('deutschland'));
    assert.ok(knownForms(ctx, 'a1.1', 1).has('leipzig'), 'unallocated names stay known');
  });
  test('a cast member’s name is known in the genitive too („Priyas Praktikum")', () => {
    const { ctx } = build('x', []);
    ctx.registries.casts = { members: new Map([['cast.priya', { member: { name: 'Priya Nair', from: 'Kochi, Indien' } }]]), relations: [], files: [] };
    const known = knownForms(ctx, 'a1.1', 1);
    for (const w of ['priya', 'priyas', 'nair', 'kochi']) assert.ok(known.has(w), w);
    assert.ok(!known.has('kochis'), 'the genitive is for the name, not the place of origin');
  });
  test('the committed registry passes its schema; a duplicate form, an unknown kind or level does not', () => {
    const doc = JSON.parse(readFileSync(join(REPO, 'content', 'course-v2', 'registries', 'names.json'), 'utf8'));
    assert.deepEqual(check(KINDS.names.schema, doc), []);
    assert.ok(doc.names.some((n) => n.form === 'Leipzig' && n.level === 'a1.1'));
    const bad = { ...doc, names: [...doc.names, { form: 'Leipzig', kind: 'city', level: 'a3.1' }] };
    const errs = check(KINDS.names.schema, bad).map((e) => `${e.path} ${e.message}`).join('\n');
    for (const re of [/listed twice/, /place\|person\|org\|brand\|event/, /re\(LEVEL\)/]) assert.match(errs, re);
    assert.equal(kindOf(doc, '/x/registries/names.json').kind, 'names');
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

// ── rail fixes from the u04 reviews (rule-smith 2026-09-27, BLUEPRINT §9.4) ─────────────────────

const REAL_DETECTORS = JSON.parse(readFileSync(DETECTORS, 'utf8')).detectors;
const det = (id) => REAL_DETECTORS.find((d) => d.id === id);
const hits = (id, s, lexicon = []) => detectInText(det(id), s, buildLexEnv(lexicon)).length;

describe('ITM-13 audio keys (a2.2-u04 r3 F02, a1.1-u04 r2 F01, a1.2-u04 r1 F01, a2.1-u04 r3 F08)', () => {
  const src = (mutate) => ex((p) => mutate(step(p, 0).input.lines.find((l) => l.id === 'a2.1-u07-ls1-l05')));
  test('pass: the example (its spoken number words fold to the key digits; long sources are advisories)', async () => {
    const r = await rule('ITM-13', ex());
    assertPass(r);
    assert.ok(r.findings.every((f) => f.severity === 'advisory' && /should hold ≤ 12 words/.test(f.message)), messages(r));
  });
  test('pass: an ellipsis in a dictation source is folded', async () => assertPass(await rule('ITM-13', src((l) => { l.de = 'Mir wird schlecht… und ein bisschen kalt.'; delete l.say; }))));
  test('fail: a dictation key with a character no checker folds', async () => assertFail(await rule('ITM-13', src((l) => { l.de = 'Das sind 10 % (netto).'; delete l.say; })), /„%" „\(" „\)"/));
  test('fail: the audio says what the key does not (say „eins neunzehn" for „1,19 Euro")', async () => assertFail(await rule('ITM-13', src((l) => { l.de = 'Die Milch kostet heute nur 1,19 Euro.'; l.say = 'Die Milch kostet heute nur eins neunzehn.'; })), /graded WRONG/));
  test('pass: say with number words for the digits of de', async () => assertPass(await rule('ITM-13', src((l) => { l.de = 'Ich bin um 9 Uhr da.'; l.say = 'Ich bin um neun Uhr da.'; }))));
  test('advisory: a 17-word, 3-sentence source at A2', async () => {
    const r = await rule('ITM-13', src((l) => { l.de = 'Hallo Priya, hier ist Anna aus dem Büro. Ich komme heute später. Bitte ruf mich morgen früh noch einmal an.'; delete l.say; }));
    assertPass(r);
    assert.ok(r.findings.some((f) => f.severity === 'advisory' && /ls1-l05: 20 words in 3 sentence/.test(f.message)), messages(r));
  });
  test('fail: a Frage/Aussage item whose played text contradicts its key (a1.2-u04 r1 F01)', async () => {
    const add = (answer, speak) => (p) => { step(p, 0).inputItems.push({ id: 'a2.1-u07-ls1-i09', type: 'listen_select', role: 'input', topic: 'aussprache', promptDe: 'Frage oder Aussage?', options: ['Frage', 'Aussage'], answer, accepted: [answer], speak, explanation: { de: 'x', en: 'x' }, origin: 'agent' }); };
    assertFail(await rule('ITM-13', ex(add('Frage', 'Sie kommen morgen.'))), /is not a question/);
    assertPass(await rule('ITM-13', ex(add('Frage', 'Sie kommen morgen?'))));
    assertFail(await rule('ITM-13', ex(add('Aussage', 'Kommen Sie morgen?'))), /is a question/);
  });
});

describe('ITM-07 a dictation with a number carries exact: number (a2.2-u04 r2 F07 / r3 F04)', () => {
  const dict = (exact) => (p) => {
    const c = p.unit.check.items.find((i) => i.id === 'a2.1-u07-c06');
    c.answer = 'Bitte rufen Sie mich in zehn Minuten zurück.';
    c.accepted = [c.answer];
    if (exact) c.exact = exact;
  };
  test('fail: a number word without exact', async () => assertFail(await rule('ITM-07', ex(dict(null))), /whole-sentence mode/));
  test('fail: exact name on it', async () => assertFail(await rule('ITM-07', ex(dict('name'))), /has exact: "name"/));
  test('pass: exact number', async () => assertPass(await rule('ITM-07', ex(dict('number')))));
});

describe('GRM-05 / ITM-11 a form is never denied the ending it has (a2.2-u04 r1 F02, r2 F02, r3 F03)', () => {
  test('fail: the rc.werden-vollverb wording, de and en', async () => {
    const r = await rule('GRM-05', ex((p) => {
      p.ruleCard.de = 'Die Formen sind unregelmäßig. Achtung: du wirst und er wird – ohne d am Ende.';
      p.ruleCard.en = 'Irregular forms: du wirst, er wird (no -d).';
    }));
    assertFail(r, /cards\[0\]\.de „wird" is paired with „ohne d"/);
    assertFail(r, /cards\[0\]\.en „wird" is paired with „no -d"/);
  });
  test('fail: a pronoun-only claim its own table contradicts', async () => assertFail(await rule('GRM-05', ex((p) => {
    p.ruleCard.de = 'Er/sie/es – ohne d.';
    p.ruleCard.table = [['Person', 'werden'], ['er/sie/es', 'wird']];
  })), /„wird" is paired with „ohne d"/));
  test('pass: the corrected wording', async () => assertPass(await rule('GRM-05', ex((p) => {
    p.ruleCard.de = 'Achtung: du wirst – ohne d; er/sie/es wird – mit d, aber ohne t.';
    p.ruleCard.en = 'Note: du wirst (no d); er/sie/es wird (with d, no t).';
  }))));
  test('fail: an item explanation „es wird – ohne d"; pass: „mit d, aber ohne t"', async () => {
    assertFail(await rule('ITM-11', ex((p) => { step(p, 0).pool.items[0].explanation = { de: 'es wird – ohne d.', en: 'es wird (no d).' }; })), /explanation\.de „wird"/);
    assertPass(await rule('ITM-11', ex((p) => { step(p, 0).pool.items[0].explanation = { de: 'es wird – mit d am Ende, aber ohne t.', en: 'es wird – with d at the end, but no t.' }; })));
  });
});

describe('LEX-05 names the owner; another level\'s lemma is no new word (a2.2-u04 r2 F01 / r3 F01)', () => {
  test('a lemma the lexicon allocates and the spec omits names lexicon.json and the unit file', async () => {
    const r = await rule('LEX-05', ex((p) => { p.unit.spec.lexiconBlocks[0].lemmas.shift(); }));
    assertFail(r, /fixture:a2\.1\/lexicon\.json allocates to a2\.1-u07.*owner: the lexicon owner/);
  });
  test('with a specs.json that agrees with the lexicon, the unit author is named first', async () => {
    const b = ex((p) => { p.unit.spec.lexiconBlocks[0].lemmas.shift(); });
    const full = exampleContext().parts.unit;
    b.ctx.levels.get('a2.1').specs.set(7, { id: 'a2.1-u07', spec: full.spec });
    assertFail(await rule('LEX-05', b), /and a2\.1\/specs\.json allocate.*owner: the unit author adds them/);
  });
  test('fail: an earlier level\'s lemma listed as new; pass: a promotion to this unit', async () => {
    const withA12 = (promote) => {
      const b = ex((p) => { p.unit.spec.lexiconBlocks[0].lemmas.push('lx.treffpunkt'); });
      ingest(b.ctx, { $schema: 'course-v2/lexicon@1', level: 'a1.2', entries: [{ id: 'lx.treffpunkt', lemma: 'Treffpunkt', pos: 'NOUN', article: 'der', plural: 'Treffpunkte', plural_kind: 'regular', role: 'receptive', unit: 'a1.2-u05', block: 1, list_ref: 'A1', gloss: { en: 'meeting point' }, example: 'Der Treffpunkt ist hier.', wordId: null }] }, 'fixture:a1.2/lexicon.json');
      if (promote) b.ctx.levels.get('a2.1').lexicon.promotions = [{ lemma: 'lx.treffpunkt', from: 'receptive', to: 'productive', unit: 'a2.1-u07' }];
      return b;
    };
    assertFail(await rule('LEX-05', withA12(false)), /lx\.treffpunkt is allocated at a1\.2.*review word/);
    const r = await rule('LEX-05', withA12(true));
    assert.ok(!r.findings.some((f) => /treffpunkt/.test(f.message)), messages(r));
  });
});

describe('LEX-07 a lexicon example stays under its unit\'s grammar ceiling (a2.2-u04 r2 F01 / r3 F01)', () => {
  const entlang = (p) => p.extraSpine.push({ id: 'g.praep-entlang-herum', label: 'Präpositionen entlang, um … herum', intro: { receptive: 'b1.2-u09', productive: 'b1.2-u09' }, detectors: ['det.praeposition-entlang'], errorTags: [], lehrwerk: [], consensus: 'strong', ruleCards: [], inventory: [] });
  test('fail: „Der Weg geht immer am Fluss entlang." at a2.1-u07', async () => assertFail(await rule('LEX-07', ex((p) => { entlang(p); p.lexicon[0].example = 'Der Weg geht immer am Fluss entlang.'; })), /entries\[0\]\.example.*„entlang".*b1\.2-u09.*owner: the lexicon owner/));
  test('pass: an example without it', async () => assertPass(await rule('LEX-07', ex((p) => { entlang(p); p.lexicon[0].example = 'Am Fluss machen wir ein Picknick.'; }))));
});

describe('GRM-04: forms a licensed spine point lists are licensed (orchestrator: g.praeteritum-kernverben)', () => {
  const build = (unitId) => {
    const ctx = emptyContext({ root: null, today: '2026-09-27' });
    ingest(ctx, { $schema: 'course-v2/spine@1', points: [
      { id: 'g.praeteritum', label: 'Präteritum (kam, ging, sagte, fand)', intro: { receptive: 'a2.1-u11', productive: 'b1.1-u01' }, detectors: ['det.praeteritum-vollverb'], errorTags: [], lehrwerk: [], consensus: 'split', ruleCards: [], inventory: [] },
      { id: 'g.praeteritum-kernverben', label: 'Präteritum häufiger Verben beim Erzählen: kam, sagte, es gab (Als ich nach Wien kam, gab es noch keinen Kurs.)', intro: { receptive: 'a2.2-u01', productive: 'a2.2-u01' }, detectors: [], errorTags: [], lehrwerk: [], consensus: 'single', ruleCards: [], inventory: [] },
    ] }, 'fixture:grammar-spine.json');
    addDetectors(ctx, [det('det.praeteritum-vollverb')], 'detectors.json');
    const [level, nr] = [unitId.slice(0, 4), Number(unitId.slice(-2))];
    const line = 'Gestern kam Tomasz spät, und er sagte nichts.';
    const doc = addDoc(ctx, 'unit', { $schema: 'course-v2/unit@1', id: unitId, level, nr, stage: 'T', spec: { grammar: { new: [], chunk: [], review: [] } }, steps: [{ id: `${unitId}-ls1`, kind: 'situation', modelSentence: line, input: { kind: 'dialog', lines: [{ id: `${unitId}-ls1-l01`, speaker: 'cast.priya', de: line }] } }] }, `fixture:${level}/units/u${String(nr).padStart(2, '0')}.json`, { target: true });
    return { ctx, docs: [doc], levels: [ctx.levels.get(level)] };
  };
  test('pass: „kam", „sagte" in an input and a model sentence at a2.2-u02 (after g.praeteritum-kernverben)', async () => assertPass(await rule('GRM-04', build('a2.2-u02'))));
  test('fail: the same line at a2.1-u07 (receptive Präteritum only from a2.1-u11)', async () => assertFail(await rule('GRM-04', build('a2.1-u07')), /kam/));
  test('a form outside the point\'s list still blocks production at a2.2-u02 („ging", productive from b1.1-u01)', async () => {
    const b = build('a2.2-u02');
    b.docs[0].data.steps[0].modelSentence = 'Gestern ging Tomasz früh.';
    assertFail(await rule('GRM-04', b), /modelSentence.*ging/);
  });
});

describe('GRM-04 reads strategy cards and rule-card prose as metalanguage (advisory; a2.1-u04 r2 F07 / F10)', () => {
  const later = (p) => p.extraSpine.push({ id: 'g.praeteritum-vollverben', label: 'Präteritum', intro: { receptive: 'b1.1-u02', productive: 'b1.1-u03' }, detectors: ['det.praeteritum-vollverb'], errorTags: [], lehrwerk: [], consensus: 'strong', ruleCards: [], inventory: [] });
  test('a later construction on a strategy card is an advisory, never a blocker', async () => {
    const r = await rule('GRM-04', ex((p) => { later(p); step(p, 3).strategyCards[0].de = 'Früher ging man zuerst zur Frage.'; }));
    assertPass(r);
    assert.ok(r.findings.some((f) => f.severity === 'advisory' && /strategyCards\[0\]\.de/.test(f.path)), messages(r));
  });
});

describe('detector engine: review fixtures (a1.1 r1 F24 / r2 F11, a1.2 r1 F27, a2.1 r1/r2, a2.2 r1-r3, b1.1 r1 F08/F17, b1.2 r1 F26)', () => {
  const haben = (lemma, part, extra = {}) => ({ lemma, pos: 'VERB', verb_forms: { '3sg': 'x', perfekt: `hat ${part}` }, ...extra });
  test('sein + a lexicalised state is no Zustandspassiv and no Perfekt (the task\'s set phrases)', () => {
    const lex = [haben('enthalten', 'enthalten'), haben('öffnen', 'geöffnet'), haben('verletzen', 'verletzt'), haben('einreichen', 'eingereicht', { separable: true })];
    for (const s of ['Der Kaffee ist im Preis enthalten.', 'Das Amt ist geöffnet.', 'Wie viele Personen sind verletzt?', 'Der Laden ist geschlossen.']) {
      assert.equal(hits('det.zustandspassiv', s, lex), 0, s);
      assert.equal(hits('det.perfekt-trennbar-untrennbar', s, lex), 0, s);
    }
    assert.ok(hits('det.zustandspassiv', 'Der Antrag ist eingereicht.', lex), 'a real Zustandspassiv still hits');
    assert.deepEqual(LEXICALISED_STATES, ['enthalten', 'geöffnet', 'geschlossen', 'verheiratet', 'geschieden', 'verletzt', 'gebrochen']);
  });
  test('a participle with its own ADJ entry is predicative; a conjunct with its own auxiliary is its own clause', () => {
    const lex = [haben('beschädigen', 'beschädigt'), { lemma: 'beschädigt', pos: 'ADJ' }, haben('verletzen', 'verletzt'), { lemma: 'ausrutschen', pos: 'VERB', separable: true, verb_forms: { '3sg': 'rutscht aus', perfekt: 'ist ausgerutscht' } }];
    assert.equal(hits('det.zustandspassiv', 'Das Gerät ist beschädigt.', lex), 0);
    assert.equal(hits('det.zustandspassiv', 'Sie ist ausgerutscht und hat sich am Fuß verletzt.', lex), 0);
    assert.ok(hits('det.perfekt-haben', 'Sie ist ausgerutscht und hat sich am Fuß verletzt.', lex));
    assert.ok(hits('det.perfekt-haben', 'Ich habe Brot und Käse gekauft.', [haben('kaufen', 'gekauft')]), '„und" inside one conjunct does not split it');
  });
  test('overlays: konjunktiv1, modal particles, zero-article adjectives, „ein bisschen"', () => {
    assert.equal(hits('det.konjunktiv1', 'Am Samstag arbeite ich.'), 0);
    assert.equal(hits('det.konjunktiv1', 'Den Bus brauche ich.'), 0);
    assert.ok(hits('det.konjunktiv1', 'Er sagt, er komme morgen.'));
    assert.equal(hits('det.modalpartikeln', 'Können Sie noch mal kommen?'), 0);
    assert.equal(hits('det.modalpartikeln', 'Das ist mal wieder typisch.'), 0);
    assert.ok(hits('det.modalpartikeln', 'Könnten Sie mal kurz helfen?'));
    assert.equal(hits('det.adjektiv-endung-nullartikel', 'Ich suche für eine Wohnung einen Tisch.'), 0);
    assert.equal(hits('det.adjektiv-endung-nullartikel', 'Dann kommen Sie auf unser Boot!'), 0);
    assert.ok(hits('det.adjektiv-endung-nullartikel', 'Bei gutem Wetter gehen wir spazieren.'));
    assert.equal(hits('det.adjektiv-endung-unbestimmt', 'Ich möchte ein bisschen Käse.'), 0);
    assert.equal(hits('det.unbestimmter-artikel', 'Ich möchte ein bisschen Käse.'), 0);
    assert.ok(hits('det.unbestimmter-artikel', 'Ich möchte einen Apfel.'));
    for (const id of Object.keys(DETECTOR_OVERLAYS)) assert.ok(det(id), `overlay for a detector the registry does not have: ${id}`);
  });
  test('engine: a number opens no imperative; a quoted „Wer …" clause is read; „verboten" is a participle', () => {
    assert.equal(hits('det.imperativ-du-ihr', '300 Gramm, bitte.'), 0);
    assert.ok(hits('det.imperativ-du-ihr', 'Kauf bitte Milch!', [{ lemma: 'kaufen', pos: 'VERB', verb_forms: { '3sg': 'kauft', perfekt: 'hat gekauft' } }]));
    assert.ok(hits('det.relativsatz-wer', '„Wer ein kaputtes Gerät hat, soll anrufen.“'));
    assert.equal(hits('det.praeteritum-vollverb', 'Parken verboten!', [{ lemma: 'verbieten', pos: 'VERB', verb_forms: { '3sg': 'verbietet', praet: 'verbot', perfekt: 'hat verboten' } }]), 0);
    assert.ok(hits('det.praeteritum-vollverb', 'Er verbot es.', [{ lemma: 'verbieten', pos: 'VERB', verb_forms: { '3sg': 'verbietet', praet: 'verbot', perfekt: 'hat verboten' } }]));
  });
});

describe('the tokenizer reads every letter (orchestrator: Café, Sprachcafé, Repair-Café)', () => {
  test('é, è, à, ç, ñ are letters', () => {
    assert.deepEqual(tokens('Im Sprachcafé und im Repair-Café, à la carte, Señor.').map((t) => t.text), ['Im', 'Sprachcafé', 'und', 'im', 'Repair-Café', 'à', 'la', 'carte', 'Señor']);
  });
  test('LEX-03: „Café" is known once the lexicon allocates it', async () => {
    const build = (answer) => lexCtx({
      lexicon: { 'a1.1': [lx('lx.cafe', 'Café', 'NOUN', 'a1.1-u01', { article: 'das', plural: 'Cafés', plural_kind: 'regular' }), lx('lx.termin', 'Termin', 'NOUN', 'a1.1-u01', { article: 'der', plural: 'Termine', plural_kind: 'regular' })] },
      unit: { $schema: 'course-v2/unit@1', id: 'a1.1-u01', level: 'a1.1', nr: 1, stage: 'I', spec: { grammar: { new: [], chunk: [], review: [] } }, steps: [{ id: 'a1.1-u01-ls1', pool: { items: [{ id: 'a1.1-u01-ls1-p01', type: 'fill_blank', answer }] } }] },
    });
    assertPass(await rule('LEX-03', build('Der Termin ist im Café.')));
  });
});

describe('ITM-09 tile orders and question prompts (a1.1 r1 F01/F04, a1.2 r1 F12, a2.1 r3 F01, b1.2 r1 F10, b2.1 r1 F04, b2.2 r1 F15)', () => {
  const sb = (tiles, answer, accepted, promptDe = 'Bilden Sie den Satz.') => (p) => {
    Object.assign(step(p, 0).pool.items.find((i) => i.id === 'a2.1-u07-ls1-p05'), { tiles, answer, accepted, promptDe });
  };
  test('fail: a question built under „Bilden Sie den Satz."; pass: „Bilden Sie die Frage."', async () => {
    assertFail(await rule('ITM-09', ex(sb(['melden', 'Sie', 'sich', 'morgen'], 'Melden Sie sich morgen?', ['Melden Sie sich morgen?']))), /is a question/);
    assertPass(await rule('ITM-09', ex(sb(['melden', 'Sie', 'sich', 'morgen'], 'Melden Sie sich morgen?', ['Melden Sie sich morgen?'], 'Bilden Sie die Frage.'))));
  });
  test('fail: a frontable phrase the item does not accept; pass once accepted or the prompt fixes the first tile', async () => {
    const tiles = ['ich', 'melde', 'mich', 'am Nachmittag'];
    assertFail(await rule('ITM-09', ex(sb(tiles, 'Ich melde mich am Nachmittag.', ['Ich melde mich am Nachmittag.']))), /„Am Nachmittag melde ich mich\."/);
    assertPass(await rule('ITM-09', ex(sb(tiles, 'Ich melde mich am Nachmittag.', ['Ich melde mich am Nachmittag.', 'Am Nachmittag melde ich mich.']))));
    assertPass(await rule('ITM-09', ex(sb(tiles, 'Ich melde mich am Nachmittag.', ['Ich melde mich am Nachmittag.'], 'Beginnen Sie mit „ich“.'))));
  });
  test('Mittelfeld: [wir, haben, zu Hause, welche] owes „Wir haben welche zu Hause."; [ich, habe, leider, keinen] owes no „keinen leider"', async () => {
    assertFail(await rule('ITM-09', ex(sb(['wir', 'haben', 'zu Hause', 'welche'], 'Wir haben zu Hause welche.', ['Wir haben zu Hause welche.', 'Zu Hause haben wir welche.']))), /„Wir haben welche zu Hause\."/);
    assertPass(await rule('ITM-09', ex(sb(['ich', 'habe', 'leider', 'keinen'], 'Ich habe leider keinen.', ['Ich habe leider keinen.', 'Leider habe ich keinen.']))));
  });
  test('Mittelfeld: a sentence adverb and a full noun-phrase subject stand either way round', async () => {
    const tiles = ['heute', 'hat', 'die Firma', 'leider', 'geschlossen'];
    const base = ['Heute hat die Firma leider geschlossen.', 'Die Firma hat heute leider geschlossen.', 'Leider hat die Firma heute geschlossen.'];
    assertFail(await rule('ITM-09', ex(sb(tiles, base[0], base))), /„Heute hat leider die Firma geschlossen\."/);
  });
  test('the orders module leaves clause-combining items alone', () => {
    assert.deepEqual(missingOrders({ tiles: ['der Staubsauger', 'geht', 'aus', 'obwohl', 'ich', 'den Akku aufgeladen habe'], answer: 'Der Staubsauger geht aus, obwohl ich den Akku aufgeladen habe.', accepted: [] }), []);
  });
});

describe('ITM-03 key balance extensions (a1.1 r2 F04, b1.1 r1 F02 / r2 F01, b2.1 r1 F01, b2.2 r1 F01/F02)', () => {
  const block = (p) => step(p, 3).blocks[0].items;
  test('fail: cloze items with three options count in the block balance', async () => assertFail(await rule('ITM-03', ex((p) => {
    for (const it of block(p)) { it.type = 'cloze'; it.answer = it.options[0]; it.accepted = [it.options[0]]; }
  })), /a\/b\/c keys 5\/0\/0/));
  test('fail: three equal keys in a row in an exam block', async () => assertFail(await rule('ITM-03', ex((p) => {
    block(p).forEach((it, i) => { const k = [0, 0, 0, 1, 2][i]; it.answer = it.options[k]; it.accepted = [it.options[k]]; });
  })), /3 equal a\/b\/c keys in a row/));
  test('fail: the key is always the highest number', async () => assertFail(await rule('ITM-03', ex((p) => {
    block(p).forEach((it, i) => {
      const k = [1, 2, 0, 2, 1][i];
      it.options = ['9 Uhr', '10 Uhr', '11 Uhr'];
      it.options.splice(k, 0, it.options.splice(2, 1)[0]);
      it.answer = it.options[k];
      it.accepted = [it.answer];
    });
  })), /the key is the highest option/));
  test('advisory: non-exam keys all at options[0] (the player does not shuffle); the example passes', async () => {
    const r = await rule('ITM-03', ex());
    assertPass(r);
    assert.ok(r.findings.some((f) => f.severity === 'advisory' && /non-exam 3-option keys/.test(f.message)), messages(r));
  });
});

describe('ITM-01 German cues (a1.1 r1 F06, a1.2 r1 F08/F10, a2.2 r2 F04, b1.1 r1 F05, b2.2 r1 F12)', () => {
  const pool0 = (fields) => (p) => { step(p, 0).pool.items[0] = { ...step(p, 0).pool.items[0], options: undefined, exact: undefined, ...fields }; };
  const typed = (promptDe, answer, extra = {}) => pool0({ type: 'fill_blank', promptDe, answer, accepted: [answer], ...extra });
  test('the key copied from the stem, no distractor there (fail); a flyer with every price (pass)', async () => {
    const mc = (promptDe) => pool0({ type: 'multiple_choice', promptDe, options: ['2,50 Euro', '1,90 Euro', '1,19 Euro'], answer: '1,19 Euro', accepted: ['1,19 Euro'] });
    assertFail(await rule('ITM-01', ex(mc('Prospekt: „Butter nur 1,19 Euro“. Was kostet die Butter?'))), /stands in the stem/);
    assertPass(await rule('ITM-01', ex(mc('Prospekt: „Käse 2,50 Euro · Butter 1,19 Euro · Milch 1,90 Euro“. Was kostet die Butter?'))));
  });
  test('a cue only promptEn gives (fail) or promptDe carries too (pass)', async () => {
    assertFail(await rule('ITM-01', ex(typed('Können Sie das wiederholen? Höflicher: ___ Sie das bitte wiederholen?', 'Könnten', { promptEn: 'the polite form of können' }))), /promptEn names „können" as the cue/);
    assertPass(await rule('ITM-01', ex(typed('Können Sie das wiederholen? Höflicher: ___ Sie das bitte wiederholen? (können)', 'Könnten', { promptEn: 'the polite form of können' }))));
  });
  test('an ordinal word key: fail without „Wort", digits or exact; pass with exact: number', async () => {
    assertFail(await rule('ITM-01', ex(typed('Der 3. Juni ist ein Mittwoch. Der ___ Juni ist ein Donnerstag.', 'vierte'))), /ordinal word/);
    assertPass(await rule('ITM-01', ex(typed('Der 3. Juni ist ein Mittwoch. Der ___ Juni ist ein Donnerstag.', 'vierte', { exact: 'number' }))));
  });
  test('first letters with underscores show the exact count', async () => {
    assertFail(await rule('ITM-01', ex(typed('Sie haben f________ gehandelt.', 'fahrlässig'))), /shows 9 letters, the key „fahrlässig" has 10/);
    assertPass(await rule('ITM-01', ex(typed('Sie haben f_________ gehandelt.', 'fahrlässig'))));
  });
  test('a preposition phrase the prompt does not give (fail); cued (pass); framed by „gegenüber ___" (pass)', async () => {
    assertFail(await rule('ITM-01', ex(typed('Emre wartet ___ Brücke auf den Krankenwagen.', 'an der'))), /preposition „an"/);
    assertPass(await rule('ITM-01', ex(typed('Emre wartet ___ Brücke auf den Krankenwagen. (an)', 'an der'))));
    assertPass(await rule('ITM-01', ex(typed('Die Tankstelle ist gegenüber ___ Rathaus.', 'vom'))));
  });
  test('an open sentence-adverb gap blocks; an open noun gap is an advisory', async () => {
    assertFail(await rule('ITM-01', ex(typed('Ich habe drei E-Mails geschrieben. ___ habe ich keine Antwort bekommen.', 'Trotzdem'))), /sentence-adverb gap/);
    assertPass(await rule('ITM-01', ex(typed('Ich habe drei E-Mails geschrieben. ___ habe ich keine Antwort bekommen. (trotzdem / deshalb)', 'Trotzdem'))));
    const r = await rule('ITM-01', ex(typed('Die Firma schickt uns ein ___ über den Schaden.', 'Gutachten')));
    assertPass(r);
    assert.ok(r.findings.some((f) => f.severity === 'advisory' && /open noun gap/.test(f.message)), messages(r));
  });
});

describe('ITM-10 contractions and „gegenüber" (a2.2-u04 r1 F03 / F05)', () => {
  const unit = (ecAccepted, gapAccepted) => (p) => {
    Object.assign(step(p, 0).pool.items[0], { type: 'fill_blank', promptDe: 'Ich gehe ___ Post.', answer: 'zur', accepted: gapAccepted });
    const c = p.unit.check.items.find((i) => i.id === 'a2.1-u07-c08');
    Object.assign(c, { answer: 'Ich gehe heute zur Post.', accepted: ecAccepted, promptDe: 'Korrigieren Sie: „Ich gehe heute zu die Post.“' });
  };
  test('fail: the unit accepts „zu der", the correction not', async () => assertFail(await rule('ITM-10', ex(unit(['Ich gehe heute zur Post.'], ['zur', 'zu der']))), /must accept „Ich gehe heute zu der Post\."/));
  test('pass: both accept it', async () => assertPass(await rule('ITM-10', ex(unit(['Ich gehe heute zur Post.', 'Ich gehe heute zu der Post.'], ['zur', 'zu der'])))));
  test('fail / pass: „gegenüber ___" keyed „vom" owes the bare dative', async () => {
    const g = (accepted) => (p) => Object.assign(step(p, 0).pool.items[0], { type: 'fill_blank', promptDe: 'Die Tankstelle ist gegenüber ___ Rathaus.', answer: 'vom', accepted });
    assertFail(await rule('ITM-10', ex(g(['vom']))), /bare dative „dem"/);
    assertPass(await rule('ITM-10', ex(g(['vom', 'dem']))));
  });
});

describe('ITM-02 a plural antecedent (a2.1-u04 r2 F02)', () => {
  const mc = (promptDe) => (p) => {
    const it = step(p, 0).inputItems.find((i) => i.type === 'multiple_choice');
    Object.assign(it, { promptDe, options: ['welche', 'eine', 'eins'], answer: 'welche', accepted: ['welche'] });
  };
  test('fail: „Ja, wir haben ___." admits „eine"', async () => assertFail(await rule('ITM-02', ex(mc('„Haben wir noch Tassen? – Ja, wir haben ___.“'))), /nothing in the frame fixes the plural/));
  test('pass: a plural copula fixes it', async () => assertPass(await rule('ITM-02', ex(mc('„Haben wir noch Tassen? – Ja, im Schrank sind noch ___.“')))));
});

describe('EXM-01 the example uses up an option (a2.2-u04 r1 F10, r2 F13, r3 F10; advisory until SCHEMA ExamBlock.example)', () => {
  test('advisory when the template says so and the block leaves the wrong number unused', async () => {
    const with_ = await rule('EXM-01', choiceContext((p) => { p.templates.lv3.source = `${p.templates.lv3.source}; die Anzeige aus dem Beispiel ist verbraucht`; }));
    assertPass(with_);
    assert.ok(with_.findings.some((f) => f.severity === 'advisory' && /the example uses one up/.test(f.message)), messages(with_));
    const without = await rule('EXM-01', choiceContext());
    assert.ok(!without.findings.some((f) => /the example uses one up/.test(f.message)));
  });
});

describe('EXM-03 one number on the screen; cues (a1.1-u04 r2 F05, b1.1-u04 r2 F08)', () => {
  test('fail: the task line says another band than the player shows; the model text outside it', async () => {
    assertFail(await rule('EXM-03', ex((p) => { step(p, 5).task.wordBandLearning = [20, 30]; })), /„30 bis 40 Wört" — the band the player shows is 20–30/);
    assertFail(await rule('EXM-03', ex((p) => { step(p, 5).task.modelText = `${step(p, 5).task.modelText} ${'Viele Grüße und bis bald. '.repeat(3)}`; })), /model text of \d+ words outside/);
  });
  test('pass: an exam figure named as the exam („Prüfung: mindestens 30")', async () => assertPass(await rule('EXM-03', ex((p) => { step(p, 5).task.checklist.push('Prüfung: mindestens 30 Wörter'); }))));
  test('advisory: a two-letter cue (the SCHEMA exemplar\'s „am")', async () => {
    const r = await rule('EXM-03', ex());
    assert.ok(r.findings.some((f) => f.severity === 'advisory' && /cue „am" has 2 letters/.test(f.message)), messages(r));
  });
});

describe('EXM-04 cards, calendars, tb1.m2 (a2.1-u04 r1, a2.2-u04 r1 F07, b1.1-u04 r2 F02)', () => {
  test('fail: a ga2.sp1 card with a topic prefix; advisory: the exemplar\'s Thema', async () => {
    assertFail(await rule('EXM-04', ex((p) => { step(p, 4).task.cards.learner[0] = 'Thema Arbeit: Arbeitszeit?'; })), /no topic prefix/);
    const r = await rule('EXM-04', ex());
    assert.ok(r.findings.some((f) => f.severity === 'advisory' && /has no Thema/.test(f.message)), messages(r));
  });
  test('calendars: exactly one common free window of ≥ 90 minutes', async () => {
    const cal = (mine, theirs) => (p) => {
      step(p, 4).task.template = 'ga2.sp3'; // not in the §15 lane excerpt: only the calendar rule speaks
      step(p, 4).task.stimulus = { kind: 'calendar', de: 'Ihr Kalender: Sonntag', items: mine };
      step(p, 4).task.partnerData = { kind: 'calendar', de: 'Kalender: Sonntag', items: theirs };
    };
    const mine = ['8.00–9.30 Uhr: joggen', '11.00–13.00 Uhr: helfen', '13.00–14.00 Uhr: essen', '17.30–19.00 Uhr: lernen', '19.00–20.00 Uhr: aufräumen'];
    const theirs = ['8.00–10.00 Uhr: Frühstück', '10.00–12.00 Uhr: Schwimmkurs', '12.00–14.00 Uhr: Mittagessen', '17.00–18.30 Uhr: Hausaufgaben', '18.30–20.00 Uhr: Abendessen'];
    assertPass(await rule('EXM-04', ex(cal(mine, theirs))));
    const two = [['8.00–9.00 Uhr: a', '12.00–13.00 Uhr: b', '13.00–14.00 Uhr: c', '18.00–19.00 Uhr: d', '19.00–20.00 Uhr: e'], ['8.00–9.00 Uhr: f', '9.00–9.30 Uhr: g', '12.00–12.30 Uhr: h', '18.00–18.30 Uhr: i', '19.00–20.00 Uhr: j']];
    assertFail(await rule('EXM-04', ex(cal(...two))), /2 common free windows/);
    assertFail(await rule('EXM-04', ex(cal(mine.slice(0, 3), theirs))), /timed entries/);
  });
  test('tb1.m2: the learner\'s sheet holds one quote', async () => {
    const b = ex((p) => {
      Object.assign(step(p, 4).task, { template: 'tb1.m2', mode: 'discuss', stimulus: { kind: 'quotes', de: 'Thema', items: ['Meine Meinung.', 'Die Meinung der Partnerin.'] } });
    });
    ingest(b.ctx, JSON.parse(readFileSync(join(REPO, 'content', 'course-v2', 'registries', 'lanes', 'tb1.json'), 'utf8')), 'registries/lanes/tb1.json');
    assertFail(await rule('EXM-04', b), /2 quotes on the learner's sheet/);
  });
});

describe('LEX rails: cliffhanger, compounds, zero occurrences, generator sources, plural glosses', () => {
  test('LEX-01 reads story.cliffhanger (advisory)', async () => {
    const r = await rule('LEX-01', ex((p) => { p.unit.story.cliffhanger = 'Quartiersmanagement Zuständigkeitsbereich Verwaltungsvorschrift.'; }));
    assert.ok(r.findings.some((f) => f.path === 'story.cliffhanger' && f.severity === 'advisory'), messages(r));
    assert.ok(!(await rule('LEX-01', ex())).findings.some((f) => f.path === 'story.cliffhanger' && f.severity === 'blocker'), 'never a blocker');
  });
  test('a compound of two known forms is known to LEX-01 (b1.2 r1 F01, b2.2 r1 F05)', () => {
    const known = new Set(['möbel', 'stücke', 'rad', 'tour']);
    assert.equal(coverage('Die Möbelstücke und die Radtour.', new Set([...known, 'die', 'und'])).unknown.length, 0);
    assert.deepEqual(knownCompound('möbelstücke', (w) => known.has(w)), ['möbel', 'stücke']);
    assert.deepEqual(knownCompound('arbeitszeit', (w) => ['arbeit', 'zeit'].includes(w)), ['arbeit', 'zeit'], 'linking s');
    assert.equal(knownCompound('rechtsbehelf', (w) => known.has(w)), null);
  });
  test('LEX-02: a lemma the unit never uses blocks (a2.2 r1 F08, b1.2 r1 F09)', async () => assertFail(await rule('LEX-02', ex((p) => {
    p.lexicon.push({ ...p.lexicon[0], id: 'lx.zzz-test', lemma: 'Quittung', plural: 'Quittungen', role: 'receptive' });
    p.unit.spec.lexiconBlocks[0].lemmas.push('lx.zzz-test');
  })), /„Quittung" is allocated to a2\.1-u07 but occurs in none/));
  test('LEX-03: a receptive lemma as a lex.articlePlural source is an advisory (a2.1 r2 F09, minor)', async () => {
    const r = await rule('LEX-03', ex((p) => { step(p, 0).pool.generators.find((g) => g.generator === 'lex.articlePlural').source = ['lx.leitung']; }));
    assertPass(r);
    assert.ok(r.findings.some((f) => f.severity === 'advisory' && /lx\.leitung is receptive/.test(f.message)), messages(r));
    const ok = await rule('LEX-03', ex());
    assert.ok(!ok.findings.some((f) => /makes the learner write/.test(f.message)), 'productive sources pass');
  });
  test('LEX-07: a plural token glossed in the singular is an advisory (a1.1 r1 F21)', async () => {
    const r = await rule('LEX-07', ex((p) => { step(p, 0).input.glosses = [{ token: 'Anrufe', gloss: { en: 'phone call' } }]; }));
    assert.ok(r.findings.some((f) => f.severity === 'advisory' && /plural of Anruf/.test(f.message)), messages(r));
  });
});

describe('TXT-02, CON-06, GRM-02, GRM-04, ALL-02, COV-3, ITM-04 rail extensions', () => {
  test('TXT-02 applies the tolerance once where the template says its band has it (a1.1 r1 F10, a1.2 r1 F26)', async () => {
    const long = (p) => { const t = step(p, 3).texts[0]; t.lines = [{ ...t.lines[0], de: `${'Das ist ein Test. '.repeat(16)}` }]; delete t.lines[0].say; };
    assertPass(await rule('TXT-02', ex(long)));
    assertFail(await rule('TXT-02', ex((p) => { long(p); p.ga2Lane.teile.h1.source = `${p.ga2Lane.teile.h1.source}; Band ±15 %`; })), /already in the band/);
  });
  test('CON-06: an exception without a source of its own is an advisory', async () => {
    const r = await rule('CON-06', ex((p) => { p.unit.facts[0].exceptions = [{ de: 'Für manche Berufe gilt etwas anderes.', en: 'Some jobs differ.' }]; }));
    assertPass(r);
    assert.ok(r.findings.some((f) => /exceptions\[0\]/.test(f.path) && f.severity === 'advisory'), messages(r));
    const ok = await rule('CON-06', ex());
    assert.ok(!ok.findings.some((f) => /exceptions/.test(f.path)), 'a law name or § counts as a source');
  });
  test('GRM-02: a chunk preview is never a Lernschritt structure (a1.2 r1 F06)', async () => assertFail(await rule('GRM-02', ex((p) => {
    p.unit.spec.grammar.review = p.unit.spec.grammar.review.filter((x) => x !== 'g.wenn');
    p.unit.spec.grammar.chunk = ['g.wenn'];
    step(p, 1).structure = 'g.wenn';
  })), /only a chunk preview/));
  test('GRM-04: a declared chunk is presented in an input or Redemittel (a1.1 r1 F05)', async () => {
    const chunk = (p) => { p.unit.spec.grammar.review = p.unit.spec.grammar.review.filter((x) => x !== 'g.wenn'); p.unit.spec.grammar.chunk = ['g.wenn']; };
    const none = (p) => { chunk(p); for (const s of p.unit.steps) for (const l of s.input?.lines || []) l.de = l.de.replace(/\bwenn\b/gi, 'und'); for (const r of p.unit.redemittel || []) r.de = r.de.replace(/\bwenn\b/gi, 'und'); for (const l of p.unit.start.folge.lines) l.de = l.de.replace(/\bwenn\b/gi, 'und'); };
    assertFail(await rule('GRM-04', ex(none)), /declares the chunk g\.wenn/);
    assertPass(await rule('GRM-04', ex((p) => { none(p); p.unit.redemittel[0].de = 'Wenn Sie Zeit haben, rufen Sie mich an.'; })));
  });
  test('ALL-02: a proof key the Check hands out blocks; the exemplar\'s item-proven interaction can-do is an advisory', async () => {
    assertFail(await rule('ALL-02', ex((p) => { p.unit.check.proofItems[0].answer = p.unit.check.items[2].answer; p.unit.check.proofItems[0].options[0] = p.unit.check.items[2].answer; })), /the Check hands the learner the proof/);
    const r = await rule('ALL-02', ex());
    assertPass(r);
    assert.ok(r.findings.some((f) => f.severity === 'advisory' && /interaction-spoken, proven by an item alone/.test(f.message)), messages(r));
  });
  test('ALL-02: a listed text type nothing in the unit has is an advisory (a2.1 r3 F09)', async () => {
    const r = await rule('ALL-02', ex((p) => { p.unit.spec.textTypes.push('tt.radiomeldung'); }));
    assert.ok(r.findings.some((f) => f.severity === 'advisory' && /tt\.radiomeldung is listed/.test(f.message)), messages(r));
  });
  test('COV-3: spec.lanes equals the specs.json entry, and the message names the owner (a2.1 r3 F10)', async () => {
    const b = ex();
    const lanes = JSON.parse(JSON.stringify(b.parts.unit.spec.lanes));
    lanes.pruefungsfokus[0].length = 'reduced';
    b.ctx.levels.get('a2.1').specs.set(7, { id: 'a2.1-u07', spec: { lanes } });
    assertFail(await rule('COV-3', b), /specs\.json \(pruefungsfokus\[0\]\).*curriculum owner/);
    assertPass(await rule('COV-3', ex()));
  });
  test('ITM-04: a strategy card that names a key noun phrase of its step (a2.1-u04 r1)', async () => {
    assertFail(await rule('ITM-04', ex((p) => { step(p, 3).strategyCards[0].de = 'Achten Sie auf Orte, zum Beispiel im Konferenzraum.'; })), /„im konferenzraum", the key of a2\.1-u07-ls4-ga2-h1-03/);
    assertPass(await rule('ITM-04', ex()));
  });
});

describe('GRM-04 review fixtures against the real spine and detectors (a1.1 r1 F24 / r2 F11, a1.2 r1 F27)', () => {
  const real = (unitId, lines) => {
    const ctx = emptyContext({ root: null, today: '2026-09-27' });
    ingest(ctx, JSON.parse(readFileSync(join(REPO, 'content', 'course-v2', 'registries', 'grammar-spine.json'), 'utf8')), 'registries/grammar-spine.json');
    addDetectors(ctx, REAL_DETECTORS, 'registries/detectors.json');
    const [level, nr] = [unitId.slice(0, 4), Number(unitId.slice(-2))];
    const doc = addDoc(ctx, 'unit', { $schema: 'course-v2/unit@1', id: unitId, level, nr, stage: 'S', spec: { grammar: { new: [], chunk: [], review: [] } }, steps: [{ id: `${unitId}-ls1`, kind: 'situation', input: { kind: 'dialog', lines: lines.map((de, i) => ({ id: `${unitId}-ls1-l${String(i + 1).padStart(2, '0')}`, speaker: 'cast.priya', de })) } }] }, `fixture:${level}/units/u${String(nr).padStart(2, '0')}.json`, { target: true });
    return { ctx, docs: [doc], levels: [ctx.levels.get(level)] };
  };
  test('a1.1-u04: „ein bisschen", „Sie möchten", „Das macht zusammen 5 Euro", „300 Gramm, bitte.", „für eine Wohnung" raise nothing', async () => {
    const r = await rule('GRM-04', real('a1.1-u04', ['Ich möchte ein bisschen Käse.', 'Sie möchten Brot?', 'Das macht zusammen 5 Euro.', '300 Gramm, bitte.', 'Das ist gut für eine Wohnung.']));
    assert.equal(r.findings.length, 0, messages(r));
  });
  test('a1.2-u04: „Das Amt ist geöffnet.", „Ich finde das schwer.", „am dritten Juni", „Neu ab 1. Juni" raise nothing', async () => {
    const r = await rule('GRM-04', real('a1.2-u04', ['Das Amt ist geöffnet.', 'Ich finde das schwer.', 'Der Termin ist am dritten Juni.', 'Neu ab 1. Juni.']));
    assert.equal(r.findings.length, 0, messages(r));
  });
});
