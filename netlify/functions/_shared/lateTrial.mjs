import { BRAND, emailHeader, ctaCell } from './brand.mjs';
import { tagEmailLink } from './emailLinks.mjs';
import { unsubscribeUrl, unsubscribeHeaders } from './unsubscribe.mjs';
import { sendRetryableMail, retryableLifecycleUsers } from './retryableMail.mjs';

// DRAFT: owner decides consent, cohort and activation. No new Netlify endpoint or cron.
// Windows are disjoint from activation and the existing trial mails. No
// catch-up outside a window, and no statement about the learner's inactivity.
export const LATE_TRIAL_DAYS = { trial_followup_d14: 14, trial_followup_d30: 30, trial_followup_d60: 60 };
const DAY = 86400000;
export const lateTrialEnabled = (env = process.env) => env.LIFECYCLE_LATE_TRIAL_ENABLED === 'true' &&
  Number.isFinite(Date.parse(env.LIFECYCLE_LATE_TRIAL_COHORT_START));
export function lateTrialBounds(kind, now = Date.now()) {
  const days = LATE_TRIAL_DAYS[kind];
  if (!days) throw new Error('Unknown late-trial kind');
  return { lower: new Date(now - (days + 1) * DAY).toISOString(), upper: new Date(now - days * DAY).toISOString() };
}
export const LATE_TRIAL_COPY = {
  trial_followup_d14: { subject: 'Ihr nächster Schritt mit DeutschMeister', text: 'Möchten Sie wieder einsteigen? Öffnen Sie Ihren Lernbereich und wählen Sie eine Aufgabe, die zu Ihrem Alltag passt.' },
  trial_followup_d30: { subject: 'Eine Aufgabe für Ihren Alltag', text: 'Wählen Sie eine Situation, in der Sie Deutsch brauchen. Im Lernbereich können Sie eine passende Aufgabe öffnen und in Ihrem Tempo üben.' },
  trial_followup_d60: { subject: 'Deutsch üben, wenn es für Sie passt', text: 'Wenn Sie weiterlernen möchten, können Sie Ihren nächsten Schritt im Lernbereich wählen. Sie entscheiden, wann Sie üben.' },
};
export function lateTrialItem(kind, recipient) {
  const copy = LATE_TRIAL_COPY[kind];
  const campaign = kind.replaceAll('_', '-');
  const link = (path, content) => tagEmailLink(`https://deutsch-meister.de${path}`, { medium: 'lifecycle', campaign, content });
  const unsub = unsubscribeUrl(recipient.id);
  return {
    from: 'Zaid from DeutschMeister <zaid@deutsch-meister.de>', to: [recipient.email], reply_to: 'zaid@deutsch-meister.de',
    subject: copy.subject, headers: unsubscribeHeaders(unsub),
    html: `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>${copy.subject}</title></head>
<body style="background:${BRAND.paper};color:${BRAND.ink};font-family:Arial,sans-serif">
<table style="max-width:520px;margin:auto;background:${BRAND.white};border:1px solid ${BRAND.rule}">
<tr>${emailHeader()}</tr><tr><td style="padding:32px">
<p>Guten Tag,</p><p>${copy.text}</p><p>Der kostenlose Einstiegskurs steht Ihnen weiterhin offen. Falls Sie bereits Arbeit gespeichert haben, finden Sie diese in Ihrem Konto.</p>
<table><tr>${ctaCell(link('/subscription', 'cta'), 'Lernbereich öffnen')}</tr></table>
<p><a style="color:${BRAND.siegel}" href="${link('/course/a1.1', 'free-course')}">Kostenlos weiterlernen</a></p>
<p>Wenn Sie mehr nutzen möchten, können Sie die <a style="color:${BRAND.siegel}" href="${link('/pricing/', 'offers')}">aktuellen Angebote ansehen</a>.</p>
<p>— Zaid</p><p><a style="color:${BRAND.graphite}" href="${unsub}">E-Mails von DeutschMeister abbestellen</a></p>
</td></tr></table></body></html>`,
  };
}

