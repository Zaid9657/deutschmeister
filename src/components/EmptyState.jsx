import { Inbox } from 'lucide-react';
import Card from './ui/Card';

/**
 * Neutral "nothing here" panel for content areas that legitimately have no rows.
 *
 * Distinct from DataState, which covers loading and failure. This is for the
 * expected-empty case, and it must never leak internals — the level pages used
 * to render the queried table name and RLS hints straight to learners.
 */
export default function EmptyState({ title, message, action = null }) {
  return (
    <Card tone="sunk" className="p-8 text-center">
      <Inbox className="w-10 h-10 text-graphite/60 mx-auto mb-4" aria-hidden="true" />
      <h3 className="font-display text-lg font-semibold text-ink mb-2">{title}</h3>
      {message && <p className="text-sm text-graphite max-w-md mx-auto">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}
