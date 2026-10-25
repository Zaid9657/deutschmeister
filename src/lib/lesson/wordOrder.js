// Closed grammar for derived tiles. Unsupported dialogue lines stay dialogue
// input: a single stored order is not evidence that every other order is wrong.
const pronoun = '(?:ich|du|er|sie|es|wir|ihr|Sie)';
const subject = `(?:${pronoun}|das|(?:der|die|das|mein|meine|dein|deine|sein|seine|ihr|ihre|unser|unsere) [A-ZÄÖÜ][a-zäöüß]+)`;
const copula = '(?:bin|bist|ist|sind|seid|war|warst|waren|wart)';
const capitalise = (s) => s[0].toUpperCase() + s.slice(1);
const lowerFirst = (s) => s === 'Sie' ? s : s[0].toLowerCase() + s.slice(1);

/** All orders of a supported frame, or [] when its grammar is not covered. */
export function wordOrderAnswers(text) {
  const line = String(text || '').trim();
  if (/^(?:Guten (?:Tag|Morgen|Abend)|Gute Nacht|Auf Wiedersehen|Vielen Dank)[.!]$/.test(line)) return [line];
  const end = line.slice(-1);
  if (!/[.!?]/.test(end)) return [];
  const body = line.slice(0, -1);
  const finish = (orders) => [...new Set(orders.map((s) => `${capitalise(s)}${end}`))];

  // One subject and one predicate, optionally modified by a certainty adverb.
  // No arbitrary adjective/verb guesses: the predicate vocabulary is closed.
  const number = '(?:eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwanzig|fünfzehn|vierhundertachtzig)';
  const pred = `(?:Studentin|Student|Lehrer|Lehrerin|müde|krank|schön|gut|teuer|billig|alt|jung|groß|klein|rot|blau|gelb|grün|weiß|schwarz|frei|neu|weit|gesund|schnell|lecker|sonnig|wolkig|windig|warm|kalt|glücklich|pünktlich|hier|da|zu kurz|${number}(?: Euro)?|um ${number}(?: Uhr)?)`;
  const statement = new RegExp(`^(${subject}) (${copula}) (?:(bestimmt|wirklich) )?(${pred})$`, 'i').exec(body);
  if (statement && end !== '?') {
    const [, s, v, adv, p] = statement;
    const sub = lowerFirst(s);
    if (!adv) return finish([`${s} ${v} ${p}`, `${p} ${v} ${sub}`]);
    return finish([`${s} ${v} ${adv} ${p}`, `${s} ${v} ${p} ${adv}`, `${adv} ${v} ${sub} ${p}`, `${adv} ${p} ${v} ${sub}`, `${p} ${v} ${sub} ${adv}`]);
  }

  // A copular question permits V1 and confirmation/echo V2. The subject and
  // predicate remain whole constituents, including a price or a time phrase.
  const polar = new RegExp(`^(${copula}) (${subject}) (${pred})$`, 'i').exec(body);
  if (polar && end === '?') {
    const [, v, s, p] = polar;
    const verb = v.toLowerCase();
    return finish([`${verb} ${s} ${p}`, `${s} ${verb} ${p}`, `${p} ${verb} ${s}`,
      // A weak subject pronoun cannot follow the predicate: *Ist rot es?
      ...(s.includes(' ') ? [`${verb} ${p} ${s}`] : [])]);
  }

  const price = new RegExp(`^(${subject}) kostet (${number} Euro)$`, 'i').exec(body);
  if (price && end !== '?') return finish([body, `${price[2]} kostet ${lowerFirst(price[1])}`]);

  const arrival = new RegExp(`^(${subject}) (komme|kommst|kommt|kommen) (jetzt|heute|morgen)$`, 'i').exec(body);
  if (arrival && end !== '?') return finish([body, `${arrival[3]} ${arrival[2]} ${lowerFirst(arrival[1])}`]);

  // Bare accusative states are a closed lexical frame, not arbitrary haben objects.
  const have = new RegExp(`^(${subject}) (habe|hast|hat|haben|habt) (Hunger|Durst|Zeit|Verspätung)$`, 'i').exec(body);
  if (have && end !== '?') return finish([body, `${have[3]} ${have[2]} ${lowerFirst(have[1])}`]);
  const haveQuestion = new RegExp(`^(Habe|Hast|Hat|Haben|Habt) (${subject}) (Hunger|Durst|Zeit|Verspätung)$`, 'i').exec(body);
  if (haveQuestion && end === '?') {
    const [, verb, s, object] = haveQuestion;
    const v = verb.toLowerCase();
    return finish([`${v} ${s} ${object}`, `${s} ${v} ${object}`, `${object} ${v} ${s}`,
      ...(s.includes(' ') ? [`${v} ${object} ${s}`] : [])]);
  }

  // A polar question with one pronoun, one time adverb and a separable verb.
  // Confirmation questions have the same tiles and keep the final question mark.
  const question = /^(Kaufst|Kauft|Kaufen) (du|ihr|Sie) (heute|morgen|jetzt) ein$/.exec(body);
  if (question && end === '?') {
    const [, v, s, time] = question;
    const verb = v.toLowerCase();
    return finish([`${verb} ${s} ${time} ein`, `${verb} ${time} ${s} ein`, `${s} ${verb} ${time} ein`, `${time} ${verb} ${s} ein`]);
  }

  // A three-word origin/destination question, with an optional direct address.
  const wh = /^(Woher|Wohin) (kommst|kommt|kommen|gehst|geht|gehen|fährst|fahrt|fahren) (du|ihr|Sie)(?:, ([A-ZÄÖÜ][a-zäöüß]+))?$/.exec(body);
  if (wh && end === '?') {
    const [, w, v, s, name] = wh;
    const cores = [[w, v, s], [s, v, w.toLowerCase()], [v, s, w.toLowerCase()]];
    const orders = name ? cores.flatMap((words) => Array.from({ length: words.length + 1 }, (_, at) => {
      const copy = [...words];
      copy.splice(at, 0, name);
      return copy.join(' ');
    })) : cores.map((words) => words.join(' '));
    return finish(orders);
  }
  return [];
}
