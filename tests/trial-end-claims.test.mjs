// What the end of the trial takes away, and what it leaves.
//
// Signup grants every level for TRIAL_DAYS. When the trial ends the account
// stays, and so does the free level (FREE_LEVELS in src/config/freeTier.js;
// hasLevelAccess in SubscriptionContext opens it for everyone). Only the other
// levels close, unless the learner pays or bought that level's course.
//
// Until 2026-10-04 the trial banner (TrialBanner.jsx), which sits on every SPA
// screen for a learner in the last three days of the trial, said "Only N days
// left! Don't lose access to all features." That was false: the A1.1 lessons
// stay free, and SpeakingLimitOffer already says so ("Your A1.1 lessons stay
// free"). It is the upgrade prompt at the moment of intent, so it is held to
// the same rule as the price lines: say what is true, derive it, never retype.
//
// The first rule walks the source trees rather than a file list, so a new
// screen is covered the day it is written.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FREE_LEVELS, isLevelFree } from '../src/config/freeTier.js';
import { FREE_LEVEL_LABEL } from '../src/data/marketing.js';

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
const copyFiles = () => {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (/\.(jsx?|mjs|astro)$/.test(entry.name)) out.push(rel);
    }
  };
  COPY_ROOTS.forEach(walk);
  return out;
};

/**
 * A learner told they lose all of it, or everything, in either language:
 * "lose access to all features", "you will lose everything",
 * "verlieren Sie den Zugang zu allem", "alles verloren". The gap stops at a
 * sentence end or a string delimiter, so two unrelated strings on one line do
 * not pair up.
 */
const LOSES_EVERYTHING = new RegExp(
  [
    String.raw`\b(lose|losing|lost)\b[^.!?'"\x60]{0,40}\b(all|everything)\b`,
    String.raw`\bverl(ier|or)\w*\b[^.!?'"\x60]{0,40}\b(alles|allem|alle[nm]?)\b`,
    String.raw`\b(alles|allem)\b[^.!?'"\x60]{0,40}\bverl(ier|or)\w*`,
  ].join('|'),
  'i',
);

test('the pattern catches the line it was written for, and not its fix', () => {
  assert.match("Only ${daysRemaining} days left! Don't lose access to all features.", LOSES_EVERYTHING);
  assert.match('Sonst verlieren Sie den Zugang zu allem.', LOSES_EVERYTHING);
  assert.match('Wenn die Testphase endet, ist alles verloren.', LOSES_EVERYTHING);
  assert.doesNotMatch(
    'Only ${daysRemaining} days left in your trial. After that, your ${FREE_LEVEL_LABEL} lessons stay free.',
    LOSES_EVERYTHING,
  );
  assert.doesNotMatch("Your trial ends today!", LOSES_EVERYTHING);
});

test('no surface tells a learner they lose everything when the trial ends', () => {
  const files = copyFiles();
  const failures = [];
  for (const file of files) {
    for (const line of rendered(read(file)).split('\n')) {
      if (LOSES_EVERYTHING.test(line)) failures.push(`${file}: ${line.trim().slice(0, 120)}`);
    }
  }
  assert.ok(files.length > 100, `only ${files.length} source files were walked`);
  assert.deepEqual(
    failures,
    [],
    `the end of the trial keeps the free level open (src/config/freeTier.js); these lines say it takes everything:\n  ${failures.join('\n  ')}`,
  );
});

test('the free level the banner names is the one the app keeps open', () => {
  // The banner's "your A1.1 lessons stay free" is only true while the label
  // and the free tier agree. One free level today; if a second is added the
  // label must say so before any surface may claim it.
  assert.deepEqual(FREE_LEVELS, [FREE_LEVEL_LABEL.toLowerCase()]);
  assert.ok(isLevelFree(FREE_LEVEL_LABEL), `${FREE_LEVEL_LABEL} is not free in src/config/freeTier.js`);
});

test('the trial banner derives what stays free and says it in the countdown', () => {
  const src = read('src/components/TrialBanner.jsx');
  const copy = rendered(src);
  assert.match(src, /import\s*\{[^}]*\bFREE_LEVEL_LABEL\b[^}]*\}\s*from\s*'\.\.\/data\/marketing\.js'/);
  // The last-days line names what the learner keeps, from the derived label.
  const urgent = copy.split('\n').find((line) => /left in your trial/.test(line));
  assert.ok(urgent, 'the last-days countdown line is missing');
  assert.match(urgent, /\$\{FREE_LEVEL_LABEL\} lessons stay free/);
  // The label is never typed into the banner by hand.
  assert.doesNotMatch(copy, /\bA1\.1\b/);
});
