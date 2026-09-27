// ID-01 — ids unique and well-formed per SCHEMA §2; each child id starts with its parent id;
// a tombstoned id (ids.ledger.json) is never reused (BLUEPRINT §9.1).

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { walkSteps, walkIds } from '../lib-validate/walk.mjs';
import { PATTERNS, parseUnitId } from '../lib-validate/ids.mjs';
import { arr, blocker, advisory } from '../lib-validate/helpers.mjs';

export const id = 'ID-01';
export const title = 'Ids well-formed, unique, children prefixed by their parent, no tombstone reused';
export const type = 'hard';
export const scope = 'unit';

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The pattern an id must match at its place in a unit (SCHEMA §2). */
function expectedPattern(entry, unitId, checkStepId) {
  const u = esc(unitId);
  const p = entry.parent ? esc(entry.parent) : null;
  switch (entry.kind) {
    case 'step': return new RegExp(`^${u}-ls${entry.index + 1}$`);
    case 'rm': return new RegExp(`^${u}-rm\\d{2}$`);
    case 'fact': return new RegExp(`^${u}-f\\d{2}$`);
    case 'fokus': return new RegExp(`^${u}-fk\\d$`);
    case 'mo': return p ? new RegExp(`^${p}-mo$`) : new RegExp(`^${u}-start-mo$`);
    case 'block': return p ? new RegExp(`^${p}-[a-z0-9]+-[a-z0-9]+$`) : new RegExp(`^${u}-ls\\d-[a-z0-9]+-[a-z0-9]+$`);
    case 'item':
      switch (entry.where) {
        case 'gist': return new RegExp(`^${u}-start-i01$`);
        case 'input': return new RegExp(`^${p}-i\\d{2}$`);
        case 'structured': return new RegExp(`^${p}-s\\d{2}$`);
        case 'pool': case 'cloze': return new RegExp(`^${p}-p\\d{2}$`);
        case 'perception': return new RegExp(`^${p}-x\\d{2}$`);
        case 'check': return new RegExp(`^${u}-c\\d{2}$`);
        case 'proof': return new RegExp(`^${u}-q\\d{2}$`);
        case 'exam': return new RegExp(`^${p}-\\d{2}$`);
        default: return null;
      }
    case 'line':
      switch (entry.where) {
        case 'folge': return new RegExp(`^${u}-start-l\\d{2}$`);
        case 'input': return new RegExp(`^${p}-l\\d{2}$`);
        case 'check': return checkStepId ? new RegExp(`^${esc(checkStepId)}-l\\d{2}$`) : new RegExp(`^${u}-ls[1-8]-l\\d{2}$`);
        case 'exam': return entry.textId ? new RegExp(`^${p}-${esc(entry.textId)}-l\\d{2}$`) : new RegExp(`^${p}-t\\d+-l\\d{2}$`);
        default: return null;
      }
    default: return null;
  }
}

