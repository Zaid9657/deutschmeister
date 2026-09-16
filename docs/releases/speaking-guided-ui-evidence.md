# Guided speaking UI — real-renderer evidence

Plan: `docs/superpowers/plans/2026-09-15-speaking-guided-city-map.md` Task 4 Step 5.
Inspected 2026-09-16 against the **running application** (Vite dev server,
`127.0.0.1:5179`) driven by headless Chromium (`/opt/pw-browsers/chromium-1194`)
— not by reading source.

## What was inspected

| Route | 320×700 | 768×1024 | 1440×900 |
|---|---|---|---|
| `/speaking` (hub) | ✓ | ✓ | ✓ |
| `/speaking?level=A1.1` | ✓ | ✓ | ✓ |
| `/course/a1.1` (course map, preview state) | ✓ | ✓ | ✓ |
| `/course/a1.1/l/4` (locked lesson → purchase bridge) | ✓ | ✓ | ✓ |

Checks run per route per viewport: horizontal overflow, controls without an
accessible name, heading structure (exactly one `<h1>`), first-Tab focus
reachability, and console/page errors. Screenshots (12) were captured to the
session scratch directory; they are working evidence, not committed binaries.

## Finding, and the fix

**1 issue found — horizontal scroll at 320 px on `/course/a1.1`.**
Measured `scrollWidth 376` against `clientWidth 320`. Cause: the course path's
decorative sway (`SWAY = [0, 44, 72, 44, 0, -44, -72, -44]`) was applied as an
inline `translateX` at every width, so a 288 px-wide row pushed 72 px past the
right edge on a small phone. Fixed by moving the sway behind the `sm`
breakpoint (`sm:[transform:translateX(var(--sway))]`) in both
`src/pages/CurriculumHomePage.jsx` and `src/pages/CourseHomePage.jsx`: the
path is straight on a phone and keeps its winding shape from 640 px up.

Re-measured after the fix, all three viewports:

```
320  {"scrollW":320,"clientW":320,"h1":"German A1.1","nodes":42,"locked":14}
768  {"scrollW":768,"clientW":768,"h1":"German A1.1","nodes":42,"locked":14}
1440 {"scrollW":1440,"clientW":1440,"h1":"German A1.1","nodes":42,"locked":14}
```

**Clean on the re-run:** no horizontal scroll on any route at any viewport, no
control without an accessible name, exactly one `<h1>` per route, and the first
Tab always reaches a focusable element. The only console entries were
`ERR_CERT_AUTHORITY_INVALID` from the sandbox's egress proxy intercepting
Supabase — an environment artifact, not application behavior.

## What this evidence does NOT cover

These need a session with live Supabase data and a real microphone, and are
listed in the handover as remaining owner/local work:

- an authenticated hub with real missions, attempts and a real balance (this
  environment cannot reach `supabase.co`, so the hub rendered its signed-out
  and empty states);
- a complete guided mission end to end (microphone capture, Azure acoustic
  feedback, the mission ticket's pronunciation block with real provider
  evidence);
- the Pronunciation Lab with a real recording;
- the screen-reader pass (automated name/role checks passed; a human
  screen-reader walkthrough is still required by the release gate).
