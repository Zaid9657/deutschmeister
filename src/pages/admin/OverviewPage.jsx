// The cockpit (admin-metrics). Every number carries its definition and its
// time class; groups the level filter cannot reach say so; a failed group
// renders an error line, never a zero.
import { Link } from 'react-router-dom';
import { PageHeader, Section, Stat, StatRow, Delta, Badge, ErrorLine, Spinner, Footnote, Diagnostics, NotInstrumented, KeyValues, num, pct, money, hm } from '../../components/admin/adminUi.jsx';
import { DailyBars, FunnelBars, CohortTable } from '../../components/admin/charts.jsx';
import { useAdminFilters } from '../../components/admin/AdminFilterContext.jsx';
import { useAdminData } from '../../components/admin/useAdminData.js';

function Group({ group, children }) {
  if (!group) return null;
  if (group.error) return <ErrorLine>Diese Kennzahlgruppe konnte nicht berechnet werden: {group.error}</ErrorLine>;
  return children(group.value);
}

export default function OverviewPage() {
  const { range, level } = useAdminFilters();
  const { data, loading, error } = useAdminData('admin-metrics', { range, level: level === 'all' ? null : level }, [range, level]);
  const m = data?.metrics || {};
  const def = (k) => m[k]?.definition;
  const tc = (k) => m[k]?.timeClass;
  const excluded = new Set(data?.levelFilterExcluded || []);
  const levelNote = level !== 'all' ? ` · Stufe ${level.toUpperCase()}` : '';
  const notFilterable = level !== 'all' ? 'Nicht nach Stufe filterbar' : null;

  return (
    <>
      <PageHeader
        title="Übersicht"
        lead={`Gezählt wird aus den Tabellen, die jede Kachel nennt. Umsatz kommt aus den Lemon-Squeezy-Webhooks (nicht aus subscriptions.price_paid), Login-Aktivität aus audit_logs, Nutzung aus den Fortschrittstabellen. Zeitraum ${data?.days ?? ''} Tage${levelNote}.`}
      />
      {loading && !data ? <Spinner /> : null}
      {error ? <ErrorLine>{error}</ErrorLine> : null}
      {data ? (
        <>
          <Group group={data.revenue}>
            {(r) => {
              const cur = r.current.EUR || { net: 0, count: 0 };
              const prev = r.previous.EUR || { net: 0, count: 0 };
              const others = Object.entries(r.current).filter(([c]) => c !== 'EUR');
              return (
                <>
                  <StatRow>
                    <Stat label={m.revenueNet?.label} value={money(cur.net)} delta={<Delta now={cur.net} prev={prev.net} fmt={(v) => money(v)} />} definition={def('revenueNet')} timeClass={`${tc('revenueNet')} · ${notFilterable || 'Alle Stufen'}`} />
                    <Group group={data.subs}>{(s) => <Stat label={m.mrr?.label} value={money(s.mrr)} definition={def('mrr')} timeClass={`${tc('mrr')} · ${notFilterable || 'Alle Stufen'}`} />}</Group>
                    <Group group={data.subs}>{(s) => <Stat label={m.activeSubs?.label} value={num(s.live)} definition={def('activeSubs')} timeClass={tc('activeSubs')} />}</Group>
                    <Group group={data.users}>{(u) => <Stat label={m.newUsers?.label} value={num(u.newInWindow)} delta={<Delta now={u.newInWindow} prev={u.newInPrevious} />} definition={def('newUsers')} timeClass={`${tc('newUsers')} · ${notFilterable || 'Alle Stufen'}`} />}</Group>
                  </StatRow>
                  {others.length > 0 ? <Footnote>Weitere Währungen im Zeitraum (nicht in EUR umgerechnet): {others.map(([c, v]) => `${money(v.net, c)} (${v.count})`).join(' · ')}</Footnote> : null}
                  <Group group={data.subs}>
                    {(s) => s.pastDue > 0 ? (
                      <div className="mt-3 flex items-center justify-between rounded-md border border-viz-warn/40 bg-viz-warn/10 px-3 py-2 text-[0.8125rem] text-ink">
                        <span>⚠ {s.pastDue} {s.pastDue === 1 ? 'Zahlung überfällig' : 'Zahlungen überfällig'} — {def('failedPayments')}</span>
                        <Link to="/admin/operations?tab=failed" className="font-semibold text-siegel-deep hover:underline">Abgleich öffnen</Link>
                      </div>
                    ) : null}
                  </Group>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <Section title="Umsatzverlauf (netto, EUR)" note={`${cur.count} Zahlungen im Zeitraum; ${r.paymentsCounted} seit Beginn aus ${r.webhookRows} Webhook-Zeilen. ${m.revenueNet?.caveat}`}>
                      <DailyBars points={r.series.map((d) => ({ day: d.day, value: d.net }))} label="Netto-Umsatz" format={(v) => money(v)} />
                    </Section>
                    <Group group={data.subs}>
                      {(s) => (
                        <Section title="Aktive Abonnements nach Tarif" note="Summe der MRR-Spalte stimmt mit der MRR-Kachel überein; manuelle Freischaltungen (price_paid 0) zählen als aktiv, aber nicht zur MRR.">
                          <table className="w-full text-[0.8125rem]">
                            <thead><tr className="border-b border-rule text-left text-graphite"><th className="py-1">Tarif</th><th className="py-1 text-right">Aktiv</th><th className="py-1 text-right">Zahlend</th><th className="py-1 text-right">MRR</th></tr></thead>
                            <tbody>
                              {Object.entries(s.byPlan).map(([plan, n]) => (
                                <tr key={plan} className="border-b border-rule/60"><td className="py-1">{plan}</td><td className="py-1 text-right tabular-nums">{num(n)}</td><td className="py-1 text-right tabular-nums">{num(s.mrrByPlan[plan]?.subs ?? 0)}</td><td className="py-1 text-right tabular-nums">{money(s.mrrByPlan[plan]?.mrr ?? 0)}</td></tr>
                              ))}
                              <tr><td className="pt-1 font-semibold">Summe</td><td className="pt-1 text-right font-semibold tabular-nums">{num(s.live)}</td><td className="pt-1 text-right font-semibold tabular-nums">{num(s.paying)}</td><td className="pt-1 text-right font-semibold tabular-nums">{money(s.mrr)}</td></tr>
                            </tbody>
                          </table>
                          <KeyValues items={[['Nach Status', Object.entries(s.byStatus).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'], ['Gekündigt zum Periodenende', num(s.cancelAtPeriodEnd)], ['Bezahlt, aber nicht verlängernd', num(s.atRisk)], ['Manuell freigeschaltet', num(s.manual)]]} />
                        </Section>
                      )}
                    </Group>
                  </div>
                </>
              );
            }}
          </Group>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Group group={data.users}>
              {(u) => (
                <Section title="Nutzer" note={`Login-aktiv ≠ lernaktiv: die Login-Zahlen kommen aus audit_logs, "Aktiviert" aus den Fortschrittstabellen. Stufenfilter wirkt auf ${u.levelCoverage.known} von ${u.levelCoverage.total} Profilen mit gesetzter Stufe.`}>
                  <StatRow>
                    <Stat label={m.totalUsers?.label} value={num(u.total)} definition={def('totalUsers')} timeClass={tc('totalUsers')} />
                    <Stat label={m.loginActive7?.label} value={num(u.loginActive7)} definition={def('loginActive7')} timeClass={tc('loginActive7')} />
                    <Stat label={m.loginActive28?.label} value={num(u.loginActive28)} definition={def('loginActive28')} timeClass={tc('loginActive28')} />
                    <Stat label={m.activated?.label} value={num(u.activated)} definition={def('activated')} timeClass={`${tc('activated')}${level !== 'all' ? ` · Stufe ${level.toUpperCase()}` : ''}`} />
                    <Stat label={m.paying?.label} value={num(u.paying)} definition={def('paying')} timeClass={tc('paying')} />
                    <Stat label="Testphase läuft" value={num(u.trialLive)} definition="profiles.trial_ends_at > jetzt" timeClass="Aktueller Stand" />
                  </StatRow>
                  <h3 className="mt-4 text-sm font-bold text-ink">Neue Registrierungen pro Tag</h3>
                  <DailyBars points={u.signupSeries.map((d) => ({ day: d.day, value: d.count }))} label="Registrierungen" />
                </Section>
              )}
            </Group>
            <Group group={data.product}>
              {(p) => (
                <Section title="Produkt" note={`Sprechen aus speaking_sessions${p.levelApplied ? ` (Stufe ${p.levelApplied.toUpperCase()})` : ''}; Grammatik aus user_grammar_progress. ${m.speakingCompletedRate?.caveat}`}>
                  <StatRow>
                    <Stat label={m.speakingStarted?.label} value={num(p.speaking.started)} delta={<Delta now={p.speaking.started} prev={p.speaking.startedPrevious} />} definition={def('speakingStarted')} timeClass={tc('speakingStarted')} />
                    <Stat label={m.speakingCompletedRate?.label} value={pct(p.speaking.completedRate, 1, p.speaking.started)} definition={`${def('speakingCompletedRate')} (${num(p.speaking.completed)} von ${num(p.speaking.started)})`} timeClass={tc('speakingCompletedRate')} />
                    <Stat label={m.grammarActive?.label} value={num(p.grammar.activeUsers)} delta={<Delta now={p.grammar.activeUsers} prev={p.grammar.activeUsersPrevious} />} definition={def('grammarActive')} timeClass={tc('grammarActive')} />
                    <Stat label={m.avgSpeakingScore?.label} value={pct(p.speaking.coverage.avgScore, 1, p.speaking.coverage.scoreSample)} definition={`${def('avgSpeakingScore')} · Stichprobe ${num(p.speaking.coverage.scoreSample)}`} timeClass={tc('avgSpeakingScore')} />
                  </StatRow>
                  <h3 className="mt-4 text-sm font-bold text-ink">{m.evaluationCoverage?.label}</h3>
                  <p className="mt-1 text-[0.8125rem] text-ink">
                    {num(p.speaking.coverage.total)} gesamt → {num(p.speaking.coverage.eligible)} bewertbar (abgeschlossen) → {num(p.speaking.coverage.evaluatedSessions)} bewertet → <strong>{pct(p.speaking.coverage.coverage, 1, p.speaking.coverage.eligible)}</strong> Abdeckung
                  </p>
                  <Footnote>{num(p.speaking.coverage.notEligible)} nicht bewertbar (nie beendet) · {num(p.speaking.coverage.missingEvaluation)} ohne Bewertung · {num(p.speaking.coverage.duplicateRows)} Duplikate entfernt · {num(p.speaking.coverage.unusableRows)} ohne brauchbaren Score. {m.evaluationCoverage?.caveat}</Footnote>
                  <KeyValues items={[['Nach Modus', Object.entries(p.speaking.byMode).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'], ['Grammatik-Themen berührt / abgeschlossen', `${num(p.grammar.topicsTouched)} / ${num(p.grammar.topicsCompleted)}`]]} />
                  {p.lessons.instrumented ? (
                    <KeyValues items={[['Kurs-Lektionen (Zeilen / abgeschlossen / Nutzer)', `${num(p.lessons.rows)} / ${num(p.lessons.completed)} / ${num(p.lessons.users)}`]]} />
                  ) : (
                    <NotInstrumented label="Kurs-Lektionen" reason={p.lessons.reason} unblock={p.lessons.unblock} />
                  )}
                </Section>
              )}
            </Group>
          </div>

          <Group group={data.users}>
            {(u) => (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Section title="Registrierungstrichter" note={`Registrierungs-Kohorte des Zeitraums (${num(u.funnelCohort)} Konten${level !== 'all' ? `, Stufe ${level.toUpperCase()}` : ''}). Jede Stufe ist eine echte Teilmenge der vorigen; Verstöße gegen diese Ordnung werden angezeigt, nicht weggerechnet.`}>
                  <FunnelBars steps={u.funnel.steps} />
                  <Footnote>Verstöße: {num(u.funnel.orderViolations.nutzungOhneOnboarding)} mit Nutzung ohne Onboarding · {num(u.funnel.orderViolations.gezaehltOhneStart)} gezählt ohne Start. One-and-done (Grammatik): {num(u.grammarCohort.oneAndDone)} von {num(u.grammarCohort.cohort)} ({pct(u.grammarCohort.rate, 0)}).</Footnote>
                </Section>
                <Section title="Retention-Kohorten" note="Registrierungswochen (Montag) × Anteil mit irgendeiner Aktivität in Woche 1–4 nach Registrierung. Nicht verstrichene Wochen bleiben leer, sie sind kein Misserfolg. Nicht nach Stufe filterbar.">
                  <CohortTable cohorts={u.cohorts} />
                </Section>
              </div>
            )}
          </Group>

          <Group group={data.ops}>
            {(o) => (
              <Section title="Betrieb" note="Webhooks aus webhook_logs, Lebenszyklus-Mails aus lifecycle_emails, Tickets aus support_tickets. Nicht nach Stufe filterbar.">
                <StatRow>
                  <Stat label={m.webhookFailures?.label} value={num(o.failedWebhooks)} tone={o.failedWebhooks > 0 ? 'error' : 'ink'} definition={`${def('webhookFailures')} (${num(o.totalWebhooks)} gesamt)`} timeClass={tc('webhookFailures')} />
                  <Stat label="Zahlungsfehler (LS)" value={num(o.paymentFailures)} definition="payment_failures.failed_at im Zeitraum" timeClass="Zeitraum" />
                  <Stat label="Offene Tickets" value={num(o.openTickets)} definition="support_tickets.status in new/open/waiting_user" timeClass="Aktueller Stand" />
                  <Stat label="Letzte Wochenmessung" value={o.lastWeeklyTruth ? hm(o.lastWeeklyTruth) : '—'} definition="weekly_metrics.measured_at (Montag 06:00 UTC)" timeClass="Aktueller Stand" />
                </StatRow>
                <KeyValues items={[['Lebenszyklus-Mails im Zeitraum', Object.entries(o.lifecycleSent).map(([k, v]) => `${k} ${v}`).join(' · ') || '0']]} />
              </Section>
            )}
          </Group>

          <Footnote>
            Stufenfilter wirkt auf: {(data.levelFilterApplies || []).join(', ')}. Nicht filterbar: {(data.levelFilterExcluded || []).join(', ')} — Umsatz trägt keine Stufe, weil der Zahlungsanbieter keine mitschickt. Zeitzone UTC · Vergleich {data.days} T davor · Stand {hm(data.generatedAt)}.
          </Footnote>
          {excluded.size > 0 && level !== 'all' ? <p className="mt-1 text-xs text-graphite"><Badge label="Hinweis" tone="warn" /> Der Stufenfilter ist gesetzt; Kacheln mit „Nicht nach Stufe filterbar“ zeigen weiterhin alle Stufen.</p> : null}
          <Diagnostics data={data.diagnostics} />
        </>
      ) : null}
    </>
  );
}
