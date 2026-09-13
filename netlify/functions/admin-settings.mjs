// Admin panel — settings is configuration. There is no settings table on
// this site (feature flags live in the Netlify environment), so the editable
// allow-list is EMPTY and the screen says so instead of rendering a form
// that silently discards what is typed. The role matrix is rendered from the
// enforcement; integrations report `configured` only — no secret leaves.
import { adminEndpoint, badRequest, fetchAll } from './_shared/adminHttp.mjs';
import { roleMatrix, CAPABILITIES } from './_shared/adminRbacLib.mjs';
import { SLA_HOURS } from './_shared/adminSupportLib.mjs';
import { THRESHOLDS } from './_shared/adminStatusLib.mjs';
import { LEVEL_COLUMNS, LEVELS } from './_shared/adminLevels.mjs';

/** Nothing is writable from the panel today; each key would need a validator here. */
export const EDITABLE = Object.freeze({});

const INTEGRATIONS = [
  { id: 'supabase', label: 'Supabase (Service-Role)', env: 'SUPABASE_SERVICE_ROLE_KEY' },
  { id: 'lemonsqueezy', label: 'Lemon Squeezy Webhook-Signatur', env: 'LEMONSQUEEZY_WEBHOOK_SECRET' },
  { id: 'resend', label: 'Resend (E-Mail)', env: 'RESEND_API_KEY' },
  { id: 'anthropic', label: 'Anthropic (KI)', env: 'ANTHROPIC_API_KEY' },
  { id: 'openai', label: 'OpenAI (KI/Sprache)', env: 'OPENAI_API_KEY' },
  { id: 'campaign', label: 'Kampagnen-Geheimnis (Cron-Auth)', env: 'CAMPAIGN_SECRET' },
  { id: 'unsub', label: 'Abmelde-Geheimnis', env: 'UNSUB_SECRET' },
  { id: 'iphash', label: 'IP-Hash-Salt (X-Ray-Kontingent)', env: 'IP_HASH_SALT' },
];
const FLAGS = [
  { id: 'LIFECYCLE_ACTIVATION_ENABLED', label: 'Activation-Lifecycle-Mails' },
  { id: 'CONFIRM_NUDGE_ENABLED', label: 'Bestätigungs-Erinnerung' },
  { id: 'COURSE_REMINDER_ENABLED', label: 'Kurs-Erinnerung' },
];
const COURSE_VARS = ['LEMONSQUEEZY_TELC_B1_VARIANT_ID', 'LEMONSQUEEZY_COURSE_A1_2_VARIANT_ID', 'LEMONSQUEEZY_COURSE_A2_1_VARIANT_ID', 'LEMONSQUEEZY_COURSE_A2_2_VARIANT_ID', 'LEMONSQUEEZY_COURSE_B1_1_VARIANT_ID', 'LEMONSQUEEZY_COURSE_B1_2_VARIANT_ID', 'LEMONSQUEEZY_COURSE_B2_1_VARIANT_ID', 'LEMONSQUEEZY_COURSE_B2_2_VARIANT_ID', 'LEMONSQUEEZY_COURSE_A1_VARIANT_ID', 'LEMONSQUEEZY_COURSE_A2_VARIANT_ID', 'LEMONSQUEEZY_COURSE_B1_VARIANT_ID', 'LEMONSQUEEZY_COURSE_B2_VARIANT_ID', 'LEMONSQUEEZY_COURSE_ALLE_VARIANT_ID'];

export const handler = adminEndpoint({ capabilityFor: (b) => (b.action === 'write' ? 'settings.write' : 'settings.read') }, async ({ body, supabase }) => {
  if (body.action === 'write') throw badRequest('Keine Einstellung ist über das Panel schreibbar (EDITABLE ist leer). Flags und Schlüssel werden in der Netlify-Umgebung gesetzt.', { editableKeys: Object.keys(EDITABLE) });
  const staff = await fetchAll(() => supabase.from('profiles').select('id, email, full_name, role, created_at').not('role', 'is', null).order('role'));
  return {
    editableKeys: Object.keys(EDITABLE),
    roles: roleMatrix(),
    capabilities: CAPABILITIES,
    staff,
    integrations: INTEGRATIONS.map((i) => ({ ...i, configured: Boolean(process.env[i.env]), secretShown: false })),
    flags: FLAGS.map((f) => ({ ...f, value: process.env[f.id] === 'true', raw: process.env[f.id] ? 'gesetzt' : 'nicht gesetzt' })),
    products: COURSE_VARS.map((v) => ({ env: v, configured: Boolean(process.env[v]) })),
    sla: { hours: SLA_HOURS, source: 'netlify/functions/_shared/adminSupportLib.mjs', note: 'Kalenderstunden, nicht Geschäftszeiten — das Produkt veröffentlicht kein Support-Zeitfenster; ein erfundenes würde jede historische Verletzung zur Fiktion machen.' },
    thresholds: { values: THRESHOLDS, source: 'netlify/functions/_shared/adminStatusLib.mjs' },
    levels: { values: LEVELS, casing: LEVEL_COLUMNS, source: 'netlify/functions/_shared/adminLevels.mjs' },
    unavailable: [
      { id: 'settings-store', label: 'Konfiguration', reason: 'Keine Einstellungstabelle vorhanden; Flags leben in der Netlify-Umgebung (functions scope).' },
      { id: 'notifications', label: 'Benachrichtigungen', reason: 'Keine Einstellungstabelle vorhanden.' },
      { id: 'branding', label: 'Branding', reason: 'Branding liegt im Code (src/data/design-tokens.js), nicht in der Datenbank.' },
      { id: 'templates', label: 'E-Mail-Vorlagen', reason: 'Vorlagen liegen im Code der Netlify-Funktionen.' },
      { id: 'retention', label: 'Aufbewahrung', reason: 'Keine konfigurierbare Aufbewahrungsregel implementiert.' },
    ],
    generatedAt: new Date().toISOString(),
  };
});
