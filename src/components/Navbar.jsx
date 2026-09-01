import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, Globe, LayoutDashboard, Crown, Sparkles, Mic, ClipboardCheck, BookOpen, BookMarked, ChevronDown, Film, Radio, Scan, Headphones, FileText, PlayCircle, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { NAV_GROUPS } from '../data/navigation';
import Logo from './Logo';
import Button from './ui/Button';

// Links come from THE navigation registry (src/data/navigation.js — shared
// byte-identical with the Astro layout); this file only decides how the app
// renders them. Icons are presentation, so they live here, keyed by item key.
const NAV_ICONS = {
  pruefung: GraduationCap,
  grammar: BookOpen,
  videos: PlayCircle,
  listening: Headphones,
  reading: FileText,
  vocabulary: BookMarked,
  podcasts: Radio,
  speaking: Mic,
  'level-test': ClipboardCheck,
  xray: Scan,
  pricing: Crown,
  dashboard: LayoutDashboard,
};

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

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { isInFreeTrial, getTrialDaysRemaining, hasActiveSubscription } = useSubscription();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

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

  const isGerman = i18n.language === 'de';
  const inTrial = user ? isInFreeTrial() : false;
  const isSubscribed = user ? hasActiveSubscription() : false;
  const trialDays = user ? getTrialDaysRemaining() : 0;
  const isAdmin = user?.email === 'zaid199660@gmail.com';

  const label = (item) => (isGerman ? item.labelDe : item.labelEn);
  const visibleGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => isVisible(item, user)),
  }));

  const NavSeparator = () => (
    <div className="w-px h-5 bg-rule" />
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/85 backdrop-blur-md border-b border-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo size={40} showWordmark to="/" />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {visibleGroups.map((group, gi) => (
              <div key={group.key} className="flex items-center gap-1">
                {gi > 0 && <NavSeparator />}
                {group.items.map((item) => (
                  <NavItem
                    key={item.key}
                    item={item}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-graphite hover:text-ink hover:bg-siegel-wash transition-colors"
                  >
                    {label(item)}
                  </NavItem>
                ))}
              </div>
            ))}

            {/* Free CTA for anonymous users */}
            {!user && (
              <>
                <NavSeparator />
                <Link
                  to="/level/a1.1"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-siegel/25 bg-siegel-wash text-siegel-deep text-sm font-semibold hover:border-siegel/50 transition-colors"
                >
                  <Sparkles size={14} />
                  A1.1 Free
                </Link>
              </>
            )}

            <NavSeparator />

            {/* Subscription Status */}
            {user && isSubscribed && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink text-paper text-xs font-semibold">
                <Crown size={12} className="text-gold" />
                Pro
              </span>
            )}
            {user && inTrial && !isSubscribed && (
              <a
                href="/pricing/"
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-siegel-wash text-siegel-deep text-xs font-bold hover:bg-white transition-colors border border-siegel/30"
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
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-siegel text-white text-xs font-semibold hover:bg-siegel-lift transition-colors"
              >
                <Crown size={12} />
                {isGerman ? 'Upgrade' : 'Upgrade'}
              </a>
            )}

            {/* Language Toggle — icon only */}
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-paper-sunk hover:bg-siegel-wash transition-colors text-graphite"
              title={i18n.language === 'en' ? 'Deutsch' : 'English'}
            >
              <Globe size={18} />
            </button>

            {/* User Menu / Auth */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-siegel-wash transition-colors text-graphite"
                >
                  <div className="w-7 h-7 rounded-full bg-paper-sunk flex items-center justify-center">
                    <User size={14} className="text-graphite" />
                  </div>
                  <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1 w-48 bg-white rounded-lg border border-rule shadow-overlay py-1 z-50"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-siegel-wash transition-colors"
                      >
                        <User size={16} />
                        {t('nav.profile')}
                      </Link>
                      <a
                        href="/pricing/"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-siegel-wash transition-colors"
                      >
                        <Crown size={16} />
                        {isGerman ? 'Preise' : 'Pricing'}
                      </a>
                      {isAdmin && (
                        <Link
                          to="/admin/videos"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-siegel-wash transition-colors"
                        >
                          <Film size={16} />
                          Admin: Add Video
                        </Link>
                      )}
                      <div className="border-t border-rule my-1" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-ink hover:bg-siegel-wash transition-colors"
                      >
                        <LogOut size={16} />
                        {t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-2 text-sm font-medium text-graphite hover:text-ink transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Button to="/signup" size="sm">
                  {t('nav.signup')}
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-siegel-wash transition-colors"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-paper border-b border-rule"
          >
            <div className="px-4 py-4 space-y-1">
              {visibleGroups.map((group, gi) => (
                <div key={group.key} className={gi > 0 ? 'border-t border-rule mt-2 pt-2' : ''}>
                  <p className="px-4 py-2 font-data text-[0.6875rem] font-bold text-graphite uppercase tracking-[0.13em]">
                    {isGerman ? group.labelDe : group.labelEn}
                  </p>
                  {group.items.map((item) => {
                    const ItemIcon = NAV_ICONS[item.key] || BookOpen;
                    return (
                      <NavItem
                        key={item.key}
                        item={item}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-siegel-wash transition-colors"
                      >
                        <ItemIcon size={20} className="text-graphite" />
                        <span className="text-ink font-medium">{label(item)}</span>
                      </NavItem>
                    );
                  })}
                </div>
              ))}

              {/* Free CTA for anonymous users */}
              {!user && (
                <div className="border-t border-rule mt-2 pt-2">
                  <Link
                    to="/level/a1.1"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-siegel/25 bg-siegel-wash text-siegel-deep font-semibold"
                  >
                    <Sparkles size={20} />
                    A1.1 Free
                  </Link>
                </div>
              )}

              {/* Subscription status for logged-in users */}
              {user && !isSubscribed && (
                <div className="border-t border-rule mt-2 pt-2">
                  <a
                    href="/pricing/"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-siegel-wash text-siegel-deep border border-siegel/25"
                  >
                    <div className="w-8 h-8 rounded-md bg-siegel flex items-center justify-center flex-shrink-0">
                      <Crown size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {inTrial
                          ? `${trialDays} ${isGerman ? 'Tage Test verbleibend' : `day${trialDays !== 1 ? 's' : ''} trial left`}`
                          : isGerman ? 'Abonnieren' : 'Subscribe'}
                      </p>
                      {inTrial && (
                        <p className="text-xs text-siegel">{isGerman ? 'Jetzt upgraden' : 'Upgrade now'}</p>
                      )}
                    </div>
                  </a>
                </div>
              )}
              {user && isSubscribed && (
                <div className="flex items-center gap-2 px-4 py-2 mt-2 border-t border-rule pt-4">
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink text-paper text-xs font-semibold">
                    <Crown size={12} className="text-gold" />
                    Pro
                  </span>
                </div>
              )}

              {/* Bottom: Language + Auth */}
              <div className="border-t border-rule mt-2 pt-2 space-y-1">
                <button
                  onClick={() => { toggleLanguage(); setIsOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-siegel-wash transition-colors"
                >
                  <Globe size={20} className="text-graphite" />
                  <span className="text-ink font-medium">{i18n.language === 'en' ? 'Deutsch' : 'English'}</span>
                </button>

                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-siegel-wash transition-colors"
                    >
                      <User size={20} className="text-graphite" />
                      <span className="text-ink font-medium">{t('nav.profile')}</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin/videos"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-siegel-wash transition-colors"
                      >
                        <Film size={20} className="text-graphite" />
                        <span className="text-ink font-medium">Admin: Add Video</span>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={20} />
                      <span className="font-medium">{t('nav.logout')}</span>
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 pt-2">
                    <Button
                      to="/login"
                      variant="secondary"
                      size="lg"
                      onClick={() => setIsOpen(false)}
                      className="w-full"
                    >
                      {t('nav.login')}
                    </Button>
                    <Button to="/signup" size="lg" onClick={() => setIsOpen(false)} className="w-full">
                      {t('nav.signup')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
