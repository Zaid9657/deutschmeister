// LemonSqueezy configuration for DeutschMeister
export const LEMONSQUEEZY_CONFIG = {
  storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID || '309512',

  plans: {
    monthly: {
      name: 'Pro Monthly',
      tier: 'pro',
      price: 9.99,
      currency: 'EUR',
      interval: 'month',
      variantId: import.meta.env.VITE_LEMONSQUEEZY_MONTHLY_VARIANT_ID || 'dfc81ca3-78f5-4bab-9d62-dca75b3f7e21',
      features: [
        'Full access to all 8 levels (A1.1–B2.2)',
        'All grammar lessons with exercises',
        'Listening comprehension exercises',
        'Podcasts & video content',
        'Progress tracking',
        '5 speaking sessions per month',
        'Cancel anytime',
      ],
    },
    yearly: {
      name: 'Pro Yearly',
      tier: 'pro',
      price: 79.99,
      currency: 'EUR',
      interval: 'year',
      variantId: import.meta.env.VITE_LEMONSQUEEZY_YEARLY_VARIANT_ID || 'd58c1838-d935-4c59-a0ac-0bfce8ec9c3b',
      features: [
        'Everything in Pro Monthly',
        'Save 33% compared to monthly',
        'Priority support',
        'Early access to new content',
      ],
      savings: '33%',
    },
    premiumMonthly: {
      name: 'Premium Monthly',
      tier: 'premium',
      price: 24.99,
      currency: 'EUR',
      interval: 'month',
      variantId: '35d5a630-5fd2-417b-9100-fab542fd9dfc',
      features: [
        'Everything in Pro',
        'Unlimited speaking practice',
        'Priority AI response',
        'Cancel anytime',
      ],
    },
    premiumYearly: {
      name: 'Premium Yearly',
      tier: 'premium',
      price: 199.99,
      currency: 'EUR',
      interval: 'year',
      variantId: 'f189cf9e-feed-477e-9dd3-fad5c3c22c3c',
      features: [
        'Everything in Pro',
        'Unlimited speaking practice',
        'Priority AI response',
        'Priority support',
      ],
      savings: '33%',
    },
  },

  // Generate checkout URL with user info
  getCheckoutUrl: (variantId, userEmail, userId) => {
    const baseUrl = `https://deutsch-meister.lemonsqueezy.com/checkout/buy/${variantId}`;
    const params = new URLSearchParams({
      'checkout[email]': userEmail || '',
      'checkout[custom][user_id]': userId || '',
    });
    return `${baseUrl}?${params.toString()}`;
  },
};
