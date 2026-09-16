# Guided Speaking City Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic speaking screen with a mobile-first City Conversation Map containing 12 practical A1.1 missions, clear task/language/pronunciation feedback, and a focused Pronunciation Lab.

**Architecture:** `SpeakingPage` becomes a thin router for a feature module. Pure route and feedback functions remain testable without React. Guided turns pass short-lived browser-held context to a Netlify function; the server validates its shape, uses Azure Speech for acoustic pronunciation signals, a benchmark-selected teacher model for pedagogic feedback, and OpenAI TTS for the reply. Raw audio and full transcripts are never persisted by default.

**Tech Stack:** React, Tailwind CSS, Netlify Functions, Supabase mission content, Azure Speech Pronunciation Assessment, OpenAI TTS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-15-deutschmeister-speaking-a11-commercial-rebuild-design.md`

## Experience contract

- Twelve stations correspond one-to-one with A1.1 lessons and real-life situations.
- Each mission has preparation, a 3–5 minute guided exchange, a ticket-style result and one next action.
- Feedback keeps three concepts separate: task success, language improvement and acoustic pronunciation.
- Pronunciation scores come only from speech audio analysis, never from transcript text.
- Keyboard, screen-reader, reduced-motion and narrow-phone use are release requirements.
- The screen uses deep navy, cobalt and acid-lime accents while reusing the project's typography, spacing and shared controls.

---

### Task 1: Publish one mission per A1.1 lesson and bind the course to it

**Files:**
- Create: `migrations/2026-09-17-a11-speaking-route.sql`
- Modify: `src/data/curricula/a11.js`
- Modify: `astro-site/src/data/curricula/a11.js`
- Modify: `src/data/programs/a11Phase.js`
- Modify: `tests/curricula.test.mjs`
- Create: `tests/a11-speaking-route-content.test.mjs`

**Interfaces:**
- `speaking_missions` has exactly 12 published A1.1 rows with mission orders 1–12.
- Every A1.1 lesson has a non-null, unique `sprechen.open.missionOrder` matching its lesson number.
- Each mission supplies `title_de`, `scenario_de`, `opening_de`, `learner_goal_de`, `pass_criteria`, `target_structures`, `hint_words`, and `estimated_minutes`.

- [ ] **Step 1: Write the failing 12-station contract**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

test('every A1.1 lesson owns one unique station in order', () => {
  const orders = CURRICULUM_A11.lektionen.map((lesson) => lesson.sprechen.open.missionOrder);
  assert.deepEqual(orders, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});
```

Add migration-source assertions for the required fields and exactly 12 guarded rows.

- [ ] **Step 2: Confirm the current eight-mission limit fails**

```powershell
node --test tests/a11-speaking-route-content.test.mjs tests/curricula.test.mjs
```

Expected: FAIL because lessons 7, 10, 11 and 12 have null mission orders and the existing range stops at 8.

- [ ] **Step 3: Author the four missing missions and normalize all twelve**

Use these station outcomes, preserving the reviewed language level:

| Station | Situation | Observable success |
|---:|---|---|
| 1 | Introduce yourself | Gives name, origin and spelling when asked |
| 2 | Personal details | Gives job, address and telephone number |
| 3 | Café order | Orders, changes one item and asks the price |
| 4 | Arrange a meeting | Suggests a day/time and responds to a conflict |
| 5 | Ask directions | Names a destination and follows two route steps |
| 6 | Shopping | Requests an item, size/quantity and price |
| 7 | Daily routine | Describes three activities with times |
| 8 | Doctor/pharmacy | Names a simple symptom and understands one instruction |
| 9 | Free time | Expresses likes and invites someone |
| 10 | Housing | Describes a room and asks one practical question |
| 11 | Travel/ticket | Requests a destination/time and confirms the platform |
| 12 | Integrated final encounter | Introduces self, answers follow-ups and makes an invitation |

