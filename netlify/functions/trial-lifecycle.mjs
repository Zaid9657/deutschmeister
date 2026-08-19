// Lifecycle emails — the missing middle of the funnel.
//
// Until recently the only emails a signed-up learner ever received were the
// welcome mail and the daily sentence. Nothing told them their trial was
// ending, and nothing brought them back after it lapsed: 1,450 signups produced
// 4 paying subscriptions. This sends four messages, once each, per user:
//
//   activation_day1 — signed up yesterday and never opened a lesson
//   trial_day3      — day 3 of the trial: what you haven't tried yet
//   trial_day6      — the day before it ends: here's what you keep, or lose
//   trial_ended     — the day after: your progress is saved, one click restores it
//
// The three trial messages are selected on trial dates and go out whatever the
// learner has done. `activation_day1` is the only one selected on *behaviour*,
// and it exists because the dates were never the problem: 136 of the 152
// accounts created in the last 30 days (89%) have never completed a single
// grammar topic. Day 1 is also the emptiest slot in the calendar — the trial
// mails occupy days 3, 6 and 8 — and the moment intent is highest.
//
// Safe to re-run: every send is recorded in `lifecycle_emails` with a
// UNIQUE(user_id, kind), and the insert happens BEFORE the send, so a crash
// mid-run can drop a message but can never duplicate one. Opted-out users
// (profiles.email_daily_sentence = false) are skipped entirely.
import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_ADDRESS = 'Zaid from DeutschMeister <zaid@deutsch-meister.de>';
const BASE_URL = 'https://deutsch-meister.de';
const UNSUB_SECRET = process.env.UNSUB_SECRET || process.env.CAMPAIGN_SECRET;
const CAMPAIGN_SECRET = process.env.CAMPAIGN_SECRET;
const BATCH_SIZE = 100;

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

// ─── copy ────────────────────────────────────────────────────────────────────

