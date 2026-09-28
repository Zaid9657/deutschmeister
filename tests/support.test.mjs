// Support reachability (docs/SCORECARD.md work order #10).
//
// A ticket system shipped on 2026-09-13 (support-ticket-create, the admin
// support centre, migrations/2026-09-13-admin-panel-operations.sql) and drew
// 0 tickets from 1,685 accounts. Its only form sat at the bottom of /profile,
// behind SubscriptionGuard: measured 2026-09-27, 30 accounts in trial + 9 live
// subscriptions could open it — the other ~97%, and every signed-out visitor,
// had no way to write to us. This suite pins the fix as a rule, not a list:
//
//   1. ONE registry entry (SUPPORT_LINK) — a plain SPA route, which puts it
//      under navigation.test.mjs's three-place + trailing-slash checks.
//   2. /support carries NO guard (the failure that hid the form).
//   3. Every surface that is a user's way out renders it: both footers, the
//      account menu (desktop + mobile), and both course-home footers (the
//      course home drops the site footer).
//   4. The payment and speaking failure states link to it.
//   5. The payload the form sends is the one the handler accepts — driven
//      through the REAL handler with a stubbed Supabase client, identity
//      from the JWT and never from the body.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { SUPPORT_LINK, ALL_NAV_ITEMS } from '../src/data/navigation.js';
import {
  SUPPORT_ENDPOINT, SUPPORT_CATEGORIES, SUBJECT_MIN, BODY_MIN, categoryForTopic, ticketPayload,
} from '../src/lib/supportTicket.js';
import { CATEGORIES } from '../netlify/functions/_shared/adminSupportLib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// ─── 1–2. The entry and its route ────────────────────────────────────────────

test('SUPPORT_LINK is one plain SPA route (no trailing slash) inside ALL_NAV_ITEMS', () => {
  assert.equal(SUPPORT_LINK.href, '/support');
  assert.equal(SUPPORT_LINK.kind, 'spa');
  assert.ok(SUPPORT_LINK.labelEn && SUPPORT_LINK.labelDe);
  assert.ok(ALL_NAV_ITEMS.includes(SUPPORT_LINK), 'must be in ALL_NAV_ITEMS so the three-place checks cover it');
});

test('/support is routed with NO guard, rewritten in netlify.toml, and not crawlable', () => {
  const app = read('src/App.jsx');
  // The element is the bare page: no SubscriptionGuard / ProtectedRoute /
  // EmailVerificationGate / OnboardingGate — the page handles signed-out itself.
  assert.match(app, /<Route path="\/support" element=\{<SupportPage \/>\} \/>/);
  assert.match(read('netlify.toml'), /from = "\/support"\s*\n\s*to = "\/app\.html"\s*\n\s*status = 200/);
  assert.ok(!read('public/sitemap-spa.xml').includes('/support'), 'noindex page must stay out of the sitemap');
  assert.ok(!/path:\s*'\/support'/.test(read('scripts/prerender-spa-routes.mjs')), 'not prerendered');
  const page = read('src/pages/SupportPage.jsx');
  assert.match(page, /noindex/);
  assert.match(page, /<SupportRequestForm initialCategory=/, 'signed in: the ticket form');
  assert.match(page, /to="\/login" state=\{\{ from: \{ pathname: SUPPORT_LINK\.href \} \}\}/, 'signed out: sign in and come back');
  assert.match(page, /ORGANIZATION_FULL\.contactPoint\.email/, 'signed out: the published address, never a retyped one');
});

// ─── 3. Every way out renders it ─────────────────────────────────────────────

test('both footers, the account menu and both course-home footers render SUPPORT_LINK', () => {
  assert.match(read('src/components/Footer.jsx'), /<FooterLink item=\{SUPPORT_LINK\}/, 'SPA footer');
  assert.match(read('astro-site/src/layouts/Layout.astro'), /href=\{SUPPORT_LINK\.href\}/, 'Astro footer');
  const navbar = read('src/components/Navbar.jsx');
  assert.equal((navbar.match(/to=\{SUPPORT_LINK\.href\}/g) || []).length, 2, 'account menu: desktop + mobile');
  for (const f of ['src/pages/CurriculumHomePage.jsx', 'src/pages/CourseHomePage.jsx']) {
    assert.match(read(f), /to=\{SUPPORT_LINK\.href\}/, `${f}: the course home has no site footer, so its own footer must carry support`);
  }
});

test('no source retypes the /support path (registry + the App.jsx route only)', () => {
  const allowed = new Set(['src/App.jsx', 'src/data/navigation.js', 'astro-site/src/data/navigation.js']);
  const offenders = [];
  const walk = (dir) => {
    for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) { walk(rel); continue; }
      if (!/\.(js|jsx|astro|mjs)$/.test(e.name) || allowed.has(rel)) continue;
      if (/['"`]\/support(?:[?'"`])/.test(read(rel))) offenders.push(rel);
    }
  };
  ['src', 'astro-site/src'].forEach(walk);
  assert.deepEqual(offenders, [], `link via SUPPORT_LINK.href: ${offenders.join(', ')}`);
});

// ─── 4. Failure states ───────────────────────────────────────────────────────

