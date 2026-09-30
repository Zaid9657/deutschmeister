// Support agent — answers the support tickets it can answer from verified
// facts, holds every reply so a person can stop it, and tells the owner.
//
// Every 5 minutes (`schedule('*/5 * * * *')`, mirrored in netlify.toml):
//   1. PENDING DRAFTS. Each held AI reply is sent only when the hold
//      (SUPPORT_AGENT_HOLD_MINUTES, default 10) has passed AND nobody acted on
//      the ticket since it was drafted — a team message or note, a status,
//      priority or assignee change, "KI-Antwort stoppen" in the admin screen,
//      or a new customer message. Anything else that can never become sendable
//      stops the draft. The send is admin-support's own path
//      (adminSupportLib.sendTicketReply), claimed before Resend is called.
//   2. NEW WORK. Open tickets whose latest public message is the customer's,
//      once per message (tag ai:seen:<message>). Deterministic rules first:
//      cancellation, refund, deletion/GDPR, billing dispute, legal/complaint and
//      abuse are NEVER answered — the ticket is tagged ai:escalated:<reason>
//      and the owner mailed once. A ticket a person already holds (assigned,
//      or a team action after the message) is left alone. Otherwise the model
//      drafts from a facts object built from the customer's own account and the
//      catalogue — nothing else — and the draft is validated deterministically
//      (supportAgentLib.validateReply) before it is stored. A failed check
//      stores it as blocked and mails the owner instead.
//   3. OWNER MAIL to OWNER_ALERT_EMAIL: one per event, claimed through a
//      ticket tag (ai:mail:<kind>:<id>) before it is sent.
//
// SHIPS OFF / FAILS CLOSED
//   SUPPORT_AGENT_MODE unset → 'off' → no-op. 'draft' drafts and notifies but
//   never mails a customer; 'send' also sends. Without OWNER_ALERT_EMAIL or
//   RESEND_API_KEY the run does nothing at all (logged). Scheduler calls carry
//   `next_run`; a manual run needs ?secret=<CAMPAIGN_SECRET>. ?dry=1 reports
//   what it would do and writes and sends nothing; ?dry=1&preview=1 also calls
//   the model and returns the drafts it would store.
// Docs: docs/agents/production-agents.md ("Support agent").
import { schedule } from '@netlify/functions';
import { supabase as serviceClient } from './_shared/supabase.mjs';
import { fetchAll } from './_shared/adminHttp.mjs';
import {
  OPEN_STATUSES, AI_DRAFT_MARKER, AI_BLOCKED_MARKER, stripAiDraftMarker, cancelPendingAiDrafts, sendTicketReply,
} from './_shared/adminSupportLib.mjs';
import {
  SUPPORT_MODEL, MAX_DRAFTS_PER_RUN, TAG,
  runGates, analyzeTicket, needsWork, planTicket, sendDecision, effectiveDraftMode, draftMeta,
  buildFacts, buildPrompt, parseModelOutput, composeReply, validateReply, detectLanguage,
  libraryNames, libraryHas, normalizeTopic, renderOwnerMail,
} from './_shared/supportAgentLib.mjs';

const ALLOWED_ORIGINS = ['https://deutsch-meister.de', 'https://www.deutsch-meister.de'];
const OWNER_FROM = 'DeutschMeister Support-Agent <zaid@deutsch-meister.de>';
const MODEL_TIMEOUT_MS = 15000;
/** Scheduled functions stop at 30 s: no new model call after this much of the run. */
const MODEL_START_BUDGET_MS = 8000;

function corsHeaders(event) {
  const origin = event?.headers?.origin || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
  };
}

// ─── I/O ─────────────────────────────────────────────────────────────────────

/** The same raw Messages API call as evaluate-writing.mjs (same key, version header and model). */
export async function callModel(fetchImpl, env, { system, user }, { timeoutMs = MODEL_TIMEOUT_MS } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: SUPPORT_MODEL, max_tokens: 1200, system, messages: [{ role: 'user', content: user }] }),
    });
    if (!res.ok) return { error: `Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}` };
    const data = await res.json();
    if (data.stop_reason === 'refusal') return { error: 'the model declined' };
    return { text: (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('') };
  } catch (e) {
    return { error: e?.name === 'AbortError' ? `model timeout after ${timeoutMs} ms` : e?.message || String(e) };
  } finally {
    clearTimeout(timer);
  }
}

