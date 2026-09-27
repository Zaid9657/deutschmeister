// The validator runner: loads the rule modules, resolves a target, runs the rules, formats.
//
// A rule module (scripts/course-v2/rules/<RULE-ID>.mjs) exports
//   id, title, type ('hard' | 'ratchet' | 'advisory' | 'mixed'), scope ('unit' | 'level'),
//   run({ ctx, docs, levels, mode }) → { findings: [], skipped?: string, notes?: [] }
// `docs` are the target documents (units, lane packs, Plateaus, closing blocks, mocks);
// `levels` are the level slots in scope (empty when a single file is the target, so level-scope
// rules skip). A finding's severity is blocker | ratchet | advisory; any blocker fails the run.

import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadContext, loadForFile, docsOfLevel, addDetectors, relPath } from './context.mjs';
import { normalizeLevel, LEVELS, ID_SOURCE } from './ids.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const SCRIPTS_DIR = resolve(HERE, '..');
export const RULES_DIR = join(SCRIPTS_DIR, 'rules');
export const REPO_ROOT = resolve(SCRIPTS_DIR, '..', '..');
export const CONTENT_ROOT = join(REPO_ROOT, 'content', 'course-v2');
export const CANONICAL_DETECTORS = join(CONTENT_ROOT, 'registries', 'detectors.json');

/** Canonical order of the rules in a report (BLUEPRINT §9.1 order). */
export const RULE_ORDER = [
  'REF-01', 'ID-01', 'KEY-01', 'ALL-02', 'ALL-03',
  'GRM-01', 'GRM-02', 'GRM-04', 'GRM-05',
  'LEX-01', 'LEX-02', 'LEX-03', 'LEX-04', 'LEX-05', 'LEX-07',
  'TXT-02', 'TXT-03', 'TXT-04',
  'ITM-01', 'ITM-02', 'ITM-03', 'ITM-04', 'ITM-05', 'ITM-06', 'ITM-07', 'ITM-08', 'ITM-09', 'ITM-10', 'ITM-11', 'ITM-13',
  'CON-06',
  'EXM-01', 'EXM-02', 'EXM-03', 'EXM-04', 'EXM-11',
  'COV-1', 'COV-3', 'COV-4', 'COV-5',
];

/** Import every rule module. */
export async function loadRules(dir = RULES_DIR) {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => /^[A-Z]+-\d+\.mjs$/.test(f));
  const mods = [];
  for (const f of files) {
    const m = await import(pathToFileURL(join(dir, f)).href);
    if (!m.id || typeof m.run !== 'function') throw new Error(`rule module ${f} lacks id/run`);
    mods.push(m);
  }
  const rank = (id) => {
    const i = RULE_ORDER.indexOf(id);
    return i < 0 ? RULE_ORDER.length : i;
  };
  return mods.sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
}

/** Detectors are construction definitions, not content: a tree without its own uses the canonical file. */
function ensureDetectors(ctx, notes) {
  if (ctx.registries.detectors || !existsSync(CANONICAL_DETECTORS)) return;
  try {
    const data = JSON.parse(readFileSync(CANONICAL_DETECTORS, 'utf8'));
    addDetectors(ctx, data.detectors, relPath(ctx, CANONICAL_DETECTORS));
    notes.push(`detectors: this tree has no detectors.json; using ${relPath(ctx, CANONICAL_DETECTORS)}`);
  } catch {
    // leave the detectors empty; GRM-04 reports the skip
  }
}

/**
 * Resolve a target ('--all', a level, or a file path) into { ctx, docs, levels, mode, label }.
 * `opts.ctx` (an already built context, for tests) short-circuits loading.
 */
