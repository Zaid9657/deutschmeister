// Offline A1 behaviour fingerprint, recaptured independently from live-fixes
// during the A2.1 integration merge (2026-10-25).
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import * as validator from '../../scripts/validate-curriculum.mjs';
import { knownUpTo, formsOf as browserForms, lexisSpec } from '../../src/lib/checkpoint/lexis.js';
import { buildCheckpoint } from '../../src/lib/checkpoint/buildCheckpoint.js';

const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function a1EngineSnapshot() {
  return Object.fromEntries(['a1.1', 'a1.2'].map((level) => {
    const spec = validator.levelSpec(level);
    const c = spec.curriculum;
    const words = c.lektionen.flatMap((l) => l.wortfeld);
    const pool = validator.loadPoolItems(level);
    const horizon = validator.constructionHorizonIndex(level);
    return [level, {
      lexicon: digest([...validator.levelLexicon(level)]),
      lexiconSize: validator.levelLexicon(level).size,
      taught: digest([...validator.taughtUpTo(c, spec)].map(([nr, set]) => [nr, [...set]])),
      browserLexicons: digest(c.lektionen.map((l) => [...knownUpTo(c, l.nr)])),
      wordForms: digest(words.map((w) => [...validator.formsOf(w, spec.irregularForms)])),
      browserWordForms: digest(words.map((w) => [...browserForms(w, lexisSpec(level).irregularForms)])),
      wechsel: digest([...validator.wechselInventory(level)]),
      adjectives: digest([...validator.adjectiveLexicon(level)]),
      horizons: digest(pool.map((item) => [item.id, horizon(item)])),
      lines: digest(validator.lineHorizons(level)),
      examCoverage: digest(validator.examTeileBacked(c)),
      ratchets: digest(spec.ratchets),
      checkpoints: digest(c.checkpoints.flatMap((checkpoint) => [1, 2].map((attempt) =>
        buildCheckpoint({ curriculum: c, checkpoint, pool, attempt })))),
    }];
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(a1EngineSnapshot(), null, 2));
}
