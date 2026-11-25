// The German a beginner's answer may be made of, as forms (loop round 3, 2026-11-25): verbs with their persons, participles
// and what they take, adjectives with their endings, small words with their place, determiners and pronouns with their cases.
// `clause.js` reads a sentence with them. It is a list of forms, never of answers.

export const fold = (s) => String(s || '').normalize('NFC').trim().toLocaleLowerCase('de').replace(/ß/g, 'ss');
const words = (s) => s.trim().split(/\s+/);
const wordSet = (s) => new Set(words(s).map(fold));

// ——— Verbs ———
// `infinitive:what it takes`. a an accusative object, d a dative beside it, D a dative only, i no object, r may be reflexive,
// p a predicate („ist alt“), c a clause („weiß, wo …“), m an amount („kostet zehn Euro“, „dauert eine Stunde“), + an infinitive at the end
// („gehe einkaufen“), l where („wohne in“), w where to („fahre nach“).
const WEAK = `machen:ad kaufen:ad verkaufen:ad brauchen:a suchen:a holen:ad hören:ac spielen:ad lernen:a+ üben:a lieben:a hassen:a öffnen:a putzen:a kochen:ad
malen:ad zeichnen:ad tanzen:a fotografieren:a reparieren:ad studieren:al besuchen:a begrüßen:a grüßen:a fragen:ac antworten:Dc sagen:adc erzählen:adc erklären:adc
zeigen:adc bezahlen:a zahlen:a kosten:m benutzen:a packen:a reservieren:ad bestellen:ad probieren:a feiern:a planen:a organisieren:a buchstabieren:a wiederholen:a
merken:ac wählen:a stellen:aw legen:aw setzen:arw hängen:alw baden:ai duschen:ir rasieren:ar kämmen:ar bügeln:a spülen:a füttern:a pflegen:a nähen:ad basteln:ad
sammeln:a stricken:ad häkeln:a klettern:iw reisen:iw wandern:iw joggen:iw surfen:i chatten:i telefonieren:i arbeiten:il wohnen:il leben:il warten:i lachen:i weinen:i
rauchen:a träumen:i frühstücken:a trainieren:a turnen:i angeln:a campen:i zelten:i meditieren:i beten:i schicken:ad schenken:ad wünschen:ad danken:D gehören:D
schmecken:Dp passen:D gratulieren:D fehlen:D glauben:ac hoffen:c meinen:c erreichen:a benötigen:a dauern:m klingeln:i regnen:i schneien:i freuen:r interessieren:ar
ausruhen:r beeilen:r fühlen:rp kümmern:r bewegen:ar beschäftigen:ar erholen:r entspannen:ri verspäten:r melden:ar heiraten:a mieten:a putzen:a stören:a wecken:a
reden:i diskutieren:i kontrollieren:a korrigieren:a markieren:a notieren:a ergänzen:a faxen:a mailen:ad drucken:a kopieren:a scannen:a surfen:i posten:a skypen:i
parken:a tanken:a landen:il starten:i radeln:iw bauen:a pflanzen:a gießen:a kehren:a wischen:a saugen:a decken:a schneidern:a töpfern:a filmen:a blättern:i
schaffen:a nutzen:a mögen:a verzichten:i gärtnern:i belegen:a versuchen:a stammen:il lauten:m zeigen:a reichen:D knurren:i verlangen:a boxen:i kegeln:i puzzeln:i musizieren:i jonglieren:i rudern:i segeln:i tauchen:i grillen:a würfeln:i stimmen:i
bedeuten:a wechseln:a vermissen:a bemerken:a bearbeiten:a überlegen:arc verdienen:a entschuldigen:ar erwarten:a folgen:D blühen:i lächeln:i quatschen:i plaudern:i
unterrichten:a betreuen:a operieren:a putzen:a servieren:ad kassieren:a programmieren:a übersetzen:a liefern:ad renovieren:a streicheln:a dekorieren:a begleiten:a
tätigen:a teilen:a zählen:a wünschen:ad leisten:ad kuscheln:i jobben:i spenden:a rechnen:i klappen:i existieren:i landen:il stecken:lw hören:ac führen:a nennen:a`;
// infinitive:what it takes:er-form:participle[:s = with sein]
const STRONG = `kommen:iw:kommt:gekommen:s gehen:iw+:geht:gegangen:s fahren:awl+:fährt:gefahren:s fliegen:iw:fliegt:geflogen:s laufen:iw:läuft:gelaufen:s schwimmen:i:schwimmt:geschwommen:s
essen:a:isst:gegessen trinken:a:trinkt:getrunken lesen:ad:liest:gelesen sehen:ac:sieht:gesehen schlafen:il:schläft:geschlafen sprechen:a:spricht:gesprochen treffen:ar:trifft:getroffen
nehmen:ad:nimmt:genommen geben:ad:gibt:gegeben helfen:D:hilft:geholfen finden:acp:findet:gefunden bleiben:lp:bleibt:geblieben:s schreiben:ad:schreibt:geschrieben heißen:p:heißt:geheißen
liegen:il:liegt:gelegen stehen:il:steht:gestanden sitzen:il:sitzt:gesessen singen:a:singt:gesungen springen:iw:springt:gesprungen:s bekommen:a:bekommt:bekommen beginnen:a:beginnt:begonnen
verstehen:ac:versteht:verstanden vergessen:ac:vergisst:vergessen verlieren:a:verliert:verloren gewinnen:a:gewinnt:gewonnen bieten:ad:bietet:geboten schließen:a:schließt:geschlossen
ziehen:aw:zieht:gezogen rufen:a:ruft:gerufen tragen:a:trägt:getragen waschen:ar:wäscht:gewaschen backen:ad:backt:gebacken braten:a:brät:gebraten lassen:a+:lässt:gelassen halten:al:hält:gehalten
fangen:a:fängt:gefangen fallen:iw:fällt:gefallen:s raten:ad:rät:geraten tun:ad:tut:getan denken:c:denkt:gedacht bringen:adw:bringt:gebracht kennen:a:kennt:gekannt rennen:iw:rennt:gerannt:s
gefallen:D:gefällt:gefallen empfehlen:ad:empfiehlt:empfohlen werfen:aw:wirft:geworfen sterben:i:stirbt:gestorben:s steigen:iw:steigt:gestiegen:s leihen:ad:leiht:geliehen scheinen:i:scheint:geschienen
schneiden:a:schneidet:geschnitten reiten:a:reitet:geritten gießen:a:gießt:gegossen genießen:a:genießt:genossen frieren:i:friert:gefroren riechen:a:riecht:gerochen schieben:a:schiebt:geschoben
bitten:a:bittet:gebeten klingen:p:klingt:geklungen verbringen:a:verbringt:verbracht verlassen:a:verlässt:verlassen erhalten:a:erhält:erhalten gelingen:D:gelingt:gelungen:s befinden:rl:befindet:befunden verraten:adc:verrät:verraten versuchen:a:versucht:versucht wissen:ac:weiß:gewusst
werden:p:wird:geworden:s sein:pl:ist:gewesen:s haben:a:hat:gehabt betreten:a:betritt:betreten verbinden:a:verbindet:verbunden besitzen:a:besitzt:besessen entscheiden:r:entscheidet:entschieden
unterhalten:r:unterhält:unterhalten versprechen:ad:verspricht:versprochen vergleichen:a:vergleicht:verglichen nennen:a:nennt:genannt brennen:i:brennt:gebrannt`;
const MODALS = `können:kann:kannst:könnt müssen:muss:musst:müsst wollen:will:willst:wollt sollen:soll:sollst:sollt dürfen:darf:darfst:dürft mögen:mag:magst:mögt`;
// Separable verbs, prefix|verb; what they take where it differs from the verb alone.
const SEPARABLE = `ab|fahren:iw ab|holen:a ab|waschen:a an|fangen:ai an|kommen:il an|rufen:a an|ziehen:ar an|bieten:ad an|machen:a an|sehen:ar an|schauen:ar an|melden:ar an|nehmen:a auf|machen:a auf|räumen:a auf|stehen:i
auf|wachen:i auf|hören:i auf|passen:i auf|hängen:a auf|schreiben:a auf|essen:a aus|gehen:i aus|sehen:p aus|machen:ad aus|ruhen:r aus|steigen:il aus|füllen:a aus|schlafen:i aus|probieren:a aus|ziehen:ari aus|packen:a aus|drucken:a
ein|kaufen:a ein|laden:a ein|steigen:il ein|schlafen:i ein|packen:a ein|ziehen:iw ein|räumen:a ein|treten:i fern|sehen:i hin|legen:ar hin|gehen:i hin|fahren:i hin|stellen:a kennen|lernen:a los|fahren:i los|gehen:i los|laufen:i
mit|bringen:ad mit|kommen:i mit|machen:a mit|nehmen:a mit|fahren:i mit|spielen:i mit|feiern:i mit|gehen:i nach|denken:i nach|sehen:a nach|schauen:a nach|fragen:i statt|finden:i um|steigen:il um|ziehen:i vor|bereiten:ar vorbei|kommen:i
vorbei|schauen:i vor|haben:a vor|lesen:ad vor|stellen:ar weg|gehen:i weg|fahren:i weg|bringen:a weiter|machen:i weiter|arbeiten:i weiter|fahren:i zu|machen:a zu|hören:D zu|sagen:i zu|schauen:D zurück|kommen:i zurück|fahren:iw zurück|rufen:a zurück|gehen:i
zusammen|arbeiten:i zusammen|sitzen:i ab|sagen:ai ab|geben:a ab|reisen:i ab|nehmen:ai her|kommen:i dabei|haben:a dabei|sein:i da|sein:i frei|haben:i teil|nehmen:i spazieren|gehen:i ab|schließen:a ab|trocknen:a ab|stellen:a
auf|setzen:a auf|bauen:a aus|suchen:a aus|geben:a aus|leihen:a bei|bringen:ad ein|richten:a ein|stellen:a fertig|machen:a her|bringen:a mit|helfen:i mit|singen:i nach|holen:a um|arbeiten:i vor|kochen:a vor|gehen:i vor|schlagen:ad weiter|lernen:i zu|bereiten:a zu|nehmen:i
zurück|geben:a zurück|bringen:a zusammen|kommen:i zusammen|leben:i zusammen|wohnen:i wieder|kommen:i wieder|sehen:a frei|nehmen:a hin|setzen:r um|sehen:r aus|üben:a ab|waschen:a auf|holen:a ein|nehmen:a weg|räumen:a sauber|machen:a`;
const STEM_E = /(?:[dt]|chn|ffn|dm|tm|gn)$/u; // arbeitet, öffnet
const SIBILANT = /(?:s|ss|ß|z|x)$/u; // du tanzt

