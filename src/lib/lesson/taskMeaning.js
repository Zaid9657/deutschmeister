// What a read answer says, against what the turn asks (loop round 3, 2026-11-25). `clause.js` has read every word of the answer
// as German; here each turn of a final check says which sentence answers it: a price is asked with „kosten“, „teuer“ or „für … möchten“,
// an origin told with „aus“, a date given after „Geburtstag“. What the turn asks is read off its own accepted answers, so a new Lektion
// needs no entry. The result: 'yes' the answer says it; 'task' it is read in full and says something else the course teaches; 'word'
// the thing named is another one; 'pronoun', 'address' a fault between its sentences or of its form of address; null undecided.
import { COLOURS, DAYS, determinerOf, fold, verbReadings } from './germanForms.js';

const set = (s) => new Set(s.trim().split(/\s+/).map(fold));
const FAMILY = set('mutter vater mama papa mutti vati eltern bruder schwester sohn tochter kind kinder mann frau oma opa großmutter großvater onkel tante cousin cousine neffe nichte baby geschwister');
const SAME_PERSON = { mutter: ['mama', 'mutti', 'mami'], vater: ['papa', 'vati', 'papi'], schwester: ['zwillingsschwester', 'halbschwester'], bruder: ['zwillingsbruder', 'halbbruder'] };
const SAME_THING = { fahrkarte: ['ticket', 'fahrschein', 'karte', 'fahrt', 'fahrpreis', 'zugticket', 'zugfahrkarte', 'bahnticket', 'fahrticket', 'rückfahrkarte', 'reise', 'preis'], ticket: ['fahrkarte'], pause: ['mittagspause'], büro: ['arbeitszimmer', 'arbeitsplatz', 'raum', 'zimmer', 'arbeitsraum'], geburtstag: ['geburtstagsfeier', 'geburtstagsparty'] };
const FEEL = set('müde krank gesund fit wach glücklich zufrieden traurig nervös froh gestresst erkältet ruhig okay ok hungrig durstig aufgeregt gespannt neugierig ausgeruht ausgeschlafen dankbar stolz fröhlich entspannt');
const FEST = set('party fest feier geburtstag geburtstagsparty geburtstagsfest geburtstagsfeier gartenparty grillparty grillfest gartenfest geburtstagsessen');
const JOB_WORDS = set('beruf job berufsbezeichnung tätigkeit arbeit');
const PERSONS = /^(?:ich|du|er|sie|wir|ihr|man|alle|viele|beide|niemand|jemand)$/u;
const frameText = (a) => (typeof a === 'string' ? a : a?.frame || '');

