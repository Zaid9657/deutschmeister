// "Der erste Halt" — which real course items the homepage demo plays
// (astro-site/src/components/linie/FirstStop.astro). Ids from the built A1.1
// pool (src/data/lessonPools/a11.extra.json), all from Lektion 1 "An der
// Rezeption". tests/first-stop.test.mjs checks each one against the real
// checker and fails when the A1.1 course is replaced by Course v2.
export const DEMO_ITEM_IDS = ['extra-a11-l01-06', 'extra-a11-l01-04', 'extra-a11-l01-08'];

/** One short label per item, shown above the sentence. */
export const DEMO_ITEM_LABELS = ['Formal hello', 'Spell it', 'Fix the greeting'];
