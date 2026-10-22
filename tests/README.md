# Test map

`npm test` runs **every flat `tests/*.test.mjs` suite** with `node --test`; the shell
expands the unquoted glob for Node 20. All 159 original suites remain discoverable, along
with new regression suites. Keep suites here until the full command and CI are deliberately
changed together. `fixtures/` and `helpers/` support suites and are not standalone tests.

Focused commands supplement the mandatory full suite:

```bash
npm run test:course
npm run test:site
node --test tests/check-answer.test.mjs tests/checkpoint.test.mjs
```

Each regression should fail without its fix. Prefer small pure functions and meaningful
behavioral assertions; source guards protect boundaries such as claims, auth and generated
artifacts. Never loosen an existing assertion or disable a test to make a change pass.

| Domain | Suites / entrypoints |
|---|---|
| Course content and curriculum | `a1-*.test.mjs`, `a1-2-*.test.mjs`, `a1-typed-production.test.mjs`, `a11-content-classes.test.mjs`, `a12-buyer-claims.test.mjs`, `a2-*.test.mjs`, `b1-*.test.mjs`, `curricula`, `syllabus`, `topic-order`, `wortfeld-pacing`, `german-sie`, `rule-card-overrides` |
| Lesson engine and persistence | `lesson-*.test.mjs`, `check-answer`, `progress`, `sync-outbox`, `first-run`, `first-stop`, `save-progress-ask`, `milestones` |
| Course product/player | `course-*.test.mjs`, `astro-course-front-door`, `exercise-player`, `free-door`, `readaloud`, `readiness`, `plan-status` |
| Assessment and AI tasks | `checkpoint`, `assessment-integrity`, `placement`, `exams`, `writing-course`, `speaking-*.test.mjs`, `xray`, `exam-feedback-offer`, `telc-*.test.mjs` |
| Auth/account/navigation | `account-access`, `admins`, `admin-*.test.mjs`, `login-*.test.mjs`, `signup-*.test.mjs`, `lock-*.test.mjs`, `page-login-return`, `navigation`, `profile-plan-button` |
| Purchases and customer claims | `purchases`, `purchase-route-*.test.mjs`, `claims`, `conversion-trust`, `refund-claims`, `cancel-path`, `dunning-link`, `pro-cta`, `subscription-*.test.mjs`, `trial-end-claims`, `trial-fallback`, `unlimited-claims`, `webhook-*.test.mjs` |
| SEO, design and static delivery | `astro-*.test.mjs`, `brand`, `linie-design`, `fahrschein`, `guides`, `head-tags`, `crawl-guard`, `spa-shell-h1`, `app-shell-counts`, `grammar-topic-ux`, `language-strategy`, `offers`, `llms`, `site-*.test.mjs`, `web-performance`, `seo-performance-release`, `accessibility-security` |
| Consent, analytics and acquisition | `consent`, `attribution`, `onsite-attribution`, `funnel-events`, `launch-consent`, `launch-email`, `trial-grant` |
| Email and scheduled operations | `daily-sentence*.test.mjs`, `lifecycle*.test.mjs`, `course-reminder`, `email-*.test.mjs`, `welcome-links`, `weekly-truth`, `sentinel` |
| Support and shared content | `support*.test.mjs`, `faq-podcasts`, `social-pack`, `email-social`, `video-library-writes` |
| Database/security/dependencies | `migration-advisors`, `migrations-ledger`, `db-columns`, `rls-update-check`, `function-grants`, `trial-grant`, `astro-deps`, `unpatched-deps` |
| Repository maintenance | `repository-guidance` checks current authority/commands/catalogues; shared-data, archive and audit-server regression suites protect the B6 tooling boundaries |

Names without an extension mean `tests/<name>.test.mjs`. Patterns are navigation hints;
`package.json` is authoritative for the focused commands' exact file selection. The course
command covers level content, course/lesson/assessment/persistence suites; the site command
covers Astro, claims/design, crawl/head/navigation, performance and repository guidance.
Neither replaces `npm test`, lint, duplicate checks or function syntax checks.

No suite applies SQL or sends mail. Database fixtures record reviewed schema/policies;
[the migration ledger](../migrations/README.md) records application evidence separately.
Built-output checks are [scripts/check-built-html.mjs](../scripts/check-built-html.mjs)
and the full CI build/merge/prerender flow, not an implied side effect of focused tests.
