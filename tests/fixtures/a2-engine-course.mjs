// Synthetic engine fixture only. Never imported by a curriculum registry.
import { CURRICULUM_A12 } from '../../src/data/curricula/a12.js';
import { examFormat } from '../../src/data/curricula/examFormats.js';

export const calendar = [
  { owner: 'Anna', slots: [{ time: 'Montag 10 Uhr', activity: 'Arbeit' }, { time: 'Dienstag 15 Uhr', activity: 'frei' }] },
  { owner: 'Ben', slots: [{ time: 'Montag 10 Uhr', activity: 'Arzt' }, { time: 'Dienstag 15 Uhr', activity: 'frei' }] },
];

export function unitFor(teil, n = 0, paper = 0) {
  const format = examFormat('goethe_a2').parts.find((p) => p.teil === teil).format;
  const kind = format === 'match' ? 'match' : format === 'yes-no' ? 'trueFalse' : 'mc3';
  const options = kind === 'trueFalse' ? ['Ja', 'Nein'] : kind === 'match' ? ['Anna', 'Ben', 'Clara', 'David', 'Eva', 'Niemand'] : ['Montag', 'Dienstag', 'Mittwoch'];
  const stimulus = paper ? 'Ben arbeitet am Dienstag. Anna arbeitet am Montag.' : 'Anna arbeitet am Dienstag. Ben arbeitet am Montag.';
  return {
    id: `${teil.replaceAll(' ', '-')}-${paper}-${n}`, teil, kind, groupId: `${teil}-${paper}`,
    question: kind === 'match' ? `Wer arbeitet am Dienstag? Aufgabe ${n + 1}.` : kind === 'trueFalse' ? 'Arbeitet Anna am Dienstag?' : 'Wann arbeitet Anna?',
    questionEn: 'Read or listen and choose the answer.',
    ...(teil.startsWith('Lesen') ? { text: stimulus } : { audioText: stimulus }),
    options, answer: kind === 'match' ? (paper ? 'Ben' : 'Anna') : kind === 'trueFalse' ? (paper ? 'Nein' : 'Ja') : (paper ? 'Montag' : 'Dienstag'),
    explanationDe: stimulus, explanationEn: 'The text states the day.',
    ...(format === 'mc3-picture' ? { pictures: options.map((option) => ({ option, src: '/favicon.svg', alt: `Kalender: ${option}` })) } : {}),
  };
}

export function a2EngineCourse() {
  const c = structuredClone(CURRICULUM_A12);
  c.level = 'a2.1'; c.code = 'A2.1'; c.examKey = 'goethe_a2';
  c.lektionen = c.lektionen.slice(0, 3).map((l, i) => ({
    ...l, id: `a2.1-l0${i + 1}`,
    schreiben: { ...l.schreiben, kind: 'mitteilung', textsorte: i === 1 ? 'email' : 'sms', minWords: i === 1 ? 30 : 20, maxWords: i === 1 ? 40 : 30 },
    lesen: { teil: 'Lesen Teil 4', units: Array.from({ length: 3 }, (_, n) => unitFor('Lesen Teil 4', n)) },
    hoeren: { kind: 'exam', teil: 'Hören Teil 1', units: Array.from({ length: 3 }, (_, n) => unitFor('Hören Teil 1', n)) },
    sprechen: { ...l.sprechen, open: {
      ...l.sprechen.open, teil: `Sprechen Teil ${i + 1}`,
      ...(i === 0 ? { cards: ['Familie', 'Arbeit', 'Wohnort', 'Freizeit'] } : i === 1 ? { prompts: ['Am Morgen', 'Bei der Arbeit', 'Am Abend', 'Am Wochenende'] } : { calendar: structuredClone(calendar) }),
    } },
  }));
  c.checkpoints = examFormat('goethe_a2').checkpointParts.map((parts, i) => ({
    id: `a2.1-cp${i + 1}`, nr: i + 1, afterLektion: (i + 1) * 3, title: `Fixture ${i + 1}`,
    ...Object.fromEntries(['lesen', 'hoeren'].map((section) => [section, {
      papers: [0, 1].map((paper) => Array.from({ length: section === 'lesen' ? 4 : 5 }, (_, n) => {
        const unit = unitFor(parts[section], n, paper);
        if (section === 'hoeren' && parts.hoerenKinds?.[n] === 'dictation') {
          unit.kind = 'dictation';
          unit.question = 'Hören und schreiben Sie.';
          unit.audioText = n === 0 ? 'Wir arbeiten heute zu Hause.' : 'Heute ist Mittwoch.';
          unit.answer = unit.audioText;
          delete unit.options; delete unit.groupId;
        }
        return unit;
      })),
    }])),
  }));
  return c;
}
