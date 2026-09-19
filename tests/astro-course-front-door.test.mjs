// The free A1.1 course is the front door — Astro side. Every public "Start …
// free" CTA on the static site must open the guided course at /course/a1.1
// (SPA route, no trailing slash — CLAUDE.md case 3), never the grammar topic
// index at /grammar/a1.1/. Until 2026-09-19 six such CTAs sent a day-zero
// beginner to a grammar list. Genuine "browse the grammar" links are untouched:
// they never say "start … free". The SPA half lives in course-front-door.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = join(root, 'astro-site', 'src', 'pages');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.astro')) out.push(p);
  }
  return out;
}

// Visible text says "start free" in either language; expressions like
// {FREE_LEVEL_LABEL} or {code} are left in place — they never change the verdict.
const START_FREE = /start.*(free|kostenlos)|(free|kostenlos).*start|start a1\.1/i;
// Literal `/course/a1.1`, or a template that fills the level in (`/course/${level}`,
// `/course/${r.level}`) on the pages that render the free level from data.
const COURSE_DOOR = /^\/course\/(a1\.1|\$\{[\w.]*level\})$/;
// The account door is a different door (conversion-trust.test.mjs keeps
// no-account exploration, account trial and paid Pro apart): "Start free — 7
// days of Pro" / „Kostenlos starten" next to a trial subtext may open signup.
// What this suite forbids is the grammar index posing as the course.
const isTrialSignup = ({ href }) => /\/signup\/?$/.test(href);

// <a … href="…" | href={`…`} | href={…} …>text</a>
const ANCHOR = /<a\b[^>]*?\bhref=(?:"([^"]*)"|\{`([^`]*)`\}|\{([^}]*)\})[^>]*>([\s\S]*?)<\/a>/g;

function startFreeAnchors(source) {
  const found = [];
  for (const m of source.matchAll(ANCHOR)) {
    const href = m[1] ?? m[2] ?? m[3];
    const text = m[4].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (START_FREE.test(text)) found.push({ href, text });
  }
  return found;
}

const pages = walk(PAGES);
const byPage = new Map(pages.map((p) => [relative(root, p), startFreeAnchors(readFileSync(p, 'utf8'))]));

test('every "start free" CTA on the Astro site opens the course, never the grammar index', () => {
  for (const [page, anchors] of byPage) {
    for (const { href, text } of anchors) {
      assert.doesNotMatch(href, /\/grammar\//, `${page}: "${text}" points at the grammar index (${href})`);
      if (isTrialSignup({ href, text })) continue;
      assert.match(href, COURSE_DOOR, `${page}: "${text}" must open /course/a1.1 (got ${href})`);
      assert.doesNotMatch(href, /\/$/, `${page}: "${text}" — SPA route, no trailing slash (${href})`);
    }
  }
});

test('the known front-door CTAs still exist (the scan is not vacuous)', () => {
  const expected = {
    'astro-site/src/pages/index.astro': 1,
    'astro-site/src/pages/pricing.astro': 1,
    'astro-site/src/pages/courses/index.astro': 1,
    'astro-site/src/pages/courses/[level].astro': 2,
  };
  for (const [page, count] of Object.entries(expected)) {
    const anchors = byPage.get(page) ?? [];
    assert.ok(anchors.length >= count, `${page}: expected ≥${count} "start free" CTA(s), found ${anchors.length}`);
  }
});

test('the course-page syllabus link opens the course home, not a bare lesson URL', () => {
  const level = readFileSync(join(PAGES, 'courses', '[level].astro'), 'utf8');
  assert.doesNotMatch(level, /href=\{`\/course\/\$\{level\}\/l\/1`\}/);
  assert.match(level, /href=\{`\/course\/\$\{level\}`\}[^>]*>Open the course →<\/a>/);
});
