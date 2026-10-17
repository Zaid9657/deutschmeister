Vendored from https://github.com/nateherkai/scroll-craft, version 0.3.1 (commit 75d81f7), folder
plugins/nateherk-design/skills/scroll-craft (MIT, Copyright (c) 2026 Nate Herk, see LICENSE). Do not edit in place: to
update, copy the folder from the new upstream version and change the version here in the same commit. ESLint ignores
this folder (the engine is upstream code, not ours).

Project rules win where they differ. On deutsch-meister.de that means the Die Linie tokens and their three rules
(`src/data/design-tokens.js`: case colours only where a case is named, `siegel` as the one action colour, hairlines
over resting shadows), no hex literals in Astro files, the motion tiers and curves in CLAUDE.md, the three-place route
rule and the trailing-slash cases, and the claims rules (no invented statistics, prices only from `pricing.js`). A page
built with this skill lands as an Astro page in `astro-site/`, with its MANIFEST line in `scripts/check-built-html.mjs`.
The skill generates imagery through kie.ai (`scripts/kie.mjs`, needs `KIE_AI_API_KEY`, paid); none is set, so use the
owner's own assets or the Higgsfield connector instead.
