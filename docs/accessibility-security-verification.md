# Accessibility and security verification

Verified locally on 2026-09-14 against the built Astro site and the React app.

## Reproduction evidence

- Lighthouse accessibility on a representative grammar lesson scored 96. The only weighted failure was the small teal `Meister` footer text at 4.47:1 contrast.
- Lighthouse accessibility on `/signup` scored 95. It found the same footer contrast issue, a 3.59:1 teal navbar wordmark, and footer group headings that started at `h3` without an `h2`.
- Both document shells already permit browser zoom: neither sets `maximum-scale` nor `user-scalable=no`.
- After the fixes, Lighthouse accessibility scored 100 on both the representative grammar lesson and `/signup`.

## Competing hypotheses

1. **Brand accent contrast was the remaining WCAG blocker — confirmed.** Lighthouse identified the exact navbar and footer nodes and their measured ratios. The light-surface accent now uses `text-siegel-deep`; the dark-surface accent uses `text-siegel-wash`.
2. **Landmark or heading structure caused the remaining semantic failure — partially confirmed.** Main landmarks, labels, names, and link text passed. Footer navigation alone skipped to `h3`; both renderers now use `h2` for footer groups.
3. **Keyboard focus or zoom restrictions made navigation unusable — rejected after checks.** Both shells expose the skip link and focus-visible treatment, native disclosure menus are keyboard operable, and viewport metadata permits zoom. A real-browser keyboard and 200% reflow check is part of the release evidence below.
4. **The full CSP allowlist was ready for immediate enforcement — not yet proven.** Enforcing an unobserved resource allowlist could interrupt authentication, payments, analytics, or AI requests. Low-risk structural protections (`object-src`, `base-uri`, `frame-ancestors`, `form-action`, and HTTPS upgrades) are enforced now; the complete resource policy remains Report-Only until a clean production observation window.

## Causal chain and fix

The visual brand token was selected for brand consistency, but its luminance was too close to both the paper navbar and ink footer at small text sizes. One shared React logo also lacked a surface-aware variant, while the footer duplicated its wordmark to compensate. A surface-aware logo removes the duplication and applies the correct contrast token. Separately, footer groups were visually small labels but semantically coded as third-level headings regardless of page structure; promoting them to `h2` restores a consistent outline.

## Release evidence

- `node --test tests/accessibility-security.test.mjs`
- Production builds for both renderers.
- Lighthouse accessibility threshold on an Astro lesson and the React signup route.
- Real-browser keyboard traversal of the grouped navigation and reflow inspection at 200% zoom.
- Browser evidence: the `Exams` disclosure opened with Enter while focus remained on its `summary`; at a 640px effective viewport (the 200% reflow equivalent of a 1280px layout), the lesson had no horizontal overflow and exposed its mobile menu.
- After deployment, observe CSP reports and browser consoles across sign-in, checkout, analytics-consent, speaking, and sentence-analysis flows before promoting the full resource allowlist to enforcement.
