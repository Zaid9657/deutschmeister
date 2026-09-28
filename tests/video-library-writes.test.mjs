// Guard: only the admins may write the video library, its rows and its files.
//
// Found 2026-09-28 (scorecard §3 #18): public.video_library had INSERT, UPDATE
// and DELETE policies TO authenticated with `true`, and the `video-library`
// storage bucket had the same three scoped only by bucket_id. Every signed-in
// account (signup is free) could delete or replace the 11 published videos,
// or host any file on our storage. The cause: the one legitimate writer,
// src/pages/AdminVideosPage.jsx, writes with the admin's own JWT, so the
// policies admitted that JWT and every other one.
// migrations/2026-09-28-video-library-admin-writes.sql admits only a JWT whose
// email is on src/config/admins.js ADMIN_EMAILS.
//
// The rules:
//   (a) the admin list inside the newest video-library migration equals
//       ADMIN_EMAILS exactly, in every expression of every write policy
//       (change both in one commit, or the database and the SPA disagree on
//       who is an admin);
//   (b) no migration gives a client role (public, anon, authenticated) a
//       write policy on video_library or on the bucket that is a bare `true`,
//       or that the admin check is missing from. On storage.objects that
//       includes a policy with no bucket_id at all, since it covers every
//       bucket, this one included.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { ADMIN_EMAILS } from '../src/config/admins.js';
import { stripComments, parsePolicies, parseDrops, key } from './helpers/rlsPolicies.mjs';

const MIGRATIONS = fileURLToPath(new URL('../migrations/', import.meta.url));
const FILES = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
const read = (f) => readFileSync(path.join(MIGRATIONS, f), 'utf8');
const REAL = FILES.map((f) => [f, read(f)]);

const CLIENT_ROLES = new Set(['public', 'anon', 'authenticated']);
const WRITE_CMDS = new Set(['INSERT', 'UPDATE', 'DELETE', 'ALL']);
const BUCKET = 'video-library';

// The six client write policies measured live on 2026-09-28 (pg_policies).
const LIVE_OPEN = [
  'video_library.Authenticated users can insert videos',
  'video_library.Authenticated users can update videos',
  'video_library.Authenticated users can delete videos',
  'objects.Authenticated upload for video-library',
  'objects.Authenticated update for video-library',
  'objects.Authenticated delete for video-library',
];
// Public reads the fix must leave alone.
const PUBLIC_READS = ['video_library.Published videos are viewable by everyone', 'objects.Public read access for video-library'];

// ---------------------------------------------------------------------------
// reading the SQL
// ---------------------------------------------------------------------------

const exprs = (p) => [p.using, p.check].filter((e) => e !== null && e !== undefined);
const norm = (e) => e.toLowerCase().replace(/::text/g, '').replace(/[\s()"]/g, '');

/** Does this policy let a client role write the video library's rows or files? */
function isVideoWrite(p) {
  if (!WRITE_CMDS.has(p.cmd) || !p.roles.some((r) => CLIENT_ROLES.has(r))) return false;
  if (p.schema === 'public' && p.table === 'video_library') return true;
  if (p.schema === 'storage' && p.table === 'objects') {
    const all = exprs(p).join(' ');
    return all.includes(`'${BUCKET}'`) || !/\bbucket_id\b/i.test(all); // no bucket_id: every bucket
  }
  return false;
}

// lower((select auth.jwt()) ->> 'email') IN ('a', 'b')  →  [['a', 'b'], ...]
const ADMIN_LIST = /auth\.jwt\(\)\s*\)?\s*->>\s*'email'\s*\)\s*IN\s*\(([^)]*)\)/gi;
const adminLists = (expr) =>
  [...expr.matchAll(ADMIN_LIST)].map((m) => [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]));

/** Why a video-library write policy is open, or null. */
function openness(p) {
  for (const e of exprs(p)) {
    if (norm(e) === 'true') return 'bare true';
    if (adminLists(e).length === 0) return `no admin check in (${e.replace(/\s+/g, ' ')})`;
  }
  if (exprs(p).length === 0) return 'no expression';
  return null;
}

const violations = (files) =>
  files.flatMap(([f, sql]) =>
    parsePolicies(sql).filter(isVideoWrite).filter((p) => openness(p)).map((p) => `${f}: ${key(p)} (${openness(p)})`));

const videoFiles = REAL.filter(([, sql]) => parsePolicies(sql).some(isVideoWrite));
const [NEWEST, NEWEST_SQL] = videoFiles.at(-1) ?? [];

// ---------------------------------------------------------------------------
// the scanner itself
// ---------------------------------------------------------------------------

