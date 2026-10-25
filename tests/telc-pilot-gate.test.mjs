// The telc B1 pilot's sale switch (docs/telc-pilot/README.md, 2026-10-12).
//
// The product is sold only while the owner has set PUBLIC_TELC_B1_ON_SALE=true
// (builds scope) AND it has a checkout id — so the Lemon Squeezy reprice and a
// test purchase happen BEFORE any Buy button renders. Before this, the €89
// product was buyable from two surfaces the moment its variant ids were set:
// a hosted guest link on the Astro sales page and the SPA's /subscription card.
//
// One switch, two front ends:
//   - the SPA reads it through Vite's envPrefix (vite.config.js) and gates the
//     one config field every SPA purchase surface reads;
//   - the Astro page reads it through telcPilotVariant() and renders its Buy
//     buttons, and the Product/Offer JSON-LD, only behind that id.
// The gate expressions are evaluated here against fake envs, not just matched:
// only the exact string "true" plus an id may open the sale.
// scripts/check-built-html.mjs holds the BUILT page to the same rule.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

import { COURSE_TELC_B1_PRICE_EUR, COURSE_PRO_MONTHS, PLANS, eur, deEur } from '../src/data/pricing.js';
import { renderShort, renderFull, telcOnSale } from '../scripts/build-llms.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const spaConfig = read('src/config/lemonsqueezy.js');
const variants = read('astro-site/src/lib/courseVariants.js');
const page = read('astro-site/src/pages/telc-b1-komplettvorbereitung.astro');
const pricing = read('astro-site/src/pages/pricing.astro');
const viteConfig = read('vite.config.js');
const TELC_PRICE = eur(COURSE_TELC_B1_PRICE_EUR);

/** Evaluate a gate expression with `import.meta.env` replaced by a fake env. */
function gate(expression, env) {
  return new Function('env', `return (${expression.replace(/import\.meta\.env/g, 'env')});`)(env);
}

const ENVS = [
  [{}, false],
  [{ PUBLIC_TELC_B1_ON_SALE: 'true' }, false], // switched on, but no product id
  [{ ID: 'uuid-1' }, false], // a product id, but the sale is off
  [{ PUBLIC_TELC_B1_ON_SALE: 'false', ID: 'uuid-1' }, false],
  [{ PUBLIC_TELC_B1_ON_SALE: '1', ID: 'uuid-1' }, false],
  [{ PUBLIC_TELC_B1_ON_SALE: 'TRUE', ID: 'uuid-1' }, false],
  [{ PUBLIC_TELC_B1_ON_SALE: ' true', ID: 'uuid-1' }, false],
  [{ PUBLIC_TELC_B1_ON_SALE: 'true', ID: 'uuid-1' }, true],
];

test('the SPA config gives the telc product a checkout id only when the sale is on', () => {
  const m = spaConfig.match(/telc_b1_komplett:\s*\{[\s\S]*?variantId:\s*([^\n]+),\n/);
  assert.ok(m, 'telc variantId line not found in src/config/lemonsqueezy.js');
  const expr = m[1];
  for (const [env, open] of ENVS) {
    const real = { ...env, VITE_LEMONSQUEEZY_TELC_B1_VARIANT_ID: env.ID };
    assert.equal(gate(expr, real), open ? 'uuid-1' : '', `SPA gate with ${JSON.stringify(env)}`);
  }
  // Every SPA purchase surface (the /subscription card, handleBuyCourse, the
  // ?buy= resume) reads this one field — none may read the env var directly.
  for (const file of ['src/pages/SubscriptionPage.jsx', 'src/pages/SignupPage.jsx', 'src/pages/DashboardPage.jsx', 'src/pages/SubscriptionSuccessPage.jsx']) {
    assert.doesNotMatch(read(file), /LEMONSQUEEZY_TELC_B1_VARIANT_ID|TELC_B1_ON_SALE/, `${file} bypasses the config gate`);
  }
});

test('Vite exposes exactly the one switch to the SPA, nothing wider', () => {
  const m = viteConfig.match(/envPrefix:\s*\[([^\]]*)\]/);
  assert.ok(m, 'vite.config.js has no envPrefix — the SPA would never see the switch');
  const prefixes = [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]);
  assert.deepEqual(prefixes, ['VITE_', 'PUBLIC_TELC_B1_ON_SALE']);
});