Keep the migration idempotent with stable UUIDs and `WHERE NOT EXISTS` or conflict handling. Do not overwrite admin-edited rows silently; update only rows whose known previous values match.

- [ ] **Step 4: Link and validate the curricula**

Set each lesson's `missionOrder` to its station number, synchronize the Astro file, and lower `MAX_MISSIONLESS_LEKTIONEN` to zero. Update range/count assertions from eight to twelve.

```powershell
node scripts/validate-curriculum.mjs a1.1
node --test tests/a11-speaking-route-content.test.mjs tests/curricula.test.mjs tests/speaking-course-task.test.mjs
npm run check:duplicates
```

- [ ] **Step 5: Commit**

```powershell
git add migrations/2026-09-17-a11-speaking-route.sql src/data/curricula/a11.js astro-site/src/data/curricula/a11.js src/data/programs/a11Phase.js tests/curricula.test.mjs tests/a11-speaking-route-content.test.mjs
git commit -m "feat: publish twelve A1.1 speaking missions"
```

### Task 2: Build the pure route and feedback contracts

**Files:**
- Create: `src/features/speaking/routeModel.js`
- Create: `src/features/speaking/feedbackModel.js`
- Create: `src/features/speaking/speakingApi.js`
- Create: `tests/speaking-route-model.test.mjs`
- Create: `tests/speaking-feedback-contract.test.mjs`

**Interfaces:**
- `buildA11Route({ missions, attempts }) -> Station[]`.
- `normalizeGuidedFeedback(payload) -> GuidedFeedback` or throws a contract error.
- `startSpeakingSession`, `submitGuidedTurn`, `finishSpeakingSession` centralize network calls.

- [ ] **Step 1: Write route-state tests**

```js
test('route unlocks the first incomplete station but keeps completed stations replayable', () => {
  const route = buildA11Route({
    missions: [{ order: 1 }, { order: 2 }, { order: 3 }],
    attempts: [{ missionOrder: 1, passed: true }],
  });
  assert.deepEqual(route.map(({ state }) => state), ['complete', 'current', 'locked']);
});
```

Also cover course preview users: stations 1–3 visible and stations 4–12 shown locked with the €39 course call to action. Paid owners may open any unlocked-by-progress station; direct URLs cannot skip locked stations.

- [ ] **Step 2: Write the feedback-shape tests**

The accepted payload is:

```js
{
  transcript: 'Ich möchte einen Kaffee, bitte.',
  reply: { text: 'Sehr gern. Möchten Sie Milch?', audioBase64: 'UklGRiQAAABXQVZF' },
  task: { passed: true, completedCriteria: ['ordered_item'], nextGoal: null },
  language: { bestVersion: 'Ich möchte einen Kaffee, bitte.', tip: 'Sehr gut.' },
  pronunciation: {
    accuracy: 84, fluency: 78, completeness: 100,
    words: [{ word: 'Kaffee', accuracy: 72, phonemes: [{ phoneme: 'a', accuracy: 68 }] }],
  },
}
```

Reject missing task fields, out-of-range scores, pronunciation without provider evidence, oversized transcripts and unknown properties that could be rendered as HTML.

- [ ] **Step 3: Implement the pure models and API adapter**

Use stable station states `complete | current | available | locked`. Escape through React rendering only; never inject feedback HTML. Keep API errors typed as `AUTH_REQUIRED`, `INSUFFICIENT_ALLOWANCE`, `MICROPHONE_DENIED`, `PROVIDER_UNAVAILABLE`, and `INVALID_RESPONSE`.

- [ ] **Step 4: Run and commit**

```powershell
node --test tests/speaking-route-model.test.mjs tests/speaking-feedback-contract.test.mjs
git add src/features/speaking/routeModel.js src/features/speaking/feedbackModel.js src/features/speaking/speakingApi.js tests/speaking-route-model.test.mjs tests/speaking-feedback-contract.test.mjs
git commit -m "feat: define speaking route and feedback contracts"
```

