import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PenTool, Loader2, CheckCircle, XCircle, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase, getAuthHeaders } from '../utils/supabase';
import { EXAM_TRACKS, examTrackBySlug, MOCK_DISCLAIMER_DE } from '../data/examTracks';
import { WRITING_TASKS, writingTasksForExam, MAX_WRITING_POINTS } from '../data/writingTasks';
import CompletionMoment from '../components/CompletionMoment';
import SEO from '../components/SEO';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Stat from '../components/ui/Stat.jsx';

const FIELD = 'w-full rounded-clay border border-rule bg-white px-4 py-3 text-sm text-ink placeholder:text-graphite focus:border-siegel focus:outline-none';
const CRITERIA = [['task', 'Aufgabe'], ['structure', 'Aufbau'], ['accuracy', 'Korrektheit'], ['vocabulary', 'Wortschatz']];
// Each criterion carries an equal share of the server's maximum (derive, never retype).
const CRITERION_MAX = MAX_WRITING_POINTS / CRITERIA.length;

// /schreiben — exam-style writing with AI feedback (renovation Phase 5b).
// The grading happens server-side (netlify/functions/evaluate-writing.mjs,
// service-role write into writing_submissions); this page renders tasks from
// the synced task bank, submits, and shows the Richtwert feedback + history.
//
// Deep links (telc B1 pilot route, src/data/programs/telcB1Komplett.js):
//   ?task=<taskKey>  opens that task — only a key of THIS exam's bank, any
//                    other value is ignored (the first task stays selected);
//   &revise=1        loads the learner's own latest letter for that task into
//                    the editor and shows its correction above it, so the
//                    revision day starts from the corrected draft.
// The page speaks Sie, like the course (CLAUDE.md).
const SchreibenPage = () => {
  const { examSlug } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { profile } = useSubscription();

  const defaultExamKey = useMemo(() => {
    if (examSlug) return examTrackBySlug(examSlug)?.key || 'telc_b1';
    if (profile?.exam_track && profile.exam_track !== 'none') return profile.exam_track;
    return 'telc_b1';
  }, [examSlug, profile?.exam_track]);

  const [examKey, setExamKey] = useState(defaultExamKey);
  useEffect(() => setExamKey(defaultExamKey), [defaultExamKey]);

  const tasks = writingTasksForExam(examKey);
  const wantedTask = searchParams.get('task');
  const wantsRevision = searchParams.get('revise') === '1';
  const [taskKey, setTaskKey] = useState(() => wantedTask);
  const activeTask = tasks.find((t) => t.taskKey === taskKey) || tasks[0] || null;
  // The revision view belongs to the task the link named, and only to it.
  const revising = wantsRevision && !!activeTask && activeTask.taskKey === wantedTask;

  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [history, setHistory] = useState([]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // Revision day: the learner's own latest letter for this task, with its
  // correction. Undefined while loading, null when there is none yet.
  const [lastLetter, setLastLetter] = useState(undefined);
  useEffect(() => {
    if (!user || !revising) return undefined;
    let alive = true;
    supabase
      .from('writing_submissions')
      .select('submission_text, feedback, total_score, max_score, created_at')
      .eq('user_id', user.id)
      .eq('exam_key', examKey)
      .eq('task_key', activeTask.taskKey)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) console.error('[SchreibenPage] last letter:', error.message);
        setLastLetter(data || null);
        // Pre-fill only an empty editor: never overwrite what the learner typed.
        if (data?.submission_text) setText((current) => (current.trim() ? current : data.submission_text));
      });
    return () => { alive = false; };
  }, [user, revising, examKey, activeTask?.taskKey]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase
      .from('writing_submissions')
      .select('id, exam_key, task_key, total_score, max_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (alive) setHistory(data || []); });
    return () => { alive = false; };
  }, [user, result]);

  const submit = async () => {
    if (!activeTask || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    setResult(null);
    try {
      const res = await fetch('/.netlify/functions/evaluate-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ exam_key: examKey, task_key: activeTask.taskKey, text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(
          data.error === 'limit_reached'
            ? `Limit erreicht (${data.used}/${data.limit}). ${data.tier === 'free_trial' ? 'Mit Pro bekommen Sie mehr Bewertungen pro Monat.' : 'Nächsten Monat geht es weiter.'}`
            : data.error === 'subscription_required'
              ? 'Ihre Testphase ist abgelaufen – mit Pro können Sie weiter Texte bewerten lassen.'
              : 'Die Bewertung ist fehlgeschlagen. Bitte versuchen Sie es noch einmal.'
        );
      } else if (data.evaluation_failed) {
        setErrorMsg(data.message);
      } else {
        setResult(data);
      }
    } catch (e) {
      console.error('evaluate-writing call failed:', e);
      setErrorMsg('Netzwerkfehler – bitte versuchen Sie es noch einmal.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setText('');
  };

  const inRange = activeTask ? wordCount >= activeTask.minWords && wordCount <= activeTask.maxWords : false;

  return (
    <div className="min-h-screen bg-paper text-ink pt-24 pb-12 px-4">
      <SEO title="Schreibtraining" description="Exam-style German writing with AI feedback." path="/schreiben" noindex />
      <div className="max-w-2xl mx-auto">
        <SectionHeading
          size="page"
          level={1}
          eyebrow="Schreibtraining"
          title="Der Brief, den die Prüfung von Ihnen will"
          lead="Schreiben Sie die Aufgabe unter echten Bedingungen – die KI bewertet nach den vier dokumentierten Kriterien: Aufgabe, Aufbau, Korrektheit, Wortschatz, mit konkreten Korrekturen."
        />

        {/* Exam picker */}
        <Reveal delay={180} className="mt-6">
          <label className="block sm:max-w-xs">
            <span className="block text-xs text-graphite mb-1">Prüfung</span>
            <select
              value={examKey}
              onChange={(e) => { setExamKey(e.target.value); setTaskKey(null); setResult(null); }}
              className={FIELD}
            >
              {EXAM_TRACKS.filter((t) => WRITING_TASKS.some((w) => w.examKey === t.key)).map((t) => (
                <option key={t.key} value={t.key}>{t.nameDe}</option>
              ))}
            </select>
          </label>
        </Reveal>

        {/* Task picker — the cards a learner chooses from, so they press */}
        {tasks.length > 0 && (
          <div className="mt-4" role="radiogroup" aria-label="Aufgabe">
            <span className="block text-xs text-graphite mb-2">Aufgabe</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {tasks.map((t, i) => {
                const selected = activeTask?.taskKey === t.taskKey;
                return (
                  <Reveal key={t.taskKey} delay={80 * i}>
                    <Card
                      interactive
                      as="button"
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      edge={selected ? 'siegel' : 'paper'}
                      tone={selected ? 'wash' : 'paper'}
                      className={`w-full h-full p-4 text-left ${selected ? 'border-siegel' : ''}`}
                      onClick={() => { setTaskKey(t.taskKey); setResult(null); }}
                    >
                      <span className="block font-bold text-ink">{t.title}</span>
                      <span className="mt-1 block font-data text-[0.75rem] text-graphite">
                        {t.register} · {t.minWords}–{t.maxWords} Wörter
                      </span>
                    </Card>
                  </Reveal>
                );
              })}
            </div>
          </div>
        )}

        {activeTask && !result && revising && lastLetter !== undefined && (
          lastLetter ? (
            <Card className="mt-5 p-4" aria-label="Ihre letzte Korrektur">
              <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
                Ihre letzte Korrektur · {new Date(lastLetter.created_at).toLocaleDateString('de-DE')} · {lastLetter.total_score}/{lastLetter.max_score}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink">
                Ihr Brief steht unten im Textfeld. Arbeiten Sie die Korrekturen ein und lassen Sie ihn neu bewerten.
              </p>
              {Array.isArray(lastLetter.feedback?.corrections) && lastLetter.feedback.corrections.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {lastLetter.feedback.corrections.map((c, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      <span className="text-accent-himbeer-ink line-through">{c.original}</span>
                      {' → '}
                      <span className="text-accent-limette-ink font-bold">{c.corrected}</span>
                      {c.note && <span className="block text-graphite text-[0.8125rem] mt-0.5">{c.note}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {Array.isArray(lastLetter.feedback?.improvements) && lastLetter.feedback.improvements.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {lastLetter.feedback.improvements.map((line) => (
                    <li key={line} className="text-sm text-graphite">· {line}</li>
                  ))}
                </ul>
              )}
            </Card>
          ) : (
            <Card tone="sunk" className="mt-5 p-4 text-sm text-ink">
              Zu dieser Aufgabe gibt es noch keinen Entwurf. Schreiben Sie zuerst den Brief und lassen Sie ihn bewerten – überarbeitet wird danach.
            </Card>
          )
        )}

        {activeTask && !result && (
          <>
            <Card tone="sunk" className="mt-5 p-4">
              <p className="text-sm text-ink leading-relaxed">{activeTask.task}</p>
              <ul className="mt-2 space-y-1">
                {activeTask.leitpunkte.map((p) => (
                  <li key={p} className="text-sm text-graphite">· {p}</li>
                ))}
              </ul>
              <p className="mt-2 font-data text-[0.75rem] text-graphite">
                Register: {activeTask.register} · {activeTask.minWords}–{activeTask.maxWords} Wörter
              </p>
              {activeTask.pointsNote && (
                <p className="mt-2 text-sm text-graphite leading-relaxed">{activeTask.pointsNote}</p>
              )}
            </Card>

            <div className="mt-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                placeholder="Schreiben Sie Ihren Text hier …"
                className={`${FIELD} p-4 leading-relaxed`}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <Chip tone={inRange ? 'limette' : 'quiet'} size="md" className="font-data tabular-nums">
                  {wordCount} Wörter
                </Chip>
                <Button shimmer onClick={submit} disabled={submitting || wordCount < 10}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                  {submitting ? 'Wird bewertet…' : 'Bewerten lassen'}
                </Button>
              </div>
            </div>
          </>
        )}

        {errorMsg && (
          <Card tone="himbeer" className="mt-4 flex items-start gap-2.5 border-accent-himbeer-ink/30 px-4 py-3 text-sm text-accent-himbeer-ink" role="alert">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </Card>
        )}

        {result && (
          <div className="mt-6 space-y-5">
            {/* Feedback — the readout is reference material, flat */}
            <Reveal>
              <Card className="p-6 text-center">
                <div className="flex items-end justify-center gap-1">
                  <Stat value={result.total_score} size="lg" />
                  <span className="pb-1 font-display text-xl text-graphite">/ {MAX_WRITING_POINTS}</span>
                </div>
                <p className="mt-3 text-sm text-graphite leading-relaxed">{result.feedback}</p>
                <p className="mt-3 font-data text-[0.75rem] text-graphite">
                  Einschätzung nach Prüfungskriterien – keine offizielle Bewertung und keine Vorhersage Ihres Ergebnisses.
                </p>
              </Card>
            </Reveal>

            {/* The four criteria as reference rows with siegel progress */}
            <Reveal delay={90}>
              <Card className="overflow-hidden">
                {CRITERIA.map(([key, label]) => {
                  const score = result.scores?.[key];
                  const pct = typeof score === 'number' ? Math.max(0, Math.min(100, (score / CRITERION_MAX) * 100)) : 0;
                  return (
                    <div key={key} className="px-5 py-3.5 border-b border-rule last:border-b-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-ink">{label}</span>
                        <span className="font-data text-[0.8125rem] text-graphite">{score ?? '–'}/{CRITERION_MAX}</span>
                      </div>
                      <div className="h-2 rounded-pill bg-paper-sunk overflow-hidden">
                        <div className="h-full rounded-pill bg-siegel" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {Array.isArray(result.leitpunkt_check) && activeTask && (
                  <ul className="px-5 py-4 bg-paper-sunk space-y-1.5">
                    {activeTask.leitpunkte.map((p, i) => (
                      <li key={p} className="flex items-start gap-2 text-sm">
                        {result.leitpunkt_check[i]
                          ? <CheckCircle className="w-4 h-4 text-accent-limette-ink mt-0.5 shrink-0" />
                          : <XCircle className="w-4 h-4 text-accent-himbeer-ink mt-0.5 shrink-0" />}
                        <span className="text-graphite">{p}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </Reveal>

            {((Array.isArray(result.strengths) && result.strengths.length > 0) || (Array.isArray(result.improvements) && result.improvements.length > 0)) && (
              <Reveal delay={135}>
                <Card className="grid gap-4 p-5 sm:grid-cols-2">
                  {Array.isArray(result.strengths) && result.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-ink mb-2">Das gelingt Ihnen</p>
                      <ul className="space-y-1">
                        {result.strengths.map((line) => <li key={line} className="text-sm text-graphite">· {line}</li>)}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(result.improvements) && result.improvements.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-ink mb-2">Daran arbeiten Sie als Nächstes</p>
                      <ul className="space-y-1">
                        {result.improvements.map((line) => <li key={line} className="text-sm text-graphite">· {line}</li>)}
                      </ul>
                    </div>
                  )}
                </Card>
              </Reveal>
            )}

            {Array.isArray(result.corrections) && result.corrections.length > 0 && (
              <Reveal delay={180}>
                <Card className="p-5">
                  <p className="text-sm font-bold text-ink mb-3">Korrekturen</p>
                  <ul className="space-y-3">
                    {result.corrections.map((c, i) => (
                      <li key={i} className="text-sm leading-relaxed">
                        <span className="text-accent-himbeer-ink line-through">{c.original}</span>
                        {' → '}
                        <span className="text-accent-limette-ink font-bold">{c.corrected}</span>
                        {c.note && <span className="block text-graphite text-[0.8125rem] mt-0.5">{c.note}</span>}
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            )}

            <Reveal delay={270}>
              <CompletionMoment
                headline="Text bewertet!"
                detail={(
                  <span className="font-data text-[0.8125rem]">
                    {`Noch ${Math.max(0, (result.limit ?? 0) - (result.used ?? 0))} Bewertung(en) in Ihrem Kontingent.`}
                  </span>
                )}
                nextLabel="Nächste Aufgabe schreiben"
                onNext={reset}
              />
            </Reveal>
          </div>
        )}

        {history.length > 0 && !result && (
          <Reveal className="mt-10">
            <p className="flex items-center gap-2 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              <Sparkles className="w-3.5 h-3.5" /> Ihre letzten Texte
            </p>
            <ul className="mt-3 space-y-2">
              {history.map((h) => (
                <Card as="li" key={h.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-graphite">
                    {new Date(h.created_at).toLocaleDateString('de-DE')} · {h.task_key}
                  </span>
                  <span className="font-data font-bold text-ink">{h.total_score}/{h.max_score}</span>
                </Card>
              ))}
            </ul>
          </Reveal>
        )}

        <p className="mt-10 font-data text-[0.75rem] leading-relaxed text-graphite">
          {MOCK_DISCLAIMER_DE}
        </p>
      </div>
    </div>
  );
};

export default SchreibenPage;