// Share the funnel's subscription/opt-out definition, and explicitly stop
// after ANY purchase (including one-time courses and historical purchases).
export async function recheckLateRecipients(client, recipients) {
  if (!recipients.length) return [];
  const ids = recipients.map((r) => r.id);
  const [state, bought] = await Promise.all([
    client.from('lifecycle_customer_state').select('user_id, is_subscribed, email_opted_out').in('user_id', ids),
    client.from('purchases').select('user_id').in('user_id', ids),
  ]);
  if (state.error || bought.error) throw new Error('Late trial eligibility unavailable');
  const purchasers = new Set((bought.data || []).map((r) => r.user_id));
  const eligible = new Set((state.data || []).filter((r) => r.is_subscribed === false && r.email_opted_out === false && !purchasers.has(r.user_id)).map((r) => r.user_id));
  return recipients.filter((r) => eligible.has(r.id));
}

export async function selectLateRecipients(client, kind, { now = Date.now(), cohortStart } = {}) {
  if (!Number.isFinite(Date.parse(cohortStart))) return [];
  const { lower, upper } = lateTrialBounds(kind, now);
  const { data, error } = await client.from('profiles').select('id')
    .gte('trial_ends_at', new Date(Math.max(Date.parse(lower), Date.parse(cohortStart))).toISOString()).lt('trial_ends_at', upper);
  if (error) throw new Error(`Late trial profiles: ${error.message}`);
  const candidates = await recheckLateRecipients(client, data || []);
  if (!candidates.length) return [];
  const { data: ledger, error: ledgerError } = await client.from('lifecycle_emails')
    .select('user_id').eq('kind', kind).in('user_id', candidates.map((r) => r.id));
  if (ledgerError) throw new Error('Late trial ledger unavailable');
  const claimed = new Set((ledger || []).map((r) => r.user_id));
  const retryable = await retryableLifecycleUsers(client, kind, [...claimed], now);
  const ids = new Set(candidates.filter((r) => !claimed.has(r.id) || retryable.has(r.id)).map((r) => r.id));
  if (!ids.size) return [];
  const recipients = [];
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Late trial addresses: ${error.message}`);
    for (const u of data.users) if (ids.has(u.id) && u.email && u.email_confirmed_at) recipients.push({ id: u.id, email: u.email.trim().toLowerCase() });
    if (data.users.length < 1000) break;
  }
  return recipients;
}

export async function runLateTrial({ client, resendKey, env = process.env, dry = false, canary = new Set(), now = Date.now(), fetchImpl = fetch }) {
  if (!lateTrialEnabled(env)) return { enabled: false, sent: 0 };
  const results = [];
  for (const kind of Object.keys(LATE_TRIAL_DAYS)) {
    const selected = await selectLateRecipients(client, kind, { now, cohortStart: env.LIFECYCLE_LATE_TRIAL_COHORT_START });
    const recipients = selected.filter((r) => !canary.size || canary.has(r.email));
    let sent = 0, failed = 0;
    if (!dry) for (const r of recipients) {
      if (!(await recheckLateRecipients(client, [r])).length) continue;
      const result = await sendRetryableMail({ client, resendKey, key: `lifecycle:${r.id}:${kind}`, scope: `lifecycle:${r.id}:${kind}`, kind, userId: r.id, message: lateTrialItem(kind, r), fetchImpl,
        isEligible: async () => (await recheckLateRecipients(client, [r])).length > 0 });
      if (result.status === 'accepted') sent++;
      else if (['retryable', 'needs_review'].includes(result.status)) failed++;
    }
    results.push({ kind, sent, failed, ...(dry ? { wouldSend: recipients.length } : {}) });
  }
  return { enabled: true, dry, results };
}
