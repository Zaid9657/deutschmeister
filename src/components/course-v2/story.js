// Course v2 — who tells the unit, what the story screen's speech bubble says, and which screen of a
// Kapitel shows when (round 3). Shared by the Start (StartView's story and bonus screens) and the
// player (the welcome-back, the recap, the opt-in guide), so the unit has one narrator everywhere.
// Pure: no React, no storage.

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

// ---------------------------------------------------------------------------
// The flow of a Kapitel (round 3, owner 2026-09-30: "it looks intimidating and too much … make it in
// duolingo style and for everything to be step for step"): Duolingo on the surface, the textbook one
// tap deep. ONE thing per screen: a fresh unit opens on the narrator's story screen, a resumed one on
// a welcome-back; the textbook Kapitel page is the opt-in guide behind `?view=guide`.
// ---------------------------------------------------------------------------

/**
 * Which screen the player shows for its phase and the URL's `view`: the guide wins over every phase
 * but loading; 'start' is the story screen, 'resume' the welcome-back; any other phase (step,
 * celebrate, recap) is its own screen.
 */
export function screenOf(phase, view = null) {
  if (!phase || phase === 'loading') return 'loading';
  if (view === 'guide') return 'guide';
  if (phase === 'start') return 'story';
  if (phase === 'resume') return 'welcome';
  return phase;
}

/**
 * The welcome-back bubble's second line for the part „Weiter" opens (a kapitel.js tocRows row), as
 * { key, vars } for strings.js: a lettered section by letter and title („Weiter geht's mit Teil B:
 * Woher …"), any other part by its name (`nameOf(row)`: Prüfungstraining, Kapiteltest …); past the
 * last part, the summary.
 */
export function welcomeLine(row, nameOf = (r) => (r && r.title) || '') {
  if (!row) return { key: 'flow.nextSummary', vars: {} };
  if (row.letter && row.title) return { key: 'flow.nextPart', vars: { l: row.letter, title: row.title } };
  return { key: 'flow.nextName', vars: { name: nameOf(row) } };
}

/**
 * Where the guide's X goes: back in the history when the learner came from somewhere in the app (the
 * router gives the first page of a visit the location key 'default'), else the course home — so a
 * guide opened from the home returns there, one opened from the welcome-back or the recap returns to
 * that screen, and a guide opened cold never strands the learner.
 */
export const guideCloseTarget = (locationKey, home) => (locationKey && locationKey !== 'default' ? -1 : home);
