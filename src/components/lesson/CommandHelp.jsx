import { TASK_COMMANDS_AR, t, useLessonLang } from '../../lib/lesson/strings.js';

export default function CommandHelp() {
  const [lang] = useLessonLang();
  return (
    <details className="mt-3 rounded-clay border border-rule bg-paper p-3 text-sm text-graphite">
      <summary className="min-h-11 cursor-pointer content-center font-bold text-siegel-deep">{t('help.commandsArabic', lang)}</summary>
      <dl lang="ar" dir="rtl" className="mt-2 space-y-2 leading-relaxed">
        {TASK_COMMANDS_AR.map(([command, help]) => (
          <div key={command} className="flex flex-wrap gap-x-3">
            <dt lang="de" dir="ltr" className="font-bold text-ink">{command}</dt>
            <dd>{help}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
