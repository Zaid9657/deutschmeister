// The validator's view of `content/course-v2/**` (SCHEMA §4–§10), loaded tolerantly.
//
// Content arrives piece by piece (registries first, then unit specs, then the S/I/T runs), so a
// missing file is never an error here: its slot stays empty and each rule decides whether it can
// run without it ("skipped: <reason>"). A file that exists but does not parse IS an error; it is
// recorded in `ctx.loadErrors` and reported by the runner as a blocker.
//
// Besides the directory layout the loader accepts BUNDLES: one JSON file holding several
// documents (the SCHEMA §15 fixture is one), recognised by `$schema` and, for the registries that
// carry none (text types, detectors, casts), by their keys.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename, dirname, sep } from 'node:path';
import { LEVELS, PATTERNS, parseUnitId, bandOfLevel } from './ids.mjs';

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const arr = (x) => (Array.isArray(x) ? x : []);

/** A fresh, empty context. */
export function emptyContext({ root = null, repoRoot = null, today = null } = {}) {
  return {
    root,
    repoRoot,
    today: today || new Date().toISOString().slice(0, 10),
    loadErrors: [],
    registries: {
      cando: null, // Map id → { item, file }
      candoBands: new Set(),
      spine: null, // { byId: Map, file }
      lanes: new Map(), // lane id → { data, file }
      templates: new Map(), // template id → { template, lane, teil, file }
      families: null, // Map
      rubrics: null, // Map
      levelProfiles: null, // Map level → profile
      textTypes: null, // Map
      detectors: null, // { list, byId, file }
      casts: null, // { members: Map, relations: [], files: [] }
      lemmas: null, // Map id → { entry, file }  (the global lemma registry, SCHEMA §4.8)
      voices: null, // Map voice → { data, file }  (registries/voices.json)
      style: null, // { data, file }  (registries/style.json)
    },
    levels: new Map(),
    stubs: new Map(), // ref kind → Set(ids): ids a fixture declares to exist in the full registries
    unclassified: [], // files the loader could not match to a kind (the schema checker reports them)
  };
}

/** The per-level slot, created on first use. */
export function levelSlot(ctx, level) {
  if (!ctx.levels.has(level)) {
    ctx.levels.set(level, {
      level,
      dir: ctx.root ? join(ctx.root, level) : null,
      course: null,
      lexicon: null, // { entries: [], file }
      ruleCards: null, // { cards: [], file }
      ledger: null,
      units: new Map(), // nr → doc
      lanePacks: [],
      plateaus: [],
      closing: [],
      mocks: [],
    });
  }
  return ctx.levels.get(level);
}

const rel = (ctx, file) => {
  const base = ctx.repoRoot || ctx.root;
  if (!file || !base) return file;
  const r = relative(base, file);
  return r.startsWith('..') ? file : r.split(sep).join('/');
};

function readJson(ctx, file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    ctx.loadErrors.push({ file: rel(ctx, file), message: `cannot read/parse JSON: ${e.message}` });
    return undefined;
  }
}

// ── ingestion: one JSON value into the context ────────────────────────────────────────────

function addCandos(ctx, data, file) {
  if (!ctx.registries.cando) ctx.registries.cando = new Map();
  if (data.band) ctx.registries.candoBands.add(String(data.band));
  for (const item of arr(data.items)) {
    if (isObj(item) && item.id) {
      ctx.registries.cando.set(item.id, { item, file });
      const b = String(item.id).split('.')[1];
      if (b) ctx.registries.candoBands.add(b);
    }
  }
}

function addSpinePoints(ctx, points, file) {
  if (!ctx.registries.spine) ctx.registries.spine = { byId: new Map(), file };
  for (const p of arr(points)) if (isObj(p) && p.id) ctx.registries.spine.byId.set(p.id, { point: p, file });
}

