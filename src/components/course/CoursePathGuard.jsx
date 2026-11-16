import { usePathAccess } from '../../lib/course/usePathAccess.js';
import { curriculumNodeHref } from '../../lib/courseNext.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

/** App path guard, distinct from the existing subscription/level guard. */
export default function CoursePathGuard({ curriculum, node, children }) {
  const access = usePathAccess(curriculum, node?.id);
  const [lang] = useLessonLang();
  const de = lang === 'de';
  if (access.state === 'open') return children;
  return <main className="min-h-screen bg-paper px-4 py-16 font-body text-ink"><Card className="mx-auto max-w-xl p-6" aria-busy={access.state === 'loading'}>
    {access.state === 'loading' ? <p role="status">{t('player.loading', lang)}</p>
      : access.state === 'error' ? <><h1 className="font-display text-2xl">{de ? 'Ihr Fortschritt lädt gerade nicht' : 'Your progress could not load'}</h1><Button className="mt-5" onClick={access.retry}>{t('sync.retry', lang)}</Button></>
        : <><h1 className="font-display text-2xl">{node?.kind === 'checkpoint' ? 'Checkpoint' : 'Lektion'} {node?.nr}: {node?.title}</h1>
          <p className="mt-3 text-graphite">{de ? 'Dieser Schritt öffnet sich nach dem vorherigen Schritt. Machen Sie dort weiter, wo Sie gerade sind.' : 'This step opens after the previous step. Continue where you are on your course.'}</p>
          <Button className="mt-5" to={`${curriculumNodeHref(curriculum.level, access.current)}${access.suffix}`}>{de ? 'Hier geht es weiter' : 'Continue your course'}</Button></>}
  </Card></main>;
}
