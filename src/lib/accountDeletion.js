// How a learner deletes their account: by email, until a deletion endpoint exists.
//
// WHY. /profile carried a "Delete Account" button whose modal promised "All
// your progress and data will be permanently deleted", and whose Delete
// button only closed the modal (the handler was a comment). The learner left
// believing the account was gone; nothing was deleted (docs/auth-audit-
// 2026-10-06.md, F2). Deletion is done by hand from the request mail, within
// the month the privacy policy promises (astro-site/src/pages/privacy.astro
// §11), so the button now writes that mail. The address is the published
// contact point, not a retyped literal.
import { ORGANIZATION_FULL } from '../data/organization.js';

export const DELETION_ADDRESS = ORGANIZATION_FULL.contactPoint.email;

/**
 * @param {string|null|undefined} accountEmail  the signed-in user's address
 * @returns {string} a mailto: link with subject and body filled in
 */
export function deletionMailto(accountEmail) {
  const subject = 'Delete my DeutschMeister account';
  const body = [
    'Please delete my DeutschMeister account and all its data.',
    '',
    `Account email: ${accountEmail || ''}`,
  ].join('\n');
  return `mailto:${DELETION_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