test('the scanner flags bare true, bucket-only and every-bucket write policies, and accepts the admin check', () => {
  for (const bad of [
    'CREATE POLICY a ON public.video_library FOR INSERT TO authenticated WITH CHECK (true);',
    'CREATE POLICY a ON public.video_library FOR UPDATE TO authenticated USING (true);',
    'CREATE POLICY a ON video_library FOR DELETE USING ( TRUE );', // TO public by default
    "CREATE POLICY a ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'video-library'::text);",
    'CREATE POLICY a ON storage.objects FOR DELETE TO authenticated USING (true);', // every bucket
    "CREATE POLICY a ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'video-library' AND lower((select auth.jwt()) ->> 'email') IN ('x@y.z')) WITH CHECK (bucket_id = 'video-library');",
  ]) {
    assert.equal(violations([['bad.sql', bad]]).length, 1, bad);
  }
  for (const fine of [
    "CREATE POLICY a ON public.video_library FOR INSERT TO authenticated WITH CHECK (lower((select auth.jwt()) ->> 'email') IN ('x@y.z'));",
    'CREATE POLICY a ON public.video_library FOR SELECT USING (published = true);',
    'CREATE POLICY a ON public.video_library FOR ALL TO service_role USING (true) WITH CHECK (true);',
    "CREATE POLICY a ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);",
    '-- CREATE POLICY a ON public.video_library FOR DELETE TO authenticated USING (true);',
  ]) {
    assert.deepEqual(violations([['fine.sql', fine]]), [], fine);
  }
});

test('the scanner reads the admin list out of both spellings', () => {
  assert.deepEqual(adminLists("lower((select auth.jwt()) ->> 'email') IN ('a@b.c', 'd@e.f')"), [['a@b.c', 'd@e.f']]);
  assert.deepEqual(adminLists("lower(auth.jwt() ->> 'email') IN ('a@b.c')"), [['a@b.c']]);
});

// ---------------------------------------------------------------------------
// (b) no migration opens a write on the video library
// ---------------------------------------------------------------------------

test('no migration gives a client role a bare-true or unchecked write on video_library or its bucket', () => {
  assert.deepEqual(
    violations(REAL),
    [],
    `Every client write policy on public.video_library or the ${BUCKET} bucket must carry the admin check `
      + "(lower((select auth.jwt()) ->> 'email') IN (<ADMIN_EMAILS>)) in each USING and WITH CHECK.",
  );
});

// ---------------------------------------------------------------------------
// (a) the newest video-library migration uses exactly ADMIN_EMAILS
// ---------------------------------------------------------------------------

test('the newest video-library migration is the admin-writes one and covers all six writes', () => {
  assert.equal(NEWEST, '2026-09-28-video-library-admin-writes.sql');
  const writes = parsePolicies(NEWEST_SQL).filter(isVideoWrite);
  const bySchema = (s) => writes.filter((p) => p.schema === s).map((p) => p.cmd).sort();
  assert.deepEqual(bySchema('public'), ['DELETE', 'INSERT', 'UPDATE']);
  assert.deepEqual(bySchema('storage'), ['DELETE', 'INSERT', 'UPDATE']);
  for (const p of writes) {
    assert.deepEqual(p.roles, ['authenticated'], key(p));
    if (p.cmd === 'UPDATE') assert.ok(p.using && p.check, `${key(p)}: UPDATE needs USING and WITH CHECK`);
    if (p.schema === 'storage') for (const e of exprs(p)) assert.match(e, /bucket_id\s*=\s*'video-library'/, `${key(p)} stays in its bucket`);
  }
});

test('the admin list in the newest video-library migration equals ADMIN_EMAILS exactly', () => {
  const expected = [...ADMIN_EMAILS].sort();
  for (const email of ADMIN_EMAILS) assert.equal(email, email.toLowerCase(), 'the policy compares lower(email), so the list must be lower-case');

  const writes = parsePolicies(NEWEST_SQL).filter(isVideoWrite);
  let lists = 0;
  for (const p of writes) {
    for (const e of exprs(p)) {
      const found = adminLists(e);
      assert.equal(found.length, 1, `${key(p)}: one admin list per expression`);
      assert.deepEqual([...found[0]].sort(), expected, `${key(p)}: the list must equal src/config/admins.js ADMIN_EMAILS`);
      assert.equal(new Set(found[0]).size, found[0].length, `${key(p)}: no duplicates`);
      lists += 1;
    }
  }
  assert.equal(lists, 8, 'insert 1 + update 2 + delete 1, on the table and on the bucket');
});

test('the admin-writes migration drops the six open policies, keeps the public reads, and guards itself', () => {
  const sql = read('2026-09-28-video-library-admin-writes.sql');
  const drops = parseDrops(sql);
  for (const k of LIVE_OPEN) assert.ok(drops.has(k), `drops ${k}`);
  const created = parsePolicies(sql).map(key);
  for (const k of LIVE_OPEN) assert.ok(!created.includes(k), `does not recreate ${k}`);
  for (const k of PUBLIC_READS) assert.ok(!drops.has(k) && !created.includes(k), `leaves ${k} alone`);

  const body = stripComments(sql);
  assert.match(body, /^\s*BEGIN;/, 'one transaction');
  assert.match(body, /COMMIT;\s*$/, 'one transaction');
  assert.match(body, /video-library[\s\S]*auth\.jwt\(\)%''email''%[\s\S]*RAISE EXCEPTION/, 'the guard aborts if any client write still lacks the admin check');
  assert.doesNotMatch(body, /\b(DISABLE\s+ROW\s+LEVEL\s+SECURITY|GRANT\b)/i, 'never widens access');

  // The rollback must be complete enough to use: all six old policies, verbatim.
  for (const k of LIVE_OPEN) {
    const name = k.split('.').slice(1).join('.');
    assert.ok(sql.includes(`--   CREATE POLICY "${name}"`), `the rollback recreates ${name}`);
  }
});
