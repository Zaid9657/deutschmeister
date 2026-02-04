// German Learning Content organized by levels
// Each level has a unique theme and color scheme
// Sub-levels: A1.1, A1.2, A2.1, A2.2, B1.1, B1.2, B2.1, B2.2

export const levels = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];

// Level order for progression
export const levelOrder = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];

// Main level groupings
export const mainLevels = ['A1', 'A2', 'B1', 'B2'];

// Get sub-levels for a main level
export const getSubLevels = (mainLevel) => {
  const ml = mainLevel.toLowerCase();
  return [`${ml}.1`, `${ml}.2`];
};

// Helper to get next level
export const getNextLevel = (currentLevel) => {
  const currentIndex = levelOrder.indexOf(currentLevel);
  if (currentIndex === -1 || currentIndex === levelOrder.length - 1) return null;
  return levelOrder[currentIndex + 1];
};

// Helper to get previous level
export const getPreviousLevel = (currentLevel) => {
  const currentIndex = levelOrder.indexOf(currentLevel);
  if (currentIndex <= 0) return null;
  return levelOrder[currentIndex - 1];
};

// Helper to get main level from sub-level
export const getMainLevel = (subLevel) => {
  return subLevel.split('.')[0].toUpperCase();
};

export const levelThemes = {
  'a1.1': {
    id: 'a1.1',
    name: 'Sunrise Warmth I',
    nameDe: 'Sonnenaufgang Wärme I',
    description: 'Your first steps in German',
    descriptionDe: 'Deine ersten Schritte auf Deutsch',
    colors: 'a1-1',
    icon: 'Sun',
    gradient: 'from-a1-1-primary to-a1-1-secondary',
    part: 1,
    mainLevel: 'A1',
  },
  'a1.2': {
    id: 'a1.2',
    name: 'Sunrise Warmth II',
    nameDe: 'Sonnenaufgang Wärme II',
    description: 'Building your foundation',
    descriptionDe: 'Dein Fundament aufbauen',
    colors: 'a1-2',
    icon: 'Sun',
    gradient: 'from-a1-2-primary to-a1-2-secondary',
    part: 2,
    mainLevel: 'A1',
  },
  'a2.1': {
    id: 'a2.1',
    name: 'Forest Calm I',
    nameDe: 'Waldruhe I',
    description: 'Exploring everyday German',
    descriptionDe: 'Alltägliches Deutsch entdecken',
    colors: 'a2-1',
    icon: 'TreePine',
    gradient: 'from-a2-1-primary to-a2-1-secondary',
    part: 1,
    mainLevel: 'A2',
  },
  'a2.2': {
    id: 'a2.2',
    name: 'Forest Calm II',
    nameDe: 'Waldruhe II',
    description: 'Deepening your roots',
    descriptionDe: 'Deine Wurzeln vertiefen',
    colors: 'a2-2',
    icon: 'TreePine',
    gradient: 'from-a2-2-primary to-a2-2-secondary',
    part: 2,
    mainLevel: 'A2',
  },
  'b1.1': {
    id: 'b1.1',
    name: 'Ocean Depth I',
    nameDe: 'Meerestiefe I',
    description: 'Diving into fluency',
    descriptionDe: 'In die Sprachgewandtheit eintauchen',
    colors: 'b1-1',
    icon: 'Waves',
    gradient: 'from-b1-1-primary to-b1-1-secondary',
    part: 1,
    mainLevel: 'B1',
  },
  'b1.2': {
    id: 'b1.2',
    name: 'Ocean Depth II',
    nameDe: 'Meerestiefe II',
    description: 'Navigating complex waters',
    descriptionDe: 'Durch komplexe Gewässer navigieren',
    colors: 'b1-2',
    icon: 'Waves',
    gradient: 'from-b1-2-primary to-b1-2-secondary',
    part: 2,
    mainLevel: 'B1',
  },
  'b2.1': {
    id: 'b2.1',
    name: 'Twilight Elegance I',
    nameDe: 'Dämmerungseleganz I',
    description: 'Refining your expression',
    descriptionDe: 'Deinen Ausdruck verfeinern',
    colors: 'b2-1',
    icon: 'Moon',
    gradient: 'from-b2-1-primary to-b2-1-secondary',
    part: 1,
    mainLevel: 'B2',
  },
  'b2.2': {
    id: 'b2.2',
    name: 'Twilight Elegance II',
    nameDe: 'Dämmerungseleganz II',
    description: 'Mastering the language',
    descriptionDe: 'Die Sprache meistern',
    colors: 'b2-2',
    icon: 'Moon',
    gradient: 'from-b2-2-primary to-b2-2-secondary',
    part: 2,
    mainLevel: 'B2',
  },
};