const PERSONS = ['ich', 'du', 'er', 'wir', 'ihr', 'sie'];
/** form (folded) → readings { lemma, persons, mood: 'fin' | 'imp' | 'inf' | 'part' | 'past', sein, takes, sep } */
const FORMS = new Map();
const BASE = new Map(); // infinitive → { takes, forms, part, sein }
const add = (form, reading) => { const f = fold(form); if (!FORMS.has(f)) FORMS.set(f, []); FORMS.get(f).push(reading); };

function weakForms(inf) {
  const ern = /(?:eln|ern)$/u.test(inf);
  const stem = ern ? inf.slice(0, -1) : inf.replace(/e?n$/u, '');
  const e = STEM_E.test(stem) ? 'e' : '';
  const du = SIBILANT.test(stem) ? 't' : `${e}st`;
  const ich = ern ? [`${stem}e`, `${stem.replace(/e([lr])$/u, '$1')}e`] : [`${stem}e`];
  return { ich, du: `${stem}${du}`, er: `${stem}${e}t`, wir: inf, ihr: `${stem}${e}t`, imp: ern ? [...ich, stem] : [`${stem}e`, ...(e ? [] : [stem])] };
}
const INSEPARABLE = /^(?:be|er|ent|emp|ver|zer|ge|miss|über|unter|wieder)(?=\p{L}{3,})/u;
const weakParticiple = (inf) => {
  const ern = /(?:eln|ern)$/u.test(inf);
  const stem = ern ? inf.slice(0, -1) : inf.replace(/e?n$/u, '');
  const t = `${stem}${STEM_E.test(stem) ? 'e' : ''}t`;
  return /ieren$/u.test(inf) || (INSEPARABLE.test(inf) && !/^(?:wiegen|beten|erben|gehen|geben)$/u.test(inf)) ? t : `ge${t}`;
};
const WEAK_SEIN = new Set(['reisen', 'wandern', 'joggen', 'klettern', 'landen', 'starten', 'folgen', 'radeln', 'aufwachen']);
// Two auxiliaries are German („bin / habe geschwommen“, „habe / bin gejoggt“, „bin / habe gefahren“).
const EITHER_AUX = new Set(['joggen', 'schwimmen', 'fahren', 'klettern', 'fliegen', 'reiten', 'rudern', 'segeln', 'tauchen', 'liegen', 'stehen', 'sitzen', 'tanzen', 'starten', 'ziehen']);

