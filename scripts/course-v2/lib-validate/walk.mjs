// Walkers over course-v2 documents (SCHEMA §3–§10). Every rule reads content through these, so a
// new place an item, a line, a text or a task can live is added once, here.
//
// A "doc" is `{ kind, file, data, level }` with kind ∈ unit | lanepack | plateau | plateaulanepack |
// closing | mock. Each walker yields `{ …, path }` where `path` is a readable JSON path into `data`.
//
// Exam texts (SCHEMA §3.6) live at step, slot or file level and blocks point at them with
// `textRefs`; the first draft of the schema kept them inside the block (`block.texts`). Both
// shapes are read, so a file written against either validates.

const arr = (x) => (Array.isArray(x) ? x : []);
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const ASSESS_KINDS = new Set(['plateau', 'plateaulanepack', 'closing', 'mock']);

/** A closing/mock/Plateau entry: exam block, writing task or speaking task. */
export function partKind(p) {
  if (!isObj(p)) return null;
  if (Array.isArray(p.items) && (p.template || p.texts || p.textRefs)) return 'block';
  if (Array.isArray(p.leitpunkte) || Array.isArray(p.wordBand) || p.examKey || isObj(p.form)) return 'writing';
  if (Array.isArray(p.parts) || (p.mode && (p.aiRole || p.openingLine || p.cards))) return 'speaking';
  if (p.template && p.bankKey) return p.leitpunkte ? 'writing' : 'speaking';
  return null;
}

/** Steps of a unit with their index. */
export function* walkSteps(doc) {
  if (doc.kind !== 'unit') return;
  const steps = arr(doc.data?.steps);
  for (let i = 0; i < steps.length; i += 1) yield { step: steps[i], index: i, path: `steps[${i}]` };
}

/**
 * Every ExamText of a doc, once: step `texts`, lane-pack slot `texts`, file `texts`, and the
 * draft shape's `block.texts`. `scope` groups the texts a block may refer to.
 */
export function* walkExamTexts(doc) {
  const d = doc.data || {};
  // `ownerBlock` is set for the draft shape only: a text that lives inside its block
  const each = function* (list, path, scope, step, ownerBlock = null) {
    const xs = arr(list);
    for (let i = 0; i < xs.length; i += 1) if (isObj(xs[i])) yield { text: xs[i], path: `${path}[${i}]`, scope, step, ownerBlock };
  };
  if (doc.kind === 'unit') {
    for (const { step, path } of walkSteps(doc)) {
      yield* each(step?.texts, `${path}.texts`, path, step);
      for (const b of arr(step?.blocks).map((x, i) => [x, i])) yield* each(b[0]?.texts, `${path}.blocks[${b[1]}].texts`, `${path}.blocks[${b[1]}]`, step, b[0]);
      if (isObj(step?.examBlock)) yield* each(step.examBlock.texts, `${path}.examBlock.texts`, `${path}.examBlock`, step, step.examBlock);
    }
  } else if (doc.kind === 'lanepack') {
    const ls4 = d.slots?.ls4;
    yield* each(ls4?.texts, 'slots.ls4.texts', 'slots.ls4', null);
    for (const b of arr(ls4?.blocks).map((x, i) => [x, i])) yield* each(b[0]?.texts, `slots.ls4.blocks[${b[1]}].texts`, `slots.ls4.blocks[${b[1]}]`, null, b[0]);
    yield* each(d.slots?.input?.texts, 'slots.input.texts', 'slots.input', null);
    if (isObj(d.slots?.input?.examBlock)) yield* each(d.slots.input.examBlock.texts, 'slots.input.examBlock.texts', 'slots.input.examBlock', null, d.slots.input.examBlock);
  } else if (ASSESS_KINDS.has(doc.kind)) {
    yield* each(d.texts, 'texts', 'file', null);
    const list = doc.kind === 'closing' || doc.kind === 'mock' ? arr(d.parts) : arr(d.examTeile);
    const key = doc.kind === 'closing' || doc.kind === 'mock' ? 'parts' : 'examTeile';
    for (let i = 0; i < list.length; i += 1) yield* each(list[i]?.texts, `${key}[${i}].texts`, `${key}[${i}]`, null, list[i]);
  }
}

