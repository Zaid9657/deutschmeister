import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageHeader, Section, Tabs, Stat, StatRow, DataTable, Pager, Badge, ErrorLine, Spinner, Footnote, NotInstrumented, KeyValues, Diagnostics, SecondaryButton, ReasonField, num, pct, mmss, hm, money } from '../../components/admin/adminUi.jsx';
import { DailyBars } from '../../components/admin/charts.jsx';
import { useAdminFilters } from '../../components/admin/AdminFilterContext.jsx';
import { useAdminData, useAdminMutation } from '../../components/admin/useAdminData.js';
import { useAdminSession } from '../../components/admin/AdminSessionContext.jsx';

const TABS = [{ id: 'overview', label: 'Übersicht' }, { id: 'sessions', label: 'Sitzungen' }, { id: 'grammar', label: 'Grammatik-Themen' }, { id: 'quality', label: 'Ergebnisse & Qualität' }, { id: 'failures', label: 'Abbrüche & Fehler' }];
const FAIL_TONE = { cancelled: 'warn', abandoned: 'warn', no_speech: 'error', not_evaluated: 'muted' };

function Rollup({ rows, minSample, keyLabel, unattributed }) {
  return (
    <>
      <DataTable dense rows={rows.map((r) => ({ ...r, id: r.key }))} emptyText="Keine Daten im Zeitraum."
        columns={[{ key: 'key', label: keyLabel }, { key: 'starts', label: 'Starts', align: 'right', render: (r) => num(r.starts) }, { key: 'completed', label: 'Abgeschlossen', align: 'right', render: (r) => num(r.completed) }, { key: 'completionRate', label: 'Quote', align: 'right', render: (r) => pct(r.completionRate, 0) }, { key: 'averageScore', label: 'Ø Ergebnis', align: 'right', render: (r) => (r.belowMinimumSample ? <span className="text-graphite">— (unter {minSample} Bewertungen)</span> : num(r.averageScore, 1)) }, { key: 'scoreSample', label: 'Stichprobe', align: 'right' }]} />
      {unattributed > 0 ? <Footnote>{num(unattributed)} Einträge ohne Zuordnung — sie fehlen in der Tabelle, nicht in den Summen.</Footnote> : null}
    </>
  );
}

function SessionDetail({ session, onClose }) {
  const { can } = useAdminSession();
  const [reason, setReason] = useState('');
  const [load, m] = useAdminMutation('admin-usage');
  return (
    <Section title={`Sitzung ${session.token}`} note="Fakten der Sitzung; das Transkript ist ein eigenes Recht (usage.transcripts) und jeder Zugriff wird protokolliert — auch der abgelehnte." right={<SecondaryButton onClick={onClose}>Schließen</SecondaryButton>}>
      <KeyValues items={[['Stufe / Modus', `${session.level} / ${session.mode}`], ['Status', session.status], ['Dauer', mmss(session.durationSeconds)], ['Nutzer-Beiträge', num(session.userTurns)], ['Bewertet', session.evaluated ? 'ja' : 'nein'], ['Ergebnis', session.score == null ? '—' : num(session.score)], ['Gestartet', hm(session.createdAt)], ['Nutzer', <Link key="u" to={`/admin/user/${session.userId}`} className="text-siegel-deep hover:underline">Nutzer 360</Link>], ['Befund', session.failure ? <Badge key="f" label={session.failure.label} tone={FAIL_TONE[session.failure.kind]} /> : 'kein technischer Befund (heißt nicht: gut gelaufen)']]} />
      {can('usage.transcripts') ? (
        <div className="mt-3">
          <ReasonField value={reason} onChange={setReason} />
          <div className="mt-2"><SecondaryButton disabled={m.busy || reason.trim().length < 3} onClick={() => load({ view: 'transcript', sessionToken: session.sessionToken, reason })}>Transkript lesen (wird protokolliert)</SecondaryButton></div>
          {m.error ? <ErrorLine>{m.error}</ErrorLine> : null}
          {m.result?.messages ? <ol className="mt-3 space-y-1 text-[0.8125rem]">{m.result.messages.map((x, i) => <li key={i} className={`rounded px-2 py-1 ${x.role === 'user' ? 'bg-siegel-wash/50' : 'bg-paper-sunk'}`}><span className="mr-2 text-xs font-bold text-graphite">{x.role}</span>{x.content}</li>)}</ol> : null}
        </div>
      ) : <Footnote>Transkripte: für Ihre Rolle nicht erlaubt.</Footnote>}
    </Section>
  );
}

