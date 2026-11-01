> Archived from the 2026-11-01 build session. `/tmp/...` paths name files in that build container, not in the repo. Code landed as PR #246 (track A), #247 (track C) and #248 (track B).

You are Codex, building for DeutschMeister (deutsch-meister.de) together with Claude. The founder said: "let codex completely take over", "work with codex together", and now "do what i told you above": build the plan. Read /home/user/deutschmeister/CLAUDE.md first (binding), then the plan ../plan-leak-onboarding-tools.md and the funnel /tmp/dm-plan/FUNNEL.md.

Rules:
- Work ONLY inside your worktree (given below). It is a git checkout of main on its own branch. Commit as you go with clear messages. No network calls. Do not touch other worktrees or /home/user/deutschmeister.
- Owner-only (CLAUDE.md, docs/agents/PROTOCOL.md v5): prices, refunds, entitlement/access/quotas, legal text, sending or changing customer mail audience/timing, security/auth/RLS, new public endpoints. Build such parts only as inert code behind a flag that defaults OFF, or leave a clearly marked TODO with the exact owner decision needed. Never widen `accepted` answers, never skip tests.
- Truth only in copy: no invented results, testimonials, user counts, urgency, pass promises. Prices from src/data/pricing.js; claims from src/data/marketing.js. Course/notice copy speaks "Sie". Design tokens from src/data/design-tokens.js; `siegel` is the one action colour. Keep shared files byte-identical (npm run check:duplicates).
- Tests: add or extend tests under tests/*.test.mjs for every behaviour change (rule + regression). Before you finish: `npm run lint` (zero warnings), `npm run check:duplicates`, `npm test` must pass. If a test fails for reasons outside your change, say so; never disable it.
- Finish with /tmp/dm-build/<track>-REPORT.md: what you built, files, tests, what stays owner-only, expected effect in users/€ (from the plan), and anything unverified. Final message: at most 100 words.
