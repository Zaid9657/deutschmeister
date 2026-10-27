// The /vergleich/ pages: what they may say about us and about the three
// competitors they name (UWG §5 misleading, §6 comparative advertising).
//
// Found 2026-10-25 and closed here, each as a rule over both byte-identical
// twins of src/data/competitorComparisons.js and the page that renders them:
//   - outcome promises: "denselben Lerneffekt" (also in the FAQPage JSON-LD)
//     and "Deutschmeister bringt dich durch die Prüfung" as the Duolingo <h1>;
//   - a Lingoda price comparison false on the site's own figures ("weniger als
//     eine einzige Lingoda-Stunde"), unstamped competitor prices, and a footer
//     that certified itself "nach UWG §6 zulässig";
//   - copy that denied speaking features the same page concedes to Babbel and
//     Duolingo, a Sentence X-Ray uniqueness claim, and unsourced claims about
//     Duolingo's quality;
//   - "Kein eigenes Zertifikat" although every finished course prints a
//     Teilnahmebescheinigung, and "Kein Gamification" beside a day streak;
//   - an ad-free cell marked with a red ✗ and an ad-carrying one with a green ✓;
//   - "480 Dialoge" (480 dialogue LINES), "24 Podcast-Folgen" (14 published),
//     a "Stand: Mai 2026" stamp under our own counts and dateModified = build date.
// Competitor facts may only be removed or softened; the stamps are never
// advanced here (CLAUDE.md, docs/agents/PROTOCOL.md).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PLANS, deEur } from '../src/data/pricing.js';
import { LISTENING_DIALOGUE_COUNT } from '../src/data/marketing.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const page = read('astro-site/src/pages/vergleich/[slug].astro');
const hub = read('astro-site/src/pages/vergleich/index.astro');

const twins = await Promise.all(
  ['src/data', 'astro-site/src/data'].map(async (root) => {
    const mod = await import(`../${root}/competitorComparisons.js`);
    return { root, data: mod.default, mod };
  }),
);

/** Every string value in a nested object or array. */
const stringsIn = (value, out = []) => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => stringsIn(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => stringsIn(v, out));
  return out;
};

/** [competitor, location, text] for every string of every competitor. */
function* cells(data) {
  for (const [slug, c] of Object.entries(data)) {
    for (const [key, value] of Object.entries(c)) {
      for (const text of stringsIn(value)) yield [slug, key, text];
    }
  }
}

test('no outcome promise: neither the comparisons nor the built pages may claim a result', () => {
  // The banned literals the built-HTML gate holds (scripts/check-built-html.mjs),
  // read from there so the two lists cannot drift, plus the card title shape.
  const block = read('scripts/check-built-html.mjs').match(/const BANNED_LITERALS = \[([\s\S]*?)\n\];/);
  const code = block[1].split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  const banned = [...code.matchAll(/'([^']+)'/g)].map((m) => m[1].toLowerCase());
  for (const literal of ['denselben lerneffekt', 'bringt dich durch die prüfung']) {
    assert.ok(banned.includes(literal), `check-built-html.mjs must ban "${literal}"`);
  }
  const OUTCOME = /\bPrüfung bestehen\b|garantiert|you will pass|sicher bestehen|denselben Lerneffekt/i;
  for (const { root, data } of twins) {
    for (const [slug, key, text] of cells(data)) {
      for (const literal of banned) assert.ok(!text.toLowerCase().includes(literal), `${root} ${slug}.${key}: banned literal "${literal}"`);
      assert.doesNotMatch(text, OUTCOME, `${root} ${slug}.${key}: outcome promise — "${text.slice(0, 100)}"`);
    }
  }
});

