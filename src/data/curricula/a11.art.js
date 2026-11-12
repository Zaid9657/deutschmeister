// A1.1 course art manifest — Wave 2, 2026-09-19.
//
// Mixed manifest: L1 reception is the supplied Higgsfield painting (2026-11-12).
// All other scenes and characters retain their inline SVGs. No generated audio.
// Painting provenance and approved screen: docs/strategy/lesson-look-2026-11-12/.
//
// `alt` here is what ships to a learner (via `role="img"` on the SVG branch,
// `alt` on the `<img>` branch); `tests/course-art.test.mjs` requires every
// entry to have a non-empty one and pins that every Lektion id and every
// A11_META.characters[].name resolves here.

export const A11_ART = {
  generatedWith: {
    tool: 'Higgsfield painting + inline SVG (src/components/illustrations/)',
    model: null,
    date: '2026-11-12',
    styleDoc: 'docs/design/a11-art-style.md',
    status: 'mixed-painted-svg',
  },

  characters: {
    Ana: { alt: 'Ana, a student from Morocco newly arrived in Bremen', component: 'CharacterAvatar', src: null, srcSmall: null },
    'Frau Kaya': { alt: 'Frau Kaya, who works at the hostel reception', component: 'CharacterAvatar', src: null, srcSmall: null },
    'Herr Weber': { alt: 'Herr Weber, from the public office (Bürgerbüro)', component: 'CharacterAvatar', src: null, srcSmall: null },
    Lena: { alt: 'Lena, a learner whose hobby is sport', component: 'CharacterAvatar', src: null, srcSmall: null },
    Tim: { alt: 'Tim, a learner furnishing his room', component: 'CharacterAvatar', src: null, srcSmall: null },
    'Frau Wolf': { alt: 'Frau Wolf, who sells furniture at the flea market', component: 'CharacterAvatar', src: null, srcSmall: null },
    Paul: { alt: 'Paul, the café waiter', component: 'CharacterAvatar', src: null, srcSmall: null },
    'Herr Schmidt': { alt: 'Herr Schmidt, who gives train information at the station', component: 'CharacterAvatar', src: null, srcSmall: null },
  },

  situations: {
    'a1.1-l01': { alt: 'Ana arrives at a hostel reception in Bremen and Frau Kaya welcomes her', component: 'SituationScene', src: '/art/a11/l01-rezeption-1168.webp', srcSmall: '/art/a11/l01-rezeption-640.webp', srcMedium: '/art/a11/l01-rezeption-800.webp', width: 1168, height: 880 },
    'a1.1-l02': { alt: 'A public office counter with a form and a pen', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l03': { alt: 'A photo frame on a table', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l04': { alt: 'A flea-market stall with a table and a chair', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l05': { alt: 'A classroom board and pencils', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l06': { alt: 'An office desk with a phone and a monitor', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l07': { alt: 'A bicycle and a guitar', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l08': { alt: 'A wall clock and a calendar', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l09': { alt: 'A cup and a slice of cake on a café table', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l10': { alt: 'A train at a platform with a departure sign', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l11': { alt: 'An alarm clock, a coffee cup and a bag', component: 'SituationScene', src: null, srcSmall: null },
    'a1.1-l12': { alt: 'A birthday cake with candles and an envelope', component: 'SituationScene', src: null, srcSmall: null },
  },
};

export default A11_ART;
