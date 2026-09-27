// ID-01 — ids unique and well-formed per SCHEMA §2; each child id starts with its parent id;
// a tombstoned id (ids.ledger.json) is never reused (BLUEPRINT §9.1).
//
// Exam texts live at step, slot or file level with ids STEP(-LANE)-tN / ASSESS(-LANE)-tN and their
// lines are TEXT-lNN (SCHEMA §2, §3.6). The draft shape kept texts inside a block with ids „t1" and
// lines BLOCK-t1-lNN; that shape is still read and reported once per file as an advisory.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { walkSteps, walkIds } from '../lib-validate/walk.mjs';
import { PATTERNS, parseUnitId, LANES } from '../lib-validate/ids.mjs';
import { arr, isObj, blocker, advisory } from '../lib-validate/helpers.mjs';

export const id = 'ID-01';
export const title = 'Ids well-formed, unique, children prefixed by their parent, no tombstone reused';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'S';

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LANE_RE = `(?:${LANES.join('|')})`;

/** The pattern an id must match at its place in a unit or lane pack (SCHEMA §2). */
function expectedPattern(entry, unitId, checkStepId) {
  const u = esc(unitId);
  const p = entry.parent ? esc(entry.parent) : null;
  switch (entry.kind) {
    case 'step': return new RegExp(`^${u}-ls${entry.index + 1}$`);
    case 'rm': return new RegExp(`^${u}-rm\\d{2}$`);
    case 'fact': return new RegExp(`^${u}-f\\d{2}$`);
    case 'fokus': return new RegExp(`^${u}-fk\\d$`);
    case 'asset': return new RegExp(`^${u}-a\\d{2}$`);
    case 'mo': return p ? new RegExp(`^${p}-mo$`) : new RegExp(`^${u}-start-mo$`);
    case 'block': return p ? new RegExp(`^${p}-${LANE_RE}-[a-z0-9]+$`) : new RegExp(`^${u}-ls[1-8]-${LANE_RE}-[a-z0-9]+$`);
    case 'text':
      if (entry.legacy) return null;
      return p ? new RegExp(`^${p}(?:-${LANE_RE})?-t\\d{1,2}$`) : new RegExp(`^${u}-ls[1-8](?:-${LANE_RE})?-t\\d{1,2}$`);
    case 'item':
      switch (entry.where) {
        case 'gist': return new RegExp(`^${u}-start-i01$`);
        case 'input': return new RegExp(`^${p}-i\\d{2}$`);
        case 'structured': return new RegExp(`^${p}-s\\d{2}$`);
        case 'pool': case 'cloze': return new RegExp(`^${p}-p\\d{2}$`);
        case 'reserve': return new RegExp(`^${p}-r\\d{2}$`);
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
        case 'exam': return p ? new RegExp(`^${p}-l\\d{2}$`) : null;
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
    for (const f of [join(base, 'src', 'data', 'course-v2', slot.level, 'ids.ledger.json'), join(base, 'content', 'course-v2', slot.level, '.build', 'ids.ledger.json')]) {
      if (!existsSync(f)) continue;
      try {
        read(JSON.parse(readFileSync(f, 'utf8')));
      } catch {
        // an unreadable ledger is the compiler's finding, not the validator's
      }
    }
  }
  out.delete(undefined);
  return out;
}

const KIND_PATTERN = (kind) => ({
  item: PATTERNS.item, block: PATTERNS.block, mo: PATTERNS.mo, rm: PATTERNS.rm, fact: PATTERNS.fact,
  fokus: PATTERNS.fokus, step: PATTERNS.STEP, text: PATTERNS.text, asset: PATTERNS.asset,
}[kind]);

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  const seen = new Map(); // id → first location (level-wide when the target is a level)
  const tombCache = new Map();
  for (const doc of docs) {
    const d = doc.data || {};
    if (doc.kind === 'unit') {
      if (!PATTERNS.UNIT.test(String(d.id))) {
        findings.push(blocker(doc, 'id', `unit id "${d.id}" does not match the UNIT pattern`, d.id));
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
    const owner = unitId || d.id || d.plateau || null;
    const checkStep = doc.kind === 'unit' ? [...walkSteps(doc)].find((s) => s.step?.kind === 'check')?.step?.id : null;
    if (!tombCache.has(doc.level)) tombCache.set(doc.level, tombstonesOf(ctx, ctx.levels.get(doc.level)));
    const tombs = tombCache.get(doc.level);
    let legacyTexts = 0;
    for (const entry of walkIds(doc)) {
      const where = entry.path;
      if (typeof entry.id !== 'string' || !entry.id) {
        findings.push(blocker(doc, where, `${entry.kind} without an id`));
        continue;
      }
      if (entry.kind === 'text' && entry.legacy) {
        legacyTexts += 1;
        continue; // draft shape: a block-internal text id („t1") is only unique within its block
      }
      const kp = KIND_PATTERN(entry.kind);
      if (kp && !kp.test(entry.id)) findings.push(blocker(doc, where, `${entry.kind} id "${entry.id}" is not well-formed (SCHEMA §2)`, entry.id));
      if (entry.kind === 'item' && /-g\d{2}$/.test(entry.id)) findings.push(blocker(doc, where, `"${entry.id}" is a generated-item id (-gNN); authored items never use it`, entry.id));
      if (unitId && (doc.kind === 'unit' || doc.kind === 'lanepack')) {
        if (!entry.id.startsWith(`${unitId}-`)) findings.push(blocker(doc, where, `"${entry.id}" does not start with its unit id ${unitId}`, entry.id));
        else {
          const re = expectedPattern(entry, unitId, checkStep);
          if (re && !re.test(entry.id)) {
            const slot = entry.kind === 'item' || entry.kind === 'line' ? `${entry.kind} in ${entry.where}` : entry.kind;
            findings.push(blocker(doc, where, `"${entry.id}" is not a well-placed ${slot} id (expected ${re.source.replace(/\\/g, '')})`, entry.id));
          }
        }
        if (entry.kind === 'block' && entry.block) {
          const b = entry.block;
          const tail = entry.parent ? entry.id.slice(entry.parent.length + 1) : '';
          const [laneSeg, teilSeg] = tail.split('-');
          if (entry.parent && b.lane && laneSeg !== b.lane) findings.push(blocker(doc, where, `block "${entry.id}" carries lane segment "${laneSeg}" but lane "${b.lane}"`, entry.id));
          const teil = String(b.template || '').split('.')[1];
          if (entry.parent && teil && teilSeg && teilSeg !== teil) findings.push(blocker(doc, where, `block "${entry.id}" ends in "${teilSeg}" but its template is ${b.template} (the last segment is the Teil id)`, entry.id));
        }
        if (doc.kind === 'lanepack' && (entry.kind === 'block' || entry.kind === 'text') && !entry.id.startsWith(`${unitId}-ls`)) {
          findings.push(blocker(doc, where, `lane-pack ${entry.kind} "${entry.id}" must sit in a Lernschritt of ${unitId}`, entry.id));
        }
      } else if (owner && !entry.id.startsWith(`${owner}-`) && entry.kind !== 'step') {
        findings.push(blocker(doc, where, `"${entry.id}" does not start with its document id ${owner}`, entry.id));
      }
      if (seen.has(entry.id)) {
        const first = seen.get(entry.id);
        findings.push(blocker(doc, where, `duplicate id "${entry.id}" (first at ${first.file} > ${first.path})`, entry.id));
      } else seen.set(entry.id, { file: doc.file, path: where });
      if (tombs.has(entry.id)) findings.push(blocker(doc, where, `id "${entry.id}" was removed earlier (tombstoned in ids.ledger.json) and may not be reused — give it a new id`, entry.id));
    }
    if (legacyTexts) findings.push(advisory(doc, null, `${legacyTexts} exam text(s) inside their block (draft shape); SCHEMA §3.6 puts ExamTexts at step level with ids STEP(-LANE)-tN and blocks refer to them by textRefs`, d.id || d.unit || null));
    // extras: file-scoped speaker ids
    for (const key of Object.keys(isObj(d.extras) ? d.extras : {})) {
      if (!/^x\.[a-z0-9-]+$/.test(key)) findings.push(blocker(doc, `extras.${key}`, `extra id "${key}" does not match x.<slug>`, key));
    }
    // Leitpunkt ids unique inside a task
    for (const e of walkIds(doc)) {
      if (e.kind !== 'block' || !e.block) continue;
      const refs = arr(e.block.textRefs);
      const dup = refs.filter((t, i) => refs.indexOf(t) !== i);
      if (dup.length) findings.push(blocker(doc, e.path.replace(/\.id$/, '.textRefs'), `textRefs repeat in block ${e.id}: ${[...new Set(dup)].join(', ')}`, e.id));
    }
  }
  if (![...tombCache.values()].some((s) => s.size)) notes.push('no tombstones recorded yet (ids.ledger.json absent or empty)');
  return { findings, notes };
}
