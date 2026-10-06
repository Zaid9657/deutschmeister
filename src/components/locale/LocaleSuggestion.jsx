import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SUGGESTION_DISMISSED_KEY, getLocaleResolution, isArabicReadyRoute, useLocale } from '../../lib/locale.js';
import { switchLocale } from '../../locales';
import { safeGet, safeSet } from '../../utils/safeStorage';

/**
 * Step 4 of the locale precedence: a browser that asks for Arabic, on a device
 * with no saved choice, is OFFERED Arabic — never switched automatically and
 * never by IP. Shown only on screens that exist in Arabic, dismissed for good
 * with one tap. Its two lines are deliberately inline here: they are shown
 * BEFORE the Arabic bundle is loaded (that is the point of the offer), and two
 * literals do not justify loading it.
 */
export default function LocaleSuggestion() {
  const { pathname } = useLocation();
  const [locale] = useLocale();
  const [hidden, setHidden] = useState(() => safeGet(SUGGESTION_DISMISSED_KEY) === '1');
  const resolution = getLocaleResolution();
  if (hidden || locale !== 'en' || !resolution || !resolution.suggest || !isArabicReadyRoute(pathname)) return null;
  const dismiss = () => {
    safeSet(SUGGESTION_DISMISSED_KEY, '1');
    setHidden(true);
  };
  return (
    <aside lang="ar" dir="rtl" aria-label="اقتراح اللغة" className="fixed inset-x-3 bottom-24 z-[60] mx-auto max-w-md rounded-clay border border-rule bg-white p-4 shadow-overlay sm:bottom-6">
      <p className="text-[0.9375rem] leading-relaxed text-ink">هل تريد استخدام DeutschMeister بالعربية؟ تبقى التمارين باللغة الألمانية.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => { dismiss(); switchLocale('ar', { surface: 'suggestion' }); }} className="min-h-11 rounded-pill bg-siegel px-4 text-sm font-bold text-white hover:bg-siegel-deep">
          العربية
        </button>
        <button type="button" onClick={dismiss} className="min-h-11 rounded-pill border border-rule px-4 text-sm font-bold text-graphite hover:text-ink">
          لا، شكرًا
        </button>
      </div>
    </aside>
  );
}
