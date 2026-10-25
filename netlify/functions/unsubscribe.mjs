// The unsubscribe endpoint behind every customer mail's footer link and its
// List-Unsubscribe header (_shared/unsubscribe.mjs builds both).
//
// WHAT IT STOPS. profiles.email_daily_sentence = false is the one opt-out flag
// every mailer reads (_shared/emailOptOut.mjs, lifecycle_customer_state's
// email_opted_out): the daily sentence, campaigns, the trial and activation
// mails, the course reminder and the confirmation nudge. Account and payment
// mail (Supabase auth, the dunning notice) does not read it. The page says
// exactly that. Until 2026-10-25 it said only "You won't receive daily German
// sentences anymore", which was not what happened.
//
// ONLY A POST WRITES. A GET or HEAD verifies the token and shows one button; it
// never touches the database. Until 2026-10-25 any fetch of the link wrote the
// flag, so a mail gateway that opens every link at delivery (Defender Safe
// Links, Mimecast, Proofpoint), a prefetch, or a forwarded copy stopped all mail
// without the learner clicking anything, and nothing could set it back. Now:
//   GET / HEAD                  → the question and one button (a form POST)
//   POST                        → unsubscribe: the button, or Gmail's RFC 8058
//                                 one-click POST (body List-Unsubscribe=One-Click)
//   POST action=resubscribe     → the Undo button: the flag goes back to true
// Old links in delivered mail keep working, with one extra click.
//
// &lang=de (the course reminder's links) answers in German, in Sie.
import { createClient } from '@supabase/supabase-js';
import { verifyUnsubscribeToken, UNSUBSCRIBE_PATH } from './_shared/unsubscribe.mjs';
import { BRAND } from './_shared/brand.mjs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Supabase init error:', e.message);
}

// The scope sentence is the same on every page that states it, in both languages.
export const COPY = Object.freeze({
  en: {
    back: 'Back to DeutschMeister',
    invalidTitle: 'Invalid link',
    invalid: 'This unsubscribe link is invalid or has expired. If you want to opt out, please contact us at zaid@deutsch-meister.de.',
    errorTitle: 'Something went wrong',
    error: 'We could not update your preferences. Please try again or contact zaid@deutsch-meister.de.',
    askTitle: 'Unsubscribe from DeutschMeister emails?',
    ask: 'You will get no more daily sentences, learning reminders or offers. Account and payment emails still arrive.',
    askButton: 'Unsubscribe',
    doneTitle: 'You\'re unsubscribed',
    done: 'No more daily sentences, learning reminders or offers; account and payment emails still arrive. Your account and your progress are safe.',
    undoButton: 'Undo',
    resubscribedTitle: 'You\'re subscribed again',
    resubscribed: 'Daily sentences, learning reminders and offers will reach you again. You can unsubscribe at any time.',
  },
  de: {
    back: 'Zurück zu DeutschMeister',
    invalidTitle: 'Ungültiger Link',
    invalid: 'Dieser Abmelde-Link ist ungültig oder abgelaufen. Wenn Sie keine E-Mails mehr möchten, schreiben Sie an zaid@deutsch-meister.de.',
    errorTitle: 'Etwas ist schiefgelaufen',
    error: 'Wir konnten Ihre Einstellung nicht speichern. Bitte versuchen Sie es noch einmal oder schreiben Sie an zaid@deutsch-meister.de.',
    askTitle: 'E-Mails von DeutschMeister abbestellen?',
    ask: 'Sie bekommen dann keinen Satz des Tages, keine Lern-Erinnerungen und keine Angebote mehr. E-Mails zu Ihrem Konto und zu Zahlungen bekommen Sie weiter.',
    askButton: 'Abbestellen',
    doneTitle: 'Sie haben abbestellt',
    done: 'Kein Satz des Tages, keine Lern-Erinnerungen, keine Angebote mehr. E-Mails zu Ihrem Konto und zu Zahlungen bekommen Sie weiter. Ihr Konto und Ihr Fortschritt bleiben erhalten.',
    undoButton: 'Rückgängig machen',
    resubscribedTitle: 'Sie sind wieder angemeldet',
    resubscribed: 'Sie bekommen wieder den Satz des Tages, Lern-Erinnerungen und Angebote. Sie können jederzeit wieder abbestellen.',
  },
});

const langOf = (qs) => (qs?.lang === 'de' ? 'de' : 'en');

