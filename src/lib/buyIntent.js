// Checkout intent that survives signup.
//
// A signed-out visitor who clicks "Buy A1" on /pricing/ is sent to /signup,
// then /verify-email, then /dashboard — and the checkout they asked for never
// opens. This remembers what they clicked (localStorage, so it survives the
// email round-trip in a fresh tab) and hands every post-auth redirect the
// destination that resumes it: /subscription?buy=<key>, which opens the
// checkout once and clears the intent. Only known product keys are honoured.
import { safeGet, safeSet, safeRemove } from '../utils/safeStorage';

const KEY = 'dm_buy_intent';
const VALID = /^(monthly|yearly|telc_b1_komplett|course_[a-z0-9]+)$/;

export const setBuyIntent = (productKey) => {
  if (VALID.test(productKey || '')) safeSet(KEY, productKey);
};

export const peekBuyIntent = () => {
  const v = safeGet(KEY);
  return v && VALID.test(v) ? v : null;
};

export const clearBuyIntent = () => safeRemove(KEY);

/** Where to send a user once they are authenticated: the pending checkout, else the dashboard. */
export const postAuthPath = () => {
  const key = peekBuyIntent();
  return key ? `/subscription?buy=${encodeURIComponent(key)}` : '/dashboard';
};
