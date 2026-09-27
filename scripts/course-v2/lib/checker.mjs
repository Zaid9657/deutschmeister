// SCH-01 (+ the format and resolution halves of REF-01, and KEY-01 on bank keys) for loaded files.
import path from 'node:path';
import { check, formatError } from './schema.mjs';
import { schemaFor } from './schemas/index.mjs';
import { buildIndex } from './refindex.mjs';
import { loadFile, loadTree, rootFor, rel } from './tree.mjs';

/**
 * Check one parsed document. Returns [{ path, message, rule, near }].
 * opts: { kind?, file?, index?, authored? (default true) }
 */
export function checkDocument(doc, { kind, index = null, authored = true } = {}) {
  if (!kind) return [{ path: '$', message: 'unknown file kind', rule: 'SCH-01', near: null }];
  return check(schemaFor(kind, doc), doc, { index, authored });
}

/** Check one loaded file ({ file, doc, kind, error }) against an index. */
export function checkLoaded(loaded, index, { refs = true } = {}) {
  if (loaded.error) return [{ path: '$', message: loaded.error, rule: 'SCH-01', near: null }];
  return checkDocument(loaded.doc, { kind: loaded.kind, index: refs ? index : null });
}

/**
 * Check files (absolute or relative paths). Each file is checked against the index of its root
 * (rootFor): the fixtures tree, the content tree, or its own directory.
 * Returns { files: [{ file, errors }], errorCount }.
 */
export function checkFiles(files, { refs = true } = {}) {
  const roots = new Map();
  const results = [];
  for (const input of files) {
    const f = path.resolve(input);
    const { root, exclude } = rootFor(f);
    const key = `${root}\0${exclude.join('\0')}`;
    if (!roots.has(key)) {
      const tree = loadTree(root, { exclude });
      roots.set(key, { index: buildIndex(tree.filter((t) => !t.error)), byFile: new Map(tree.map((t) => [t.file, t])) });
    }
    const r = roots.get(key);
    const loaded = r.byFile.get(f) || loadFile(f);
    results.push({ file: loaded.file, kind: loaded.kind, errors: checkLoaded(loaded, r.index, { refs }) });
  }
  return { files: results, errorCount: results.reduce((n, r) => n + r.errors.length, 0) };
}

/** Printable lines for a checkFiles() result. */
export function formatResults(result) {
  const lines = [];
  for (const r of result.files) for (const e of r.errors) lines.push(formatError(rel(r.file), e));
  return lines;
}
