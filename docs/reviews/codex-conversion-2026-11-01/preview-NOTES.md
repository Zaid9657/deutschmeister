# DeutschMeister — confident, lively, for everyone learning German

Open [the homepage](index.html) or [the telc B1 page](telc-b1.html). All files, fonts and assets are local. Open or serve the `site` folder; no build or installation is needed.

This is my design and copy proposal, following the founder’s latest direction. The live site, the original DeutschMeister repository and both saved preview versions were left untouched. No network calls were made.

## The positioning

The homepage now welcomes people learning German for everyday life, conversations and exams. Its headline is **“Deutsch lernen. Los geht’s!”** Three paths make the choice concrete: start with A1.1, practise with Pro, or explore the telc B1 plan. The first interactive example is A1.1; visitors who already know some German can switch to B1.

The best stance is explicit: **“Unser Anspruch: Ihre beste Adresse zum Deutschlernen.”** I framed it as our ambition, rather than asserting an independently established market ranking. The bold voice continues in the invitations to try, speak and practise. The examples let visitors judge the product themselves. This does not claim guaranteed progress or a passing result.

The approved line **“Entwickelt von einem Team aus Ärzten.”** appears once per page, in the footer under **“Das Team hinter DeutschMeister.”** It explains who developed the product. It does not define the audience, introduce medical imagery, or suggest examination credentials. The hero and selling sections contain no doctor positioning.

## The look and the experience

- Large, heavy Archivo headlines replace the restrained serif-led presentation. Nunito Sans keeps the explanatory text readable. The existing Meister mark stays.
- The v2 peach, raspberry and lime accents are now replaced by the warmer, simpler palette described in **Colours v3** below. A speech bubble makes the first exercise inviting.
- Turquoise remains the action colour. Dark offer sections make the available trial and its terms easy to find among the lighter teaching sections.
- A short speech-bubble entrance, level-switch transitions and a brief sparkle after a correct answer add movement. Revealing an answer does not earn a celebration. There are no invented points, achievement badges, continuous decorative loops, sounds or autoplay. Reduced-motion settings suppress the effects.
- The B1 question now responds to one tap. The A1.1 exercise preserves the source’s capitalisation requirement. Visitors receive an explanation and can try again.
- The exam page shows the existing model letter immediately. The available Pro offer follows the example, ahead of the full syllabus. The unavailable package and the available trial remain distinct.
- The sample registration is shorter, with visible labels, password visibility, field-specific errors and a focusable error summary. It explicitly asks for example data, discards input and does not create an account, send email, store data or take payment.

## Colours v3

Warm ivory, cream and peach replace the cool mint panels and competing pink/lime accents. Apricot supplies the playful highlights; deep ink anchors the offer sections. Green remains the single action colour. This makes the pages feel warmer and more cohesive. The course reference’s teal/orange pairing informed the choice; its exact colours and the style reference’s neon suggestions were not copied.

| Role | Palette |
| --- | --- |
| Surfaces | Ivory `#FBF8F1`, white `#FFFFFF`, sand `#F2E8D9`, cream `#F8EDDB`, peach `#FAE2CD` |
| Actions and states | Green `#0A8276`, hover `#0A7468`, deep green `#075A51`, selection wash `#EAF2EC` |
| Accents | Apricot `#FFC28A`, cocoa `#724326` |
| Text / dark sections | Ink `#1C2B27`, secondary text `#535A52` |
| Lines | `#DED5C5`, `#D5C7B4` |

The preview-only palette lives in `assets/colours-v3.css`. All 47 checked text/control colour pairs meet their WCAG AA contrast thresholds; white button labels measure 4.70:1. Placeholders and disabled buttons retain explicit readable colours. Results: `../qa/colours-v3-contrast.json`. Copy, layout, interactions and the original logo are unchanged. Fresh rendered screenshots remain pending.

## UI UX Pro Max pass

I used **Product Demo + Features** (`landing.csv`, 3), the clear choices in **Feature-Rich Showcase** (31), and **Vibrant & Block-based** with **Micro-interactions** (`styles.csv`, 6 and 16). Real exercises supply product proof. The bold colours now support the founder’s broader, livelier direction.

