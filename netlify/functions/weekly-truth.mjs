// Weekly truth run — the measurement loop.
//
// Every Monday 06:00 UTC: one SQL pass (public.weekly_truth_metrics(), see
// migrations/2026-09-03-weekly-metrics.sql), one row into weekly_metrics, one
// plain-text email to the owner with the deltas against last week. No product
// behaviour, no customer email. The row is what agent sessions read first, so
// nobody re-derives revenue from stale docs again.
//
// Order of operations is deliberate: STORE, then email. A Resend outage must
// never lose a week of history; a stored row with no email is recoverable, the
// reverse is not. Manual run: ?secret=<CAMPAIGN_SECRET> (same auth as the
// lifecycle jobs); ?dry=1 computes and returns without storing or sending.

import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CAMPAIGN_SECRET = process.env.CAMPAIGN_SECRET;
const OWNER = process.env.WEEKLY_TRUTH_RECIPIENT || 'zaid@deutsch-meister.de';
const FROM_ADDRESS = 'DeutschMeister Truth <zaid@deutsch-meister.de>';

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Supabase init error:', e.message);
}

const eur = (n) => `€${Number(n || 0).toFixed(2)}`;
const delta = (now, prev, fmt = (x) => String(x)) => {
  if (prev == null) return `${fmt(now)} (no previous)`;
  const d = Number(now) - Number(prev);
  const sign = d > 0 ? '+' : '';
  return `${fmt(now)} (prev ${fmt(prev)}, ${sign}${fmt(d)})`;
};
const pct = (a, b) => (Number(b) > 0 ? `${Math.round((Number(a) / Number(b)) * 100)}%` : 'n/a');

/** The email body. Pure so tests and dry runs can render it. */
export function renderSummary(m, prev) {
  const p = prev || {};
  const date = new Date(m.measured_at).toISOString().slice(0, 10);
  const lines = [];
  if (Number(m.webhooks_7d?.failed_7d) > 0) {
    lines.push(`!! ${m.webhooks_7d.failed_7d} webhook event(s) FAILED this week — read webhook_logs before anything else.`);
    lines.push('');
  }
  lines.push(`DeutschMeister weekly truth — ${date}`);
  lines.push('');
  lines.push(`Revenue: MRR ${delta(m.subscriptions?.mrr, p.subscriptions?.mrr, eur)} from ${m.subscriptions?.paying} paying subs`);
  lines.push(`Courses: ${m.purchases?.sales_7d} sold this week (${eur(m.purchases?.revenue_7d)}); lifetime ${m.purchases?.sales_all} for ${eur(m.purchases?.revenue_all)}; by product: ${JSON.stringify(m.purchases?.by_product_7d || {})}`);
  lines.push(`Users: ${delta(m.users?.total, p.users?.total)} total, ${m.users?.signups_7d} new this week, ${m.users?.confirmed} confirmed (${pct(m.users?.confirmed, m.users?.total)})`);
  lines.push(`Learning: ${m.grammar?.active_users_7d} users did grammar this week; new cohort (14d) ${m.grammar?.new_cohort_14d}, one-and-done ${m.grammar?.one_and_done_14d} (${pct(m.grammar?.one_and_done_14d, m.grammar?.new_cohort_14d)})`);
  lines.push(`AI this week: speaking ${m.ai_7d?.speaking_7d}, writing ${m.ai_7d?.writing_7d}, exams ${m.ai_7d?.exams_7d}, X-Ray ${m.ai_7d?.xray_7d}`);
  lines.push(`Lifecycle emails sent: ${JSON.stringify(m.lifecycle_emails_7d || {})}`);
  lines.push(`Webhooks: ${m.webhooks_7d?.total_7d} events, ${m.webhooks_7d?.failed_7d} failed`);
  lines.push('');
  lines.push('Rule of thumb: €10k/month needs ~80 bundle sales a month. Everything above is measured, nothing is estimated.');
  lines.push('');
  lines.push('Raw JSON:');
  lines.push(JSON.stringify(m, null, 2));
  return lines.join('\n');
}

const innerHandler = async (event) => {
  if (!supabaseKey || !supabase) return { statusCode: 500, body: 'SUPABASE_SERVICE_ROLE_KEY not set' };

  const qs = event.queryStringParameters || {};
  let bodyPayload = {};
  try { bodyPayload = JSON.parse(event.body || '{}'); } catch { /* ignore */ }
  const isScheduled = typeof bodyPayload.next_run === 'string';
  const secretOk = Boolean(CAMPAIGN_SECRET) && qs.secret === CAMPAIGN_SECRET;
  if (!isScheduled && !secretOk) {
    console.warn('[weekly-truth] rejected unauthenticated invocation');
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  const dry = qs.dry === '1';

  const { data: metrics, error: rpcError } = await supabase.rpc('weekly_truth_metrics');
  if (rpcError || !metrics) {
    console.error('[weekly-truth] rpc failed (migration applied?):', rpcError?.message);
    return { statusCode: 500, body: JSON.stringify({ error: `metrics failed: ${rpcError?.message || 'empty'}` }) };
  }

  const { data: prevRows } = await supabase
    .from('weekly_metrics')
    .select('metrics, measured_at')
    .order('measured_at', { ascending: false })
    .limit(1);
  const prev = prevRows?.[0]?.metrics || null;
  const summary = renderSummary(metrics, prev);

  if (dry) return { statusCode: 200, body: JSON.stringify({ dry: true, summary, metrics }) };

  // Store first — history must survive a mail failure.
  const { error: insertError } = await supabase
    .from('weekly_metrics')
    .insert({ metrics, summary });
  if (insertError) {
    console.error('[weekly-truth] insert failed:', insertError.message);
    return { statusCode: 500, body: JSON.stringify({ error: `store failed: ${insertError.message}` }) };
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('[weekly-truth] RESEND_API_KEY not set — stored, not emailed');
    return { statusCode: 200, body: JSON.stringify({ stored: true, emailed: false }) };
  }
  let emailed = false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [OWNER],
        subject: `Weekly truth ${new Date(metrics.measured_at).toISOString().slice(0, 10)}: MRR ${eur(metrics.subscriptions?.mrr)}, ${metrics.purchases?.sales_7d} course sales`,
        text: summary,
      }),
    });
    emailed = res.ok;
    if (!res.ok) console.error(`[weekly-truth] Resend ${res.status}:`, (await res.text()).slice(0, 300));
  } catch (e) {
    console.error('[weekly-truth] email threw:', e.message);
  }

  console.log('[weekly-truth]', summary.split('\n').slice(0, 8).join(' | '));
  return { statusCode: 200, body: JSON.stringify({ stored: true, emailed }) };
};

// Mirrored in netlify.toml ([functions."weekly-truth"]); this wrapper is authoritative.
export const handler = schedule('0 6 * * 1', innerHandler);
