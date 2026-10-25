// Read-only HEAD overlay for reproducing unrelated baseline test failures.
// node --test --experimental-test-isolation=none --import ./docs/course-factory/live-fixes/baseline-loader.mjs <tests>
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { registerHooks, syncBuiltinESMExports } from 'node:module';
import { fileURLToPath } from 'node:url';
import { relative, isAbsolute } from 'node:path';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const git = (...args) => execFileSync('git', ['-C', root, ...args], { maxBuffer: 8 * 1024 * 1024 });
const tracked = new Set(git('ls-tree', '-r', '--name-only', 'HEAD').toString().trim().split('\n'));
const cache = new Map();
const read = fs.readFileSync;
const old = (path) => {
  const name = relative(root, path instanceof URL ? fileURLToPath(path) : String(path)).replaceAll('\\', '/');
  if (isAbsolute(name) || !tracked.has(name)) return null;
  if (!cache.has(name)) {
    let bytes = git('show', `HEAD:${name}`);
    // HEAD stores LF; reproduce this checkout's CRLF environment as well.
    if (/\.(?:js|jsx|mjs|json|css|astro|md|txt)$/.test(name) && read(path).includes(Buffer.from('\r\n'))) {
      bytes = Buffer.from(bytes.toString().replace(/\r?\n/g, '\r\n'));
    }
    cache.set(name, bytes);
  }
  return cache.get(name);
};
fs.readFileSync = (path, options) => {
  const bytes = typeof path === 'number' ? null : old(path);
  if (!bytes) return read(path, options);
  const encoding = typeof options === 'string' ? options : options?.encoding;
  return encoding ? bytes.toString(encoding) : Buffer.from(bytes);
};
syncBuiltinESMExports();
registerHooks({
  load(url, context, nextLoad) {
    if (url.startsWith('file:')) {
      const bytes = old(new URL(url));
      if (bytes) return { format: url.endsWith('.json') ? 'json' : 'module', source: bytes, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
