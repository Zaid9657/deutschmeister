import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PenTool, Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase, getAuthHeaders } from '../utils/supabase';
import { EXAM_TRACKS, examTrackBySlug, MOCK_DISCLAIMER_DE } from '../data/examTracks';
import { WRITING_TASKS, writingTasksForExam, MAX_WRITING_POINTS } from '../data/writingTasks';
import CompletionMoment from '../components/CompletionMoment';
import SEO from '../components/SEO';

// /schreiben — exam-style writing with AI feedback (renovation Phase 5b).
// The grading happens server-side (netlify/functions/evaluate-writing.mjs,
// service-role write into writing_submissions); this page renders tasks from
// the synced task bank, submits, and shows the Richtwert feedback + history.
const SchreibenPage = () => {
  const { examSlug } = useParams();
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
  const [taskKey, setTaskKey] = useState(null);
  const activeTask = tasks.find((t) => t.taskKey === taskKey) || tasks[0] || null;

  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [history, setHistory] = useState([]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

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
            ? `Limit erreicht (${data.used}/${data.limit}). ${data.tier === 'free_trial' ? 'Mit Pro bekommst du mehr Bewertungen pro Monat.' : 'Nächsten Monat geht es weiter.'}`
            : data.error === 'subscription_required'
              ? 'Dein Test ist abgelaufen — mit Pro kannst du weiter Texte bewerten lassen.'
              : 'Die Bewertung ist fehlgeschlagen. Bitte versuch es noch einmal.'
        );
      } else if (data.evaluation_failed) {
        setErrorMsg(data.message);
      } else {
        setResult(data);
      }
    } catch (e) {
      console.error('evaluate-writing call failed:', e);
      setErrorMsg('Netzwerkfehler — bitte versuch es noch einmal.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setText('');
  };

  return (
    <div className="min-h-screen bg-paper pt-24 pb-12 px-4">
      <SEO title="Schreibtraining" description="Exam-style German writing with AI feedback." path="/schreiben" noindex />
      <div className="max-w-2xl mx-auto">
        <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">Schreibtraining</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Der Brief, den die Prüfung von dir will
        </h1>
        <p className="mt-3 text-graphite leading-relaxed">
          Schreib die Aufgabe unter echten Bedingungen, und die KI bewertet nach den vier
          dokumentierten Kriterien: Aufgabe, Aufbau, Korrektheit, Wortschatz — mit konkreten Korrekturen.
        </p>

        {/* Exam + task pickers */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="block text-xs text-graphite mb-1">Prüfung</span>
            <select
              value={examKey}
              onChange={(e) => { setExamKey(e.target.value); setTaskKey(null); setResult(null); }}
              className="w-full rounded-xl border border-rule bg-white px-3 py-2.5 text-sm text-ink"
            >
              {EXAM_TRACKS.filter((t) => WRITING_TASKS.some((w) => w.examKey === t.key)).map((t) => (
                <option key={t.key} value={t.key}>{t.nameDe}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-graphite mb-1">Aufgabe</span>
            <select
              value={activeTask?.taskKey || ''}
              onChange={(e) => { setTaskKey(e.target.value); setResult(null); }}
              className="w-full rounded-xl border border-rule bg-white px-3 py-2.5 text-sm text-ink"
            >
              {tasks.map((t) => (
                <option key={t.taskKey} value={t.taskKey}>{t.title}</option>
              ))}
            </select>
          </label>
        </div>

        {activeTask && !result && (
          <>
            <div className="mt-5 rounded-xl border border-rule bg-paper-sunk p-4">
              <p className="text-sm text-ink leading-relaxed">{activeTask.task}</p>
              <ul className="mt-2 space-y-1">
                {activeTask.leitpunkte.map((p) => (
                  <li key={p} className="text-sm text-graphite">· {p}</li>
                ))}
              </ul>
              <p className="mt-2 font-data text-[0.75rem] text-graphite">
                Register: {activeTask.register} · {activeTask.minWords}–{activeTask.maxWords} Wörter
              </p>
            </div>

            <div className="mt-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                placeholder="Schreib deinen Text hier…"
                className="w-full rounded-xl border border-rule bg-white p-4 text-sm text-ink leading-relaxed focus:border-siegel focus:outline-none"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <span className={`font-data text-[0.8125rem] ${
                  wordCount >= activeTask.minWords && wordCount <= activeTask.maxWords
                    ? 'text-siegel' : 'text-graphite'
                }`}>
                  {wordCount} Wörter
                </span>
                <button
                  onClick={submit}
                  disabled={submitting || wordCount < 10}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-siegel text-white text-sm font-semibold hover:bg-siegel-lift transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                  {submitting ? 'Wird bewertet…' : 'Bewerten lassen'}
                </button>
              </div>
            </div>
          </>
        )}

        {errorMsg && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</p>
        )}

        {result && (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-rule bg-white p-6 text-center">
              <p className="font-display text-4xl font-semibold text-ink">
                {result.total_score}<span className="text-xl text-graphite"> / {MAX_WRITING_POINTS}</span>
              </p>
              <p className="mt-2 text-sm text-graphite leading-relaxed">{result.feedback}</p>
              <p className="mt-3 font-data text-[0.75rem] text-graphite">
                Einschätzung nach Prüfungskriterien — keine offizielle Bewertung und keine Vorhersage deines Ergebnisses.
              </p>
            </div>

            <div className="rounded-2xl border border-rule bg-white p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[['task', 'Aufgabe'], ['structure', 'Aufbau'], ['accuracy', 'Korrektheit'], ['vocabulary', 'Wortschatz']].map(([key, label]) => (
                  <div key={key} className="text-center">
                    <p className="font-display text-xl font-semibold text-ink">{result.scores?.[key] ?? '–'}<span className="text-sm text-graphite">/5</span></p>
                    <p className="text-[0.75rem] text-graphite mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {Array.isArray(result.leitpunkt_check) && activeTask && (
                <ul className="mt-4 border-t border-rule pt-3 space-y-1.5">
                  {activeTask.leitpunkte.map((p, i) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      {result.leitpunkt_check[i]
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        : <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />}
                      <span className="text-graphite">{p}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {Array.isArray(result.corrections) && result.corrections.length > 0 && (
              <div className="rounded-2xl border border-rule bg-white p-5">
                <p className="text-sm font-semibold text-ink mb-3">Korrekturen</p>
                <ul className="space-y-3">
                  {result.corrections.map((c, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      <span className="text-red-600 line-through">{c.original}</span>
                      {' → '}
                      <span className="text-emerald-700 font-medium">{c.corrected}</span>
                      {c.note && <span className="block text-graphite text-[0.8125rem] mt-0.5">{c.note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <CompletionMoment
              headline="Text bewertet!"
              detail={`Noch ${Math.max(0, (result.limit ?? 0) - (result.used ?? 0))} Bewertung(en) in deinem Kontingent.`}
              nextLabel="Nächste Aufgabe schreiben"
              onNext={reset}
            />
          </div>
        )}

        {history.length > 0 && !result && (
          <div className="mt-10">
            <p className="flex items-center gap-2 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              <Sparkles className="w-3.5 h-3.5" /> Deine letzten Texte
            </p>
            <ul className="mt-3 space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between rounded-xl border border-rule bg-white px-4 py-3 text-sm">
                  <span className="text-graphite">
                    {new Date(h.created_at).toLocaleDateString('de-DE')} · {h.task_key}
                  </span>
                  <span className="font-data font-semibold text-ink">{h.total_score}/{h.max_score}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-10 font-data text-[0.75rem] leading-relaxed text-graphite">
          {MOCK_DISCLAIMER_DE}
        </p>
      </div>
    </div>
  );
};

export default SchreibenPage;
