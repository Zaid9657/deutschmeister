// Static scanner for supabase-js query chains: which table, which columns.
//
// Used by tests/db-columns.test.mjs to hold every query in src/ and
// netlify/functions/ to the live schema snapshot (tests/fixtures/db-schema.json).
//
// Why a parser and not a grep: the columns a query names are spread over the
// whole chain — `.select('a, b')`, `.eq('c', …)`, `.order('d')`, the keys of an
// `.upsert({ … })` object that may be built three lines earlier, and the
// `onConflict` option. A column that exists nowhere in the live table makes
// PostgREST answer 400; supabase-js resolves (never throws) on that, so a
// fail-soft caller drops the write silently. That is how every listening and
// reading completion was lost until 2026-09-28.
//
// The parser is ESLint's own (espree), resolved through the eslint package so
// the test needs no dependency the repo does not already install.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const requireHere = createRequire(import.meta.url);
const espree = createRequire(requireHere.resolve('eslint/package.json'))('espree');

/** Methods whose FIRST argument is a column of the chain's table. */
const COLUMN_FIRST_ARG = new Set([
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'likeAllOf', 'likeAnyOf',
  'ilikeAllOf', 'ilikeAnyOf', 'is', 'in', 'contains', 'containedBy', 'rangeGt', 'rangeGte',
  'rangeLt', 'rangeLte', 'rangeAdjacent', 'overlaps', 'textSearch', 'not', 'filter', 'order',
]);
/** Methods whose first argument is a row (or rows) of the chain's table. */
const ROW_ARG = new Set(['insert', 'upsert', 'update']);

export function parseSource(source, file = '<source>') {
  try {
    return espree.parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
      loc: true,
    });
  } catch (err) {
    throw new Error(`${file}: cannot parse (${err.message})`);
  }
}

function walk(node, parent, visit) {
  if (!node || typeof node.type !== 'string') return;
  node.__parent = parent;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === '__parent' || key === 'loc' || key === 'range') continue;
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => walk(c, node, visit));
    else if (child && typeof child.type === 'string') walk(child, node, visit);
  }
}

/** A string literal or an expression-free template literal, else null. */
function staticString(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked).join('');
  }
  return null;
}

const propName = (m) => (m && m.type === 'MemberExpression' && !m.computed ? m.property.name : null);

/**
 * PostgREST select syntax → { columns, embeds }. Handles aliases (`a:col`),
 * casts (`col::text`), JSON paths (`col->a->>b`), aggregates (`count()`,
 * `col.sum()`), `*`, and embedded resources (`rel(…)`, `alias:rel!hint(…)`),
 * which come back as { name, inner } so the caller can check them against the
 * embedded table when it is one.
 */
export function parseSelect(select) {
  const columns = [];
  const embeds = [];
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of String(select)) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else cur += ch;
  }
  parts.push(cur);
  for (const raw of parts) {
    const item = raw.replace(/\s+/g, '');
    if (!item || item === '*') continue;
    const open = item.indexOf('(');
    if (open > 0 && item.endsWith(')') && !/\.\w+\(\)$/.test(item) && item !== 'count()') {
      const head = item.slice(0, open).replace(/^[\w]+:(?!:)/, '').split('!')[0];
      embeds.push({ name: head, inner: item.slice(open + 1, -1) });
      continue;
    }
    let col = item.replace(/^[\w]+:(?!:)/, ''); // alias
    col = col.split('::')[0]; // cast
    col = col.split('->')[0]; // JSON path
    col = col.replace(/\.\w+\(\)$/, ''); // aggregate
    if (col === 'count' || col === 'count()' || col === '') continue;
    columns.push(col);
  }
  return { columns, embeds };
}

/**
 * Scan one module's source. Returns { refs, chains, skipped }:
 *   refs    [{ table, column, method, line }] — every column named on a table
 *   chains  number of `.from('<table>')` chains found
 *   skipped reasons a chain or argument could not be resolved statically
 */
