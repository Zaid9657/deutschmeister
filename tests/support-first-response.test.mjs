// Guard: "a failed send is not an answer" (#168, 2026-09-30).
//
// support_tickets.first_response_at is what the SLA state, the sentinel's
// support check and the support area's score (share of tickets answered within
// 24 h) are read from. Until 2026-09-30 the admin reply path set it, and moved
// the ticket to waiting_user, even when Resend refused the mail, so a ticket
// whose customer never received anything counted as answered on time. #168 made
// sendTicketReply the one send path and put the write behind the successful
// send. This file pins that rule:
//
//   1. Structural: across src/** and netlify/functions/**, the ONLY code that
//      writes first_response_at is sendTicketReply in
//      netlify/functions/_shared/adminSupportLib.mjs. A "write" is any object
//      literal key with that name (plain, quoted, shorthand, or computed from a
//      constant), any assignment to `.first_response_at`, and any supabase-js
//      insert/update/upsert row the chain scanner resolves to the column.
//      Reads are fine: select lists, filters, `t.first_response_at`,
//      destructuring, comments.
//   2. Structural: inside sendTicketReply every such write sits on the branch
//      where the result of `await deliverReplyEmail(...)` is `.ok`.
//   3. Behavioural: sendTicketReply, driven with a recording database and a
//      sender that fails (Resend 500, Resend unreachable, no API key), on a
//      human reply and on an AI-draft claim, issues no write that carries
//      first_response_at at all, not even null. The same stub sees the write
//      on a successful send (the positive control), so the check is not empty.
//
// When this fails:
//   - You added a write somewhere else: route the answer through
//     sendTicketReply, or take it to the owner. first_response_at is a
//     measurement, and the area scored on it does not get a second writer.
//   - An object that only reshapes a READ (a response payload) uses the column
//     name as a key: rename the key. The scanner cannot follow where an object
//     goes, so it counts every such key as a write.
//   - You refactored sendTicketReply: keep the write inside an
//     `if (sent.ok)` / `sent.ok && … ? { … } : {}` branch.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseSource, listSourceFiles, scanFiles } from './helpers/supabaseQueries.mjs';
import { sendTicketReply, AI_DRAFT_MARKER } from '../netlify/functions/_shared/adminSupportLib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COLUMN = 'first_response_at';
const OWNER_FILE = 'netlify/functions/_shared/adminSupportLib.mjs';
const OWNER_FN = 'sendTicketReply';
const SEND_FN = 'deliverReplyEmail';
const ROOTS = ['src', 'netlify/functions'];

// ─── the scanner ─────────────────────────────────────────────────────────────

const FUNCTION_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

function index(ast) {
  const parents = new Map();
  const nodes = [];
  const visit = (node, parent) => {
    if (!node || typeof node.type !== 'string') return;
    parents.set(node, parent);
    nodes.push(node);
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'range') continue;
      const child = node[key];
      if (Array.isArray(child)) child.forEach((c) => visit(c, node));
      else if (child && typeof child.type === 'string') visit(child, node);
    }
  };
  visit(ast, null);
  return { parents, nodes };
}

/** A string literal or an expression-free template literal, else null. */
function literalString(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis.map((q) => q.value.cooked).join('');
  return null;
}

/** Does this key (of a Property or a MemberExpression) name the column? */
function namesColumn(key, computed, columnConsts) {
  if (!computed && key.type === 'Identifier') return key.name === COLUMN;
  const s = literalString(key);
  if (s !== null) return s === COLUMN;
  return computed && key.type === 'Identifier' && columnConsts.has(key.name);
}

function functionName(fn, parents) {
  if (fn.id?.name) return fn.id.name;
  const p = parents.get(fn);
  if (p?.type === 'VariableDeclarator' && p.id.type === 'Identifier') return p.id.name;
  if ((p?.type === 'Property' || p?.type === 'MethodDefinition') && !p.computed) return p.key.name ?? p.key.value;
  // `export const handler = adminEndpoint(opts, async (...) => { ... })`
  const pp = p?.type === 'CallExpression' ? parents.get(p) : null;
  if (pp?.type === 'VariableDeclarator' && pp.id.type === 'Identifier') return pp.id.name;
  return null;
}

