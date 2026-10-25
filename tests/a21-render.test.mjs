import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import Module, { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
// The committed A1 surface. A pinned commit is absent from CI's shallow clone, so the baseline is HEAD:
// the check guards uncommitted engine edits and passes trivially on a clean checkout. To compare
// against another commit (as the 2026-10-25 merge did, against live-fixes 1263407), set
// A1_RENDER_BASELINE=<sha> locally.
const A1_BASELINE = process.env.A1_RENDER_BASELINE || 'HEAD';
const changed = new Set(execFileSync('git', ['-C', root, 'diff', '--name-only', '--diff-filter=M', A1_BASELINE, '--', 'src', 'netlify'], { encoding: 'utf8' }).trim().split(/\r?\n/));
async function renderer(before = false) {
const bundle = await build({
  stdin: { contents: `import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {MemoryRouter} from 'react-router-dom'; import {Surface, A1Surface, modes} from './tests/fixtures/a2-render.jsx'; export {modes}; export const render = (mode) => renderToStaticMarkup(<MemoryRouter><Surface mode={mode}/></MemoryRouter>); export const renderA1 = (level, mode) => renderToStaticMarkup(<MemoryRouter><A1Surface level={level} mode={mode}/></MemoryRouter>);`, resolveDir: root, loader: 'jsx' },
  bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic', logLevel: 'silent',
  define: { 'import.meta.env': JSON.stringify({ MODE: 'test', DEV: false, PROD: false }) },
  plugins: before ? [{ name: 'a1-live-fixes-baseline', setup(builder) {
    builder.onLoad({ filter: /\.(?:mjs|jsx?)$/ }, (args) => {
      const file = relative(root, args.path).replaceAll('\\', '/');
      if (!changed.has(file)) return;
      let contents = execFileSync('git', ['-C', root, 'show', `${A1_BASELINE}:${file}`], { encoding: 'utf8', maxBuffer: 4e6 });
      // Expose the pre-edit local renderer to the fixture without changing it.
      if (file === 'src/pages/lesson/CheckpointPage.jsx') contents = contents.replace('function PracticeItem(', 'export function PracticeItem(');
      return { contents, loader: file.endsWith('jsx') ? 'jsx' : 'js' };
    });
  } }] : [],
});
const compiled = new Module(fileURLToPath(import.meta.url));
compiled.filename = fileURLToPath(import.meta.url);
compiled.paths = Module._nodeModulePaths(dirname(compiled.filename));
compiled.require = createRequire(import.meta.url);
compiled._compile(bundle.outputFiles[0].text, compiled.filename);
return compiled.exports;
}
const { render, renderA1 } = await renderer();

test('A1.1 and A1.2 rendered markup is byte-identical to the committed baseline', async () => {
  const before = await renderer(true);
  for (const level of ['a1.1', 'a1.2']) for (const mode of ['Intro', 'Wortfeld', 'Welcome', 'Speaking', 'Checkpoint']) {
    assert.equal(renderA1(level, mode), before.renderA1(level, mode), `${level}: ${mode}`);
  }
});

test('rendered lesson and checkpoint surfaces show three options or text/person assignments', () => {
  for (const mode of ['Lesen MC', 'Checkpoint MC']) {
    const html = render(mode);
    assert.match(html, /Wann arbeitet Anna/);
    for (const option of ['Montag', 'Dienstag', 'Mittwoch']) assert.ok(html.includes(option));
  }
  for (const mode of ['Lesen Zuordnung', 'Checkpoint Zuordnung']) {
    const html = render(mode);
    assert.match(html, /Wer arbeitet am Dienstag/);
    assert.match(html, /Anna arbeitet am Dienstag/);
    assert.match(html, /Niemand/);
  }
});

test('rendered Hören picture surface keeps the transcript hidden and labels every picture', () => {
  const html = render('Hören Bilder');
  assert.equal((html.match(/<img /g) || []).length, 3);
  assert.match(html, /alt="Kalender: Montag"/);
  assert.ok(!html.includes('Anna arbeitet am Dienstag. Ben arbeitet am Montag.'));
});

test('all three speaking formats render, with the partner calendar reserved for the coach', () => {
  assert.match(render('Sprechen 1'), /Familie/);
  assert.match(render('Sprechen 2'), /Am Wochenende/);
  const html = render('Sprechen 3');
  assert.match(html, /<table/);
  assert.match(html, /Ihr Kalender · Anna/);
  assert.match(html, /Kalender von Ben/);
  assert.ok(!html.includes('Arzt'));
});

test('generic intro and Wortfeld surfaces render for an unregistered synthetic A2 course', () => {
  assert.match(render('Intro'), /A2.1/);
  assert.match(render('Wortfeld'), /<svg/);
});
