// The ticket-style mission result — plan Task 4 (speaking-guided-city-map).
//
// FOUR SEPARATE BLOCKS, never one number: task success, language improvement
// and acoustic pronunciation are different signals and stay apart — this
// component renders no composite percentage, no overall score, no "Gesamt".
// Pronunciation is provider-backed word detail or the honest unavailable
// state; a transcript-derived estimate never wears the pronunciation label
// (feedbackModel enforces it, this screen respects it).
//
// Course return flow (plan Task 5 Step 3): with ?return=a1_1_abschluss the
// pass is recorded ONLY after the server verifies the signed result token —
// a query parameter or client-held token alone never completes the section.
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Sparkles, AudioWaveform, ArrowRight, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { verifyMissionResult } from './speakingApi.js';
import { writeMissionResult } from '../../lib/speaking/missionResultContract.js';
import { humanizeCriterion } from './MissionPrep.jsx';

const ABSCHLUSS_RETURN = 'a1_1_abschluss';
const ABSCHLUSS_PATH = '/modelltest/abschlusstest-a1-1';

function TicketSection({ icon: Icon, title, children, labelId }) {
  return (
    <section aria-labelledby={labelId} className="border-t border-dashed border-[var(--city-hairline-strong)] px-4 py-3.5 first:border-t-0">
      <h3 id={labelId} className="flex items-center gap-2 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export default function MissionTicket({
  station, feedback, acoustics, missionResultToken, returnTo, sessionToken,
  finishing, onOpenLab, onTryNext,
}) {
  // Pronunciation evidence for this ticket: the passing turn's own signal, or
  // the latest constrained-step evidence from this mission. Both are
  // provider-backed by contract; anything else renders the unavailable state.
  const pronunciation = feedback.pronunciation || acoustics?.pronunciation || null;
  const words = Array.isArray(pronunciation?.words) ? pronunciation.words : [];
  const lowWords = [...words].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);

  // ---- Abschlusstest handoff: verify server-side before recording ----
  const isReturnFlow = returnTo === ABSCHLUSS_RETURN;
  const [handoff, setHandoff] = useState(isReturnFlow ? 'verifying' : 'none'); // none | verifying | verified | failed
  const verifyRanRef = useRef(false);
  useEffect(() => {
    if (!isReturnFlow || verifyRanRef.current) return;
    verifyRanRef.current = true;
    if (!missionResultToken) { setHandoff('failed'); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await verifyMissionResult({ token: missionResultToken });
        if (cancelled) return;
        if (res?.verified === true) {
          // Recorded ONLY after the server said yes.
          writeMissionResult('a1.1', station.order, { passed: true, sessionToken });
          setHandoff('verified');
        } else {
          setHandoff('failed');
        }
      } catch {
        if (!cancelled) setHandoff('failed');
      }
    })();
    return () => { cancelled = true; };
  }, [isReturnFlow, missionResultToken, sessionToken, station.order]);

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 md:pb-10">
      <h2 className="mt-4 font-display text-2xl font-semibold text-[var(--city-mist)]">
        Station {station.order} complete
      </h2>
      <p className="mt-1 text-sm text-[var(--city-mist-dim)]">{station.title_en || station.title_de}</p>

      <div className="mt-4 overflow-hidden rounded-clay border border-[var(--city-hairline-strong)] bg-white/5">
        {/* 1 — task success */}
        <TicketSection icon={CheckCircle2} title="Task completed" labelId="ticket-task">
          <ul className="space-y-1.5">
            {feedback.task.completedCriteria.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--city-mist)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 stroke-[var(--city-lime)]" aria-hidden="true" />
                {humanizeCriterion(c)}
              </li>
            ))}
          </ul>
        </TicketSection>

        {/* 2 — language improvement */}
        <TicketSection icon={Sparkles} title="A better way to say it" labelId="ticket-language">
          {feedback.language.bestVersion ? (
            <>
              <p className="text-sm font-semibold text-[var(--city-mist)]">{feedback.language.bestVersion}</p>
              {feedback.language.tip && (
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--city-mist-dim)]">{feedback.language.tip}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-[var(--city-mist-dim)]">
              Your last sentence already worked — nothing to improve this time.
            </p>
          )}
        </TicketSection>

        {/* 3 — acoustic pronunciation: provider evidence or honestly unavailable */}
        <TicketSection icon={AudioWaveform} title="Pronunciation" labelId="ticket-pronunciation">
          {pronunciation ? (
            <>
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[['Accuracy', pronunciation.accuracy], ['Fluency', pronunciation.fluency], ['Completeness', pronunciation.completeness]].map(([label, value]) => (
                  <div key={label} className="rounded-clay border border-[var(--city-hairline)] px-1 py-2">
                    <dt className="font-data text-[0.625rem] font-bold uppercase tracking-[0.1em] text-[var(--city-line)]">{label}</dt>
                    <dd className="mt-0.5 font-data text-lg font-bold text-[var(--city-mist)]">{value}<span className="text-[0.6875rem] font-normal text-[var(--city-mist-faint)]">/100</span></dd>
                  </div>
                ))}
              </dl>
              {lowWords.length > 0 && (
                <ul className="mt-2.5 space-y-1 text-sm text-[var(--city-mist)]">
                  {lowWords.map((w, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">{w.word}</span>
                      <span className="font-data text-[0.8125rem] text-[var(--city-mist-dim)]">{w.accuracy}/100</span>
                    </li>
                  ))}
                </ul>
              )}
              {words.length > 0 && (
                <Button variant="secondary" size="sm" onClick={onOpenLab} className="mt-3">
                  <AudioWaveform className="h-4 w-4" aria-hidden="true" /> Open the Pronunciation Lab
                </Button>
              )}
              <p className="mt-2 text-[0.75rem] text-[var(--city-mist-faint)]">
                Measured from your speech audio ({pronunciation.provider}), never guessed from text.
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--city-mist-dim)]">
              Aussprache-Analyse nicht verfügbar — this turn had no reference sentence to
              measure against, and scores are never invented from a transcript. Use
              &ldquo;Practice this sentence&rdquo; during a mission for a real acoustic check.
            </p>
          )}
        </TicketSection>

        {/* 4 — one next action */}
        <TicketSection icon={ArrowRight} title="Try next" labelId="ticket-next">
          {isReturnFlow ? (
            handoff === 'verifying' ? (
              <p className="flex items-center gap-2 text-sm text-[var(--city-mist-dim)]" role="status">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Confirming your result with the server…
              </p>
            ) : handoff === 'verified' ? (
              <>
                <p className="mb-2.5 text-sm text-[var(--city-mist-dim)]">Your pass is confirmed and saved for the Abschlusstest.</p>
                <Button to={ABSCHLUSS_PATH} size="lg" className="w-full">
                  Back to your Abschlusstest <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
                <Button variant="ghost" onClick={onTryNext} disabled={finishing} className="mt-2 w-full">
                  Back to the city map instead
                </Button>
              </>
            ) : (
              <>
                <p className="mb-2.5 text-sm text-[var(--city-mist-dim)]" role="alert">
                  The result could not be confirmed with the server, so the Abschlusstest cannot
                  count it yet. Your mission still passed here — try the handoff again from the test.
                </p>
                <Button size="lg" onClick={onTryNext} disabled={finishing} className="w-full">
                  {finishing ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
                  Back to the city map
                </Button>
              </>
            )
          ) : (
            <Button size="lg" onClick={onTryNext} disabled={finishing} className="w-full">
              {finishing ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
              Continue to the next station <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
        </TicketSection>
      </div>
    </div>
  );
}
