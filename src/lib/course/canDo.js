// Course-home ticks require the individual final-check evidence saved on this device.
// A chapter pass has no per-can-do or skill evidence and cannot supply missing ticks.
import { A11_META } from '../../data/curricula/a11.meta.js';

// ponytail: an id is `<lektionId>#<n>`, the line's place in `lektion.canDo`; give the entries
// explicit ids if can-dos are ever reordered, or stored evidence would point at the wrong line.
export const canDoId = (lektionId, i) => `${lektionId}#${i + 1}`;

/** The checkpoint that closes a Lektion's chapter: the first one at or after it. */
export const checkpointFor = (curriculum, nr) =>
  [...(curriculum.checkpoints || [])].sort((a, b) => a.afterLektion - b.afterLektion).find((cp) => cp.afterLektion >= nr) || null;

/** A Lektion's can-do lines in the chrome language. English exists for A1.1 only (its meta module). */
export function canDoLines(lektion, lang = 'en') {
  const en = lang === 'de' ? null : A11_META.lektionIntro[lektion.id]?.canDoEn;
  return (lektion.canDo || []).map((de, i) => en?.[i] || de);
}

/**
 * What a finished Lektion's final check showed, per can-do: the check's own line (`guided.check.shown`) where it
 * proves less than the can-do says — a name written down from spelling is no spelling of one's own (the can-do
 * honesty test, 2026-11-22) — else the can-do itself.
 */
export function shownLines(lektion, lang = 'en') {
  const shown = lektion.guided?.check?.shown || [];
  return canDoLines(lektion, lang).map((line, i) => shown[i]?.[lang === 'de' ? 'de' : 'en'] || line);
}

/** Every can-do in course order; completion alone is not evidence of an ability. */
export function canDoList(curriculum, done = new Set(), checked = {}) {
  return curriculum.lektionen.flatMap((l) => {
    const state = !done.has(l.id) ? 'open' : 'shown';
    // A finished Lektion claims what its check showed (`shownLines`), an open one the can-do it works towards.
    const [de, en] = state === 'open' ? [l.canDo || [], canDoLines(l, 'en')] : [shownLines(l, 'de'), shownLines(l, 'en')];
    const seen = checked?.[l.id];
    return de.map((line, i) => ({ id: canDoId(l.id, i), lektionId: l.id, nr: l.nr, de: line, en: en[i], state: state === 'open' ? 'open' : seen?.[i] === true ? 'shown' : 'practise' }));
  });
}
