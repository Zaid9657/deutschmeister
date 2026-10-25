// Course reminder — the daily "your next Lektion is waiting" nudge.
//
// WHO IT REACHES. Learners who are IN a rebuilt course and paused mid-stride:
// latest course activity between 20 and 44 hours ago, inside the last 30 days.
// Selection is NOT derived here — it comes from ONE definition,
// public.course_reminder_candidates() (migrations/2026-09-13-course-reminder.sql),
// exactly as the activation journey reads lifecycle_customer_state. CLAUDE.md's
// rule: re-deriving status in the mailer is how the queue you look at stops
// being the queue you mailed.
//
// THE RULE THIS FUNCTION EXISTS TO KEEP: never tell someone they have not done
// a lesson when they have. Three things enforce it. The 20-hour floor is inside
// the SQL, so a learner who studied today cannot be selected at all;
// eligibility is RE-READ immediately before the claim, so a learner who opens
// a Lektion between selection and send is dropped from that batch; and the step
// the mail names is read from ALL of the learner's progress in the level (see
// "the next step" below). The copy then says nothing at all about what the
// learner did: it names the next step and stops. (Until 2026-09-12 it opened
// with "du warst vor Kurzem im Kurs", which was exactly the claim the comment
// below promised not to make.)
//
// THE NEXT STEP (2026-10-25). The SQL's next_lektion_nr is the highest Lektion
// finished in the last 30 days plus one, and it ignores checkpoints. So the
// mail named Lektion 4 at every chapter end, where the course home locks it
// until Checkpoint 1 is passed; "Weiter mit Lektion 12" after Lektion 12 was
// finished (13 was clamped to 12); and "Lektion 1" to someone whose earlier
// Lektionen were older than 30 days. nextStep() reads the learner's own
// lesson_progress rows (Lektion and checkpoint ids only, never a timestamp:
// who is warm stays the SQL's job) and names the open checkpoint, the next
// Lektion, or nothing: a learner with no Lektion and no checkpoint left is not
// mailed. Neither is a learner who can no longer open the level (canOpenLevel,
// the course guard's own rule): the link would end on a lock.
//
// FREQUENCY. At most 3 reminders per rolling 7 days per learner, counted from
// the ledger. The per-day claim is `course_reminder_<YYYY-MM-DD>` against
// lifecycle_emails' UNIQUE(user_id, kind) — the migration explains why the day
// lives in the kind instead of a new column.
//
// SHIPS OFF, twice over:
//   1. COURSE_REMINDER_ENABLED must be exactly 'true' or the run no-ops.
//   2. Even switched on, an unmigrated database cannot send: the RPC does not
//      exist (the run errors and sends nothing) and the ledger CHECK rejects
//      the kind, and a failed claim means no send.
// Canary: while LIFECYCLE_TEST_RECIPIENTS is set, ONLY those addresses are
// claimed or mailed. Dry run: ?dry=1 with the campaign secret reports counts,
// sends nothing, claims nothing.
import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { BRAND, emailHeader, ctaCell } from './_shared/brand.mjs';
import { socialFooterLine } from './_shared/socialLinks.mjs';
import { isBlockedEmail } from './_shared/emailHygiene.mjs';
import { tagEmailLink } from './_shared/emailLinks.mjs';
import { unsubscribeSecret, unsubscribeUrl, unsubscribeHeaders } from './_shared/unsubscribe.mjs';
import { productInfo } from './_shared/pricing.mjs';
import { subscriptionHasPaidAccess, latestCourseWindow } from './_shared/subscriptionEntitlement.mjs';
import { FREE_LEVELS } from './_shared/supportCatalog.mjs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_ADDRESS = 'Zaid from DeutschMeister <zaid@deutsch-meister.de>';
const BASE_URL = 'https://deutsch-meister.de';
const UNSUB_SECRET = unsubscribeSecret();
const CAMPAIGN_SECRET = process.env.CAMPAIGN_SECRET;
const BATCH_SIZE = 100;