function register(inf, takes, { er, part, sein = false, du, ihr, modal = false, past = null } = {}) {
  const f = weakForms(inf);
  const stem = inf.replace(/e?n$/u, '');
  const strong = Boolean(er);
  let duForm = du || f.du;
  let erForm = er || f.er;
  if (strong && !du && er) {
    const s = /et$/u.test(er) && STEM_E.test(er.slice(0, -2)) ? er.slice(0, -1) : er.replace(/t$/u, '');
    duForm = er === 'hält' ? 'hältst' : er === 'lässt' ? 'lässt' : er === 'lädt' ? 'lädst' : er === 'rät' ? 'rätst' : er === 'brät' ? 'brätst' : er === 'tritt' || er === 'betritt' ? `${er}st` : SIBILANT.test(s) ? `${s}t` : `${s}st`;
    if (er === 'unterhält') duForm = 'unterhältst';
    if (er === 'erhält') duForm = 'erhältst';
  }
  const base = { lemma: inf, takes, part: part || weakParticiple(inf), sein: sein || WEAK_SEIN.has(inf), either: EITHER_AUX.has(inf), modal };
  const finite = modal
    ? [[er, ['ich', 'er']], [du, ['du']], [inf, ['wir', 'sie']], [ihr, ['ihr']]]
    : [...f.ich.map((x) => [x, ['ich']]), [duForm, ['du']], [erForm, ['er']], [inf, ['wir', 'sie']], [f.ihr, ['ihr']]];
  if (strong && /^(?:wissen)$/u.test(inf)) { finite.length = 0; finite.push(['weiß', ['ich', 'er']], ['weißt', ['du']], ['wissen', ['wir', 'sie']], ['wisst', ['ihr']]); }
  if (inf === 'tun') { finite.length = 0; finite.push(['tue', ['ich']], ['tu', ['ich']], ['tust', ['du']], ['tut', ['er', 'ihr']], ['tun', ['wir', 'sie']]); }
  for (const [form, persons] of finite) add(form, { ...base, mood: 'fin', persons });
  // „Ich geh jetzt“, „ich hab“: the spoken ich-form.
  if (!modal && !/(?:eln|ern)$/u.test(inf) && !STEM_E.test(stem)) add(stem, { ...base, mood: 'fin', persons: ['ich'], spoken: true });
  for (const form of f.imp) add(form, { ...base, mood: 'imp', persons: ['du'] });
  if (strong && /i/u.test((erForm || '').slice(0, 3)) && !/i/u.test(inf.slice(0, 3)) && !modal) add(duForm.replace(/s?t$/u, '').replace(/^(ni)m$/u, '$1mm'), { ...base, mood: 'imp', persons: ['du'] });
  add(inf, { ...base, mood: 'inf', persons: [] });
  add(base.part, { ...base, mood: 'part', persons: [] });
  for (const [form, persons] of past || []) add(form, { ...base, mood: 'past', persons });
  BASE.set(inf, { ...base, forms: finite, imp: f.imp });
}
for (const e of words(WEAK)) { const [inf, takes] = e.split(':'); if (!BASE.has(inf) && inf !== 'mögen' && inf !== 'nennen' && inf !== 'gießen') register(inf, takes); }
const PASTS = { kommen: 'kam', gehen: 'ging', fahren: 'fuhr', geben: 'gab', finden: 'fand', sehen: 'sah', schlafen: 'schlief', bleiben: 'blieb' };
for (const e of words(STRONG)) {
  const [inf, takes, er, part, s] = e.split(':');
  if (['sein', 'haben', 'werden'].includes(inf)) continue;
  const p = PASTS[inf];
  register(inf, takes, { er, part, sein: s === 's', past: p ? [[p, ['ich', 'er']], [`${p}en`, ['wir', 'sie']]] : null });
}
for (const e of words(MODALS)) {
  const [inf, er, du, ihr] = e.split(':');
  const stem = { können: 'konnt', müssen: 'musst', wollen: 'wollt', sollen: 'sollt', dürfen: 'durft', mögen: 'mocht' }[inf];
  register(inf, inf === 'mögen' ? 'a+' : 'a+', { er, du, ihr, part: stem.replace(/^/, 'ge'), modal: true, past: [[`${stem}e`, ['ich', 'er']], [`${stem}est`, ['du']], [`${stem}en`, ['wir', 'sie']]] });
  const konj = { können: 'könnt', müssen: 'müsst', wollen: 'wollt', sollen: 'sollt', dürfen: 'dürft', mögen: 'möcht' }[inf];
  for (const [end, persons] of [['e', ['ich', 'er']], ['est', ['du']], ['en', ['wir', 'sie']], ['et', ['ihr']]]) add(`${konj}${end}`, { lemma: inf === 'mögen' ? 'möchten' : inf, takes: 'a+', part: '', sein: false, modal: true, mood: 'fin', persons, polite: true });
}
const IRREGULAR = {
  sein: { takes: 'pl', part: 'gewesen', sein: true, fin: { bin: ['ich'], bist: ['du'], ist: ['er'], sind: ['wir', 'sie'], seid: ['ihr'] }, past: { war: ['ich', 'er'], warst: ['du'], waren: ['wir', 'sie'] }, polite: { wäre: ['ich', 'er'], wärst: ['du'], wären: ['wir', 'sie'] }, imp: ['sei'] },
  haben: { takes: 'a', part: 'gehabt', fin: { habe: ['ich'], hab: ['ich'], hast: ['du'], hat: ['er'], haben: ['wir', 'sie'], habt: ['ihr'] }, past: { hatte: ['ich', 'er'], hattest: ['du'], hatten: ['wir', 'sie'] }, polite: { hätte: ['ich', 'er'], hättest: ['du'], hätten: ['wir', 'sie'] }, imp: ['hab'] },
  werden: { takes: 'p', part: 'geworden', sein: true, fin: { werde: ['ich'], wirst: ['du'], wird: ['er'], werden: ['wir', 'sie'], werdet: ['ihr'] }, past: { wurde: ['ich', 'er'], wurdest: ['du'], wurden: ['wir', 'sie'] }, polite: { würde: ['ich', 'er'], würdest: ['du'], würden: ['wir', 'sie'] }, imp: ['werde'] },
};
for (const [inf, v] of Object.entries(IRREGULAR)) {
  const base = { lemma: inf, takes: v.takes, part: v.part, sein: Boolean(v.sein), either: false, modal: false };
  for (const [form, persons] of Object.entries(v.fin)) add(form, { ...base, mood: 'fin', persons });
  for (const [form, persons] of Object.entries(v.past)) add(form, { ...base, mood: 'past', persons });
  for (const [form, persons] of Object.entries(v.polite)) add(form, { ...base, mood: 'fin', persons, polite: true });
  for (const form of v.imp) add(form, { ...base, mood: 'imp', persons: ['du'] });
  add(inf, { ...base, mood: 'inf', persons: [] });
  add(v.part, { ...base, mood: 'part', persons: [] });
  BASE.set(inf, { ...base, forms: Object.entries(v.fin), imp: v.imp });
}
for (const [form, persons] of [['bräuchte', ['ich', 'er']], ['bräuchten', ['wir', 'sie']]]) add(form, { ...BASE.get('brauchen'), mood: 'fin', persons, polite: true });
add('geboren', { lemma: 'geboren', takes: 'il', part: 'geboren', sein: true, either: false, modal: false, mood: 'part', persons: [] });
// Separable verbs: the prefix stands at the end, or the whole verb does (infinitive, participle, subordinate clause).
export const PREFIXES = new Set();
const SEP = new Map(); // base lemma → [{ prefix, lemma, takes }]
for (const e of words(SEPARABLE)) {
  const [verb, takes] = e.split(':');
  const [prefix, baseInf] = verb.split('|');
  const lemma = `${prefix}${baseInf}`;
  let base = BASE.get(baseInf);
  if (!base && baseInf === 'laden') { register('laden', 'a', { er: 'lädt', part: 'geladen' }); base = BASE.get('laden'); }
  if (!base && baseInf === 'räumen') { register('räumen', 'a'); base = BASE.get('räumen'); }
  if (!base && baseInf === 'wachen') { register('wachen', 'i'); base = BASE.get('wachen'); }
  if (!base && baseInf === 'treten') { register('treten', 'iw', { er: 'tritt', part: 'getreten', sein: true }); base = BASE.get('treten'); }
  if (!base && baseInf === 'schlagen') { register('schlagen', 'a', { er: 'schlägt', part: 'geschlagen' }); base = BASE.get('schlagen'); }
  if (!base && ['schauen', 'füllen', 'ruhen', 'bereiten', 'stellen', 'trocknen', 'richten'].includes(baseInf)) { register(baseInf, baseInf === 'schauen' ? 'ac' : 'a'); base = BASE.get(baseInf); }
  if (!base) continue;
  PREFIXES.add(fold(prefix));
  if (!SEP.has(baseInf)) SEP.set(baseInf, []);
  if (SEP.get(baseInf).some((x) => x.lemma === lemma)) continue;
  const sein = base.sein || ['aufstehen', 'aufwachen', 'einschlafen', 'umziehen', 'einziehen', 'abreisen', 'vorbeischauen', 'dabeisein', 'dasein'].includes(lemma);
  SEP.get(baseInf).push({ prefix: fold(prefix), lemma, takes: takes || base.takes });
  const part = /^ver|^be|^er|^ent/u.test(baseInf) && lemma !== 'vorbereiten' ? `${prefix}${base.part}` : lemma === 'vorbereiten' ? 'vorbereitet' : `${prefix}${base.part}`;
  const reading = { lemma, takes: takes || base.takes, part, sein, either: base.either && lemma !== 'aufstehen', modal: false, sep: fold(prefix) };
  add(lemma, { ...reading, mood: 'inf', persons: [] });
  add(part, { ...reading, mood: 'part', persons: [] });
  if (prefix !== 'spazieren' && prefix !== 'kennen') add(`${prefix}zu${baseInf}`, { ...reading, mood: 'zu', persons: [] });
  for (const [form, persons] of base.forms || []) add(`${prefix}${form}`, { ...reading, mood: 'last', persons });
}
export const separableOf = (baseLemma) => SEP.get(baseLemma) || [];
/** The verb readings of a word, folded. */
export const verbReadings = (w) => FORMS.get(fold(w)) || [];
/** The finite forms of a verb by person, for a verb in the wrong person. */
export const formsOf = (lemma) => (BASE.get(lemma)?.forms || []);
export const participleFor = (lemma) => BASE.get(lemma)?.part || null;
export const isBaseVerb = (lemma) => BASE.has(lemma);
export const PERSON_LIST = PERSONS;

