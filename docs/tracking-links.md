# Tracking links — which social post brought each customer

Since 2026-09-20 every signup carries the link that brought the visitor
(`profiles.acquisition_source` etc.), and every course sale can be joined to it.
The capture is `public/attribution.js`; the numbers land in the Monday weekly
truth mail ("Acquisition") and on the admin Marketing page.

## How to build a link

Append parameters to any page. Lowercase, no spaces (they are lowercased anyway).

```
https://deutsch-meister.de/?utm_source=telegram&utm_medium=social&utm_campaign=a11-free
https://deutsch-meister.de/courses/a1-1/?utm_source=instagram&utm_medium=social&utm_campaign=a11-free&utm_content=reel-1
https://deutsch-meister.de/pricing/?utm_source=telegram&utm_medium=social&utm_campaign=b1-launch
```

Short form when only the channel matters: `?ref=telegram` (medium defaults to `social`).

| Parameter | Meaning | Examples |
|---|---|---|
| `utm_source` / `ref` | the channel | `telegram`, `instagram`, `facebook`, `linkedin`, `tiktok`, `youtube`, `whatsapp` |
| `utm_medium` | the kind of placement | `social`, `post`, `story`, `bio`, `dm`, `email` |
| `utm_campaign` | the push | `a11-free`, `b1-launch`, `sep-2026` |
| `utm_content` | which creative, when A/B-ing | `reel-1`, `pin`, `carousel` |

Untagged clicks from Telegram, Instagram, Facebook, LinkedIn, TikTok, YouTube,
X, WhatsApp, Reddit, Threads and Pinterest are still attributed to the channel
by referrer — but a tag is the only way to tell posts apart, so tag them. That
includes the Android apps, which send `android-app://<package>` instead of a web
referrer: the package is read as a reversed domain (`org.telegram.messenger` →
telegram), and Google's own apps are told apart by package (the Google app →
`google`/organic, YouTube → `youtube`/social, Gmail → `gmail`/email).

Until this rule was deployed (written 2026-10-01; the merge date starts it) every Google app landed in source `android` with
medium `organic`, and the Telegram app in a referral named `org.telegram.messenger`.
Read an older `android` row as "Google app on Android" (3 of the 24 tracked last
touches from 2026-09-21 to 10-01, referrer `com.google.android.googlequicksearchbox`).

## Reading the result

- Weekly mail, line `Acquisition (first-touch source)`: signups 7d/30d by source,
  course sales 30d by the buyer's source, signups by `source / campaign`.
- Admin → Marketing → Übersicht: the same three tables for the chosen range.
- SQL: `select acquisition_source, acquisition_campaign, count(*) from profiles
  where created_at > now() - interval '30 days' group by 1,2 order by 3 desc;`

`untracked` = signed up before 2026-09-20, or came direct / from an unknown
referrer with no tag. It is not "direct traffic".

## On-site doors (`utm_medium = onsite`)

Some of the site's own signup links carry a tag too, so a signup can be traced to
the page that converted it even when the visitor arrived with no referrer. They
are pages, not channels.

| `ref` (source) | Where | `utm_content` |
|---|---|---|
| `xray` | the offer under an X-Ray result and at the anonymous limit (`src/lib/xray.js`) | — |
| `grammar` | every grammar lesson (both signup doors, the locked-exercise door, the signed-out finish line, the free-course door on A1 pages), the `/grammar/` hub, the nav trial button on `/grammar/**` | the topic slug, `index`, or `nav` |
| `leitfaden` | every guide's CTA (level test, account, prices), the `/leitfaden/` hub, the nav trial button on `/leitfaden/**` | the guide slug, `index`, or `nav` |
| `level-test` | "Sign up free — save my results" under a signed-out level-test result (`src/lib/placement.js`, 2026-09-28). The result itself travels in localStorage `dm_placement` and is written to `profiles.current_level` at the first sign-in on that browser | the placed sub-level (`b1.2`) |

The grammar and guide doors are built only with `onsiteHref()` in
`astro-site/src/lib/onsiteLinks.js`; `tests/onsite-attribution.test.mjs` fails on a
bare door on those pages. The level-test door is `placementSignupHref()`, pinned by
`tests/placement.test.mjs`. A visitor who follows a guide's level-test link and then
signs up under the result is filed `level-test` in `acquisition_last_source` (last
touch wins); the guide shows only if it was the first touch.

