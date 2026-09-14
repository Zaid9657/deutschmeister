# DeutschMeister release evidence gates

Last reviewed: 2026-09-14

This file separates repository work from facts that must come from the site operator or an authenticated data source. It is an implementation checklist, not legal advice. Do not replace any item below with guessed, generated, or anonymized content merely to make a release check pass.

## Gate 1 — operator identity for the Impressum

Current state: **blocked by operator evidence**. `astro-site/src/pages/impressum.astro` is deliberately marked as a draft, contains bracketed placeholders, and is `noindex`.

Required evidence:

- Full legal name of the website operator or registered entity.
- A serviceable street address, postal code, city, and country; no post-office box.
- Whether a commercial register entry, register court/number, VAT ID, regulated profession, or supervisory authority applies. Record “not applicable” explicitly where appropriate.
- The name and address of the person responsible for editorial content, if that obligation applies to the published material.
- Operator approval of the final wording and publication date.

Release acceptance:

- No square-bracket placeholders or “Entwurf” notice remain.
- The page is reviewed for the operator’s actual legal form and activities.
- `noindex` is removed only after the supplied facts are verified.

Owner: site operator, with German legal review where appropriate.

## Gate 2 — privacy-policy facts and review

Current state: **blocked by operator/vendor evidence**. `astro-site/src/pages/privacy.astro` describes the observed service categories but is explicitly marked “pending legal review.”

Required evidence:

- The same verified controller identity and address as Gate 1, plus a privacy contact.
- The exact enabled production services and purposes. Repository evidence currently identifies Supabase, Anthropic, OpenAI, Google Analytics 4, PostHog, Lemon Squeezy, and Resend; deployment settings and vendor accounts must confirm which are actually active.
- Lawful basis per purpose, concrete retention/deletion periods or criteria, processor agreements, and any international-transfer mechanism that applies.
- Cookie/consent inventory from the production browser after consent is declined and after each optional category is accepted.
- Operator/legal approval of the final policy and effective date.

Release acceptance:

- The policy states verified controller/contact details, purposes, data categories, recipients, lawful bases, retention, rights, complaint route, transfers, and consent withdrawal.
- Its service list matches production behavior and deployment configuration.
- The draft/legal-review notice is removed only after approval.

Owner: site operator and privacy counsel/reviewer.

## Gate 3 — authentic social proof

Current state: **blocked by customer evidence**. The public site intentionally publishes no generated testimonials. `src/components/CompletionMoment.jsx` starts a feedback request after a real learner completes work.

Required evidence for every published proof item:

- The learner’s exact approved wording, preserved as a source record.
- Display name or approved pseudonym, learner context, and the result claimed.
- Explicit permission to publish on the website and the date/source of that permission.
- A withdrawal/contact process and an internal owner for removal requests.
- Evidence for any measurable claim; subjective opinions must remain clearly attributed opinions.

Release acceptance:

- No testimonial, count, pass-rate, star rating, or outcome appears without its source and publication permission.
- Editorial shortening does not change meaning and is approved by the learner.

Owner: site operator/customer support.

## Gate 4 — Search Console and DataForSEO evidence

Current state: **blocked by authenticated data access**. No DataForSEO or Google Search Console tool is connected in this workspace.

Required access:

- DataForSEO API connection with `SERP`, `KEYWORDS_DATA`, `DATAFORSEO_LABS`, `ONPAGE`, and `AI_OPTIMIZATION` modules for keyword, competitor, SERP, and crawl measurements.
- Read-only Google Search Console access to the canonical `https://deutsch-meister.de/` property for impressions, clicks, indexing, and query/page validation.

Release acceptance:

- Keyword volumes, difficulty, intent, SERP observations, crawl findings, and ranking priorities cite the retrieval date and data source.
- No SEO number is inferred from repository content or presented as measured when access is unavailable.

Owner: site operator/SEO analyst. Setup instructions live in the installed `deutschmeister-seo` skill’s `SETUP.md`.

## Repository work that does not require these gates

The following work can be implemented and verified independently: navigation grouping, pricing-state clarity, English-first acquisition copy, grammar-page summaries and navigation, accessibility repairs, CSP enforcement validation, title-length fixes, canonical/sitemap checks, automated tests, rendered browser checks, and Lighthouse measurements.
