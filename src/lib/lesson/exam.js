import { examFormat } from '../../data/curricula/examFormats.js';
import { checkAnswer, checkOptionsFor, RESULT } from './check.js';

const text = (value) => typeof value === 'string' && value.trim().length > 0;
const kinds = { mc3: 'mc3', 'mc3-picture': 'mc3', match: 'match', 'yes-no': 'trueFalse' };
export const isExamItem = (item) => ['mc3', 'match'].includes(item?.kind);

// One unit is one scored response, including one assignment in a matching group.
// Shared texts/audio use groupId so feedback cannot reveal a later answer.
export function examUnitErrors(unit, { examKey, section, teil } = {}) {
  const errors = [];
  if (!unit || typeof unit !== 'object') return ['exam unit must be an object'];
  const part = examFormat(examKey).parts.find((p) => p.teil === unit.teil);
  const family = section === 'lesen' ? 'Lesen' : 'Hören';
  if (!part || !unit.teil.startsWith(family) || (teil && unit.teil !== teil)) errors.push(`expected ${teil || family} exam Teil`);
  const dictation = section === 'hoeren' && unit.kind === 'dictation' && part?.format === 'yes-no';
  if (!dictation && unit.kind !== kinds[part?.format]) errors.push('kind does not match the exam Teil');
  for (const key of ['id', 'question', 'questionEn', 'answer', 'explanationDe', 'explanationEn']) {
    if (!text(unit[key])) errors.push(`missing ${key}`);
  }
  if (!text(section === 'lesen' ? unit.text : unit.audioText)) errors.push(`missing ${section === 'lesen' ? 'text' : 'audioText'}`);
  if (section === 'hoeren' && unit.text) errors.push('Hören transcript belongs in audioText, not visible text');
  if (!dictation) {
    const options = unit.options;
    if (!Array.isArray(options) || !options.every(text) || new Set(options).size !== options.length
      || options.length < 2 || (unit.kind === 'mc3' && options.length !== 3)
      || (unit.kind === 'trueFalse' && (options.length !== 2 || !['Ja', 'Nein'].every((o) => options.includes(o))))) {
      errors.push('invalid options (mc3: exactly three; match: at least two; trueFalse: Ja/Nein)');
    }
    if (!Array.isArray(options) || !options.includes(unit.answer)) errors.push('answer must be one printed option');
    if (Array.isArray(options) && options.filter((o) => checkAnswer(o, unit.answer, checkOptionsFor({ ...unit, mode: 'options' })).result === RESULT.CORRECT).length !== 1) errors.push('choice must have exactly one accepted printed option');
    if (unit.accepted && (unit.accepted.length !== 1 || unit.accepted[0] !== unit.answer)) errors.push('choice has exactly one accepted answer');
  } else if (unit.answer !== unit.audioText) errors.push('dictation answer must equal audioText');
  if (unit.kind === 'match' && !text(unit.groupId)) errors.push('match needs groupId');
  if (part?.format === 'mc3-picture') {
    if (!Array.isArray(unit.pictures) || unit.pictures.length !== 3
      || unit.pictures.some((p, i) => !text(p?.src) || !p.src.startsWith('/') || p.src.startsWith('//') || !text(p.alt) || p.option !== unit.options?.[i])) {
      errors.push('picture MC needs three local pictures with alt and matching option');
    }
  }
  return errors;
}

export function examUnitsErrors(units, options, count) {
  if (!Array.isArray(units) || (count ? units.length !== count : units.length < 3 || units.length > 5)) {
    return [`expected ${count || '3–5'} exam units`];
  }
  const errors = units.flatMap((unit, i) => examUnitErrors(unit, options).map((e) => `unit ${i + 1}: ${e}`));
  if (new Set(units.map((u) => u?.id)).size !== units.length) errors.push('duplicate unit id');
  for (let i = 0; i < units.length; i += 1) for (let j = i + 1; j < units.length; j += 1) {
    const a = units[i]; const b = units[j];
    const shared = a?.text && a.text === b?.text || a?.audioText && a.audioText === b?.audioText;
    if (shared && (!a.groupId || a.groupId !== b.groupId)) errors.push('shared stimulus needs one groupId');
  }
  return errors;
}

