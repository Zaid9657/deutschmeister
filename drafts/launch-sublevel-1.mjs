// Sub-level course launch, Email 1 (Day 0 announcement): the copy and the
// payload builder behind drafts/send-launch-sublevel-1.sh. Staged 2026-09-27,
// NOT SENT. `node drafts/launch-sublevel-1.mjs` prints the payload JSON and
// sends nothing; only the shell script talks to send-campaign.
//
// Source copy: Email 1 of drafts/launch-sublevel-courses-2026-09.md, with the
// 2026-09-27 audit fixes (docs/SCORECARD.md work order #2):
//   - no customer quote as the opener. The draft opened on "A lot of you told
//     us … 'I want to finish A2'" and no ticket, reply or survey backs it
//     (0 support tickets exist). The opener is now a plain statement.
//   - no claim that B1/B2 are "being rebuilt to the same standard as A1 and
//     A2": A1.2 is paused by owner decision and the paid levels are not on
//     the course standard, so the sentence implied a quality we do not have.
//   - the level test takes "about 15–20 minutes", as its own landing page says
//     (src/components/LevelTest/LevelTestLanding.jsx), not "ten minutes".
//   - "A1.1 stays free, as it always was" lost "as it always was": unsourced.
//
// DERIVE, NEVER RETYPE. Every price, the Pro window, the free level, the
// coming-soon bands and the exclude list come from src/data/pricing.js and
// src/config/freeTier.js at build time. tests/launch-email.test.mjs bans price
// literals from this file and checks the built email against pricing.js.

import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import * as pricing from '../src/data/pricing.js';
import { FREE_LEVELS } from '../src/config/freeTier.js';

export const SUBJECT = 'You can now buy one German level and keep it';

export const UTM = 'utm_source=email&amp;utm_medium=launch&amp;utm_campaign=sublevel-2026-09';

// {{TOKENS}} are filled by buildLaunchEmail(); a leftover token fails the build.
export const TEMPLATE = `<p>Not everyone wants a subscription to learn German. If you would rather pay once for the level you are working on and keep it, you now can.</p>
<p>Each DeutschMeister level from {{FIRST_LEVEL}} to {{LAST_LEVEL}} is now its own one-time course. Pay once, keep it for life: every grammar lesson with typed practice, the reading texts with checks, the listening exercises, the vocabulary list and the level's final test, plus <strong>{{PRO_MONTHS}} months of Pro</strong> included, so the AI speaking coach, writing feedback and Sentence X-Ray run while you work through it.</p>
<p><strong>{{FREE_SENTENCE}}</strong> Then:</p>
<p>{{PRICE_LIST}}</p>
{{COMING_SOON_PARAGRAPH}}
<p><a href="https://deutsch-meister.de/pricing/?{{UTM}}"><strong>See the levels &rarr;</strong></a></p>
<p>Not sure which level you are? The <a href="https://deutsch-meister.de/level-test/?{{UTM}}">level test is free</a> and takes about 15&ndash;20 minutes. And if none of this is for you, nothing changes: the free daily sentence and {{FREE_LEVELS}} stay exactly as they are.</p>
<p>&mdash; Zaid</p>`;

const list = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/**
 * The send-campaign payload (minus testMode) plus a hash of it. The shell
 * script pairs a live send with a test of the same hash, so any edit to the
 * copy or to pricing.js after the test forces a new test.
 */
export function buildLaunchEmail({ p = pricing, freeLevels = FREE_LEVELS } = {}) {
  // Whole euros print without cents; anything else goes through pricing.js num().
  const euro = (n) => `&euro;${Number.isInteger(n) ? n : p.num(n)}`;

  const sellable = p.SELLABLE_LEVELS.map((level) => p.courseForLevel(level));
  if (sellable.length === 0) throw new Error('no sellable level in pricing.js');
  for (const c of sellable) {
    if (!c || c.comingSoon || !(c.price > 0)) throw new Error(`bad sellable course ${JSON.stringify(c)}`);
  }
  if (!(p.COURSE_PRO_MONTHS > 0)) throw new Error('COURSE_PRO_MONTHS is not positive');
  if (freeLevels.length === 0) throw new Error('FREE_LEVELS is empty');

  const freeCodes = freeLevels.map((l) => l.toUpperCase());
  const soonBands = [...new Set(p.COMING_SOON_LEVELS.map((l) => l.split('.')[0].toUpperCase()))];

  const fill = {
    FIRST_LEVEL: sellable[0].code,
    LAST_LEVEL: sellable.at(-1).code,
    PRO_MONTHS: String(p.COURSE_PRO_MONTHS),
    FREE_LEVELS: list(freeCodes),
    FREE_SENTENCE: `${list(freeCodes)} ${freeCodes.length > 1 ? 'stay' : 'stays'} free.`,
    PRICE_LIST: sellable.map((c) => `${c.code} &mdash; <strong>${euro(c.price)}</strong>`).join('<br />\n'),
    COMING_SOON_PARAGRAPH: soonBands.length
      ? `<p>${list(soonBands)} ${soonBands.length > 1 ? 'are' : 'is'} listed on the pricing page as coming soon and cannot be bought yet.</p>`
      : '',
    UTM,
  };
  let body = TEMPLATE;
  for (const [key, value] of Object.entries(fill)) body = body.replaceAll(`{{${key}}}`, value);
  const leftover = body.match(/\{\{[^}]*\}\}/);
  if (leftover) throw new Error(`unfilled token in the body: ${leftover[0]}`);

  // Exclude live subscribers, and anyone who already owns a level this email
  // sells — through a current sub-level product or a retired band/bundle.
  const sold = new Set(p.SELLABLE_LEVELS);
  const ownerKeys = [
    ...sellable.map((c) => c.key),
    ...Object.values(p.LEGACY_LEVEL_COURSES)
      .filter((c) => c.levels.some((l) => sold.has(l)))
      .map((c) => c.key),
  ];
  const exclude = ['subscribed', ...ownerKeys.map((k) => `purchased:${k}`)];

  const hash = createHash('sha256').update(JSON.stringify({ subject: SUBJECT, body, exclude })).digest('hex');
  return { subject: SUBJECT, body, exclude, hash };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.stdout.write(JSON.stringify(buildLaunchEmail()));
  } catch (err) {
    console.error(`refusing to build the email: ${err.message}`);
    process.exit(1);
  }
}
