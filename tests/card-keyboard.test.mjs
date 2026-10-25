// A clickable card must be a real control (X-077).
//
// src/components/ui/Card.jsx renders a <div> unless `as` names another element,
// and `interactive` only adds the raised, pressable styling. The vocabulary
// level cards, the grammar topic cards and both podcast lists attached onClick
// to that div: no role, no tabIndex, no key handler — keyboard learners could
// not open a sublevel's words, a grammar topic or a podcast, and nothing in the
// lint config (no jsx-a11y) would have caught it.
//
// The rule, not a list of files: every <Card> under src/ that takes onClick also
// sets `as` to a native interactive element — a <button type="button"> for an
// action, a Link or an <a href> for a destination. (A card that only navigates
// may drop onClick altogether and be the link itself.) A new screen is covered
// without editing this file.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseSource, listSourceFiles } from './helpers/supabaseQueries.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(node, visit) {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'range') continue;
    const child = node[key];
    if (Array.isArray(child)) child.forEach((c) => walk(c, visit));
    else if (child && typeof child.type === 'string') walk(child, visit);
  }
}

/** Every <Card …> opening tag in a source: its attributes by name, and where it is. */
function cardTags(source, file) {
  const tags = [];
  walk(parseSource(source, file), (node) => {
    if (node.type !== 'JSXOpeningElement' || node.name.type !== 'JSXIdentifier' || node.name.name !== 'Card') return;
    const attrs = new Map();
    for (const a of node.attributes) {
      if (a.type !== 'JSXAttribute') continue;
      const v = a.value;
      const value = v?.type === 'Literal' ? v.value
        : v?.type === 'JSXExpressionContainer' && v.expression.type === 'Identifier' ? `{${v.expression.name}}`
          : v ? '{…}' : true;
      attrs.set(a.name.name, value);
    }
    tags.push({ file, line: node.loc.start.line, attrs });
  });
  return tags;
}

/** What is wrong with one card tag, or null. */
export function cardProblem({ attrs }) {
  const as = attrs.get('as');
  if (attrs.has('onClick') && !as) return 'onClick on a <div> card: set as="button" type="button", or make it a Link / <a href>';
  if (as === 'button' && attrs.get('type') !== 'button') return 'a button card needs type="button"';
  if (as === '{Link}' && !attrs.has('to')) return 'a Link card needs `to`';
  if (as === 'a' && !attrs.has('href')) return 'an <a> card needs `href`';
  return null;
}

const problemsIn = (source, file = 'snippet.jsx') => cardTags(source, file)
  .map((tag) => ({ tag, problem: cardProblem(tag) }))
  .filter((x) => x.problem);

test('the detector: a clickable div card fails; native buttons and links pass', () => {
  assert.equal(problemsIn('const x = <Card interactive onClick={open} className="p-4">A</Card>;').length, 1);
  assert.equal(problemsIn('const x = <Card as="button" onClick={open}>A</Card>;').length, 1, 'a button card without type="button"');
  assert.equal(problemsIn('const x = <Card as={Link}>A</Card>;').length, 1, 'a Link card without `to`');
  assert.equal(problemsIn('const x = <Card interactive as="button" type="button" onClick={() => open(1)}>A</Card>;').length, 0);
  assert.equal(problemsIn('const x = <Card interactive as={Link} to="/vocabulary">A</Card>;').length, 0);
  assert.equal(problemsIn('const x = <Card as="a" href="/grammar/a1.1/">A</Card>;').length, 0);
  assert.equal(problemsIn('const x = <Card tone="sunk" className="p-4">reference</Card>;').length, 0);
});

test('every clickable <Card> under src/ is a native button or link', () => {
  const failures = [];
  let cards = 0;
  for (const abs of listSourceFiles(['src'], ROOT)) {
    const source = readFileSync(abs, 'utf8');
    if (!source.includes('<Card')) continue;
    const rel = path.relative(ROOT, abs);
    for (const tag of cardTags(source, rel)) {
      cards += 1;
      const problem = cardProblem(tag);
      if (problem) failures.push(`${rel}:${tag.line}: ${problem}`);
    }
  }
  assert.ok(cards > 100, `only ${cards} <Card> tags found — is the scan reading src/?`);
  assert.deepEqual(failures, [], `keyboard-inaccessible cards:\n  ${failures.join('\n  ')}`);
});

test('the four lists that were mouse-only now open from the keyboard', () => {
  const tagsOf = (file) => cardTags(readFileSync(path.join(ROOT, file), 'utf8'), file);
  const vocab = tagsOf('src/pages/VocabularySectionPage.jsx').find((t) => t.attrs.get('as') === '{Link}');
  assert.ok(vocab, 'the vocabulary level card is a Link');
  assert.match(readFileSync(path.join(ROOT, 'src/pages/VocabularySectionPage.jsx'), 'utf8'),
    /to=\{canAccess \? `\/level\/\$\{level\}\?tab=vocabulary` : '\/subscription'\}/);
  const grammar = tagsOf('src/components/GrammarTopicCard.jsx')[0];
  assert.equal(grammar.attrs.get('as'), 'a', 'a grammar topic is a full-page link to the Astro lesson');
  assert.match(readFileSync(path.join(ROOT, 'src/components/GrammarTopicCard.jsx'), 'utf8'), /href=\{`\/grammar\/\$\{level\}\/\$\{topic\.slug\}\/`\}/);
  const tab = tagsOf('src/components/level/PodcastsTab.jsx').find((t) => t.attrs.has('onClick'));
  assert.equal(tab.attrs.get('as'), 'button', 'a podcast card opens the player as a button');
  const page = tagsOf('src/pages/PodcastsPage.jsx').find((t) => t.attrs.get('as') === '{Link}');
  assert.ok(page && page.attrs.has('to'), 'a podcast row on /podcasts links to its level tab');
});
