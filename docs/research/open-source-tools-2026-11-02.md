# Open-source tools and repos for the DeutschMeister tutor (2026-11-02)

Founder's ask, verbatim: "how can we crush the competition by applying open source tools to tutor the users", then "research open source tools that can be relevant somehow", then "research github repos". Stars, licences and last-push dates below were read from the GitHub API on 2026-11-02; everything else from vendor pages and papers found the same day. Nothing here is installed or tested yet.

## Bottom line

Every competitor rents the same AI, so the tools alone do not win. Four experiences built on them would, because they are hard to copy and visible in a 60-second demo:

1. **A live examiner** that interrupts, follows up and grades on the real telc criteria in under a second.
2. **Pronunciation at the sound level** ("the ch in *Rechnung* failed"), which nobody in the German exam niche offers.
3. **A tutor with memory** that brings back exactly last week's mistakes.
4. **Embedding inside schools' Moodle**, which turns B2B distribution into a plugin instead of a sales pitch.

Order by money: the live examiner (sells the €149 package to schools and recruiters), then Moodle (reaches them in bulk), then pronunciation (its calibration data becomes the moat), then memory.

## 1. The live examiner stack

| Repo | Stars | Licence | Last push | What it gives us | Verdict |
|---|---|---|---|---|---|
| [livekit/agents](https://github.com/livekit/agents) | 15,064 | Apache-2.0 | 2026-11-02 | Real-time voice agent framework on a self-hostable WebRTC server; turn detection, interruptions, cascaded VAD→STT→LLM→TTS, 400–800 ms voice-to-voice | **Use.** We already run a LiveKit voice engine in-house |
| [pipecat-ai/pipecat](https://github.com/pipecat-ai/pipecat) | 17,009 | BSD-2-Clause | 2026-11-02 | Same job, Python pipeline model; can run on LiveKit transport | Alternative if the team prefers Python pipelines |
| [snakers4/silero-vad](https://github.com/snakers4/silero-vad) | 10,581 | MIT | 2026-10-22 | Speech/silence detection, so silent clips never hit paid ASR | **Use** (Codex plan: GO prototype) |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | 26,415 | MIT | 2026-11-02 | Whisper large-v3 / v3-turbo on CTranslate2; German WER ~7 % class | **Use** for self-hosted ASR. Note: the "German-tuned" turbo checkpoints on Hugging Face (primeline, reality-interface) are **CC-BY-NC**, not for us; the base OpenAI weights are MIT |
| [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp) | 54,873 | MIT | 2026-10-30 | Whisper on CPU/edge, 8 GB laptops | Option for on-device dictation; not needed server-side |
| [m-bain/whisperX](https://github.com/m-bain/whisperX) | 25,026 | BSD-2-Clause | 2026-10-22 | Word-level timestamps + alignment on top of Whisper | **Use** for word timing in speaking feedback |
| Voxtral (Mistral, open weights) | – | Apache-2.0 | 2026-02 | Streaming ASR, 13 languages incl. German, 5.9 % WER vs Whisper 7.4 % on FLEURS; Mini Transcribe V2 is API-only, Realtime is open | Benchmark against Whisper on our learners' accents before choosing |
| [resemble-ai/chatterbox](https://github.com/resemble-ai/chatterbox) | 27,512 | MIT | 2026-07-21 | TTS with zero-shot voice cloning, Multilingual V3 covers 23+ languages incl. German; output carries an inaudible watermark | **Use** for the examiner's voice (one consistent German voice per examiner persona) |
| [hexgrad/kokoro](https://github.com/hexgrad/kokoro) | 9,875 | Apache-2.0 | 2025-08-06 | 82M-parameter TTS, best quality-per-size, CPU-friendly | **No**: no German voice |
| [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl) | 6,137 | GPL-3.0 | 2026-11-02 | Fast local TTS, German voices (e.g. Thorsten); each voice has its own licence | Only for batch course audio, run as a separate process (GPL); check each voice's licence |

Honest latency note: a cascaded open stack lands at 400–800 ms voice-to-voice (LiveKit's own numbers). Good enough for an examiner; not "instant".

## 2. Pronunciation at the sound level

| Repo | Stars | Licence | Last push | What it gives us | Verdict |
|---|---|---|---|---|---|
| [MontrealCorpusTools/Montreal-Forced-Aligner](https://github.com/MontrealCorpusTools/Montreal-Forced-Aligner) | 1,915 | MIT | 2026-10-22 | Phoneme alignment with a pretrained **German acoustic model and G2P** | **Use** as the alignment layer |
| [Halleck45/OpenPronounce](https://github.com/Halleck45/OpenPronounce) | 178 | MIT | 2026-08-15 | Phoneme-level scoring: wav2vec2 trained on espeak phoneme labels (multilingual checkpoint) + espeak-ng reference + edit-distance alignment; self-hosted alternative to Azure Pronunciation Assessment. English-tuned thresholds; the author says it is a calibrated heuristic, not a model trained on learner speech | **Fork and calibrate for German**: the architecture is exactly what we need, the calibration is the work |
| [crazycloud/mispronunciation-detection-diagnosis-wav2vec2-and-llm](https://github.com/crazycloud/mispronunciation-detection-diagnosis-wav2vec2-and-llm) | small | – | – | Same recipe plus an LLM that turns phoneme diffs into feedback; the author found the LLM stops hallucinating once sequences are aligned first | Reference for the feedback layer |
| [speechbrain/speechbrain](https://github.com/speechbrain/speechbrain) | 11,917 | Apache-2.0 | 2026-10-14 | Speech toolkit (ASR, alignment, GOP recipes) | Toolbox if OpenPronounce's heuristic is not enough |
| Goodness-of-Pronunciation research (Interspeech 2024, arXiv 2507.16838) | – | – | 2025 | Segmentation-free GOP: phoneme scores without a forced segmentation step | The method to implement once we have learner recordings |

What makes this a moat: it needs 50–200 consented German learner recordings rated by a human, and that data set is ours alone. Codex's estimate stands: 60–100 hours.

## 3. Writing: grammar, level and the exam rubric

| Repo / resource | Stars | Licence | Last push | What it gives us | Verdict |
|---|---|---|---|---|---|
| [languagetool-org/languagetool](https://github.com/languagetool-org/languagetool) | 15,229 | LGPL-2.1 | 2026-11-02 | German spelling and grammar rules, self-hosted server | **Use** as a deterministic first pass before the AI rubric evaluation (Codex plan: GO comparison) |
| [explosion/spaCy](https://github.com/explosion/spaCy) | 34,015 | MIT | 2026-10-27 | German pipelines (lemmas, POS, syntax) | **Use** for level heuristics and task selection, never for certification |
| [MERLIN corpus](https://www.merlin-platform.eu/) | – | public research corpus | – | ~1,000 error-annotated German learner texts, A1–C2, CEFR-rated | **Use** to calibrate the writing evaluator against real learner errors and to build regression tests |
| [noahmanu/gervlpro](https://github.com/noahmanu/gervlpro) (LREC 2026) | 2 | – | 2026-05-12 | 4,015 CEFR-graded lemmas of what learners actually *produce* at A1–C1; paper shows GPT-4o/5 estimate word level only weakly | **Use** to check whether a learner's text uses B1-level vocabulary, and to grade our own course texts |
| Goethe A1–B1 and telc Wortschatz lists | – | official PDFs | – | The prescriptive exam vocabulary | **Use** as the exam-side reference |

## 4. Memory and practice

| Repo | Stars | Licence | Last push | What it gives us | Verdict |
|---|---|---|---|---|---|
| [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | 848 | MIT | 2026-10-29 | FSRS scheduling in TypeScript, drop-in for our fixed 1/4/7/14/60/180-day ladder | **Use** once review history exists (Codex: wait for owner-applied schema) |
| [h5p/h5p-php-library](https://github.com/h5p/h5p-php-library) | 154 | GPL-3.0 | 2026-11-02 | Interactive content authoring (dictation, branching) | **No**: our React exercises already cover it |
| [LibreTranslate/LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) | 17,256 | AGPL-3.0 | 2026-10-26 | Self-hosted machine translation (Arabic, Turkish, Ukrainian, Russian…) | Maybe, for first-language hints in A1; AGPL means it stays a separate service |

## 5. Brains (open LLMs)

| Model | Licence | What it gives us | Verdict |
|---|---|---|---|
| openGPT-X Teuken-7B-instruct-commercial-v0.4 | Apache-2.0 | 7B model trained on all 24 EU languages; project ended March 2025, model archived on Hugging Face | Candidate for cheap unlimited practice turns; quality unverified |
| ellamind / DiscoResearch (DiscoLM, Llama3-German) | mixed | The most active German open-LLM lab; see [johko/awesome-german-open-source-ml](https://github.com/johko/awesome-german-open-source-ml) | Candidate for the same job |
| Qwen3 family | Apache-2.0 | Strong multilingual open weights (Codex plan: 24–40 h benchmark, NO-GO production now) | Benchmark |

Honest line: hosted Claude/GPT still grade better than any 7B model. Open models matter for one thing only: near-zero marginal cost per practice turn, which lets us sell "unlimited speaking" flat while competitors meter minutes.

## 6. Distribution technology (the sleeper)

| Repo | Stars | Licence | Last push | What it gives us | Verdict |
|---|---|---|---|---|---|
| [moodle/moodle](https://github.com/moodle/moodle) | 7,574 | GPL-3.0 | 2026-10-30 | The LMS most integration-course providers and vhs run; LTI 1.3 lets an external tool launch inside a course with the school's roster | **Build an LTI 1.3 launch**: a school embeds DeutschMeister in its Moodle in an afternoon, with seat-based billing. This is the B2B wedge, 1,615 BAMF providers deep |

## Lists worth mining

- [awesome-german/learning-tools](https://github.com/awesome-german/learning-tools) (CC-BY-4.0): German learning apps and materials, with official telc/Goethe practice tests.
- [johko/awesome-german-open-source-ml](https://github.com/johko/awesome-german-open-source-ml): every German open-source ML lab (LLäMmlein, ModernGBERT, SuperGLEBer benchmark).
- [open-spaced-repetition/awesome-fsrs](https://github.com/open-spaced-repetition/awesome-fsrs): FSRS ports and the trainable spaced-repetition model for language learning.
- [gotutiyan/GEC-Info](https://gotutiyan.github.io/GEC-Info/): grammatical error correction papers and datasets, including German.

## What we would build, in order (prototypes, not production)

| # | Prototype | Stack | Hours (Codex/Claude estimate) | Sales number it moves |
|---|---|---|---|---|
| 1 | Live telc examiner, one Teil, real criteria, 60-second demo | livekit/agents + silero-vad + faster-whisper (MIT weights) + Chatterbox German voice; our rubric | 40–60 | Partner and school demos → €149 package sales |
| 2 | Moodle LTI 1.3 launch | moodle LTI spec + our auth | 24–40 | Seat deals with integration-course providers |
| 3 | Pronunciation feedback for 20 A1/B1 sentences | MFA German + OpenPronounce fork + 50 rated learner clips | 60–100 | Demo differentiator; the data moat |
| 4 | Mistake memory | ts-fsrs over the learner's own errors | 16–24 | Retention after the trial (9 of 12 payers bought late) |
| 5 | Deterministic writing pre-check | LanguageTool server + MERLIN regression set | 12–20 | Trust in the writing grade |

## Licence landmines

- Piper's engine is GPL-3.0 and LibreTranslate is AGPL-3.0: run them as separate services, never linked into our code.
- Chatterbox output is watermarked (inaudible, detectable): fine for an examiner voice, say so in the privacy page.
- Kokoro has no German voice; the German-tuned Whisper checkpoints on Hugging Face are non-commercial.
- MERLIN and Falko are research corpora: check the terms before any commercial training use; using them to test is safe.

Sources read 2026-11-02: GitHub API (stars, licences, pushes); livekit.com and micdrop.dev framework comparisons; Northflank and weesperneonflow STT benchmarks; Cartesia, texttolab and localaimaster TTS licence tables; MFA docs; OpenPronounce README; MERLIN platform; GerVLPro (LREC 2026); OpenGPT-X/Teuken pages.