function addLane(ctx, data, file) {
  if (!isObj(data) || !data.id) return;
  const prev = ctx.registries.lanes.get(data.id);
  const merged = prev ? { ...prev.data, ...data, teile: { ...(prev.data.teile || {}), ...(data.teile || {}) } } : data;
  ctx.registries.lanes.set(data.id, { data: merged, file });
  for (const [teil, template] of Object.entries(merged.teile || {})) {
    if (!isObj(template)) continue;
    const id = template.id || `${data.id}.${teil}`;
    ctx.registries.templates.set(id, { template, lane: data.id, teil, file });
  }
}

function addTemplatesMap(ctx, map, file) {
  // a lane excerpt without its envelope: { h1: { id: 'ta2.h1', … } }
  for (const [teil, template] of Object.entries(map)) {
    if (!isObj(template) || typeof template.id !== 'string') continue;
    const lane = template.id.split('.')[0];
    const slot = ctx.registries.lanes.get(lane) || { data: { id: lane, teile: {} }, file };
    slot.data.teile = { ...(slot.data.teile || {}), [teil]: template };
    ctx.registries.lanes.set(lane, slot);
    ctx.registries.templates.set(template.id, { template, lane, teil, file });
  }
}

function addRubric(ctx, data, file) {
  if (!ctx.registries.rubrics) ctx.registries.rubrics = new Map();
  if (isObj(data) && data.id) ctx.registries.rubrics.set(data.id, { data, file });
}

function addLevelProfiles(ctx, list, file) {
  if (!ctx.registries.levelProfiles) ctx.registries.levelProfiles = new Map();
  for (const p of arr(list)) if (isObj(p) && p.level) ctx.registries.levelProfiles.set(p.level, { data: p, file });
}

function addTextTypes(ctx, list, file) {
  if (!ctx.registries.textTypes) ctx.registries.textTypes = new Map();
  for (const t of arr(list)) if (isObj(t) && t.id) ctx.registries.textTypes.set(t.id, { data: t, file });
}

function addFamilies(ctx, list, file) {
  if (!ctx.registries.families) ctx.registries.families = new Map();
  for (const f of arr(list)) if (isObj(f) && f.id) ctx.registries.families.set(f.id, { data: f, file });
}

export function addDetectors(ctx, list, file) {
  if (!ctx.registries.detectors) ctx.registries.detectors = { list: [], byId: new Map(), file };
  for (const d of arr(list)) {
    if (!isObj(d) || !d.id) continue;
    if (!ctx.registries.detectors.byId.has(d.id)) ctx.registries.detectors.list.push(d);
    else ctx.registries.detectors.list = ctx.registries.detectors.list.map((x) => (x.id === d.id ? d : x));
    ctx.registries.detectors.byId.set(d.id, d);
  }
}

function addCasts(ctx, data, file) {
  if (!ctx.registries.casts) ctx.registries.casts = { members: new Map(), relations: [], files: [] };
  ctx.registries.casts.files.push(file);
  for (const [id, m] of Object.entries(data.members || {})) ctx.registries.casts.members.set(id, { member: m, file });
  for (const r of arr(data.relations)) ctx.registries.casts.relations.push(r);
}

function addVoices(ctx, data, file) {
  if (!ctx.registries.voices) ctx.registries.voices = new Map();
  for (const [v, d] of Object.entries(data.voices || {})) ctx.registries.voices.set(v, { data: d, file });
}

function levelOfDoc(data, fallback) {
  if (data && PATTERNS.LEVEL.test(String(data.level || ''))) return data.level;
  const u = parseUnitId(data?.id) || parseUnitId(data?.unit);
  if (u) return u.level;
  const m = String(data?.id || data?.plateau || '').match(/^((?:a1|a2|b1|b2)\.[12])-/);
  if (m) return m[1];
  return fallback || null;
}

function addLexiconEntries(ctx, entries, file, levelHint) {
  const byLevel = new Map();
  for (const e of arr(entries)) {
    if (!isObj(e)) continue;
    const lv = parseUnitId(e.unit)?.level || levelHint;
    if (!lv) continue;
    if (!byLevel.has(lv)) byLevel.set(lv, []);
    byLevel.get(lv).push(e);
  }
  for (const [lv, list] of byLevel) {
    const slot = levelSlot(ctx, lv);
    if (!slot.lexicon) slot.lexicon = { entries: [], file };
    const ids = new Map(slot.lexicon.entries.map((e, i) => [e.id, i]));
    for (const e of list) {
      if (ids.has(e.id)) slot.lexicon.entries[ids.get(e.id)] = e;
      else slot.lexicon.entries.push(e);
    }
  }
}