/** The ExamTexts a block uses: its own `texts` (draft shape) or its `textRefs` within its scope. */
function resolveBlockTexts(block, scopeTexts, ownPath) {
  if (Array.isArray(block?.texts)) return block.texts.map((t, i) => ({ text: t, path: `${ownPath}.texts[${i}]` })).filter((x) => isObj(x.text));
  const refs = arr(block?.textRefs);
  const out = [];
  for (const r of refs) {
    const hit = scopeTexts.find((x) => x.text.id === r);
    if (hit) out.push(hit);
  }
  return out;
}

/** Exam blocks: LS4, slot-'input' blocks, lane-pack slots, Plateau Teile, closing and mock parts. */
export function* walkBlocks(doc) {
  const d = doc.data || {};
  const all = [...walkExamTexts(doc)];
  const inScope = (scopes) => all.filter((x) => scopes.includes(x.scope));
  if (doc.kind === 'unit') {
    for (const { step, path } of walkSteps(doc)) {
      if (!isObj(step)) continue;
      const blocks = arr(step.blocks);
      for (let b = 0; b < blocks.length; b += 1) {
        const bp = `${path}.blocks[${b}]`;
        yield { block: blocks[b], path: bp, step, source: 'ls4', texts: resolveBlockTexts(blocks[b], inScope([path, bp]), bp) };
      }
      if (isObj(step.examBlock)) {
        const bp = `${path}.examBlock`;
        yield { block: step.examBlock, path: bp, step, source: 'input', texts: resolveBlockTexts(step.examBlock, inScope([path, bp]), bp) };
      }
    }
  } else if (doc.kind === 'lanepack') {
    const blocks = arr(d.slots?.ls4?.blocks);
    for (let b = 0; b < blocks.length; b += 1) {
      const bp = `slots.ls4.blocks[${b}]`;
      yield { block: blocks[b], path: bp, step: null, source: 'lanepack', texts: resolveBlockTexts(blocks[b], inScope(['slots.ls4', bp]), bp) };
    }
    if (isObj(d.slots?.input?.examBlock)) {
      const bp = 'slots.input.examBlock';
      yield { block: d.slots.input.examBlock, path: bp, step: null, source: 'lanepack', texts: resolveBlockTexts(d.slots.input.examBlock, inScope(['slots.input', bp]), bp) };
    }
  } else if (ASSESS_KINDS.has(doc.kind)) {
    const key = doc.kind === 'closing' || doc.kind === 'mock' ? 'parts' : 'examTeile';
    const list = arr(d[key]);
    for (let b = 0; b < list.length; b += 1) {
      if (partKind(list[b]) !== 'block') continue;
      const bp = `${key}[${b}]`;
      yield { block: list[b], path: bp, step: null, source: doc.kind, texts: resolveBlockTexts(list[b], inScope(['file', bp]), bp) };
    }
  }
}

/** Speaking and writing tasks (Aufgaben): LS5/LS6, lane-pack slots, Plateau Teile and productive, closing/mock parts. */
export function* walkTasks(doc) {
  const d = doc.data || {};
  if (doc.kind === 'unit') {
    for (const { step, path } of walkSteps(doc)) {
      if (step?.kind === 'sprechen' && isObj(step.task)) yield { task: step.task, kind: 'speaking', path: `${path}.task`, step, source: 'ls5' };
      if (step?.kind === 'schreiben' && isObj(step.task)) yield { task: step.task, kind: 'writing', path: `${path}.task`, step, source: 'ls6' };
    }
  } else if (doc.kind === 'lanepack') {
    if (isObj(d.slots?.sprechen)) yield { task: d.slots.sprechen, kind: 'speaking', path: 'slots.sprechen', step: null, source: 'lanepack' };
    if (isObj(d.slots?.schreiben)) yield { task: d.slots.schreiben, kind: 'writing', path: 'slots.schreiben', step: null, source: 'lanepack' };
  } else if (ASSESS_KINDS.has(doc.kind)) {
    const key = doc.kind === 'closing' || doc.kind === 'mock' ? 'parts' : 'examTeile';
    const list = arr(d[key]);
    for (let i = 0; i < list.length; i += 1) {
      const k = partKind(list[i]);
      if (k === 'writing' || k === 'speaking') yield { task: list[i], kind: k, path: `${key}[${i}]`, step: null, source: doc.kind };
    }
    const p = d.productive;
    const k = partKind(p);
    if (k === 'writing' || k === 'speaking') yield { task: p, kind: k, path: 'productive', step: null, source: doc.kind };
  }
}

