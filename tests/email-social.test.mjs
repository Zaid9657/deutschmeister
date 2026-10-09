// The learner mails carry a "Follow us" footer line (2026-10-06): YouTube,
// Instagram and Facebook, the same channels as the site footer. These tests
// pin that the functions' synced copy matches the site registry, that the line
// is in every learner mail, and that it stays untagged and inline-styled.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { SOCIAL_LINKS } = await import('../src/data/navigation.js');
const { SOCIAL_CHANNELS, isSocialHref, socialFooterLine } = await import('../netlify/functions/_shared/socialLinks.mjs');
const welcome = await import('../netlify/functions/send-welcome-email.mjs');

const MAILERS = ['daily-sentence', 'send-welcome-email', 'course-reminder', 'trial-lifecycle', 'activation-lifecycle'];

test('the functions copy matches SOCIAL_LINKS in navigation.js, key for key', () => {
  assert.deepEqual(
    SOCIAL_CHANNELS.map(({ key, href }) => ({ key, href })),
    SOCIAL_LINKS.map(({ key, href }) => ({ key, href })),
  );
});

test('every learner mail renders the follow line in its footer', () => {
  for (const name of MAILERS) {
    const src = readFileSync(join(root, 'netlify/functions', `${name}.mjs`), 'utf8');
    assert.match(src, /\$\{socialFooterLine\(/, `${name}.mjs has no follow line`);
  }
});

test('the follow line links every channel, untagged, with inline styles only', () => {
  const html = socialFooterLine('#94a3b8');
  for (const { href } of SOCIAL_CHANNELS) {
    assert.ok(html.includes(`href="${href}" style="color:#94a3b8;"`), `missing ${href}`);
    assert.ok(isSocialHref(href));
    assert.ok(!href.includes('utm_'), 'an outbound social link carries no utm tags');
  }
  assert.ok(!/class=|<svg/.test(html), 'mail clients need inline styles and no SVG (brand.mjs)');
  assert.match(socialFooterLine('#000', 'de'), /^<br>Folgen Sie uns: /, 'course mails speak Sie');
  assert.match(html, /^<br>Follow us: /);
});

test('the welcome mail, sent on every signup, carries all three channels', () => {
  const html = welcome.welcomeHtml('learner@example.com');
  for (const { href } of SOCIAL_CHANNELS) assert.ok(html.includes(`href="${href}"`), `welcome mail lacks ${href}`);
});
