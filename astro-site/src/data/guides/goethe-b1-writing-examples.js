// Goethe-Zertifikat B1 Writing, in English — exam long-tail page (backlog d2,
// 2026-10-26). The first English guide: the plan's exam-page arm names "EN
// Goethe", and 42 of 60 in-app B1 choosers picked Goethe B1
// (docs/strategy/million-plan-2026-10.md).
//
// Target query family (editorial judgement; DataForSEO returned 40100 on
// 2026-10-26): "goethe b1 writing examples", "goethe b1 schreiben teil 1
// example", "goethe b1 email example", "goethe b1 forum post example".
//
// FACTS (checked 2026-10-26 on goethe.de): Writing module 60 minutes —
// personal and formal e-mails or letters plus an opinion in a forum post
// (goethe.de exam page); the Modellsatz: task 1 e-mail ~80 words in 20 min
// covering three points, task 2 discussion post ~80 words in 25 min, task 3
// e-mail ~40 words in 15 min, any order; written modules ≈165 min in total and
// modules can be taken separately (Durchführungsbestimmungen). The model texts
// are our own, written to Modellsatz-style prompts we made up.
//
// PRODUCT CLAIMS: the writing trainer has no Goethe B1 tasks
// (src/data/examTracks.js hasWriting:false), so the page says so; Goethe B1
// does have a timed mock exam (hasMock:true).

