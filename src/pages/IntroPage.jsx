import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import SEO from '../components/SEO';

const STORAGE_KEY = 'dm_intro_lang';

const VIDEOS = {
  en: 'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/video-library/intro/Master_German.mp4',
  ar: 'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/video-library/intro/DeutschMeister.mp4',
};

const IntroPage = () => {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'en'; }
    catch { return 'en'; }
  });
  const videoRef = useRef(null);

  const switchLang = (newLang) => {
    if (newLang === lang) return;
    setLang(newLang);
    try { localStorage.setItem(STORAGE_KEY, newLang); } catch {}
  };

  // Swap video source and reload when language changes
  useEffect(() => {
    if (videoRef.current) {
      const wasPlaying = !videoRef.current.paused;
      videoRef.current.src = VIDEOS[lang];
      videoRef.current.load();
      if (wasPlaying) videoRef.current.play().catch(() => {});
    }
  }, [lang]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-16">
      <SEO
        title="Welcome to DeutschMeister"
        description="Watch our introduction video to learn how DeutschMeister helps you master German with grammar lessons, listening exercises, and AI speaking practice."
        path="/intro"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6 w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-rose-400 to-purple-500 flex items-center justify-center shadow-2xl shadow-rose-500/25"
          >
            <span className="text-white font-display font-bold text-4xl">D</span>
          </motion.div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
            Welcome to DeutschMeister
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Watch our introduction video to learn how DeutschMeister can help you master German
          </p>
        </motion.div>

        {/* Language Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex justify-center gap-2 mb-6"
        >
          <button
            onClick={() => switchLang('en')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              lang === 'en'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            🇬🇧 English
          </button>
          <button
            onClick={() => switchLang('ar')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              lang === 'ar'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            🇸🇦 العربية
          </button>
        </motion.div>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
            <video
              ref={videoRef}
              controls
              className="w-full aspect-video"
              preload="metadata"
              key={lang}
            >
              <source src={VIDEOS[lang]} type="video/mp4" />
              Your browser does not support video.
            </video>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 sm:p-10 text-center"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
            Ready to start your German journey?
          </h2>
          <p className="text-slate-600 mb-8 max-w-lg mx-auto">
            Join thousands of learners mastering German with structured lessons, interactive exercises, and AI-powered speaking practice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold rounded-2xl shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 transition-all"
            >
              Start Learning Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/grammar"
              className="inline-flex items-center gap-2 px-6 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Explore Grammar Topics
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default IntroPage;
