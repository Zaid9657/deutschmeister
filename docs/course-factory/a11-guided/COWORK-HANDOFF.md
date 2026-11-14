# Cowork handoff: the A1.1 look and sound, made with Higgsfield — 2026-11-14

For a Claude Cowork session on the founder's computer. It holds everything Cowork needs to
continue this work without the earlier conversation. Facts about plans and tools were checked on
2026-11-14 against the vendors' own pages; check again before relying on them later.

## Start message (the founder pastes this into Cowork)

> Read `docs/course-factory/a11-guided/COWORK-HANDOFF.md` in the GitHub repository
> `zaid9657/deutschmeister` (branch `claude/admiring-cerf-wmolgb`) and the Notion page
> "DeutschMeister — Shared Board". You are the studio for the A1.1 course: you make its pictures,
> clips and voices on higgsfield.ai in my browser, one piece at a time, and show me each one for a
> yes or no. Do not change code. Start with step 1 of "Production order" and tell me what you
> need from me.

## The goal

A learner finishes A1.1 without a teacher, a book or a language school, and comes back every day.
Sales number this serves: learners who return on a second day (16 of 165 sign-ups did, before the
new lessons), because the course will be sold as one subscription.

Every day the learner must feel three things (founder, 2026-11-14): **taken care of, optimistic,
proud of progress and learning.** Pictures and voices are judged against these, not against
beauty alone.

## Where the course stands

- All twelve A1.1 Lektionen run on the new guided flow and are live on deutsch-meister.de.
- Draft pull request `zaid9657/deutschmeister#258` holds the end-of-lesson proof, the locked path
  and the daily loop (Today card, quick win, proud close). Not live yet.
- A teacher-style review scored the course 17.2 of 25 ("does not yet teach without a teacher").
  The largest open gaps: real audio on every device, more required speaking, seven pieces of
  teaching the can-dos promise but the lessons do not contain.
- Look today: Lektion 1 has one painted scene and the teacher has a painted portrait. Lektionen
  2–12 and all eight story characters still show simple placeholder drawings.
- Sound today: the browser's computer voice. A phone without a German voice has no sound at all.

## Who does what

| Who | Does |
|---|---|
| **Cowork** (this session) | Makes pictures, clips and voices on higgsfield.ai in the founder's browser; shows each to the founder; records every approved piece in the Notion ledger (below). Never edits code, prices, claims or live settings. |
| **Claude Code** (repository sessions) | Collects approved pieces from the Higgsfield account through the connector (reading is free), converts them, wires them into the course, runs every check, opens the pull request. |
| **Founder** | Says yes or no to each piece. Decides anything about money, brand messages, legal text and going live. |

## Higgsfield: what the account can do (checked 2026-11-14)

- Plan: Ultra. Credits in the account: 0.2. The plan page lists 3,000 credits a month; none have
  arrived in this account. **Open question for the founder:** is Ultra paid, or a trial?
- Without credits, **on higgsfield.ai only** (source: Higgsfield pricing page and help page
  "What are Unlimited models"): GPT Image 2.6, GPT Image 2.5, Nano Banana Pro and Seedream 5.0 Pro
  for 60 days; Seedance 2.5 video for 14 days; free generations for Soul V2, Soul Cinema and
  Genjutsu. Voice-over on the website has also run at 0 credits in this account.
  **The windows are running:** video first among the optional pieces.
- Through the Claude connector every generation costs credits, whatever the plan. So: generate on
  the website; use the connector only to read and collect.
- **Fair use, binding:** Higgsfield's rule for unlimited access is "personal, human use only";
  automation tools and scripting are prohibited, and unusual activity can pause the access for a
  review. Therefore: one generation at a time, at the pace of a person, with the founder present
  and approving; no loops, no scripts, no parallel tabs, no bulk queues. If the site slows or
  blocks, stop and tell the founder.
- In the generation panel switch the **Unlimited** toggle on before each run. If the toggle is
  missing, the chosen model is not covered: do not run it; pick a covered model.

## The style (already approved by the founder)

