// Analytics guard — plan Task 4 (speaking-live-quality) + spec §13.1.
//
// Two rules this suite defends:
//   1. Speaking events emit through the SHARED allowlist, on both sides.
//   2. Analytics is consent-gated: new tracking must ride the existing
//      consent machinery (public/consent.js), never a direct provider call.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('browser speaking events go through the shared sanitizer', () => {
  const src = read('src/lib/funnelTracking.js');
  assert.match(src, /sanitizeSpeakingEvent/);
  assert.match(src, /_shared\/speakingMetrics\.mjs/, 'the browser must reuse the SERVER allowlist module');
  // Every speaking tracker must funnel through trackSpeaking, never track().
  const speakingExports = [...src.matchAll(/export const (trackSpeaking\w+) = \(props\) => (\w+)\(/g)];
  assert.ok(speakingExports.length >= 6, 'expected the six speaking trackers');
  for (const [, name, fn] of speakingExports) {
    assert.equal(fn, 'trackSpeaking', `${name} bypasses the sanitizer`);
  }
});

test('the funnel event names match the spec list', () => {
  const src = read('src/lib/funnelTracking.js');
  for (const name of [
    'speaking_started', 'speaking_connected', 'speaking_turn_completed',
    'speaking_failed', 'speaking_ended', 'speaking_fallback_used',
  ]) {
    assert.ok(src.includes(`'${name}'`), `${name} tracker missing`);
  }
});

test('analytics stays consent-gated', () => {
  const consent = read('public/consent.js');
  assert.match(consent, /dm_cookie_consent/, 'the consent flag is the gate for every analytics provider');
  // No speaking surface may call a provider SDK directly.
  for (const file of ['src/lib/funnelTracking.js']) {
    const src = read(file);
    assert.doesNotMatch(src, /posthog\.capture|gtag\(/, `${file} calls a provider SDK directly instead of track()`);
  }
});
