// Admin panel formatters. Pure, German locale, and honest about absence:
//   null/undefined → '—'   (the query failed, or there is no data source)
//   0              → '0'   (zero is data; never replace a zero with a dash)
// Every formatter takes an already-scaled value; `pct` takes a FRACTION 0–1
// and `pct100` an already-scaled percentage — two functions because mixing
// them once produced a "4.130 %".

const LOCALE = 'de-DE';

const finite = (v) => v !== null && v !== undefined && Number.isFinite(Number(v));

export const num = (v, digits = 0) =>
  finite(v)
    ? new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(v))
    : '—';

/**
 * A ratio as a percentage. `null` here means the denominator was zero or
 * absent, and that is NOT 0 %. Precision follows the sample: none below 100
 * units — one decimal over eleven cases reads as false confidence.
 */
export const pct = (v, digits = 1, denominator = Infinity) =>
  finite(v) ? `${num(Number(v) * 100, denominator < 100 ? 0 : digits)} %` : '—';

export const pct100 = (v, digits = 1) => (finite(v) ? `${num(v, digits)} %` : '—');

/** Money from MINOR units (cents). Money is never a float anywhere in the panel. */
export const money = (minor, currency = 'EUR', withCents = true) =>
  finite(minor)
    ? new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency,
        minimumFractionDigits: withCents ? 2 : 0,
        maximumFractionDigits: withCents ? 2 : 0,
      }).format(Number(minor) / 100)
    : '—';

const parse = (iso) => {
  if (!iso) return null;
  const t = new Date(iso);
  return Number.isFinite(t.getTime()) ? t : null;
};

/** ISO → dd.mm.yyyy; missing or unparseable → '—', never "Invalid Date". */
export const dmy = (iso) => {
  const t = parse(iso);
  if (!t) return '—';
  const s = t.toISOString();
  return s.slice(0, 10).split('-').reverse().join('.');
};

/** ISO → dd.mm.yyyy hh:mm (UTC — the panel's one clock). */
export const hm = (iso) => {
  const t = parse(iso);
  if (!t) return '—';
  const s = t.toISOString();
  return `${dmy(s)} ${s.slice(11, 16)}`;
};

export const mmss = (seconds) => {
  if (!finite(seconds)) return '—';
  const s = Math.max(0, Math.round(Number(seconds)));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min`;
};

/** "vor 3 Min." for the freshness line. */
export const ago = (iso, now = Date.now()) => {
  const t = parse(iso);
  if (!t) return '—';
  const sec = Math.max(0, Math.round((now - t.getTime()) / 1000));
  if (sec < 60) return 'gerade eben';
  const min = Math.round(sec / 60);
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.round(min / 60);
  if (h < 48) return `vor ${h} Std.`;
  return `vor ${Math.round(h / 24)} Tagen`;
};

/** dd.mm.yyyy or dd.mm.yyyy hh:mm → ISO. Anything else → null. new Date('31.12.2026') is "Invalid Date". */
export function parseGermanDate(input) {
  if (!input) return null;
  const m = String(input).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!m) {
    const t = parse(input);
    return t ? t.toISOString() : null;
  }
  const [, d, mo, y, hh = '0', mi = '0'] = m;
  const t = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mi)));
  if (t.getUTCMonth() !== Number(mo) - 1 || t.getUTCDate() !== Number(d)) return null;
  return t.toISOString();
}

/** "24,99" / "1.234,50" / "24.99" → integer minor units. Anything unparseable → null. */
export function parseAmountToMinor(input) {
  if (input === null || input === undefined) return null;
  let s = String(input).trim().replace(/\s|€/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}