/** The parts of a speaking task: `parts[]` of a multi-Teil round, else the task itself (SCHEMA §8). */
export function speakingParts(task) {
  if (Array.isArray(task?.parts) && task.parts.length) return task.parts.map((p, i) => ({ part: p, path: `.parts[${i}]` }));
  return [{ part: task, path: '' }];
}

/** Micro-outputs: LS1–LS3 (and B Auftakt), Plateau Projekt. */
export function* walkMicroOutputs(doc) {
  const d = doc.data || {};
  if (doc.kind === 'unit') {
    if (isObj(d.start?.auftakt?.microOutput)) yield { mo: d.start.auftakt.microOutput, path: 'start.auftakt.microOutput', step: null };
    for (const { step, path } of walkSteps(doc)) {
      if (isObj(step?.microOutput)) yield { mo: step.microOutput, path: `${path}.microOutput`, step };
    }
  } else if (doc.kind === 'plateau') {
    if (isObj(d.reward?.projekt?.microOutput)) yield { mo: d.reward.projekt.microOutput, path: 'reward.projekt.microOutput', step: null };
  }
}

/**
 * Every authored item. `where` names the slot: gist · input · structured · pool · reserve ·
 * perception · cloze · exam · check · proof · reward.
 */
export function* walkItems(doc) {
  const d = doc.data || {};
  if (doc.kind === 'unit') {
    if (isObj(d.start?.folge?.gistItem)) yield { item: d.start.folge.gistItem, path: 'start.folge.gistItem', where: 'gist', step: null };
    for (const { step, path } of walkSteps(doc)) {
      if (!isObj(step)) continue;
      const lists = [['inputItems', 'input'], ['structuredInput', 'structured'], ['cloze', 'cloze'], ['reserve', 'reserve']];
      for (const [key, where] of lists) {
        const items = arr(step[key]);
        for (let i = 0; i < items.length; i += 1) yield { item: items[i], path: `${path}.${key}[${i}]`, where, step };
      }
      const pool = arr(step.pool?.items);
      for (let i = 0; i < pool.length; i += 1) yield { item: pool[i], path: `${path}.pool.items[${i}]`, where: 'pool', step };
      const perception = step.aussprache?.perception;
      if (Array.isArray(perception)) {
        for (let i = 0; i < perception.length; i += 1) {
          yield { item: perception[i], path: `${path}.aussprache.perception[${i}]`, where: 'perception', step };
        }
      }
    }
    const checkItems = arr(d.check?.items);
    for (let i = 0; i < checkItems.length; i += 1) yield { item: checkItems[i], path: `check.items[${i}]`, where: 'check', step: null };
    const proofs = arr(d.check?.proofItems);
    for (let i = 0; i < proofs.length; i += 1) yield { item: proofs[i], path: `check.proofItems[${i}]`, where: 'proof', step: null };
  } else if (doc.kind === 'plateau') {
    for (const key of ['lesemagazin', 'hoermagazin']) {
      const items = arr(d.reward?.[key]?.items);
      for (let i = 0; i < items.length; i += 1) yield { item: items[i], path: `reward.${key}.items[${i}]`, where: 'reward', step: null };
    }
  }
  for (const { block, path, step, texts } of walkBlocks(doc)) {
    const items = arr(block?.items);
    for (let i = 0; i < items.length; i += 1) yield { item: items[i], path: `${path}.items[${i}]`, where: 'exam', step, block, texts };
  }
}

