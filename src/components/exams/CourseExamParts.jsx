import Card from '../ui/Card.jsx';
import PlayButton from '../lesson/PlayButton.jsx';

// The saved play count is shared with the existing exam runner. Failed starts do not spend a play.
export function CourseExamAudio({ part, answers, onAnswer }) {
  const plays = answers._plays?.[part.key] || 0;
  const limit = part.playsAllowed || 2;
  return (
    <Card tone="sunk" className="p-4 space-y-3">
      <p className="text-sm text-graphite">Hörtext · {plays} von {limit} Wiedergaben</p>
      {plays < limit ? (
        <PlayButton lektionId="a2.1-abschluss" audioKey={part.key} text={part.audioText}
          label="Hörtext abspielen" onPlayed={() => onAnswer('_plays', { ...answers._plays, [part.key]: plays + 1 })} />
      ) : <p className="text-sm text-graphite">Keine weitere Wiedergabe. Bearbeiten Sie jetzt die Aufgaben.</p>}
    </Card>
  );
}

export function CourseExamSpeaking({ part, answers, onAnswer }) {
  return (
    <div className="space-y-4">
      <Card tone="sunk" className="p-4 text-sm leading-relaxed">{part.task}</Card>
      {part.cards && <ul className="grid grid-cols-2 gap-3">{part.cards.map(card => (
        <Card as="li" key={card} className="p-5 text-center font-bold">{card}</Card>
      ))}</ul>}
      {part.prompts && <Card as="ul" className="p-5 space-y-3">{part.prompts.map(prompt => <li key={prompt}>{prompt}</li>)}</Card>}
      {part.calendar && <div className="grid gap-4 sm:grid-cols-2">{part.calendar.map(calendar => (
        <Card key={calendar.owner} className="p-4">
          <table className="w-full text-sm text-left">
            <caption className="text-left font-bold mb-3">{calendar.owner} · Samstag</caption>
            <thead><tr><th scope="col" className="pb-2">Zeit</th><th scope="col" className="pb-2">Aktivität</th></tr></thead>
            <tbody>{calendar.slots.map(slot => <tr key={slot.time} className="border-t border-rule"><th scope="row" className="py-2 font-normal">{slot.time}</th><td className="py-2">{slot.activity}</td></tr>)}</tbody>
          </table>
        </Card>
      ))}</div>}
      <Card as="fieldset" className="p-4">
        <legend className="font-bold px-1">Gemeinsamer Selbstcheck</legend>
        <p className="text-sm text-graphite mb-3">Diese Aufgabe wird nicht automatisch bewertet.</p>
        {part.criteria.map((criterion, i) => {
          const key = `speaking:${part.key}:${i}`;
          return <label key={criterion} className="flex gap-3 py-2 text-sm"><input type="checkbox" checked={answers[key] === true} onChange={e => onAnswer(key, e.target.checked)} /><span>{criterion}</span></label>;
        })}
      </Card>
    </div>
  );
}