### Task 3: Add real acoustic pronunciation assessment

**Files:**
- Create: `src/features/speaking/pcmRecorder.js`
- Create: `netlify/functions/_shared/azurePronunciation.mjs`
- Modify: `netlify/functions/speaking-turn.mjs`
- Modify: `netlify/functions/_shared/speakingAI.mjs`
- Create: `tests/azure-pronunciation.test.mjs`
- Create: `tests/speaking-ai.test.mjs`
- Modify: `tests/privacy.test.mjs`

**Interfaces:**
- Browser submits mono 16 kHz PCM WAV plus reference text for constrained pronunciation steps.
- `assessPronunciation({ wavBuffer, referenceText, locale })` returns normalized word/phoneme scores with `provider: 'azure-speech'`.
- Open conversation turns may return pronunciation as unavailable when no trustworthy reference text exists.

- [ ] **Step 1: Write failing request-builder and response-normalizer tests**

Assert `Content-Type: audio/wav; codecs=audio/pcm; samplerate=16000`, locale `de-DE`, and base64 encoding of:

```js
{
  ReferenceText: 'Ich möchte einen Kaffee, bitte.',
  GradingSystem: 'HundredMark',
  Granularity: 'Phoneme',
  Dimension: 'Comprehensive',
  EnableMiscue: 'True',
}
```

Fixture-test Azure success, provider error and missing-word responses. Assert the API never fabricates `pronunciation` from a transcript.

- [ ] **Step 2: Implement recorder output validation**

Record only while the user holds/toggles the microphone control. Convert to mono PCM WAV, reject empty or over-30-second clips client-side, expose a local playback button before upload, and release all media tracks after each turn.

- [ ] **Step 3: Implement the Azure adapter**

Read `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`; enforce a 15-second provider timeout and a 10 MB body limit. Normalize only documented scores. Do not log headers, audio bytes or recognized text. Return `null` pronunciation plus a safe retry message on provider failure; do not block task/language feedback.

- [ ] **Step 4: Remove default transcript persistence**

Delete writes to `speaking_messages` from the normal guided path. The browser holds at most the last six turns and sends them with the next request; the server validates roles, character limits and total size. Persist only mission ID, timing, provider status, task completion flags and aggregate scores. Raw audio is processed in memory and discarded after the response.

- [ ] **Step 5: Verify and commit**

```powershell
node --test tests/azure-pronunciation.test.mjs tests/speaking-ai.test.mjs tests/privacy.test.mjs
git add src/features/speaking/pcmRecorder.js netlify/functions/_shared/azurePronunciation.mjs netlify/functions/speaking-turn.mjs netlify/functions/_shared/speakingAI.mjs tests/azure-pronunciation.test.mjs tests/speaking-ai.test.mjs tests/privacy.test.mjs
git commit -m "feat: add acoustic pronunciation assessment"
```

### Task 4: Build the City Conversation Map and guided mission flow

**Files:**
- Create: `src/features/speaking/SpeakingHub.jsx`
- Create: `src/features/speaking/CityRouteMap.jsx`
- Create: `src/features/speaking/MissionPrep.jsx`
- Create: `src/features/speaking/GuidedMission.jsx`
- Create: `src/features/speaking/MissionTicket.jsx`
- Create: `src/features/speaking/SpeakingBalance.jsx`
- Modify: `src/pages/SpeakingPage.jsx`
- Modify: `src/index.css`
- Modify: `tests/speaking-ui.test.mjs`
- Create: `tests/speaking-accessibility.test.mjs`

- [ ] **Step 1: Add failing UI-source and rendering tests**

Assert the hub renders 12 named stations, a current-station card, monthly/permanent balance, “Start mission” as the single primary action, locked-course treatment, skip link, semantic headings, button labels and a reduced-motion branch.

