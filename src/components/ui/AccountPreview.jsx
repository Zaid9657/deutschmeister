import { FREE_LEVEL_LABEL } from '../../data/marketing.js';
import { COURSE_PRO_MONTHS } from '../../data/pricing.js';

/** Presentation only: no session, purchase-intent or entitlement dependencies. */
export default function AccountPreview() {
  return (
    <aside className="hidden w-full max-w-sm self-start rounded-xl border border-rule bg-nacht p-7 text-nacht-text lg:block" data-ground="nacht" aria-label="Your learning route">
      <p className="font-data text-xs font-bold uppercase tracking-widest text-siegel-deep">Deutsch, in Bewegung</p>
      <h2 className="mt-4 font-display text-dm-section">Your next step has a place.</h2>
      <ol className="mt-6 space-y-5 border-l border-nacht-rule pl-5">
        <li><strong>{FREE_LEVEL_LABEL} · the free first course</strong><p className="mt-1 text-sm text-nacht-muted">Try the whole course without an account. An account lets you return to your progress.</p></li>
        <li><strong>A1.2 · continue the journey</strong><p className="mt-1 text-sm text-nacht-muted">A separate course purchase keeps that level open, with {COURSE_PRO_MONTHS} months of AI Practice included.</p></li>
        <li><strong>AI Practice · your practice tools</strong><p className="mt-1 text-sm text-nacht-muted">The account trial and a course purchase are different choices. Creating an account does not buy a course.</p></li>
      </ol>
      <a href="/courses/a1-2/#course-proof-a1-2-all" className="mt-6 inline-block font-bold text-siegel-deep underline underline-offset-4">See a real course example →</a>
    </aside>
  );
}
