import { useLocation } from 'react-router-dom';
import { setReturnPath } from '../../lib/returnPath.js';
import GameButton from './GameButton.jsx';
import { useV2Strings } from './strings.js';

/**
 * The course's account prompt, where an account changes what the learner gets: an AI-graded
 * speaking or writing task (audit ASSESS-03 / CT-03, 2026-09-30 — the signed-out learner used to
 * read „Melden Sie sich an …" as plain text, with no door and no way on).
 *
 * The door is /login with the way back: LoginPage reads `location.state.from.pathname` and returns
 * there after signing in, and the search (`?s=<n>`, the step) rides in that string, so the learner
 * lands on this very step. A learner who goes on to sign up loses that state (and confirms in a
 * fresh tab), so the click also remembers the step (returnPath.setReturnPath) — postAuthPath sends
 * them back here after confirming. What the copy promises is only what is true: the AI assessment
 * on speaking and writing, and the progress so far kept in the account — this browser's work is
 * merged on the first signed-in load (src/lib/course-v2/mergeLocal.js).
 * The way on without an account („Ohne Auswertung weiter") is the caller's quiet button.
 */
export function useSignInLink() {
  const { pathname, search } = useLocation();
  const here = `${pathname}${search || ''}`;
  return { to: '/login', state: { from: { pathname: here } }, onClick: () => setReturnPath(here) };
}

/** The sign-in / sign-up door as a course button (a bottom-bar primary, or `variant="secondary"` in flow). */
export function SignInButton({ size = 'lg', variant = 'primary', className = '' }) {
  const [, t] = useV2Strings();
  const link = useSignInLink();
  return (
    <GameButton to={link.to} state={link.state} onClick={link.onClick} caps={false} size={size} variant={variant} className={className} data-signin-link="">
      {t('ai.signInCta')}
    </GameButton>
  );
}

/**
 * „Fortschritt sichern – kostenlos": the chapter recap's offer to a signed-out learner — after they
 * have finished something, never as a wall. It promises only what mergeLocal.js does: the chapters
 * done in this browser move into the new account on the first signed-in load.
 */
export function SaveProgressPrompt({ className = '' }) {
  const [, t] = useV2Strings();
  return (
    <div className={`w-full max-w-md rounded-[1.25rem] border-2 border-course-soft bg-course-wash p-4 text-left ${className}`} data-save-progress="">
      <p className="text-[1.0625rem] font-extrabold leading-snug text-course-ink">{t('save.title')}</p>
      <p className="mt-1.5 text-[0.9375rem] font-semibold leading-relaxed text-game-text">{t('save.lead')}</p>
      <div className="mt-3">
        <SignInButton size="md" variant="secondary" className="w-full" />
      </div>
    </div>
  );
}

/** What an account brings, in one panel; `withButton` puts the door inside it (where there is no bottom bar). */
export default function SignInPrompt({ withButton = false, className = '' }) {
  const [, t] = useV2Strings();
  return (
    <div className={`rounded-[1.25rem] border-2 border-course-soft bg-course-wash p-4 ${className}`} data-signin-prompt="">
      <p className="text-[1.0625rem] font-extrabold leading-snug text-course-ink">{t('ai.signInTitle')}</p>
      <p className="mt-1.5 text-[0.9375rem] font-semibold leading-relaxed text-game-text">{t('ai.signInLead')}</p>
      <p className="mt-1.5 text-[0.875rem] font-semibold leading-relaxed text-game-muted">{t('ai.signInBack')}</p>
      {withButton && (
        <div className="mt-3">
          <SignInButton size="md" variant="secondary" className="w-full sm:w-auto" />
        </div>
      )}
    </div>
  );
}
