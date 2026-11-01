// Owned editorial demonstration of the writing evaluator's response shape
// (evaluate-writing.mjs: corrections, strengths, improvements, leitpunkt_check).
// This is NOT a captured API response or customer result. No score is invented.
import { writingTaskByKey } from './writingTasks.js';

export const TELC_WRITING_EXAMPLE = {
  label: 'Demonstrationsbeispiel, kein Kundentext',
  provenance: 'Eigener Beispieltext mit redaktionell erstellten Hinweisen im Stil des KI-Schreibtrainings. Keine aufgezeichnete KI-Bewertung und kein offizielles telc-Material.',
  task: writingTaskByKey('telc_b1', 'beschwerde-lieferung'),
  draft: [
    'Sehr geehrte Damen und Herren,',
    'vor zwei Wochen habe ich in Ihrem Online-Shop einen Rucksack bestellt und sofort bezahlt. Leider ist das Paket noch nicht angekommen. In meinem Konto steht seit mehreren Tagen nur „in Bearbeitung“. Ich brauche den Rucksack für eine Reise am nächsten Wochenende. Deshalb bin ich etwas besorgt. Gestern habe ich Ihren Kundenservice angerufen, aber niemand hat geantwortet. Ich möchte wissen, wo ist mein Paket. Bitte schicken Sie mir den Rucksack bald. Ich hoffe, dass Sie mir helfen können.',
    'Mit freundlichen Grüßen',
    'Alex Berger',
  ],
  feedback: {
    strength: 'Bestellung, Lieferproblem und bisheriger Versuch sind verständlich beschrieben. Anrede und Gruß passen zum Kundenservice.',
    leitpunkt_check: [true, true, true, false],
    improvement: 'Ihre Bitte enthält noch keine konkrete Frist. Nennen Sie einen Tag, bis zu dem Sie die Lieferung erwarten.',
    corrections: [{
      original: 'Ich möchte wissen, wo ist mein Paket.',
      corrected: 'Ich möchte wissen, wo mein Paket ist.',
      note: 'In der indirekten Frage steht das Verb am Ende: „wo mein Paket ist“.',
    }],
  },
  revision: [
    'Sehr geehrte Damen und Herren,',
    'vor zwei Wochen habe ich in Ihrem Online-Shop einen Rucksack bestellt und sofort bezahlt. Leider ist das Paket noch nicht angekommen. In meinem Konto steht seit mehreren Tagen nur „in Bearbeitung“. Ich brauche den Rucksack für eine Reise am nächsten Wochenende. Deshalb bin ich etwas besorgt. Gestern habe ich Ihren Kundenservice angerufen, aber niemand hat geantwortet. Ich möchte wissen, wo mein Paket ist. Bitte liefern Sie den Rucksack bis Freitag. Falls das nicht möglich ist, bitte ich um eine Rückerstattung. Vielen Dank für Ihre Hilfe.',
    'Mit freundlichen Grüßen',
    'Alex Berger',
  ],
};
