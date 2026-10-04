// REF-01 — every can-do, spine point, lemma, Teil template, rubric profile, rule card, cast member,
// text type, detector, fokus and fact id referenced anywhere resolves (BLUEPRINT §9.1, SCHEMA §0.2).
//
// A reference of a kind whose registry is not authored yet cannot be resolved; it is counted and
// named in a note, never failed (content arrives piece by piece). A reference to a registry that
// exists and lacks the id is a blocker. A fixture tree may declare ids of the full registries it
// does not excerpt in a `course-v2/stubs@1` file; those resolve.

import { walkSteps, walkBlocks, walkTasks, walkMicroOutputs, walkItems, walkLines, walkExamTexts, speakingParts } from '../lib-validate/walk.mjs';
import { unitDoc } from '../lib-validate/context.mjs';
import { LEVELS, PATTERNS, parseUnitId, bandOfLevel } from '../lib-validate/ids.mjs';
import { arr, isObj, blocker, advisory, list } from '../lib-validate/helpers.mjs';

export const id = 'REF-01';
export const title = 'Every referenced id resolves in its registry';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'spec';

const SPEAKER_ENUM = new Set(['ansage', 'radio', 'durchsage', 'pruefer']);

/** Resolver over the context: 'yes' | 'no' | 'unknown' (registry not authored yet). */
export function makeResolver(ctx) {
  const stub = (kind, ref) => ctx.stubs.get(kind)?.has(ref) || false;
  const stubLoaded = (kind) => ctx.stubs.has(kind);
  const R = ctx.registries;
  const yesNo = (has, loaded) => (has ? 'yes' : loaded ? 'no' : 'unknown');
  const lexiconLevels = (level) => LEVELS.slice(0, LEVELS.indexOf(level) + 1);
  return {
    cando: (ref) => {
      const band = String(ref).split('.')[1];
      return yesNo(R.cando?.has(ref) || stub('cando', ref), R.candoBands.has(band) || stubLoaded('cando'));
    },
    spine: (ref) => yesNo(R.spine?.byId.has(ref) || stub('spine', ref), Boolean(R.spine) || stubLoaded('spine')),
    template: (ref) => {
      const lane = String(ref).split('.')[0];
      return yesNo(R.templates.has(ref) || stub('template', ref), R.lanes.has(lane) || stubLoaded('template'));
    },
    lane: (ref) => yesNo(R.lanes.has(ref) || stub('lane', ref), R.lanes.size > 0 || stubLoaded('lane')),
    rubric: (ref) => yesNo(R.rubrics?.has(ref) || stub('rubric', ref), Boolean(R.rubrics) || stubLoaded('rubric')),
    cast: (ref) => yesNo(R.casts?.members.has(ref) || stub('cast', ref), Boolean(R.casts) || stubLoaded('cast')),
    texttype: (ref) => yesNo(R.textTypes?.has(ref) || stub('texttype', ref), Boolean(R.textTypes) || stubLoaded('texttype')),
    detector: (ref) => yesNo(R.detectors?.byId.has(ref) || stub('detector', ref), Boolean(R.detectors) || stubLoaded('detector')),
    voice: (ref) => yesNo(R.voices?.has(ref) || stub('voice', ref), Boolean(R.voices) || stubLoaded('voice')),
    family: (ref) => yesNo(R.families?.has(ref) || stub('family', ref), Boolean(R.families) || stubLoaded('family')),
    rulecard: (ref, level) => {
      const levels = lexiconLevels(level);
      const has = levels.some((l) => ctx.levels.get(l)?.ruleCards?.cards.some((c) => c.id === ref)) || stub('rulecard', ref);
      const loaded = Boolean(ctx.levels.get(level)?.ruleCards) || stubLoaded('rulecard');
      return yesNo(has, loaded);
    },
    lexicon: (ref, level) => {
      if (R.lemmas) return yesNo(R.lemmas.has(ref) || stub('lexicon', ref), true);
      const levels = lexiconLevels(level);
      const has = levels.some((l) => ctx.levels.get(l)?.lexicon?.entries.some((e) => e.id === ref)) || stub('lexicon', ref);
      // "no" only when every lexicon up to this level exists: a lemma of an unwritten earlier lexicon is unknown
      const allLoaded = levels.every((l) => ctx.levels.get(l)?.lexicon) || stubLoaded('lexicon');
      return yesNo(has, allLoaded);
    },
    unit: (ref) => {
      if (!PATTERNS.UNIT.test(String(ref))) return 'no';
      if (unitDoc(ctx, ref) || stub('unit', ref)) return 'yes';
      const course = ctx.levels.get(parseUnitId(ref)?.level)?.course?.data;
      if (course) return arr(course.units).includes(ref) ? 'yes' : 'no';
      return 'unknown';
    },
  };
}