Painted scenes in the style of the Lektion 1 picture. Use these as reference images for every
new picture, so people and paint stay the same:

- Scene: `public/art/a11/l01-rezeption-1168.webp` (Higgsfield job
  `e3d92dce-2f23-4e86-a528-5ae22ca9c8e6`).
- Teacher: `public/art/a11/teacher-512.webp` (job `5ca04538-8789-498a-b7aa-0f8e4b43bba9`,
  candidate A).
- Screen concepts and the founder's choices: `docs/strategy/lesson-look-2026-11-12/`.

Rules for every picture:

- **No text, letters, numbers or signs in the picture.** Generated writing is always slightly
  wrong, and a German word in a picture is course content nobody checked. Forms, price tags,
  departure boards and calendars are blank shapes.
- Adults; contemporary everyday Germany (Bremen); warm, calm, friendly. Nobody is a caricature.
- Colours near the brand: teal as the one strong colour, apricot and lime as warm seconds, warm
  off-white light. No red warning tones.
- Scene format: landscape 4:3 (the built size is 1168 × 880), with the two speakers in the middle
  third so a phone crop keeps both faces.
- The same person looks the same in every picture (the cast table below). **Never reuse one
  character's look for another person.**
- Frau Hoffmann is an AI teacher and is always labelled so in the product. Do not make her look
  like a real, known person.

## The cast (drawing decisions; never course facts)

| Person | Appears in | Look, repeated in every prompt |
|---|---|---|
| Ana | 1, 2, 3, 6, 8, 9, 10, 12 | young adult woman from Morocco, warm medium-brown skin, dark shoulder-length wavy hair, teal jacket over a white top |
| Frau Kaya | 1 | adult woman, light-brown skin, dark hair in a low bun, apricot blouse |
| Herr Weber | 2, 6 | middle-aged man, light skin, short grey hair, round glasses, white shirt, teal tie |
| Lena | 3, 5, 7, 8, 11, 12 | young adult woman, light skin, short blonde hair, lime-green sports hoodie |
| Tim | 4, 5, 7, 11 | young adult man, medium-brown skin, short curly dark hair, teal sweater |
| Frau Wolf | 4 | older woman, light skin, grey hair tied back, apricot scarf over a dark cardigan |
| Paul | 9 | adult man, light skin, short black hair, white shirt, dark waiter's apron |
| Herr Schmidt | 10 | middle-aged man, medium-dark skin, short dark hair, small moustache, teal uniform jacket, flat railway cap |
| Frau Hoffmann (teacher) | every day | woman in her early forties, chestnut hair, round glasses, teal cardigan |

Ana and Frau Kaya already exist in the Lektion 1 painting: take their faces from it.

## Production order

Each step ships by itself. Steps 1–3 fill places the course already has, so they go live with no
new code. Later steps need a small build, which Claude Code does when the pieces exist.

### 1. Cast portraits (8 pictures) — fills the character avatars

One head-and-shoulders portrait per story character, square, plain warm background, friendly
direct look, in the painted style. Save each approved portrait on Higgsfield as a reusable
character reference (an "Element"), so scenes can use several people at once.

### 2. One scene per Lektion (11 pictures; Lektion 1 exists) — fills the lesson headers

| Lektion | Scene | People |
|---|---|---|
| 2 | A counter in the public office (Bürgerbüro); a blank form and a pen between them | Herr Weber, Ana |
| 3 | The course-room break corner; Ana shows a family photo on her phone | Lena, Ana |
| 4 | A flea-market stall with a lamp, a table, a chair and a shelf | Tim, Frau Wolf |
| 5 | A classroom table with a dictionary, pens, scissors, a ruler, a notebook; bags being unpacked | Lena, Tim |
| 6 | A bright office; a desk with a computer and a desk phone; Herr Weber shows Ana her place | Ana, Herr Weber |
| 7 | A park bench after class; a football beside Lena, headphones around Tim's neck | Lena, Tim |
| 8 | A corridor by a wall calendar and a clock (both blank); the two compare their week | Ana, Lena |
| 9 | A café table; coffee and cake arriving | Paul, Ana |
| 10 | A station platform with a train and a blank departure board | Ana, Herr Schmidt |
| 11 | The course room in the morning; Tim tired with a coffee, Lena lively | Lena, Tim |
| 12 | Ana's room being decorated for a birthday; a cake, an envelope | Lena, Ana |

