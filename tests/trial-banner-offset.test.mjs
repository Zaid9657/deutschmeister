// The trial countdown band sits below the fixed navbar, not behind it
// (src/components/TrialBanner.jsx, src/components/Navbar.jsx, src/App.jsx).
//
// The defect this closes (cross-check 2026-10-25, SHL-11, C-077/X-081): the
// band was `sticky top-0 z-40`, the first in-flow element after a navbar that
// is `fixed top-0 z-50` and 64 px tall. The band is itself about 64 px (py-2.5
// plus a min-h-11 button), so its countdown, its Upgrade button and its Dismiss
// control were behind the 90%-opaque bar at every scroll position; clicks hit
// the nav, and on phones (the nav's trial chip is desktop-only) a trial learner
// saw no countdown at all — just a blank band pushing every page down.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

// Tailwind's spacing scale: n → n × 0.25 rem.
const rem = (n) => Number(n) / 4;

test('the band is stuck below the navbar height and stacks under the bar', () => {
  const nav = read('src/components/Navbar.jsx');
  const navClass = nav.match(/<nav\s+className=\{`([^`]*)`\}/)[1];
  assert.match(navClass, /\bfixed top-0\b/, 'premise: the navbar is fixed at the top');
  const navZ = Number(navClass.match(/\bz-(\d+)\b/)[1]);
  const barHeight = rem(nav.match(/<div className="flex items-center justify-between h-(\d+)">/)[1]);

  const banner = read('src/components/TrialBanner.jsx');
  const bandClass = banner.match(/<div className=\{`(sticky [^`]*)`\} data-urgency=\{urgency\}>/);
  assert.ok(bandClass, 'the band is a sticky element');
  const top = bandClass[1].match(/\btop-(\d+)\b/);
  assert.ok(top, 'the band names its sticky offset');
  assert.ok(rem(top[1]) >= barHeight, `sticky top ${rem(top[1])}rem is above the ${barHeight}rem navbar`);
  const bandZ = Number(bandClass[1].match(/\bz-(\d+)\b/)[1]);
  assert.ok(bandZ < navZ, 'the nav menus still open over the band');
});

test('the band is still the next element after the navbar in the shell', () => {
  // If the band moved inside the fixed nav or above it, the offset rule above
  // would no longer describe where it renders — re-read this suite then.
  const app = read('src/App.jsx');
  assert.match(app, /\{!focused && <Navbar \/>\}\s*\n\s*\{!focused && <OutsideAdmin><TrialBanner \/><\/OutsideAdmin>\}/);
});
