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

import { COURSE_TELC_B1_PRICE_EUR, COURSE_PRO_MONTHS, PLANS, eur } from '../src/data/pricing.js';
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

test('/pricing/ renders the exam route without the package\'s price while it is off sale', async () => {
  // offers.js EXAM_ROUTE ends on "the telc B1 course is its own <price>
  // programme"; the page renders it beside the level tickets.
  const { EXAM_ROUTE } = await import('../astro-site/src/data/offers.js');
  assert.ok(EXAM_ROUTE.body.includes(TELC_PRICE), 'offers.js no longer prices the package here — simplify this rule');
  const expr = pricing.match(/const examRouteBody = ([\s\S]*?);\n/);
  assert.ok(expr, 'const examRouteBody not found in pricing.astro');
  const body = (onSale) => vm.runInNewContext(`(${expr[1]})`, { EXAM_ROUTE, eur, COURSE_TELC_B1_PRICE_EUR, telcOnSale: onSale });
  assert.ok(!body(false).includes(TELC_PRICE), `off sale, the exam route prices the package: "${body(false)}"`);
  assert.match(body(false), /\.$/, 'the shortened route still ends as a sentence');
  assert.equal(body(true), EXAM_ROUTE.body, 'on sale, the route is offers.js word for word');
  assert.match(pricing, /\{EXAM_ROUTE\.title\}<\/strong> \{examRouteBody\}/, 'the page renders the gated body');
});

test('the AI-facing catalogue reads the same switch, and the committed copy is the off-sale state', () => {
  for (const [env, open] of ENVS) {
    assert.equal(telcOnSale({ ...env, PUBLIC_LEMONSQUEEZY_TELC_B1_VARIANT_ID: env.ID }), open, `build-llms gate with ${JSON.stringify(env)}`);
  }
  for (const render of [renderShort, renderFull]) {
    assert.ok(!render({ telcOnSale: false }).includes(TELC_PRICE), `${render.name}: off sale, the package is priced`);
    assert.match(render({ telcOnSale: false }), /Komplettvorbereitung:\*\* starts soon, not on sale yet/);
    assert.ok(render({ telcOnSale: true }).includes(TELC_PRICE), `${render.name}: on sale, the package is listed with its price`);
  }
  for (const file of ['public/llms.txt', 'public/llms-full.txt']) {
    assert.ok(!read(file).includes(TELC_PRICE), `${file} quotes the off-sale package (regenerate without the switch set)`);
  }
});

test('the built-HTML check holds /pricing/ and llms*.txt to the deploy\'s switch', () => {
  const dir = mkdtempSync(join(tmpdir(), 'telc-gate-'));
  const page = (body) => `<html lang="en"><head><title>Pricing</title></head><body>${body}</body></html>`;
  const run = (env) => {
    const r = spawnSync(process.execPath, ['scripts/check-built-html.mjs', dir, '--spa-only'], {
      cwd: ROOT, env: { PATH: process.env.PATH, ...env }, encoding: 'utf8',
    });
    return `${r.stdout}\n${r.stderr}`;
  };
  try {
    mkdirSync(join(dir, 'pricing'));
    writeFileSync(join(dir, 'app.html'), page(''));
    writeFileSync(join(dir, 'pricing', 'index.html'), page(`<p>${TELC_PRICE}</p>`));
    writeFileSync(join(dir, 'llms.txt'), `- telc B1: ${TELC_PRICE} one-time`);
    writeFileSync(join(dir, 'llms-full.txt'), '- telc B1: starts soon, not on sale yet');

    const off = run({});
    assert.match(off, /FAIL\s+pricing\/index\.html: off sale, but the telc B1 package is still priced/);
    assert.match(off, /FAIL\s+llms\.txt: off sale, but the telc B1 package is listed/);
    assert.doesNotMatch(off, /llms-full\.txt: off sale/);

    writeFileSync(join(dir, 'pricing', 'index.html'), page('<p>Starts soon</p>'));
    const on = run({ PUBLIC_TELC_B1_ON_SALE: 'true', PUBLIC_LEMONSQUEEZY_TELC_B1_VARIANT_ID: 'uuid-1' });
    assert.match(on, /FAIL\s+pricing\/index\.html: on sale, but the telc B1 card quotes no price/);
    assert.match(on, /WARN\s+llms-full\.txt: the telc B1 package is on sale/, 'an understating catalogue warns');
    assert.doesNotMatch(on, /FAIL\s+llms/, 'an understating catalogue never blocks the deploy that opens the sale');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
