import { useEffect } from 'react';

/**
 * The tab title and the document language of a course screen (2026-11-25): the course screens sit behind sign-in or
 * preview and carry no head tags of their own, so every Lektion, checkpoint and review had the site's generic title,
 * and `<html lang>` stayed English in Deutsch-Modus. Not for public pages: those use components/SEO.jsx.
 */
export function useScreenTitle(title, lang) {
  useEffect(() => {
    if (!title) return undefined;
    const before = document.title;
    document.title = `${title} | DeutschMeister`;
    return () => { document.title = before; };
  }, [title]);
  useEffect(() => {
    if (!lang) return undefined;
    const before = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => { document.documentElement.lang = before; };
  }, [lang]);
}
