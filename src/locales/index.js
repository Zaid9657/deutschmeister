// Interface-language bundles that are NOT in the entry chunk.
//
// English and German ship inline (src/utils/i18n.js, src/lib/lesson/strings.js)
// as they always have. Arabic is its own chunk: main.jsx loads it BEFORE the
// first render when the resolved locale is Arabic (so an Arabic visitor never
// sees an English flash), and the language switchers load it before they
// switch. An English or German visitor never downloads it.
import i18n from '../utils/i18n';
import { getLocale, setLocale } from '../lib/locale.js';

const loaded = new Set(['en', 'de']);
const LOADERS = {
  ar: () => import('./ar/index.js'),
};

/** Resolves true once `locale`'s strings are registered (false if it could not load). */
export function ensureLocaleResources(locale) {
  if (loaded.has(locale)) return Promise.resolve(true);
  const load = LOADERS[locale];
  if (!load) return Promise.resolve(false);
  return load()
    .then((mod) => {
      mod.register(i18n);
      loaded.add(locale);
      return true;
    })
    .catch((err) => {
      console.error(`[locale] ${locale} bundle failed to load:`, err);
      return false;
    });
}

export const localeResourcesLoaded = (locale) => loaded.has(locale);

/**
 * The one way a switcher changes the language: load the bundle, then switch.
 * A bundle that fails to load leaves the current language in place rather
 * than switching to a table of English fallbacks under an Arabic label.
 */
export function switchLocale(next, { surface = null } = {}) {
  return ensureLocaleResources(next).then((ok) => (ok ? setLocale(next, { surface }) : getLocale()));
}
