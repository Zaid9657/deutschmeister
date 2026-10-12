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
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const spaConfig = read('src/config/lemonsqueezy.js');
const variants = read('astro-site/src/lib/courseVariants.js');
const page = read('astro-site/src/pages/telc-b1-komplettvorbereitung.astro');
const viteConfig = read('vite.config.js');

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
