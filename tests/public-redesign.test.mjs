// Pass 3 visual contract. Commerce/access guards stay in their existing suites.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { color, fontPreloads, fontFaces } from '../src/data/design-tokens.js';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('the shared redesign has no old display families or transit compositions', () => {
  const tokens = read('src/data/design-tokens.js');
  assert.doesNotMatch(tokens, /Fraunces|Nunito Sans|Archivo/);
  const css = read('src/styles/public-system.css');
  assert.equal(css, read('astro-site/src/styles/public-design.css'));
  assert.match(css, /\.dm-key \{ border-radius: theme\('borderRadius.control'\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.dm-site-footer \*:focus-visible/);
  assert.match(css, /@media \(max-width: 639px\)/);
  assert.match(css, /\.dm-proof-scene/);
  for (const p of ['index.astro', 'courses/index.astro', 'courses/[level].astro']) {
    const s = read(`astro-site/src/pages/${p}`);
    assert.doesNotMatch(s, /<LineBoard|<LineSection|<StationArt|aria-label="The line"/);
    assert.match(s, /<ProductWindow/);
  }
});

test('the packaged fonts have valid WOFF tables, German glyph support and a bounded preload cost', () => {
  let bytes = 0;
  for (const path of fontPreloads) bytes += statSync(new URL(`../public${path}`, import.meta.url)).size;
  assert.ok(bytes <= 125000, `preload fonts: ${bytes} bytes, budget 125000`);
  for (const entry of fontFaces) {
    const src = /url\('([^']+)'\)/.exec(entry['@font-face'].src)?.[1];
    if (!src) continue;
    const data = readFileSync(new URL(`../public${src}`, import.meta.url));
    assert.equal(data.toString('ascii', 0, 4), 'wOFF');
    assert.equal(data.readUInt32BE(8), data.length);
    const tables = new Map();
    for (let i = 0; i < data.readUInt16BE(12); i++) {
      const p = 44 + i * 20;
      const tag = data.toString('ascii', p, p + 4);
      const offset = data.readUInt32BE(p + 4), length = data.readUInt32BE(p + 8), original = data.readUInt32BE(p + 12);
      const packed = data.subarray(offset, offset + length);
      const table = length < original ? inflateSync(packed) : packed;
      assert.equal(table.length, original, `${src}: ${tag}`);
      const padded = Buffer.alloc(Math.ceil(original / 4) * 4); table.copy(padded);
      if (tag === 'head') padded.writeUInt32BE(0, 8);
      let checksum = 0;
      for (let n = 0; n < padded.length; n += 4) checksum = (checksum + padded.readUInt32BE(n)) >>> 0;
      assert.equal(checksum, data.readUInt32BE(p + 16), `${src}: ${tag} checksum`);
      tables.set(tag, table);
    }
    const count = tables.size, power = 2 ** Math.floor(Math.log2(count));
    const header = Buffer.alloc(12 + count * 16);
    header.writeUInt32BE(0x00010000, 0); header.writeUInt16BE(count, 4);
    header.writeUInt16BE(power * 16, 6); header.writeUInt16BE(Math.log2(power), 8);
    header.writeUInt16BE(count * 16 - power * 16, 10);
    let offset = header.length, row = 12; const chunks = [header];
    for (const [tag, table] of tables) {
      const padded = Buffer.alloc(Math.ceil(table.length / 4) * 4); table.copy(padded);
      const forChecksum = Buffer.from(padded);
      if (tag === 'head') forChecksum.writeUInt32BE(0, 8);
      let sum = 0;
      for (let i = 0; i < forChecksum.length; i += 4) sum = (sum + forChecksum.readUInt32BE(i)) >>> 0;
      header.write(tag, row, 4, 'ascii'); header.writeUInt32BE(sum, row + 4);
      header.writeUInt32BE(offset, row + 8); header.writeUInt32BE(table.length, row + 12);
      row += 16; offset += padded.length; chunks.push(padded);
    }
    const sfnt = Buffer.concat(chunks); let wholeChecksum = 0;
    for (let i = 0; i < sfnt.length; i += 4) wholeChecksum = (wholeChecksum + sfnt.readUInt32BE(i)) >>> 0;
    assert.equal(wholeChecksum, 0xB1B0AFBA, `${src}: reconstructed OpenType checksum`);
    const cmap = tables.get('cmap');
    let mapped = null;
    for (let i = 0; i < cmap.readUInt16BE(2); i++) {
      const offset = cmap.readUInt32BE(8 + 8 * i);
      if (cmap.readUInt16BE(offset) !== 4) continue;
      const segments = cmap.readUInt16BE(offset + 6) / 2;
      const glyph = (code) => {
        for (let s = 0; s < segments; s++) {
          const end = cmap.readUInt16BE(offset + 14 + 2 * s);
          const start = cmap.readUInt16BE(offset + 16 + 2 * segments + 2 * s);
          if (code < start || code > end) continue;
          const delta = cmap.readInt16BE(offset + 16 + 4 * segments + 2 * s);
          const position = offset + 16 + 6 * segments + 2 * s;
          const range = cmap.readUInt16BE(position);
          return range ? (cmap.readUInt16BE(position + range + 2 * (code - start)) + delta) & 65535 : (code + delta) & 65535;
        }
        return 0;
      };
      if (glyph(0x00fc)) { mapped = glyph; break; }
    }
    assert.ok(mapped, `${src}: Unicode map`);
    const loca = tables.get('loca');
    for (const char of 'ÄÖÜäöüßé€—’') {
      const g = mapped(char.codePointAt(0));
      assert.ok(g > 0 && loca.readUInt32BE(g * 4 + 4) > loca.readUInt32BE(g * 4), `${src}: ${char} has a drawable glyph`);
    }
  }
});

test('new mark and real examples reach both public renderers', () => {
  const favicon = read('public/favicon.svg');
  assert.ok(favicon.includes(color.siegel));
  assert.ok(favicon.includes('M5 5h38v29H27L15 43v-9H5V5Z'));
  for (const path of ['src/components/Logo.jsx', 'astro-site/src/components/BrandMark.astro']) {
    assert.ok(read(path).includes('M5 5h38v29H27L15 43v-9H5V5Z'));
  }
  const course = read('astro-site/src/pages/courses/[level].astro');
  assert.ok(course.indexOf('data-hero-door') < course.indexOf('<ProductWindow'), 'course action precedes the example in reading and keyboard order');
  const grammarWindow = read('astro-site/src/components/proof/GrammarWindow.astro');
  assert.match(grammarWindow, /getTopicFull\(level, topic.slug\)/);
  assert.match(grammarWindow, /The guided course is Im Bau and is not for sale/);
  assert.match(grammarWindow, /data-practice-preview/);
  const topic = read('astro-site/src/pages/grammar/[level]/[slug].astro');
  assert.match(topic, /examples\[0\]\.sentence_de/);
  assert.match(topic, /aria-label="Example from this lesson"/);
  const exam = read('astro-site/src/components/proof/ExamTaskPreview.astro');
  assert.match(exam, /examTask\(examKey\)/);
  assert.match(exam, /Keine offizielle Prüfungsaufgabe/);
});
