import { AudioLines, BookA, BookOpen, Crown, Dumbbell, Headphones, Mic, PenLine, Puzzle, Target } from 'lucide-react';
import { SKILL_LABEL } from '../../lib/course-v2/curriculum.js';

// One icon per Lehrwerk skill (src/lib/course-v2/curriculum.js SKILL_ORDER), shared by the
// course home's path and the Kapitel page so a skill always looks the same.
const ICON = {
  wortschatz: BookA,
  hoeren: Headphones,
  lesen: BookOpen,
  grammatik: Puzzle,
  ueben: Dumbbell,
  sprechen: Mic,
  schreiben: PenLine,
  aussprache: AudioLines,
  pruefung: Target,
  test: Crown,
};

export function SkillIcon({ skill, className = 'h-4 w-4' }) {
  const Icon = ICON[skill] || Dumbbell;
  return <Icon className={className} aria-hidden="true" />;
}

/**
 * A row of small skill chips („Hören · Grammatik · Sprechen"). `lang` picks the label
 * language (the home is German; the player follows its chrome language). `compact` shows
 * icons only, with the names for screen readers.
 */
export function SkillChips({ skills = [], lang = 'de', compact = false, className = '' }) {
  if (!skills.length) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {skills.map((k) => {
        const label = (SKILL_LABEL[k] && SKILL_LABEL[k][lang === 'en' ? 'en' : 'de']) || k;
        return (
          <li
            key={k}
            className="inline-flex items-center gap-1 rounded-full border-2 border-game-line bg-white px-2 py-0.5 text-[0.75rem] font-extrabold text-game-muted"
            title={label}
          >
            <SkillIcon skill={k} className="h-3.5 w-3.5 text-course-ink" />
            {compact ? <span className="sr-only">{label}</span> : <span>{label}</span>}
          </li>
        );
      })}
    </ul>
  );
}

export default SkillChips;