/** Every reference of a doc: [{ kind, ref, path, level }]. */
export function collectRefs(doc) {
  const out = [];
  const d = doc.data || {};
  const level = doc.level;
  const push = (kind, ref, path) => {
    if (ref === null || ref === undefined || ref === '') return;
    out.push({ kind, ref: String(ref), path, level });
  };
  const templateRefs = (xs, path) => arr(xs).forEach((t, i) => push('template', t, `${path}[${i}]`));
  if (doc.kind === 'unit') {
    const spec = d.spec || {};
    arr(spec.canDos).forEach((c, i) => push('cando', c, `spec.canDos[${i}]`));
    for (const k of ['new', 'chunk', 'review']) arr(spec.grammar?.[k]).forEach((g, i) => push('spine', g, `spec.grammar.${k}[${i}]`));
    arr(spec.lexiconBlocks).forEach((b, bi) => arr(b?.lemmas).forEach((l, i) => push('lexicon', l, `spec.lexiconBlocks[${bi}].lemmas[${i}]`)));
    arr(spec.textTypes).forEach((t, i) => push('texttype', t, `spec.textTypes[${i}]`));
    if (spec.lanes) {
      push('lane', spec.lanes.primary, 'spec.lanes.primary');
      arr(spec.lanes.pruefungsfokus).forEach((p, i) => push('template', p?.template, `spec.lanes.pruefungsfokus[${i}].template`));
      for (const [lane, ts] of Object.entries(spec.lanes.spur || {})) {
        push('lane', lane, `spec.lanes.spur.${lane}`);
        templateRefs(ts, `spec.lanes.spur.${lane}`);
      }
    }
    arr(spec.cast).forEach((c, i) => push('cast', c, `spec.cast[${i}]`));
    arr(d.start?.lernziele).forEach((c, i) => push('cando', c, `start.lernziele[${i}]`));
    templateRefs(d.start?.pruefungsfokusChips, 'start.pruefungsfokusChips');
    for (const { step, path } of walkSteps(doc)) {
      if (!isObj(step)) continue;
      push('spine', step.structure, `${path}.structure`);
      push('rulecard', step.ruleCard, `${path}.ruleCard`);
      push('spine', step.warmup?.contrastWith, `${path}.warmup.contrastWith`);
      push('texttype', step.input?.textType, `${path}.input.textType`);
      templateRefs(step.redemittelFor, `${path}.redemittelFor`);
      arr(step.strategyCards).forEach((c, i) => push('template', c?.template, `${path}.strategyCards[${i}].template`));
      for (const g of arr(step.pool?.generators).map((x, i) => [x, i])) {
        arr(g[0]?.source).forEach((s, si) => {
          if (PATTERNS.lexicon.test(String(s))) push('lexicon', s, `${path}.pool.generators[${g[1]}].source[${si}]`);
        });
      }
    }
    arr(d.check?.proofs).forEach((p, i) => push('cando', p?.canDo, `check.proofs[${i}].canDo`));
    arr(d.redemittel).forEach((r, i) => push('template', r?.forTemplate, `redemittel[${i}].forTemplate`));
    arr(d.story?.castIn).forEach((c, i) => push('cast', c, `story.castIn[${i}]`));
  }
  if (doc.kind === 'lanepack') {
    push('unit', d.unit, 'unit');
    push('lane', d.lane, 'lane');
    arr(d.slots?.ls4?.strategyCards).forEach((c, i) => push('template', c?.template, `slots.ls4.strategyCards[${i}].template`));
  }
  if (['plateau', 'closing', 'mock'].includes(doc.kind)) {
    if (d.lane) push('lane', d.lane, 'lane');
    if (d.after) push('unit', d.after, 'after');
  }
  for (const { block, path } of walkBlocks(doc)) {
    push('template', block?.template, `${path}.template`);
    push('lane', block?.lane, `${path}.lane`);
  }
  for (const { task, kind, path } of walkTasks(doc)) {
    push('lane', task?.lane, `${path}.lane`);
    const parts = kind === 'speaking' ? speakingParts(task) : [{ part: task, path: '' }];
    for (const { part, path: pp } of parts) {
      push('template', part?.template, `${path}${pp}.template`);
      push('rubric', part?.profile, `${path}${pp}.profile`);
    }
    // WritingTask.textType: what the learner writes (tt.post), SCHEMA §8 2026-09-28
    if (kind === 'writing' && task?.textType) push('texttype', task.textType, `${path}.textType`);
  }
  for (const { mo, path } of walkMicroOutputs(doc)) {
    // MicroOutput.profile is enum(course-micro|course-micro-sp) in SCHEMA §8, not a ref(rubric)
    arr(mo?.targets).forEach((t, i) => push('spine', t, `${path}.targets[${i}]`));
  }
  for (const { item, path } of walkItems(doc)) {
    const t = String(item?.topic || '');
    if (t.startsWith('g.')) push('spine', t, `${path}.topic`);
    else if (t.startsWith('lx.')) push('lexicon', t, `${path}.topic`);
  }
  for (const { line, path } of walkLines(doc)) {
    const sp = String(line?.speaker || '');
    if (sp && !SPEAKER_ENUM.has(sp) && !sp.startsWith('x.')) push('cast', sp, `${path}.speaker`);
  }
  for (const [key, x] of Object.entries(isObj(d.extras) ? d.extras : {})) push('voice', x?.voice, `extras.${key}.voice`);
  arr(d.check?.rueckschau).forEach((r, i) => push('rulecard', r, `check.rueckschau[${i}]`));
  return out;
}