// ——— Adjectives ———
const ADJ = wordSet(`rot blau gelb grün schwarz weiß grau braun bunt hell dunkel orange rosa lila pink türkis violett beige gold golden silber silbern hellblau dunkelblau hellgrün dunkelgrün
hellrot dunkelrot hellgrau dunkelgrau neu alt groß klein jung schön hübsch gut schlecht warm kalt heiß lang kurz dick dünn schwer leicht teuer billig günstig frisch lecker süß still frei schnell langsam
laut leise nett lieb krank gesund toll deutsch privat eigen ganz sauber leer voll kaputt praktisch modern wichtig richtig bequem weich hart rund breit schmal hoch nah weit früh spät halb müde
wach fit satt hungrig durstig froh glücklich zufrieden traurig nervös ruhig aktiv verheiratet ledig geschieden verwitwet verlobt berufstätig arbeitslos pensioniert selbstständig selbständig fleißig faul
freundlich höflich lustig witzig interessant langweilig spannend wunderbar perfekt prima super klasse cool okay ok sympathisch intelligent klug stark schwach schlank blond dunkelhaarig sportlich
musikalisch kreativ zuverlässig pünktlich bereit fertig allein zusammen beschäftigt gestresst erkältet verletzt möglich nötig einfach schwierig sicher gefährlich bekannt beliebt berühmt international
arabisch türkisch kurdisch persisch russisch ukrainisch polnisch spanisch italienisch französisch englisch syrisch afghanisch indisch chinesisch vietnamesisch griechisch rumänisch marokkanisch
vegetarisch vegan scharf salzig sauer bitter mild fett mager roh gekocht gebraten gemischt natürlich künstlich elektrisch digital elektronisch kabellos schnurlos stabil robust leicht nass trocken
nächst letzt erst zweit dritt richtig falsch gleich anders verschieden offen geschlossen geöffnet verfügbar erreichbar erhältlich pünktlich direkt rechtzeitig kostenlos gratis umsonst reserviert besetzt
klar genau gerade normal besonder speziell typisch lokal regional bio frei herzlich schlimm schade doof dumm blöd nass nett elegant schick stilvoll gemütlich geräumig laktosefrei glutenfrei
zuckerfrei alkoholfrei zufrieden sonnig windig neugierig gespannt dankbar stolz verliebt komisch seltsam fremd neu best liebst still warm ungesund unfreundlich unzufrieden unglücklich unpünktlich
sechzehnjährig minderjährig erwachsen schwanger blind taub barfuß eng locker weit tief flach spitz stumpf scharf dreckig schmutzig staubig glatt rau schwanger nüchtern ausgeruht ausgeschlafen eingeladen willkommen belegt ausgezeichnet hervorragend fantastisch tatsächlich werktags nun zwar eventuell wochentags feiertags jedenfalls anschließend übrigens möglicherweise gewiss freilich immerhin sozusagen beid eigen blau-weiß schwarz-weiß tätig geeignet gefüllt gesalzen gesüßt gestrichen gebraucht`);
const COMPARED = new Map(Object.entries({ älter: 'alt', ältest: 'alt', jünger: 'jung', jüngst: 'jung', größer: 'groß', größt: 'groß', kleiner: 'klein', kleinst: 'klein', besser: 'gut', best: 'gut', schöner: 'schön', schönst: 'schön',
  neuer: 'neu', neuest: 'neu', schneller: 'schnell', billiger: 'billig', günstiger: 'günstig', teurer: 'teuer', früher: 'früh', später: 'spät', lieber: 'lieb', liebst: 'lieb', wärmer: 'warm', kälter: 'kalt', länger: 'lang', kürzer: 'kurz', kürzest: 'kurz' }).map(([k, v]) => [fold(k), fold(v)]));