const conjuncts = (t) => (t.type === 'LogicalExpression' && t.operator === '&&' ? [...conjuncts(t.left), ...conjuncts(t.right)] : [t]);
const isOkOf = (c, name) => c.type === 'MemberExpression' && !c.computed && c.object.type === 'Identifier' && c.object.name === name && c.property.name === 'ok';

/** True when `site` is only reached on a branch whose condition includes `<name>.ok`. */
function onSuccessBranch(site, fnNode, parents, name) {
  let child = site;
  for (let n = parents.get(site); n && n !== fnNode; child = n, n = parents.get(n)) {
    let cond = null;
    if ((n.type === 'ConditionalExpression' || n.type === 'IfStatement') && n.consequent === child) cond = n.test;
    if (n.type === 'LogicalExpression' && n.operator === '&&' && n.right === child) cond = n.left;
    if (cond && conjuncts(cond).some((c) => isOkOf(c, name))) return true;
  }
  return false;
}

/**
 * Every place a module writes the column. For a write inside sendTicketReply,
 * `inOwner` is true and `onSuccess` says whether it sits on the `.ok` branch of
 * the one `const <x> = await deliverReplyEmail(...)` in that function.
 */
function analyse(source, file = '<source>') {
  if (!source.includes(COLUMN)) return { sites: [], sendResult: null, ownerFn: null };
  const ast = parseSource(source, file);
  const { parents, nodes } = index(ast);

  const columnConsts = new Set(nodes
    .filter((n) => n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && literalString(n.init) === COLUMN)
    .map((n) => n.id.name));

  const ownerFn = nodes.find((n) => n.type === 'FunctionDeclaration' && n.id?.name === OWNER_FN
    && parents.get(n)?.type === 'ExportNamedDeclaration') || null;

  let sendResult = null;
  if (ownerFn) {
    const decls = nodes.filter((n) => n.type === 'VariableDeclarator' && n.start >= ownerFn.start && n.end <= ownerFn.end
      && n.init?.type === 'AwaitExpression' && n.init.argument.type === 'CallExpression'
      && n.init.argument.callee.type === 'Identifier' && n.init.argument.callee.name === SEND_FN);
    if (decls.length === 1 && decls[0].id.type === 'Identifier' && parents.get(decls[0]).kind === 'const') sendResult = decls[0].id.name;
  }

  const sites = [];
  for (const n of nodes) {
    let kind = null;
    if (n.type === 'Property' && parents.get(n)?.type === 'ObjectExpression' && namesColumn(n.key, n.computed, columnConsts)) {
      kind = n.shorthand ? 'shorthand key' : 'object key';
    } else if (n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression' && namesColumn(n.left.property, n.left.computed, columnConsts)) {
      kind = 'assignment';
    }
    if (!kind) continue;
    const fns = [];
    for (let p = parents.get(n); p; p = parents.get(p)) if (FUNCTION_TYPES.has(p.type)) fns.push(p);
    const named = fns.map((f) => functionName(f, parents)).find(Boolean) || '<module>';
    const inOwner = Boolean(ownerFn) && fns.includes(ownerFn);
    sites.push({
      file, line: n.loc.start.line, kind, fn: named, inOwner,
      onSuccess: inOwner && sendResult !== null ? onSuccessBranch(n, ownerFn, parents, sendResult) : false,
    });
  }
  return { sites, sendResult, ownerFn: ownerFn && { start: ownerFn.loc.start.line, end: ownerFn.loc.end.line } };
}

const fmt = (s) => `${s.file}:${s.line} (${s.kind} in ${s.fn})`;

const scanRepo = () => {
  const files = listSourceFiles(ROOTS, ROOT)
    .map((abs) => ({ abs, rel: path.relative(ROOT, abs).split(path.sep).join('/'), src: readFileSync(abs, 'utf8') }))
    .filter((f) => f.src.includes(COLUMN));
  return { files, analysed: files.map((f) => analyse(f.src, f.rel)) };
};

// ─── 0. the scanner itself: reads pass, every write form is caught ──────────