/** Hours since the learner's last course activity that make them reachable. */
export const WINDOW_HOURS = { minHours: 20, maxHours: 44 };
/** How far back a lesson_progress row still counts as "in the course". */
export const WINDOW_DAYS = 30;
/** Reminders per rolling 7 days per learner. Three is a nudge; five is nagging. */
export const MAX_PER_7_DAYS = 3;

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Supabase init error:', e.message);
}

// ─── pure helpers (tested) ───────────────────────────────────────────────────

/**
 * The ledger kind for one run: one claim per learner per calendar day (UTC,
 * the clock the scheduler runs on). The migration's CHECK pins this exact
 * shape, so a change here needs a change there.
 */
export const reminderKindFor = (date = new Date()) =>
  `course_reminder_${new Date(date).toISOString().slice(0, 10)}`;

/**
 * Is this learner's last activity inside the sending window? The SQL already
 * applies the same test — this is the JS twin used for the re-read before the
 * claim, and the one the test pins, so the boundary behaviour is stated once:
 * the floor is inclusive (exactly 20 h ago is reachable), the ceiling is not.
 */
export function isWithinWindow(lastActivityAt, now = new Date(), window = WINDOW_HOURS) {
  const t = new Date(lastActivityAt).getTime();
  if (Number.isNaN(t)) return false;
  const ageHours = (new Date(now).getTime() - t) / 3600000;
  return ageHours >= window.minHours && ageHours < window.maxHours;
}

/** Has this learner had enough reminders lately? `sentAt` = ledger timestamps. */
export function overWeeklyCap(sentAt = [], now = new Date(), max = MAX_PER_7_DAYS) {
  const cutoff = new Date(now).getTime() - 7 * 24 * 3600000;
  return sentAt.filter((ts) => new Date(ts).getTime() >= cutoff).length >= max;
}

// ─── the course tables ───────────────────────────────────────────────────────
// The Lektion titles and checkpoints are copied here because a Netlify function
// cannot import src/data/curricula/ (browser modules in the SPA bundle). The
// copies are drift-guarded: tests/course-reminder.test.mjs compares both tables
// against CURRICULA, level by level, and fails if either side moves or a live
// level is missing here.

export const LEKTION_TITLES = {
  'a1.1': [
    'Hallo, ich bin …',
    'Ich bin Studentin',
    'Meine Familie',
    'Auf dem Flohmarkt',
    'Im Klassenzimmer',
    'Der erste Tag im Büro',
    'Freizeit und Hobbys',
    'Termine und Uhrzeit',
    'Im Café',
    'Am Bahnhof',
    'Mein Tag',
    'Feste feiern',
  ],
  'a1.2': [
    'Wie komme ich zum Rathaus?',
    'Die Wohnungsanzeige',
    'In der Stadt unterwegs',
    'Im Hotel reklamieren',
    'Pläne für das Wochenende',
    'In der Arztpraxis',
    'Wer ist das?',
    'Im Haushalt helfen',
    'Regeln unterwegs',
    'Kleidung kaufen',
    'Wie ist das Wetter?',
    'Das Fest war schön',
  ],
};

/** Each level's checkpoints: the Lektion that closes the chapter, and the title the course home shows. */
export const CHECKPOINT_AFTER = {
  'a1.1': [
    { nr: 1, afterLektion: 3, title: 'Checkpoint 1: Lektion 1–3' },
    { nr: 2, afterLektion: 6, title: 'Checkpoint 2: Lektion 4–6' },
    { nr: 3, afterLektion: 9, title: 'Checkpoint 3: Lektion 7–9' },
    { nr: 4, afterLektion: 12, title: 'Checkpoint 4: Lektion 10–12' },
  ],
  'a1.2': [
    { nr: 1, afterLektion: 3, title: 'Checkpoint 1: Lektion 1–3' },
    { nr: 2, afterLektion: 6, title: 'Checkpoint 2: Lektion 4–6' },
    { nr: 3, afterLektion: 9, title: 'Checkpoint 3: Lektion 7–9' },
    { nr: 4, afterLektion: 12, title: 'Checkpoint 4: Lektion 10–12' },
  ],
};