- [ ] **Step 2: Add scoped visual tokens**

Extend the existing theme rather than replacing global brand tokens:

```css
.speaking-city {
  --city-night: #07152f;
  --city-cobalt: #2457ff;
  --city-lime: #c7ff4a;
  --city-mist: #eef3ff;
  --city-line: #8ba4ff;
}
@media (prefers-reduced-motion: reduce) {
  .speaking-city *, .speaking-city *::before, .speaking-city *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Acid lime is an accent for progress/current station, never body text on white. Maintain WCAG AA contrast and visible focus rings.

- [ ] **Step 3: Implement the responsive hub**

Desktop: map/route occupies the main column and the current-station ticket sits beside it. Mobile: vertical transit line, sticky bottom action, no horizontal scrolling at 320 px. Each station is a real button/link with state in text and icon, not color alone. Preserve query entry from course lessons (`level`, `mission`, `return`).

- [ ] **Step 4: Implement the guided exchange and result ticket**

Mission preparation shows situation, expected outcome, useful phrases, allowance source and microphone check. The exchange shows one prompt, a large tap-to-speak control, local playback, transcript correction and reply audio. The result ticket separately renders:

- `Task completed` with criteria;
- `A better way to say it`;
- `Pronunciation` with provider-backed word detail or an honest unavailable state;
- one `Try next` action.

Do not reduce the result to a single percentage.

- [ ] **Step 5: Observe the real renderer**

Start the local app and inspect the hub, prep, active exchange, result, locked and error states at 320×700, 768×1024 and 1440×900. Complete one keyboard-only mission and one screen-reader labeling pass. Record screenshots and observed fixes in `docs/releases/speaking-guided-ui-evidence.md`.

- [ ] **Step 6: Verify and commit**

```powershell
node --test tests/speaking-route-model.test.mjs tests/speaking-feedback-contract.test.mjs tests/speaking-ui.test.mjs tests/speaking-accessibility.test.mjs
npm run lint
npm run build:verify
git add src/features/speaking src/pages/SpeakingPage.jsx src/index.css tests/speaking-ui.test.mjs tests/speaking-accessibility.test.mjs docs/releases/speaking-guided-ui-evidence.md
git commit -m "feat: build guided speaking city map"
```

### Task 5: Add the Pronunciation Lab and course return flow

**Files:**
- Create: `src/features/speaking/PronunciationLab.jsx`
- Modify: `src/features/speaking/MissionTicket.jsx`
- Modify: `src/pages/Modelltest/ModelltestRun.jsx`
- Modify: `src/services/examScoring.js`
- Create: `tests/pronunciation-lab.test.mjs`
- Modify: `tests/exams.test.mjs`

- [ ] **Step 1: Write failing drill-selection tests**

Select at most three low-scoring words/phonemes from provider evidence, retain the original reference phrase, and never create a drill from missing acoustic data.

- [ ] **Step 2: Implement listen–record–compare**

For each selected item: play the reference, record one attempt, show the provider-backed change and allow one retry. Avoid mouth-shape claims the system cannot observe. Finish with the phrase in context, not an isolated score chase.

- [ ] **Step 3: Complete the final-assessment handoff**

When `return=a1_1_abschluss`, a passed mission returns a signed, short-lived result token containing user, mission order, pass state and session token. `ModelltestRun` verifies/records it through a server endpoint before advancing. A query parameter alone never marks the section complete.

- [ ] **Step 4: Verify and commit**

```powershell
node --test tests/pronunciation-lab.test.mjs tests/exams.test.mjs tests/privacy.test.mjs
git add src/features/speaking/PronunciationLab.jsx src/features/speaking/MissionTicket.jsx src/pages/Modelltest/ModelltestRun.jsx src/services/examScoring.js tests/pronunciation-lab.test.mjs tests/exams.test.mjs
git commit -m "feat: add pronunciation lab and exam return"
```
