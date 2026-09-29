// Course v2 — who tells the unit, and what the intro's speech bubble says. Shared by the
// Start (StartView's intro and bonus screens) and the player (resume, recap), so the unit
// has one narrator everywhere. Pure: no React, no storage.

import { speakerName } from './content.js';

/** The unit's narrator: Priya on A1 (the A1 story is hers), else the first of the unit's cast. */
export function narratorOf(unit, level = null, names = null) {
  if (/^a1/i.test(String((unit && unit.level) || level || ''))) return 'Priya';
  const id = (unit && unit.story && Array.isArray(unit.story.castIn) && unit.story.castIn[0])
    || (unit && unit.start && unit.start.folge && unit.start.folge.lines && unit.start.folge.lines[0] && unit.start.folge.lines[0].speaker)
    || null;
  return id ? speakerName(id, names) : 'Priya';
}

/**
 * The intro's speech bubble: „Was bisher geschah" where the unit has one (U01), else the first
 * sentence of the unit's story beat (it sets the scene; the rest of the beat would tell the
 * Folge before the learner hears it), else the unit's can-do title.
 */
export function introBubble(unit) {
  const start = (unit && unit.start) || {};
  if (start.recapDe) return String(start.recapDe);
  const beat = unit && unit.story && unit.story.beat ? String(unit.story.beat) : '';
  const first = beat.match(/^.*?[.!?](?=\s|$)/);
  if (first) return first[0];
  if (beat) return beat;
  return (unit && unit.title && unit.title.canDo) || '';
}