const lower = (level) => String(level || '').toLowerCase();

/** `a1.1` → `A1.1`, the code the learner sees on the course home. */
const levelCode = (level) => String(level || '').toUpperCase();

/**
 * The Lektion with this number, or null: a level without titles here, or a
 * number past the last Lektion (a finished course names no Lektion; until
 * 2026-10-25 13 was clamped to 12, "Weiter mit Lektion 12" after Lektion 12).
 */
export function nextLektion(level, nextNr) {
  const titles = LEKTION_TITLES[lower(level)];
  if (!titles || !titles.length) return null;
  const nr = Math.max(Math.trunc(Number(nextNr)) || 1, 1);
  if (nr > titles.length) return null;
  return { nr, title: titles[nr - 1] };
}

/** A checkpoint by number, with the Lektionen it covers, or null. */
export function checkpointFor(level, nr) {
  const list = CHECKPOINT_AFTER[lower(level)] || [];
  const i = list.findIndex((c) => c.nr === Number(nr));
  if (i === -1) return null;
  return { ...list[i], fromLektion: i === 0 ? 1 : list[i - 1].afterLektion + 1 };
}

const DONE = new Set(['complete', 'gold']);

/**
 * The learner's next step in a level, from their own lesson_progress rows for
 * it — all of them, not the SQL's 30-day slice. A course id is `<level>-l<nr>`
 * for a Lektion and `<level>-cp<nr>` for a checkpoint (checkpointService.js
 * writes those with status 'complete').
 *   { kind: 'checkpoint', nr, title }  the last finished Lektion closes a
 *                                      chapter whose checkpoint is not passed
 *                                      (the course home locks the next Lektion)
 *   { kind: 'lektion', nr, title }     the Lektion after the last finished one
 *   { kind: 'complete' }               no Lektion and no checkpoint left
 *   null                               a level with no tables here
 * `floorNr` (the SQL's next_lektion_nr) can only raise the Lektion: it is read
 * from the same table over 30 days.
 */
export function nextStep(level, rows = [], { floorNr = 1 } = {}) {
  const lvl = lower(level);
  const titles = LEKTION_TITLES[lvl];
  const checkpoints = CHECKPOINT_AFTER[lvl];
  if (!titles || !checkpoints) return null;
  let maxDone = Math.max((Math.trunc(Number(floorNr)) || 1) - 1, 0);
  const passed = new Set();
  for (const row of rows || []) {
    const id = String(row?.lektion_id || '');
    if (!DONE.has(row?.status) || !id.startsWith(`${lvl}-`)) continue;
    const rest = id.slice(lvl.length + 1);
    const lektion = /^l(\d{1,3})$/.exec(rest);
    if (lektion) maxDone = Math.max(maxDone, Number(lektion[1]));
    const cp = /^cp(\d{1,2})$/.exec(rest);
    if (cp) passed.add(Number(cp[1]));
  }
  // A number past the course is a row the course never writes: it ends the course, no further.
  maxDone = Math.min(maxDone, titles.length);
  const cp = checkpoints.find((c) => c.afterLektion === maxDone);
  if (cp && !passed.has(cp.nr)) return { kind: 'checkpoint', nr: cp.nr, title: cp.title };
  const next = nextLektion(lvl, maxDone + 1);
  return next ? { kind: 'lektion', ...next } : { kind: 'complete' };
}