### 3. Frau Hoffmann, three moods (3 pictures) — the three feelings

Same person, same clothes, three square pictures: **welcoming** (for the Today card: "taken care
of"), **encouraging** (after a miss: "optimistic"), **proud** (day done: "proud"). Calm, never
theatrical.

### 4. Three more moments per Lektion (36 pictures)

The course tells each dialogue in short pieces. One picture per piece keeps the eye in the story:

- an **opening** moment (the two meet; before the first line),
- a **middle** moment (the object or question the dialogue turns on: the form, the photo, the
  price, the clock, the menu, the ticket),
- a **closing** moment (the goodbye or the agreement), which also carries the story hook to the
  next Lektion.

The dialogues are in `src/data/curricula/a11.js` (`dialog.lines`, ten lines each). Keep to what
the lines say; invent no events.

### 5. One short clip per Lektion (12 clips, about 5–8 seconds) — Seedance 2.5, 14-day window

Animate the step-2 scene: small, natural movement (a greeting nod, a hand passing a form, a train
arriving). **Silent.** No generated speech: every German word a learner hears comes from the
course's own checked audio. No camera tricks; the picture must still read on a phone.

### 6. Frau Hoffmann's voice and welcome

- Choose one warm, clear German (Hochdeutsch) woman's voice, calm pace. Make three samples of the
  same sentence for the founder to choose from:
  „Guten Tag und willkommen. Ich bin Frau Hoffmann. Wir lernen heute zusammen Deutsch.“
- After the choice: a welcome clip of about 10 seconds with her portrait speaking that sentence.
- Her texts for the daily card are drafts awaiting the founder's approval
  (`docs/course-factory/a11-guided/daily-message-drafts.md`). Record nothing from them before he
  approves the wording.

### 7. Course audio (168 lines) — decided route

The spoken lines of the lessons (120 dialogue lines, 12 model sentences, 36 sound items) are made
by the repository's own job `scripts/generate-course-audio.mjs`: one fixed voice per character,
about 8 US cents for the whole course, and it re-renders only lines whose text changed. That job
stays the source of lesson audio, because every word must match the checked text exactly.
Higgsfield voices are for Frau Hoffmann (step 6). The founder runs the job once
(`docs/owner-prompts.md`, "Run the A1.1 course audio"); it cures the "no German voice on this
phone" problem for every learner.

## The ledger (Notion, on the Shared Board)

Add one row per piece under a heading "A1.1 studio ledger":

| Slot | Higgsfield link or job id | Model | Approved by founder (date) | Note |
|---|---|---|---|---|

Slot names: `char-ana`, `char-frau-kaya`, … ; `l02-scene`, `l02-open`, `l02-middle`, `l02-close`;
`teacher-welcome`, `teacher-encourage`, `teacher-proud`; `l02-clip`; `teacher-voice`,
`teacher-welcome-clip`. Claude Code wires only rows that carry the founder's approval date.

## The check before a piece is shown to the founder

1. No writing of any kind in the picture.
2. The people match the cast table and the earlier pictures (hair, skin tone, clothes).
3. Both speakers stay visible when the picture is cropped to a phone's width.
4. It shows what the dialogue says, nothing more.
5. Which of the three feelings does it serve? If none, it is decoration: leave it out.

## Never

Money-back guarantees; invented numbers of learners or results; prices typed by hand; a promise
of exam success; text in pictures; one face used for two people; generated speech in clips;
anything sent to learners or published without the founder's yes; changes to code, to
`CLAUDE.md`, to live settings, to Lemon Squeezy or to the database.

## How the founder likes to work

Short answers, the conclusion first. One question at a time. Say plainly who does what. He is
usually tired after clinical work: show him two or three finished options, not a list of choices
to think through. Record each decision on the Notion board the moment he makes it.
