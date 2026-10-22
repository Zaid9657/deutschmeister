You are doing a deep, read-only bug hunt on this repository (deutsch-meister.de: a German-learning platform; Vite/React SPA in src/, Astro static site in astro-site/, Netlify functions in netlify/functions/, Supabase Postgres with hand-applied SQL in migrations/). Read CLAUDE.md first: it documents intended behaviour, invariants and known traps. Treat it as the spec — a place where code contradicts it is a finding.

RULES
- Do NOT modify, create or delete any file. Read and run read-only commands only (grep, sed, cat, node --check, `npm test` is fine if it does not write into the repo).
- Go into small details. Trace real call paths end to end; read the callers and the callees, not just the file in front of you.
- Only report defects you can tie to a concrete path: input/state → wrong behaviour. No style nits, no "consider refactoring", no generic best-practice advice.
- Do not report things CLAUDE.md says are deliberate (e.g. the Astro grammar exercise lock is client-side by design; CSP is report-only on purpose; /privacy is a noindex draft).
- Prefer depth over breadth: 10 verified bugs beat 40 guesses.

OUTPUT (markdown, nothing else). One entry per finding, most severe first:
### <n>. <one-line title>
- Severity: BLOCKER | HIGH | MEDIUM | LOW
- Confidence: high | medium | low
- Location: path/to/file.ext:line (add more locations if needed)
- What breaks: concrete scenario — who does what, what they see, why it matters (money, data loss, security, learner trust, SEO).
- Evidence: the exact lines / logic that cause it (quote briefly).
- Fix: the minimal correct change, in one or two sentences.

End with a section "## Checked and fine" listing in one line each the areas you examined and found correct, so coverage is visible.

YOUR AREA
