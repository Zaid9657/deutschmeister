// Course v2 — clicks the compiled SCHEMA §15 fixture unit through the v2 player in headless
// Chromium at 360×640 and saves a screenshot per screen (docs/course-v2/E1-client.md §2).
// Dev-only tooling: no npm dependency — it loads a globally installed Playwright.
//
//   node scripts/course-v2/compile.mjs a2.1 --fixture --out .cache/course-v2-fixture/data \
//        --banks-out .cache/course-v2-fixture/banks
//   npx vite --port 5199                      # in another shell
//   PW=$(npm root -g)/playwright PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
//     node scripts/course-v2/walk-fixture.mjs <outDir> [de|en] [steps=1] [prefix]
//   env: RELOAD_AT_END=1 (also resume, course home, Plateau, a missing unit), FULL_CHECK=1,
//        MISS_FIRST=1 (answer the first practice item wrongly: the miss feedback and the
//        requeued alternate from the reserve index get their own screenshots),
//        TESTOUT=1 (take „Ich kann das schon" at the Start instead of „Los geht's")
//
// Every answer is the item's own `answer`, so a run that stops says where a screen and
// the driver disagree. Exit code 1 on a crash; a "stuck:" line when no action is left.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright');
const [outDir, lang = 'de', stopAfterArg = '1', prefix = ''] = process.argv.slice(2);
const STOP_AFTER = Number(stopAfterArg);
const unit = JSON.parse(fs.readFileSync(path.resolve('.cache/course-v2-fixture/data/a2.1/units/u07.json'), 'utf8'));

