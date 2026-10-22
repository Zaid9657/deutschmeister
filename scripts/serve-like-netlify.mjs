// Serve dist/ the way Netlify serves it, so a local audit sees the real headers,
// redirects and SPA rewrites instead of bare static-file behaviour. Parses
// netlify.toml directly, so there is no hand-copied rule table to drift.
//
//   node scripts/serve-like-netlify.mjs [dist] [netlify.toml] [port]
//
// Why this exists: a plain static server reports /faq as a 404 (it is an SPA
// rewrite), misses X-Robots-Tag: noindex on app.html, and serves /pricing as 200
// instead of 301-ing to /pricing/ — so every one of those becomes a false SEO
// finding. See docs/seo-routines/claude-seo.md.
//
// Two Netlify semantics this gets right, both easy to invert:
//   1. Static files beat unforced redirect rules. That is *why* the Astro pages
//      win over the SPA allow-list for /leitfaden/* and /vergleich/*.
//   2. No extname() guard on the trailing-slash redirect — level slugs like
//      "a1.1" contain a dot and would look like they carry a ".1" extension.
//
// Not a Netlify emulator: functions are not run (501), and the forced
// www -> apex redirect is host-scoped so it cannot apply on loopback.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createNetlifyStaticServer, parseNetlifyConfig } from './lib/netlify-static-server.mjs';

const DIST = resolve(process.argv[2] ?? 'dist');
const TOML = resolve(process.argv[3] ?? 'netlify.toml');
const PORT = Number(process.argv[4] ?? 4178);
const { redirects, headers } = parseNetlifyConfig(readFileSync(TOML, 'utf8'));

createNetlifyStaticServer({ dist: DIST, toml: TOML }).listen(PORT, '127.0.0.1', () => {
  console.log(`serving ${DIST} on http://127.0.0.1:${PORT}`);
  console.log(`${redirects.length} redirect rules, ${headers.length} header rules from ${TOML}`);
});