test('the Astro helper gives the telc page a checkout id only when the sale is on', () => {
  const m = variants.match(/export const telcPilotVariant = \(\) =>\s*([\s\S]*?);\n/);
  assert.ok(m, 'telcPilotVariant() not found in astro-site/src/lib/courseVariants.js');
  for (const [env, open] of ENVS) {
    const real = { ...env, PUBLIC_LEMONSQUEEZY_TELC_B1_VARIANT_ID: env.ID };
    assert.equal(gate(m[1], real), open ? 'uuid-1' : '', `Astro gate with ${JSON.stringify(env)}`);
  }
});

test('the sales page reads the id only through the gate and sells nothing without it', () => {
  assert.match(page, /const variantId = telcPilotVariant\(\);/);
  assert.doesNotMatch(page, /import\.meta\.env/, 'an env read on the page would bypass the gate');
  assert.doesNotMatch(page, /checkout\/buy/, 'no hosted-checkout link: every order must carry the account user id');
  assert.doesNotMatch(page, /data-checkout=/, 'the old guest-link hook is back');

  // Every Buy button takes the gated id and sits in the TRUE branch of a
  // `{variantId ? (` or `{variantId && (` block.
  const buttons = [...page.matchAll(/data-course-variant=\{([^}]+)\}/g)];
  assert.equal(buttons.length, 2, 'expected the hero and the price-card Buy buttons');
  for (const b of buttons) {
    assert.equal(b[1], 'variantId');
    const before = page.slice(0, b.index);
    const open = Math.max(before.lastIndexOf('{variantId ? ('), before.lastIndexOf('{variantId && ('));
    assert.ok(open >= 0, 'a Buy button outside any variantId guard');
    const between = before.slice(open);
    assert.doesNotMatch(between, /\)\s*:\s*\(|\)\}/, 'a Buy button in the off-sale branch');
  }
  assert.match(page, /data-course-key=\{course\.key\}/);
  assert.match(page, /<CourseCheckout \/>/, 'the buttons need the shared checkout script');

  // The Offer is published only while it can be bought.
  assert.match(page, /const jsonLd = variantId \? \[productSchema, faqSchema\] : \[faqSchema\];/);
});

test('off sale, the page offers the attributed free-account door instead', () => {
  assert.match(page, /const signupHref = onsiteHref\('signup', 'telc-pilot', 'telc-b1'\);/);
  assert.match(page, /\) : \(\s*<a href=\{signupHref\}/, 'the off-sale branch must render the signup door');
  assert.doesNotMatch(page, /href="\/signup"/, 'a bare signup link loses the telc-pilot attribution');
});

// ── The other surfaces that sold the package (2026-10-25) ───────────────────
// /pricing/ priced the package in a card and in an FAQ answer (and so in its
// FAQPage JSON-LD), and llms.txt quoted it to answer engines, while the sales
// page itself had no Buy button: a visitor with intent to buy hit a dead end.
// The same switch now gates all three.

/** The /pricing/ FAQ list, evaluated for one sale state. */
function pricingFaqs({ onSale, levelCourses }) {
  const block = pricing.match(/const FAQS = (\[[\s\S]*?\n\]);/);
  assert.ok(block, 'const FAQS not found in pricing.astro');
  return vm.runInNewContext(`(${block[1]})`, {
    FREE_LEVEL_LABEL: 'A1.1', TOPICS_PER_LEVEL: 12, TRIAL_DAYS: 7, FREE_DAILY_LIMIT: 1,
    BILLING_PORTAL_LABEL: 'portal.example', BILLING_PORTAL_URL: 'https://portal.example',
    COURSE_PRO_MONTHS, COURSE_TELC_B1_PRICE_EUR, PLANS, eur,
    showLevelCourses: levelCourses, priceList: 'A1.2 €40.00', telcOnSale: onSale,
  });
}

