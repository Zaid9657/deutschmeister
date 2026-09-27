// Renders Instagram feed cards (1080×1350, 4:5) from posts.json with the
// DeutschMeister tokens. 4:5 is the tallest ratio the Instagram publishing API
// accepts (Zapier uses it), and the 3:4 profile grid only trims the sides, so
// every card keeps a 90px side safe zone.
// Usage: node render.mjs [posts.json] [outDir]  (default: posts.json → public/social/ig)
// Output is JPEG: the only still format every channel in the Zap accepts natively.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { color, kasus, accent } from '../../src/data/design-tokens.js';

// playwright is the global install in the agent sandbox (no project dep)
const { chromium } = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');

const [, , input = 'posts.json', out = '../../public/social/ig'] = process.argv;
const posts = JSON.parse(readFileSync(new URL(input, import.meta.url)));
mkdirSync(new URL(out + '/', import.meta.url), { recursive: true });

// Fonts are inlined as data URIs: the sandbox Chromium cannot reach Google Fonts,
// and a silent fallback to Georgia/Arial is exactly the drift we must not ship.
const fontDir = new URL('fonts/', import.meta.url);
let fontCss = readFileSync(new URL('fonts.css', fontDir), 'utf8');
for (const f of readdirSync(fontDir).filter((x) => x.endsWith('.woff2'))) {
  fontCss = fontCss.replaceAll(f, 'data:font/woff2;base64,' + readFileSync(new URL(f, fontDir)).toString('base64'));
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// [[DAT:dem Mann]] → a case chip; only where a case is named (token rule 1)
const chips = (s) => esc(s).replace(/\[\[(NOM|AKK|DAT|GEN):([^\]]+)\]\]/g, (_, c, w) => {
  const k = Object.values(kasus).find((x) => x.abbr === c);
  return `<span class="chip" style="background:${k.wash};color:${k.ink};border-bottom:5px solid ${k.line}">${w}<sup>${c}</sup></span>`;
});
const acc = { himbeer: accent.himbeer, aprikose: accent.aprikose, limette: accent.limette };

const body = (p) => {
  if (p.layout === 'kasus') return `
    <h1>${chips(p.headline)}</h1>
    <div class="rows">${p.rows.map((r) => `<div class="row ${r.ok ? 'ok' : 'no'}"><b>${r.ok ? '✓' : '✗'}</b><span>${chips(r.text)}</span></div>`).join('')}</div>
    <p class="note">${chips(p.note)}</p>`;
  if (p.layout === 'fact') return `
    <h1>${esc(p.headline)}</h1>
    <div class="stats">${p.stats.map((s) => `<div class="stat ${s.fail ? 'fail' : ''}"><div class="num">${esc(s.num)}</div><div class="lbl">${esc(s.label)}</div></div>`).join('')}</div>
    <p class="note">${esc(p.note)}</p>`;
  return `
    <h1>${esc(p.headline)}</h1>
    <ol class="list">${p.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>
    <p class="note">${esc(p.note)}</p>`;
};

const html = (p) => {
  const a = acc[p.accent] || accent.limette;
  return `<!doctype html><html><head><meta charset="utf-8">
<style>${fontCss}

*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;background:${color.paper};color:${color.ink};font-family:'Nunito Sans',sans-serif;padding:96px 96px 80px;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:center;padding-bottom:28px;border-bottom:2px solid ${color.rule}}
.series{font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:24px;letter-spacing:.13em;text-transform:uppercase;background:${a.wash};color:${a.ink};padding:12px 20px;border-radius:999px;box-shadow:0 4px 0 0 ${a.edge}}
.lvl{font-family:ui-monospace,Menlo,monospace;font-size:26px;font-weight:600;color:${color.graphite};letter-spacing:.06em}
main{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:44px}
h1{font-family:Fraunces,Georgia,serif;font-weight:680;font-size:78px;line-height:1.1;letter-spacing:-.01em}
.chip{display:inline-block;padding:0 14px 2px;border-radius:14px;line-height:1.15}
.chip sup{font-family:ui-monospace,monospace;font-size:22px;font-weight:700;letter-spacing:.1em;margin-left:8px;vertical-align:super}
.rows{display:flex;flex-direction:column;gap:18px}
.row{display:flex;gap:22px;align-items:center;font-size:46px;font-weight:600;padding:22px 28px;border-radius:20px;border:2px solid ${color.rule};background:${color.white}}
.row b{font-size:44px;width:44px}
.row.ok b{color:${color.siegel}} .row.no{color:${color.graphite}} .row.no span{text-decoration:line-through;text-decoration-thickness:3px} .row.no b{color:${color.graphite}}
.row .chip{font-size:44px}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.stat{border:2px solid ${color.rule};border-radius:24px;padding:34px 30px;background:${color.white}}
.stat .num{font-family:Fraunces,serif;font-weight:700;font-size:120px;line-height:1;color:${color.siegel}}
.stat.fail .num{color:${color.graphite}}
.stat .lbl{font-size:30px;font-weight:700;margin-top:12px}
.list{list-style:none;counter-reset:n;display:flex;flex-direction:column;gap:0}
.list li{counter-increment:n;font-size:42px;font-weight:600;line-height:1.3;padding:24px 0;border-top:2px solid ${color.rule};display:flex;gap:24px}
.list li:last-child{border-bottom:2px solid ${color.rule}}
.list li::before{content:counter(n);font-family:ui-monospace,monospace;font-size:28px;font-weight:700;color:${color.siegel};padding-top:8px}
.note{font-size:36px;line-height:1.45;color:${color.graphite}}
.note b,.note strong{color:${color.ink}}
.foot{display:flex;justify-content:space-between;align-items:center;padding-top:28px;border-top:2px solid ${color.rule}}
.brand{display:flex;align-items:center;gap:16px;font-family:Fraunces,serif;font-weight:700;font-size:36px}
.seal{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,${color.siegel},${color.siegelLift});color:#fff;display:grid;place-items:center;font-size:34px;position:relative}
.seal::after{content:'';position:absolute;right:2px;top:2px;width:14px;height:14px;border-radius:50%;background:${color.gold}}
.cta{font-size:28px;font-weight:800;color:${color.siegelDeep}}
.idx{font-family:ui-monospace,monospace;font-size:22px;color:${color.graphite}}
</style></head><body>
<div class="top"><span class="series">${esc(p.series)}</span><span class="lvl">${esc(p.level)}</span></div>
<main>${body(p)}</main>
<div class="foot"><span class="brand"><span class="seal">M</span>DeutschMeister</span><span class="cta">${esc(p.footer)}</span></div>
</body></html>`;
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
for (const p of posts) {
  await page.setContent(html(p), { waitUntil: 'networkidle' });
  const loaded = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family); });
  if (!loaded.some((f) => f.includes('Fraunces')) || !loaded.some((f) => f.includes('Nunito'))) throw new Error('brand fonts missing: ' + loaded);
  // Shrink-to-fit: a long headline or list must never spill into the footer.
  const zoom = await page.evaluate(() => {
    const m = document.querySelector('main');
    let z = 1;
    while (m.scrollHeight > m.clientHeight + 1 && z > 0.6) { z -= 0.03; m.style.zoom = z; }
    return z;
  });
  if (zoom <= 0.6) throw new Error(`${p.id} does not fit`);
  await page.screenshot({ path: new URL(`${out}/${p.id}.jpg`, import.meta.url).pathname, type: 'jpeg', quality: 90 });
  console.log('rendered', p.id, zoom < 1 ? `(zoom ${zoom.toFixed(2)})` : '');
}
await browser.close();
