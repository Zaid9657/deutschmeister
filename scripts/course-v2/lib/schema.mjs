// Course v2 schema checker — implements exactly the notation of SCHEMA §1. Zero dependencies.
//
// Schemas are plain JS objects (lib/schemas/*.mjs). Leaves are notation strings, parsed once:
//
//   'str' 'de' 'en'            non-empty string (de/en: German/English; LNG-01/02 run elsewhere)
//   'LText' 'EnText'           { de, en, tr?, ar? } / { en, tr?, ar? }
//   'int' 'int[1..12]' 'num' 'bool' 'date' 'url'   scalars (date = valid YYYY-MM-DD, url = https)
//   'null' 'object'            null / any plain object
//   "'situation'" '6' 'true'   literals
//   'enum(a|b)'                one of the listed string literals
//   're(UNIT)'                 string matching a named pattern of SCHEMA §2 (lib/ids.mjs)
//   'ref(cando)'               an id of that kind: well-formed always, resolving (REF-01) when an index is supplied
//   '[T]' '[T]*' '[T]{n}' '[T]{a..b}'   non-empty / possibly empty / exactly n / a to b items
//   '[T, U]'                   a tuple (e.g. '[int, int]')
//   'T | U'                    union ('str | null')
//   'T?' or a key 'name?'      optional field
//   Name                       a named type registered with define() (Item, Line, …)
//
// Objects are JS object literals: unknown keys are an error. Helpers: obj() (with refine),
// map() for `{ [k]: T }`, lit() for literal values (deep-equal), gen() for `// generated`
// fields (rejected in authored files), oneOfBy() for kind-discriminated unions, arr(),
// absent() for a key the stage schema forbids (SCHEMA §8.1), ifHas() for a union told apart by a key.

import { PATTERNS, REF_PATTERNS } from './ids.mjs';

const NODE = Symbol('course-v2-schema-node');
export const TYPES = new Map();

const node = (props) => Object.freeze({ [NODE]: true, ...props });
const isNode = (x) => Boolean(x && typeof x === 'object' && x[NODE]);
const isPlainObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

// ── builders ────────────────────────────────────────────────────────────────────────────
export function define(name, schema) {
  if (TYPES.has(name)) throw new Error(`schema type ${name} defined twice`);
  const n = toNode(schema);
  TYPES.set(name, n);
  return n;
}
export const named = (name) => node({ t: 'named', name });
export const lit = (value) => node({ t: 'lit', value });
export const gen = (schema) => node({ t: 'gen', of: toNode(schema) });
export const opt = (schema) => node({ t: 'opt', of: toNode(schema) });
export const union = (...branches) => node({ t: 'union', branches: branches.map(toNode) });
export const map = (key, value, { min = 0 } = {}) => node({ t: 'map', key: toNode(key), value: toNode(value), min });
/** A key that must NOT be present (the stage schema of SCHEMA §8.1: „must be absent"). */
export const absent = (why) => node({ t: 'absent', why });
/** `A | B` told apart by the presence of one key (SpeakingTask: `{ parts }` or one part). */
export const ifHas = (field, withField, withoutField) => node({ t: 'ifHas', field, yes: toNode(withField), no: toNode(withoutField) });

/** `[T]` → arr(T); quant: '*' | '{n}' | '{a..b}' | { min, max } */
export function arr(item, quant) {
  let min = 1;
  let max = Infinity;
  if (quant === '*') min = 0;
  else if (typeof quant === 'string') {
    const m = quant.match(/^\{(\d+)(?:\.\.(\d+))?\}$/);
    if (!m) throw new Error(`bad array quantifier ${quant}`);
    min = Number(m[1]);
    max = m[2] === undefined ? min : Number(m[2]);
  } else if (quant && typeof quant === 'object') {
    min = quant.min ?? 1;
    max = quant.max ?? Infinity;
  }
  return node({ t: 'arr', of: toNode(item), min, max });
}

/**
 * `{ … }` with unknown keys forbidden. Keys ending in '?' are optional.
 * options.refine(value, emit) adds cross-field rules; emit(relPath, message, rule?).
 */