test('payment and speaking failure states carry "Something wrong? Tell us"', () => {
  const link = read('src/components/ReportProblemLink.jsx');
  assert.match(link, /SUPPORT_LINK\.href\}\?topic=/, 'the link targets /support with a preselected topic');
  assert.match(link, /Something wrong\? Tell us/);
  const success = read('src/pages/SubscriptionSuccessPage.jsx');
  assert.equal((success.match(/<ReportProblemLink topic="payment" \/>/g) || []).length, 2, 'success AND delayed-activation branch');
  assert.match(read('src/pages/SubscriptionPage.jsx'), /<ReportProblemLink topic="payment" \/>/, 'failed "already paid?" verification');
  assert.match(read('src/pages/SpeakingPage.jsx'), /<ReportProblemLink topic="technical" \/>/, 'session start error');
  assert.match(read('src/components/speaking/SpeakingSession.jsx'), /<ReportProblemLink topic="technical" newTab \/>/, 'turn error — new tab, the session keeps running');
});

// ─── 5. The contract ─────────────────────────────────────────────────────────

test('the form speaks the contract module; categories equal the function/DB CHECK list', () => {
  assert.equal(SUPPORT_ENDPOINT, '/.netlify/functions/support-ticket-create');
  assert.ok(existsSync(join(root, 'netlify/functions/support-ticket-create.mjs')));
  assert.deepEqual(SUPPORT_CATEGORIES.map(([id]) => id), [...CATEGORIES]);
  const form = read('src/components/SupportRequestForm.jsx');
  assert.match(form, /fetch\(SUPPORT_ENDPOINT, \{ method: 'POST'/);
  assert.match(form, /call\(ticketPayload\(\{ subject, category, body \}\)\)/);
  assert.match(form, /getAuthHeaders\(\)/, 'the JWT rides in the Authorization header');
  assert.equal(categoryForTopic('payment'), 'payment');
  assert.equal(categoryForTopic('nonsense'), 'technical');
  assert.equal(categoryForTopic(null), 'technical');
});

/** A stub of the few supabase-js calls the handler makes; records every insert. */
function stubSupabase(supabase, { userId }) {
  const inserts = [];
  supabase.auth.getUser = async (token) =>
    token === 'valid-jwt' ? { data: { user: { id: userId } }, error: null } : { data: {}, error: { message: 'bad jwt' } };
  supabase.from = (table) => {
    const chain = {
      select: () => chain, eq: () => chain, in: () => chain, order: () => chain, limit: () => chain,
      maybeSingle: async () => ({ data: table === 'profiles' ? { email: 'learner@example.com', current_level: 'A1.1', exam_track: null, subscription_tier: null } : null, error: null }),
      insert: async (row) => { inserts.push({ table, row }); return { error: null }; },
      then: (ok, fail) => Promise.resolve({ count: 0, data: [], error: null }).then(ok, fail),
    };
    return chain;
  };
  return inserts;
}

test('end to end: the form payload opens a ticket through the real handler, identity from the JWT', async () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
  const { supabase } = await import('../netlify/functions/_shared/supabase.mjs');
  const inserts = stubSupabase(supabase, { userId: 'jwt-user' });
  const { handler } = await import('../netlify/functions/support-ticket-create.mjs');

  const post = (payload, authorization) =>
    handler({ httpMethod: 'POST', headers: authorization ? { authorization } : {}, body: JSON.stringify(payload) });

  // Exactly at the thresholds the form's minLength enforces.
  const payload = ticketPayload({ subject: 'x'.repeat(SUBJECT_MIN), category: categoryForTopic('payment'), body: 'y'.repeat(BODY_MIN) });

  assert.equal((await post(payload)).statusCode, 401, 'no JWT → 401');
  assert.equal((await post(payload, 'Bearer forged')).statusCode, 401, 'invalid JWT → 401');
  assert.equal((await post({ ...payload, subject: 'x'.repeat(SUBJECT_MIN - 1) }, 'Bearer valid-jwt')).statusCode, 400);
  assert.equal((await post({ ...payload, body: 'y'.repeat(BODY_MIN - 1) }, 'Bearer valid-jwt')).statusCode, 400);
  assert.equal(inserts.length, 0, 'nothing written for rejected requests');

  // A forged user_id in the body must be ignored.
  const res = await post({ ...payload, user_id: 'someone-else' }, 'Bearer valid-jwt');
  assert.equal(res.statusCode, 200, res.body);
  const out = JSON.parse(res.body);
  assert.equal(out.ok, true);
  assert.match(out.reference, /^DM-[0-9A-F]{8}$/);

  const ticket = inserts.find((i) => i.table === 'support_tickets')?.row;
  const message = inserts.find((i) => i.table === 'support_ticket_messages')?.row;
  assert.ok(ticket && message, 'a ticket and its first message are written');
  assert.equal(ticket.user_id, 'jwt-user', 'identity from the verified JWT, never the body');
  assert.equal(ticket.subject, payload.subject);
  assert.equal(ticket.category, 'payment');
  assert.equal(ticket.channel, 'in_app');
  assert.equal(ticket.id, out.ticketId);
  assert.equal(message.ticket_id, out.ticketId);
  assert.equal(message.body, payload.body);
  assert.equal(message.author_type, 'user');
  assert.equal(message.visibility, 'public');
});
