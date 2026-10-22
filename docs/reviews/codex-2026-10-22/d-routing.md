### 1. Consent withdrawal can leave analytics running
- Severity: HIGH
- Confidence: high
- Location: public/consent.js:36; src/lib/analytics.js:37; src/lib/analytics.js:63; src/lib/analytics.js:90; src/lib/analytics.js:101
- What breaks: A learner withdraws consent while PostHog is loading, but it initializes afterward. Withdrawing in another tab also leaves the original tab sending events and identification despite shared storage saying `declined`.
- Evidence: Deferred initialization never rechecks consent; withdrawal returns immediately when `initialized` is false. Consent events reach only the current window, while `capture()` and `identify()` check initialization rather than current consent. In-memory reproductions confirmed both paths.
- Fix: Recheck consent before deferred initialization, capture and identification. Handle storage changes in the shared consent script so every open tab updates GA and PostHog permissions.

### 2. Hidden grammar topics remain published and indexable
- Severity: HIGH
- Confidence: high
- Location: netlify/functions/admin-content.mjs:109; astro-site/src/lib/grammar.js:126; astro-site/src/lib/grammar.js:136; astro-site/src/lib/grammar.js:193; astro-site/src/pages/grammar/[level]/[slug].astro:56
- What breaks: An administrator hides or archives a grammar topic. The panel reports it invisible, but the next build still publishes its lesson, hub links and sitemap entry. Withdrawn teaching material remains discoverable.
- Evidence: Administration sets `is_published=false`, but network queries and cache readers never filter that flag. Static paths include every returned topic. Anonymous SELECT policies permit these reads. An in-memory hidden-topic fixture appeared in all four topic loaders.
- Fix: Filter publication status consistently in network and cache readers, including paths, hubs, detail lookup and sibling navigation.

### 3. Mid-build outages mix live routes with incompatible cached content
- Severity: MEDIUM
- Confidence: high
- Location: astro-site/src/lib/grammar.js:74; astro-site/src/lib/grammar.js:193; astro-site/src/pages/grammar/[level]/[slug].astro:56; astro-site/src/pages/grammar/[level]/[slug].astro:66
- What breaks: A topic added after the cache dump is successfully enumerated from Supabase. Supabase then fails, so its content loads from the older cache and becomes a redirect page instead of a lesson. Cached navigation can also reference topics absent from the live path list.
- Evidence: Successful reads return immediately; only later failures switch `contentCache`. Missing cached topics return `null`, triggering `Astro.redirect('/grammar', 302)`. The in-memory reproduction generated the live path and subsequently returned no topic.
- Fix: Choose one complete snapshot before generating routes. If live acquisition fails, use the committed snapshot for both route enumeration and page rendering.

### 4. X-Ray grammar recommendations consistently produce nonexistent URLs
- Severity: MEDIUM
- Confidence: high
- Location: src/pages/SentenceXRay.jsx:189; netlify/functions/analyze-sentence.mjs:42; netlify.toml:503
- What breaks: A learner expands an analyzed word and clicks “Learn more.” A valid recommendation such as `dative-case` opens `/grammar/a1.1/dative-case/`, returning a real 404 instead of the existing A2.1 lesson.
- Evidence: Every destination hardcodes `/grammar/a1.1/`. Comparing the function’s 14 permitted recommendation slugs against the cache found zero valid A1.1 destinations; some permitted slugs exist nowhere.
- Fix: Resolve recommendations through a shared registry of real `{level, slug}` destinations. Restrict model suggestions to that registry and omit unresolved links.

### 5. Astro’s “Continue learning” sends free learners to the subscription page
- Severity: MEDIUM
- Confidence: high
- Location: astro-site/src/pages/index.astro:103; astro-site/src/layouts/Layout.astro:249; astro-site/src/layouts/Layout.astro:456; src/components/SubscriptionGuard.jsx:65
- What breaks: A signed-in learner with an expired trial and no purchases clicks “Continue learning” on an Astro page. They reach `/subscription` instead of continuing free A1.1; the homepage also hides their free-course CTA.
- Evidence: Astro targets `/dashboard` for any stored session. Dashboard’s guard rejects expired access without purchases. Conversely, Navbar.jsx:100 explicitly requires continuation to resume a course and uses `courseHomeFor()`.
- Fix: Apply the SPA’s course-entry rule to Astro continuation links, with `/course/a1.1` as the free fallback.

### 6. Signing out opens the SPA’s missing homepage route
- Severity: MEDIUM
- Confidence: high
- Location: src/components/Navbar.jsx:73; src/App.jsx:552
- What breaks: Successful sign-out from either navbar ends on “Page Not Found” at `/`. Refreshing then loads the actual homepage.
- Evidence: The handler calls `navigate('/')`. React handles that locally, but deliberately has no `/` route, so its wildcard renders `NotFoundPage`.
- Fix: Use `window.location.assign('/')` or `replace('/')` after sign-out to load the Astro homepage.

### 7. Legacy course homes’ “All courses” link opens a client-side 404
- Severity: MEDIUM
- Confidence: high
- Location: src/pages/CourseHomePage.jsx:154; src/App.jsx:552
- What breaks: An authorized A1.2, A2.1 or A2.2 learner clicks “All courses” in their course footer and sees “Page Not Found.” Refreshing loads the catalogue correctly.
- Evidence: `<Link to="/courses/">` performs local React navigation. `/courses/` exists only in Astro, with no corresponding React route.
- Fix: Use `<a href="/courses/">` or add `reloadDocument`.

