#!/usr/bin/env node
// Browser walkthrough of the Arabic edition (docs/arabic/README.md §10).
//
// Serves the merged dist/ Netlify-style (real files win, the netlify.toml 301s
// are honoured, SPA routes rewrite to app.html, the rest 404s), blocks every
// third-party origin (Supabase, analytics, checkout — unreachable from here and
// never contacted by this script), and drives headless Chromium through the
// journeys the pilot has to survive. Writes:
//   docs/arabic/walkthrough.json         — every check, pass/fail, with detail
//   docs/arabic/screenshots/after/*.jpg  — the screens named in the report
//
// Usage (after a full build: see CLAUDE.md "Commands"):
//   node scripts/evaluate-arabic.mjs [dist]
// Playwright: the repo does not depend on it; the cloud image ships it globally
// (PLAYWRIGHT_BROWSERS_PATH). Locally: npm i --no-save playwright.
//
// What this CANNOT verify, and says so in the report: anything that needs the
// live Supabase project (sign-in, account save, guest→account merge, emails),
// the AI graders, real device screen readers and real audio output.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, process.argv[2] || 'dist');
const OUT = join(ROOT, 'docs', 'arabic');
const SHOTS = join(OUT, 'screenshots', 'after');
mkdirSync(SHOTS, { recursive: true });

const requireGlobal = createRequire(process.env.PLAYWRIGHT_REQUIRE_FROM || '/opt/node22/lib/node_modules/');
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = requireGlobal('playwright')); }
const AXE = readFileSync(join(ROOT, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');

// ── Netlify-style server ─────────────────────────────────────────────────────
const toml = readFileSync(join(ROOT, 'netlify.toml'), 'utf8');
const REDIRECTS_301 = [...toml.matchAll(/\[\[redirects\]\]\s*\n\s*from = "([^"]+)"\s*\n\s*to = "([^"]+)"\s*\n\s*status = 301/g)]
  .map((m) => ({ from: m[1], to: m[2] }))
  .filter((r) => r.from.startsWith('/'));
const SPA_ROUTES = [...toml.matchAll(/from = "([^"]+)"\s*\n\s*to = "\/app\.html"\s*\n\s*status = 200/g)].map((m) => m[1]);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json',
};
const spaMatch = (path) => SPA_ROUTES.some((r) => (r.endsWith('/*') ? path.startsWith(r.slice(0, -1)) : path === r || path === `${r}/`));
function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  for (const c of [clean, `${clean}/index.html`, `${clean}index.html`]) {
    const p = join(DIST, c);
    if (p.startsWith(DIST) && existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}
const server = createServer((req, res) => {
  const path = req.url.split('?')[0];
  const redirect = REDIRECTS_301.find((r) => r.from === path || `${r.from}/` === path);
  if (redirect) { res.writeHead(301, { Location: redirect.to }); res.end(); return; }
  const file = resolveFile(req.url);
  if (file) { res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' }); res.end(readFileSync(file)); return; }
  if (spaMatch(path)) { res.writeHead(200, { 'Content-Type': MIME['.html'] }); res.end(readFileSync(join(DIST, 'app.html'))); return; }
  res.writeHead(404, { 'Content-Type': MIME['.html'] });
  res.end(existsSync(join(DIST, '404.html')) ? readFileSync(join(DIST, '404.html')) : 'not found');
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;

// ── Report helpers ───────────────────────────────────────────────────────────
const report = { generatedOn: new Date().toISOString(), dist: DIST, checks: [], journeys: {}, axe: {}, notVerifiable: [] };
const check = (id, ok, detail = '') => {
  report.checks.push({ id, status: ok ? 'passed' : 'failed', detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}${detail ? ` — ${String(detail).slice(0, 220)}` : ''}`);
};
const shot = async (page, name, opts = {}) => {
  await page.screenshot({ path: join(SHOTS, `${name}.jpg`), type: 'jpeg', quality: 62, ...opts });
  return `docs/arabic/screenshots/after/${name}.jpg`;
};

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const THIRD_PARTY = /supabase\.co|googletagmanager|google-analytics|posthog|lemonsqueezy|deutsch-meister\.de|fonts\.g/;
async function newContext(options = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...options });
  await ctx.route((url) => THIRD_PARTY.test(url.href), (route) => route.abort());
  // Netlify functions do not run here: answer like a function that is down.
  await ctx.route((url) => url.pathname.startsWith('/.netlify/functions/'), (route) => route.fulfill({ status: 503, body: '{"error":"unavailable in evaluation"}', contentType: 'application/json' }));
  return ctx;
}
const consoleErrors = [];
const watch = (page, tag) => {
  page.on('pageerror', (e) => consoleErrors.push(`${tag}: pageerror ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_FAILED|ERR_BLOCKED|supabase|503/i.test(m.text())) consoleErrors.push(`${tag}: ${m.text().slice(0, 200)}`); });
};

const overflow = (page) => page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
const docLang = (page) => page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir || 'ltr' }));
/** Scroll through once so every reveal-on-scroll element has finished fading in. */
async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.max(200, window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
}
async function axe(page, name) {
  await settle(page);
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target?.join(' ') }));
  });
  report.axe[name] = r;
  const serious = r.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  check(`axe ${name}: no serious/critical WCAG A/AA violations`, serious.length === 0, serious.map((v) => `${v.id}×${v.nodes} (${v.sample})`).join('; '));
  return r;
}

