import { useTranslation } from 'react-i18next';

/**
 * The Arabic `t` on screens whose English copy still lives inline in the
 * component (the account screens, the trial banner): null unless the route is
 * rendered in Arabic (src/lib/locale.js effectiveLocale), so a caller writes
 *
 *     {ta ? ta('account.login.title') : 'Welcome Back'}
 *
 * — the same shape as the codebase's long-standing `isGerman ? … : …` idiom,
 * with the Arabic in the i18next bundle (src/locales/ar/app.js) rather than
 * inline. Re-renders on a language change (useTranslation subscribes).
 */
export function useArabicT() {
  const { i18n } = useTranslation();
  return i18n.language === 'ar' ? i18n.getFixedT('ar') : null;
}

/** Supabase auth error codes the account screens explain in Arabic. */
const KNOWN_AUTH_ERRORS = [
  'invalid_credentials', 'user_already_exists', 'weak_password', 'email_address_invalid',
  'over_email_send_rate_limit', 'over_request_rate_limit', 'same_password',
];

/**
 * An auth error as Arabic text. Known codes get a sentence of their own; an
 * unknown error says so and keeps the server's English message (marked as
 * English by the caller) — never a guessed translation of it.
 */
const LOCAL_CODES = { passwords_mismatch: 'account.passwordsDontMatch', password_short: 'account.passwordTooShort', unexpected: 'account.unexpected' };

export function arabicAuthError(ta, error) {
  if (!ta || !error) return null;
  const code = error.code || '';
  if (LOCAL_CODES[code]) return { text: ta(LOCAL_CODES[code]), english: null };
  const msg = String(error.message || '');
  if (KNOWN_AUTH_ERRORS.includes(code)) return { text: ta(`account.errors.${code}`), english: null };
  if (/invalid login credentials/i.test(msg)) return { text: ta('account.errors.invalid_credentials'), english: null };
  if (/already registered|already exists/i.test(msg)) return { text: ta('account.errors.user_already_exists'), english: null };
  if (/failed to fetch|network/i.test(msg)) return { text: ta('account.errors.network'), english: null };
  return { text: ta('account.serverError'), english: msg || null };
}
