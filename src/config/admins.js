// Admin allow-list for the SPA's owner-only surfaces (the /admin/* routes and
// the admin links in the nav). One place, so adding an admin is one line here
// rather than a hunt through every component that used to hard-code an email.
//
// In the SPA this list is a UI gate. The database enforces the same list for
// the one surface that writes with the admin's own JWT, the video library:
// migrations/2026-09-28-video-library-admin-writes.sql lets only a JWT whose
// lower(email) is on this list insert, update or delete `video_library` rows
// and `video-library` bucket objects (before that migration, any signed-in
// user could). The migration carries its own copy of the list, and
// tests/video-library-writes.test.mjs fails when the two differ, so change
// both in one commit, and remove an address here before it is freed.
// Paid content access is a separate question, answered by
// SubscriptionContext.hasLevelAccess, not by this list.
export const ADMIN_EMAILS = Object.freeze([
  'zaid199660@gmail.com',
  'baraawail101@gmail.com',
]);

/** True when the signed-in user's email is on the admin list (case-insensitive). */
export const isAdminEmail = (email) =>
  typeof email === 'string' && ADMIN_EMAILS.includes(email.trim().toLowerCase());