const SHELL = ({ heading, body, ctaHref, ctaLabel, unsubUrl }) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:linear-gradient(135deg,#f59e0b,#f43f5e);padding:32px;text-align:center;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,0.2);margin-bottom:12px;">
              <span style="color:#ffffff;font-size:28px;font-weight:800;">D</span>
            </div>
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">DeutschMeister</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 28px;">
            ${body}
            <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr>
                <td style="border-radius:10px;background:linear-gradient(135deg,#7c3aed,#4f46e5);">
                  <a href="${ctaHref}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">${ctaLabel}</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:16px;color:#1e293b;line-height:1.6;">— Zaid</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
              DeutschMeister · <a href="${BASE_URL}" style="color:#94a3b8;">deutsch-meister.de</a><br>
              <a href="${unsubUrl}" style="color:#94a3b8;">Unsubscribe from these emails</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const P = (text) => `<p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.6;">${text}</p>`;

// The activation message is the only one that differs per recipient: it names
// the lesson the learner is being sent to, and where they go depends on whether
// they ever sat the placement test. A generic "come back!" is exactly the email
// these 89% already ignored once.
const ACTIVATION = {
  subject: 'Your first German lesson is 15 minutes',
  placed: ({ levelLabel, topicTitle, href }) => ({
    ctaHref: href,
    ctaLabel: `Start ${topicTitle} →`,
    body:
      P(`You signed up yesterday and your level is set to <strong style="color:#1e293b;">${levelLabel}</strong> — so your path is already laid out. You just haven't opened the first lesson yet.`) +
      P(`It's <strong style="color:#1e293b;">${topicTitle}</strong>, and it takes about fifteen minutes: the rule, why it works that way, and a handful of exercises to prove it stuck.`) +
      P('One lesson is genuinely enough for a first day. The rest of the path waits.'),
  }),
  unplaced: ({ href }) => ({
    ctaHref: href,
    ctaLabel: 'Take the placement test →',
    body:
      P("You signed up yesterday, and I don't want to guess your level — starting someone at the wrong place is how people quit.") +
      P('The placement test takes about five minutes and puts you on the right rung of the ladder: A1.1 through B2.2, with the grammar path, listening and reading all set to match.') +
      P("No account juggling, nothing to pay. Then the first lesson is one click away."),
  }),
};

const TEMPLATES = {
  trial_day3: {
    subject: 'Three things in your DeutschMeister trial worth 10 minutes',
    ctaHref: `${BASE_URL}/analyze/`,
    ctaLabel: 'Analyze a sentence →',
    body:
      P('Hey! You\'re three days into your trial, so here\'s the short list of what\'s actually worth your time.') +
      P('<strong style="color:#1e293b;">Sentence X-Ray</strong> — paste any German sentence and see what every word is doing: the cases, the roles, and <em>why</em>. It takes about three seconds and it\'s the fastest way to stop guessing.') +
      P('<strong style="color:#1e293b;">Listening</strong> — short native-speaker dialogues graded to your level, so you understand most of what you hear instead of drowning in it.') +
      P('<strong style="color:#1e293b;">Speaking</strong> — a two-minute conversation with an AI partner that corrects you as you go.'),
  },
  trial_day6: {
    subject: 'Your DeutschMeister trial ends tomorrow',
    ctaHref: `${BASE_URL}/pricing/`,
    ctaLabel: 'Keep Pro — €9.99/month →',
    body:
      P('Quick heads-up: your Pro trial ends tomorrow.') +
      P('If you keep it, you stay on 50 sentence analyses a day, the full grammar library through B2, listening, reading, and AI speaking practice. That\'s €9.99 a month — less than one hour with a tutor.') +
      P('If you don\'t, nothing dramatic happens: your account stays, your progress stays, and you drop to the free tier. You can come back whenever.'),
  },
  trial_ended: {
    subject: 'Your progress is saved',
    ctaHref: `${BASE_URL}/pricing/`,
    ctaLabel: 'Restore Pro access →',
    body:
      P('Your trial ended yesterday — so this is the last you\'ll hear from me about it.') +
      P('Everything you did is still there: your topics, your streak, your history. Nothing was deleted, and one click puts it all back within reach.') +
      P('And if the timing just isn\'t right, that\'s genuinely fine. The free tier and the daily sentence keep working, and German isn\'t going anywhere.'),
  },
};

// ─── selection ───────────────────────────────────────────────────────────────

const ACTIVATION_KINDS = new Set(['activation_day1']);

/**
 * Resolve confirmed email addresses for a set of user ids.
 * auth.users is not exposed to PostgREST, so addresses only come from the admin
 * API — and only confirmed ones are mailable.
 */
async function confirmedEmails() {
  const emails = new Map();
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users) {
      if (u.email && u.email_confirmed_at) emails.set(u.id, u.email.trim().toLowerCase());
    }
    if (data.users.length < 1000) break;
    page++;
  }
  return emails;
}

/** Drop the users who have already had this message. */
async function unsent(kind, candidates) {
  if (candidates.length === 0) return [];
  const { data: already } = await supabase
    .from('lifecycle_emails')
    .select('user_id')
    .eq('kind', kind)
    .in('user_id', candidates.map((c) => c.id));
  const sentAlready = new Set((already || []).map((r) => r.user_id));
  return candidates.filter((c) => !sentAlready.has(c.id));
}

/**
 * The day-1 activation message: signed up yesterday, never opened a lesson.
 *
 * Selected on behaviour, not on a trial date — that is the whole point. The
 * three trial messages go out on days 3, 6 and 8 whatever the learner has done,
 * so day 1 is both the emptiest slot in the calendar and the moment intent is
 * highest.
 */