export function scanSource(source, file = '<source>') {
  const ast = parseSource(source, file);
  const stringConsts = new Map();
  const declInits = new Map();
  walk(ast, null, (n) => {
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init) {
      const list = declInits.get(n.id.name) || [];
      list.push(n.init);
      declInits.set(n.id.name, list);
      const s = staticString(n.init);
      if (s !== null) {
        const prev = stringConsts.get(n.id.name);
        stringConsts.set(n.id.name, prev === undefined || prev === s ? s : null);
      }
    }
  });

  const resolveString = (node) => {
    const s = staticString(node);
    if (s !== null) return s;
    if (node && node.type === 'Identifier') return stringConsts.get(node.name) ?? null;
    return null;
  };

  // Every object literal a row argument can statically be: a literal, an array
  // of them, a unique local binding, either arm of a ternary, or `.map(x => ({…}))`.
  const resolveObjects = (node, depth = 0) => {
    if (!node || depth > 5) return [];
    switch (node.type) {
      case 'ObjectExpression':
        return [node];
      case 'ArrayExpression':
        return node.elements.flatMap((e) => resolveObjects(e, depth + 1));
      case 'ConditionalExpression':
        return [...resolveObjects(node.consequent, depth + 1), ...resolveObjects(node.alternate, depth + 1)];
      case 'LogicalExpression':
        return [...resolveObjects(node.left, depth + 1), ...resolveObjects(node.right, depth + 1)];
      case 'Identifier': {
        const inits = declInits.get(node.name) || [];
        return inits.length === 1 ? resolveObjects(inits[0], depth + 1) : [];
      }
      case 'CallExpression': {
        const fn = node.arguments[0];
        if (propName(node.callee) === 'map' && fn && /FunctionExpression$/.test(fn.type) && fn.body.type !== 'BlockStatement') {
          return resolveObjects(fn.body, depth + 1);
        }
        return [];
      }
      default:
        return [];
    }
  };

  const objectKeys = (obj, depth = 0) => {
    const keys = [];
    for (const p of obj.properties) {
      if (p.type === 'SpreadElement') {
        resolveObjects(p.argument, depth + 1).forEach((o) => keys.push(...objectKeys(o, depth + 1)));
      } else if (!p.computed) {
        const k = p.key.type === 'Identifier' ? p.key.name : staticString(p.key);
        if (k) keys.push(k);
      }
    }
    return keys;
  };

  const optionString = (optsNode, name) => {
    if (!optsNode || optsNode.type !== 'ObjectExpression') return null;
    const prop = optsNode.properties.find(
      (p) => p.type === 'Property' && !p.computed && (p.key.name === name || p.key.value === name),
    );
    return prop ? staticString(prop.value) : null;
  };
  const hasOption = (optsNode, names) =>
    optsNode?.type === 'ObjectExpression' &&
    optsNode.properties.some((p) => p.type === 'Property' && names.includes(p.key.name || p.key.value));

  const refs = [];
  const skipped = [];
  let chains = 0;

  walk(ast, null, (n) => {
    if (n.type !== 'CallExpression' || propName(n.callee) !== 'from') return;
    const owner = n.callee.object;
    // Storage buckets, Array.from/Buffer.from, and non-public schemas are not tables here.
    if (propName(owner) === 'storage') return;
    if (owner.type === 'Identifier' && /^[A-Z]/.test(owner.name)) return;
    if (owner.type === 'CallExpression' && propName(owner.callee) === 'schema') return;
    const table = resolveString(n.arguments[0]);
    if (table === null) {
      if (n.arguments[0]?.type !== 'Literal') skipped.push(`${file}:${n.loc.start.line} dynamic table`);
      return;
    }
    chains += 1;
    // The table itself, so a chain that names no column (`select('*')`) is still checked.
    refs.push({ table, column: null, method: 'from', line: n.loc.start.line, file });

    const add = (column, method, line) => refs.push({ table, column, method, line, file });
    const addSelect = (sel, line, onTable = table) => {
      const { columns, embeds } = parseSelect(sel);
      columns.forEach((c) => refs.push({ table: onTable, column: c, method: 'select', line, file }));
      embeds.forEach((e) => {
        const inner = parseSelect(e.inner);
        inner.columns.forEach((c) => refs.push({ table: e.name, column: c, method: 'select(embed)', line, file, embed: true }));
      });
    };

    // Climb the chain: from(...) → .m1(...) → .m2(...) …
    let node = n;
    while (node.__parent && node.__parent.type === 'MemberExpression' && node.__parent.object === node) {
      const member = node.__parent;
      const call = member.__parent;
      if (!call || call.type !== 'CallExpression' || call.callee !== member) break;
      const method = propName(member);
      const line = call.loc.start.line;
      const [a0, a1] = call.arguments;
      if (method === 'select') {
        const sel = a0 === undefined ? '*' : resolveString(a0);
        if (sel === null) skipped.push(`${file}:${line} dynamic select`);
        else addSelect(sel, line);
      } else if (COLUMN_FIRST_ARG.has(method)) {
        const col = resolveString(a0);
        const onOther = hasOption(method === 'order' ? a1 : call.arguments[call.arguments.length - 1], ['foreignTable', 'referencedTable']);
        if (col === null) skipped.push(`${file}:${line} dynamic ${method} column`);
        else if (!onOther && !col.includes('.')) add(col.split('->')[0], method, line);
      } else if (method === 'or') {
        const expr = resolveString(a0);
        if (expr !== null && !hasOption(a1, ['foreignTable', 'referencedTable'])) {
          parseSelect(expr).columns.forEach((part) => {
            const col = part.split('.')[0];
            if (col && col !== 'and' && col !== 'or') add(col, 'or', line);
          });
        }
      } else if (method === 'match') {
        resolveObjects(a0).forEach((o) => objectKeys(o).forEach((k) => add(k, 'match', line)));
      } else if (ROW_ARG.has(method)) {
        const objs = resolveObjects(a0);
        if (!objs.length) skipped.push(`${file}:${line} dynamic ${method} row`);
        objs.forEach((o) => objectKeys(o).forEach((k) => add(k, method, line)));
        const conflict = optionString(a1, 'onConflict');
        if (conflict) conflict.split(',').map((c) => c.trim()).filter(Boolean).forEach((c) => add(c, 'onConflict', line));
      }
      node = call;
    }
  });

  return { refs, chains, skipped };
}

