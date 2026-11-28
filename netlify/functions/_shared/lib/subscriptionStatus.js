// Only confirmed paid-through periods grant access. Failed retries never
// extend them; terminal states revoke them even before a stored future date.
export const subscriptionStatus = (subscription, now = Date.now()) => {
  if (!subscription || !subscription.subscription_end ||
      !['active', 'on_trial', 'cancelled', 'past_due', 'paused'].includes(subscription.status)) {
    return { isActive: false, expiresAt: null };
  }

  const endDate = new Date(subscription.subscription_end);
  if (Number.isNaN(endDate.getTime())) {
    return { isActive: false, expiresAt: null };
  }

  return {
    isActive: endDate.getTime() > now,
    expiresAt: subscription.subscription_end,
    planType: subscription.plan_type,
  };
};
