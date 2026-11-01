import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../utils/supabase';
import { LEMONSQUEEZY_CONFIG } from '../config/lemonsqueezy';
import { dismissReturn, returnDismissed, showTrialReturn, loadSavedWork, returnOffer, freeReturnOption } from '../lib/trialReturn.js';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';

export default function TrialReturnCard({ banner = false }) {
  const { user } = useAuth();
  const { profile, purchases, subscription, loading, billingVerified, hasActiveSubscription } = useSubscription();
  const userId = user?.id;
  const eligible = showTrialReturn({ userId, profile, purchases, subscription, loading, billingVerified, subscribed: hasActiveSubscription() });
  const [hiddenFor, setHiddenFor] = useState(null);
  const [work, setWork] = useState(null);
  const hidden = hiddenFor === userId || returnDismissed(userId);
  useEffect(() => {
    if (!eligible || hidden) return;
    let current = true;
    loadSavedWork(supabase, userId)
      .then((task) => { if (current) setWork({ userId, task }); })
      .catch(() => { if (current) setWork({ userId, error: true }); });
    return () => { current = false; };
  }, [userId, eligible, hidden]);
  if (!eligible || hidden) return null;
  const loaded = work?.userId === userId ? work : null;
  const task = loaded?.task;
  const offer = returnOffer(task?.level || profile?.current_level?.toLowerCase(), LEMONSQUEEZY_CONFIG.levelCourses);
  return (
    <div className={banner ? 'border-b border-rule bg-paper px-4 py-4' : 'mb-8'}>
      <Card className="relative mx-auto max-w-5xl border border-rule p-5 shadow-none" lang="de">
        <button type="button" aria-label="Für sieben Tage ausblenden" className="absolute right-3 top-3 rounded-md p-2 text-siegel hover:bg-siegel-wash"
          onClick={() => { dismissReturn(userId); setHiddenFor(userId); }}>
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <h2 className="pr-10 font-display text-xl text-ink">Willkommen zurück</h2>
        <p className="mt-2 text-sm text-graphite">Ihre Testphase ist beendet. Sie können kostenlos weiterlernen oder ein passendes Angebot ansehen.</p>
        {task ? <>
          <p className="mt-3 font-semibold text-ink">{task.detail}: {task.label}</p>
          <p className="mt-1 text-sm text-graphite">{task.next}</p>
          <Button {...(task.external ? { href: task.href } : { to: task.href })} variant="ghost" className="mt-2">Gespeicherte Arbeit öffnen</Button>
        </> : <p className="mt-3 text-sm text-graphite" role="status">
          {!loaded ? 'Ihr gespeicherter Lernstand wird geladen.' : loaded.error
            ? 'Ihr gespeicherter Lernstand konnte gerade nicht geladen werden.'
            : 'Hier ist noch kein gespeicherter Kurs-, Grammatik- oder Schreibstand verfügbar. Beginnen Sie mit dem kostenlosen Kurs.'}
        </p>}
        <div className="mt-3 flex flex-wrap gap-3">
          <Button to={freeReturnOption.href} variant="ghost">{freeReturnOption.label}</Button>
          <Button to={offer.href} variant="ghost" className="border border-siegel">{offer.label} · Ansehen</Button>
        </div>
      </Card>
    </div>
  );
}
