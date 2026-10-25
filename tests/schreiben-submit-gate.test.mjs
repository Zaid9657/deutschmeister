// /schreiben's submit gate is the task's own (cross-check AI-17 / X-094), and
// "Nächste Aufgabe schreiben" opens the next task (AI-18 / X-099).
//
// The button needed ten words for every task while a Formular asks for 5–40:
// a correct value-only form — the first Start Deutsch 1 task of the exam-first
// path — stayed disabled with no reason given. The server already accepts it
// (evaluate-writing.mjs, the 12-character Formular floor).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { writingTaskByKey, writingTasksForExam } from '../src/data/writingTasks.js';

const PAGE = readFileSync(new URL('../src/pages/SchreibenPage.jsx', import.meta.url), 'utf8');

/** A module-level `const name = (…) => …;` of the page (up to the next blank line), run on its own. */
function pageFn(name) {
  const start = PAGE.indexOf(`const ${name} = `);
  assert.ok(start >= 0, `${name} not found`);
  return vm.runInNewContext(`${PAGE.slice(start, PAGE.indexOf('\n\n', start))}\n${name};`, { Number });
}

// The page's own count: whitespace-separated tokens.
const countMatch = PAGE.match(/const wordCount = (text\.trim\(\) \? text\.trim\(\)\.split\(\/\\s\+\/\)\.length : 0);/);
const wordCount = (text) => vm.runInNewContext(countMatch[1], { text });

test('a correct value-only hotel form can be sent: the floor is the task\'s minimum, capped at ten words', () => {
  assert.ok(countMatch, 'the page still counts words the same way');
  const submitWordFloor = pageFn('submitWordFloor');
  const hotel = writingTaskByKey('goethe_a1', 'formular-hotel-anmeldung');
  const compact = 'Name:Keller Vorname:Anna Geburtsdatum:03.05.1991 Adresse:Gartenstraße 5, 50667 Köln Land:Österreich';
  assert.equal(wordCount(compact), 8);
  assert.equal(submitWordFloor(hotel), Math.min(10, hotel.minWords));
  assert.ok(wordCount(compact) >= submitWordFloor(hotel), 'the complete form opens the button');
  assert.ok(wordCount(compact) < 10, 'under the old universal gate it stayed disabled');
  assert.ok(compact.length >= 12, 'and the server takes it: the Formular floor is 12 characters');
  // Every exam task: a Formular's floor is its own minimum; a letter keeps the ten words.
  for (const examKey of ['goethe_a1', 'goethe_a2', 'telc_b1', 'telc_b2']) {
    for (const task of writingTasksForExam(examKey)) {
      assert.equal(submitWordFloor(task), Math.min(10, task.minWords), task.taskKey);
      if (task.register === 'formular') assert.ok(submitWordFloor(task) <= task.minWords, task.taskKey);
      else assert.equal(submitWordFloor(task), 10, `${task.taskKey} needs ten words before grading`);
    }
  }
  assert.equal(submitWordFloor(null), 10, 'no task: the old floor');
  // The gate is wired to that floor, and says why the button waits.
  assert.match(PAGE, /const minWords = submitWordFloor\(activeTask\);/);
  assert.match(PAGE, /disabled=\{submitting \|\| wordCount < minWords\}/);
  assert.doesNotMatch(PAGE, /wordCount < 10\b/);
  assert.match(PAGE, /\{wordCount < minWords && \(\s*<span id="submit-floor"[^>]*>\s*Mindestens \{minWords\} Wörter – dann können Sie den Text bewerten lassen\./);
  assert.match(PAGE, /aria-describedby=\{wordCount < minWords \? 'submit-floor' : undefined\}/);
});

test('"Nächste Aufgabe schreiben" opens the next task of the bank, wrapping round; a one-task bank says "noch einmal"', () => {
  const nextTaskKey = pageFn('nextTaskKey');
  const bank = writingTasksForExam('telc_b1');
  assert.ok(bank.length > 1);
  assert.equal(nextTaskKey(bank, bank[0].taskKey), bank[1].taskKey);
  assert.equal(nextTaskKey(bank, bank.at(-1).taskKey), bank[0].taskKey, 'wraps round');
  assert.equal(nextTaskKey(bank, null), bank[0].taskKey);
  assert.equal(nextTaskKey([], null), null);
  assert.equal(nextTaskKey([bank[0]], bank[0].taskKey), bank[0].taskKey);
  assert.match(PAGE, /const writeNext = \(\) => \{\s*setTaskKey\(nextTaskKey\(tasks, activeTask\?\.taskKey\)\);\s*reset\(\);/);
  assert.match(PAGE, /onNext=\{writeNext\}/);
  assert.match(PAGE, /nextLabel=\{tasks\.length > 1 \? 'Nächste Aufgabe schreiben' : 'Diese Aufgabe noch einmal schreiben'\}/);
});
