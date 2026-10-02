import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import sentences from './data/daily-sentences.json' with { type: 'json' };
import { fetchOptedOutIds } from './_shared/emailOptOut.mjs';

// ─── config ──────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FROM_ADDRESS = 'DeutschMeister <zaid@deutsch-meister.de>';
const BASE_URL = 'https://deutsch-meister.de';
const TEST_EMAIL = 'zaid199660@gmail.com';

// Secret used to sign unsubscribe tokens — must be set in env vars.
// No fallback: the handler refuses to run without it (fail closed).
const UNSUB_SECRET = process.env.UNSUB_SECRET || process.env.CAMPAIGN_SECRET;
const CAMPAIGN_SECRET = process.env.CAMPAIGN_SECRET;

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Supabase init error:', e.message);
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Pick today's sentence by cycling through the array using day-of-year. */
function todaysSentence() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay); // 1–365
  return sentences[(dayOfYear - 1) % sentences.length];
}

/** HMAC-SHA256 token so we can verify unsubscribe requests without a DB lookup. */
function unsubscribeToken(userId) {
  return createHmac('sha256', UNSUB_SECRET).update(userId).digest('hex');
}

function unsubscribeUrl(userId) {
  const token = unsubscribeToken(userId);
  return `${BASE_URL}/.netlify/functions/unsubscribe?uid=${userId}&token=${token}`;
}

// ─── site links ──────────────────────────────────────────────────────────────
// Every link into the site carries UTM tags, so a click from this email reaches
// dm_attribution (public/attribution.js) as source "email", and from there the
// PostHog super-properties and xray_usage.source.last. Measured 2026-10-02: of the
// 29 link-started X-Ray analyses in the previous 7 days, 26 arrived from a mail
// client or with no referrer, and none of them named this email. Mail clients
// strip the referrer (14 recorded "none") or send a webmail host, which the
// classifier files as a source of its own ("outlook.live.com", "ui-deref.de",
// "android", and "co" for mail.yahoo.co.jp).
//   * Labels use hyphens. attribution.js and xraySource.mjs both drop "_".
//   * The tags are fixed strings, so a Netlify retry still rebuilds byte-identical
//     batches (see the idempotency note below).
//   * /analyze/ carries its trailing slash: it is a prerendered route, and the
//     prerender canonicalises it to the slash form (CLAUDE.md, trailing slashes 2).
//   * The unsubscribe link is never tagged.
export const DAILY_UTM = 'utm_source=email&utm_medium=daily&utm_campaign=daily-sentence';

export function analyzeUrl(sentenceDe) {
  return `${BASE_URL}/analyze/?s=${encodeURIComponent(sentenceDe)}&${DAILY_UTM}&utm_content=xray`;
}

export function homeUrl() {
  return `${BASE_URL}/?${DAILY_UTM}&utm_content=footer`;
}

/**
 * Every confirmed account that has not opted out, in the deterministic order
 * the idempotency keys need. Throws when the opt-out list cannot be read, and
 * the handler then sends nothing: until 2026-09-28 a failed read mailed
 * everyone, unsubscribed accounts included (see _shared/emailOptOut.mjs).
 */
