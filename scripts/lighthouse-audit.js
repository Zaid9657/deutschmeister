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
const only = getFlag('only', '');
const outputDir = resolve(getFlag('output', 'lighthouse-reports'));

const THRESHOLDS = { performance: 70, accessibility: 90, 'best-practices': 90, seo: 90 };

async function run() {
  console.log(`\nLighthouse audit: ${url} (${preset})\n`);

  // Chrome 152 on Windows can exit before exposing its debugging socket when
  // launched with the legacy `--headless` mode. The current headless mode is
  // stable locally and in CI; Chrome's sandbox remains enabled.
  const chrome = await launch({ chromeFlags: ['--headless=new', '--disable-gpu'] });

  const settings = {
    ...(only ? { onlyCategories: only.split(',').map((value) => value.trim()).filter(Boolean) } : {}),
    ...(preset === 'desktop'
      ? { formFactor: 'desktop', screenEmulation: { disabled: true }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } }
      : {}),
  };
  const config = Object.keys(settings).length
    ? { extends: 'lighthouse:default', settings }
    : undefined;

  let result;
  try {
    result = await lighthouse(url, { port: chrome.port, output: 'html' }, config);
  } finally {
    // chrome-launcher can hit a transient Windows EPERM while deleting its
    // temporary profile after Chrome has already stopped. That cleanup race
    // must not erase a completed audit result.
    try {
      await chrome.kill();
    } catch {
      // Chrome has already stopped; only temporary-profile cleanup failed.
    }
  }

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

    const failedAudits = cat.auditRefs
      .filter((ref) => ref.weight > 0)
      .map((ref) => result.lhr.audits[ref.id])
      .filter((audit) => audit && audit.score !== null && audit.score < 1);
    for (const audit of failedAudits) {
      const count = Array.isArray(audit.details?.items) ? ` (${audit.details.items.length} item${audit.details.items.length === 1 ? '' : 's'})` : '';
      console.log(`      - ${audit.id}: ${audit.title}${count}`);
      for (const item of (audit.details?.items ?? []).slice(0, 5)) {
        if (item.node?.snippet) console.log(`        ${item.node.snippet.replace(/\s+/g, ' ').trim()}`);
      }
    }
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
