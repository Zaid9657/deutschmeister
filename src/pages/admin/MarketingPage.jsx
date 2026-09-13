import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, Section, Tabs, Stat, StatRow, DataTable, Pager, Badge, ErrorLine, Spinner, Footnote, NotInstrumented, KeyValues, Field, Input, Select, ReasonField, PrimaryButton, SecondaryButton, dmy, hm, num, money, pct } from '../../components/admin/adminUi.jsx';
import { DailyBars } from '../../components/admin/charts.jsx';
import { useAdminData, useAdminMutation } from '../../components/admin/useAdminData.js';
import { useAdminSession } from '../../components/admin/AdminSessionContext.jsx';
import { useAdminFilters } from '../../components/admin/AdminFilterContext.jsx';

const TABS = [{ id: 'overview', label: 'Übersicht' }, { id: 'signals', label: 'Quellen & Signale' }, { id: 'coupons', label: 'Gutscheincodes' }];
const ST_TONE = { draft: 'muted', active: 'ok', paused: 'warn', archived: 'muted', expired: 'warn', exhausted: 'warn' };
const EMPTY = { code: '', internal_name: '', public_label: '', discount_type: 'percent', discount_value: '10', starts_at: '', ends_at: '', total_limit: '', per_user_limit: '1', new_customer_only: false, minimum_order_amount: '', applicable_variant_ids: '' };

function CouponForm({ initial = EMPTY, locked = [], onSubmit, busy, error, submitLabel = 'Anlegen' }) {
  const [f, setF] = useState(initial);
  const [reason, setReason] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const dis = (k) => locked.includes(k);
  return (
    <div>
      <p className="mb-3 rounded-md bg-viz-warn/10 px-3 py-2 text-xs text-ink">ⓘ Der Rabatt selbst liegt in Lemon Squeezy. Dieses System legt keine LS-Rabatte an — der Code muss dort identisch existieren. Hier entsteht die Regel (wer, wann, wie oft, welches Produkt) und das Einlöse-Buch.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Code" required hint="4–32 Zeichen, A–Z 0–9 _ -"><Input value={f.code} onChange={set('code')} disabled={dis('code')} /></Field>
        <Field label="Interner Name" required><Input value={f.internal_name} onChange={set('internal_name')} /></Field>
        <Field label="Öffentliche Bezeichnung"><Input value={f.public_label} onChange={set('public_label')} /></Field>
        <Field label="Rabattart"><Select value={f.discount_type} onChange={set('discount_type')} disabled={dis('discount_type')}><option value="percent">Prozent</option><option value="fixed">Festbetrag (Cent)</option></Select></Field>
        <Field label={f.discount_type === 'percent' ? 'Prozent (1–100)' : 'Betrag in Cent'} required><Input type="number" value={f.discount_value} onChange={set('discount_value')} disabled={dis('discount_value')} /></Field>
        <Field label="Produkte (LS-Varianten-IDs, kommagetrennt)" hint="leer = alle Produkte; nur numerische IDs"><Input value={f.applicable_variant_ids} onChange={set('applicable_variant_ids')} disabled={dis('applicable_variant_ids')} /></Field>
        <Field label="Gültig ab" hint="TT.MM.JJJJ oder ISO; leer = jetzt"><Input value={f.starts_at} onChange={set('starts_at')} /></Field>
        <Field label="Gültig bis" hint="leer = unbegrenzt"><Input value={f.ends_at} onChange={set('ends_at')} /></Field>
        <Field label="Gesamtlimit" hint="leer = unbegrenzt (braucht finance/admin zum Freischalten)"><Input type="number" value={f.total_limit} onChange={set('total_limit')} /></Field>
        <Field label="Pro Nutzer"><Input type="number" value={f.per_user_limit} onChange={set('per_user_limit')} /></Field>
        <Field label="Mindestbestellwert (Cent)"><Input type="number" value={f.minimum_order_amount} onChange={set('minimum_order_amount')} disabled={dis('minimum_order_amount')} /></Field>
        <label className="flex items-center gap-2 self-end text-xs text-ink"><input type="checkbox" checked={Boolean(f.new_customer_only)} onChange={set('new_customer_only')} disabled={dis('new_customer_only')} /> Nur Neukunden (= ohne frühere Einlösung)</label>
        <div className="sm:col-span-3"><ReasonField value={reason} onChange={setReason} /></div>
      </div>
      {error ? <ErrorLine>{error}</ErrorLine> : null}
      <div className="mt-3"><PrimaryButton disabled={busy || reason.trim().length < 3} onClick={() => onSubmit({ ...f, starts_at: f.starts_at ? toIso(f.starts_at) : undefined, ends_at: f.ends_at ? toIso(f.ends_at) : null, total_limit: f.total_limit === '' ? null : f.total_limit, per_user_limit: f.per_user_limit === '' ? null : f.per_user_limit, minimum_order_amount: f.minimum_order_amount === '' ? null : f.minimum_order_amount }, reason)}>{submitLabel}</PrimaryButton></div>
    </div>
  );
}

