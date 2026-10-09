// Row-level-security policy parsing shared by the RLS guard tests
// (tests/rls-update-check.test.mjs, tests/video-library-writes.test.mjs).
// It reads CREATE POLICY / DROP POLICY statements out of migration SQL
// (comments stripped), and judges UPDATE/ALL policies: a missing WITH CHECK,
// or one that drops an owner column its USING names, is a problem.

export function stripComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
}

const unquote = (s) => s.trim().replace(/^"|"$/g, '').replace(/""/g, '"');

/** The balanced (...) that starts at s[open]; returns [inner, indexAfter]. */
function balanced(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i += 1) {
    if (s[i] === '(') depth += 1;
    if (s[i] === ')') {
      depth -= 1;
      if (depth === 0) return [s.slice(open + 1, i), i + 1];
    }
  }
  throw new Error(`unbalanced parentheses in: ${s.slice(open, open + 80)}`);
}

/**
 * Split the text after `CREATE POLICY name ON table` into its header
 * (AS / FOR / TO) and its top-level USING (...) and WITH CHECK (...).
 */
function clauses(rest) {
  const out = { header: '', using: null, check: null };
  let i = 0;
  let headerEnd = null;
  while (i < rest.length) {
    const tail = rest.slice(i);
    const m = /^(USING|WITH\s+CHECK)\s*\(/i.exec(tail);
    if (m && (i === 0 || /\s|\)/.test(rest[i - 1]))) {
      if (headerEnd === null) headerEnd = i;
      const [inner, after] = balanced(rest, i + m[0].length - 1);
      if (/^USING/i.test(m[1])) out.using = inner.trim();
      else out.check = inner.trim();
      i = after;
    } else {
      i += 1;
    }
  }
  out.header = rest.slice(0, headerEnd ?? rest.length);
  return out;
}

// CREATE POLICY name ON [schema.]table ... ;
const CREATE_POLICY = /\bCREATE\s+POLICY\s+("(?:[^"]|"")+"|[\w$]+)\s+ON\s+((?:"(?:[^"]|"")+"|[\w$]+)(?:\.(?:"(?:[^"]|"")+"|[\w$]+))?)([^;]*);/gi;

export function parsePolicies(sql) {
  const out = [];
  for (const m of stripComments(sql).matchAll(CREATE_POLICY)) {
    const parts = m[2].split('.').map(unquote);
    const table = parts.pop();
    const schema = parts[0] ?? 'public';
    const { header, using, check } = clauses(m[3]);
    const cmd = (/\bFOR\s+(ALL|SELECT|INSERT|UPDATE|DELETE)\b/i.exec(header)?.[1] ?? 'ALL').toUpperCase();
    const to = /\bTO\s+([\s\S]+)$/i.exec(header);
    const roles = to ? to[1].split(',').map((r) => unquote(r).toLowerCase()) : ['public'];
    out.push({ schema, table, policy: unquote(m[1]), cmd, roles, using, check });
  }
  return out;
}

// DROP POLICY [IF EXISTS] name ON [schema.]table
const DROP_POLICY = /\bDROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?("(?:[^"]|"")+"|[\w$]+)\s+ON\s+((?:"(?:[^"]|"")+"|[\w$]+)(?:\.(?:"(?:[^"]|"")+"|[\w$]+))?)/gi;

/** `table.policy` keys a file drops. */
export function parseDrops(sql) {
  return new Set([...stripComments(sql).matchAll(DROP_POLICY)].map((m) => `${m[2].split('.').map(unquote).pop()}.${unquote(m[1])}`));
}

/**
 * Owner columns an expression pins to the caller: auth.uid() = user_id,
 * id = auth.uid(), (select auth.uid()) = t.user_id, and pg_policies' own
 * rendering `( SELECT auth.uid() AS uid) = user_id`.
 */
export function ownerColumns(expr) {
  if (!expr) return new Set();
  const e = expr
    .toLowerCase()
    .replace(/"/g, '')
    .replace(/::\w+/g, '')
    .replace(/\(\s*select\s+auth\.uid\(\)(?:\s+as\s+\w+)?\s*\)/g, 'auth.uid()')
    .replace(/\s*=\s*/g, '=');
  const cols = new Set();
  for (const m of e.matchAll(/auth\.uid\(\)=([\w.]+)/g)) cols.add(m[1].split('.').pop());
  for (const m of e.matchAll(/([\w.]+)=auth\.uid\(\)/g)) cols.add(m[1].split('.').pop());
  return cols;
}

/** Why a policy breaks the rule, or null. Only UPDATE and ALL are judged. */
export function problem({ cmd, using, check }) {
  if (cmd !== 'UPDATE' && cmd !== 'ALL') return null;
  if (check === null || check === undefined) return 'no WITH CHECK';
  const kept = ownerColumns(check);
  const dropped = [...ownerColumns(using)].filter((c) => !kept.has(c));
  return dropped.length ? `WITH CHECK drops owner column ${dropped.join(', ')}` : null;
}

export const key = (p) => `${p.table}.${p.policy}`;