export function examBankErrors(bank, options, count) {
  if (!Array.isArray(bank?.papers) || !bank.papers.length) return ['authored exam bank needs papers'];
  return bank.papers.flatMap((paper, i) => {
    const errors = examUnitsErrors(paper, options, count);
    if (options.expectedKinds && Array.isArray(paper) && JSON.stringify(paper.map((u) => u?.kind).sort()) !== JSON.stringify([...options.expectedKinds].sort())) errors.push('checkpoint Hören needs two dictations and three Ja/Nein items');
    return errors.map((e) => `paper ${i + 1}: ${e}`);
  });
}

export function examUnitItem(unit, { id = unit.id, section, level, lektionId, lektionNr } = {}) {
  return {
    ...unit, id, unitId: unit.id, section, level, lektionId, lektionNr,
    kind: unit.kind, type: unit.kind, mode: unit.kind === 'dictation' ? 'typed' : 'options',
    topic: section, source: 'authored', scored: true,
    promptDe: unit.question, promptEn: unit.questionEn,
    questionDe: unit.question, questionEn: unit.questionEn,
    accepted: [unit.answer], lineKey: unit.id,
  };
}

export function buildExamBank(bank, { checkpoint, curriculum, section, round = 0 }) {
  const part = examFormat(curriculum.examKey).checkpointParts?.[checkpoint.nr - 1];
  const teil = part?.[section];
  const errors = examBankErrors(bank, { examKey: curriculum.examKey, section, teil, expectedKinds: section === 'hoeren' ? part?.hoerenKinds : null }, section === 'lesen' ? 4 : 5);
  if (!teil) errors.push('unknown checkpoint nr');
  if (errors.length) throw new Error(`${curriculum.examKey}: authored exam ${section === 'lesen' ? 'Lesen' : 'Hören'} surfaces are required (G9): ${errors.join('; ')}`);
  return bank.papers[round % bank.papers.length].map((unit, i) => examUnitItem(unit, {
    id: `${checkpoint.id}-${section}-${i + 1}`, section, level: curriculum.level,
    lektionId: checkpoint.id, lektionNr: checkpoint.afterLektion,
  }));
}

export function speakingFormatErrors(open, examKey) {
  const contract = examFormat(examKey).speaking;
  if (!contract) return [];
  const spec = contract[open?.teil];
  if (!spec) return ['unknown speaking Teil'];
  if (spec.cards && (!Array.isArray(open.cards) || open.cards.length !== spec.cards || !open.cards.every(text))) return ['Teil 1 needs four question cards'];
  if (spec.prompts && (!Array.isArray(open.prompts) || open.prompts.length !== spec.prompts || !open.prompts.every(text))) return ['Teil 2 needs four life prompts'];
  if (spec.calendars) {
    const calendars = open.calendar;
    if (!Array.isArray(calendars) || calendars.length !== 2 || calendars.some((c) => !text(c?.owner)
      || !Array.isArray(c.slots) || !c.slots.length || c.slots.some((s) => !text(s?.time) || !text(s.activity)))) return ['Teil 3 needs two named calendars with time/activity slots'];
    if (calendars[0].owner === calendars[1].owner) return ['calendar owners must differ'];
  }
  return [];
}

// Engine-contract validator also used by the full curriculum validator; it can
// validate a small synthetic course without pretending it is twelve authored lessons.
export function examSurfaceErrors(curriculum) {
  const exam = examFormat(curriculum.examKey);
  if (exam.checkpointReading !== 'authored-exam-parts') return [];
  const errors = [];
  for (const cp of curriculum.checkpoints || []) {
    for (const section of ['lesen', 'hoeren']) {
      const teil = exam.checkpointParts[cp.nr - 1]?.[section];
      if (!teil) errors.push(`${cp.id}: unknown checkpoint nr`);
      errors.push(...examBankErrors(cp[section], { examKey: curriculum.examKey, section, teil, expectedKinds: section === 'hoeren' ? exam.checkpointParts[cp.nr - 1]?.hoerenKinds : null }, section === 'lesen' ? 4 : 5).map((e) => `${cp.id} ${section}: ${e}`));
    }
  }
  for (const l of curriculum.lektionen || []) {
    for (const section of ['lesen', 'hoeren']) {
      const block = l[section];
      if (!block || section === 'hoeren' && block.kind === 'dictation') continue;
      errors.push(...examUnitsErrors(block.units, { examKey: curriculum.examKey, section, teil: block.teil }).map((e) => `Lektion ${l.nr} ${section}: ${e}`));
    }
    errors.push(...speakingFormatErrors(l.sprechen?.open, curriculum.examKey).map((e) => `Lektion ${l.nr}: ${e}`));
  }
  return errors;
}
