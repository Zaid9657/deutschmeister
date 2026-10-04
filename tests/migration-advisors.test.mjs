// Guard: no migration may bring back a Supabase security-advisor finding class
// that is at zero.
//
// The security goal is the advisor's ERROR + WARN count. Measured 2026-10-04
// (get_advisors, read-only): 0 ERROR and 3 WARN, none of them a class this file
// covers — lint 0014 extension_in_public for pg_net and pg_trgm (held by
// tests/extension-schema.test.mjs on owner-decision/extensions-out-of-public)
// and leaked-password protection (an Auth setting no migration can reach).
// Every class below is at 0 live, and new migrations land weekly
// (agent_incidents 2026-09-30, agent_heartbeats 2026-10-01). Until now each new
// table's RLS line was pinned by that table's own test (weekly-truth,
// admin-rbac, sentinel, …): a list of instances. This is the rule for the class.
//
// The test replays migrations/*.sql in filename (= apply) order and fails if
// the end state would hold any of:
//
//   lint       level  class                               the state it means
//   0013       ERROR  rls_disabled_in_public              a public table without RLS
//   0010       ERROR  security_definer_view               a public view without security_invoker
//   0002       ERROR  auth_users_exposed                  a public view over auth.users that
//                                                         anon or authenticated can SELECT
//   0016       WARN   materialized_view_in_api            a public materialized view that anon
//                                                         or authenticated can SELECT
//   0011       WARN   function_search_path_mutable        a public function with no pinned search_path
//   0028/0029  WARN   anon/authenticated_security_        a SECURITY DEFINER function that PUBLIC,
//                     definer_function_executable         anon or authenticated can EXECUTE
//
// What the replay models (each fact is pinned by a scanner test below):
// - CREATE OR REPLACE VIEW replaces the view's options with the ones it names,
//   even when it names none: a replace without WITH (security_invoker = true)
//   silently turns an invoker view back into a definer view (view.c since
//   postgres 0e4611c: "The new options list replaces the existing options
//   list, even if it's empty"). It keeps the view's grants.
// - CREATE OR REPLACE FUNCTION replaces SECURITY DEFINER/INVOKER and every SET
//   clause, and keeps the ACL. A new function is executable by PUBLIC, and this
//   project's default privileges also grant anon and authenticated
//   (tests/function-grants.test.mjs), so a lockdown names all three.
// - A new table or view in public is granted to anon and authenticated by
//   Supabase's default privileges.
// - A GRANT of EXECUTE to PUBLIC, anon or authenticated is allowed only on a
//   function a migration here created as SECURITY INVOKER. On any other
//   function the replay cannot tell whether it re-opens a definer function, so
//   it refuses (deny by default).
// - Applied migrations are records of what ran, so a violation in one is fixed
//   by a later file, never by an edit. The newest file has no later one, so a
//   new migration must be complete on its own — PROTOCOL rule 4: RLS on every
//   new table, views security_invoker, SECURITY DEFINER functions revoked from
//   PUBLIC, anon and authenticated in the same file.
// - A DO block is dynamic SQL the replay cannot follow. It may therefore not
//   create a table, view or function, set SECURITY DEFINER, disable RLS, touch
//   security_invoker or search_path, or GRANT to a client role, and a REVOKE or
//   an ENABLE ROW LEVEL SECURITY inside one does not count. Write those as
//   plain statements so this guard can read them. (Draft PR #142's
//   speaking-allowances file locks its eight functions in a DO loop: live they
//   are locked — pg_proc, 2026-10-04 — but the file would fail here until its
//   REVOKEs are written out.)
//
// Scope: migrations/*.sql only (the root *.sql files are history and are never
// re-run — migrations/README.md) and schema public only, the schema the Data
// API exposes. Comments are dropped and function bodies blanked before a
// statement is read, so a body or a rollback note can neither satisfy nor trip
// a rule. An object created outside migrations/ (by hand, before the folder
// existed) is judged once a migration touches it. Dynamic SQL inside a
// function body is out of reach, as it is for every static check.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const MIGRATIONS = fileURLToPath(new URL('../migrations/', import.meta.url));
const FILES = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
const read = (f) => readFileSync(path.join(MIGRATIONS, f), 'utf8');

const CLIENT_ROLES = ['public', 'anon', 'authenticated'];
const VIEW_CLIENTS = ['anon', 'authenticated', 'public'];

// ---------------------------------------------------------------------------
// lexer: top-level statements, comments dropped, bodies blanked
// ---------------------------------------------------------------------------

/**
 * Split SQL into top-level statements. Each comes back three ways:
 *   code — comments dropped, dollar-quoted bodies blanked to `$$ $$`;
 *   bare — as code, with every '…' literal blanked to '' as well;
 *   body — the raw text of the statement's dollar-quoted bodies (for DO).
 * A `;` inside a literal, a quoted identifier, a comment or a body never splits.
 */
