import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Menu, X, User, LogOut, Globe, Crown, Sparkles, ChevronDown, Film, ShieldCheck, LifeBuoy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { isAdminEmail } from '../config/admins';
import { NAV_GROUPS, SUPPORT_LINK } from '../data/navigation';
import { STATIONS } from '../data/offers.js';
import { groundFor } from '../lib/chrome.js';
import { courseHomeFor } from '../lib/courseEntry.js';
import Logo from './Logo';
import Button from './ui/Button';

// The trial button derives its length (CLAUDE.md: derive, never retype).
import { TRIAL_DAYS } from '../data/marketing.js';

// v3 "Die Linie" (docs/redesign-2026-10/art-direction.md): the bar is a station
// sign, ported from the Astro chrome (astro-site/src/layouts/Layout.astro) so a
// learner crossing between the two front ends sees one bar.
//   * Paper by default; night on routes whose first screen is a nacht ground
//     (src/lib/chrome.js `groundFor`), so bar and page read as one surface.
//   * Courses and Pricing are promoted into the bar itself, the two doors a
//     buyer looks for, and leave their groups so no link appears twice.
//   * One key: "Start A1.1 free" for visitors, "Continue learning" for learners.
//   * The phone menu is a timetable on the night ground: every station first.
//   * Labels are set in the body face at 650 — what the Astro chrome renders on
//     every library page (data-sign="off"). The app never loads the sign face.
// Links come from THE navigation registry (src/data/navigation.js — shared
// byte-identical with the Astro layout); this file only decides how the app
// renders them.

const PROMOTED = ['courses', 'pricing'];
const LABEL = 'font-body font-[650]';

const isVisible = (item, user) =>
  item.auth === 'any' || (user ? item.auth === 'authed' : item.auth === 'anon');

// kind 'static' pages are served by the Astro build — an in-app <Link> would
// render a dead or shadowed SPA twin, so they must be full page loads.
const NavItem = ({ item, className, children, onClick }) =>
  item.kind === 'static' ? (
    <a href={item.href} className={className} onClick={onClick}>{children}</a>
  ) : (
    <Link to={item.href} className={className} onClick={onClick}>{children}</Link>
  );