// Visible text inside an Arabic context that is a run of 3+ English words: an
// untranslated English sentence mixed into Arabic. German and English marked
// with their own lang (labelled fallbacks, German content) are excluded.
const ENGLISH_LEAK = () => {
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const ALLOW = /^(DeutschMeister|A1\.1|Pro|Lemon Squeezy|Google Analytics|PostHog|Sentence X-Ray|YouTube|telc|Goethe|DTZ|Start Deutsch 1)$/;
  while (walker.nextNode()) {
    const n = walker.currentNode;
    const el = n.parentElement;
    if (!el || !el.offsetParent) continue;
    const langEl = el.closest('[lang]');
    if (!langEl || langEl.getAttribute('lang') !== 'ar') continue;
    const t = n.textContent.trim();
    const m = t.match(/[A-Za-z][A-Za-z'’]+(?:[\s,]+[A-Za-z][A-Za-z'’]+){2,}/g);
    if (m) for (const run of m) if (!ALLOW.test(run)) out.push(run);
  }
  return [...new Set(out)];
};
const DEV_KEY = /\b(?:action|stage|practice|feedback|course|intro|recap|support|audio|match|wordOrder|speaking|writing|lang|shell|player|review|checkpoint|tour|welcome|outcomes|keys|account|nav|auth|a11y)\.[a-zA-Z]+(?:\.[a-zA-Z]+)*\b/;
const devKeys = (page) => page.evaluate((src) => {
  const re = new RegExp(src);
  return [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && e.offsetParent && re.test(e.textContent)).map((e) => e.textContent.trim()).slice(0, 5);
}, DEV_KEY.source);

// ── 1. Public Arabic pages ───────────────────────────────────────────────────
const AR_PAGES = [
  ['/ar/', 'ar-home'], ['/ar/courses/', 'ar-courses'], ['/ar/courses/a1-1/', 'ar-a1-1'], ['/ar/pricing/', 'ar-pricing'], ['/ar/help/', 'ar-help'],
];
for (const width of [360, 390, 768, 1440]) {
  const ctx = await newContext({ viewport: { width, height: width >= 1024 ? 900 : 844 } });
  const page = await ctx.newPage();
  watch(page, `public@${width}`);
  for (const [path, name] of AR_PAGES) {
    const res = await page.goto(BASE + path, { waitUntil: 'load' });
    const { lang, dir } = await docLang(page);
    const h1 = await page.locator('h1').count();
    const over = await overflow(page);
    check(`${path} @${width}: 200, lang=ar dir=rtl, one h1, no horizontal scroll`, res.status() === 200 && lang === 'ar' && dir === 'rtl' && h1 === 1 && over <= 1, `status ${res.status()} lang ${lang} dir ${dir} h1 ${h1} overflow ${over}px`);
    if (width === 390 || width === 1440) {
      await shot(page, `${name}-${width === 390 ? 'mobile' : 'desktop'}`, { fullPage: width === 390 && name === 'ar-home' });
      const leaks = await page.evaluate(ENGLISH_LEAK);
      check(`${path} @${width}: no unlabelled English sentence inside Arabic text`, leaks.length === 0, leaks.join(' | '));
    }
    if (width === 390) await axe(page, `${path} @390`);
    if (width === 360) await shot(page, `${name}-360`);
  }
  await ctx.close();
}