test('every competitor price is stamped, and no comparison derives a claim the figures contradict', () => {
  // Our own figures, derived from pricing.js, are removed first; whatever euro
  // figure is left is a competitor's and must sit in a stamped place: the
  // priceRange or a table row whose feature carries "Stand:".
  const ours = [PLANS.monthly.price, PLANS.yearly.price, PLANS.yearly.asMonthly].map(deEur);
  const EURO = /€\s?\d|\d[\d.,]*\s?€/;
  for (const { root, data } of twins) {
    for (const [slug, c] of Object.entries(data)) {
      assert.match(c.priceRange, /Stand: /, `${root} ${slug}: the hub card's price carries no stamp`);
      const stampedRows = new Set(c.comparisonTable.filter((r) => /Stand: /.test(r.feature)));
      for (const [key, value] of Object.entries(c)) {
        if (key === 'priceRange') continue;
        const items = key === 'comparisonTable' ? value.filter((r) => !stampedRows.has(r)) : [value];
        for (const text of stringsIn(items)) {
          const rest = ours.reduce((t, figure) => t.split(figure).join(' '), text);
          assert.doesNotMatch(rest, EURO, `${root} ${slug}.${key}: an unstamped competitor price — "${text.slice(0, 100)}"`);
          assert.doesNotMatch(text, /weniger als eine (?:einzige )?[\w-]*Stunde/i, `${root} ${slug}.${key}: a per-hour conclusion the site's own figures contradict`);
        }
      }
    }
  }
  // The page states its data date; it does not certify itself lawful.
  assert.doesNotMatch(page, /UWG\s*§\s*6\s+zulässig|zulässig nach UWG/i, 'the footer self-certifies "nach UWG §6 zulässig"');
  assert.match(page, /Vergleichsdaten Stand: Mai 2026\./, 'the competitor data stamp stays (never advanced here)');
});

test('the comparisons never deny what they concede, and claim no uniqueness or unsourced competitor quality', () => {
  // A page that lists Babbel Speak and Duolingo Roleplay as AI conversations
  // may not open with "only one lets you really practise speaking" or say
  // Duolingo users only type words in order.
  const DENIAL = /\bnur eine\b[^.]*\bsprechen\b|Wörter in die richtige Reihenfolge|nicht nur Multiple Choice|wirklich sprechen üben/i;
  const UNIQUE = /einzigartig|kein anderes Tool|\bunique\b|\bonly tool\b/i;
  // Claims about Duolingo with no source on record, removed 2026-10-25 — only
  // re-add one with the vendor's own page and its date.
  const UNSOURCED = /Tiefe ab B1 stark begrenzt|TTS-generiert|keine tiefgehenden Erklärungen|reichen für Goethe oder telc nicht aus/i;
  for (const { root, data } of twins) {
    for (const [slug, c] of Object.entries(data)) {
      const conceded = c.comparisonTable.some((r) => /Gespräch/.test(r.them) && !/^✗/.test(r.them));
      for (const [key, text] of [...cells({ [slug]: c })].map(([, k, t]) => [k, t])) {
        if (conceded) assert.doesNotMatch(text, DENIAL, `${root} ${slug}.${key}: denies the AI conversations the table concedes — "${text.slice(0, 100)}"`);
        assert.doesNotMatch(text, UNIQUE, `${root} ${slug}.${key}: an unsourced uniqueness claim`);
        assert.doesNotMatch(text, UNSOURCED, `${root} ${slug}.${key}: an unsourced competitor-quality claim`);
      }
    }
  }
});

test('our own cells say what the product does: a certificate per course, a day streak', () => {
  // Every finished course prints a Teilnahmebescheinigung (CourseCertificatePage),
  // and the dashboard shows a day streak (DashboardPage). The table may not deny either.
  assert.match(read('src/pages/CourseCertificatePage.jsx'), /Teilnahmebescheinigung/, 'the certificate page this rule leans on');
  assert.match(read('src/pages/DashboardPage.jsx'), /Day streak/, 'the streak this rule leans on');
  const NO_CERTIFICATE = /kein(?:e[nmr]?|en)? eigenes? Zertifikat|stellt kein\w* (?:eigenes )?Zertifikat aus/i;
  const NO_STREAK = /\bkein(?:e)? Gamification\b|\bkeine Streaks?\b/i;
  for (const { root, data } of twins) {
    for (const [slug, key, text] of cells(data)) {
      assert.doesNotMatch(text, NO_CERTIFICATE, `${root} ${slug}.${key}: denies the course certificate`);
      assert.doesNotMatch(text, NO_STREAK, `${root} ${slug}.${key}: denies the day streak`);
    }
    const certificateRow = data.lingoda.comparisonTable.find((r) => /bescheinigung|zertifikat/i.test(r.feature));
    assert.match(certificateRow.us, /^✓ Teilnahmebescheinigung/, `${root}: our certificate cell`);
    assert.match(certificateRow.us, /kein Goethe-\/telc-Ergebnis/, `${root}: and what it is not`);
    const streakRow = data.duolingo.comparisonTable.find((r) => /Gamification/.test(r.feature));
    assert.match(streakRow.us, /Streak/, `${root}: our gamification cell names the streak`);
  }
});

