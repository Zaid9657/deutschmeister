import Card from '../ui/Card.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/**
 * One Landeskunde note (src/data/curricula/a11.meta.js `LANDESKUNDE`), shown
 * on the checkpoint result screen for the chapter that checkpoint closes. A
 * flat, reference-material Card (Card.jsx's default, no `raised`/`interactive`)
 * — this is background reading, not an action. Language follows the lesson
 * chrome toggle like every other course screen; the note's own title/body
 * are course DATA (not chrome), so they carry their own de/en pair rather
 * than going through the string table.
 */
export default function LandeskundeCard({ note }) {
  const [lang] = useLessonLang();
  if (!note) return null;
  const title = lang === 'de' ? note.titleDe : note.titleEn;
  const body = lang === 'de' ? note.bodyDe : note.bodyEn;

  return (
    <Card className="p-5 sm:p-6">
      <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
        {t('landeskunde.eyebrow', lang)}
      </p>
      <h3 className="mt-1 font-display text-lg text-ink">{title}</h3>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-graphite">{body}</p>
      <p className="mt-3 text-xs text-graphite">
        {t('landeskunde.source', lang)} {note.source}
      </p>
    </Card>
  );
}
