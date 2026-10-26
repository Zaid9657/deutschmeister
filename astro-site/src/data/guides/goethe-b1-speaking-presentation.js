// Goethe-Zertifikat B1 Speaking, in English — exam long-tail page (backlog d2,
// 2026-10-26).
//
// Target query family (editorial judgement; DataForSEO returned 40100 on
// 2026-10-26): "goethe b1 speaking presentation", "goethe b1 sprechen teil 2
// example", "goethe b1 presentation phrases", "goethe b1 speaking topics".
//
// FACTS (checked 2026-10-26 on goethe.de): Speaking is a pair exam of about 15
// minutes with 15 minutes of individual preparation; notes allowed, speak
// freely (Modellsatz, Durchführungsbestimmungen). Teil 1: plan something
// together (~3 min); Teil 2: present one of two topics (~3 min) along five
// given slides — introduce topic and structure, personal experience, situation
// in your home country, advantages/disadvantages and opinion, conclusion and
// thanks; Teil 3: respond to feedback and questions, give feedback on the
// partner's presentation and ask a question (~2 min). The topic, the model
// presentation and the phrase lists are our own material.

export const goetheB1SpeakingEn = {
  slug: 'goethe-b1-speaking-presentation',
  lang: 'en',
  offer: 'goethe-waitlist',
  title: 'Goethe B1 Speaking: Presentation Example & Phrases',
  h1: 'Goethe-Zertifikat B1 Speaking: the presentation, the planning task and the phrases you need',
  description:
    'Goethe B1 Sprechen explained in English: the three parts, the five-slide presentation with a full German example, and phrases for planning and feedback.',
  keywords:
    'Goethe B1 speaking, Goethe B1 presentation example, Goethe B1 Sprechen Teil 2, Goethe B1 speaking phrases, Goethe Zertifikat B1 oral exam',
  badge: 'Guide · Goethe B1',
  lead:
    'The Speaking module of the <strong>Goethe-Zertifikat B1</strong> is short — about 15 minutes with a partner — but tightly structured. You plan something together, give a three-minute presentation along five slides, and react to your partner\'s presentation. This guide walks through each part in English, with a complete German model presentation.',
  datePublished: '2026-10-26',
  answer:
    'The Goethe-Zertifikat B1 Speaking module is a pair exam of about 15 minutes, after 15 minutes of preparation on your own. In Part 1 you plan something together with your partner for about three minutes. In Part 2 you present one of two topics for about three minutes, following five slides: introduce the topic, your experience, the situation in your home country, pros and cons with your opinion, and a conclusion. In Part 3 you give feedback on your partner\'s presentation, ask a question and answer questions about your own.',
  factsCheckedOn: '2026-10-26',
  sources: [
    { label: 'Goethe-Institut — Goethe-Zertifikat B1', url: 'https://www.goethe.de/ins/de/en/prf/gzb1.cfm' },
    { label: 'Goethe-Institut — Modellsatz Zertifikat B1 (PDF)', url: 'https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf' },
    { label: 'Goethe-Institut — Durchführungsbestimmungen B1 (PDF)', url: 'https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf' },
  ],

  sections: [
    {
      id: 'overview',
      heading: 'How the Speaking module works',
      blocks: [
        {
          type: 'p',
          text: 'Speaking (<em>Sprechen</em>) is normally taken in pairs and lasts <strong>about 15 minutes</strong>. Before it you get <strong>15 minutes of preparation</strong> on your own; you may make notes for every part, but in the exam you should speak freely.',
        },
        {
          type: 'table',
          head: ['Part', 'Task', 'Time (approx.)'],
          rows: [
            ['Teil 1', 'Plan something together with your partner', '3 minutes'],
            ['Teil 2', 'Present a topic (you choose one of two), using five slides', '3 minutes each'],
            ['Teil 3', 'Feedback and questions on both presentations', '2 minutes each'],
          ],
        },
        {
          type: 'callout',
          text: 'Use the preparation time mostly for Part 2. The planning task and the feedback are conversations; the presentation is the one part where three minutes of your own structured speech are expected.',
        },
      ],
    },
    {
      id: 'part-1',
      heading: 'Part 1: planning something together',
      blocks: [
        {
          type: 'p',
          text: 'You and your partner get a situation — for example, organising a farewell for a colleague or visiting a friend in hospital — with a few guiding questions such as when, where, what to bring and who does what. You make suggestions, react to your partner\'s ideas and agree on a plan.',
        },
        {
          type: 'model',
          label: 'Example exchange',
          lines: [
            'A: Unsere Kollegin Sara hört nächste Woche auf. Wollen wir eine kleine Abschiedsfeier organisieren?',
            'B: Ja, gern! Wann passt es dir? Ich würde Freitagnachmittag vorschlagen.',
            'A: Freitag ist gut, aber ich arbeite bis drei. Wie wäre es mit vier Uhr?',
            'B: Einverstanden. Ich kümmere mich um den Kuchen. Kannst du ein Geschenk besorgen?',
            'A: Ja, das mache ich. Wir sammeln von allen fünf Euro, okay?',
            'B: Gute Idee. Dann sind wir uns einig: Freitag um vier, ich bringe Kuchen, du kaufst das Geschenk.',
          ],
        },
        {
          type: 'p',
          text: 'The partners in this example say <strong>du</strong> to each other. In the exam, match the form your partner uses, and use Sie with the examiners unless they offer du.',
        },
      ],
    },
    {
      id: 'part-2',
      heading: 'Part 2: the five-slide presentation',
      blocks: [
        {
          type: 'p',
          text: 'You choose one of two topics. The task sheet shows five "slides", each with an instruction. Your presentation should follow them in order:',
        },
        {
          type: 'steps',
          items: [
            { label: 'Slide 1', title: 'Introduce the topic and your structure', tasks: ['Say what the topic is and what you will talk about.'] },
            { label: 'Slide 2', title: 'Your personal experience', tasks: ['A situation or experience of your own connected with the topic.'] },
            { label: 'Slide 3', title: 'The situation in your home country', tasks: ['How it is there, with examples.'] },
            { label: 'Slide 4', title: 'Advantages, disadvantages and your opinion', tasks: ['At least one pro and one con, then your view, with examples.'] },
            { label: 'Slide 5', title: 'Conclusion and thanks', tasks: ['End the presentation and thank your listeners.'], tip: 'Rehearse your first and last sentence until they are automatic. A confident start and a clean ending frame everything in between.' },
          ],
        },
        {
          type: 'p',
          text: 'Our practice topic: <em>Ein Leben ohne Auto?</em> (Life without a car?). Here is a full model presentation of about three minutes:',
        },
        {
          type: 'model',
          label: 'Model presentation',
          lines: [
            'Folie 1: Ich möchte heute über das Thema „Ein Leben ohne Auto" sprechen. Zuerst erzähle ich von meinen eigenen Erfahrungen, dann berichte ich über die Situation in meinem Heimatland. Danach spreche ich über Vor- und Nachteile, und am Ende sage ich meine Meinung.',
            'Folie 2: Ich lebe seit zwei Jahren in Leipzig und habe kein Auto. Zur Arbeit fahre ich mit dem Fahrrad, und am Wochenende nehme ich oft die Straßenbahn. Am Anfang war das ungewohnt, besonders beim Einkaufen, aber inzwischen vermisse ich das Auto nicht mehr.',
            'Folie 3: In meinem Heimatland, in Brasilien, ist das ganz anders. Dort haben fast alle Familien ein Auto, weil die Busse in vielen Städten nicht regelmäßig fahren. Meine Eltern zum Beispiel fahren sogar zum Bäcker mit dem Auto.',
            'Folie 4: Ein Leben ohne Auto hat viele Vorteile. Man spart viel Geld für Benzin, Versicherung und Parkplätze, und man tut etwas für die Umwelt. Ein Nachteil ist aber, dass man auf dem Land oft lange auf den Bus warten muss. Meiner Meinung nach braucht man in der Stadt kein Auto, auf dem Land ist es aber oft notwendig.',
            'Folie 5: Damit bin ich am Ende meiner Präsentation. Vielen Dank für Ihre Aufmerksamkeit! Haben Sie noch Fragen?',
          ],
        },
      ],
    },
    {
      id: 'part-3',
      heading: 'Part 3: feedback and questions',
      blocks: [
        {
          type: 'p',
          text: 'After your presentation you respond to feedback and questions from your partner and the examiner. After your partner\'s presentation, you give <strong>feedback</strong> — what you liked, what was new or interesting for you — and ask <strong>one question</strong> about it.',
        },
        {
          type: 'model',
          label: 'Example feedback and question',
          lines: [
            'Vielen Dank für deine Präsentation. Ich fand sie sehr interessant, besonders den Teil über dein Heimatland. Dass dort fast alle Familien ein Auto haben, wusste ich nicht.',
            'Ich habe noch eine Frage: Würdest du in Brasilien auch ohne Auto leben?',
          ],
        },
        {
          type: 'p',
          text: 'Listen actively during your partner\'s presentation and note one detail. Feedback that names something concrete sounds natural and shows you followed.',
        },
      ],
    },
    {
      id: 'phrases',
      heading: 'Phrases to learn by heart',
      blocks: [
        { type: 'h3', text: 'Structuring the presentation' },
        {
          type: 'list',
          items: [
            'Ich möchte heute über das Thema … sprechen.',
            'Zuerst … , dann … , danach … und am Ende …',
            'Damit bin ich am Ende meiner Präsentation. Vielen Dank für Ihre Aufmerksamkeit!',
          ],
        },
        { type: 'h3', text: 'Experience, home country, opinion' },
        {
          type: 'list',
          items: [
            'Ich habe damit folgende Erfahrung gemacht: …',
            'In meinem Heimatland ist das anders / ähnlich: …',
            'Ein Vorteil ist … , ein Nachteil ist aber … / Meiner Meinung nach …',
          ],
        },
        { type: 'h3', text: 'Planning together' },
        {
          type: 'list',
          items: [
            'Wie wäre es mit … ? / Ich würde … vorschlagen.',
            'Das ist eine gute Idee, aber … / Einverstanden.',
            'Ich kümmere mich um … Kannst du … ?',
          ],
        },
        { type: 'h3', text: 'Feedback and questions' },
        {
          type: 'list',
          items: [
            'Deine Präsentation hat mir gut gefallen, besonders …',
            'Neu war für mich, dass …',
            'Ich habe noch eine Frage: …?',
          ],
        },
      ],
    },
    {
      id: 'mistakes',
      heading: 'Common mistakes',
      blocks: [
        {
          type: 'warnings',
          items: [
            {
              title: 'Reading the presentation aloud',
              body: 'Notes are allowed, but you are expected to speak freely. Write keywords on your notes, not full sentences.',
            },
            {
              title: 'Skipping a slide',
              body: 'Each of the five slides is part of the task. The home-country slide and the conclusion are the ones most often forgotten.',
            },
            {
              title: 'Opinion without reasons',
              body: '"Ich finde das gut" is not enough on slide 4. Add one reason and one example.',
            },
            {
              title: 'Generic feedback',
              body: '"Das war gut" says nothing. Name one specific point from your partner\'s presentation, then ask your question.',
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
          text: 'Pick everyday topics with two sides — working from home, online shopping, social media for children, living in the city, learning languages online — and prepare five-slide notes for each in 15 minutes. Then present with a timer: three minutes, no reading.',
        },
        {
          type: 'p',
          text: 'With the <a href="/speaking/">AI speaking practice</a> you talk freely about a topic with an AI conversation partner and get an evaluation of grammar, vocabulary and expression after the conversation. For the writing module, see <a href="/leitfaden/goethe-b1-writing-examples/">Goethe B1 Writing: model answers</a>.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'How long is the Goethe B1 Speaking exam?',
      a: 'About 15 minutes for a pair, after 15 minutes of preparation on your own. In the rare case of an individual exam it is about 10 minutes, according to the Goethe-Institut\'s exam regulations.',
    },
    {
      q: 'How long should my presentation be?',
      a: 'About three minutes. That is enough for two or three sentences per slide. Practise with a timer so you neither rush nor run out of material.',
    },
    {
      q: 'Can I choose my presentation topic?',
      a: 'You choose one of two topics on the task sheet. You cannot bring your own topic, so practise with many everyday themes.',
    },
    {
      q: 'Can I use notes during the exam?',
      a: 'You may make notes during the preparation time, but you are expected to speak freely. Use your notes as keywords, not as a script.',
    },
    {
      q: 'Do I have to agree with my partner in Part 1?',
      a: 'The task is to plan something together, so aim for a shared plan. Disagreeing along the way and making counter-suggestions is a natural part of the conversation.',
    },
  ],

  cta: {
    heading: 'Get ready for Goethe B1 Speaking',
    body: 'A free account comes with Pro days: practise speaking with the AI conversation partner and sit the timed Goethe B1 practice exam while they run. Take the placement test first to see where you stand.',
  },
};