// every item of the unit by id, plus the generated ones the renderer materialises
const items = new Map();
const walk = (x) => { if (Array.isArray(x)) return x.forEach(walk); if (x && typeof x === 'object') { if (x.id && x.type && x.answer !== undefined && (x.promptDe !== undefined || !items.has(x.id))) items.set(x.id, x); Object.values(x).forEach(walk); } };
walk(unit);
const lines = new Map(); walk2(unit);
function walk2(x) { if (Array.isArray(x)) return x.forEach(walk2); if (x && typeof x === 'object') { if (x.id && typeof x.de === 'string' && x.speaker !== undefined) lines.set(x.id, x); Object.values(x).forEach(walk2); } }
// the reserve index (the requeue's second source) — its entries answer by `answer` too
try {
  const reserve = JSON.parse(fs.readFileSync(path.resolve('.cache/course-v2-fixture/data/a2.1/reserve.json'), 'utf8'));
  for (const it of reserve.items || []) {
    if (!it || !it.id || items.has(it.id)) continue;
    const m = it.type === 'sentence_building' ? /^([\s\S]*?) \[(.+)\]$/.exec(String(it.questionDe || '')) : null;
    items.set(it.id, { ...it, ...(m ? { tiles: m[2].split(' / ') } : {}) });
  }
} catch { /* no reserve index compiled */ }
for (const s of unit.steps) {
  for (const g of (s.pool && s.pool.generators) || []) if (g.generator === 'dictation.fromInput') g.ids.forEach((id, i) => { const l = lines.get(g.source[i]); if (l) items.set(id, { id, type: 'dictation', answer: l.de }); });
  const p = s.aussprache && s.aussprache.perception;
  if (p && p.generator === 'perception.pairs') { const pairs = p.source.map((x) => x.split('|').map((y) => y.trim())); p.ids.forEach((id, i) => { const [a, b] = pairs[i % pairs.length]; items.set(id, { id, type: 'listen_select', answer: i % 2 === 0 ? a : b }); }); }
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, permissions: [] });
  await ctx.addInitScript((l) => { try { localStorage.setItem('dm_cookie_consent', 'declined'); localStorage.setItem('dm_lesson_lang', l); } catch {} }, lang);
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push(`[error] ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.route(/supabase\.co|googletagmanager|posthog|google-analytics|fonts\.g/, (r) => r.abort());
  await page.goto('http://localhost:5199/course/a2.1/u/7?preview', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1', { timeout: 20000 });
  await page.waitForTimeout(800);
  let shot = 0;
  const snap = async (name, full = false) => {
    shot += 1;
    const f = path.join(outDir, `${prefix}${String(shot).padStart(2, '0')}-${name}.png`);
    await page.screenshot({ path: f, fullPage: full });
    console.log('  shot', path.basename(f));
  };
  const L = lang === 'de'
    ? { check: 'Prüfen', next: ['Weiter', 'Ohne Auswertung weiter', 'Ohne Mikrofon weiter', 'Jetzt beginnen', 'Ich bin bereit', 'Los geht’s', 'Zur Kursübersicht', 'Lektion abschließen'], begin: 'Los geht’s' }
    : { check: 'Check', next: ['Continue', 'Continue without an assessment', 'Continue without a microphone', 'Start now', 'I am ready', 'Start', 'Course overview', 'Finish the unit'], begin: 'Start' };
  L.testOut = lang === 'de' ? 'Ich kann das schon' : 'I can do this already';

  const state = () => page.evaluate(() => {
    const vis = (el) => !!(el.offsetParent || el.getClientRects().length) && getComputedStyle(el).visibility !== 'hidden';
    const all = [...document.querySelectorAll('[data-item-id]')].filter(vis);
    const ids = all.map((e) => e.getAttribute('data-item-id'));
    const it = all.pop();
    const btns = [...document.querySelectorAll('button')].filter(vis).filter((b) => !b.disabled).map((b) => b.innerText.trim().replace(/\s+/g, ' '));
    const eyebrow = document.querySelector('section[data-step-id] header p');
    const sec = document.querySelector('section[data-step-id]');
    const h1 = document.querySelector('h1');
    return {
      itemId: it ? it.getAttribute('data-item-id') : null, ids,
      hasText: !!(it && it.querySelector('input:not([type=radio]):not([type=checkbox]), textarea')),
      btns, eyebrow: eyebrow ? eyebrow.innerText.replace(/\s+/g, ' ') : '', stepId: sec ? sec.getAttribute('data-step-id') : null,
      h1: h1 ? h1.innerText : '', sw: document.documentElement.scrollWidth,
    };
  });
  const click = async (text) => {
    const b = page.locator('button:visible', { hasText: text }).last();
    await b.click();
    await page.waitForTimeout(250);
  };
  const clickExact = async (text) => {
    const b = page.locator('button:visible').filter({ hasText: new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) }).first();
    await b.click();
    await page.waitForTimeout(150);
  };

  // --- Start
  await snap('start', false);
  await snap('start-full', true);
  let s = await state();
  if (s.itemId) {
    await clickExact(items.get(s.itemId).answer);
    await click(L.check);
    await snap('start-gist-feedback');
  }
  if (process.env.TESTOUT) {
    await click(L.testOut);
    await page.waitForTimeout(400);
    await snap('testout-start');
  } else await click(L.begin);
  await page.waitForTimeout(600);

  let lastEyebrow = '';
  const seenTypes = new Set(); const answered = new Set();
  let stepsFinished = 0; let lastStep = null; let guard = 0; let overflow = [];
  let missed = !process.env.MISS_FIRST; let requeueShot = false; const firstIds = new Set();
  while (guard++ < 200) {
    s = await state();
    if (s.sw > 360) overflow.push(`${s.stepId} ${s.eyebrow} sw=${s.sw}`);
    if (s.stepId !== lastStep) {
      if (lastStep && !String(s.stepId).startsWith(lastStep)) stepsFinished += 1;
      lastStep = s.stepId;
      if (stepsFinished >= STOP_AFTER) { await snap('next-step-reached'); break; }
    }
    // no step section left: the recap (or an error screen — the h1 and buttons say which)
    if (!s.stepId) { await snap('recap'); console.log('no step section (recap?); h1=', s.h1, s.btns); break; }
    if (s.eyebrow !== lastEyebrow) { lastEyebrow = s.eyebrow; if (process.env.FULL_CHECK && s.btns.includes('Lektion abschließen')) await snap('check-summary-full', true); await snap(s.eyebrow.replace(/[^A-Za-zÄÖÜäöü0-9]+/g, '-').slice(0, 40)); console.log(s.stepId, '|', s.eyebrow, '|', s.btns.join(' / ')); }
    const nextBtn = L.next.find((n) => s.btns.includes(n));
    const todo = (s.ids || []).find((id) => !answered.has(id));
    if (todo && (s.btns.includes(L.check) || !nextBtn || s.ids.length > 1)) {
      answered.add(todo);
      const item = items.get(todo);
      if (!item) { console.log('unknown item', todo, s.btns); await snap('unknown-item'); break; }
      const firstOfType = !seenTypes.has(item.type); seenTypes.add(item.type);
      const scope = page.locator(`[data-item-id="${todo}"]`).last();
      await scope.scrollIntoViewIfNeeded();
      const practice = /ÜBEN|PRACTICE/i.test(s.eyebrow);
      if (practice && !missed && ['fill_blank', 'sentence_building', 'error_correction'].includes(item.type)) {
        // MISS_FIRST: a wrong answer on the first typed/tiled practice item → miss + requeue
        missed = true; firstIds.add(todo);
        if (item.type === 'sentence_building' && item.tiles) {
          const ans = String(item.answer).toLowerCase();
          const order = [...item.tiles].sort((a, b) => ans.indexOf(b.toLowerCase()) - ans.indexOf(a.toLowerCase()));
          for (const tok of order) await scope.locator('button:visible').filter({ hasText: new RegExp(`^\\s*${tok}\\s*$`, 'i') }).first().click();
        } else {
          await scope.locator('input:visible, textarea:visible').first().fill('xyz');
        }
        await page.locator('button:visible', { hasText: L.check }).last().click();
        await page.waitForTimeout(300);
        await snap('miss-feedback');
        continue;
      }
      if (practice && process.env.MISS_FIRST && !requeueShot && /-r\d{2}$/.test(todo)) { requeueShot = true; await snap('requeue-reserve-item'); }
      else if (practice && process.env.MISS_FIRST && !requeueShot && firstIds.has(todo)) { requeueShot = true; await snap('requeue-same-item'); }
      if (item.type === 'sentence_building' && item.tiles) {
        const ans = String(item.answer).toLowerCase();
        const order = [...item.tiles].sort((a, b) => ans.indexOf(a.toLowerCase()) - ans.indexOf(b.toLowerCase()));
        for (const tok of order) await scope.locator('button:visible').filter({ hasText: new RegExp(`^\\s*${tok}\\s*$`, 'i') }).first().click();
      } else if (await scope.locator('input:visible, textarea:visible').count()) {
        await scope.locator('input:visible, textarea:visible').first().fill(String(item.answer));
      } else {
        const opt = Array.isArray(item.options) && item.options.length && typeof item.options[0] === 'object'
          ? (item.options.find((o) => o.key === item.answer) || {}).text || item.answer : item.answer;
        const b = scope.locator('button:visible').filter({ hasText: String(opt) }).first();
        if (!(await b.count())) { console.log('no option button for', todo, item.type, JSON.stringify(item.options), item.answer); await snap('no-option'); break; }
        await b.click();
      }
      if (firstOfType) await snap(`item-${item.type}`);
      const chk = scope.locator('button:visible', { hasText: L.check });
      if (await chk.count()) await chk.last().click(); else { const g = page.locator('button:visible', { hasText: L.check }); if (s.ids.length === 1 && await g.count()) await g.last().click(); }
      await page.waitForTimeout(300);
      if (firstOfType) await snap(`item-${item.type}-feedback`);
      continue;
    }
    if (process.env.FULL_CHECK && ['Lektion abschließen','Finish the unit'].includes(nextBtn)) await snap('check-summary-full', true);
    if (nextBtn) { answered.clear(); await click(nextBtn); continue; }
    console.log('stuck:', JSON.stringify(s)); await snap('stuck'); break;
  }
  if (process.env.RELOAD_AT_END) {
    await page.goto('http://localhost:5199/course/a2.1/u/7?preview', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 20000 }); await page.waitForTimeout(800);
    await snap('resume');
    await page.goto('http://localhost:5199/course/a2.1/v2?preview', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 20000 }); await page.waitForTimeout(1200);
    await snap('course-home'); await snap('course-home-full', true);
    await page.goto('http://localhost:5199/course/a2.1/p/1?preview', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 20000 }); await page.waitForTimeout(800);
    await snap('plateau');
    await page.goto('http://localhost:5199/course/b1.1/u/1?preview', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 20000 }); await page.waitForTimeout(800);
    await snap('unit-missing');
  }
  console.log('overflow:', overflow.length ? overflow : 'none');
  console.log('---LOGS---\n' + [...new Set(logs)].join('\n'));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