/**
 * Can this learner still open the level? Mirrors SubscriptionContext.jsx
 * hasLevelAccess, the guard every /course/<level> link lands on: a free level;
 * a live trial (started, not ended, not flagged subscribed — checkTrialStatus);
 * a paid period (the latest subscriptions row, subscriptionStatus) or an
 * included course window (a purchase with access_until ahead); or an active
 * purchase whose course covers the level, which is lifetime.
 */
export function canOpenLevel(level, { profile = null, subscription = null, purchases = [] } = {}, now = Date.now()) {
  const lvl = lower(level);
  if (FREE_LEVELS.includes(lvl)) return true;
  const t = Number(now);
  if (profile?.trial_started_at && profile?.trial_ends_at && !profile.is_subscribed && Date.parse(profile.trial_ends_at) > t) return true;
  const active = (purchases || []).filter((p) => p.status === 'active');
  if (subscriptionHasPaidAccess(subscription, t) || latestCourseWindow(active, t)) return true;
  return active.some((p) => (productInfo(p.product_key)?.levels || []).includes(lvl));
}

// ─── copy ────────────────────────────────────────────────────────────────────
// German, short, kind, no pressure: no streak threat, no "nur noch", no
// figures, no exclamation mark other than the greeting's, and NO claim about
// what the learner did or did not do — not even a friendly one. It names the
// next step and links straight to it. /course/<level>, /course/<level>/l/<nr>
// and /course/<level>/checkpoint/<nr> are SPA rewrite routes, so they carry NO
// trailing slash (CLAUDE.md's three-slash-case rule, case 3). Until 2026-10-25
// the button said „Lektion N öffnen“ and opened the course home, untagged.
//
// THE LEVEL IS A1, AND SO IS THE GERMAN (owner-approved 2026-09-12, after the
// DaF review §F). Every recipient is by definition an A1 learner somewhere in
// Lektion 1–12, and the previous copy was idiomatic B1: an ellipsis („Wenn
// heute nichts geht: auch gut“), a Funktionsverbgefüge and a figurative
// „nichts geht verloren“ — a course that writes its own screens in controlled
// A1 must not mail B1. Short main clauses, present tense, words the course has
// already taught.
//
// SIE (2026-10-25). The course speaks Sie in its tasks, notices, cards and mail
// (CLAUDE.md, binding since 2026-09-30); this mail still said du. The greeting
// is „Guten Tag!“, the formal greeting Lektion 1's can-do teaches, and with a
// first name „Guten Tag, Ana!“. `vorname` is optional because the selection
// function carries no name today. „Sie“ is capitalised either way, so the
// sentence after the greeting needs no case juggling.

const REMINDER_UTM = { medium: 'lifecycle', campaign: 'course-reminder' };

const P = (text) => `<p style="margin:0 0 16px;font-size:16px;color:${BRAND.graphite};line-height:1.6;">${text}</p>`;

/** „Guten Tag, Ana!“ with a first name, „Guten Tag!“ without one. Nothing in between. */
export const greeting = (vorname) => {
  const name = String(vorname || '').trim().split(/\s+/)[0] || '';
  return name ? `Guten Tag, ${name}!` : 'Guten Tag!';
};

/**
 * Subject + body + CTA for one learner. `checkpointNr` names an open
 * checkpoint, else `nextNr` names a Lektion; with neither (or a level whose
 * tables are not here) the copy names no step rather than inventing one.
 * `vorname` is optional; see the note above.
 */
