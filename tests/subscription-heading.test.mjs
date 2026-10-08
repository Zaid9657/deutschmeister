// Guard suite: a bilingual screen switches its headings too (revenue agent,
// 2026-10-08).
//
// The finding this closes (revenue backlog b7): the H1 and lead at the top of
// /subscription, the page every in-app limit and a resumed Buy land on, were
// English-only (17f4f91b, 2026-09-03) on a page whose cards and buttons all
// switch with isGerman. A learner who had set the app to German read "Pick up
// where you left off" above German plan cards. The same lines carried two
// claims: "keep learning without limits" (Pro meters every AI feature) and an
// offer to "Buy the level you need once" shown whether or not the course
// section below had a Buy button.
//
// The rules, not a list of lines:
//   1. In every source file under src/ that switches language (it reads
//      isGerman), every <SectionHeading> title, lead and eyebrow that carries
//      words is switched too: the prop's expression reads isGerman (or t() /
//      i18n), or it is a value from data (no string literal at all). A literal
//      in one language fails, whichever language it is. Measured 2026-10-08 on
//      origin/main deb93bc0: 27 such files, 8 headings, 2 failing props (this
//      page's title and lead), so after this commit the class is at zero and
//      the rule is plain, not a ratchet. Files that never switch (the
//      German-only Modelltest screens, the English prerendered pages) are not
//      bilingual and are out of scope.
//   2. /subscription's heading comes from src/lib/subscriptionHeading.js, which
//      answers in both languages for every state, offers a level only when the
//      page shows a Buy button for one, and makes no "without limits" claim.
//   3. The page derives that "Buy button" answer from the same tests as the
//      course cards (checkout id, not coming soon, not owned).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { subscriptionHeadingCopy } from '../src/lib/subscriptionHeading.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const PAGE = 'src/pages/SubscriptionPage.jsx';

/** Comments out (JSX, block, line), line count kept, so a comment quoting copy cannot trip a rule. */
const code = (src) => src
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/^(\s*)\/\/.*$/gm, '$1');

/** Index just past the string literal that opens at i (template ${…} skipped by brace depth). */
function skipString(src, i) {
  const q = src[i];
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') { j += 2; continue; }
    if (q === '`' && c === '$' && src[j + 1] === '{') {
      let d = 1;
      j += 2;
      while (j < src.length && d > 0) {
        if (src[j] === '{') d++;
        else if (src[j] === '}') d--;
        j++;
      }
      continue;
    }
    if (c === q) return j + 1;
    j++;
  }
  return j;
}

/** A JSX opening tag from its '<' to the '>' outside braces and strings. */
export function openingTag(src, i) {
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === '"' || c === "'" || c === '`') { j = skipString(src, j) - 1; continue; }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return src.slice(i, j + 1);
  }
  return src.slice(i);
}

/** The copy-bearing props of a tag: { name, text } with text the literal or the {…} expression. */
export function copyProps(tag) {
  const out = [];
  const re = /\s(title|lead|eyebrow)=/g;
  let m;
  while ((m = re.exec(tag))) {
    const i = m.index + m[0].length;
    if (tag[i] === '"' || tag[i] === "'") {
      out.push({ name: m[1], text: tag.slice(i, skipString(tag, i)) });
    } else if (tag[i] === '{') {
      let depth = 0;
      let j = i;
      for (; j < tag.length; j++) {
        const c = tag[j];
        if (c === '"' || c === "'" || c === '`') { j = skipString(tag, j) - 1; continue; }
        if (c === '{') depth++;
        else if (c === '}' && --depth === 0) break;
      }
      out.push({ name: m[1], text: tag.slice(i + 1, j) });
    }
  }
  return out;
}

/** The string literals in a piece of source, template ${…} parts blanked. */
function literalsIn(text) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '"' || c === "'" || c === '`') {
      const end = skipString(text, i);
      out.push(text.slice(i + 1, end - 1).replace(/\$\{[^}]*\}/g, ' '));
      i = end;
      continue;
    }
    i++;
  }
  return out;
}

