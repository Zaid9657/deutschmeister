#!/usr/bin/env node
// Thin CLI wrapper around the shape validation in grammar-topics-from-json.mjs,
// for validating author-written grammar topic JSON without generating anything.
//
//   node scripts/check-grammar-json.mjs <file>...
//
// Exits non-zero and prints every violation if any input file fails the shape
// rules (see validateTopicJson in grammar-topics-from-json.mjs for the list).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateTopicJson } from './grammar-topics-from-json.mjs';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node scripts/check-grammar-json.mjs <file>...');
  process.exit(1);
}

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
  errors = errors.concat(validateTopicJson(doc, path));
}

if (errors.length) {
  console.error(`check-grammar-json: ${errors.length} validation error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`OK: ${files.length} file(s) validated, no violations.`);
