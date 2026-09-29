import { Clapperboard, RefreshCw } from 'lucide-react';
import { SkillChips, SkillIcon } from '../SkillIcon.jsx';
import { Chest } from './StopNode.jsx';
import { hueVars } from './hue.js';

// „So ist jedes Kapitel aufgebaut" (pathModel.js kapitelAufbau): the stations of every
// Kapitel as a small path of its own — Einstieg (the story and the Lernziele) → Teil A, B
// und C with everything a situation trains (Wortschatz, Hören/Lesen, Grammatik, Übungen,
// Sprechen/Schreiben, Aussprache) → Prüfungstraining → Sprechen mit KI → Schreiben mit
// KI-Korrektur (→ Überarbeiten at B) → Kapiteltest, and every 3 Kapitel a Plateau. The
// icons are the shared skill icons (SkillIcon), so a station looks here like its node on
// the path.

const HUES = ['gruen', 'orange', 'beere', 'tuerkis'];
const SKILL_OF = { pruefung: 'pruefung', sprechen: 'sprechen', schreiben: 'schreiben', check: 'test' };

function Disc({ station }) {
  if (station.key === 'plateau') {
    return (
      <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-game-xp-wash" aria-hidden="true">
        <Chest size={30} />
      </span>
    );
  }
  let inner;
  if (station.key === 'abc') inner = <span className="text-[0.9375rem] font-black tracking-tight">ABC</span>;
  else if (station.key === 'einstieg') inner = <Clapperboard className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />;
  else if (station.key === 'ueberarbeiten') inner = <RefreshCw className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />;
  else inner = <SkillIcon skill={SKILL_OF[station.key] || 'ueben'} className="h-5 w-5" />;
  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[color:var(--hue-edge)] text-white" aria-hidden="true">
      {inner}
    </span>
  );
}

export default function KapitelAufbau({ stations = [] }) {
  if (!stations.length) return null;
  return (
    <ol className="flex flex-col">
      {stations.map((s, i) => (
        <li key={s.key} className="flex gap-3" style={hueVars(HUES[i % HUES.length])}>
          <div className="flex w-11 shrink-0 flex-col items-center">
            <Disc station={s} />
            {i < stations.length - 1 && <span className="my-1 w-1 flex-1 rounded-full bg-game-line" aria-hidden="true" />}
          </div>
          <div className={`min-w-0 flex-1 ${i < stations.length - 1 ? 'pb-3.5' : ''}`}>
            <p className="pt-1 text-[1.0625rem] font-black leading-snug">{s.title}</p>
            <p className="text-[0.9375rem] font-bold leading-snug text-game-muted">{s.text}</p>
            {s.key === 'abc' && <SkillChips skills={s.skills} className="mt-2" />}
          </div>
        </li>
      ))}
    </ol>
  );
}
