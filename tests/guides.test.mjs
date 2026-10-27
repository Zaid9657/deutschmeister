// Guard suite for the Leitfaden registry (astro-site/src/data/guides/).
//
// A guide is data now, which makes a whole class of mistakes cheap to make and
// invisible in review: a duplicated slug silently drops a page from the build, a
// title two characters too long gets truncated in every SERP, a link written
// without its trailing slash 301-hops on every click. None of that shows up in
// `astro build`, which happily renders all of it.
//
// The internal-link rule is the one worth explaining. CLAUDE.md documents three
// trailing-slash cases, and getting them wrong is called out there as the way
// "every link 301-hops". Guides link into all three kinds of route, so the check
// below encodes the rule rather than trusting the author to remember it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { onsiteHref, DOORS } from '../astro-site/src/lib/onsiteLinks.js';

import {
  GUIDES,
  GUIDE_OFFERS,
  guideLang,
  getGuide,
  guideToc,
  guideReadingMinutes,
  guideJsonLd,
  guideUrl,
} from '../astro-site/src/data/guides/index.js';

const TITLE_SOFT_MAX = 60; // matches scripts/check-built-html.mjs
const DESC_MIN = 50;
const DESC_MAX = 160;

test('the registry is not empty and every slug is unique', () => {
  assert.ok(GUIDES.length > 0, 'no guides registered');
  const slugs = GUIDES.map((g) => g.slug);
  assert.deepEqual([...new Set(slugs)].sort(), [...slugs].sort(), 'duplicate slug in the registry');
  for (const slug of slugs) {
    assert.match(slug, /^[a-z0-9-]+$/, `slug "${slug}" is not URL-safe lowercase`);
    assert.equal(getGuide(slug).slug, slug);
  }
});

test('titles and descriptions fit what a search result shows', () => {
  const failures = [];
  for (const g of GUIDES) {
    if (g.title.length > TITLE_SOFT_MAX) failures.push(`${g.slug}: title ${g.title.length} chars (max ${TITLE_SOFT_MAX})`);
    if (g.description.length < DESC_MIN) failures.push(`${g.slug}: description ${g.description.length} chars (min ${DESC_MIN})`);
    if (g.description.length > DESC_MAX) failures.push(`${g.slug}: description ${g.description.length} chars (max ${DESC_MAX})`);
  }
  assert.deepEqual(failures, [], `title/description length:\n  ${failures.join('\n  ')}`);
});

test('no two guides share a title or a description', () => {
  // check-built-html.mjs fails the build on duplicates in dist/; catching it
  // here names the guide instead of the output file.
  const titles = new Map();
  const descs = new Map();
  const failures = [];
  for (const g of GUIDES) {
    if (titles.has(g.title)) failures.push(`${g.slug} shares its title with ${titles.get(g.title)}`);
    else titles.set(g.title, g.slug);
    if (descs.has(g.description)) failures.push(`${g.slug} shares its description with ${descs.get(g.description)}`);
    else descs.set(g.description, g.slug);
  }
  assert.deepEqual(failures, []);
});

test('every guide has enough substance to be worth indexing', () => {
  const failures = [];
  for (const g of GUIDES) {
    if (g.sections.length < 4) failures.push(`${g.slug}: only ${g.sections.length} sections`);
    if (g.faq.length < 4) failures.push(`${g.slug}: only ${g.faq.length} FAQ entries`);
    // MIN_BODY_CHARS in check-built-html is 250; a guide should be far past it.
    if (guideReadingMinutes(g) < 5) failures.push(`${g.slug}: reads in under 5 minutes`);
    if (!g.lead || !g.cta?.heading) failures.push(`${g.slug}: missing lead or CTA`);
  }
  assert.deepEqual(failures, [], `thin guides:\n  ${failures.join('\n  ')}`);
});

test('every guide leads with a definition-first answer of citable length', () => {
  // GEO fix, geo-weekly.md fix type 2: an answer an engine can lift from the top
  // third. telc-b1 is the highest-volume page on the site and used to bury its
  // pass marks at 37% depth behind a lead containing no extractable fact.
  //
  // The band is a citation-shape constraint, not a style rule: below ~45 words an
  // answer omits the mechanism, above ~120 it stops being liftable as one passage.
  const failures = [];
  for (const g of GUIDES) {
    if (!g.answer) { failures.push(`${g.slug}: no answer block`); continue; }
    const words = g.answer.trim().split(/\s+/).length;
    if (words < 45 || words > 120) failures.push(`${g.slug}: answer is ${words} words (want 45-120)`);
    if (/<[a-z]/i.test(g.answer)) failures.push(`${g.slug}: answer contains markup; it is rendered as text`);
  }
  assert.deepEqual(failures, []);
});

