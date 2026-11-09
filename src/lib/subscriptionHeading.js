// The H1 and lead at the top of /subscription (revenue agent, 2026-10-08).
//
// WHY THIS FILE EXISTS. /subscription is where the in-app limits and a resumed
// Buy send a learner. Its first screen is a SectionHeading whose title and lead
// were written in English only (17f4f91b, 2026-09-03), on a page whose other
// headings, cards and buttons all switch with isGerman: a learner who had set
// the app to German read "Pick up where you left off" above German plan cards.
// Two claims rode in the same lines:
//   - the trial-over lead said "Choose a plan and keep learning without
//     limits", while AI Practice meters every AI feature (speaking sessions per month,
//     writing and X-Ray allowances; marketing.js, compared by
//     tests/claims.test.mjs with the functions that enforce them);
//   - the AI Practice and trial leads offered "add a level course" / "Buy the level you
//     need once" to everyone, while the course section below shows a Buy button
//     only for a live course (checkout id set, not "coming soon") the learner
//     does not own yet. With no such card the lead offered a purchase the page
//     could not sell.
// So the copy lives here, in both languages, and the lead offers a level only
// when the page shows a Buy button for one. AI Practice is described in the words of
// the AI Practice section on the same page ("every level and the full AI allowance").
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
 * @param {boolean} [state.paymentFailed]  a Lemon Squeezy renewal failed (lib/checkoutAccess.js hasFailedPayment)
 * @param {boolean} isGerman  the page's language switch
 * @returns {{ title: string, lead: string }}
 */
export function subscriptionHeadingCopy({ isSubscribed, inTrial, daysLeft, canBuyLevel, paymentFailed = false }, isGerman) {
  if (isSubscribed) {
    return isGerman
      ? {
          title: 'Ihr Plan',
          lead: canBuyLevel
            ? 'AI Practice ist aktiv. Sie können zusätzlich einen Kurs für eine Stufe kaufen – er bleibt Ihnen dauerhaft erhalten.'
            : 'AI Practice ist aktiv.',
        }
      : {
          title: 'Your plan',
          lead: canBuyLevel
            ? 'AI Practice is active. You can also add a level course — it stays yours for life.'
            : 'AI Practice is active.',
        };
  }

  // A failed renewal (past_due, unpaid) lost AI Practice to a card problem, not to an
  // ended trial: the heading said "Your trial is over" above a "Subscribe now"
  // a subscriber cannot use. The fix is a new card in the billing portal (ACC-04).
  if (paymentFailed) {
    return isGerman
      ? {
          title: 'Ihre letzte Zahlung ist nicht durchgegangen',
          lead: 'Aktualisieren Sie Ihre Karte im Kundenportal, dann läuft AI Practice weiter. Ihr Fortschritt bleibt erhalten.'
            + (canBuyLevel ? ' Oder kaufen Sie die Stufe, die Sie brauchen, einmalig und dauerhaft.' : ''),
        }
      : {
          title: 'Your last payment didn’t go through',
          lead: 'Update your card in the customer portal and AI Practice carries on. Your progress stays.'
            + (canBuyLevel ? ' Or buy the level you need once and keep it.' : ''),
        };
  }

  if (inTrial) {
    return isGerman
      ? {
          title: 'Wählen Sie, wie es weitergeht',
          lead: `Ihre kostenlose Testphase läuft (noch ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tage'}). `
            + (canBuyLevel
              ? 'Kaufen Sie die Stufe, die Sie brauchen, einmalig und dauerhaft – oder wählen Sie AI Practice für die KI-Übungen, ohne Kurszugang.'
              : 'Danach haben Sie mit AI Practice KI-Übungen, ohne Kurszugang.'),
        }
      : {
          title: 'Choose how you want to keep going',
          lead: `Your free trial is running (${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left). `
            + (canBuyLevel
              ? 'Buy the level you need once and keep it, or go AI Practice for AI tools, with course access sold separately.'
              : 'After it ends, AI Practice gives you AI tools. Course access is sold separately.'),
        };
  }

  return isGerman
    ? {
        title: 'Machen Sie dort weiter, wo Sie aufgehört haben',
        lead: 'Ihre Testphase ist vorbei, Ihr Fortschritt bleibt. '
          + (canBuyLevel
            ? 'Kaufen Sie die Stufe, die Sie brauchen, einmalig und dauerhaft – oder wählen Sie AI Practice für die KI-Übungen, ohne Kurszugang.'
            : 'AI Practice ergänzt Ihre Kurse um KI-Übungen. Neue Abonnements enthalten keinen Kurszugang.'),
      }
    : {
        title: 'Pick up where you left off',
        lead: 'Your trial is over, but your progress stays. '
          + (canBuyLevel
            ? 'Buy the level you need once and keep it, or go AI Practice for AI tools, with course access sold separately.'
            : 'Go AI Practice for AI tools, with course access sold separately.'),
      };
}