export async function getRecipients(client = supabase) {
  // auth.admin.listUsers for verified emails
  const emails = [];
  let page = 1;
  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers: ${error.message}`);

    for (const user of data.users) {
      // Only confirmed accounts with an email
      if (!user.email || !user.email_confirmed_at) continue;
      emails.push({ id: user.id, email: user.email.trim().toLowerCase(), confirmedAt: user.email_confirmed_at });
    }

    if (data.users.length < 1000) break;
    page++;
  }

  if (emails.length === 0) return [];

  const optedOut = await fetchOptedOutIds(client);
  // Counts only — never an address.
  const excluded = emails.filter((u) => optedOut.has(u.id)).length;
  console.log(`Opt-outs: ${excluded} of ${emails.length} confirmed accounts excluded`);
  return orderRecipients(emails.filter((u) => !optedOut.has(u.id)));
}

function buildEmail({ sentence, recipient, runDate = utcRunDate() }) {
  const headerDate = new Date(`${runDate}T12:00:00Z`)
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const ctaUrl = analyzeUrl(sentence.sentence_de);
  const unsubUrl = unsubscribeUrl(recipient.id);

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your daily German sentence</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

        <!-- Header -->
        <tr>
          <td style="background:#0F766E;padding:28px 32px;">
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">DeutschMeister · Daily Sentence</p>
            <p style="margin:6px 0 0;color:#ffffff;font-size:13px;opacity:0.8;">${headerDate}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">

            <!-- Level badge -->
            <p style="margin:0 0 16px;">
              <span style="display:inline-block;padding:3px 10px;border-radius:999px;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;">${sentence.level} · ${sentence.grammar_focus}</span>
            </p>

            <!-- The sentence -->
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Today's sentence</p>
            <p style="margin:0 0 24px;font-size:26px;font-weight:700;color:#0f172a;line-height:1.3;">${sentence.sentence_de}</p>

            <!-- Curiosity hook -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#f0f9ff;border-left:3px solid #0ea5e9;border-radius:0 8px 8px 0;padding:14px 18px;">
                  <p style="margin:0;font-size:14px;color:#0c4a6e;line-height:1.6;">${sentence.hint}</p>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#0F766E;border-radius:10px;">
                  <a href="${ctaUrl}"
                     style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.01em;">
                    See the X-Ray Breakdown →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
              The X-Ray tool breaks this sentence into its grammatical parts — cases, roles, and <em>why</em> each word takes the form it does.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
              You're receiving this because you signed up at <a href="${homeUrl()}" style="color:#94a3b8;">deutsch-meister.de</a>.<br>
              <a href="${unsubUrl}" style="color:#94a3b8;">Unsubscribe from daily sentences</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Send in batches of 100 via Resend's batch endpoint. The old one-request-per-
// recipient loop with a 300 ms sleep needed 6-8 minutes for ~1,000 confirmed
// users — far beyond the synchronous function budget, so a killed run silently
// mailed only a prefix of the list. ~1,000 recipients is now ~10 requests.
// Each batch item carries its own per-recipient HTML (unsubscribe link).
const BATCH_SIZE = 100;

// ─── once per day, even when the scheduler fires twice ──────────────────────
// 2026-09-27: every confirmed recipient got this email TWICE — two complete sets
// of 12 batch requests, 07:00:32 and 07:01:22 UTC, 2,236 sends against 1,117 the
// day before (Resend logs + metrics). The schedule is registered once and the
// code had not changed since 09-12; the first run's batches were twice as slow
// as usual (16 s vs 7 s). Netlify retries a scheduled invocation it counts as
// failed, up to three attempts, and a v1 handler that has not returned its
// headers within ~28 s counts as failed. This handler only returns after the
// last batch, and it had no memory of an earlier run, so the retry re-mailed
// the whole list.
//
// The fix is Resend's own idempotency: every live batch carries an
// Idempotency-Key of (UTC run date, batch index). A second request with the same
// key and the same payload within 24 h is answered from Resend's cache and sends
// nothing; the same key with a different payload is refused with 409. For that
// to hold, a retry must rebuild byte-identical batches, so:
//   * recipients are ordered by confirmation time, then id — never by whatever
//     order listUsers returns — so a new confirmation joins the END of the list
//     and every earlier batch keeps its members;
//   * the header date is derived from the run date, not from the clock;
//   * the key carries no recipient count: a count would change every key the
//     moment one person confirmed between the two runs.
// A run killed half-way is resumed exactly: the batches it sent are replayed as
// no-ops, the ones it never reached go out under fresh keys.
// Test sends carry no key — a morning test must never occupy a live batch key.
// No database ledger: lifecycle_emails cannot hold it (user_id NOT NULL, kind
// CHECK), and a per-day key needs no migration to be in force.

/** YYYY-MM-DD in UTC — the unit of "once". The scheduler fires at 07:00 UTC. */
export function utcRunDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** Resend Idempotency-Key for one live batch. Stable across retries of a day. */
export function dailyBatchKey(runDate, batchIndex) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(runDate)) throw new Error(`bad run date: ${runDate}`);
  if (!Number.isInteger(batchIndex) || batchIndex < 0) throw new Error(`bad batch index: ${batchIndex}`);
  return `daily-sentence/${runDate}/batch-${batchIndex}`;
}

/** Deterministic order: confirmation time ascending, then id. Returns a new array. */
export function orderRecipients(list) {
  return [...list].sort((a, b) => {
    const ta = Date.parse(a.confirmedAt) || 0;
    const tb = Date.parse(b.confirmedAt) || 0;
    if (ta !== tb) return ta - tb;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

async function sendBatch(resendKey, items, idempotencyKey, fetchImpl = fetch) {
  const headers = {
    Authorization: `Bearer ${resendKey}`,
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const res = await fetchImpl('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers,
    body: JSON.stringify(items),
  });
  if (res.status === 409 && idempotencyKey) return 'conflict';
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend batch ${res.status}: ${text.slice(0, 300)}`);
  }
  return 'accepted';
}

