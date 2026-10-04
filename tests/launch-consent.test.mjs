// A promotional email cannot go live without a recorded consent basis.
//
// WHY. The staged launch email (drafts/send-launch-sublevel-1.sh) sells a course
// to every confirmed account that has not opted out. Nothing in the product
// records consent to advertising email: signup has no opt-in, the one email
// preference (profiles.email_daily_sentence) is an opt-out, and /privacy/ §8
// names account and service messages and requested learning emails, not offers.
// Measured 2026-10-04 (revenue agent): 1,097 confirmed accounts not opted out,
// 11 of them ever paid. The team rule is "promotional mail needs recorded
// consent (§7 UWG)" (docs/agents/PROTOCOL.md), yet the script's precondition
// list checked the checkout and never the consent, and its banner called the
// audience "opted-in".
//
// RULE. Every send script under drafts/ that can still make a request refuses a
// live run until LAUNCH_CONSENT_BASIS is set, checks it before it claims the live
// stamp and before its first request, and copies the basis into the live stamp
// as the record. A retired script (its first command echoes RETIRED and exits)
// is exempt. Which basis is enough is the owner's legal call, not this test's.
//
// The behavioural half runs the real script with a stub `curl` first on PATH, so
// even a future edit that reorders the checks cannot reach the network from here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, mkdirSync, existsSync, chmodSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

const CONSENT_CHECK = '[[ -z "${consent_basis//[[:space:]]/}" ]]';

const isRetired = (sh) => {
  const firstCommand = sh.split('\n').slice(1).find((l) => l.trim() && !l.trim().startsWith('#'));
  return /^echo "RETIRED/.test(firstCommand || '');
};

/** Index of the first line that runs curl (comments and heredoc prose do not). */
const firstRequestLine = (lines) => lines.findIndex((l) => !l.trim().startsWith('#') && /\bcurl\s+-/.test(l));

const sendScripts = readdirSync(join(ROOT, 'drafts'))
  .filter((f) => /^send-.*\.sh$/.test(f))
  .map((f) => ({ name: `drafts/${f}`, sh: read(`drafts/${f}`) }));

test('there is at least one live-capable send script to guard', () => {
  assert.ok(sendScripts.some((s) => !isRetired(s.sh)), 'expected drafts/send-launch-sublevel-1.sh');
});

test('every live-capable send script checks the consent basis before the stamp and the request', () => {
  for (const { name, sh } of sendScripts) {
    if (isRetired(sh)) continue;
    const lines = sh.split('\n');
    const consentAt = lines.findIndex((l) => l.includes(CONSENT_CHECK));
    const requestAt = firstRequestLine(lines);
    const stampAt = lines.findIndex((l) => l.includes('> "$LIVE_STAMP"'));
    assert.ok(consentAt > 0, `${name}: no LAUNCH_CONSENT_BASIS check`);
    assert.ok(requestAt > 0, `${name}: no curl request found`);
    assert.ok(consentAt < requestAt, `${name}: the consent check must come before the first request`);
    assert.ok(stampAt > 0 && consentAt < stampAt, `${name}: the consent check must come before the live stamp is claimed`);
    assert.match(sh, /printf 'consent basis: %s\\n' "\$LAUNCH_CONSENT_BASIS" >> "\$LIVE_STAMP"/, `${name}: the basis is recorded in the live stamp`);
    assert.doesNotMatch(sh, /\bopted-in\b/i, `${name}: the audience is "not opted out"; nobody opted in`);
  }
});

test('the sequence draft lists the consent basis as a send precondition', () => {
  const draft = read('drafts/launch-sublevel-courses-2026-09.md');
  const pre = draft.slice(draft.indexOf('**Preconditions'), draft.indexOf('**Send days:**'));
  assert.match(pre, /LAUNCH_CONSENT_BASIS/);
  assert.match(pre, /§7 UWG/);
});

// --- behaviour: run the real script, with a curl that only leaves a marker -------

function runLive(extraEnv) {
  const tmp = mkdtempSync(join(tmpdir(), 'dm-launch-consent-'));
  const stubDir = join(tmp, 'bin');
  const stateDir = join(tmp, 'state');
  const marker = join(tmp, 'curl-was-called');
  mkdirSync(stubDir, { recursive: true });
  const stub = join(stubDir, 'curl');
  writeFileSync(stub, `#!/bin/sh\necho called > "${marker}"\nexit 7\n`);
  chmodSync(stub, 0o755);
  const res = spawnSync('bash', [join(ROOT, 'drafts/send-launch-sublevel-1.sh'), 'live'], {
    cwd: ROOT,
    encoding: 'utf8',
    input: '',
    timeout: 60_000,
    env: {
      PATH: [stubDir, dirname(process.execPath), process.env.PATH].join(delimiter),
      HOME: tmp,
      DM_LAUNCH_STATE_DIR: stateDir,
      CAMPAIGN_SECRET: 'placeholder-not-a-secret',
      LAUNCH_PRECONDITION_VERIFIED: 'yes',
      ...extraEnv,
    },
  });
  const out = {
    status: res.status,
    stderr: res.stderr || '',
    curlCalled: existsSync(marker),
    liveStamped: existsSync(join(stateDir, 'launch-sublevel-1.live-sent')),
  };
  rmSync(tmp, { recursive: true, force: true });
  return out;
}

test('a live run without LAUNCH_CONSENT_BASIS refuses before any request or stamp', () => {
  const r = runLive({});
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /REFUSING LIVE SEND: LAUNCH_CONSENT_BASIS is not set/);
  assert.equal(r.curlCalled, false, 'curl must not run');
  assert.equal(r.liveStamped, false, 'no live stamp may be claimed');
});

test('an empty LAUNCH_CONSENT_BASIS counts as unset', () => {
  const r = runLive({ LAUNCH_CONSENT_BASIS: '' });
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /LAUNCH_CONSENT_BASIS is not set/);
  assert.equal(r.curlCalled, false);
});

test('a LAUNCH_CONSENT_BASIS of only whitespace counts as unset', () => {
  for (const blank of [' ', '   ', '\n', ' \t\n ']) {
    const r = runLive({ LAUNCH_CONSENT_BASIS: blank });
    assert.equal(r.status, 1, JSON.stringify(blank));
    assert.match(r.stderr, /LAUNCH_CONSENT_BASIS is not set/, JSON.stringify(blank));
    assert.equal(r.curlCalled, false);
    assert.equal(r.liveStamped, false);
  }
});

test('with a stated basis the gate opens, and the next guard (an untested copy) still stops the run', () => {
  const r = runLive({ LAUNCH_CONSENT_BASIS: 'test fixture: no real decision' });
  assert.equal(r.status, 1, r.stderr);
  assert.doesNotMatch(r.stderr, /LAUNCH_CONSENT_BASIS is not set/);
  assert.match(r.stderr, /has not been sent in test mode yet/);
  assert.equal(r.curlCalled, false);
  assert.equal(r.liveStamped, false);
});