// Which guide fields the renderer (astro-site/src/pages/leitfaden/[slug].astro)
// reads as HTML and which as text. Until 2026-10-25 step tasks and card bodies
// rendered as text, so five authored links (level test, X-Ray, speaking, the
// letter guide) showed as literal `<a href="…">`. An HTML field may carry only
// the inline markup the copy uses; a text field none at all.
const renderer = readFileSync(new URL('../astro-site/src/pages/leitfaden/[slug].astro', import.meta.url), 'utf8');
const HTML_EXPRESSIONS = ['guide.lead', 'block.text', 'item', 'task', 'card.body'];
const INLINE = /<\/?(?:a|strong|em)\b[^>]*>/gi;

/** [where, text, asHtml] for every rendered string field of a guide. */
function* guideFields(g) {
  yield ['lead', g.lead, true];
  for (const key of ['title', 'h1', 'description', 'badge', 'answer']) yield [key, g[key], false];
  for (const s of g.sections) {
    yield [`${s.id} heading`, s.heading, false];
    for (const b of s.blocks) {
      const at = `${s.id} ${b.type}`;
      if (b.type === 'p') yield [at, b.text, true];
      if (b.type === 'h3' || b.type === 'callout') yield [at, b.text, false];
      if (b.type === 'list') for (const item of b.items) yield [at, item, true];
      if (b.type === 'table') {
        for (const cell of [...b.head, ...b.rows.flat(), b.caption ?? '']) yield [at, cell, false];
      }
      if (b.type === 'steps') {
        for (const st of b.items) {
          for (const task of st.tasks) yield [`${at} task`, task, true];
          for (const value of [st.label, st.title, st.tip ?? '']) yield [at, value, false];
        }
      }
      if (b.type === 'warnings') for (const w of b.items) for (const value of [w.title, w.body]) yield [at, value, false];
      if (b.type === 'model') for (const value of [b.label ?? '', ...b.lines]) yield [at, value, false];
      if (b.type === 'cards') {
        for (const c of b.items) {
          yield [`${at} body`, c.body, true];
          for (const value of [c.eyebrow, c.title]) yield [at, value, false];
        }
      }
    }
  }
  for (const f of g.faq) for (const value of [f.q, f.a]) yield ['faq', value, false];
  for (const value of [g.cta.heading, g.cta.body]) yield ['cta', value, false];
}

test('the renderer reads every markup-carrying field as HTML, never as text', () => {
  for (const expr of HTML_EXPRESSIONS) {
    assert.match(renderer, new RegExp(`set:html=\\{${expr.replace('.', '\\.')}\\}`), `${expr} must render with set:html`);
  }
  assert.doesNotMatch(renderer, /<span>\{task\}<\/span>|>\{card\.body\}</, 'a step task or card body renders as escaped text again');
});

