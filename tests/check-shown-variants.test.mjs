// What a final check says it showed holds for every sitting (Claude score of fd8f8dba, 2026-11-25, MINOR 11): a retake about
// the father ended with „I can say where my mother or sister comes from“, a retake on thirst with „… that I am hungry“. A shown
// line names nothing that only some of its turns' variants ask about.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

const words = (s) => new Set(String(s || '').toLowerCase().match(/\p{L}+/gu) || []);

test('a shown can-do line fits every variant of the turns that show it', () => {
  for (const l of CURRICULUM_A11.lektionen) {
    const { shown = [], turns = [] } = l.guided?.check || {};
    shown.forEach((line, i) => {
      if (!line) return;
      for (const turn of turns.filter((t) => t.canDo === i && t.variants?.length > 1)) {
        const asked = turn.variants.map((v) => words(`${v.taskDe || ''} ${v.cue?.de || ''}`));
        const some = new Set(asked.flatMap((s) => [...s]).filter((w) => !asked.every((s) => s.has(w))));
        const named = [...words(line.de)].filter((w) => some.has(w) && w.length > 3);
        // („Hunger oder Durst“ names what every sitting asks.)
        assert.ok(!named.length || asked.every((s) => named.some((w) => s.has(w))), `L${l.nr} can-do ${i + 1}: „${line.de}“ names what only some sittings ask: ${named.join(', ')}`);
      }
    });
  }
});
