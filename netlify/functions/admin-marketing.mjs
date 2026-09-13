// Admin panel — marketing. The honest answer first: there is NO acquisition
// attribution on this site (profiles has no source column and nothing
// captures UTM/referrer), so the module says so with an unblock step instead
// of rendering a grid of noughts. What IS real: lifecycle email volumes,
// signup attempts and their failures, and the coupon summary.
import { adminEndpoint, fetchAll, exactCount, counting } from './_shared/adminHttp.mjs';
import { windowFor, seriesFor } from './_shared/adminFunnelLib.mjs';
import { effectiveStatus } from './_shared/adminCouponsLib.mjs';

export const handler = adminEndpoint({ capability: 'marketing.read' }, async ({ body, supabase }) => {
  const now = new Date();
  const range = ['7d', '30d', '90d'].includes(body.range) ? body.range : '30d';
  const w = windowFor(range, now);
  const totalUsers = await exactCount(() => counting(supabase, 'profiles'));
  const lifecycle = await fetchAll(() => supabase.from('lifecycle_emails').select('kind, sent_at').gte('sent_at', w.from).lt('sent_at', w.to));
  const byKind = {};
  for (const l of lifecycle) { const k = l.kind.replace(/_\d{4}-\d{2}-\d{2}$/, '_*'); byKind[k] = (byKind[k] || 0) + 1; }
  const optedOut = await exactCount(() => counting(supabase, 'profiles').eq('email_daily_sentence', false));
  const attempts = await fetchAll(() => supabase.from('signup_attempts').select('error_code, error_message, attempted_at').gte('attempted_at', w.from).lt('attempted_at', w.to));
  const byError = {};
  for (const a of attempts) byError[a.error_code || 'unbekannt'] = (byError[a.error_code || 'unbekannt'] || 0) + 1;
  const signups = await fetchAll(() => supabase.from('profiles').select('created_at').gte('created_at', w.from).lt('created_at', w.to));
  const coupons = await fetchAll(() => supabase.from('coupons').select('id, code, status, ends_at, total_limit'));
  const redemptions = await fetchAll(() => supabase.from('coupon_redemptions').select('coupon_id, redeemed_at, discount_amount, currency'));
  const countBy = new Map();
  for (const r of redemptions) countBy.set(r.coupon_id, (countBy.get(r.coupon_id) || 0) + 1);
  const couponSummary = { total: coupons.length, active: coupons.filter((c) => effectiveStatus(c, countBy.get(c.id) || 0, now.getTime()) === 'active').length, redemptionsInWindow: redemptions.filter((r) => r.redeemed_at >= w.from && r.redeemed_at < w.to).length, discountGivenInWindow: redemptions.filter((r) => r.redeemed_at >= w.from && r.redeemed_at < w.to && r.currency === 'EUR').reduce((a, r) => a + (r.discount_amount || 0), 0) };
  return {
    range, ...w,
    attribution: { instrumented: false, capturedUsers: 0, totalUsers, coverage: null, reason: 'profiles trägt keine Quelle (UTM, Referrer, Kampagne); nichts erfasst sie beim Signup.', unblock: 'utm_* und document.referrer beim Signup in profiles.acquisition_source schreiben (Datenschutz: nur Kampagnenkennung, keine Klick-IDs), dann hier auswerten.' },
    banner: { available: false, reason: 'Es gibt kein Banner-Konfigurationsobjekt; Ankündigungen sind Code (TrialBanner.jsx).' },
    lifecycle: { byKind, total: lifecycle.length, optedOut, definition: 'lifecycle_emails.sent_at im Zeitraum, nach Art. „Gesendet“ heißt: Resend hat angenommen — Öffnungen und Klicks werden nicht erfasst.' },
    signups: { count: signups.length, series: seriesFor(signups, w.from, w.to), attempts: attempts.length, failedByError: byError, definition: 'signup_attempts = fehlgeschlagene Registrierungsversuche (clientseitig protokolliert); profiles.created_at = gelungene.' },
    coupons: couponSummary,
    generatedAt: now.toISOString(),
  };
});
