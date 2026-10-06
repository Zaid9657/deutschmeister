import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Languages } from 'lucide-react';
import i18n from '../../utils/i18n';
import { isArabicReadyRoute, useLocale } from '../../lib/locale.js';
import { switchLocale } from '../../locales';
import { safeGet, safeSet } from '../../utils/safeStorage';

const DISMISS_KEY = 'dm_locale_fallback_seen';

/**
 * The fallback policy, made visible (docs/arabic/README.md §3). An Arabic-locale
 * visitor on a screen that has no Arabic translation yet gets that screen in
 * English, left-to-right — never a silent half-Arabic mix — under this Arabic
 * notice, which says so and offers the two honest exits: keep reading in
 * English, or go back to the course, which IS in Arabic. The notice itself is
 * Arabic (lang="ar", dir="rtl") inside an English document.
 */
export default function LocaleFallbackNotice() {
  const { pathname } = useLocation();
  const [locale] = useLocale();
  const [dismissedFor, setDismissedFor] = useState(() => safeGet(DISMISS_KEY, { session: true }));
  useEffect(() => { setDismissedFor(safeGet(DISMISS_KEY, { session: true })); }, [pathname]);

  if (locale !== 'ar' || isArabicReadyRoute(pathname) || dismissedFor === pathname) return null;
  const ar = (key) => i18n.t(key, { lng: 'ar' });
  const dismiss = () => {
    safeSet(DISMISS_KEY, pathname, { session: true });
    setDismissedFor(pathname);
  };
  return (
    <aside
      lang="ar"
      dir="rtl"
      role="region"
      aria-label={ar('localeFallback.label')}
      className="relative z-40 mx-auto mt-20 max-w-3xl px-4"
    >
      <div className="flex flex-col gap-3 rounded-clay border border-siegel/30 bg-siegel-wash p-4 text-start text-[0.9375rem] leading-relaxed text-ink sm:flex-row sm:items-center">
        <Languages className="h-5 w-5 shrink-0 text-siegel-deep" aria-hidden="true" />
        <p className="flex-1">{ar('localeFallback.body')}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={dismiss} className="min-h-11 rounded-pill border border-siegel px-4 text-sm font-bold text-siegel-deep hover:bg-white">
            {ar('localeFallback.continueEnglish')}
          </button>
          <Link to="/course/a1.1" className="inline-flex min-h-11 items-center rounded-pill bg-siegel px-4 text-sm font-bold text-white hover:bg-siegel-deep">
            {ar('localeFallback.backToCourse')}
          </Link>
          <button type="button" onClick={() => switchLocale('en', { surface: 'fallback' })} className="min-h-11 rounded-pill px-3 text-sm font-bold text-graphite underline-offset-2 hover:underline" lang="en" dir="ltr">
            English
          </button>
        </div>
      </div>
    </aside>
  );
}
