// What the two AI Practice cards on /subscription say AI Practice includes (revenue agent,
// 2026-10-06).
//
// WHY THIS FILE EXISTS. /subscription is where every in-app limit sends a
// learner (SubscriptionGuard, LevelSubscriptionGuard, ExamSubscriptionGuard,
// PurchaseGuard, the speaking-limit offer, a resumed Buy). Its plan cards typed
// their own feature lists in April and never followed the offer:
//   - they named none of the AI allowances AI Practice is sold on (speaking, writing
//     correction, Sentence X-Ray), the very things a learner at a limit is
//     deciding about, while /pricing/ leads with them (src/data/offers.js
//     PRO_OFFER, built from the marketing.js limits that tests/claims.test.mjs
//     compares with the functions that enforce them);
//   - the yearly card promised "Priority support" and "Early access to new
//     content". Nothing delivers either: every support ticket is created
//     priority 'normal' with the same SLA whatever the plan
//     (support-ticket-create.mjs), and no content reaches yearly subscribers
//     first. Neither claim is in src/data/marketing.js.
// So both cards render one list: in English the /pricing/ AI Practice lines
// themselves, in German the same lines, number for number. Monthly and yearly
// are the same AI Practice; the yearly saving stays on its own card (the chip and the
// per-month line, from pricing.js). Copy only: nothing here reads or changes
// entitlement. tests/subscription-plan-lines.test.mjs.
import { PRO_OFFER } from '../data/offers.js';
import {
  XRAY_LINE_DE,
  PRO_WRITING_EVALUATIONS_PER_MONTH,
} from '../data/marketing.js';

/** The /pricing/ AI Practice lines in German, in the same order and with the same figures. */
const PRO_LINES_DE = [
  'Optionales Zusatzangebot · Kurszugang separat',
  `${PRO_WRITING_EVALUATIONS_PER_MONTH} KI-Schreibkorrekturen pro Monat`,
  'KI-Sprechtraining',
  XRAY_LINE_DE,
  'Jederzeit kündbar im Kundenportal',
];

/**
 * What AI Practice includes, in the page's language.
 *
 * @param {boolean} isGerman  the page's language switch
 * @returns {string[]}  a fresh array (callers may not mutate the offer)
 */
export function proPlanLines(isGerman) {
  return isGerman ? [...PRO_LINES_DE] : [...PRO_OFFER.lines];
}
