import { useOnboarding } from '../../hooks/useOnboarding';
import IntroSlides from './IntroSlides';
import { Loader2 } from 'lucide-react';

const OnboardingGate = ({ children }) => {
  const { needsOnboarding, profileLoaded } = useOnboarding();

  if (!profileLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (needsOnboarding) {
    return <IntroSlides />;
  }

  return children;
};

export default OnboardingGate;
