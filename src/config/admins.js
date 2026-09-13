// Admin allow-list for the SPA's owner-only surfaces (the /admin/* routes and
// the admin links in the nav). One place, so adding an admin is one line here
// rather than a hunt through every component that used to hard-code an email.
//
// This is a UI gate only: the data these surfaces write (the video-library
// bucket, the videos table) is protected by Supabase RLS for any signed-in
// user, and paid content access is a separate question answered by
// SubscriptionContext.hasLevelAccess, not by this list.
export const ADMIN_EMAILS = Object.freeze([
  'zaid199660@gmail.com',
  'baraawail101@gmail.com',
]);

/** True when the signed-in user's email is on the admin list (case-insensitive). */
export const isAdminEmail = (email) =>
  typeof email === 'string' && ADMIN_EMAILS.includes(email.trim().toLowerCase());
