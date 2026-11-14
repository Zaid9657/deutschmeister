import { A11_META } from '../../data/curricula/a11.meta.js';
import { dailyOpening, dailyT, completedCanDos } from '../../lib/course/dailyLoop.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import ExamDatePlan from './ExamDatePlan.jsx';

export default function TodayCard({ lang, ...input }) {
  const model = dailyOpening(input);
  if (!model) return null;
  const teacher = A11_META.teacher;
  const plan = model.plan;
  const all = completedCanDos(input.curriculum, input.done);
  return <Card className="mt-3 p-3" data-daily-today>
    <div className="flex items-center gap-2">
      <img src={teacher.srcSmall} width="32" height="32" alt="" className="rounded-full" />
      <p className="text-xs text-graphite">{teacher.name} · {dailyT('teacher', lang)} · {dailyT('today', lang)}</p>
    </div>
    <p className="mt-2 break-words text-sm text-ink">{dailyT('hello', lang, { name: model.name ? `, ${model.name}` : '' })} {dailyT(model.situation, lang, { nr: model.nr, goal: model.goal(lang) })}</p>
    <p className="mt-2 text-sm font-bold">{dailyT(model.planKey, lang, model.planVars)}</p>
    <p className="mt-1 text-xs text-graphite">{dailyT('road', lang, { day: model.day, nr: model.lessonNr, total: input.curriculum.lektionen.length })} {plan.status !== 'no-date' && dailyT(plan.status === 'past' ? 'past' : plan.status === 'behind' ? 'closer' : 'reachable', lang, { n: plan.perWeekTarget })}</p>
    <Button to={model.href} size="sm" className="mt-2">{dailyT(model.action, lang)} →</Button>
    <div className="mt-1 flex items-start gap-3">
    {all.length > 0 && <details className="min-w-0 flex-1 text-xs"><summary className="flex min-h-11 cursor-pointer items-center text-siegel-deep">{dailyT('count', lang, { n: all.length })}</summary><ul className="space-y-1">{all.map((c) => <li key={c.id}>{c[lang === 'de' ? 'de' : 'en']}</li>)}</ul></details>}
    {input.signedIn && <details className="min-w-0 flex-1 text-xs text-siegel-deep"><summary className="flex min-h-11 cursor-pointer items-center">{dailyT('date', lang)}</summary><ExamDatePlan curriculum={input.curriculum} path={input.path} doneIds={input.done} /></details>}
    </div>
  </Card>;
}