/** Every spoken line. `where`: folge · input · exam · check · reward · scene. */
export function* walkLines(doc) {
  const d = doc.data || {};
  if (doc.kind === 'unit') {
    const folge = arr(d.start?.folge?.lines);
    for (let i = 0; i < folge.length; i += 1) yield { line: folge[i], path: `start.folge.lines[${i}]`, where: 'folge', step: null };
    for (const { step, path } of walkSteps(doc)) {
      const lines = arr(step?.input?.lines);
      for (let i = 0; i < lines.length; i += 1) yield { line: lines[i], path: `${path}.input.lines[${i}]`, where: 'input', step };
    }
    const check = arr(d.check?.lines);
    for (let i = 0; i < check.length; i += 1) yield { line: check[i], path: `check.lines[${i}]`, where: 'check', step: null };
  } else if (doc.kind === 'plateau') {
    const hm = arr(d.reward?.hoermagazin?.lines);
    for (let i = 0; i < hm.length; i += 1) yield { line: hm[i], path: `reward.hoermagazin.lines[${i}]`, where: 'reward', step: null };
    const sc = arr(d.reward?.scene?.lines);
    for (let i = 0; i < sc.length; i += 1) yield { line: sc[i], path: `reward.scene.lines[${i}]`, where: 'scene', step: null };
  }
  for (const { text, path, step, ownerBlock } of walkExamTexts(doc)) {
    const lines = arr(text.lines);
    for (let i = 0; i < lines.length; i += 1) yield { line: lines[i], path: `${path}.lines[${i}]`, where: 'exam', step, text, ownerBlock };
  }
}

/**
 * Reading/listening surfaces as whole texts, for length, coverage and grammar rules.
 * kind: folge · input (one per step input: its lines joined + its written text) · exam (one per
 * ExamText) · reward. `glosses` are the tokens the surface glosses for the learner.
 */
export function* walkTexts(doc) {
  const d = doc.data || {};
  const joinLines = (lines) => arr(lines).map((l) => (isObj(l) ? String(l.de ?? '') : '')).filter(Boolean).join('\n');
  const glossTokens = (g) => arr(g).map((x) => String(x?.token ?? '')).filter(Boolean);
  if (doc.kind === 'unit') {
    if (isObj(d.start?.folge)) {
      // the Folge's optional glosses (SCHEMA §8 Start; a1.1-u04 r5 F03: „Heute ist Markt." on the start screen)
      const folge = d.start.folge;
      yield { kind: 'folge', de: joinLines(folge.lines), lines: arr(folge.lines), writtenText: '', path: 'start.folge', glosses: glossTokens(folge.glosses), glossList: arr(folge.glosses), step: null };
    }
    for (const { step, path } of walkSteps(doc)) {
      const input = step?.input;
      if (!isObj(input)) continue;
      const written = isObj(input.text) ? String(input.text.de ?? '') : '';
      yield {
        kind: 'input', de: [joinLines(input.lines), written].filter(Boolean).join('\n'), lines: arr(input.lines), writtenText: written,
        inputKind: input.kind, path: `${path}.input`, glosses: glossTokens(input.glosses), glossList: arr(input.glosses), step,
      };
    }
  } else if (doc.kind === 'plateau') {
    if (isObj(d.reward?.lesemagazin)) yield { kind: 'reward', de: String(d.reward.lesemagazin.text ?? ''), lines: [], writtenText: String(d.reward.lesemagazin.text ?? ''), path: 'reward.lesemagazin', glosses: [], glossList: [], step: null };
    if (isObj(d.reward?.hoermagazin)) yield { kind: 'reward', de: joinLines(d.reward.hoermagazin.lines), lines: arr(d.reward.hoermagazin.lines), writtenText: '', path: 'reward.hoermagazin', glosses: [], glossList: [], step: null };
  }
  for (const { text, path, step } of walkExamTexts(doc)) {
    const written = String(text.text ?? '');
    yield {
      kind: 'exam', de: [joinLines(text.lines), written].filter(Boolean).join('\n'), lines: arr(text.lines), writtenText: written,
      path, glosses: glossTokens(text.glosses), glossList: arr(text.glosses), step, textId: text.id,
    };
  }
}

/**
 * Production surfaces (GRM-04, LEX-03): expected answers, model sentences, read-aloud lines,
 * Redemittel, model texts and model turns.
 */
