import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Clock, ChevronRight, Volume2, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { examTrackBySlug, MOCK_DISCLAIMER_DE } from '../../data/examTracks';
import { mockForExamKey } from '../../data/mockExams';
import {
  findResumableAttempt,
  loadAttempt,
  saveAnswers,
  advanceSectionDeadline,
  completeAttempt,
} from '../../services/examService';
import { scoreObjectiveSections, mergeListeningResult } from '../../services/examScoring';
import { useExerciseDetails } from '../../hooks/useListening';
import { getAudioUrl } from '../../utils/listeningHelpers';
import SEO from '../../components/SEO';

// /modelltest/:examSlug/run — the timed runner (renovation Phase 5a).
//
// The timer anchor is exam_attempts.section_deadline (server-persisted), so a
// reload resumes the countdown instead of resetting it. Answers autosave
// (debounced) with the current section index in an in-answers _meta key, so a
// resume lands on the right section. Listening parts load their questions
// from the existing listening_exercises rows at runtime and register their
// answer keys for the final scoring pass.

const PLAYS_ALLOWED = 2;

function MockListeningPart({ part, answers, onAnswer, registerKey }) {
  const { exercise, questions, loading } = useExerciseDetails(part.level, String(part.exerciseNumber));
  const [plays, setPlays] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (questions?.length) {
      registerKey(
        part.key,
        questions.map((q) => ({ id: q.id || q.question_number, correct: q.correct_answer }))
      );
    }
  }, [questions, part.key, registerKey]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-graphite text-sm py-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Hörtext wird geladen…
      </div>
    );
  }
  if (!exercise) {
    return <p className="text-sm text-graphite py-4">Dieser Hörtext konnte nicht geladen werden.</p>;
  }

  const audioUrl = getAudioUrl(part.level.toLowerCase(), part.exerciseNumber);
  const canPlay = plays < PLAYS_ALLOWED;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-rule bg-paper-sunk px-4 py-3">
        <button
          onClick={() => {
            if (!canPlay || !audioRef.current) return;
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            setPlays((p) => p + 1);
          }}
          disabled={!canPlay}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-siegel text-white text-sm font-semibold disabled:opacity-50"
        >
          <Volume2 className="w-4 h-4" /> Abspielen
        </button>
        <span className="font-data text-[0.8125rem] text-graphite">
          {canPlay
            ? `Noch ${PLAYS_ALLOWED - plays}× abspielbar (wie in der Prüfung begrenzt)`
            : 'Keine Wiedergabe mehr — beantworte die Fragen'}
        </span>
        <audio ref={audioRef} src={audioUrl} preload="none" />
      </div>
      {questions.map((q) => {
        const qid = q.id || q.question_number;
        const key = `listening:${part.key}:${qid}`;
        // options are strings like "a) 2,50 €" or plain "Richtig"; the stored
        // answer is the extracted key, compared against correct_answer — the
        // same convention as components/listening (getAnswerKey there).
        const opts = (q.options || []).map((label) => {
          const m = String(label).match(/^([a-d])\)/);
          return { key: m ? m[1] : label, label };
        });
        return (
          <fieldset key={qid} className="rounded-xl border border-rule bg-white p-4">
            <legend className="px-1 text-sm font-semibold text-ink">{q.question_text}</legend>
            <div className="mt-2 space-y-1.5">
              {opts.map((o) => (
                <label key={o.key} className="flex items-start gap-2.5 text-sm text-graphite cursor-pointer">
                  <input
                    type="radio"
                    name={key}
                    checked={answers[key] === o.key}
                    onChange={() => onAnswer(key, o.key)}
                    className="mt-0.5 accent-siegel"
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

const ModelltestRun = () => {
  const { examSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const track = examTrackBySlug(examSlug);
  const mock = track ? mockForExamKey(track.key) : null;

  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [sectionIndex, setSectionIndex] = useState(0);
  const [deadline, setDeadline] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const listeningKeysRef = useRef({});
  const saveTimerRef = useRef(null);

  const registerListeningKey = useCallback((partKey, items) => {
    listeningKeysRef.current[partKey] = items;
  }, []);

  // Load or resume the attempt
  useEffect(() => {
    if (!user || !track || !mock) return;
    let alive = true;
    const load = async () => {
      const id = location.state?.attemptId;
      const a = id ? await loadAttempt(id) : await findResumableAttempt(user.id, track.key);
      if (!alive) return;
      if (!a || a.status !== 'in_progress') {
        navigate(`/modelltest/${examSlug}`, { replace: true });
        return;
      }
      setAttempt(a);
      const saved = a.answers || {};
      setAnswers(saved);
      setSectionIndex(Math.min(saved._meta?.sectionIndex ?? 0, mock.sections.length - 1));
      setDeadline(a.section_deadline ? new Date(a.section_deadline).getTime() : null);
      setLoading(false);
    };
    load();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, track?.key]);

  // Countdown
  useEffect(() => {
    if (!deadline) return;
    const tick = () => setRemaining(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [deadline]);

  const section = mock?.sections[sectionIndex];
  const isLast = mock ? sectionIndex >= mock.sections.length - 1 : false;

  const setAnswer = (key, value) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value, _meta: { sectionIndex } };
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (attempt) saveAnswers(attempt.id, next);
      }, 1500);
      return next;
    });
  };

  const scoreListening = () => {
    let score = 0;
    let max = 0;
    for (const [partKey, items] of Object.entries(listeningKeysRef.current)) {
      for (const item of items) {
        max += 1;
        if (answers[`listening:${partKey}:${item.id}`] === item.correct) score += 1;
      }
    }
    return { score, max };
  };

  const finish = useCallback(async () => {
    if (!attempt || finishing) return;
    setFinishing(true);
    const objective = scoreObjectiveSections(mock, answers);
    const result = mergeListeningResult(objective, scoreListening());
    await completeAttempt(attempt.id, {
      answers: { ...answers, _meta: { sectionIndex } },
      score: result.score,
      maxScore: result.maxScore,
      sectionScores: result.sectionScores,
    });
    navigate(`/modelltest/${examSlug}/result/${attempt.id}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, finishing, answers, sectionIndex]);

  const nextSection = useCallback(async () => {
    if (!attempt) return;
    if (isLast) {
      finish();
      return;
    }
    const nextIdx = sectionIndex + 1;
    const nextAnswers = { ...answers, _meta: { sectionIndex: nextIdx } };
    setAnswers(nextAnswers);
    await saveAnswers(attempt.id, nextAnswers);
    const newDeadline = await advanceSectionDeadline(attempt.id, mock.sections[nextIdx].minutes);
    setSectionIndex(nextIdx);
    setDeadline(newDeadline ? new Date(newDeadline).getTime() : Date.now() + mock.sections[nextIdx].minutes * 60000);
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, isLast, sectionIndex, answers, finish]);

  // Time up → move on automatically (the exam does not wait either)
  useEffect(() => {
    if (remaining === 0 && !loading && !finishing) nextSection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  if (!track || !mock) return null;
  if (loading) {
    return (
      <div className="min-h-screen bg-paper pt-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-graphite" />
      </div>
    );
  }

  const mm = remaining != null ? String(Math.floor(remaining / 60)).padStart(2, '0') : '--';
  const ss = remaining != null ? String(remaining % 60).padStart(2, '0') : '--';
  const low = remaining != null && remaining < 120;

  return (
    <div className="min-h-screen bg-paper pt-20 pb-16 px-4">
      <SEO title={`${section.title} — ${mock.title}`} description="Übungstest läuft." path={`/modelltest/${examSlug}/run`} noindex />
      <div className="max-w-2xl mx-auto">

        {/* Section header + timer */}
        <div className="sticky top-16 z-40 -mx-4 px-4 py-3 bg-paper/95 backdrop-blur-md border-b border-rule flex items-center justify-between">
          <div>
            <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              Teil {sectionIndex + 1} von {mock.sections.length}
            </p>
            <h1 className="font-display text-lg font-semibold text-ink">{section.title}</h1>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-data text-sm font-bold ${
            low ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-paper-sunk text-ink border border-rule'
          }`}>
            <Clock className="w-4 h-4" /> {mm}:{ss}
          </div>
        </div>

        <p className="mt-5 text-sm text-graphite leading-relaxed">{section.instructions}</p>

        <div className="mt-6 space-y-8">
          {section.parts.map((part) => (
            <div key={part.key}>
              <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel mb-3">
                {part.label}
              </p>

              {part.type === 'matching' && (
                <div className="space-y-4">
                  <ol className="rounded-xl border border-rule bg-paper-sunk p-4 space-y-1">
                    {part.options.map((o) => (
                      <li key={o.key} className="text-sm text-ink">
                        <span className="font-data font-bold uppercase mr-2">{o.key}</span>{o.label}
                      </li>
                    ))}
                  </ol>
                  {part.texts.map((t, ti) => {
                    const key = `${part.key}:${t.id}`;
                    return (
                      <div key={t.id} className="rounded-xl border border-rule bg-white p-4">
                        <p className="text-sm text-graphite leading-relaxed">
                          <span className="font-semibold text-ink mr-1">Text {ti + 1}.</span>
                          {t.text}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {part.options.map((o) => (
                            <button
                              key={o.key}
                              onClick={() => setAnswer(key, o.key)}
                              className={`w-9 h-9 rounded-lg border font-data font-bold uppercase text-sm transition-colors ${
                                answers[key] === o.key
                                  ? 'border-siegel bg-siegel text-white'
                                  : 'border-rule text-graphite hover:border-siegel'
                              }`}
                            >
                              {o.key}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {part.type === 'mc-group' && (
                <div className="space-y-4">
                  {part.text && (
                    <div className="rounded-xl border border-rule bg-paper-sunk p-4 text-sm text-ink leading-relaxed whitespace-pre-line">
                      {part.text}
                    </div>
                  )}
                  {part.items.map((item) => (
                    <fieldset key={item.id} className="rounded-xl border border-rule bg-white p-4">
                      <legend className="px-1 text-sm font-semibold text-ink">{item.prompt}</legend>
                      <div className="mt-2 space-y-1.5">
                        {item.options.map((o) => (
                          <label key={o.key} className="flex items-start gap-2.5 text-sm text-graphite cursor-pointer">
                            <input
                              type="radio"
                              name={item.id}
                              checked={answers[item.id] === o.key}
                              onChange={() => setAnswer(item.id, o.key)}
                              className="mt-0.5 accent-siegel"
                            />
                            <span>{o.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              )}

              {part.type === 'cloze' && (
                <div className="rounded-xl border border-rule bg-white p-5">
                  {part.textBefore && <p className="text-sm text-ink mb-2">{part.textBefore}</p>}
                  <p className="text-sm text-ink leading-[2.1] whitespace-pre-line">
                    {part.gapsText.map((piece, i) => {
                      if (piece.text != null) return <span key={i}>{piece.text}</span>;
                      const gap = part.gaps.find((g) => g.id === piece.gap);
                      return (
                        <select
                          key={i}
                          value={answers[gap.id] || ''}
                          onChange={(e) => setAnswer(gap.id, e.target.value)}
                          className={`mx-1 rounded-md border px-2 py-1 text-sm font-semibold bg-white ${
                            answers[gap.id] ? 'border-siegel text-ink' : 'border-rule text-graphite'
                          }`}
                        >
                          <option value="">___</option>
                          {gap.options.map((o) => (
                            <option key={o.key} value={o.key}>{o.label}</option>
                          ))}
                        </select>
                      );
                    })}
                  </p>
                </div>
              )}

              {part.type === 'listening' && (
                <MockListeningPart
                  part={part}
                  answers={answers}
                  onAnswer={setAnswer}
                  registerKey={registerListeningKey}
                />
              )}

              {part.type === 'writing' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-rule bg-paper-sunk p-4 text-sm text-ink leading-relaxed">
                    {part.task}
                  </div>
                  <textarea
                    value={answers[`writing:${part.key}`] || ''}
                    onChange={(e) => setAnswer(`writing:${part.key}`, e.target.value)}
                    rows={10}
                    placeholder="Schreib deine E-Mail hier…"
                    className="w-full rounded-xl border border-rule bg-white p-4 text-sm text-ink leading-relaxed focus:border-siegel focus:outline-none"
                  />
                  <div className="rounded-xl border border-rule bg-white p-4">
                    <p className="text-sm font-semibold text-ink mb-2">Selbstcheck (wird nicht automatisch bewertet):</p>
                    <ul className="space-y-1.5">
                      {part.criteria.map((c) => (
                        <li key={c} className="text-sm text-graphite">· {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={nextSection}
          disabled={finishing}
          className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-siegel text-white font-semibold hover:bg-siegel-lift transition-colors disabled:opacity-60"
        >
          {finishing ? 'Wird ausgewertet…' : isLast ? 'Test abschließen' : `Weiter zu: ${mock.sections[sectionIndex + 1].title}`}
          <ChevronRight className="w-4 h-4" />
        </button>

        <p className="mt-6 font-data text-[0.75rem] leading-relaxed text-graphite">
          {MOCK_DISCLAIMER_DE}
        </p>
      </div>
    </div>
  );
};

export default ModelltestRun;
