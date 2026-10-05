import { useCallback } from 'react';
import { DEFAULT_LOCALE, LEGACY_LESSON_KEY, SUPPORTED_LOCALES, getLocale, intlLocaleFor, normalizeLocale, setLocale, useLocale } from '../locale.js';

// The lesson chrome's string table (Wave 1, 2026-09-19).
//
// WHY. Until this file the whole lesson player spoke German only — „Schritt 4 ·
// Üben", „Ihre Antwort", „Prüfen", „Weiter", „Verstanden" — and a day-one
// English-speaking beginner could not read the instructions of the app that
// was teaching them. docs/language-strategy.md: English chrome, German content.
// So the CHROME (eyebrows, buttons, labels, feedback, notices about mics and
// quotas) comes from this table in the learner's chrome language, and the
// CONTENT (dialogue lines, questions, answers, notice bodies, examples, tasks)
// stays German in the curriculum where it belongs.
//
// THREE TABLES, ONE KEY SET (Arabic added 2026-10-05, docs/arabic/README.md).
// `ar` lives in src/locales/ar/lesson.js and is registered at runtime by the
// lazily loaded Arabic bundle (registerLessonStrings) — an English or German
// visitor never downloads it. tests/course-player.test.mjs registers it and
// pins the same key-set parity across all three tables.
//
// TWO ORIGINAL TABLES. `en` is the default and is plain, warm and short
// ("you"). `de` is „Deutsch-Modus" and keeps every string the chrome used to
// carry verbatim, in the Sie register the course speaks everywhere (DaF review
// #4; tests/course-player.test.mjs globs this file into CHROME_FILES so an
// informal-register token here fails the suite like any other chrome file). The same test pins
// that both tables have exactly the same keys and no empty value: a key added
// to one table only would show the raw key on screen in the other language.
//
// INTERPOLATION. `{name}` placeholders, filled by t(key, lang, vars). Plurals
// are two keys (`plan.lesson` / `plan.lessons`), never a suffix rule — German
// and English pluralise differently and the caller knows the count.
//
// Content-facing labels that are exam terminology (Hören, Lesen, Sprechen as
// SECTION names of the Goethe test, Formular / Mitteilung as task types) stay
// German in both tables on purpose: they are the words the learner will meet
// on the exam paper, so the chrome names them the way the exam does.

// The chrome language IS the product's interface locale (src/lib/locale.js);
// these names stay for the ~30 callers that import them.
export const LESSON_LANG_KEY = LEGACY_LESSON_KEY;
export const DEFAULT_LESSON_LANG = DEFAULT_LOCALE;
export const LESSON_LANGS = SUPPORTED_LOCALES;