async function readTicketState(db, ticketId) {
  const { data, error } = await db.from('support_tickets').select('tags, context').eq('id', ticketId).maybeSingle();
  if (error) throw new Error(error.message);
  return { tags: data?.tags || [], context: data?.context || {} };
}

/**
 * Claim a tag: add it only if the ticket does not carry it yet (a conditional
 * update, `NOT tags @> {tag}`). true = this run added it = this run may act.
 * The agent is the only writer of tags, and runs are 5 minutes apart and end
 * within 30 s, so the read-then-write cannot lose another run's tag in practice.
 */
export async function claimTag(db, ticketId, tag) {
  const { tags } = await readTicketState(db, ticketId);
  if (tags.includes(tag)) return false;
  const { data, error } = await db.from('support_tickets')
    .update({ tags: [...tags, tag] })
    .eq('id', ticketId)
    .not('tags', 'cs', `{${tag}}`)
    .select('id');
  if (error) throw new Error(error.message);
  return (data || []).length === 1;
}

async function addTags(db, ticketId, add) {
  const { tags } = await readTicketState(db, ticketId);
  const next = [...new Set([...tags, ...add])];
  if (next.length === tags.length) return;
  const { error } = await db.from('support_tickets').update({ tags: next }).eq('id', ticketId);
  if (error) throw new Error(error.message);
}

async function sendOwnerMail(fetchImpl, env, { subject, text }) {
  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: OWNER_FROM, to: [String(env.OWNER_ALERT_EMAIL).trim()], subject, text }),
    });
    if (!res.ok) console.error(`[support-agent] owner mail: Resend ${res.status}:`, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (e) {
    console.error('[support-agent] owner mail threw:', e.message);
    return false;
  }
}

/** One owner mail per (kind, id): claim the tag, then send. A lost mail is logged, never repeated. */
async function mailOnce(ctx, ticket, tag, kind, data) {
  const mail = renderOwnerMail(kind, { ticket, ...data });
  if (ctx.dry) { ctx.report.mails.push({ ref: ticket.reference, kind, subject: mail.subject, dry: true }); return; }
  if (!(await claimTag(ctx.db, ticket.id, tag))) return;
  const ok = await sendOwnerMail(ctx.fetchImpl, ctx.env, mail);
  ctx.report.mails.push({ ref: ticket.reference, kind, subject: mail.subject, sent: ok });
}

