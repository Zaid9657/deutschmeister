// The four A1.1 organic-launch articles — plan:
// docs/superpowers/plans/2026-09-15-a11-organic-commercial-launch.md Task 5,
// Step 1 ("write the content/claim tests"). Calendar and owners:
// docs/marketing/a11-organic-launch-calendar.md.
//
// DEVIATION FROM THE PLAN, ON PURPOSE. The plan lists four .astro pages under
// astro-site/src/pages/leitfaden/. CLAUDE.md is explicit that "Leitfäden are
// data, not pages": a guide is a module in astro-site/src/data/guides/,
// rendered by pages/leitfaden/[slug].astro, registered in GUIDES and listed in
// scripts/check-built-html.mjs. Four hand-built pages would have duplicated the
// renderer, the schema and the trailing-slash handling four times — exactly what
// the registry was built to stop. So the four articles are data modules, and
// this suite guards the properties the plan asked for.
//
// tests/guides.test.mjs already covers what is true of EVERY guide (unique
// slugs, title/description length, anchors, trailing slashes, sources, dates).
// This file covers what must be true of these four specifically: that they
// answer a beginner's question rather than sell, that each carries one practice
// block and exactly one preview link, that their internal links point at pages
// that exist, and that no two of them share a paragraph.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { A11_ORGANIC_GUIDES, GUIDES, guideUrl, guideReadingMinutes } from '../astro-site/src/data/guides/index.js';
import { grammarTopics } from '../src/data/grammarTopics.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const SLUGS = [
  'deutsch-a1-anfaenger-start', // week 1
  'sich-auf-deutsch-vorstellen', // week 2
  'auf-deutsch-im-cafe-bestellen', // week 3
  'deutsch-a1-30-tage-plan', // week 4
];

/** The one section in each article the reader is meant to DO, not read. */
const PRACTICE_SECTION = {
  'deutsch-a1-anfaenger-start': 'uebung',
  'sich-auf-deutsch-vorstellen': 'uebung',
  'auf-deutsch-im-cafe-bestellen': 'uebung',
  'deutsch-a1-30-tage-plan': 'selbsttest',
};

/** Every paragraph-ish string in a guide, for the duplication check. */
const prose = (g) => {
  const out = [g.lead, g.answer, g.cta.heading, g.cta.body];
  for (const s of g.sections) {
    for (const b of s.blocks) {
      if (b.type === 'p' || b.type === 'callout' || b.type === 'h3') out.push(b.text);
      if (b.type === 'list') out.push(...b.items);
      if (b.type === 'steps') for (const i of b.items) out.push(...i.tasks, i.tip || '');
      if (b.type === 'warnings') for (const i of b.items) out.push(i.title, i.body);
      if (b.type === 'cards') for (const i of b.items) out.push(i.title, i.body);
      if (b.type === 'table') out.push(...b.rows.flat());
    }
  }
  for (const f of g.faq) out.push(f.q, f.a);
  return out.filter((t) => typeof t === 'string' && t.trim().length > 0);
};

const normalise = (t) => t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

test('all four articles are registered and reachable', () => {
  assert.deepEqual(A11_ORGANIC_GUIDES.map((g) => g.slug), SLUGS, 'the launch set is not the four planned articles');
  for (const g of A11_ORGANIC_GUIDES) {
    assert.ok(GUIDES.includes(g), `${g.slug} is not in the GUIDES registry, so no page is built for it`);
    assert.equal(guideUrl(g), `https://deutsch-meister.de/leitfaden/${g.slug}/`, `${g.slug}: wrong canonical shape`);
  }
});

test('the build verifier requires every one of the four pages', () => {
  // A guide that is not in the MANIFEST ships unverified — and a broken build
  // step that drops it fails silently. Same argument as the REQUIRED list's own
  // comment in the script.
  const checker = read('scripts/check-built-html.mjs');
  for (const slug of SLUGS) {
    assert.ok(
      checker.includes(`leitfaden/${slug}/index.html`),
      `scripts/check-built-html.mjs does not require leitfaden/${slug}/index.html`,
    );
  }
});