function toIso(v) {
  const m = String(v).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T00:00:00Z` : v;
}

function CouponDetail({ id, onChanged, onClose }) {
  const { data, loading, error, reload } = useAdminData('admin-coupons', { action: 'detail', id }, [id]);
  const [act, m] = useAdminMutation('admin-coupons');
  const [reason, setReason] = useState('');
  const c = data?.coupon;
  const run = async (action, params) => { const r = await act({ action, id, params, reason }); if (r) { setReason(''); reload(); onChanged(); } };
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorLine>{error}</ErrorLine>;
  if (!c) return null;
  return (
    <Section title={`${c.code} · ${c.internal_name}`} note={c.provider.note} right={<><Badge label={c.effectiveStatus} tone={ST_TONE[c.effectiveStatus]} />{c.elevated ? <Badge label="hoher Rabatt / unbegrenzt" tone="warn" /> : null}<SecondaryButton onClick={onClose}>Schließen</SecondaryButton></>}>
      <KeyValues items={[['Rabatt', c.discount_type === 'percent' ? `${c.discount_value} %` : money(c.discount_value, c.currency)], ['Gültig', `${dmy(c.starts_at)} – ${c.ends_at ? dmy(c.ends_at) : 'unbegrenzt'}`], ['Eingelöst / Rest', `${num(c.redemptions)} / ${c.remaining === null ? 'unbegrenzt' : num(c.remaining)}`], ['Pro Nutzer', c.per_user_limit ?? 'unbegrenzt'], ['Nur Neukunden', c.new_customer_only ? 'ja (= ohne frühere Einlösung)' : 'nein'], ['Produkte', c.applicable_variant_ids.length ? c.applicable_variant_ids.join(', ') : 'alle'], ['Status gespeichert', c.status], ['Gesperrte Felder', data.lockedFields.length ? data.lockedFields.join(', ') : 'keine (noch nicht eingelöst)']]} />
      <div className="mt-3"><ReasonField value={reason} onChange={setReason} /></div>
      <div className="mt-2 flex flex-wrap gap-2">
        {data.allowedTransitions.includes('active') ? <PrimaryButton disabled={m.busy || reason.trim().length < 3} onClick={() => run('activate')}>Live schalten</PrimaryButton> : null}
        {data.allowedTransitions.includes('paused') ? <SecondaryButton disabled={m.busy || reason.trim().length < 3} onClick={() => run('pause')}>Pausieren</SecondaryButton> : null}
        {data.allowedTransitions.includes('archived') ? <SecondaryButton disabled={m.busy || reason.trim().length < 3} onClick={() => run('archive')}>Archivieren (endgültig)</SecondaryButton> : null}
      </div>
      {m.error ? <ErrorLine>{m.error}</ErrorLine> : null}
      <h3 className="mt-4 text-sm font-bold text-ink">Einlösungen</h3>
      {data.redemptionsPermitted ? (
        <DataTable dense rows={data.redemptions} emptyText="Noch keine Einlösung." columns={[{ key: 'redeemed_at', label: 'Datum', render: (r) => hm(r.redeemed_at) }, { key: 'user_email', label: 'Nutzer' }, { key: 'order_id', label: 'Bestellung', render: (r) => `••••${String(r.order_id).slice(-4)}` }, { key: 'discount_amount', label: 'Rabatt', align: 'right', render: (r) => money(r.discount_amount, r.currency) }, { key: 'final_amount', label: 'Bezahlt', align: 'right', render: (r) => money(r.final_amount, r.currency) }, { key: 'payment_status', label: 'Status', render: (r) => <Badge label={r.payment_status} tone={r.payment_status === 'paid' ? 'ok' : 'muted'} /> }, { key: 'refund', label: '', render: (r) => (r.payment_status === 'paid' ? <SecondaryButton disabled={m.busy || reason.trim().length < 3} onClick={() => run('refund_adjustment', { redemptionId: r.id })}>Als erstattet markieren</SecondaryButton> : null) }]} />
      ) : <Footnote>Einlösungen: für Ihre Rolle nicht erlaubt (finance.coupon_redemptions.read).</Footnote>}
      <Footnote>Eine Erstattung stellt das Limit nie automatisch wieder her — die Zeile bleibt, nur ihr Zahlungsstatus ändert sich.</Footnote>
    </Section>
  );
}

function Coupons() {
  const { can } = useAdminSession();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const { data, loading, error, reload } = useAdminData('admin-coupons', { action: 'list', page, filters: { status: status || undefined } }, [page, status]);
  const [create, m] = useAdminMutation('admin-coupons');
  return (
    <>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <Field label="Status"><Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}><option value="">Alle</option>{['draft', 'active', 'paused', 'archived', 'expired', 'exhausted'].map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
        {can('marketing.coupons.write') ? <SecondaryButton onClick={() => setCreating((c) => !c)}>{creating ? 'Formular schließen' : 'Neuer Gutscheincode'}</SecondaryButton> : null}
      </div>
      {creating ? <Section title="Neuer Gutscheincode"><CouponForm busy={m.busy} error={m.error} onSubmit={async (params, reason) => { const r = await create({ action: 'create', params, reason }); if (r) { setCreating(false); reload(); setSelected(r.coupon.id); } }} /></Section> : null}
      {selected ? <CouponDetail id={selected} onChanged={reload} onClose={() => setSelected(null)} /> : null}
      <Section title={data ? `${num(data.total)} Codes` : 'Codes'}>
        {loading && !data ? <Spinner /> : null}
        {error ? <ErrorLine>{error}</ErrorLine> : null}
        {data ? (
          <>
            <DataTable dense rows={data.rows} onRowClick={(r) => setSelected(r.id)} emptyText="Noch keine Gutscheincodes."
              columns={[{ key: 'code', label: 'Code' }, { key: 'internal_name', label: 'Name' }, { key: 'discount', label: 'Rabatt', render: (r) => (r.discount_type === 'percent' ? `${r.discount_value} %` : money(r.discount_value, r.currency)) }, { key: 'effectiveStatus', label: 'Status', render: (r) => <Badge label={r.effectiveStatus} tone={ST_TONE[r.effectiveStatus]} /> }, { key: 'redemptions', label: 'Eingelöst', align: 'right', render: (r) => num(r.redemptions) }, { key: 'remaining', label: 'Rest', align: 'right', render: (r) => (r.remaining === null ? '∞' : num(r.remaining)) }, { key: 'ends_at', label: 'Bis', render: (r) => (r.ends_at ? dmy(r.ends_at) : '—') }]} />
            <Pager page={data.page} pageSize={data.pageSize} total={data.total} totalIsExact={data.totalIsExact} onPage={setPage} />
          </>
        ) : null}
      </Section>
    </>
  );
}

export default function MarketingPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'overview';
  const { range } = useAdminFilters();
  const { data, loading, error } = useAdminData('admin-marketing', { range }, [range]);
  return (
    <>
      <PageHeader title="Marketing" lead="Die ehrliche Antwort zuerst: es gibt keine Kanalzuordnung. Nicht wenig — keine. Was echt ist, steht mit seiner Einschränkung dabei." />
      <Tabs tabs={TABS} active={tab} onChange={(id) => setParams((p) => { const n = new URLSearchParams(p); n.set('tab', id); return n; })} />
      {loading && !data ? <Spinner /> : null}
      {error ? <ErrorLine>{error}</ErrorLine> : null}
      {data && tab === 'overview' ? (
        <>
          <NotInstrumented label="Kanalzuordnung" reason={`${num(data.attribution.capturedUsers)} von ${num(data.attribution.totalUsers)} Nutzern haben eine erfasste Quelle. ${data.attribution.reason}`} unblock={data.attribution.unblock} />
          <StatRow>
            <Stat label="Registrierungen" value={num(data.signups.count)} definition="profiles.created_at im Zeitraum" timeClass="Zeitraum" />
            <Stat label="Fehlgeschlagene Registrierungen" value={num(data.signups.attempts)} definition={data.signups.definition} timeClass="Zeitraum" />
            <Stat label="Lebenszyklus-Mails" value={num(data.lifecycle.total)} definition={data.lifecycle.definition} timeClass="Zeitraum" />
            <Stat label="Satz des Tages abbestellt" value={num(data.lifecycle.optedOut)} definition="profiles.email_daily_sentence = false" timeClass="Aktueller Stand" />
            <Stat label="Gutscheine aktiv" value={num(data.coupons.active)} definition={`${num(data.coupons.total)} Codes gesamt`} timeClass="Aktueller Stand" />
            <Stat label="Rabatt gewährt" value={money(data.coupons.discountGivenInWindow)} definition={`${num(data.coupons.redemptionsInWindow)} Einlösungen (EUR) im Zeitraum`} timeClass="Zeitraum" />
          </StatRow>
          <Section title="Registrierungen pro Tag"><DailyBars points={data.signups.series.map((d) => ({ day: d.day, value: d.count }))} label="Registrierungen" /></Section>
          <NotInstrumented label="Banner / Ankündigungen" reason={data.banner.reason} unblock="Ein Konfigurationsobjekt mit Änderungsverlauf anlegen, wenn Ankündigungen wöchentlich wechseln sollen." />
        </>
      ) : null}
      {data && tab === 'signals' ? (
        <>
          <Section title="Lebenszyklus-Mails nach Art" note={data.lifecycle.definition}>
            <KeyValues items={Object.entries(data.lifecycle.byKind).map(([k, v]) => [k, num(v)])} />
            {Object.keys(data.lifecycle.byKind).length === 0 ? <p className="py-2 text-[0.8125rem] text-graphite">Keine Mails im Zeitraum.</p> : null}
          </Section>
          <Section title="Fehlgeschlagene Registrierungen nach Fehler" note="Reichweite, keine Zuordnung: kein Versuch lässt sich einer Registrierung zuordnen.">
            <KeyValues items={Object.entries(data.signups.failedByError).map(([k, v]) => [k, num(v)])} />
            {Object.keys(data.signups.failedByError).length === 0 ? <p className="py-2 text-[0.8125rem] text-graphite">Keine Fehlversuche im Zeitraum.</p> : null}
            <Footnote>Quote Fehlversuche / gelungene: {pct(data.signups.count > 0 ? data.signups.attempts / (data.signups.attempts + data.signups.count) : null, 0)}</Footnote>
          </Section>
        </>
      ) : null}
      {tab === 'coupons' ? <Coupons /> : null}
      {data ? <Footnote>Stand {hm(data.generatedAt)} · Zeitzone UTC</Footnote> : null}
    </>
  );
}
