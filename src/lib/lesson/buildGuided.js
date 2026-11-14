import { buildSoundItems, nounsOf } from './guidedSound.js';
import { proofTasks } from './proof.js';
import { buildSetStage } from './taughtSet.js';
import { cardWordSets, buildWordCardStage } from './wordCards.js';

export const SCENE_PHASES = ['hear', 'meaning', 'say'];
export const sceneStep = (index, offset = 0) => `scene:${Math.floor(index / SCENE_PHASES.length) + offset + 1}:${SCENE_PHASES[index % SCENE_PHASES.length]}`;

/** Back enters the last visible screen of a teaching/scene stage. */
export function stageLastItem(stage) {
  if (stage?.kind === 'scene') return stage.chunks.length * SCENE_PHASES.length - 1;
  if (stage?.kind === 'wortfeld' && stage.steps) return stage.steps.length - 1;
  if (stage?.kind === 'taught-set') return stage.steps.length - 1;
  return 0;
}

/** The legacy builder owns every draw and unchanged stage. Only input pacing changes. */
export function buildGuided(options, buildLegacy) {
  const { lektion } = options;
  const legacy = buildLegacy({ ...options, lektion: { ...lektion, flow: undefined } });
  const words = cardWordSets(lektion);
  const chunks = lektion.guided.chunks.map((chunk, index) => {
    const sourceLines = lektion.dialog.lines.slice(chunk.from, chunk.to);
    return {
      ...chunk,
      chunkIndex: index,
      translationDefault: lektion.nr === 1 && index === 0,
      cue: chunk.say.line > 0 ? { ...lektion.dialog.lines[chunk.say.line - 1], index: chunk.say.line - 1 } : undefined,
      lines: lektion.dialog.lines.slice(chunk.from, chunk.to).map((l, i) => ({ ...l, index: chunk.from + i })),
      meaning: { ...chunk.meaning, id: `scene-${lektion.id}-${index + 1}`, type: 'multiple_choice', accepted: [chunk.meaning.answer],
        hintSource: { kind: 'scene', from: chunk.from, to: chunk.to },
        explanationDe: sourceLines.map((l) => `${l.speaker}: „${l.de}“`).join(' '),
        explanationEn: sourceLines.map((l) => `${l.speaker}: “${l.en}”`).join(' '),
      },
      say: { ...chunk.say, ...lektion.dialog.lines[chunk.say.line] },
    };
  });
  const byKind = (kind) => legacy.stages.find((s) => s.kind === kind);
  const part = (kind, n) => ({ ...byKind(kind), part: n });
  const soundItems = buildSoundItems(lektion, nounsOf(options.curriculum?.lektionen || [lektion]));
  const read = lektion.guided.read;
  const sets = (lektion.guided.sets || []).map(buildSetStage);
  const after = (n) => sets.filter((s) => s.set.placement?.afterChunk === n);
  const sceneStages = [];
  let start = 0;
  for (let end = 1; end <= chunks.length; end++) {
    if (after(end).length || end === chunks.length) {
      sceneStages.push({ nr: 1, key: start ? `scene:${start + 1}` : 'scene', kind: 'scene', part: 1,
        chunks: chunks.slice(start, end), chunkOffset: start, chunkTotal: chunks.length, title: lektion.dialog.title, glossOpen: true }, ...after(end));
      start = end;
    }
  }
  const stages = [
    ...legacy.stages.filter((s) => s.kind === 'warmup'),
    part('pretest', 1),
    ...sets.filter((s) => !s.set.placement || s.set.placement === 'before-scene'),
    ...(lektion.guided.noticeBeforeScene ? [part('notice', 1)] : []),
    ...sceneStages,
    buildWordCardStage(lektion, words.scene, 'wortfeld', options.attempt),
    buildWordCardStage(lektion, words.read, 'wortfeld-read', options.attempt),
    { nr: 3, key: 'sound', kind: 'sound', part: 1, items: soundItems },
    { nr: 3, key: 'read', kind: 'read', part: 1, ...read, glossary: lektion.wortfeld, words: words.read,
      items: read.questions.map((q, i) => ({ ...q, id: `read-${lektion.id}-${i + 1}`, type: 'multiple_choice', accepted: [q.answer] })) },
    ...(!lektion.guided.noticeBeforeScene ? [part('notice', 2)] : []),
    ...sets.filter((s) => s.set.placement === 'part2'),
    ...['practice', 'derived', 'dictation'].map((kind) => part(kind, 2)),
    { nr: 4, key: 'fluency', kind: 'fluency', part: 2, lines: chunks.map((c) => ({ ...c.say, cue: c.cue })) },
    part('speaking', 3), part('writing', 3),
    ...(lektion.proof ? [{ nr: 6, key: 'proof', kind: 'proof', part: 3, tasks: proofTasks(lektion), canDo: lektion.canDo }] : []),
    part('requeue', 3), { ...part('recap', 3), nextHook: lektion.nextHook },
  ];
  return { ...legacy, flow: 'guided', stages };
}