/** What the turn asks: { kind, … }, read off its accepted answers; null where no sentence answers it (a greeting, a goodbye). */
export const requiresVerbFirst = turn => /Ja\s*\/\s*Nein[-– ]*Frage|(?:das )?Verb (?:steht vorn|auf Position 1)/iu.test(turn?.taskDe || '');
// A positive naming condition must be visible in the task, in either interface language.
export const requiresNamedThing = (turn) => /Nennen Sie (?:mindestens )?(?:etwas|eine|einen|ein)|Name (?:at least )?one thing/iu.test(`${turn.taskDe || ''} ${turn.taskEn || ''}`);
const kinds = new WeakMap();
export function asked(turn) {
  if (!kinds.has(turn)) {
    const q = findKind(turn);
    const task = turn.taskDe || '';
    const journey = q && (q.train || q.kind === 'askPrice');
    kinds.set(turn, q && { ...q, allowNothing: !requiresNamedThing(turn), verbFirst: requiresVerbFirst(turn), mine: /(?<!\p{L})Ihr(?:e|en|em|er)?\s+\p{Lu}/u.test(task), to: journey ? (turn.only || []).map(fold) : [], withHave: /mit „Ich habe/u.test(task), byPronoun: (turn.accepted || []).map(frameText).some((f) => /(?<!\p{L})(?:er|sie|es|der|die|das)(?:\s+ab)?\?$/u.test(f) && !/,|\?.+\?/u.test(f) && !(q.things || []).some((t) => fold(f).includes(t))) });
  }
  return kinds.get(turn);
}
function findKind(turn) {
  if (turn.spell || turn.listen) return null;
  if (turn.parts) return { kind: 'message' };
  if (turn.ownName) return { kind: 'name' };
  const frames = (turn.accepted || []).map(frameText);
  const a = frames[0] || '';
  if (/^Guten Tag!/.test(a)) return { kind: 'greet' };
  if (/^(?:Auf Wiedersehen|Mach[’']s gut)/.test(a)) return { kind: 'bye', when: turn.when };
  if (/^Schönen Tag/.test(a)) return { kind: 'wishDay' };
  const all = frames.join(' | ');
  const nouns = (re) => frames.map((f) => f.match(re)?.[1]).filter(Boolean).map(fold);
  if (/^Mir geht es/.test(a)) return { kind: 'mood' };
  if (/wie geht es (?:Ihnen|dir)/i.test(a)) return { kind: 'askMood' };
  if (/^Ich komme aus/.test(a)) return { kind: 'origin' };
  if (/^(?:Sie|Er) kommt aus/.test(a)) return { kind: 'origin', third: fold(a.split(' ')[0]), people: peopleOf(turn) };
  if (/^Ich wohne in/.test(a)) return { kind: 'live' };
  if (/von Beruf\?|beruflich\?/.test(all) && /\?/.test(a)) return { kind: 'askJob' };
  if (turn.slot === 'job') return { kind: 'job' };
  if (turn.slot === 'date' && /geboren|Geburtsdatum/u.test(all)) return { kind: 'birth' };
  if (turn.slot === 'phone') return { kind: 'phone' };
  if (/^Das ist mein/.test(a) && turn.slotIn) return { kind: 'photo', people: turn.slotIn.map(fold) };
  if (/^(?:Sie|Er) ist (?:jung|alt)/.test(a)) return { kind: 'age', third: fold(a.split(' ')[0]), people: peopleOf(turn) };
  if (turn.slot === 'language') return { kind: 'language', third: /^(?:Sie|Er) /.test(a) ? fold(a.split(' ')[0]) : null, people: peopleOf(turn) };
  if (/^Woher kommen/.test(a)) return { kind: 'askOrigin', things: ['eltern', 'vater', 'mutter'] };
  if (/^Was ist das\?/.test(a)) return { kind: 'askWhat' };
  if (/^(?:Was|Wie viel) kostet/.test(a)) return { kind: 'askPrice', things: thingsOf(nouns(/kostet (?:der|die|das|eine?) (\p{Lu}\p{L}+)/u)), main: [...new Set(nouns(/kostet (?:der|die|das|eine?) (\p{Lu}\p{L}+)/u))] };
  if (/^Ich kaufe/.test(a)) return { kind: 'buy', allowNothing: /whether.*buy|buy.*anything|ob.*kaufen/iu.test(`${turn.taskEn || ''} ${turn.taskDe || ''}`) };
  if (turn.slot === 'object' && /^Das ist …/.test(a)) return { kind: 'thing' };
  if (/^(?:Es|Er|Sie) (?:ist|sind) (?:hier|da)/.test(a)) return { kind: 'here', things: thingsOf(Object.values(turn.nounFor || {}).flat().map((n) => fold(n.split(' ').at(-1)))) };
  if (/^Wo ist/.test(a)) return { kind: 'askPlace', things: thingsOf(nouns(/^Wo ist (?:mein|meine|der|die|das) (\p{Lu}\p{L}+)/u)) };
  if (/^Welche Farbe hat/.test(a)) return { kind: 'askColour', things: thingsOf(nouns(/hat (?:deine?|der|die|das) (\p{Lu}\p{L}+)/u)) };
  if (turn.slot === 'color') return { kind: 'colour', things: thingsOf(Object.values(turn.nounFor || {}).flat().map((n) => fold(n.split(' ').at(-1)))) };
  if (/^Ich brauche/.test(a)) return { kind: 'need' };
  if (/^Wann ist (?:die|der|das|dein|deine) /.test(a)) return { kind: 'askWhen', things: thingsOf(nouns(/(?:ist|beginnt) (?:die|der|das|dein|deine|meine) (\p{Lu}\p{L}+)/u)) };
  if (/^Wann fährt/.test(a)) return { kind: 'askWhen', things: ['zug', 'abfahrt', 'bahn', 'ice'], main: ['zug'], train: true };
  if (turn.slot === 'name') return { kind: 'name' };
  if (turn.slot === 'hobby' || (turn.slot === 'activity' && turn.freeTime)) return { kind: 'hobby' };
  if (turn.slot === 'activity') return { kind: 'routine' };
  if (/Hobby\?/.test(a)) return { kind: 'askHobby' };
  const like = a.match(/^(\p{Lu}\p{L}+) du gern\?/u);
  if (like) return { kind: 'askLike', verb: fold(like[1]) };
  if (turn.slot === 'clock' && turn.time) return { kind: 'clock', time: turn.time };
  if (/^Wie spät/.test(a)) return { kind: 'askClock' };
  if (/stehe um …|stehe ich/.test(a)) return { kind: 'getUp', byClock: /Uhr/.test(turn.taskDe || '') };
  if (/^Hast du … Zeit/.test(a)) return { kind: 'askFree', when: turn.when };
  if (turn.answerWords && /Das passt/.test(all)) return { kind: 'agree', when: turn.when };
  if (/Hunger|Durst/.test(a)) return { kind: 'hungry', wants: ['hunger', 'durst'].filter((w) => fold(a).includes(w)) };
  if (turn.thingKind && /^Ich möchte/.test(a)) return { kind: 'order', things: turn.thingKind };
  if (/^Haben Sie/.test(a)) return { kind: 'askHave', things: nouns(/^Haben Sie (?:auch )?(\p{Lu}\p{L}+)/u) };
  if (/^Ja, gern/.test(a) && turn.only) return { kind: 'accept', things: turn.only.map(fold) };
  if (/^Nein, danke/.test(a)) return { kind: 'decline' };
  if (/^Ich fahre nach/.test(a)) return { kind: 'travel' };
  const train = a.match(/^Fährt der Zug nach (\p{Lu}\p{L}+)/u);
  if (train) return { kind: 'askTrain', place: fold(train[1]) };
  if (/^Ich habe gearbeitet/.test(a)) return { kind: 'did' };
  if (/^Was hast du gestern gemacht/.test(a)) return { kind: 'askDid' };
  if (/^Ich arbeite/.test(a) && turn.slot === 'when') return { kind: 'workWhen' };
  if (turn.slot === 'when' && /frei|Zeit/.test(a) && !/\?/.test(a)) return { kind: 'freeTime' };
  if (/^Kaufst du/.test(a)) return { kind: 'askShop', when: turn.when };
  if (/ich komme mit|Ich komme mit/.test(a)) return { kind: 'join', when: turn.when };
  if (turn.slot === 'invite') return { kind: 'invite', when: turn.when };
  if (turn.slot === 'month') return { kind: 'birthday' };
  if (turn.people) return { kind: 'guests' };
  if (/Ich wünsche mir/.test(all)) return { kind: 'wish' };
  return null;
}
const peopleOf = (turn) => Object.values(turn.nounFor || {}).flat().map((n) => fold(n.split(' ').at(-1)));
/** The person the turn talks of: its pronoun, or one of its nouns. */
const third = (c, q) => c.subj && (c.subj.head === q.third || headsOf(c.subj).some((h) => (q.people || []).includes(h) || (q.people || []).some((p) => (SAME_PERSON[p] || []).includes(h)))) && !c.reading?.persons?.includes('wir');
function thingsOf(list) {
  const out = new Set(list);
  for (const n of list) for (const x of SAME_THING[n] || []) out.add(x);
  return [...out];
}

// ——— Looking into a clause ———
const el = (c, kind) => (c.elems || []).filter((e) => e.kind === kind);
const adv = (c, ...w) => el(c, 'adv').some((e) => w.includes(e.word));
const pps = (c, ...p) => (c.elems || []).filter((e) => e.kind === 'pp' && (!p.length || p.includes(e.prep)));
const own = (c, ...p) => pps(c, ...p).filter((e) => !e.attr);
const timesOf = (c) => el(c, 'time');
const headsOf = (n) => (n ? n.heads || [n.head] : []);
const adjs = (c) => (c.adj || []).flatMap((a) => a.words);
const negated = (c) => (c.elems || []).some((e, i) => e.neg || (e.kind === 'adv' && !(e.word === 'nicht' && c.elems[i + 1]?.word === 'nur') && ['nicht', 'nie', 'niemals', 'keineswegs', 'keinesfalls', 'noch nicht', 'nicht mehr', 'gar nicht'].includes(e.word)) || e.head === 'nichts' || e.head === 'niemand' || (e.kind === 'adj' && e.degree?.includes('nicht')));
const I = (c) => c.subj?.head === 'ich' || headsOf(c.subj).includes('ich') || c.subj?.head === 'wir';
// Saying one has no paid work: retired, a pupil or student, at home, out of work. A meaning, not a list of answers:
// each status is a reading of the clause (sein + status, „in Rente“, „zur Schule gehen“, „studieren“, „arbeiten“ negated, „keine Arbeit“).
const STATUS_NOUNS = /^(?:rentner(?:in)?|pensionär(?:in)?|student(?:in)?|schüler(?:in)?|hausmann|hausfrau)$/u;
const STATUS_ADJS = ['arbeitslos', 'pensioniert'];
function notWorking(c) {
  if (!I(c) || c.question || c.modal || c.perfect) return false;
  if (c.lemma === 'sein' && !negated(c) && ((c.pred && headsOf(c.pred).some((h) => STATUS_NOUNS.test(h))) || STATUS_ADJS.some((a) => adjs(c).includes(a)) || pps(c, 'in').some((p) => p.np.head === 'rente'))) return true;
  if (c.lemma === 'gehen' && !negated(c) && [...pps(c, 'zu'), ...pps(c, 'zur')].some((p) => ['schule', 'uni', 'universität'].includes(p.np.head))) return true;
  if (c.lemma === 'studieren' && !negated(c)) return true;
  if (c.lemma === 'arbeiten' && negated(c) && !pps(c).length) return true;
  return c.lemma === 'haben' && c.acc?.det === 'kein' && ['arbeit', 'job'].includes(c.acc.head);
}
const you = (c) => c.subj?.head === 'du' || (c.subj?.head === 'sie' && c.subj.formal) || c.subj?.head === 'ihr' || (c.subj?.head === 'sie' && c.question);
const wh = (c) => c.wh?.word || null;
const whNoun = (c) => (c.wh?.np && c.wh.np.kind === 'np' ? c.wh.np.head : null);
const unknownNoun = (n) => Boolean(n && (n.kind === 'own' || (n.unknown || []).length));
const clockOf = (e) => (e.h === undefined ? null : (e.h % 12) * 60 + (e.m || 0));
const whenWanted = (when) => { const [d, t] = String(when || '').split(' '); const [h, m] = (t || '').split(':').map(Number); return { day: DAYS.includes(d) ? d : null, clock: t ? (h % 12) * 60 + (m || 0) : null, half: t ? (h >= 12 ? 'pm' : 'am') : null }; };
const PM = new Set(['nachmittag', 'abend', 'nacht']);
/** The times of some clauses against a wanted day and time: 'full', 'part' (nothing else said), 'none' or 'other'. */
function whenFits(clauses, when) {
  const want = whenWanted(when);
  let day = false;
  let clock = false;
  for (const c of clauses) for (const e of timesOf(c)) {
    if (e.day) { if (e.day !== want.day) return 'other'; day = true; }
    if (e.rel && ['morgen', 'übermorgen', 'gestern'].includes(e.rel)) return 'other';
    const k = clockOf(e);
    if (k !== null && want.clock !== null) {
      if (k !== want.clock) return 'other';
      if (e.part && want.half === 'am' && PM.has(e.part)) return 'other';
      if (e.part && want.half === 'pm' && ['morgen', 'vormittag'].includes(e.part)) return 'other';
      if (e.h >= 13 && want.half === 'am') return 'other';
      clock = true;
    }
  }
  if ((!want.day || day) && (want.clock === null || clock)) return 'full';
  return day || clock ? 'part' : 'none';
}

const GENDER_PRONOUN = { der: ['er', 'der', 'den', 'ihn', 'dieser', 'das'], die: ['sie', 'die', 'diese', 'das'], das: ['es', 'das', 'dieses'], pl: ['sie', 'die', 'das'] };
/** Is the noun phrase the turn's thing: its noun, or a pronoun of its gender? */
function isThing(n, q, env) {
  if (!n) return false;
  if (headsOf(n).some((h) => (q.things || []).some((t) => h === t || (t.length > 3 && h.endsWith(t)))) || (n.of && (q.things || []).some((t) => [t, `${t}s`, `${t}es`].includes(n.of)))) return true;
  if (n.kind === 'pron' && QUESTION_KINDS.includes(q.kind) && !q.byPronoun && !env.mentioned) return false;
  if (n.kind === 'pron') return env.thingGenders.some((g) => (GENDER_PRONOUN[g] || []).includes(n.head));
  return false;
}

/** „Wo ist die Schere?“ – „Die ist hier.“: „das“ picks up only a das-word. */
const picksUp = (n, env) => !(n.kind === 'pron' && n.head === 'das') || env.thingGenders.includes('das');
/** The sitting's journey goes to one place: a question about another one is another question. */
const elsewhereTo = (c, q) => Boolean(q.to?.length) && pps(c, 'nach').some((p) => !q.to.includes(p.np.head) && p.np.kind !== 'time');

// ——— Which clause answers which turn ———
/** A person of the course is no place, and a day, a number or a dish is none either. */
const NOT_WHERE = ['food', 'drink', 'day', 'family', 'number', 'furniture', 'function', 'color', 'colour'];
const nowhere = (p, env) => env.cast(p.np.head) || ['num', 'time'].includes(p.np.kind) || NOT_WHERE.includes(env.kindOf(p.np.head));
const COST = (c, q, env) => {
  const w = wh(c);
  if (timesOf(c).some((t) => t.h !== undefined) || pps(c, 'nach').some((p) => nowhere(p, env))) return false;
  // What is for sale is not mine; the ticket the task calls „Ihre Fahrkarte“ is.
  const thing = (n) => isThing(n, q, env) && (n.det !== 'mein' || q.mine || q.kind !== 'askPrice');
  const forThing = pps(c, 'für').some((p) => thing(p.np) || headsOf(p.np).some((h) => q.things.includes(h)));
  if (c.lemma === 'kosten' && (w === 'was' || w === 'wie viel') && thing(c.subj)) return true;
  if (c.lemma === 'sein' && (w === 'wie teuer' || w === 'wie hoch' || (w === 'wie' && c.subj?.head === 'preis')) && (thing(c.subj) || c.subj?.head === 'preis')) return true;
  if (whNoun(c) === 'preis' && c.lemma === 'haben' && thing(c.subj)) return true;
  if (c.lemma === 'sein' && w === 'was' && ['preis', 'fahrpreis'].includes(c.subj?.head)) return true;
  if ((w === 'was' || w === 'wie viel') && ['möchten', 'wollen', 'verlangen', 'bekommen', 'haben', 'nehmen', 'kriegen'].includes(c.lemma) && forThing && (you(c) || I(c) || c.subj?.head === 'man')) return true;
  if ((w === 'was' || w === 'wie viel') && ['bezahlen', 'zahlen'].includes(c.lemma) && (forThing || thing(c.acc) || (I(c) && (c.acc?.wh || (w === 'wie viel' && !c.acc)) && !pps(c, 'für').length))) return true;
  if (['sagen', 'nennen', 'geben'].includes(c.lemma) && ['preis', 'fahrpreis'].includes(c.acc?.head)) return true;
  return Boolean(w === 'was' && c.lemma === 'machen' && c.subj?.head === 'das');
};
/** „… Du auch?“ after a statement asks it back. */
const askedBack = (c) => (c.all || []).some((x) => x.frag && x.stop === '?' && x.elems[0]?.head === 'du');
const ASKING = {
  askPrice: COST,
  askMood: (c) => (c.question && !c.wh && c.lemma === 'sein' && c.subj?.head === 'alles' && pps(c, 'bei').some((p) => ['ihnen', 'dir'].includes(p.np.head)) && (adv(c, 'gut', 'okay', 'in ordnung') || adjs(c).includes('gut'))) || (c.question || Boolean(c.sub)) && (c.lemma === 'gehen' && c.subj?.head === 'es' && ['ihnen', 'dir'].includes(c.dat?.head) && !pps(c, 'mit').length && ((wh(c) === 'wie') !== (adv(c, 'gut') || adjs(c).includes('gut')))) || (c.lemma === 'fühlen' && wh(c) === 'wie'),
  askJob: (c) => (you(c) && wh(c) === 'was' && pps(c, 'für').some((p) => JOB_WORDS.has(p.np.head))) || you(c) && ((wh(c) === 'was' && ((c.lemma === 'sein' && pps(c, 'von').some((p) => p.np.head === 'beruf')) || adv(c, 'von beruf') || (['machen', 'arbeiten', 'tun'].includes(c.lemma) && (adv(c, 'beruflich') || c.lemma === 'arbeiten' || pps(c, 'als', 'von').length)))) || (whNoun(c) === 'beruf') || (wh(c) === 'als was' && (c.lemma === 'arbeiten' || adjs(c).includes('tätig'))))
    || (['was', 'wie'].includes(wh(c)) && c.lemma === 'sein' && [c.subj, c.pred].some((n) => n && JOB_WORDS.has(n.head) && !n.bare)) || (wh(c) === 'wie' && c.lemma === 'lauten' && JOB_WORDS.has(c.subj?.head)) || (c.question && !c.wh && you(c) && (c.pred?.job || pps(c, 'als').length > 0)),
  askOrigin: (c, q, env) => ((wh(c) === 'woher' && ['kommen', 'sein', 'stammen'].includes(c.lemma)) || (wh(c) === 'aus welch' && c.wh.np.head === 'land' && ['kommen', 'stammen', 'sein'].includes(c.lemma))) && isThing(c.subj, q, env) && !headsOf(c.subj).includes('du') && (c.subj.kind === 'pron' || ['dein', 'der'].includes(c.subj.det) || c.subj.list),
  askWhat: (c) => c.reading?.persons?.includes('er') && ((wh(c) === 'wie' && c.lemma === 'heißen' && c.subj?.kind === 'np' && (c.subj.det === 'dies' || ['gegenstand', 'ding', 'teil'].includes(c.subj.head))) || (wh(c) === 'was' && c.lemma === 'sein' && (c.subj?.head === 'das' || c.pred?.head === 'das' || c.subj?.head === 'dies')) || (wh(c) === 'wie' && c.lemma === 'heißen' && ['das', 'dies'].includes(c.subj?.head)) || (wh(c) === 'was für' && c.lemma === 'sein')),
  askPlace: (c, q, env) => {
    const w = wh(c);
    const mine = (n) => isThing(n, q, env) && !notMine(n);
    if (w === 'wo' && ['sein', 'liegen', 'stehen', 'befinden', 'stecken', 'bleiben'].includes(c.lemma) && mine(c.subj)) return true;
    if (w === 'wo' && ['finden', 'hinlegen', 'haben', 'hinstellen', 'legen', 'verlieren', 'lassen'].includes(c.lemma) && mine(c.acc)) return true;
    if (w === 'in welch' && c.lemma === 'sein' && mine(c.subj)) return true;
    if (whNoun(c) && ['raum', 'zimmer', 'büro'].includes(whNoun(c)) && c.lemma === 'sein') return true;
    return Boolean(!c.wh && c.question && c.lemma === 'sehen' && c.perfect && mine(c.acc));
  },
  askColour: (c, q, env) => {
    const yours = (n) => isThing(n, q, env) && !['mein', 'sein'].includes(n.det);
    if (whNoun(c) === 'farbe' && c.lemma === 'haben') return yours(c.subj) || (c.subj?.head === 'farbe' && yours(c.acc) && c.acc.combos.some((x) => x.c === 'n')) || (['deine', 'deiner', 'deins'].includes(c.subj?.head) && (env.mentioned || (c.all || []).some((x) => x !== c && !x.question)));
    if (c.wh?.prep === 'in' && c.wh.np?.head === 'farbe' && yours(c.subj)) return true;
    if (wh(c) === 'wie' && c.lemma === 'sein' && c.subj?.head === 'farbe') return true;
    return Boolean(c.question && !c.wh && c.lemma === 'sein' && yours(c.subj) && adjs(c).some((a) => COLOURS.has(a)));
  },
  askWhen: (c, q, env) => {
    const w = wh(c);
    if (q.train && (elsewhereTo(c, q) || timesOf(c).some((t) => t.h !== undefined) || pps(c, 'ab').some((p) => p.np.kind === 'np') || (c.acc && !c.acc.wh && c.subj && !['sagen', 'nennen', 'geben', 'wissen'].includes(c.lemma) && !c.modal))) return false;
    if (q.train && c.question && ['sagen', 'nennen'].includes(c.lemma) && ['abfahrtszeit', 'abfahrt', 'uhrzeit'].includes(c.acc?.head)) return true;
    const when = ['wann', 'um wie viel uhr', 'zu welch', 'ab wann', 'wie spät', 'an welch', 'in welch', 'auf welch'].includes(w);
    if (w === 'was' && c.lemma === 'sein' && c.subj?.head === 'geburtsdatum' && q.things.includes('geburtstag')) return true;
    if (!when) return false;
    if (w === 'in welch' && !['monat', 'jahr', 'woche', 'jahreszeit'].includes(c.wh.np?.head)) return false;
    if (w === 'an welch' && !['tag', 'datum', 'wochentag'].includes(c.wh.np?.head)) return false;
    if (w === 'zu welch' && c.wh.np?.head !== 'uhrzeit' && c.wh.np?.head !== 'zeit') return false;
    const mine = (n) => isThing(n, q, env) && !(q.things.includes('geburtstag') && (['mein', 'sein', 'unser'].includes(n.det) || (n.det === 'ihr' && !n.formalDet)));
    if (q.train && ['sagen', 'nennen'].includes(c.lemma)) return false;
    if (q.train) return (['fahren', 'abfahren', 'losfahren', 'gehen', 'starten', 'kommen', 'sein', 'abgehen'].includes(c.lemma)) && (mine(c.subj) || ['er', 'der'].includes(c.subj?.head)) && !['ankommen'].includes(c.lemma);
    if (mine(c.subj) && ['sein', 'beginnen', 'anfangen', 'haben', 'fallen', 'kommen', 'stattfinden'].includes(c.lemma)) return true;
    return Boolean(mine(c.acc) && ['haben', 'machen', 'feiern'].includes(c.lemma) && (q.things.includes('geburtstag') ? c.subj?.head === 'du' : c.subj?.head !== 'ich' || c.modal) || (q.things.includes('geburtstag') && c.lemma === 'geboren'));
  },
  askHobby: (c) => {
    const hobby = (n) => headsOf(n).some((h) => ['hobby', 'hobbys', 'freizeitbeschäftigung'].includes(h)) && (n.det === 'dein' || c.subj?.head === 'du' || (n.det !== 'mein' && n.det !== 'sein' && n.det !== 'ihr' && !n.bare));
    if (wh(c) === 'was' && c.lemma === 'haben' && c.subj?.head === 'du' && pps(c, 'für').some((p) => hobby(p.np))) return true;
    // „Was ist ein Hobby?“ asks for the word; „Wie heißt dein Hobby?“ is no German.
    if ((c.lemma === 'sein' && [c.subj, c.pred].some((n) => hobby(n) && n.det === 'ein')) || c.lemma === 'heißen') return false;
    if (c.question && (hobby(c.subj) || hobby(c.pred) || hobby(c.acc) || hobby(c.wh?.np))) return !(c.lemma === 'sein' && !['was', 'wie', 'welch', 'was für'].includes(wh(c))) && !['wo', 'wann', 'warum', 'wer'].includes(wh(c));
    return Boolean(wh(c) && (c.subj?.head === 'du') && ['was', 'womit', 'wie', 'wofür', 'welch'].includes(wh(c)) && ['machen', 'tun', 'beschäftigen', 'spielen', 'verbringen', 'unternehmen', 'interessieren', 'mögen', 'lieben'].includes(c.lemma) && !c.perfect
      && (adv(c, 'gern', 'gerne', 'am liebsten', 'lieber', 'so gern', 'so gerne') || pps(c, 'in', 'zu').some((p) => ['freizeit', 'spass', 'hobby'].includes(p.np.head)) || timesOf(c).some((t) => ['freizeit', 'wochenende'].includes(t.part)) || ['beschäftigen', 'interessieren', 'mögen', 'lieben'].includes(c.lemma)));
  },
  askLike: (c, q, env) => {
    const same = (l) => l && fold(l).slice(0, 3) === q.verb.slice(0, 3);
    const gern = adv(c, 'gern', 'gerne', 'so gern', 'so gerne', 'lieber');
    const dir = c.dat?.head === 'dir';
    if (c.wh) return false;
    // „Ich tanze gern. Du auch?“
    if (!c.question && c.subj?.head === 'ich' && same(c.lemma) && gern && askedBack(c)) return true;
    if (c.lemma === 'gehören' && same(c.subj?.head) && pps(c, 'zu').some((p) => ['hobbys', 'hobby'].includes(p.np.head))) return true;
    if (c.subj?.head === 'du' && c.lemma === 'finden' && same(c.acc?.head) && adjs(c).length + el(c, 'adv').length > 0) return true;
    if (!c.question && !(c.stop === '?')) return false;
    if (c.subj?.head === 'du' && same(c.lemma) && (gern || c.modal === 'mögen')) return true;
    if (c.subj?.head === 'du' && c.lemma === 'mögen' && (same(c.acc?.head) || c.dependentVerb && same(c.dependentVerb))) return true;
    if (c.subj?.head === 'du' && c.lemma === 'machen' && gern && env.elsewhere(same)) return true;
    if (dir && ['machen', 'gefallen'].includes(c.lemma) && (same(c.subj?.head))) return true;
    return Boolean(c.lemma === 'sein' && same(c.subj?.head) && (headsOf(c.pred).includes('hobby')));
  },
  askClock: (c) => ((['wie spät', 'wie viel uhr'].includes(wh(c))) && ((c.lemma === 'sein' && (c.subj?.head === 'es' || c.subj?.head === 'uhr')) || (c.lemma === 'haben' && ['wir', 'du'].includes(c.subj?.head)))) || (c.acc?.head === 'uhrzeit' && ['haben', 'sagen', 'wissen', 'geben'].includes(c.lemma)) || (wh(c) === 'was' && c.subj?.head === 'uhr' && ['sagen', 'zeigen', 'anzeigen'].includes(c.lemma)),
  askFree: (c, q) => {
    if (!(c.question || c.stop === '?' || c.sub === 'ob')) return false;
    const alone = whenFits([c], q.when);
    if (alone === 'other' || whenFits(c.all || [c], q.when) !== 'full') return false;
    if (c.subj?.head === 'du' && !c.wh && ((c.lemma === 'haben' && ((headsOf(c.acc).includes('zeit') && c.acc.det !== 'ein') || adjs(c).includes('frei') || adv(c, 'frei'))) || (c.lemma === 'sein' && (adjs(c).some((x) => ['frei', 'verfügbar'].includes(x)) || adv(c, 'frei'))) || (['kommen', 'treffen'].includes(c.lemma) && c.modal) || (c.lemma === 'können'))) return true;
    if (c.subj?.head === 'wir' && c.lemma === 'treffen') return true;
    if (c.dat?.head === 'dir' && c.lemma === 'passen' && !(c.subj?.kind === 'np' && c.subj.head === 'zeit')) return true;
    if (c.lemma === 'sein' && !c.wh && c.subj?.kind === 'when' && (adjs(c).some((x) => ['möglich', 'okay', 'ok', 'gut', 'recht'].includes(x)) || adv(c, 'okay', 'ok', 'gut', 'recht'))) return true;
    return Boolean((c.lemma === 'aussehen' && wh(c) === 'wie') || (c.lemma === 'gehen' && ['es', 'das', 'zeit'].includes(c.subj?.head)) || (c.lemma === 'passen' && (c.subj?.kind === 'when' || ['es', 'das', 'termin', 'zeit'].includes(c.subj?.head)) && c.subj?.head !== 'zeit'));
  },
  askHave: (c, q) => {
    const named = (n) => headsOf(n).some((h) => q.things.some((t) => h === t || h.endsWith(t)));
    const thing = (n) => named(n) || (n?.kind === 'pron' && ['den', 'die', 'das', 'ihn', 'sie', 'es', 'welchen', 'welche'].includes(n.head) && (c.all || []).some((x) => x.frag && NPS(x).some(named)));
    const whether = c.question || c.sub === 'ob' || c.stop === '?';
    if (!whether || c.wh) return false;
    if (['haben', 'anbieten', 'führen', 'verkaufen', 'servieren'].includes(c.lemma) && thing(c.acc) && c.subj?.head !== 'ich' && c.subj?.head !== 'du') return true;
    if (c.lemma === 'geben' && c.subj?.head === 'es' && thing(c.acc)) return true;
    if (['bekommen', 'kriegen', 'haben', 'bestellen', 'kaufen'].includes(c.lemma) && thing(c.acc) && (c.modal || c.lemma === 'bekommen' || c.lemma === 'kriegen')) return true;
    return Boolean(c.lemma === 'sein' && thing(c.subj) && (adjs(c).some((a) => ['erhältlich', 'verfügbar'].includes(a)) || adv(c, 'da')));
  },
  askTrain: (c, q, env) => {
    if (!(c.question || c.sub === 'ob' || c.stop === '?') || c.wh || (c.acc && ['fahren', 'gehen', 'abfahren'].includes(c.lemma))) return false;
    const to = (p) => (p.np.kind === 'place' || p.np.kind === 'own') && p.np.head === q.place;
    const nach = own(c, 'nach', 'bis').some(to);
    const train = headsOf(c.subj).some((h) => ['zug', 'bahn', 'ice'].includes(h) || (['er', 'der'].includes(h) && env.mentioned));
    if (['fahren', 'gehen', 'abfahren', 'kommen'].includes(c.lemma) && (nach || (adv(c, 'dahin', 'dorthin', 'hin') && c.elsewherePlace === q.place)) && (train || (c.subj?.head === 'ich' || c.subj?.head === 'man') && pps(c, 'mit').length)) return true;
    if (['halten', 'stoppen', 'ankommen'].includes(c.lemma) && train && pps(c, 'in').some(to)) return true;
    if (c.lemma === 'sein' && headsOf(c.pred).includes('zug') && nach) return true;
    if (c.lemma === 'bringen' && train && c.acc?.head === 'mich' && nach) return true;
    return Boolean(c.lemma === 'geben' && headsOf(c.acc).some((h) => h === 'zug' || h === 'züge') && nach);
  },
  askDid: (c) => Boolean((c.question && c.past && ((wh(c) === 'was' && c.lemma === 'sein' && adv(c, 'los')) || (wh(c) === 'wie' && ['sein', 'aussehen'].includes(c.lemma) && c.subj?.head === 'tag' && c.subj.det === 'dein'))) || ((c.question || c.sub) && c.subj?.head === 'du' && !timesOf(c).some((t) => ['morgen', 'übermorgen', 'heute'].includes(t.rel) || t.day) && ((wh(c) === 'was' && c.perfect && ['machen', 'tun', 'erleben', 'unternehmen'].includes(c.lemma)) || (wh(c) === 'wie' && c.perfect && c.lemma === 'verbringen')))),
  askShop: (c, q) => {
    if (!c.question && I(c) && c.lemma === 'einkaufen' && whenFits([c], q.when) === 'full' && askedBack(c)) return true;
    if (!(c.question || c.stop === '?') || c.wh || !['du', 'wir'].includes(c.subj?.head)) return false;
    if (whenFits(c.all || [c], q.when) !== 'full') return false;
    if (c.subj.head === 'du' && ((c.lemma === 'haben' && headsOf(c.acc).includes('zeit')) || c.lemma === 'mitkommen') && pps(c, 'zu').some((p) => p.np.head === 'einkaufen')) return true;
    return c.lemma === 'einkaufen' || (['vorhaben', 'planen'].includes(c.lemma) && c.dependentVerb === 'einkaufen') || (c.lemma === 'gehen' && pps(c, 'zu').some((p) => p.np.head === 'einkaufen'));
  },
};
const HERE = ['hier', 'da', 'dort', 'da drüben', 'dort drüben', 'hier drüben', 'da vorn', 'da oben', 'da unten', 'da hinten'];
const YES = /^(?:ja|ja klar|ja gern|ja gerne|klar|na klar|gern|gerne|sehr gern|sehr gerne|aber gern|aber gerne|okay|ok|gut|sehr gut|super|prima|toll|schön|perfekt|wunderbar|alles klar|abgemacht|einverstanden|kein problem|natürlich|sicher|auf jeden fall|oh ja|aber ja|genau|klasse|bitte|danke|vielen dank|sehr nett|das ist nett|wie nett|stimmt)$/u;
/** An agreeing reply can leave its understood subject unsaid, even in a transcript without commas. */
export function agreementEllipsis(text) {
  if (String(text).trim().endsWith('?')) return null;
  for (const word of String(text).matchAll(/\p{L}+/gu)) {
    const prefix = fold(text.slice(0, word.index).replace(/[.,!?;:]+/gu, ' ').trim()).replace(/\s+/gu, ' ');
    if (prefix && !YES.test(prefix)) continue;
    if (!verbReadings(fold(word[0])).some(r => r.mood === 'fin' && r.persons?.includes('er') && !r.modal)) continue;
    const predicate = text.slice(word.index);
    return 'Das ' + predicate.charAt(0).toLocaleLowerCase('de') + predicate.slice(1);
  }
  return null;
}
const NO = /^(?:nein|nee|leider nein|leider nicht|oh nein)$/u;
const birth = (c) => ((c.lemma === 'kommen' && (c.perfect || c.past) && pps(c, 'zu').some((p) => p.np.head === 'welt')) || c.lemma === 'geboren' || (c.lemma === 'werden' && c.passive === 'geboren') || c.state === 'geboren');
/** What a guest declines is eaten or drunk, or the wish for it. */
const fare = (n, env) => !n || n.kind === 'pron' || headsOf(n).every((h) => ['hunger', 'durst', 'appetit', 'lust', 'zeit', 'alkohol', 'zucker', 'nachtisch', 'essen', 'trinken', 'stück', 'glas', 'tasse'].includes(h) || !['furniture', 'family', 'day', 'number', 'function'].includes(env.kindOf(h)) && !env.cast(h));
/** „Nein, danke, ich möchte Kuchen.“: after the no, nothing is asked for but „nur“ or „lieber“ something else. */
const wants = (c, env) => I(c) && ['möchten', 'wollen', 'nehmen', 'bestellen', 'trinken', 'essen'].includes(c.lemma) && !c.perfect && (!negated(c) ? !(c.acc && !NO_THING.has(c.acc.kind) && fare(c.acc, env) && adv(c, 'nur', 'lieber', 'später', 'erst', 'zuerst')) : !fare(c.acc, env));
/** What nobody buys, needs or wishes: a pronoun without its noun, a number, a person. */
const NO_THING = new Set(['pron', 'num', 'name', 'time']);
/** One plays a game, an instrument, or with somebody: never a table, a brother or a Monday. */
const PLACES_TO_GO = set('kino theater museum schule café restaurant supermarkt schwimmbad stadion club disko konzert bibliothek büro zoo park');
const plays = (c, env) => {
  // One goes to the cinema; one never plays it or makes it („Ich spiele gern Kino.“, „Ich habe Kino gemacht.“).
  if (['spielen', 'machen'].includes(c.lemma) && c.acc && headsOf(c.acc).some((h) => PLACES_TO_GO.has(h))) return false;
  if (c.lemma === 'spielen' && c.acc && headsOf(c.acc).some((h) => /^(?:buch|bücher|zeitung|stuhl|tisch|brot|film|filme)$/u.test(h))) return false;
  return c.lemma !== 'spielen' || (c.acc ? !['furniture', 'family', 'day', 'number', 'food', 'drink', 'function'].includes(env.kindOf(c.acc.head)) && !DAYS.includes(c.acc.head) : pps(c, 'mit', 'in', 'bei', 'auf', 'gegen').length > 0 || c.perfect);
};
/** What is said to be the learner's own is theirs: „mein“, an article, or nothing; never „sein“, „ihr“, „unser“, „dein“. */
const notMine = (n) => Boolean(n) && ['sein', 'ihr', 'unser', 'dein', 'euer'].includes(n.det);
/** Nobody buys, needs or wishes a day, a hunger or a colour. */
const NO_GOODS = new Set([...DAYS, 'hunger', 'durst', 'appetit', 'farbe', 'alter', 'name', 'vorname', 'nachname', 'beruf', 'geburtstag', 'uhrzeit', 'monat', 'jahr']);
const goods = (n, env, family = false) => Boolean(n) && !NO_THING.has(n.kind) && !headsOf(n).some((h) => NO_GOODS.has(h) || ((FAMILY.has(h) || h === 'familie') && !(family && n.det === 'ein')));
/** What one does it to: one cooks food, drinks drinks, hears music. Only a noun the check knows is refused. */
const OBJECTS = {
  kochen: (k, h) => ['food', 'drink'].includes(k) || /essen$|suppe$|frühstück$/u.test(h), backen: (k) => k === 'food', essen: (k) => k === 'food' || k === 'thing',
  trinken: (k, h) => k === 'drink' || /glas$|tasse$|flasche$|schokolade$|suppe$|brühe$|getränk$/u.test(h), hören: (k, h) => /musik|radio|lied|podcast|nachricht|konzert|hörbuch|hörbücher|oper|vogel|vögel|jazz|rock|pop/u.test(h) || k === 'language',
  lesen: (k, h) => /buch|bücher|zeitung|text|roman|comic|gedicht|nachricht|mail|brief|blog|artikel|geschichte|märchen|koran|bibel|manga/u.test(h), schwimmen: () => false, tanzen: (k, h) => /salsa|tango|walzer|hip|ballett|zumba|bachata|dabke|samba|tanz/u.test(h),
};
const doable = (c, env) => { const t = OBJECTS[c.lemma]; if (!t || !c.acc || NO_THING.has(c.acc.kind) || c.acc.kind === 'own' || (c.acc.unknown || []).length) return true; return headsOf(c.acc).every((h) => !env.known(h) || ['das', 'etwas', 'nichts', 'alles', 'viel'].includes(h) || t(env.kindOf(h), h)); };
/** „noch jung“, „schon alt“, „noch nicht alt“, „nicht mehr jung“: the years go one way. */
const backwards = (c) => (c.adj || []).some((a) => { const d = a.degree || []; const not = d.includes('nicht'); const still = d.includes('noch'); const young = a.words.includes('jung'); const old = a.words.includes('alt'); return (young && ((d.includes('schon') && !not) || (still && not))) || (old && ((still && !not) || (not && d.includes('mehr')))); });
const NO_MOOD = new Set(['nicht', 'sehr', 'so', 'auch', 'heute', 'jetzt', 'hier', 'leider', 'danke', 'noch', 'schon', 'immer', 'dann', 'da', 'ganz', 'bitte', 'gerade', 'im moment', 'zurzeit', 'eigentlich', 'ja', 'denn']);
const SAYING = {
  birth: (c, q, env) => (birth(c) && !(c.lemma === 'geboren' && c.past) && timesOf(c).some(t => env.isDate(t))) || (['geburtsdatum', 'geburtstag'].includes(c.subj?.head) && c.subj.det === 'mein' && c.pred?.kind === 'date' && env.isDate(c.pred)),
  name: (c) => {
    const named = (n) => n && ['own', 'name'].includes(n.kind);
    if (c.lemma === 'heißen' && c.subj?.head === 'ich' && named(c.pred)) return true;
    if (['sein', 'sprechen'].includes(c.lemma) && adv(c, 'hier') && named(c.subj) && !c.pred && !c.acc && c.reading?.persons?.includes('er')) return true;
    if (c.lemma === 'sein' && headsOf(c.subj).some((h) => ['name', 'vorname', 'nachname', 'familienname'].includes(h)) && c.subj.det === 'mein' && named(c.pred)) return true;
    // („Sami Khoury ist mein Name.“)
    if (c.lemma === 'sein' && named(c.subj) && ['name', 'vorname'].includes(c.pred?.head) && c.pred.det === 'mein') return true;
    return Boolean(c.lemma === 'sein' && c.subj?.head === 'ich' && named(c.pred));
  },
  mood: (c) => (c.lemma === 'gehen' && c.subj?.head === 'es' && c.dat?.head === 'mir' && c.elems.some((e) => e.kind === 'adj' || (e.kind === 'adv' && !NO_MOOD.has(e.word)) || e.kind === 'pp')) || (c.lemma === 'fühlen' && I(c)) || (c.lemma === 'sein' && I(c) && adjs(c).some((a) => FEEL.has(a))) || (c.lemma === 'sein' && c.subj?.head === 'alles' && (adjs(c).length > 0 || adv(c, 'gut', 'super', 'prima', 'okay', 'in ordnung'))),
  origin: (c, q, env) => {
    const who = q.third ? third(c, q) : I(c);
    if (who && ['kommen', 'sein', 'stammen'].includes(c.lemma) && pps(c, 'aus').some((p) => (p.np.kind !== 'np' || !unknownNoun(p.np)) && !env.notPlace(p.np.head) && !nowhere(p, env))) return true;
    if (who && c.lemma === 'geboren' && pps(c, 'in').some((p) => p.np.kind === 'place')) return true;
    return Boolean(!q.third && c.lemma === 'sein' && headsOf(c.subj).some((h) => ['heimat', 'heimatland', 'herkunftsland', 'geburtsland', 'land'].includes(h)) && c.subj.det === 'mein' && c.pred);
  },
  live: (c, q, env) => I(c) && ['wohnen', 'leben'].includes(c.lemma) && pps(c, 'in', 'bei', 'auf', 'an', 'zu').some((p) => p.prep !== 'in' || !nowhere(p, env)) && !pps(c, 'nach', 'aus').length,
  job: (c, q, env) => I(c) && ((c.lemma === 'sein' && !c.pred && adjs(c).includes('arbeitslos')) || (c.lemma === 'suchen' && headsOf(c.acc).some((h) => ['arbeit', 'job', 'stelle', 'arbeitsstelle'].includes(h))) || (c.lemma === 'arbeiten' && negated(c) && !pps(c).length) || (c.lemma === 'sein' && c.pred?.job) || (c.lemma === 'machen' && ['ausbildung', 'praktikum', 'lehre'].includes(c.acc?.head)) || (c.lemma === 'arbeiten' && !negated(c) && own(c, 'bei', 'in', 'auf').some((p) => !nowhere(p, env) && p.np.kind !== 'time' && !(p.np.kind === 'place')) && !c.modal && !c.perfect) || (c.lemma === 'arbeiten' && pps(c, 'als').some((p) => p.np.job || (p.np.kind === 'own' && !env.cast(p.np.head)) || (p.np.kind === 'np' && env.jobLike(p.np.head))))),
  // („Sie spricht arabisch.“ says how she speaks, and is German too: IDS Grammis.)
  // („Ich spreche zwei Sprachen: Persisch und Englisch.“, „Meine Muttersprache ist Arabisch.“)
  language: (c, q, env) => (!q.third && c.lemma === 'sein' && headsOf(c.subj).includes('muttersprache') && c.subj.det === 'mein' && (c.pred?.kind === 'language' || (c.pred && env.isLanguage(c.pred.head)) || adjs(c).some((a) => env.isLanguage(a)))) || ((q.third ? third(c, q) : I(c)) && c.lemma === 'sprechen' && headsOf(c.acc).includes('sprachen') && (c.all || []).some((x) => x.frag && NPS(x).some((n) => n.kind === 'language'))) || (q.third ? third(c, q) : I(c)) && ((['sprechen', 'können', 'lernen'].includes(c.lemma) && c.acc?.kind === 'language') || (c.lemma === 'sprechen' && !c.acc && adjs(c).length > 0 && adjs(c).every((a) => env.isLanguage(a)))),
  phone: (c) => {
    const has = (c.elems || []).some((e) => e.kind === 'phone' || (e.number) || (e.items || []).some((x) => x.kind === 'phone')) || pps(c, 'unter').some((p) => p.np.kind === 'phone') || c.pred?.kind === 'phone' || c.acc?.kind === 'phone';
    if (!has) return false;
    if (c.subj?.head === 'sie' && !c.reading?.persons?.includes('sie')) return false;
    const subj = headsOf(c.subj);
    if (subj.some((h) => /nummer$|telefon$|handy$/u.test(h))) return !notMine(c.subj);
    return (c.subj?.head === 'ich' && (c.lemma === 'haben' || pps(c, 'unter').length > 0)) || c.acc?.head === 'mich';
  },
  photo: (c, q) => (c.acc?.det === 'mein' && headsOf(c.acc).some((h) => q.people.includes(h)) && ((c.lemma === 'sehen' && c.subj?.head === 'du') || (c.lemma === 'zeigen' && I(c)))) || (c.lemma === 'sein' && c.subj?.det === 'mein' && headsOf(c.subj).some((h) => q.people.includes(h)) && pps(c, 'auf').some((p) => ['foto', 'bild'].includes(p.np.head))) || (c.lemma === 'sein' && c.pred?.head === 'das' && c.subj?.det === 'mein' && headsOf(c.subj).some((h) => q.people.includes(h))) || c.lemma === 'sein' && headsOf(c.pred).some((h) => q.people.includes(h) || q.people.some((p) => (SAME_PERSON[p] || []).includes(h))) && c.pred.det === 'mein' && ['das', 'sie', 'er', 'es', 'hier'].includes(c.subj?.head),
  age: (c, q) => c.lemma === 'sein' && !backwards(c) && !c.elems.some((e) => e !== c.subj && (['own', 'name'].includes(e.kind) || (e.kind === 'num' && adjs(c).length > 0) || (e.kind === 'np' && /^jahre?$/u.test(e.head) && e.det !== 'num'))) && (third(c, q) || (c.subj?.kind === 'name' || c.subj?.kind === 'own')) && (adjs(c).some((a) => ['jung', 'alt', 'älter', 'jünger'].includes(a)) || headsOf(c.pred).some((h) => ['jahre', 'jahr'].includes(h)) || c.pred?.kind === 'num'),
  buy: (c, q, env) => I(c) && c.acc && (['kaufen', 'nehmen', 'bestellen'].includes(c.lemma) || (['möchten', 'wollen'].includes(c.lemma)) || (c.lemma === 'haben' && (c.polite || c.modal === 'möchten'))) && ((!negated(c) && goods(c.acc, env)) || (q.allowNothing && (c.acc.head === 'nichts' || negated(c) && goods(c.acc, env)))),
  thing: (c) => !negated(c) && ((c.lemma === 'sein' && ['das', 'dies', 'hier', 'es'].includes(c.subj?.head) && c.pred && c.pred.kind === 'np' && !FAMILY.has(c.pred.head)) || (c.lemma === 'sein' && (adv(c, 'hier', 'da') || pps(c, 'in').some((p) => ['tasche', 'rucksack', 'hand', 'handtasche'].includes(p.np.head))) && c.subj?.kind === 'np' && !c.adj?.length) || (c.lemma === 'haben' && I(c) && c.acc?.kind === 'np' && (adv(c, 'hier', 'da') || pps(c, 'in').length > 0))),
  here: (c, q, env) => adv(c, ...HERE) && ['sein', 'liegen', 'stehen', 'stecken'].includes(c.lemma) && !negated(c) && isThing(c.subj, q, env) && picksUp(c.subj, env) && !notMine(c.subj) && !(c.subj.kind === 'pron' && c.subj.head === 'sie' && !c.reading?.persons?.includes('er') && !env.thingGenders.includes('pl')),
  colour: (c, q, env) => {
    const mine = (n) => n && (isThing(n, q, env) || ['farbe', 'meins', 'meine', 'meiner', 'das'].includes(n.head)) && picksUp(n, env) && n.det !== 'dein';
    if (c.lemma === 'sein' && mine(c.subj) && (adjs(c).some((a) => COLOURS.has(a)) || headsOf(c.pred).some((h) => COLOURS.has(h)))) return !c.adj?.some((a) => a.neg) || c.adj.some((a) => a.words.length > 1);
    if (c.lemma === 'haben' && mine(c.subj) && (c.acc?.adjs || []).some((a) => COLOURS.has(a)) && ['umschlag', 'einband', 'deckel', 'cover'].includes(c.acc.head)) return true;
    if (c.lemma === 'haben' && mine(c.subj) && c.acc?.head === 'farbe' && (c.acc.adjs || []).some((a) => COLOURS.has(a))) return true;
    if (c.lemma === 'haben' && mine(c.subj) && c.acc?.head === 'farbe' && (COLOURS.has(c.acc.colour) || (c.elems || []).some((e) => COLOURS.has(e.head)))) return true;
    return Boolean(c.lemma === 'haben' && I(c) && headsOf(c.acc).some((h) => q.things.includes(h)) && (c.acc.adjs || []).some((a) => COLOURS.has(a)));
  },
  need: (c, q, env) => (q.allowNothing && I(c) && ['brauchen', 'benötigen', 'möchten'].includes(c.lemma) && c.acc?.head === 'nichts') || (!negated(c) && ((I(c) && goods(c.acc, env) && (['brauchen', 'benötigen'].includes(c.lemma) || (c.lemma === 'haben' && c.polite) || c.lemma === 'möchten')) || (c.lemma === 'fehlen' && c.dat?.head === 'mir'))),
  hobby: (c, q, env) => {
    if (I(c) && c.lemma === 'arbeiten' && !c.perfect && !c.question && adv(c, 'gern', 'gerne') && pps(c, 'in', 'an').some((p) => ['garten', 'computer', 'haus', 'balkon'].includes(p.np.head))) return true;
    if (c.question || c.perfect || !plays(c, env) || !doable(c, env)) return false;
    // „Ich habe zwei Hobbys: Lesen und Schwimmen.“, „Am Wochenende bin ich gern zu Hause.“
    if (I(c) && c.lemma === 'haben' && headsOf(c.acc).includes('hobbys') && (c.all || []).some((x) => x.frag && NPS(x).length > 0 && NPS(x).every((n) => headsOf(n).every((h) => !FAMILY.has(h) && !DAYS.includes(h))))) return true;
    if (I(c) && c.lemma === 'sein' && adv(c, 'gern', 'gerne', 'am liebsten') && !c.pred && !adjs(c).length && (adv(c, 'zu hause', 'draußen', 'unterwegs', 'daheim', 'zuhause') || pps(c, 'in', 'bei', 'mit', 'auf', 'an').some((p) => !nowhere(p, env)))) return true;
    const hobby = (n) => headsOf(n).some((h) => ['hobby', 'hobbys', 'leidenschaft', 'lieblingshobby'].includes(h));
    if (c.lemma === 'sein' && ((hobby(c.subj) && c.subj.det === 'mein' && c.pred) || (hobby(c.pred) && c.pred.det === 'mein'))) {
      const it = hobby(c.subj) ? c.pred : c.subj;
      // A hobby is done: „Musik“, „Fußball“, „das Lesen“; never „der Stuhl“, „Brot“, „ein Computer“.
      const thing = (it?.det && !['der', 'kein'].includes(it.det)) || headsOf(it).some((h) => ['food', 'drink', 'furniture', 'day', 'number'].includes(env.kindOf(h)));
      return !thing && !unknownNoun(it) && !NO_THING.has(it?.kind) && it?.kind !== 'place' && it?.det !== 'mein' && !headsOf(it).some((h) => FAMILY.has(h)) && !adv(c, 'gern', 'gerne');
    }
    if (c.lemma === 'gehören' && pps(c, 'zu').some((p) => hobby(p.np))) return true;
    if (!I(c) || negated(c)) return false;
    if (['lieben', 'mögen'].includes(c.lemma)) return Boolean(c.acc);
    if (['sein', 'haben', 'heißen', 'wohnen', 'leben', 'arbeiten', 'kommen', 'brauchen', 'möchten', 'werden', 'wissen', 'kosten', 'glauben', 'denken', 'müssen', 'wollen', 'sollen', 'können', 'dürfen'].includes(c.lemma) || (c.modal && c.modal !== 'mögen')) return false;
    return adv(c, 'gern', 'gerne', 'am liebsten', 'sehr gern', 'viel', 'oft', 'so gern', 'lieber', 'regelmäßig', 'besonders') || pps(c, 'in').some((p) => p.np.head === 'freizeit') || timesOf(c).length > 0;
  },
  routine: (c, q, env) => I(c) && plays(c, env) && doable(c, env) && !negated(c) && !c.question && !c.perfect && !c.past && !(c.lemma === 'stehen' && !pps(c).length) && !['sein', 'haben', 'heißen', 'wohnen', 'möchten', 'werden', 'glauben', 'wissen', 'mögen', 'lieben', 'brauchen'].includes(c.lemma) && !timesOf(c).some((t) => PM.has(t.part) || t.rel) && !c.polite,
  clock: (c, q) => {
    const t = timesOf(c).find((e) => e.h !== undefined);
    if (!t) return false;
    const want = whenWanted(`montag ${q.time}`);
    if (clockOf(t) !== want.clock || timesOf(c).some((e) => PM.has(e.part)) || (t.prep && !['gegen', 'kurz'].includes(t.prep)) || (t.h > 12 && Number(q.time.split(':')[0]) < 12)) return false;
    return (c.lemma === 'sein' && c.subj?.head === 'es') || (c.lemma === 'haben' && c.subj?.head === 'wir') || (['zeigen', 'sagen', 'anzeigen'].includes(c.lemma) && c.subj?.head === 'uhr');
  },
  getUp: (c, q) => I(c) && c.lemma === 'aufstehen' && !c.perfect && !negated(c) && ((!q.byClock && adv(c, 'früh', 'spät')) || [c, ...(c.all || []).filter((x) => x.frag)].some((x) => timesOf(x).some((t) => t.h !== undefined))),
  freeTime: (c) => I(c) && !negated(c) && !(headsOf(c.acc).includes('zeit') && ['ein', 'der'].includes(c.acc.det)) && timesOf(c).length > 0 && ((c.lemma === 'haben' && (!c.acc || headsOf(c.acc).every((h) => ['zeit', 'tag', 'nachmittag', 'vormittag', 'abend', 'morgen', 'stunde', 'stunden', 'wochenende', 'urlaub', 'pause', 'freizeit'].includes(h))) && (headsOf(c.acc).includes('zeit') || adv(c, 'frei') || adjs(c).includes('frei'))) || (c.lemma === 'sein' && (adjs(c).includes('frei') || adv(c, 'frei')))),
  // „Wann arbeitest du?“ asks about a job: one who has none says so („Ich bin Rentner.“, „Ich gehe noch zur Schule.“; Codex score of f0847faa).
  workWhen: (c) => I(c) && ((c.lemma === 'arbeiten' && timesOf(c).length > 0) || notWorking(c)),
  agree: (c, q) => {
    if (negated(c) || c.question) return false;
    if (whenFits([c], q.when) === 'other') return false;
    if (['passen', 'gehen', 'klappen'].includes(c.lemma) && ['das', 'es', 'termin', 'zeit', 'der', 'tag', 'freitag', 'uhrzeit'].includes(c.subj?.head)) return true;
    if (c.lemma === 'sein' && (['das', 'es', 'termin', 'zeit', 'freitag'].includes(c.subj?.head)) && (adjs(c).some((a) => ['gut', 'perfekt', 'super', 'prima', 'okay', 'ok', 'toll', 'schön', 'wunderbar'].includes(a)) || adv(c, 'gut', 'okay', 'perfekt', 'super', 'in ordnung', 'prima', 'toll', 'schön'))) return true;
    if (I(c) && ((c.lemma === 'haben' && headsOf(c.acc).includes('zeit') && !adjs(c).includes('frei') && !adv(c, 'frei')) || (c.lemma === 'sein' && (adjs(c).includes('frei') || adv(c, 'frei', 'da', 'dabei'))) || ['kommen', 'freuen', 'können', 'treffen', 'sehen', 'notieren', 'zusagen', 'aufschreiben'].includes(c.lemma))) return true;
    return Boolean(c.subj?.head === 'wir' && ['treffen', 'sehen'].includes(c.lemma));
  },
  hungry: (c, q) => {
    if (!I(c) || negated(c) || !(c.lemma === 'haben' || c.lemma === 'sein' || c.modal || c.polite)) return false;
    if (['möchten', 'wollen', 'brauchen', 'nehmen'].includes(c.lemma) && headsOf(c.acc).some((h) => ['hunger', 'durst'].includes(h))) return false;
    const got = new Set();
    if (c.acc?.or) return false;
    for (const h of headsOf(c.acc)) for (const w of ['hunger', 'durst']) if (h.endsWith(w)) got.add(w);
    for (const x of (c.all || []).filter((y) => y.frag && !y.neg)) for (const n of NPS(x)) for (const h of headsOf(n)) if (['hunger', 'durst'].includes(h) && got.size) got.add(h);
    for (const a of adjs(c)) { if (a === 'hungrig') got.add('hunger'); if (a === 'durstig') got.add('durst'); }
    if ((c.modal || c.polite) && c.lemma === 'essen') got.add('hunger');
    if ((c.modal || c.polite) && c.lemma === 'trinken') got.add('durst');
    if (c.also === 'trinken') got.add('durst');
    c.needs = got;
    const all = new Set((c.all || [c]).flatMap((x) => (x.needs ? [...x.needs] : [])));
    for (const x of got) all.add(x);
    return q.wants.every((w) => all.has(w)) && got.size > 0;
  },
  order: (c, q, env) => {
    if (negated(c) || !c.acc) return false;
    const kindsOf = headsOf(c.acc).map((h) => (h === 'schokolade' && (c.acc.adjs || []).includes('heiss') ? 'drink' : env.kindOf(h)));
    if (!kindsOf.length || kindsOf.some((k) => !k || !q.things.includes(k)) || !doable(c, env)) return false;
    if (I(c) && (['möchten', 'nehmen', 'bestellen', 'trinken', 'essen', 'wollen', 'bekommen', 'kriegen'].includes(c.lemma) || (c.lemma === 'haben' && (c.polite || c.modal)))) return true;
    return Boolean(['bringen', 'geben'].includes(c.lemma) && c.subj?.head === 'sie' && c.dat?.head === 'mir');
  },
  accept: (c, q) => {
    if (negated(c)) return false;
    const water = (n) => !n || headsOf(n).some((h) => q.things.includes(h) || ['das', 'eins', 'etwas', 'es', 'leitungswasser', 'sprudelwasser', 'getränk'].includes(h));
    if (I(c) && (['möchten', 'nehmen', 'trinken', 'wollen'].includes(c.lemma) || (c.lemma === 'haben' && c.polite))) return Boolean(c.acc) && water(c.acc);
    if (I(c) && c.lemma === 'haben' && headsOf(c.acc).includes('durst')) return true;
    if (c.lemma === 'bringen' && c.subj?.head === 'sie') return water(c.acc);
    return c.lemma === 'sein' && ['das', 'es', ...q.things].includes(c.subj?.head) && (adjs(c).length > 0 || adv(c, 'gut', 'schön', 'super', 'toll', 'perfekt', 'prima'));
  },
  decline: (c, q, env) => (I(c) && c.lemma === 'verzichten') || (I(c) && negated(c) && fare(c.acc, env) && !(c.acc?.kind === 'pron' && c.lemma === 'haben') && ['möchten', 'nehmen', 'essen', 'mögen', 'haben', 'wollen', 'brauchen', 'trinken', 'dürfen', 'können', 'bestellen'].includes(c.lemma)) || (I(c) && c.lemma === 'sein' && adjs(c).includes('satt')) || (I(c) && c.lemma === 'haben' && (c.acc?.head === 'genug' || adv(c, 'genug'))),
  travel: (c, q, env) => {
    const to = pps(c, 'nach').some((p) => p.home || (['place', 'own', 'name'].includes(p.np.kind) && !nowhere(p, env))) || pps(c, 'zu').length > 0 || pps(c, 'in', 'an').some((p) => p.c.includes('a') && p.np.kind !== 'place' && p.np.kind !== 'own' && !nowhere(p, env)) || adv(c, 'nach hause');
    if (!to) return c.lemma === 'sein' && headsOf(c.subj).some((h) => ['ziel', 'reiseziel'].includes(h)) && c.pred?.kind === 'place';
    if (I(c) && c.lemma === 'sein' && pps(c, 'auf').some((p) => p.np.head === 'weg')) return true;
    if (I(c) && ['fahren', 'reisen', 'fliegen', 'gehen', 'wollen', 'möchten', 'müssen', 'weiterfahren', 'hinfahren'].includes(c.lemma)) return !negated(c) && !c.perfect;
    return c.lemma === 'gehen' && ['es', 'reise', 'fahrt'].includes(c.subj?.head);
  },
  did: (c, q, env) => I(c) && plays(c, env) && doable(c, env) && !(c.acc?.kind === 'pron' && /^(?:ein|kein)/u.test(c.acc.head)) && (c.perfect || (c.past && c.lemma !== 'werden')) && !timesOf(c).some((t) => ['morgen', 'übermorgen'].includes(t.rel)) && !env.nearMiss(c),
  join: (c, q) => {
    if (!I(c) || negated(c) || c.question || whenFits([c], q.when) === 'other') return false;
    if (['dabeisein'].includes(c.lemma) || (c.lemma === 'sein' && adv(c, 'dabei'))) return true;
    return ['mitkommen', 'mitgehen', 'mitfahren'].includes(c.lemma) || (c.lemma === 'kommen' && !pps(c, 'mit').some((p) => !['dir', 'euch'].includes(p.np.head))) || (c.lemma === 'begleiten' && c.acc?.head === 'dich') || (['gehen', 'einkaufen'].includes(c.lemma) && pps(c, 'mit').some((p) => p.np.head === 'dir'));
  },
  invite: (c) => {
    if (negated(c) || pps(c, 'in', 'nach', 'an').some((p) => FEST.has(p.np.head))) return false;
    if (c.lemma === 'einladen' && I(c) && c.acc?.head === 'dich') return true;
    if (c.subj?.head === 'du' && (c.state === 'einladen' || adjs(c).includes('eingeladen') || adv(c, 'willkommen') || adjs(c).includes('willkommen'))) return true;
    if (c.subj?.head === 'du' && (c.question || c.stop === '?') && (['kommen', 'mitkommen', 'vorbeikommen', 'mitfeiern', 'dabeisein'].includes(c.lemma) || (c.lemma === 'haben' && headsOf(c.acc).some((h) => ['lust', 'zeit'].includes(h))) || (c.lemma === 'sein' && adv(c, 'dabei')))) return true;
    if (c.sharedSubj && c.lemma === 'einladen' && c.acc?.head === 'dich') return true;
    if (c.subj?.head === 'du' && c.question && c.lemma === 'feiern' && pps(c, 'mit').some((p) => ['mir', 'uns'].includes(p.np.head))) return true;
    return Boolean(c.imperative && (['kommen', 'mitkommen', 'vorbeikommen', 'mitfeiern', 'feiern', 'dabeisein'].includes(c.lemma) || (c.lemma === 'sein' && adv(c, 'dabei'))));
  },
  birthday: (c, q, env) => {
    if (c.question || (c.perfect && c.lemma !== 'geboren')) return false;
    if (timesOf(c).some((t) => t.date && (t.month || t.numeric) && !env.dayExists(t)) || (c.pred?.kind === 'date' && !env.dayExists(c.pred))) return false;
    const dated = timesOf(c).some((t) => t.date || t.month || t.day || ['morgen', 'übermorgen', 'heute'].includes(t.rel)) || c.pred?.kind === 'date' || pps(c, 'auf').some((p) => p.np.kind === 'date');
    if (!dated || (timesOf(c).some((t) => t.dayOnly) && !timesOf(c).some((t) => t.month || t.day) && !(c.all || []).some((x) => x !== c && timesOf(x).some((t) => t.month)))) return false;
    const its = headsOf(c.subj).some((h) => ['geburtstag', 'er', 'geburtsdatum'].includes(h)) && !notMine(c.subj);
    return (its && ['sein', 'fallen'].includes(c.lemma)) || (I(c) && ['haben', 'feiern'].includes(c.lemma) && headsOf(c.acc).includes('geburtstag')) || (I(c) && birth(c));
  },
  guests: (c, q, env) => {
    const who = (n) => n && !notMine(n) && !['ich', 'du', 'es', 'das'].includes(n.head) && headsOf(n).every((h, i) => env.person(h, n.items?.[i] || n));
    if (negated(c) || c.question) return false;
    if (['kommen', 'mitkommen', 'vorbeikommen', 'mitfeiern'].includes(c.lemma) && who(c.subj)) return true;
    if (['dabeisein', 'dasein'].includes(c.lemma) && who(c.subj)) return true;
    if (c.lemma === 'sein' && who(c.subj) && (adv(c, 'dabei', 'da', 'auch') || c.state === 'einladen' || adjs(c).includes('eingeladen'))) return true;
    return Boolean(I(c) && c.lemma === 'einladen' && who(c.acc));
  },
  wish: (c, q, env) => {
    if (c.question) return false;
    const gift = (n) => goods(n, env, true);
    if (I(c) && c.acc?.head === 'nichts' && (['möchten', 'brauchen', 'nehmen'].includes(c.lemma) || c.lemma === 'wünschen' && (c.dat?.head === 'mir' || c.refl?.head === 'mir'))) return q.allowNothing;
    if (!q.allowNothing && negated(c)) return false;
    if (I(c) && (['möchten', 'brauchen', 'nehmen'].includes(c.lemma) || (c.lemma === 'haben' && (c.polite || c.modal))) && gift(c.acc)) return !negated(c) || headsOf(c.acc).some((h) => ['geschenk', 'geschenke', 'nichts'].includes(h));
    if (I(c) && c.lemma === 'wünschen' && (c.dat?.head === 'mir' || c.refl?.head === 'mir') && gift(c.acc)) return true;
    if (I(c) && c.lemma === 'freuen' && pps(c, 'über').length > 0) return true;
    return c.lemma === 'sein' && c.polite && c.subj?.kind === 'np' && (adjs(c).length > 0 || adv(c, 'schön', 'toll', 'super', 'gut', 'perfekt'));
  },
};

// What a statement says that answers another question of the course: with none of the turn's own it is off the task.
const OTHER = [
  ['name', (c) => c.subj?.head === 'ich' && c.lemma === 'heißen'],
  ['origin', (c) => I(c) && c.lemma === 'kommen' && pps(c, 'aus').length > 0],
  ['live', (c) => I(c) && ['wohnen', 'leben'].includes(c.lemma) && pps(c, 'in').length > 0],
  ['job', (c) => I(c) && ((c.lemma === 'arbeiten' && pps(c, 'als').length > 0) || (c.lemma === 'sein' && c.pred?.job))],
  ['phone', (c) => headsOf(c.subj).some((h) => /nummer$/u.test(h)) && c.lemma === 'sein'],
  ['address', (c) => headsOf(c.subj).includes('adresse')],
  ['age', (c) => I(c) && c.lemma === 'sein' && headsOf(c.pred).includes('jahre')],
  ['getUp', (c) => I(c) && c.lemma === 'aufstehen'],
  ['clock', (c) => c.lemma === 'sein' && c.subj?.head === 'es' && timesOf(c).some((t) => t.bareClock)],
  ['free', (c) => I(c) && c.lemma === 'haben' && headsOf(c.acc).includes('zeit')],
  ['hungry', (c) => I(c) && c.lemma === 'haben' && headsOf(c.acc).some((h) => ['hunger', 'durst'].includes(h))],
  ['party', (c) => I(c) && c.lemma === 'haben' && headsOf(c.acc).includes('geburtstag')],
  ['breakfast', (c) => I(c) && c.lemma === 'frühstücken'],
  ['thing', (c) => c.subj?.kind === 'np' && c.lemma === 'kosten' && !c.question],
  ['birthday', (c) => headsOf(c.subj).includes('geburtstag') && c.lemma === 'sein'],
  ['sell', (c) => I(c) && c.lemma === 'verkaufen'],
  ['buy', (c) => I(c) && c.lemma === 'kaufen'],
  ['work', (c) => I(c) && c.lemma === 'arbeiten'],
  ['bed', (c) => I(c) && ['schlafen'].includes(c.lemma)],
  ['bed', (c) => I(c) && c.lemma === 'gehen' && pps(c, 'in').some((p) => p.np.head === 'bett')],
  ['party', (c) => I(c) && c.lemma === 'feiern'],
  ['begin', (c) => headsOf(c.subj).some((h) => FEST.has(h)) && ['beginnen', 'anfangen', 'sein'].includes(c.lemma)],
  ['comes', (c) => c.subj && !I(c) && c.lemma === 'kommen' && !c.question],
  ['drink', (c) => I(c) && ['trinken', 'essen', 'nehmen'].includes(c.lemma)],
  ['like', (c) => I(c) && adv(c, 'gern', 'gerne')],
];
// Statements that belong to the turn's own talk, though they do not answer it.
const NEAR = { buy: ['buy', 'sell!'], order: ['drink', 'hungry'], accept: ['drink', 'like', 'hungry'], decline: ['drink', 'like', 'hungry'], askHave: [], hobby: ['like', 'work!', 'drink', 'bed'], routine: ['work', 'drink', 'like', 'bed', 'getUp', 'breakfast'], getUp: ['work', 'like', 'clock', 'breakfast'], did: [], invite: [], guests: ['comes', 'party'], wish: ['drink', 'like', 'buy'], birthday: ['birthday', 'party', 'free'], join: ['buy', 'like', 'free'], agree: ['work', 'comes', 'free'], message: OTHER.map(([n]) => n), need: ['buy', 'drink'], thing: ['buy'], freeTime: ['work', 'free'], workWhen: ['work'], mood: ['bed', 'work'], travel: [], clock: [], phone: ['name'], name: [], photo: ['comes'], age: ['comes'] };

const QUESTION_KINDS = Object.keys(ASKING);

/** What the sentences say about the turn's question. `env`: registers, the course's words (see finalCheck.js). */
/** Read as German, and said of nothing it can be said of („Ich koche gern Musik“, „Ich kaufe den Bruder“), or of somebody else's („Sein Bruder kommt“). */
/**
 * The verb's own preposition, prefix or object, wrong in a sentence that reads (Claude score of fd8f8dba, MAJOR): „Ich stehe um sechs
 * und dusche.“ (aufstehen), „Ich rufe meine Mutter.“ (anrufen), „Ich höre zu Musik.“, „Ich lade dich für mein Fest ein.“ (zu),
 * „Kommst du mit meiner Party?“ Returns the fault, or null.
 */
const PLACE_PREPS = ['in', 'an', 'auf', 'vor', 'hinter', 'neben', 'bei', 'unter', 'zwischen', 'im', 'am'];
const OBJECT_OF = { hören: /^(?:musik|radio|lied|lieder|podcast|nachrichten|konzert)$/u, trinken: /^(?:kaffee|tee|wasser|saft|milch|bier|wein|cola|orangensaft|mineralwasser|limonade)$/u, essen: /^(?:brot|suppe|salat|kuchen|obst|fleisch|fisch|reis|käse)$/u, schauen: /^(?:filme?|serien?|fernsehen|nachrichten|fussball)$/u, sehen: /^(?:filme?|serien?|nachrichten|fussball)$/u, lesen: /^(?:bücher|buch|zeitung|zeitungen)$/u, spielen: /^(?:fussball|tennis|gitarre|klavier|karten|schach|basketball|volleyball)$/u };
// The object a verb cannot take: true where it does not fit. One eats, drinks and cooks no noun the course teaches outside
// its food and drink (`env.notConsumed`); one reads and hears no food or drink.
const consumed = (h, env) => ['food', 'drink'].includes(env.kindOf(h));
const SENSE = {
  essen: (h, env) => env.notConsumed(h),
  trinken: (h, env) => env.notConsumed(h),
  kochen: (h, env) => env.notConsumed(h),
  lesen: consumed,
  hören: consumed,
};
export function valencyFault(turn, sentences, env) {
  for (const c of sentences.flatMap((s) => s.clauses.map((x) => ({ ...x, stop: s.stop })))) {
    if (c.around || c.frag || !c.lemma) continue;
    // „Ich habe einen Hunger.“: one has hunger and thirst without an article, unless an adjective says how much (fresh corpora of round 4).
    if (c.lemma === 'haben' && [c.acc, ...(c.acc?.items || [])].some((n) => n && ['hunger', 'durst'].includes(n.head) && n.det === 'ein' && !(n.adjs || []).length)) return 'article';
    // What one eats is food, what one drinks a drink; one reads or hears neither („Ich esse gern Musik.“, „Ich lese gern Kaffee.“:
    // Codex score of f0847faa). Only a taught noun of a known kind counts (`env.kindOf`); the learner's own word stays unjudged.
    const sense = SENSE[c.lemma];
    if (sense && env && c.acc && [c.acc, ...(c.acc.items || [])].some((n) => n?.kind === 'np' && !n.unknown?.length && headsOf(n).some((h) => sense(h, env)))) return 'word';
    // „Meine Nachbarin und seine Kinder“, „Mein Bruder und ihre Frau“: the owner beside a person is that person.
    const people = [c.subj, c.acc].filter((n) => n?.items?.length === 2);
    for (const n of people) {
      const [a, b] = n.items;
      const she = /(?:in|mutter|schwester|tochter|frau|tante|oma|mama|cousine|nichte)$/u.test(a.head || '');
      const he = /^(?:vater|bruder|sohn|mann|onkel|opa|papa|cousin|neffe|freund|nachbar|kollege|chef)$/u.test(a.head || '');
      if ((she && b.det === 'sein') || (he && b.det === 'ihr' && !b.formalDet)) return 'word';
    }
    // „Ich höre zu Musik.“: „zu“ is no preposition of „hören“.
    if (c.lemma === 'zuhören' && (c.elems || []).some((e) => e.kind === 'np' && OBJECT_OF.hören.test(e.head))) return 'word';
    // „Mein Hobby ist der Stuhl.“, „Mein Hobby ist Brot.“: a hobby is something one does.
    const hobbyNoun = (n) => headsOf(n).some((h) => ['hobby', 'hobbys', 'lieblingshobby'].includes(h)) && n.det === 'mein';
    const it = c.lemma === 'sein' ? (hobbyNoun(c.subj) ? c.pred : hobbyNoun(c.pred) ? c.subj : null) : null;
    if (it && env && it.kind === 'np' && !it.unknown?.length && ((it.det && !['der', 'kein'].includes(it.det)) || headsOf(it).some((h) => ['food', 'drink', 'furniture', 'day', 'number'].includes(env.kindOf(h))))) return 'word';
    const ownPps = pps(c).filter((p) => !p.attr);
    if (c.lemma === 'stehen' && !ownPps.some((p) => PLACE_PREPS.includes(p.prep) || p.prep === 'in') && !adv(c, 'hier', 'da', 'dort', 'drauf', 'oben', 'unten', 'links', 'rechts') && !c.subj?.kind?.match?.(/np|name|own/) && !c.question) return 'missing';
    if (c.lemma === 'rufen' && c.acc && ['np', 'name', 'own'].includes(c.acc.kind) && !pps(c, 'nach', 'um').length) return 'missing';
    if (c.lemma === 'laden' && c.acc && (['np', 'name', 'own'].includes(c.acc.kind) && headsOf(c.acc).some((h) => /^(?:freunde?|freundin(?:nen)?|familie|gäste|kollegen|kollegin|eltern|leute|nachbarn?)$/u.test(h)) || ['dich', 'euch', 'sie', 'ihn'].includes(c.acc.head))) return 'missing';
    const objectBy = OBJECT_OF[c.lemma];
    if (objectBy && !c.acc && ownPps.some((p) => ['zu', 'auf', 'mit', 'für', 'an'].includes(p.prep) && headsOf(p.np).some((h) => objectBy.test(h)))) return 'word';
    if (['anrufen', 'besuchen', 'fragen', 'treffen'].includes(c.lemma) && !c.acc && ownPps.some((p) => ['für', 'zu', 'mit', 'an'].includes(p.prep) && p.np.kind !== 'time' && p.np.kind !== 'place')) return 'word';
    // „einladen“ and „kommen“ take „zu“ for the party; one invites to the party, never to a day.
    const party = ownPps.filter((p) => headsOf(p.np).some((h) => FEST.has(h)));
    if (['einladen', 'kommen', 'mitkommen', 'gehen'].includes(c.lemma) && party.some((p) => !['zu', 'auf'].includes(p.prep) && !(p.prep === 'in' && c.lemma === 'gehen'))) return 'word';
    if (c.lemma === 'einladen' && pps(c, 'zu').some((p) => p.np.kind === 'date' || DAYS.includes(p.np.head))) return 'word';
    if (c.lemma === 'machen' && !c.acc && !c.wh && !c.passive && !(c.elems || []).some((e) => e !== c.subj && (['np', 'num', 'list'].includes(e.kind) || (e.kind === 'adv' && ['viel', 'wenig', 'nichts', 'alles', 'mehr', 'genug', 'was', 'das'].includes(e.word))))) return 'missing';
  }
  return null;
}
export function senseless(turn, sentences, env) {
  const kind = asked(turn)?.kind;
  const clauses = sentences.flatMap((x) => x.clauses).filter((c) => !c.around && !c.frag);
  if (['hobby', 'routine', 'did', 'order'].includes(kind)) return clauses.some((c) => !c.question && I(c) && (!plays(c, env) || !doable(c, env)));
  if (['buy', 'need', 'wish'].includes(kind)) return clauses.some((c) => !c.question && I(c) && c.acc && ['kaufen', 'nehmen', 'bestellen', 'möchten', 'wollen', 'brauchen'].includes(c.lemma) && headsOf(c.acc).some((h) => NO_GOODS.has(h) || ((FAMILY.has(h) || h === 'familie') && !(kind === 'wish' && c.acc.det === 'ein'))));
  if (['guests', 'birthday', 'phone'].includes(kind)) return clauses.length === 1 && ['sein', 'dein', 'ihr'].includes(clauses[0].subj?.det);
  return kind === 'age' && clauses.some(backwards);
}
const FREE_END = new Set(['pron', 'adv', 'pp', 'time']);
/**
 * Words without a verb behind a clause continue it: „und du?“, a time, a place with its preposition, or one more of what stands in
 * the clause. Anything else („Ich spreche Deutsch und Marokko.“) is not read as an answer.
 */
function looseEnd(list, q) {
  const said = list.filter((c) => !c.around);
  return said.some((c, i) => {
    const prev = said[i - 1];
    if (!c.frag || !prev || prev.frag) return false;
    // „Das ist ein Heft und ein Stift“: two things are „Das sind …“.
    if (c.joined === 'und' && prev.lemma === 'sein' && prev.pred && ['das', 'dies'].includes(prev.subj?.head) && c.elems[0]?.kind === 'np') return true;
    const kind = (e) => (e.kind === 'language' || (e.kind === 'np' && /(?:isch|^deutsch)$/u.test(e.head || '')) ? 'language' : e.kind);
    return !c.elems.every((e) => FREE_END.has(e.kind) || prev.elems.some((x) => kind(x) === kind(e)) || (e.kind === 'own' && q.kind === 'name') || (e.kind === 'num' && q.kind === 'age'));
  });
}
export function meaning(turn, sentences, env) {
  const q = asked(turn);
  const all = sentences.flatMap((s) => s.clauses.map((c) => ({ ...c, stop: s.stop })));
  const clauses = all.filter((c) => !c.around && !c.frag);
  const frags = all.filter((c) => c.frag);
  for (const c of clauses) c.all = clauses;
  clauses.forEach((c, i) => { const next = clauses[i + 1]; if (next?.zu) c.dependentVerb = next.lemma; });
  const addressed = addressOf(all, env.register);
  if (addressed) return { say: 'address' };
  // „Guten Tag, Herr Kaya!“ to Frau Kaya, „Tschüss, Frau Lena!“ to a friend.
  if (all.some((c) => c.frag && c.elems.some((e) => e.title))) return { say: all.some((c) => c.frag && c.elems.some((e) => e.title && e.calls && env.partnerNames.includes(e.calls))) ? 'address' : null };
  if (frags.some((c) => NPS(c).some((n) => ['tag', 'morgen', 'abend', 'nacht'].includes(n.head) && (n.adjs || []).includes('gut')))) return { say: 'ending' };
  if (frags.some((c) => c.adj.length && c.elems.every((e) => e.kind === 'adj')) && q && QUESTION_KINDS.includes(q.kind)) return { say: null };
  if (!pronounsFit(all, env)) return { say: 'pronoun' };
  if (!q) return { say: null };
  if (q.verbFirst && clauses.length && !clauses.some(c => c.question && !c.wh && !c.before && !c.sub)) return { say: 'task' };
  // A day named in a fragment or an earlier clause („Und am Freitag um zehn? Hast du da Zeit?“) counts for the clause that asks.
  const lone = [...frags, ...clauses];
  for (const c of clauses) c.all = lone;
  const placeBefore = lone.flatMap((c) => pps(c, 'nach')).map((p) => p.np.head)[0] || null;
  for (const c of clauses) c.elsewherePlace = placeBefore;
  const e2 = { ...env, mentioned: all.some((c) => (c.elems || []).some((e) => e.kind !== 'pron' && [...headsOf(e), ...headsOf(e.np)].filter(Boolean).some((h) => (q.things || []).some((t) => h === t || (t.length > 3 && h.endsWith(t)))))), thingGenders: env.gendersOf(q.main || (q.things || []).slice(0, 1)), elsewhere: (same) => frags.some((x) => x.elems.some((e) => same(e.verb || e.head))) };
  const yes = all.filter((c) => c.around && YES.test(c.around));
  const no = all.filter((c) => c.around && NO.test(c.around));
  const polarity = polarityOf(turn);
  // („Nein, das ist meine Schwester.“ names the person of the photo.)
  if (polarity === 'yes' && q.kind !== 'photo' && no.length && all[0]?.around && NO.test(all[0].around)) return { say: 'task' };
  if (polarity === 'no' && all[0]?.around && /^(?:ja|ja gern|ja gerne|ja klar|gern|gerne|sehr gern|aber gern|oh ja)$/u.test(all[0].around) && !no.length) return { say: 'task' };
  if (q.kind === 'message') {
    const named = clauses.some((c) => SAYING.name(c, q, e2));
    const born = clauses.some((c) => (birth(c) && !(c.lemma === 'geboren' && c.past) && timesOf(c).some((t) => env.isDate(t))) || (['geburtsdatum', 'geburtstag'].includes(c.subj?.head) && c.subj.det === 'mein' && c.pred?.kind === 'date' && env.isDate(c.pred)));
    // (How one feels belongs in no message to an office.)
    if (named && born) return { say: null, clauses }; // Per-sentence grading lives in messageResult, shared with single turns.
    return { say: clauses.length === 1 && !frags.length && (born || named) ? 'task' : null, clauses };
  }
  const test = ASKING[q.kind] || SAYING[q.kind];
  if (!test && !['greet', 'bye', 'wishDay'].includes(q.kind)) return { say: null };
  if (['greet', 'bye', 'wishDay'].includes(q.kind)) return { say: courtesy(q, all, clauses, frags) };
  const asks = QUESTION_KINDS.includes(q.kind);
  // A question is no statement: „Brauche ich einen Computer?“ answers nothing (a guest may ask for a thing, a host invite).
  const states = !asks && !['invite', 'order', 'accept', 'wish', 'join', 'agree'].includes(q.kind);
  // A grammatical refusal answers an open personal question. With a visible
  // naming requirement it misses the task, including kein + noun (not only nichts).
  if (!q.allowNothing && ['buy', 'need', 'wish'].includes(q.kind) && clauses.length
    && clauses.every((c) => !c.question && (c.acc?.head === 'nichts' || negated(c)) && test(c, { ...q, allowNothing: true }, e2))) return { say: 'task' };
  // A denial of a requested fact supplies no value for it. Negative replies still
  // answer questions about mood, appetite, availability, refusals and having no work.
  const permitsNegative = c => (q.kind === 'colour' && c.adj?.some(a => a.affirmed)) || ['mood', 'hungry', 'decline', 'accept', 'join', 'agree', 'did'].includes(q.kind)
    || (q.kind === 'hobby' && I(c) && c.lemma === 'haben' && c.acc?.neg && headsOf(c.acc).some(h => ['hobby', 'hobbys'].includes(h)))
    || (['buy', 'need', 'wish'].includes(q.kind) && q.allowNothing)
    || (['job', 'workWhen'].includes(q.kind) && notWorking(c) && !timesOf(c).length)
    || (q.kind === 'age' && !c.elems.some(e => e.kind === 'num' || (e.kind === 'time' && e.span) || (e.kind === 'np' && /^jahre?$/u.test(e.head))));
  // Negation belongs to the value being requested. An absent employer does not
  // cancel a positive profession ("als Lehrer bei keiner Schule").
  const deniedComplement = c => {
    const preps = { origin: c.lemma === 'geboren' ? ['in'] : ['aus'], live: ['in', 'bei', 'auf', 'an', 'zu'], job: ['als', 'bei', 'in', 'auf'], travel: ['nach', 'zu', 'in', 'an', 'auf'] }[q.kind];
    if (!preps || (q.kind === 'job' && c.pred?.job && !c.pred.neg)) return false;
    const values = own(c, ...preps);
    return values.length > 0 && values.every(p => p.neg || p.np?.neg);
  };
  const denies = c => !asks && (negated(c) || deniedComplement(c) || el(c, 'adv').some(e => e.degree === 'nicht' && ((q.kind === 'hobby' && ['gern', 'gerne', 'lieber'].includes(e.word)) || (q.kind === 'here' && HERE.includes(e.word)) || (q.kind === 'freeTime' && e.word === 'frei')))) && !permitsNegative(c);
  const candidates = clauses.filter((c) => !(states && c.question && !c.wh && I(c)) && test(c, q, e2));
  const matches = candidates.filter(c => !denies(c));
  // A contrast supplies the missing value using the same predicate: not X, but Y.
  const contrast = candidates.some(c => denies(c) && frags.some(f => f.joined === 'sondern' && (() => {
    const category = e => ['own', 'name', 'np', 'place', 'language', 'num'].includes(e.kind) ? 'noun' : e.kind;
    const elems = c.elems.filter(e => !e.neg && !(e.kind === 'adv' && ['nicht', 'nie', 'niemals'].includes(e.word)) && !f.elems.some(x => category(x) === category(e) && e !== c.subj)).concat(f.elems);
    const replace = n => n && !elems.includes(n) ? f.elems.find(e => e.combos) : n;
    const positive = { ...c, elems, pred: replace(c.pred), acc: replace(c.acc), adj: elems.filter(e => e.kind === 'adj') };
    return !negated(positive) && test(positive, q, e2);
  })()));
  if (!matches.length && clauses.some(c => denies(c) && test({ ...c, elems: c.elems.filter(e => !e.neg && !(e.kind === 'adv' && ['nicht', 'nie', 'niemals'].includes(e.word))), adj: (c.adj || []).map(a => ({ ...a, neg: false, degree: (a.degree || []).filter(d => d !== 'nicht') })) }, q, e2)) && !contrast) return { say: 'task', denied: true };
  if (contrast) matches.push(...candidates.filter(denies));
  const verbFirst = c => c.question && !c.wh && !c.before && !c.sub;
  const performsForm = c => verbFirst(c) || (c.sub === 'ob' && sentences.some(s => {
    const at = s.clauses.findIndex(x => x.start === c.start && x.end === c.end);
    return at > 0 && verbFirst(s.clauses[at - 1]);
  }));
  const hit = matches.filter(c => !q.verbFirst || performsForm(c));
  if (q.verbFirst && matches.length && !hit.length) return { say: 'task' };
  // A part of an answer without a verb: „Eine heiße Schokolade, bitte.“, „Nach Kiel. Dort wohnt mein Sohn.“
  const part = /einem Satz|ganze Sätze/.test(turn.taskDe || '') && !clauses.length ? null : FRAGMENTS[q.kind];
  if (!hit.length && q.kind === 'mood' && frags.some((c) => adjs(c).some((a) => COLOURS.has(a)))) return { say: null };
  if (!hit.length && part && frags.length && (q.kind === 'decline' || !no.length) && frags.some((x) => part(x, q, e2)) && frags.every((x) => part(x, q, e2) || x.elems.every((e) => ['adv', 'time', 'pp'].includes(e.kind))) && clauses.every((c) => !c.question && !negated(c))) return { say: 'yes', clauses: frags, all: clauses };
  // The task names its form („mit „Ich habe …““): another good sentence is not judged.
  if (q.withHave && hit.length && !hit.some((c) => c.perfect && c.reading?.lemma === 'haben')) return { say: null };
  if (hit.length && sentences.some((x) => looseEnd(x.clauses, q))) return { say: null };
  // A colour says nothing of how one is, or how old.
  if (!['colour', 'askColour', 'thing', 'buy', 'wish', 'need', 'askWhat', 'askPrice', 'order', 'guests'].includes(q.kind) && [...hit, ...frags].some((c) => adjs(c).some((a) => COLOURS.has(a)))) return { say: null };
  // What shares its subject with a question is asked too; a verb is not said twice.
  if (hit.length && clauses.some((c, i) => c.sharedSubj && ((asks && !hit.includes(c)) || c.lemma === clauses[i - 1]?.lemma))) return { say: null };
  if (hit.length) {
    if (asks && clauses.some((c) => c.question && c.wh && !hit.includes(c) && !ASKING[q.kind](c, q, e2)) && q.kind !== 'askMood' && clauses.filter((c) => c.question).length > 1 && !hit.some((h) => h.question || h.sub)) return { say: null };
    if (q.kind === 'invite') {
      const w = whenFits(lone, q.when);
      if (w === 'other') return { say: 'task' };
      const party = clauses.some((c) => ['feiern', 'mitfeiern', 'einladen'].includes(c.lemma) || headsOf(c.acc).concat(headsOf(c.subj), headsOf(c.pred), pps(c).map((p) => p.np.head)).some((h) => FEST.has(h)) || c.state === 'einladen' || adjs(c).includes('eingeladen'));
      if (w !== 'full' && !party) return { say: null };
    }
    if (['agree', 'join'].includes(q.kind) && whenFits(lone, q.when) === 'other') return { say: 'task' };
    // Beside the answer, a sentence that denies it or tells another story is not judged.
    return { say: 'yes', clauses: hit, all: clauses };
  }
  // „Einverstanden, bis dann!“, „Das ist nett, ja, bitte.“: the yes alone answers.
  if (['accept', 'agree'].includes(q.kind) && !clauses.length && !frags.length && !no.length && yes.some((y) => /^(?:ja|ja klar|ja gern|ja gerne|klar|na klar|gern|gerne|sehr gern|sehr gerne|aber gern|aber gerne|okay|ok|einverstanden|abgemacht|alles klar|super|prima|perfekt|natürlich|auf jeden fall|toll)$/u.test(y.around))) return { say: 'yes', clauses: [], all: clauses };
  // (A bare „Nein.“ is not polite.)
  const polite = all.some((c) => c.around && /danke|dank|leider|nett|später|ander|leid/u.test(c.around));
  if (q.kind === 'decline' && no.length && (polite || clauses.length) && !yes.some((y) => /^(?:ja|gern|gerne)/.test(y.around)) && clauses.every((c) => !c.question && !wants(c, e2) && !(c.lemma === 'haben' && c.acc?.kind === 'pron' && /^kein/u.test(c.acc.head))) && frags.every((x) => (x.elems.some((e) => e.kind === 'adv' && ['nur', 'lieber'].includes(e.word)) && NPS(x).length > 0 && NPS(x).every((n) => fare(n, e2) && n.combos?.some((k) => k.c === 'a'))) || (x.neg && NPS(x).every((n) => fare(n, e2)) && (NPS(x).length > 0 || x.elems.length > 1)) || (x.elems.every((e) => ['adv', 'time', 'pp'].includes(e.kind)) && (x.elems.some((e) => e.kind !== 'time' && e.word !== 'nicht') || x.elems.every((e) => e.rel))))) return { say: 'yes', clauses, all: clauses };
  // „Im Moment nicht, danke.“
  if (q.kind === 'decline' && polite && !clauses.length && frags.length === 1 && !yes.some((y) => /^(?:ja|gern|gerne)/.test(y.around)) && frags[0].elems.length > 1 && frags[0].elems.every((e) => ['adv', 'time'].includes(e.kind)) && frags[0].elems.some((e) => e.word === 'nicht') && frags[0].elems.every((e) => e.kind !== 'adv' || ['nicht', 'jetzt', 'heute', 'im moment', 'zurzeit', 'noch', 'leider', 'gerade', 'momentan', 'aber'].includes(e.word))) return { say: 'yes', clauses: [], all: clauses };
  // „Alles klar, bis Freitag um zehn!“
  if (q.kind === 'agree' && !clauses.length && !no.length && frags.length === 1 && yes.length && frags[0].elems.every((e) => e.kind === 'time') && frags[0].elems.length === 1 && ['full', 'part'].includes(whenFits(frags, q.when))) return { say: 'yes', clauses: [], all: clauses };
  if (['accept', 'agree', 'join'].includes(q.kind) && yes.some((y) => !/^(?:danke|bitte|vielen dank)$/u.test(y.around)) && !no.length && clauses.length && clauses.every((c) => !negated(c) && !c.question) && q.kind !== 'join') {
    // „Ja, gern, ich freue mich.“: the yes answers, the rest is read and says nothing against it.
    if (q.kind === 'agree' && whenFits(lone, q.when) === 'other') return { say: 'task' };
    if (clauses.some((c) => I(c) && ((['möchten', 'nehmen', 'wollen'].includes(c.lemma) && !c.acc) || (c.lemma === 'sein' && c.pred?.kind === 'np' && !c.pred.job) || (q.kind === 'accept' && c.lemma === 'haben' && !c.polite && headsOf(c.acc).some((h) => q.things.includes(h)))))) return { say: null };
    if (q.kind === 'accept' && clauses.some((c) => I(c) && c.acc && ['möchten', 'nehmen', 'trinken', 'wollen', 'essen'].includes(c.lemma))) return { say: clauses.some((c) => c.acc && env.known(c.acc.head)) ? 'word' : null };
    if (clauses.every((c) => !OTHER.some(([, t]) => t(c)) && (I(c) || ['das', 'es', 'wir'].includes(c.subj?.head) || (c.subj && (q.things || []).includes(c.subj.head)) || c.imperative))) return { say: 'yes', clauses, all: clauses };
  }
  return { say: off(turn, q, clauses, frags, asks, e2, lone) };
}

const NPS = (x) => x.elems.filter((e) => e.combos);
const FRAGMENTS = {
  order: (x, q, env) => NPS(x).length > 0 && NPS(x).every((n) => n.combos.some((c) => c.c === 'a') && !n.neg && headsOf(n).every((h) => { const k = h === 'schokolade' && (n.adjs || []).includes('heiss') ? 'drink' : env.kindOf(h); return k && q.things.includes(k); })),
  accept: (x, q) => !x.neg && x.elems.length > 0 && (NPS(x).length ? NPS(x).every((n) => n.combos.some((c) => c.c === 'a') && headsOf(n).some((h) => q.things.some((t) => h === t || h.endsWith(t)))) : x.elems.every((e) => e.kind === 'pp' && ['ohne', 'mit'].includes(e.prep))),
  decline: (x, q, env) => x.neg && NPS(x).length > 0 && NPS(x).every((n) => n.combos.some((c) => c.c === 'a') && fare(n, env)),
  travel: (x) => x.elems.some((e) => e.kind === 'pp' && e.prep === 'nach' && (e.home || ['place', 'own'].includes(e.np.kind))),
  birthday: (x, q, env) => !NPS(x).length && timesOf(x).some((t) => (t.date || t.month) && (!t.date || !(t.month || t.numeric) || env.dayExists(t))),
  clock: (x, q) => !NPS(x).length && timesOf(x).some((t) => t.h !== undefined) && SAYING.clock({ ...x, lemma: 'sein', subj: { head: 'es' } }, q),
  mood: (x) => (x.adj.length > 0 && !x.adj.some((a) => a.degree?.includes('so') && !a.degree.includes('nicht'))) || x.elems.some((e) => e.kind === 'adv' && ['gut', 'super', 'prima', 'schlecht', 'besser', 'in ordnung'].includes(e.word) || (e.word === 'so gut' && x.neg)),
  wish: (x) => NPS(x).length > 0 && NPS(x).every((n) => n.kind === 'np' && n.combos.some((c) => c.c === 'a')),
  name: (x) => x.elems.length > 0 && x.elems.some((e) => ['own', 'name'].includes(e.kind)) && x.elems.every((e) => ['own', 'name'].includes(e.kind) || (e.kind === 'adv' && ['hier', 'am apparat', 'am telefon'].includes(e.word)) || (e.kind === 'pp' && e.prep === 'an' && ['apparat', 'telefon'].includes(e.np.head))),
};
const HELLO = /^(?:(?:schönen |einen schönen )?guten (?:tag|morgen|abend)|hallo|hi|hey|moin|servus|grüss gott)$/u;
const GOODBYE = /^(?:auf wiedersehen|tschüss|tschüs|ciao|bis (?:bald|dann|später|gleich|morgen|zum nächsten mal)|mach es gut|pass auf dich auf)$/u;
const NICE_DAY = /^(?:einen )?schönen tag(?: noch)?$/u;
/** Greetings, goodbyes and a wish: what stands around an answer is the answer here, and every sentence beside it goes with it. */
function courtesy(q, all, clauses, frags) {
  const arounds = all.filter((c) => c.around && !c.address).map((c) => c.around);
  const until = (x) => x.elems.every((e) => e.kind === 'time' || (e.kind === 'pp' && (e.prep === 'bis' || e.until)));
  // („Dann noch einen schönen Tag!“, „Viel Spaß und schönen Tag noch!“, „Einen schönen Tag noch und bis Samstag!“)
  const niceDay = (x) => NPS(x).some((n) => n.head === 'tag' && n.combos.some((k) => k.c === 'a') && (n.adjs || []).some((a) => /^(?:wunder)?(?:schön|toll|gut|super)$/u.test(a)) && (!n.det || n.det === 'ein')) && x.elems.every((e) => (e.combos && e.head === 'tag') || (e.kind === 'adv' && ['dann', 'noch', 'auch'].includes(e.word)) || (e.kind === 'pron' && e.head === 'dir'));
  if (q.kind === 'wishDay' && !clauses.length && frags.length && frags.every((x) => until(x) || niceDay(x)) && (frags.some(niceDay) || arounds.some((x) => NICE_DAY.test(x)))) return 'yes';
  if (frags.some((x) => !(q.kind === 'bye' && until(x)))) return null;
  // One says „Auf Wiederhören“ on the telephone only.
  if (q.kind === 'bye' && arounds.includes('auf wiederhören')) return 'word';
  if (q.kind === 'greet') {
    if (arounds.some((x) => GOODBYE.test(x))) return 'task';
    const greets = arounds.some((x) => HELLO.test(x)) || clauses.some((c) => I(c) && ['grüßen', 'begrüßen'].includes(c.lemma));
    const beside = clauses.every((c) => (I(c) && ['grüßen', 'begrüßen', 'freuen', 'heißen'].includes(c.lemma)) || SAYING.name(c) || ASKING.askMood(c));
    return greets && beside ? 'yes' : null;
  }
  if (q.kind === 'bye') {
    if (arounds.length && arounds.every((x) => HELLO.test(x)) && !clauses.length) return 'task';
    if (clauses.length && whenFits(clauses, q.when) === 'other') return null;
    const meets = (c) => (c.imperative && ['kommen', 'aufpassen', 'machen', 'genießen'].includes(c.lemma)) || (c.subj?.head === 'wir' && ['sehen', 'treffen', 'hören'].includes(c.lemma)) || (I(c) && ['wünschen', 'müssen', 'gehen', 'freuen'].includes(c.lemma));
    if (!arounds.some((x) => GOODBYE.test(x))) return null;
    if (!clauses.length) return arounds.every((x) => GOODBYE.test(x) || NICE_DAY.test(x) || /^(?:komm gut nach hause|kommen sie gut nach hause)$/u.test(x) || /^(?:ja|okay|ok|gut|danke|vielen dank|alles gute|viel spass|gern|super|prima|klar|schönen abend(?: noch)?|einen schönen abend noch)$/u.test(x)) ? 'yes' : null;
    return clauses.every((c) => meets(c) && !c.question) ? 'yes' : null;
  }
  if (clauses.some((c) => I(c) && c.lemma === 'wünschen' && c.dat?.head === 'dir' && headsOf(c.acc).includes('tag') && (c.acc.adjs || []).some((a) => /^(?:wunder)?(?:schön|toll|gut|super|prima|angenehm)$/u.test(a)))) return 'yes';
  if (arounds.length && arounds.every((x) => /^gute nacht$|^hallo$|^guten morgen$/u.test(x)) && !clauses.length) return 'task';
  return arounds.some((x) => NICE_DAY.test(x)) && clauses.every((c) => I(c) && c.lemma === 'wünschen') ? 'yes' : null;
}

/** Read in full and not the answer: is it certainly another one? */
function off(turn, q, clauses, frags, asks, env, lone) {
  // („Sie ist noch nicht jung“ answers, only the wrong way round: not judged.)
  if (q.kind === 'age' && clauses.some(backwards)) return null;
  if (!clauses.length) {
    // An answer of words without a verb where the task asks for a sentence („Aus Syrien.“, „Um sieben.“, „Rot.“).
    if (frags.length && /einem Satz|ganze Sätze/.test(turn.taskDe || '') && frags.every((x) => x.elems.length && x.elems.every((e) => ['pp', 'time', 'adj', 'np', 'place', 'language', 'num', 'adv', 'own', 'name'].includes(e.kind)))) return 'sentence';
    if (q.kind === 'agree' && frags.length && whenFits(frags, q.when) === 'other') return 'word';
    if (q.kind === 'order' && frags.length && frags.every((x) => NPS(x).length && NPS(x).every((n) => headsOf(n).every((h) => { const k = env.kindOf(h); return (k === 'drink' || k === 'food') && !q.things.includes(k); })))) return 'word';
    return null;
  }
  if (asks) {
    const questions = clauses.filter((c) => c.question || c.sub || c.stop === '?');
    if (questions.length) {
      // Another destination, another time: the question is right and what it names is not.
      if (q.kind === 'askTrain' && questions.some((c) => own(c, 'nach').some((p) => p.np.kind === 'place' && p.np.head !== q.place && ASKING.askTrain(c, { ...q, place: p.np.head }, env)))) return 'word';
      if (['askFree', 'askShop'].includes(q.kind) && questions.some((c) => whenFits([c], q.when) === 'other' && ASKING[q.kind]({ ...c, all: [c] }, { ...q, when: sameWhen(c) }, env))) return 'word';
      // A turn that asks yes or no is not answered by „wann“, „wo“ or „was“.
      if (['askTrain', 'askShop', 'askLike', 'askHave'].includes(q.kind) && questions.every((c) => c.wh && ['wann', 'wo', 'was', 'warum', 'wer', 'wohin', 'woher', 'wie lange', 'um wie viel uhr', 'wie viel'].includes(wh(c)) && !c.sub)) return 'task';
      if (q.kind === 'askDid' && questions.every((c) => !c.perfect && !c.past && timesOf(c).some((t) => ['morgen', 'heute', 'übermorgen'].includes(t.rel)))) return 'task';
      if (q.kind !== 'askWhat' && questions.every((c) => wh(c) === 'wie' && c.lemma === 'heißen')) return 'task';
      if (q.kind === 'askLike') {
        const same = (l) => l && fold(l).slice(0, 3) === q.verb.slice(0, 3);
        const c = questions.length === 1 && !frags.length ? questions[0] : null;
        const gern = c && adv(c, 'gern', 'gerne', 'so gern', 'so gerne');
        if (c && !c.wh && c.subj?.head === 'du' && same(c.lemma) && !gern && !c.modal && el(c, 'adv').length === 0) return 'missing';
        if (c && !c.wh && c.subj?.head === 'du' && c.modal === 'können' && same(c.lemma)) return 'task';
        if (c && !c.wh && c.subj?.head === 'du' && same(c.lemma) && !gern && !c.modal && adv(c, 'gut', 'oft', 'viel')) return 'task';
        if (c && !c.wh && gern && same(c.lemma) && ['er', 'sie'].includes(c.subj?.head)) return 'word';
        if (c && !c.wh && gern && c.subj?.head === 'du' && !['machen', 'tun', 'mögen', 'gehen', 'lernen'].includes(c.lemma) && !c.modal) return 'word';
      }
      if (q.kind === 'askShop' && questions.every((c) => c.going && c.subj?.head === 'du' && c.lemma !== 'einkaufen' && !c.wh)) return 'word';
      if (q.kind === 'askColour' && questions.some((c) => c.subj?.wh && c.acc && isThing(c.acc, q, env))) return 'case';
      if (['askPrice', 'askPlace', 'askWhen', 'askWhat'].includes(q.kind) && questions.every((c) => !c.wh && c.lemma === 'sein' && c.subj && adjs(c).length)) return 'task';
      if (q.kind === 'askClock' && questions.length === 1 && whNoun(questions[0]) === 'uhr') return 'word';
      if (q.kind === 'askOrigin' && questions.every((c) => wh(c) === 'woher' && ['kommen', 'sein'].includes(c.lemma) && c.subj?.head === 'du')) return 'word';
      if (q.kind === 'askJob' && questions.length === 1 && ['er', 'sie'].includes(questions[0].subj?.head) && !questions[0].subj.formal && ASKING.askJob({ ...questions[0], subj: { ...questions[0].subj, head: 'du', formal: false } }, q, env)) return 'word';
      // „Was machst du gestern?“, „Was hast du morgen gemacht?“
      if (q.kind === 'askDid' && questions.length === 1 && wh(questions[0]) === 'was' && questions[0].subj?.head === 'du' && ['machen', 'tun'].includes(questions[0].lemma)) {
        if (!questions[0].perfect && !questions[0].past && timesOf(questions[0]).some((t) => t.rel === 'gestern')) return 'verb';
        if (questions[0].perfect && timesOf(questions[0]).some((t) => t.rel === 'morgen')) return 'word';
      }
      // „Kommt der Zug aus Österreich?“
      if (q.kind === 'askTrain' && questions.length === 1 && own(questions[0], 'aus', 'von').some((p) => p.np.kind === 'place')) return 'word';
      // Another question word makes it the question („Wo kommen deine Eltern?“, „Wie kostet die Uhr?“): the word is the wrong one.
      if (questions.length === 1 && !frags.length && typeof questions[0].wh?.word === 'string' && ['was', 'wie', 'wo', 'wer', 'wann', 'woher', 'wohin'].includes(wh(questions[0])) && !(OWN_WORDS[q.kind] || []).filter((w) => !(w === 'wo' && questions[0].lemma === 'kommen')).includes(wh(questions[0]))
        && ['was', 'wie', 'wo', 'wann', 'woher', 'wie viel'].some((w) => w !== wh(questions[0]) && ASKING[q.kind]({ ...questions[0], wh: { ...questions[0].wh, word: w } }, q, env))) return 'word';
      // The thing asked about is another noun the check knows („Was kostet der Fisch?“, „Welche Farbe hat dein Bauch?“).
      const loose = questions.filter((c) => ASKING[q.kind](c, { ...q, things: q.things ? env.anyThing(c) : undefined, place: undefined, when: undefined, mine: true, byPronoun: true }, { ...env, thingGenders: ['der', 'die', 'das', 'pl'] }));
      if (q.things && loose.length) {
        const n = loose[0];
        const named = [n.subj, n.acc, ...pps(n).map((p) => p.np)].filter((x) => x && x.kind === 'np' && x.head !== 'farbe' && !x.wh);
        if (named.some((x) => !headsOf(x).some((h) => q.things.includes(h)) && env.known(x.head))) return 'word';
        if (named.length === 0) return 'pronoun';
        return null;
      }
      if (q.kind === 'askDid' && questions.some((c) => c.perfect && wh(c) === 'was' && timesOf(c).some((t) => t.day))) return null;
      const other = questions.every((c) => QUESTION_KINDS.some((k) => k !== q.kind && generic(k, c, env)) || simpleQuestion(c, q));
      return other ? 'task' : null;
    }
    if (!lone.some((c) => c.stop === '?') && clauses.every((c) => !c.question && !c.sub && c.subj && (isThing(c.subj, q, env) || (c.subj.det === 'mein' && q.kind !== 'askPlace')) && c.lemma !== 'interessieren' && !c.perfect)) return 'task';
    if (['askHave', 'askPrice'].includes(q.kind) && !lone.some((c) => c.stop === '?') && clauses.every((c) => I(c) && ['möchten', 'nehmen', 'wollen'].includes(c.lemma) && c.acc?.kind === 'np')) return 'task';
    if (['askFree', 'askShop', 'askTrain'].includes(q.kind) && !lone.some((c) => c.stop === '?') && clauses.every((c) => !c.question && !c.sub && c.subj && (I(c) || ['zug', 'er'].includes(c.subj.head)) && !c.modal && !['wissen', 'fragen', 'hoffen', 'glauben', 'denken', 'brauchen', 'suchen'].includes(c.lemma))) return 'task';
    const tells = !lone.some((c) => c.stop === '?') && clauses.every((c) => I(c) && !c.wh && !['suchen', 'brauchen', 'wissen', 'fragen', 'finden', 'möchten', 'wünschen', 'haben', 'sehen', 'kennen', 'hoffen', 'interessieren', 'glauben', 'denken'].includes(c.lemma) && !(c.modal === 'möchten' && ['wissen', 'fragen'].includes(c.lemma)));
    if (tells && ['askLike', 'askHave', 'askPrice', 'askPlace', 'askHobby'].includes(q.kind)) return 'task';
    if (q.kind === 'askFree' && clauses.every((c) => c.subj?.head === 'du' && !c.question) && clauses.at(-1).stop === '.') return 'task';
    // „Du kochst gern.“, „Am Samstag kaufst du ein.“: the question has its verb first.
    if (['askLike', 'askShop', 'askFree'].includes(q.kind) && clauses.length === 1 && !frags.length && clauses[0].subj?.head === 'du' && !clauses[0].question && !clauses[0].wh && clauses[0].stop !== '?' && ASKING[q.kind]({ ...clauses[0], question: true, stop: '?' }, q, env)) return 'order';
    return null;
  }
  if (clauses.some((c) => c.question)) return null;
  // „Mache morgens Sport.“: with „ich“ it is the answer, so the subject is what is missing.
  if (q.kind !== 'invite' && clauses.some((c) => c.imperative && !c.subj && SAYING[q.kind]?.({ ...c, imperative: false, subj: { head: 'ich', kind: 'pron', agr: 'ich', combos: [{ c: 'n' }] } }, q, env))) return 'missing';
  // „Ja, du kommst mit.“, „Ja, er hat Durst.“: the answer, said of someone else.
  // „Ich möchte Hunger.“, „Ich habe einen Kaffee, bitte.“, „Ich bin Suppe.“, „Ich bin 0176 …“, „Sie ist Arabisch.“: the verb of another sentence.
  if (clauses.length === 1 && !frags.length) {
    const [c] = clauses;
    if (q.kind === 'hungry' && I(c) && !c.modal && !negated(c) && ['möchten', 'wollen', 'brauchen', 'nehmen'].includes(c.lemma) && headsOf(c.acc).some((h) => ['hunger', 'durst'].includes(h))) return 'verb';
    if (q.kind === 'order' && I(c) && c.lemma === 'haben' && !c.polite && !c.modal && !negated(c) && !c.perfect && c.acc && headsOf(c.acc).every((h) => ['food', 'drink'].includes(env.kindOf(h)))) return 'verb';
    if (['order', 'accept', 'need', 'buy', 'wish', 'hobby', 'routine'].includes(q.kind) && I(c) && c.lemma === 'sein' && !c.perfect && c.pred?.kind === 'np' && !c.pred.job && !c.pred.unknown?.length && env.known(c.pred.head) && !env.person(c.pred.head, c.pred)) return 'verb';
    if (q.kind === 'hobby' && c.lemma === 'sein' && headsOf(c.subj).includes('hobby') && c.subj.det === 'mein' && headsOf(c.pred).some((h) => FAMILY.has(h))) return 'word';
    if (q.kind === 'phone' && c.subj?.head === 'ich' && c.lemma === 'sein' && (c.pred?.kind === 'phone' || (c.elems || []).some((e) => e.kind === 'phone'))) return 'word';
    if (q.kind === 'language' && ['sein', 'haben'].includes(c.lemma) && (q.third ? third(c, q) : I(c)) && ((c.pred?.kind === 'language') || (c.acc?.kind === 'language') || (c.pred && env.isLanguage(c.pred.head)))) return 'verb';
    if (q.kind === 'here' && ['ich', 'du'].includes(c.subj?.head) && c.lemma === 'sein' && adv(c, ...HERE)) return 'word';
    if (q.kind === 'guests' && c.subj?.head === 'ich' && c.lemma === 'kommen') return 'word';
    if (q.kind === 'invite' && c.lemma === 'einladen' && !negated(c) && !c.question && ((c.subj?.head === 'du' && c.acc?.head === 'mich') || (I(c) && ['ihn', 'sie', 'euch', 'ihnen'].includes(c.acc?.head)))) return 'word';
    if (q.kind === 'invite' && c.lemma === 'einladen' && I(c) && !c.acc && !c.dat && !c.refl && pps(c, 'zu').length) return 'missing';
    if (q.kind === 'name' && c.lemma === 'heißen' && ['er', 'sie', 'du'].includes(c.subj?.head) && ['own', 'name'].includes(c.pred?.kind)) return 'word';
  }
  const said = (head) => clauses.length === 1 && Boolean(SAYING[q.kind]?.({ ...clauses[0], all: null, subj: { head, kind: 'pron', agr: head, combos: [{ c: 'n' }] }, reading: { ...clauses[0].reading, persons: [head === 'ich' ? 'ich' : 'er'] } }, q, env));
  if (['hungry', 'join', 'need', 'buy', 'order', 'getUp', 'freeTime', 'did', 'travel', 'wish', 'accept', 'routine', 'hobby', 'workWhen', 'live', 'origin', 'job', 'language'].includes(q.kind) && !q.third && clauses.length === 1 && clauses[0].subj?.kind === 'pron' && ['du', 'er', 'wer', 'sie'].includes(clauses[0].subj.head)
    && said('ich')) return 'word';
  // „Ich komme aus Syrien.“ where she is asked about; „Er ist meine Mutter.“, „Sie ist mein Bruder.“
  if (q.third && ['origin', 'age', 'language'].includes(q.kind) && clauses.length === 1 && ['ich', 'du'].includes(clauses[0].subj?.head) && clauses[0].subj.kind === 'pron' && said(q.third)) return 'word';
  if (q.kind === 'photo' && clauses.length === 1 && clauses[0].lemma === 'sein' && clauses[0].pred?.kind === 'np' && ((clauses[0].subj?.head === 'er' && PERSON_GENDER[clauses[0].pred.head]?.[0] === 'die') || (clauses[0].subj?.head === 'sie' && PERSON_GENDER[clauses[0].pred.head]?.[0] === 'der'))) return 'word';
  if (q.third && clauses.every((c) => third(c, q) && (['wohnen', 'leben', 'heißen', 'sprechen', 'arbeiten'].includes(c.lemma) || (c.lemma === 'kommen' && pps(c, 'aus').length) || (c.lemma === 'sein' && (adjs(c).length || headsOf(c.pred).includes('jahre')))))) return 'task';
  if (q.kind === 'language' && !q.third && clauses.every((c) => c.lemma === 'sprechen' && ['er', 'sie', 'du'].includes(c.subj?.head))) return 'word';
  if (q.kind === 'colour' && clauses.some((c) => c.lemma === 'sein' && c.subj?.det === 'dein' && adjs(c).some((a) => COLOURS.has(a)))) return 'word';
  if (q.kind === 'colour' && clauses.every((c) => ['sein', 'liegen'].includes(c.lemma) && adv(c, 'hier', 'da', 'dort') && !adjs(c).length)) return 'task';
  if (q.kind === 'mood' && clauses.some((c) => I(c) && c.lemma === 'sein' && !c.perfect && (adv(c, 'gut', 'sehr gut') || adjs(c).some((a) => a === 'gut')) && !c.pred)) return 'sentence';
  // The turn's own sentence with another filling.
  if (q.kind === 'hungry' && !frags.length && clauses.every((c) => I(c) && c.lemma === 'haben' && !negated(c) && headsOf(c.acc).some((h) => ['hunger', 'durst'].includes(h)) && !headsOf(c.acc).some((h) => q.wants.includes(h)))) return 'task';
  if (q.kind === 'hungry' && clauses.some((c) => I(c) && c.lemma === 'haben' && c.acc && !headsOf(c.acc).some((h) => ['hunger', 'durst'].includes(h)) && env.known(c.acc.head))) return 'word';
  if (['hungry', 'agree', 'join', 'accept'].includes(q.kind) && clauses.some((c) => I(c) && negated(c))) return 'task';
  if (q.kind === 'hungry' && q.wants.length > 1 && clauses.length && clauses.every((c) => c.needs)) return frags.length || clauses.length === 1 ? 'task' : null;
  if (['agree', 'join', 'invite'].includes(q.kind) && whenFits(lone, q.when) === 'other') return 'task';
  if (q.kind === 'order' && clauses.some((c) => I(c) && c.acc && headsOf(c.acc).some((h) => { const k = env.kindOf(h); return k && !q.things.includes(k); }))) return 'word';
  if (q.kind === 'colour' && clauses.every((c) => c.lemma === 'sein' && adjs(c).length && !adjs(c).some((a) => COLOURS.has(a)))) return 'task';
  if (q.kind === 'age' && clauses.every((c) => c.lemma === 'sein' && adjs(c).length && c.subj?.head !== 'ich')) return 'task';
  if (q.kind === 'here' && clauses.every((c) => ['sein', 'liegen', 'stehen'].includes(c.lemma) && !adv(c, ...HERE))) return 'task';
  if (q.kind === 'here' && clauses.some((c) => c.subj?.det === 'dein')) return 'word';
  if (q.kind === 'photo' && clauses.every((c) => c.lemma === 'sein' && c.pred?.kind === 'np' && c.subj?.head === 'das' && env.known(c.pred.head))) return clauses.some((c) => ['dein', 'ihr', 'sein'].includes(c.pred.det)) ? 'word' : 'task';
  if (q.kind === 'phone' && clauses.some((c) => headsOf(c.subj).some((h) => /nummer$/u.test(h)) && ['ihr', 'dein'].includes(c.subj.det))) return 'word';
  if (q.kind === 'birthday' && clauses.every((c) => headsOf(c.subj).includes('geburtstag') && !timesOf(c).length && (adjs(c).length || el(c, 'adv').length) && c.pred?.kind !== 'date')) return 'task';
  if (q.kind === 'travel' && clauses.some((c) => I(c) && ['fahren', 'reisen', 'fliegen', 'gehen'].includes(c.lemma) && pps(c, 'in', 'zu', 'auf', 'an').some((p) => p.np.kind === 'place'))) return 'word';
  if (clauses.some((c) => I(c) && c.lemma === 'stehen' && timesOf(c).some((t) => t.h !== undefined) && !pps(c).length)) return 'missing';
  if (q.kind === 'clock' && clauses.some((c) => c.lemma === 'sein' && c.subj?.head === 'es' && timesOf(c).some((t) => t.h !== undefined))) return 'word';
  if (q.kind === 'routine' && clauses.every((c) => I(c) && timesOf(c).some((t) => PM.has(t.part)))) return 'task';
  if (q.kind === 'mood' && clauses.some((c) => I(c) && c.lemma === 'gehen')) return 'sentence';
  if (q.kind === 'guests' && clauses.every((c) => I(c) && ['kaufen', 'kochen', 'machen', 'arbeiten'].includes(c.lemma))) return 'task';
  if (q.kind === 'invite' && clauses.every((c) => I(c) && !c.question && !['einladen', 'wünschen', 'freuen', 'hoffen'].includes(c.lemma))) return 'task';
  if (q.kind === 'getUp' && q.byClock && clauses.every((c) => I(c) && c.lemma === 'aufstehen' && !timesOf(c).some((t) => t.h !== undefined) && !negated(c)) && !frags.length) return 'task';
  if (q.kind === 'getUp' && clauses.every((c) => I(c) && c.lemma === 'stehen')) return 'missing';
  const near = NEAR[q.kind] || [];
  const labels = clauses.map((c) => OTHER.filter(([, t]) => t(c)).map(([n]) => n));
  if (labels.every((l) => l.length && !l.some((n) => near.includes(n) || n === q.kind))) return 'task';
  return null;
}
/** The day and time a clause names, as a turn writes them. */
function sameWhen(c) {
  const t = timesOf(c);
  const day = t.map((e) => e.day).find(Boolean) || '';
  const clock = t.find((e) => e.h !== undefined);
  return `${day || 'montag'}${clock ? ` ${clock.h}:${String(clock.m || 0).padStart(2, '0')}` : ''}`;
}
/** A question of another kind, whatever thing it is about. */
function generic(kind, c, env) {
  const q = { kind, things: env.anyThing(c), verb: '§', when: undefined, place: undefined, mine: true, byPronoun: true };
  if (['askFree', 'askShop', 'askTrain', 'askLike', 'askHave'].includes(kind)) return false;
  // (A question with „wann“ is another one only where its thing is named: „Wann beginnt der Kurs?“)
  if (kind === 'askWhen' && !c.wh) return false;
  return Boolean(ASKING[kind](c, q, { ...env, thingGenders: ['der', 'die', 'das', 'pl'] }));
}
// Plain questions with a w-word: who, where, when, how old, how big … (what is asked stands in the word itself).
const OWN_WORDS = { askPlace: ['wo', 'wohin'], askOrigin: ['woher', 'wo'], askJob: ['wo'], askHobby: ['wo', 'wie oft'], askTrain: ['wohin'], askDid: ['wo', 'wohin'], askClock: [], askPrice: [] };
const simpleQuestion = (c, q) => Boolean(c.wh && c.lemma) && ['wer', 'wo', 'warum', 'woher', 'wohin', 'wie alt', 'wie gross', 'wie lange', 'wie oft'].includes(c.wh.word) && !(OWN_WORDS[q.kind] || []).includes(c.wh.word);

/** What the turn's answers begin with: all with yes, all with no, or neither. */
function polarityOf(turn) {
  const frames = (turn.accepted || []).map(frameText);
  if (frames.some((f) => /^Nein/.test(f)) && !frames.some((f) => /^Ja/.test(f))) return 'no';
  if (frames.some((f) => /^Ja/.test(f)) && !frames.some((f) => /^Nein/.test(f))) return 'yes';
  return null;
}

/** du for Sie or Sie for du anywhere in it. */
function addressOf(all, register) {
  if (!register) return false;
  const pron = (c) => (c.elems || []).flatMap((e) => (e.np ? [e.np] : e.items || [e])).filter((n) => n?.kind === 'pron');
  const dets = (c) => (c.elems || []).flatMap((e) => (e.np ? [e.np] : e.items || [e])).filter((n) => n?.kind === 'np');
  for (const c of all) {
    if (dets(c).some((n) => (register === 'du' ? n.formalDet : n.det === 'dein'))) return true;
    if (register === 'Sie') {
      if (c.imperative && !c.subj) return true;
      if (c.around && /^(?:sag mal|schau mal|guck mal|hör mal|warte mal|entschuldige|entschuldige bitte|mach es gut|pass auf dich auf|danke dir)$/u.test(c.around)) return true;
      if (pron(c).some((n) => ['du', 'dich', 'dir'].includes(n.head))) return true;
    } else {
      if (c.around && /^(?:entschuldigen sie|entschuldigen sie bitte|machen sie es gut|danke ihnen)$/u.test(c.around)) return true;
      if (pron(c).some((n) => n.formal === true)) return true;
      if (c.question && !c.wh && c.subj?.head === 'sie' && c.subj.formal && c.reading?.persons?.includes('sie')) return true;
    }
  }
  return false;
}

/** er, sie, es take up a noun of the answer (or of the cue) in its gender. */
function pronounsFit(all, env) {
  let nouns = [];
  for (const c of all) {
    const p = c.subj;
    if (p?.kind === 'pron' && ['er', 'sie', 'es'].includes(p.head) && p.formal !== true && nouns.length) {
      const impersonal = p.head === 'es' && (['sein', 'geben', 'gehen', 'regnen', 'schneien', 'passen', 'heißen', 'kommen'].includes(c.lemma));
      const plural = p.head === 'sie' && c.reading?.persons?.includes('sie');
      if (!impersonal) {
        const genders = nouns.flatMap((n) => n);
        const want = { er: 'der', sie: plural ? 'pl' : 'die', es: 'das' }[p.head];
        if (genders.length && !genders.includes(want) && !(plural && genders.length > 1) && !genders.includes('?')) return false;
      }
    }
    const here = [];
    for (const n of [c.subj, c.pred, c.acc, ...pps(c).map((p) => p.np), ...(c.frag ? c.elems.filter((e) => e.combos) : [])]) {
      if (!n || n.kind === 'pron' || n.wh) continue;
      if (n.kind === 'language' || env.isLanguage(n.head)) continue;
      if (n.list) { here.push(['pl', 'der', 'die', 'das']); continue; }
      if (n.kind === 'np' && n.combos.some((x) => x.g)) { const gs = [...new Set(n.combos.map((x) => x.g).filter(Boolean))]; here.push(PERSON_GENDER[n.head] || (n.unknown?.length ? ['?'] : /^(?:kind|baby|mädchen)$/u.test(n.head) ? ['der', 'die', 'das'] : gs)); } else if (['name', 'own', 'place'].includes(n.kind)) here.push(['?']);
    }
    if (here.length) nouns = [...nouns.slice(-2), ...here];
  }
  return true;
}
const PERSON_GENDER = { mutter: ['die'], schwester: ['die'], mama: ['die'], vater: ['der'], bruder: ['der'], papa: ['der'], freundin: ['die'], freund: ['der'] };
export { FAMILY, PERSONS, determinerOf };
