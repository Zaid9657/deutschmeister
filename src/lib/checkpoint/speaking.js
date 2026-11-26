// Personal transfer tasks for the existing coach. These are ungraded; the
// checkpoint's read-aloud recognition and written result stay separate.
const EXCHANGES = [
  {
    promptDe: 'Stellen Sie sich vor: Name, Wohnort und Beruf. Fragen Sie dann nach dem Namen und dem Wohnort Ihres Gesprächspartners. Antworten Sie mit Ihren eigenen Angaben.',
    promptEn: 'Introduce yourself: name, home town and job. Then ask your partner for their name and home town. Use your own details.',
  },
  {
    promptDe: 'Sie brauchen etwas für Ihr Büro. Sagen Sie, was Sie brauchen. Fragen Sie nach dem Preis. Sagen Sie dann, ob Sie es kaufen möchten.',
    promptEn: 'You need something for your office. Say what you need. Ask the price. Then say whether you would like to buy it.',
  },
  {
    promptDe: 'Sagen Sie, was Sie gern machen. Fragen Sie Ihren Gesprächspartner, wann er Zeit hat. Verabreden Sie sich: Nennen Sie einen Tag und eine Uhrzeit.',
    promptEn: 'Say what you enjoy doing. Ask when your partner is free. Arrange to meet: agree on a day and a time.',
  },
  {
    promptDe: 'Planen Sie ein Fest. Sagen Sie, wann Sie feiern. Laden Sie Ihren Gesprächspartner ein. Fragen Sie, ob er Zeit hat und etwas mitbringt.',
    promptEn: 'Plan a celebration. Say when it will be. Invite your partner. Ask whether they have time and can bring something.',
  },
];

export const checkpointExchange = nr => EXCHANGES[nr - 1] || null;

export function checkpointSpeakingContext(curriculum, checkpoint, returnLabel) {
  const task = checkpointExchange(checkpoint.nr);
  if (!task) return null;
  return {
    level: curriculum.level, code: curriculum.code, title: checkpoint.title,
    homeHref: `/course/${curriculum.level}`,
    returnTo: `/course/${curriculum.level}/checkpoint/${checkpoint.nr}#checkpoint-conversation`,
    returnLabel, openPrompt: task.promptDe, openTeil: 'Gesprächsübung',
    hintWords: [], anrede: 'Sie',
  };
}
