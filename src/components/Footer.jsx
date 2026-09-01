import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FOOTER_GROUPS, LEGAL_LINKS } from '../data/navigation';
import Logo from './Logo';

// The app previously had NO footer: the guides, FAQ, Über uns and the
// comparison pages were linked only from the Astro site's footer, so anyone
// inside the app could never reach them. Renders from THE navigation registry
// (src/data/navigation.js) — the same data the Astro footer renders.
const FooterLink = ({ item, children, className }) =>
  item.kind === 'static' ? (
    <a href={item.href} className={className}>{children}</a>
  ) : (
    <Link to={item.href} className={className}>{children}</Link>
  );

const Footer = () => {
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  return (
    <footer className="bg-ink text-paper/70 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Logo size={32} />
              <span className="font-display font-semibold text-white">
                Deutsch<span className="text-siegel-lift">Meister</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              {isGerman
                ? 'Deutsch lernen mit KI — von A1.1 bis B2.2. Grammatik, Sprechen, Hören und Lesen.'
                : 'Learn German with AI — from A1.1 to B2.2. Grammar, speaking, listening, and reading.'}
            </p>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div key={group.key}>
              <h3 className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-white mb-3">
                {isGerman ? group.titleDe : group.titleEn}
              </h3>
              <ul className="space-y-2 text-sm">
                {group.items.map((item) => (
                  <li key={item.href + item.labelEn}>
                    <FooterLink item={item} className="hover:text-white transition-colors">
                      {isGerman ? item.labelDe : item.labelEn}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-6 text-center text-xs">
          <p className="mb-2">
            {LEGAL_LINKS.map((item, i) => (
              <span key={item.href}>
                {i > 0 && <span className="mx-2">·</span>}
                <FooterLink item={item} className="hover:text-white transition-colors">
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
