// Admin panel — who am I, what may I do, and what needs attention.
//
// The shell calls this once on mount (and on refresh). It requires SOME role
// (capability null): a learner without a role gets 403 and the shell renders
// "Kein Zugriff" instead of an empty sidebar. Badges are best-effort: a
// failed count is `null` and renders NO badge — never a zero, because "no
// open items" and "we could not check" must not look identical.

import { adminEndpoint, deployDiagnostics } from './_shared/adminHttp.mjs';
import { roleMatrix } from './_shared/adminRbacLib.mjs';
import { isFailedPayment } from './_shared/adminOpsLib.mjs';

async function countFailedPayments(supabase) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, subscription_end')
    .in('status', ['past_due', 'unpaid']);
  if (error) throw new Error(error.message);
  return (data || []).filter(isFailedPayment).length;
}

async function countOpenTickets(supabase) {
  const { count, error } = await supabase
    .from('support_tickets')
    .select('*', { count: 'exact', head: true })
    .in('status', ['new', 'open', 'waiting_user']);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function bestEffort(fn) {
  try {
    return await fn();
  } catch (e) {
    console.warn('[admin-session] badge count failed:', e.message);
    return null;
  }
}

export const handler = adminEndpoint({ capability: null }, async ({ auth, supabase }) => {
  const [payments, support] = await Promise.all([
    bestEffort(() => countFailedPayments(supabase)),
    bestEffort(() => countOpenTickets(supabase)),
  ]);
  return {
    user: { id: auth.userId, email: auth.email },
    badges: { payments, support },
    roles: roleMatrix(),
    generatedAt: new Date().toISOString(),
    diagnostics: deployDiagnostics(),
  };
});