async function selectActivationRecipients(kind) {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const lower = new Date(now - 2 * day).toISOString();
  const upper = new Date(now - 1 * day).toISOString();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email_daily_sentence, is_subscribed, current_level')
    .gte('created_at', lower)
    .lt('created_at', upper);
  if (error) throw new Error(`profiles query failed: ${error.message}`);

  const eligible = (profiles || []).filter(
    (p) => p.is_subscribed !== true && p.email_daily_sentence !== false
  );
  if (eligible.length === 0) return [];

  // "Never started" means no row at all in user_grammar_progress — the table is
  // written on the first exercise submission on either the SPA or the Astro
  // lesson page, so its absence is a reliable "never opened a lesson".
  const { data: started, error: progressError } = await supabase
    .from('user_grammar_progress')
    .select('user_id')
    .in('user_id', eligible.map((p) => p.id));
  if (progressError) throw new Error(`progress query failed: ${progressError.message}`);
  const hasStarted = new Set((started || []).map((r) => r.user_id));

  const candidates = eligible.filter((p) => !hasStarted.has(p.id));
  const fresh = await unsent(kind, candidates);
  if (fresh.length === 0) return [];

  const emails = await confirmedEmails();
  const firstTopics = await firstTopicByLevel();

  return fresh
    .filter((p) => emails.has(p.id))
    .map((p) => {
      const level = normalizeLevel(p.current_level);
      const topic = level ? firstTopics.get(level) : null;
      return {
        id: p.id,
        email: emails.get(p.id),
        // No usable placement → send them to the test rather than guessing a
        // level. `current_level` ships as the bare band 'a1', which is not a
        // placement, so anything that isn't a real sub-level counts as unplaced.
        variant: topic ? 'placed' : 'unplaced',
        levelLabel: level ? level.toUpperCase() : null,
        topicTitle: topic?.title_en ?? null,
        href: topic
          ? `${BASE_URL}/grammar/${level}/${topic.slug}/`
          : `${BASE_URL}/level-test/`,
      };
    });
}

const SUB_LEVELS = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];

/** A real sub-level in lowercase URL form, or null if the value isn't one. */
function normalizeLevel(raw) {
  const low = String(raw || '').trim().toLowerCase();
  return SUB_LEVELS.includes(low) ? low : null;
}

/**
 * First topic of each level, keyed by lowercase sub-level.
 * grammar_topics stores sub_level uppercase; URLs use lowercase.
 */
async function firstTopicByLevel() {
  const { data, error } = await supabase
    .from('grammar_topics')
    .select('slug, title_en, sub_level, topic_order')
    .eq('is_published', true)
    .order('topic_order');
  if (error) throw new Error(`grammar_topics query failed: ${error.message}`);

  const first = new Map();
  for (const t of data || []) {
    const level = String(t.sub_level || '').toLowerCase();
    if (!first.has(level)) first.set(level, t);
  }
  return first;
}

// Users whose trial day matches, who haven't already had this message, aren't
// paying, and haven't opted out.
async function selectRecipients(kind) {
  // Each window is expressed directly as [lower, upper) offsets in days from
  // now, because the sign conventions are easy to get backwards: day 6 and the
  // post-trial mail look FORWARD and BACKWARD from now respectively.
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const windows = {
    // Day 3 of a 7-day trial: it started between 4 and 3 days ago.
    trial_day3: { col: 'trial_started_at', lower: now - 4 * day, upper: now - 3 * day },
    // The day before it ends: trial_ends_at falls within the next 24 hours.
    trial_day6: { col: 'trial_ends_at', lower: now, upper: now + day },
    // The day after it ended: trial_ends_at was 1-2 days ago.
    trial_ended: { col: 'trial_ends_at', lower: now - 2 * day, upper: now - day },
  }[kind];

  const lower = new Date(windows.lower).toISOString();
  const upper = new Date(windows.upper).toISOString();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email_daily_sentence, is_subscribed')
    .gte(windows.col, lower)
    .lt(windows.col, upper);
  if (error) throw new Error(`profiles query failed: ${error.message}`);

  const candidates = (profiles || []).filter((p) => p.is_subscribed !== true && p.email_daily_sentence !== false);
  if (candidates.length === 0) return [];

  const fresh = await unsent(kind, candidates);
  if (fresh.length === 0) return [];

  // Resolve addresses, and only mail confirmed ones.
  const emails = await confirmedEmails();

  return fresh
    .filter((p) => emails.has(p.id))
    .map((p) => ({ id: p.id, email: emails.get(p.id) }));
}

