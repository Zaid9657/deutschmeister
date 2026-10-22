// Before/after screenshots of the A1.1 course surfaces at the four review widths,
// plus the document width at each (horizontal overflow = docWidth > viewport).
// Uses puppeteer-core (already installed with lighthouse) — no extra dependency.
//
//   CHROME_PATH=<chrome> node scripts/course-screens.mjs --base=http://localhost:4173 --tag=before --out=.cache/evaluation/course-before
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluationOutput, flag } from './lib/evaluation-output.mjs';

const ARGS = process.argv.slice(2);
const BASE = flag(ARGS, 'base', 'http://localhost:4173');
const TAG = flag(ARGS, 'tag', 'before');
const { directory: OUT } = evaluationOutput('course-screens', { argv: ARGS });
// `scrollTo`: a second, scrolled shot of the part below the fold. Scroll-reveal
// sections stay blank in a full-page capture, so shots are viewport-sized.
const ROUTES = [
  { path: '/course/a1.1', name: 'hub', scrollTo: 'ol.max-w-md' },
  { path: '/course/a1.1/l/1', name: 'l1-intro' },
];
const WIDTHS = [360, 390, 768, 1440];

mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const report = [];
try {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: width < 768 ? 800 : 900, isMobile: width < 768, hasTouch: width < 768 });
      // A decided cookie banner, so every run starts from the same screen.
      await page.evaluateOnNewDocument(() => localStorage.setItem('dm_cookie_consent', 'declined'));
      await page.goto(BASE + route.path, { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 800));
      const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const file = join(OUT, `a11-w3-${TAG}-${route.name}-${width}.png`);
      await page.screenshot({ path: file });
      if (route.scrollTo) {
        await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'start' }), route.scrollTo);
        await new Promise((r) => setTimeout(r, 900));
        await page.screenshot({ path: file.replace('.png', '-path.png') });
      }
      report.push({ route: route.path, width, docWidth, overflow: docWidth > width, file });
      console.log(`${route.path} @${width}: docWidth ${docWidth}${docWidth > width ? '  OVERFLOW' : ''}`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
writeFileSync(join(OUT, `a11-w3-${TAG}-widths.json`), JSON.stringify(report, null, 1));