test('guide fields carry markup only where it renders: inline links and emphasis in HTML fields, nothing in text fields', () => {
  const failures = [];
  let html = 0;
  for (const g of GUIDES) {
    for (const [where, text, asHtml] of guideFields(g)) {
      if (typeof text !== 'string') continue;
      if (asHtml) {
        html += 1;
        // Strip the allowed inline tags; anything tag-like or a bare "&" left over
        // would be parsed as HTML instead of shown.
        const rest = text.replace(INLINE, '').replace(/&(?:[a-z]+|#\d+);/gi, '');
        if (/<[a-z/!]/i.test(rest) || /&/.test(rest)) failures.push(`${g.slug} ${where}: unsupported markup in an HTML field — "${text.slice(0, 80)}"`);
      } else if (/<[a-z/][^>]*>/i.test(text)) {
        failures.push(`${g.slug} ${where}: markup in a field rendered as text — "${text.slice(0, 80)}"`);
      }
    }
  }
  assert.ok(html > 0, 'no HTML fields were read — did the walker break?');
  assert.deepEqual(failures, [], `guide markup:\n  ${failures.join('\n  ')}`);
});

test('section ids are unique within a guide and match their TOC anchors', () => {
  const failures = [];
  for (const g of GUIDES) {
    const ids = g.sections.map((s) => s.id);
    if (new Set(ids).size !== ids.length) failures.push(`${g.slug}: duplicate section id`);
    for (const id of ids) if (!/^[a-z0-9-]+$/.test(id)) failures.push(`${g.slug}: section id "${id}" is not anchor-safe`);
    // The TOC is derived, so this asserts the derivation rather than the author.
    const toc = guideToc(g);
    assert.equal(toc.length, g.sections.length + 1, `${g.slug}: TOC length should be sections + FAQ`);
    for (const [i, section] of g.sections.entries()) {
      if (toc[i].href !== `#${section.id}`) failures.push(`${g.slug}: TOC entry ${i} does not point at #${section.id}`);
    }
  }
  assert.deepEqual(failures, [], `anchors:\n  ${failures.join('\n  ')}`);
});

test('internal links follow the three trailing-slash cases', () => {
  // CLAUDE.md: Astro pages and the six prerendered SPA routes end in "/";
  // every other SPA route has no slash. A wrong one 301-hops on every click.
  const SLASHED_PREFIXES = [
    '/grammar/',
    '/vergleich/',
    '/leitfaden/',
    '/pricing/',
    '/privacy/',
    '/impressum/',
    '/analyze/',
    '/pruefung/',
    '/level-test/',
    '/speaking/',
    '/podcasts/',
    '/listening/',
    '/reading/',
  ];
  const NO_SLASH_ROUTES = ['/faq', '/ueber-uns', '/signup', '/login', '/dashboard', '/schreiben', '/modelltest', '/level/a2.1'];

  const failures = [];
  let linksSeen = 0;
  for (const g of GUIDES) {
    const html = JSON.stringify(g);
    for (const [, href] of html.matchAll(/href=\\"([^"\\]+)\\"/g)) {
      linksSeen += 1;
      if (href.startsWith('http')) {
        // Absolute links to our own domain re-enter the site through a redirect
        // hop and lose the SPA's client-side navigation. The originals did this.
        if (href.includes('deutsch-meister.de')) failures.push(`${g.slug}: absolute self-link ${href}`);
        continue;
      }
      if (!href.startsWith('/')) {
        failures.push(`${g.slug}: link "${href}" is neither absolute nor root-relative`);
        continue;
      }
      const path = href.split('#')[0];
      if (NO_SLASH_ROUTES.includes(path.replace(/\/$/, ''))) {
        if (path.endsWith('/')) failures.push(`${g.slug}: ${href} must NOT end with a slash`);
        continue;
      }
      if (SLASHED_PREFIXES.some((p) => path.startsWith(p))) {
        if (!path.endsWith('/')) failures.push(`${g.slug}: ${href} must end with a slash`);
        continue;
      }
      failures.push(`${g.slug}: ${href} matches no known route shape — add it to this test or fix the link`);
    }
  }
  assert.ok(linksSeen > 0, 'no internal links were checked — did the matcher break?');
  assert.deepEqual(failures, [], `link shapes:\n  ${failures.join('\n  ')}`);
});

test('dates are ISO and not in the future', () => {
  const today = new Date().toISOString().slice(0, 10);
  const failures = [];
  for (const g of GUIDES) {
    for (const field of ['datePublished', 'factsCheckedOn']) {
      const value = g[field];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) failures.push(`${g.slug}: ${field} "${value}" is not YYYY-MM-DD`);
      else if (value > today) failures.push(`${g.slug}: ${field} "${value}" is in the future`);
    }
  }
  assert.deepEqual(failures, [], `dates:\n  ${failures.join('\n  ')}`);
});

