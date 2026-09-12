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
// a lesson when they have. Two things enforce it. The 20-hour floor is inside
// the SQL, so a learner who studied today cannot be selected at all; and
// eligibility is RE-READ immediately before the claim, so a learner who opens
// a Lektion between selection and send is dropped from that batch. The copy
// therefore never asserts a gap — it says "vor Kurzem" and nothing sharper,
// because the window spans two calendar days.
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
import { createHmac } from 'crypto';
import { BRAND, emailHeader, ctaCell } from './_shared/brand.mjs';
import { isBlockedEmail } from './_shared/emailHygiene.mjs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_ADDRESS = 'Zaid from DeutschMeister <zaid@deutsch-meister.de>';
const BASE_URL = 'https://deutsch-meister.de';
const UNSUB_SECRET = process.env.UNSUB_SECRET || process.env.CAMPAIGN_SECRET;
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

function unsubscribeUrl(userId) {
  const token = createHmac('sha256', UNSUB_SECRET).update(userId).digest('hex');
  return `${BASE_URL}/.netlify/functions/unsubscribe?uid=${userId}&token=${token}`;
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

// ─── copy ────────────────────────────────────────────────────────────────────
// German (the course engine's screens are German), short, kind, no pressure:
// no streak threat, no "nur noch", no figures, no exclamation marks, and no
// claim about what the learner did or did not do. It names the next Lektion
// and links to the course home — /course/<level> is an SPA rewrite route, so
// it carries NO trailing slash (CLAUDE.md's three-slash-case rule, case 3).
//
// The Lektion titles are copied here because a Netlify function cannot import
// src/data/curricula/a11.js (a browser module in the SPA bundle). The copy is
// drift-guarded: tests/course-reminder.test.mjs compares this table against
// CURRICULUM_A11 title by title and fails if either side moves.

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
    'Gestern und heute',
    'Feste feiern',
  ],
};

/** `a1.1` → `A1.1`, the code the learner sees on the course home. */
const levelCode = (level) => String(level || '').toUpperCase();

/** The next Lektion's number and title, clamped to the level's length. */
export function nextLektion(level, nextNr) {
  const titles = LEKTION_TITLES[String(level || '').toLowerCase()];
  if (!titles || !titles.length) return null;
  const nr = Math.min(Math.max(Number(nextNr) || 1, 1), titles.length);
  return { nr, title: titles[nr - 1] };
}

const P = (text) => `<p style="margin:0 0 16px;font-size:16px;color:${BRAND.graphite};line-height:1.6;">${text}</p>`;

/**
 * Subject + body + CTA for one learner. `next` may be null (a level whose
 * titles are not in the table yet) — the copy then names no Lektion rather
 * than inventing one.
 */
export function buildMessage({ level, nextNr }) {
  const next = nextLektion(level, nextNr);
  const code = levelCode(level);
  const ctaHref = `${BASE_URL}/course/${String(level).toLowerCase()}`;
  return {
    subject: next ? `Weiter mit Lektion ${next.nr}: ${next.title}` : `Weiter im Kurs ${code}`,
    ctaHref,
    ctaLabel: next ? `Lektion ${next.nr} öffnen →` : 'Zum Kurs →',
    body:
      P('Hallo, du warst vor Kurzem im Kurs — genau das ist der Teil, der zählt.') +
      (next
        ? P(`Als Nächstes wartet <strong style="color:${BRAND.ink};">Lektion ${next.nr}: ${next.title}</strong>. Ein Schritt pro Bildschirm, du kannst jederzeit aufhören.`)
        : P(`Dein Kurs ${code} steht genau da, wo du aufgehört hast. Ein Schritt pro Bildschirm, du kannst jederzeit aufhören.`)) +
      P('Wenn heute nichts geht: auch gut. Der Kurs wartet, und nichts geht verloren.'),
  };
}

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
              DeutschMeister · <a href="${BASE_URL}" style="color:${BRAND.graphite};">deutsch-meister.de</a><br>
              <a href="${unsubUrl}" style="color:${BRAND.graphite};">Diese E-Mails abbestellen</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── selection ───────────────────────────────────────────────────────────────

/** The candidate rows from the ONE definition, or a thrown error naming the migration. */
async function fetchCandidates() {
  const { data, error } = await supabase.rpc('course_reminder_candidates', {
    p_min_hours: WINDOW_HOURS.minHours,
    p_max_hours: WINDOW_HOURS.maxHours,
    p_window_days: WINDOW_DAYS,
  });
  if (error) throw new Error(`course_reminder_candidates failed (migration applied?): ${error.message}`);
  return data || [];
}

async function selectRecipients() {
  const rows = (await fetchCandidates()).filter((r) => !r.email_opted_out);
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.user_id);

  // Frequency cap from the ledger: every course_reminder_* claim in 7 days.
  const since = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
  const { data: ledger, error: ledgerError } = await supabase
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
  let page = 1;
  for (;;) {
    const { data, error: authError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (authError) throw new Error(`listUsers: ${authError.message}`);
    for (const u of data.users) {
      if (u.email && u.email_confirmed_at) emails.set(u.id, u.email.trim().toLowerCase());
    }
    if (data.users.length < 1000) break;
    page++;
  }

  return rows
    .filter((r) => emails.has(r.user_id))
    .filter((r) => !isBlockedEmail(emails.get(r.user_id)))
    .filter((r) => !overWeeklyCap(history.get(r.user_id) || []))
    .map((r) => ({
      id: r.user_id,
      email: emails.get(r.user_id),
      level: r.level,
      nextNr: r.next_lektion_nr,
      lastActivityAt: r.last_activity_at,
    }));
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
      const { error: claimError } = await supabase
        .from('lifecycle_emails')
        .upsert(slice.map((r) => ({ user_id: r.id, kind })), { onConflict: 'user_id,kind', ignoreDuplicates: true });
      if (claimError) {
        console.error('[course-reminder] could not claim batch, skipping:', claimError.message);
        failed += slice.length;
        continue;
      }

      const items = slice.map((r) => {
        const msg = buildMessage({ level: r.level, nextNr: r.nextNr });
        return {
          from: FROM_ADDRESS,
          to: [r.email],
          reply_to: 'zaid@deutsch-meister.de',
          subject: msg.subject,
          html: SHELL({
            heading: msg.subject,
            body: msg.body,
            ctaHref: msg.ctaHref,
            ctaLabel: msg.ctaLabel,
            unsubUrl: unsubscribeUrl(r.id),
          }),
        };
      });

      try {
        await sendBatch(resendKey, items);
        sent += slice.length;
      } catch (err) {
        failed += slice.length;
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