export function resolveTarget(target, opts = {}) {
  const contentRoot = opts.contentRoot || CONTENT_ROOT;
  const repoRoot = opts.repoRoot || REPO_ROOT;
  const notes = [];
  let ctx;
  let docs = [];
  let levels = [];
  let mode;
  let label;
  const level = normalizeLevel(target);
  if (opts.ctx) {
    ctx = opts.ctx;
  }
  if (target === '--all' || target === 'all') {
    mode = 'all';
    label = 'all levels';
    if (!ctx) ctx = loadContext({ root: contentRoot, exclude: [join(contentRoot, 'fixtures')], repoRoot, today: opts.today });
    levels = LEVELS.map((l) => ctx.levels.get(l)).filter(Boolean);
    docs = levels.flatMap(docsOfLevel);
  } else if (level) {
    mode = 'level';
    label = level;
    if (!ctx) ctx = loadContext({ root: contentRoot, exclude: [join(contentRoot, 'fixtures')], repoRoot, today: opts.today });
    const slot = ctx.levels.get(level);
    levels = slot ? [slot] : [];
    docs = slot ? docsOfLevel(slot) : [];
    if (opts.unit) {
      docs = docs.filter((d) => d.nr === Number(opts.unit));
      label = `${level} unit ${opts.unit}`;
    }
    if (!slot) notes.push(`no content for ${level} yet`);
  } else {
    mode = 'file';
    const file = resolve(String(target));
    label = relPathFrom(repoRoot, file);
    if (!ctx) {
      const r = loadForFile(file, { contentRoot, repoRoot, today: opts.today });
      ctx = r.ctx;
      docs = r.targets;
      if (!existsSync(file)) notes.push(`${label}: no such file`);
    } else {
      docs = [];
      for (const slot of ctx.levels.values()) docs.push(...docsOfLevel(slot).filter((d) => d.target));
    }
    // a unit file brings its lane packs; a lane pack is checked with its unit present
    const extra = [];
    for (const d of docs) {
      if (d.kind !== 'unit') continue;
      const slot = ctx.levels.get(d.level);
      for (const p of slot?.lanePacks || []) if (p.data.unit === d.data.id && !docs.includes(p)) extra.push(p);
    }
    docs = [...docs, ...extra];
  }
  if (opts.today) ctx.today = opts.today;
  ensureDetectors(ctx, notes);
  return { ctx, docs, levels, mode, label, notes };
}

function relPathFrom(base, file) {
  const r = file.startsWith(base) ? file.slice(base.length + 1) : file;
  return r.split('\\').join('/');
}

const SEV_ORDER = { blocker: 0, ratchet: 1, advisory: 2 };

/**
 * Stages (SCHEMA §8.1, BLUEPRINT §9): a rule declares the earliest stage whose content it can judge
 * (`export const stage = 'spec'|'S'|'I'|'T'`; absent = 'T'). A unit is judged at its declared
 * `stage` (absent = 'T', the full gate set — or 'spec' for a stage-less spec-only unit); `--stage` overrides it; a lane pack has no stages and
 * is always judged at 'T' unless `--stage` lowers it.
 */
export const STAGES = ['spec', 'S', 'I', 'T'];
export const stageRank = (s) => STAGES.indexOf(s);
export function normalizeStage(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const s = String(raw).trim();
  if (s.toLowerCase() === 'all') return 'T';
  if (s.toLowerCase() === 'spec') return 'spec';
  const u = s.toUpperCase();
  return STAGES.includes(u) ? u : undefined;
}
export function stageOfDoc(doc, override = null) {
  if (override) return override;
  if (doc.kind === 'unit') {
    const declared = normalizeStage(doc.data?.stage);
    if (declared) return declared;
    // SCHEMA §8 requires `stage` (the checker reports its absence, SCH-01). A stage-less unit that
    // holds only its spec — a curriculum agent's spec file written before the field existed — is
    // judged as what it is, a spec, never at T; any other stage-less unit gets the full gate set.
    const d = doc.data || {};
    return d.steps === undefined && d.start === undefined && d.check === undefined ? 'spec' : 'T';
  }
  return 'T';
}

