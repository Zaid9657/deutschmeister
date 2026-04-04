import { Mic, Lock } from 'lucide-react';

const SpeakingUsageIndicator = ({ usage }) => {
  if (!usage) return null;

  const { tier, allowed, used, limit, unlimited, nextAvailable } = usage;

  // Pro — X/30 this month
  if (tier === 'pro') {
    const pct = limit ? ((used || 0) / limit) * 100 : 0;
    return (
      <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold">
        <Mic className="w-3.5 h-3.5" />
        <span>{used || 0}/{limit}</span>
        <div className="w-12 h-1.5 bg-teal-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-rose-500' : 'bg-teal-500'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span className="text-teal-500 font-normal">diesen Monat</span>
      </div>
    );
  }

  // Trial — X/2 total (lifetime)
  if (tier === 'free_trial') {
    const pct = limit ? ((used || 0) / limit) * 100 : 0;
    return (
      <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
        <Mic className="w-3.5 h-3.5" />
        <span>{used || 0}/{limit}</span>
        <div className="w-12 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span className="text-emerald-500 font-normal">kostenlos</span>
      </div>
    );
  }

  // free_expired or unknown — no access
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold">
      <Lock className="w-3.5 h-3.5" />
      Abo erforderlich
    </div>
  );
};

export default SpeakingUsageIndicator;