function addRuleCards(ctx, cards, file, levelHint) {
  const lv = levelHint;
  if (!lv) return;
  const slot = levelSlot(ctx, lv);
  if (!slot.ruleCards) slot.ruleCards = { cards: [], file };
  const ids = new Map(slot.ruleCards.cards.map((c, i) => [c.id, i]));
  for (const c of arr(cards)) {
    if (!isObj(c)) continue;
    if (ids.has(c.id)) slot.ruleCards.cards[ids.get(c.id)] = c;
    else slot.ruleCards.cards.push(c);
  }
}

/** Put a unit / lane pack / plateau / closing / mock document into its level slot. */
export function addDoc(ctx, kind, data, file, { target = false } = {}) {
  const level = levelOfDoc(data, null);
  if (!level) return null;
  const slot = levelSlot(ctx, level);
  const doc = { kind, file, data, level, target };
  if (kind === 'unit') {
    const nr = typeof data.nr === 'number' ? data.nr : parseUnitId(data.id)?.nr;
    if (!nr) return null;
    doc.nr = nr;
    slot.units.set(nr, doc);
  } else if (kind === 'lanepack') {
    doc.nr = parseUnitId(data.unit)?.nr ?? null;
    slot.lanePacks = slot.lanePacks.filter((p) => !(p.data.unit === data.unit && p.data.lane === data.lane));
    slot.lanePacks.push(doc);
  } else if (kind === 'plateau' || kind === 'plateaulanepack') slot.plateaus.push(doc);
  else if (kind === 'closing') slot.closing.push(doc);
  else if (kind === 'mock') slot.mocks.push(doc);
  return doc;
}

const SCHEMA_KIND = (s) => {
  const m = typeof s === 'string' ? s.match(/^course-v2\/([a-z-]+)@\d+$/) : null;
  return m ? m[1] : null;
};

/**
 * Ingest one JSON value (a whole file or a part of a bundle). Returns the docs it added
 * (units, lane packs, plateaus, closing, mocks) so a caller can mark them as targets.
 */
