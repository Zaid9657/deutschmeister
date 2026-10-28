#!/usr/bin/env node
// Controller backlog c6, move 2: Lemon Squeezy fee figures for the Monday packet.
// expected_effect: LS fee known per sale, so contribution is computable.
//
// READ-ONLY. Lemon Squeezy is read-only for agents (CLAUDE.md): this script sends
// GET requests to /v1/orders and /v1/subscription-invoices only, writes no file
// and no database row, and prints AGGREGATES ONLY to stdout. It never prints
// customer emails, names, ids, card data or raw payloads.
//
// Usage: LEMONSQUEEZY_API_KEY=… node scripts/ls-fees.mjs [--json]
//
// Verified 2026-10-28 against the live API: neither resource carries a fee
// attribute (orders have `setup_fee`, a product setup charge billed to the buyer,
// not the Lemon Squeezy processing fee). Such rows count as fee-missing and the
// output says "fee not exposed by the API"; never infer a fee from a tariff.
// If Lemon Squeezy later adds a numeric fee attribute in cents, FEE_FIELDS picks
// it up and the sums become known.
//
// Do not add the orders and subscription-invoices lines together: the first
// subscription payment appears both as an order and as an `initial` invoice.
import { pathToFileURL } from 'node:url';

const API = 'https://api.lemonsqueezy.com/v1';
export const RESOURCES = ['orders', 'subscription-invoices'];
export const WINDOWS = [7, 30];
// Statuses where money was collected (refunds are reported separately).
export const SETTLED_STATUSES = new Set(['paid', 'refunded', 'partial_refund']);
// Candidate fee attribute names (cents). `setup_fee` is deliberately absent.
export const FEE_FIELDS = ['fee', 'fees', 'processing_fee', 'platform_fee', 'lemonsqueezy_fee'];
const MAX_PAGES = 50;
const PAGE_SIZE = 100;
const TIMEOUT_MS = 20_000;

function cents(value) {
  return Number.isInteger(value) ? value : null;
}

export function feeOf(attributes) {
  for (const field of FEE_FIELDS) {
    if (Object.hasOwn(attributes || {}, field) && cents(attributes[field]) !== null) {
      return { exposed: true, cents: attributes[field] };
    }
  }
  return { exposed: false, cents: null };
}

function emptyBucket() {
  return { count: 0, gross: 0, tax: 0, refunds: 0, fees: 0, feeMissing: 0, amountMissing: 0 };
}

// rows: [{ resource: 'orders' | 'subscription-invoices', attributes }]
// Returns plain aggregates: windows[days][resource][currency] = bucket, amounts in cents.
export function aggregateLsMoney(rows, { now = new Date(), windows = WINDOWS } = {}) {
  const nowMs = now.getTime();
  const result = { asOf: now.toISOString(), feeExposed: false, excluded: { test: 0, status: 0, undated: 0 }, windows: {} };
  for (const days of windows) {
    result.windows[days] = Object.fromEntries(RESOURCES.map((resource) => [resource, {}]));
  }
  const oldest = Math.max(...windows);
  for (const { resource, attributes: a = {} } of rows) {
    if (!RESOURCES.includes(resource)) continue;
    const created = Date.parse(a.created_at);
    if (!Number.isFinite(created)) { result.excluded.undated += 1; continue; }
    const ageDays = (nowMs - created) / 86_400_000;
    if (ageDays < 0 || ageDays >= oldest) continue;
    if (a.test_mode !== false) { result.excluded.test += 1; continue; }
    if (!SETTLED_STATUSES.has(a.status)) { result.excluded.status += 1; continue; }
    const fee = feeOf(a);
    if (fee.exposed) result.feeExposed = true;
    const currency = typeof a.currency === 'string' && /^[A-Z]{3}$/.test(a.currency) ? a.currency : 'UNKNOWN';
    for (const days of windows) {
      if (ageDays >= days) continue;
      const byCurrency = result.windows[days][resource];
      const bucket = (byCurrency[currency] ||= emptyBucket());
      bucket.count += 1;
      const gross = cents(a.total);
      const tax = cents(a.tax);
      const refunded = cents(a.refunded_amount);
      if (gross === null || tax === null || refunded === null) bucket.amountMissing += 1;
      bucket.gross += gross ?? 0;
      bucket.tax += tax ?? 0;
      bucket.refunds += refunded ?? 0;
      if (fee.exposed) bucket.fees += fee.cents;
      else bucket.feeMissing += 1;
    }
  }
  return result;
}

function major(value) {
  return (value / 100).toFixed(2);
}

export function formatLines(summary) {
  const lines = [];
  for (const [days, byResource] of Object.entries(summary.windows)) {
    for (const [resource, byCurrency] of Object.entries(byResource)) {
      const currencies = Object.keys(byCurrency).sort();
      if (!currencies.length) {
        lines.push(`LS API ${days}d ${resource}: live 0.`);
        continue;
      }
      for (const currency of currencies) {
        const b = byCurrency[currency];
        const fees = b.feeMissing === 0
          ? `fees ${major(b.fees)}`
          : b.feeMissing === b.count && !summary.feeExposed
            ? `fees UNKNOWN (fee not exposed by the API; missing ${b.feeMissing}/${b.count})`
            : `fees ${major(b.fees)} known, UNKNOWN for ${b.feeMissing}/${b.count}`;
        const amounts = b.amountMissing ? `; amounts missing on ${b.amountMissing}` : '';
        lines.push(`LS API ${days}d [${currency}] ${resource}: live ${b.count}; gross ${major(b.gross)}; `
          + `tax ${major(b.tax)}; refunds ${major(b.refunds)}; ${fees}${amounts}.`);
      }
    }
  }
  const x = summary.excluded;
  lines.push(`Excluded within 30d: test ${x.test}; unsettled status ${x.status}; undated ${x.undated}. `
    + 'Orders and invoices overlap on first subscription payments: never add the two lines.');
  if (summary.incomplete) lines.push(`INCOMPLETE: ${summary.incomplete}`);
  return lines;
}

async function fetchAll(resource, key) {
  const rows = [];
  let url = `${API}/${resource}?page[size]=${PAGE_SIZE}`;
  for (let page = 1; url; page += 1) {
    if (page > MAX_PAGES) return { rows, incomplete: `${resource} stopped at ${MAX_PAGES} pages` };
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/vnd.api+json', Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`GET ${resource} page ${page} failed: HTTP ${response.status}`);
    const body = await response.json();
    for (const item of body.data || []) rows.push({ resource, attributes: item.attributes || {} });
    const next = body.links?.next;
    // Only follow pagination on the API host, so the bearer token never leaves it.
    url = typeof next === 'string' && next.startsWith(`${API}/`) ? next : null;
  }
  return { rows, incomplete: null };
}

async function main() {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) {
    console.error('LEMONSQUEEZY_API_KEY is not set; refusing to run (read-only LS fee report).');
    process.exit(2);
  }
  const rows = [];
  const incomplete = [];
  for (const resource of RESOURCES) {
    const result = await fetchAll(resource, key);
    rows.push(...result.rows);
    if (result.incomplete) incomplete.push(result.incomplete);
  }
  const summary = aggregateLsMoney(rows);
  if (incomplete.length) summary.incomplete = incomplete.join('; ');
  if (process.argv.includes('--json')) console.log(JSON.stringify(summary, null, 2));
  else console.log(formatLines(summary).join('\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`ls-fees: ${error.message}`);
    process.exit(1);
  });
}