const UNINFLECTED = wordSet('rosa lila pink orange beige türkis super prima klasse okay ok cool gratis bio');
export const COLOURS = wordSet('rot blau gelb grün schwarz weiß grau braun bunt orange rosa lila pink türkis violett beige gold golden silber silbern hellblau dunkelblau hellgrün dunkelgrün hellrot dunkelrot hellgrau dunkelgrau hellbraun dunkelbraun gestreift gepunktet kariert transparent durchsichtig');
/** An adjective as typed: its stem and its ending ('' undeclined), or null. */
export function adjectiveForm(w) {
  const f = fold(w);
  const out = [];
  if (ADJ.has(f) || COMPARED.has(f) || COLOURS.has(f)) out.push({ stem: f, ending: '' });
  for (const ending of ['er', 'en', 'em', 'es', 'e']) {
    if (!f.endsWith(ending) || f.length <= ending.length + 1) continue;
    const s = f.slice(0, -ending.length);
    for (const stem of [s, `${s}e`, s === 'teur' ? 'teuer' : s === 'dunkl' ? 'dunkel' : s === 'hoh' ? 'hoch' : s]) if ((ADJ.has(stem) || COMPARED.has(stem) || COLOURS.has(stem)) && !UNINFLECTED.has(stem) && !out.some((x) => x.ending === ending)) out.push({ stem, ending });
  }
  if (UNINFLECTED.has(f)) out.push({ stem: f, ending: '*' });
  return out;
}

