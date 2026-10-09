// What the two Pro cards on /subscription say Pro includes (revenue agent,
// 2026-10-06).
//
// WHY THIS FILE EXISTS. /subscription is where every in-app limit sends a
// learner (SubscriptionGuard, LevelSubscriptionGuard, ExamSubscriptionGuard,
// PurchaseGuard, the speaking-limit offer, a resumed Buy). Its plan cards typed
// their own feature lists in April and never followed the offer:
//   - they named none of the AI allowances Pro is sold on (speaking, writing
//     correction, Sentence X-Ray), the very things a learner at a limit is
//     deciding about, while /pricing/ leads with them (src/data/offers.js
//     PRO_OFFER, built from the marketing.js limits that tests/claims.test.mjs
//     compares with the functions that enforce them);
//   - the yearly card promised "Priority support" and "Early access to new
//     content". Nothing delivers either: every support ticket is created
//     priority 'normal' with the same SLA whatever the plan
//     (support-ticket-create.mjs), and no content reaches yearly subscribers
//     first. Neither claim is in src/data/marketing.js.
// So both cards render one list: in English the /pricing/ Pro lines
// themselves, in German the same lines, number for number. Monthly and yearly
// are the same Pro; the yearly saving stays on its own card (the chip and the
// per-month line, from pricing.js). Copy only: nothing here reads or changes
// entitlement. tests/subscription-plan-lines.test.mjs.
import { PRO_OFFER } from '../data/offers.js';
import {
  UNLIMITED_CONTENT_LINE_DE,
  SPEAKING_LINE_DE,
  XRAY_LINE_DE,
  PRO_WRITING_EVALUATIONS_PER_MONTH,
} from '../data/marketing.js';

/** The /pricing/ Pro lines in German, in the same order and with the same figures. */
const PRO_LINES_DE = [
  `${UNLIMITED_CONTENT_LINE_DE}, solange Sie zahlen`,
  SPEAKING_LINE_DE,
  `${PRO_WRITING_EVALUATIONS_PER_MONTH} KI-Schreibkorrekturen pro Monat`,
  XRAY_LINE_DE,
  'Die Modelltests mit Zeitlimit',
  'Jederzeit kündbar im Kundenportal',
];

/**
 * What Pro includes, in the page's language.
 *
 * @param {boolean} isGerman  the page's language switch
 * @returns {string[]}  a fresh array (callers may not mutate the offer)
 */
export function proPlanLines(isGerman) {
  return isGerman ? [...PRO_LINES_DE] : [...PRO_OFFER.lines];
}
