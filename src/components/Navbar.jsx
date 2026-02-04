import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, Globe, Home, LayoutDashboard, BookMarked, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'de' : 'en';
    i18n.changeLanguage(newLang);
    setShowLangMenu(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

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
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Home size={18} />
              {t('nav.home')}
            </Link>

            {user && (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <LayoutDashboard size={18} />
                  {t('nav.dashboard')}
                </Link>
                <Link
                  to="/grammar"
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <BookMarked size={18} />
                  {t('nav.grammar')}
                </Link>
                <Link
                  to="/reading"
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <BookOpen size={18} />
                  {t('nav.reading')}
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <User size={18} />
                  {t('nav.profile')}
                </Link>
              </>
            )}

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700"
            >
              <Globe size={18} />
              <span className="uppercase font-medium">{i18n.language}</span>
            </button>

            {/* Auth Buttons */}
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                <LogOut size={18} />
                {t('nav.logout')}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-700 hover:text-slate-900 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:from-amber-600 hover:to-rose-600 transition-all"
                >
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
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
            className="md:hidden bg-white border-b border-slate-200"
          >
            <div className="px-4 py-4 space-y-3">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Home size={20} />
                {t('nav.home')}
              </Link>

              {user && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <LayoutDashboard size={20} />
                    {t('nav.dashboard')}
                  </Link>
                  <Link
                    to="/grammar"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <BookMarked size={20} />
                    {t('nav.grammar')}
                  </Link>
                  <Link
                    to="/reading"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <BookOpen size={20} />
                    {t('nav.reading')}
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <User size={20} />
                    {t('nav.profile')}
                  </Link>
                </>
              )}

              <button
                onClick={toggleLanguage}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Globe size={20} />
                <span>{i18n.language === 'en' ? 'Deutsch' : 'English'}</span>
              </button>

              <div className="pt-3 border-t border-slate-200">
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-slate-800 text-white"
                  >
                    <LogOut size={20} />
                    {t('nav.logout')}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="block w-full px-4 py-3 text-center rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsOpen(false)}
                      className="block w-full px-4 py-3 text-center rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white"
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
