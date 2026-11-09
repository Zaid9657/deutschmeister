import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FOOTER_GROUPS, LEGAL_LINKS, SOCIAL_LINKS, SUPPORT_LINK } from '../data/navigation';
import { SOCIAL_ICONS } from './socialIcons';
import { trackSocialClicked } from '../lib/funnelTracking';
import Logo from './Logo';
const FooterLink = ({ item, children }) => item.kind === 'static' ? <a href={item.href}>{children}</a> : <Link to={item.href}>{children}</Link>;
export default function Footer() {
  const { i18n } = useTranslation();
  const de = i18n.language === 'de';
  const list = (items) => <ul>{items.map((item) => <li key={item.href + item.labelEn}><FooterLink item={item}>{de ? item.labelDe : item.labelEn}</FooterLink></li>)}</ul>;
  return <footer className="c4-site-footer"><div className="c4-wrap c4-footer-grid">
    <div className="c4-footer-brand"><Logo size={32} face="chrome" wordmarkTone="inverse" /><p>{de ? 'Praktisches Deutsch für Ihren Alltag in Deutschland.' : 'Practical German for real life in Germany.'}</p><FooterLink item={SUPPORT_LINK}>{de ? SUPPORT_LINK.labelDe : SUPPORT_LINK.labelEn}</FooterLink></div>
    {FOOTER_GROUPS.map((group) => <div className="c4-footer-group" key={group.key}><h2>{de ? group.titleDe : group.titleEn}</h2>{list(group.items.slice(0, 4))}{group.items.length > 4 && <details><summary>{de ? 'Mehr entdecken' : 'More resources'}</summary>{list(group.items.slice(4))}</details>}</div>)}
    <ul className="c4-footer-socials">{SOCIAL_LINKS.map((item) => { const Icon = SOCIAL_ICONS[item.key]; return <li key={item.key}><a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={de ? item.labelDe : item.labelEn} onClick={() => trackSocialClicked(item.key, 'footer')}><Icon size={22} aria-hidden="true" /></a></li>; })}</ul>
  </div><div className="c4-wrap c4-footer-legal">{LEGAL_LINKS.map((item) => <FooterLink key={item.href} item={item}>{de ? item.labelDe : item.labelEn}</FooterLink>)}<span>© {new Date().getFullYear()} DeutschMeister</span></div></footer>;
}