// ——— Small words ———
// Adverbs and particles that may stand free in the middle field. What only opens a clause („deshalb“) is here too.
export const ADVERBS = wordSet(`auch noch schon nur jetzt heute morgen gestern übermorgen vorgestern bald gleich später dann danach zuerst zuletzt immer oft manchmal nie niemals meist meistens normalerweise gewöhnlich
selten häufig regelmäßig täglich wöchentlich morgens vormittags mittags nachmittags abends nachts montags dienstags mittwochs donnerstags freitags samstags sonntags wochentags hier da dort dahin dorthin hin her
draußen drinnen oben unten links rechts geradeaus hinten vorn vorne zuhause daheim überall irgendwo nirgends eigentlich leider natürlich vielleicht wahrscheinlich bestimmt sicher wirklich echt gern gerne lieber
sehr ganz ziemlich so etwas bisschen viel wenig mehr genug fast ungefähr circa etwa knapp genau endlich wieder mal einmal zweimal dreimal nochmal denn doch ja eben halt gerade nämlich übrigens zusammen allein
alleine selbst selber unterwegs früh spät lange schnell langsam gut besser sonst trotzdem deshalb deswegen außerdem dazu dafür damit davor daneben darauf darüber darum daran davon zurzeit momentan derzeit
ursprünglich beruflich privat telefonisch nicht bitte danke weg los fertig frei zufällig direkt besonders hauptsächlich überhaupt gar sofort noch einfach leise laut pünktlich herzlich kurz weit nah dabei zusätzlich
ebenfalls genauso ebenso jederzeit irgendwann normal online persönlich hoffentlich inzwischen mittlerweile jahrelang stundenlang abwechselnd rechtzeitig unbedingt kaum teilweise tatsächlich werktags nun zwar eventuell wochentags feiertags jedenfalls anschließend möglicherweise gewiss freilich immerhin ausgezeichnet hervorragend fantastisch vorher nachher vorhin neulich
extra wohl bloß lediglich super prima toll wunderbar perfekt schön okay richtig total voll wenigstens mindestens höchstens maximal erst zwischendurch nebenbei insgesamt ansonsten`);
// Degree words before an adjective or adverb.
export const DEGREE = wordSet('sehr ganz ziemlich zu so etwas echt wirklich richtig total besonders recht noch schon erst nur nicht auch gar sehr viel immer wunder super extrem fast leider einfach');
export const PARTICLE_LAST = wordSet('bitte danke gern gerne noch auch mal denn eigentlich');
export const DATIVE_PREP = wordSet('mit bei von zu aus nach seit ab außer gegenüber');
export const ACCUSATIVE_PREP = wordSet('für ohne gegen durch um bis');
export const TWO_WAY_PREP = wordSet('in an auf unter über vor hinter neben zwischen');
// Contractions: preposition, genders and case.
export const CONTRACTED = { zum: ['zu', 'd', ['der', 'das']], zur: ['zu', 'd', ['die']], im: ['in', 'd', ['der', 'das']], am: ['an', 'd', ['der', 'das']], ins: ['in', 'a', ['das']], ans: ['an', 'a', ['das']], beim: ['bei', 'd', ['der', 'das']], vom: ['von', 'd', ['der', 'das']], aufs: ['auf', 'a', ['das']], fürs: ['für', 'a', ['das']], übers: ['über', 'a', ['das']] };

