# Voice registry — notes

**Date:** 2026-09-28 · **Registry:** [`content/course-v2/registries/voices.json`](../../../content/course-v2/registries/voices.json)
(SCHEMA §4.7, `course-v2/voices@1`) · **Checked by:** `scripts/course-v2/lib/schemas/registries.mjs` (`voicesSchema`);
REF-01 resolves every `ref(voice)` against it (an extra's `voice`, SCHEMA §3.3).

## What the file holds

The 21 Azure German neural voices a course file may name: 17 de-DE, 2 de-AT (Ingrid, Jonas), 2 de-CH (Jan, Leni),
with gender, locale and an age band. `de-DE-GiselaNeural` is the one child voice (`young`); the others are adult
voices (`adult`: Azure publishes no finer age). The file existed only in SCHEMA until the a1.1-u02 review asked for
it (r2 F09). Once it exists, REF-01 treats `voice` as a loaded kind: every extra's voice must be listed here. Every
extra in the content at 2026-09-28 resolves (11 voices across a1.1 u01/u02/u08 and the u04 drafts of a2.2, b1.2,
b2.1, b2.2).

Cast voices (`casts/*.json` `voice.azure`) are plain strings in the cast schema and are not resolved against this
file. `cast.bilal` named `de-DE-FlorianNeural`, which is not an Azure voice name; it is now
`de-DE-FlorianMultilingualNeural`, the voice the A2, B1 and B2 casts already use for Felix, Rico and an ensemble role
(no A1 cast member uses it, so no A1 scene gains a shared voice). Confirm it on the owner's first Azure run.

## Variety voices for named extras (a1.1-u02 r2 F09)

Every de-DE male voice is taken by an A1 or series cast member (Bernd, Christoph, Conrad, Florian, Kasper, Killian,
Klaus, Ralf), so a named male extra in A1 gets a distinct voice only from de-AT or de-CH (u01 `x.peter-braun` and
u02 `x.herr-schaefer`: `de-AT-JonasNeural`). Decision:

1. **Allowed**, for an extra whose `variety` says so (`A` for de-AT, `CH` for de-CH). People from Austria and
   Switzerland live and work in Leipzig too, and the course teaches D-A-CH German; an A1 learner hears the accent,
   not a different language.
2. The **text stays standard German**: no Austrian or Swiss words (*Jänner*, *Velo*) before the unit that teaches
   them. The voice carries the accent, not the lexis.
3. The rule that matters for an exam text is **one voice per speaker within a text and within a Teil** (AUD-05,
   SCHEMA §3.3): two named extras in one Hören Teil never share a voice. Reusing a voice across units (u01 and u02
   both use Jonas for different extras) is fine; within one LS4 it is not.
4. Where a scene needs a de-DE male voice for an extra, the extra may borrow the voice of a cast member **who is not
   in that scene**, as the ensemble roles do.
