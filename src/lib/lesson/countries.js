// THE COUNTRIES OF THE WORLD — one list, two readers.
//
// DaF review #17, Minor 17: `COUNTRY_STEMS` existed twice — a Set in `src/lib/lesson/writing.js`
// (with `deutsch`, `engländ`, `sloven`, `zypr`) and an array in `scripts/validate-curriculum.mjs`
// (without `deutsch`, with `engl`) — and the two world lists were different sizes, so „Ich komme
// aus England.“ was red on the learner's screen while `eritreisch` was invisible to RULE 24. The
// validator's reason for its own copy („a rule that reads the file it polices is not an independent
// measurement“) is right about `writing.js` and wrong about a list of countries: the list is not a
// rule, it is a fact about the world, and a fact has one source. Both readers import it from here;
// neither may keep a copy.
//
// SHAPE — keep both export names and both shapes exactly, the validator depends on them:
//
//   COUNTRY_STEMS  Array<string>  lowercase STEMS of the nationality adjective/noun, the part
//                                 before `-isch` / `-er(in)` / `-in` / `-e` — `marokkan` (marokkanisch,
//                                 Marokkaner, Marokkanerin), `türk` (türkisch, Türke, Türkin),
//                                 `poln` AND `pol` (polnisch; Pole, Polin). A stem may be one of
//                                 several for one country when the adjective and the noun differ.
//                                 The validator matches `stem + 'isch'` EXACTLY, the checker matches
//                                 `word − suffix === stem`, so a stem is never a prefix search and an
//                                 ordinary `-isch` adjective (`praktisch`, `frisch`) cannot collide.
//   COUNTRY_NAMES  Array<string>  country NAMES as written in German (`Frankreich`, `USA`,
//                                 `Elfenbeinküste`, `Sierra Leone` — a name may be two words, the
//                                 reader joins them) — the remainder that `stem + country ending`
//                                 does NOT build: Deutschland is `deutsch` + `land`, Türkei is
//                                 `türk` + `ei`, Syrien is `syr` + `ien`, Eritrea is `eritre` + `a`,
//                                 and those are not listed; Frankreich/französisch, China/chinesisch,
//                                 Zypern/zyprisch, Marokko/marokkanisch, Kosovo/kosovarisch share no
//                                 such composition and are. ROUND 20 (DaF review #19, MAJOR 2): the
//                                 name FIELDS („Vorname: Franz“) ask „is this a whole country name?“
//                                 and get exactly this composition or this list, nothing looser —
//                                 the five-letter prefix search that reads „aus Marokko“ read Franz
//                                 as Frankreich and Dominik as the Dominikanische Republik — so the
//                                 list now carries every common country the composition misses.
//                                 `Ukraine` is here although `ukrain` + `e` would find it, because
//                                 `-e` is also a nationality-noun suffix (Pole, Türke) and the
//                                 country field excludes nationality nouns: a LISTED name wins.
//                                 Readers lower-case at their boundary; the list is written as a
//                                 person writes it.
//   LANGUAGE_NAMES Array<string>  the LANGUAGES whose German name does not end in `-isch` (`Dari`,
//                                 `Urdu`, `Tigrinya`, `Somali`) — the `-isch` languages are read by
//                                 form in `writing.js` (`LANGUAGE_NAME_RE`); this is the remainder,
//                                 for the same two readers: „Sprache: Dari“ is a filled language
//                                 field, and „Ich spreche Dari.“ names no nationality.
//
// All three lists belong to the WORLD, not to a course — the countries of origin an adult integration
// course actually has in the room — so they do not grow with the material; they grow when a probe
// against the world („123 Ländernamen, 22 nicht erkannt“, review #17) finds a country missing.
// No duplicates: `tests/writing-course.test.mjs` pins that, and pins that every stem is lower case
// and every name is capitalised.