const stationNote = (st, isGerman) => {
  if (st.status === 'free') return isGerman ? 'kostenlos' : 'free';
  if (st.status === 'building') return 'Im Bau';
  return st.priceLabel;
};

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { isInFreeTrial, getTrialDaysRemaining, hasActiveSubscription, hasLevelAccess, profile } = useSubscription();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  // index.css's reduced-motion gate only reaches CSS; framer-motion animates in
  // JS, so the menus ask for themselves: fade only, no travel, no scale.
  const reduceMotion = useReducedMotion();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'de' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const night = groundFor(pathname) === 'nacht';
  const isGerman = i18n.language === 'de';
  const inTrial = user ? isInFreeTrial() : false;
  const isSubscribed = user ? hasActiveSubscription() : false;
  const trialDays = user ? getTrialDaysRemaining() : 0;
  // The admin link shows for any staff role (profiles.role, read server-side on
  // every admin request) — the email list only bridges the moment before the
  // profile has loaded. Showing a link is not authorisation.
  const isAdmin = Boolean(profile?.role) || isAdminEmail(user?.email);
  // "Continue learning" resumes the learner's course, never a bare /dashboard
  // (a paywall for a free learner — the same rule as BottomNav's Kurs tab).
  const continueHref = courseHomeFor({ level: profile?.current_level, hasLevelAccess });

  const label = (item) => (isGerman ? item.labelDe : item.labelEn);
  const allItems = NAV_GROUPS.flatMap((g) => g.items).filter((item) => isVisible(item, user));
  const promoted = PROMOTED.map((key) => allItems.find((i) => i.key === key)).filter(Boolean);
  const visibleGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => isVisible(item, user) && !PROMOTED.includes(item.key)),
  })).filter((g) => g.items.length > 0);
  const sheetItems = allItems.filter((item) => !PROMOTED.includes(item.key));
  const trialLabel = isGerman ? `${TRIAL_DAYS} Tage testen` : `Start ${TRIAL_DAYS}-day trial`;

  // Tone pairs: [paper, night].
  const tone = (paper, nacht) => (night ? nacht : paper);
  const chip = tone('border border-siegel/30 bg-siegel-wash text-siegel-deep hover:bg-white', 'border border-nacht-rule bg-nacht-raised text-nacht-text hover:border-linie');

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md ${tone('bg-paper/90 border-rule text-ink', 'bg-nacht/90 border-nacht-rule text-nacht-text')}`}
      data-ground={night ? 'nacht' : 'paper'}
      aria-label="Main"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1536px]">
        <div className="flex items-center justify-between h-16">
          <Logo
            size={38}
            showWordmark
            face="chrome"
            to="/"
            wordmarkClassName={user ? '' : 'hidden sm:inline'}
          />

          <div className="flex items-center gap-2 lg:gap-1">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {promoted.map((item) => (
                <NavItem
                  key={item.key}
                  item={item}
                  className={`${LABEL} flex min-h-11 items-center whitespace-nowrap rounded-pill px-3.5 py-2 text-[0.9375rem] transition-colors ${tone('text-ink hover:bg-paper-sunk', 'text-nacht-text hover:bg-nacht-raised')}`}
                >
                  {label(item)}
                </NavItem>
              ))}
              {visibleGroups.map((group) => (
                <details key={group.key} className="group relative">
                  <summary className={`${LABEL} flex min-h-11 cursor-pointer list-none items-center gap-1.5 whitespace-nowrap rounded-pill px-3.5 py-2 text-[0.9375rem] transition-colors [&::-webkit-details-marker]:hidden ${tone('text-graphite hover:bg-paper-sunk hover:text-ink', 'text-nacht-muted hover:bg-nacht-raised hover:text-nacht-text')}`}>
                    {isGerman ? group.labelDe : group.labelEn}
                    <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-56 rounded-clay border border-rule bg-white p-2 text-ink shadow-overlay">
                    {group.items.map((item) => (
                      <NavItem
                        key={item.key}
                        item={item}
                        className="flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-graphite transition-colors hover:bg-siegel-wash hover:text-siegel-deep"
                      >
                        {label(item)}
                      </NavItem>
                    ))}
                  </div>
                </details>
              ))}

              <div className={`mx-2 h-5 w-px ${tone('bg-rule', 'bg-nacht-rule')}`} />

              {/* Subscription Status */}
              {user && isSubscribed && (
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-pill text-xs font-semibold ${tone('bg-ink text-paper', 'bg-nacht-raised text-nacht-text')}`}>
                  <Crown size={12} className="text-gold" />
                  Pro
                </span>
              )}
              {user && inTrial && !isSubscribed && (
                <a
                  href="/pricing/"
                  className={`relative flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-pill px-3 py-1.5 text-xs font-bold transition-colors ${chip}`}
                >
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gold animate-ping opacity-75" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gold" />
                  <Sparkles size={12} />
                  {trialDays}d {isGerman ? 'Test' : 'trial'}
                </a>
              )}
              {user && !inTrial && !isSubscribed && (
                <a
                  href="/pricing/"
                  className={`flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-pill px-3 py-1.5 text-xs font-bold transition-colors ${chip}`}
                >
                  <Crown size={12} />
                  Upgrade
                </a>
              )}

              {/* Language Toggle — icon only */}
              <button
                onClick={toggleLanguage}
                className={`flex items-center justify-center w-11 h-11 rounded-pill transition-colors ${tone('text-graphite hover:bg-paper-sunk hover:text-ink', 'text-nacht-muted hover:bg-nacht-raised hover:text-nacht-text')}`}
                title={i18n.language === 'en' ? 'Deutsch' : 'English'}
                aria-label={i18n.language === 'en' ? 'Switch to German' : 'Switch to English'}
              >
                <Globe size={18} />
              </button>

              {/* User Menu / Auth */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex min-h-11 items-center gap-1.5 rounded-pill px-2.5 py-2 transition-colors ${tone('text-graphite hover:bg-paper-sunk', 'text-nacht-muted hover:bg-nacht-raised')}`}
                    aria-label={isGerman ? 'Konto' : 'Account'}
                    aria-expanded={userMenuOpen}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center ${tone('bg-paper-sunk', 'bg-nacht-raised')}`}>
                      <User size={14} />
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
                        className="absolute right-0 mt-1 w-48 origin-top-right bg-white rounded-clay border border-rule shadow-overlay p-1 z-50 text-ink"
                      >
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-graphite hover:bg-siegel-wash hover:text-siegel-deep transition-colors"
                        >
                          <User size={16} />
                          {t('nav.profile')}
                        </Link>
                        <a
                          href="/pricing/"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-graphite hover:bg-siegel-wash hover:text-siegel-deep transition-colors"
                        >
                          <Crown size={16} />
                          {isGerman ? 'Preise' : 'Pricing'}
                        </a>
                        <Link
                          to={SUPPORT_LINK.href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-graphite hover:bg-siegel-wash hover:text-siegel-deep transition-colors"
                        >
                          <LifeBuoy size={16} />
                          {label(SUPPORT_LINK)}
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-graphite hover:bg-siegel-wash hover:text-siegel-deep transition-colors"
                          >
                            <ShieldCheck size={16} />
                            Admin-Panel
                          </Link>
                        )}
                        <div className="border-t border-rule my-1" />
                        <button
                          onClick={handleSignOut}
                          className="flex min-h-11 items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-semibold text-graphite hover:bg-siegel-wash hover:text-siegel-deep transition-colors"
                        >
                          <LogOut size={16} />
                          {t('nav.logout')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`${LABEL} flex min-h-11 items-center whitespace-nowrap px-3 py-2 text-[0.9375rem] transition-colors ${tone('text-graphite hover:text-ink', 'text-nacht-muted hover:text-nacht-text')}`}
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/signup"
                    className={`${LABEL} flex min-h-11 items-center whitespace-nowrap px-3 py-2 text-[0.9375rem] underline decoration-2 underline-offset-4 transition-colors ${tone('text-ink decoration-rule hover:decoration-siegel', 'text-nacht-text decoration-nacht-rule hover:decoration-linie')}`}
                  >
                    {trialLabel}
                  </Link>
                </>
              )}

              {user && (
                <Button to={continueHref} variant="primary" shape="pill" className="ml-1 whitespace-nowrap">
                  {isGerman ? 'Weiterlernen' : 'Continue learning'}
                </Button>
              )}
            </div>

            {/* The free first stop: one key at every width (Layout.astro "Start A1.1 free"). */}
            {!user && (
              <Button to="/course/a1.1" variant="primary" shape="pill" className="whitespace-nowrap lg:ml-1">
                {isGerman ? 'A1.1 gratis starten' : 'Start A1.1 free'}
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`lg:hidden flex h-11 w-11 items-center justify-center rounded-pill transition-colors ${tone('hover:bg-paper-sunk', 'hover:bg-nacht-raised')}`}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation — the timetable: every station, then every door, on the night ground. */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            // Signed in, BottomNav (4rem + the safe area) is fixed over the sheet's
            // foot, so the sheet scrolls its last row clear of it.
            className={`lg:hidden max-h-[calc(100svh-4rem)] overflow-y-auto border-t border-nacht-rule bg-nacht px-4 pt-4 text-nacht-text shadow-overlay ${user ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom))]' : 'pb-[calc(1.5rem+env(safe-area-inset-bottom))]'}`}
            data-ground="nacht"
          >
            <ol className="mb-4 grid grid-cols-4 gap-2" aria-label={isGerman ? 'Kurse nach Niveau' : 'Courses by level'}>
              {STATIONS.map((st) => (
                <li key={st.level}>
                  <a
                    href={st.coursePage}
                    className="flex min-h-11 flex-col items-center justify-center rounded-xl border border-nacht-rule bg-nacht-raised px-1 py-2 text-center"
                  >
                    <span className="font-body text-[1rem] font-extrabold tabular-nums">{st.code}</span>
                    <span className={`mt-0.5 font-data text-[0.625rem] ${st.status === 'free' ? 'text-linie' : 'text-nacht-muted'}`}>
                      {stationNote(st, isGerman)}
                    </span>
                  </a>
                </li>
              ))}
            </ol>

            {promoted.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                onClick={() => setIsOpen(false)}
                className={`${LABEL} flex min-h-11 items-center border-b border-nacht-rule text-[1.0625rem]`}
              >
                {label(item)}
              </NavItem>
            ))}
            {sheetItems.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                onClick={() => setIsOpen(false)}
                className="flex min-h-11 items-center border-b border-nacht-rule text-[0.9375rem] font-semibold text-nacht-muted"
              >
                {label(item)}
              </NavItem>
            ))}

            {/* Subscription status for logged-in users */}
            {user && !isSubscribed && (
              <a
                href="/pricing/"
                onClick={() => setIsOpen(false)}
                className="mt-4 flex items-center gap-3 rounded-xl border border-nacht-rule bg-nacht-raised px-4 py-3"
              >
                <Crown size={18} className="text-gold" />
                <span>
                  <span className="block text-sm font-semibold">
                    {inTrial
                      ? `${trialDays} ${isGerman ? 'Tage Test verbleibend' : `day${trialDays !== 1 ? 's' : ''} trial left`}`
                      : isGerman ? 'Abonnieren' : 'Subscribe'}
                  </span>
                  {inTrial && (
                    <span className="block text-xs text-nacht-muted">{isGerman ? 'Jetzt upgraden' : 'Upgrade now'}</span>
                  )}
                </span>
              </a>
            )}
            {user && isSubscribed && (
              <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold">
                <Crown size={14} className="text-gold" />
                Pro
              </p>
            )}

            {/* Language + account */}
            <button
              onClick={() => { toggleLanguage(); setIsOpen(false); }}
              className="mt-2 flex min-h-11 w-full items-center gap-3 border-b border-nacht-rule text-[0.9375rem] font-semibold text-nacht-muted"
            >
              <Globe size={18} />
              {i18n.language === 'en' ? 'Deutsch' : 'English'}
            </button>

            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-11 items-center gap-3 border-b border-nacht-rule text-[0.9375rem] font-semibold text-nacht-muted"
                >
                  <User size={18} />
                  {t('nav.profile')}
                </Link>
                <Link
                  to={SUPPORT_LINK.href}
                  onClick={() => setIsOpen(false)}
                  className="flex min-h-11 items-center gap-3 border-b border-nacht-rule text-[0.9375rem] font-semibold text-nacht-muted"
                >
                  <LifeBuoy size={18} />
                  {label(SUPPORT_LINK)}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/videos"
                    onClick={() => setIsOpen(false)}
                    className="flex min-h-11 items-center gap-3 border-b border-nacht-rule text-[0.9375rem] font-semibold text-nacht-muted"
                  >
                    <Film size={18} />
                    Admin: Add Video
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex min-h-11 w-full items-center gap-3 text-[0.9375rem] font-semibold text-nacht-muted"
                >
                  <LogOut size={18} />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <div className="mt-5 grid gap-3">
                <Button to="/course/a1.1" variant="linie" shape="pill" size="lg" onClick={() => setIsOpen(false)} className="w-full">
                  {isGerman ? 'A1.1 kostenlos starten — ohne Konto' : 'Start A1.1 free — no account'}
                </Button>
                <Button to="/signup" variant="ghostNacht" shape="pill" size="lg" onClick={() => setIsOpen(false)} className="w-full">
                  {trialLabel}
                </Button>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="py-2 text-center text-sm font-semibold text-nacht-text underline decoration-linie decoration-2 underline-offset-4"
                >
                  {t('nav.login')}
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