export function* walkProduction(doc) {
  const d = doc.data || {};
  for (const { item, path } of walkItems(doc)) {
    if (!isObj(item)) continue;
    // an error-correction source sentence is wrong on purpose: its ANSWER is the production line
    if (item.answer) yield { de: String(item.answer), path: `${path}.answer`, kind: 'answer', item };
    const accepted = arr(item.accepted);
    for (let i = 0; i < accepted.length; i += 1) {
      const a = accepted[i];
      if (a && a !== item.answer) yield { de: String(a), path: `${path}.accepted[${i}]`, kind: 'answer', item };
    }
  }
  if (doc.kind === 'unit') {
    for (const { step, path } of walkSteps(doc)) {
      if (!isObj(step)) continue;
      if (step.modelSentence) yield { de: String(step.modelSentence), path: `${path}.modelSentence`, kind: 'model-sentence' };
      if (step.aussprache?.readAloud?.lineDe) yield { de: String(step.aussprache.readAloud.lineDe), path: `${path}.aussprache.readAloud.lineDe`, kind: 'read-aloud' };
    }
    const rm = arr(d.redemittel);
    for (let i = 0; i < rm.length; i += 1) if (rm[i]?.de) yield { de: String(rm[i].de), path: `redemittel[${i}].de`, kind: 'redemittel' };
  }
  for (const { task, kind, path } of walkTasks(doc)) {
    if (kind === 'writing' && task.modelText) yield { de: String(task.modelText), path: `${path}.modelText`, kind: 'model-text' };
    if (kind === 'speaking') {
      const turns = arr(task.modelTurns);
      for (let i = 0; i < turns.length; i += 1) if (turns[i]?.de) yield { de: String(turns[i].de), path: `${path}.modelTurns[${i}].de`, kind: 'model-turn' };
    }
  }
}

/** Every id-bearing object of a doc with the id kind it should have. */
export function* walkIds(doc) {
  const d = doc.data || {};
  for (const { item, path, where, step, block } of walkItems(doc)) {
    if (isObj(item)) yield { id: item.id, kind: 'item', where, path: `${path}.id`, parent: block?.id ?? step?.id ?? null };
  }
  for (const { line, path, where, step, text, ownerBlock } of walkLines(doc)) {
    if (!isObj(line)) continue;
    // draft shape: BLOCK-tN-lNN; SCHEMA §2: TEXT-lNN
    const parent = where !== 'exam' ? (step?.id ?? null) : ownerBlock ? `${ownerBlock.id}-${text?.id}` : (text?.id ?? null);
    yield { id: line.id, kind: 'line', where, path: `${path}.id`, parent, textId: text?.id ?? null };
  }
  for (const { text, path, step, scope, ownerBlock } of walkExamTexts(doc)) {
    yield { id: text.id, kind: 'text', path: `${path}.id`, parent: step?.id ?? null, scope, legacy: Boolean(ownerBlock) };
  }
  for (const { block, path, step } of walkBlocks(doc)) {
    if (isObj(block)) yield { id: block.id, kind: 'block', path: `${path}.id`, parent: step?.id ?? null, block };
  }
  for (const { mo, path, step } of walkMicroOutputs(doc)) yield { id: mo.id, kind: 'mo', path: `${path}.id`, parent: step?.id ?? null };
  const assets = arr(d.assets);
  for (let i = 0; i < assets.length; i += 1) if (isObj(assets[i])) yield { id: assets[i].id, kind: 'asset', path: `assets[${i}].id`, parent: null };
  if (doc.kind !== 'unit') return;
  for (const { step, path, index } of walkSteps(doc)) if (isObj(step)) yield { id: step.id, kind: 'step', path: `${path}.id`, index };
  const lists = [['redemittel', 'rm'], ['facts', 'fact'], ['fokus', 'fokus']];
  for (const [key, kind] of lists) {
    const list = arr(d[key]);
    for (let i = 0; i < list.length; i += 1) if (isObj(list[i])) yield { id: list[i].id, kind, path: `${key}[${i}].id`, parent: null };
  }
}
