import { chromium } from '/root/.npm/_npx/0b9ff77863cb6e9f/node_modules/playwright-core/index.mjs';

const slugs = ['possessive-pronouns', 'perfect-tense-haben'];
const base = 'http://localhost:8811';
const outDir = '/tmp/claude-0/-home-user-deutschmeister/c2792a5e-db22-5773-87d6-2f95d17dddab/scratchpad/wave4/shots';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
await page.emulateMedia({ reducedMotion: 'reduce' });

for (const slug of slugs) {
  const url = `${base}/grammar/a2.1/${slug}/`;
  await page.goto(url, { waitUntil: 'networkidle' });
  // Scroll to the bottom in steps to trigger any scroll-based reveal fallback,
  // then back to top before the full-page capture.
  await page.evaluate(async () => {
    const step = window.innerHeight;
    const total = document.body.scrollHeight;
    for (let y = 0; y < total; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/pr-a2-${slug}.png`, fullPage: true });
  console.log('shot:', slug);
}

await browser.close();
console.log('done');