async function sendBatch(resendKey, items) {
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  });
  if (!res.ok) throw new Error(`Resend batch ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

/**
 * The message for one recipient. Static for the trial mails; per-recipient for
 * the activation mail, which names the learner's own next lesson.
 */
function messageFor(kind, recipient) {
  if (!ACTIVATION_KINDS.has(kind)) {
    const tpl = TEMPLATES[kind];
    return { subject: tpl.subject, ctaHref: tpl.ctaHref, ctaLabel: tpl.ctaLabel, body: tpl.body };
  }
  const built = ACTIVATION[recipient.variant](recipient);
  return { subject: ACTIVATION.subject, ...built };
}

async function sendKind(resendKey, kind) {
  const recipients = ACTIVATION_KINDS.has(kind)
    ? await selectActivationRecipients(kind)
    : await selectRecipients(kind);
  if (recipients.length === 0) return { kind, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const slice = recipients.slice(i, i + BATCH_SIZE);

    // Claim first: the unique key means a concurrent or repeated run can't
    // re-send, and a failure after this point costs at most a missed email.
    const { error: claimError } = await supabase
      .from('lifecycle_emails')
      .upsert(slice.map((r) => ({ user_id: r.id, kind })), { onConflict: 'user_id,kind', ignoreDuplicates: true });
    if (claimError) {
      console.error(`[trial-lifecycle] ${kind}: could not claim batch, skipping:`, claimError.message);
      failed += slice.length;
      continue;
    }

    const items = slice.map((r) => {
      const msg = messageFor(kind, r);
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
      console.error(`[trial-lifecycle] ${kind} batch failed:`, err.message);
    }
  }

  return { kind, sent, failed };
}

// ─── handler ─────────────────────────────────────────────────────────────────

const innerHandler = async (event) => {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { statusCode: 500, body: 'RESEND_API_KEY not set' };
  if (!supabaseKey) return { statusCode: 500, body: 'SUPABASE_SERVICE_ROLE_KEY not set' };
  if (!UNSUB_SECRET) return { statusCode: 500, body: 'UNSUB_SECRET / CAMPAIGN_SECRET not set' };

  // Same auth shape as daily-sentence: scheduler invocations carry next_run;
  // manual runs need the campaign secret. Never publicly triggerable.
  const qs = event.queryStringParameters || {};
  let bodyPayload = {};
  try { bodyPayload = JSON.parse(event.body || '{}'); } catch { /* ignore */ }
  const isScheduled = typeof bodyPayload.next_run === 'string';
  const secretOk = Boolean(CAMPAIGN_SECRET) && qs.secret === CAMPAIGN_SECRET;
  if (!isScheduled && !secretOk) {
    console.warn('[trial-lifecycle] rejected unauthenticated invocation');
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const results = [];
  for (const kind of ['activation_day1', 'trial_day3', 'trial_day6', 'trial_ended']) {
    try {
      results.push(await sendKind(resendKey, kind));
    } catch (err) {
      console.error(`[trial-lifecycle] ${kind} failed:`, err.message);
      results.push({ kind, sent: 0, failed: 0, error: err.message });
    }
  }

  console.log('[trial-lifecycle]', JSON.stringify(results));
  return { statusCode: 200, body: JSON.stringify({ results }) };
};

// 08:00 UTC — an hour after the daily sentence, so the two never collide.
export const handler = schedule('0 8 * * *', innerHandler);
