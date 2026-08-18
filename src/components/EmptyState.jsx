import { Inbox } from 'lucide-react';

/**
 * Neutral "nothing here" panel for content areas that legitimately have no rows.
 *
 * Distinct from DataState, which covers loading and failure. This is for the
 * expected-empty case, and it must never leak internals — the level pages used
 * to render the queried table name and RLS hints straight to learners.
 */
export default function EmptyState({ title, message, action = null }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
      <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      {message && <p className="text-sm text-slate-600 max-w-md mx-auto">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