/** Ids a doc defines locally: lines, items, facts, bank keys. */
function localIds(docs) {
  const lines = new Set();
  const items = new Set();
  const facts = new Set();
  const banks = new Set();
  const texts = new Set();
  const legacyTexts = new Set();
  for (const doc of docs) {
    for (const { text, ownerBlock } of walkExamTexts(doc)) (ownerBlock ? legacyTexts : texts).add(text.id);
    for (const { line } of walkLines(doc)) if (line?.id) lines.add(line.id);
    for (const { item } of walkItems(doc)) if (item?.id) items.add(item.id);
    for (const f of arr(doc.data?.facts)) if (f?.id) facts.add(f.id);
    for (const { task } of walkTasks(doc)) if (task?.bankKey) banks.add(task.bankKey);
    for (const { mo } of walkMicroOutputs(doc)) if (mo?.bankKey) banks.add(mo.bankKey);
  }
  return { lines, items, facts, banks, texts, legacyTexts };
}

/** An item id of another unit: 'yes' | 'no' | 'unknown'. */
function resolveForeignItem(ctx, ref) {
  if (ctx.stubs.get('item')?.has(ref)) return 'yes';
  const unitId = String(ref).match(/^((?:a1|a2|b1|b2)\.[12]-u\d{2})/)?.[1];
  const doc = unitId ? unitDoc(ctx, unitId) : null;
  if (!doc) return 'unknown';
  for (const { item } of walkItems(doc)) if (item?.id === ref) return 'yes';
  return 'no';
}