export const STRINGS = {
  en: {
    // ── shell / actions ──────────────────────────────────────────────────────
    'shell.back': 'Back',
    'action.next': 'Continue',
    'action.check': 'Check',
    'action.showAnswer': 'Show answer',
    'action.understood': 'Got it',
    'action.nextLine': 'Next line',
    'action.showAllLines': 'Show all lines',
    'action.play': 'Play',
    'action.listen': 'Listen',
    'action.listenAgain': 'Listen again',
    'action.submit': 'Submit',
    'action.submitting': 'Grading…',
    'action.save': 'Save',
    'action.saving': 'Saving …',
    'action.cancel': 'Cancel',
    'action.toCoursePlan': 'To the course plan',
    'action.backToCourse': 'Back to the course',
    'action.again': 'Try again',

    // ── the language toggle ──────────────────────────────────────────────────
    'lang.de': 'Deutsch',
    'lang.en': 'English',
    // The disclosure under a translated paragraph: in English chrome it opens
    // the German original, so it is named in German — the learner is looking
    // for the German, and „Deutsch" is the one word every learner already has.
    'lang.readOther': 'Auf Deutsch lesen',

    // ── audio source badge ───────────────────────────────────────────────────
    'audio.recorded': 'Recording',
    'audio.synthetic': 'Computer voice',

    // ── stage eyebrows and titles ────────────────────────────────────────────
    'stage.warmup.eyebrow': 'Step 0 · Review',
    'stage.warmup.title': 'A quick refresher',
    'stage.pretest.eyebrow': 'Step 1 · Try first',
    'stage.input.eyebrow': 'Step 2 · Input',
    'stage.input.title': 'Dialogue',
    'stage.wortfeld.eyebrow': 'Step 2 · Vocabulary',
    'stage.wortfeld.title': '{n} new words',
    'stage.wortfeld.lead': 'Tap a card for the translation, the speaker to hear it.',
    'stage.notice.eyebrow': 'Step 3 · Grammar',
    'stage.notice.examples': 'Examples from the dialogue',
    'stage.phonetik.eyebrow': 'Step 3 · Pronunciation',
    'stage.phonetik.title': 'Listen and repeat',
    'phonetik.listenFor': 'Stress falls on the capitalised syllable.',
    'phonetik.sayAfter': 'Say it after the voice',
    'phonetik.said': 'Said it',
    'stage.practice.eyebrow': 'Step 4 · Practice {n}/{total}',
    'stage.derived.eyebrow': 'Step 4 · More practice {n}/{total}',
    'stage.dictation.eyebrow': 'Step 4 · Listening {n}/{total}',
    'stage.speaking.eyebrow': 'Step 5 · Speaking',
    'stage.speaking.title': 'Repeat first, then speak freely',
    'stage.writing.eyebrow': 'Step 6 · Writing',
    'stage.requeue.eyebrow': 'Step 7 · Try again {n}/{total}',
    'stage.recap.eyebrow': 'Step 8 · Recap',
    'stage.recap.title': 'Lesson complete',

    // ── pretest ──────────────────────────────────────────────────────────────
    'pretest.yourSentence': 'Your sentence',
    'pretest.placeholder': 'Just write what you can.',
    'pretest.note': "Haven't learned this yet? That's the point. The attempt counts, not the score.",
    'pretest.model': 'Model answer',
    'pretest.goodStart': 'Your sentence already starts off right.',

    // ── dialogue ─────────────────────────────────────────────────────────────
    'dialog.glossOn': 'Show English',
    'dialog.glossOff': 'Hide English',
    'dialog.lineOf': 'Line {n} of {total}',
    'dialog.playLine': "Play {speaker}'s line",
    'dialog.noSpeech': "Your browser can't read this line aloud.",

    // ── vocabulary ───────────────────────────────────────────────────────────
    'wortfeld.plural': 'Pl.',
    'wortfeld.listen': 'Listen to {word}',
    'wortfeld.en': 'EN',
    'wortfeld.showAllEnglish': 'Show all English',
    'wortfeld.hideAllEnglish': 'Hide all English',
    'wortfeld.flipHint': '{word}, English shown',
    'wortfeld.audioBadge.computer': 'Audio: computer voice',
    'wortfeld.audioBadge.recordings': 'Audio: recordings',
    'wortfeld.audioBadge.mixed': 'Audio: mixed',

    // ── dictation ────────────────────────────────────────────────────────────
    'dictation.lead': 'Listen to the line and write it down.',
    'dictation.noSpeech': "Your browser can't play audio — here is the line to copy:",
    'dictation.whatDoYouHear': 'What do you hear?',

    // ── practice item + feedback ─────────────────────────────────────────────
    'practice.yourAnswer': 'Your answer',
    'practice.wholeSentence': 'Whole sentence',
    'practice.tip': 'Tip: {hint}',
    'practice.caseHint': 'Watch the capitalisation.',

    // ── derived exercises (match / word order / listen & choose) ────────────
    'match.instructions': 'Tap a German word, then its English translation.',
    'wordOrder.instructions': 'Tap the words in order to build the sentence.',
    'wordOrder.yourSentence': 'Your sentence',
    'wordOrder.wordBank': 'Tap a word to add it',
    'wordOrder.removeWord': 'Remove {word}',
    'listenSelect.instructions': 'Listen, then choose the line you heard.',

    'feedback.correct': 'Correct!',
    'feedback.typo': 'Almost — just a typo',
    'feedback.wrong': 'Not yet',
    'feedback.revealed': 'Here is the answer',
    'feedback.correctIs': 'The answer is:',
    'feedback.explain': 'Explain this to me',

    // ── combo chip (Wave 2, 2026-09-19) ──────────────────────────────────────
    'combo.streak': '{n} in a row',
    'combo.soundOn': 'Turn sound on',
    'combo.soundOff': 'Turn sound off',

    // ── "explain this" answer box ────────────────────────────────────────────
    'explain.loading': 'Writing your explanation …',
    'explain.anon': 'Sign in to get explanations.',
    'explain.limit': "You've used all of today's explanations{limit}. There are new ones tomorrow.",
    'explain.error': "The explanation isn't working right now. The rule is on this lesson's grammar card.",

    // ── speaking (read-aloud + open task) ────────────────────────────────────
    'speaking.iSaidIt': 'I said it',
    'speaking.said': 'Said',
    'speaking.skip': 'Skip for now',
    'speaking.model': 'Hear it',
    'speaking.record': 'Record',
    'speaking.stop': 'Stop recording',
    'speaking.scoring': 'Scoring …',
    'speaking.retry': 'Again ({n} left)',
    'speaking.intelligibility': 'Intelligibility: {pct} %',
    'speaking.wordsHeard': '{hit} of {total} words recognised',
    'speaking.heard': ' (recognised)',
    'speaking.notHeard': ' (not recognised)',
    'speaking.recording': 'Say the sentence — the recording stops by itself after {s} seconds.',
    'speaking.fallback.no_mic': "Your browser isn't sharing a microphone — confirm the line yourself.",
    'speaking.fallback.signed_out': 'You need to be signed in for scoring — confirm the line yourself for now.',
    'speaking.fallback.limit': "You've used all of today's scored recordings — confirm the line yourself.",
    'speaking.fallback.server': "Scoring isn't answering right now — confirm the line yourself.",
    'speaking.coachLead': "The speaking coach listens and gives you feedback automatically. Afterwards you'll come back here.",
    'speaking.speakFree': 'Speak freely',
    'speaking.teilDefault': 'Speaking',

    // ── writing (GradedWriting) ──────────────────────────────────────────────
    'writing.yourText': 'Your text',
    'writing.word': 'word',
    'writing.words': 'words',
    'writing.target': 'Target {min}–{max}',
    'writing.checklist': 'Checklist',
    'writing.formcheckLive': 'Form check: only the form (length, points, greeting and sign-off) — not a grade yet.',
    'writing.done': 'done',
    'writing.missing': 'still missing',
    'writing.signInForAi': 'Sign in to get an AI assessment.',
    'writing.fallbackPlain': 'Form check, no AI assessment.',
    'writing.fallbackLeft': 'Form check, no AI assessment — {left} AI assessments left.',
    'writing.courseQuotaUsed': "Your writing allowance for this course is used up. Form check, no AI assessment.",
    'writing.quotaUsed': 'Your AI assessment allowance is used up. Form check, no AI assessment.',
    'writing.unreachable': "Form check, no AI assessment — the grader wasn't reachable just now.",
    'writing.offline': 'Form check, no AI assessment — no connection to the grader.',
    'writing.assessmentNote': 'An assessment by exam criteria — not an official grade.',
    'writing.remaining': ' {n} AI assessments left.',
    'writing.criteria.task': 'Task',
    'writing.criteria.structure': 'Structure',
    'writing.criteria.accuracy': 'Accuracy',
    'writing.criteria.vocabulary': 'Vocabulary',
    'writing.corrections': 'Corrections',
    'writing.sample': 'Sample text',
    'writing.fallbackNote': "This checklist only checks the form (length, points, greeting and sign-off). It doesn't correct your German.",

    // ── recap ────────────────────────────────────────────────────────────────
    'recap.firstTry': '{pct} % on the first try',
    'recap.words': 'Words',
    'recap.grammar': 'Grammar',
    'recap.review': 'Review',
    'recap.reviewOn': 'on {date}',
    'recap.mastery.started': 'Started',
    'recap.mastery.complete': 'Done',
    'recap.mastery.gold': 'Gold',
    'recap.gold': 'Gold: at least 80 % on the first try. The words and the rule come back for review.',
    'recap.done': 'Done. The lesson counts at any score — what wobbled today comes back for review.',

    // ── go deeper (recap) ────────────────────────────────────────────────────
    'recap.goDeeper.title': 'Go deeper',
    'recap.goDeeper.listening': 'Listening exercise for this Lektion',
    'recap.goDeeper.reading': 'Reading text for this Lektion',
    'recap.goDeeper.speaking': 'Speaking mission for this Lektion',
    'recap.vocabBridge.add': 'Add these words to my vocab deck',
    'recap.vocabBridge.adding': 'Adding …',
    'recap.vocabBridge.added': 'Added to your vocab deck.',
    'recap.vocabBridge.signInHint': 'Sign in to save these words to your vocab deck.',

    // ── words-learned flip cards (recap) ─────────────────────────────────────
    'words.tapToFlip': 'Tap a card for the translation',
    'words.showEnglish': 'Show English',
    'words.showGerman': 'Show German',

    // ── milestone card (course home) ─────────────────────────────────────────
    'milestone.day1.title': 'Day 1 — you started',
    'milestone.day1.body': 'The first Lektion is the hardest one to begin. It is done.',
    'milestone.day7.title': '7 days — this is a habit now',
    'milestone.day7.body': 'A week of German, one Lektion at a time.',
    'milestone.day30.title': '30 days — a month of German',
    'milestone.day30.body': 'A month of showing up. That is how a language gets learned.',
    'milestone.dismiss': 'Dismiss',

    // ── save-progress card ───────────────────────────────────────────────────
    'save.title': 'Save your progress — free',
    'save.body': "Right now this lesson lives only in this browser. With a free account it stays with you — on your phone, on your laptop, and with review at the right time.",
    'save.cta': 'Save progress',
    'save.haveAccount': 'I already have an account',

    // ── exam-date plan ───────────────────────────────────────────────────────
    'plan.question': 'When is your exam?',
    'plan.lead': 'With a date, the course shows you how many lessons a week are enough. You can change it any time.',
    'plan.dateLabel': 'Exam date',
    'plan.noDate': 'No date yet? No problem — the course works without one.',
    'plan.saveFailed': "The date couldn't be saved. Please try again later.",
    'plan.past': 'Your exam date has passed',
    'plan.behind': '{n} {unit} behind the plan — no problem, pick up here',
    'plan.onTrack': 'On track · {n} {unit} a week',
    'plan.lesson': 'lesson',
    'plan.lessons': 'lessons',
    'plan.pastDetail': 'Set a new date when you have a new appointment — the course stays exactly where you are.',
    'plan.allDone': 'All done before {date}.',
    'plan.detail': '{left} of {total} open · exam on {date} · {weeks} {unit}',
    'plan.week': 'week',
    'plan.weeks': 'weeks',
    'plan.changeDate': 'Change date',
    'plan.reset': 'Reset',

    // ── player page ──────────────────────────────────────────────────────────
    'player.backToCourse': 'Back to the course',
    'player.lesson': 'Lesson {nr}',
    'player.progress': 'Progress in this lesson',
    'player.loading': 'Loading the lesson …',
    'player.nextLesson': 'Lesson {nr} →',
    'player.finalTest': 'Final test →',

    // ── checkpoint ───────────────────────────────────────────────────────────
    'checkpoint.label': 'Checkpoint {nr}',
    'checkpoint.formular': 'Formular',
    'checkpoint.mitteilung': 'Mitteilung',
    'checkpoint.readAloudScored': 'Scored — intelligibility counts towards your Sprechen result.',
    'checkpoint.readAloudUnscored': "Without a recording the Sprechen part isn't scored, but it's still part of the test.",
    'checkpoint.writingScored': 'Scored — from {pct} % this task counts as correct.',
    'checkpoint.writingUnscored': "Without an AI assessment this task doesn't count towards the Schreiben result, but it's still part of the test.",
    'checkpoint.typedPlaceholder': 'Type your answer',
    'checkpoint.notGraded': 'Not graded — but part of the test.',
    'checkpoint.doneLabel': 'Done',
    'checkpoint.wrong': 'Not right',
    'checkpoint.notScored': ' · not scored',
    'checkpoint.sectionAria': '{name}: {pct} percent',
    'checkpoint.sectionBelow': 'Below {pct} % — this part needs another go.',
    'checkpoint.intro': "20 tasks from {sections} — in the format of your exam. The test draws on this chapter's lessons and revisits grammar from earlier chapters.",
    'checkpoint.passRule': 'Pass from {overall} % overall and at least {section} % in every scored part.',
    'checkpoint.blocked': 'No attempts left in this window. Open again from {time}.',
    'checkpoint.remaining': '{remaining} of {limit} attempts left in {hours} hours.',
    'checkpoint.limit': '{limit} attempts per {hours} hours.',
    'checkpoint.start': 'Start the checkpoint',
    'checkpoint.loadingItems': 'Loading the tasks …',
    'checkpoint.passed': 'Passed',
    'checkpoint.notPassed': 'Not passed yet',
    'checkpoint.correctOf': '{correct} of {total} scored tasks correct',
    'checkpoint.whyTitle': 'What it came down to',
    'checkpoint.nextLesson': 'Continue: Lesson {nr}',
    'checkpoint.practiceFirst': 'Practise first',
    'checkpoint.practiceLead': "{n} tasks on exactly the topics that didn't stick. Then take the checkpoint again.",

    // ── Landeskunde (checkpoint result) ─────────────────────────────────────
    'landeskunde.eyebrow': 'Cultural note',
    'landeskunde.source': 'Source:',

    // ── review ───────────────────────────────────────────────────────────────
    'review.title': 'Review',
    'review.lead': 'Words, patterns and sentences come back after {days} days.',
    'review.loading': 'Loading …',
    'review.nothingDue': 'Nothing is due today.',
    'review.signIn': 'Sign in so your reviews are saved.',
    'review.mode.flashcard': 'Card',
    'review.mode.listening': 'Listening',
    'review.mode.typed': 'Writing',
    'review.mode.say': 'Speaking',
    'review.lesson': 'Lesson {nr}',
    'review.inGerman': 'In German',
    'review.typePlaceholder': 'Write it in German',
    'review.correctIs': 'The answer is: {answer}',
    'review.sayReveal': 'Said — reveal',
    'review.reveal': 'Reveal',
    'review.again': 'Again',
    'review.knew': 'Knew it',
    'review.doneToday': 'Done for today',
    'review.nextOn': 'Next review on {date}.',
    'review.newCards': 'New cards arrive as soon as you finish a lesson.',
    // ── Arabic edition (2026-10-05): support fallbacks, input help, honest audio ──
    'support.inEnglish': '(in English)',
    'support.inGerman': '(in German)',
    'practice.tipLabel': 'Tip:',
    'keys.label': 'German letters',
    'keys.insert': 'Insert {char}',
    'audio.cantHear': "Can't hear anything?",
    'audio.cantHearTips': 'Check the volume and the mute switch, then press Play again. Still nothing? You can read the line instead — it then counts as reading, not listening.',
    'audio.unavailable': "This browser can't play the line. You can read it instead — it then counts as reading, not listening.",
    'audio.showTranscript': 'Show the text (reading support)',
    'audio.transcriptLabel': 'Text — reading support, not counted as listening',
    'match.selected': '{word} selected',
    'match.pickGermanFirst': 'Choose a German word first.',
    'match.matchedAnnounce': 'Correct pair: {word} — {meaning}',
    'match.missAnnounce': 'Not a pair: {word} and {meaning}. Try again.',
    'match.matchedState': '(matched)',
    'wordOrder.builtAnnounce': 'Your sentence so far: {sentence}',
    'phonetik.listenTo': 'Listen to {word}',
    'speaking.coachLanguageNote': 'The speaking coach works in English and German only and needs a free account.',
    'speaking.recognitionNote': 'This counts the words the speech recogniser picked up from your recording. It does not grade sounds, stress, vowel length or intonation.',
    'speaking.micError.denied': 'Microphone access denied. Please allow access in your browser settings.',
    'speaking.micError.deniedIos': 'Microphone access denied. Go to Settings → Safari → Microphone and allow access.',
    'speaking.micError.notFound': 'No microphone found. Please connect one and try again.',
    'speaking.micError.notReadable': "We couldn't open your microphone. Another app may be using it.",
    'speaking.micError.generic': "We couldn't start your microphone. Please try again.",
    'writing.row.length': '{min}–{max} Wörter',
    'writing.row.anrede': 'greeting at the start',
    'writing.row.gruss': 'sign-off at the end',
    'writing.aiFeedbackGerman': 'The AI feedback is in German:',
    'recap.reviewNow': 'today — they open your next lesson',
    'recap.reviewAfterSave': 'once your progress is saved',
    'recap.transcriptNote': '{n} listening item(s) answered with the text open — counted as reading, and left out of the first-try figure.',
    'recap.save.saving': 'Saving to your account …',
    'recap.save.saved': 'Saved to your account.',
    'recap.save.local': "Your account couldn't be reached just now. The lesson is kept on this device and sent automatically the next time you open the course.",
    'player.nextCheckpoint': 'Checkpoint {nr} →',
    'review.fromLesson': '{speaker} — Lektion {nr}',

    // ── Lektion intro (moved from IntroStage.jsx's local table) ──────────────
    'intro.eyebrow': 'Before you start',
    'intro.chapterLabel': 'Chapter {nr}',
    'intro.lektionLabel': 'Lektion {nr}',
    'intro.byTheEnd': 'By the end you can …',
    'intro.people': 'Who speaks in this Lektion',
    'intro.minutes': 'about {n} min',
    'intro.start': 'Start',
    'intro.backToCourse': 'Back to the course',
    'intro.supportScope': 'Arabic lesson support covers Lektionen 1–3 so far. In this Lektion the explanations are in English.',
    'intro.stopResume': 'Reloading the page keeps your place. A finished Lektion is saved; one left unfinished in a closed tab starts again.',

    // ── course home (CurriculumHomePage, CourseWelcome, FirstRunTour) ────────
    'course.chip': 'Course',
    'course.howItWorks': 'How this course works',
    'course.title': 'German',
    'course.summary': '{lektionen} Lektionen · {checkpoints} checkpoints · {words} words · ends with the {exam} final test',
    'course.stat.xp': 'XP',
    'course.stat.streak': 'Day streak',
    'course.stat.done': 'Done',
    'course.endowed': 'Your test suggests a level above {code} — everything here is open; start where you like.',
    'course.complete': 'Course complete · see your result →',
    'course.startHere': 'Start here',
    'course.upNext': 'Up next',
    'course.position': '{n} of {total}',
    'course.minutes': '{n} min',
    'course.start': 'Start →',
    'course.continue': 'Continue →',
    'course.finalTest': 'Final test',
    'course.lektionRange': 'Lektion {from}–{to}',
    'course.chapter': 'Chapter {n}',
    'course.scopeNote': 'Arabic lesson support covers Lektionen 1–3 so far; the later Lektionen explain in English.',
    'course.chapterDone': '{done}/{total} done',
    'course.words': '{n} words',
    'course.syllabus': 'Lehrplan',
    'course.canDoHeading': 'Das kann ich danach',
    'course.examParts': 'Prüfungsteile:',
    'course.startBubble': 'Start',
    'course.locked': '{title} (locked)',
    'course.footer.endowed': 'Every Lektion is open for you and saves on every step.',
    'course.footer.ordered': 'Lektionen open in order and save on every step.',
    'course.footer.anyDevice': 'On any device.',
    'course.footer.thisDevice': 'Your progress saves on this device until you sign in.',
    'course.review': 'Wiederholen',
    'course.allCourses': 'All courses',
    'course.help': 'Help',
    'course.support': 'Support',
    'course.kind.lektion': 'Lektion',
    'course.kind.checkpoint': 'Checkpoint',
    'course.kind.leveltest': 'Abschlusstest',
    'course.kind.leveltestFree': 'Abschlusstest · frei',
    'tour.path.title': 'This is your path',
    'tour.path.body': '{lektionen} short Lektionen in {chapters} chapters. Each Lektion is one everyday situation, and every {perChapter} Lektionen a checkpoint shows you what stuck.',
    'tour.path.bodyGeneric': 'Short Lektionen in a few chapters. Each Lektion is one everyday situation, and a checkpoint after each chapter shows you what stuck.',
    'tour.continue.title': 'One thing to press',
    'tour.continue.body': 'This card always shows the next unit. Come back any time, tap it, and you are back where you left off — no account needed for that.',
    'tour.plan.title': 'Your exam date, if you have one',
    'tour.plan.body': 'Set a date and the course tells you how many units a week are enough. It only ever suggests a pace; it never locks a Lektion.',
    'tour.label': 'Quick tour · {n} of {total}',
    'tour.close': 'Close the tour',
    'tour.skip': 'Skip',
    'tour.next': 'Next',
    'welcome.chip': 'Free course',
    'welcome.title': 'German {code}, from the first „Hallo“',
    'welcome.start': 'Start Lektion {nr} — no account needed',
    'welcome.placement': 'Not sure {code} is your level? Take the placement test',
    'welcome.howTitle': 'How a Lektion works',
    'welcome.howMinutes': 'about {n} min each',
    'welcome.swipe': 'Swipe for the rest. The warm-up appears once you have review cards due.',
    'welcome.timeTitle': 'About {minutes} minutes per Lektion · about {hours} hours a week',
    'welcome.timeBody': 'At {perWeek} units a week — a pace you can hold next to a job — the {units} units ({lektionen} Lektionen, {checkpoints} checkpoints and the final test) take about {weeks} weeks. Faster is fine; slower is fine too. Nothing here locks.',
    'welcome.castTitle': 'Who you will meet',
    'welcome.castBody': 'The same people run through all {n} dialogues, so each new one starts on familiar ground.',
    'welcome.castFrom': 'From Lektion {nr}',
    'welcome.castIn': 'in {n} Lektionen',
    'welcome.keptInBrowser': 'Your progress is kept in this browser until you choose to save it.',
    'outcomes.eyebrow': 'What you will be able to do',
    'outcomes.title': 'By the end of {code} you can …',
    'outcomes.note': 'Each line is one of the course’s own „Ich kann …“ goals, following the Goethe A1 can-do descriptions.',
  },

  de: {
    // ── shell / actions ──────────────────────────────────────────────────────
    'shell.back': 'Zurück',
    'action.next': 'Weiter',
    'action.check': 'Prüfen',
    'action.showAnswer': 'Antwort zeigen',
    'action.understood': 'Verstanden',
    'action.nextLine': 'Nächste Zeile',
    'action.showAllLines': 'Alle Zeilen zeigen',
    'action.play': 'Abspielen',
    'action.listen': 'Anhören',
    'action.listenAgain': 'Nochmal hören',
    'action.submit': 'Abgeben',
    'action.submitting': 'Wird bewertet…',
    'action.save': 'Speichern',
    'action.saving': 'Speichern …',
    'action.cancel': 'Abbrechen',
    'action.toCoursePlan': 'Zum Kursplan',
    'action.backToCourse': 'Zurück zum Kurs',
    'action.again': 'Nochmal',

    // ── the language toggle ──────────────────────────────────────────────────
    'lang.de': 'Deutsch',
    'lang.en': 'English',
    'lang.readOther': 'Auf Englisch lesen',

    // ── audio source badge ───────────────────────────────────────────────────
    'audio.recorded': 'Aufnahme',
    'audio.synthetic': 'Computerstimme',

    // ── stage eyebrows and titles ────────────────────────────────────────────
    'stage.warmup.eyebrow': 'Schritt 0 · Wiederholung',
    'stage.warmup.title': 'Kurz auffrischen',
    'stage.pretest.eyebrow': 'Schritt 1 · Erst probieren',
    'stage.input.eyebrow': 'Schritt 2 · Input',
    'stage.input.title': 'Dialog',
    'stage.wortfeld.eyebrow': 'Schritt 2 · Wortfeld',
    'stage.wortfeld.title': '{n} neue Wörter',
    'stage.wortfeld.lead': 'Tippen Sie auf eine Karte für die Übersetzung, auf den Lautsprecher zum Hören.',
    'stage.notice.eyebrow': 'Schritt 3 · Grammatik',
    'stage.notice.examples': 'Beispiele aus dem Dialog',
    'stage.phonetik.eyebrow': 'Schritt 3 · Aussprache',
    'stage.phonetik.title': 'Hören und nachsprechen',
    'phonetik.listenFor': 'Die Betonung liegt auf der großgeschriebenen Silbe.',
    'phonetik.sayAfter': 'Sprechen Sie es nach der Stimme nach',
    'phonetik.said': 'Gesagt',
    'stage.practice.eyebrow': 'Schritt 4 · Üben {n}/{total}',
    'stage.derived.eyebrow': 'Schritt 4 · Mehr üben {n}/{total}',
    'stage.dictation.eyebrow': 'Schritt 4 · Hören {n}/{total}',
    'stage.speaking.eyebrow': 'Schritt 5 · Sprechen',
    'stage.speaking.title': 'Erst nachsprechen, dann frei sprechen',
    'stage.writing.eyebrow': 'Schritt 6 · Schreiben',
    'stage.requeue.eyebrow': 'Schritt 7 · Noch einmal {n}/{total}',
    'stage.recap.eyebrow': 'Schritt 8 · Rückblick',
    'stage.recap.title': 'Lektion geschafft',

    // ── pretest ──────────────────────────────────────────────────────────────
    'pretest.yourSentence': 'Ihr Satz',
    'pretest.placeholder': 'Schreiben Sie einfach, was Sie können.',
    'pretest.note': 'Noch nichts gelernt? Genau darum geht es. Der Versuch zählt, nicht die Note.',
    'pretest.model': 'Modellantwort',
    'pretest.goodStart': 'Ihr Satz fängt schon richtig an.',

    // ── dialogue ─────────────────────────────────────────────────────────────
    'dialog.glossOn': 'Englisch an',
    'dialog.glossOff': 'Englisch aus',
    'dialog.lineOf': 'Zeile {n} von {total}',
    'dialog.playLine': 'Zeile von {speaker} vorlesen',
    'dialog.noSpeech': 'Ihr Browser kann diesen Text nicht vorlesen.',

    // ── vocabulary ───────────────────────────────────────────────────────────
    'wortfeld.plural': 'Pl.',
    'wortfeld.listen': '{word} anhören',
    'wortfeld.en': 'EN',
    'wortfeld.showAllEnglish': 'Alle Übersetzungen zeigen',
    'wortfeld.hideAllEnglish': 'Alle Übersetzungen verbergen',
    'wortfeld.flipHint': '{word}, Übersetzung angezeigt',
    'wortfeld.audioBadge.computer': 'Audio: Computerstimme',
    'wortfeld.audioBadge.recordings': 'Audio: Aufnahmen',
    'wortfeld.audioBadge.mixed': 'Audio: gemischt',

    // ── dictation ────────────────────────────────────────────────────────────
    'dictation.lead': 'Hören Sie die Zeile und schreiben Sie sie auf.',
    'dictation.noSpeech': 'Ihr Browser kann nicht vorlesen — hier ist die Zeile zum Abschreiben:',
    'dictation.whatDoYouHear': 'Was hören Sie?',

    // ── practice item + feedback ─────────────────────────────────────────────
    'practice.yourAnswer': 'Ihre Antwort',
    'practice.wholeSentence': 'Ganzer Satz',
    'practice.tip': 'Tipp: {hint}',
    'practice.caseHint': 'Achten Sie auf die Groß-/Kleinschreibung.',

    // ── derived exercises (match / word order / listen & choose) ────────────
    'match.instructions': 'Tippen Sie ein deutsches Wort an, dann die englische Übersetzung.',
    'wordOrder.instructions': 'Tippen Sie die Wörter in der richtigen Reihenfolge an.',
    'wordOrder.yourSentence': 'Ihr Satz',
    'wordOrder.wordBank': 'Tippen Sie ein Wort an, um es hinzuzufügen',
    'wordOrder.removeWord': '{word} entfernen',
    'listenSelect.instructions': 'Hören Sie zu und wählen Sie den Satz, den Sie gehört haben.',

    'feedback.correct': 'Richtig',
    'feedback.typo': 'Fast — nur ein Tippfehler',
    'feedback.wrong': 'Noch nicht',
    'feedback.revealed': 'Hier ist die Antwort',
    'feedback.correctIs': 'Richtig ist:',
    'feedback.explain': 'Erklär mir das',

    // ── combo chip (Wave 2, 2026-09-19) ──────────────────────────────────────
    'combo.streak': '{n} in Folge',
    'combo.soundOn': 'Ton einschalten',
    'combo.soundOff': 'Ton ausschalten',

    // ── "explain this" answer box ────────────────────────────────────────────
    'explain.loading': 'Erklärung wird geschrieben …',
    'explain.anon': 'Melden Sie sich an für Erklärungen.',
    'explain.limit': 'Sie haben heute alle Erklärungen{limit} genutzt. Morgen gibt es neue.',
    'explain.error': 'Die Erklärung klappt gerade nicht. Die Regel steht auf der Grammatikkarte dieser Lektion.',

    // ── speaking (read-aloud + open task) ────────────────────────────────────
    'speaking.iSaidIt': 'Ich habe es gesagt',
    'speaking.said': 'Gesagt',
    'speaking.skip': 'Vorerst überspringen',
    'speaking.model': 'Vorsprechen',
    'speaking.record': 'Aufnehmen',
    'speaking.stop': 'Aufnahme stoppen',
    'speaking.scoring': 'Wird ausgewertet …',
    'speaking.retry': 'Nochmal ({n} übrig)',
    'speaking.intelligibility': 'Verständlichkeit: {pct} %',
    'speaking.wordsHeard': '{hit} von {total} Wörtern erkannt',
    'speaking.heard': ' (erkannt)',
    'speaking.notHeard': ' (nicht erkannt)',
    'speaking.recording': 'Sprechen Sie den Satz — die Aufnahme stoppt nach {s} Sekunden von selbst.',
    'speaking.fallback.no_mic': 'Ihr Browser gibt kein Mikrofon frei — bestätigen Sie die Zeile selbst.',
    'speaking.fallback.signed_out': 'Zum Bewerten müssen Sie angemeldet sein — bestätigen Sie die Zeile so lange selbst.',
    'speaking.fallback.limit': 'Sie haben heute alle bewerteten Aufnahmen genutzt — bestätigen Sie die Zeile selbst.',
    'speaking.fallback.server': 'Die Bewertung antwortet gerade nicht — bestätigen Sie die Zeile selbst.',
    'speaking.coachLead': 'Der Sprach-Coach hört zu und gibt Ihnen automatisch eine Rückmeldung. Danach kommen Sie hierher zurück.',
    'speaking.speakFree': 'Frei sprechen',
    'speaking.teilDefault': 'Sprechen',

    // ── writing (GradedWriting) ──────────────────────────────────────────────
    'writing.yourText': 'Ihr Text',
    'writing.word': 'Wort',
    'writing.words': 'Wörter',
    'writing.target': 'Ziel {min}–{max}',
    'writing.checklist': 'Checkliste',
    'writing.formcheckLive': 'Formcheck: nur die Form (Länge, Punkte, Anrede und Gruß), noch keine Bewertung.',
    'writing.done': 'erledigt',
    'writing.missing': 'fehlt noch',
    'writing.signInForAi': 'Melden Sie sich an, um eine KI-Bewertung zu bekommen.',
    'writing.fallbackPlain': 'Formcheck, keine KI-Bewertung.',
    'writing.fallbackLeft': 'Formcheck, keine KI-Bewertung — noch {left} KI-Bewertungen frei.',
    'writing.courseQuotaUsed': 'Ihr Schreibkontingent für diesen Kurs ist aufgebraucht. Formcheck, keine KI-Bewertung.',
    'writing.quotaUsed': 'Ihr Kontingent an KI-Bewertungen ist aufgebraucht. Formcheck, keine KI-Bewertung.',
    'writing.unreachable': 'Formcheck, keine KI-Bewertung — die Bewertung war gerade nicht erreichbar.',
    'writing.offline': 'Formcheck, keine KI-Bewertung — keine Verbindung zur Bewertung.',
    'writing.assessmentNote': 'Einschätzung nach Prüfungskriterien — keine offizielle Bewertung.',
    'writing.remaining': ' Noch {n} KI-Bewertungen frei.',
    'writing.criteria.task': 'Aufgabe',
    'writing.criteria.structure': 'Aufbau',
    'writing.criteria.accuracy': 'Korrektheit',
    'writing.criteria.vocabulary': 'Wortschatz',
    'writing.corrections': 'Korrekturen',
    'writing.sample': 'Beispieltext',
    'writing.fallbackNote': 'Diese Checkliste prüft nur die Form (Länge, Punkte, Anrede und Gruß). Sie korrigiert Ihr Deutsch nicht.',

    // ── recap ────────────────────────────────────────────────────────────────
    'recap.firstTry': '{pct} % im ersten Versuch',
    'recap.words': 'Wörter',
    'recap.grammar': 'Grammatik',
    'recap.review': 'Wiederholung',
    'recap.reviewOn': 'am {date}',
    'recap.mastery.started': 'Begonnen',
    'recap.mastery.complete': 'Geschafft',
    'recap.mastery.gold': 'Gold',
    'recap.gold': 'Gold: mindestens 80 % im ersten Versuch. Die Wörter und die Regel kommen zur Wiederholung zurück.',
    'recap.done': 'Geschafft. Die Lektion zählt bei jeder Trefferquote — was heute wackelte, kommt zur Wiederholung zurück.',

    // ── go deeper (recap) ────────────────────────────────────────────────────
    'recap.goDeeper.title': 'Vertiefen',
    'recap.goDeeper.listening': 'Hörverstehen zu dieser Lektion',
    'recap.goDeeper.reading': 'Lesetext zu dieser Lektion',
    'recap.goDeeper.speaking': 'Sprechauftrag zu dieser Lektion',
    'recap.vocabBridge.add': 'Diese Wörter zu meinem Wortschatz hinzufügen',
    'recap.vocabBridge.adding': 'Wird hinzugefügt …',
    'recap.vocabBridge.added': 'Zu Ihrem Wortschatz hinzugefügt.',
    'recap.vocabBridge.signInHint': 'Melden Sie sich an, um diese Wörter in Ihrem Wortschatz zu speichern.',

    // ── words-learned flip cards (recap) ─────────────────────────────────────
    'words.tapToFlip': 'Für die Übersetzung antippen',
    'words.showEnglish': 'Englisch zeigen',
    'words.showGerman': 'Deutsch zeigen',

    // ── milestone card (course home) ─────────────────────────────────────────
    'milestone.day1.title': 'Tag 1 — Sie haben angefangen',
    'milestone.day1.body': 'Die erste Lektion ist der schwerste Anfang. Geschafft.',
    'milestone.day7.title': '7 Tage — das ist schon Gewohnheit',
    'milestone.day7.body': 'Eine Woche Deutsch, Lektion für Lektion.',
    'milestone.day30.title': '30 Tage — ein Monat Deutsch',
    'milestone.day30.body': 'Ein Monat, in dem Sie drangeblieben sind. So lernt man eine Sprache.',
    'milestone.dismiss': 'Schließen',

    // ── save-progress card ───────────────────────────────────────────────────
    'save.title': 'Fortschritt speichern — kostenlos',
    'save.body': 'Diese Lektion liegt gerade nur in diesem Browser. Mit einem kostenlosen Konto bleibt sie erhalten — auf dem Handy, am Laptop, und mit der Wiederholung zur richtigen Zeit.',
    'save.cta': 'Fortschritt speichern',
    'save.haveAccount': 'Ich habe schon ein Konto',

    // ── exam-date plan ───────────────────────────────────────────────────────
    'plan.question': 'Wann ist Ihre Prüfung?',
    'plan.lead': 'Mit einem Datum zeigt Ihnen der Kurs, wie viele Lektionen pro Woche reichen. Sie können es jederzeit ändern.',
    'plan.dateLabel': 'Prüfungsdatum',
    'plan.noDate': 'Noch kein Datum? Kein Problem — der Kurs läuft auch ohne.',
    'plan.saveFailed': 'Das Datum konnte nicht gespeichert werden. Bitte später noch einmal.',
    'plan.past': 'Ihr Prüfungsdatum liegt hinter Ihnen',
    'plan.behind': '{n} {unit} hinter dem Plan — kein Problem, hier weiter',
    'plan.onTrack': 'Auf Kurs · {n} {unit} pro Woche',
    'plan.lesson': 'Lektion',
    'plan.lessons': 'Lektionen',
    'plan.pastDetail': 'Setzen Sie ein neues Datum, wenn Sie einen neuen Termin haben — der Kurs bleibt genau da, wo Sie sind.',
    'plan.allDone': 'Alles geschafft vor dem {date}.',
    'plan.detail': '{left} von {total} offen · Prüfung am {date} · {weeks} {unit}',
    'plan.week': 'Woche',
    'plan.weeks': 'Wochen',
    'plan.changeDate': 'Datum ändern',
    'plan.reset': 'Zurücksetzen',

    // ── player page ──────────────────────────────────────────────────────────
    'player.backToCourse': 'Zurück zum Kurs',
    'player.lesson': 'Lektion {nr}',
    'player.progress': 'Fortschritt in dieser Lektion',
    'player.loading': 'Lektion wird geladen …',
    'player.nextLesson': 'Lektion {nr} →',
    'player.finalTest': 'Abschlusstest →',

    // ── checkpoint ───────────────────────────────────────────────────────────
    'checkpoint.label': 'Checkpoint {nr}',
    'checkpoint.formular': 'Formular',
    'checkpoint.mitteilung': 'Mitteilung',
    'checkpoint.readAloudScored': 'Bewertet — Verständlichkeit zählt in Ihr Sprechen-Ergebnis.',
    'checkpoint.readAloudUnscored': 'Ohne Aufnahme wird der Sprechen-Teil nicht bewertet, gehört aber zum Test.',
    'checkpoint.writingScored': 'Bewertet — ab {pct} % zählt diese Aufgabe als richtig.',
    'checkpoint.writingUnscored': 'Ohne KI-Bewertung zählt diese Aufgabe nicht in das Schreiben-Ergebnis, gehört aber zum Test.',
    'checkpoint.typedPlaceholder': 'Antwort eingeben',
    'checkpoint.notGraded': 'Nicht bewertet — aber Teil des Tests.',
    'checkpoint.doneLabel': 'Erledigt',
    'checkpoint.wrong': 'Nicht richtig',
    'checkpoint.notScored': ' · nicht bewertet',
    'checkpoint.sectionAria': '{name}: {pct} Prozent',
    'checkpoint.sectionBelow': 'Unter {pct} % — dieser Teil muss noch einmal.',
    'checkpoint.intro': '20 Aufgaben aus {sections} — im Format Ihrer Prüfung. Der Test zieht aus den Lektionen dieses Kapitels und wiederholt Grammatik aus früheren Kapiteln.',
    'checkpoint.passRule': 'Bestanden ab {overall} % insgesamt und mindestens {section} % in jedem bewerteten Teil.',
    'checkpoint.blocked': 'Keine Versuche mehr in diesem Zeitfenster. Wieder frei ab {time} Uhr.',
    'checkpoint.remaining': 'Noch {remaining} von {limit} Versuchen in {hours} Stunden.',
    'checkpoint.limit': '{limit} Versuche pro {hours} Stunden.',
    'checkpoint.start': 'Checkpoint starten',
    'checkpoint.loadingItems': 'Die Aufgaben werden geladen …',
    'checkpoint.passed': 'Bestanden',
    'checkpoint.notPassed': 'Noch nicht bestanden',
    'checkpoint.correctOf': '{correct} von {total} bewerteten Aufgaben richtig',
    'checkpoint.whyTitle': 'Woran es lag',
    'checkpoint.nextLesson': 'Weiter: Lektion {nr}',
    'checkpoint.practiceFirst': 'Zuerst üben',
    'checkpoint.practiceLead': '{n} Aufgaben zu genau den Themen, die eben nicht saßen. Danach den Checkpoint noch einmal.',

    // ── Landeskunde (checkpoint result) ─────────────────────────────────────
    'landeskunde.eyebrow': 'Landeskunde',
    'landeskunde.source': 'Quelle:',

    // ── review ───────────────────────────────────────────────────────────────
    'review.title': 'Wiederholen',
    'review.lead': 'Wörter, Strukturen und Sätze kommen nach {days} Tagen wieder.',
    'review.loading': 'Wird geladen …',
    'review.nothingDue': 'Heute ist nichts fällig.',
    'review.signIn': 'Melden Sie sich an, damit Ihre Wiederholungen gespeichert werden.',
    'review.mode.flashcard': 'Karte',
    'review.mode.listening': 'Hören',
    'review.mode.typed': 'Schreiben',
    'review.mode.say': 'Sprechen',
    'review.lesson': 'Lektion {nr}',
    'review.inGerman': 'Auf Deutsch',
    'review.typePlaceholder': 'Auf Deutsch schreiben',
    'review.correctIs': 'Richtig ist: {answer}',
    'review.sayReveal': 'Gesagt — auflösen',
    'review.reveal': 'Auflösen',
    'review.again': 'Nochmal',
    'review.knew': 'Gewusst',
    'review.doneToday': 'Fertig für heute',
    'review.nextOn': 'Nächste Wiederholung am {date}.',
    'review.newCards': 'Neue Karten kommen, sobald Sie eine Lektion abschließen.',
    // ── Arabische Ausgabe (2026-10-05) ───────────────────────────────────────
    'support.inEnglish': '(auf Englisch)',
    'support.inGerman': '(auf Deutsch)',
    'practice.tipLabel': 'Tipp:',
    'keys.label': 'Deutsche Buchstaben',
    'keys.insert': '{char} einfügen',
    'audio.cantHear': 'Hören Sie nichts?',
    'audio.cantHearTips': 'Prüfen Sie die Lautstärke und den Stummschalter und drücken Sie noch einmal auf Abspielen. Immer noch nichts? Sie können die Zeile auch lesen — dann zählt sie als Lesen, nicht als Hören.',
    'audio.unavailable': 'Dieser Browser kann die Zeile nicht abspielen. Sie können sie lesen — dann zählt sie als Lesen, nicht als Hören.',
    'audio.showTranscript': 'Text zeigen (Lesehilfe)',
    'audio.transcriptLabel': 'Text — Lesehilfe, zählt nicht als Hören',
    'match.selected': '{word} ausgewählt',
    'match.pickGermanFirst': 'Wählen Sie zuerst ein deutsches Wort.',
    'match.matchedAnnounce': 'Richtiges Paar: {word} — {meaning}',
    'match.missAnnounce': 'Kein Paar: {word} und {meaning}. Versuchen Sie es noch einmal.',
    'match.matchedState': '(zugeordnet)',
    'wordOrder.builtAnnounce': 'Ihr Satz bis jetzt: {sentence}',
    'phonetik.listenTo': '{word} anhören',
    'speaking.coachLanguageNote': 'Der Sprechtrainer arbeitet nur auf Englisch und Deutsch und braucht ein kostenloses Konto.',
    'speaking.recognitionNote': 'Gezählt werden die Wörter, die die Spracherkennung in Ihrer Aufnahme erkannt hat. Laute, Betonung, Vokallänge und Satzmelodie werden nicht bewertet.',
    'speaking.micError.denied': 'Kein Zugriff auf das Mikrofon. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen.',
    'speaking.micError.deniedIos': 'Kein Zugriff auf das Mikrofon. Gehen Sie zu Einstellungen → Safari → Mikrofon und erlauben Sie den Zugriff.',
    'speaking.micError.notFound': 'Kein Mikrofon gefunden. Bitte schließen Sie eines an und versuchen Sie es noch einmal.',
    'speaking.micError.notReadable': 'Das Mikrofon ließ sich nicht öffnen. Vielleicht benutzt es gerade eine andere App.',
    'speaking.micError.generic': 'Das Mikrofon ließ sich nicht starten. Bitte versuchen Sie es noch einmal.',
    'writing.row.length': '{min}–{max} Wörter',
    'writing.row.anrede': 'Anrede am Anfang',
    'writing.row.gruss': 'Gruß am Ende',
    'writing.aiFeedbackGerman': 'Rückmeldung der KI:',
    'recap.reviewNow': 'heute — die Karten eröffnen Ihre nächste Lektion',
    'recap.reviewAfterSave': 'sobald Ihr Fortschritt gespeichert ist',
    'recap.transcriptNote': '{n} Höraufgabe(n) mit geöffnetem Text beantwortet — zählt als Lesen und nicht für den Wert beim ersten Versuch.',
    'recap.save.saving': 'Wird in Ihrem Konto gespeichert …',
    'recap.save.saved': 'In Ihrem Konto gespeichert.',
    'recap.save.local': 'Ihr Konto war gerade nicht erreichbar. Die Lektion bleibt auf diesem Gerät und wird automatisch übertragen, wenn Sie den Kurs das nächste Mal öffnen.',
    'player.nextCheckpoint': 'Checkpoint {nr} →',
    'review.fromLesson': '{speaker} — Lektion {nr}',
    'intro.eyebrow': 'Bevor Sie beginnen',
    'intro.chapterLabel': 'Kapitel {nr}',
    'intro.lektionLabel': 'Lektion {nr}',
    'intro.byTheEnd': 'Am Ende können Sie …',
    'intro.people': 'Wer in dieser Lektion spricht',
    'intro.minutes': 'etwa {n} Min.',
    'intro.start': 'Starten',
    'intro.backToCourse': 'Zurück zum Kurs',
    'intro.supportScope': 'Die arabische Lernhilfe umfasst bisher die Lektionen 1–3. In dieser Lektion sind die Erklärungen auf Englisch.',
    'intro.stopResume': 'Wenn Sie die Seite neu laden, bleiben Sie an Ihrer Stelle. Eine abgeschlossene Lektion wird gespeichert; eine unfertige Lektion in einem geschlossenen Tab beginnt von vorn.',
    'course.chip': 'Kurs',
    'course.howItWorks': 'So funktioniert der Kurs',
    'course.title': 'Deutsch',
    'course.summary': '{lektionen} Lektionen · {checkpoints} Checkpoints · {words} Wörter · Abschluss mit dem Test {exam}',
    'course.stat.xp': 'XP',
    'course.stat.streak': 'Tage in Folge',
    'course.stat.done': 'Geschafft',
    'course.endowed': 'Ihr Test spricht für ein Niveau über {code} — hier ist alles offen; beginnen Sie, wo Sie möchten.',
    'course.complete': 'Kurs geschafft · Ergebnis ansehen →',
    'course.startHere': 'Hier beginnen',
    'course.upNext': 'Als Nächstes',
    'course.position': '{n} von {total}',
    'course.minutes': '{n} Min.',
    'course.start': 'Starten →',
    'course.continue': 'Weiter →',
    'course.finalTest': 'Abschlusstest',
    'course.lektionRange': 'Lektion {from}–{to}',
    'course.chapter': 'Kapitel {n}',
    'course.scopeNote': 'Die arabische Lernhilfe umfasst bisher die Lektionen 1–3; die späteren Lektionen erklären auf Englisch.',
    'course.chapterDone': '{done}/{total} geschafft',
    'course.words': '{n} Wörter',
    'course.syllabus': 'Lehrplan',
    'course.canDoHeading': 'Das kann ich danach',
    'course.examParts': 'Prüfungsteile:',
    'course.startBubble': 'Start',
    'course.locked': '{title} (gesperrt)',
    'course.footer.endowed': 'Jede Lektion ist für Sie offen und speichert bei jedem Schritt.',
    'course.footer.ordered': 'Die Lektionen öffnen sich der Reihe nach und speichern bei jedem Schritt.',
    'course.footer.anyDevice': 'Auf jedem Gerät.',
    'course.footer.thisDevice': 'Ihr Fortschritt bleibt auf diesem Gerät, bis Sie sich anmelden.',
    'course.review': 'Wiederholen',
    'course.allCourses': 'Alle Kurse',
    'course.help': 'Hilfe',
    'course.support': 'Support',
    'course.kind.lektion': 'Lektion',
    'course.kind.checkpoint': 'Checkpoint',
    'course.kind.leveltest': 'Abschlusstest',
    'course.kind.leveltestFree': 'Abschlusstest · frei',
    'tour.path.title': 'Das ist Ihr Weg',
    'tour.path.body': '{lektionen} kurze Lektionen in {chapters} Kapiteln. Jede Lektion ist eine Alltagssituation, und nach je {perChapter} Lektionen zeigt ein Checkpoint, was sitzt.',
    'tour.path.bodyGeneric': 'Kurze Lektionen in wenigen Kapiteln. Jede Lektion ist eine Alltagssituation, und nach jedem Kapitel zeigt ein Checkpoint, was sitzt.',
    'tour.continue.title': 'Eine Sache zum Drücken',
    'tour.continue.body': 'Diese Karte zeigt immer die nächste Einheit. Kommen Sie jederzeit zurück, tippen Sie darauf, und Sie machen dort weiter — ohne Konto.',
    'tour.plan.title': 'Ihr Prüfungsdatum, falls Sie eines haben',
    'tour.plan.body': 'Setzen Sie ein Datum, und der Kurs sagt Ihnen, wie viele Einheiten pro Woche reichen. Er schlägt nur ein Tempo vor; er sperrt nie eine Lektion.',
    'tour.label': 'Kurze Tour · {n} von {total}',
    'tour.close': 'Tour schließen',
    'tour.skip': 'Überspringen',
    'tour.next': 'Weiter',
    'welcome.chip': 'Kostenloser Kurs',
    'welcome.title': 'Deutsch {code}, vom ersten „Hallo“ an',
    'welcome.start': 'Lektion {nr} starten — ohne Konto',
    'welcome.placement': 'Nicht sicher, ob {code} Ihr Niveau ist? Machen Sie den Einstufungstest',
    'welcome.howTitle': 'So funktioniert eine Lektion',
    'welcome.howMinutes': 'jeweils etwa {n} Min.',
    'welcome.swipe': 'Wischen Sie für den Rest. Die Wiederholung zu Beginn erscheint, sobald Karten fällig sind.',
    'welcome.timeTitle': 'Etwa {minutes} Minuten pro Lektion · etwa {hours} Stunden pro Woche',
    'welcome.timeBody': 'Mit {perWeek} Einheiten pro Woche — ein Tempo, das neben dem Beruf hält — dauern die {units} Einheiten ({lektionen} Lektionen, {checkpoints} Checkpoints und der Abschlusstest) etwa {weeks} Wochen. Schneller ist in Ordnung, langsamer auch. Hier sperrt nichts.',
    'welcome.castTitle': 'Wen Sie kennenlernen',
    'welcome.castBody': 'Dieselben Personen begleiten Sie durch alle {n} Dialoge, so beginnt jeder neue auf vertrautem Boden.',
    'welcome.castFrom': 'Ab Lektion {nr}',
    'welcome.castIn': 'in {n} Lektionen',
    'welcome.keptInBrowser': 'Ihr Fortschritt bleibt in diesem Browser, bis Sie ihn speichern.',
    'outcomes.eyebrow': 'Was Sie danach können',
    'outcomes.title': 'Am Ende von {code} können Sie …',
    'outcomes.note': 'Jede Zeile ist eines der „Ich kann …“-Ziele des Kurses, nach den Kann-Beschreibungen des Goethe-Instituts für A1.',
  },
};

