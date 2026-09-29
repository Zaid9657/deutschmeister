import { GlossText, useGlossPopover } from './InputView.jsx';
import { useV2Strings } from './strings.js';

/**
 * The unit's cliffhanger (SCHEMA §8 `story`): the German line with its tap glosses
 * (`story.glosses`, words it uses before their unit — as the Folge's) and, in English chrome,
 * its English twin (`story.cliffhangerEn`, as every twin). A1 learners otherwise meet the hook
 * into the next unit as a German-only line (a1.1 u01 r1-F08 / r2-F09).
 */
export default function StoryCliffhanger({ story, idPrefix = 'story', className = 'mt-2 text-[1.125rem] font-bold leading-snug text-game-text' }) {
  const [lang] = useV2Strings();
  const [open, setOpen] = useGlossPopover();
  if (!story || !story.cliffhanger) return null;
  const glosses = Array.isArray(story.glosses) ? story.glosses : [];
  return (
    <>
      <p className={className} lang="de">
        <GlossText text={story.cliffhanger} glosses={glosses} open={open} setOpen={setOpen} idPrefix={idPrefix} lang={lang} />
      </p>
      {story.cliffhangerEn && lang !== 'de' && (
        <p className="mt-1 text-[0.875rem] font-semibold leading-relaxed text-game-muted" lang="en">{story.cliffhangerEn}</p>
      )}
    </>
  );
}