export default function UsagePage() {
  const { range, level } = useAdminFilters();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'overview';
  const setTab = (id) => setParams((p) => { const n = new URLSearchParams(p); n.set('tab', id); return n; });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const lvl = level === 'all' || level === 'unbekannt' ? null : level;
  const { data, loading, error } = useAdminData('admin-usage', { view: 'overview', range, level: lvl }, [range, lvl]);
  const dir = useAdminData('admin-usage', { view: 'directory', range, level: lvl, page }, [range, lvl, page]);
  const sp = data?.speaking;
  return (
    <>
      <PageHeader title="Nutzung" lead="Grundgesamtheit ist speaking_sessions — serverseitig beim Start geschrieben, also die früheste, bedingungslose Zeile. speaking_evaluations liefert Ergebnisse, nie den Nenner. „Abgeschlossen“ wird gelesen (status), nicht aus der Dauer geraten." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {loading && !data ? <Spinner /> : null}
      {error ? <ErrorLine>{error}</ErrorLine> : null}
      {data && tab === 'overview' ? (
        <>
          <StatRow>
            <Stat label="Gestartet" value={num(sp.started)} definition="speaking_sessions.created_at im Zeitraum" timeClass="Zeitraum" />
            <Stat label="Abgeschlossen" value={num(sp.completed)} definition="status = completed" timeClass="Zeitraum" />
            <Stat label="Abschlussquote" value={pct(sp.completedRate, 1, sp.started)} definition="abgeschlossen / gestartet — gestartet heißt nicht abgeschlossen" timeClass="Zeitraum" />
            <Stat label="Median Dauer" value={mmss(sp.durations.median)} definition={`Nearest-Rank über ${num(sp.durations.sample)} abgeschlossene Sitzungen · ${num(sp.durations.running)} ohne Ende (nicht enthalten)`} timeClass="Zeitraum" />
            <Stat label="Nutzer" value={num(sp.users)} definition="verschiedene user_id" timeClass="Zeitraum" />
            <Stat label="KI-Kosten" value={money(sp.costCents)} definition="Summe speaking_sessions.cost_cents" timeClass="Zeitraum" />
          </StatRow>
          <Section title="Sitzungen pro Tag"><DailyBars points={sp.series.map((d) => ({ day: d.day, value: d.count }))} label="Sitzungen" /></Section>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Section title="Nach Stufe" note={`Placement-Sitzungen (Einstufungstest) tragen keine Stufe. Ø Ergebnis erst ab ${data.minSample} Bewertungen.`}><Rollup rows={sp.byLevel.rows} minSample={data.minSample} keyLabel="Stufe" unattributed={sp.byLevel.unattributed} /></Section>
            <Section title="Nach Modus"><Rollup rows={sp.byMode.rows} minSample={data.minSample} keyLabel="Modus" unattributed={sp.byMode.unattributed} /></Section>
          </div>
          <Section title="Wiederkehr" note="Anteil der Nutzer, deren ZWEITE abgeschlossene Sitzung innerhalb von 7 Tagen nach der ersten lag (alle Zeiträume). Nutzer, deren erste Sitzung jünger als 7 Tage ist, sind ausgeschlossen — ihre Woche ist noch nicht vorbei.">
            <StatRow>
              <Stat label="Zweite Sitzung ≤ 7 T" value={pct(data.retention.rate, 0, data.retention.eligible)} definition={`${num(data.retention.retained)} von ${num(data.retention.eligible)} beurteilbaren Nutzern`} timeClass="Seit Beginn" />
              <Stat label="Zu jung für die Aussage" value={num(data.retention.tooRecent)} definition="erste Sitzung < 7 Tage alt" timeClass="Aktueller Stand" />
            </StatRow>
          </Section>
          <Footnote>Stufenfilter wirkt auf: {data.levelFilterApplies.join(', ')} · nicht auf: {data.levelFilterExcluded.join(', ')}. Zeitzone UTC · Stand {hm(data.generatedAt)}</Footnote>
          <Diagnostics data={data.diagnostics} />
        </>
      ) : null}
      {tab === 'sessions' ? (
        <>
          {selected ? <SessionDetail session={selected} onClose={() => setSelected(null)} /> : null}
          <Section title={dir.data ? `${num(dir.data.total)} Sitzungen` : 'Sitzungen'}>
            {dir.loading && !dir.data ? <Spinner /> : null}
            {dir.error ? <ErrorLine>{dir.error}</ErrorLine> : null}
            {dir.data ? (
              <>
                <DataTable dense rows={dir.data.rows} onRowClick={setSelected} emptyText="Keine Sitzungen im Zeitraum."
                  columns={[{ key: 'createdAt', label: 'Start', render: (r) => hm(r.createdAt) }, { key: 'token', label: 'Kurz-ID' }, { key: 'level', label: 'Stufe' }, { key: 'mode', label: 'Modus' }, { key: 'status', label: 'Status', render: (r) => <Badge label={r.status} tone={r.status === 'completed' ? 'ok' : r.status === 'cancelled' ? 'warn' : 'muted'} /> }, { key: 'durationSeconds', label: 'Dauer', render: (r) => mmss(r.durationSeconds) }, { key: 'userTurns', label: 'Beiträge', align: 'right' }, { key: 'score', label: 'Ergebnis', align: 'right', render: (r) => (r.score == null ? '—' : num(r.score)) }, { key: 'failure', label: 'Befund', render: (r) => (r.failure ? <Badge label={r.failure.label} tone={FAIL_TONE[r.failure.kind]} /> : '—') }]} />
                <Pager page={dir.data.page} pageSize={dir.data.pageSize} total={dir.data.total} onPage={setPage} />
              </>
            ) : null}
          </Section>
        </>
      ) : null}
      {data && tab === 'grammar' ? (
        <Section title="Grammatik-Themen" note={`user_grammar_progress mit last_accessed/created_at im Zeitraum: ${num(data.grammar.rows)} Einträge, ${num(data.grammar.users)} Nutzer, ${num(data.grammar.completed)} abgeschlossen. Ø Score erst ab ${data.grammar.minSample} Werten.`}>
          <Rollup rows={data.grammar.byTopic.rows} minSample={data.grammar.minSample} keyLabel="Thema" unattributed={data.grammar.byTopic.unattributed} />
        </Section>
      ) : null}
      {data && tab === 'quality' ? (
        <>
          <Section title="Bewertungsabdeckung" note="Zähler nach Sitzung dedupliziert; nur abgeschlossene Sitzungen sind bewertbar; Zeilen ohne Score werden ausgeschlossen, nie auf 0 gesetzt.">
            <p className="text-[0.8125rem] text-ink">{num(sp.coverage.total)} gesamt → {num(sp.coverage.eligible)} bewertbar → {num(sp.coverage.evaluatedSessions)} bewertet → <strong>{pct(sp.coverage.coverage, 1, sp.coverage.eligible)}</strong></p>
            <Footnote>{num(sp.coverage.notEligible)} nicht bewertbar · {num(sp.coverage.missingEvaluation)} ohne Bewertung · {num(sp.coverage.duplicateRows)} Duplikate · {num(sp.coverage.unusableRows)} ohne brauchbaren Score · Ø {pct(sp.coverage.avgScore, 1, sp.coverage.scoreSample)} über {num(sp.coverage.scoreSample)} Werte</Footnote>
          </Section>
          <Section title="Verteilung der Ergebnisse (0–100, zehn feste Klassen)" note={`${num(sp.scoreSample)} bewertete Sitzungen.`}>
            {sp.scoreSample === 0 ? <p className="py-3 text-[0.8125rem] text-graphite">Keine Bewertungen im Zeitraum.</p> : (
              <ol className="mt-2 space-y-1">{sp.scoreBuckets.map((b) => <li key={b.from} className="grid grid-cols-[5rem_1fr_3rem] items-center gap-3 text-xs"><span>{b.from}–{b.to}</span><span className="block h-3 rounded-sm bg-paper-sunk"><span className="block h-3 rounded-sm bg-viz-series1" style={{ width: `${(b.count / Math.max(1, ...sp.scoreBuckets.map((x) => x.count))) * 100}%` }} /></span><span className="text-right tabular-nums">{num(b.count)}</span></li>)}</ol>
            )}
          </Section>
          <Section title="Nach Mission"><Rollup rows={sp.byMission.rows} minSample={data.minSample} keyLabel="Mission" unattributed={sp.byMission.unattributed} /></Section>
        </>
      ) : null}
      {data && tab === 'failures' ? (
        <>
          <Section title="Abbrüche (Sprechsitzungen)" note="Vier Ursachen, die eine einzige „Fehlerquote“ zu einer nutzlosen Zahl verschmelzen würde. „Kein Befund“ heißt: die Sitzung trägt keinen technischen Fehler — nicht, dass sie gut lief.">
            <StatRow>
              {Object.entries(data.failures.kinds).map(([k, v]) => <Stat key={k} label={v.label} value={num(v.count)} tone={FAIL_TONE[k] === 'error' ? 'error' : 'ink'} timeClass="Zeitraum" />)}
              <Stat label="Gesamt mit Befund" value={num(data.failures.total)} definition={`von ${num(sp.started)} gestarteten`} timeClass="Zeitraum" />
            </StatRow>
            <DataTable dense rows={data.failures.samples} emptyText="Keine Befunde im Zeitraum." columns={[{ key: 'createdAt', label: 'Start', render: (r) => hm(r.createdAt) }, { key: 'token', label: 'Kurz-ID' }, { key: 'level', label: 'Stufe' }, { key: 'mode', label: 'Modus' }, { key: 'label', label: 'Befund' }]} />
          </Section>
          <Section title="Fehlergruppen (Webhooks)" note="Gruppiert nach normalisiertem Fingerabdruck (IDs, Zahlen, Zitate entfernt), höchstens 20 Rohzeilen je Gruppe.">
            {data.errors.webhooks.length === 0 ? <p className="py-3 text-[0.8125rem] text-graphite">Keine fehlgeschlagenen Webhooks im Zeitraum.</p> : data.errors.webhooks.map((g) => <details key={g.fingerprint} className="border-t border-rule py-2 text-[0.8125rem]"><summary className="cursor-pointer">▸ <span className="font-data">{g.fingerprint}</span> · {g.count}× · zuerst {hm(g.firstSeen)} · zuletzt {hm(g.lastSeen)} · {g.kinds.join(', ')}</summary><ul className="mt-1 space-y-0.5 text-xs text-graphite">{g.samples.map((s) => <li key={s.id}>{hm(s.createdAt)} · {s.eventType} · {s.error}</li>)}</ul></details>)}
          </Section>
          <NotInstrumented label="KI-Aufruffehler (Sprechen, Schreiben, X-Ray)" reason="Fehler der KI-Endpunkte landen nur in den Netlify-Logs, nicht in einer Tabelle." unblock="Fehler-Ledger je Aufruf (Funktion, Status, Dauer) schreiben und hier gruppieren." />
        </>
      ) : null}
    </>
  );
}
