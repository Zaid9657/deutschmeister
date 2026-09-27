// Canonical JSON and content hashes (QA-FRESH-01 compares these; keep the definition stable).
//
// contentHash(x) = 'sha256:' + hex(sha256(canonicalJson(x))), where canonicalJson sorts object
// keys recursively and writes no whitespace. The hash of a content file is the hash of the whole
// parsed authored file.
import { createHash } from 'node:crypto';

export function canonicalJson(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return `[${x.map(canonicalJson).join(',')}]`;
  const keys = Object.keys(x).filter((k) => x[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(x[k])}`).join(',')}}`;
}

export function contentHash(x) {
  return `sha256:${createHash('sha256').update(canonicalJson(x)).digest('hex')}`;
}
