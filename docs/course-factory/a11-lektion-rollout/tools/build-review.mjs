// node docs/course-factory/a11-lektion-rollout/tools/build-review.mjs <repo> <outDir> <Lektion nrs, comma-separated> [tag]
//   → review-input<tag>.txt (sees accepted) and corpus-input<tag>.txt (does not).
// The grading rules are described from finalCheck.js's own comments, so the reviewer reads what the code does.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [repo, out, list, tag = ''] = process.argv.slice(2);
const { CURRICULUM_A11: c } = await import(pathToFileURL(`${repo}/src/data/curricula/a11.js`));
const { checkTurns } = await import(pathToFileURL(`${repo}/src/lib/lesson/finalCheck.js`));
const nrs = list.split(',').map(Number);
const lessons = nrs.map((nr) => c.lektionen[nr - 1]);

const taught = (upTo) => c.lektionen.slice(0, upTo).map((l) => [
  `### Lektion ${l.nr}: ${l.title}`,
  `Can-dos: ${l.canDo.map((x, i) => `[${i}] ${x}`).join(' ')}`,
  `Words (Wortfeld): ${l.wortfeld.map((w) => w.de).join(', ')}`,
  `Scene "${l.dialog.title}" (${l.dialog.setting}):`,
  ...l.dialog.lines.map((x) => `  ${x.speaker}: ${x.de}`),
  `Reading text: ${(l.guided?.read?.text || '').replace(/\n/g, ' / ')}`,
  `Grammar rule (English as shown): ${l.notice.bodyEn}`,
].join('\n')).join('\n\n');

const show = (arr) => JSON.stringify(arr.map((a) => (typeof a === 'string' ? a : `${a.frame} [gap kind: ${a.slot}]`)));
const turnsOf = (l, withAccepted) => {
  const check = l.guided.check;
  const n = Math.max(1, ...check.turns.map((t) => t.variants?.length || 1));
  const lines = [];
  for (let r = 0; r < n; r += 1) {
    lines.push(`Sitting ${r + 1}${r ? ' (a retake)' : ''}:`);
    checkTurns(check, r).forEach((t, i) => {
      const row = [`  Turn ${i + 1} (can-do [${t.canDo}])`];
      if (t.cue) row.push(`${check.partner} says: "${t.cue.de}"`);
      if (t.listen) row.push(`${check.partner} says aloud (audio only, never shown): "${t.listen}"`);
      row.push(`Task shown in English: "${t.taskEn}" / in German: "${t.taskDe}"`);
      row.push(t.listen || t.write || t.parts ? 'Answer: typed only.' : 'Answer: spoken (signed in, with a microphone) or typed.');
      if (withAccepted) {
        if (t.parts) row.push(`A message with parts ${t.parts.map((p, k) => `${k + 1} ${show(p)}`).join('; ')}; extras ${show(t.extras || [])}`);
        else row.push(`Accepted: ${show(t.accepted)}`);
        if (t.slot) row.push(`Gap kind: ${t.slot}`);
        if (t.slotWords) row.push(`Taught words that fit the gap: ${JSON.stringify(t.slotWords)}`);
        if (t.slotIn) row.push(`Choice: ${JSON.stringify(t.slotIn)}`);
        if (t.nounFor) row.push(`The pronoun may be replaced by: ${JSON.stringify(t.nounFor)}`);
        if (t.example) row.push(`Shown after two misses as "For example": ${t.example}`);
      }
      lines.push(row.join(' | '));
    });
  }
  return lines.join('\n');
};

const register = (p) => (p === 'Lena' ? 'is a fellow learner and uses du, so the learner answers her with du' : `is someone the learner does not know well (${p}), so both use Sie`);
const situation = (l) => `## Lektion ${l.nr} "${l.title}" final check, partner: ${l.guided.check.partner}
The check takes place in the same situation as the Lektion's scene, but the learner is now themself (their own things, their own name …) and nothing is shown to copy. Tasks address the learner with Sie; the partner ${register(l.guided.check.partner)}.`;
const repeatOf = (l) => `Parts to repeat per can-do: ${JSON.stringify(l.guided.check.repeat.map((r) => [].concat(r).map((p) => p.en).join(' + ')))}`;