export function obj(shape, options = {}) {
  const fields = [];
  for (const [rawKey, rawSchema] of Object.entries(shape)) {
    let key = rawKey;
    let optional = false;
    if (key.endsWith('?')) {
      optional = true;
      key = key.slice(0, -1);
    }
    let n = toNode(rawSchema);
    let generated = false;
    if (n.t === 'gen') {
      generated = true;
      n = n.of;
    }
    if (n.t === 'opt') {
      optional = true;
      n = n.of;
    }
    // A generated field is never required in an authored file; an absent field never is.
    fields.push({ key, optional: optional || generated || n.t === 'absent', generated, node: n });
  }
  return node({ t: 'obj', fields, refine: options.refine || null });
}

/** A union discriminated by a literal field (Step by `kind`); `label` names it in messages. */
export function oneOfBy(field, branches, { label = null } = {}) {
  const b = {};
  for (const [k, v] of Object.entries(branches)) b[k] = toNode(v);
  return node({ t: 'oneOfBy', field, branches: b, label });
}

export function toNode(x) {
  if (isNode(x)) return x;
  if (typeof x === 'string') return parse(x);
  if (Array.isArray(x)) {
    if (x.length !== 1) throw new Error('array schema literal must have exactly one element; use arr()/tuple notation');
    return arr(x[0]);
  }
  if (isPlainObject(x)) return obj(x);
  throw new Error(`cannot build a schema from ${JSON.stringify(x)}`);
}

// ── notation parser ─────────────────────────────────────────────────────────────────────
const SCALARS = new Set(['str', 'de', 'en', 'num', 'bool', 'date', 'url', 'null', 'object']);

export function parse(src) {
  let i = 0;
  const s = src;
  const ws = () => {
    while (i < s.length && /\s/.test(s[i])) i++;
  };
  const fail = (msg) => {
    throw new Error(`schema notation "${src}": ${msg} at ${i}`);
  };
  const expect = (ch) => {
    ws();
    if (s[i] !== ch) fail(`expected "${ch}"`);
    i++;
  };
  const rawUntilClose = () => {
    // reads the raw text inside (...) — enum literals may contain . - + but no parentheses
    const start = i;
    while (i < s.length && s[i] !== ')') i++;
    if (s[i] !== ')') fail('unclosed "("');
    const raw = s.slice(start, i);
    i++;
    return raw;
  };

  function parseUnion() {
    const branches = [parsePrimary()];
    ws();
    while (s[i] === '|') {
      i++;
      branches.push(parsePrimary());
      ws();
    }
    return branches.length === 1 ? branches[0] : union(...branches);
  }

  function parseQuant() {
    ws();
    if (s[i] === '*') {
      i++;
      return '*';
    }
    if (s[i] === '{') {
      const start = i;
      while (i < s.length && s[i] !== '}') i++;
      if (s[i] !== '}') fail('unclosed "{"');
      i++;
      return s.slice(start, i).replace(/\s+/g, '');
    }
    return undefined;
  }

  function parsePrimary() {
    ws();
    const ch = s[i];
    if (ch === '[') {
      i++;
      const elems = [parseUnion()];
      ws();
      while (s[i] === ',') {
        i++;
        elems.push(parseUnion());
        ws();
      }
      expect(']');
      if (elems.length > 1) return node({ t: 'tuple', items: elems });
      return arr(elems[0], parseQuant());
    }
    if (ch === "'") {
      const end = s.indexOf("'", i + 1);
      if (end < 0) fail('unclosed string literal');
      const v = s.slice(i + 1, end);
      i = end + 1;
      return lit(v);
    }
    if (/[-\d]/.test(ch)) {
      const m = s.slice(i).match(/^-?\d+(?:\.\d+)?/);
      if (!m) fail('bad number literal');
      i += m[0].length;
      return lit(Number(m[0]));
    }
    const m = s.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (!m) fail('unexpected character');
    const word = m[0];
    i += word.length;
    if (word === 'enum' || word === 're' || word === 'ref') {
      expect('(');
      const raw = rawUntilClose().trim();
      if (word === 'enum') return node({ t: 'enum', values: raw.split('|').map((v) => v.trim()) });
      if (word === 're') {
        if (!PATTERNS[raw]) fail(`unknown pattern re(${raw})`);
        return node({ t: 're', name: raw });
      }
      if (!REF_PATTERNS[raw]) fail(`unknown ref kind ref(${raw})`);
      return node({ t: 'ref', kind: raw });
    }
    if (word === 'int') {
      ws();
      if (s[i] === '[') {
        const r = s.slice(i).match(/^\[\s*(-?\d+)\s*\.\.\s*(-?\d+)\s*\]/);
        if (!r) fail('bad int range');
        i += r[0].length;
        return node({ t: 'int', min: Number(r[1]), max: Number(r[2]) });
      }
      return node({ t: 'int', min: -Infinity, max: Infinity });
    }
    if (word === 'true' || word === 'false') return lit(word === 'true');
    if (SCALARS.has(word)) return node({ t: word === 'de' || word === 'en' ? 'str' : word, lang: word === 'de' || word === 'en' ? word : null });
    if (/^[A-Z]/.test(word)) return named(word);
    return fail(`unknown type "${word}"`);
  }

  const out = parseUnion();
  ws();
  if (s[i] === '?') {
    i++;
    ws();
    if (i !== s.length) fail('"?" must end the expression');
    return opt(out);
  }
  if (i !== s.length) fail('trailing input');
  return out;
}