export function ingest(ctx, value, file, { levelHint = null, key = null, depth = 0 } = {}) {
  const added = [];
  if (depth > 4 || value === null || typeof value !== 'object') return added;
  if (Array.isArray(value)) {
    const objs = value.filter(isObj);
    const ids = objs.map((o) => String(o.id || ''));
    if (objs.length && ids.every((i) => i.startsWith('lx.'))) addLexiconEntries(ctx, objs, file, levelHint);
    else if (objs.length && ids.every((i) => i.startsWith('rc.'))) addRuleCards(ctx, objs, file, levelHint || levelOfCards(objs, ctx));
    else if (objs.length && ids.every((i) => i.startsWith('g.'))) addSpinePoints(ctx, objs, file);
    else if (objs.length && ids.every((i) => i.startsWith('det.'))) addDetectors(ctx, objs, file);
    else if (objs.length && ids.every((i) => i.startsWith('cd.'))) addCandos(ctx, { items: objs }, file);
    else if (objs.length && ids.every((i) => i.startsWith('tt.'))) addTextTypes(ctx, objs, file);
    else if (objs.length && ids.every((i) => i.startsWith('fam.'))) addFamilies(ctx, objs, file);
    else if (key === 'levels' && objs.every((o) => o.level && o.skeleton)) addLevelProfiles(ctx, objs, file);
    else for (const o of value) added.push(...ingest(ctx, o, file, { levelHint, depth: depth + 1 }));
    return added;
  }
  const kind = SCHEMA_KIND(value.$schema);
  switch (kind) {
    case 'cando': addCandos(ctx, value, file); return added;
    case 'spine': addSpinePoints(ctx, value.points, file); return added;
    case 'lane': addLane(ctx, value, file); return added;
    case 'families': addFamilies(ctx, value.families, file); return added;
    case 'rubric': addRubric(ctx, value, file); return added;
    case 'levels': addLevelProfiles(ctx, value.levels, file); return added;
    case 'texttypes': case 'text-types': addTextTypes(ctx, value.types, file); return added;
    case 'detectors': addDetectors(ctx, value.detectors, file); return added;
    case 'casts': addCasts(ctx, value, file); return added;
    case 'course': {
      const lv = levelOfDoc(value, levelHint);
      if (lv) levelSlot(ctx, lv).course = { data: value, file };
      return added;
    }
    case 'lexicon': addLexiconEntries(ctx, value.entries, file, levelOfDoc(value, levelHint)); return added;
    case 'rulecards': addRuleCards(ctx, value.cards, file, levelOfDoc(value, levelHint)); return added;
    case 'stubs':
      for (const [k, ids] of Object.entries(value.ids || {})) {
        if (!ctx.stubs.has(k)) ctx.stubs.set(k, new Set());
        for (const id of arr(ids)) if (typeof id === 'string') ctx.stubs.get(k).add(id);
      }
      return added;
    case 'anchor': case 'qa':
      return added;
    case 'lemmas':
      if (!ctx.registries.lemmas) ctx.registries.lemmas = new Map();
      for (const [id, entry] of Object.entries(value.lemmas || {})) ctx.registries.lemmas.set(id, { entry, file });
      return added;
    case 'voices':
      addVoices(ctx, value, file);
      return added;
    case 'style':
      ctx.registries.style = { data: value, file };
      return added;
    case 'unit': case 'lanepack': case 'plateau': case 'plateaulanepack': case 'closing': case 'mockmodule': {
      const doc = addDoc(ctx, kind === 'mockmodule' ? 'mock' : kind, value, file);
      if (doc) added.push(doc);
      return added;
    }
    default: break;
  }
  // registries without $schema, recognised by shape
  if (Array.isArray(value.types) && value.types.every((t) => isObj(t) && String(t.id || '').startsWith('tt.'))) {
    addTextTypes(ctx, value.types, file);
    return added;
  }
  if (Array.isArray(value.detectors)) {
    addDetectors(ctx, value.detectors, file);
    return added;
  }
  if (isObj(value.members) && Object.keys(value.members).every((k) => k.startsWith('cast.'))) {
    addCasts(ctx, value, file);
    return added;
  }
  if (Array.isArray(value.points) && value.points.every((p) => isObj(p) && String(p.id || '').startsWith('g.'))) {
    addSpinePoints(ctx, value.points, file);
    return added;
  }
  if (typeof value.id === 'string' && PATTERNS.lane.test(value.id) && isObj(value.teile)) {
    addLane(ctx, value, file);
    return added;
  }
  if (typeof value.id === 'string' && PATTERNS.UNIT.test(value.id) && (value.spec || value.steps || value.check)) {
    const doc = addDoc(ctx, 'unit', value, file);
    if (doc) added.push(doc);
    return added;
  }
  if (typeof value.id === 'string' && value.id.startsWith('g.') && value.intro) {
    addSpinePoints(ctx, [value], file);
    return added;
  }
  if (typeof value.id === 'string' && value.id.startsWith('rc.') && value.spine) {
    addRuleCards(ctx, [value], file, levelHint);
    return added;
  }
  if (value.level && value.skeleton && value.steps) {
    addLevelProfiles(ctx, [value], file);
    return added;
  }
  const values = Object.values(value);
  if (values.length && values.every((v) => isObj(v) && typeof v.id === 'string' && PATTERNS.template.test(v.id))) {
    addTemplatesMap(ctx, value, file);
    return added;
  }
  if (typeof value.unit === 'string' && typeof value.lane === 'string' && isObj(value.slots)) {
    const doc = addDoc(ctx, 'lanepack', value, file);
    if (doc) added.push(doc);
    return added;
  }
  // a bundle: recurse into its members, carrying the bundle's level as a hint
  const hint = levelOfDoc(value, levelHint);
  for (const [k, v] of Object.entries(value)) {
    if (k === '$schema') continue;
    added.push(...ingest(ctx, v, file, { levelHint: hint, key: k, depth: depth + 1 }));
  }
  return added;
}

