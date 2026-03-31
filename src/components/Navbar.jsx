import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, Globe, LayoutDashboard, Crown, Sparkles, Mic, ClipboardCheck, BookOpen, PlayCircle, ChevronDown, Film, Radio, Scan } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

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

  const NavSeparator = () => (
    <div className="w-px h-5 bg-slate-200" />
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-rose-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-display font-bold text-xl">D</span>
            </div>
            <span className="font-display font-semibold text-xl text-slate-800 hidden sm:block">
              DeutschMeister
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Content Links */}
            <Link to="/grammar" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              {isGerman ? 'Grammatik' : 'Grammar'}
            </Link>
            <Link to="/video-library" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              Videos
            </Link>
            <Link to="/podcasts" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              Podcasts
            </Link>
            {user && (
              <Link to="/speaking" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                {isGerman ? 'Sprechen' : 'Speaking'}
              </Link>
            )}

            <NavSeparator />

            {/* Tools */}
            <Link to="/level-test" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              {isGerman ? 'Einstufungstest' : 'Level Test'}
            </Link>
            <Link to="/analyze" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              <Scan size={14} />
              {isGerman ? 'Satz-Analyse' : 'X-Ray'}
            </Link>
            {user && (
              <Link to="/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                Dashboard
              </Link>
            )}

            {/* Free CTA for anonymous users */}
            {!user && (
              <>
                <NavSeparator />
                <Link
                  to="/level/a1.1"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors"
                >
                  <Sparkles size={14} />
                  A1.1 Free
                </Link>
              </>
            )}

            <NavSeparator />

            {/* Subscription Status */}
            {user && isSubscribed && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold">
                <Crown size={12} />
                Pro
              </span>
            )}
            {user && inTrial && !isSubscribed && (
              <Link
                to="/pricing"
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-xs font-bold hover:from-amber-200 hover:to-orange-200 transition-all border border-amber-200"
              >
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping opacity-75" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
                <Sparkles size={12} />
                {trialDays}d {isGerman ? 'Test' : 'trial'}
              </Link>
            )}
            {user && !inTrial && !isSubscribed && (
              <Link
                to="/pricing"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                <Crown size={12} />
                {isGerman ? 'Upgrade' : 'Upgrade'}
              </Link>
            )}

            {/* Language Toggle — icon only */}
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
              title={i18n.language === 'en' ? 'Deutsch' : 'English'}
            >
              <Globe size={18} />
            </button>

            {/* User Menu / Auth */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                    <User size={14} className="text-slate-600" />
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
                      className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <User size={16} />
                        {t('nav.profile')}
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin/videos"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Film size={16} />
                          Admin: Add Video
                        </Link>
                      )}
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
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
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-rose-600 transition-all"
                >
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
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
            className="lg:hidden bg-white border-b border-slate-200"
          >
            <div className="px-4 py-4 space-y-1">
              {/* Content Section */}
              <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isGerman ? 'Lernen' : 'Learn'}
              </p>
              <Link
                to="/grammar"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <BookOpen size={20} className="text-slate-500" />
                <span className="text-slate-700 font-medium">{isGerman ? 'Grammatik' : 'Grammar'}</span>
              </Link>
              <Link
                to="/video-library"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <PlayCircle size={20} className="text-slate-500" />
                <span className="text-slate-700 font-medium">Videos</span>
              </Link>
              <Link
                to="/podcasts"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Radio size={20} className="text-slate-500" />
                <span className="text-slate-700 font-medium">Podcasts</span>
              </Link>
              {user && (
                <Link
                  to="/speaking"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Mic size={20} className="text-slate-500" />
                  <span className="text-slate-700 font-medium">{isGerman ? 'Sprechen' : 'Speaking'}</span>
                </Link>
              )}

              {/* Tools Section */}
              <div className="border-t border-slate-100 mt-2 pt-2">
                <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {isGerman ? 'Werkzeuge' : 'Tools'}
                </p>
                <Link
                  to="/level-test"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ClipboardCheck size={20} className="text-slate-500" />
                  <span className="text-slate-700 font-medium">{isGerman ? 'Einstufungstest' : 'Level Test'}</span>
                </Link>
                <Link
                  to="/analyze"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Scan size={20} className="text-slate-500" />
                  <span className="text-slate-700 font-medium">{isGerman ? 'Satz-Analyse' : 'Sentence X-Ray'}</span>
                </Link>
                {user && (
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <LayoutDashboard size={20} className="text-slate-500" />
                    <span className="text-slate-700 font-medium">Dashboard</span>
                  </Link>
                )}
              </div>

              {/* Free CTA for anonymous users */}
              {!user && (
                <div className="border-t border-slate-100 mt-2 pt-2">
                  <Link
                    to="/level/a1.1"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-semibold"
                  >
                    <Sparkles size={20} />
                    A1.1 Free
                  </Link>
                </div>
              )}

              {/* Subscription status for logged-in users */}
              {user && !isSubscribed && (
                <div className="border-t border-slate-100 mt-2 pt-2">
                  <Link
                    to="/pricing"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Crown size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {inTrial
                          ? `${trialDays} ${isGerman ? 'Tage Test verbleibend' : `day${trialDays !== 1 ? 's' : ''} trial left`}`
                          : isGerman ? 'Abonnieren' : 'Subscribe'}
                      </p>
                      {inTrial && (
                        <p className="text-xs text-amber-500">{isGerman ? 'Jetzt upgraden' : 'Upgrade now'}</p>
                      )}
                    </div>
                  </Link>
                </div>
              )}
              {user && isSubscribed && (
                <div className="flex items-center gap-2 px-4 py-2 mt-2 border-t border-slate-100 pt-4">
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold">
                    <Crown size={12} />
                    Pro
                  </span>
                </div>
              )}

              {/* Bottom: Language + Auth */}
              <div className="border-t border-slate-100 mt-2 pt-2 space-y-1">
                <button
                  onClick={() => { toggleLanguage(); setIsOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Globe size={20} className="text-slate-500" />
                  <span className="text-slate-700 font-medium">{i18n.language === 'en' ? 'Deutsch' : 'English'}</span>
                </button>

                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <User size={20} className="text-slate-500" />
                      <span className="text-slate-700 font-medium">{t('nav.profile')}</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin/videos"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Film size={20} className="text-slate-500" />
                        <span className="text-slate-700 font-medium">Admin: Add Video</span>
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
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="block w-full px-4 py-3 text-center rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors text-slate-700 font-medium"
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsOpen(false)}
                      className="block w-full px-4 py-3 text-center rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold"
                    >
                      {t('nav.signup')}
                    </Link>
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
