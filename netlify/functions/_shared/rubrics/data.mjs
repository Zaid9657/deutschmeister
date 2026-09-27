// Server-side course v2 data: the compiled task banks and rubric profiles.
//
// WHAT IS READ, AND WHY FROM DISK
//   netlify/functions/_shared/course-v2/<level>.banks.json
//     { writing: { bankKey: WritingTask }, speaking: { bankKey: SpeakingTask },
//       micro: { bankKey: MicroOutput } }   — written by scripts/course-v2/compile.mjs
//   netlify/functions/_shared/course-v2/rubrics.json
//     { profiles: { id: RubricProfile }, spineLabels: { spineId: label } }
//                                          — written by scripts/course-v2/compile-rubrics.mjs
// Eight levels are compiled one by one and any of them may be absent while the
// course is being built, so the files are read at run time instead of being
// imported (a static import of a missing file would break every function that
// shares this module, the live A1.1 grading included). netlify.toml ships the
// directory with every function through `[functions] included_files`.
//
// The grader resolves a task ONLY from these files — never from text the client
// sends (BLUEPRINT §4.4, SCHEMA §12). A missing file or entry is "unknown task",
// never a fallback to client text.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILTIN_PROFILES } from './defaults.mjs';

const REL_DIR = 'netlify/functions/_shared/course-v2';

// Where the directory can live: next to this module when unbundled (tests,
// `netlify dev`), and under the task root / cwd once esbuild has bundled the
// function and included_files has copied the JSON beside it.
function candidateDirs() {
  const dirs = [];
  if (process.env.COURSE_V2_DATA_DIR) dirs.push(process.env.COURSE_V2_DATA_DIR);
  try {
    dirs.push(fileURLToPath(new URL('../course-v2/', import.meta.url)));
  } catch {
    // import.meta.url is not a file URL inside some bundles — the next candidates cover it.
  }
  if (process.env.LAMBDA_TASK_ROOT) dirs.push(join(process.env.LAMBDA_TASK_ROOT, REL_DIR));
  dirs.push(join(process.cwd(), REL_DIR));
  return dirs;
}

function readJson(fileName) {
  for (const dir of candidateDirs()) {
    const p = join(dir, fileName);
    if (!existsSync(p)) continue;
    try {
      return JSON.parse(readFileSync(p, 'utf8'));
    } catch (e) {
      console.error(`[course-v2] ${p} is not valid JSON:`, e.message);
      return null;
    }
  }
  return null;
}

// Per-instance caches. `undefined` = not looked up yet; `null` = looked up, absent.
const bankCache = new Map();
let rubricCache;
let overrides = null;

/** Test seam: serve banks/rubrics from memory instead of disk. Pass null to reset. */
export function __setCourseV2DataForTests(data) {
  overrides = data || null;
  bankCache.clear();
  rubricCache = undefined;
}

/** The compiled banks of one level ('a2.1'), or null when that level is not compiled. */
export function loadBanks(level) {
  if (overrides) return overrides.banks?.[level] ?? null;
  if (!bankCache.has(level)) {
    const raw = readJson(`${level}.banks.json`);
    bankCache.set(level, raw && typeof raw === 'object' ? raw : null);
  }
  return bankCache.get(level);
}

function loadRubricFile() {
  if (overrides) return overrides.rubrics ?? null;
  if (rubricCache === undefined) rubricCache = readJson('rubrics.json');
  return rubricCache;
}

/**
 * A rubric profile by id. The compiled registry wins; the two design profiles
 * of SCHEMA §15.1 / BLUEPRINT §4.3 (`course-micro`, `course-micro-sp`) fall back
 * to their built-in copies until the registry carries them. An exam profile that
 * is not compiled resolves to null — the caller refuses to grade rather than
 * inventing a scale.
 */
export function rubricProfile(id) {
  if (typeof id !== 'string' || !id) return null;
  const compiled = loadRubricFile()?.profiles?.[id];
  if (compiled) return compiled;
  return BUILTIN_PROFILES[id] ?? null;
}

/** Human label of a grammar spine point ('g.reflexiv-akk' → its registry label), else a readable fallback. */
export function spineLabel(id) {
  const label = loadRubricFile()?.spineLabels?.[id];
  if (label) return label;
  return typeof id === 'string' ? id.replace(/^g\./, '').replace(/-/g, ' ') : '';
}

/**
 * One bank entry by kind: 'writing' | 'speaking' | 'micro'. The compiler may
 * key the entry and also repeat bankKey inside it; both are accepted.
 */
export function bankEntry(level, section, bankKey) {
  const banks = loadBanks(level);
  const table = banks?.[section];
  if (!table || typeof table !== 'object') return null;
  const entry = table[bankKey];
  if (!entry || typeof entry !== 'object') return null;
  if (entry.bankKey && entry.bankKey !== bankKey) return null; // a mis-keyed entry is not this task
  return entry;
}
