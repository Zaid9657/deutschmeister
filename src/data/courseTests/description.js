// Describe the delivered course assessment, never the external exam named by formatOf.
export function describeCourseTest(mock, lang = 'de') {
  const en = lang === 'en';
  const titles = { hoeren: 'Listening', lesen: 'Reading', schreiben: 'Writing', sprechen: 'Speaking' };
  const sections = mock.sections.map((s) => `${en ? titles[s.key] || s.title : s.title} (${s.minutes} ${en ? 'min' : 'Min.'})`).join(', ');
  const minutes = mock.sections.reduce((sum, s) => sum + s.minutes, 0);
  const writing = mock.sections.flatMap((s) => s.parts).filter((p) => p.type === 'writing');
  const labels = writing.map((p) => p.label.replace(/^Teil \d+ · /, ''));
  const form = labels.some((label) => /Formular/.test(label));
  const message = labels.some((label) => /Mitteilung|SMS|E-Mail/.test(label));
  const missing = [!form && (en ? 'a form' : 'ein Formular'), !message && (en ? 'a free message' : 'eine freie Mitteilung'),
    !mock.sections.some((s) => s.key === 'sprechen') && (en ? 'speaking' : 'Sprechen')].filter(Boolean).join(', ');
  const scored = mock.sections.filter((s) => s.parts.some((p) => p.type !== 'writing'))
    .map((s) => en ? titles[s.key] || s.title : s.title).join(en ? ' and ' : ' und ');
  if (en) return `Adapted course assessment: ${sections}; ${minutes} minutes total. ` +
    `Writing self-check: ${labels.map((label) => label.replace('Formular', 'form').replace('Mitteilung', 'short message')).join(', ')}; excluded from the score. ` +
    `Not included: ${missing}. Course pass rule: at least ${mock.passPercent}% of the combined automatically scored ${scored} points. ` +
    'This is not an official exam, does not reproduce the full exam format, and does not use official exam scoring.';
  return `Adaptierter Kurstest: ${sections}; insgesamt ${minutes} Minuten. ` +
    `Schreiben mit Selbstcheck: ${labels.join(', ')}; zählt nicht zur Punktzahl. ` +
    `Nicht enthalten: ${missing}. Kurs-Bestehensregel: mindestens ${mock.passPercent} % der gemeinsamen automatisch bewerteten Punkte in ${scored}. ` +
    'Keine offizielle Prüfung, kein vollständiges Prüfungsformat und keine offizielle Prüfungsbewertung.';
}