test('scanner calibration: reads are not writes; every write form is caught', () => {
  const reads = [
    "db.from('support_tickets').select('id, first_response_at, sla_due_at')",
    "db.from('support_tickets').select('*').is('first_response_at', null).order('first_response_at')",
    "const answered = t.first_response_at ? hm(t.first_response_at) : 'noch keine';",
    'const { first_response_at } = ticket; use(first_response_at);',
    'const { first_response_at: at } = ticket; use(at);',
    '// a failed send used to set first_response_at\n/* first_response_at = now */\nconst x = 1;',
  ];
  for (const src of reads) assert.deepEqual(analyse(src).sites, [], `read flagged as a write: ${src}`);

  const writes = [
    ["db.from('support_tickets').update({ first_response_at: now })", 'object key'],
    ["db.from('support_tickets').update({ 'first_response_at': now })", 'object key'],
    ["const COL = 'first_response_at'; db.from('support_tickets').update({ [COL]: now })", 'object key'],
    ['const first_response_at = now; patchTicket(db, id, { first_response_at });', 'shorthand key'],
    ['ticket.first_response_at = now;', 'assignment'],
    ["patch['first_response_at'] = now;", 'assignment'],
    ['const patch = {}; patch.first_response_at ??= now;', 'assignment'],
  ];
  for (const [src, kind] of writes) assert.deepEqual(analyse(src).sites.map((s) => s.kind), [kind], src);
});

test('scanner calibration: only a write on the `.ok` branch of the send result counts as guarded', () => {
  const fn = (body) => `export async function sendTicketReply({ db, ticket, now }) {
    const nowIso = now.toISOString();
    const sent = await deliverReplyEmail(fetch, {}, {});
    ${body}
  }`;
  const guarded = [
    'const p = { last_activity_at: nowIso, ...(sent.ok && !ticket.first_response_at ? { first_response_at: nowIso } : {}) };',
    'const p = { ...(sent.ok ? { first_response_at: nowIso } : {}) };',
    'const p = {}; if (sent.ok) { p.first_response_at = nowIso; }',
    'const p = {}; if (!ticket.first_response_at && sent.ok) p.first_response_at = nowIso;',
    'const p = { ...(sent.ok && { first_response_at: nowIso }) };',
  ];
  for (const body of guarded) {
    const { sites, sendResult } = analyse(fn(body));
    assert.equal(sendResult, 'sent');
    assert.equal(sites.length, 1, body);
    assert.equal(sites[0].inOwner, true, body);
    assert.equal(sites[0].onSuccess, true, `should count as guarded: ${body}`);
  }
  const unguarded = [
    'const p = { ...(!ticket.first_response_at ? { first_response_at: nowIso } : {}) };',
    'const p = { first_response_at: nowIso };',
    'const p = { ...(sent.ok ? {} : { first_response_at: nowIso }) };',
    'const p = { ...(!sent.ok && !ticket.first_response_at ? { first_response_at: nowIso } : {}) };',
    'const p = { ...(sent.ok || ticket.retry ? { first_response_at: nowIso } : {}) };',
    'const p = {}; if (sent) p.first_response_at = nowIso;',
    'const p = {}; if (sent.ok) {} else { p.first_response_at = nowIso; }',
  ];
  for (const body of unguarded) {
    const { sites } = analyse(fn(body));
    assert.equal(sites.length, 1, body);
    assert.equal(sites[0].onSuccess, false, `should count as UNguarded: ${body}`);
  }
  // A `let` send result can be reassigned, so it guards nothing.
  assert.equal(analyse(fn('const p = { first_response_at: 1 };').replace('const sent', 'let sent')).sendResult, null);
});

// ─── 1. one writer ───────────────────────────────────────────────────────────

test(`only ${OWNER_FN} writes ${COLUMN} (src/**, netlify/functions/**)`, () => {
  const { files, analysed } = scanRepo();
  assert.ok(files.some((f) => f.rel === OWNER_FILE), `${OWNER_FILE} no longer mentions ${COLUMN}`);
  const sites = analysed.flatMap((a) => a.sites);
  const strays = sites.filter((s) => !(s.file === OWNER_FILE && s.inOwner));
  assert.deepEqual(strays.map(fmt), [], `a second writer of ${COLUMN}: only ${OWNER_FN} in ${OWNER_FILE} may set it (a failed send is not an answer)`);
  const own = sites.filter((s) => s.file === OWNER_FILE && s.inOwner);
  assert.ok(own.length >= 1, `positive control: the scanner no longer sees the write inside ${OWNER_FN}; fix the scanner before trusting a green run`);
});

