// Walkers over course-v2 documents (SCHEMA §8–§10). Every rule reads content through these, so
// a new place an item, a line or a task can live is added once, here.
//
// A "doc" is `{ kind, file, data, level }` with kind ∈ unit | lanepack | plateau | closing | mock.
// Each walker yields `{ …, path }` where `path` is a readable JSON path into `data`.

const arr = (x) => (Array.isArray(x) ? x : []);
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

/** A closing/mock `parts[]` entry: exam block, writing task or speaking task. */
export function partKind(p) {
  if (!isObj(p)) return null;
  if (Array.isArray(p.items) && (p.template || p.texts)) return 'block';
  if (Array.isArray(p.leitpunkte) || Array.isArray(p.wordBand) || p.examKey) return 'writing';
  if (p.mode && (p.aiRole || p.openingLine || p.cards)) return 'speaking';
  if (p.template && p.bankKey) return p.leitpunkte ? 'writing' : 'speaking';
  return null;
}

/** Steps of a unit with their index. */
export function* walkSteps(doc) {
  if (doc.kind !== 'unit') return;
  const steps = arr(doc.data?.steps);
  for (let i = 0; i < steps.length; i += 1) yield { step: steps[i], index: i, path: `steps[${i}]` };
}

/** Exam blocks: LS4 of a unit, lane-pack LS4 slot, Plateau Teile, closing and mock parts. */
export function* walkBlocks(doc) {
  const d = doc.data || {};
  if (doc.kind === 'unit') {
    for (const { step, path } of walkSteps(doc)) {
      if (step?.kind !== 'pruefung') continue;
      const blocks = arr(step.blocks);
      for (let b = 0; b < blocks.length; b += 1) {
        yield { block: blocks[b], path: `${path}.blocks[${b}]`, step, source: 'ls4' };
      }
    }
  } else if (doc.kind === 'lanepack') {
    const blocks = arr(d.slots?.ls4?.blocks);
    for (let b = 0; b < blocks.length; b += 1) {
      yield { block: blocks[b], path: `slots.ls4.blocks[${b}]`, step: null, source: 'lanepack' };
    }
  } else if (doc.kind === 'plateau') {
    const blocks = arr(d.examTeile);
    for (let b = 0; b < blocks.length; b += 1) {
      yield { block: blocks[b], path: `examTeile[${b}]`, step: null, source: 'plateau' };
    }
  } else if (doc.kind === 'closing' || doc.kind === 'mock') {
    const parts = arr(d.parts);
    for (let b = 0; b < parts.length; b += 1) {
      if (partKind(parts[b]) === 'block') yield { block: parts[b], path: `parts[${b}]`, step: null, source: doc.kind };
    }
  }
}

/** Speaking and writing tasks (Aufgaben): LS5/LS6, lane-pack slots, Plateau productive, closing/mock parts. */
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
  } else if (doc.kind === 'plateau') {
    const p = d.productive;
    const k = partKind(p);
    if (k === 'writing' || k === 'speaking') yield { task: p, kind: k, path: 'productive', step: null, source: 'plateau' };
  } else if (doc.kind === 'closing' || doc.kind === 'mock') {
    const parts = arr(d.parts);
    for (let i = 0; i < parts.length; i += 1) {
      const k = partKind(parts[i]);
      if (k === 'writing' || k === 'speaking') yield { task: parts[i], kind: k, path: `parts[${i}]`, step: null, source: doc.kind };
    }
  }
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
 * Every authored item. `where` names the slot: gist · input · structured · pool · perception ·
 * cloze · exam · check · proof · reward.
 */
