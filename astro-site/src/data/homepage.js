// The homepage copy deck — "Die Linie" (docs/redesign-2026-10/copy.md).
//
// Hero copy lives here, not in the template, so a sequential experiment is a
// one-line change (ACTIVE_HERO) and every variant stays reviewable side by
// side. Each variant keeps the same shape: lines are hard-broken on purpose
// (the display face swaps from a measured fallback; a fixed line count means
// the swap can never move the page). Figures are never typed here — the
// template fills them from pricing.js / marketing.js / offers.js.
//
// Why "to B2" (owner, 2026-10-04: "why does it say till B1"): the line runs
// A1.1 → B2.2, so the hero names its last stop. It said "to B1" first because
// 41 of 70 signups who named an exam goal named B1 (docs/redesign-2026-10/
// baseline.md); the fit chooser still sends B1-bound visitors to their stop.

export const HERO_VARIANTS = {
  // Outcome + mechanism: the destination most visitors named, and the line.
  route: {
    id: 'route',
    eyebrow: 'Deutsch, in Bewegung · A1.1 → B2.2',
    lines: [
      [{ t: 'From ' }, { t: 'Guten Tag', de: true, mark: true }],
      [{ t: 'to B2, one stop' }],
      [{ t: 'at a time.' }],
    ],
    // `{proMonths}` is filled from pricing.js COURSE_PRO_MONTHS.
    lead: 'Eight levels, laid out like a train line. The first stop is free, with no account. When you’re ready for the next, buy that level once and keep it — with {proMonths} months of AI speaking and writing practice on board.',
  },
  // Mechanism first (sequential test E1 in measurement.md).
  mechanism: {
    id: 'mechanism',
    eyebrow: 'Deutsch, in Bewegung · A1.1 → B2.2',
    lines: [[{ t: 'German,' }], [{ t: 'one stop' }], [{ t: 'at a time.' }]],
    lead: 'A course line from your first Guten Tag to B2. Ride the first stop free, with no account. Every next stop is one payment — yours to keep, with {proMonths} months of AI speaking and writing practice on board.',
  },
  // Anti-guessing (sequential test E1, third arm).
  guess: {
    id: 'guess',
    eyebrow: 'Deutsch, in Bewegung · A1.1 → B2.2',
    lines: [[{ t: 'Stop guessing' }], [{ t: 'what to learn' }], [{ t: 'next.' }]],
    lead: 'Eight levels on one line, each a guided plan with a final test. Start at the first stop free, or buy the stop you’re at — once, and it’s yours, with {proMonths} months of AI practice on board.',
  },
};

/** The live hero. Change this line to run the next sequential test; log it in measurement.md. */
export const ACTIVE_HERO = 'route';
