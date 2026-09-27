// Präteritum stems of the German strong, mixed and modal verbs (morphology data, not vocabulary).
//
// SCHEMA §6 makes `verb_forms.praet` optional, and most lexicon entries omit it; without it the
// validator can only generate a regular weak Präteritum („fangte"), so „fing … an" in a B1 text read
// as an unknown word. This table fills the gap for an entry WITHOUT `praet`: the entry's own base (its
// separable prefix already split off) is matched against the longest key it ends with, and the part in
// front is kept — verstehen → ver + stand, bekommen → be + kam, anfangen → (an) fangen → fing.
// A weak verb that happens to end in a strong simplex (beantragen) gains a non-word („beantrug"), which
// can never make a real token known. Keys shorter than five letters match only exactly. An entry's own
// `praet` always wins.

export const STRONG_PRAET = Object.freeze(Object.fromEntries(`
beginnen begann · beißen biss · bieten bot · binden band · bitten bat · blasen blies · bleiben blieb · braten briet
brechen brach · brennen brannte · bringen brachte · denken dachte · dringen drang · empfehlen empfahl · befehlen befahl
essen aß · fahren fuhr · fallen fiel · fangen fing · finden fand · fliegen flog · fliehen floh · fließen floss
fressen fraß · frieren fror · geben gab · gehen ging · gelingen gelang · gelten galt · genießen genoss
geschehen geschah · gewinnen gewann · gießen goss · gleichen glich · gleiten glitt · graben grub · greifen griff
haben hatte · halten hielt · hängen hing · heben hob · heißen hieß · helfen half · kennen kannte · klingen klang
kommen kam · kriechen kroch · laden lud · lassen ließ · laufen lief · leiden litt · leihen lieh · lesen las
liegen lag · lügen log · meiden mied · messen maß · nehmen nahm · nennen nannte · pfeifen pfiff · raten riet
reiben rieb · reißen riss · reiten ritt · rennen rannte · riechen roch · rufen rief · scheiden schied
scheinen schien · schieben schob · schießen schoss · schlafen schlief · schlagen schlug · schleichen schlich
schließen schloss · schmelzen schmolz · schneiden schnitt · schreiben schrieb · schreien schrie · schweigen schwieg
schwimmen schwamm · sehen sah · sein war · singen sang · sinken sank · sitzen saß · sprechen sprach · springen sprang
stechen stach · stehen stand · stehlen stahl · steigen stieg · sterben starb · stinken stank · stoßen stieß
streichen strich · streiten stritt · tragen trug · treffen traf · treiben trieb · treten trat · trinken trank
tun tat · verderben verdarb · vergessen vergaß · verlieren verlor · verzeihen verzieh · wachsen wuchs · waschen wusch
weisen wies · werben warb · werden wurde · werfen warf · wiegen wog · wissen wusste · ziehen zog · zwingen zwang
biegen bog · dürfen durfte · können konnte · mögen mochte · müssen musste · sollen sollte · wollen wollte
`.split('·').map((s) => s.trim().split(/\s+/)).filter((p) => p.length === 2)));

const KEYS = Object.keys(STRONG_PRAET).sort((a, b) => b.length - a.length);

/** The Präteritum (1/3sg) of a verb base without its separable prefix, or null when it is not strong. */
export function strongPraet(base) {
  const b = String(base || '').toLowerCase();
  if (!b || /ieren$/.test(b)) return null;
  if (STRONG_PRAET[b]) return STRONG_PRAET[b];
  const key = KEYS.find((k) => k.length >= 5 && b.length > k.length && b.endsWith(k));
  return key ? `${b.slice(0, b.length - key.length)}${STRONG_PRAET[key]}` : null;
}
