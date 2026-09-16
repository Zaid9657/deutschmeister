// Named-human-review release gate for DeutschStart A1.1 — plan:
// docs/superpowers/plans/2026-09-15-deutschstart-a11-course-readiness.md Task 4.
//
// The €39 course may not be sold as premium until a qualified DaF reviewer
// signs RELEASE-REVIEW-2026-09.md with a filled name, qualification, date,
// materials list, APPROVED verdict and a verifiable approval reference.
// Fabricating that document is forbidden; this test only verifies it.
//
// Modes (same honesty model as tests/a11-premium-readiness.test.mjs):
//   * npm test — while the review is visibly pending, SKIP with a loud
//     reason; once someone starts filling it in, the assertions arm.
//   * npm run verify:a11-release (A11_RELEASE_GATE=1) — hard FAIL until the
//     review is complete and APPROVED. Release evidence quotes this mode.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const doc = readFileSync(
  new URL('../docs/course-factory/a11-rebuild/RELEASE-REVIEW-2026-09.md', import.meta.url),
  'utf8',
);

const FIELDS = [
  'Reviewer name:',
  'Qualification:',
  'Review date:',
  'Materials reviewed:',
  'Verdict:',
  'Signature or verifiable approval reference:',
];

const fieldValue = (label) => {
  const m = doc.match(new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[ \t]*(.*)$`, 'm'));
  return m ? m[1].trim() : null;
};

const RELEASE_GATE = process.env.A11_RELEASE_GATE === '1';
const pending = fieldValue('Verdict:') === 'PENDING' && !fieldValue('Reviewer name:');
const skip = !RELEASE_GATE && pending
  ? 'RELEASE GATE NOT MET: the named DaF release review is pending (docs/course-factory/a11-rebuild/RELEASE-REVIEW-2026-09.md). Run `npm run verify:a11-release` to enforce.'
  : false;

test('a named, qualified reviewer has APPROVED the A1.1 release', { skip }, () => {
  for (const label of FIELDS) {
    const value = fieldValue(label);
    assert.ok(value !== null, `field missing from the review document: ${label}`);
    assert.ok(value.length > 0, `field is blank: ${label}`);
  }
  assert.equal(fieldValue('Verdict:'), 'APPROVED', 'the release verdict is not APPROVED');
});