export function buildMessage({ level, nextNr = null, checkpointNr = null, vorname = null }) {
  const lvl = lower(level);
  const code = levelCode(lvl);
  const cp = checkpointNr == null ? null : checkpointFor(lvl, checkpointNr);
  const next = cp || nextNr == null ? null : nextLektion(lvl, nextNr);
  const path = cp ? `/course/${lvl}/checkpoint/${cp.nr}` : next ? `/course/${lvl}/l/${next.nr}` : `/course/${lvl}`;
  const strong = (text) => `<strong style="color:${BRAND.ink};">${text}</strong>`;
  return {
    subject: cp ? `Weiter mit ${cp.title}` : next ? `Weiter mit Lektion ${next.nr}: ${next.title}` : `Weiter im Kurs ${code}`,
    ctaHref: tagEmailLink(`${BASE_URL}${path}`, { ...REMINDER_UTM, content: 'cta' }),
    ctaLabel: cp ? `Checkpoint ${cp.nr} öffnen →` : next ? `Lektion ${next.nr} öffnen →` : 'Zum Kurs →',
    body:
      P(`${greeting(vorname)} Sie lernen Deutsch — sehr gut.`) +
      (cp
        ? P(`Als Nächstes kommt ${strong(`Checkpoint ${cp.nr}`)}. Er wiederholt Lektion ${cp.fromLektion} bis ${cp.afterLektion}.`)
        : next
          ? P(`Lektion ${next.nr} heißt ${strong(next.title)}. Sie ist kurz: ein Schritt pro Bildschirm.`)
          : P(`Ihr Kurs ${code} geht weiter. Die Lektionen sind kurz: ein Schritt pro Bildschirm.`)) +
      P('Sie können jederzeit aufhören. Bis bald.'),
  };
}

/** The footer's link home, tagged like the button (docs/tracking-links.md). */
export const FOOTER_HREF = tagEmailLink(`${BASE_URL}/`, { ...REMINDER_UTM, content: 'footer' });

