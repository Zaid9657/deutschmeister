import { useCallback, useSyncExternalStore } from 'react';
import { safeGet, safeSet } from '../../utils/safeStorage.js';

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
// TWO TABLES, ONE KEY SET. `en` is the default and is plain, warm and short
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

export const LESSON_LANG_KEY = 'dm_lesson_lang';
export const DEFAULT_LESSON_LANG = 'en';
export const LESSON_LANGS = ['en', 'de'];

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
    'lang.label': 'Instruction language',
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
    'stage.practice.eyebrow': 'Step 4 · Practice {n}/{total}',
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

    // ── dictation ────────────────────────────────────────────────────────────
    'dictation.lead': 'Listen to the line and write it down.',
    'dictation.noSpeech': "Your browser can't play audio — here is the line to copy:",
    'dictation.whatDoYouHear': 'What do you hear?',

    // ── practice item + feedback ─────────────────────────────────────────────
    'practice.yourAnswer': 'Your answer',
    'practice.wholeSentence': 'Whole sentence',
    'practice.tip': 'Tip: {hint}',
    'practice.caseHint': 'Watch the capitalisation.',
    'feedback.correct': 'Correct!',
    'feedback.typo': 'Almost — just a typo',
    'feedback.wrong': 'Not yet',
    'feedback.correctIs': 'The answer is:',
    'feedback.explain': 'Explain this to me',

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
    'lang.label': 'Sprache der Anleitungen',
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
    'stage.practice.eyebrow': 'Schritt 4 · Üben {n}/{total}',
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

    // ── dictation ────────────────────────────────────────────────────────────
    'dictation.lead': 'Hören Sie die Zeile und schreiben Sie sie auf.',
    'dictation.noSpeech': 'Ihr Browser kann nicht vorlesen — hier ist die Zeile zum Abschreiben:',
    'dictation.whatDoYouHear': 'Was hören Sie?',

    // ── practice item + feedback ─────────────────────────────────────────────
    'practice.yourAnswer': 'Ihre Antwort',
    'practice.wholeSentence': 'Ganzer Satz',
    'practice.tip': 'Tipp: {hint}',
    'practice.caseHint': 'Achten Sie auf die Groß-/Kleinschreibung.',
    'feedback.correct': 'Richtig',
    'feedback.typo': 'Fast — nur ein Tippfehler',
    'feedback.wrong': 'Noch nicht',
    'feedback.correctIs': 'Richtig ist:',
    'feedback.explain': 'Erklär mir das',

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
  },
};

/** 'en' or 'de'; anything else (a stale or tampered flag) is the default. */
export const normalizeLessonLang = (value) => (LESSON_LANGS.includes(value) ? value : DEFAULT_LESSON_LANG);

/**
 * One chrome string. Falls back to `en`, then to the key itself — a missing
 * key shows up on screen as `stage.x.eyebrow` instead of a blank, which is the
 * failure mode a reviewer notices. `{name}` placeholders are filled from `vars`.
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
 * The date formatter for the chrome language: de-DE in Deutsch-Modus, en-GB
 * otherwise (day first, like the German — the audience is learners of German,
 * not one English-speaking country).
 */
export const lessonDateFormat = (lang, options) =>
  new Intl.DateTimeFormat(normalizeLessonLang(lang) === 'de' ? 'de-DE' : 'en-GB', options);

// ── the persisted flag, shared by every screen that mounts the hook ──────────
//
// A module-level store rather than a context provider: the player, the
// checkpoint and the review page are three separate routes, none wrapped by a
// common course provider, and the toggle in one header must be reflected in
// every stage component below it on the next render. useSyncExternalStore is
// the React 18 way to subscribe to exactly that.

const listeners = new Set();
let current = null; // null = not read yet

/** `?lang=de` / `?lang=en` on the URL wins once and is persisted from then on. */
function fromQuery() {
  try {
    const v = new URLSearchParams(window.location.search).get('lang');
    return LESSON_LANGS.includes(v) ? v : null;
  } catch {
    return null;
  }
}

export function readLessonLang() {
  if (current !== null) return current;
  if (typeof window === 'undefined') return DEFAULT_LESSON_LANG;
  const q = fromQuery();
  if (q) {
    safeSet(LESSON_LANG_KEY, q);
    current = q;
  } else {
    current = normalizeLessonLang(safeGet(LESSON_LANG_KEY));
  }
  return current;
}

export function writeLessonLang(next) {
  const lang = normalizeLessonLang(next);
  current = lang;
  safeSet(LESSON_LANG_KEY, lang);
  listeners.forEach((fn) => fn());
  return lang;
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getServerSnapshot = () => DEFAULT_LESSON_LANG;

/**
 * [lang, setLang] — the chrome language of the lesson screens, persisted in
 * `dm_lesson_lang` through safeStorage (a blocked localStorage means "English
 * this session", never a crash). Default English (docs/language-strategy.md).
 */
export function useLessonLang() {
  const lang = useSyncExternalStore(subscribe, readLessonLang, getServerSnapshot);
  const setLang = useCallback((next) => writeLessonLang(next), []);
  return [lang, setLang];
}
