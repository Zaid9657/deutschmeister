import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import Button from '../components/ui/Button';

const STORAGE_KEY = 'dm_intro_lang';
const BASE_URL = 'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/video-library/intro';

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'English', file: 'Master_German.mp4' },
  { code: 'ar', flag: '🇸🇦', label: 'العربية', file: 'DeutschMeister.mp4' },
  { code: 'es', flag: '🇪🇸', label: 'Español', file: 'deutschmeister_intro_spanish.mp4' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский', file: 'deutschmeister_intro_russian.mp4' },
  { code: 'hi', flag: '🇮🇳', label: 'हिन्दी', file: 'deutschmeister_intro_hindi.mp4' },
  { code: 'zh', flag: '🇨🇳', label: '中文', file: 'deutschmeister_intro_chinese.mp4' },
];

const IntroPage = () => {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'en'; }
    catch { return 'en'; }
  });
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);

  const currentVideo = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  const videoUrl = `${BASE_URL}/${currentVideo.file}`;

  const switchLang = (newLang) => {
    if (newLang === lang) return;
    setLang(newLang);
    setLoading(true);
    try { localStorage.setItem(STORAGE_KEY, newLang); } catch {}
  };

  // Swap video source and reload when language changes
  useEffect(() => {
    if (videoRef.current) {
      const wasPlaying = !videoRef.current.paused;
      videoRef.current.src = videoUrl;
      videoRef.current.load();
      if (wasPlaying) videoRef.current.play().catch(() => {});
    }
  }, [videoUrl]);

  const handleCanPlay = () => setLoading(false);

  return (
    <div className="min-h-screen bg-paper pt-20 pb-16">
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
            className="mx-auto mb-6 w-20 h-20 rounded-lg bg-siegel flex items-center justify-center"
          >
            <span className="text-white font-display font-bold text-4xl">D</span>
          </motion.div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-3">
            Welcome to DeutschMeister
          </h1>
          <p className="text-lg text-graphite max-w-xl mx-auto">
            Watch our introduction video to learn how DeutschMeister can help you master German
          </p>
        </motion.div>

        {/* Language Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap justify-center gap-2 mb-6"
        >
          {LANGUAGES.map(({ code, flag, label }) => (
            <button
              key={code}
              onClick={() => switchLang(code)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                lang === code
                  ? 'bg-siegel text-white'
                  : 'bg-white border border-rule text-graphite hover:border-siegel hover:shadow-sm'
              }`}
            >
              {flag} {label}
            </button>
          ))}
        </motion.div>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="relative bg-black rounded-2xl overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                <Loader2 className="w-10 h-10 animate-spin text-white" />
              </div>
            )}
            <video
              ref={videoRef}
              controls
              className="w-full aspect-video"
              preload="metadata"
              key={lang}
              onCanPlay={handleCanPlay}
              onLoadedData={handleCanPlay}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support video.
            </video>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl border border-rule p-8 sm:p-10 text-center"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-3">
            Ready to start your German journey?
          </h2>
          <p className="text-graphite mb-8 max-w-lg mx-auto">
            Structured lessons across 8 CEFR levels, interactive exercises, and AI-powered speaking practice — and A1.1 is free forever.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button to="/signup" size="lg" className="group">
              Start Learning Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <a
              href="/grammar/"
              className="inline-flex items-center gap-2 px-6 py-4 border-2 border-rule text-ink font-semibold rounded-2xl hover:border-siegel hover:bg-siegel-wash transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Explore Grammar Topics
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default IntroPage;
