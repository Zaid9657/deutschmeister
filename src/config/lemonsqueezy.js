// LemonSqueezy configuration for DeutschMeister
export const LEMONSQUEEZY_CONFIG = {
  storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID || '309512',

  plans: {
    monthly: {
      name: 'Pro Monthly',
      price: 9.99,
      currency: 'EUR',
      interval: 'month',
      variantId: import.meta.env.VITE_LEMONSQUEEZY_MONTHLY_VARIANT_ID || 'dfc81ca3-78f5-4bab-9d62-dca75b3f7e21',
      features: [
        'Full access to all 8 levels (A1.1 - B2.2)',
        'All grammar lessons with exercises',
        'Listening comprehension exercises',
        'Podcasts & video content',
        'Progress tracking',
        'Cancel anytime'
      ]
    },
    yearly: {
      name: 'Pro Yearly',
      price: 79.99,
      currency: 'EUR',
      interval: 'year',
      variantId: import.meta.env.VITE_LEMONSQUEEZY_YEARLY_VARIANT_ID || 'd58c1838-d935-4c59-a0ac-0bfce8ec9c3b',
      features: [
        'Everything in Monthly, plus:',
        'Save 33% compared to monthly',
        'Priority support',
        'Early access to new content'
      ],
      savings: '33%'
    }
  },

  // Generate checkout URL with user info
  getCheckoutUrl: (variantId, userEmail, userId) => {
    const baseUrl = `https://deutsch-meister.lemonsqueezy.com/checkout/buy/${variantId}`;
    const params = new URLSearchParams({
      'checkout[email]': userEmail || '',
      'checkout[custom][user_id]': userId || '',
    });
    return `${baseUrl}?${params.toString()}`;
  }
};