export const COUNTRY_STEMS = [
  // Europa
  'deutsch', 'österreich', 'schweiz', 'schweizer', 'französ', 'franzos', 'ital', 'italien', 'span',
  'portugies', 'griech', 'engländ', 'engl', 'brit', 'schott', 'ir', 'niederländ', 'holländ', 'belg',
  'luxemburg', 'dän', 'norweg', 'schwed', 'finn', 'isländ', 'pol', 'poln', 'tschech', 'slowak',
  'ungar', 'rumän', 'bulgar', 'kroat', 'serb', 'bosn', 'alban', 'kosovar', 'montenegrin', 'maked',
  'mazedon', 'sloven', 'slowen', 'russ', 'ukrain', 'weißruss', 'belaruss', 'litau', 'lett', 'est',
  'estn', 'moldau', 'georg', 'armen', 'aserbaidschan', 'türk', 'zypr', 'malt',
  // Naher Osten, Nordafrika, Zentralasien
  'arab', 'syr', 'irak', 'iran', 'afghan', 'kurd', 'libanes', 'jordan', 'palästinens', 'israel',
  'ägypt', 'marokkan', 'tunes', 'alger', 'liby', 'sudanes', 'somal', 'eritre', 'äthiop', 'jemenit',
  'saudi', 'katar', 'kuwait', 'oman', 'kasach', 'usbek', 'tadschik', 'turkmen', 'kirgis',
  // Süd- und Ostasien
  'ind', 'pakistan', 'banglades', 'bangladesch', 'bengal', 'sri-lank', 'nepales', 'chines', 'japan',
  'korean', 'vietnames', 'thail', 'thailänd', 'indones', 'philippin', 'malays', 'mongol',
  // Afrika südlich der Sahara
  'niger', 'nigerian', 'ghana', 'kamerun', 'kongoles', 'kenian', 'senegales', 'ivor', 'gambi',
  'guine', 'mali', 'togo', 'benin', 'angolan', 'tansan', 'ugand', 'südafrikan',
  // Amerika
  'amerikan', 'kanad', 'mexikan', 'brasilian', 'argentin', 'chilen', 'kolumbian', 'peruan',
  'venezolan', 'kuban', 'dominikan', 'ecuadorian', 'bolivian', 'uruguay', 'paraguay',
  // Ozeanien
  'australi', 'neuseeländ',
];

export const COUNTRY_NAMES = [
  'Frankreich', 'China', 'Großbritannien', 'Grossbritannien', 'England', 'USA', 'Holland', 'Taiwan',
  'Kambodscha', 'Laos', 'Myanmar', 'Elfenbeinküste', 'Tschetschenien', 'Niederlande', 'Zypern',
  'Slowenien', 'Luxemburg', 'Island', 'Mosambik', 'Simbabwe', 'Bahrain', 'Nordmazedonien',
  // ROUND 19 (DaF review #18, Minor 17): two-word names. The reader joins the words before it
  // compares, so `Sierra Leone` is one name and „Ich komme aus Sierra Leone.“ is a country.
  'Sierra Leone', 'Saudi-Arabien', 'Sri Lanka', 'Costa Rica', 'El Salvador', 'Burkina Faso',
  'Papua-Neuguinea', 'Trinidad und Tobago',
  // ROUND 20 (DaF review #19, MAJOR 2): the names `stem + ending` does not build — see the header.
  'Marokko', 'Mexiko', 'Kosovo', 'Korea', 'Chile', 'Kenia', 'Peru', 'Vietnam', 'Angola', 'Kongo',
  'Sudan', 'Jemen', 'Nepal', 'Senegal', 'Portugal', 'Dänemark', 'Ungarn', 'Palästina', 'Südafrika',
  'Venezuela', 'Ecuador', 'Brasilien', 'Bolivien', 'Kolumbien', 'Libanon', 'Ukraine', 'Montenegro',
  'Mazedonien', 'Belarus',
  // ROUND 24 (DaF review #23, Minor 30): the probe against the world found four more the
  // composition does not build — plus Nordkorea, the same class as Südkorea.
  'Ruanda', 'Südkorea', 'Nordkorea', 'Vereinigte Staaten', 'Jamaika',
];

export const LANGUAGE_NAMES = [
  'Dari', 'Farsi', 'Paschtu', 'Urdu', 'Hindi', 'Punjabi', 'Bengali', 'Tamil', 'Nepali',
  'Tigrinya', 'Somali', 'Oromo', 'Hausa', 'Igbo', 'Yoruba', 'Twi', 'Wolof', 'Fula',
  'Bambara', 'Mandinka', 'Lingala', 'Suaheli', 'Swahili', 'Kinyarwanda', 'Kirundi', 'Edo', 'Krio',
  'Kurmandschi', 'Sorani', 'Tagalog', 'Filipino', 'Thai', 'Mandarin', 'Latein',
  'Esperanto', 'Romani', 'Romanes', 'Quechua', 'Guarani', 'Papiamento', 'Pidgin', 'Kreol',
  // ROUND 24 (DaF review #23, Minor 29): the languages of a North-African and Afghan classroom as
  // the learners themselves write them — Tamazight and Darija (Morocco), Pashto beside `Paschtu`.
  'Tamazight', 'Darija', 'Pashto',
];