export const vocabulary = {
  'a1.1': [
    { id: 'a1.1-v1', word: 'Hallo', translation: 'Hello', example: 'Hallo, wie geht es dir?', exampleTranslation: 'Hello, how are you?', category: 'Greetings' },
    { id: 'a1.1-v2', word: 'Danke', translation: 'Thank you', example: 'Danke schön!', exampleTranslation: 'Thank you very much!', category: 'Greetings' },
    { id: 'a1.1-v3', word: 'Bitte', translation: 'Please / You\'re welcome', example: 'Bitte sehr!', exampleTranslation: 'You\'re welcome!', category: 'Greetings' },
    { id: 'a1.1-v4', word: 'Ja', translation: 'Yes', example: 'Ja, ich verstehe.', exampleTranslation: 'Yes, I understand.', category: 'Basics' },
    { id: 'a1.1-v5', word: 'Nein', translation: 'No', example: 'Nein, danke.', exampleTranslation: 'No, thank you.', category: 'Basics' },
    { id: 'a1.1-v6', word: 'Wasser', translation: 'Water', example: 'Ein Glas Wasser, bitte.', exampleTranslation: 'A glass of water, please.', category: 'Food & Drink' },
    { id: 'a1.1-v7', word: 'Brot', translation: 'Bread', example: 'Ich esse Brot zum Frühstück.', exampleTranslation: 'I eat bread for breakfast.', category: 'Food & Drink' },
    { id: 'a1.1-v8', word: 'Haus', translation: 'House', example: 'Das ist mein Haus.', exampleTranslation: 'This is my house.', category: 'Home' },
  ],
  'a1.2': [
    { id: 'a1.2-v1', word: 'Familie', translation: 'Family', example: 'Meine Familie ist groß.', exampleTranslation: 'My family is big.', category: 'Family' },
    { id: 'a1.2-v2', word: 'Freund', translation: 'Friend', example: 'Er ist mein bester Freund.', exampleTranslation: 'He is my best friend.', category: 'Relationships' },
    { id: 'a1.2-v3', word: 'Schule', translation: 'School', example: 'Die Kinder gehen zur Schule.', exampleTranslation: 'The children go to school.', category: 'Education' },
    { id: 'a1.2-v4', word: 'Tag', translation: 'Day', example: 'Guten Tag!', exampleTranslation: 'Good day!', category: 'Time' },
    { id: 'a1.2-v5', word: 'Nacht', translation: 'Night', example: 'Gute Nacht!', exampleTranslation: 'Good night!', category: 'Time' },
    { id: 'a1.2-v6', word: 'Morgen', translation: 'Morning / Tomorrow', example: 'Guten Morgen!', exampleTranslation: 'Good morning!', category: 'Time' },
    { id: 'a1.2-v7', word: 'Abend', translation: 'Evening', example: 'Guten Abend!', exampleTranslation: 'Good evening!', category: 'Time' },
  ],
  'a2.1': [
    { id: 'a2.1-v1', word: 'Arbeiten', translation: 'To work', example: 'Ich arbeite in einem Büro.', exampleTranslation: 'I work in an office.', category: 'Work' },
    { id: 'a2.1-v2', word: 'Reisen', translation: 'To travel', example: 'Wir reisen nach Berlin.', exampleTranslation: 'We are traveling to Berlin.', category: 'Travel' },
    { id: 'a2.1-v3', word: 'Kochen', translation: 'To cook', example: 'Sie kocht gerne italienisch.', exampleTranslation: 'She likes to cook Italian.', category: 'Daily Life' },
    { id: 'a2.1-v4', word: 'Einkaufen', translation: 'To shop', example: 'Ich gehe einkaufen.', exampleTranslation: 'I am going shopping.', category: 'Daily Life' },
    { id: 'a2.1-v5', word: 'Wohnung', translation: 'Apartment', example: 'Die Wohnung hat drei Zimmer.', exampleTranslation: 'The apartment has three rooms.', category: 'Housing' },
    { id: 'a2.1-v6', word: 'Bahnhof', translation: 'Train station', example: 'Der Bahnhof ist in der Nähe.', exampleTranslation: 'The train station is nearby.', category: 'Travel' },
    { id: 'a2.1-v7', word: 'Krankenhaus', translation: 'Hospital', example: 'Das Krankenhaus ist neu.', exampleTranslation: 'The hospital is new.', category: 'Health' },
    { id: 'a2.1-v8', word: 'Urlaub', translation: 'Vacation', example: 'Im Urlaub fahre ich ans Meer.', exampleTranslation: 'On vacation I go to the sea.', category: 'Travel' },
  ],
  'a2.2': [
    { id: 'a2.2-v1', word: 'Geburtstag', translation: 'Birthday', example: 'Herzlichen Glückwunsch zum Geburtstag!', exampleTranslation: 'Happy birthday!', category: 'Celebrations' },
    { id: 'a2.2-v2', word: 'Wetter', translation: 'Weather', example: 'Wie ist das Wetter heute?', exampleTranslation: 'How is the weather today?', category: 'Nature' },
    { id: 'a2.2-v3', word: 'Restaurant', translation: 'Restaurant', example: 'Das Restaurant ist sehr gut.', exampleTranslation: 'The restaurant is very good.', category: 'Food & Drink' },
    { id: 'a2.2-v4', word: 'Rechnung', translation: 'Bill', example: 'Die Rechnung, bitte!', exampleTranslation: 'The bill, please!', category: 'Money' },
    { id: 'a2.2-v5', word: 'Termin', translation: 'Appointment', example: 'Ich habe einen Termin beim Arzt.', exampleTranslation: 'I have a doctor\'s appointment.', category: 'Health' },
    { id: 'a2.2-v6', word: 'Nachbar', translation: 'Neighbor', example: 'Mein Nachbar ist sehr freundlich.', exampleTranslation: 'My neighbor is very friendly.', category: 'Relationships' },
    { id: 'a2.2-v7', word: 'Geschenk', translation: 'Gift', example: 'Das ist ein Geschenk für dich.', exampleTranslation: 'This is a gift for you.', category: 'Celebrations' },
  ],
  'b1.1': [
    { id: 'b1.1-v1', word: 'Beruf', translation: 'Profession', example: 'Welchen Beruf haben Sie?', exampleTranslation: 'What is your profession?', category: 'Career' },
    { id: 'b1.1-v2', word: 'Bewerbung', translation: 'Application', example: 'Ich schreibe eine Bewerbung.', exampleTranslation: 'I am writing an application.', category: 'Career' },
    { id: 'b1.1-v3', word: 'Vorstellungsgespräch', translation: 'Job interview', example: 'Das Vorstellungsgespräch war erfolgreich.', exampleTranslation: 'The job interview was successful.', category: 'Career' },
    { id: 'b1.1-v4', word: 'Umwelt', translation: 'Environment', example: 'Wir müssen die Umwelt schützen.', exampleTranslation: 'We must protect the environment.', category: 'Society' },
    { id: 'b1.1-v5', word: 'Nachrichten', translation: 'News', example: 'Hast du die Nachrichten gesehen?', exampleTranslation: 'Did you see the news?', category: 'Media' },
    { id: 'b1.1-v6', word: 'Meinung', translation: 'Opinion', example: 'Was ist deine Meinung dazu?', exampleTranslation: 'What is your opinion on that?', category: 'Communication' },
    { id: 'b1.1-v7', word: 'Erfahrung', translation: 'Experience', example: 'Ich habe viel Erfahrung in diesem Bereich.', exampleTranslation: 'I have a lot of experience in this field.', category: 'Career' },
    { id: 'b1.1-v8', word: 'Verantwortung', translation: 'Responsibility', example: 'Das ist eine große Verantwortung.', exampleTranslation: 'That is a big responsibility.', category: 'Work' },
  ],
  'b1.2': [
    { id: 'b1.2-v1', word: 'Gelegenheit', translation: 'Opportunity', example: 'Das ist eine gute Gelegenheit.', exampleTranslation: 'This is a good opportunity.', category: 'Life' },
    { id: 'b1.2-v2', word: 'Entwicklung', translation: 'Development', example: 'Die technische Entwicklung ist schnell.', exampleTranslation: 'Technical development is fast.', category: 'Technology' },
    { id: 'b1.2-v3', word: 'Gesellschaft', translation: 'Society', example: 'Wir leben in einer modernen Gesellschaft.', exampleTranslation: 'We live in a modern society.', category: 'Society' },
    { id: 'b1.2-v4', word: 'Verhalten', translation: 'Behavior', example: 'Sein Verhalten war ungewöhnlich.', exampleTranslation: 'His behavior was unusual.', category: 'Psychology' },
    { id: 'b1.2-v5', word: 'Zusammenhang', translation: 'Connection/Context', example: 'Ich verstehe den Zusammenhang nicht.', exampleTranslation: 'I don\'t understand the connection.', category: 'Communication' },
    { id: 'b1.2-v6', word: 'Wissenschaft', translation: 'Science', example: 'Die Wissenschaft macht Fortschritte.', exampleTranslation: 'Science is making progress.', category: 'Education' },
    { id: 'b1.2-v7', word: 'Bildung', translation: 'Education', example: 'Bildung ist sehr wichtig.', exampleTranslation: 'Education is very important.', category: 'Education' },
  ],
  'b2.1': [
    { id: 'b2.1-v1', word: 'Beziehungsweise', translation: 'Respectively / Or rather', example: 'Er kommt heute beziehungsweise morgen.', exampleTranslation: 'He is coming today or rather tomorrow.', category: 'Connectors' },
    { id: 'b2.1-v2', word: 'Auseinandersetzung', translation: 'Dispute/Confrontation', example: 'Die Auseinandersetzung war unvermeidlich.', exampleTranslation: 'The confrontation was inevitable.', category: 'Conflict' },
    { id: 'b2.1-v3', word: 'Selbstverständlich', translation: 'Of course/Naturally', example: 'Das ist selbstverständlich möglich.', exampleTranslation: 'That is of course possible.', category: 'Expression' },
    { id: 'b2.1-v4', word: 'Voraussetzung', translation: 'Prerequisite', example: 'Das ist eine wichtige Voraussetzung.', exampleTranslation: 'That is an important prerequisite.', category: 'Academic' },
    { id: 'b2.1-v5', word: 'Beeindruckend', translation: 'Impressive', example: 'Seine Leistung war beeindruckend.', exampleTranslation: 'His performance was impressive.', category: 'Description' },
    { id: 'b2.1-v6', word: 'Gegebenenfalls', translation: 'If necessary/Possibly', example: 'Gegebenenfalls müssen wir das ändern.', exampleTranslation: 'If necessary, we must change that.', category: 'Formal' },
    { id: 'b2.1-v7', word: 'Berücksichtigen', translation: 'To consider/Take into account', example: 'Wir müssen alle Faktoren berücksichtigen.', exampleTranslation: 'We must consider all factors.', category: 'Business' },
    { id: 'b2.1-v8', word: 'Beeinflussen', translation: 'To influence', example: 'Das kann das Ergebnis beeinflussen.', exampleTranslation: 'That can influence the result.', category: 'Action' },
  ],
  'b2.2': [
    { id: 'b2.2-v1', word: 'Anspruchsvoll', translation: 'Demanding/Sophisticated', example: 'Die Aufgabe ist sehr anspruchsvoll.', exampleTranslation: 'The task is very demanding.', category: 'Description' },
    { id: 'b2.2-v2', word: 'Hinsichtlich', translation: 'Regarding/With regard to', example: 'Hinsichtlich dieser Frage bin ich unsicher.', exampleTranslation: 'Regarding this question, I am uncertain.', category: 'Formal' },
    { id: 'b2.2-v3', word: 'Gewissermaßen', translation: 'In a way/To some extent', example: 'Das stimmt gewissermaßen.', exampleTranslation: 'That is true to some extent.', category: 'Expression' },
    { id: 'b2.2-v4', word: 'Infolgedessen', translation: 'Consequently', example: 'Infolgedessen mussten wir umplanen.', exampleTranslation: 'Consequently, we had to replan.', category: 'Connectors' },
    { id: 'b2.2-v5', word: 'Ausschlaggebend', translation: 'Decisive/Crucial', example: 'Das war der ausschlaggebende Faktor.', exampleTranslation: 'That was the decisive factor.', category: 'Academic' },
    { id: 'b2.2-v6', word: 'Nachvollziehbar', translation: 'Comprehensible/Understandable', example: 'Seine Argumentation ist nachvollziehbar.', exampleTranslation: 'His argumentation is comprehensible.', category: 'Description' },
    { id: 'b2.2-v7', word: 'Zwischenmenschlich', translation: 'Interpersonal', example: 'Zwischenmenschliche Beziehungen sind wichtig.', exampleTranslation: 'Interpersonal relationships are important.', category: 'Social' },
  ],
};

