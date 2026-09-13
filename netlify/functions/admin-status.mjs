// Admin panel — system status. Every check returns the value, the threshold
// that judged it, the query behind it and where to act; a check with no
// telemetry is `unknown` with a reason and an unblock step — never a
// reassuring zero. Overall = the worst REAL check.
import { adminEndpoint, fetchAll, exactCount, counting } from './_shared/adminHttp.mjs';
import { check, notInstrumented, overallState, THRESHOLDS, STATE_LABELS } from './_shared/adminStatusLib.mjs';
import { reconcileCoverage } from './_shared/adminFunnelLib.mjs';
import { slaState, OPEN_STATUSES } from './_shared/adminSupportLib.mjs';



export const handler = adminEndpoint({ capability: 'status.read' }, async ({ supabase }) => {
  const now = new Date();
  const nowMs = now.getTime();
  const checks = [];

  // database round trip
  const t0 = Date.now();
  const { error: dbErr } = await supabase.from('profiles').select('id', { head: true, count: 'exact' }).limit(1);
  const latency = Date.now() - t0;
  checks.push(dbErr
    ? check('database', 'Datenbank', { value: null, thresholdKey: 'dbLatencyMs', reason: `Abfrage fehlgeschlagen: ${dbErr.message}`, detail: 'SELECT id FROM profiles LIMIT 1', unit: 'ms' })
    : check('database', 'Datenbank', { value: latency, thresholdKey: 'dbLatencyMs', detail: 'Round-trip einer Zählabfrage auf profiles', unit: 'ms' }));

  // webhooks 24 h
  const since24 = new Date(nowMs - 86400000).toISOString();
  const failed24 = await exactCount(() => counting(supabase, 'webhook_logs').eq('processed', false).gte('created_at', since24));
  const total24 = await exactCount(() => counting(supabase, 'webhook_logs').gte('created_at', since24));
  checks.push(check('webhooks', 'Lemon-Squeezy-Webhooks', { value: failed24, thresholdKey: 'webhookFailures24h', detail: `webhook_logs.processed = false in 24 h (${total24} Ereignisse gesamt)`, action: { label: 'Abgleich öffnen', route: '/admin/operations?tab=webhooks' } }));

  // scheduled jobs: last evidence per job
  const lifecycle = await fetchAll(() => supabase.from('lifecycle_emails').select('kind, sent_at').order('sent_at', { ascending: false }).limit(2000));
  const lastOf = (pred) => lifecycle.find((l) => pred(l.kind))?.sent_at ?? null;
  const { data: weekly } = await supabase.from('weekly_metrics').select('measured_at').order('measured_at', { ascending: false }).limit(1).maybeSingle();
  const jobs = [
    { id: 'job-trial', label: 'Trial-Lifecycle (08:00 UTC)', last: lastOf((k) => k.startsWith('trial_')), kind: 'daily', caveat: 'Nur sichtbar, wenn an dem Tag jemand fällig war — ein ruhiger Tag sieht aus wie ein Ausfall.' },
    { id: 'job-activation', label: 'Activation-Lifecycle (09:30 UTC)', last: lastOf((k) => k.startsWith('activation_')), kind: 'daily', caveat: 'Wie oben; zusätzlich no-op ohne LIFECYCLE_ACTIVATION_ENABLED=true.' },
    { id: 'job-confirm', label: 'Bestätigungs-Erinnerung (10:30 UTC)', last: lastOf((k) => k === 'confirm_nudge'), kind: 'daily', caveat: 'Wie oben; no-op ohne CONFIRM_NUDGE_ENABLED=true.' },
    { id: 'job-course', label: 'Kurs-Erinnerung (18:00 UTC)', last: lastOf((k) => k.startsWith('course_reminder_')), kind: 'daily', caveat: 'Wie oben; no-op ohne COURSE_REMINDER_ENABLED=true.' },
    { id: 'job-weekly', label: 'Wöchentliche Messung (Montag 06:00 UTC)', last: weekly?.measured_at ?? null, kind: 'weekly', caveat: 'Schreibt IMMER eine Zeile — ein fehlender Lauf ist ein echter Ausfall.' },
  ];
  for (const j of jobs) {
    const h = j.last ? (nowMs - Date.parse(j.last)) / 3600000 : null;
    checks.push(j.last
      ? check(j.id, j.label, { value: Math.round(h), thresholdKey: j.kind === 'weekly' ? 'weeklyJobStaleHours' : 'dailyJobStaleHours', unit: 'h seit letztem Nachweis', detail: `${j.caveat}`, action: { label: 'Netlify-Funktionslogs', route: null } })
      : notInstrumented(j.id, j.label, `Kein Nachweis in der Datenbank. ${j.caveat}`, 'Netlify-Funktionslog prüfen oder einen Lauf-Ledger (letzter Start je Job) einführen.'));
  }

  // evaluation coverage (30 d)
  const since30 = new Date(nowMs - 30 * 86400000).toISOString();
  const sessions = await fetchAll(() => supabase.from('speaking_sessions').select('session_token, status, created_at').gte('created_at', since30));
  const tokens = sessions.map((s) => s.session_token).filter(Boolean);
  const evals = tokens.length ? await fetchAll(() => supabase.from('speaking_evaluations').select('session_token, score, total_score').in('session_token', tokens)) : [];
  const cov = reconcileCoverage(sessions, evals);
  checks.push(cov.eligible > 0
    ? check('evaluation', 'Bewertungsabdeckung Sprechen (30 T)', { value: Number(cov.coverage.toFixed(3)), thresholdKey: 'evalCoverage', unit: 'Anteil', detail: `${cov.evaluatedSessions} von ${cov.eligible} abgeschlossenen Sitzungen bewertet`, action: { label: 'Fehlende Bewertungen öffnen', route: '/admin/usage?tab=quality' } })
    : notInstrumented('evaluation', 'Bewertungsabdeckung Sprechen (30 T)', 'Keine abgeschlossene Sprechsitzung in 30 Tagen — es gibt nichts zu beurteilen.', 'Erst nach der nächsten abgeschlossenen Sitzung wieder messbar.'));

  // support SLA
  const tickets = await fetchAll(() => supabase.from('support_tickets').select('status, sla_due_at, first_response_at').in('status', [...OPEN_STATUSES]));
  const breached = tickets.filter((t) => slaState(t, now) === 'breached').length;
  checks.push(check('support', 'Support-SLA', { value: breached, thresholdKey: 'slaBreaches', detail: `${tickets.length} offene Tickets, ${breached} über der Frist`, action: { label: 'Support öffnen', route: '/admin/support' } }));

  // payment failures 7 d
  const since7 = new Date(nowMs - 7 * 86400000).toISOString();
  const pf = await exactCount(() => counting(supabase, 'payment_failures').gte('failed_at', since7));
  checks.push(check('payments', 'Fehlgeschlagene Abbuchungen (7 T)', { value: pf, thresholdKey: 'paymentFailures7d', detail: 'payment_failures.failed_at in 7 Tagen', action: { label: 'Überfällige Zahlungen', route: '/admin/operations?tab=failed' } }));

  // not instrumented
  checks.push(notInstrumented('email', 'E-Mail-Zustellung (Bounce-Rate)', 'Resend-Ereignisse werden nicht in der Datenbank gespeichert; es gibt keine Bounce-Zahl.', 'Resend-Webhook (email.bounced, email.delivered) in eine Tabelle schreiben.'));
  checks.push(notInstrumented('client-timing', 'Ladezeiten im Browser', 'Nicht instrumentiert — der Status erfindet keine Ladezeit.', 'Web-Vitals aus dem Client an PostHog senden und hier lesen.'));
  checks.push(notInstrumented('ai', 'KI-Endpunkte (Sprechen, Schreiben, X-Ray)', 'Fehler der KI-Aufrufe landen nur in den Netlify-Logs, nicht in einer Tabelle.', 'Fehler-Ledger (Funktion, Status, Dauer) je Aufruf schreiben.'));

  const overall = overallState(checks);
  return { overall, overallLabel: STATE_LABELS[overall], checks, thresholds: THRESHOLDS, stateLabels: STATE_LABELS, generatedAt: now.toISOString() };
});
