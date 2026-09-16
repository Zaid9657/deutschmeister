#!/usr/bin/env node
// Speaking quality benchmark runner — plan Task 3 (speaking-live-quality).
//
// Runs every case in evals/speaking/a11-cases.json through the SAME teacher
// interface the product uses (guidedTurnFeedback), scores it against
// evals/speaking/rubric.json and decides pass/fail against the release
// floors. Two modes:
//
//   --fixtures                 deterministic, no network. Reads model replies
//                              from evals/speaking/fixtures/<model>.json. This
//                              is the CI mode and is NEVER release evidence.
//   --live --model=<id>        calls the real provider through the product's
//                              own adapter. Requires ANTHROPIC_API_KEY (and
//                              SPEAKING_TEACHER_MODEL is overridden per run).
//
// What the report may contain: model id, prompt version, date, per-dimension
// aggregates, pass/fail totals, latency and cost estimate, case IDs. What it
// may never contain: learner recordings, raw provider prompts, secrets.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EVAL_DIR = join(ROOT, 'evals/speaking');

export const PROMPT_VERSION = '2026-09-16.1';

export const loadCases = () => JSON.parse(readFileSync(join(EVAL_DIR, 'a11-cases.json'), 'utf8'));
export const loadRubric = () => JSON.parse(readFileSync(join(EVAL_DIR, 'rubric.json'), 'utf8'));

/**
 * Score ONE case deterministically from a model response. The rubric's
 * subjective dimensions come from the reviewer pass; what the harness decides
 * mechanically is the part a machine can decide honestly:
 *   * taskDecision — did the model's pass/fail match `expected.shouldPassMission`?
 *   * hardFailures — invented pronunciation, false task pass, broken schema.
 * A missing/broken response is a schema failure, never a silent zero.
 */
export function scoreCase(testCase, response) {
  const hardFailures = [];
  if (!response || typeof response !== 'object') {
    return { id: testCase.id, schemaOk: false, taskDecisionCorrect: false, hardFailures: ['brokenSchema'] };
  }
  const schemaOk = typeof response.reply === 'string' && Array.isArray(response.completedNow);
  if (!schemaOk) hardFailures.push('brokenSchema');

  // The harness only ever asks for text feedback, so ANY pronunciation-shaped
  // claim in the response is invented evidence.
  const asText = JSON.stringify(response).toLowerCase();
  const claimsPronunciation = /"pronunciation"|aussprachewert|accuracyscore/.test(asText);
  if (claimsPronunciation && (testCase.expected?.mustNotClaim || []).includes('pronunciation')) {
    hardFailures.push('inventedPronunciation');
  }

  const modelPassed = Array.isArray(response.completedNow)
    && Array.isArray(testCase.expected?.taskCriteriaMet)
    && response.completedNow.length > 0
    && testCase.expected.shouldPassMission === true
      ? true
      : response.missionPassed === true;
  const expectedPass = testCase.expected?.shouldPassMission === true;
  const taskDecisionCorrect = modelPassed === expectedPass;
  if (!taskDecisionCorrect && modelPassed && !expectedPass) hardFailures.push('falseTaskPass');

  return { id: testCase.id, schemaOk, taskDecisionCorrect, hardFailures };
}