test('/pricing/ reads the same switch and sells the package only while it is on', () => {
  assert.match(pricing, /import \{[^}]*\btelcPilotVariant\b[^}]*\} from '\.\.\/lib\/courseVariants\.js';/);
  assert.match(pricing, /const telcOnSale = Boolean\(telcPilotVariant\(\)\);/);
  assert.doesNotMatch(pricing, /TELC_B1_ON_SALE|LEMONSQUEEZY_TELC_B1_VARIANT_ID/, 'an env read on /pricing/ would bypass the gate');

  // The FAQ (and with it the FAQPage JSON-LD built from FAQS).
  for (const levelCourses of [true, false]) {
    const off = pricingFaqs({ onSale: false, levelCourses });
    for (const { q, a } of off) {
      assert.ok(!a.includes(TELC_PRICE), `off sale (level courses ${levelCourses}): "${q}" prices the telc package`);
      assert.doesNotMatch(a, /Komplettvorbereitung/, `off sale (level courses ${levelCourses}): "${q}" offers the telc package`);
    }
    const on = pricingFaqs({ onSale: true, levelCourses });
    assert.ok(on.some(({ a }) => a.includes(TELC_PRICE)), `on sale (level courses ${levelCourses}): the one-time answer names the package`);
  }

  // The card: its price and "one-time" line sit in the TRUE branch of
  // `{telcOnSale ? (`; the off-sale branch carries the attributed door.
  const template = pricing.slice(pricing.indexOf('\n---\n', 4) + 5);
  const sold = [...template.matchAll(/\{eur\(COURSE_TELC_B1_PRICE_EUR\)\}|one-time · no subscription/g)];
  assert.ok(sold.length >= 2, 'the card still renders its price and terms when on sale');
  for (const m of sold) {
    const before = template.slice(0, m.index);
    const open = before.lastIndexOf('{telcOnSale ? (');
    assert.ok(open >= 0, `"${m[0]}" renders outside the telcOnSale guard`);
    // A branch ends at a line that starts with ") : (" or ")}" — not at the ")}"
    // closing an inline expression such as {eur(…)}.
    assert.doesNotMatch(before.slice(open), /\n\s*\)\s*:\s*\(|\n\s*\)\}/, `"${m[0]}" renders in the off-sale branch`);
  }
  assert.match(pricing, /const telcSignupHref = onsiteHref\('signup', 'telc-pilot', '[a-z-]+'\);/);
  assert.match(template, /\{!telcOnSale && \(\s*<a href=\{telcSignupHref\}/, 'off sale, the card offers the attributed free-account door');
});

test('the shared offer copy names no price for the package, whatever the switch', async () => {
  // offers.js renders on the homepage, /courses/, /pricing/ and the level-test
  // result, none of which reads the sale switch: EXAM_ROUTE ended on "the telc
  // B1 course is its own <price> programme" on all four while it was off sale.
  // The package's own page states the price and whether it can be bought.
  const TELC_PRICE_DE = deEur(COURSE_TELC_B1_PRICE_EUR);
  for (const root of ['src/data', 'astro-site/src/data']) {
    const offers = await import(`../${root}/offers.js`);
    const texts = [];
    const walk = (value) => {
      if (typeof value === 'string') texts.push(value);
      else if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === 'object') Object.values(value).forEach(walk);
    };
    for (const value of Object.values(offers)) {
      // Functions build their lines from a station; call them for every one.
      if (typeof value === 'function') {
        for (const s of offers.STATIONS) {
          try { walk(value(s.level)); walk(value(s)); } catch { /* not a station-shaped helper */ }
        }
      } else walk(value);
    }
    assert.ok(texts.length > 20, `${root}/offers.js: the walk found too little copy`);
    for (const text of texts) {
      assert.ok(!text.includes(TELC_PRICE) && !text.includes(TELC_PRICE_DE), `${root}/offers.js prices the telc package: "${text.slice(0, 110)}"`);
    }
    assert.ok(offers.EXAM_ROUTE.links.some((l) => l.href === '/telc-b1-komplettvorbereitung/'), 'the route still links the package\'s page');
  }
  assert.match(pricing, /\{EXAM_ROUTE\.title\}<\/strong> \{EXAM_ROUTE\.body\}/, '/pricing/ renders the shared route as it is');
  assert.match(read('src/components/LevelTest/LevelTestResults.jsx'), /\{EXAM_ROUTE\.body\}/, 'the level-test result renders the same copy');
});

test('the AI-facing catalogue reads the same switch; the committed pair is one state\'s render', async () => {
  const { committedSaleStates } = await import('../scripts/build-llms.mjs');
  for (const [env, open] of ENVS) {
    assert.equal(telcOnSale({ ...env, PUBLIC_LEMONSQUEEZY_TELC_B1_VARIANT_ID: env.ID }), open, `build-llms gate with ${JSON.stringify(env)}`);
  }
  // Off sale the package is named without a price; on sale it carries its price.
  for (const render of [renderShort, renderFull]) {
    const off = render({ telcOnSale: false });
    assert.ok(!off.includes(TELC_PRICE), `${render.name}: off sale, the package is priced`);
    assert.match(off, /Komplettvorbereitung:\*\* starts soon, not on sale yet/);
    const on = render({ telcOnSale: true });
    assert.ok(on.includes(TELC_PRICE), `${render.name}: on sale, the package is listed with its price`);
    assert.doesNotMatch(on, /not on sale yet/, `${render.name}: on sale, the package is listed as not on sale`);
  }
  // The committed files may be generated in either state (the owner opens the
  // sale with a regeneration), but each equals that state's render, the two
  // agree, and only an off-sale render may leave the price out.
  const states = committedSaleStates();
  for (const [file, state] of Object.entries(states)) {
    assert.notEqual(state, null, `${file} equals neither sale state's render — run: node scripts/build-llms.mjs`);
    assert.equal(read(file).includes(TELC_PRICE), state, `${file}: the price is present exactly when the file is the on-sale render`);
  }
  assert.equal(new Set(Object.values(states)).size, 1, 'llms.txt and llms-full.txt describe different sale states');
  // Both states are accepted by the comparison, and a hand edit by neither.
  const fake = (state) => (file) => (file.endsWith('llms.txt') ? renderShort : renderFull)({ telcOnSale: state });
  assert.deepEqual(Object.values(committedSaleStates(fake(true))), [true, true]);
  assert.deepEqual(Object.values(committedSaleStates(fake(false))), [false, false]);
  assert.deepEqual(Object.values(committedSaleStates(() => 'hand-edited')), [null, null]);
});

