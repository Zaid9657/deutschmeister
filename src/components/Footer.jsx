import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FOOTER_GROUPS, LEGAL_LINKS, SOCIAL_LINKS, SUPPORT_LINK } from '../data/navigation';
import { SOCIAL_ICONS } from './socialIcons';
import { trackSocialClicked } from '../lib/funnelTracking';
import { STATIONS } from '../data/offers.js';
import { groundFor } from '../lib/chrome.js';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import { LifeBuoy } from 'lucide-react';

// The app previously had NO footer: the guides, FAQ, Über uns and the
// comparison pages were linked only from the Astro site's footer, so anyone
// inside the app could never reach them. Renders from THE navigation registry
// (src/data/navigation.js) — the same data the Astro footer renders.
//
// v3 "Die Linie": the end of the line, ported from the Astro footer
// (astro-site/src/layouts/Layout.astro). Night ground, the eight stations drawn
// flat on the yellow line (each a link to its course page), then every door.
// On a route whose page is itself night (src/lib/chrome.js `groundFor`) the top
// margin goes, so no paper band separates the page from the footer.
const FooterLink = ({ item, children, className }) =>
  item.kind === 'static' ? (
    <a href={item.href} className={className}>{children}</a>
  ) : (
    <Link to={item.href} className={className}>{children}</Link>
  );

const stationNote = (st, isGerman) => {
  if (st.status === 'free') return isGerman ? 'Kostenlos' : 'Free';
  if (st.status === 'building') return 'Im Bau';
  return st.priceLabel;
};

const Footer = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isGerman = i18n.language === 'de';
  const flush = groundFor(pathname) === 'nacht';

  return (
    <footer className={`dm-site-footer bg-nacht text-nacht-muted ${flush ? '' : 'mt-20'}`} data-ground="nacht">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="dm-footer-invitation"><p>{isGerman ? <>Machen Sie Deutsch<br/>zu <em>Ihrer Sprache.</em></> : <>Make yourself at home<br/>in <em>German.</em></>}</p><a href="/course/a1.1" className="dm-footer-button">{isGerman ? 'A1.1 kostenlos starten ↗' : 'Start A1.1 free ↗'}</a></div>
        <nav aria-label={isGerman ? 'Kurse nach Niveau' : 'Courses by level'} className="dm-footer-levels"><span>{isGerman ? 'Ihr Niveau' : 'Find your level'}</span>{STATIONS.map((st) => <a key={st.level} href={st.coursePage}><strong>{st.code}</strong><small>{stationNote(st, isGerman)}</small></a>)}</nav>

        <div className="grid gap-10 border-t border-nacht-rule py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Logo size={32} face="chrome" />
            </div>
            <p className="text-sm leading-relaxed">
              {isGerman
                ? 'Deutsch für Ihren Alltag, von A1.1 bis B2.2: geführte Kurse, Grammatik, Hören, Lesen und KI-Sprechtraining.'
                : 'German for everyday life, from A1.1 to B2.2: guided courses, grammar, listening, reading and AI speaking practice.'}
            </p>
            {!user && (
              <p className="mt-4">
                <Link
                  to="/signup"
                  className="text-sm font-semibold text-nacht-text underline decoration-linie decoration-2 underline-offset-4"
                >
                  {isGerman ? 'Kostenloses Konto erstellen' : 'Create a free account'}
                </Link>
              </p>
            )}
            {/* Off-site channels — on EVERY app screen, not only the podcasts
                tab. URLs from the registry; one icon per registry key. */}
            <ul className="mt-4 flex flex-wrap items-center gap-x-4 text-sm">
              {SOCIAL_LINKS.map((item) => {
                const Icon = SOCIAL_ICONS[item.key];
                return (
                <li key={item.key}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackSocialClicked(item.key, 'footer')}
                    className="inline-flex min-h-11 items-center gap-2 hover:text-nacht-text transition-colors"
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {isGerman ? item.labelDe : item.labelEn}
                  </a>
                </li>
                );
              })}
            </ul>
            {/* The one way to reach a human — on every full-chrome screen. */}
            <p className="mt-1 text-sm">
              <FooterLink item={SUPPORT_LINK} className="inline-flex min-h-11 items-center gap-2 font-semibold text-nacht-text hover:text-siegel-deep transition-colors">
                <LifeBuoy className="w-4 h-4" aria-hidden="true" />
                {isGerman ? SUPPORT_LINK.labelDe : SUPPORT_LINK.labelEn}
              </FooterLink>
            </p>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div key={group.key}>
              <h2 className="mb-3 font-body text-sm font-[650] text-nacht-text">
                {isGerman ? group.titleDe : group.titleEn}
              </h2>
              <ul className="space-y-1 text-sm">
                {group.items.map((item) => (
                  <li key={item.href + item.labelEn}>
                    <FooterLink item={item} className="inline-flex min-h-9 items-center hover:text-nacht-text transition-colors">
                      {isGerman ? item.labelDe : item.labelEn}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-nacht-rule py-6 text-center text-xs">
          <p className="mb-2">
            {LEGAL_LINKS.map((item, i) => (
              <span key={item.href}>
                {i > 0 && <span className="mx-2">·</span>}
                <FooterLink item={item} className="hover:text-nacht-text transition-colors">
                  {isGerman ? item.labelDe : item.labelEn}
                </FooterLink>
              </span>
            ))}
          </p>
          © {new Date().getFullYear()} DeutschMeister · All rights reserved
        </div>
      </div>
    </footer>
  );
};

export default Footer;