export function splitStatements(sql) {
  const out = [];
  let code = '';
  let bare = '';
  let body = '';
  const push = () => {
    if (code.trim()) out.push({ code: code.trim(), bare: bare.trim(), body });
    code = '';
    bare = '';
    body = '';
  };
  const n = sql.length;
  let i = 0;
  while (i < n) {
    const ch = sql[i];
    const nx = sql[i + 1];
    if (ch === '-' && nx === '-') {
      const j = sql.indexOf('\n', i);
      i = j === -1 ? n : j;
      continue;
    }
    if (ch === '/' && nx === '*') {
      let depth = 1;
      i += 2;
      while (i < n && depth > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') { depth += 1; i += 2; }
        else if (sql[i] === '*' && sql[i + 1] === '/') { depth -= 1; i += 2; }
        else i += 1;
      }
      code += ' ';
      bare += ' ';
      continue;
    }
    if (ch === "'") {
      const escapes = /[eE]/.test(sql[i - 1] ?? '') && !/[\w$]/.test(sql[i - 2] ?? '');
      let j = i + 1;
      while (j < n) {
        if (escapes && sql[j] === '\\') { j += 2; continue; }
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") { j += 2; continue; }
          break;
        }
        j += 1;
      }
      code += sql.slice(i, j + 1);
      bare += "''";
      i = j + 1;
      continue;
    }
    if (ch === '"') {
      let j = i + 1;
      while (j < n) {
        if (sql[j] === '"') {
          if (sql[j + 1] === '"') { j += 2; continue; }
          break;
        }
        j += 1;
      }
      code += sql.slice(i, j + 1);
      bare += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (ch === '$' && !/[\w$]/.test(sql[i - 1] ?? '')) {
      const tag = /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i, i + 64));
      if (tag) {
        const start = i + tag[0].length;
        const end = sql.indexOf(tag[0], start);
        body += `${sql.slice(start, end === -1 ? n : end)}\n`;
        code += '$$ $$';
        bare += '$$ $$';
        i = end === -1 ? n : end + tag[0].length;
        continue;
      }
    }
    if (ch === ';') {
      push();
      i += 1;
      continue;
    }
    code += ch;
    bare += ch;
    i += 1;
  }
  push();
  return out;
}

// ---------------------------------------------------------------------------
// names
// ---------------------------------------------------------------------------

const IDENT = String.raw`(?:"(?:[^"]|"")+"|[A-Za-z_][\w$]*)`;
const QNAME = String.raw`${IDENT}(?:\s*\.\s*${IDENT})?`;

/** `public.t` / `"public"."T"` / `t` → `public.t` (unquoted names fold to lower case). */
export function key(qname) {
  const parts = [...qname.matchAll(new RegExp(IDENT, 'g'))].map(([p]) =>
    p.startsWith('"') ? p.slice(1, -1).replace(/""/g, '"') : p.toLowerCase());
  return parts.length === 1 ? `public.${parts[0]}` : `${parts[0]}.${parts[1]}`;
}

const inPublic = (k) => k.startsWith('public.');

/** Split on commas outside parentheses. */
function splitTopLevel(s) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

