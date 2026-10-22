# Historical records

These files are historical evidence, preserved byte-for-byte from their former
locations at the repository root. They are superseded by the current authorities
listed in [the documentation map](../README.md). Dates and application claims
inside them describe the recorded session, not the current production state.

- [Legacy SQL](legacy-sql/): eleven former root SQL files, kept outside the active
  [migration ledger](../../migrations/README.md). Do not re-run these files as setup
  or migrations; they include one-off data repairs and hardcoded identifiers.
- [August evaluation](audits/2026-08/EVALUATION.md): the oldest full site and database audit.
- [August audit](audits/2026-08/AUDIT-2026-08-16.md): findings that corrected parts of
  the evaluation and led to remediation.
- [August remediation](audits/2026-08/REMEDIATION.md): the recorded fixes and owner
  items from August 16–18. Check [open actions](../open-actions.md) and the
  [current team protocol](../agents/PROTOCOL.md) for subsequent decisions.

Basename-only references within these preserved records refer to their original
repository layout. The three audit documents remain together; the legacy SQL
files retain their basenames in `legacy-sql/`. Production SQL changes continue
to be hand-applied from `migrations/`, with explicit application status.
