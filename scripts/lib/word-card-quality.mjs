import buildLesson from '../../src/lib/lesson/buildLesson.js';
import { cardStageEstimate, CARD_MAX_INPUT_SECONDS } from '../../src/lib/lesson/wordCards.js';

/** Inspect delivered screens, not a union of stage.words metadata. Scene meaning is a teaching
 * check on its immediately preceding hear model; word-card prerequisites bind subsequent checks.
 */
export function wordCardStageFindings(lesson, stages) {
  const out = [];
  const fail = (message) => out.push(`L${lesson.nr}: ${message}`);
  const taught = new Set();
  for (const stage of stages) {
    if (stage.kind !== 'wortfeld' || !stage.steps) continue;
    const time = cardStageEstimate(stage);
    if (time.maxInputHi > CARD_MAX_INPUT_SECONDS) fail(`${stage.key}: unchecked card input ${time.maxInputHi}s exceeds 120s`);
    let group = null, checks = [];
    const finish = () => {
      if (!group) return;
      if (checks.length < 2 || checks.length > 3) fail(`${stage.key}: group ${group.group} needs two or three checked retrieval tasks`);
      for (const kind of ['meaning', 'listening', ...(group.words.some((w) => w.article) ? ['article'] : [])]) {
        if (!checks.some((i) => i.retrieval === kind)) fail(`${stage.key}: group ${group.group} missing ${kind} retrieval`);
      }
    };
    for (const step of stage.steps) {
      if (step.kind === 'cards') {
        finish(); group = step; checks = [];
        if (!step.words.length || step.words.length > 6) fail(`${stage.key}: group ${step.group} has ${step.words.length} cards; maximum six`);
        for (const w of step.words) {
          if (w.meta) fail(`${stage.key}: meta heading cannot be a word card`);
          taught.add(w.de);
        }
      } else if (step.kind === 'check') {
        checks.push(step.item);
        if (!group || step.group !== group.group || !group.words.some((w) => w.de === step.item.cardTarget)) fail(`${stage.key}: retrieval must target its preceding card group`);
        if (!taught.has(step.item.cardTarget)) fail(`${step.item.id}: dependent check before word card`);
        if (!step.item.options?.includes(step.item.answer) || step.item.options.length < 2 || new Set(step.item.options).size !== step.item.options.length) fail(`${step.item.id}: retrieval needs distinct checked alternatives`);
      }
    }
    finish();
  }
  for (const w of lesson.wortfeld.filter((w) => !w.meta)) {
    if (!taught.has(w.de)) fail(`missing delivered word card: ${w.de}`);
  }
  // All non-teaching checked stages must follow the full card sequence. The sets/scene
  // explicitly teach their own model before asking; pretest is intentionally diagnostic.
  const lastCard = stages.findLastIndex((s) => s.kind === 'wortfeld');
  for (const [i, stage] of stages.entries()) {
    if (['sound', 'read', 'practice', 'derived', 'dictation', 'proof'].includes(stage.kind) && i < lastCard) fail(`${stage.key}: dependent checks precede the full word-card sequence`);
  }
  return out;
}

/** RULE 39: every seeded built flow gets all non-meta cards, retrieval, and <=120s input. */
export function wordCardFindings(curriculum, pool, { attempts = [1, 2, 3] } = {}) {
  return (curriculum.lektionen || []).filter((l) => l.flow === 'guided').flatMap((lesson) => attempts.flatMap((attempt) =>
    wordCardStageFindings(lesson, buildLesson({ curriculum, lektion: lesson, pool, attempt }).stages).map((s) => `draw ${attempt}: ${s}`)));
}