test('every guide names at least one source for its exam facts', () => {
  // A guide states exam formats and pass marks. Where those came from, and when
  // they were checked, is rendered on the page — so it has to exist here.
  for (const g of GUIDES) {
    assert.ok(Array.isArray(g.sources) && g.sources.length > 0, `${g.slug}: no sources listed`);
    for (const s of g.sources) {
      assert.ok(s.label, `${g.slug}: a source has no label`);
      assert.match(s.url, /^https:\/\//, `${g.slug}: source url "${s.url}" is not https`);
    }
  }
});

test('no guide makes an outcome promise or states a fee', () => {
  // Same discipline as the pricing surfaces: the product records no pass
  // outcome, so it cannot claim one. Fees are set per exam centre and change
  // without notice, so a number here would be wrong somewhere by definition.
  const OUTCOME = /\b(garantiert bestehst|bestehst du garantiert|Bestehensgarantie|100\s?% Erfolg|sicher bestehen)\b/i;
  const FEE = /\b\d{2,3}\s?(?:–|-|bis)\s?\d{2,3}\s?(?:Euro|€)\b/i;
  const failures = [];
  for (const g of GUIDES) {
    const blob = JSON.stringify(g);
    if (OUTCOME.test(blob)) failures.push(`${g.slug}: contains an outcome promise`);
    if (FEE.test(blob)) failures.push(`${g.slug}: states an exam fee range`);
  }
  assert.deepEqual(failures, [], `claims:\n  ${failures.join('\n  ')}`);
});

test('the JSON-LD builder emits Article, FAQPage and BreadcrumbList', () => {
  const org = { '@type': 'Organization', name: 'DeutschMeister', url: 'https://deutsch-meister.de' };
  for (const g of GUIDES) {
    const blocks = guideJsonLd(g, { organization: org, buildDate: '2026-08-22' });
    const types = blocks.map((b) => b['@type']);
    assert.deepEqual(types, ['Article', 'FAQPage', 'BreadcrumbList'], `${g.slug}: wrong schema set`);

    const [article, faq, crumbs] = blocks;
    assert.equal(article.mainEntityOfPage['@id'], guideUrl(g));
    assert.equal(article.publisher, org);
    assert.equal(faq.mainEntity.length, g.faq.length, `${g.slug}: FAQPage does not cover every question`);
    // The breadcrumb's last item must be this guide, or the trail lies.
    assert.equal(crumbs.itemListElement.at(-1).item, guideUrl(g));
  }
});

// ── exam long-tail pages (backlog d2, 2026-10-26) ──────────────────────────
//
// Each exam page leads its CTA with a tagged door to the matching offer or
// waitlist. The rules, not a list of pages: an offer names a door that exists,
// its link is attributed (ref=leitfaden, onsite, a campaign label, the slug),
// and a page's chrome, schema and cross-links speak the page's language.

test('every guide offer resolves to an existing, attributed door with a campaign label', () => {
  const failures = [];
  for (const [key, spec] of Object.entries(GUIDE_OFFERS)) {
    if (!DOORS[spec.door]) failures.push(`offer ${key}: unknown door ${spec.door}`);
    if (!/^[a-z0-9-]+$/.test(spec.campaign || '')) failures.push(`offer ${key}: campaign "${spec.campaign}" is not a clean label`);
    if (!spec.label) failures.push(`offer ${key}: no button label`);
  }
  for (const g of GUIDES.filter((x) => x.offer)) {
    const spec = GUIDE_OFFERS[g.offer];
    if (!spec) { failures.push(`${g.slug}: unknown offer "${g.offer}"`); continue; }
    const url = new URL(onsiteHref(spec.door, 'leitfaden', g.slug, spec.campaign), 'https://deutsch-meister.de');
    if (url.pathname !== DOORS[spec.door]) failures.push(`${g.slug}: door path changed by the query`);
    for (const [k, v] of [['ref', 'leitfaden'], ['utm_medium', 'onsite'], ['utm_campaign', spec.campaign], ['utm_content', g.slug]]) {
      if (url.searchParams.get(k) !== v) failures.push(`${g.slug}: ${k} is "${url.searchParams.get(k)}", want "${v}"`);
    }
  }
  assert.deepEqual(failures, [], `offer doors:\n  ${failures.join('\n  ')}`);
});

test('the renderer leads with the offer door and never shows the same signup door twice', () => {
  assert.match(renderer, /onsiteHref\(offerSpec\.door, 'leitfaden', guide\.slug, offerSpec\.campaign\)/, 'the offer door must be built with onsiteHref and its campaign');
  assert.match(renderer, /href=\{primary\.href\}/);
  assert.match(renderer, /secondary = offerSpec\s*\?\s*\{ href: doors\.levelTest/, 'with an offer, the second button is the level test');
});

test('an offer copy promises no notification and quotes no price', () => {
  // A waitlist door is a free account with a campaign label. Promising to write
  // to the person would need a consent basis (owner-only), and the telc price
  // is stated only on its sales page while it can be bought.
  const PROMISE = /benachrichtig|informieren wir|melden uns|we will (?:email|notify|let you know)|notify you|\bwaitlist\b|warteliste/i;
  const PRICE = /\d\s?(?:€|euro)\b|€\s?\d/i;
  const failures = [];
  for (const g of GUIDES.filter((x) => x.offer)) {
    const copy = [g.cta.heading, g.cta.body, GUIDE_OFFERS[g.offer].label].join(' ');
    if (PROMISE.test(copy)) failures.push(`${g.slug}: CTA promises a notification or names a waitlist`);
    if (PRICE.test(copy)) failures.push(`${g.slug}: CTA quotes a price`);
  }
  assert.deepEqual(failures, []);
});

test('a guide declares a supported language, and the schema and cross-links follow it', () => {
  const org = { '@type': 'Organization', name: 'DeutschMeister', url: 'https://deutsch-meister.de' };
  for (const g of GUIDES) {
    assert.ok(['de', 'en'].includes(guideLang(g)), `${g.slug}: unsupported lang "${g.lang}"`);
    const [article] = guideJsonLd(g, { organization: org, buildDate: '2026-10-26' });
    assert.equal(article.inLanguage, guideLang(g), `${g.slug}: Article inLanguage`);
  }
  assert.ok(GUIDES.some((g) => guideLang(g) === 'en'), 'expected at least one English guide');
  assert.match(renderer, /guideLang\(g\) === lang/, 'cross-links stay within the page language');
  assert.match(renderer, /lang=\{lang\}/, 'the page declares its own language');
});
