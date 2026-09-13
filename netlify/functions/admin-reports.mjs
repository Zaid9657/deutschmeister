// Admin panel — reports. No report introduces a new metric: each composes
// figures the cockpit, the queues, the analytics module and the support
// centre already compute, and every row carries the route that opens the
// records behind it. PDF is deliberately not offered; CSV is gated by export.
import { adminEndpoint, safe, fetchAll, exactCount, counting } from './_shared/adminHttp.mjs';
import { writeAudit } from './_shared/adminRbac.mjs';
import { windowFor } from './_shared/adminFunnelLib.mjs';
import { normalizeLevel } from './_shared/adminLevels.mjs';
import { METRICS } from './_shared/adminMetricNames.mjs';
import { revenueGroup, subsGroup, activitySets, usersGroup, productGroup, opsGroup } from './_shared/adminCockpit.mjs';
import { slaState, OPEN_STATUSES } from './_shared/adminSupportLib.mjs';
import { reviewState, CONTENT_TABLE_KEYS, CONTENT_TABLES } from './_shared/adminContentLib.mjs';

export const REPORTS = Object.freeze([
  { id: 'operations', label: 'Betrieb (täglich)', description: 'Starts, Abschlüsse, Fehler, offene Posten — der Morgenblick.' },
  { id: 'founder', label: 'Wochenbericht', description: 'Wachstum, Zahlungen, Support und Qualität in einer Sicht.' },
  { id: 'activation', label: 'Aktivierung', description: 'Registrierung → erste gezählte Nutzung.' },
  { id: 'usage', label: 'Nutzungsqualität', description: 'Sprech-Ergebnisse, Bewertungsabdeckung, Abbrüche.' },
  { id: 'support', label: 'Support & SLA', description: 'Eingang, Bearbeitung, Fristen.' },
  { id: 'content', label: 'Inhalte', description: 'Bestand, Lebenszyklus, Prüf-Warteschlange.' },
]);

const row = (label, value, { definition, route, unit } = {}) => ({ label, value, definition: definition ?? null, route: route ?? null, unit: unit ?? null });