/**
 * Build and send every batch. `live` decides whether batches carry an
 * idempotency key; the handler passes false only for ?test=true.
 * `accepted` includes batches Resend answered from an earlier run's cache (it
 * does not say which) — Resend's metrics, not this count, are what was sent.
 * `conflicts` are batches whose key was already used today with other members.
 */
export async function sendDailyBatches({ recipients, sentence, runDate, resendKey, live, fetchImpl = fetch }) {
  const subject = `🇩🇪 ${sentence.sentence_de}`;
  let sent = 0, failed = 0, conflicts = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batchIndex = i / BATCH_SIZE;
    const slice = recipients.slice(i, i + BATCH_SIZE);
    const items = slice.map((recipient) => ({
      from: FROM_ADDRESS,
      to: [recipient.email],
      reply_to: 'zaid@deutsch-meister.de',
      subject,
      html: buildEmail({ sentence, recipient, runDate }),
    }));
    const key = live ? dailyBatchKey(runDate, batchIndex) : undefined;
    try {
      const outcome = await sendBatch(resendKey, items, key, fetchImpl);
      if (outcome === 'conflict') {
        conflicts += slice.length;
        console.warn(`Batch ${batchIndex + 1}: key ${key} already used today with other members — not re-sent`);
      } else {
        sent += slice.length;
      }
    } catch (err) {
      failed += slice.length;
      console.error(`Batch ${batchIndex + 1} failed:`, err.message);
    }
  }
  return { sent, failed, conflicts };
}

// ─── handler ─────────────────────────────────────────────────────────────────

const innerHandler = async (event) => {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey)    return { statusCode: 500, body: 'RESEND_API_KEY not set' };
  if (!supabaseKey)  return { statusCode: 500, body: 'SUPABASE_SERVICE_ROLE_KEY not set' };
  if (!UNSUB_SECRET) return { statusCode: 500, body: 'UNSUB_SECRET / CAMPAIGN_SECRET not set' };

  // Mode + auth detection:
  // - Scheduler invocations carry {"next_run": ...} in the body → LIVE send.
  // - HTTP calls need ?secret=<CAMPAIGN_SECRET> to run a LIVE send.
  // - ?test=true (or {"test":true}) sends only to the hardcoded TEST_EMAIL and
  //   is allowed without the secret (bounded, owner-only).
  // - Anything else is rejected — the /api/daily-sentence redirect is public.
  const qs = event.queryStringParameters || {};

  let bodyPayload = {};
  try { bodyPayload = JSON.parse(event.body || '{}'); } catch { /* ignore */ }

  const isTest = qs.test === 'true' || bodyPayload.test === true;
  const isScheduled = typeof bodyPayload.next_run === 'string';
  const secretOk = Boolean(CAMPAIGN_SECRET) && qs.secret === CAMPAIGN_SECRET;

  if (!isTest && !isScheduled && !secretOk) {
    console.warn('Rejected unauthenticated live-send attempt');
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const sentence = todaysSentence();
  console.log(`Daily sentence [${isTest ? 'TEST MODE' : 'LIVE'}]: "${sentence.sentence_de}" [${sentence.level}]`);

  let recipients;
  if (isTest) {
    recipients = [{ id: 'test-user', email: TEST_EMAIL }];
    console.log('Test mode — sending only to', TEST_EMAIL);
  } else {
    try {
      recipients = await getRecipients();
    } catch (err) {
      console.error('Failed to fetch recipients:', err.message);
      return { statusCode: 500, body: err.message };
    }
  }

  console.log(`Sending to ${recipients.length} recipients in batches of ${BATCH_SIZE}`);

  const { sent, failed, conflicts } = await sendDailyBatches({
    recipients, sentence, runDate: utcRunDate(), resendKey, live: !isTest,
  });

  console.log(`Done — accepted: ${sent} (includes batches replayed from an earlier run today), conflicts: ${conflicts}, failed: ${failed}`);
  return { statusCode: 200, body: JSON.stringify({ sent, failed, conflicts, sentence: sentence.sentence_de }) };
};

// schedule() wraps the handler so Netlify recognises this as a scheduled
// function. The cron schedule here is the authoritative declaration —
// netlify.toml [functions."daily-sentence"] schedule is kept as a fallback.
export const handler = schedule('0 7 * * *', innerHandler);
