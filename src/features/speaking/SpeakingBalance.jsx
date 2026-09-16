// The allowance read-model, rendered — plan Task 4 (speaking-guided-city-map).
//
// Balances live in seconds server-side; people read minutes. The two sources
// are labeled SEPARATELY when both exist (the monthly allowance expires, the
// permanent minutes do not — one aggregated number would mislead), same rule
// the legacy setup screen follows. Display only: the ledger decides charges.
import { Clock } from 'lucide-react';

export function fmtMinutes(seconds) {
  return `${Math.floor(Math.max(0, Number(seconds) || 0) / 60)} min`;
}

export default function SpeakingBalance({ balance, loading }) {
  const monthly = Number(balance?.monthlySeconds) || 0;
  const permanent = Number(balance?.permanentSeconds) || 0;
  const total = Number(balance?.totalSeconds) || 0;
  return (
    <section
      aria-label="Speaking time balance"
      className="rounded-clay border border-[var(--city-hairline)] bg-white/5 p-4"
    >
      <h2 className="flex items-center gap-2 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">
        <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Speaking time
      </h2>
      {loading ? (
        <p className="mt-2 text-sm text-[var(--city-mist-dim)]">Loading your balance…</p>
      ) : (
        <dl className="mt-2 space-y-1.5 text-sm text-[var(--city-mist)]">
          <div className="flex items-baseline justify-between gap-3">
            <dt>Monthly allowance</dt>
            <dd className="font-data font-bold">{fmtMinutes(monthly)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt>Permanent minutes</dt>
            <dd className="font-data font-bold">{fmtMinutes(permanent)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-[var(--city-hairline)] pt-1.5">
            <dt>Total available</dt>
            <dd className="font-data font-bold">{fmtMinutes(total)}</dd>
          </div>
        </dl>
      )}
      <p className="mt-2 text-[0.75rem] leading-relaxed text-[var(--city-mist-faint)]">
        Only the time you actually speak counts. Monthly minutes reset; permanent minutes stay.
      </p>
    </section>
  );
}