/** Run the rules on a resolved target. */
export async function runRules(resolved, { rules, only = null, stage = null } = {}) {
  const { ctx, levels, mode } = resolved;
  const override = normalizeStage(stage) || null;
  const stageOf = (doc) => stageOfDoc(doc, override);
  const allDocs = resolved.docs;
  const list = (rules || (await loadRules())).filter((r) => !only || only.includes(r.id));
  const results = [];
  if (ctx.loadErrors.length) {
    results.push({
      id: 'LOAD', title: 'Every content file parses', type: 'hard', status: 'fail', reason: null, notes: [],
      findings: ctx.loadErrors.map((e) => ({ severity: 'blocker', file: e.file, path: null, id: null, message: e.message })),
    });
  }
  for (const rule of list) {
    let out;
    const ruleStage = normalizeStage(rule.stage) || 'T';
    const docs = allDocs.filter((d) => stageRank(stageOf(d)) >= stageRank(ruleStage));
    const levelStageOk = !override || stageRank(override) >= stageRank(ruleStage);
    if (allDocs.length && !docs.length) {
      const at = [...new Set(allDocs.map(stageOf))].join('/');
      out = { findings: [], skipped: `stage-${ruleStage} rule; the target is at stage ${at}` };
    } else if (rule.scope === 'level' && !levelStageOk) {
      out = { findings: [], skipped: `stage-${ruleStage} rule; --stage ${override}` };
    } else if (rule.scope === 'level' && mode === 'file') {
      out = { findings: [], skipped: 'level-scope rule; run the validator on the level (node scripts/course-v2/validate.mjs <level>)' };
    } else if (!docs.length && !levels.length && mode !== 'all') {
      out = { findings: [], skipped: 'no content in the target yet' };
    } else if (rule.scope === 'level' && !levels.length) {
      out = { findings: [], skipped: 'no level content in the target yet' };
    } else {
      try {
        out = rule.run({ ctx, docs, levels, mode, stageOf }) || { findings: [] };
      } catch (e) {
        out = { findings: [{ severity: 'blocker', file: null, path: null, id: null, message: `rule crashed: ${e.stack || e.message}` }] };
      }
    }
    const findings = (out.findings || []).slice().sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
    const counts = { blocker: 0, ratchet: 0, advisory: 0 };
    for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;
    let status = 'pass';
    if (out.skipped) status = 'skip';
    else if (counts.blocker) status = 'fail';
    else if (counts.ratchet || counts.advisory) status = 'warn';
    results.push({ id: rule.id, title: rule.title, type: rule.type, status, reason: out.skipped || null, notes: out.notes || [], counts, findings });
  }
  const summary = { rules: results.length, pass: 0, fail: 0, warn: 0, skip: 0, blocker: 0, ratchet: 0, advisory: 0 };
  for (const r of results) {
    summary[r.status] += 1;
    for (const f of r.findings) summary[f.severity] += 1;
  }
  return { target: resolved.label, mode, stage: override || 'declared', notes: resolved.notes, idSource: ID_SOURCE, docs: allDocs.map((d) => d.file), results, summary, exitCode: summary.blocker ? 1 : 0 };
}

/** One call: resolve + run. */
export async function validate(target, opts = {}) {
  const resolved = resolveTarget(target, opts);
  return runRules(resolved, opts);
}

/** Human-readable report (no colour, no emoji). */
export function formatReport(report, { verbose = false, maxFindings = 40 } = {}) {
  const out = [];
  out.push(`course-v2 validate — ${report.target} (${report.docs.length} document(s), stage ${report.stage})`);
  for (const n of report.notes) out.push(`  note: ${n}`);
  const tag = { pass: 'PASS', fail: 'FAIL', warn: 'WARN', skip: 'SKIP' };
  for (const r of report.results) {
    const c = r.counts || { blocker: 0, ratchet: 0, advisory: 0 };
    const tail = r.status === 'skip'
      ? `skipped: ${r.reason}`
      : [c.blocker && `${c.blocker} blocker`, c.ratchet && `${c.ratchet} ratchet`, c.advisory && `${c.advisory} advisory`].filter(Boolean).join(', ');
    out.push(`${tag[r.status].padEnd(4)}  ${r.id.padEnd(7)} ${r.title}${tail ? `  — ${tail}` : ''}`);
    if (verbose || r.status === 'fail' || r.status === 'warn') {
      const shown = verbose ? r.findings : r.findings.filter((f) => f.severity === 'blocker' || f.severity === 'ratchet').concat(r.findings.filter((f) => f.severity === 'advisory').slice(0, 5));
      for (const f of shown.slice(0, maxFindings)) {
        const mark = f.severity === 'blocker' ? 'x' : f.severity === 'ratchet' ? '~' : '-';
        const where = [f.file, f.path].filter(Boolean).join(' > ');
        out.push(`        ${mark} ${where}${f.id ? ` (${f.id})` : ''}: ${f.message}`);
      }
      const hidden = r.findings.length - Math.min(shown.length, maxFindings);
      if (hidden > 0) out.push(`        … ${hidden} more (use --verbose or --json)`);
      for (const n of r.notes) out.push(`        note: ${n}`);
    }
  }
  const s = report.summary;
  out.push(`summary: ${s.rules} rules — ${s.pass} pass, ${s.fail} fail, ${s.warn} warn, ${s.skip} skipped · ${s.blocker} blocker, ${s.ratchet} ratchet, ${s.advisory} advisory`);
  out.push(report.exitCode ? 'result: FAIL (blocker findings)' : 'result: OK (no blocker findings)');
  return out.join('\n');
}
