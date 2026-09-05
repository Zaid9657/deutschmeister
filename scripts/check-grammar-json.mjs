#!/usr/bin/env node
// Thin CLI wrapper around the shape validation in grammar-topics-from-json.mjs,
// for validating author-written grammar topic JSON (CREATE or EXTEND shape)
// without generating anything.
//
//   node scripts/check-grammar-json.mjs <file>... [--cache <cache.json>]
//
// --cache is optional and only matters for EXTEND-shape files: without it,
// EXTEND documents are validated for shape only (order_index reservations,
// topic_patch field allow-list, internal duplicates); with it, the existing
// topic is also looked up and collision/continuation checks against its
// current rows run too. CREATE-shape files validate identically either way.
//
// Exits non-zero and prints every violation if any input file fails the shape
// rules (see validateTopicJson / validateExtendJson in grammar-topics-from-json.mjs
// for the list).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateGrammarDoc } from './grammar-topics-from-json.mjs';

const rawArgs = process.argv.slice(2);
let cachePath = null;
const files = [];
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '--cache') cachePath = rawArgs[++i];
  else files.push(rawArgs[i]);
}

if (files.length === 0) {
  console.error('Usage: node scripts/check-grammar-json.mjs <file>... [--cache <cache.json>]');
  process.exit(1);
}

const cache = cachePath ? JSON.parse(readFileSync(resolve(cachePath), 'utf8')) : null;

let errors = [];
for (const path of files) {
  const raw = readFileSync(resolve(path), 'utf8');
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse ${path}: ${err.message}`);
    process.exit(1);
  }
  errors = errors.concat(validateGrammarDoc(doc, path, cache));
}

if (errors.length) {
  console.error(`check-grammar-json: ${errors.length} validation error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`OK: ${files.length} file(s) validated, no violations.`);
