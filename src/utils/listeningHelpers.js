// Extract answer key from option string: "a) 2,50 €" → "a", "Richtig" → "Richtig"
export function getAnswerKey(option) {
  if (!option) return option;
  const match = option.match(/^([a-d])\)/);
  return match ? match[1] : option;
}

export function calculateScore(questions, answers) {
  if (!questions || questions.length === 0) return 0;
  let correct = 0;
  questions.forEach((q) => {
    const key = q.id || q.question_number;
    const selectedKey = getAnswerKey(answers[key]);
    if (selectedKey === q.correct_answer) correct++;
  });
  return Math.round((correct / questions.length) * 100);
}

export function getPerformanceMessage(score) {
  if (score >= 90) return { de: 'Ausgezeichnet!', en: 'Excellent!' };
  if (score >= 70) return { de: 'Gut gemacht!', en: 'Well done!' };
  if (score >= 50) return { de: 'Nicht schlecht!', en: 'Not bad!' };
  return { de: 'Weiter \u00fcben!', en: 'Keep practicing!' };
}

export function formatDuration(seconds) {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const themes = {
  'A1.1': { primary: '#10b981', tailwind: 'emerald' },
  'A1.2': { primary: '#14b8a6', tailwind: 'teal' },
  'A2.1': { primary: '#0ea5e9', tailwind: 'sky' },
  'A2.2': { primary: '#6366f1', tailwind: 'indigo' },
  'B1.1': { primary: '#a855f7', tailwind: 'purple' },
  'B1.2': { primary: '#ec4899', tailwind: 'pink' },
  'B2.1': { primary: '#f43f5e', tailwind: 'rose' },
  'B2.2': { primary: '#f59e0b', tailwind: 'amber' },
};

export function getLevelTheme(level) {
  return themes[level] || themes['A1.1'];
}

const subtitles = {
  'A1.1': { de: 'Anf\u00e4nger I', en: 'Beginner I' },
  'A1.2': { de: 'Anf\u00e4nger II', en: 'Beginner II' },
  'A2.1': { de: 'Grundstufe I', en: 'Elementary I' },
  'A2.2': { de: 'Grundstufe II', en: 'Elementary II' },
  'B1.1': { de: 'Mittelstufe I', en: 'Intermediate I' },
  'B1.2': { de: 'Mittelstufe II', en: 'Intermediate II' },
  'B2.1': { de: 'Obere Mittelstufe I', en: 'Upper Intermediate I' },
  'B2.2': { de: 'Obere Mittelstufe II', en: 'Upper Intermediate II' },
};

export function getLevelSubtitle(level, lang = 'en') {
  const s = subtitles[level];
  return s ? s[lang] || s.en : level;
}

export function getAudioUrl(level, exerciseNumber) {
  return `https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/audio/listening/${level}/exercise${exerciseNumber}.mp3`;
}

export function allQuestionsAnswered(questions, answers) {
  if (!questions || questions.length === 0) return false;
  return Object.keys(answers).length >= questions.length;
}
