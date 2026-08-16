// Batch Lighthouse over the merged dist/ — compact JSON scores per page for
// the evaluation report (complements scripts/lighthouse-audit.js, which does
// a single full HTML report).
//
//   npm i --no-save playwright   # not needed here, but chrome-launcher is a dep
//   CHROME_PATH=/path/to/chromium node scripts/lighthouse-batch.mjs
//
// Output: docs/evaluation/lighthouse.json
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const DIST = join(process.cwd(), 'dist');
const OUT = join(process.cwd(), 'docs', 'evaluation');
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { path: '/', name: 'home (Astro)' },
  { path: '/pricing/', name: 'pricing (Astro)' },
  { path: '/grammar/', name: 'grammar hub (Astro)' },
  { path: '/grammar/a1.1/nouns-gender/', name: 'grammar topic (Astro)' },
  { path: '/leitfaden/telc-b1/', name: 'telc-B1 guide (Astro)' },
  { path: '/level-test', name: 'level test (SPA shell)' },
];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer((req, res) => {
  const clean = decodeURIComponent(req.url.split('?')[0]);
  for (const c of [clean, `${clean}/index.html`, `${clean}index.html`]) {
    const p = join(DIST, c);
    if (p.startsWith(DIST) && existsSync(p) && statSync(p).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[extname(p)] ?? 'application/octet-stream' });
      res.end(readFileSync(p));
      return;
    }
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(readFileSync(join(DIST, 'app.html')));
});
await new Promise((r) => server.listen(4181, r));

const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] });
const results = [];

for (const page of PAGES) {
  for (const preset of ['mobile', 'desktop']) {
    const config = preset === 'desktop'
      ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { disabled: true }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } }
      : undefined;
    const { lhr } = await lighthouse(`http://localhost:4181${page.path}`, { port: chrome.port, output: 'json' }, config);
    const scores = Object.fromEntries(
      Object.entries(lhr.categories).map(([k, c]) => [k, Math.round((c.score ?? 0) * 100)])
    );
    // Top negative audits (weight > 0, score < 0.9), most impactful first
    const flagged = Object.values(lhr.audits)
      .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode === 'metricSavings' || (a.score !== null && a.score < 0.5 && a.details))
      .slice(0, 6)
      .map((a) => `${a.id}${a.displayValue ? ` (${a.displayValue})` : ''}`);
    const metrics = {
      fcp: lhr.audits['first-contentful-paint']?.displayValue,
      lcp: lhr.audits['largest-contentful-paint']?.displayValue,
      tbt: lhr.audits['total-blocking-time']?.displayValue,
      cls: lhr.audits['cumulative-layout-shift']?.displayValue,
      transfer: lhr.audits['total-byte-weight']?.displayValue,
    };
    results.push({ page: page.name, path: page.path, preset, scores, metrics, flagged });
    console.log(`${page.path} [${preset}] perf:${scores.performance} a11y:${scores.accessibility} bp:${scores['best-practices']} seo:${scores.seo}`);
  }
}

await chrome.kill();
server.close();
writeFileSync(join(OUT, 'lighthouse.json'), JSON.stringify(results, null, 1));
console.log(`\n→ docs/evaluation/lighthouse.json`);
