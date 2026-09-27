// The reference index: which ids exist, per ref kind (the resolution half of REF-01).
//
// A kind counts as LOADED once any file that defines ids of that kind has been indexed. A ref
// to a loaded kind that is not in the index fails REF-01; a ref to a kind with no file loaded
// yet (a registry not authored so far) is only checked for its format — `has()` returns
// undefined, and the checker reports nothing.
import { PATTERNS } from './ids.mjs';

// file kind → the ref kinds it defines (even when it defines zero ids of that kind)
const DEFINES = {
  cando: ['cando'],
  spine: ['spine'],
  lane: ['lane', 'template'],
  families: ['family'],
  rubric: ['rubric'],
  texttypes: ['texttype'],
  detectors: ['detector'],
  casts: ['cast'],
  course: ['plateau'],
  lexicon: ['lexicon'],
  rulecards: ['rulecard'],
  unit: ['unit', 'item', 'line', 'fact', 'fokus', 'bank'],
  lanepack: ['item', 'line', 'bank'],
  plateau: ['plateau', 'item', 'line', 'bank'],
  closing: ['item', 'line', 'bank'],
  mockmodule: ['item', 'line', 'bank'],
};

export function createIndex() {
  const sets = new Map();
  const loaded = new Set();
  return {
    sets,
    loaded,
    markLoaded(kind) {
      loaded.add(kind);
      if (!sets.has(kind)) sets.set(kind, new Set());
    },
    add(kind, id) {
      this.markLoaded(kind);
      sets.get(kind).add(id);
    },
    /** true / false, or undefined when no file of that kind is loaded. */
    has(kind, id) {
      if (!loaded.has(kind)) return undefined;
      return sets.get(kind).has(id);
    },
  };
}

/** Walk a content tree collecting nested ids (items, lines, facts, fokus, bank keys). */
function collectNested(index, node) {
  const visit = (x) => {
    if (Array.isArray(x)) {
      x.forEach(visit);
      return;
    }
    if (!x || typeof x !== 'object') return;
    if (typeof x.id === 'string') {
      if (typeof x.type === 'string' && typeof x.role === 'string' && PATTERNS.item.test(x.id)) index.add('item', x.id);
      else if (typeof x.speaker === 'string' && PATTERNS.line.test(x.id)) index.add('line', x.id);
      else if (typeof x.claimDe === 'string' && PATTERNS.fact.test(x.id)) index.add('fact', x.id);
      else if (typeof x.bodyDe === 'string' && PATTERNS.fokus.test(x.id)) index.add('fokus', x.id);
    }
    if (typeof x.bankKey === 'string') index.add('bank', x.bankKey);
    for (const v of Object.values(x)) visit(v);
  };
  visit(node);
}

/** Add one loaded file ({ doc, kind }) to the index. */
export function indexDocument(index, { doc, kind }) {
  if (!doc || !kind) return;
  for (const k of DEFINES[kind] || []) index.markLoaded(k);
  const each = (arr, fn) => Array.isArray(arr) && arr.forEach((x) => x && fn(x));
  switch (kind) {
    case 'cando':
      each(doc.items, (x) => typeof x.id === 'string' && index.add('cando', x.id));
      break;
    case 'spine':
      each(doc.points, (x) => typeof x.id === 'string' && index.add('spine', x.id));
      break;
    case 'lane':
      if (typeof doc.id === 'string') index.add('lane', doc.id);
      if (doc.teile && typeof doc.teile === 'object') {
        for (const t of Object.values(doc.teile)) if (t && typeof t.id === 'string') index.add('template', t.id);
      }
      break;
    case 'families':
      each(doc.families, (x) => typeof x.id === 'string' && index.add('family', x.id));
      break;
    case 'rubric':
      if (typeof doc.id === 'string') index.add('rubric', doc.id);
      break;
    case 'texttypes':
      each(doc.types, (x) => typeof x.id === 'string' && index.add('texttype', x.id));
      break;
    case 'detectors':
      each(doc.detectors, (x) => typeof x.id === 'string' && index.add('detector', x.id));
      break;
    case 'casts':
      if (doc.members && typeof doc.members === 'object') for (const id of Object.keys(doc.members)) index.add('cast', id);
      break;
    case 'course':
      // a course declares its Plateaus; closedBy resolves against the declaration
      each(doc.plateaus, (p) => typeof p === 'string' && PATTERNS.plateau.test(p) && index.add('plateau', p));
      break;
    case 'lexicon':
      each(doc.entries, (x) => typeof x.id === 'string' && index.add('lexicon', x.id));
      break;
    case 'rulecards':
      each(doc.cards, (x) => typeof x.id === 'string' && index.add('rulecard', x.id));
      break;
    case 'unit':
      if (typeof doc.id === 'string') index.add('unit', doc.id);
      collectNested(index, doc);
      break;
    case 'plateau':
      if (typeof doc.id === 'string') index.add('plateau', doc.id);
      collectNested(index, doc);
      break;
    case 'lanepack':
    case 'closing':
    case 'mockmodule':
      collectNested(index, doc);
      break;
    case 'stubs':
      if (doc.ids && typeof doc.ids === 'object') {
        for (const [k, ids] of Object.entries(doc.ids)) {
          index.markLoaded(k);
          if (Array.isArray(ids)) ids.forEach((id) => typeof id === 'string' && index.add(k, id));
        }
      }
      break;
    default:
      break;
  }
}

/** Build an index over loaded files ([{ doc, kind }]). */
export function buildIndex(loadedFiles) {
  const index = createIndex();
  for (const f of loadedFiles) indexDocument(index, f);
  return index;
}