// ── describe (for messages) ─────────────────────────────────────────────────────────────
export function describe(n) {
  switch (n.t) {
    case 'str':
      return n.lang || 'str';
    case 'num':
    case 'bool':
    case 'date':
    case 'url':
    case 'null':
    case 'object':
      return n.t;
    case 'int':
      return Number.isFinite(n.min) ? `int[${n.min}..${n.max}]` : 'int';
    case 'lit':
      return JSON.stringify(n.value);
    case 'enum':
      return `enum(${n.values.join('|')})`;
    case 're':
      return `re(${n.name})`;
    case 'ref':
      return `ref(${n.kind})`;
    case 'named':
      return n.name;
    case 'arr': {
      const q = n.min === 1 && n.max === Infinity ? '' : n.min === 0 && n.max === Infinity ? '*' : n.min === n.max ? `{${n.min}}` : `{${n.min}..${n.max === Infinity ? '' : n.max}}`;
      return `[${describe(n.of)}]${q}`;
    }
    case 'tuple':
      return `[${n.items.map(describe).join(', ')}]`;
    case 'union':
      return n.branches.map(describe).join(' | ');
    case 'oneOfBy':
      return n.label || Object.keys(n.branches).map((k) => `${n.field}:'${k}'`).join(' | ');
    case 'map':
      return `{ [${describe(n.key)}]: ${describe(n.value)} }`;
    case 'obj':
      return '{…}';
    case 'ifHas':
      return `${describe(n.yes)} | ${describe(n.no)}`;
    case 'absent':
      return 'absent';
    default:
      return n.t;
  }
}

// ── checker ─────────────────────────────────────────────────────────────────────────────
function resolveNamed(n) {
  let cur = n;
  let guard = 0;
  while (cur.t === 'named') {
    const next = TYPES.get(cur.name);
    if (!next) throw new Error(`schema type ${cur.name} is not defined`);
    cur = next;
    if (++guard > 50) throw new Error(`schema type ${n.name} is circular`);
  }
  return cur;
}

const typeName = (v) => (v === null ? 'null' : Array.isArray(v) ? `array of ${v.length}` : typeof v === 'string' ? JSON.stringify(v.length > 60 ? `${v.slice(0, 57)}...` : v) : typeof v === 'object' ? 'object' : `${typeof v} ${JSON.stringify(v)}`);

function baseKind(n) {
  const r = resolveNamed(n);
  switch (r.t) {
    case 'str':
    case 'enum':
    case 're':
    case 'ref':
    case 'date':
    case 'url':
      return 'string';
    case 'num':
    case 'int':
      return 'number';
    case 'bool':
      return 'boolean';
    case 'null':
      return 'null';
    case 'arr':
    case 'tuple':
      return 'array';
    case 'obj':
    case 'map':
    case 'object':
    case 'oneOfBy':
    case 'ifHas':
      return 'object';
    case 'lit':
      return r.value === null ? 'null' : Array.isArray(r.value) ? 'array' : typeof r.value;
    case 'union':
      return 'mixed';
    default:
      return 'other';
  }
}
const kindOfValue = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  if (typeof a === 'object') {
    if (Array.isArray(b)) return false;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
  }
  return false;
}

