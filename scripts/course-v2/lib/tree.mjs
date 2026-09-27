// Loading content/course-v2 trees: every *.json below a root, parsed and matched to its kind.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kindOf } from './schemas/index.mjs';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const CONTENT_ROOT = path.join(REPO_ROOT, 'content/course-v2');
export const FIXTURES_ROOT = path.join(CONTENT_ROOT, 'fixtures');

const within = (p, dir) => p === dir || p.startsWith(dir + path.sep);

/** Every *.json file under `dir` (sorted, deterministic), skipping `exclude` directories. */
export function listJsonFiles(dir, { exclude = [] } = {}) {
  const out = [];
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs)) return out;
  if (fs.statSync(abs).isFile()) return abs.endsWith('.json') ? [abs] : [];
  const visit = (d) => {
    if (exclude.some((x) => within(d, path.resolve(x)))) return;
    for (const name of fs.readdirSync(d).sort()) {
      const p = path.join(d, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) visit(p);
      else if (name.endsWith('.json')) out.push(p);
    }
  };
  visit(abs);
  return out;
}

/** { file, doc, kind, error } — error is a parse or kind-matching failure. */
export function loadFile(file) {
  const abs = path.resolve(file);
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    return { file: abs, doc: null, kind: null, error: `invalid JSON: ${e.message}` };
  }
  const k = kindOf(doc, abs);
  return { file: abs, doc, kind: k.kind || null, error: k.error || null };
}

/**
 * The index root a file belongs to: a fixtures tree is its own world; everything else under
 * content/course-v2 shares one root (fixtures excluded); a file elsewhere stands alone.
 */
export function rootFor(file) {
  const abs = path.resolve(file);
  if (within(abs, FIXTURES_ROOT)) return { root: FIXTURES_ROOT, exclude: [] };
  if (within(abs, CONTENT_ROOT)) return { root: CONTENT_ROOT, exclude: [FIXTURES_ROOT] };
  const st = fs.existsSync(abs) ? fs.statSync(abs) : null;
  return { root: st && st.isDirectory() ? abs : path.dirname(abs), exclude: [] };
}

/** Load every JSON file of a root (respecting exclusions). */
export function loadTree(root, { exclude = [] } = {}) {
  return listJsonFiles(root, { exclude }).map(loadFile);
}

/** Repo-relative path for messages. */
export function rel(file) {
  const r = path.relative(REPO_ROOT, file);
  return r.startsWith('..') ? file : r.split(path.sep).join('/');
}