test(`the supabase-js chains agree: the one row write naming ${COLUMN} is support_tickets, inside ${OWNER_FN}`, () => {
  const { files, analysed } = scanRepo();
  const { refs } = scanFiles(files.map((f) => f.abs), ROOT);
  const rowWrites = refs.filter((r) => r.column === COLUMN && ['insert', 'update', 'upsert', 'onConflict'].includes(r.method));
  const span = analysed.find((_, i) => files[i].rel === OWNER_FILE)?.ownerFn;
  assert.ok(span, `${OWNER_FN} is no longer an exported function in ${OWNER_FILE}`);
  const outside = rowWrites.filter((r) => !(r.file === OWNER_FILE && r.table === 'support_tickets' && r.line >= span.start && r.line <= span.end));
  assert.deepEqual(outside.map((r) => `${r.file}:${r.line} ${r.table}.${r.method}`), []);
  // No positive control here on purpose: the chain scanner cannot see a key
  // added by assignment (`if (sent.ok) patch.first_response_at = …`), which is
  // a correct form. The test above carries the positive control.
});

// ─── 2. only on a successful send ────────────────────────────────────────────

test(`inside ${OWNER_FN}, ${COLUMN} is written only on the successful-send branch`, () => {
  const { sites, sendResult } = analyse(readFileSync(path.join(ROOT, OWNER_FILE), 'utf8'), OWNER_FILE);
  assert.ok(sendResult, `${OWNER_FN} must hold the result of \`await ${SEND_FN}(...)\` in one const; the guard reads its .ok`);
  const own = sites.filter((s) => s.inOwner);
  assert.ok(own.length >= 1);
  for (const s of own) {
    assert.equal(s.onSuccess, true, `${fmt(s)} is reachable when the send failed: put it behind \`${sendResult}.ok\` (a failed send is not an answer)`);
  }
});

// ─── 3. behaviour: a failing sender issues no first_response_at write ───────

const NOW = new Date('2026-10-01T12:00:00Z');

/** supabase-js stand-in for the chains sendTicketReply uses; records every write as issued. */
function recordingDb(seed) {
  const tables = structuredClone(seed);
  const writes = [];
  let seq = 0;
  const from = (table) => {
    let op = 'select';
    let payload = null;
    let single = false;
    const filters = [];
    const run = () => {
      const rows = (tables[table] ||= []);
      if (op === 'insert' || op === 'upsert') {
        const list = [].concat(structuredClone(payload));
        writes.push({ table, op, rows: list });
        const inserted = list.map((r) => {
          const row = { id: `${table}-${++seq}`, delivery_status: null, delivery_error: null, ...structuredClone(r) };
          rows.push(row);
          return { ...row };
        });
        return { data: single ? inserted[0] ?? null : inserted, error: null };
      }
      const hit = rows.filter((r) => filters.every((f) => f(r)));
      if (op === 'update') {
        writes.push({ table, op, rows: [structuredClone(payload)] });
        hit.forEach((r) => Object.assign(r, structuredClone(payload)));
      }
      const data = hit.map((r) => ({ ...r }));
      return { data: single ? data[0] ?? null : data, error: null };
    };
    const q = {
      select: () => q,
      insert: (p) => { op = 'insert'; payload = p; return q; },
      upsert: (p) => { op = 'upsert'; payload = p; return q; },
      update: (p) => { op = 'update'; payload = p; return q; },
      eq: (k, v) => { filters.push((r) => r[k] === v); return q; },
      maybeSingle: () => { single = true; return q; },
      then: (res, rej) => Promise.resolve().then(run).then(res, rej),
    };
    return q;
  };
  return { from, tables, writes };
}

const carrying = (db) => db.writes.filter((w) => w.rows.some((r) => r && Object.hasOwn(r, COLUMN)));

function seed({ status = 'new', firstResponseAt = null } = {}) {
  return {
    support_tickets: [{
      id: 'tkt-1', reference: 'DM-TKT00001', status, priority: 'normal', subject: 'Frage', user_email: 'learner@example.test',
      first_response_at: firstResponseAt, last_activity_at: '2026-10-01T10:00:00.000Z',
    }],
    support_ticket_messages: [
      { id: 'msg-u1', ticket_id: 'tkt-1', author_type: 'user', visibility: 'public', body: 'Frage?', delivery_status: null, delivery_error: null },
      { id: 'draft-1', ticket_id: 'tkt-1', author_type: 'system', author_id: null, visibility: 'internal', delivery_status: 'queued', delivery_error: null, body: `${AI_DRAFT_MARKER} sendet 12:00 UTC\nGuten Tag` },
    ],
  };
}