test('each article has its own title, description and lead', () => {
  // guides.test.mjs checks uniqueness across the whole registry; this narrows
  // the failure message to the four that were written in one sitting, which is
  // when near-duplicate titles actually happen.
  for (const field of ['title', 'description', 'h1', 'lead']) {
    const seen = new Map();
    for (const g of A11_ORGANIC_GUIDES) {
      const value = normalise(g[field]);
      assert.ok(!seen.has(value), `${g.slug} shares its ${field} with ${seen.get(value)}`);
      seen.set(value, g.slug);
    }
  }
});

test('no two articles share a paragraph', () => {
  // The failure this prevents: four articles built from one template, each with
  // the same three "why learn German with us" paragraphs. Thin, duplicated
  // content is what gets a set of pages ignored as a set.
  const seen = new Map();
  const failures = [];
  for (const g of A11_ORGANIC_GUIDES) {
    for (const text of prose(g)) {
      const key = normalise(text);
      // Short fragments (table cells, single tasks) legitimately repeat.
      if (key.length < 80) continue;
      if (seen.has(key) && seen.get(key) !== g.slug) {
        failures.push(`${g.slug} repeats a paragraph from ${seen.get(key)}: "${text.slice(0, 60)}…"`);
      }
      seen.set(key, g.slug);
    }
  }
  assert.deepEqual(failures, [], `duplicated copy:\n  ${failures.join('\n  ')}`);
});

test('each article answers its query with real substance', () => {
  const failures = [];
  for (const g of A11_ORGANIC_GUIDES) {
    if (g.sections.length < 4) failures.push(`${g.slug}: ${g.sections.length} sections`);
    if (g.faq.length < 5) failures.push(`${g.slug}: ${g.faq.length} FAQ entries`);
    if (guideReadingMinutes(g) < 5) failures.push(`${g.slug}: reads in under 5 minutes`);
    // German copy: the articles are written for German-language queries.
    if (!/[äöüß]/i.test(prose(g).join(' '))) failures.push(`${g.slug}: does not read as German`);
  }
  assert.deepEqual(failures, [], `thin articles:\n  ${failures.join('\n  ')}`);
});

test('each article carries one practice block the reader can actually do', () => {
  for (const g of A11_ORGANIC_GUIDES) {
    const id = PRACTICE_SECTION[g.slug];
    const section = g.sections.find((s) => s.id === id);
    assert.ok(section, `${g.slug}: no practice section "#${id}"`);
    const steps = section.blocks.filter((b) => b.type === 'steps');
    const lists = section.blocks.filter((b) => b.type === 'list');
    const doable =
      steps.some((b) => b.items.length >= 3 && b.items.reduce((n, i) => n + i.tasks.length, 0) >= 5) ||
      lists.some((b) => b.items.length >= 5);
    assert.ok(doable, `${g.slug}: "#${id}" is prose, not an exercise`);
  }
});

