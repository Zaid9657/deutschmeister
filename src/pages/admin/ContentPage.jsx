import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageHeader, Section, Tabs, Stat, StatRow, DataTable, Pager, Badge, ErrorLine, Spinner, Footnote, KeyValues, Field, Input, Select, ReasonField, SecondaryButton, dmy, hm, num } from '../../components/admin/adminUi.jsx';
import { useAdminData, useAdminMutation } from '../../components/admin/useAdminData.js';

const TABS = [{ id: 'overview', label: 'Übersicht' }, { id: 'list', label: 'Inhalte' }, { id: 'structure', label: 'Struktur' }, { id: 'review', label: 'Prüfung & Freigabe' }, { id: 'archive', label: 'Archiv' }];
const LC_TONE = { draft: 'muted', in_review: 'warn', published: 'ok', hidden: 'warn', archived: 'muted' };
const REVIEW_LABEL = { never: 'Nie geprüft', scheduled_unknown: 'Ohne Termin', due: 'Fällig', ok: 'Geprüft' };
const LEVELS = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];

function Detail({ table, id, onChanged, onClose }) {
  const { data, loading, error, reload } = useAdminData('admin-content', { action: 'detail', table, id }, [table, id]);
  const [act, m] = useAdminMutation('admin-content');
  const [reason, setReason] = useState('');
  const [next, setNext] = useState('');
  const item = data?.item;
  const run = async (action, params) => { const r = await act({ action, table, id, params, reason }); if (r) { setReason(''); reload(); onChanged(); } };
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorLine>{error}</ErrorLine>;
  if (!item) return null;
  return (
    <Section title={item.title} note={`${item.tableLabel} · ${item.level ? item.level.toUpperCase() : '—'}${item.slug ? ` · ${item.slug}` : ''}`} right={<><Badge label={item.lifecycleLabel} tone={LC_TONE[item.lifecycle]} /><SecondaryButton onClick={onClose}>Schließen</SecondaryButton></>}>
      <KeyValues items={[['Sichtbar für Lernende', item.hasPublishedFlag ? (item.publishedFlag ? 'ja (Flag gesetzt)' : 'nein (Flag aus)') : 'Tabelle hat kein Sichtbarkeits-Flag — der Lebenszyklus ist hier nur Verwaltung, die Inhalte bleiben sichtbar'], ['Prüfung', `${REVIEW_LABEL[item.review]} · zuletzt ${dmy(item.lastReviewedAt)} · nächste ${dmy(item.nextReviewAt)}`], ['Verantwortlich', item.ownerEmail || '—'], ['Geprüft von', item.reviewerEmail || '—'], ['Erstellt / geändert', `${dmy(item.createdAt)} / ${dmy(item.updatedAt)}`], ['Öffentliche Adresse', <a key="r" href={item.route} className="text-siegel-deep hover:underline" target="_blank" rel="noreferrer">{item.route}</a>]]} />
      <div className="mt-3"><ReasonField value={reason} onChange={setReason} /></div>
      <div className="mt-2 flex flex-wrap gap-2">
        {data.allowedTransitions.map((to) => <SecondaryButton key={to} disabled={m.busy || reason.trim().length < 3 || (to === 'published' && !data.canPublish)} onClick={() => run('set_lifecycle', { status: to })}>→ {data.lifecycle[to]}</SecondaryButton>)}
        {data.allowedTransitions.length === 0 ? <span className="text-xs text-graphite">Keine erlaubten Übergänge aus diesem Status.</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <Field label="Nächste Prüfung (TT.MM.JJJJ oder ISO)"><Input value={next} onChange={(e) => setNext(e.target.value)} placeholder="leer = kein Termin" /></Field>
        <SecondaryButton disabled={m.busy || reason.trim().length < 3} onClick={() => run('set_review', { reviewedNow: true, nextReviewAt: next ? (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(next) ? next.split('.').reverse().join('-') : next) : null })}>Jetzt als geprüft markieren</SecondaryButton>
        <SecondaryButton disabled={m.busy || reason.trim().length < 3} onClick={() => run('set_owner', { ownerId: null })}>Verantwortung entfernen</SecondaryButton>
      </div>
      {m.error ? <ErrorLine>{m.error}</ErrorLine> : null}
      {data.audit.length ? <details className="mt-3 text-xs text-graphite"><summary className="cursor-pointer">Protokoll ({data.audit.length})</summary><ul className="mt-1 space-y-0.5">{data.audit.map((a, i) => <li key={i}>{hm(a.occurred_at)} · {a.action} · {a.reason}</li>)}</ul></details> : null}
      <details className="mt-3 text-xs text-graphite"><summary className="cursor-pointer">Rohdaten (ohne Inhaltsfelder)</summary><pre className="mt-1 overflow-x-auto font-data text-[0.6875rem]">{JSON.stringify(data.raw, null, 1)}</pre></details>
    </Section>
  );
}

export default function ContentPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : params.get('table') ? 'list' : 'overview';
  const table = params.get('table') || 'grammar_topics';
  const lifecycle = params.get('lifecycle') || '';
  const review = params.get('review') || '';
  const levelF = params.get('level') || '';
  const set = (k, v) => setParams((p) => { const n = new URLSearchParams(p); if (!v) n.delete(k); else n.set(k, v); return n; });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const ov = useAdminData('admin-content', { action: 'overview' }, []);
  const listFilters = tab === 'archive' ? { lifecycle: 'archived' } : tab === 'review' ? { review: review || 'never' } : { lifecycle: lifecycle || undefined, review: review || undefined, level: levelF || undefined, search: search || undefined };
  const list = useAdminData('admin-content', { action: 'list', table, page, pageSize: 50, filters: listFilters }, [table, page, tab, lifecycle, review, levelF, search]);
  const o = ov.data;
  return (
    <>
      <PageHeader title="Lerninhalte" lead="Sechs Inhaltstabellen unter einem Lebenszyklus (Entwurf → In Prüfung → Veröffentlicht → Verborgen → Archiviert; Archiviert kommt nur über die Prüfung zurück). Wo eine Tabelle ein Sichtbarkeits-Flag hat (Grammatik, Podcasts, Missionen, Videos), spiegelt „Veröffentlicht“ es; Lesetexte und Hörübungen haben keines und bleiben sichtbar." />
      <Tabs tabs={TABS} active={tab} onChange={(id) => set('tab', id)} />
      {ov.loading && !o ? <Spinner /> : null}
      {ov.error ? <ErrorLine>{ov.error}</ErrorLine> : null}
      {o && tab === 'overview' ? (
        <>
          <StatRow>
            <Stat label="Inhalte" value={num(o.totals.items)} definition="Zeilen in den sechs Tabellen" timeClass="Aktueller Stand" />
            <Stat label="Nie geprüft" value={num(o.totals.never)} definition="last_reviewed_at IS NULL — nie, nicht „unbekannt wann“" timeClass="Aktueller Stand" />
            <Stat label="Prüfung fällig" value={num(o.totals.due)} definition="next_review_at ≤ jetzt" timeClass="Aktueller Stand" />
            <Stat label="Gemeldet (Tickets)" value={num(o.contentTickets)} definition="offene Support-Tickets der Kategorie Inhalt" timeClass="Aktueller Stand" />
          </StatRow>
          <Section title="Nach Tabelle">
            <DataTable dense rows={o.perTable.map((t) => ({ ...t, id: t.table }))} onRowClick={(r) => { set('table', r.table); set('tab', 'list'); }}
              columns={[{ key: 'label', label: 'Tabelle' }, { key: 'total', label: 'Bestand', align: 'right', render: (r) => num(r.total) }, { key: 'byStatus', label: 'Lebenszyklus', render: (r) => Object.entries(r.byStatus).map(([k, v]) => `${o.lifecycle[k]} ${v}`).join(' · ') }, { key: 'reviews', label: 'Prüfung', render: (r) => `nie ${r.reviews.never} · fällig ${r.reviews.due} · ok ${r.reviews.ok}` }, { key: 'hasPublishedFlag', label: 'Sichtbarkeits-Flag', render: (r) => (r.hasPublishedFlag ? 'ja' : 'nein') }]} />
          </Section>
        </>
      ) : null}
      {(tab === 'list' || tab === 'review' || tab === 'archive') ? (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <Field label="Tabelle"><Select value={table} onChange={(e) => { setPage(1); set('table', e.target.value); }}>{(o?.tables || [{ key: table, label: table }]).map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</Select></Field>
            {tab === 'list' ? <Field label="Lebenszyklus"><Select value={lifecycle} onChange={(e) => { setPage(1); set('lifecycle', e.target.value); }}><option value="">Alle</option>{Object.entries(o?.lifecycle || {}).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field> : null}
            {tab === 'review' ? <Field label="Prüfstatus"><Select value={review || 'never'} onChange={(e) => { setPage(1); set('review', e.target.value); }}>{Object.entries(REVIEW_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field> : null}
            <Field label="Stufe"><Select value={levelF} onChange={(e) => { setPage(1); set('level', e.target.value); }}><option value="">Alle</option>{LEVELS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}</Select></Field>
            {tab === 'list' ? <Field label="Suche im Titel"><Input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} /></Field> : null}
          </div>
          {selected ? <Detail table={selected.table} id={selected.id} onChanged={() => list.reload()} onClose={() => setSelected(null)} /> : null}
          <Section title={list.data ? `${list.data.tableLabel}: ${num(list.data.total)}${list.data.totalIsExact ? '' : ' (nach dem Laden gefiltert)'}` : 'Inhalte'}>
            {list.loading && !list.data ? <Spinner /> : null}
            {list.error ? <ErrorLine>{list.error}</ErrorLine> : null}
            {list.data ? (
              <>
                <DataTable dense rows={list.data.rows} onRowClick={setSelected} emptyText="Keine Inhalte für diese Filter."
                  columns={[{ key: 'level', label: 'Stufe', render: (r) => (r.level ? r.level.toUpperCase() : '—') }, { key: 'order', label: '#', align: 'right' }, { key: 'title', label: 'Titel' }, { key: 'lifecycle', label: 'Lebenszyklus', render: (r) => <Badge label={r.lifecycleLabel} tone={LC_TONE[r.lifecycle]} /> }, { key: 'publishedFlag', label: 'Sichtbar', render: (r) => (r.hasPublishedFlag ? (r.publishedFlag ? 'ja' : 'nein') : 'kein Flag') }, { key: 'review', label: 'Prüfung', render: (r) => REVIEW_LABEL[r.review] }, { key: 'lastReviewedAt', label: 'Zuletzt geprüft', render: (r) => dmy(r.lastReviewedAt) }, { key: 'updatedAt', label: 'Geändert', render: (r) => dmy(r.updatedAt || r.createdAt) }]} />
                <Pager page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} totalIsExact={list.data.totalIsExact} onPage={setPage} />
              </>
            ) : null}
          </Section>
        </>
      ) : null}
      {o && tab === 'structure' ? (
        <Section title="Grammatik-Struktur (Voraussetzungen)" note="prerequisite_slugs bilden einen gerichteten Graphen. Vier Befundklassen, jede mit den Zeilen, die sie belegen; Zyklen werden mit Tiefengrenze 64 gesucht — ohne die Grenze wäre die Prüfung selbst der Fehler.">
          <KeyValues items={[['Zustand', o.hierarchy.healthy ? <Badge key="h" label="gesund" tone="ok" /> : <Badge key="h" label="Befunde" tone="warn" />], ['Wurzeln (ohne Voraussetzung)', num(o.hierarchy.roots)], ['Waisen (Voraussetzung existiert nicht)', o.hierarchy.orphans.length ? o.hierarchy.orphans.map((x) => `${x.slug} → ${x.missing}`).join(' · ') : '0'], ['Zyklen', o.hierarchy.cycles.length ? o.hierarchy.cycles.map((c) => c.slug).join(' · ') : '0'], ['Doppelte Titel je Stufe', o.hierarchy.duplicateSiblings.length ? o.hierarchy.duplicateSiblings.map((d) => d.slugs.join(' = ')).join(' · ') : '0']]} />
          <Footnote>Die Hierarchie wird geprüft, nicht bearbeitet: Voraussetzungen werden über die Content-Skripte (scripts/grammar-topics-from-json.mjs) gepflegt, und ein Zyklus würde dort vor dem Schreiben abgefangen (wouldCreateCycle).</Footnote>
        </Section>
      ) : null}
      {o ? <Footnote>Stand {hm(o.generatedAt)} · Zeitzone UTC · Video-Upload weiterhin unter <Link to="/admin/videos" className="text-siegel-deep hover:underline">/admin/videos</Link></Footnote> : null}
    </>
  );
}