// hreflang/language switch on the English twins; Deutsch notice; Arabic suggestion.
{
  const ctx = await newContext({ locale: 'ar-EG' });
  const page = await ctx.newPage();
  watch(page, 'twins');
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  const sw = await page.locator('nav.dm-lang-switch a').allTextContents();
  check('English home carries the switch „العربية · English · Deutsch“', sw.map((s) => s.trim()).join(' · ') === 'العربية · English · Deutsch', sw.join(' · '));
  const suggest = await page.locator('[data-ar-suggest]').isVisible();
  check('an Arabic browser on the English home is OFFERED the Arabic twin (not switched)', suggest && (await docLang(page)).lang === 'en');
  await shot(page, 'en-home-with-arabic-offer');
  await page.locator('[data-ar-suggest] a').click();
  await page.waitForURL(/\/ar\/$/);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('dm_locale') || 'null'));
  check('following the offer stores an explicit Arabic choice', stored?.lang === 'ar' && stored?.source === 'explicit', JSON.stringify(stored));
  await page.goto(`${BASE}/pricing/?lang=de`, { waitUntil: 'load' });
  check('"Deutsch" lands on the English page with a German one-line notice', await page.locator('[data-de-notice]').isVisible());
  const de = await page.evaluate(() => JSON.parse(localStorage.getItem('dm_locale') || 'null'));
  check('…and stores German as the app choice', de?.lang === 'de', JSON.stringify(de));
  await shot(page, 'en-pricing-deutsch-notice');
  const red = await fetch(`${BASE}/ar/courses/a1.1`, { redirect: 'manual' });
  check('/ar/courses/a1.1 → 301 /ar/courses/a1-1/ (netlify.toml rule, emulated)', red.status === 301 && red.headers.get('location') === '/ar/courses/a1-1/', `${red.status} ${red.headers.get('location')}`);
  await ctx.close();
}

// ── 2. /ar/ → CTA → Arabic course with no English flash ──────────────────────
const FIRST_PAINT = () => {
  window.__firstPaint = null;
  const record = () => {
    const root = document.getElementById('root');
    const text = root ? root.innerText.trim() : '';
    if (!window.__firstPaint && text.length > 20 && location.pathname.startsWith('/course')) {
      window.__firstPaint = { lang: document.documentElement.lang, dir: document.documentElement.dir, text: text.slice(0, 160) };
    }
  };
  new MutationObserver(record).observe(document, { childList: true, subtree: true, characterData: true });
};
{
  const ctx = await newContext();
  await ctx.addInitScript(FIRST_PAINT);
  const page = await ctx.newPage();
  watch(page, 'cta');
  await page.goto(`${BASE}/ar/`, { waitUntil: 'load' });
  await page.locator('main a[href="/course/a1.1?lang=ar"]').first().click();
  await page.waitForURL(/\/course\/a1\.1/);
  await page.waitForFunction(() => window.__firstPaint, null, { timeout: 15000 }).catch(() => {});
  const fp = await page.evaluate(() => window.__firstPaint);
  check('first rendered course screen is already Arabic and right-to-left (no English flash)', fp && fp.lang === 'ar' && fp.dir === 'rtl' && /[؀-ۿ]/.test(fp.text), JSON.stringify(fp));
  await page.waitForTimeout(600);
  check('course home: no developer key on screen', (await devKeys(page)).length === 0, (await devKeys(page)).join(' | '));
  const leaks = await page.evaluate(ENGLISH_LEAK);
  check('course home: no unlabelled English sentence inside Arabic', leaks.length === 0, leaks.join(' | '));
  await shot(page, 'course-home-ar-mobile', { fullPage: true });
  await axe(page, '/course/a1.1 (ar) @390');
  await ctx.close();
}