/** `public.f(int, text), g()` → ['public.f', 'public.g']. */
const fnKeys = (list) => splitTopLevel(list).map((spec) => key(spec.replace(/\([\s\S]*$/, '')));

/** `anon, "authenticated", PUBLIC GRANTED BY x CASCADE` → ['anon', 'authenticated', 'public']. */
const roleList = (s) => s
  .replace(/\bGRANTED\s+BY\b[\s\S]*$/i, '')
  .replace(/\bWITH\s+GRANT\s+OPTION\b[\s\S]*$/i, '')
  .replace(/\b(?:CASCADE|RESTRICT)\b/gi, '')
  .split(',')
  .map((r) => r.replace(/"/g, '').trim().toLowerCase())
  .filter(Boolean);

/** Postgres reads a bare boolean reloption as true, and t/true/y/yes/on/1 as true. */
function securityInvoker(options) {
  if (!options) return false;
  for (const opt of splitTopLevel(options)) {
    const m = /^security_invoker\s*(?:=\s*(.+))?$/i.exec(opt.trim());
    if (m) return m[1] === undefined || /^'?(t|true|y|yes|on|1)'?$/i.test(m[1].trim());
  }
  return false;
}

// ---------------------------------------------------------------------------
// the replay
// ---------------------------------------------------------------------------

const CREATE_TABLE = new RegExp(String.raw`^CREATE\s+(?:(?:GLOBAL|LOCAL)\s+)?(?:(TEMP|TEMPORARY|UNLOGGED)\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(${QNAME})`, 'i');
const ALTER_TABLE = new RegExp(String.raw`^ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?(${QNAME})\s*\*?\s*([\s\S]*)$`, 'i');
const CREATE_VIEW = new RegExp(String.raw`^CREATE\s+(OR\s+REPLACE\s+)?(?:(TEMP|TEMPORARY)\s+)?(?:RECURSIVE\s+)?VIEW\s+(${QNAME})\s*(?:\([^)]*\)\s*)?(?:WITH\s*\(([^)]*)\)\s*)?AS\b([\s\S]*)$`, 'i');
const CREATE_MATVIEW = new RegExp(String.raw`^CREATE\s+MATERIALIZED\s+VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(${QNAME})[\s\S]*?\bAS\b([\s\S]*)$`, 'i');
const ALTER_VIEW = new RegExp(String.raw`^ALTER\s+(?:MATERIALIZED\s+)?VIEW\s+(?:IF\s+EXISTS\s+)?(${QNAME})\s+([\s\S]*)$`, 'i');
const CREATE_FN = new RegExp(String.raw`^CREATE\s+(?:OR\s+REPLACE\s+)?(?:FUNCTION|PROCEDURE)\s+(${QNAME})\s*\(`, 'i');
const ALTER_FN = new RegExp(String.raw`^ALTER\s+(?:FUNCTION|PROCEDURE|ROUTINE)\s+(${QNAME})\s*(?:\([^)]*\))?\s*([\s\S]*)$`, 'i');
const DROP = new RegExp(String.raw`^DROP\s+(TABLE|VIEW|MATERIALIZED\s+VIEW|FUNCTION|PROCEDURE|ROUTINE)\s+(?:IF\s+EXISTS\s+)?([\s\S]+?)\s*(?:\bCASCADE\b|\bRESTRICT\b)?\s*$`, 'i');
const PRIV_FN = /^(GRANT|REVOKE)\s+(GRANT\s+OPTION\s+FOR\s+)?([\s\S]+?)\s+ON\s+(?:(?:FUNCTION|ROUTINE|PROCEDURE)\s+([\s\S]+?)|ALL\s+(?:FUNCTIONS|ROUTINES|PROCEDURES)\s+IN\s+SCHEMA\s+([\s\S]+?))\s+(?:TO|FROM)\s+([\s\S]+)$/i;
const PRIV_TABLE = /^(GRANT|REVOKE)\s+(GRANT\s+OPTION\s+FOR\s+)?([\s\S]+?)\s+ON\s+(?:TABLE\s+)?(?!(?:FUNCTION|ROUTINE|PROCEDURE|SEQUENCE|SCHEMA|DATABASE|DOMAIN|TYPE|LANGUAGE|LARGE|FOREIGN|TABLESPACE|PARAMETER)\b)(?:ALL\s+TABLES\s+IN\s+SCHEMA\s+([\s\S]+?)|([\s\S]+?))\s+(?:TO|FROM)\s+([\s\S]+)$/i;

/** Dynamic SQL in a DO block that the replay could not follow. */
const DO_FORBIDDEN = [
  [/\bCREATE\s+(?:OR\s+REPLACE\s+)?(?:(?:GLOBAL|LOCAL)\s+)?(?:(?:TEMP|TEMPORARY|UNLOGGED)\s+)?(?:RECURSIVE\s+)?(?:MATERIALIZED\s+)?(?:TABLE|VIEW|FUNCTION|PROCEDURE)\b/i, 'creates a table, view or function'],
  [/\bSECURITY\s+DEFINER\b/i, 'sets SECURITY DEFINER'],
  [/\bDISABLE\s+ROW\s+LEVEL\s+SECURITY\b/i, 'disables RLS'],
  [/\bsecurity_invoker\b/i, 'changes security_invoker'],
  [/\b(?:SET|RESET)\s+search_path\b|\bRESET\s+ALL\b/i, 'changes a search_path'],
  [/\bGRANT\b[^;]*?\bTO\b[^;]*?\b(?:anon|authenticated|PUBLIC)\b/i, 'grants to a client role'],
];

const stripLineComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');

/**
 * Replay every file in order. Returns the end state plus everything that broke
 * a rule at the moment it ran (grants the replay cannot verify, DO blocks it
 * cannot follow).
 */
export function replay(files) {
  const tables = new Map(); // key -> { rls, file }
  const views = new Map(); // key -> { invoker, authUsers, materialized, select:Set, file }
  const fns = new Map(); // key -> { created, definer, path, exec:Set, file }
  const immediate = [];
  let doBlocks = 0;

  const fnEntry = (k, file) => {
    if (!fns.has(k)) fns.set(k, { created: false, definer: undefined, path: undefined, exec: new Set(CLIENT_ROLES), file });
    return fns.get(k);
  };
  const viewEntry = (k, file) => {
    if (!views.has(k)) views.set(k, { invoker: false, authUsers: false, materialized: false, select: new Set(['anon', 'authenticated']), file });
    return views.get(k);
  };
  const rename = (map, from, rest) => {
    const to = new RegExp(String.raw`^RENAME\s+TO\s+(${IDENT})\s*$`, 'i').exec(rest);
    if (to && map.has(from)) {
      map.set(key(to[1]), map.get(from));
      map.delete(from);
      return true;
    }
    if (/^SET\s+SCHEMA\b/i.test(rest)) { map.delete(from); return true; }
    return false;
  };

  for (const [file, sql] of files) {
    for (const st of splitStatements(sql)) {
      const code = st.code.replace(/\s+/g, ' ');
      const bare = st.bare.replace(/\s+/g, ' ');
      let m;

      if (/^DO\b/i.test(code)) {
        doBlocks += 1;
        const text = stripLineComments(st.body);
        for (const [re, what] of DO_FORBIDDEN) {
          if (re.test(text)) immediate.push(`${file}: a DO block ${what}; write it as a plain statement this guard can read`);
        }
        continue;
      }

      if ((m = CREATE_TABLE.exec(code))) {
        const k = key(m[2]);
        if (/^TEMP/i.test(m[1] ?? '') || !inPublic(k)) continue;
        if (!tables.has(k)) tables.set(k, { rls: false, file });
        continue;
      }

      if ((m = CREATE_VIEW.exec(code))) {
        const k = key(m[3]);
        if (m[2] || !inPublic(k)) continue;
        const v = viewEntry(k, file);
        Object.assign(v, { invoker: securityInvoker(m[4]), authUsers: /\bauth"?\s*\.\s*"?users\b/i.test(m[5]), materialized: false, file });
        continue;
      }

      if ((m = CREATE_MATVIEW.exec(code))) {
        const k = key(m[1]);
        if (!inPublic(k)) continue;
        Object.assign(viewEntry(k, file), { invoker: false, authUsers: /\bauth"?\s*\.\s*"?users\b/i.test(m[2]), materialized: true, file });
        continue;
      }

      if ((m = CREATE_FN.exec(bare))) {
        const k = key(m[1]);
        if (!inPublic(k)) continue;
        const f = fnEntry(k, file);
        Object.assign(f, {
          created: true,
          definer: /\bSECURITY\s+DEFINER\b/i.test(bare),
          path: /\bSET\s+search_path\b/i.test(bare),
          file,
        });
        continue;
      }

      if ((m = ALTER_TABLE.exec(code))) {
        const k = key(m[1]);
        if (!inPublic(k)) continue;
        const rest = m[2];
        if (views.has(k)) {
          if (rename(views, k, rest)) continue;
          applyViewOptions(views.get(k), rest, file);
          continue;
        }
        if (rename(tables, k, rest)) continue;
        if (/\bENABLE\s+ROW\s+LEVEL\s+SECURITY\b/i.test(rest)) {
          if (!tables.has(k)) tables.set(k, { rls: true, file });
          else Object.assign(tables.get(k), { rls: true });
        }
        if (/\bDISABLE\s+ROW\s+LEVEL\s+SECURITY\b/i.test(rest)) {
          tables.set(k, { rls: false, file });
        }
        continue;
      }

      if ((m = ALTER_VIEW.exec(code))) {
        const k = key(m[1]);
        if (!inPublic(k)) continue;
        const rest = m[2];
        if (rename(views, k, rest)) continue;
        if (/\b(?:SET|RESET)\s*\(/i.test(rest) && /\bsecurity_invoker\b/i.test(rest)) {
          applyViewOptions(viewEntry(k, file), rest, file);
        }
        continue;
      }

      if ((m = ALTER_FN.exec(bare))) {
        const k = key(m[1]);
        if (!inPublic(k)) continue;
        const rest = m[2];
        if (rename(fns, k, rest)) continue;
        const f = fnEntry(k, file);
        if (/\bSECURITY\s+DEFINER\b/i.test(rest)) Object.assign(f, { definer: true, file });
        if (/\bSECURITY\s+INVOKER\b/i.test(rest)) f.definer = false;
        if (/\bSET\s+search_path\b/i.test(rest)) f.path = true;
        if (/\bRESET\s+(?:search_path|ALL)\b/i.test(rest)) Object.assign(f, { path: false, file });
        continue;
      }

      if ((m = DROP.exec(code))) {
        const kind = m[1].toUpperCase();
        const map = kind === 'TABLE' ? tables : /VIEW/.test(kind) ? views : fns;
        const keys = /VIEW|TABLE/.test(kind) ? splitTopLevel(m[2]).map(key) : fnKeys(m[2]);
        keys.forEach((k) => map.delete(k));
        continue;
      }

      if ((m = PRIV_FN.exec(code))) {
        const [, verb, optionOnly, privs, list, schemas, roles] = m;
        if (optionOnly || !/\b(?:EXECUTE|ALL)\b/i.test(privs)) continue;
        const who = roleList(roles).filter((r) => CLIENT_ROLES.includes(r));
        if (!who.length) continue;
        const keys = list
          ? fnKeys(list).filter(inPublic)
          : splitTopLevel(schemas).some((s) => key(s) === 'public.public')
            ? [...fns.keys()].filter(inPublic)
            : [];
        if (verb.toUpperCase() === 'GRANT') {
          if (!list) {
            immediate.push(`${file}: GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA ${schemas} TO ${who.join(', ')} re-opens every function, SECURITY DEFINER ones included`);
            continue;
          }
          for (const k of keys) {
            const f = fnEntry(k, file);
            if (!(f.created && f.definer === false)) {
              immediate.push(`${file}: GRANT EXECUTE ON ${k} TO ${who.join(', ')} — only a function created here as SECURITY INVOKER may be granted to a client role`);
            }
            who.forEach((r) => f.exec.add(r));
          }
        } else {
          for (const k of keys) who.forEach((r) => fnEntry(k, file).exec.delete(r));
        }
        continue;
      }

      if ((m = PRIV_TABLE.exec(code))) {
        const [, verb, optionOnly, privs, schemas, list, roles] = m;
        if (optionOnly || !/\b(?:SELECT|ALL)\b/i.test(privs)) continue;
        const who = roleList(roles).filter((r) => VIEW_CLIENTS.includes(r));
        const keys = list
          ? splitTopLevel(list).map(key)
          : splitTopLevel(schemas).some((s) => key(s) === 'public.public') ? [...views.keys()] : [];
        for (const k of keys.filter((x) => views.has(x))) {
          const v = views.get(k);
          if (verb.toUpperCase() === 'GRANT') who.forEach((r) => v.select.add(r));
          else who.forEach((r) => v.select.delete(r));
        }
      }
    }
  }
  return { tables, views, fns, immediate, doBlocks };

  function applyViewOptions(v, rest, file) {
    const set = /\bSET\s*\(([^)]*)\)/i.exec(rest);
    if (set && /\bsecurity_invoker\b/i.test(set[1])) Object.assign(v, { invoker: securityInvoker(set[1]), file });
    const reset = /\bRESET\s*\(([^)]*)\)/i.exec(rest);
    if (reset && /\bsecurity_invoker\b/i.test(reset[1])) Object.assign(v, { invoker: false, file });
  }
}

/** Every advisor finding the replayed end state would raise, plus every rule broken on the way. */
export function violations(files) {
  const { tables, views, fns, immediate } = replay(files);
  const out = [...immediate];
  for (const [k, t] of tables) {
    if (!t.rls) out.push(`0013 rls_disabled_in_public: ${k} (${t.file}) — add ALTER TABLE ${k} ENABLE ROW LEVEL SECURITY;`);
  }
  for (const [k, v] of views) {
    const clients = [...v.select].filter((r) => VIEW_CLIENTS.includes(r));
    if (v.materialized) {
      if (clients.length) out.push(`0016 materialized_view_in_api: ${k} (${v.file}) is selectable by ${clients.join(', ')} — REVOKE ALL ON ${k} FROM PUBLIC, anon, authenticated;`);
      continue;
    }
    if (!v.invoker) out.push(`0010 security_definer_view: ${k} (${v.file}) — every CREATE [OR REPLACE] VIEW must say WITH (security_invoker = true)`);
    if (v.authUsers && clients.length) out.push(`0002 auth_users_exposed: ${k} (${v.file}) reads auth.users and is selectable by ${clients.join(', ')} — REVOKE ALL ON ${k} FROM PUBLIC, anon, authenticated;`);
  }
  for (const [k, f] of fns) {
    if ((f.created && !f.path) || f.path === false) {
      out.push(`0011 function_search_path_mutable: ${k} (${f.file}) — pin it with SET search_path = public, pg_temp (CREATE OR REPLACE drops an earlier pin)`);
    }
    const exec = [...f.exec].filter((r) => CLIENT_ROLES.includes(r));
    if (f.definer === true && exec.length) {
      out.push(`0028/0029 security_definer_function_executable: ${k} (${f.file}) is SECURITY DEFINER and executable by ${exec.join(', ')} — REVOKE EXECUTE ON FUNCTION ${k}(…) FROM PUBLIC, anon, authenticated;`);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// the scanner itself — a guard that matches nothing passes everything
// ---------------------------------------------------------------------------

const one = (sql) => violations([['m.sql', sql]]);
const codes = (sql) => one(sql).map((v) => v.split(' ')[0]);
const T = (body = '') => `CREATE TABLE IF NOT EXISTS public.t (id int);\n${body}`;
const DEF = (extra = 'SET search_path = public, pg_temp') =>
  `CREATE OR REPLACE FUNCTION public.f() RETURNS int LANGUAGE sql SECURITY DEFINER ${extra} AS $$ SELECT 1 $$;\n`;
const LOCK = 'REVOKE EXECUTE ON FUNCTION public.f() FROM PUBLIC, anon, authenticated;\n';

test('the lexer splits only on top-level semicolons and blanks bodies and comments', () => {
  const sql = [
    "INSERT INTO t VALUES ('a;b', E'it\\'s;', 'x''y;');",
    'CREATE FUNCTION f() RETURNS int AS $body$ SELECT 1; $$ nested; $$ $body$ LANGUAGE sql;',
    '-- a comment; with a semicolon',
    '/* block; /* nested; */ still comment; */ SELECT "we;ird" FROM x;',
  ].join('\n');
  const st = splitStatements(sql);
  assert.equal(st.length, 3, st.map((s) => s.code).join(' | '));
  assert.match(st[0].code, /'a;b'/);
  assert.equal(st[0].bare, "INSERT INTO t VALUES ('', E'', '')");
  assert.match(st[1].code, /AS \$\$ \$\$ LANGUAGE sql/);
  assert.match(st[1].body, /SELECT 1; \$\$ nested; \$\$/);
  assert.equal(st[2].code, 'SELECT "we;ird" FROM x');
});

test('names: schema, quoting and case fold the way Postgres folds them', () => {
  assert.equal(key('t'), 'public.t');
  assert.equal(key('PUBLIC.T'), 'public.t');
  assert.equal(key('"public"."T"'), 'public.T');
  assert.equal(key('private . t'), 'private.t');
});

test('0013: a public table needs RLS, in its own file or a later one', () => {
  assert.deepEqual(codes(T()), ['0013']);
  assert.deepEqual(one(T('ALTER TABLE public.t ENABLE ROW LEVEL SECURITY;')), []);
  assert.deepEqual(one(T('ALTER TABLE IF EXISTS ONLY t ENABLE ROW LEVEL SECURITY;')), []);
  assert.deepEqual(codes('CREATE UNLOGGED TABLE t (id int);'), ['0013'], 'unqualified means public');
  assert.deepEqual(codes(T('-- ALTER TABLE public.t ENABLE ROW LEVEL SECURITY;')), ['0013'], 'a commented line is not a statement');
  assert.deepEqual(one('CREATE TEMP TABLE t (id int);'), [], 'temp tables are not exposed');
  assert.deepEqual(one('CREATE TABLE private.t (id int);'), [], 'only public is exposed');
  assert.deepEqual(one(T('DROP TABLE IF EXISTS public.t CASCADE;')), []);
  assert.deepEqual(violations([['1.sql', T()], ['2.sql', 'ALTER TABLE public.t ENABLE ROW LEVEL SECURITY;']]), [],
    'an applied record is completed by a later file');
  assert.deepEqual(
    violations([['1.sql', T('ALTER TABLE public.t ENABLE ROW LEVEL SECURITY;')], ['2.sql', 'ALTER TABLE public.t DISABLE ROW LEVEL SECURITY;']]).map((v) => v.split(' ')[0]),
    ['0013'], 'a later DISABLE wins');
  assert.deepEqual(codes('ALTER TABLE public.legacy DISABLE ROW LEVEL SECURITY;'), ['0013'], 'a table made outside migrations/ is judged once touched');
});

test('0010: every CREATE [OR REPLACE] VIEW must carry security_invoker — a replace drops it', () => {
  const v = (opts = '') => `CREATE OR REPLACE VIEW public.v ${opts} AS SELECT 1 AS x;\n`;
  const revoke = 'REVOKE ALL ON public.v FROM PUBLIC, anon, authenticated;\n';
  assert.deepEqual(codes(v()), ['0010']);
  for (const ok of ['WITH (security_invoker = true)', 'WITH (security_invoker)', "WITH (security_invoker = 'on')", 'WITH (security_barrier, security_invoker = 1)']) {
    assert.deepEqual(one(v(ok)), [], ok);
  }
  assert.deepEqual(codes(v('WITH (security_invoker = false)')), ['0010']);
  assert.deepEqual(codes(v('WITH (security_invoker = true)') + revoke + v()), ['0010'],
    'CREATE OR REPLACE VIEW replaces the options list, even with an empty one');
  assert.deepEqual(one(v() + 'ALTER VIEW public.v SET (security_invoker = true);'), []);
  assert.deepEqual(codes(v('WITH (security_invoker = true)') + 'ALTER VIEW public.v RESET (security_invoker);'), ['0010']);
  assert.deepEqual(codes(v('WITH (security_invoker = true)') + 'ALTER TABLE public.v SET (security_invoker = off);'), ['0010'],
    'ALTER TABLE reaches view options too');
  assert.deepEqual(one('CREATE TEMP VIEW v AS SELECT 1;'), []);
});

test('0002 and 0016: a view over auth.users, or a materialized view, must be closed to clients', () => {
  const v = 'CREATE OR REPLACE VIEW public.v WITH (security_invoker = true) AS SELECT u.id FROM auth.users u;\n';
  const close = 'REVOKE ALL ON public.v FROM PUBLIC, anon, authenticated;\n';
  assert.deepEqual(codes(v), ['0002']);
  assert.deepEqual(one(v + close), []);
  assert.deepEqual(one(v + close + v), [], 'CREATE OR REPLACE VIEW keeps the grants');
  assert.deepEqual(codes(v + close + 'GRANT SELECT ON TABLE public.v TO authenticated;'), ['0002']);
  assert.deepEqual(codes(v + 'REVOKE UPDATE ON public.v FROM anon, authenticated;'), ['0002'], 'only SELECT/ALL close it');
  assert.deepEqual(codes('CREATE OR REPLACE VIEW public.v WITH (security_invoker) AS SELECT 1 FROM "auth"."users";'), ['0002']);

  const mv = 'CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv AS SELECT 1 AS x;\n';
  assert.deepEqual(codes(mv), ['0016']);
  assert.deepEqual(one(`${mv}REVOKE ALL ON public.mv FROM anon, authenticated;`), []);
  assert.deepEqual(one(`${mv}DROP MATERIALIZED VIEW public.mv;`), []);
});

test('0011: every function pins search_path in its own header — the body does not count', () => {
  assert.deepEqual(codes('CREATE FUNCTION public.g() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$;'), ['0011']);
  assert.deepEqual(one('CREATE FUNCTION public.g() RETURNS int LANGUAGE sql SET search_path = public, pg_temp AS $$ SELECT 1 $$;'), []);
  assert.deepEqual(one("CREATE FUNCTION public.g() RETURNS int LANGUAGE sql SET search_path TO '' AS $$ SELECT 1 $$;"), []);
  assert.deepEqual(codes("CREATE FUNCTION public.g() RETURNS void LANGUAGE plpgsql AS $$ BEGIN PERFORM set_config('x', 'y', true); EXECUTE 'SET search_path = public'; END $$;"), ['0011'],
    'a SET inside the body is not the function\'s SET clause');
  const pinned = 'CREATE OR REPLACE FUNCTION public.g() RETURNS int LANGUAGE sql SET search_path = public AS $$ SELECT 1 $$;\n';
  const unpinned = 'CREATE OR REPLACE FUNCTION public.g() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$;\n';
  assert.deepEqual(codes(pinned + unpinned), ['0011'], 'CREATE OR REPLACE replaces every SET clause');
  assert.deepEqual(one(`${unpinned}ALTER FUNCTION public.g() SET search_path = public, pg_temp;`), []);
  assert.deepEqual(codes(`${pinned}ALTER FUNCTION public.g() RESET ALL;`), ['0011']);
  assert.deepEqual(codes('ALTER FUNCTION public.legacy(int) RESET search_path;'), ['0011']);
});

test('0028/0029: a SECURITY DEFINER function is revoked from PUBLIC, anon and authenticated', () => {
  assert.deepEqual(codes(DEF()), ['0028/0029']);
  assert.deepEqual(one(DEF() + LOCK), []);
  assert.deepEqual(one(`${DEF()}REVOKE ALL ON FUNCTION public.f() FROM PUBLIC;\nREVOKE ALL PRIVILEGES ON FUNCTION f() FROM "anon", authenticated CASCADE;`), []);
  assert.deepEqual(one(`${DEF()}REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;`), []);
  assert.deepEqual(codes(`${DEF()}REVOKE EXECUTE ON FUNCTION public.f() FROM anon, authenticated;`), ['0028/0029'],
    'PUBLIC still holds EXECUTE and every role inherits it');
  assert.deepEqual(codes(`${DEF()}REVOKE GRANT OPTION FOR EXECUTE ON FUNCTION public.f() FROM PUBLIC, anon, authenticated;`), ['0028/0029']);
  assert.deepEqual(one(DEF() + LOCK + DEF()), [], 'CREATE OR REPLACE keeps the ACL');
  assert.deepEqual(violations([['1.sql', DEF()], ['2.sql', LOCK]]), [], 'a later file completes an applied record');
  assert.deepEqual(
    one("CREATE OR REPLACE FUNCTION public.f() RETURNS int LANGUAGE plpgsql SET search_path = public AS $$ BEGIN RAISE NOTICE 'not SECURITY DEFINER'; RETURN 1; END $$;"),
    [], 'words in the body are not attributes');
  assert.deepEqual(
    codes('CREATE OR REPLACE FUNCTION public.f() RETURNS trigger AS $$ BEGIN RETURN NEW; END $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;'),
    ['0028/0029'], 'attributes after the body count, and trigger functions are not exempt (PROTOCOL rule 4)');
  assert.deepEqual(codes('ALTER FUNCTION public.legacy() SECURITY DEFINER;'), ['0028/0029'],
    'a function made outside migrations/ is assumed open until a lockdown is seen');
});

test('a GRANT of EXECUTE to a client role is allowed only on a function created here as SECURITY INVOKER', () => {
  assert.deepEqual(codes(`${DEF()}${LOCK}GRANT EXECUTE ON FUNCTION public.f() TO authenticated;`), ['m.sql:', '0028/0029']);
  assert.deepEqual(codes('GRANT EXECUTE ON FUNCTION public.reserve_speaking_seconds(uuid, int) TO authenticated;'), ['m.sql:'],
    'a function made outside migrations/ may be SECURITY DEFINER (nine live ones are, 2026-10-04)');
  assert.deepEqual(codes('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;'), ['m.sql:']);
  const invoker = 'CREATE FUNCTION public.h() RETURNS int LANGUAGE sql SET search_path = public AS $$ SELECT 1 $$;\n';
  assert.deepEqual(one(`${invoker}GRANT EXECUTE ON FUNCTION public.h() TO authenticated;`), []);
  assert.deepEqual(one(`${DEF()}${LOCK}GRANT EXECUTE ON FUNCTION public.f() TO service_role;`), []);
});

test('a DO block may not hide what the replay would judge', () => {
  const doBlock = (inner) => `DO $$ BEGIN ${inner} END $$;`;
  for (const bad of [
    "EXECUTE 'CREATE TABLE public.x (id int)';",
    "EXECUTE format('CREATE OR REPLACE VIEW public.%I AS SELECT 1', t);",
    "EXECUTE format('ALTER FUNCTION public.%I() SECURITY DEFINER', f);",
    "EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);",
    "EXECUTE format('GRANT SELECT ON public.%I TO anon', t);",
    "EXECUTE 'ALTER VIEW public.v SET (security_invoker = false)';",
    "EXECUTE 'ALTER FUNCTION public.f() RESET search_path';",
  ]) {
    assert.equal(one(doBlock(bad)).length, 1, bad);
  }
  assert.deepEqual(codes(DEF() + doBlock("EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM public, anon, authenticated', fn);")), ['0028/0029'],
    'a lockdown the replay cannot read is not a lockdown');
  assert.deepEqual(codes(T(doBlock("EXECUTE 'ALTER TABLE public.t ENABLE ROW LEVEL SECURITY';"))), ['0013']);
  for (const ok of [
    "EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);",
    "EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon USING (true)', p, t);",
    "IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.t'::regclass) THEN RAISE EXCEPTION 'row level security is off'; END IF;",
    '-- CREATE TABLE in a comment is not SQL',
  ]) {
    assert.deepEqual(one(doBlock(ok)), [], ok);
  }
});

// ---------------------------------------------------------------------------
// the rule, over the real migrations
// ---------------------------------------------------------------------------

const REAL = FILES.map((f) => [f, read(f)]);

test('the replay sees the real migrations (coverage floor)', () => {
  const { tables, views, fns, doBlocks } = replay(REAL);
  assert.ok(FILES.length >= 60, `expected the migrations folder, saw ${FILES.length} files`);
  assert.ok(tables.size >= 24, `expected the created and RLS-enabled tables, saw ${tables.size}`);
  assert.ok(doBlocks >= 8, `expected the DO blocks, saw ${doBlocks}`);

  // Spot checks the advisor confirms live (get_advisors + pg_proc/pg_class, 2026-10-04).
  for (const t of ['public.agent_heartbeats', 'public.agent_incidents', 'public.purchases', 'public.admin_audit_log', 'public.lesson_progress']) {
    assert.equal(tables.get(t)?.rls, true, `${t} should be seen with RLS on`);
  }
  const view = views.get('public.lifecycle_customer_state');
  assert.ok(view && view.invoker && !view.materialized, 'lifecycle_customer_state is a security_invoker view');
  assert.deepEqual([...view.select], [], 'lifecycle_customer_state is service-role only');

  const definers = [...fns].filter(([, f]) => f.created && f.definer).map(([k]) => k).sort();
  assert.deepEqual(definers, [
    'public.course_reminder_candidates',
    'public.handle_new_user',
    'public.notify_welcome_email',
    'public.weekly_truth_metrics',
  ], 'the SECURITY DEFINER functions migrations/ creates');
  for (const k of definers) assert.deepEqual([...fns.get(k).exec], [], `${k} is closed to clients`);
  assert.equal(fns.get('public.protect_profile_privileged_columns')?.definer, false, 'the privileged-column trigger stays SECURITY INVOKER');
});

test('no migration leaves behind an advisor finding class that is at 0', () => {
  assert.deepEqual(violations(REAL), []);
});
