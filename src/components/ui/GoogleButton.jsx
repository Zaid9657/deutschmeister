import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Button from './Button';
import { useAuth } from '../../contexts/AuthContext';
import { GOOGLE_SIGNIN_ENABLED } from '../../lib/googleSignIn.js';

/**
 * "Continue with Google" plus the "or" rule under it. Renders nothing while
 * VITE_GOOGLE_SIGNIN_ENABLED is off (src/lib/googleSignIn.js). `onStart` lets
 * the signup page count the click as a started signup.
 */
export default function GoogleButton({ onStart }) {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!GOOGLE_SIGNIN_ENABLED) return null;

  const start = async () => {
    setError('');
    setBusy(true);
    onStart?.();
    // On success the browser leaves for Google; only a failure returns here.
    const { error: failure } = await signInWithGoogle();
    if (failure) {
      setBusy(false);
      setError('Google sign-in did not start. Please try again, or use your email below.');
    }
  };

  return (
    <div className="mb-5">
      <Button type="button" variant="secondary" size="lg" className="w-full" disabled={busy} onClick={start}>
        {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <img src="/google-g.svg" alt="" width="20" height="20" />}
        Continue with Google
      </Button>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-coral-accessible">{error}</p>}
      <div className="mt-5 flex items-center gap-3 text-graphite" aria-hidden="true">
        <span className="h-px flex-1 bg-rule" />
        <span className="font-data text-[0.6875rem] tracking-[0.02em]">or with your email</span>
        <span className="h-px flex-1 bg-rule" />
      </div>
    </div>
  );
}
