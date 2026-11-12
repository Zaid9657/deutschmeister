import { lineFor } from './wortfeldPacing.js';

export const SCENE_PHASES = ['hear', 'meaning', 'say'];
export const sceneStep = (index) => `scene:${Math.floor(index / SCENE_PHASES.length) + 1}:${SCENE_PHASES[index % SCENE_PHASES.length]}`;

/** The legacy builder owns every draw and unchanged stage. Only input pacing changes. */
export function buildGuided(options, buildLegacy) {
  const { lektion } = options;
  const legacy = buildLegacy({ ...options, lektion: { ...lektion, flow: undefined } });
  const lines = lektion.dialog.lines.map((l) => l.de);
  const met = (word) => !!lineFor(word.de || word.word, lines);
  const sceneWords = lektion.wortfeld.filter(met);
  const chunks = lektion.guided.chunks.map((chunk, index) => {
    const sourceLines = lektion.dialog.lines.slice(chunk.from, chunk.say.line + 1);
    return {
      ...chunk,
      lines: lektion.dialog.lines.slice(chunk.from, chunk.to).map((l, i) => ({ ...l, index: chunk.from + i })),
      meaning: { ...chunk.meaning, id: `scene-${lektion.id}-${index + 1}`, type: 'multiple_choice', accepted: [chunk.meaning.answer],
        explanationDe: sourceLines.map((l) => `${l.speaker}: „${l.de}“`).join(' '),
        explanationEn: sourceLines.map((l) => `${l.speaker}: “${l.en}”`).join(' '),
      },
      say: { ...chunk.say, ...lektion.dialog.lines[chunk.say.line] },
    };
  });
  const byKind = (kind) => legacy.stages.find((s) => s.kind === kind);
  const part = (kind, n) => ({ ...byKind(kind), part: n });
  const soundItems = lektion.phonetik.items.map((marked, index) => {
    const syllables = marked.split('-');
    const stress = syllables.findIndex((s) => s === s.toLocaleUpperCase('de'));
    const options = syllables.map((_, i) => String(i + 1));
    return {
      id: `sound-${lektion.id}-${index + 1}`, type: 'multiple_choice',
      text: syllables.join('').slice(0, 1).toLocaleUpperCase('de') + syllables.join('').slice(1).toLocaleLowerCase('de'), marked,
      promptDe: 'Welche Silbe ist betont? Wählen Sie die Nummer.',
      promptEn: 'Which syllable is stressed? Choose its number.',
      options, answer: options[stress], accepted: [options[stress]],
      explanationDe: `Die Großbuchstaben zeigen die betonte Silbe: ${marked}.`,
      explanationEn: `The capitals show the stressed syllable: ${marked}.`,
    };
  });
  const read = lektion.guided.read;
  const stages = [
    ...legacy.stages.filter((s) => s.kind === 'warmup'),
    part('pretest', 1),
    { nr: 1, key: 'scene', kind: 'scene', part: 1, chunks, title: lektion.dialog.title, glossOpen: true },
    { ...part('wortfeld', 1), words: sceneWords },
    { nr: 3, key: 'sound', kind: 'sound', part: 1, items: soundItems },
    { nr: 3, key: 'read', kind: 'read', part: 1, ...read, glossary: lektion.wortfeld, words: lektion.wortfeld.filter((w) => !met(w)),
      items: read.questions.map((q, i) => ({ ...q, id: `read-${lektion.id}-${i + 1}`, type: 'multiple_choice', accepted: [q.answer] })) },
    ...['notice', 'practice', 'derived', 'dictation'].map((kind) => part(kind, 2)),
    { nr: 4, key: 'fluency', kind: 'fluency', part: 2, lines: chunks.map((c) => ({ ...c.say, cue: c.lines.filter((l) => l.index < c.say.line && l.speaker !== c.say.speaker).at(-1) })) },
    part('speaking', 3), part('writing', 3), part('requeue', 3), { ...part('recap', 3), nextHook: lektion.nextHook },
  ];
  return { ...legacy, flow: 'guided', stages };
}
