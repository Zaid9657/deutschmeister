// Reads the acquisition record public/attribution.js wrote on landing.
//
// The capture lives in a framework-free script shared with the Astro pages
// (most first landings are the static homepage, /pricing/ or a Leitfaden, not
// the SPA), so this module only READS. At signup the record travels as
// auth.signUp user metadata; the profiles trigger copies it into the
// acquisition_* columns (migrations/2026-09-20-acquisition-attribution.sql).
import { safeGetJSON } from '../utils/safeStorage';

const KEY = 'dm_attribution';
const FIELDS = ['source', 'medium', 'campaign', 'content', 'term', 'referrer', 'landing', 'at'];

const pick = (touch) => {
  if (!touch || typeof touch !== 'object') return null;
  const out = {};
  for (const f of FIELDS) {
    const v = touch[f];
    if (typeof v === 'string' && v) out[f] = v.slice(0, 200);
  }
  return out.source ? out : null;
};

/** { first, last } as stored, each already sanitised, or null when this visitor was never attributed. */
export const getAttribution = () => {
  const stored = safeGetJSON(KEY, null);
  if (!stored) return null;
  const first = pick(stored.first);
  const last = pick(stored.last);
  return first || last ? { first: first || last, last: last || first } : null;
};

/** The user-metadata payload handed to supabase.auth.signUp — {} when unattributed so the trigger sees no keys. */
export const signupAttributionMetadata = () => {
  const a = getAttribution();
  if (!a) return {};
  return {
    acquisition_source: a.first.source,
    acquisition_medium: a.first.medium || null,
    acquisition_campaign: a.first.campaign || null,
    acquisition_content: a.first.content || null,
    acquisition_referrer: a.first.referrer || null,
    acquisition_landing: a.first.landing || null,
    acquisition_at: a.first.at || null,
    acquisition_last_source: a.last.source,
  };
};
