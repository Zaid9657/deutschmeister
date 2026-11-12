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
  const moreWords = lektion.wortfeld.filter((w) => !met(w));
  const chunks = lektion.guided.chunks.map((chunk, index) => ({
    ...chunk,
    lines: lektion.dialog.lines.slice(chunk.from, chunk.to).map((l, i) => ({ ...l, index: chunk.from + i })),
    meaning: { ...chunk.meaning, id: `scene-${lektion.id}-${index + 1}`, type: 'multiple_choice', accepted: [chunk.meaning.answer] },
    say: { ...chunk.say, ...lektion.dialog.lines[chunk.say.line] },
  }));
  const stages = legacy.stages.flatMap((stage) => {
    if (stage.kind === 'dialog') return [{ nr: stage.nr, key: 'scene', kind: 'scene', part: 1, chunks, title: lektion.dialog.title, glossOpen: true }];
    if (stage.kind === 'wortfeld') return sceneWords.length ? [{ ...stage, part: 1, words: sceneWords }] : [];
    if (stage.kind === 'practice' && moreWords.length) return [
      { nr: 4, key: 'wortfeld-more', kind: 'wortfeld', part: 2, title: 'Mehr Wörter zu diesem Thema', titleEn: 'More words for this topic', words: moreWords, lines },
      stage,
    ];
    return [stage];
  });
  return { ...legacy, flow: 'guided', stages };
}
