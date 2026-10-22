import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const hub = readFileSync(new URL('../astro-site/src/pages/grammar/index.astro', import.meta.url), 'utf8');
const lesson = readFileSync(new URL('../astro-site/src/pages/grammar/[level]/[slug].astro', import.meta.url), 'utf8');

async function firstPublishedTopic(topics) {
  const frontmatter = hub.split('---')[1].replace(/^import .+;$/gm, '');
  const result = await vm.runInNewContext(`(async () => { ${frontmatter}; return firstTopic; })()`, {
    getAllTopics: async () => topics,
    SUB_LEVELS: ['a1.1', 'a1.2'],
    LEVEL_META: { 'a1.1': { label: 'A1.1' }, 'a1.2': { label: 'A1.2' } },
    ORGANIZATION: {},
  });
  return result;
}

test('grammar hub introductory link follows the first published topic', async () => {
  // The loader has excluded nouns-gender, so no hub shortcut may still link it.
  const firstTopic = await firstPublishedTopic([
    { id: 'visible', slug: 'personal-pronouns', sub_level: 'a1.1', title_en: 'Personal pronouns' },
  ]);
  const introduction = hub.match(/New to German\?([\s\S]*?)<\/p>/)?.[1];
  assert.ok(introduction, 'the grammar introduction must still exist');
  const href = introduction.match(/href=(?:"([^"]*)"|\{(`[^`]*`)\})/);
  assert.ok(href, 'the grammar introduction must link its starting topic');
  const destination = href[1] ?? vm.runInNewContext(href[2], { firstTopic });
  assert.equal(destination, '/grammar/a1.1/personal-pronouns/');
  assert.match(introduction, /\{firstTopic\.title\}/, 'the introduction must name the topic it links');
});

test('grammar hub start links disappear when no published topic exists', async () => {
  assert.equal(await firstPublishedTopic([]), undefined);
  assert.match(hub, /\{firstTopic && \(\s*<p\b[^>]*>\s*New to German\?/,
    'an empty published path must not leave an introductory topic link');
});

test('grammar hub start card names the level of its first published topic', async () => {
  const firstTopic = await firstPublishedTopic([
    { id: 'visible', slug: 'past-tense', sub_level: 'a1.2', title_en: 'Past tense' },
  ]);
  assert.equal(firstTopic.level, 'a1.2');
  const title = hub.match(/id="gm-hero-title"[^>]*>([\s\S]*?)<\/p>/)?.[1];
  assert.match(title, /\{firstTopic\.level\.toUpperCase\(\)\} · Topic 1: \{firstTopic\.title\}/,
    'hiding all earlier-level topics must not leave an A1.1 label on another level');
});

test('grammar Questions contents link targets the FAQ section', () => {
  assert.match(lesson, /href: '#questions', label: 'Questions', show: Boolean\(seoExtra\?\.faqs\?\.length\)/);
  const sections = [...lesson.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)];
  const targets = sections.filter(([, attributes]) => /\bid="questions"/.test(attributes));
  assert.equal(targets.length, 1, 'the Questions anchor must have one destination');
  assert.match(targets[0][2], /seoExtra\.faqHeading/, 'Questions must open the FAQ heading');
  assert.doesNotMatch(targets[0][2], /Related Topics/, 'Questions must not jump to related lessons');
  assert.match(targets[0][1], /scroll-mt-24/, 'the FAQ anchor needs the lesson header offset');
});
