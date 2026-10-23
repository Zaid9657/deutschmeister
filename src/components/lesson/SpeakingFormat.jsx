export default function SpeakingFormat({ open }) {
  if (!open) return null;
  const cards = open.cards || open.prompts;
  const own = open.calendar?.[0];
  return <>
    {cards && <ul className="mt-4 grid grid-cols-2 gap-3" aria-label={open.teil}>
      {cards.map((card, i) => <li key={i} className="rounded-clay border border-rule bg-white p-3" lang="de">{card}</li>)}
    </ul>}
    {own && <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left text-ink" lang="de">
        <caption className="mb-2 text-left font-bold">Ihr Kalender · {own.owner}</caption>
        <thead><tr><th scope="col" className="p-2">Zeit</th><th scope="col" className="p-2">Termin</th></tr></thead>
        <tbody>{own.slots.map((slot, i) => <tr key={i} className="border-t border-rule"><th scope="row" className="p-2">{slot.time}</th><td className="p-2">{slot.activity}</td></tr>)}</tbody>
      </table>
      <p className="mt-2 text-sm text-graphite">Ihr Gesprächspartner hat den Kalender von {open.calendar[1]?.owner}. Fragen Sie nach einem gemeinsamen Termin.</p>
    </div>}
  </>;
}
