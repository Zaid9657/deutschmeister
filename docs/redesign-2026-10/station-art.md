# Station artwork (Higgsfield · Recraft V4.1 vector) — in progress

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
| A1.1 | Hotel reception, a greeting | `a9a71091-88bf-4cb4-bcea-9661d0544560` | generated |
| A1.2 | Bakery counter, buying bread | — | blocked: Higgsfield daily limit (grace period) |
| A2.1 | Doctor's practice | — | blocked: daily limit |
| A2.2 | Service office, booking an appointment | `489f80cf-4e3e-478c-863a-090871ffd963` | generated |
| B1.1 | Colleagues discussing a plan | — | blocked: daily limit |
| B1.2 | Rainy train platform, umbrella | `bc31c4c4-1e55-4d3e-b59d-378184aa8b6b` | generated |
| B2.1 | Phone call by a window, planning a visit | `26526b42-a126-47d0-99f8-4d42e05cecd5` | generated |
| B2.2 | Three people weighing pros and cons | — | blocked: daily limit |

The four missing scenes need the Higgsfield daily limit to reset (the account is in a grace
period) or a plan update. The set is placed on the site only when all eight exist, so no level
looks unfinished next to another.

**Transfer note.** The agent proxy blocks Higgsfield's CDN (`*.cloudfront.net`) and Composio's
file links; the files reach the repo by fetching, minifying and gzip+base64-encoding them in
Composio's remote sandbox and decoding them here.