async function loadFacts(ctx, ticket) {
  const { db } = ctx;
  let profile = null;
  let subscription = null;
  let purchases = [];
  if (ticket.user_id) {
    const [p, s, b] = await Promise.all([
      db.from('profiles').select('id, current_level, exam_track, preferred_language, trial_started_at, trial_ends_at, is_subscribed, subscription_tier').eq('id', ticket.user_id).maybeSingle(),
      db.from('subscriptions').select('status, plan_type, subscription_end, cancel_at_period_end, cancelled_at').eq('user_id', ticket.user_id).order('subscription_end', { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
      db.from('purchases').select('product_key, status, created_at').eq('user_id', ticket.user_id).eq('status', 'active'),
    ]);
    for (const r of [p, s, b]) if (r.error) throw new Error(r.error.message);
    profile = p.data;
    subscription = s.data;
    purchases = b.data || [];
  }
  if (!ctx.grammarTopics) {
    const { data, error } = await db.from('grammar_topics').select('slug, sub_level, title_de, title_en').order('sub_level').order('topic_order');
    if (error) throw new Error(error.message);
    ctx.grammarTopics = data || [];
  }
  return { profile, facts: buildFacts({ ticket, profile, subscription, purchases, grammarTopics: ctx.grammarTopics, now: ctx.now }) };
}

// ─── phase 1: pending drafts ─────────────────────────────────────────────────

async function settleDraft(ctx, ticket, analysis) {
  const { db, report, gates, now, dry } = ctx;
  const draft = analysis.pendingDraft;
  const ref = ticket.reference;
  const decision = sendDecision({ ticket, analysis, gates, now });

  if (decision.action === 'wait') return void report.waiting.push({ ref, sendAt: decision.sendAt });
  if (decision.action === 'keep') return void report.kept.push({ ref, why: decision.why });
  if (decision.action === 'cancel') {
    if (!dry) await cancelPendingAiDrafts(db, ticket.id, `agent: ${decision.why}`, { draftId: draft.id });
    return void report.cancelled.push({ ref, why: decision.why });
  }
  if (decision.action !== 'send') return;

  // Validated again at send time: nothing reaches a customer unchecked.
  const body = stripAiDraftMarker(draft.body);
  const problems = validateReply(body, { language: decision.language });
  if (problems.length) {
    if (!dry) await cancelPendingAiDrafts(db, ticket.id, 'agent: failed the checks at send time', { draftId: draft.id });
    report.cancelled.push({ ref, why: 'failed the checks at send time' });
    return mailOnce(ctx, ticket, TAG.mail('not-answered', draft.id), 'not-answered', { why: 'Der Entwurf hat die Prüfung beim Versand nicht bestanden', problems, draft: body });
  }
  if (dry) return void report.sent.push({ ref, dry: true });

  const res = await sendTicketReply({ db, fetchImpl: ctx.fetchImpl, env: ctx.env, ticket, body, language: decision.language, authorType: 'system', draftId: draft.id, now });
  if (!res.claimed) return void report.cancelled.push({ ref, why: 'no longer pending when claimed' });
  if (res.delivered) return void report.sent.push({ ref });
  report.failed.push({ ref, error: res.error });
  return mailOnce(ctx, ticket, TAG.mail('failed', draft.id), 'failed', { error: res.error });
}

// ─── phase 2: a customer message nobody has handled ──────────────────────────

async function storeDraft(ctx, ticket, userMessageId, reply, language) {
  const { db, gates, now } = ctx;
  const mode = effectiveDraftMode(ticket, gates);
  const sendAfter = new Date(now.getTime() + gates.holdMinutes * 60000).toISOString();
  const header = mode === 'send'
    ? `${AI_DRAFT_MARKER} sendet frühestens ${sendAfter.slice(11, 16)} UTC · ${language}`
    : `${AI_DRAFT_MARKER} Entwurf, wird nicht automatisch gesendet · ${language}`;
  const { data: row, error } = await db.from('support_ticket_messages')
    .insert({ ticket_id: ticket.id, author_type: 'system', author_id: null, visibility: 'internal', body: `${header}\n${reply}`, delivery_status: 'queued' })
    .select('id, created_at')
    .maybeSingle();
  if (error || !row) throw new Error(`draft not stored: ${error?.message || 'no row'}`);
  const meta = draftMeta({ draftId: row.id, mode, language, userMessageId, ticket, now, holdMinutes: gates.holdMinutes });
  // Without this metadata the draft can never be sent (sendDecision cancels it): fail closed.
  const state = await readTicketState(db, ticket.id);
  const { error: uErr } = await db.from('support_tickets')
    .update({ context: { ...state.context, ai_agent: meta }, tags: [...new Set([...state.tags, TAG.draft(row.id)])] })
    .eq('id', ticket.id);
  if (uErr) console.error('[support-agent] draft metadata not stored — the draft will be stopped:', uErr.message);
  return { id: row.id, mode, sendAfter: meta.send_after };
}

async function storeBlocked(ctx, ticket, reply, problems) {
  const { error } = await ctx.db.from('support_ticket_messages')
    .insert({ ticket_id: ticket.id, author_type: 'system', author_id: null, visibility: 'internal', body: `${AI_BLOCKED_MARKER} ${problems.map((p) => p.code).join(', ')}\n${reply}`, delivery_status: null });
  if (error) console.error('[support-agent] blocked draft not stored:', error.message);
}

async function handleMessage(ctx, ticket, analysis, plan) {
  const { db, report, dry, gates } = ctx;
  const um = analysis.latestUser;
  const ref = ticket.reference;
  if (!dry && !(await claimTag(db, ticket.id, TAG.seen(um.id)))) return;

  const base = { customerMessage: analysis.unanswered.map((m) => m.body).join('\n\n'), followUp: analysis.isFollowUp };
  const topics = new Set(plan.contentTopics);
  let outcome = null;

  if (plan.route === 'human-owned') {
    report.humanOwned.push({ ref, why: plan.why });
    if (analysis.isFollowUp) outcome = { kind: 'replied', why: plan.why };
  } else if (plan.route === 'escalate') {
    outcome = { kind: 'escalated', reasons: plan.reasons };
  } else if (plan.route === 'not-answered') {
    outcome = { kind: 'not-answered', why: plan.why };
  } else {
    ctx.modelCalls += 1;
    if (dry && !ctx.preview) {
      report.drafted.push({ ref, dry: true, wouldCallModel: true });
    } else {
      const { facts, profile } = await loadFacts(ctx, ticket);
      const out = await callModel(ctx.fetchImpl, ctx.env, buildPrompt({ facts, ticket, thread: analysis.thread }));
      const parsed = out.error ? null : parseModelOutput(out.text);
      if (!parsed) {
        outcome = { kind: 'not-answered', why: out.error ? `Modellfehler: ${out.error}` : 'Modellantwort unbrauchbar' };
      } else if (parsed.escalate) {
        outcome = { kind: 'escalated', reasons: [parsed.escalate] };
      } else {
        const language = parsed.language || detectLanguage(plan.text, profile?.preferred_language);
        if (parsed.contentRequest && !libraryHas(parsed.contentRequest.topic, libraryNames(ctx.grammarTopics))) {
          const t = normalizeTopic(parsed.contentRequest.topic);
          if (t) topics.add(t);
        }
        const reply = composeReply(parsed.body, language);
        const problems = validateReply(reply, { language });
        if (ctx.preview) report.previews.push({ ref, language, reply, problems });
        if (problems.length) {
          if (!dry) await storeBlocked(ctx, ticket, reply, problems);
          report.blocked.push({ ref, problems: problems.map((p) => p.code) });
          outcome = { kind: 'not-answered', why: 'Der Entwurf hat die Prüfung nicht bestanden', problems, draft: reply };
        } else if (dry) {
          report.drafted.push({ ref, dry: true, language });
        } else {
          const d = await storeDraft(ctx, ticket, um.id, reply, language);
          report.drafted.push({ ref, mode: d.mode, sendAfter: d.sendAfter });
          outcome = { kind: 'draft', draft: reply, sendAt: d.sendAfter, mode: d.mode };
        }
      }
    }
  }

  if (outcome?.kind === 'escalated') {
    report.escalated.push({ ref, reasons: outcome.reasons });
    if (!dry) await addTags(db, ticket.id, outcome.reasons.map(TAG.escalated));
  }
  if (outcome?.kind === 'not-answered') report.notAnswered.push({ ref, why: outcome.why });

  // Content we do not have: tagged once per ticket and topic; the tag is the mail's claim.
  for (const topic of topics) {
    report.contentRequests.push({ ref, topic });
    if (dry) continue;
    if (await claimTag(db, ticket.id, TAG.content(topic))) {
      const ok = await sendOwnerMail(ctx.fetchImpl, ctx.env, renderOwnerMail('content', { ticket, ...base, topic }));
      report.mails.push({ ref, kind: 'content', sent: ok });
    }
  }

  if (!outcome) return;
  // A drafted NEW ticket is mailed only while SUPPORT_AGENT_NOTIFY_DRAFTS is not 'false';
  // a follow-up, an escalation and a failure are always mailed.
  if (outcome.kind === 'draft' && !analysis.isFollowUp && !gates.notifyDrafts) return;
  await mailOnce(ctx, ticket, TAG.mail(outcome.kind, um.id), outcome.kind, { ...base, ...outcome });
}

// ─── handler ─────────────────────────────────────────────────────────────────

/** The whole run, every dependency injectable (tests pass a fake db, fetch and clock). */
export async function runSupportAgent({ event = {}, env = process.env, db = serviceClient, fetchImpl = globalThis.fetch, now = new Date(), clock = Date.now } = {}) {
  const started = clock();
  const headers = corsHeaders(event);
  const reply = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const gates = runGates(env);
  if (gates.mode === 'off') {
    console.log('[support-agent] SUPPORT_AGENT_MODE is off — doing nothing.');
    return reply(200, { mode: 'off' });
  }

  const qs = event.queryStringParameters || {};
  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch { /* ignore */ }
  const isScheduled = typeof payload?.next_run === 'string';
  const secretOk = Boolean(env.CAMPAIGN_SECRET) && qs.secret === env.CAMPAIGN_SECRET;
  if (!isScheduled && !secretOk) {
    console.warn('[support-agent] rejected unauthenticated invocation');
    return reply(401, { error: 'Unauthorized' });
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !db) return reply(500, { error: 'SUPABASE_SERVICE_ROLE_KEY not set' });
  const dry = qs.dry === '1';

  if (!gates.active) {
    console.error(`[support-agent] fail closed: ${gates.reason} — nothing drafted, nothing sent, nobody mailed.`);
    return reply(200, { mode: gates.mode, active: false, failClosed: gates.reason });
  }

  let tickets;
  let messages;
  try {
    tickets = await fetchAll(() => db.from('support_tickets')
      .select('id, reference, status, priority, category, subject, user_id, user_email, assignee_id, tags, context, created_at, first_response_at')
      .in('status', [...OPEN_STATUSES])
      .order('created_at', { ascending: true }));
    const ids = tickets.map((t) => t.id);
    messages = ids.length
      ? await fetchAll(() => db.from('support_ticket_messages')
        .select('id, ticket_id, created_at, author_type, author_id, visibility, body, delivery_status, delivery_error')
        .in('ticket_id', ids)
        .order('created_at', { ascending: true }))
      : [];
  } catch (e) {
    console.error('[support-agent] could not read tickets:', e.message);
    return reply(500, { mode: gates.mode, error: e.message });
  }

  const report = {
    mode: gates.mode, dry, open: tickets.length,
    sent: [], failed: [], cancelled: [], waiting: [], kept: [],
    drafted: [], blocked: [], escalated: [], notAnswered: [], humanOwned: [], contentRequests: [],
    deferred: [], errors: [], mails: [], previews: [],
  };
  const ctx = { db, fetchImpl, env, now, gates, dry, preview: dry && qs.preview === '1', report, modelCalls: 0, grammarTopics: null };

  // 1. Pending drafts first — fast, and never behind a slow model call.
  for (const t of tickets) {
    const a = analyzeTicket(t, messages);
    if (!a.pendingDraft) continue;
    try { await settleDraft(ctx, t, a); } catch (e) {
      console.error(`[support-agent] ${t.reference}: draft not settled:`, e.message);
      report.errors.push({ ref: t.reference, error: e.message });
    }
  }

  // 2. Unhandled customer messages.
  for (const t of tickets) {
    const a = analyzeTicket(t, messages);
    if (!needsWork(t, a, now).work) continue;
    const plan = planTicket({ ticket: t, analysis: a, gates });
    if (plan.route === 'model' && (ctx.modelCalls >= MAX_DRAFTS_PER_RUN || clock() - started > MODEL_START_BUDGET_MS)) {
      report.deferred.push(t.reference); // not claimed: the next run picks it up
      continue;
    }
    try { await handleMessage(ctx, t, a, plan); } catch (e) {
      console.error(`[support-agent] ${t.reference}: not handled:`, e.message);
      report.errors.push({ ref: t.reference, error: e.message });
    }
  }

  const { previews, ...logged } = report;
  console.log('[support-agent]', JSON.stringify({ ...logged, previews: previews.length }));
  return reply(200, report);
}

// A literal on purpose: Netlify reads the cron out of this call statically.
// Mirrored in netlify.toml ([functions."support-agent"]); this wrapper is authoritative.
export const handler = schedule('*/5 * * * *', (event) => runSupportAgent({ event }));
