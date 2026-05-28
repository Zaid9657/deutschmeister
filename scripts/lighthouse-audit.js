import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
function getFlag(name, fallback) {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split('=').slice(1).join('=') : fallback;
}

const url = getFlag('url', 'http://localhost:4173');
const preset = getFlag('preset', 'mobile');
const outputDir = resolve(getFlag('output', 'lighthouse-reports'));

const THRESHOLDS = { performance: 70, accessibility: 90, 'best-practices': 90, seo: 90 };

async function run() {
  console.log(`\nLighthouse audit: ${url} (${preset})\n`);

  const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] });

  const config = preset === 'desktop'
    ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { disabled: true }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } }
    : undefined;

  const result = await lighthouse(url, { port: chrome.port, output: 'html' }, config);
  await chrome.kill();

  mkdirSync(outputDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `lh-${preset}-${ts}.html`;
  const filepath = resolve(outputDir, filename);
  writeFileSync(filepath, result.report);
  console.log(`Report saved: ${filepath}\n`);

  const categories = result.lhr.categories;
  let failed = false;

  for (const [key, threshold] of Object.entries(THRESHOLDS)) {
    const cat = categories[key];
    if (!cat) continue;
    const score = Math.round(cat.score * 100);
    const pass = score >= threshold;
    const icon = pass ? '✓' : '✗';
    console.log(`  ${icon} ${cat.title}: ${score} (threshold: ${threshold})`);
    if (!pass) failed = true;
  }

  console.log('');
  if (failed) {
    console.log('FAIL — one or more scores below threshold.\n');
    process.exit(1);
  } else {
    console.log('PASS — all scores above threshold.\n');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