const SHELL = ({ heading, body, ctaHref, ctaLabel, unsubUrl }) => `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:${BRAND.paper};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${BRAND.white};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.rule};">
        <tr>${emailHeader()}</tr>
        <tr>
          <td style="padding:36px 32px 28px;">
            ${body}
            <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr>${ctaCell(ctaHref, ctaLabel)}</tr>
            </table>
            <p style="margin:0;font-size:16px;color:${BRAND.ink};line-height:1.6;">— Zaid</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid ${BRAND.rule};text-align:center;">
            <p style="margin:0;font-size:12px;color:${BRAND.graphite};line-height:1.6;">
              DeutschMeister · <a href="${FOOTER_HREF}" style="color:${BRAND.graphite};">deutsch-meister.de</a>${socialFooterLine(BRAND.graphite, 'de')}<br>
              <a href="${unsubUrl}" style="color:${BRAND.graphite};">E-Mails von DeutschMeister abbestellen</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

/**
 * One Resend item for one recipient. The unsubscribe link asks for the German
 * page (&lang=de), and the List-Unsubscribe headers carry that same link.
 */
export function reminderItem(r) {
  const msg = buildMessage({ level: r.level, nextNr: r.nextNr, checkpointNr: r.checkpointNr, vorname: r.vorname });
  const unsubUrl = unsubscribeUrl(r.id, { lang: 'de' });
  return {
    from: FROM_ADDRESS,
    to: [r.email],
    reply_to: 'zaid@deutsch-meister.de',
    subject: msg.subject,
    html: SHELL({ heading: msg.subject, body: msg.body, ctaHref: msg.ctaHref, ctaLabel: msg.ctaLabel, unsubUrl }),
    headers: unsubscribeHeaders(unsubUrl),
  };
}

// ─── selection ───────────────────────────────────────────────────────────────

/** The candidate rows from the ONE definition, or a thrown error naming the migration. */
async function fetchCandidates(client = supabase, hours = WINDOW_HOURS) {
  const { data, error } = await client.rpc('course_reminder_candidates', {
    p_min_hours: hours.minHours,
    p_max_hours: hours.maxHours,
    p_window_days: WINDOW_DAYS,
  });
  if (error) throw new Error(`course_reminder_candidates failed (migration applied?): ${error.message}`);
  return data || [];
}

/**
 * The window, in hours before `now`, that covers every run from `span.first`
 * to `span.last`: a learner was due at a run t when their last activity lay
 * 20–44 h before t, so over the span it lies in (first − 44 h, last − 20 h].
 * The SQL takes whole hours, so both ends are rounded INWARD — the span may
 * lose an hour at an edge, it never gains a learner who was not due. No span:
 * today's run, WINDOW_HOURS exactly.
 */
export function windowHoursFor(span, now = Date.now(), window = WINDOW_HOURS) {
  if (!span) return window;
  const t = new Date(now).getTime();
  return {
    minHours: window.minHours + Math.ceil((t - span.last) / 3600000),
    maxHours: window.maxHours + Math.floor((t - span.first) / 3600000),
  };
}

const ID_CHUNK = 100;
const PAGE = 1000;

/** Every row of a paged read for `ids`, a chunk of ids per request. Throws on any error. */
async function readForIds(ids, build, what) {
  const rows = [];
  for (let i = 0; i < ids.length; i += ID_CHUNK) {
    const chunk = ids.slice(i, i + ID_CHUNK);
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await build(chunk).range(from, from + PAGE - 1);
      if (error) throw new Error(`${what} read failed: ${error.message}`);
      rows.push(...(data || []));
      if (!data || data.length < PAGE) break;
    }
  }
  return rows;
}

const groupBy = (rows, key) => {
  const out = new Map();
  for (const row of rows) {
    if (!out.has(row[key])) out.set(row[key], []);
    out.get(row[key]).push(row);
  }
  return out;
};

/**
 * Each learner's finished Lektionen and passed checkpoints, all time. Ids and
 * status only: when they were done is not this file's question, so nothing
 * here can drift from the SQL's idea of who is warm.
 */
async function readProgress(client, ids) {
  const rows = await readForIds(ids, (chunk) => client
    .from('lesson_progress')
    .select('user_id, lektion_id, status')
    .in('user_id', chunk)
    .in('status', [...DONE])
    .order('user_id')
    .order('lektion_id'), 'progress');
  return groupBy(rows, 'user_id');
}

/** The rows canOpenLevel reads, for the learners in a paid level. */
async function readAccess(client, ids) {
  if (ids.length === 0) return new Map();
  const [profiles, subscriptions, purchases] = await Promise.all([
    readForIds(ids, (chunk) => client.from('profiles').select('id, trial_started_at, trial_ends_at, is_subscribed').in('id', chunk).order('id'), 'profile'),
    readForIds(ids, (chunk) => client.from('subscriptions').select('user_id, status, subscription_end').in('user_id', chunk).order('user_id'), 'subscription'),
    readForIds(ids, (chunk) => client.from('purchases').select('user_id, product_key, status, access_until').in('user_id', chunk).eq('status', 'active').order('user_id'), 'purchase'),
  ]);
  const subsBy = groupBy(subscriptions, 'user_id');
  const purchasesBy = groupBy(purchases, 'user_id');
  const profileBy = new Map(profiles.map((p) => [p.id, p]));
  // getSubscription reads the row with the latest subscription_end; so does this.
  const latest = (rows = []) => rows.reduce((a, b) => (!a || (Date.parse(b.subscription_end) || 0) > (Date.parse(a.subscription_end) || 0) ? b : a), null);
  return new Map(ids.map((id) => [id, { profile: profileBy.get(id) || null, subscription: latest(subsBy.get(id)), purchases: purchasesBy.get(id) || [] }]));
}

// ONE definition of "who is due", read by this job and by the sentinel. The
// job passes nothing and gets today's run. The sentinel passes `span` =
// { first, last } (the scheduled runs since the last course_reminder_* row)
// and its clock, so a learner who became due after the last run — the next
// run's work — is not counted as missed. A learner with nothing left to name,
// or a level they can no longer open, is due for nothing: the job sends them
// nothing, so the sentinel counts nothing.
export async function selectRecipients({ client = supabase, span = null, now = Date.now() } = {}) {
  const rows = (await fetchCandidates(client, windowHoursFor(span, now))).filter((r) => !r.email_opted_out);
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.user_id);

  // Frequency cap from the ledger: every course_reminder_* claim in 7 days.
  const since = new Date(new Date(now).getTime() - 7 * 24 * 3600000).toISOString();
  const { data: ledger, error: ledgerError } = await client
    .from('lifecycle_emails')
    .select('user_id, kind, sent_at')
    .like('kind', 'course_reminder_%')
    .gte('sent_at', since)
    .in('user_id', ids);
  if (ledgerError) throw new Error(`ledger read failed: ${ledgerError.message}`);
  const history = new Map();
  for (const row of ledger || []) {
    if (!history.has(row.user_id)) history.set(row.user_id, []);
    history.get(row.user_id).push(row.sent_at);
  }

  // Confirmed, non-disposable addresses only — same hygiene as every other job.
  const emails = new Map();
  const confirmedAt = new Map();
  let page = 1;
  for (;;) {
    const { data, error: authError } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (authError) throw new Error(`listUsers: ${authError.message}`);
    for (const u of data.users) {
      if (u.email && u.email_confirmed_at) {
        emails.set(u.id, u.email.trim().toLowerCase());
        confirmedAt.set(u.id, Date.parse(u.email_confirmed_at));
      }
    }
    if (data.users.length < 1000) break;
    page++;
  }

  // Over a span, due at a run means confirmed at it: the run that selects a
  // learner comes at least minHours after their last activity, so an address
  // confirmed by then was confirmed at that run. Without a span this is moot.
  const confirmedInTime = (r) => !span || confirmedAt.get(r.user_id) <= Date.parse(r.last_activity_at) + WINDOW_HOURS.minHours * 3600000;

  const reachable = rows
    .filter((r) => emails.has(r.user_id) && confirmedInTime(r))
    .filter((r) => !isBlockedEmail(emails.get(r.user_id)))
    .filter((r) => !overWeeklyCap(history.get(r.user_id) || [], new Date(now)));
  if (reachable.length === 0) return [];

  // The step to name, and whether the link would open. A failed read throws:
  // the run then sends nothing, rather than a guess at a Lektion or a lock.
  const progress = await readProgress(client, reachable.map((r) => r.user_id));
  const access = await readAccess(client, reachable.filter((r) => !FREE_LEVELS.includes(lower(r.level))).map((r) => r.user_id));

  const out = [];
  for (const r of reachable) {
    const step = nextStep(r.level, progress.get(r.user_id) || [], { floorNr: r.next_lektion_nr });
    if (step?.kind === 'complete') continue;
    if (!canOpenLevel(r.level, access.get(r.user_id), now)) continue;
    out.push({
      id: r.user_id,
      email: emails.get(r.user_id),
      level: r.level,
      nextNr: step?.kind === 'lektion' ? step.nr : null,
      checkpointNr: step?.kind === 'checkpoint' ? step.nr : null,
      lastActivityAt: r.last_activity_at,
      // The selection function returns no name today, so the greeting is the
      // bare „Guten Tag!“. If it ever does, the copy picks it up with no edit here.
      vorname: r.vorname ?? null,
    });
  }
  return out;
}

/**
 * The re-read that keeps the rule: between selection and send a learner may
 * have opened a Lektion, which moves their last activity inside 20 hours. Ask
 * the ONE definition again and keep only those still in the window.
 */
async function recheckStillIdle(recipients) {
  if (recipients.length === 0) return [];
  const fresh = new Map((await fetchCandidates()).map((r) => [r.user_id, r]));
  return recipients.filter((r) => {
    const row = fresh.get(r.id);
    return Boolean(row) && !row.email_opted_out && isWithinWindow(row.last_activity_at);
  });
}

async function sendBatch(resendKey, items) {
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  });
  if (!res.ok) throw new Error(`Resend batch ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