export const sentences = {
  'a1.1': [
    { id: 'a1.1-s1', german: 'Ich heiße Anna.', english: 'My name is Anna.', topic: 'Introduction' },
    { id: 'a1.1-s2', german: 'Wie geht es dir?', english: 'How are you?', topic: 'Greetings' },
    { id: 'a1.1-s3', german: 'Mir geht es gut, danke.', english: 'I am fine, thank you.', topic: 'Greetings' },
    { id: 'a1.1-s4', german: 'Woher kommst du?', english: 'Where do you come from?', topic: 'Introduction' },
    { id: 'a1.1-s5', german: 'Ich komme aus Deutschland.', english: 'I come from Germany.', topic: 'Introduction' },
  ],
  'a1.2': [
    { id: 'a1.2-s1', german: 'Ich spreche ein bisschen Deutsch.', english: 'I speak a little German.', topic: 'Language' },
    { id: 'a1.2-s2', german: 'Wie viel kostet das?', english: 'How much does this cost?', topic: 'Shopping' },
    { id: 'a1.2-s3', german: 'Ich möchte einen Kaffee, bitte.', english: 'I would like a coffee, please.', topic: 'Food & Drink' },
    { id: 'a1.2-s4', german: 'Wo ist die Toilette?', english: 'Where is the toilet?', topic: 'Directions' },
    { id: 'a1.2-s5', german: 'Ich verstehe nicht.', english: 'I do not understand.', topic: 'Communication' },
  ],
  'a2.1': [
    { id: 'a2.1-s1', german: 'Können Sie das bitte wiederholen?', english: 'Can you please repeat that?', topic: 'Communication' },
    { id: 'a2.1-s2', german: 'Ich hätte gerne die Speisekarte.', english: 'I would like the menu, please.', topic: 'Restaurant' },
    { id: 'a2.1-s3', german: 'Der Zug fährt um 8 Uhr ab.', english: 'The train departs at 8 o\'clock.', topic: 'Travel' },
    { id: 'a2.1-s4', german: 'Ich muss zum Arzt gehen.', english: 'I have to go to the doctor.', topic: 'Health' },
    { id: 'a2.1-s5', german: 'Das Wetter ist heute schön.', english: 'The weather is nice today.', topic: 'Weather' },
  ],
  'a2.2': [
    { id: 'a2.2-s1', german: 'Können Sie mir helfen?', english: 'Can you help me?', topic: 'Assistance' },
    { id: 'a2.2-s2', german: 'Ich suche eine Wohnung.', english: 'I am looking for an apartment.', topic: 'Housing' },
    { id: 'a2.2-s3', german: 'Wann öffnet das Geschäft?', english: 'When does the shop open?', topic: 'Shopping' },
    { id: 'a2.2-s4', german: 'Ich feiere meinen Geburtstag am Samstag.', english: 'I am celebrating my birthday on Saturday.', topic: 'Celebrations' },
    { id: 'a2.2-s5', german: 'Darf ich Sie etwas fragen?', english: 'May I ask you something?', topic: 'Politeness' },
  ],
  'b1.1': [
    { id: 'b1.1-s1', german: 'Meiner Meinung nach ist das eine gute Idee.', english: 'In my opinion, that is a good idea.', topic: 'Opinion' },
    { id: 'b1.1-s2', german: 'Es wäre besser, wenn wir früher anfangen würden.', english: 'It would be better if we started earlier.', topic: 'Suggestion' },
    { id: 'b1.1-s3', german: 'Ich interessiere mich für deutsche Kultur.', english: 'I am interested in German culture.', topic: 'Interests' },
    { id: 'b1.1-s4', german: 'Obwohl es regnet, gehen wir spazieren.', english: 'Although it is raining, we are going for a walk.', topic: 'Contrast' },
    { id: 'b1.1-s5', german: 'Nachdem ich gefrühstückt habe, gehe ich zur Arbeit.', english: 'After I have had breakfast, I go to work.', topic: 'Time' },
  ],
  'b1.2': [
    { id: 'b1.2-s1', german: 'Je mehr ich lerne, desto besser verstehe ich.', english: 'The more I learn, the better I understand.', topic: 'Comparison' },
    { id: 'b1.2-s2', german: 'Es ist wichtig, dass wir umweltbewusst handeln.', english: 'It is important that we act environmentally conscious.', topic: 'Environment' },
    { id: 'b1.2-s3', german: 'Ich habe beschlossen, eine neue Sprache zu lernen.', english: 'I have decided to learn a new language.', topic: 'Decision' },
    { id: 'b1.2-s4', german: 'Falls Sie Fragen haben, können Sie mich jederzeit anrufen.', english: 'If you have questions, you can call me anytime.', topic: 'Condition' },
    { id: 'b1.2-s5', german: 'Die Technologie entwickelt sich rasant weiter.', english: 'Technology is developing rapidly.', topic: 'Technology' },
  ],
  'b2.1': [
    { id: 'b2.1-s1', german: 'Angesichts der aktuellen Situation müssen wir umdenken.', english: 'In light of the current situation, we need to rethink.', topic: 'Analysis' },
    { id: 'b2.1-s2', german: 'Es lässt sich nicht leugnen, dass dies Auswirkungen hat.', english: 'It cannot be denied that this has consequences.', topic: 'Argument' },
    { id: 'b2.1-s3', german: 'Unter Berücksichtigung aller Faktoren wäre das die beste Lösung.', english: 'Taking all factors into account, that would be the best solution.', topic: 'Formal' },
    { id: 'b2.1-s4', german: 'Inwieweit dies zutrifft, bleibt abzuwarten.', english: 'To what extent this applies remains to be seen.', topic: 'Academic' },
    { id: 'b2.1-s5', german: 'Im Gegensatz zu früher sind wir heute besser vernetzt.', english: 'In contrast to before, we are better connected today.', topic: 'Comparison' },
  ],
  'b2.2': [
    { id: 'b2.2-s1', german: 'Die Studie zeigt, dass ein Zusammenhang besteht.', english: 'The study shows that there is a connection.', topic: 'Research' },
    { id: 'b2.2-s2', german: 'Es sei darauf hingewiesen, dass dies nur eine Möglichkeit ist.', english: 'It should be pointed out that this is only one possibility.', topic: 'Clarification' },
    { id: 'b2.2-s3', german: 'Sofern keine Einwände bestehen, können wir fortfahren.', english: 'Unless there are objections, we can proceed.', topic: 'Formal' },
    { id: 'b2.2-s4', german: 'Die Komplexität des Problems darf nicht unterschätzt werden.', english: 'The complexity of the problem must not be underestimated.', topic: 'Analysis' },
    { id: 'b2.2-s5', german: 'Letztendlich hängt alles von den Umständen ab.', english: 'Ultimately, everything depends on the circumstances.', topic: 'Conclusion' },
  ],
};

