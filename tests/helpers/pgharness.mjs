// Throwaway-Postgres harness for the speaking-ledger integration tests.
//
// Spins a private cluster in a temp dir (unix socket only, no TCP port
// fights), stubs the two Supabase-isms the migration needs (auth.users,
// auth.uid()) and applies a migration file. Dependency-free: everything goes
// through the `psql` binary, so the suite can run wherever Postgres server
// binaries exist and SKIP loudly where they don't (CI without Postgres).
import { spawnSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Postgres refuses to run as root. When this process IS root (containers),
// re-exec every pg command through `runuser` as an unprivileged user — any
// existing non-root account works; we look for one that can own the data dir.
function unprivilegedUser() {
  if (typeof process.getuid !== 'function' || process.getuid() !== 0) return null;
  for (const candidate of ['dmpg', 'postgres', 'nobody']) {
    const r = spawnSync('id', ['-u', candidate], { encoding: 'utf8' });
    if (r.status === 0) return candidate;
  }
  return null;
}

const PG_BIN_CANDIDATES = [
  '/usr/lib/postgresql/16/bin',
  '/usr/lib/postgresql/15/bin',
  '/usr/local/pgsql/bin',
];

/** Whether a throwaway cluster can actually start here (binaries + a runnable user). */
export function canRunCluster() {
  if (!findPgBin()) return false;
  if (typeof process.getuid === 'function' && process.getuid() === 0 && !unprivilegedUser()) return false;
  return true;
}

export function findPgBin() {
  for (const dir of PG_BIN_CANDIDATES) {
    if (existsSync(join(dir, 'initdb'))) return dir;
  }
  const which = spawnSync('which', ['initdb'], { encoding: 'utf8' });
  if (which.status === 0) return join(which.stdout.trim(), '..');
  return null;
}

export function startCluster() {
  const bin = findPgBin();
  if (!bin) return null;
  const asUser = unprivilegedUser();
  if (typeof process.getuid === 'function' && process.getuid() === 0 && !asUser) return null;
  const dir = mkdtempSync(join(tmpdir(), 'dm-pg-'));
  if (asUser) {
    chmodSync(dir, 0o777);
    spawnSync('chown', ['-R', asUser, dir]);
  }
  const dataDir = join(dir, 'data');
  const wrap = (cmd, args) => (asUser ? ['runuser', ['-u', asUser, '--', join(bin, cmd), ...args]] : [join(bin, cmd), args]);
  const run = (cmd, args) => {
    const [exe, argv] = wrap(cmd, args);
    const r = spawnSync(exe, argv, { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr || r.stdout}`);
    return r;
  };
  run('initdb', ['-D', dataDir, '-A', 'trust', '-U', 'postgres', '--no-sync']);
  run('pg_ctl', ['-D', dataDir, '-o', `-c listen_addresses='' -k ${dir}`, '-w', 'start', '-l', join(dir, 'pg.log')]);
  const cluster = {
    bin,
    dir,
    sql(query, { db = 'postgres', expectFail = false } = {}) {
      const [exe, argv] = wrap('psql', ['-h', dir, '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-tA', '-c', query]);
      const r = spawnSync(exe, argv, { encoding: 'utf8' });
      if (!expectFail && r.status !== 0) throw new Error(`psql failed: ${r.stderr}\nquery: ${query}`);
      return { status: r.status, out: r.stdout.trim(), err: r.stderr.trim() };
    },
    sqlFile(path, { db = 'postgres' } = {}) {
      const [exe, argv] = wrap('psql', ['-h', dir, '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-f', path]);
      const r = spawnSync(exe, argv, { encoding: 'utf8' });
      if (r.status !== 0) throw new Error(`psql -f failed: ${r.stderr}`);
      return r.stdout.trim();
    },
    /** Run several statements truly concurrently; resolves with each result. */
    async sqlParallel(queries, { db = 'postgres' } = {}) {
      return Promise.all(queries.map((query) => new Promise((resolve) => {
        const [exe, argv] = wrap('psql', ['-h', dir, '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-tA', '-c', query]);
        const p = spawn(exe, argv);
        let out = '';
        let err = '';
        p.stdout.on('data', (d) => { out += d; });
        p.stderr.on('data', (d) => { err += d; });
        p.on('close', (status) => resolve({ status, out: out.trim(), err: err.trim() }));
      })));
    },
    stop() {
      try {
        const [exe, argv] = wrap('pg_ctl', ['-D', dataDir, '-m', 'immediate', 'stop']);
        spawnSync(exe, argv, { encoding: 'utf8' });
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  };
  // Supabase-isms the migrations reference.
  cluster.sql(`create schema if not exists auth`);
  cluster.sql(`create table if not exists auth.users (id uuid primary key)`);
  cluster.sql(`create or replace function auth.uid() returns uuid language sql stable as 'select null::uuid'`);
  return cluster;
}