export const goetheB1WritingEn = {
  slug: 'goethe-b1-writing-examples',
  lang: 'en',
  offer: 'goethe-waitlist',
  title: 'Goethe B1 Writing: Model Answers for All 3 Tasks',
  h1: 'Goethe-Zertifikat B1 Writing: model answers and phrases for all three tasks',
  description:
    'Goethe B1 Schreiben explained in English: the three tasks, word counts and timing, a model answer for each, and the German phrases that carry them.',
  keywords:
    'Goethe B1 writing, Goethe B1 Schreiben example, Goethe B1 email example, Goethe B1 forum post, Goethe Zertifikat B1 writing tasks',
  badge: 'Guide · Goethe B1',
  lead:
    'The Writing module of the <strong>Goethe-Zertifikat B1</strong> asks for three short texts in 60 minutes: two e-mails and one opinion post. This guide explains each task in English, shows a German model answer for each, and gives you the phrases that make them work — so you know exactly what to practise.',
  datePublished: '2026-10-26',
  answer:
    'The Goethe-Zertifikat B1 Writing module lasts 60 minutes and has three tasks. Task 1 is an informal e-mail of about 80 words in 20 minutes, covering three given points. Task 2 is an opinion post for an online discussion, about 80 words in 25 minutes. Task 3 is a short, polite e-mail of about 40 words in 15 minutes, for example apologising to a teacher. You may do the tasks in any order. Writing is one of four modules that can be taken separately.',
  factsCheckedOn: '2026-10-26',
  sources: [
    { label: 'Goethe-Institut — Goethe-Zertifikat B1', url: 'https://www.goethe.de/ins/de/en/prf/gzb1.cfm' },
    { label: 'Goethe-Institut — Modellsatz Zertifikat B1 (PDF)', url: 'https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf' },
    { label: 'Goethe-Institut — Durchführungsbestimmungen B1 (PDF)', url: 'https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf' },
  ],

  sections: [
    {
      id: 'overview',
      heading: 'The three writing tasks at a glance',
      blocks: [
        {
          type: 'p',
          text: 'Writing (<em>Schreiben</em>) is one of four modules of the Goethe-Zertifikat B1, next to Reading, Listening and Speaking. The written modules take about 165 minutes in total; Writing itself is <strong>60 minutes</strong>. The official model test splits it like this:',
        },
        {
          type: 'table',
          head: ['Task', 'What you write', 'Length', 'Suggested time'],
          rows: [
            ['Aufgabe 1', 'Informal e-mail to a friend, covering three points', 'about 80 words', '20 minutes'],
            ['Aufgabe 2', 'Your opinion on a topic, as a post in an online discussion', 'about 80 words', '25 minutes'],
            ['Aufgabe 3', 'Short polite e-mail, e.g. to a teacher or landlord', 'about 40 words', '15 minutes'],
          ],
        },
        {
          type: 'p',
          text: 'You can start with any task. Because Task 2 carries the most thinking, many candidates do Task 3 first (it is short and formulaic), then Task 1, and keep the longest block for the opinion post. For the full exam structure and the module system, see the <a href="/leitfaden/goethe-b1/">Goethe B1 guide (in German)</a>.',
        },
        {
          type: 'callout',
          text: 'The word counts are approximate ("circa"). Much shorter usually means a point is missing; much longer costs time you need for the other tasks.',
        },
      ],
    },
    {
      id: 'task-1',
      heading: 'Task 1: the informal e-mail (about 80 words)',
      blocks: [
        {
          type: 'p',
          text: 'You get a short situation and three instructions, typically <strong>describe</strong> (Beschreiben Sie), <strong>give a reason</strong> (Begründen Sie) and <strong>make a suggestion</strong> (Machen Sie einen Vorschlag). The task reminds you to watch the structure: greeting, introduction, the order of the points, and an ending.',
        },
        {
          type: 'p',
          text: 'Our practice prompt: You started a new job a month ago. Write to your friend Paul. Describe your new workplace. Explain what you like best and why. Suggest meeting up.',
        },
        {
          type: 'model',
          label: 'Model answer (about 85 words)',
          lines: [
            'Lieber Paul,',
            'wie geht es dir? Ich habe lange nichts von mir hören lassen, aber ich habe jetzt einen neuen Job!',
            'Seit einem Monat arbeite ich in einem kleinen Hotel in der Altstadt. Ich arbeite an der Rezeption und spreche jeden Tag mit Gästen aus vielen Ländern.',
            'Am besten gefallen mir meine Kollegen, weil sie sehr hilfsbereit sind. Außerdem kann ich mein Deutsch jeden Tag verbessern.',
            'Hast du am nächsten Wochenende Zeit? Wir könnten am Samstag zusammen frühstücken, dann erzähle ich dir alles.',
            '',
            'Viele Grüße',
            'Lina',
          ],
        },
        {
          type: 'list',
          items: [
            'Each instruction gets its own short paragraph: describe → the job, reason → the colleagues (with <em>weil</em>), suggestion → Saturday breakfast.',
            'The register is <strong>du</strong> throughout — <em>Lieber Paul</em>, <em>dir</em>, <em>Hast du</em>, <em>Viele Grüße</em>.',
            'A short opening line and a clear ending frame the e-mail, exactly as the task asks.',
          ],
        },
      ],
    },
    {
      id: 'task-2',
      heading: 'Task 2: the opinion post (about 80 words)',
      blocks: [
        {
          type: 'p',
          text: 'You read a short online comment on a topic from a TV or radio discussion and write <strong>your own opinion</strong> on the topic. This is the only task that is not an e-mail: no greeting is needed, but a clear position, reasons and an example are.',
        },
        {
          type: 'p',
          text: 'Our practice prompt: In an online discussion about working from home, someone writes: "Im Homeoffice arbeitet niemand richtig." Write your opinion.',
        },
        {
          type: 'model',
          label: 'Model answer (about 85 words)',
          lines: [
            'Ich sehe das anders. Meiner Meinung nach kann man im Homeoffice sehr gut arbeiten, wenn man sich gut organisiert.',
            'Ich arbeite selbst zwei Tage pro Woche zu Hause. An diesen Tagen spare ich fast zwei Stunden Fahrzeit, und ich kann mich besser konzentrieren, weil es ruhiger ist als im Büro.',
            'Natürlich gibt es auch Nachteile. Manche Kollegen fühlen sich allein, und Besprechungen am Bildschirm sind oft anstrengend.',
            'Deshalb finde ich eine Mischung am besten: ein paar Tage im Büro und ein paar Tage zu Hause.',
          ],
        },
        {
          type: 'list',
          items: [
            'The first sentence takes a position (<em>Ich sehe das anders</em>).',
            'Personal experience and reasons follow, joined with <em>weil</em> and <em>und</em>.',
            'One counter-argument (<em>Natürlich gibt es auch Nachteile</em>) shows balance, and the conclusion starts with <em>Deshalb</em>.',
          ],
        },
      ],
    },
    {
      id: 'task-3',
      heading: 'Task 3: the short formal e-mail (about 40 words)',
      blocks: [
        {
          type: 'p',
          text: 'A short, polite message in the <strong>Sie</strong> form — in the model test you excuse yourself to your course teacher because you cannot attend an appointment. The task reminds you not to forget the greeting and the closing.',
        },
        {
          type: 'p',
          text: 'Our practice prompt: Your landlord, Mr Wagner, wants to visit your flat on Thursday to check the windows. You cannot be at home. Write to Mr Wagner, apologise politely and suggest another time.',
        },
        {
          type: 'model',
          label: 'Model answer (about 45 words)',
          lines: [
            'Sehr geehrter Herr Wagner,',
            'leider kann ich am Donnerstag nicht zu Hause sein, weil ich an diesem Tag einen wichtigen Arzttermin habe. Das tut mir leid.',
            'Wäre es auch am Freitagnachmittag oder am Montag ab 16 Uhr möglich?',
            '',
            'Mit freundlichen Grüßen',
            'Marco Rossi',
          ],
        },
        {
          type: 'p',
          text: 'Forty words go fast. Greeting, apology with reason, one alternative, closing — that is the whole task. Do not add a third paragraph you have no time to check.',
        },
      ],
    },
    {
      id: 'phrases',
      heading: 'Key German phrases for B1 writing',
      blocks: [
        { type: 'h3', text: 'Opening and closing' },
        {
          type: 'list',
          items: [
            'Informal: Liebe Anna, / Lieber Paul, … Viele Grüße / Liebe Grüße',
            'Formal: Sehr geehrte Frau Müller, / Sehr geehrter Herr Wagner, … Mit freundlichen Grüßen',
            'Danke für deine E-Mail! / Vielen Dank für Ihre Nachricht.',
          ],
        },
        { type: 'h3', text: 'Describing, giving reasons, suggesting' },
        {
          type: 'list',
          items: [
            'Seit … arbeite / wohne ich … (describe)',
            'Am besten gefällt mir …, weil … (reason)',
            'Wie wäre es, wenn wir …? / Wir könnten … (suggestion)',
          ],
        },
        { type: 'h3', text: 'Giving an opinion (Task 2)' },
        {
          type: 'list',
          items: [
            'Meiner Meinung nach … / Ich bin der Meinung, dass …',
            'Einerseits …, andererseits … / Natürlich gibt es auch Nachteile.',
            'Deshalb finde ich … am besten.',
          ],
        },
        { type: 'h3', text: 'Apologising politely (Task 3)' },
        {
          type: 'list',
          items: [
            'Leider kann ich am … nicht …, weil …',
            'Es tut mir leid, dass … / Bitte entschuldigen Sie, dass …',
            'Wäre es auch am … möglich?',
          ],
        },
      ],
    },
    {
      id: 'mistakes',
      heading: 'Mistakes that cost points',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Skipping one of the three points in Task 1',
              body: 'Each instruction is part of the task. A missing suggestion or reason is the most common reason a Task 1 e-mail falls short.',
            },
            {
              title: 'Mixing du and Sie',
              body: 'Task 1 is informal, Task 3 is formal. Decide before you write and check every pronoun and the closing at the end.',
            },
            {
              title: 'Writing an e-mail in Task 2',
              body: 'The opinion post is not a letter to the person who commented. Skip the greeting and go straight to your position.',
            },
            {
              title: 'Running out of time',
              body: 'Sixty minutes for three texts is tight. Use the suggested times as hard limits and leave a few minutes to check verb position and endings.',
            },
          ],
        },
      ],
    },
    {
      id: 'practise',
      heading: 'How to practise',
      blocks: [
        {
          type: 'p',
          text: 'Write one complete set of three texts a week under exam timing. Then compare your texts with the checklist above: all points covered, register consistent, opinion clear.',
        },
        {
          type: 'p',
          text: 'Our <a href="/schreiben">AI writing trainer</a> does not have Goethe B1 tasks yet; its telc B1 tasks train the same informal and semi-formal e-mail skills and rate your text for task completion, structure, accuracy and vocabulary. With Pro you can also sit a timed Goethe B1 practice exam. For speaking, read the companion guide <a href="/leitfaden/goethe-b1-speaking-presentation/">Goethe B1 Speaking: the presentation</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'How many words do I need in Goethe B1 Writing?',
      a: 'The model test asks for about 80 words in Task 1, about 80 words in Task 2 and about 40 words in Task 3. These are approximate targets; covering every point matters more than an exact count.',
    },
    {
      q: 'How long is the Goethe B1 Writing module?',
      a: 'Sixty minutes for all three tasks. The model test suggests 20 minutes for Task 1, 25 for Task 2 and 15 for Task 3.',
    },
    {
      q: 'Can I take only the Writing module?',
      a: 'Yes. According to the Goethe-Institut, the four modules of the B1 exam can be taken individually or together, so you can resit or take Writing on its own.',
    },
    {
      q: 'Do I need a greeting in the opinion post?',
      a: 'No. Task 2 is a contribution to an online discussion, not an e-mail. Start with your opinion. Tasks 1 and 3 are e-mails and need a greeting and a closing.',
    },
    {
      q: 'Is Goethe B1 Writing harder than telc B1?',
      a: 'It is different. telc B1 has one e-mail in 30 minutes; Goethe B1 has three shorter texts in 60 minutes, including an opinion post. Goethe tests more text types, telc tests one in more depth.',
    },
  ],

  cta: {
    heading: 'Practise German for Goethe B1',
    body: 'A free account comes with Pro days: practise writing and speaking with AI feedback and sit the timed Goethe B1 practice exam while they run. Take the placement test first to see where you stand.',
  },
};
