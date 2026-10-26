YOUR ASPECT:
**6. Conversion path & UX — from landing to paid, on mobile and desktop.**
Sub-questions: (a) walk each money path in code and capture: home → course/signup; pricing → checkout (src/config/lemonsqueezy.js, checkout code, buyIntent.js, dm_buy_intent resume, /subscription?buy=); telc page → ?; exam route → ?; (b) signup flow: fields, email confirmation (32% unconfirmed per FACTS), Supabase email rate-limit failures (58 attempts in 60d per FACTS) — root cause and whether it is fixed (custom SMTP?); (c) mobile layout defects in capture/shots (360px hero clipping — find the CSS cause in astro-site), cookie banner, tap targets, CTA count; (d) checkout friction: Lemon Squeezy overlay vs redirect, email-matching requirement, VAT display, payment methods; (e) dead ends (coming-soon cards, unavailable telc, 404s, SPA routes). Give a step-by-step funnel with the leak at each step and the fix.


