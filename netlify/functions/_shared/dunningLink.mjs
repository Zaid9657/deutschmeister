// Where the dunning mail's "Update payment method" button points.
//
// subscription_payment_failed delivers a subscription-INVOICE. Its
// attributes.urls holds only `invoice_url`. That was measured on all three
// production failures (2026-09-26, 09-27, 09-29). The signed
// `update_payment_method` link lives on the SUBSCRIPTION object, which Lemon
// Squeezy sends as subscription_updated. On 09-26 that event arrived 0.6 s
// before the failure, on 09-27 0.4 s after it, and in both cases another
// subscription_updated (the renewal attempt) had arrived about an hour earlier.
// Until 2026-09-30 the webhook fell back to /dashboard, and nothing there can
// change a card. Both dunning mails sent so far therefore had a button that
// could not do what it said.
//
// Resolution order, first match wins:
//   1. the invoice's own urls.update_payment_method (not present today; kept in
//      case Lemon Squeezy adds it);
//   2. the newest subscription_updated for the same subscription, logged within
//      SIGNED_URL_MAX_AGE_MS. Lemon Squeezy signs these links for a limited time
//      (24 h in its subscription-object docs), so an older one is skipped rather
//      than mailed dead;
//   3. the store's Customer Portal. It is a stable link that never expires: the
//      customer signs in with the email address they bought with.
//
// The mail also always carries the portal as a second line, because a signed
// link that works when the mail is sent can still expire before it is opened.

export const BILLING_PORTAL_URL = 'https://deutsch-meister.lemonsqueezy.com/billing';

// One hour short of the 24 h signature window, so the link survives at least
// the first hour after sending.
export const SIGNED_URL_MAX_AGE_MS = 23 * 60 * 60 * 1000;

/** True for an https URL on lemonsqueezy.com or one of its subdomains. */
export function isLemonSqueezyUrl(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && (u.hostname === 'lemonsqueezy.com' || u.hostname.endsWith('.lemonsqueezy.com'));
  } catch {
    return false;
  }
}

/**
 * Pick the update-payment link for a failed renewal.
 *
 * @param {object} args
 * @param {object} [args.invoiceAttributes]  data.attributes of the failed subscription-invoice
 * @param {Array<{created_at: string, payload: object}>} [args.subscriptionEvents]
 *        webhook_logs rows of event_type 'subscription_updated' for this subscription, any order
 * @param {string|number} [args.subscriptionId]  the Lemon Squeezy subscription id
 * @param {number} [args.now]  epoch ms (for tests)
 * @returns {{ url: string, source: 'invoice' | 'subscription_updated' | 'portal' }}
 */
export function pickUpdatePaymentUrl({ invoiceAttributes, subscriptionEvents, subscriptionId, now = Date.now() } = {}) {
  const direct = invoiceAttributes?.urls?.update_payment_method;
  if (isLemonSqueezyUrl(direct)) return { url: direct, source: 'invoice' };

  const wanted = subscriptionId == null ? null : String(subscriptionId);
  const fresh = (subscriptionEvents || [])
    .filter((row) => {
      const t = Date.parse(row?.created_at);
      if (!Number.isFinite(t) || now - t > SIGNED_URL_MAX_AGE_MS || t - now > 5 * 60 * 1000) return false;
      if (wanted !== null && String(row?.payload?.data?.id) !== wanted) return false;
      return isLemonSqueezyUrl(row?.payload?.data?.attributes?.urls?.update_payment_method);
    })
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  if (fresh.length > 0) {
    return { url: fresh[0].payload.data.attributes.urls.update_payment_method, source: 'subscription_updated' };
  }

  return { url: BILLING_PORTAL_URL, source: 'portal' };
}
