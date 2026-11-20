// A1.1 course art manifest — Wave 2, 2026-09-19.
//
// Mixed manifest: L1 reception is an illustration drawn with the Codex image tool
// on 2026-11-17 after the founder picked the otter as the course guide; L2 and L3
// followed on 2026-11-19 (docs/course-factory/a11-lektion-rollout/, with the cast
// sheet that fixes every character's animal). The other scenes and characters
// retain their inline SVGs. No generated audio.
// Provenance, brief and approved screens: docs/strategy/lesson-look-2026-11-17/.
//
// `alt` here is what ships to a learner (via `role="img"` on the SVG branch,
// `alt` on the `<img>` branch); `tests/course-art.test.mjs` requires every
// entry to have a non-empty one and pins that every Lektion id and every
// A11_META.characters[].name resolves here.

export const A11_ART = {
  generatedWith: {
    tool: 'Codex image tool illustration + inline SVG (src/components/illustrations/)',
    model: null,
    date: '2026-11-17',
    styleDoc: 'docs/design/a11-art-style.md',
    status: 'mixed-illustrated-svg',
  },

  guide: {
    name: null, // no approved name yet
    poses: {
      thinking: { src: '/art/a11/otter-thinking-512.webp', srcSmall: '/art/a11/otter-thinking-160.webp', alt: 'The course otter, thinking' },
      satisfied: { src: '/art/a11/otter-satisfied-512.webp', srcSmall: '/art/a11/otter-satisfied-160.webp', alt: 'The course otter, quietly pleased' },
    },
  },

  characters: {
    // Cut from the L1 scene, so the cast list shows the same two figures the scene does.
    Ana: { alt: 'Ana, a student from Morocco newly arrived in Bremen, drawn as an otter', component: 'CharacterAvatar', src: '/art/a11/ana-160.webp', srcSmall: '/art/a11/ana-160.webp' },
    'Frau Kaya': { alt: 'Frau Kaya, who works at the hostel reception, drawn as a bird', component: 'CharacterAvatar', src: '/art/a11/frau-kaya-160.webp', srcSmall: '/art/a11/frau-kaya-160.webp' },
    // Cut from the L2 scene (2026-11-19); the animal is fixed by docs/course-factory/a11-lektion-rollout/cast-sheet.png.
    'Herr Weber': { alt: 'Herr Weber, from the public office (Bürgerbüro), drawn as a badger', component: 'CharacterAvatar', src: '/art/a11/herr-weber-160.webp', srcSmall: '/art/a11/herr-weber-160.webp' },
    // Cut from the L3 scene (2026-11-19).
    Lena: { alt: 'Lena, a learner whose hobby is sport, drawn as a hare', component: 'CharacterAvatar', src: '/art/a11/lena-160.webp', srcSmall: '/art/a11/lena-160.webp' },
    // Cut from the L4 scene (2026-11-19).
    Tim: { alt: 'Tim, a learner furnishing his room, drawn as a fox', component: 'CharacterAvatar', src: '/art/a11/tim-160.webp', srcSmall: '/art/a11/tim-160.webp' },
    'Frau Wolf': { alt: 'Frau Wolf, who sells furniture at the flea market, drawn as a hedgehog', component: 'CharacterAvatar', src: '/art/a11/frau-wolf-160.webp', srcSmall: '/art/a11/frau-wolf-160.webp' },
    Paul: { alt: 'Paul, the café waiter', component: 'CharacterAvatar', src: null, srcSmall: null },
    'Herr Schmidt': { alt: 'Herr Schmidt, who gives train information at the station', component: 'CharacterAvatar', src: null, srcSmall: null },
  },

  situations: {
    'a1.1-l01': { alt: 'Ana, drawn as an otter with a suitcase, arrives at a hostel reception in Bremen; Frau Kaya, drawn as a bird, welcomes her', component: 'SituationScene', src: '/art/a11/l01-rezeption-1168.webp', srcSmall: '/art/a11/l01-rezeption-640.webp', srcMedium: '/art/a11/l01-rezeption-800.webp', width: 1168, height: 880 },
    'a1.1-l02': { alt: 'Ana, drawn as an otter, stands at a counter in the public office in Bremen; Herr Weber, drawn as a badger, points to a form', component: 'SituationScene', src: '/art/a11/l02-buergerbuero-1168.webp', srcSmall: '/art/a11/l02-buergerbuero-640.webp', srcMedium: '/art/a11/l02-buergerbuero-800.webp', width: 1168, height: 880 },
    'a1.1-l03': { alt: 'Ana, drawn as an otter, shows Lena, drawn as a hare, a photo of her otter family on her phone in the common room of the language school', component: 'SituationScene', src: '/art/a11/l03-familienfoto-1168.webp', srcSmall: '/art/a11/l03-familienfoto-640.webp', srcMedium: '/art/a11/l03-familienfoto-800.webp', width: 1168, height: 880 },
    'a1.1-l04': { alt: 'Tim, drawn as a fox, points at a lamp on Frau Wolf’s flea-market stall in Bremen; Frau Wolf, drawn as a hedgehog, smiles behind the stall with a chair, a table, a shelf and two bags', component: 'SituationScene', src: '/art/a11/l04-flohmarkt-1168.webp', srcSmall: '/art/a11/l04-flohmarkt-640.webp', srcMedium: '/art/a11/l04-flohmarkt-800.webp', width: 1168, height: 880 },
    'a1.1-l05': { alt: 'Lena, drawn as a hare, and Tim, drawn as a fox, unpack their bags in the classroom before the course; on the desk a dictionary, scissors, a ruler, a pen, a pencil, a green exercise book, a key and a small blue picture', component: 'SituationScene', src: '/art/a11/l05-klassenzimmer-1168.webp', srcSmall: '/art/a11/l05-klassenzimmer-640.webp', srcMedium: '/art/a11/l05-klassenzimmer-800.webp', width: 1168, height: 880 },
    'a1.1-l06': { alt: 'Ana, drawn as an otter, on her first day at work; Herr Weber, drawn as a badger, shows her a desk with a computer and a telephone in an office in Bremen', component: 'SituationScene', src: '/art/a11/l06-buero-1168.webp', srcSmall: '/art/a11/l06-buero-640.webp', srcMedium: '/art/a11/l06-buero-800.webp', width: 1168, height: 880 },
    'a1.1-l07': { alt: 'A bicycle and a guitar', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l08': { alt: 'A wall clock and a calendar', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l09': { alt: 'A cup and a slice of cake on a café table', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l10': { alt: 'A train at a platform with a departure sign', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l11': { alt: 'An alarm clock, a coffee cup and a bag', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l12': { alt: 'A birthday cake with candles and an envelope', component: 'SituationScene', src: null, srcSmall: null },
  },
};

export default A11_ART;
