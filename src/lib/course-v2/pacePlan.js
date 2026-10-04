// Course v2 — the course home's one-line plan hook (BLUEPRINT §7.6), pure.
//
// The full v2 plan (Plateau and Modelltest dates, review minutes, the plan screen)
// belongs to E1-7's plan module; this is only the arithmetic the course home can
// show today, with the blueprint's rules:
//   - capacity comes from the pace preset in LERNSCHRITTE per week
//     (course.json `pace.<preset>.unitsPerWeek` × 7 steps at A / 8 at B) — never
//     the live course's SUSTAINABLE_PER_WEEK;
//   - the only statuses are 'on-track', 'needs-more-days' and 'no-date' — there is
//     no 'behind';
//   - the copy is always phrased forward, and when the date is too close it states
//     the arithmetic and offers options that keep the progression intact.

export const DAY_MS = 24 * 60 * 60 * 1000;
export const PACE_LABEL_DE = Object.freeze({ leicht: 'leicht', standard: 'Standard', intensiv: 'intensiv' });

const fmtDate = (d) => {
  try {
    return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return d.toISOString().slice(0, 10);
  }
};

/**
 * planSummary({ manifest, pace, remainingSteps, examDate, today }) →
 *   { status, pace, stepsPerWeek, weeks, finishDate, neededPerWeek, lineDe }
 * `examDate` is a Date, an ISO date string or null.
 */
export function planSummary({ manifest, pace = 'standard', remainingSteps = 0, examDate = null, today = new Date() } = {}) {
  const presets = (manifest && manifest.pace) || {};
  const preset = presets[pace] || presets.standard || { unitsPerWeek: 1 };
  const stepsPerUnit = String((manifest && manifest.level) || '').startsWith('b') ? 8 : 7;
  const stepsPerWeek = Math.max(1, Math.round((Number(preset.unitsPerWeek) || 1) * stepsPerUnit));
  const remaining = Math.max(0, Number(remainingSteps) || 0);
  const weeks = Math.ceil(remaining / stepsPerWeek);
  const finishDate = new Date(today.getTime() + weeks * 7 * DAY_MS);
  const label = PACE_LABEL_DE[pace] || PACE_LABEL_DE.standard;

  if (remaining === 0) {
    return { status: 'on-track', pace, stepsPerWeek, weeks: 0, finishDate: today, neededPerWeek: 0, lineDe: 'Alle Lernschritte sind geschafft.' };
  }

  const exam = examDate ? new Date(examDate) : null;
  if (!exam || Number.isNaN(exam.getTime())) {
    return {
      status: 'no-date', pace, stepsPerWeek, weeks, finishDate, neededPerWeek: stepsPerWeek,
      lineDe: `Im Tempo „${label}“ (${stepsPerWeek} Lernschritte pro Woche) sind Sie in etwa ${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'} fertig.`,
    };
  }

  const weeksLeft = Math.max(0, (exam.getTime() - today.getTime()) / (7 * DAY_MS));
  const neededPerWeek = weeksLeft > 0 ? Math.ceil(remaining / weeksLeft) : remaining;
  if (neededPerWeek <= stepsPerWeek) {
    return {
      status: 'on-track', pace, stepsPerWeek, weeks, finishDate, neededPerWeek,
      lineDe: `Diese Woche ${stepsPerWeek} Lernschritte – dann sind Sie bis zu Ihrem Termin am ${fmtDate(exam)} im Plan.`,
    };
  }
  return {
    status: 'needs-more-days', pace, stepsPerWeek, weeks, finishDate, neededPerWeek,
    lineDe: `Bis zu Ihrem Termin am ${fmtDate(exam)} brauchen Sie etwa ${neededPerWeek} Lernschritte pro Woche. Mehr Lerntage, „Ich kann das schon“ oder ein späterer Termin machen das möglich.`,
  };
}