// ——— Determiners and pronouns: gender-case readings ———
const READ = (s) => words(s).map((x) => ({ g: { m: 'der', f: 'die', n: 'das', p: 'pl' }[x[0]], c: x[1] }));
const DEF = { der: 'mn fd fg pg', die: 'fn fa pn pa', das: 'nn na', den: 'ma pd', dem: 'md nd', des: 'mg ng' };
const EIN_END = { '': 'mn nn na', e: 'fn fa', en: 'ma', em: 'md nd', er: 'fd fg', es: 'mg ng' };
const POSS_END = { '': 'mn nn na', e: 'fn fa pn pa', en: 'ma pd', em: 'md nd', er: 'fd fg pg', es: 'mg ng' };
const DIES_END = { er: 'mn fd fg pg', e: 'fn fa pn pa', es: 'nn na', en: 'ma pd mg ng', em: 'md nd' };
/** A determiner: its readings (gender, case) and how it makes the adjective after it decline. */
export function determinerOf(w) {
  const f = fold(w);
  if (DEF[f]) return { kind: 'def', stem: 'der', readings: READ(DEF[f]), weak: true };
  let m = f.match(/^ein(e|en|em|er|es)?$/);
  if (m) return { kind: 'ein', stem: 'ein', readings: READ(EIN_END[m[1] || '']), mixed: true };
  m = f.match(/^(kein|mein|dein|sein|ihr|unser|euer|eur|unsr)(e|en|em|er|es)?$/);
  if (m && !(m[1] === 'eur' && !m[2])) return { kind: m[1] === 'kein' ? 'kein' : 'poss', stem: m[1], readings: READ(POSS_END[m[2] || '']), mixed: true };
  m = f.match(/^(dies|jed|welch|jen|manch|all)(er|e|es|en|em)$/);
  if (m) return { kind: 'dies', stem: m[1], readings: READ(DIES_END[m[2]]).filter((r) => m[1] !== 'jed' || r.g !== 'pl').filter((r) => m[1] !== 'all' || r.g === 'pl' || true), weak: true };
  m = f.match(/^(viel|wenig|einig|mehrer|beid|ander|verschieden)(e|en|er)$/);
  if (m) return { kind: 'many', stem: m[1], readings: READ(m[2] === 'e' ? 'pn pa' : m[2] === 'en' ? 'pd' : 'pg'), strong: true };
  return null;
}
/** The ending an adjective has in a slot after this determiner (null: no determiner). */
export function adjectiveEnding(det, g, c) {
  if (det?.weak) return c === 'n' ? (g === 'pl' ? 'en' : 'e') : c === 'a' ? (g === 'der' || g === 'pl' ? 'en' : 'e') : 'en';
  if (det?.mixed) return c === 'n' ? { der: 'er', die: 'e', das: 'es', pl: 'en' }[g] : c === 'a' ? { der: 'en', die: 'e', das: 'es', pl: 'en' }[g] : 'en';
  const strong = { n: { der: 'er', die: 'e', das: 'es', pl: 'e' }, a: { der: 'en', die: 'e', das: 'es', pl: 'e' }, d: { der: 'em', die: 'er', das: 'em', pl: 'en' }, g: { der: 'en', die: 'er', das: 'en', pl: 'er' } };
  return strong[c][g];
}
// Pronouns: case(s), person and number (what the verb agrees with).
export const PRONOUNS = {
  ich: [['n'], 'ich'], du: [['n'], 'du'], er: [['n'], 'er'], es: [['n', 'a'], 'er'], wir: [['n'], 'wir'], man: [['n'], 'er'],
  sie: [['n', 'a'], 'er|sie'], ihr: [['n', 'd'], 'ihr'], mich: [['a'], null], dich: [['a'], null], ihn: [['a'], null], uns: [['a', 'd'], null], euch: [['a', 'd'], null],
  mir: [['d'], null], dir: [['d'], null], ihm: [['d'], null], ihnen: [['d'], null], sich: [['a', 'd'], null],
  das: [['n', 'a'], 'er|sie'], der: [['n'], 'er'], die: [['n', 'a'], 'er|sie'], den: [['a'], null], dem: [['d'], null], dies: [['n', 'a'], 'er'],
  beides: [['n', 'a'], 'er'], jemand: [['n', 'a'], 'er'], niemand: [['n', 'a'], 'er'], alle: [['n', 'a'], 'sie'], alles: [['n', 'a'], 'er'], etwas: [['n', 'a'], 'er'], nichts: [['n', 'a'], 'er'], viele: [['n', 'a'], 'sie'], beide: [['n', 'a'], 'sie'], welche: [['n', 'a'], 'er|sie'],
  meins: [['n', 'a'], 'er'], deins: [['n', 'a'], 'er'], meiner: [['n'], 'er'], deiner: [['n'], 'er'], meine: [['n', 'a'], 'er|sie'], deine: [['n', 'a'], 'er|sie'], deinen: [['a'], null], eins: [['n', 'a'], 'er'], einen: [['a'], null], keinen: [['a'], null], keine: [['n', 'a'], 'er|sie'], keins: [['n', 'a'], 'er'], eine: [['n', 'a'], 'er'],
};
export const W_WORDS = wordSet('wer was wann wo woher wohin wie warum welche welcher welches welchen welchem wen wem wozu womit weshalb wieso wessen worüber wofür');
export const SUBORDINATORS = wordSet('weil dass ob wenn als damit bevor nachdem obwohl während da');
export const COORDINATORS = wordSet('und oder aber denn sondern');
export const NUMBER_WORDS = ['null', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
export const DAYS = words('montag dienstag mittwoch donnerstag freitag samstag sonnabend sonntag');
export const DAY_PARTS = words('morgen vormittag mittag nachmittag abend nacht');
export const MONTHS = words('januar jänner februar märz april mai juni juli august september oktober november dezember');
export const SEASONS = words('frühling frühjahr sommer herbst winter');

/** Weak nouns in the accusative and the dative: „meinen Kollegen“, „mit dem Nachbarn“. */
export const WEAK_NOUNS = { nachbarn: 'nachbar', kollegen: 'kollege', studenten: 'student', kunden: 'kunde', jungen: 'junge', menschen: 'mensch', herrn: 'herr', neffen: 'neffe', patienten: 'patient', polizisten: 'polizist', namen: 'name' };
