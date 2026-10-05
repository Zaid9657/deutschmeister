// Station artwork — one flat vector scene per stop of the line (2026-10-04, owner:
// "we have higgsfield api we can also integrate"). Generated with Higgsfield
// (Recraft V4.1, vector mode, the v4 Türkis palette locked through `colors`);
// prompts, job ids and the transfer route are in docs/redesign-2026-10/station-art.md.
// The files live in public/art/stations/ (metadata stripped, svgo-minified).
//
// The set goes on the site WHOLE or not at all: until every one of the eight
// stations has its scene, artFor() returns null everywhere, so no level ever
// looks unfinished next to another. Adding the last scene is a file in
// public/art/stations/ and a line below — nothing in the templates.
//
// The scenes are decorative (the card next to each one says what the level is),
// so they render with an empty alt.
import { ALL_LEVELS } from './pricing.js';

/** The viewBox every Recraft 4:3 vector shares (2048 × 1509). */
export const ART_WIDTH = 2048;
export const ART_HEIGHT = 1509;

export const STATION_ART = {
  'a1.1': { file: 'a1-1.svg', scene: 'Hotel reception: a receptionist greets a guest with a suitcase' },
  'a1.2': { file: 'a1-2.svg', scene: 'Bakery counter: a customer points at the loaf the baker holds up' },
  'a2.1': { file: 'a2-1.svg', scene: "Doctor's practice: a doctor talks with a seated patient holding a form" },
  'a2.2': { file: 'a2-2.svg', scene: 'Service office: booking an appointment at the counter' },
  'b1.1': { file: 'b1-1.svg', scene: 'Office table: two colleagues discuss a plan on a laptop' },
  'b1.2': { file: 'b1-2.svg', scene: 'Rainy platform: a commuter with an umbrella walks to the train' },
  'b2.1': { file: 'b2-1.svg', scene: 'At home by the window: planning a visit on the phone' },
  'b2.2': { file: 'b2-2.svg', scene: 'Around a table: three people weigh pros and cons' },
};

/** True once every station of the line has its scene. */
export const ART_COMPLETE = ALL_LEVELS.every((level) => Boolean(STATION_ART[level]));

/** The scene for one level, or null (always null until the set is complete). */
export const artFor = (level) => {
  const art = ART_COMPLETE ? STATION_ART[String(level || '').toLowerCase()] : null;
  return art ? { src: `/art/stations/${art.file}`, width: ART_WIDTH, height: ART_HEIGHT } : null;
};