test('the status symbols are read from the learner\'s side: ad-free is never a red ✗', () => {
  // The renderer colours a cell by its leading symbol (vergleich/[slug].astro
  // statusColor). Written as "has the thing", our ad-free product showed a red
  // ✗ and Duolingo's ads a green ✓.
  const AD_FREE = /keine Werbung|werbefrei|ad-free|no ads/i;
  let rows = 0;
  for (const { root, data } of twins) {
    for (const [slug, c] of Object.entries(data)) {
      // The advertising rows (a "free version" cell may mention ads in passing).
      for (const row of c.comparisonTable.filter((r) => /Werbung|advert/i.test(r.feature))) {
        for (const [side, cell] of [['us', row.us], ['them', row.them]]) {
          rows += 1;
          if (AD_FREE.test(cell)) assert.ok(!cell.startsWith('✗'), `${root} ${slug} ${side}: an ad-free cell marked ✗ — "${cell}"`);
          else assert.ok(!cell.startsWith('✓'), `${root} ${slug} ${side}: an ad-carrying cell marked ✓ — "${cell}"`);
        }
      }
    }
  }
  assert.ok(rows >= 4, `expected the Werbung rows of Babbel and Duolingo in both twins, found ${rows}`);
  assert.match(page, /statusColor = \(t\) => \(t\.startsWith\('✓'\)/, 'the renderer still colours by the leading symbol — revisit this rule if it changes');
});

test('"Was drin ist" counts what the product contains, and the page claims no fresher date than its data', () => {
  // 480 is dialogue LINES (marketing.js LISTENING_DIALOGUE_COUNT); a tile may
  // show it only labelled as lines. The podcast tile waits for the owner's 24
  // vs 14 decision. The Stand stamp dates the competitor data, not our counts.
  const stats = page.match(/const STATS = \[([\s\S]*?)\];/);
  assert.ok(stats, 'the STATS block of vergleich/[slug].astro');
  for (const line of stats[1].split('\n').filter((l) => l.includes('value:'))) {
    if (/LISTENING_DIALOGUE_COUNT/.test(line)) assert.match(line, /Dialogzeilen/, `480 dialogue lines labelled as dialogues: ${line.trim()}`);
    assert.doesNotMatch(line, /PODCAST_EPISODE_COUNT/, 'the podcast tile is back before the owner settled the count');
  }
  assert.ok(LISTENING_DIALOGUE_COUNT > 0);
  const section = page.match(/Was drin ist<\/p>([\s\S]*?)<\/section>/);
  assert.ok(section, 'the "Was drin ist" section');
  assert.doesNotMatch(section[1], /Stand:/, 'a competitor-data stamp under our own counts');

  // dateModified is the comparison data's date, exported once by the data.
  for (const { root, mod } of twins) assert.match(mod.COMPARISON_DATA_DATE ?? '', /^\d{4}-\d{2}-\d{2}$/, `${root}: COMPARISON_DATA_DATE`);
  for (const [name, src] of [['vergleich/[slug].astro', page], ['vergleich/index.astro', hub]]) {
    assert.doesNotMatch(src, /BUILD_DATE/, `${name}: stamps the build date as dateModified`);
    assert.match(src, /dateModified: COMPARISON_DATA_DATE/, `${name}: dateModified must be the comparison data's date`);
  }
  assert.ok(existsSync(join(ROOT, 'astro-site/src/lib/siteMeta.js')));
});