function levelOfCards(cards, ctx) {
  // a rule card carries no level; a bundle may. Fall back to the only level present.
  for (const c of cards) {
    const m = String(c.id || '').match(/^rc\.((?:a1|a2|b1|b2)-[12])-/);
    if (m) return m[1].replace('-', '.');
  }
  return ctx.levels.size === 1 ? [...ctx.levels.keys()][0] : null;
}

// ── loading from disk ─────────────────────────────────────────────────────────────────────

const within = (p, dir) => p === dir || p.startsWith(dir + sep);

/**
 * The root a file belongs to (the rule of scripts/course-v2/lib/tree.mjs): a fixtures tree is its
 * own world; everything else under content/course-v2 shares one root with the fixtures excluded.
 */
export function rootFor(file, contentRoot) {
  const fixtures = join(contentRoot, 'fixtures');
  if (within(file, fixtures)) return { root: fixtures, exclude: [] };
  if (within(file, contentRoot)) return { root: contentRoot, exclude: [fixtures] };
  return { root: contentRoot, exclude: [fixtures], outside: true };
}

function listJsonDeepExcluding(dir, exclude) {
  if (!existsSync(dir)) return [];
  const out = [];
  const visit = (d) => {
    if (exclude.some((x) => within(d, x))) return;
    for (const f of readdirSync(d).sort()) {
      const p = join(d, f);
      // derived artefacts (.build/) and pipeline results (qa/, anchors/) are not content to validate
      if (statSync(p).isDirectory()) {
        if (f === '.build' || f === 'qa' || f === 'anchors' || f === 'node_modules') continue;
        visit(p);
      } else if (f.endsWith('.json')) out.push(p);
    }
  };
  visit(dir);
  return out;
}

/** Classify and ingest one file of a content tree. Returns the docs it added. */
function ingestFile(ctx, file) {
  const data = readJson(ctx, file);
  if (data === undefined) return [];
  const r = rel(ctx, file);
  const base = basename(file);
  const parent = basename(dirname(file));
  if (isObj(data) && !Object.prototype.hasOwnProperty.call(data, '$schema')) {
    if (base === 'text-types.json') { addTextTypes(ctx, Array.isArray(data) ? data : data.types, r); return []; }
    if (base === 'detectors.json') { addDetectors(ctx, data.detectors, r); return []; }
    if (parent === 'casts') { addCasts(ctx, data, r); return []; }
    if (base === 'voices.json') { addVoices(ctx, data, r); return []; }
    if (base === 'style.json') { ctx.registries.style = { data, file: r }; return []; }
    if (base === 'lemmas.json') {
      if (!ctx.registries.lemmas) ctx.registries.lemmas = new Map();
      for (const [id, entry] of Object.entries(data.lemmas || {})) ctx.registries.lemmas.set(id, { entry, file: r });
      return [];
    }
    if (base === 'ids.ledger.json') {
      const lv = PATTERNS.LEVEL.test(parent) ? parent : levelOfDoc(data, null);
      if (lv) levelSlot(ctx, lv).ledger = { data, file: r };
      return [];
    }
  }
  if (base === 'ids.ledger.json') {
    const lv = levelOfDoc(data, PATTERNS.LEVEL.test(parent) ? parent : null);
    if (lv) levelSlot(ctx, lv).ledger = { data, file: r };
    return [];
  }
  // a unit file under <level>/units/ may rely on its directory for the level
  const levelHint = PATTERNS.LEVEL.test(basename(dirname(dirname(file)))) ? basename(dirname(dirname(file)))
    : PATTERNS.LEVEL.test(parent) ? parent : null;
  if (isObj(data) && data.$schema === 'course-v2/unit@1' && !data.level && levelHint) data.level = levelHint;
  const before = ctx.unclassified.length;
  const docs = ingest(ctx, data, r, { levelHint });
  if (!docs.length && isObj(data) && !data.$schema && ctx.unclassified.length === before && !looksLikeRegistry(data)) {
    ctx.unclassified.push(r);
  }
  return docs;
}