function sender(kind) {
  const calls = [];
  const impls = {
    ok: async () => ({ ok: true, status: 200, text: async () => '{"id":"m"}' }),
    http500: async () => ({ ok: false, status: 500, text: async () => 'upstream down' }),
    unreachable: async () => { throw new Error('ECONNRESET'); },
    nokey: async () => { throw new Error('fetch must not be called without RESEND_API_KEY'); },
  };
  const fetchImpl = async (url, opts) => { calls.push(url); return impls[kind](url, opts); };
  return { fetchImpl, calls, env: kind === 'nokey' ? {} : { RESEND_API_KEY: 'test-key' } };
}

const PATHS = {
  'human reply on a new ticket': { ticket: { status: 'new' }, args: { authorType: 'admin', authorId: 'staff-1' } },
  'human reply on an open ticket': { ticket: { status: 'open' }, args: { authorType: 'admin', authorId: 'staff-1' } },
  'AI draft claim': { ticket: { status: 'new' }, args: { authorType: 'system', draftId: 'draft-1' } },
};

test(`a failed send issues no write carrying ${COLUMN} (Resend 500, unreachable, no key × reply and draft paths)`, async () => {
  for (const failure of ['http500', 'unreachable', 'nokey']) {
    for (const [label, p] of Object.entries(PATHS)) {
      const db = recordingDb(seed(p.ticket));
      const s = sender(failure);
      const res = await sendTicketReply({ db, fetchImpl: s.fetchImpl, env: s.env, ticket: { ...db.tables.support_tickets[0] }, body: 'Guten Tag', now: NOW, ...p.args });
      const where = `${failure} / ${label}`;
      assert.equal(res.claimed, true, `${where}: the message was claimed, so the send was attempted`);
      assert.equal(res.delivered, false, where);
      assert.equal(s.calls.length, failure === 'nokey' ? 0 : 1, `${where}: Resend calls`);
      assert.ok(db.writes.some((w) => w.table === 'support_ticket_messages' && w.op === 'update' && w.rows[0].delivery_status === 'failed'), `${where}: the row is recorded as failed`);
      assert.ok(db.writes.some((w) => w.table === 'support_tickets' && w.op === 'update'), `${where}: the ticket update still ran (last_activity_at), so the check below is not empty`);
      assert.deepEqual(carrying(db), [], `${where}: a failed send wrote ${COLUMN}`);
      assert.equal(db.tables.support_tickets[0].first_response_at, null, where);
      assert.equal(res.ticket.first_response_at, null, where);
    }
  }
});

test(`positive control: a successful send writes ${COLUMN} exactly once, on the ticket; an answered ticket keeps its time`, async () => {
  for (const [label, p] of Object.entries(PATHS)) {
    const db = recordingDb(seed(p.ticket));
    const s = sender('ok');
    const res = await sendTicketReply({ db, fetchImpl: s.fetchImpl, env: s.env, ticket: { ...db.tables.support_tickets[0] }, body: 'Guten Tag', now: NOW, ...p.args });
    assert.equal(res.delivered, true, label);
    const w = carrying(db);
    assert.equal(w.length, 1, `${label}: ${JSON.stringify(db.writes)}`);
    assert.equal(w[0].table, 'support_tickets');
    assert.equal(w[0].op, 'update');
    assert.equal(w[0].rows[0][COLUMN], NOW.toISOString());
    assert.equal(db.tables.support_tickets[0].first_response_at, NOW.toISOString());
  }
  const answered = '2026-09-30T08:00:00.000Z';
  const db = recordingDb(seed({ status: 'waiting_user', firstResponseAt: answered }));
  const s = sender('ok');
  await sendTicketReply({ db, fetchImpl: s.fetchImpl, env: s.env, ticket: { ...db.tables.support_tickets[0] }, body: 'Noch etwas', now: NOW, authorType: 'admin' });
  assert.deepEqual(carrying(db), [], 'a later reply never moves the first response time');
  assert.equal(db.tables.support_tickets[0].first_response_at, answered);
});
