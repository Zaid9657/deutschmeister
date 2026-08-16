// Route-by-route site walkthrough: serves the merged dist/ (Netlify-style
// routing), drives every public route with headless Chromium, and captures
// screenshots + console errors + failed requests + meta into a JSON report.
//
// Usage:
//   npm i --no-save playwright        # browsers come from PLAYWRIGHT_BROWSERS_PATH
//   node scripts/evaluate-site.mjs
//
// Outputs:
//   docs/evaluation/screenshots/<slug>-{desktop,mobile}.jpg
//   docs/evaluation/walkthrough.json
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const DIST = join(process.cwd(), 'dist');
const OUT = join(process.cwd(), 'docs', 'evaluation');
const SHOTS = join(OUT, 'screenshots');
mkdirSync(SHOTS, { recursive: true });

// --- Minimal Netlify-style static server -----------------------------------
// Real files win; known SPA routes rewrite to app.html; everything else 404s.
const SPA_PREFIXES = [
  '/intro', '/login', '/signup', '/reset-password', '/update-password',
  '/verify-email', '/onboarding', '/faq', '/ueber-uns', '/podcasts',
  '/level-test', '/dashboard', '/profile', '/vocabulary', '/speaking',
  '/analyze', '/subscription', '/vergleich/', '/leitfaden/', '/video-library',
  '/level/', '/reading', '/listening', '/admin/', '/grammar/',
];
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml',
};
function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const candidates = [clean, `${clean}/index.html`, `${clean}index.html`, `${clean}.html`];
  for (const c of candidates) {
    const p = join(DIST, c);
    if (p.startsWith(DIST) && existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}
const server = createServer((req, res) => {
  const file = resolveFile(req.url);
  if (file) {
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
    return;
  }
  const isSpa = SPA_PREFIXES.some((p) =>
    p.endsWith('/') ? req.url.startsWith(p) : (req.url === p || req.url.startsWith(`${p}/`) || req.url.startsWith(`${p}?`)));
  if (isSpa) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(readFileSync(join(DIST, 'app.html')));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(readFileSync(join(DIST, '404.html')));
});

// --- Route list -------------------------------------------------------------
const ROUTES = [
  // Astro static pages
  { path: '/', name: 'home', kind: 'astro' },
  { path: '/pricing/', name: 'pricing', kind: 'astro' },
  { path: '/grammar/', name: 'grammar-hub', kind: 'astro' },
  ...['a1.1', 'a2.1', 'b1.1', 'b2.2'].map((l) => ({ path: `/grammar/${l}/`, name: `grammar-${l}`, kind: 'astro' })),
  { path: '/grammar/a1.1/nouns-gender/', name: 'topic-nouns-gender', kind: 'astro', fullPage: true },
  { path: '/grammar/a2.1/dative-case/', name: 'topic-dative-case', kind: 'astro' },
  { path: '/grammar/b1.1/konjunktiv-ii-wurde/', name: 'topic-konjunktiv-ii-wurde', kind: 'astro' },
  { path: '/grammar/b2.2/modal-particles/', name: 'topic-modal-particles', kind: 'astro' },
  { path: '/vergleich/', name: 'vergleich-hub', kind: 'astro' },
  { path: '/vergleich/duolingo/', name: 'vergleich-duolingo', kind: 'astro' },
  { path: '/leitfaden/telc-b1/', name: 'leitfaden-telc-b1', kind: 'astro', fullPage: true },
  { path: '/privacy/', name: 'privacy', kind: 'astro' },
  { path: '/impressum/', name: 'impressum', kind: 'astro' },
  { path: '/definitely-not-a-page', name: '404', kind: 'astro' },
  // Prerendered SPA routes (crawler copy + React remount)
  { path: '/speaking', name: 'speaking', kind: 'spa' },
  { path: '/level-test', name: 'level-test', kind: 'spa' },
  { path: '/analyze', name: 'analyze', kind: 'spa' },
  { path: '/podcasts', name: 'podcasts', kind: 'spa' },
  { path: '/listening', name: 'listening-hub', kind: 'spa' },
  { path: '/reading', name: 'reading-hub', kind: 'spa' },
  // Plain SPA routes
  { path: '/intro', name: 'intro', kind: 'spa' },
  { path: '/login', name: 'login', kind: 'spa' },
  { path: '/signup', name: 'signup', kind: 'spa' },
  { path: '/reset-password', name: 'reset-password', kind: 'spa' },
  { path: '/faq', name: 'faq', kind: 'spa' },
  { path: '/ueber-uns', name: 'ueber-uns', kind: 'spa' },
  { path: '/vocabulary', name: 'vocabulary', kind: 'spa' },
  { path: '/video-library', name: 'video-library', kind: 'spa' },
  { path: '/level-test', name: 'level-test-again', kind: 'spa', skip: true },
  { path: '/listening/a1.1', name: 'listening-a1.1-lowercase', kind: 'spa' },
  { path: '/listening/A1.1', name: 'listening-A1.1-uppercase', kind: 'spa' },
  { path: '/dashboard', name: 'dashboard-loggedout', kind: 'spa' },
  { path: '/profile', name: 'profile-loggedout', kind: 'spa' },
  { path: '/subscription', name: 'subscription-loggedout', kind: 'spa' },
  { path: '/onboarding', name: 'onboarding-loggedout', kind: 'spa' },
  { path: '/vergleich/unknown-app', name: 'vergleich-unknown-slug', kind: 'spa' },
].filter((r) => !r.skip);

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

// --- Walk -------------------------------------------------------------------
await new Promise((resolve) => server.listen(4179, resolve));
// PLAYWRIGHT_CHROMIUM_PATH overrides when the installed playwright version's
// pinned browser build isn't present (e.g. sandboxes with a system Chromium).
const browser = await chromium.launch({
  args: ['--no-sandbox'],
  ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}),
});
const results = [];