export function* walkItems(doc) {
  const d = doc.data || {};
  if (doc.kind === 'unit') {
    if (isObj(d.start?.folge?.gistItem)) yield { item: d.start.folge.gistItem, path: 'start.folge.gistItem', where: 'gist', step: null };
    for (const { step, path } of walkSteps(doc)) {
      if (!isObj(step)) continue;
      const lists = [['inputItems', 'input'], ['structuredInput', 'structured'], ['cloze', 'cloze']];
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
  for (const { block, path, step } of walkBlocks(doc)) {
    const items = arr(block?.items);
    for (let i = 0; i < items.length; i += 1) yield { item: items[i], path: `${path}.items[${i}]`, where: 'exam', step, block };
  }
}

/**
 * Every spoken line. `where`: folge · input · exam · check · reward · scene.
 */
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
  for (const { block, path, step } of walkBlocks(doc)) {
    const texts = arr(block?.texts);
    for (let t = 0; t < texts.length; t += 1) {
      const lines = arr(texts[t]?.lines);
      for (let i = 0; i < lines.length; i += 1) {
        yield { line: lines[i], path: `${path}.texts[${t}].lines[${i}]`, where: 'exam', step, block, text: texts[t] };
      }
    }
  }
}

/**
 * Reading/listening surfaces as whole texts, for length and coverage rules.
 * kind: folge · input (one per step input: its lines joined + its written text) · exam (one per
 * block text) · reward. `glosses` are the tokens the surface glosses for the learner.
 */
export function* walkTexts(doc) {
  const d = doc.data || {};
  const joinLines = (lines) => arr(lines).map((l) => (isObj(l) ? String(l.de ?? '') : '')).filter(Boolean).join('\n');
  const glossTokens = (g) => arr(g).map((x) => String(x?.token ?? '')).filter(Boolean);
  if (doc.kind === 'unit') {
    if (isObj(d.start?.folge)) {
      yield { kind: 'folge', de: joinLines(d.start.folge.lines), lines: arr(d.start.folge.lines), path: 'start.folge', glosses: [], step: null };
    }
    for (const { step, path } of walkSteps(doc)) {
      const input = step?.input;
      if (!isObj(input)) continue;
      const parts = [joinLines(input.lines), isObj(input.text) ? String(input.text.de ?? '') : ''].filter(Boolean);
      yield {
        kind: 'input', de: parts.join('\n'), lines: arr(input.lines), writtenText: isObj(input.text) ? String(input.text.de ?? '') : '',
        inputKind: input.kind, path: `${path}.input`, glosses: glossTokens(input.glosses), step,
      };
    }
  } else if (doc.kind === 'plateau') {
    if (isObj(d.reward?.lesemagazin)) yield { kind: 'reward', de: String(d.reward.lesemagazin.text ?? ''), lines: [], path: 'reward.lesemagazin', glosses: [], step: null };
    if (isObj(d.reward?.hoermagazin)) yield { kind: 'reward', de: joinLines(d.reward.hoermagazin.lines), lines: arr(d.reward.hoermagazin.lines), path: 'reward.hoermagazin', glosses: [], step: null };
  }
  for (const { block, path, step } of walkBlocks(doc)) {
    const texts = arr(block?.texts);
    for (let t = 0; t < texts.length; t += 1) {
      const tx = texts[t];
      if (!isObj(tx)) continue;
      const de = [joinLines(tx.lines), String(tx.text ?? '')].filter(Boolean).join('\n');
      yield { kind: 'exam', de, lines: arr(tx.lines), path: `${path}.texts[${t}]`, glosses: glossTokens(tx.glosses), step, block, textId: tx.id };
    }
  }
}

/**
 * Production surfaces (GRM-04, LEX-03): what the learner is asked to produce or is shown as a model
 * to imitate — expected answers, micro-output targets are not text; model texts, model turns,
 * Redemittel, model sentences and read-aloud lines.
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
  for (const { line, path, where, step, block, text } of walkLines(doc)) {
    if (isObj(line)) yield { id: line.id, kind: 'line', where, path: `${path}.id`, parent: block?.id ?? step?.id ?? null, textId: text?.id ?? null };
  }
  for (const { block, path, step } of walkBlocks(doc)) {
    if (isObj(block)) yield { id: block.id, kind: 'block', path: `${path}.id`, parent: step?.id ?? null, block };
  }
  for (const { mo, path, step } of walkMicroOutputs(doc)) yield { id: mo.id, kind: 'mo', path: `${path}.id`, parent: step?.id ?? null };
  if (doc.kind !== 'unit') return;
  for (const { step, path, index } of walkSteps(doc)) if (isObj(step)) yield { id: step.id, kind: 'step', path: `${path}.id`, index };
  const lists = [['redemittel', 'rm'], ['facts', 'fact'], ['fokus', 'fokus']];
  for (const [key, kind] of lists) {
    const list = arr(d[key]);
    for (let i = 0; i < list.length; i += 1) if (isObj(list[i])) yield { id: list[i].id, kind, path: `${key}[${i}].id`, parent: null };
  }
}