How to read them: when `acquisition_source` is an on-site source, the visitor
had no earlier touch, i.e. arrived untracked and converted on that page. When
the first touch is a channel (say `google`), the channel stays in
`acquisition_source` and the page shows in `acquisition_last_source`. Leave
`medium = 'onsite'` out of any channel share (the scorecard's non-brand share):

```sql
select acquisition_last_source, acquisition_content, count(*) from profiles
where created_at > now() - interval '30 days'
  and acquisition_last_source in ('grammar', 'leitfaden', 'xray', 'level-test')
group by 1, 2 order by 3 desc;
```

`acquisition_content` is the FIRST touch's `utm_content`, so it names the page
only when the on-site door was the first touch.

## Our own email (`utm_source = email`)

Mail clients strip the referrer or send their own host, so an untagged click from
our mail is filed as untracked or as a source named after the webmail. Before the
tags shipped, link-started X-Ray analyses from the daily sentence showed up as
`none`, `outlook.live.com`, `ui-deref.de`, `android`, and `co` (for
`mail.yahoo.co.jp`). Every link from a mail we send into the site therefore
carries four tags:

| Parameter | Holds | Daily sentence |
|---|---|---|
| `utm_source` | always `email` | `email` |
| `utm_medium` | the mailer family | `daily` (later `lifecycle`, `launch`) |
| `utm_campaign` | the mail | `daily-sentence` |
| `utm_content` | the link inside the mail | `xray` (the X-Ray button), `footer` (the home link) |

In our own mail `email` is the source, not the medium. `utm_medium=email` (table
above) stays for a link placed in someone else's newsletter, whose name is then the
source.

**Daily sentence** (shipped 2026-10-02 in #176): `DAILY_UTM` in
`netlify/functions/daily-sentence.mjs` builds both links.

```
https://deutsch-meister.de/analyze/?s=<sentence>&utm_source=email&utm_medium=daily&utm_campaign=daily-sentence&utm_content=xray
https://deutsch-meister.de/?utm_source=email&utm_medium=daily&utm_campaign=daily-sentence&utm_content=footer
```

`tests/daily-sentence-links.test.mjs` pins them: every site link is tagged with its
own `utm_content`, the tags are fixed strings, and `public/attribution.js` reads
them back. It also checks that the unsubscribe link is untagged and byte-identical.
On 2026-10-02 this is the only mailer that tags its links. `trial-lifecycle`,
`activation-lifecycle`, `course-reminder`, `confirmation-nudge`,
`send-welcome-email` and `send-campaign` carry no `utm_` (grep of
`netlify/functions/`). The unsent launch draft `drafts/launch-sublevel-1.mjs`
already follows the scheme (`utm_medium=launch&utm_campaign=sublevel-2026-09`).

### Where a click lands

1. **`dm_attribution`** (localStorage). `public/attribution.js` runs on both
   landings: `/analyze/` (SPA) and `/` (Astro). It records the touch
   `{source: 'email', medium: 'daily', campaign: 'daily-sentence', content:
   'xray' | 'footer', referrer: <host or null>, landing: '/analyze/' | '/'}`. The
   touch always becomes `last`. It becomes `first` only on a browser with no
   earlier touch.
2. **`profiles.acquisition_*`** is written once, at signup. Daily-sentence
   recipients already have an account, so their clicks never change their own
   row. A signup is filed under `email` only when the mail was a touch on the
   browser that signs up (a forwarded mail, say). If the mail was the first touch,
   the row gets `acquisition_source = 'email'`, `_medium = 'daily'`,
   `_campaign = 'daily-sentence'` and `_content = 'xray' | 'footer'`. If it was the
   last touch, `acquisition_last_source = 'email'`.
3. **PostHog** runs only in the SPA, and only after analytics consent
   (`dm_cookie_consent`). At init, `src/lib/analytics.js` registers `dm_source`,
   `dm_medium` and `dm_campaign` from the FIRST touch. There is no `dm_content`.
   A subscriber whose browser already had a first touch keeps it in `dm_*`.
   posthog-js also has its own campaign-parameter capture, whose list includes
   all five `utm_*` (checked in 1.376.3). The X-Ray click lands in the SPA with
   its tags in the URL. The footer click lands on the Astro homepage, where
   PostHog does not run.
4. **`xray_usage.source`** (the X-Ray button only). The SPA sends
   `{ref, first, last, entry}` and the function adds `ua`. A click from the mail
   gives `entry = 'link'` (arrived with `?s=`) and `last = 'email'`. `first` is
   the browser's first-touch source. `ref` is the referrer host, or `none` when
   the mail client stripped it. Only the source label travels; campaign and
   content do not. Once a second mailer tags with `utm_source=email`,
   `xray_usage` cannot tell the mails apart. Use `dm_attribution` or PostHog for
   that.

```sql
select source->>'last' last_touch, source->>'ref' ref, count(*)
from xray_usage
where used_at > now() - interval '7 days' and source->>'entry' = 'link'
group by 1, 2 order by 3 desc;
```

### Naming rule for mailer links

- `utm_source=email` on every mail we send. `utm_medium` is the mailer family,
  `utm_campaign` the mail, `utm_content` the link inside it.
- Labels are lowercase and use only `a-z`, `0-9`, `.` and `-`, with hyphens
  between words (`daily-sentence`, `activation-d1`, `sublevel-2026-09`). Keep
  them under 60 characters. This is a **convention, not something the code
  enforces**: `_` is kept as typed (see the table below). Prefer hyphens because
  every label in use is hyphenated, and `activation_d1` and `activation-d1` would
  be two rows in every `group by`. No spaces and no `:`, because the cleaners
  disagree on those two characters.
- Fixed strings only. No user id, email address, token or send date goes in a
  tag. A tag is copied into whoever clicks: their `profiles` row, their PostHog
  properties, their `xray_usage` row. For a forwarded mail that is someone else.
  The cleaners do not strip personal data: `attribution.js` stores
  `learner1@example.test` as `learner1example.test`, and a user UUID unchanged.
  Fixed strings also let a Netlify retry rebuild byte-identical batches (the
  daily-sentence idempotency note).
- The unsubscribe link is never tagged. It is a function URL
  (`/.netlify/functions/unsubscribe?uid=…&token=…`) that carries the user id and a
  signed token, not a page, so `attribution.js` never runs there.
- Links to prerendered routes keep their trailing slash (`/analyze/`,
  `/level-test/`), as everywhere else (CLAUDE.md, trailing slashes, case 2).

### What each cleaner does with a label (verified 2026-10-02)

Run against the files themselves (`attribution.js` under `node:vm`, the other two
imported), not read off the regex:

| Code | Rule | `activation_d1` | `Daily-Sentence` | `daily sentence` | `kurs_ä1` | `x:y` |
|---|---|---|---|---|---|---|
| `clean()` in `public/attribution.js`: every `utm_*` and `ref` | trim, lowercase, delete each character outside `a-z 0-9 . _ / space -`, cut at 100 | `activation_d1` | `daily-sentence` | `daily sentence` | `kurs_1` | `xy` |
| `label()` in `src/lib/xray.js`: the source labels the SPA sends to X-Ray | trim, lowercase, delete each character outside `a-z 0-9 . _ : / -` (no space), cut at 60 | `activation_d1` | `daily-sentence` | `dailysentence` | `kurs_1` | `x:y` |
| `clean()` in `netlify/functions/_shared/xraySource.mjs`: server-side re-check | trim, lowercase, then keep the label only if all of it matches `^[a-z0-9._:/-]{1,60}$`, else `null`. It rejects; it never strips or cuts | `activation_d1` | `daily-sentence` | `null` | `null` | `x:y` |

None of the three drops `_`. A `+` or `%20` in a URL decodes to a space, so
`daily+sentence` is stored as `daily sentence` in `dm_attribution` and as
`dailysentence` in `xray_usage`. The server's `null` only appears for a caller
that bypasses the SPA, because `label()` has already stripped the label by then.

## What is deliberately not stored

Click ids (`gclid`, `fbclid`, …) and full referrer URLs. Only the labels typed
into the link and the referrer host. First touch is never overwritten by a later
visit; the last source is kept separately.