### 8. Prerendered schemas survive navigation onto unrelated pages
- Severity: MEDIUM
- Confidence: high
- Location: scripts/prerender-spa-routes.mjs:658; src/components/SEO.jsx:67
- What breaks: Loading `/podcasts/` duplicates its PodcastSeries, FAQPage and breadcrumb schemas when React mounts. Navigating to X-Ray leaves the original podcast schemas attached to the new page.
- Evidence: Route-specific JSON-LD scripts lack `data-rh="true"`, while Helmet emits additional scripts. Under the documented reconciliation rule, Helmet cannot replace or remove those original scripts outside React’s root.
- Fix: Stamp route-specific prerendered JSON-LD with `data-rh="true"`. Keep the deliberately site-wide shell schemas unstamped.

### 9. Podcast SEO promises free access that requires paid entitlement
- Severity: MEDIUM
- Confidence: high
- Location: scripts/prerender-spa-routes.mjs:149; scripts/prerender-spa-routes.mjs:423; src/pages/PodcastsPage.jsx:131; src/components/LevelSubscriptionGuard.jsx:42
- What breaks: Search engines receive a visible FAQ and structured data saying all podcasts are free and higher levels require only a free account. An account whose trial expired cannot access those higher-level podcasts without Pro or a relevant purchase.
- Evidence: The indexed answer says “all podcasts are free to listen to.” Episode destinations use `/level/:level`, whose guard redirects accounts without `hasLevelAccess(level)` to `/subscription`.
- Fix: Correct both prerendered and React metadata to distinguish permanently free A1.1 from higher-level access through trial, Pro or a corresponding purchased course.

### 10. Country-domain search referrals acquire permanently incorrect sources
- Severity: MEDIUM
- Confidence: high
- Location: public/attribution.js:100; public/attribution.js:147; src/lib/attribution.js:37
- What breaks: A first visitor from Google UK acquires source `co`; Google Australia becomes `com`. Signup preserves those incorrect channels in acquisition reporting.
- Evidence: Search source uses `host.split('.').slice(-2)[0]`. Executing the actual classifier returned `google.co.uk → co`, `google.com.au → com` and `yahoo.co.jp → co`. First-touch merging preserves the result.
- Fix: Map recognized search-host patterns to explicit canonical sources such as `google` and `yahoo`.

### 11. Failed sibling queries silently remove lesson navigation
- Severity: LOW
- Confidence: high
- Location: astro-site/src/lib/grammar.js:254; astro-site/src/pages/grammar/[level]/[slug].astro:683; astro-site/src/pages/grammar/[level]/[slug].astro:700
- What breaks: A Supabase error on the final sibling query produces a successful lesson build without Previous or Next links, lasting until another deployment.
- Evidence: The query destructures only `{ data: siblings }`, ignoring its error. Null data becomes an empty array, producing `prev:null,next:null`; neither retries nor emergency fallback runs.
- Fix: Destructure and throw the sibling-query error so the existing retry and fallback wrapper handles it.

### 12. React’s podcast schema identifies an HTML page as its feed
- Severity: LOW
- Confidence: high
- Location: src/pages/PodcastsPage.jsx:102; scripts/prerender-spa-routes.mjs:381
- What breaks: A consumer following the React-rendered PodcastSeries feed URL receives HTML instead of RSS.
- Evidence: React sets `webFeed` to `/podcasts/`. The prerendered schema correctly uses `/podcast-feed.xml`, explicitly documenting that the HTML URL is unsuitable.
- Fix: Change React’s `webFeed` to `https://deutsch-meister.de/podcast-feed.xml`.

### 13. Grammar “Questions” links jump to related topics
- Severity: LOW
- Confidence: high
- Location: astro-site/src/pages/grammar/[level]/[slug].astro:184; astro-site/src/pages/grammar/[level]/[slug].astro:636; astro-site/src/pages/grammar/[level]/[slug].astro:665
- What breaks: On lessons with FAQs, such as nouns and gender, selecting “Questions” in the contents jumps to lesson recommendations instead of the answers.
- Evidence: The contents targets `#questions`, but that ID belongs to Related Topics. The actual FAQ section has no ID.
- Fix: Move `id="questions"` to the FAQ section.

## Checked and fine

- All 49 concrete React route declarations have Netlify rewrite or prerender coverage.
- Unknown grammar, comparison and guide paths reach the real-404 fallback.
- Shared navigation and generated program grammar links follow the documented destination and slash rules.
- Merge order preserves the SPA shell and copies every Astro output directory.
- In-memory prerender execution produced correct canonical slash forms and removed noindex from all eight intended routes.
- CI includes offline Astro generation, shared merging, prerendering and full HTML validation.
- HTML cache rules do not apply the immutable asset policy to page URLs.
- Robots groups, sitemap references, legal-draft noindex and the static meta/canonical marker contract were checked.
- Initial analytics loading respects consent; attribution preserves first touch and excludes click IDs.
- Six focused read-only test files passed.
- Full build and browser verification were unavailable because dependencies and `dist/` are absent. No files were changed.