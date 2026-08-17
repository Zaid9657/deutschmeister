import { lazy, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import { Loader2 } from 'lucide-react';

// Lazy here too. App.jsx already lazy-loads IntroSlides for the /onboarding
// route, but this file statically imported it while itself being eagerly
// imported by App — which pinned IntroSlides into the entry chunk and made the
// lazy() there a no-op (Rollup warns about exactly this on every build).
const IntroSlides = lazy(() => import('./IntroSlides'));

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
  </div>
);

const OnboardingGate = ({ children }) => {
  const { user } = useAuth();
  const { needsOnboarding, profileLoaded } = useOnboarding();

  // Anonymous visitors have no profile to load and no onboarding to do. Without
  // this, `profileLoaded` never flips (useOnboarding returns early when there is
  // no user) and every free route wrapped by this gate — /level/a1.1, the free
  // grammar lessons, /reading/a1.1, /listening/a1.1 — spins forever.
  if (!user) {
    return children;
  }

  if (!profileLoaded) {
    return <Spinner />;
  }

  if (needsOnboarding) {
    return (
      <Suspense fallback={<Spinner />}>
        <IntroSlides />
      </Suspense>
    );
  }

  return children;
};

export default OnboardingGate;
