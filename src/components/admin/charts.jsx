// Admin panel charts — plain SVG, one series per chart, the viz palette
// (validated colourblind-safe), marks ≤ 24px with a 4px rounded data end,
// one axis anchored at 0, hairline gridlines, a per-mark tooltip, and a
// data-table toggle so every figure is readable without colour or hover.
import { useId, useState } from 'react';
import { num } from '../../lib/admin/adminFormat.js';

const W = 640;
const H = 180;
const PAD = { l: 44, r: 8, t: 12, b: 26 };

function niceMax(v) {
  if (!v || v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return m * p;
}

/**
 * Daily bars. `points`: [{ day, value }]. `format` renders a value for the
 * tooltip/table; `label` names the single series (so no legend box).
 */
export function DailyBars({ points, label, format = (v) => num(v), tone = 'series1' }) {
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState(null);
  const id = useId();
  if (!points || points.length === 0) return <p className="py-3 text-[0.8125rem] text-graphite">Keine Datenpunkte im Zeitraum.</p>;
  const max = niceMax(Math.max(...points.map((p) => p.value || 0)));
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const slot = innerW / points.length;
  const bw = Math.min(24, Math.max(2, slot - 2));
  const y = (v) => PAD.t + innerH - (v / max) * innerH;
  const ticks = [0, max / 2, max];
  const fill = tone === 'series2' ? '#E69F00' : tone === 'pos' ? '#009E73' : '#0072B2';
  const every = Math.max(1, Math.ceil(points.length / 8));
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-labelledby={`${id}-t`} onMouseLeave={() => setHover(null)}>
        <title id={`${id}-t`}>{label}</title>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#E2E7E5" strokeWidth="1" />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#5A6360">{format(t)}</text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = PAD.l + i * slot + (slot - bw) / 2;
          const h = Math.max(0, innerH - (y(p.value || 0) - PAD.t));
          const top = y(p.value || 0);
          const r = Math.min(4, bw / 2, h);
          const path = h <= 0 ? null : `M${x},${top + r} a${r},${r} 0 0 1 ${r},-${r} h${bw - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - r} h-${bw} z`;
          return (
            <g key={p.day} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${p.day}: ${format(p.value || 0)}`}>
              <rect x={PAD.l + i * slot} y={PAD.t} width={slot} height={innerH} fill="transparent" />
              {path ? <path d={path} fill={fill} opacity={hover === null || hover === i ? 1 : 0.55} /> : null}
              {i % every === 0 ? (
                <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#5A6360">{p.day.slice(5).split('-').reverse().join('.')}</text>
              ) : null}
            </g>
          );
        })}
        {hover !== null ? (
          <g pointerEvents="none">
            <rect x={Math.min(W - 150, PAD.l + hover * slot)} y={PAD.t} width="142" height="34" rx="4" fill="#14201D" />
            <text x={Math.min(W - 150, PAD.l + hover * slot) + 8} y={PAD.t + 14} fontSize="11" fill="#fff" fontWeight="700">{format(points[hover].value || 0)}</text>
            <text x={Math.min(W - 150, PAD.l + hover * slot) + 8} y={PAD.t + 27} fontSize="10" fill="#fff" opacity="0.8">{points[hover].day.split('-').reverse().join('.')} · {label}</text>
          </g>
        ) : null}
      </svg>
      <button type="button" className="mt-1 text-xs text-siegel-deep hover:underline" onClick={() => setTable((t) => !t)} aria-expanded={table}>
        {table ? 'Datentabelle ausblenden' : 'Datentabelle anzeigen'}
      </button>
      {table ? (
        <table className="mt-2 w-full text-xs">
          <thead><tr className="border-b border-rule text-left text-graphite"><th className="py-1 pr-3">Tag</th><th className="py-1 text-right">{label}</th></tr></thead>
          <tbody>{points.map((p) => <tr key={p.day} className="border-b border-rule/60"><td className="py-1 pr-3">{p.day.split('-').reverse().join('.')}</td><td className="py-1 text-right tabular-nums">{format(p.value || 0)}</td></tr>)}</tbody>
        </table>
      ) : null}
    </div>
  );
}

/** Ordered funnel: horizontal bars, each a strict subset of the one above; unavailable steps say why. */
export function FunnelBars({ steps }) {
  const max = Math.max(1, ...steps.map((s) => s.count || 0));
  return (
    <ol className="mt-2 space-y-1.5">
      {steps.map((s, i) => (
        <li key={s.step} className="grid grid-cols-[11rem_1fr_5rem] items-center gap-3 text-[0.8125rem]">
          <span className="truncate text-ink" title={s.definition || ''}>{i + 1}. {s.step}</span>
          {s.available === false ? (
            <span className="text-xs text-graphite">{s.reason}</span>
          ) : (
            <span className="block h-4 w-full rounded-sm bg-paper-sunk" aria-hidden="true">
              <span className="block h-4 rounded-sm bg-viz-series1" style={{ width: `${Math.max(0.5, ((s.count || 0) / max) * 100)}%` }} />
            </span>
          )}
          <span className="text-right tabular-nums text-ink">{s.available === false ? '—' : num(s.count)}</span>
        </li>
      ))}
    </ol>
  );
}

/** Retention cohort table: registration week × week 1–4 active share. Cells not yet elapsed are '·'. */
export function CohortTable({ cohorts }) {
  if (!cohorts || cohorts.length === 0) return <p className="py-3 text-[0.8125rem] text-graphite">Keine Kohorten.</p>;
  const pctOf = (a, r) => (r > 0 ? `${Math.round((a / r) * 100)} %` : '—');
  return (
    <table className="mt-2 w-full text-xs">
      <thead>
        <tr className="border-b border-rule text-left text-graphite">
          <th className="py-1 pr-3">Woche ab</th><th className="py-1 pr-3 text-right">Registriert</th>
          {[1, 2, 3, 4].map((k) => <th key={k} className="py-1 pr-3 text-right">W{k}</th>)}
        </tr>
      </thead>
      <tbody>
        {cohorts.map((c) => (
          <tr key={c.week} className="border-b border-rule/60">
            <td className="py-1 pr-3">{c.week.split('-').reverse().join('.')}</td>
            <td className="py-1 pr-3 text-right tabular-nums">{num(c.registered)}</td>
            {c.active.map((a, k) => (
              <td key={k} className="py-1 pr-3 text-right tabular-nums">{k < c.elapsedWeeks ? pctOf(a, c.registered) : '·'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
