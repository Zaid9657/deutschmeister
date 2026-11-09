// English presentation of the live syllabus. Lesson membership, sequence,
// checkpoint grouping, tasks and German quotations always come from CURRICULA.
import { curriculumFor } from './curricula/index.js';
import { A11_META } from '../../../src/data/curricula/a11.meta.js';

const A12_TITLES = [
  'Ask the way to the town hall', 'Understand a flat advert', 'Get around town',
  'Raise a problem at a hotel', 'Make plans for the weekend', 'At the doctor’s',
  'Describe people and family', 'Ask for help at home', 'Understand rules on the move',
  'Buy clothes', 'Talk about the weather', 'Talk about a celebration',
];
// Parallel translations of selected curriculum canDo entries. The source is
// retained with every card, so it can be inspected beside the English wording.
const A12_OUTCOMES = [
  { nr: 6, index: 2, en: 'Ask for an appointment at the doctor’s.', image: 'cando-appointment', icon: 'book' },
  { nr: 2, index: 0, en: 'Understand a flat advert and its numbers.', image: 'cando-flat', icon: 'layers' },
  { nr: 5, index: 3, en: 'Arrange a trip or a concert.', image: 'cando-chat', icon: 'chat' },
  { nr: 3, index: 1, en: 'Pay at the checkout and ask for a receipt.', image: 'cando-market', icon: 'gift' },
];
export function salesCurriculum(level) {
  const curriculum = curriculumFor(level);
  if (!curriculum) return null;
  const lessons = curriculum.lektionen.map((lesson) => ({
    ...lesson,
    titleEn: level === 'a1.2' ? A12_TITLES[lesson.nr - 1] : A11_META.lektionIntro[lesson.id]?.situationEn,
  }));
  const units = curriculum.checkpoints.map((cp, i) => ({
    checkpoint: cp,
    lessons: lessons.filter((l) => l.nr > (curriculum.checkpoints[i - 1]?.afterLektion || 0) && l.nr <= cp.afterLektion),
  }));
  const outcomes = level === 'a1.2'
    ? A12_OUTCOMES.map((o) => ({ ...o, lessonId: lessons.find((l) => l.nr === o.nr).id, source: lessons.find((l) => l.nr === o.nr).canDo[o.index] }))
    : lessons.slice(0, 4).map((l, i) => ({ nr: l.nr, index: 0, en: A11_META.lektionIntro[l.id].canDoEn[0], source: l.canDo[0], lessonId: l.id, image: ['cando-chat', 'cando-appointment', 'cando-flat', 'cando-market'][i], icon: 'chat' }));
  return { curriculum, lessons, units, outcomes };
}