// The grading rules, from the code: the header, and the doc comments of the functions that decide.
const src = readFileSync(`${repo}/src/lib/lesson/finalCheck.js`, 'utf8');
const header = src.split('\n').filter((line, i, all) => i < all.findIndex((x) => x.startsWith('import'))).map((x) => x.replace(/^\/\/ ?/, '')).join('\n');
const doc = (name) => {
  const at = src.search(new RegExp(`\\n(?:export )?(?:function|const) ${name}\\b`));
  const before = src.slice(0, at);
  const start = before.lastIndexOf('/**');
  return start >= 0 && before.slice(start).trim().endsWith('*/') ? before.slice(start).replace(/^\s*\/?\*+\/?/gm, '').trim() : '';
};
const grading = `HOW ANSWERS ARE GRADED (from the code's own comments)
${header}

${['isDate', 'gapResult', 'verbSecond', 'messageResult', 'typedResult', 'spokenShown'].map((n) => `- ${n}: ${doc(n).replace(/\n\s*/g, ' ')}`).join('\n')}

Shared checker (all answers): punctuation is folded; a case-only slip, or one wrong letter in a word of five letters or more, is "just a typo": one more try, and the typo counts on the second try. A changed ending, an article, a pronoun, a possessive or a short word is never a typo. A reply may open with "Und", may name the person it is said to, and may carry "bitte"; Arabic-Indic digits are digits. A wrong answer gets one more try; after the second miss the answer (or an example) is shown. A can-do counts as shown only when all its turns are.`;

const course = `THE COURSE SO FAR (everything the learner has met; the check comes at the end of the Lektion)\n\n${taught(Math.max(...nrs))}`;
const names = lessons.map((l) => `Lektion ${l.nr}`).join(', ');

writeFileSync(`${out}/review-input${tag}.txt`, `You are an experienced teacher of German as a foreign language (DaF), reviewing the final checks of ${names} of an A1.1 course before they ship. Do not edit any file and do not run any command: everything you need is in this message.

The learners: adults, often Arabic speakers newly arrived in Germany, learning alone on a phone; many have little schooling and many have failed at German before. A check recommends what to repeat and never blocks the way on; still, a learner who answers correctly must be marked correct, and a wrong answer must not be marked correct.

${course}

${lessons.map((l) => `${situation(l)}\n${turnsOf(l, true)}\n${repeatOf(l)}`).join('\n\n')}

${grading}

ONE QUESTION FROM THE COURSE TEAM: may a second clause follow the answer after „und" when it opens with a taught verb, e.g. „Ich spreche Arabisch und lerne Deutsch." for "Which languages do you speak?" The code accepts it now. Say yes or no, with a reason.

REVIEW EACH TURN OF EVERY CHECK:
1. Is it answerable with what the course has taught by then? Does any partner line or model answer (the first accepted answer) use German the learner has not met?
2. Is the cue or the task ambiguous, or does the German task give the answer away?
3. Is a correct answer a learner at this point would plausibly give missing from what is accepted? Is a wrong answer accepted?
4. Is the situation natural and true to the scene? Does the register (Sie/du) fit?
5. Does every can-do get a fair test, and is the part to repeat the right one?

Reply with numbered findings, each starting with BLOCKER, MAJOR, MINOR or NOTE, naming the Lektion and turn, the problem, and the exact fix you recommend. Then answer the course team's question. End with one line: your overall verdict for each check (ship / fix first).
`, 'utf8');

writeFileSync(`${out}/corpus-input${tag}.txt`, `You are an experienced teacher of German as a foreign language (DaF). Do not edit any file and do not run any command: everything you need is in this message.

Below are the final checks of ${names} of an A1.1 course. You do NOT see which answers the course accepts. Your job is to write a realistic corpus of learner answers, and to mark each one as a teacher would.

The learners: adults, often Arabic speakers newly arrived in Germany, learning alone on a phone; many have little schooling. They type on a phone keyboard, sometimes without umlauts or capitals.

${course}

${lessons.map((l) => `${situation(l)}\n${turnsOf(l, false)}`).join('\n\n')}

FOR EVERY TURN OF THE FIRST SITTING of every check (and for the turns that change in a retake, also for one retake), write 10 typed learner answers that real learners at this point would plausibly give: about half correct in different ways (other correct wordings, their own real information, short natural answers where the task allows them), and about half wrong in the ways such learners really go wrong (wrong article or gender, wrong verb ending, wrong pronoun, du/Sie mix, word order, a word missing, Arabic-speaker errors), plus one or two with a mere typo or missing capital. Then mark each as a teacher would at this level for this task: "right" (the task is done in correct German; a mere typo or missing capital still counts as right), or "wrong". A short answer that the task does not allow (the task asks for a sentence) is "wrong".

Reply ONLY with JSON, no other text, in exactly this shape:
{"items":[{"lektion":4,"sitting":1,"turn":1,"answer":"…","verdict":"right","why":"…"}]}
`, 'utf8');
console.log('ok', names);
