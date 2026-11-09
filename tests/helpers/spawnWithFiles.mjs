// Run real subprocesses with file-backed stdio. Restricted Linux executors
// may allow exec but reject synchronous pipe polling with EPERM, returning
// empty stdout even when the child succeeded. No result is mocked here.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, openSync, closeSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
export function spawnWithFiles(command, args, options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'dm-test-process-'));
  const out = join(dir, 'stdout'); const err = join(dir, 'stderr');
  const stdout = openSync(out, 'w'); const stderr = openSync(err, 'w');
  try {
    const result = spawnSync(command, args, { ...options, stdio: ['ignore', stdout, stderr] });
    return { ...result, stdout: readFileSync(out, options.encoding || undefined), stderr: readFileSync(err, options.encoding || undefined) };
  } finally {
    closeSync(stdout); closeSync(stderr); rmSync(dir, { recursive: true, force: true });
  }
}
