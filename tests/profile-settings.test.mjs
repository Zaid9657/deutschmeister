// Two account settings on /profile (src/pages/ProfilePage.jsx).
//
// SHL-12 (cross-check 2026-10-25, C-091): the exam-date field saved on every
// change. A date input reports each keystroke of the year as a valid value
// ('0002-05-12', then '0020-05-12'), and every one was written to
// profiles.exam_date — which feeds the dashboard countdown and the course plan —
// with no lower bound. The field now keeps a draft and saves a real date once.
//
// SHL-13 (C-095): the account-deletion confirmation was a plain overlay with no
// dialog semantics, no focus handling and no Escape, and its email check was
// case-sensitive, so 'Anna@Gmail.com' never confirmed anna@gmail.com.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const src = read('src/pages/ProfilePage.jsx');
const piece = (re, what) => {
  const m = src.match(re);
  assert.ok(m, `ProfilePage.jsx: ${what} not found`);
  return m[0];
};

const helpers = () => vm.runInNewContext(
  [
    piece(/^const dateInput = [^\n]*;$/m, 'dateInput'),
    piece(/^const EXAM_DATE_YEARS_AHEAD = \d+;$/m, 'EXAM_DATE_YEARS_AHEAD'),
    piece(/^const examDateToSave = \(value, now = new Date\(\)\) => \{[\s\S]*?\n\};$/m, 'examDateToSave'),
  ].join('\n') + '\n({ dateInput, examDateToSave });',
  {},
);

test('only a real date from today to five years ahead is saved; empty clears it', () => {
  const { examDateToSave } = helpers();
  const now = new Date(2026, 9, 25, 9, 30); // 25 Oct 2026, local time
  for (const typing of ['0002-05-12', '0020-05-12', '0202-05-12']) {
    assert.equal(examDateToSave(typing, now), undefined, `${typing}: a keystroke on the way to 2026`);
  }
  assert.equal(examDateToSave('2026-10-24', now), undefined, 'yesterday');
  assert.equal(examDateToSave('2026-10-25', now), '2026-10-25', 'today');
  assert.equal(examDateToSave('2027-03-14', now), '2027-03-14');
  assert.equal(examDateToSave('2031-10-25', now), '2031-10-25', 'five years ahead');
  assert.equal(examDateToSave('2031-10-26', now), undefined);
  assert.equal(examDateToSave('2027-02-31', now), undefined, 'a day that does not exist');
  assert.equal(examDateToSave('', now), null);
  assert.equal(examDateToSave(null, now), null);
});

function saveExamDate({ draft, saved }) {
  const writes = [];
  const drafts = [];
  vm.runInNewContext(`${piece(/ {2}const saveExamDate = \(\) => \{[\s\S]*?\n {2}\};/, 'saveExamDate')}\nsaveExamDate();`, {
    examDateDraft: draft,
    examDateToSave: helpers().examDateToSave,
    setExamDateDraft: (value) => drafts.push(value),
    profile: { exam_date: saved },
    saveGoalField: (fields) => writes.push({ ...fields }),
  });
  return { writes, drafts };
}