for (const route of ROUTES) {
  const entry = { ...route, viewports: {}, consoleErrors: [], failedRequests: [] };
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const consoleErrors = new Set();
    const failed = new Set();
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.add(m.text().slice(0, 300)); });
    page.on('requestfailed', (r) => failed.add(`${new URL(r.url()).host}${new URL(r.url()).pathname}`.slice(0, 120)));
    let status = null;
    try {
      const resp = await page.goto(`http://localhost:4179${route.path}`, { waitUntil: 'networkidle', timeout: 20000 });
      status = resp?.status() ?? null;
    } catch {
      try { await page.waitForTimeout(3000); } catch { /* ignore */ }
    }
    await page.waitForTimeout(1200); // let React render/settle
    const meta = await page.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content ?? null,
      h1: document.querySelector('h1')?.innerText?.slice(0, 160) ?? null,
      lang: document.documentElement.lang,
      textSample: document.body?.innerText?.replace(/\s+/g, ' ').slice(0, 400) ?? '',
      textLength: document.body?.innerText?.length ?? 0,
    })).catch(() => ({}));
    const shot = join(SHOTS, `${route.name}-${vpName}.jpg`);
    await page.screenshot({ path: shot, type: 'jpeg', quality: 55, fullPage: Boolean(route.fullPage) && vpName === 'desktop' }).catch(() => {});
    entry.viewports[vpName] = { status, ...meta, screenshot: `screenshots/${route.name}-${vpName}.jpg` };
    entry.consoleErrors = [...new Set([...entry.consoleErrors, ...consoleErrors])].slice(0, 8);
    entry.failedRequests = [...new Set([...entry.failedRequests, ...failed])].slice(0, 8);
    await ctx.close();
  }
  results.push(entry);
  console.log(`${route.path.padEnd(36)} ${entry.viewports.desktop?.status ?? 'ERR'} errors:${entry.consoleErrors.length} failedReq:${entry.failedRequests.length}`);
}

await browser.close();
server.close();
writeFileSync(join(OUT, 'walkthrough.json'), JSON.stringify(results, null, 1));
console.log(`\n${results.length} routes captured → docs/evaluation/walkthrough.json`);
