// The H1 and lead at the top of /subscription (revenue agent, 2026-10-08).
//
// WHY THIS FILE EXISTS. /subscription is where the in-app limits and a resumed
// Buy send a learner. Its first screen is a SectionHeading whose title and lead
// were written in English only (17f4f91b, 2026-09-03), on a page whose other
// headings, cards and buttons all switch with isGerman: a learner who had set
// the app to German read "Pick up where you left off" above German plan cards.
// Two claims rode in the same lines:
//   - the trial-over lead said "Choose a plan and keep learning without
//     limits", while Pro meters every AI feature (speaking sessions per month,
//     writing and X-Ray allowances; marketing.js, compared by
//     tests/claims.test.mjs with the functions that enforce them);
//   - the Pro and trial leads offered "add a level course" / "Buy the level you
//     need once" to everyone, while the course section below shows a Buy button
//     only for a live course (checkout id set, not "coming soon") the learner
//     does not own yet. With no such card the lead offered a purchase the page
//     could not sell.
// So the copy lives here, in both languages, and the lead offers a level only
// when the page shows a Buy button for one. Pro is described in the words of
// the Pro section on the same page ("every level and the full AI allowance").
// Copy only: nothing here reads or changes entitlement.
// tests/subscription-heading.test.mjs.
//
// The offer sentences are joined with `+`, not interpolated into the template:
// tests/german-sie.test.mjs reads the string literals of every isGerman branch
// and blanks what sits inside ${…}, so an interpolated sentence would escape it.

/**
 * The heading at the top of /subscription.
 *
 * @param {object} state
 * @param {boolean} state.isSubscribed  hasActiveSubscription()
 * @param {boolean} state.inTrial  isInFreeTrial()
 * @param {number} state.daysLeft  getTrialDaysRemaining()
 * @param {boolean} state.canBuyLevel  the course section shows a Buy button
 * @param {boolean} isGerman  the page's language switch
 * @returns {{ title: string, lead: string }}
 */
export function subscriptionHeadingCopy({ isSubscribed, inTrial, daysLeft, canBuyLevel }, isGerman) {
  if (isSubscribed) {
    return isGerman
      ? {
          title: 'Ihr Plan',
          lead: canBuyLevel
            ? 'Pro ist aktiv. Sie können zusätzlich einen Kurs für eine Stufe kaufen – er gehört Ihnen für immer, was auch immer mit dem Abo passiert.'
            : 'Pro ist aktiv.',
        }
      : {
          title: 'Your plan',
          lead: canBuyLevel
            ? 'Pro is active. You can also add a level course — it stays yours for life, whatever happens to the subscription.'
            : 'Pro is active.',
        };
  }

  if (inTrial) {
    return isGerman
      ? {
          title: 'Wählen Sie, wie es weitergeht',
          lead: `Ihre kostenlose Testphase läuft (noch ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tage'}). `
            + (canBuyLevel
              ? 'Kaufen Sie die Stufe, die Sie brauchen, einmal und behalten Sie sie, oder wählen Sie Pro für jede Stufe und das volle KI-Kontingent.'
              : 'Danach haben Sie mit Pro jede Stufe und das volle KI-Kontingent.'),
        }
      : {
          title: 'Choose how you want to keep going',
          lead: `Your free trial is running (${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left). `
            + (canBuyLevel
              ? 'Buy the level you need once and keep it, or go Pro for every level and the full AI allowance.'
              : 'After it ends, Pro gives you every level and the full AI allowance.'),
        };
  }

  return isGerman
    ? {
        title: 'Machen Sie dort weiter, wo Sie aufgehört haben',
        lead: 'Ihre Testphase ist vorbei, Ihr Fortschritt bleibt. '
          + (canBuyLevel
            ? 'Kaufen Sie die Stufe, die Sie brauchen, einmal und behalten Sie sie, oder wählen Sie Pro für jede Stufe und das volle KI-Kontingent.'
            : 'Mit Pro haben Sie jede Stufe und das volle KI-Kontingent.'),
      }
    : {
        title: 'Pick up where you left off',
        lead: 'Your trial is over, but your progress stays. '
          + (canBuyLevel
            ? 'Buy the level you need once and keep it, or go Pro for every level and the full AI allowance.'
            : 'Go Pro for every level and the full AI allowance.'),
      };
}
