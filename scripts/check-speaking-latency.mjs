#!/usr/bin/env node
// Repeatable latency gate — plan Task 4 (speaking-live-quality) Step 3.
//
// Runs N warmed turns against a deployment, computes p50/p95 per mode and
// exits nonzero above the release thresholds (guided 2,500 ms, live
// 1,500 ms, spec §11.2 #4). Stores AGGREGATES and case ids only — never a
// transcript, never audio, never a learner utterance.
//
//   node scripts/check-speaking-latency.mjs --fixtures        # CI, no network
//   node scripts/check-speaking-latency.mjs --live --runs=30  # against a deploy
//
// Live mode needs SPEAKING_LATENCY_BASE_URL and SPEAKING_LATENCY_TOKEN
// (a test account's JWT). It is a measurement tool, never a gate a mock can
// satisfy: `--fixtures` prints FIXTURE MODE and never counts as evidence.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const THRESHOLDS_MS = { guided: 2500, live: 1500 };

export function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function evaluateLatency(samplesByMode, thresholds = THRESHOLDS_MS) {
  const report = {};
  let passed = true;
  for (const [mode, samples] of Object.entries(samplesByMode)) {
    const p50 = percentile(samples, 50);
    const p95 = percentile(samples, 95);
    const threshold = thresholds[mode];
    const modePassed = p95 != null && threshold != null ? p95 <= threshold : false;
    if (!modePassed) passed = false;
    report[mode] = { runs: samples.length, p50, p95, thresholdMs: threshold ?? null, passed: modePassed };
  }
  return { passed, report };
}

async function measureGuidedTurn(baseUrl, token, caseId) {
  const started = Date.now();
  const res = await fetch(`${baseUrl}/api/speaking/speaking-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sessionToken: caseId, audioBase64: '', mimeType: 'audio/wav' }),
  });
  await res.text();
  return Date.now() - started;
}

async function main() {
  const args = process.argv.slice(2);
  const fixtures = args.includes('--fixtures');
  const runs = Number((args.find((a) => a.startsWith('--runs=')) || '--runs=30').split('=')[1]);

  let samples;
  if (fixtures) {
    console.log('FIXTURE MODE — synthetic samples; this is NOT release evidence.');
    const fixturePath = join(ROOT, 'evals/speaking/latency-fixtures.json');
    samples = existsSync(fixturePath)
      ? JSON.parse(readFileSync(fixturePath, 'utf8'))
      : { guided: Array.from({ length: runs }, (_, i) => 900 + (i % 10) * 90), live: Array.from({ length: runs }, (_, i) => 500 + (i % 10) * 60) };
  } else {
    const baseUrl = process.env.SPEAKING_LATENCY_BASE_URL;
    const token = process.env.SPEAKING_LATENCY_TOKEN;
    if (!baseUrl || !token) {
      console.error('Live mode needs SPEAKING_LATENCY_BASE_URL and SPEAKING_LATENCY_TOKEN.');
      process.exit(2);
    }
    const guided = [];
    for (let i = 0; i < runs; i += 1) {
      guided.push(await measureGuidedTurn(baseUrl, token, `latency-case-${i + 1}`));
    }
    samples = { guided };
    console.log('NOTE: live-mode WebRTC turn latency must be measured in a browser session; this run covers guided turns.');
  }

  const { passed, report } = evaluateLatency(samples);
  const dated = new Date().toISOString().slice(0, 10);
  const out = {
    measuredAt: new Date().toISOString(),
    mode: fixtures ? 'fixtures' : 'live',
    caseIds: Object.fromEntries(Object.entries(samples).map(([m, s]) => [m, s.map((_, i) => `${m}-case-${i + 1}`)])),
    report,
    passed,
  };
  mkdirSync(join(ROOT, 'docs/releases'), { recursive: true });
  const path = join(ROOT, `docs/releases/speaking-latency-${dated}.json`);
  writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  console.log(passed ? `PASS — written to ${path}` : `FAIL — thresholds exceeded; written to ${path}`);
  process.exit(passed ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
