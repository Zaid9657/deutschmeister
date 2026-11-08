# Codex design-gap review: DeutschMeister vs MedMeister (2026-11-08)

- **Asked by** the founder: "use codex official plugin in this chat and the goal to see how much is deutschmeister lagging in terms of the design to medmeister and to create a plan to redesign the whole deutschmeister website to be on a simillar level to medmeister", then "deutschmeister should reach a much higher level similar to the level of medmeister , let codex do the redesign to not consume a lot of credits".
- **Run:** official plugin `codex@openai-codex` 1.0.6 (Codex CLI 0.167.0), task mode, xhigh reasoning, read-only; session 01a1bbdf.
- **Evidence:** live screenshots (2026-11-08, signed out, desktop 1440 + mobile 390) of 11 DeutschMeister and 12 MedMeister pages, plus page text.

## Verdict (Codex)

- **Overall:** DeutschMeister ≈ 6/10 vs MedMeister ≈ 8/10, about two focused months behind (100–140 agent-hours).
- **Biggest gaps:**
  - imagery (3 vs 8);
  - showing the product (6 vs 9);
  - copy voice (5 vs 8);
  - trust (4 vs 6).
- **MedMeister's edge:** every promise sits next to a recognisable product panel. DeutschMeister spends its space explaining the train metaphor, the catalogue and the payment model.

## Claude's fact-check

| Claim | Check |
|---|---|
| Station art is disabled until all 8 scenes exist (`ART_COMPLETE`) | ✓ `astro-site/src/data/stationArt.js`, `StationArt.astro` |
| Old shadows and 90/260/420 ms motion still sit beside the new tiers | ✓ `src/data/design-tokens.js` |
| About says "team of doctors" while `marketing.js` has the sanctioned founder wording | ✓; the founder's 2026-10-26 decision "Developed by a team of doctors" lives in unmerged draft PR #234, so this stays a founder item |
| MedMeister scroll steps were identical (evidence limit) | ✓ Claude's capture bug (RN-web inner scroller); re-captured correctly for the build |
| **Overridden:** "one decision: exam-first homepage" | ✗ The founder already locked "level by level, from the beginning" on 2026-11-02, so the level path leads and exam pages stay a secondary entrance (Claude's reading, vetoable) |

## Files

- [report.md](report.md): Codex's review, unedited.
- [BUILD-BRIEF.md](BUILD-BRIEF.md): the brief for Codex's build.
- `build-report.md`: Codex's build report (follows).
