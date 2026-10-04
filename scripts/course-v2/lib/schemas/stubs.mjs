// Fixture-only: `content/course-v2/fixtures/registries/stubs.json` (`course-v2/stubs@1`).
// Lists ids that exist in the full registries but that SCHEMA §15 does not excerpt (§15.1: „g.wenn
// and g.perfekt-haben exist in the full registry"; §15.6: „plus stub files for U1–U6"), so the
// fixture's references resolve. Never read outside a fixtures root.
import { obj, map, arr } from '../schema.mjs';
import { REF_PATTERNS } from '../ids.mjs';

export const STUB_KINDS = Object.keys(REF_PATTERNS);

export const stubsSchema = obj({
  $schema: "'course-v2/stubs@1'",
  note: 'str',
  ids: map(`enum(${STUB_KINDS.join('|')})`, arr('str', '*')),
}, {
  refine(doc, emit) {
    if (!doc.ids || typeof doc.ids !== 'object') return;
    for (const [kind, ids] of Object.entries(doc.ids)) {
      const re = REF_PATTERNS[kind];
      if (!re || !Array.isArray(ids)) continue;
      ids.forEach((id, i) => {
        if (typeof id === 'string' && !re.test(id)) emit(`ids.${kind}[${i}]`, `"${id}" is not a well-formed ref(${kind})`);
      });
    }
  },
});