test('the built-HTML check holds every page, and on a deploy the catalogue, to the switch', () => {
  const dir = mkdtempSync(join(tmpdir(), 'telc-gate-'));
  const page = (title, body) => `<html lang="en"><head><title>${title}</title></head><body>${body}</body></html>`;
  const run = (env) => {
    const r = spawnSync(process.execPath, ['scripts/check-built-html.mjs', dir, '--spa-only'], {
      cwd: ROOT, env: { PATH: process.env.PATH, ...env }, encoding: 'utf8',
    });
    return `${r.stdout}\n${r.stderr}`;
  };
  const ON = { PUBLIC_TELC_B1_ON_SALE: 'true', PUBLIC_LEMONSQUEEZY_TELC_B1_VARIANT_ID: 'uuid-1' };
  try {
    for (const d of ['pricing', 'courses', 'telc-b1-komplettvorbereitung']) mkdirSync(join(dir, d));
    writeFileSync(join(dir, 'app.html'), page('App', ''));
    writeFileSync(join(dir, 'index.html'), page('Home', `<p>the telc B1 course is its own ${TELC_PRICE} programme</p>`));
    writeFileSync(join(dir, 'pricing', 'index.html'), page('Pricing', `<p>${TELC_PRICE}</p>`));
    writeFileSync(join(dir, 'courses', 'index.html'), page('Courses', `<p>${deEur(COURSE_TELC_B1_PRICE_EUR)} einmalig</p>`));
    writeFileSync(join(dir, 'telc-b1-komplettvorbereitung', 'index.html'), page('telc', `<p>${deEur(COURSE_TELC_B1_PRICE_EUR)}</p>`));
    writeFileSync(join(dir, 'llms.txt'), `- telc B1: ${TELC_PRICE} one-time`);
    writeFileSync(join(dir, 'llms-full.txt'), '- telc B1: starts soon, not on sale yet');

    // Off sale: every page but the package's own fails on its price, in either format.
    const off = run({});
    assert.match(off, /FAIL\s+index\.html: off sale, but the telc B1 package is still priced/);
    assert.match(off, /FAIL\s+pricing\/index\.html: off sale, but the telc B1 package is still priced/);
    assert.match(off, /FAIL\s+courses\/index\.html: off sale, but the telc B1 package is still priced/);
    assert.doesNotMatch(off, /telc-b1-komplettvorbereitung\/index\.html: off sale, but the telc B1 package is still priced/);
    // The committed catalogue: outside a deploy the switch is unknown, so it warns;
    // on a Netlify build the switch is the truth, so it fails.
    assert.match(off, /WARN\s+llms\.txt: off sale, but the telc B1 package is listed/);
    assert.doesNotMatch(off, /FAIL\s+llms/);
    assert.match(run({ NETLIFY: 'true' }), /FAIL\s+llms\.txt: off sale, but the telc B1 package is listed/);
    assert.doesNotMatch(off, /llms-full\.txt: off sale/);

    // On sale: /pricing/ must quote the price; an understating catalogue only warns.
    writeFileSync(join(dir, 'pricing', 'index.html'), page('Pricing', '<p>Starts soon</p>'));
    const on = run({ ...ON, NETLIFY: 'true' });
    assert.match(on, /FAIL\s+pricing\/index\.html: on sale, but the telc B1 card quotes no price/);
    assert.match(on, /WARN\s+llms-full\.txt: the telc B1 package is on sale/, 'an understating catalogue warns');
    assert.doesNotMatch(on, /FAIL\s+llms/, 'an understating catalogue never blocks the deploy that opens the sale');
    assert.doesNotMatch(on, /off sale, but the telc B1 package is still priced/, 'on sale, other pages may name the price');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