const joinPath = (base, key) => (typeof key === 'number' ? `${base}[${key}]` : /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? `${base}.${key}` : `${base}[${JSON.stringify(key)}]`);

function isValidDate(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function isHttpsUrl(v) {
  if (typeof v !== 'string' || !v.startsWith('https://')) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && Boolean(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Check `value` against `schema`.
 * ctx: { index?: { has(kind, id) → true | false | undefined }, authored?: boolean (default true) }
 * Returns [{ path, message, rule, near }] — rule is 'SCH-01', 'REF-01' or 'KEY-01'.
 */
export function check(schema, value, ctx = {}) {
  const errors = [];
  const c = { index: ctx.index || null, authored: ctx.authored !== false };
  walk(toNode(schema), value, '$', c, errors, null);
  return errors;
}

function walk(n, v, path, ctx, errors, near) {
  const emit = (message, rule = 'SCH-01', p = path) => errors.push({ path: p, message, rule, near });
  switch (n.t) {
    case 'named':
      return walk(resolveNamed(n), v, path, ctx, errors, near);
    case 'str': {
      const label = n.lang ? `${n.lang} (non-empty ${n.lang === 'de' ? 'German' : 'English'} string)` : 'str (non-empty string)';
      if (typeof v !== 'string' || v.trim() === '') emit(`expected ${label}, got ${typeName(v)}`);
      return;
    }
    case 'num':
      if (typeof v !== 'number' || !Number.isFinite(v)) emit(`expected num, got ${typeName(v)}`);
      return;
    case 'int':
      if (!Number.isInteger(v)) emit(`expected ${describe(n)}, got ${typeName(v)}`);
      else if (v < n.min || v > n.max) emit(`expected ${describe(n)}, got ${v}`);
      return;
    case 'bool':
      if (typeof v !== 'boolean') emit(`expected bool, got ${typeName(v)}`);
      return;
    case 'date':
      if (!isValidDate(v)) emit(`expected date (YYYY-MM-DD, a real calendar day), got ${typeName(v)}`);
      return;
    case 'url':
      if (!isHttpsUrl(v)) emit(`expected url (https://…), got ${typeName(v)}`);
      return;
    case 'null':
      if (v !== null) emit(`expected null, got ${typeName(v)}`);
      return;
    case 'object':
      if (!isPlainObject(v)) emit(`expected object, got ${typeName(v)}`);
      return;
    case 'lit':
      if (!deepEqual(v, n.value)) emit(`expected ${JSON.stringify(n.value)}, got ${typeName(v)}`);
      return;
    case 'enum':
      if (typeof v !== 'string' || !n.values.includes(v)) emit(`expected one of ${n.values.join('|')}, got ${typeName(v)}`);
      return;
    case 're': {
      const re = PATTERNS[n.name];
      if (typeof v !== 'string' || !re.test(v)) {
        emit(`${typeName(v)} does not match re(${n.name})`, n.name === 'BANK_KEY' ? 'KEY-01' : 'SCH-01');
      }
      return;
    }
    case 'ref': {
      const re = REF_PATTERNS[n.kind];
      if (typeof v !== 'string' || !re.test(v)) {
        emit(`${typeName(v)} is not a well-formed ref(${n.kind})`, n.kind === 'bank' ? 'KEY-01' : 'SCH-01');
        return;
      }
      if (ctx.index) {
        const found = ctx.index.has(n.kind, v);
        if (found === false) emit(`ref(${n.kind}) "${v}" does not resolve`, 'REF-01');
      }
      return;
    }
    case 'arr': {
      if (!Array.isArray(v)) {
        emit(`expected ${describe(n)}, got ${typeName(v)}`);
        return;
      }
      if (v.length < n.min || v.length > n.max) {
        const want = n.min === n.max ? `${n.min}` : n.max === Infinity ? `at least ${n.min}` : `${n.min}..${n.max}`;
        emit(`expected ${want} item${n.min === 1 && n.max === 1 ? '' : 's'} (${describe(n)}), got ${v.length}`);
      }
      v.forEach((x, i) => walk(n.of, x, joinPath(path, i), ctx, errors, near));
      return;
    }
    case 'tuple': {
      if (!Array.isArray(v) || v.length !== n.items.length) {
        emit(`expected ${describe(n)}, got ${typeName(v)}`);
        return;
      }
      v.forEach((x, i) => walk(n.items[i], x, joinPath(path, i), ctx, errors, near));
      return;
    }
    case 'map': {
      if (!isPlainObject(v)) {
        emit(`expected ${describe(n)}, got ${typeName(v)}`);
        return;
      }
      const keys = Object.keys(v);
      if (keys.length < n.min) emit(`expected at least ${n.min} entr${n.min === 1 ? 'y' : 'ies'}, got ${keys.length}`);
      for (const k of keys) {
        const keyErrors = [];
        walk(n.key, k, path, ctx, keyErrors, near);
        for (const e of keyErrors) errors.push({ ...e, message: `key ${JSON.stringify(k)}: ${e.message}` });
        walk(n.value, v[k], joinPath(path, k), ctx, errors, near);
      }
      return;
    }
    case 'obj': {
      if (!isPlainObject(v)) {
        emit(`expected object, got ${typeName(v)}`);
        return;
      }
      const here = typeof v.id === 'string' && v.id ? v.id : near;
      const known = new Set();
      for (const f of n.fields) {
        known.add(f.key);
        const has = Object.prototype.hasOwnProperty.call(v, f.key);
        if (!has) {
          if (!f.optional) errors.push({ path, message: `missing required field "${f.key}"`, rule: 'SCH-01', near: here });
          continue;
        }
        if (f.node.t === 'absent') {
          errors.push({ path: joinPath(path, f.key), message: `"${f.key}" must be absent${f.node.why ? ` ${f.node.why}` : ''}`, rule: 'SCH-01', near: here });
          continue;
        }
        if (f.generated && ctx.authored) {
          errors.push({ path: joinPath(path, f.key), message: `"${f.key}" is generated by the compiler and must not be authored`, rule: 'SCH-01', near: here });
          continue;
        }
        walk(f.node, v[f.key], joinPath(path, f.key), ctx, errors, here);
      }
      for (const k of Object.keys(v)) {
        if (!known.has(k)) errors.push({ path: joinPath(path, k), message: `unknown key "${k}"`, rule: 'SCH-01', near: here });
      }
      if (n.refine) {
        n.refine(v, (rel, message, rule = 'SCH-01') => errors.push({ path: rel ? `${path}${rel.startsWith('[') ? '' : '.'}${rel}` : path, message, rule, near: here }), ctx);
      }
      return;
    }
    case 'oneOfBy': {
      if (!isPlainObject(v)) {
        emit(`expected object, got ${typeName(v)}`);
        return;
      }
      const tag = v[n.field];
      const branch = typeof tag === 'string' ? n.branches[tag] : undefined;
      if (!branch) {
        emit(`${n.field} must be one of ${Object.keys(n.branches).join('|')}, got ${typeName(tag)}`, 'SCH-01', joinPath(path, n.field));
        return;
      }
      walk(branch, v, path, ctx, errors, near);
      return;
    }
    case 'union':
      return walkUnion(n, v, path, ctx, errors, near);
    case 'ifHas':
      return walk(isPlainObject(v) && Object.prototype.hasOwnProperty.call(v, n.field) ? n.yes : n.no, v, path, ctx, errors, near);
    case 'absent':
      emit(`must be absent${n.why ? ` ${n.why}` : ''}`);
      return;
    case 'opt':
    case 'gen':
      return walk(n.of, v, path, ctx, errors, near);
    default:
      throw new Error(`unknown schema node ${n.t}`);
  }
}

function walkUnion(n, v, path, ctx, errors, near) {
  // A value that is well-formed for a ref branch is judged by that branch alone, so a
  // typo'd id ('lx.anrfu') cannot slip through a sibling `str` branch.
  for (const b of n.branches) {
    const r = resolveNamed(b);
    if (r.t === 'ref' && typeof v === 'string' && REF_PATTERNS[r.kind].test(v)) {
      walk(r, v, path, ctx, errors, near);
      return;
    }
  }
  const results = n.branches.map((b) => {
    const errs = [];
    walk(b, v, path, ctx, errs, near);
    return { b, errs };
  });
  if (results.some((r) => r.errs.length === 0)) return;
  const vk = kindOfValue(v);
  const sameKind = results.filter((r) => baseKind(r.b) === vk || baseKind(r.b) === 'mixed');
  if (sameKind.length === 0) {
    errors.push({ path, message: `expected ${describe(n)}, got ${typeName(v)}`, rule: 'SCH-01', near });
    return;
  }
  sameKind.sort((a, b) => a.errs.length - b.errs.length);
  const best = sameKind[0];
  // When every failing branch fails only at this node itself, name the whole union.
  if (sameKind.every((r) => r.errs.every((e) => e.path === path))) {
    const rule = best.errs.find((e) => e.rule !== 'SCH-01')?.rule || 'SCH-01';
    errors.push({ path, message: `expected ${describe(n)}, got ${typeName(v)}${best.errs.length === 1 ? ` (${best.errs[0].message})` : ''}`, rule, near });
    return;
  }
  errors.push(...best.errs);
}

/**
 * A deep copy of `value` without every key the schema marks absent() — e.g. a unit reduced to what
 * one stage of SCHEMA §8.1 may contain. Keys the schema does not know are kept (the check reports
 * them); values that do not fit the schema are copied unchanged.
 */
export function stripAbsent(schema, value) {
  const n = resolveNamed(toNode(schema));
  switch (n.t) {
    case 'opt':
    case 'gen':
      return stripAbsent(n.of, value);
    case 'arr':
      return Array.isArray(value) ? value.map((x) => stripAbsent(n.of, x)) : structuredClone(value);
    case 'tuple':
      return Array.isArray(value) ? value.map((x, i) => (i < n.items.length ? stripAbsent(n.items[i], x) : structuredClone(x))) : structuredClone(value);
    case 'map':
      return isPlainObject(value) ? Object.fromEntries(Object.entries(value).map(([k, x]) => [k, stripAbsent(n.value, x)])) : structuredClone(value);
    case 'oneOfBy': {
      const branch = isPlainObject(value) && typeof value[n.field] === 'string' ? n.branches[value[n.field]] : undefined;
      return branch ? stripAbsent(branch, value) : structuredClone(value);
    }
    case 'ifHas':
      return stripAbsent(isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, n.field) ? n.yes : n.no, value);
    case 'union': {
      const vk = kindOfValue(value);
      const b = n.branches.find((x) => baseKind(x) === vk);
      return b ? stripAbsent(b, value) : structuredClone(value);
    }
    case 'obj': {
      if (!isPlainObject(value)) return structuredClone(value);
      const out = {};
      const byKey = new Map(n.fields.map((f) => [f.key, f]));
      for (const [k, x] of Object.entries(value)) {
        const f = byKey.get(k);
        if (f && f.node.t === 'absent') continue;
        out[k] = f ? stripAbsent(f.node, x) : structuredClone(x);
      }
      return out;
    }
    default:
      return structuredClone(value);
  }
}

/** Throws when a named type used anywhere is not defined (a developer error, run in tests). */
export function assertTypesResolve() {
  const missing = new Set();
  const seen = new Set();
  const visit = (n) => {
    if (!n || seen.has(n)) return;
    seen.add(n);
    switch (n.t) {
      case 'named':
        if (!TYPES.has(n.name)) missing.add(n.name);
        else visit(TYPES.get(n.name));
        break;
      case 'arr':
      case 'opt':
      case 'gen':
        visit(n.of);
        break;
      case 'tuple':
        n.items.forEach(visit);
        break;
      case 'union':
        n.branches.forEach(visit);
        break;
      case 'oneOfBy':
        Object.values(n.branches).forEach(visit);
        break;
      case 'ifHas':
        visit(n.yes);
        visit(n.no);
        break;
      case 'map':
        visit(n.key);
        visit(n.value);
        break;
      case 'obj':
        n.fields.forEach((f) => visit(f.node));
        break;
      default:
        break;
    }
  };
  for (const n of TYPES.values()) visit(n);
  if (missing.size) throw new Error(`undefined schema types: ${[...missing].join(', ')}`);
}

/** Format an error the way check.mjs prints it: `file:path: RULE message (near id)`. */
export function formatError(file, e) {
  return `${file}:${e.path}: ${e.rule} ${e.message}${e.near ? ` (near ${e.near})` : ''}`;
}
