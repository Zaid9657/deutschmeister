import { coursePriceLine, courseOffer, LAUNCH_ENDS_AT } from '../data/pricing.js';

let initialized = false;
export function enhanceCoursePrices() {
  if (initialized) return;
  initialized = true;
  const refresh = () => {
    document.querySelectorAll('[data-course-price-display]').forEach((node) => {
      node.textContent = coursePriceLine(node.dataset.coursePriceDisplay, Date.now(), node.dataset.priceLanguage);
    });
    document.querySelectorAll('[data-course-schema]').forEach((node) => {
      const schema = JSON.parse(node.textContent);
      schema.offers = courseOffer(node.dataset.courseSchema, Date.now());
      node.textContent = JSON.stringify(schema);
    });
  };
  refresh();
  // A page left open across the deadline must change, too.
  const schedule = () => {
    const until = Date.parse(LAUNCH_ENDS_AT) + 1000 - Date.now();
    if (until > 0) setTimeout(() => { refresh(); schedule(); }, Math.min(until, 2147483647));
  };
  schedule();
  window.addEventListener('pageshow', refresh, { once: true });
  document.addEventListener('visibilitychange', refresh);
}
