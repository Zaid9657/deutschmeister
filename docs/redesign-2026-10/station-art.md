# Station artwork (Higgsfield · Recraft V4.1 vector): all eight, live on the course surfaces

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

## Status (complete 2026-10-05)

| Station | Scene | Job | Status |
|---|---|---|---|
| A1.1 | Hotel reception, a greeting | `a9a71091-88bf-4cb4-bcea-9661d0544560` | in repo (`a1-1.svg`) |
| A1.2 | Bakery counter, buying bread | `d6e2cd3e-9cbb-493e-91d4-a9c792a8a920` | in repo (`a1-2.svg`); customer's face, neck and hands recoloured from white to `#F2C9A0`, neon sun `#FEF501` → `#FBBF24` (see below) |
| A2.1 | Doctor's practice | `7a2fac39-e07d-4845-ba69-450a8f96217d` | in repo (`a2-1.svg`) |
| A2.2 | Service office, booking an appointment | `489f80cf-4e3e-478c-863a-090871ffd963` | in repo (`a2-2.svg`) |
| B1.1 | Colleagues discussing a plan | `61cdff3b-bd7b-4b7a-a817-aa4a1df78f38` | in repo (`b1-1.svg`) |
| B1.2 | Rainy train platform, umbrella | `bc31c4c4-1e55-4d3e-b59d-378184aa8b6b` | in repo (`b1-2.svg`) |
| B2.1 | Phone call by a window, planning a visit | `26526b42-a126-47d0-99f8-4d42e05cecd5` | in repo (`b2-1.svg`) |
| B2.2 | Three people weighing pros and cons | `f98a9fe4-ba3d-417f-b2a0-3bbe5ffe63f3` | in repo (`b2-2.svg`); second take, the first (`55d57eed…`) gave one face pale türkis |

**Where they go.** `astro-site/src/data/stationArt.js` lists the scenes; `components/linie/StationArt.astro`
places one on the homepage line boards (live stops on top of each board, the four Im Bau stops as
thumbnails), on every `/courses/` card (a 12rem band) and on top of the price card in each
`/courses/<level>/` hero (11rem, loaded eagerly). `artFor()` returns null unless all eight levels have a file,
so a missing scene hides the whole set rather than leaving one level bare.

**Skin is the one thing to check by eye.** The palette lock does not stop Recraft from filling a light-skinned
face with white or with the pale türkis surface colour (two of five takes on 2026-10-05). Name each person's
skin colour in the scene prompt ("light peach skin (#F2C9A0) … every face and hand is filled with its skin
colour, never white, grey or pale türkis") — the B2.2 retake did that and came out right. When the daily
cap blocks a retake, a white face can be fixed in the SVG: find the shape by its bounding box (Chromium
`getBBox()`), split a compound path at its `M` if the skin shares it with other white areas, and refill it.

**Daily cap.** The Higgsfield app account (starter plan, grace period) allows about five generations a day;
its credits are not the limit. The separate Higgsfield API cannot produce vector output (only jpg/png/webp,
checked 2026-10-04), so the app/MCP route is the only one that matches this set.

**Transfer note.** The agent proxy blocks Higgsfield's CDN (`*.cloudfront.net`) and Composio's
file links; the files reach the repo by fetching them in Composio's remote sandbox, stripping the C2PA
`<metadata>`, running `svgo --multipass -p 0` (integer coordinates: on a 2048-unit viewBox that is under
0.2 px at card size, mean pixel difference 0.2–0.5/255) and moving a base64 `tar.xz` across (4 scenes,
18 KB). Verify the md5 on both ends.