/** Every .js/.jsx/.mjs/.cjs file under the given roots, skipping node_modules. */
export function listSourceFiles(roots, repoRoot) {
  const out = [];
  const visit = (abs) => {
    for (const name of readdirSync(abs)) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      const p = path.join(abs, name);
      const st = statSync(p);
      if (st.isDirectory()) visit(p);
      else if (/\.(m|c)?jsx?$/.test(name)) out.push(p);
    }
  };
  roots.forEach((r) => visit(path.join(repoRoot, r)));
  return out.sort();
}

export function scanFiles(files, repoRoot) {
  const refs = [];
  const skipped = [];
  let chains = 0;
  for (const abs of files) {
    const rel = path.relative(repoRoot, abs);
    const r = scanSource(readFileSync(abs, 'utf8'), rel);
    refs.push(...r.refs);
    skipped.push(...r.skipped);
    chains += r.chains;
  }
  return { refs, chains, skipped };
}

/** refs that name a table or a column the snapshot does not have. */
export function findViolations(refs, tables) {
  const out = [];
  for (const r of refs) {
    const cols = tables[r.table];
    if (!cols) {
      // An embed may name a foreign-key column or an alias, not a table; only
      // a top-level .from() table must exist.
      if (!r.embed && r.column === null) out.push({ ...r, problem: `unknown table ${r.table}` });
      continue;
    }
    if (r.column !== null && !cols.includes(r.column)) out.push({ ...r, problem: `${r.table}.${r.column} does not exist` });
  }
  return out;
}