const WORDS = /[A-Za-zÄÖÜäöüß]{2}/;
const SWITCH = /\bisGerman\b|\bt\(|\bi18n\b/;

/** A prop whose words are fixed in one language: it holds a worded literal and never switches. */
export const oneLanguage = (prop) => !SWITCH.test(prop.text) && literalsIn(prop.text).some((s) => WORDS.test(s));

const walk = (dir) => readdirSync(join(ROOT, dir)).flatMap((name) => {
  const rel = `${dir}/${name}`;
  if (statSync(join(ROOT, rel)).isDirectory()) return walk(rel);
  return /\.(jsx?|mjs)$/.test(name) ? [rel] : [];
});

/** Every bilingual file's one-language SectionHeading props, as "file:line prop: copy". */
function oneLanguageHeadings() {
  const hits = [];
  let files = 0;
  let headings = 0;
  for (const file of walk('src')) {
    const src = code(read(file));
    if (!/\bisGerman\b/.test(src)) continue;
    files++;
    for (const m of src.matchAll(/<SectionHeading\b/g)) {
      headings++;
      for (const prop of copyProps(openingTag(src, m.index))) {
        if (oneLanguage(prop)) {
          const line = src.slice(0, m.index).split('\n').length;
          hits.push(`${relative(ROOT, join(ROOT, file))}:${line} ${prop.name}: ${prop.text.trim().slice(0, 80)}`);
        }
      }
    }
  }
  return { hits, files, headings };
}

test('the heading parser: one-language props fail, switched props and data pass', () => {
  const props = (jsx) => copyProps(openingTag(jsx, 0));
  for (const jsx of [
    `<SectionHeading level={1} title="Your plan" />`,
    `<SectionHeading title={isSubscribed ? 'Your plan' : 'Pick up where you left off'} />`,
    "<SectionHeading lead={`Your free trial is running (${daysLeft} days left).`} />",
    `<SectionHeading eyebrow='Abo' title={x} />`,
    `<SectionHeading title={a > b ? 'More' : 'Less'} lead="x" />`,
  ]) assert.ok(props(jsx).some(oneLanguage), `should fail: ${jsx}`);
  for (const jsx of [
    `<SectionHeading title={isGerman ? 'Ihr Plan' : 'Your plan'} />`,
    `<SectionHeading title={heading.title} lead={heading.lead} />`,
    `<SectionHeading level={1} title={levelKey} lead={subtitle} />`,
    `<SectionHeading title={t('subscription.title')} />`,
    `<SectionHeading title={isGerman ? 'Eine Stufe: einmal zahlen, behalten' : 'Own a level: pay once, keep it'} lead={isGerman ? \`A \${n}\` : \`B \${n}\`} />`,
    `<SectionHeading align="center" className="mb-4" />`,
  ]) assert.ok(!props(jsx).some(oneLanguage), `should pass: ${jsx}`);
  // An attribute value containing '>' does not end the tag early.
  assert.equal(props(`<SectionHeading title={a > b ? 'A' : 'B'} lead="x" />`).length, 2);
});

test('every SectionHeading on a bilingual screen switches language with it', () => {
  const { hits, files, headings } = oneLanguageHeadings();
  assert.ok(files >= 20, `only ${files} bilingual source files were walked`);
  assert.ok(headings >= 5, `only ${headings} SectionHeadings were found on bilingual screens`);
  assert.deepEqual(
    hits,
    [],
    `a heading on a screen that switches language is fixed in one language; give it an isGerman branch (Sie):\n  ${hits.join('\n  ')}`,
  );
});

const STATES = [
  { name: 'Pro', isSubscribed: true, inTrial: false, daysLeft: 0 },
  { name: 'trial, 1 day', isSubscribed: false, inTrial: true, daysLeft: 1 },
  { name: 'trial, 5 days', isSubscribed: false, inTrial: true, daysLeft: 5 },
  { name: 'trial over', isSubscribed: false, inTrial: false, daysLeft: 0 },
];
const each = (fn) => {
  for (const s of STATES) for (const canBuyLevel of [true, false]) fn({ ...s, canBuyLevel });
};

test('the /subscription heading answers in both languages, in every state', () => {
  // Words only an English sentence carries; none is a German word.
  const ENGLISH = /\b(?:the|your|you|and|is|over|level|choose|pick|buy|keep|left|running)\b/i;
  each((state) => {
    const en = subscriptionHeadingCopy(state, false);
    const de = subscriptionHeadingCopy(state, true);
    for (const part of ['title', 'lead']) {
      assert.ok(en[part] && de[part], `${state.name}: empty ${part}`);
      assert.notEqual(de[part], en[part], `${state.name}: the German ${part} is the English one`);
      assert.doesNotMatch(de[part], ENGLISH, `${state.name}: English in the German ${part}: ${de[part]}`);
      assert.doesNotMatch(de[part], /\b(?:du|dich|dir|dein\w*)\b/i, `${state.name}: du in the German ${part}`);
    }
  });
});

test('the heading offers a level only when the page shows a Buy button for one', () => {
  const OFFERS_LEVEL = /\b(?:buy|add a level course|kaufen)\b/i;
  each((state) => {
    for (const isGerman of [false, true]) {
      const { lead } = subscriptionHeadingCopy(state, isGerman);
      assert.equal(
        OFFERS_LEVEL.test(lead),
        state.canBuyLevel,
        `${state.name}, ${isGerman ? 'de' : 'en'}, canBuyLevel ${state.canBuyLevel}: ${lead}`,
      );
    }
  });
});

test('the heading makes no "without limits" claim and counts the trial days right', () => {
  // Pro is unlimited in content and metered in AI (tests/unlimited-claims.test.mjs);
  // a blanket "without limits" beside a plan choice covers the AI too.
  const NO_LIMITS = /\b(?:unlimited|unbegrenzt\w*|limitless|no\s+limits?|without\s+(?:any\s+)?limits?|ohne\s+(?:jedes\s+)?(?:limit|grenzen|begrenzung))\b/i;
  each((state) => {
    for (const isGerman of [false, true]) {
      const { title, lead } = subscriptionHeadingCopy(state, isGerman);
      assert.doesNotMatch(`${title} ${lead}`, NO_LIMITS, `${state.name}: ${lead}`);
    }
  });
  const trial = (daysLeft, isGerman) =>
    subscriptionHeadingCopy({ isSubscribed: false, inTrial: true, daysLeft, canBuyLevel: false }, isGerman).lead;
  assert.match(trial(1, false), /\(1 day left\)/);
  assert.match(trial(5, false), /\(5 days left\)/);
  assert.match(trial(1, true), /\(noch 1 Tag\)/);
  assert.match(trial(5, true), /\(noch 5 Tage\)/);
});

test('/subscription renders the heading from the lib, with the course cards\' Buy test', () => {
  const src = code(read(PAGE));
  assert.match(src, /import\s*\{\s*subscriptionHeadingCopy\s*\}\s*from\s*'\.\.\/lib\/subscriptionHeading\.js'/);

  const h1 = src.match(/<SectionHeading\b(?=[^>]*\blevel=\{1\})/);
  assert.ok(h1, 'the page H1 is a level-1 SectionHeading');
  const props = Object.fromEntries(copyProps(openingTag(src, h1.index)).map((p) => [p.name, p.text.trim()]));
  assert.equal(props.title, 'heading.title');
  assert.equal(props.lead, 'heading.lead');
  assert.match(src, /const heading = subscriptionHeadingCopy\(\{[^}]*\bcanBuyLevel\b[^}]*\}, isGerman\)/);

  // canBuyLevel applies every test the card does before it shows Buy: the
  // ownership checks of `const owned = …` and the checkout id / coming-soon check.
  const canBuy = src.match(/const canBuyLevel = ([\s\S]*?);\n/);
  assert.ok(canBuy, 'canBuyLevel is derived on the page');
  const owned = src.match(/const owned = ([^;]+);/);
  assert.ok(owned, 'the course card decides ownership in `const owned = …`');
  for (const id of owned[1].match(/\b(?:hasProduct|owns\w+)\b/g)) {
    assert.ok(canBuy[1].includes(id), `canBuyLevel skips the card's ownership check ${id}`);
  }
  assert.match(src, /c\.comingSoon \|\| !c\.variantId \?/, 'the card shows Buy only for a live course with a checkout id');
  assert.match(canBuy[1], /c\.variantId && !c\.comingSoon/);
});
