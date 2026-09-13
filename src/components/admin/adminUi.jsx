// Admin panel — the shared kit every admin screen imports.
//
// Its existence is why eleven screens look like one product; its CONTENTS are
// why they cannot lie in eleven different ways: `Stat` takes a definition
// line, `NotInstrumented` renders the third state ("no data source exists",
// which is neither an error nor a zero) with an unblock step, and the
// formatters print `—` for absence and `0` for zero.
//
// Brand: the site's own tokens (src/data/design-tokens.js) — ink, paper,
// rule, siegel for the one interactive colour — plus the `viz` palette for
// data. Reference material is FLAT (rule 3): cards are white on paper-sunk
// with a hairline, no shadows; the only raised things are the buttons, which
// come from src/components/ui/Button.jsx so both front ends keep one button.
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Button from '../ui/Button.jsx';

export { num, pct, pct100, money, dmy, hm, mmss, ago } from '../../lib/admin/adminFormat.js';

const TONE_TEXT = {
  ok: 'text-viz-pos',
  warn: 'text-viz-warn',
  bad: 'text-viz-neg',
  error: 'text-viz-error',
  muted: 'text-graphite',
  ink: 'text-ink',
};

/** Page title + the lead that names the SOURCE and its limits. */
export function PageHeader({ title, lead, right }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pt-4 pb-3">
      <div className="min-w-0">
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-ink">{title}</h1>
        {lead ? <p className="mt-1 max-w-3xl text-sm leading-5 text-graphite">{lead}</p> : null}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
    </div>
  );
}

/**
 * A headline figure. `definition` is the sentence that makes the number a
 * fact someone can check ("mindestens eine gezählte Nutzung"); `timeClass`
 * says whether it follows the date filter ("Aktueller Stand" does not).
 * The aria-label is what browser tests read a number from — never the
 * rendered text, which is formatted.
 */
export function Stat({ label, value, definition, timeClass, delta, tone, className = '' }) {
  const color = TONE_TEXT[tone] ?? TONE_TEXT.ink;
  return (
    <div
      className={`flex min-w-0 grow basis-40 flex-col rounded-lg border border-rule bg-white p-4 ${className}`}
      aria-label={`${label}: ${value}`}
    >
      <span className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{label}</span>
      <span className={`mt-1 font-body text-[1.375rem] font-bold leading-none tabular-nums ${color}`}>{value}</span>
      {delta ? <span className="mt-1.5 text-xs text-graphite">{delta}</span> : null}
      {definition ? <span className="mt-1.5 text-[0.6875rem] leading-4 text-graphite/80">{definition}</span> : null}
      {timeClass ? <span className="mt-1 text-[0.6875rem] font-semibold text-graphite">{timeClass}</span> : null}
    </div>
  );
}

/** A row of Stats reflows 4 → 2 → 1 with no media query (flex-basis 160). */
export function StatRow({ children }) {
  return <div className="mt-3 flex flex-wrap gap-3">{children}</div>;
}

/**
 * A delta line: arrow + sign + colour, colour never alone.
 * `now`/`prev` are numbers; `fmt` renders them.
 */
export function Delta({ now, prev, fmt = (v) => String(v), suffix = '' }) {
  if (now === null || now === undefined || prev === null || prev === undefined) return <span>Vergleich nicht verfügbar</span>;
  const d = Number(now) - Number(prev);
  if (d === 0) return <span>± 0 {suffix}</span>;
  const up = d > 0;
  return (
    <span className={up ? 'text-viz-pos' : 'text-viz-neg'}>
      {up ? '▲' : '▼'} {up ? '+' : '−'}
      {fmt(Math.abs(d))} {suffix}
    </span>
  );
}

