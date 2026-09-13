// Learner-facing: open a support ticket, or read one's own tickets.
// Identity from the verified JWT (never the body). Writes through the
// service role because support_tickets has RLS on and NO client policies —
// which is also what keeps internal notes invisible: the thread returned
// here filters visibility = 'public'.
import { randomUUID } from 'node:crypto';
import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import { CATEGORIES, slaDueAt, ticketReference } from './_shared/adminSupportLib.mjs';

const ALLOWED_ORIGINS = ['https://deutsch-meister.de', 'https://www.deutsch-meister.de'];
const MAX_OPEN_PER_USER = 5;

export const handler = async (event) => {
  const origin = event.headers?.origin || '';
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  if (!supabaseKey || !supabase) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };

  const userId = await getAuthenticatedUserId(event);
  if (!userId) return unauthorizedResponse(headers);

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültiger Body.' }) }; }

  if (body.action === 'list') {
    const { data: tickets, error } = await supabase.from('support_tickets').select('id, reference, subject, status, category, created_at, last_activity_at').eq('user_id', userId).order('last_activity_at', { ascending: false }).limit(20);
    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Tickets konnten nicht geladen werden.' }) };
    return { statusCode: 200, headers, body: JSON.stringify({ tickets: tickets || [] }) };
  }

  if (body.action === 'thread') {
    const { data: t } = await supabase.from('support_tickets').select('id, reference, subject, status, created_at').eq('id', String(body.ticketId || '')).eq('user_id', userId).maybeSingle();
    if (!t) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Nicht gefunden.' }) };
    // visibility = 'public' — the ONLY thing between an internal note and the learner.
    const { data: messages } = await supabase.from('support_ticket_messages').select('id, created_at, author_type, body').eq('ticket_id', t.id).eq('visibility', 'public').order('created_at', { ascending: true });
    return { statusCode: 200, headers, body: JSON.stringify({ ticket: t, messages: messages || [] }) };
  }

  const subject = String(body.subject || '').trim().slice(0, 200);
  const text = String(body.body || '').trim().slice(0, 5000);
  const category = CATEGORIES.includes(body.category) ? body.category : 'other';
  if (subject.length < 3 || text.length < 10) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bitte Betreff (≥ 3 Zeichen) und Nachricht (≥ 10 Zeichen) angeben.' }) };

  const { count } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['new', 'open', 'waiting_user']);
  if ((count ?? 0) >= MAX_OPEN_PER_USER) return { statusCode: 429, headers, body: JSON.stringify({ error: `Sie haben bereits ${MAX_OPEN_PER_USER} offene Anfragen. Bitte warten Sie auf unsere Antwort.` }) };

  const { data: profile } = await supabase.from('profiles').select('email, current_level, exam_track, subscription_tier').eq('id', userId).maybeSingle();
  const id = randomUUID();
  const now = new Date().toISOString();
  const { error } = await supabase.from('support_tickets').insert({
    id, reference: ticketReference(id), user_id: userId, user_email: profile?.email ?? null, subject, category, priority: 'normal', channel: 'in_app',
    created_at: now, sla_due_at: slaDueAt(now, 'normal'),
    context: { level: profile?.current_level ?? null, exam_track: profile?.exam_track ?? null, tier: profile?.subscription_tier ?? null, user_agent: event.headers?.['user-agent'] ?? null },
  });
  if (error) {
    console.error('[support-ticket-create] insert failed:', error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Die Anfrage konnte nicht gespeichert werden.' }) };
  }
  const { error: mErr } = await supabase.from('support_ticket_messages').insert({ ticket_id: id, author_type: 'user', author_id: userId, visibility: 'public', body: text });
  if (mErr) console.error('[support-ticket-create] message insert failed:', mErr.message);
  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, reference: ticketReference(id), ticketId: id }) };
};
