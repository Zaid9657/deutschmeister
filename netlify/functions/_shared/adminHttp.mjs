// Admin panel — the endpoint envelope every admin-* function shares.
//
//   export const handler = adminEndpoint({ capability: 'finance.read' }, async (ctx) => ({ ... }));
//
// The wrapper owns: CORS preamble (same origins as every function), OPTIONS,
// POST-only, service-role presence, JSON body parsing, the capability gate,
// `Cache-Control: no-store` (an aggregate over a user-selected window must
// never be cached — a cached 30-day body answering a 7-day request is
// exactly the "filters do nothing" symptom), and the `capabilities`/`role`
// echo on every response so a screen renders the controls the server would
// actually accept. Throwing inside the handler becomes a 500 with a
// request id, never a blank card.

import { randomUUID } from 'node:crypto';
import { supabase, supabaseKey } from './supabase.mjs';
import { requireCapability } from './adminRbac.mjs';

const ALLOWED_ORIGINS = ['https://deutsch-meister.de', 'https://www.deutsch-meister.de'];

export function corsHeaders(event) {
  const origin = event.headers?.origin || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store, max-age=0',
    'Content-Type': 'application/json',
  };
}

export class AdminHttpError extends Error {
  constructor(statusCode, message, extra = {}) {
    super(message);
    this.statusCode = statusCode;
    this.extra = extra;
  }
}

/** Throw to answer 400/404/409 from inside a handler. */
export const badRequest = (message, extra) => new AdminHttpError(400, message, extra);
export const notFound = (message = 'Nicht gefunden.') => new AdminHttpError(404, message);
export const conflict = (message, extra) => new AdminHttpError(409, message, extra);

export function deployDiagnostics() {
  return {
    commit: process.env.COMMIT_REF || null,
    branch: process.env.BRANCH || null,
    deployId: process.env.DEPLOY_ID || null,
    context: process.env.CONTEXT || null,
  };
}

export function adminEndpoint({ capability = null, capabilityFor = null }, fn) {
  return async (event) => {
    const headers = corsHeaders(event);
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }
    if (!supabaseKey || !supabase) {
      console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
    }

    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültiger JSON-Body.' }) };
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) body = {};

    // A per-action capability (e.g. export vs read) is resolved from the body
    // BEFORE any row is fetched.
    const required = typeof capabilityFor === 'function' ? capabilityFor(body) : capability;
    const auth = await requireCapability(event, supabase, required, headers);
    if (auth.response) return auth.response;

    const requestId = randomUUID();
    const started = Date.now();
    try {
      const payload = await fn({ body, auth, supabase, event, requestId });
      const out = {
        ...payload,
        role: auth.role,
        capabilities: auth.capabilities,
        requestId,
        durationMs: Date.now() - started,
      };
      return { statusCode: 200, headers, body: JSON.stringify(out) };
    } catch (e) {
      if (e instanceof AdminHttpError) {
        return {
          statusCode: e.statusCode,
          headers,
          body: JSON.stringify({ error: e.message, ...e.extra, requestId }),
        };
      }
      console.error(`[admin] ${event.path} failed (${requestId}):`, e.message, e.stack);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Serverfehler', requestId }) };
    }
  };
}

/**
 * Runs a metric group and converts a throw into { error } — one broken group
 * must never blank a screen, and must never render as 0.
 */
export async function safe(label, fn) {
  try {
    return { value: await fn() };
  } catch (e) {
    console.error(`[admin] metric group "${label}" failed:`, e.message);
    return { error: `${label}: ${e.message}` };
  }
}

/** A rate needs a denominator above zero — otherwise null, never 0 or 100 %. */
export const rate = (numerator, denominator) =>
  !denominator || denominator <= 0 ? null : Number(numerator) / Number(denominator);

/**
 * PostgREST silently caps a response at db-max-rows. Fetch a whole result set
 * deliberately, in pages, and never trust rows.length as a population: take
 * the count from `exactCount` instead.
 */
export async function fetchAll(buildQuery, { pageSize = 1000, maxRows = 50000 } = {}) {
  const rows = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

/** buildQuery must return a `select('*', { count: 'exact', head: true })` query with its filters applied. */
export async function exactCount(buildQuery) {
  const { count, error } = await buildQuery();
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** The counting select, for exactCount call sites. */
export const counting = (supabase, table) => supabase.from(table).select('*', { count: 'exact', head: true });
