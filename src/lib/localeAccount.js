// The account half of the interface locale (src/lib/locale.js §3).
//
// The preference rides in Supabase `user_metadata` (`ui_lang`, `ui_lang_at`) —
// the same metadata-only pattern `starting_point` uses (src/lib/firstRun.js) —
// so no table and no production migration is needed. The rule is
// reconcileAccount(): the NEWER explicit choice wins, on either side.
import { supabase } from '../utils/supabase';
import { accountChoice, getDeviceChoice, reconcileAccount, setLocale } from './locale.js';
import { ensureLocaleResources } from '../locales';

/** Metadata to send with signUp(): the device's explicit choice, if any. */
export function signupLocaleMetadata() {
  const local = getDeviceChoice();
  if (!local || local.source !== 'explicit') return {};
  return { ui_lang: local.lang, ui_lang_at: local.at };
}

/** Write the device's explicit choice to the account (fire-and-forget). */
export function pushAccountLocale(choice, client = supabase) {
  if (!choice) return Promise.resolve(false);
  return client.auth
    .updateUser({ data: { ui_lang: choice.lang, ui_lang_at: choice.at } })
    .then(({ error }) => {
      if (error) console.error('[locale] account preference not saved:', error.message);
      return !error;
    })
    .catch(() => false);
}

/**
 * After a session appears: pull a newer account choice onto this device, or
 * push this device's newer explicit choice to the account. Never throws.
 */
export async function syncAccountLocale(user, client = supabase) {
  if (!user) return 'none';
  const local = getDeviceChoice();
  const account = accountChoice(user.user_metadata);
  const action = reconcileAccount(local, account);
  if (action === 'pull') {
    const ok = await ensureLocaleResources(account.lang);
    if (ok) setLocale(account.lang, { source: 'account', at: account.at, surface: 'account' });
  } else if (action === 'push') {
    await pushAccountLocale(local, client);
  }
  return action;
}