/** 'en', 'de' or 'ar'; anything else (a stale or tampered flag) is the default. */
export const normalizeLessonLang = (value) => normalizeLocale(value);

/**
 * Register a chrome table that ships in its own chunk (Arabic). Called by
 * src/locales/ar/index.js before the first render of an Arabic page.
 */
export function registerLessonStrings(lang, table) {
  if (!LESSON_LANGS.includes(lang) || !table || typeof table !== 'object') return;
  STRINGS[lang] = table;
}

/**
 * One chrome string. Falls back to `en` (a table not loaded yet, or a key a
 * newer build added), then to the key itself — a key missing from EVERY table
 * is a programming error, and tests/arabic-coverage.test.mjs checks every
 * literal `t('…')` in the course screens against the English table, so that
 * last branch is unreachable for a learner. `{name}` placeholders are filled
 * from `vars`.
 */
export function t(key, lang = DEFAULT_LESSON_LANG, vars = null) {
  const table = STRINGS[normalizeLessonLang(lang)] || STRINGS.en;
  let s = table[key];
  if (s === undefined) s = STRINGS.en[key];
  if (s === undefined) return key;
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined || vars[name] === null ? m : String(vars[name])));
}

/**
 * The date formatter for the chrome language: de-DE in Deutsch-Modus, Arabic
 * with Latin digits, en-GB otherwise (day first, like the German — the audience
 * is learners of German, not one English-speaking country).
 */
export const lessonDateFormat = (lang, options) =>
  new Intl.DateTimeFormat(intlLocaleFor(normalizeLessonLang(lang)), options);

// ── the persisted flag ───────────────────────────────────────────────────────
//
// One store for the whole product now (src/lib/locale.js): the player, the
// checkpoint, the review page, the course home and the app chrome all read the
// same value, so a switch in one header is reflected everywhere on the next
// render. `?lang=` on the URL still wins once and is persisted (validated
// against the whitelist there).

export function readLessonLang() {
  return getLocale();
}

export function writeLessonLang(next) {
  return setLocale(normalizeLessonLang(next), { surface: 'lesson' });
}

/**
 * [lang, setLang] — the chrome language of the lesson screens. A blocked
 * localStorage means "this session only", never a crash. Default English
 * (docs/language-strategy.md).
 */
export function useLessonLang() {
  const [lang, set] = useLocale();
  const setLang = useCallback((next) => set(normalizeLessonLang(next), { surface: 'lesson' }), [set]);
  return [lang, setLang];
}