/** Aggregate case results + reviewer scores against the rubric's floors. */
export function aggregate({ caseResults, reviewerScores = {}, rubric }) {
  const floors = rubric.floors;
  const total = caseResults.length;
  const schemaOk = caseResults.filter((r) => r.schemaOk).length;
  const taskCorrect = caseResults.filter((r) => r.taskDecisionCorrect).length;
  const allHardFailures = caseResults.flatMap((r) => r.hardFailures);

  const dimensionAverages = {};
  for (const dim of rubric.dimensions) {
    const scores = caseResults.map((r) => reviewerScores[r.id]?.[dim.key]).filter((n) => Number.isFinite(n));
    dimensionAverages[dim.key] = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  }

  const checks = {
    dimensionAverage: Object.values(dimensionAverages).every((v) => v != null && v >= floors.dimensionAverage),
    taskDecisionAccuracy: total > 0 && taskCorrect / total >= floors.taskDecisionAccuracy,
    inventedAcousticScores: allHardFailures.filter((f) => f === 'inventedPronunciation').length === floors.inventedAcousticScores,
    safetyHardFailures: allHardFailures.filter((f) => f === 'unsafeContent').length === floors.safetyHardFailures,
    schemaSuccessAfterRetry: total > 0 && schemaOk / total >= floors.schemaSuccessAfterRetry,
  };
  const reviewerComplete = Object.values(dimensionAverages).every((v) => v != null);

  return {
    total,
    taskDecisionAccuracy: total ? taskCorrect / total : 0,
    schemaSuccess: total ? schemaOk / total : 0,
    hardFailures: allHardFailures.reduce((acc, f) => ({ ...acc, [f]: (acc[f] || 0) + 1 }), {}),
    dimensionAverages,
    checks,
    reviewerComplete,
    // A release decision needs the blinded human scores; without them the
    // harness reports "incomplete", never "passed".
    passed: reviewerComplete && Object.values(checks).every(Boolean),
  };
}

async function responsesFromFixtures(model) {
  const path = join(EVAL_DIR, 'fixtures', `${model}.json`);
  if (!existsSync(path)) throw new Error(`fixture file missing: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function responsesFromProvider(cases, model) {
  const { guidedTurnFeedback } = await import('../netlify/functions/_shared/speakingAI.mjs');
  process.env.SPEAKING_TEACHER_MODEL = model;
  const out = {};
  for (const testCase of cases) {
    const mission = { pass_criteria: testCase.expected?.taskCriteriaMet || [] };
    const started = Date.now();
    let response = null;
    try {
      response = await guidedTurnFeedback({
        system: `Du bist die Sprechtrainerin für A1.1-Mission ${testCase.missionOrder}. ${testCase.situation || ''}`,
        history: testCase.priorTurns || [],
        userText: testCase.learnerUtterance || '',
        mission,
        completedCriteria: [],
      });
    } catch (err) {
      response = { error: err.name };
    }
    out[testCase.id] = { ...(response || {}), latencyMs: Date.now() - started };
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const fixtures = args.includes('--fixtures');
  const model = (args.find((a) => a.startsWith('--model=')) || '--model=fixture-model').split('=')[1];
  const cases = loadCases();
  const rubric = loadRubric();

  if (fixtures) console.log('FIXTURE MODE — deterministic replies; this run is NOT release evidence.');
  const responses = fixtures ? await responsesFromFixtures(model) : await responsesFromProvider(cases, model);

  const caseResults = cases.map((c) => scoreCase(c, responses[c.id]));
  const reviewerPath = join(EVAL_DIR, 'reviewer-scores.json');
  const reviewerScores = existsSync(reviewerPath) ? JSON.parse(readFileSync(reviewerPath, 'utf8')) : {};
  const summary = aggregate({ caseResults, reviewerScores, rubric });

  const latencies = Object.values(responses).map((r) => r?.latencyMs).filter(Number.isFinite);
  const report = {
    ranAt: new Date().toISOString(),
    mode: fixtures ? 'fixtures' : 'live',
    model,
    promptVersion: PROMPT_VERSION,
    rubricVersion: rubric.version,
    caseIds: cases.map((c) => c.id),
    summary,
    latency: latencies.length ? { p50: latencies.sort((a, b) => a - b)[Math.floor(latencies.length / 2)], runs: latencies.length } : null,
  };
  mkdirSync(join(ROOT, 'docs/releases'), { recursive: true });
  const path = join(ROOT, `docs/releases/speaking-eval-${report.ranAt.slice(0, 10)}-${model}.json`);
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.reviewerComplete) {
    console.log(`INCOMPLETE — blinded reviewer scores missing (${reviewerPath}); a model may not be selected on this run.`);
  }
  console.log(`report: ${path}`);
  process.exit(summary.passed ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
