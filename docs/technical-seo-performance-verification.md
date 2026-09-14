# Technical SEO and performance verification

Verified locally on 2026-09-14 against the merged deploy output, not either renderer in isolation.

## Reproduction evidence

- The full built-output check initially reported five grammar title warnings above the 60-character soft limit.
- The new `/share-your-story/` route built in Astro but was absent from both the production and CI merge recipes, so it would have deployed as a 404.
- Initial mobile Lighthouse on the homepage scored 88 for performance with 3.0 s FCP/LCP, 0 ms TBT, 0.005 CLS, and about 140 KiB transferred.
- A long grammar lesson initially scored 88 for performance with 3.0 s FCP/LCP and 0 CLS. Style/layout work dominated its main-thread time.

## Competing hypotheses

1. **Large downloads were the primary slowdown — rejected.** The homepage transferred about 140 KiB and the long lesson about 159 KiB; Lighthouse gave total byte weight a passing score.
2. **Decorative motion delayed meaningful paint and added touch-device work — confirmed.** The above-fold copy used delayed opacity animations, while five Atropos scenes initialized even where hover interaction is unavailable. Primary content now paints immediately and 3D tilt initializes only for fine hover pointers.
3. **Long off-screen content caused avoidable initial layout work — confirmed.** The grammar lesson contains many rich rule and example cards. Full below-fold sections and their individual cards now use `content-visibility: auto` with intrinsic sizes; real-browser anchor navigation confirms skipped content renders when requested.
4. **External asset failures were production defects — rejected.** The standalone Astro preview lacked root public assets and produced console 404s. The merged deploy output serves those assets; its Lighthouse best-practices and SEO scores are both 100.
5. **Manual directory lists safely packaged every static route — rejected.** The learner-story route demonstrated the omission risk. A shared directory-discovering merge script now drives both Netlify and CI.

## Results

- Merged output: 138 pages checked, 0 failures, 0 title warnings. The check covers non-empty unique titles and descriptions, absolute canonicals, language, one H1, substance, and sitemap integrity.
- Homepage mobile Lighthouse after remediation: performance 93–95 across retained runs; FCP 1.5 s, LCP 1.5–1.6 s, TBT 230–300 ms, CLS 0, about 145 KiB transferred.
- Representative long lesson mobile Lighthouse after remediation: performance 98; FCP/LCP 1.7 s, TBT 120 ms, CLS 0, about 159 KiB transferred.
- Merged homepage Lighthouse: accessibility 100, best practices 100, SEO 100.
- Chrome 152 intermittently reports a temporary-profile cleanup error after writing a complete report. Audit scripts now preserve completed results and retain Chrome sandboxing; this runner defect does not represent a page failure.

## Real-browser grounding

- Keyboard and 200%-equivalent reflow checks passed during the accessibility story.
- Navigating directly to `#rules` rendered the deferred “German Nouns & Gender” rule card.
- Navigating to the homepage `#exams` anchor rendered the deferred exam section.
