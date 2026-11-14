import PlayButton from './PlayButton.jsx';

/** The same readable mappings serve teaching, own-name spelling and reference. */
export default function SetBoard({ members, lektionId, boardKey, lang = 'en' }) {
  return <ul className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label={members.map((m) => m.written).join(' ')}>
    {members.map((member, i) => <li key={`${member.written}-${i}`} className="rounded-xl border border-rule bg-white p-3">
      <PlayButton compact lektionId={lektionId} audioKey={`${boardKey}-${i}`} text={member.audio || member.said} label={`${member.written} · ${member.said}`} />
      {member.noteDe && <p className="mt-2 text-sm text-graphite">{lang === 'de' ? member.noteDe : member.noteEn}</p>}
    </li>)}
  </ul>;
}
