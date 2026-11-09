import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { color, font, motionLinie, emailBrand } from '../src/data/design-tokens.js';
import { ALL_LEVELS, SELLABLE_LEVELS, COMING_SOON_LEVELS, courseForLevel } from '../src/data/pricing.js';
import { salesCurriculum } from '../astro-site/src/data/salesCurriculum.js';
import { curriculumFor } from '../src/data/curricula/index.js';
import { PRO_OFFER } from '../src/data/offers.js';
import { PRO_DAILY_LIMIT, PRO_WRITING_EVALUATIONS_PER_MONTH } from '../src/data/marketing.js';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const contrast = (a, b) => {
  const lum = (hex) => hex.slice(1).match(/../g).map((v) => parseInt(v, 16) / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + .05) / (lo + .05);
};
test('Concept 4 uses the sampled palette, self-hosted serif, and accessible action text', () => {
  assert.equal(color.siegel, '#035E53'); assert.equal(color.footer, '#05463F');
  assert.equal(color.coral, '#F95841'); assert.equal(color.siegelWash, '#EDF8F3');
  assert.match(font.display, /Fraunces/);
  assert.ok(contrast(color.white, color.coral) >= 3, 'large bold coral entry text is AA');
  assert.ok(contrast(color.ink, color.coral) >= 4.5, 'small coral controls use dark ink');
  for (const bg of [color.siegel, color.footer, color.coralAccessible]) assert.ok(contrast(color.white, bg) >= 4.5, `${bg}: white action text is AA`);
  for (const fg of [color.ink, color.graphite, color.siegel]) assert.ok(contrast(fg, color.siegelWash) >= 4.5);
  assert.notEqual(emailBrand.siegel, color.siegel, 'transactional functions are explicitly outside this build');
});
test('all approved scenes exist as responsive WebP pairs with explicit layout and loading hints', () => {
  const names = ['hero', 'pricing-hero', 'a12-reception', 'scene-cafe', 'scene-work', 'scene-doctor', 'tram-route', 'cando-appointment', 'cando-flat', 'cando-chat', 'cando-market'];
  for (const name of names) {
    const pair = readdirSync(new URL('../public/art/scenes/', import.meta.url)).filter((f) => f.startsWith(`${name}-`));
    assert.equal(pair.length, 2, name); assert.ok(pair.some((f) => f.endsWith('-800.webp')), name);
  }
  const scene = read('astro-site/src/components/concept/Scene.astro');
  for (const attr of ['srcset=', 'sizes=', 'width={width}', 'height={height}', "loading={hero ? 'eager' : 'lazy'}", "fetchpriority={hero ? 'high' : undefined}"]) assert.ok(scene.includes(attr), attr);
  assert.match(scene, /alt=\{alt\}/);
});
test('the money pages use the approved compositions and no replaced train board or station art', () => {
  const home = read('astro-site/src/pages/index.astro');
  assert.match(home, /You want to learn German/); assert.match(home, /Where do you start/);
  for (const scene of ['hero', 'scene-cafe', 'scene-work', 'scene-doctor']) assert.ok(home.includes(`'${scene}'`) || home.includes(`"${scene}"`));
  assert.match(home, /<FirstStop/); assert.match(home, /<RouteBand/); assert.match(home, /<Offers/);
  const pricing = read('astro-site/src/pages/pricing.astro');
  assert.match(pricing, /Pay once for your course/); assert.match(pricing, /Practise more if you want/);
  assert.match(read('astro-site/src/pages/courses/[level].astro'), /You can introduce yourself\. Now handle/);
  for (const file of ['LineBoard.astro', 'StationArt.astro', 'Ticket.astro', 'LineSection.astro']) assert.equal(existsSync(new URL(`../astro-site/src/components/linie/${file}`, import.meta.url)), false);
});
test('only A1.2 is sold; all later levels have coming-next data and no purchasable variant', () => {
  assert.deepEqual(SELLABLE_LEVELS, ['a1.2']); assert.deepEqual(COMING_SOON_LEVELS, ALL_LEVELS.slice(2));
  assert.equal(courseForLevel('a1.1'), null);
  const variant = read('astro-site/src/lib/courseVariants.js'); assert.match(variant, /c\.comingSoon \? ''/);
  const door = read('astro-site/src/components/concept/PurchaseDoor.astro');
  assert.ok(door.indexOf('course?.comingSoon ?') < door.indexOf('course?.variantId ?'));
  assert.match(door, /data-course-door=\{level\}/); assert.match(door, /data-course-key=\{course.key\}/);
  assert.doesNotMatch(read('astro-site/src/pages/courses/[level].astro').split('  {coming ?')[1].split(': <>')[0], /eur\(|data-course-variant/);
});
test('the A1.2 can-dos, all twelve lessons and every unit are derived from the live curriculum', () => {
  const live = curriculumFor('a1.2'); const sales = salesCurriculum('a1.2');
  assert.deepEqual(sales.lessons.map((l) => l.id), live.lektionen.map((l) => l.id));
  assert.equal(sales.units.length, live.checkpoints.length);
  assert.deepEqual(sales.units.flatMap((u) => u.lessons).map((l) => l.id), live.lektionen.map((l) => l.id));
  sales.units.forEach((u, i) => { assert.equal(u.checkpoint.id, live.checkpoints[i].id); assert.equal(u.lessons.at(-1).nr, u.checkpoint.afterLektion); });
  for (const o of sales.outcomes) assert.equal(o.source, live.lektionen.find((l) => l.id === o.lessonId).canDo[o.index]);
  assert.equal(salesCurriculum('a2.1'), null);
});
test('AI Practice offers derived writing/X-Ray allowances, no speaking count or recurring course promise', () => {
  const lines = PRO_OFFER.lines.join(' ');
  assert.ok(lines.includes(String(PRO_DAILY_LIMIT))); assert.ok(lines.includes(String(PRO_WRITING_EVALUATIONS_PER_MONTH)));
  assert.match(lines, /AI speaking practice/); assert.doesNotMatch(lines, /\d+ (AI )?speaking|all.*levels|every.*level|unlimited/i);
  assert.match(lines, /course access sold separately/);
});
test('calm motion is readable at rest, uses token tiers and only transform/opacity frames', () => {
  assert.deepEqual(Object.values(motionLinie.duration), ['140ms', '220ms', '420ms', '800ms']);
  const motion = read('astro-site/src/components/concept/Motion.astro');
  assert.match(motion, /prefers-reduced-motion: reduce/); assert.match(motion, /media\.matches/);
  assert.match(motion, /motionLinie\.duration\.signature/); assert.match(motion, /motionLinie\.duration\.section/);
  assert.match(motion, /translateY/); assert.match(motion, /scaleX/); assert.match(motion, /unobserve/);
  assert.doesNotMatch(motion, /filter:|clipPath:|strokeDashoffset:|height:|width:/);
  const css = read('astro-site/src/styles/concept4.css');
  assert.doesNotMatch(css, /\[data-c4-reveal\][^{]*\{[^}]*opacity:\s*0/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
});
test('both chrome implementations use the new shared stylesheet, native footer disclosures and the DM mark', () => {
  assert.match(read('astro-site/src/layouts/Layout.astro'), /styles\/concept4.css/);
  assert.match(read('src/index.css'), /styles\/concept4.css/);
  for (const path of ['src/components/Navbar.jsx', 'src/components/Footer.jsx', 'astro-site/src/layouts/Layout.astro']) assert.match(read(path), /c4-site-(nav|footer)/);
  assert.match(read('src/components/Logo.jsx'), />DM<\/span>/);
  assert.match(read('src/components/Logo.jsx'), /aria-label=\{!showWordmark \? 'DeutschMeister' : undefined\}/, 'mark-only logos retain an accessible name');
  assert.match(read('src/components/BottomNav.jsx'), /border-rule bg-white\/95/);
});
