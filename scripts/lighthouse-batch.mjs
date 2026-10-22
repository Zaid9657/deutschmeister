// Batch Lighthouse over the merged dist/ — compact JSON scores per page for
// the evaluation report (complements scripts/lighthouse-audit.js, which does
// a single full HTML report).
//
//   npm i --no-save playwright   # not needed here, but chrome-launcher is a dep
//   CHROME_PATH=/path/to/chromium node scripts/lighthouse-batch.mjs
//
// Output: .cache/evaluation/lighthouse-<run>/lighthouse.json (--out overrides the directory)
//
// Comparable before/after runs on chosen routes (e.g. the course):
//   node scripts/lighthouse-batch.mjs --pages=/course/a1.1,/course/a1.1/l/1 --runs=3 --out=.cache/evaluation/course
// (Measured 2026-10-05: system Chrome 154 closes the CDP session under Lighthouse 13
//  — "Session closed" on Page.enable. CHROME_PATH=<puppeteer chrome 143> works.)
import { mkdirSync, writeFileSync } from 'node:fs';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { createNetlifyStaticServer } from './lib/netlify-static-server.mjs';
import { evaluationOutput, flag } from './lib/evaluation-output.mjs';

const ARGS = process.argv.slice(2);
const RUNS = Number(flag(ARGS, 'runs', 1));
const { directory: OUT, report: OUT_FILE } = evaluationOutput('lighthouse', { argv: ARGS, report: 'lighthouse.json' });
mkdirSync(OUT, { recursive: true });

const DEFAULT_PAGES = [
  { path: '/', name: 'home (Astro)' },
  { path: '/pricing/', name: 'pricing (Astro)' },
  { path: '/grammar/', name: 'grammar hub (Astro)' },
  { path: '/grammar/a1.1/nouns-gender/', name: 'grammar topic (Astro)' },
  { path: '/leitfaden/telc-b1/', name: 'telc-B1 guide (Astro)' },
  { path: '/level-test', name: 'level test (SPA shell)' },
];
const PAGES = flag(ARGS, 'pages') ? flag(ARGS, 'pages').split(',').map((path) => ({ path, name: path })) : DEFAULT_PAGES;

const server = createNetlifyStaticServer({ gzip: true, spaShellFallback: true });
await new Promise((r) => server.listen(4181, r));

const chrome = await launch({ chromeFlags: ['--headless=new', '--disable-gpu'] });
const results = [];

for (const page of PAGES) {
  for (let run = 1; run <= RUNS; run += 1) for (const preset of ['mobile', 'desktop']) {
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
    results.push({ page: page.name, path: page.path, preset, run, scores, metrics, flagged });
    console.log(`${page.path} [${preset} #${run}] lcp:${metrics.lcp} tbt:${metrics.tbt} cls:${metrics.cls} perf:${scores.performance} a11y:${scores.accessibility} bp:${scores['best-practices']} seo:${scores.seo}`);
  }
}

try {
  await chrome.kill();
} catch {
  // Chrome 152 on Windows can finish the audit but race while deleting its
  // temporary profile. Preserve the completed measurements in that case.
}
server.close();
writeFileSync(OUT_FILE, JSON.stringify(results, null, 1));
console.log(`\n→ ${OUT_FILE}`);