/** The form target: this function with the same signed uid/token (and language). */
function actionUrl(uid, token, lang) {
  const params = `uid=${encodeURIComponent(uid)}&amp;token=${encodeURIComponent(token)}`;
  return `${UNSUBSCRIBE_PATH}?${params}${lang === 'de' ? '&amp;lang=de' : ''}`;
}

/** One POST button; `action` travels in the body, never in a link a scanner could open. */
const formButton = (target, action, label, primary) => `<form method="post" action="${target}">
      <input type="hidden" name="action" value="${action}">
      <button type="submit" class="${primary ? 'primary' : 'quiet'}">${label}</button>
    </form>`;

function htmlPage(lang, title, message, { form = '', linkBack = true } = {}) {
  const t = COPY[lang];
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: ${BRAND.paper}; display: flex; align-items: center; justify-content: center; min-height: 80vh; }
    .card { max-width: 420px; background: ${BRAND.white}; border-radius: 16px; padding: 40px; border: 1px solid ${BRAND.rule}; text-align: center; }
    h1 { margin: 0 0 12px; font-size: 22px; color: ${BRAND.ink}; }
    p { margin: 0 0 24px; font-size: 15px; color: ${BRAND.graphite}; line-height: 1.6; }
    form { margin: 0 0 24px; }
    button { font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; border-radius: 10px; padding: 12px 24px; }
    button.primary { background: ${BRAND.siegel}; color: ${BRAND.white}; border: 1px solid ${BRAND.siegel}; }
    button.quiet { background: ${BRAND.white}; color: ${BRAND.siegel}; border: 1px solid ${BRAND.rule}; }
    a { color: ${BRAND.siegel}; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    ${form}
    ${linkBack ? `<a href="https://deutsch-meister.de">${t.back}</a>` : ''}
  </div>
</body>
</html>`;
}

const page = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  body,
});

/** The form body's `action` (urlencoded). Anything else, Gmail's one-click body included, is "unsubscribe". */
function postedAction(event) {
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : String(event.body || '');
  const type = String(event.headers?.['content-type'] || event.headers?.['Content-Type'] || '');
  if (type && !type.includes('application/x-www-form-urlencoded')) return 'unsubscribe';
  return new URLSearchParams(raw).get('action') === 'resubscribe' ? 'resubscribe' : 'unsubscribe';
}

/** The whole request, with the database client injectable (tests pass a fake). */
export async function handleUnsubscribe(event = {}, { client = supabase } = {}) {
  const qs = event.queryStringParameters || {};
  const { uid, token } = qs;
  const lang = langOf(qs);
  const t = COPY[lang];
  const method = String(event.httpMethod || 'GET').toUpperCase();

  if (!['GET', 'HEAD', 'POST'].includes(method)) {
    return { statusCode: 405, headers: { Allow: 'GET, HEAD, POST' }, body: '' };
  }

  if (!verifyUnsubscribeToken(uid, token)) {
    return page(400, htmlPage(lang, t.invalidTitle, t.invalid));
  }

  const target = actionUrl(uid, token, lang);

  // A GET or HEAD only asks. It writes nothing, whoever (or whatever) opened it.
  if (method !== 'POST') {
    return page(200, htmlPage(lang, t.askTitle, t.ask, { form: formButton(target, 'unsubscribe', t.askButton, true) }));
  }

  if (!client) {
    return page(500, htmlPage(lang, t.errorTitle, t.error));
  }

  const action = postedAction(event);
  const subscribe = action === 'resubscribe';
  const { error } = await client
    .from('profiles')
    .update({ email_daily_sentence: subscribe })
    .eq('id', uid);

  if (error) {
    console.error('Unsubscribe update error:', error.message);
    return page(500, htmlPage(lang, t.errorTitle, t.error));
  }

  if (subscribe) {
    console.log(`Resubscribed user ${uid} to DeutschMeister emails`);
    return page(200, htmlPage(lang, t.resubscribedTitle, t.resubscribed, { form: formButton(target, 'unsubscribe', t.askButton, false) }));
  }
  console.log(`Unsubscribed user ${uid} from DeutschMeister emails`);
  return page(200, htmlPage(lang, t.doneTitle, t.done, { form: formButton(target, 'resubscribe', t.undoButton, false) }));
}

export const handler = async (event) => handleUnsubscribe(event);
