// EXM-02 — `scaffolded` only where the Teil template allows it for this course
// (scaffoldAllowedIn), never in a .2 course; A1.1 blocks are untimed (Lernmodus by default).

import { walkBlocks } from '../lib-validate/walk.mjs';
import { arr, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'EXM-02';
export const title = 'Scaffolding only where the template allows it; never in .2; A1.1 untimed';
export const type = 'hard';
export const scope = 'unit';

export function run({ ctx, docs }) {
  const findings = [];
  let blocks = 0;
  for (const doc of docs) {
    const dot2 = String(doc.level).endsWith('.2');
    for (const { block, path } of walkBlocks(doc)) {
      if (!isObj(block)) continue;
      blocks += 1;
      const t = ctx.registries.templates.get(block.template)?.template;
      if (block.scaffolded) {
        if (dot2) findings.push(blocker(doc, `${path}.scaffolded`, `scaffolded block in ${doc.level} (.2 courses run every Teil in its real format)`, block.id));
        else if (t && !arr(t.scaffoldAllowedIn).includes(doc.level)) findings.push(blocker(doc, `${path}.scaffolded`, `${block.template} may be scaffolded only in ${arr(t.scaffoldAllowedIn).join(', ') || 'no course'}`, block.id));
      }
      if (doc.level === 'a1.1' && block.modeDefault && block.modeDefault !== 'lern') findings.push(blocker(doc, `${path}.modeDefault`, 'A1.1 blocks are untimed: modeDefault "lern"', block.id));
    }
  }
  return blocks ? { findings } : { findings, skipped: 'no exam block in the target yet' };
}
