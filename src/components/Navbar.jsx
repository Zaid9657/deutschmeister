import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, User, Globe, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { NAV_GROUPS, SUPPORT_LINK } from '../data/navigation';
import { STATIONS } from '../data/offers.js';
import { courseHomeFor } from '../lib/courseEntry.js';
import { isAdminEmail } from '../config/admins';
import { TRIAL_DAYS } from '../data/marketing.js';
import Logo from './Logo';

const NavItem = ({ item, children, ...props }) => item.kind === 'static'
  ? <a href={item.href} {...props}>{children}</a>
  : <Link to={item.href} {...props}>{children}</Link>;
const PROMOTED = ['ai-practice', 'how-it-works', 'pricing'];

export default function Navbar() {
  const { i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { isInFreeTrial, getTrialDaysRemaining, hasActiveSubscription, hasLevelAccess, profile, purchases } = useSubscription();
  const location = useLocation();
  const isGerman = i18n.language === 'de';
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const continueHref = courseHomeFor({ level: profile?.current_level, hasLevelAccess, purchases });
  const isSubscribed = user && hasActiveSubscription();
  const inTrial = user && isInFreeTrial();
  const isAdmin = Boolean(profile?.role) || isAdminEmail(user?.email);
  const label = (item) => isGerman ? item.labelDe : item.labelEn;
  const visible = NAV_GROUPS.flatMap((g) => g.items).filter((i) => i.auth === 'any' || (user ? i.auth === 'authed' : i.auth === 'anon'));
  const promoted = PROMOTED.map((key) => visible.find((i) => i.key === key)).filter(Boolean);
  const others = visible.filter((i) => !PROMOTED.includes(i.key));
  const toggleLanguage = () => i18n.changeLanguage(isGerman ? 'en' : 'de');
  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setIsOpen(false);
    await signOut();
    window.location.assign('/');
  };
  useEffect(() => {
    const close = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    const escape = (e) => { if (e.key === 'Escape') { setUserMenuOpen(false); setIsOpen(false); } };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, []);
  useEffect(() => { setIsOpen(false); setUserMenuOpen(false); }, [location.pathname]);
  const account = <>
    <button type="button" className="c4-language-button" onClick={toggleLanguage} aria-label={isGerman ? 'Switch to English' : 'Switch to German'}><Globe size={18} /></button>
    {user ? <div ref={userMenuRef} className="c4-account-menu"><button type="button" className="c4-language-button" aria-label={isGerman ? 'Konto' : 'Account'} aria-expanded={userMenuOpen} onClick={() => setUserMenuOpen(!userMenuOpen)}><User size={20} /></button>{userMenuOpen && <div className="c4-account-panel"><Link to="/profile">{isGerman ? 'Profil' : 'Profile'}</Link><a href="/pricing/">{isSubscribed ? 'AI Practice' : inTrial ? `${getTrialDaysRemaining()}d trial` : isGerman ? 'Preise' : 'Pricing'}</a><Link to={SUPPORT_LINK.href}>{label(SUPPORT_LINK)}</Link>{isAdmin && <Link to="/admin"><ShieldCheck size={16} /> Admin</Link>}<button type="button" onClick={handleSignOut}><LogOut size={16} /> {isGerman ? 'Abmelden' : 'Log out'}</button></div>}</div>
      : <Link to="/login" state={{ from: location }}>{isGerman ? 'Anmelden' : 'Log in'}</Link>}
    {user ? <Link to={continueHref} className="c4-button">{isGerman ? 'Weiterlernen' : 'Continue learning'}</Link> : <Link to="/course/a1.1" className="c4-button">{isGerman ? 'A1.1 gratis starten' : 'Start A1.1 free'}</Link>}
  </>;
  return <nav className="c4-site-nav" data-ground="paper" aria-label="Main"><div className="c4-wrap c4-nav-inner">
    <Logo face="chrome" size={38} />
    <div className="c4-desktop-nav"><details className="c4-nav-dropdown"><summary>{isGerman ? 'Kurse' : 'Courses'} <span aria-hidden="true">⌄</span></summary><div className="c4-dropdown-panel">{others.map((item) => <NavItem key={item.key} item={item}>{label(item)}</NavItem>)}</div></details>{promoted.map((item) => <NavItem key={item.key} item={item}>{label(item)}</NavItem>)}</div>
    <div className="c4-nav-account">{account}</div>
    <div className="c4-mobile-menu"><button type="button" className="c4-menu-toggle" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} aria-controls="app-mobile-menu" aria-label={isOpen ? 'Close menu' : 'Open menu'}>{isOpen ? <X size={26} /> : <Menu size={26} />}</button>{isOpen && <div id="app-mobile-menu" className={`c4-mobile-panel ${user ? 'c4-mobile-panel-authed' : ''}`}>
      <a href="/courses/" className="c4-menu-heading">{isGerman ? 'Kurse' : 'Courses'}</a><ol className="c4-mobile-levels" aria-label={isGerman ? 'Kurse nach Niveau' : 'Courses by level'}>{STATIONS.map((st) => <li key={st.level}><a href={st.coursePage}><strong>{st.code}</strong><span>{st.status === 'free' ? isGerman ? 'Kostenlos' : 'Free' : st.status === 'building' ? isGerman ? 'Als Nächstes' : 'Coming next' : st.priceLabel}</span></a></li>)}</ol>
      {promoted.map((item) => <NavItem key={item.key} item={item} onClick={() => setIsOpen(false)}>{label(item)}</NavItem>)}<details><summary>{isGerman ? 'Mehr zum Lernen' : 'More ways to learn'}</summary>{others.map((item) => <NavItem key={item.key} item={item} onClick={() => setIsOpen(false)}>{label(item)}</NavItem>)}</details>
      {user ? <Link to={continueHref} className="c4-button" onClick={() => setIsOpen(false)}>{isGerman ? 'Weiterlernen' : 'Continue learning'}</Link> : <Link to="/course/a1.1" className="c4-button c4-button-coral" onClick={() => setIsOpen(false)}>{isGerman ? 'A1.1 kostenlos starten' : 'Start A1.1 free'}</Link>}
      {!user && <Link to="/signup" onClick={() => setIsOpen(false)}>{isGerman ? `${TRIAL_DAYS} Tage testen` : `Start ${TRIAL_DAYS}-day trial`}</Link>}
      <div className="c4-mobile-account">{account}</div>
    </div>}</div>
  </div></nav>;
}
