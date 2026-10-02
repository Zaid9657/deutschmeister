// Guard: the client's trial fallback grants exactly TRIAL_DAYS.
//
// Every surface that sells the trial says "${TRIAL_DAYS} days", derived from
// src/data/marketing.js (tests/claims.test.mjs bans the retyped digit). The
// client that GRANTS a trial when the server did not is startFreeTrial() in
// src/services/subscriptionService.js, called from SubscriptionContext.jsx
// when a signed-in user has no profile, or a profile with no trial dates. It
// typed its own `+ 7`, so a change to TRIAL_DAYS would have moved every claim
// and left this grant behind, and nothing would have failed.
//
// Trial length is an owner decision (a money path), so this file does not
// change the grant. It pins it: both of its branches (update an existing
// profile, insert a missing one) are run as-is under node:vm against a fake
// Supabase client, and the window they write must be TRIAL_DAYS calendar days.
// If the owner changes TRIAL_DAYS, this fails until the fallback agrees.
//
// Context, measured 2026-10-02 06:15 UTC: the fallback is inert today. 1,697
// of 1,697 profiles carry trial dates, and 150 of 150 profiles created in the
// last 30 days have a window of exactly 7 days, granted by the database
// trigger set_trial_dates_on_profile_insert() (INTERVAL '7 days'). That
// trigger is the third copy of the length; its body is not in the repository,
// so it cannot be pinned here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

import { TRIAL_DAYS } from '../src/data/marketing.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const SERVICE = 'src/services/subscriptionService.js';

/**
 * The source of `export const <name> = <arrow function>` up to its matching
 * closing brace. Strings and comments are skipped while counting braces.
 */
function extractArrow(src, name) {
  const head = src.indexOf(`export const ${name} =`);
  assert.ok(head >= 0, `${SERVICE} no longer exports ${name} — update this test to the new grant path`);
  const start = src.indexOf('async', head);
  const open = src.indexOf('{', src.indexOf('=>', start));
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (c === "'" || c === '"' || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++;
      continue;
    }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error(`could not find the end of ${name} in ${SERVICE}`);
}

/** A Supabase client that records every write and answers like PostgREST. */
function fakeSupabase({ profileExists }) {
  const writes = [];
  const from = (table) => ({
    update(row) {
      writes.push({ table, op: 'update', row });
      return { eq: () => ({ select: async () => ({ data: profileExists ? [row] : [], error: null }) }) };
    },
    insert(row) {
      writes.push({ table, op: 'insert', row });
      return { select: async () => ({ data: [row], error: null }) };
    },
  });
  return { client: { from }, writes };
}

/** startFreeTrial exactly as shipped, bound to a fake client. */
function loadStartFreeTrial(client) {
  const fn = vm.runInNewContext(`(${extractArrow(read(SERVICE), 'startFreeTrial')})`, {
    supabase: client,
    // A derived fallback (`+ TRIAL_DAYS`) resolves to the same constant.
    TRIAL_DAYS,
    console: { error() {}, warn() {}, log() {} },
  });
  assert.equal(typeof fn, 'function', 'startFreeTrial did not evaluate to a function');
  return fn;
}

const HOUR = 3600 * 1000;

function assertTrialWindow(row, path) {
  assert.ok(row.trial_started_at && row.trial_ends_at, `${path}: the fallback wrote no trial window`);
  // TRIAL_DAYS × 24 h, ±1 h for a DST change, so calendar-day and millisecond
  // arithmetic both pass in any local time zone (not only UTC CI).
  const hours = (Date.parse(row.trial_ends_at) - Date.parse(row.trial_started_at)) / HOUR;
  assert.ok(
    Math.abs(hours - TRIAL_DAYS * 24) <= 1,
    `${path}: the client trial fallback grants ${hours} h, not TRIAL_DAYS (${TRIAL_DAYS}) days as in ` +
      `src/data/marketing.js, which every surface advertises. Derive the fallback from TRIAL_DAYS (owner decision: trial length is a money path).`,
  );
}

test('the client trial fallback grants TRIAL_DAYS when it updates an existing profile', async () => {
  const { client, writes } = fakeSupabase({ profileExists: true });
  await loadStartFreeTrial(client)('user-1');
  assert.equal(writes.length, 1, `expected one write, got ${writes.map((w) => w.op).join(', ')}`);
  assert.deepEqual([writes[0].table, writes[0].op], ['profiles', 'update']);
  assertTrialWindow(writes[0].row, 'update path');
});

test('the client trial fallback grants TRIAL_DAYS when it inserts a missing profile', async () => {
  const { client, writes } = fakeSupabase({ profileExists: false });
  await loadStartFreeTrial(client)('user-1');
  const insert = writes.find((w) => w.op === 'insert');
  assert.ok(insert, 'with no profile to update, the fallback no longer inserts one');
  assert.equal(insert.table, 'profiles');
  assertTrialWindow(insert.row, 'insert path');
});

test('startFreeTrial is the only client code that writes a trial end', () => {
  // A second client writer would carry its own length past this guard. The
  // server-side admin "extend trial" action (netlify/functions) is out of scope:
  // it sets an end the admin chooses, not the advertised trial.
  const writers = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (/\.(jsx?|mjs|astro)$/.test(entry.name)) {
        const code = read(rel).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
        if (/\btrial_ends_at\s*:/.test(code)) writers.push(rel);
      }
    }
  };
  ['src', 'astro-site/src'].forEach(walk);
  assert.deepEqual(writers, [SERVICE], `client code that writes trial_ends_at:\n  ${writers.join('\n  ')}`);
});