I applied the guidance on touch spacing, readable type, visible focus, feedback, form errors, password visibility, unobscured focus and text reflow (`ux-guidelines.csv`, 23, 28, 33–34, 55, 60, 67, 100, 109–112). That includes fixing joined mobile headings, enlarging small controls, and removing the bottom bar that covered content.

I rejected automatic recommendations for testimonials, certificates, achievement systems, a video player, new fonts, competitor comparisons and changing the palette wholesale. Those recommendations are not evidence that this product has those assets or needs those features. Motion is brief and tied to entry or interaction, following `motion.csv`; no scripted repository workflow was run.

Read-only references: `/home/user/nextlevelbuilder/ui-ux-pro-max-skill/src/ui-ux-pro-max/data/` — `landing.csv`, `ux-guidelines.csv`, `ui-reasoning.csv`, `products.csv`, `styles.csv`, `typography.csv`, `colors.csv`, `motion.csv`. Only the CSV data was read.

## Truth and availability

The telc package says **“Der Kurs ist derzeit nicht buchbar.”** There is no buy button, launch countdown or invented date. The offered trial is seven days of Pro, including two writing evaluations and two speaking sessions of five minutes each, in total. It does not include the purchased course plan. No card or automatic charge is promised only for the trial.

The optional monthly Pro price is derived from `src/data/pricing.js`. I do not advertise a price for the unavailable package; the proposed pilot price and the shared source still need reconciliation before launch. The course’s included Pro period and later access terms are explained accurately.

The plan, all 20 training days, the three letters, ten speaking rehearsals and two short tests come from the implemented program. The model letter is labelled as teaching material, not customer work or a personal AI result. There are no invented testimonials, user totals, success rates, scarcity or pass promises. The address remains “Sie.”

## Visual review and verification

I reviewed the supplied v1 screenshots: desktop at 1366 pixels and phone at 390 pixels, both the first screen and the full pages. They showed an oversized phone exercise, proof hidden behind the first tab, very small supporting text, joined words in some mobile headings, and a long route to the offer. The supplied report said there were no page errors or horizontal overflow; that report applies to v1. For Colours v3, I also reviewed the supplied v2 first-screen screenshots at both sizes: the mint exercise panel, lime exam panel and mixed accent colours informed this palette change.

The latest files passed HTML structure, local link, asset, accessibility-reference and source-content checks. CSS and JavaScript parse successfully. All font files match the existing originals. Tested text/background colour pairs exceed 4.5:1, including white on the primary button at 4.70:1. This is a contrast check, not a claim of complete accessibility conformance.

**The changed version still needs fresh screenshots and a browser interaction check.** The local browser remains blocked before page load. I cannot claim a rendered check of the latest desktop or phone layout. The offline check script at `../verify-preview.cjs` has been updated for this interface; static results are at `../qa/static-verification.json`.

## What still needs the founder

For eventual package sales: settle the final package price in the shared source and complete the existing seller/legal and checkout release requirements. For publication: review the refreshed preview and authorize replacing the live pages after browser and real registration checks. Nothing has been published.

These decisions aim to make the product clearer, more inviting and easier to try. Increased paid conversion remains a hypothesis to measure through actual purchases and revenue.

## Material used

All original material below is under `/home/user/deutschmeister/`, read only.

| Material | Source |
| --- | --- |
| Price and included Pro period | `src/data/pricing.js` |
| Trial duration and allowances | `src/data/marketing.js` |
| Course weeks, tasks and timings | `src/data/programs/telcB1Komplett.js` |
| B1 exercise | `src/data/mockExams/telcB1.js`, Sprachbausteine, gap `g2` |
| A1.1 exercise and explanation | `src/data/lessonPools/a11.json`, `extra-a11-l01-06` |
| Model letter and explanation | `astro-site/src/data/guides/telc-b1-brief-beschwerde.js`, `musterbrief` |
| Trial payment reassurance | `src/pages/SignupPage.jsx` |
| Course access distinction | `src/App.jsx`, purchase guard for `/telc-b1-kurs` |
| Original colours and fonts | `src/data/design-tokens.js`, `public/fonts/`; preview palette changes are documented under Colours v3 |
| Existing mark | `src/components/Logo.jsx` |

The panels are new HTML presentations of real material. There are no fabricated product screenshots. `assets/content.js` and `assets/tokens.css` are local snapshots; production should use the canonical source files directly. The font files retain their embedded copyright and SIL Open Font License notices.
