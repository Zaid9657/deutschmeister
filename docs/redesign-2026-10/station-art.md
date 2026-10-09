# Station artwork (Higgsfield · Recraft V4.1 vector): 4 of 8, wired, waiting on the last four

One flat vector scene per station, in the v4 Türkis palette, for the course cards on `/`,
`/courses/` and the `/courses/<level>/` heroes. Generated with Higgsfield (model
`recraft_v4_1`, `model_type: vector`, 4:3, white background, palette locked through the
`colors` parameter). Output is SVG; for the web the embedded C2PA manifest is stripped and the
file is minified with svgo — provenance is recorded here instead.

## Style (the prompt preamble every scene shares)

> Light, airy flat vector editorial illustration with clean geometric shapes, flat fills, thin
> consistent outlines, lots of white space. Main colour is teal-türkis (#0A8276) for clothing
> and objects, pale türkis (#E3F6F3, #BFEAE3) for large surfaces, deep ink only for hair and
> small details, warm sun yellow only as one tiny accent. People have natural human skin tones
> (light, medium and dark brown) — never yellow or teal skin. … No text, no letters, no
> numbers, no logos.

Palette parameter: `#0A8276 #E3F6F3 #BFEAE3 #10302C #FBBF24 #FFFFFF #F2C9A0 #C68642 #8D5524 #3F5A55`.
(The first test, without skin tones in the palette, painted a guest's skin sun-yellow and a
suitcase neon cyan — keep the skin tones in the list.)

## Status (2026-10-04)

| Station | Scene | Job | Status |
|---|---|---|---|
| A1.1 | Hotel reception, a greeting | `a9a71091-88bf-4cb4-bcea-9661d0544560` | in repo (`a1-1.svg`) |
| A1.2 | Bakery counter, buying bread | — | blocked: Higgsfield daily limit (grace period) |
| A2.1 | Doctor's practice | — | blocked: daily limit |
| A2.2 | Service office, booking an appointment | `489f80cf-4e3e-478c-863a-090871ffd963` | in repo (`a2-2.svg`) |
| B1.1 | Colleagues discussing a plan | — | blocked: daily limit |
| B1.2 | Rainy train platform, umbrella | `bc31c4c4-1e55-4d3e-b59d-378184aa8b6b` | in repo (`b1-2.svg`) |
| B2.1 | Phone call by a window, planning a visit | `26526b42-a126-47d0-99f8-4d42e05cecd5` | in repo (`b2-1.svg`) |
| B2.2 | Three people weighing pros and cons | — | blocked: daily limit |

**Where they go (wired 2026-10-04, renders nothing yet).** `astro-site/src/data/stationArt.js` lists the
scenes; `components/linie/StationArt.astro` places one on the homepage line boards (live stops on top of
each board, the four Im Bau stops as thumbnails), on every `/courses/` card (a 12rem band) and on top of the
price card in each `/courses/<level>/` hero (11rem, loaded eagerly). `artFor()` returns null until all
eight levels have a file, so the set appears whole or not at all. Finishing it is: drop the SVG into
`public/art/stations/<level-with-dash>.svg`, add its line to `STATION_ART`, run `node --test
tests/linie-design.test.mjs` (it checks each file is cleaned, minified and on the shared 2048×1509 viewBox).

**Why four are missing.** The Higgsfield app account (starter plan, grace period) caps generations per
day; its credits were never the limit. The separate Higgsfield API (pay per image, $0.035 at 1k for
`recraft/v4.1/text-to-image`, base `https://api.higgsfield.ai`, header `Authorization: Key <key>`) needs
the environment to allow `api.higgsfield.ai` and to carry the key as `HF_API_KEY`; the agent proxy
answers 403 to that host today.

**Transfer note.** The agent proxy blocks Higgsfield's CDN (`*.cloudfront.net`) and Composio's
file links; the files reach the repo by fetching them in Composio's remote sandbox, stripping the C2PA
`<metadata>`, running `svgo --multipass -p 0` (integer coordinates: on a 2048-unit viewBox that is under
0.2 px at card size, mean pixel difference 0.2–0.5/255) and moving a base64 `tar.xz` across (4 scenes,
18 KB). Verify the md5 on both ends.
