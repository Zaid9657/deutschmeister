// SCH-01 (+ the format and resolution halves of REF-01, and KEY-01 on bank keys) for loaded files.
import path from 'node:path';
import { check, formatError } from './schema.mjs';
import { schemaFor } from './schemas/index.mjs';
import { buildIndex, fileScoped } from './refindex.mjs';
import { loadFile, loadTree, rootFor, rel } from './tree.mjs';

/**
 * Check one parsed document. Returns [{ path, message, rule, near }].
 * opts: { kind?, index?, authored? (default true), stage? (units: overrides the declared stage) }
 */
export function checkDocument(doc, { kind, index = null, authored = true, stage } = {}) {
  if (!kind) return [{ path: '$', message: 'unknown file kind', rule: 'SCH-01', near: null }];
  return check(schemaFor(kind, doc, { stage }), doc, { index: fileScoped(index, doc), authored });
}

/** Check one loaded file ({ file, doc, kind, error }) against an index. */
export function checkLoaded(loaded, index, { refs = true, stage } = {}) {
  if (loaded.error) return [{ path: '$', message: loaded.error, rule: 'SCH-01', near: null }];
  return checkDocument(loaded.doc, { kind: loaded.kind, index: refs ? index : null, stage });
}

/**
 * Check files (absolute or relative paths). Each file is checked against the index of its root
 * (rootFor): the fixtures tree, the content tree, or its own directory.
 * Returns { files: [{ file, errors }], errorCount }.
 */
export function checkFiles(files, { refs = true, stage } = {}) {
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
    results.push({ file: loaded.file, kind: loaded.kind, errors: checkLoaded(loaded, r.index, { refs, stage }) });
  }
  return { files: results, errorCount: results.reduce((n, r) => n + r.errors.length, 0) };
}

/** Printable lines for a checkFiles() result. */
export function formatResults(result) {
  const lines = [];
  for (const r of result.files) for (const e of r.errors) lines.push(formatError(rel(r.file), e));
  return lines;
}