export function run({ ctx, docs, levels, mode }) {
  const findings = [];
  const unknown = new Map(); // kind → count
  const resolve = makeResolver(ctx);
  // group each unit with its lane packs so local refs (lines, facts, bank keys) resolve across them
  const groups = new Map();
  for (const doc of docs) {
    const key = doc.kind === 'lanepack' ? doc.data.unit : doc.kind === 'unit' ? doc.data.id : doc.file;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(doc);
  }
  for (const group of groups.values()) {
    const unit = group.find((d) => d.kind === 'unit') || null;
    const withUnit = unit ? group : [...group, ...(group[0].kind === 'lanepack' ? [unitDoc(ctx, group[0].data.unit)].filter(Boolean) : [])];
    const local = localIds(withUnit);
    for (const doc of group) {
      for (const r of collectRefs(doc)) {
        const fn = resolve[r.kind];
        const res = fn ? fn(r.ref, r.level) : 'unknown';
        if (res === 'no') {
          const where = r.kind === 'lexicon' || r.kind === 'rulecard' ? ` (${r.kind} of ${r.level} or earlier)` : '';
          findings.push(blocker(doc, r.path, `${r.kind} "${r.ref}" does not exist in its registry${where}`, r.ref));
        } else if (res === 'unknown') {
          unknown.set(r.kind, (unknown.get(r.kind) || 0) + 1);
        }
      }
      // local references: audio lines, generator line sources, facts, proofs, earlier items, Überarbeiten
      for (const { item, path } of walkItems(doc)) {
        if (item?.audioLineRef && !local.lines.has(item.audioLineRef)) {
          findings.push(blocker(doc, `${path}.audioLineRef`, `line "${item.audioLineRef}" is not a line of this unit`, item.id));
        }
        if (item?.textRef && !local.texts.has(item.textRef) && !local.legacyTexts.has(item.textRef)) {
          findings.push(blocker(doc, `${path}.textRef`, `exam text "${item.textRef}" is not a text of this file`, item.id));
        }
      }
      // file-scoped speakers (extras), exam texts and assets
      const extras = new Set(Object.keys(isObj(doc.data?.extras) ? doc.data.extras : {}));
      for (const { line, path } of walkLines(doc)) {
        const sp = String(line?.speaker || '');
        if (sp.startsWith('x.') && !extras.has(sp)) findings.push(blocker(doc, `${path}.speaker`, `extra "${sp}" is not declared in this file's extras`, sp));
      }
      const assets = new Set(arr(doc.data?.assets).map((a) => a?.id).filter(Boolean));
      const assetRef = (ref, path) => { if (ref && !assets.has(ref)) findings.push(blocker(doc, path, `asset "${ref}" is not declared in this file's assets`, ref)); };
      for (const { block, path, texts } of walkBlocks(doc)) {
        const resolvedIds = new Set(arr(texts).map((x) => x.text.id));
        arr(block?.textRefs).forEach((r, i) => { if (!resolvedIds.has(r)) findings.push(blocker(doc, `${path}.textRefs[${i}]`, `exam text "${r}" is not a text of this block's step or file`, r)); });
        arr(block?.choices).forEach((c, i) => {
          if (c?.textRef && !local.texts.has(c.textRef)) findings.push(blocker(doc, `${path}.choices[${i}].textRef`, `exam text "${c.textRef}" is not a text of this file`, c.textRef));
          assetRef(c?.imageRef, `${path}.choices[${i}].imageRef`);
        });
      }
      for (const { text, path } of walkExamTexts(doc)) assetRef(text.assetRef, `${path}.assetRef`);
      if (doc.kind === 'unit') {
        assetRef(doc.data.start?.auftakt?.assetRef, 'start.auftakt.assetRef');
        assetRef(doc.data.check?.portrait?.assetRef, 'check.portrait.assetRef');
        const pf = doc.data.check?.portrait?.factRef;
        if (pf && !local.facts.has(pf)) findings.push(blocker(doc, 'check.portrait.factRef', `fact "${pf}" is not in this unit's facts[]`, pf));
        const stepIds = new Set([...walkSteps(doc)].map((x) => x.step?.id));
        arr(doc.data.spec?.lanes?.pruefungsfokus).forEach((p, i) => {
          if (p?.step && !stepIds.has(p.step) && doc.data.steps) findings.push(blocker(doc, `spec.lanes.pruefungsfokus[${i}].step`, `step "${p.step}" is not a step of this unit`, p.step));
        });
      }
      for (const { task, kind, path } of walkTasks(doc)) {
        if (kind === 'speaking') {
          for (const { part, path: pp } of speakingParts(task)) {
            for (const side of ['learner', 'partner']) arr(part?.cards?.[side]).forEach((c, i) => { if (isObj(c)) assetRef(c.imageRef, `${path}${pp}.cards.${side}[${i}].imageRef`); });
            assetRef(part?.photos?.learner, `${path}${pp}.photos.learner`);
            assetRef(part?.photos?.partner, `${path}${pp}.photos.partner`);
          }
        } else arr(task?.form?.documents).forEach((a, i) => assetRef(a, `${path}.form.documents[${i}]`));
      }
      for (const { step, path } of walkSteps(doc)) {
        arr(step?.pool?.generators).forEach((g, gi) => arr(g?.source).forEach((s, si) => {
          if (PATTERNS.line.test(String(s)) && !local.lines.has(s)) {
            findings.push(blocker(doc, `${path}.pool.generators[${gi}].source[${si}]`, `line "${s}" is not a line of this unit`, s));
          }
        }));
        if (step?.kind === 'ueberarbeiten' && step.of && !local.banks.has(step.of)) {
          findings.push(blocker(doc, `${path}.of`, `bank key "${step.of}" is not an Aufgabe of this unit`, step.of));
        }
      }
      if (doc.kind === 'unit') {
        arr(doc.data.fokus).forEach((f, fi) => arr(f?.factRefs).forEach((ref, ri) => {
          if (!local.facts.has(ref)) findings.push(blocker(doc, `fokus[${fi}].factRefs[${ri}]`, `fact "${ref}" is not in this unit's facts[]`, ref));
        }));
        arr(doc.data.check?.proofs).forEach((p, pi) => {
          if (p?.item && !local.items.has(p.item)) findings.push(blocker(doc, `check.proofs[${pi}].item`, `item "${p.item}" is not an item of this unit`, p.item));
        });
        arr(doc.data.check?.earlier).forEach((e, ei) => {
          const res = resolveForeignItem(ctx, e?.ref);
          if (res === 'no') findings.push(blocker(doc, `check.earlier[${ei}].ref`, `item "${e?.ref}" does not exist in its unit`, e?.ref));
          else if (res === 'unknown') unknown.set('item (earlier units not authored yet)', (unknown.get('item (earlier units not authored yet)') || 0) + 1);
          if (e?.ref && doc.data.id && String(e.ref).startsWith(`${doc.data.id}-`)) {
            findings.push(blocker(doc, `check.earlier[${ei}].ref`, `"earlier" must reference an item of an EARLIER unit, not of ${doc.data.id}`, e.ref));
          }
        });
      }
    }
  }

  // level scope: course.json, rule cards, lexicon allocation targets
  if (mode !== 'file') {
    for (const slot of levels) {
      const course = slot.course?.data;
      const cdoc = { file: slot.course?.file };
      if (course) {
        arr(course.units).forEach((u, i) => { if (!PATTERNS.UNIT.test(String(u)) || parseUnitId(u)?.level !== slot.level) findings.push(blocker(cdoc, `units[${i}]`, `"${u}" is not a unit id of ${slot.level}`, u)); });
        for (const k of ['primary']) if (course.lanes?.[k] && resolve.lane(course.lanes[k]) === 'no') findings.push(blocker(cdoc, `lanes.${k}`, `lane "${course.lanes[k]}" does not exist`, course.lanes[k]));
        for (const k of ['secondary', 'later', 'live']) arr(course.lanes?.[k]).forEach((l, i) => { if (resolve.lane(l) === 'no') findings.push(blocker(cdoc, `lanes.${k}[${i}]`, `lane "${l}" does not exist`, l)); });
      }
      const rc = slot.ruleCards;
      for (const [i, c] of arr(rc?.cards).entries()) {
        if (c?.spine && resolve.spine(c.spine) === 'no') findings.push(blocker({ file: rc.file }, `cards[${i}].spine`, `spine point "${c.spine}" does not exist`, c.id));
      }
      const lx = slot.lexicon;
      for (const [i, e] of arr(lx?.entries).entries()) {
        const u = parseUnitId(e?.unit);
        if (!u || u.level !== slot.level) findings.push(blocker({ file: lx.file }, `entries[${i}].unit`, `"${e?.unit}" is not a unit of ${slot.level}`, e?.id));
      }
    }
  }

  // --all: the registries' own cross-references
  if (mode === 'all') {
    const R = ctx.registries;
    for (const [pid, { point, file }] of R.spine?.byId || []) {
      arr(point.detectors).forEach((d, i) => { if (resolve.detector(d) === 'no') findings.push(blocker({ file }, `points[${pid}].detectors[${i}]`, `detector "${d}" does not exist in detectors.json`, d)); });
      if (point.contrast && resolve.spine(point.contrast) === 'no') findings.push(blocker({ file }, `points[${pid}].contrast`, `spine point "${point.contrast}" does not exist`, point.contrast));
      for (const k of ['receptive', 'productive']) if (point.intro?.[k] && !PATTERNS.UNIT.test(point.intro[k])) findings.push(blocker({ file }, `points[${pid}].intro.${k}`, `"${point.intro[k]}" is not a unit id`, pid));
    }
    for (const [tid, { template, file }] of R.templates) {
      if (template.family && resolve.family(template.family) === 'no') findings.push(blocker({ file }, `teile.${tid}.family`, `family "${template.family}" does not exist`, tid));
      if (template.textType && resolve.texttype(template.textType) === 'no') findings.push(blocker({ file }, `teile.${tid}.textType`, `text type "${template.textType}" does not exist`, tid));
      if (template.rubric && resolve.rubric(template.rubric) === 'no') findings.push(blocker({ file }, `teile.${tid}.rubric`, `rubric "${template.rubric}" does not exist`, tid));
      arr(template.transfersTo).forEach((t, i) => { if (resolve.template(t) === 'no') findings.push(blocker({ file }, `teile.${tid}.transfersTo[${i}]`, `template "${t}" does not exist`, tid)); });
    }
    for (const [fid, { data, file }] of R.families || []) {
      arr(data.templates).forEach((t, i) => { if (resolve.template(t) === 'no') findings.push(blocker({ file }, `families[${fid}].templates[${i}]`, `template "${t}" does not exist`, fid)); });
    }
    for (const det of R.detectors?.list || []) {
      arr(det.spec?.spinePoints).forEach((p, i) => { if (resolve.spine(p) === 'no') findings.push(advisory({ file: R.detectors.file }, `${det.id}.spec.spinePoints[${i}]`, `spine hint "${p}" is not a spine point (rename in the spine?)`, det.id)); });
    }
    for (const [cid, { item, file }] of R.cando || []) {
      if (item.halfLevel && bandOfLevel(item.halfLevel) !== String(cid).split('.')[1]) findings.push(blocker({ file }, `items[${cid}].halfLevel`, `can-do of band ${String(cid).split('.')[1]} placed in ${item.halfLevel}`, cid));
    }
  }

  const notes = [];
  if (unknown.size) notes.push(`not resolvable yet (registry not authored): ${list([...unknown].map(([k, n]) => `${k} ×${n}`), 20)}`);
  return { findings, notes };
}