const looksLikeRegistry = (d) => Boolean(d.types || d.detectors || d.members || d.points || d.teile || d.entries || d.cards);

/** Load every JSON file under `root` (minus `exclude`) into a fresh context. */
export function loadContext({ root, exclude = [], repoRoot = null, today = null } = {}) {
  const ctx = emptyContext({ root, repoRoot, today });
  if (!root || !existsSync(root)) return ctx;
  for (const f of listJsonDeepExcluding(root, exclude)) ingestFile(ctx, f);
  return ctx;
}

/**
 * Load the context a file belongs to and mark the file's documents as targets. A file outside
 * content/course-v2 (a bundle) is ingested on top of the content tree; its documents override
 * same-id ones.
 */
export function loadForFile(file, { contentRoot, repoRoot = null, today = null } = {}) {
  const { root, exclude, outside } = rootFor(file, contentRoot);
  const ctx = loadContext({ root, exclude, repoRoot, today });
  const r = rel(ctx, file);
  let targets = [];
  if (!outside) {
    for (const slot of ctx.levels.values()) {
      for (const doc of docsOfLevel(slot)) if (doc.file === r) targets.push(doc);
    }
  } else {
    targets = ingestFile(ctx, file);
  }
  for (const d of targets) d.target = true;
  return { ctx, targets, root };
}

// ── lookups used by the rules ─────────────────────────────────────────────────────────────

/** All docs of a level slot. */
export function docsOfLevel(slot) {
  return [...[...slot.units.values()].sort((a, b) => a.nr - b.nr), ...slot.lanePacks, ...slot.plateaus, ...slot.closing, ...slot.mocks];
}

/** The unit doc for a unit id, or null. */
export function unitDoc(ctx, unitId) {
  const p = parseUnitId(unitId);
  if (!p) return null;
  return ctx.levels.get(p.level)?.units.get(p.nr) || null;
}

/** The level profile (registry) or null. */
export const levelProfile = (ctx, level) => ctx.registries.levelProfiles?.get(level)?.data || null;

/** Every lexicon entry of `level` and the levels before it, in course order. */
export function cumulativeLexicon(ctx, level) {
  const out = [];
  const idx = LEVELS.indexOf(level);
  for (let i = 0; i <= idx; i += 1) {
    const slot = ctx.levels.get(LEVELS[i]);
    if (slot?.lexicon) out.push(...slot.lexicon.entries);
  }
  return out;
}

/** Every lexicon entry of every loaded level (the detectors want verb forms whenever taught). */
export function allLexicon(ctx) {
  const out = [];
  for (const level of LEVELS) {
    const slot = ctx.levels.get(level);
    if (slot?.lexicon) out.push(...slot.lexicon.entries);
  }
  return out;
}

/** The lane of a band in the lean launch (orchestrator decision 2026-09-27). */
export const LEAN_PRIMARY_LANE = { a1: 'sd1', a2: 'ga2', b1: 'tb1', b2: 'tb2' };

/** The live lanes of a level: course.json lanes.live, else the lean primary lane. */
export function liveLanes(ctx, level) {
  const course = ctx.levels.get(level)?.course?.data;
  const live = arr(course?.lanes?.live);
  if (live.length) return live;
  if (course?.lanes?.primary) return [course.lanes.primary];
  return [LEAN_PRIMARY_LANE[bandOfLevel(level)]].filter(Boolean);
}

/** The primary lane of a level. */
export function primaryLane(ctx, level) {
  return ctx.levels.get(level)?.course?.data?.lanes?.primary || LEAN_PRIMARY_LANE[bandOfLevel(level)] || null;
}

export { rel as relPath };