/** Tombstones of a level: content ledger or the compiled one (src/data/course-v2/<level>/ids.ledger.json). */
function tombstonesOf(ctx, slot) {
  const out = new Set();
  const read = (data) => {
    const t = data?.tombstones;
    if (Array.isArray(t)) t.forEach((x) => out.add(typeof x === 'string' ? x : x?.id));
    else if (t && typeof t === 'object') Object.keys(t).forEach((k) => out.add(k));
  };
  if (slot?.ledger) read(slot.ledger.data);
  const base = ctx.repoRoot || null;
  if (base && slot) {
    const f = join(base, 'src', 'data', 'course-v2', slot.level, 'ids.ledger.json');
    if (existsSync(f)) {
      try {
        read(JSON.parse(readFileSync(f, 'utf8')));
      } catch {
        // an unreadable compiled ledger is the compiler's error, not ours
      }
    }
  }
  out.delete(undefined);
  return out;
}

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  const seen = new Map(); // id → first location (level-wide when the target is a level)
  const tombCache = new Map();

  for (const doc of docs) {
    const d = doc.data || {};
    if (doc.kind === 'unit') {
      if (!PATTERNS.UNIT.test(String(d.id))) {
        findings.push(blocker(doc, 'id', `unit id "${d.id}" does not match ${PATTERNS.UNIT}`, d.id));
        continue;
      }
      const u = parseUnitId(d.id);
      if (d.level && u.level !== d.level) findings.push(blocker(doc, 'level', `unit ${d.id} is filed under level ${d.level}`, d.id));
      if (typeof d.nr === 'number' && u.nr !== d.nr) findings.push(blocker(doc, 'nr', `unit ${d.id} carries nr ${d.nr}`, d.id));
      if (typeof d.etappe === 'number' && d.etappe !== Math.ceil(u.nr / 3)) findings.push(blocker(doc, 'etappe', `unit ${u.nr} belongs to Etappe ${Math.ceil(u.nr / 3)}, not ${d.etappe}`, d.id));
      const m = String(doc.file || '').match(/\/u(\d\d)\.json$/);
      if (m && Number(m[1]) !== u.nr && /\/units\//.test(doc.file)) findings.push(blocker(doc, 'id', `file u${m[1]}.json holds unit ${d.id}`, d.id));
    }
    const unitId = doc.kind === 'unit' ? d.id : doc.kind === 'lanepack' ? d.unit : null;
    const checkStep = doc.kind === 'unit' ? [...walkSteps(doc)].find((s) => s.step?.kind === 'check')?.step?.id : null;
    const owner = unitId || d.id || null;
    if (!tombCache.has(doc.level)) tombCache.set(doc.level, tombstonesOf(ctx, ctx.levels.get(doc.level)));
    const tombs = tombCache.get(doc.level);
    const local = seen;
    for (const entry of walkIds(doc)) {
      const where = entry.path;
      if (typeof entry.id !== 'string' || !entry.id) {
        findings.push(blocker(doc, where, `${entry.kind} without an id`));
        continue;
      }
      // well-formed per SCHEMA §2
      const kindPattern = { item: PATTERNS.item, line: PATTERNS.line, block: PATTERNS.block, mo: PATTERNS.mo, rm: PATTERNS.rm, fact: PATTERNS.fact, fokus: PATTERNS.fokus, step: PATTERNS.STEP }[entry.kind];
      if (kindPattern && !kindPattern.test(entry.id)) {
        findings.push(blocker(doc, where, `${entry.kind} id "${entry.id}" is not well-formed (SCHEMA §2)`, entry.id));
      }
      // generated ids are the compiler's
      if (entry.kind === 'item' && /-g\d{2}$/.test(entry.id)) {
        findings.push(blocker(doc, where, `"${entry.id}" is a generated-item id (-gNN); authored items never use it`, entry.id));
      }
      // child starts with parent / sits in its slot
      if (unitId && (doc.kind === 'unit' || doc.kind === 'lanepack')) {
        if (!entry.id.startsWith(`${unitId}-`)) {
          findings.push(blocker(doc, where, `"${entry.id}" does not start with its unit id ${unitId}`, entry.id));
        } else {
          const re = expectedPattern(entry, unitId, checkStep);
          if (re && !re.test(entry.id)) {
            const slot = entry.kind === 'item' || entry.kind === 'line' ? `${entry.kind} in ${entry.where}` : entry.kind;
            findings.push(blocker(doc, where, `"${entry.id}" is not a well-placed ${slot} id (expected ${re.source.replace(/\\/g, '')})`, entry.id));
          }
        }
        if (entry.kind === 'block' && entry.block) {
          const b = entry.block;
          const tail = entry.id.slice((entry.parent || '').length + 1);
          const [laneSeg, teilSeg] = tail.split('-');
          if (entry.parent && b.lane && laneSeg !== b.lane) findings.push(blocker(doc, where, `block "${entry.id}" carries lane segment "${laneSeg}" but lane "${b.lane}"`, entry.id));
          const teil = String(b.template || '').split('.')[1];
          if (entry.parent && teil && teilSeg && teilSeg !== teil) findings.push(advisory(doc, where, `block "${entry.id}" names Teil "${teilSeg}" but its template is ${b.template}`, entry.id));
        }
        if (doc.kind === 'lanepack' && entry.kind === 'block' && !entry.id.startsWith(`${unitId}-ls`)) {
          findings.push(blocker(doc, where, `lane-pack block "${entry.id}" must sit in a Lernschritt of ${unitId}`, entry.id));
        }
      } else if (owner && !entry.id.startsWith(`${owner}-`) && entry.kind !== 'step') {
        findings.push(blocker(doc, where, `"${entry.id}" does not start with its document id ${owner}`, entry.id));
      }
      // uniqueness
      const key = entry.id;
      if (local.has(key)) {
        const first = local.get(key);
        findings.push(blocker(doc, where, `duplicate id "${key}" (first at ${first.file} > ${first.path})`, key));
      } else local.set(key, { file: doc.file, path: where });
      // ledger
      if (tombs.has(key)) findings.push(blocker(doc, where, `id "${key}" was removed earlier (tombstoned in ids.ledger.json) and may not be reused — give it a new id`, key));
    }
    // ids unique inside a block's texts and a task's Leitpunkte
    for (const e of walkIds(doc)) {
      if (e.kind !== 'block' || !e.block) continue;
      const tids = arr(e.block.texts).map((t) => t?.id);
      const dup = tids.filter((t, i) => t && tids.indexOf(t) !== i);
      if (dup.length) findings.push(blocker(doc, e.path.replace(/\.id$/, '.texts'), `text ids repeat in block ${e.id}: ${[...new Set(dup)].join(', ')}`, e.id));
    }
  }
  if (!tombCache.size || [...tombCache.values()].every((s) => s.size === 0)) notes.push('no tombstones recorded yet (ids.ledger.json absent or empty)');
  return { findings, notes };
}