// ── 3. Lesson driver ─────────────────────────────────────────────────────────
const AR = Object.fromEntries(Object.entries({ check: 'تحقّق من الإجابة', next: 'متابعة', skip: 'تخطَّ الآن', cantHear: 'لا تسمع شيئًا؟', transcript: 'اعرض النص', submit: 'إرسال' }).map(([k, v]) => [k, v.normalize('NFC')]));
// Arabic marks (shadda + fatha) may be stored in either order: compare in NFC.
const nfc = (s) => String(s || '').normalize('NFC');
async function visibleButtons(page) {
  const list = await page.evaluate(() => [...document.querySelectorAll('main button, main a[role="button"], [role="dialog"] button, main a')].filter((b) => b.offsetParent && !b.disabled).map((b) => (b.innerText || b.getAttribute('aria-label') || '').trim()).filter(Boolean));
  return list.map(nfc);
}
const clickText = async (page, text, { exact = false } = {}) => {
  // Match on NFC-normalised text, whatever order the page stores the marks in.
  const want = nfc(text);
  const esc = (c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Letters in order, each followed by any marks: tolerant of mark order and of marks missing on either side.
  const pattern = [...want].filter((c) => !/\p{M}/u.test(c)).map((c) => `${esc(c)}\\p{M}*`).join('');
  const loc = page.locator('main button:not([disabled]), main a, [role="dialog"] button:not([disabled])').filter({ hasText: new RegExp(exact ? `^\\s*${pattern}\\s*$` : pattern, 'u') });
  const n = await loc.count();
  for (let i = n - 1; i >= 0; i--) { if (await loc.nth(i).isVisible()) { await loc.nth(i).click(); return true; } }
  return false;
};
/**
 * Marks the answer controls of the current item with data-eval="…", so the
 * driver never mistakes the header's language pills (also lang="de",
 * aria-pressed) for an answer. Returns the counts.
 */
async function markControls(page) {
  return page.evaluate(() => {
    document.querySelectorAll('[data-eval]').forEach((e) => e.removeAttribute('data-eval'));
    const usable = (b) => b.offsetParent && !b.disabled && !b.closest('[role="group"]');
    const count = { match: 0, meaning: 0, chip: 0, bank: 0 };
    for (const grid of document.querySelectorAll('main .grid-cols-2')) {
      const cols = grid.children;
      if (cols.length !== 2) continue;
      for (const b of cols[0].querySelectorAll('button[lang="de"]')) if (usable(b)) { b.dataset.eval = 'match'; count.match += 1; }
      for (const b of cols[1].querySelectorAll('button')) if (usable(b)) { b.dataset.eval = 'meaning'; count.meaning += 1; }
    }
    for (const b of document.querySelectorAll('main button[lang="de"]')) {
      if (!usable(b) || b.dataset.eval) continue;
      if (b.getAttribute('aria-pressed') === 'false') { b.dataset.eval = 'chip'; count.chip += 1; } else if (!b.hasAttribute('aria-pressed') && !b.hasAttribute('aria-label')) { b.dataset.eval = 'bank'; count.bank += 1; }
    }
    return count;
  });
}

async function eyebrow(page) {
  return page.evaluate(() => {
    const p = [...document.querySelectorAll('main p.font-data')].find((e) => e.offsetParent);
    return p ? p.innerText.trim() : '';
  });
}

/** Plays one Lektion as a guest. `policy` decides how practice is answered. */
async function playLesson(page, nr, { policy = 'mixed', shots: shotPrefix = null, hooks = {} } = {}) {
  const trace = [];
  const seen = new Set();
  const leaks = new Set();
  const keys = new Set();
  const matchNames = [];
  let practiceCount = 0;
  for (let step = 0; step < 260; step++) {
    await page.waitForTimeout(220);
    const url = page.url();
    if (!/\/course\/a1\.1\/l\//.test(url)) { trace.push({ step, left: url }); break; }
    const eb = await eyebrow(page);
    const btns = await visibleButtons(page);
    trace.push({ step, eyebrow: eb, buttons: btns.slice(0, 8) });
    for (const l of await page.evaluate(ENGLISH_LEAK)) leaks.add(l);
    for (const k of await devKeys(page)) keys.add(k);
    const kind = eb.split('·').pop()?.trim() || eb;
    if (shotPrefix && eb && !seen.has(kind)) { seen.add(kind); await shot(page, `${shotPrefix}-${String(seen.size).padStart(2, '0')}`); }
    if (hooks.onStep && (await hooks.onStep(page, { step, eyebrow: eb, practiceCount }))) continue;

    // Recap reached (stage.recap.eyebrow „الخطوة 8 · الخلاصة"): done.
    if (/الخطوة 8|Step 8|Schritt 8/.test(eb)) {
      trace.push({ step, recap: true });
      return { reachedRecap: true, trace, leaks: [...leaks], keys: [...keys], matchNames };
    }
    // Feedback sheet open → continue.
    const sheet = page.locator('[aria-live="polite"]').filter({ has: page.locator('button') });
    if (await sheet.count() && await sheet.first().isVisible().catch(() => false) && (await clickText(page, AR.next))) continue;
    // Speaking → skip.
    if (btns.includes(AR.skip) && (await clickText(page, AR.skip))) continue;
    // Writing: fill every field, submit (a guest gets the checklist result), then go on.
    if (/الكتابة/.test(eb) && !btns.includes(AR.next)) {
      const fields = page.locator('main input[lang="de"]:visible, main textarea[lang="de"]:visible');
      const n = await fields.count();
      for (let i = 0; i < n; i++) {
        const f = fields.nth(i);
        if (await f.inputValue()) continue;
        const isArea = (await f.evaluate((e) => e.tagName)) === 'TEXTAREA';
        await f.fill(isArea ? 'Hallo Lena, ich heiße Ana und ich komme aus Marokko. Ich wohne jetzt in Bremen. Ich bin Studentin und ich lerne Deutsch. Meine Familie wohnt in Rabat. Wie geht es dir? Viele Grüße, Ana' : 'Ana');
      }
      if (await clickText(page, AR.submit)) { await page.waitForTimeout(500); if (shotPrefix) await shot(page, `${shotPrefix}-writing-checked`); continue; }
    }
    // Audio trouble → show the transcript (reading support).
    if (btns.some((b) => b.startsWith(AR.cantHear))) {
      await clickText(page, AR.cantHear);
      await page.waitForTimeout(150);
      if (await clickText(page, AR.transcript)) { if (shotPrefix) await shot(page, `${shotPrefix}-audio-transcript`); if (hooks.onTranscript) await hooks.onTranscript(page); }
    }
    // Match tiles.
    let controls = await markControls(page);
    const deTiles = page.locator('[data-eval="match"]');
    if (controls.match) {
      const names = await page.evaluate(() => [...document.querySelectorAll('main .grid-cols-2 button')].map((b) => ({ lang: b.getAttribute('lang'), name: (b.getAttribute('aria-label') || b.innerText).trim() })));
      matchNames.push(names);
      for (let guard = 0; guard < 40 && (await deTiles.count()); guard++) {
        const before = await deTiles.count();
        const meaningsAll = await page.locator('[data-eval="meaning"]').count();
        for (let j = 0; j < meaningsAll; j++) {
          await markControls(page);
          const de = page.locator('[data-eval="match"]').first();
          if ((await de.getAttribute('aria-pressed')) !== 'true') await de.click().catch(() => {});
          const meaning = page.locator('[data-eval="meaning"]').nth(j);
          if (!(await meaning.count())) break;
          await meaning.click().catch(() => {});
          await page.waitForTimeout(140);
          await markControls(page);
          if ((await deTiles.count()) < before) break;
        }
        await markControls(page);
        if ((await deTiles.count()) >= before) break;
      }
      practiceCount += 1;
      if (await clickText(page, AR.check)) continue;
    }
    // Word order bank.
    controls = await markControls(page);
    const bank = page.locator('[data-eval="bank"]');
    const textInputs = page.locator('main input[lang="de"]:visible, main textarea[lang="de"]:visible');
    if (!(await textInputs.count()) && (await bank.count())) {
      for (let i = 0; i < 30 && (await markControls(page)).bank; i++) await page.locator('[data-eval="bank"]').first().click().catch(() => {});
      practiceCount += 1;
      if (await clickText(page, AR.check)) continue;
    }
    // Typed answer.
    if (!/الكتابة/.test(eb) && (await textInputs.count())) {
      const input = textInputs.first();
      const tag = await input.evaluate((e) => e.tagName);
      if (!(await input.inputValue())) {
        const wrong = policy === 'wrong' || (policy === 'mixed' && practiceCount % 2 === 0);
        await input.fill(tag === 'TEXTAREA' ? 'Hallo Lena, ich heiße Ana. Ich komme aus Marokko. Viele Grüße, Ana' : wrong ? 'xyz' : 'Hallo');
      }
      practiceCount += 1;
      if (await clickText(page, AR.check)) continue;
      if (await clickText(page, 'إرسال')) { await page.waitForTimeout(600); if (shotPrefix) await shot(page, `${shotPrefix}-writing-submitted`); continue; }
    }
    // Choice chips.
    await markControls(page);
    const chips = page.locator('[data-eval="chip"]');
    if (await chips.count()) {
      await chips.nth(policy === 'wrong' ? 1 : 0).click().catch(() => chips.first().click());
      practiceCount += 1;
      if (await clickText(page, AR.check)) continue;
    }
    // Otherwise the primary button of the stage.
    const primary = ['ابدأ', 'متابعة', 'فهمت', 'التالي', 'تخطَّ', 'أكمل', 'إلى الخلاصة', 'تابع'];
    let moved = false;
    for (const p of primary) { if (btns.some((b) => b.startsWith(p)) && (await clickText(page, p))) { moved = true; break; } }
    if (moved) continue;
    // Last resort: any enabled footer button.
    const footer = page.locator('main footer button:not([disabled])');
    if (await footer.count()) { await footer.last().click(); continue; }
    trace.push({ step, stuck: true });
    break;
  }
  return { reachedRecap: false, trace, leaks: [...leaks], keys: [...keys], matchNames };
}

// ── 4. Lessons 1–3 as a guest, Arabic ────────────────────────────────────────
{
  const ctx = await newContext();
  await ctx.addInitScript(() => { try { localStorage.setItem('dm_cookie_consent', 'declined'); } catch { /* */ } });
  const page = await ctx.newPage();
  watch(page, 'lessons');
  await page.goto(`${BASE}/course/a1.1/l/1?lang=ar`, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await shot(page, 'lesson1-intro-ar');
  check('Lesson 1 intro renders Arabic, rtl', (await docLang(page)).dir === 'rtl' && /[؀-ۿ]/.test(await page.locator('main').innerText()));
  await axe(page, 'lesson 1 intro (ar) @390');

  // Lesson 1, with a mid-run reload and a language switch on the third practice item.
  let reloadDone = false;
  let switchDone = false;
  const l1 = await playLesson(page, 1, {
    shots: 'lesson1',
    hooks: {
      onStep: async (pg, { practiceCount }) => {
        if (!switchDone && practiceCount >= 2) {
          const input = pg.locator('main input[lang="de"]:visible').first();
          if (await input.count()) {
            switchDone = true;
            await input.fill('Guten');
            const before = await eyebrow(pg);
            await pg.locator('main [role="group"] button[lang="en"]').first().click();
            await pg.waitForTimeout(400);
            const valueEn = await input.inputValue();
            const ebEn = await eyebrow(pg);
            await shot(pg, 'lesson1-switched-to-english');
            await pg.locator('main [role="group"] button[lang="ar"]').first().click();
            await pg.waitForTimeout(400);
            const ebAr = await eyebrow(pg);
            check('language switch mid-item keeps the typed answer and the item, and switches the chrome', valueEn === 'Guten' && (await input.inputValue()) === 'Guten' && ebEn !== before && ebAr === before, `ar "${before}" → en "${ebEn}" → ar "${ebAr}", value "${valueEn}"`);
            await input.fill('');
            return false;
          }
        }
        if (!reloadDone && practiceCount >= 4) {
          reloadDone = true;
          const before = await eyebrow(pg);
          const attemptsBefore = await pg.evaluate(() => { try { return JSON.parse(sessionStorage.getItem(Object.keys(sessionStorage).find((k) => k.startsWith('dm_lesson_run:')) || 'null'))?.attempts?.length ?? null; } catch { return null; } });
          await pg.reload({ waitUntil: 'load' });
          await pg.waitForTimeout(900);
          const after = await eyebrow(pg);
          const attemptsAfter = await pg.evaluate(() => { try { return JSON.parse(sessionStorage.getItem(Object.keys(sessionStorage).find((k) => k.startsWith('dm_lesson_run:')) || 'null'))?.attempts?.length ?? null; } catch { return null; } });
          check('a reload mid-practice resumes the same step without re-logging answers', before === after && attemptsBefore === attemptsAfter, `before "${before}" (${attemptsBefore}) after "${after}" (${attemptsAfter})`);
          return true;
        }
        return false;
      },
    },
  });
  report.journeys.lesson1 = l1;
  check('Lesson 1 (guest, Arabic) reaches the recap', l1.reachedRecap, `${l1.trace.length} steps`);
  check('Lesson 1: no developer key on any screen', l1.keys.length === 0, l1.keys.join(' | '));
  check('Lesson 1: no unlabelled English sentence inside Arabic', l1.leaks.length === 0, l1.leaks.join(' | '));
  if (l1.matchNames.length) {
    const names = l1.matchNames[0];
    check('match tiles are named by their visible words (no numbers, Arabic meanings in Arabic)', names.every((n) => n.name && !/\b\d+\b/.test(n.name)) && names.some((n) => n.lang === 'ar'), JSON.stringify(names).slice(0, 220));
  }
  await shot(page, 'lesson1-recap-ar', { fullPage: true });
  const recapText = await page.locator('main').innerText();
  check('recap says when review starts truthfully for a guest (after saving to an account)', /بعد حفظ تقدّمك في حساب/.test(recapText));

  for (const nr of [2, 3]) {
    await page.goto(`${BASE}/course/a1.1/l/${nr}`, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    const r = await playLesson(page, nr, { policy: nr === 2 ? 'wrong' : 'mixed', shots: nr === 2 ? 'lesson2' : null });
    report.journeys[`lesson${nr}`] = r;
    check(`Lesson ${nr} (guest, Arabic) reaches the recap`, r.reachedRecap, `${r.trace.length} steps`);
    check(`Lesson ${nr}: no developer key, no unlabelled English inside Arabic`, r.keys.length === 0 && r.leaks.length === 0, [...r.keys, ...r.leaks].join(' | '));
  }

  // Lesson 4: outside the translated scope — said in Arabic, English labelled.
  await page.goto(`${BASE}/course/a1.1/l/4`, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const l4 = await page.locator('main').innerText();
  await shot(page, 'lesson4-intro-scope-note');
  check('Lesson 4 intro says Arabic support covers lessons 1–3 only and offers English', /للدروس 1–3 فقط/.test(l4), l4.slice(0, 200));
  await page.goto(`${BASE}/course/a1.1`, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await shot(page, 'course-home-ar-after-3-lessons', { fullPage: true });
  await ctx.close();
}

// ── 5. Cookie banner + feedback sheet together at 360 px ─────────────────────
{
  const ctx = await newContext({ viewport: { width: 360, height: 740 } });
  const page = await ctx.newPage();
  watch(page, '360');
  await page.goto(`${BASE}/course/a1.1/l/1?lang=ar`, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  const banner = page.locator('#dm-cookie-banner');
  check('cookie banner speaks Arabic and is rtl on an Arabic screen', (await banner.getAttribute('dir')) === 'rtl' && /موافقة/.test(await banner.innerText()));
  await shot(page, 'lesson-360-cookie-banner');
  check('lesson @360: no horizontal scroll', (await overflow(page)) <= 1, `${await overflow(page)}px`);
  await ctx.close();
}

// ── 6. Keyboard, zoom, reduced motion ─────────────────────────────────────────
{
  const ctx = await newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  watch(page, 'keyboard');
  await page.goto(`${BASE}/ar/`, { waitUntil: 'load' });
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => ({ text: document.activeElement?.innerText?.trim(), href: document.activeElement?.getAttribute('href') }));
  check('keyboard: the first Tab reaches the Arabic skip link', first.href === '#main' && /تخطَّ/.test(first.text || ''), JSON.stringify(first));
  const focusRing = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    focusRing.push(await page.evaluate(() => {
      const e = document.activeElement; const s = getComputedStyle(e);
      return { name: (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30), visible: s.outlineStyle !== 'none' || s.boxShadow !== 'none' };
    }));
  }
  check('keyboard: every focus stop on /ar/ shows a focus indicator', focusRing.every((f) => f.visible), JSON.stringify(focusRing.filter((f) => !f.visible)));
  await ctx.close();
  // 200 % zoom ≈ a 720 px CSS viewport at 1440 device px.
  const zoom = await newContext({ viewport: { width: 720, height: 450 }, deviceScaleFactor: 2 });
  const zp = await zoom.newPage();
  for (const path of ['/ar/', '/ar/pricing/', '/course/a1.1?lang=ar', '/course/a1.1/l/1?lang=ar']) {
    await zp.goto(BASE + path, { waitUntil: 'load' });
    await zp.waitForTimeout(500);
    check(`200% zoom ${path}: no horizontal scroll`, (await overflow(zp)) <= 1, `${await overflow(zp)}px`);
  }
  await shot(zp, 'lesson1-zoom-200');
  await zoom.close();
}

// ── 7. English and German stay as they were ───────────────────────────────────
{
  const ctx = await newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  watch(page, 'regress');
  await page.goto(`${BASE}/course/a1.1`, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  const en = await docLang(page);
  check('no choice → English, ltr', en.lang === 'en' && en.dir === 'ltr', JSON.stringify(en));
  await shot(page, 'course-home-en-desktop');
  await page.goto(`${BASE}/course/a1.1/l/1?lang=de`, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  const de = await docLang(page);
  check('?lang=de → German chrome, ltr', de.lang === 'de' && de.dir === 'ltr' && /Lektion|Starten|Beginnen/i.test(await page.locator('main').innerText()), JSON.stringify(de));
  await shot(page, 'lesson1-intro-de-desktop');
  await page.goto(`${BASE}/vocabulary?lang=ar`, { waitUntil: 'load' });
  await page.waitForTimeout(700);
  const dash = await docLang(page);
  check('Arabic on an untranslated route: English document under an Arabic notice', dash.lang === 'en' && /غير متوفرة بالعربية|بالإنجليزية/.test(await page.locator('body').innerText()), JSON.stringify(dash));
  await shot(page, 'dashboard-ar-fallback-notice');
  await page.goto(`${BASE}/login?lang=ar`, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  check('sign-in renders in Arabic, rtl', (await docLang(page)).dir === 'rtl' && /تسجيل الدخول/.test(await page.locator('main').innerText()));
  await shot(page, 'login-ar-desktop');
  await axe(page, '/login (ar) @1440');
  await ctx.close();
}

report.consoleErrors = consoleErrors;
check('no uncaught page errors in any journey', !consoleErrors.some((e) => /pageerror/.test(e)), consoleErrors.filter((e) => /pageerror/.test(e)).slice(0, 5).join(' | '));
report.notVerifiable = [
  'Sign-in, sign-up, password reset and email confirmation against the live Supabase project (egress-blocked here; the Arabic screens and error mapping are checked, the round trip is not).',
  'Saving a lesson to an account and the guest→account merge (mocked in unit tests only).',
  'The ui_lang account preference round trip (supabase.auth.updateUser) on a real account.',
  'AI writing/speaking grading and the Arabic explain-answer prompt (Netlify functions are answered 503 here).',
  'Real audio output and real-device screen readers (VoiceOver, TalkBack, NVDA).',
  'Lemon Squeezy checkout language and receipts.',
];
const failed = report.checks.filter((c) => c.status === 'failed');
report.summary = { total: report.checks.length, passed: report.checks.length - failed.length, failed: failed.length };
writeFileSync(join(OUT, 'walkthrough.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`\n${report.summary.passed}/${report.summary.total} checks passed → docs/arabic/walkthrough.json`);
await browser.close();
server.close();
process.exitCode = failed.length ? 1 : 0;