export const handler = adminEndpoint(
  { capabilityFor: (b) => (b.format === 'csv' ? 'export' : 'reports.read') },
  async ({ body, supabase, auth, event }) => {
    const now = new Date();
    const id = REPORTS.some((r) => r.id === body.report) ? body.report : null;
    const range = ['7d', '30d', '90d'].includes(body.range) ? body.range : '30d';
    const level = normalizeLevel(body.level);
    const w = windowFor(range, now);
    if (!id) return { reports: REPORTS, generatedAt: now.toISOString() };

    const sections = [];
    const add = (title, rows, note) => sections.push({ title, rows, note: note ?? null });
    const m = (k) => METRICS[k]?.definition;

    if (['operations', 'founder', 'activation', 'usage'].includes(id)) {
      const sets = await activitySets(supabase, level);
      const [rev, subs, users, product, ops] = await Promise.all([
        safe('revenue', () => revenueGroup(supabase, w)), safe('subs', () => subsGroup(supabase, now)), safe('users', () => usersGroup(supabase, w, now, level, sets)), safe('product', () => productGroup(supabase, w, level, sets)), safe('ops', () => opsGroup(supabase, w)),
      ]);
      const err = [rev, subs, users, product, ops].filter((g) => g.error).map((g) => g.error);
      if (err.length) add('Nicht berechenbar', err.map((e) => row('Fehler', null, { definition: e })));
      const r = rev.value, s = subs.value, u = users.value, p = product.value, o = ops.value;
      if (id === 'operations' || id === 'founder') {
        if (p) add('Nutzung', [row('Sprechsitzungen gestartet', p.speaking.started, { definition: m('speakingStarted'), route: '/admin/usage' }), row('Sprechsitzungen abgeschlossen', p.speaking.completed, { route: '/admin/usage' }), row('Grammatik-aktive Nutzer', p.grammar.activeUsers, { definition: m('grammarActive'), route: '/admin/usage?tab=grammar' })]);
        if (o) add('Offene Posten', [row('Webhook-Fehler', o.failedWebhooks, { definition: m('webhookFailures'), route: '/admin/operations?tab=webhooks' }), row('Zahlungen überfällig', s?.pastDue ?? null, { definition: m('failedPayments'), route: '/admin/operations?tab=failed' }), row('Offene Tickets', o.openTickets, { route: '/admin/support' }), row('Zahlungsfehler (LS)', o.paymentFailures, { route: '/admin/operations?tab=webhooks' })]);
      }
      if (id === 'founder') {
        if (r) add('Geld', [row('Umsatz netto (EUR)', r.current.EUR?.net ?? 0, { definition: m('revenueNet'), unit: 'cents', route: '/admin' }), row('Zahlungen', r.current.EUR?.count ?? 0, { route: '/admin' }), row('MRR', s?.mrr ?? null, { definition: m('mrr'), unit: 'cents', route: '/admin/operations?tab=all' }), row('Zahlende Abos', s?.paying ?? null, { route: '/admin/operations?tab=all' })]);
        if (u) add('Wachstum', [row('Neue Nutzer', u.newInWindow, { definition: m('newUsers'), route: '/admin/users?view=week' }), row('Vorperiode', u.newInPrevious), row('Login-aktiv (7 T)', u.loginActive7, { definition: m('loginActive7'), route: '/admin/users' }), row('Aktiviert (seit Beginn)', u.activated, { definition: m('activated'), route: '/admin/users' })]);
        const tickets = await fetchAll(() => supabase.from('support_tickets').select('status, sla_due_at, first_response_at, created_at').gte('created_at', w.from));
        add('Support', [row('Neue Tickets', tickets.length, { route: '/admin/support' }), row('Davon SLA verletzt', tickets.filter((t) => slaState(t, now) === 'breached').length, { route: '/admin/support' })]);
        if (p) add('Qualität', [row('Bewertungsabdeckung', p.speaking.coverage.coverage, { definition: m('evaluationCoverage'), unit: 'ratio', route: '/admin/usage?tab=quality' }), row('Ø Sprechergebnis', p.speaking.coverage.avgScore, { definition: m('avgSpeakingScore'), unit: 'ratio', route: '/admin/usage?tab=quality' })]);
      }
      if (id === 'activation' && u) {
        add('Trichter (Registrierungs-Kohorte)', u.funnel.steps.map((st) => row(st.step, st.available ? st.count : null, { definition: st.definition || st.reason, route: '/admin/users' })));
        add('Verstöße', [row('Nutzung ohne Onboarding', u.funnel.orderViolations.nutzungOhneOnboarding), row('Gezählt ohne Start', u.funnel.orderViolations.gezaehltOhneStart)]);
        add('Grammatik-Kohorte', [row('Kohorte', u.grammarCohort.cohort), row('One-and-done', u.grammarCohort.oneAndDone, { definition: m('oneAndDone'), route: '/admin/users?view=not_activated' }), row('Quote', u.grammarCohort.rate, { unit: 'ratio' })]);
      }
      if (id === 'usage' && p) {
        const c = p.speaking.coverage;
        add('Sprechen', [row('Gestartet', p.speaking.started, { route: '/admin/usage' }), row('Abgeschlossen', p.speaking.completed, { route: '/admin/usage' }), row('Abschlussquote', p.speaking.completedRate, { unit: 'ratio', definition: m('speakingCompletedRate') })]);
        add('Bewertung', [row('Gesamt', c.total), row('Bewertbar', c.eligible), row('Bewertet', c.evaluatedSessions), row('Abdeckung', c.coverage, { unit: 'ratio', route: '/admin/usage?tab=quality' }), row('Duplikate entfernt', c.duplicateRows), row('Ohne Score', c.unusableRows), row('Ø Ergebnis', c.avgScore, { unit: 'ratio' })]);
      }
    }

    if (id === 'support') {
      const all = await fetchAll(() => supabase.from('support_tickets').select('status, priority, category, sla_due_at, first_response_at, created_at, closed_at, closure_reason, resolution_category'));
      const inW = all.filter((t) => t.created_at >= w.from && t.created_at < w.to);
      const open = all.filter((t) => OPEN_STATUSES.includes(t.status));
      const states = all.map((t) => slaState(t, now));
      const byCat = {}; for (const t of inW) byCat[t.category] = (byCat[t.category] || 0) + 1;
      const byClosure = {}; for (const t of all) if (t.closure_reason) byClosure[t.closure_reason] = (byClosure[t.closure_reason] || 0) + 1;
      add('Eingang', [row('Neue Tickets im Zeitraum', inW.length, { route: '/admin/support?status=' }), ...Object.entries(byCat).map(([k, v]) => row(`davon ${k}`, v, { route: '/admin/support' }))]);
      add('Bearbeitung', [row('Offen', open.length, { route: '/admin/support' }), row('Nicht zugewiesen', open.filter((t) => !t.assignee_id).length), row('Geschlossen (seit Beginn)', all.filter((t) => t.status === 'closed').length, { route: '/admin/support?status=closed' })]);
      add('Fristen', [row('SLA eingehalten', states.filter((s) => s === 'met').length), row('SLA verletzt', states.filter((s) => s === 'breached').length, { route: '/admin/support' }), row('Nicht beurteilbar', states.filter((s) => s === 'unknown').length, { definition: 'beantwortet ohne Zeitstempel der ersten Antwort, oder ohne Frist' })], 'Kalenderstunden: dringend 4 · hoch 12 · normal 48 · niedrig 120.');
      add('Abschlussgründe', Object.entries(byClosure).map(([k, v]) => row(k, v)));
    }

    if (id === 'content') {
      for (const key of CONTENT_TABLE_KEYS) {
        const rows = await fetchAll(() => supabase.from(key).select('id, lifecycle_status, last_reviewed_at, next_review_at'));
        const by = {}; for (const r of rows) by[r.lifecycle_status] = (by[r.lifecycle_status] || 0) + 1;
        const rv = { never: 0, due: 0, ok: 0, scheduled_unknown: 0 }; for (const r of rows) rv[reviewState(r, now)] += 1;
        add(CONTENT_TABLES[key].label, [row('Bestand', rows.length, { route: `/admin/content?table=${key}` }), ...Object.entries(by).map(([k, v]) => row(k, v, { route: `/admin/content?table=${key}&lifecycle=${k}` })), row('Nie geprüft', rv.never, { route: `/admin/content?table=${key}&review=never` }), row('Prüfung fällig', rv.due, { route: `/admin/content?table=${key}&review=due` })]);
      }
      const contentTickets = await exactCount(() => counting(supabase, 'support_tickets').eq('category', 'content').in('status', [...OPEN_STATUSES]));
      add('Gemeldet', [row('Offene Inhalts-Tickets', contentTickets, { route: '/admin/support' })]);
    }

    if (body.format === 'csv') {
      const esc = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      const lines = ['Abschnitt;Kennzahl;Wert;Einheit;Definition'];
      for (const sec of sections) for (const r of sec.rows) lines.push([sec.title, r.label, r.value, r.unit || '', r.definition || ''].map(esc).join(';'));
      await writeAudit(supabase, { actorId: auth.userId, actorRole: auth.role, action: 'reports.export', targetType: 'report', targetId: id, after: { range, level: level || 'all', rows: lines.length - 1 }, outcome: 'success', source: event.path });
      return { format: 'csv', csv: lines.join('\n'), filename: `bericht-${id}-${now.toISOString().slice(0, 10)}.csv` };
    }

    return { report: REPORTS.find((r) => r.id === id), range, level: level || 'all', ...w, sections, pdf: { available: false, reason: 'Ein verlässliches PDF bräuchte einen Renderer, den niemand getestet hat; ein kaputter Export ist schlimmer als keiner. CSV ist der Exportweg.' }, generatedAt: now.toISOString() };
  },
);