export function Section({ title, note, right, children, className = '' }) {
  return (
    <section className={`mt-4 rounded-lg border border-rule bg-white p-4 ${className}`}>
      {title || right ? (
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title ? <h2 className="text-base font-bold text-ink">{title}</h2> : null}
            {note ? <p className="mt-0.5 text-xs leading-[1.125rem] text-graphite">{note}</p> : null}
          </div>
          {right ? <div className="flex items-center gap-2">{right}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Tabs({ tabs, active, onChange, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[0.8125rem]';
  return (
    <div className="mt-4 flex flex-wrap gap-2" role="tablist">
      {tabs.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`rounded-md border ${pad} transition-colors ${
              on ? 'border-siegel bg-siegel text-white' : 'border-rule bg-white text-graphite hover:border-siegel hover:text-siegel-deep'
            }`}
          >
            {t.label}
            {typeof t.count === 'number' ? <span className="ml-1.5 opacity-80">({t.count})</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/** A chip row for a filter dimension (range, level…). Same look as Tabs, smaller. */
export function ChipRow({ label, options, value, onChange, disabled = false, hint }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={label}>
      {label ? <span className="mr-1 text-xs font-semibold text-graphite">{label}</span> : null}
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            onClick={() => onChange(o.id)}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              on ? 'border-siegel bg-siegel text-white' : 'border-rule bg-white text-graphite hover:border-siegel hover:text-siegel-deep'
            }`}
          >
            {o.label}
          </button>
        );
      })}
      {hint ? <span className="ml-1 text-[0.6875rem] text-graphite">{hint}</span> : null}
    </div>
  );
}

export function Row({ title, sub, right, to, onClick, tone }) {
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">{title}</div>
        {sub ? <div className="mt-0.5 text-xs leading-[1.0625rem] text-graphite">{sub}</div> : null}
      </div>
      {right ? <div className={`shrink-0 text-[0.8125rem] font-semibold ${TONE_TEXT[tone] ?? 'text-siegel-deep'}`}>{right}</div> : null}
    </>
  );
  const cls = 'flex items-center gap-3 border-t border-rule py-3 text-left w-full';
  if (to) {
    return (
      <Link to={to} className={`${cls} hover:bg-siegel-wash/60`}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} hover:bg-siegel-wash/60`}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

/**
 * The state this panel exists to make expressible: "we do not measure this"
 * is not an error and not a zero. `unblock` is required in practice — a gap
 * with a next action is a backlog item; a gap without one is an excuse.
 */
export function NotInstrumented({ label, reason, unblock }) {
  return (
    <div className="mt-3 rounded-lg border border-dashed border-rule bg-paper-sunk/60 p-4">
      <div className="text-[0.8125rem] font-bold text-graphite">{label} — nicht instrumentiert</div>
      <div className="mt-1.5 text-xs leading-[1.125rem] text-graphite">{reason}</div>
      {unblock ? <div className="mt-2 text-xs font-semibold text-ink">Nächster Schritt: {unblock}</div> : null}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="py-3 text-[0.8125rem] text-graphite">{children}</p>;
}

export function Footnote({ children }) {
  return <p className="mt-3 text-xs leading-[1.125rem] text-graphite">{children}</p>;
}

export function ErrorLine({ children }) {
  return (
    <p role="alert" className="my-3 rounded-md border border-viz-error/30 bg-viz-error/5 px-3 py-2 text-[0.8125rem] text-viz-error">
      {children}
    </p>
  );
}

export function Spinner({ label = 'Wird geladen…' }) {
  return (
    <div className="my-6 flex items-center gap-2 text-sm text-graphite" role="status">
      <Loader2 className="h-4 w-4 animate-spin text-siegel" aria-hidden="true" />
      {label}
    </div>
  );
}

const BADGE = {
  ok: 'bg-viz-pos/10 text-viz-pos',
  warn: 'bg-viz-warn/15 text-viz-warn',
  bad: 'bg-viz-neg/10 text-viz-neg',
  error: 'bg-viz-error/10 text-viz-error',
  muted: 'bg-ink/5 text-graphite',
  info: 'bg-siegel-wash text-siegel-deep',
};

export function Badge({ label, tone = 'muted', className = '' }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[0.6875rem] font-bold ${BADGE[tone] ?? BADGE.muted} ${className}`}>{label}</span>
  );
}

/** The one button, in the panel's two sizes. */
export function PrimaryButton({ children, ...rest }) {
  return (
    <Button size="sm" {...rest}>
      {children}
    </Button>
  );
}
export function SecondaryButton({ children, ...rest }) {
  return (
    <Button variant="secondary" size="sm" {...rest}>
      {children}
    </Button>
  );
}

// --- form primitives ---------------------------------------------------------

export function Field({ label, hint, error, children, required }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink">
        {label}
        {required ? <span className="text-viz-error"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[0.6875rem] text-graphite">{hint}</span> : null}
      {error ? <span className="mt-1 block text-[0.6875rem] text-viz-error">{error}</span> : null}
    </label>
  );
}

const INPUT =
  'w-full rounded-md border border-rule bg-white px-3 py-2 text-[0.8125rem] text-ink placeholder:text-graphite/70 focus:border-siegel focus:outline-none';

export function Input(props) {
  return <input {...props} className={`${INPUT} ${props.className ?? ''}`} />;
}
export function Textarea(props) {
  return <textarea {...props} className={`${INPUT} min-h-[5rem] ${props.className ?? ''}`} />;
}
export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${INPUT} ${props.className ?? ''}`}>
      {children}
    </select>
  );
}

// --- table ------------------------------------------------------------------

/**
 * A semantic table. `columns`: [{ key, label, align, render }]. Rows must
 * carry a stable `id`. Tabular figures so a column can be scanned vertically.
 */
export function DataTable({ columns, rows, emptyText = 'Keine Einträge.', onRowClick, rowTo, dense = false }) {
  if (!rows || rows.length === 0) return <Empty>{emptyText}</Empty>;
  const py = dense ? 'py-1.5' : 'py-2.5';
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[40rem] border-collapse text-[0.8125rem]">
        <thead>
          <tr className="border-b border-rule text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`${py} pr-3 font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite ${c.align === 'right' ? 'text-right' : ''}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const cells = columns.map((c) => (
              <td key={c.key} className={`${py} pr-3 align-top tabular-nums ${c.align === 'right' ? 'text-right' : ''} ${c.className ?? ''}`}>
                {c.render ? c.render(r) : r[c.key] ?? '—'}
              </td>
            ));
            const cls = `border-b border-rule/70 ${onRowClick || rowTo ? 'cursor-pointer hover:bg-siegel-wash/50' : ''}`;
            if (rowTo) {
              return (
                <tr key={r.id} className={cls}>
                  {columns.map((c, i) => (
                    <td key={c.key} className={`${py} pr-3 align-top tabular-nums ${c.align === 'right' ? 'text-right' : ''}`}>
                      {i === 0 ? (
                        <Link to={rowTo(r)} className="block text-inherit hover:text-siegel-deep">
                          {c.render ? c.render(r) : r[c.key] ?? '—'}
                        </Link>
                      ) : c.render ? (
                        c.render(r)
                      ) : (
                        r[c.key] ?? '—'
                      )}
                    </td>
                  ))}
                </tr>
              );
            }
            return (
              <tr key={r.id} className={cls} onClick={onRowClick ? () => onRowClick(r) : undefined}>
                {cells}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Pager: exact total, page size, honest about an inexact total. */
export function Pager({ page, pageSize, total, totalIsExact = true, onPage }) {
  const pages = Math.max(1, Math.ceil((total || 0) / pageSize));
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-graphite">
      <span>
        {total === null || total === undefined ? '—' : `${new Intl.NumberFormat('de-DE').format(total)}${totalIsExact ? '' : ' (geschätzt)'}`} Treffer · Seite {page} von {pages}
      </span>
      <span className="flex gap-2">
        <SecondaryButton disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Zurück
        </SecondaryButton>
        <SecondaryButton disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Weiter
        </SecondaryButton>
      </span>
    </div>
  );
}

/** Key/value list for a detail panel. `items`: [[label, value]]. */
export function KeyValues({ items }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[0.8125rem]">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-graphite">{k}</dt>
          <dd className="min-w-0 break-words text-ink">{v === null || v === undefined || v === '' ? '—' : v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Collapsible diagnostics block: what the SERVER actually applied. */
export function Diagnostics({ data }) {
  if (!data) return null;
  return (
    <details className="mt-4 text-xs text-graphite">
      <summary className="cursor-pointer select-none font-semibold">Diagnose anzeigen</summary>
      <pre className="mt-2 overflow-x-auto rounded-md border border-rule bg-paper-sunk p-3 font-data text-[0.6875rem] leading-4 text-ink">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

/** Reason prompt used by every sensitive action. */
export function ReasonField({ value, onChange, required = true }) {
  return (
    <Field label="Begründung" required={required} hint="Wird im Prüfprotokoll gespeichert.">
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Warum wird das getan?" />
    </Field>
  );
}