export const grammar = {
  'a1.1': [
    {
      id: 'a1.1-g1',
      title: 'Personal Pronouns',
      titleDe: 'Personalpronomen',
      rule: 'ich, du, er/sie/es, wir, ihr, sie/Sie',
      explanation: 'German has formal (Sie) and informal (du) forms of "you".',
      explanationDe: 'Deutsch hat formelle (Sie) und informelle (du) Formen von "du".',
      example: 'Ich bin Student. Du bist mein Freund.',
      exampleTranslation: 'I am a student. You are my friend.',
    },
    {
      id: 'a1.1-g2',
      title: 'Present Tense Conjugation',
      titleDe: 'Präsens Konjugation',
      rule: 'Verb stem + endings: -e, -st, -t, -en, -t, -en',
      explanation: 'Regular verbs follow a predictable pattern in the present tense.',
      explanationDe: 'Regelmäßige Verben folgen einem vorhersehbaren Muster im Präsens.',
      example: 'spielen: ich spiele, du spielst, er spielt',
      exampleTranslation: 'to play: I play, you play, he plays',
    },
  ],
  'a1.2': [
    {
      id: 'a1.2-g1',
      title: 'Definite Articles',
      titleDe: 'Bestimmte Artikel',
      rule: 'der (masculine), die (feminine), das (neuter)',
      explanation: 'German nouns have grammatical gender. Articles must match the noun.',
      explanationDe: 'Deutsche Substantive haben grammatisches Geschlecht. Artikel müssen zum Substantiv passen.',
      example: 'der Mann, die Frau, das Kind',
      exampleTranslation: 'the man, the woman, the child',
    },
    {
      id: 'a1.2-g2',
      title: 'Sentence Structure',
      titleDe: 'Satzstruktur',
      rule: 'Subject - Verb - Object (SVO)',
      explanation: 'The verb is always in the second position in main clauses.',
      explanationDe: 'Das Verb steht in Hauptsätzen immer an zweiter Stelle.',
      example: 'Ich esse einen Apfel.',
      exampleTranslation: 'I eat an apple.',
    },
    {
      id: 'a1.2-g3',
      title: 'Negation with "nicht"',
      titleDe: 'Verneinung mit "nicht"',
      rule: '"nicht" typically comes after the verb or at the end',
      explanation: 'Use "nicht" to negate verbs and adjectives.',
      explanationDe: 'Verwende "nicht", um Verben und Adjektive zu verneinen.',
      example: 'Ich verstehe nicht. Das ist nicht richtig.',
      exampleTranslation: 'I don\'t understand. That is not right.',
    },
  ],
  'a2.1': [
    {
      id: 'a2.1-g1',
      title: 'Accusative Case',
      titleDe: 'Akkusativ',
      rule: 'der→den, die→die, das→das, die(pl)→die',
      explanation: 'The accusative case is used for direct objects.',
      explanationDe: 'Der Akkusativ wird für direkte Objekte verwendet.',
      example: 'Ich sehe den Mann. Ich kaufe das Buch.',
      exampleTranslation: 'I see the man. I buy the book.',
    },
    {
      id: 'a2.1-g2',
      title: 'Dative Case',
      titleDe: 'Dativ',
      rule: 'der→dem, die→der, das→dem, die(pl)→den',
      explanation: 'The dative case is used for indirect objects.',
      explanationDe: 'Der Dativ wird für indirekte Objekte verwendet.',
      example: 'Ich gebe dem Kind ein Geschenk.',
      exampleTranslation: 'I give the child a gift.',
    },
  ],
  'a2.2': [
    {
      id: 'a2.2-g1',
      title: 'Modal Verbs',
      titleDe: 'Modalverben',
      rule: 'können, müssen, wollen, sollen, dürfen, mögen',
      explanation: 'Modal verbs modify other verbs. The main verb goes to the end.',
      explanationDe: 'Modalverben modifizieren andere Verben. Das Hauptverb geht ans Ende.',
      example: 'Ich kann Deutsch sprechen.',
      exampleTranslation: 'I can speak German.',
    },
    {
      id: 'a2.2-g2',
      title: 'Separable Verbs',
      titleDe: 'Trennbare Verben',
      rule: 'Prefix goes to the end in present tense',
      explanation: 'Some verbs have prefixes that separate in main clauses.',
      explanationDe: 'Einige Verben haben Präfixe, die sich in Hauptsätzen trennen.',
      example: 'anfangen: Ich fange morgen an.',
      exampleTranslation: 'to begin: I start tomorrow.',
    },
    {
      id: 'a2.2-g3',
      title: 'Perfect Tense',
      titleDe: 'Perfekt',
      rule: 'haben/sein + past participle (ge- + stem + -t/-en)',
      explanation: 'Used for past events in spoken German.',
      explanationDe: 'Wird für vergangene Ereignisse im gesprochenen Deutsch verwendet.',
      example: 'Ich habe gegessen. Ich bin gegangen.',
      exampleTranslation: 'I have eaten. I have gone.',
    },
  ],
  'b1.1': [
    {
      id: 'b1.1-g1',
      title: 'Subordinate Clauses',
      titleDe: 'Nebensätze',
      rule: 'Conjunction + Subject + ... + Verb (at the end)',
      explanation: 'In subordinate clauses, the verb moves to the end.',
      explanationDe: 'In Nebensätzen steht das Verb am Ende.',
      example: 'Ich weiß, dass du Deutsch lernst.',
      exampleTranslation: 'I know that you are learning German.',
    },
    {
      id: 'b1.1-g2',
      title: 'Relative Clauses',
      titleDe: 'Relativsätze',
      rule: 'der/die/das (who/which) + clause with verb at end',
      explanation: 'Relative pronouns must agree with the noun they refer to.',
      explanationDe: 'Relativpronomen müssen mit dem Nomen übereinstimmen, auf das sie sich beziehen.',
      example: 'Der Mann, der dort steht, ist mein Vater.',
      exampleTranslation: 'The man who is standing there is my father.',
    },
  ],
  'b1.2': [
    {
      id: 'b1.2-g1',
      title: 'Konjunktiv II (Subjunctive)',
      titleDe: 'Konjunktiv II',
      rule: 'würde + infinitive OR hätte/wäre + past participle',
      explanation: 'Used for polite requests, hypothetical situations, and wishes.',
      explanationDe: 'Wird für höfliche Bitten, hypothetische Situationen und Wünsche verwendet.',
      example: 'Ich würde gerne kommen. Wenn ich Zeit hätte...',
      exampleTranslation: 'I would like to come. If I had time...',
    },
    {
      id: 'b1.2-g2',
      title: 'Passive Voice',
      titleDe: 'Passiv',
      rule: 'werden + past participle',
      explanation: 'Used when the action is more important than who performs it.',
      explanationDe: 'Wird verwendet, wenn die Handlung wichtiger ist als der Handelnde.',
      example: 'Das Buch wird gelesen.',
      exampleTranslation: 'The book is being read.',
    },
    {
      id: 'b1.2-g3',
      title: 'Genitive Case',
      titleDe: 'Genitiv',
      rule: 'der→des, die→der, das→des, die(pl)→der',
      explanation: 'Used to show possession or with certain prepositions.',
      explanationDe: 'Zeigt Besitz an oder wird mit bestimmten Präpositionen verwendet.',
      example: 'Das Auto des Mannes ist neu.',
      exampleTranslation: 'The man\'s car is new.',
    },
  ],
  'b2.1': [
    {
      id: 'b2.1-g1',
      title: 'Extended Participial Attributes',
      titleDe: 'Erweiterte Partizipialattribute',
      rule: 'Article + participle phrase + noun',
      explanation: 'Complex noun phrases common in formal and academic German.',
      explanationDe: 'Komplexe Nominalphrasen, häufig in formellem und akademischem Deutsch.',
      example: 'Die von vielen Menschen besuchte Ausstellung',
      exampleTranslation: 'The exhibition visited by many people',
    },
    {
      id: 'b2.1-g2',
      title: 'Konjunktiv I (Indirect Speech)',
      titleDe: 'Konjunktiv I (Indirekte Rede)',
      rule: 'Stem + special endings (er sage, sie habe)',
      explanation: 'Used in formal writing to report what others said.',
      explanationDe: 'Wird in formeller Schriftsprache verwendet, um wiederzugeben, was andere gesagt haben.',
      example: 'Er sagte, er sei krank.',
      exampleTranslation: 'He said he was sick.',
    },
  ],
  'b2.2': [
    {
      id: 'b2.2-g1',
      title: 'Nominalization',
      titleDe: 'Nominalisierung',
      rule: 'Verbs and adjectives can become nouns',
      explanation: 'Common in academic and formal German to create abstract concepts.',
      explanationDe: 'Häufig in akademischem und formellem Deutsch, um abstrakte Konzepte zu bilden.',
      example: 'das Lernen, das Wichtige, die Bedeutung',
      exampleTranslation: 'the learning, the important thing, the meaning',
    },
    {
      id: 'b2.2-g2',
      title: 'Two-Part Conjunctions',
      titleDe: 'Zweiteilige Konjunktionen',
      rule: 'sowohl...als auch, weder...noch, nicht nur...sondern auch',
      explanation: 'Used to connect ideas with emphasis or contrast.',
      explanationDe: 'Werden verwendet, um Ideen mit Betonung oder Kontrast zu verbinden.',
      example: 'Er spricht sowohl Deutsch als auch Englisch.',
      exampleTranslation: 'He speaks both German and English.',
    },
    {
      id: 'b2.2-g3',
      title: 'Functional Verb Structures',
      titleDe: 'Funktionsverbgefüge',
      rule: 'Noun + functional verb (eine Entscheidung treffen)',
      explanation: 'Common in formal and business German.',
      explanationDe: 'Häufig in formellem und geschäftlichem Deutsch.',
      example: 'in Betracht ziehen, zur Verfügung stellen',
      exampleTranslation: 'to consider, to make available',
    },
  ],
};

// Helper function to get total items for a level
export const getLevelTotalItems = (level) => {
  const vocabCount = vocabulary[level]?.length || 0;
  const sentenceCount = sentences[level]?.length || 0;
  const grammarCount = grammar[level]?.length || 0;
  return vocabCount + sentenceCount + grammarCount;
};

