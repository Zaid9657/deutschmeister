// scripts/ping-indexnow.mjs runs at the end of EVERY Netlify build (netlify.toml
// has no [context] override). Until 2026-10-25 deploy previews and branch
// deploys each submitted all ~133 production URLs to IndexNow for changes that
// were not live; repeated unchanged submissions get a host de-prioritised.
// Netlify sets CONTEXT per build; only "production" may submit.
//
// The script runs here in an empty working directory: when it is NOT skipped it
// stops at the missing key or the missing dist/ sitemaps, long before a request
// could be made — so no run of this test can reach the network.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const SCRIPT = fileURLToPath(new URL('../scripts/ping-indexnow.mjs', import.meta.url));

function run(env) {
  const cwd = mkdtempSync(join(tmpdir(), 'indexnow-'));
  try {
    const r = spawnSync(process.execPath, [SCRIPT], { cwd, env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });
    return { status: r.status, out: `${r.stdout}\n${r.stderr}` };
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

test('deploy previews, branch deploys and unknown contexts submit nothing', () => {
  for (const CONTEXT of ['deploy-preview', 'branch-deploy', 'dev', undefined]) {
    const env = { INDEXNOW_KEY: 'test-key', ...(CONTEXT ? { CONTEXT } : {}) };
    const { status, out } = run(env);
    assert.equal(status, 0, `CONTEXT=${CONTEXT}: a skip is not a failure (${out})`);
    assert.match(out, /IndexNow: skipped/, `CONTEXT=${CONTEXT}: the skip is logged`);
    assert.doesNotMatch(out, /Found \d+ URLs|Submitting|No page sitemap/, `CONTEXT=${CONTEXT}: it went on to collect URLs`);
  }
});

test('a production deploy goes on to submit (and still fails closed without a key)', () => {
  const noKey = run({ CONTEXT: 'production' });
  assert.equal(noKey.status, 1);
  assert.match(noKey.out, /INDEXNOW_KEY env var is not set/, 'production passes the gate and reaches the key check');
  const withKey = run({ CONTEXT: 'production', INDEXNOW_KEY: 'test-key' });
  assert.equal(withKey.status, 1);
  assert.match(withKey.out, /No page sitemap found/, 'production with a key reads the built sitemaps (none in this empty directory)');
});