// ─── handler ─────────────────────────────────────────────────────────────────

const innerHandler = async (event) => {
  if (process.env.COURSE_REMINDER_ENABLED !== 'true') {
    console.log('[course-reminder] COURSE_REMINDER_ENABLED is not "true" — doing nothing.');
    return { statusCode: 200, body: JSON.stringify({ enabled: false, sent: 0 }) };
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { statusCode: 500, body: 'RESEND_API_KEY not set' };
  if (!supabaseKey) return { statusCode: 500, body: 'SUPABASE_SERVICE_ROLE_KEY not set' };
  if (!UNSUB_SECRET) return { statusCode: 500, body: 'UNSUB_SECRET / CAMPAIGN_SECRET not set' };

  // Same auth shape as the other mailers: scheduler invocations carry next_run,
  // manual runs need the campaign secret. Never publicly triggerable.
  const qs = event.queryStringParameters || {};
  let bodyPayload = {};
  try { bodyPayload = JSON.parse(event.body || '{}'); } catch { /* ignore */ }
  const isScheduled = typeof bodyPayload.next_run === 'string';
  const secretOk = Boolean(CAMPAIGN_SECRET) && qs.secret === CAMPAIGN_SECRET;
  if (!isScheduled && !secretOk) {
    console.warn('[course-reminder] rejected unauthenticated invocation');
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const dry = qs.dry === '1';
  const canary = new Set(
    (process.env.LIFECYCLE_TEST_RECIPIENTS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  if (canary.size > 0) console.log(`[course-reminder] canary mode: ${canary.size} allowlisted address(es)`);

  const kind = reminderKindFor();
  let sent = 0;
  let failed = 0;

  try {
    let recipients = await selectRecipients();
    if (canary.size > 0) recipients = recipients.filter((r) => canary.has(r.email));

    if (dry) {
      console.log(`[course-reminder] dry run: ${recipients.length} would be sent (${kind})`);
      return { statusCode: 200, body: JSON.stringify({ enabled: true, dry: true, kind, wouldSend: recipients.length }) };
    }

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      // Eligibility re-read per slice, immediately before the claim.
      const slice = await recheckStillIdle(recipients.slice(i, i + BATCH_SIZE));
      if (slice.length === 0) continue;

      // Claim BEFORE send: UNIQUE(user_id, kind) means a repeated or concurrent
      // run on the same day cannot double-mail; a crash after this point costs
      // at most one missed reminder.
      const { data: claims, error: claimError } = await supabase
        .from('lifecycle_emails')
        .upsert(slice.map((r) => ({ user_id: r.id, kind })), { onConflict: 'user_id,kind', ignoreDuplicates: true })
        .select('user_id');
      if (claimError) {
        console.error('[course-reminder] could not claim batch, skipping:', claimError.message);
        failed += slice.length;
        continue;
      }

      const claimedIds = new Set((claims || []).map((r) => r.user_id));
      const claimed = slice.filter((r) => claimedIds.has(r.id));
      if (claimed.length === 0) continue;

      const items = claimed.map((r) => reminderItem(r));

      try {
        await sendBatch(resendKey, items);
        sent += claimed.length;
      } catch (err) {
        failed += claimed.length;
        console.error('[course-reminder] batch failed:', err.message);
      }
    }
  } catch (err) {
    console.error('[course-reminder] run failed:', err.message);
    return { statusCode: 200, body: JSON.stringify({ enabled: true, kind, sent, failed, error: err.message }) };
  }

  console.log(`[course-reminder] ${kind}: sent ${sent}, failed ${failed}`);
  return { statusCode: 200, body: JSON.stringify({ enabled: true, kind, sent, failed }) };
};

// 18:00 UTC — evening in Germany, hours after every other mailer
// (daily-sentence 07:00, trial-lifecycle 08:00, activation-lifecycle 09:30,
// weekly-truth Mondays 06:00), so no learner gets two DeutschMeister mails in
// one sitting and the nudge lands when there is time to study.
export const handler = schedule('0 18 * * *', innerHandler);