test('the field writes once, on blur or Enter, and only what may be saved', () => {
  const next = new Date();
  next.setMonth(next.getMonth() + 3);
  const future = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
  assert.deepEqual(saveExamDate({ draft: '0002-05-12', saved: null }), { writes: [], drafts: [] }, 'a half-typed year stays a draft');
  assert.deepEqual(saveExamDate({ draft: future, saved: null }), { writes: [{ exam_date: future }], drafts: [null] });
  assert.deepEqual(saveExamDate({ draft: future, saved: future }), { writes: [], drafts: [null] }, 'unchanged: no write');
  assert.deepEqual(saveExamDate({ draft: '', saved: future }), { writes: [{ exam_date: null }], drafts: [null] }, 'clearing the date');
  assert.deepEqual(saveExamDate({ draft: null, saved: future }), { writes: [], drafts: [] }, 'nothing typed');

  assert.doesNotMatch(src, /onChange=\{\(e\) => saveGoalField\(\{ exam_date/, 'no write per keystroke');
  assert.match(src, /onChange=\{\(e\) => setExamDateDraft\(e\.target\.value\)\}/);
  assert.match(src, /onBlur=\{saveExamDate\}/);
  assert.match(src, /onKeyDown=\{\(e\) => \{ if \(e\.key === 'Enter'\) saveExamDate\(\); \}\}/);
  assert.match(src, /min=\{dateInput\(new Date\(\)\)\}/, 'the picker starts at today');
  // The warning judges the draft only: an exam date that has passed is no error.
  assert.match(src, /const examDateValid = examDateDraft === null \|\| examDateToSave\(examDateDraft\) !== undefined;/);
});

test('the deletion email check ignores case and surrounding spaces', () => {
  const expr = piece(/const emailMatches = [^;]*;/, 'emailMatches');
  const matches = (typed, email) => vm.runInNewContext(`${expr}\nemailMatches;`, { user: { email }, deleteEmail: typed });
  assert.equal(matches('Anna@Gmail.com', 'anna@gmail.com'), true);
  assert.equal(matches('  anna@gmail.com ', 'anna@gmail.com'), true);
  assert.equal(matches('anna@gmail.co', 'anna@gmail.com'), false);
  assert.equal(matches('', 'anna@gmail.com'), false);
  assert.equal(matches('anna@gmail.com', ''), false);
});

function dialogHarness({ pending = false } = {}) {
  class El {
    constructor(name) { this.name = name; }
    focus() { harness.document.activeElement = this; }
  }
  const trigger = new El('trigger');
  const input = new El('input');
  const cancel = new El('cancel');
  const confirm = new El('delete');
  const listeners = new Map();
  const closed = [];
  const harness = {
    trigger, input, cancel, confirm, closed,
    document: {
      activeElement: trigger,
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: (name) => listeners.delete(name),
    },
    key(key, { shiftKey = false } = {}) {
      let prevented = false;
      listeners.get('keydown')?.({ key, shiftKey, preventDefault: () => { prevented = true; } });
      return prevented;
    },
  };
  const effect = piece(/ {2}useEffect\(\(\) => \{\n {4}if \(!showDeleteConfirm\) return undefined;[\s\S]*?\n {2}\}, \[showDeleteConfirm\]\);/, 'the dialog effect');
  const cleanup = vm.runInNewContext(`let cleanup; const useEffect = (fn) => { cleanup = fn(); };\n${effect}\ncleanup;`, {
    showDeleteConfirm: true,
    deleteTriggerRef: { current: trigger },
    deleteInputRef: { current: input },
    deleteDialogRef: { current: { querySelectorAll: () => [input, cancel, confirm], contains: (el) => [input, cancel, confirm].includes(el) } },
    deletionPending: { current: pending },
    setShowDeleteConfirm: (value) => closed.push(value),
    FOCUSABLE: piece(/^const FOCUSABLE = '[^']+';$/m, 'FOCUSABLE').match(/'([^']+)'/)[1],
    document: harness.document,
    HTMLElement: El,
  });
  harness.cleanup = cleanup;
  return harness;
}

test('the deletion confirmation is a modal dialog: focus in, Tab kept inside, Escape out, focus back', () => {
  assert.match(src, /role="dialog"\s+aria-modal="true"\s+aria-labelledby="delete-account-title"\s+aria-describedby="delete-account-desc"/);
  assert.match(src, /<h3 id="delete-account-title"/);
  assert.match(src, /<p id="delete-account-desc"/);
  assert.match(src, /<button\s+ref=\{deleteTriggerRef\}/);
  assert.match(src, /<input ref=\{deleteInputRef\} type="email"/);

  const h = dialogHarness();
  assert.equal(h.document.activeElement, h.input, 'focus moves to the email field');
  h.document.activeElement = h.confirm;
  assert.equal(h.key('Tab'), true);
  assert.equal(h.document.activeElement, h.input, 'Tab from the last control wraps to the first');
  assert.equal(h.key('Tab', { shiftKey: true }), true);
  assert.equal(h.document.activeElement, h.confirm, 'Shift+Tab from the first wraps to the last');
  h.document.activeElement = h.cancel;
  assert.equal(h.key('Tab'), false, 'Tab between inner controls is left to the browser');
  h.document.activeElement = h.trigger; // focus escaped behind the overlay (a click)
  h.key('Tab');
  assert.equal(h.document.activeElement, h.input, 'Tab brings focus back into the dialog');
  h.key('Escape');
  assert.deepEqual(h.closed, [false], 'Escape cancels');
  h.cleanup();
  assert.equal(h.document.activeElement, h.trigger, 'focus returns to Delete account');
});

test('Escape cannot close the dialog while the deletion runs', () => {
  const h = dialogHarness({ pending: true });
  h.key('Escape');
  assert.deepEqual(h.closed, []);
});
