// Build-time derivation from the actual plan. These count scheduled practice items,
// not the complete underlying library or distinct reading texts.
import { PROGRAM } from '../../../src/data/programs/startDeutsch1.js';
export const examDays = PROGRAM.weeks.flatMap((week) => week.days);
export const examItems = examDays.flatMap((day) => day.items);
export const examCounts = Object.fromEntries(['lesson', 'listening', 'reading', 'speaking'].map((type) => [type, examItems.filter((item) => item.type === type).length]));
export const examWeeks = [
  { title: 'Build the basics', body: 'Key grammar and vocabulary.', image: 'scene-cafe' },
  { title: 'Train listening and reading', body: 'Make everyday German familiar.', image: 'offer-exam' },
  { title: 'Practise speaking and writing', body: 'Work with the exam task formats.', image: 'hero' },
  { title: 'Review, fill gaps and take the practice test', body: 'Then use the two buffer days for a final check.', image: 'offer-complete' },
];