test('every internal link points at a page that exists', () => {
  // guides.test.mjs checks the SHAPE of a link (trailing slashes). This checks
  // the TARGET: a grammar slug that is not in the topic registry renders a 404
  // for the reader and a dead link for the crawler, and neither is visible in a
  // build log.
  const a11Slugs = new Set(grammarTopics['a1.1'].map((t) => t.slug));
  const guideSlugs = new Set(GUIDES.map((g) => g.slug));
  const lessonNumbers = new Set(CURRICULUM_A11.lektionen.map((l) => String(l.nr)));
  const STATIC_OK = new Set(['/reading/', '/listening/', '/level-test/', '/grammar/a1.1/', '/pricing/', '/ueber-uns', '/vergleich/']);

  const failures = [];
  let checked = 0;
  for (const g of A11_ORGANIC_GUIDES) {
    for (const [, href] of JSON.stringify(g).matchAll(/href=\\"([^"\\]+)\\"/g)) {
      if (href.startsWith('http') || href.startsWith('mailto:')) continue;
      checked += 1;
      const path = href.split('?')[0].split('#')[0];
      if (STATIC_OK.has(path)) continue;

      const grammar = path.match(/^\/grammar\/a1\.1\/([a-z0-9-]+)\/$/);
      if (grammar) {
        if (!a11Slugs.has(grammar[1])) failures.push(`${g.slug}: /grammar/a1.1/${grammar[1]}/ is not an A1.1 topic`);
        continue;
      }
      const guide = path.match(/^\/leitfaden\/([a-z0-9-]+)\/$/);
      if (guide) {
        if (!guideSlugs.has(guide[1])) failures.push(`${g.slug}: /leitfaden/${guide[1]}/ is not a registered guide`);
        continue;
      }
      const lesson = path.match(/^\/course\/a1\.1\/l\/(\d+)$/);
      if (lesson) {
        if (!lessonNumbers.has(lesson[1])) failures.push(`${g.slug}: Lektion ${lesson[1]} does not exist in A1.1`);
        continue;
      }
      failures.push(`${g.slug}: ${href} is not a target this test knows — add it or fix the link`);
    }
  }
  assert.ok(checked > 0, 'no links were checked — did the matcher break?');
  assert.deepEqual(failures, [], `dead links:\n  ${failures.join('\n  ')}`);
});

test('each article makes exactly one course-preview offer', () => {
  // One link into the product, placed where it helps, is the difference between
  // a useful article and a landing page in disguise. More than one turns the
  // article into an ad; none wastes the traffic it earned.
  for (const g of A11_ORGANIC_GUIDES) {
    const previews = [...JSON.stringify(g).matchAll(/href=\\"(\/course\/[^"\\]+)\\"/g)].map((m) => m[1]);
    assert.equal(previews.length, 1, `${g.slug}: ${previews.length} preview CTAs — expected exactly 1`);
    const [href] = previews;
    assert.match(href, /^\/course\/a1\.1\/l\/\d+\?source=organic-guide-[a-z-]+$/, `${g.slug}: preview link "${href}" carries no organic source tag`);
    // The tagged lesson must be inside the free preview window, or the "free"
    // in the link text is a lie the paywall exposes one click later.
    const nr = Number(href.match(/\/l\/(\d+)/)[1]);
    assert.ok(nr <= 3, `${g.slug}: links Lektion ${nr}, which is behind the paywall`);
  }
});

test('no article promises an outcome, a level or a pass', () => {
  const BANNED = [
    /garanti/i,
    /flie(ß|ss)end/i,
    /\bfluent\b/i,
    /sicher bestehen/i,
    /bestehst du/i,
    /100\s?%/,
    /in \d+ tagen (zu )?(a1|a2|b1)\b(?![.\s]*—)/i, // a promise, not the honest "in 30 Tagen: was geht?"
    /du wirst .{0,20}sprechen können/i,
  ];
  const failures = [];
  for (const g of A11_ORGANIC_GUIDES) {
    const blob = prose(g).join('\n') + '\n' + g.title + '\n' + g.description;
    for (const re of BANNED) if (re.test(blob)) failures.push(`${g.slug} matches ${re}`);
  }
  assert.deepEqual(failures, [], `outcome promises:\n  ${failures.join('\n  ')}`);
});

test('the articles say which half of A1 the course is', () => {
  // The honesty that makes the set defensible: A1.1 is half of A1, and two of
  // the four articles are read by people who will otherwise assume otherwise.
  const plan = A11_ORGANIC_GUIDES.find((g) => g.slug === 'deutsch-a1-30-tage-plan');
  const blob = prose(plan).join('\n');
  assert.match(blob, /erste Hälfte/i, 'the 30-day plan does not say A1.1 is the first half of A1');
  assert.match(blob, /A1\.2/, 'the 30-day plan does not name what comes next');
});
