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
by referrer — but a tag is the only way to tell posts apart, so tag them.

## Reading the result

- Weekly mail, line `Acquisition (first-touch source)`: signups 7d/30d by source,
  course sales 30d by the buyer's source, signups by `source / campaign`.
- Admin → Marketing → Übersicht: the same three tables for the chosen range.
- SQL: `select acquisition_source, acquisition_campaign, count(*) from profiles
  where created_at > now() - interval '30 days' group by 1,2 order by 3 desc;`

`untracked` = signed up before 2026-09-20, or came direct / from an unknown
referrer with no tag. It is not "direct traffic".

## What is deliberately not stored

Click ids (`gclid`, `fbclid`, …) and full referrer URLs. Only the labels typed
into the link and the referrer host. First touch is never overwritten by a later
visit; the last source is kept separately.
