// Pro is unlimited in content and metered in AI.
//
// The server caps every AI feature: speaking is 30 sessions a month on Pro and
// 2 in total in the trial (netlify/functions/_shared/speakingUsage.mjs), Sentence
// X-Ray and the writing evaluations have daily or trial allowances of their own.
// src/data/marketing.js states Pro's speaking allowance with its period, "never
// as 'unlimited'", and tests/claims.test.mjs bans the word on a LIST of price
// surfaces. The list is how the dashboard's trial strip got through: "Keep your
// streak and unlock unlimited speaking" has stood next to its Upgrade to Pro
// button on every trial learner's dashboard since 2026-09-01 (a37f965), while
// Pro grants 30 sessions a month (measured 2026-10-06: 0 accounts on the uncapped
// staff tier, 5 on pro).
//
// A list of files never covers the next screen, so this rule walks the source
// trees. Where the class is not at zero yet, a ratchet holds it at its measured
// count: lower MAX_UNLIMITED_AI_LINES in the same commit that fixes a line, never
// raise it. The fixes belong to the screens' owners (handoff 2026-10-06).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/** Source minus comments, imports and HTML comments: what ships, not what a file says about itself. */
const rendered = (src) =>
  src
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|import\s|export\s+\{)/.test(line))
    .join('\n');

const COPY_ROOTS = ['src', 'astro-site/src', 'netlify/functions'];
// Teaching material is German example text, not product copy (as in
// tests/trial-end-claims.test.mjs). The staff console describes the server's
// tiers to the team, including the uncapped staff tier; it offers nothing.
const SKIP = [
  'src/data/curricula',
  'src/data/lessonPools',
  'src/data/mockExams',
  'src/data/courseTests',
  'src/data/courses',
  'src/pages/admin',
  'src/components/admin',
];
const isStaffFunction = (rel) => /^netlify\/functions\/(admin-[^/]+|_shared\/admin[^/]*)\.mjs$/.test(rel);
const copyFiles = () => {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const rel = `${dir}/${entry.name}`;
      if (SKIP.includes(rel)) continue;
      if (entry.isDirectory()) walk(rel);
      else if (/\.(jsx?|mjs|astro)$/.test(entry.name) && !isStaffFunction(rel)) out.push(rel);
    }
  };
  COPY_ROOTS.forEach(walk);
  return out;
};

// "Unlimited", in either language and its usual paraphrases.
const UNLIMITED = String.raw`(?:unlimited|unbegrenzt\w*|unlimitiert\w*|uneingeschränkt\w*|limitless|endless|no\s+limits?|without\s+(?:any\s+)?limits?|ohne\s+(?:jedes\s+)?(?:limit|grenzen|begrenzung)|beliebig\s+viele?|as\s+(?:much|many|often)\s+as\s+you\s+(?:like|want|need))`;
// The metered things: AI speaking, X-Ray analyses, AI writing feedback, the tutor.
// Plain content ("unlimited access to all levels", "unlimited exercises") is true
// for Pro and is not matched.
const METERED = String.raw`(?:speak\w*|sprech\w*|session\w*|sitzung\w*|analys\w*|x-?ray|tutor\w*|conversation\w*|gespräch\w*|konversation\w*|chat\w*|ki|ai|feedback|correction\w*|korrektur\w*|evaluat\w*|bewertung\w*|writing|schreib\w*)`;
// "Unlimited access to everything" includes the metered features too.
const EVERYTHING = String.raw`(?:everything|all\s+features|all\s+of\s+it|alles|allem|alle[nm]?\s+funktionen)`;
// The gap stops at a sentence end or a string delimiter, so two unrelated
// strings on one line do not pair up.
const GAP = String.raw`[^.!?'"\x60]{0,100}`;
const UNLIMITED_METERED = new RegExp(
  String.raw`\b${UNLIMITED}\b${GAP}\b(?:${METERED}|${EVERYTHING})\b|\b${METERED}\b${GAP}\b${UNLIMITED}\b`,
  'i',
);

// Measured 2026-10-06 on origin/main 8e28547d: src/pages/DashboardPage.jsx (the
// trial strip) and src/pages/SpeakingPage.jsx ("like a patient tutor with
// unlimited time", the /speaking/ page). Both are product's screens.
const MAX_UNLIMITED_AI_LINES = 2;

test('the pattern catches unlimited AI claims and leaves the true content claim alone', () => {
  for (const claim of [
    'Keep your streak and unlock unlimited speaking',
    'concrete corrections — like a patient tutor with unlimited time.',
    'Unlimited AI speaking practice',
    'Speaking sessions: unlimited',
    'Unbegrenzte KI-Sprechübungen',
    'So viele Sprechübungen, wie Sie wollen — ohne Limit',
    'Practise speaking as much as you like',
    'Sentence X-Ray without limits',
    'beliebig viele KI-Analysen',
    // Removed from the /vergleich/ pages on 2026-08-22 (7ded88d0), before any rule walked them:
    'Deutschmeisters KI-Sprechtraining ist auf Goethe, telc und TestDaF abgestimmt und auf jedem Niveau unbegrenzt nutzbar.',
    'Deutschmeister Pro kostet 9,99 €/Monat — mit unbegrenztem Zugang zu allem',
  ]) assert.match(claim, UNLIMITED_METERED, claim);
  for (const ok of [
    'Unlimited access to all 8 levels',
    'Unbegrenzter Zugang zu allen 8 Leveln',
    '30 AI speaking sessions per month',
    'Das Zertifikat ist zeitlich unbegrenzt gültig.',
    'Grammatically there is no limit, but readability sets one.',
    '} else if (usage?.unlimited) {',
    "Unlimited exercises. 'Speaking: 30 sessions a month'",
  ]) assert.doesNotMatch(ok, UNLIMITED_METERED, ok);
});

test('no surface calls a metered AI feature unlimited (ratchet at its measurement)', () => {
  const files = copyFiles();
  const hits = [];
  for (const file of files) {
    rendered(read(file))
      .split('\n')
      .forEach((line) => {
        if (UNLIMITED_METERED.test(line)) hits.push(`${file}: ${line.trim().slice(0, 120)}`);
      });
  }
  assert.ok(files.length > 100, `only ${files.length} source files were walked`);
  assert.ok(
    hits.length <= MAX_UNLIMITED_AI_LINES,
    `Pro's AI features are metered (speakingUsage.mjs, marketing.js SPEAKING_LINE); state the allowance instead of "unlimited":\n  ${hits.join('\n  ')}`,
  );
  assert.equal(
    hits.length,
    MAX_UNLIMITED_AI_LINES,
    `a line was fixed: lower MAX_UNLIMITED_AI_LINES to ${hits.length} in the same commit:\n  ${hits.join('\n  ')}`,
  );
});
