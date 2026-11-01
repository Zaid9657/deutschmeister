// OWNER ONLY: approve the auth redirect contract and exact Supabase redirect
// allow-list before setting VITE_AUTH_CONTINUITY_ENABLED=true. Default OFF.
// Turning this off restores the existing /login email redirect and course-only
// return storage. No token handling, mail timing or access policy changes here.
export const AUTH_CONTINUITY_ENABLED = import.meta.env?.VITE_AUTH_CONTINUITY_ENABLED === 'true';
