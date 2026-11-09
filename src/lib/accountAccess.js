import { ownedPurchases } from '../data/pricing.js';

// Who may enter the account screens (/dashboard, /profile, the /modelltest
// hub): a live trial or paid period, OR anyone who bought a one-time product.
// A bought course is lifetime while its included AI Practice window expires; without
// the purchases clause a course owner was bounced to "Trial Expired /
// Subscribe now" on the day the window ended (found 2026-10-11). The content
// inside stays level-gated by hasLevelAccess, so this opens no paid level.
// A kept AI Practice-day grant window is not a bought product: it counts only while
// its access_until is ahead, through hasAccess.
export const canEnterAccount = ({ hasAccess, purchases }) =>
  Boolean(hasAccess) || ownedPurchases(Array.isArray(purchases) ? purchases : []).length > 0;
