import { useState, useRef, useEffect } from 'react';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';

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
    <div className="min-h-screen bg-paper font-body text-ink pt-20 pb-16">
      <SEO
        title="Welcome to DeutschMeister"
        description="Watch our introduction video to learn how DeutschMeister helps you master German with grammar lessons, listening exercises, and AI speaking practice."
        path="/intro"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-clay text-center mb-8 py-4">
          <Aurora />
          <div className="relative">
            <div className="mx-auto mb-6 w-20 h-20 rounded-clay bg-siegel flex items-center justify-center animate-pop-in">
              <span className="text-white font-display font-bold text-4xl">D</span>
            </div>
            <h1 className="hero-line font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] text-ink mb-3 sm:text-[3rem]">
              Welcome to DeutschMeister
            </h1>
            <p
              className="hero-line text-[1.0625rem] leading-relaxed text-graphite max-w-xl mx-auto sm:text-[1.1875rem]"
              style={{ '--d': '120ms' }}
            >
              Watch our introduction video to learn how DeutschMeister can help you master German
            </p>
          </div>
        </div>

        {/* Language Selector — pressable chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {LANGUAGES.map(({ code, flag, label }) => (
            <Chip
              key={code}
              size="md"
              raised
              tone={lang === code ? 'ink' : 'quiet'}
              onClick={() => switchLang(code)}
              aria-pressed={lang === code}
              className="px-5 py-2.5"
            >
              {flag} {label}
            </Chip>
          ))}
        </div>

        {/* Video Player — player chrome on ink, controls on siegel elsewhere */}
        <Reveal className="mb-10">
          <div className="relative bg-ink rounded-clay overflow-hidden border border-rule">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/60 z-10">
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
        </Reveal>

        {/* CTA Section */}
        <Reveal delay={90}>
          <Card raised edge="siegel" className="p-8 sm:p-10 text-center">
            <h2 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink mb-3 sm:text-[2.125rem]">
              Ready to start your German journey?
            </h2>
            <p className="text-[0.9375rem] leading-relaxed text-graphite mb-8 max-w-lg mx-auto sm:text-base">
              Structured lessons across 8 CEFR levels, interactive exercises, and AI-powered speaking practice — and A1.1 is free forever.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* The one primary action on this screen — the only shimmer. */}
              <Button to="/signup" size="lg" shimmer className="group">
                Start Learning Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button href="/grammar/" size="lg" variant="secondary">
                <BookOpen className="w-5 h-5" />
                Explore Grammar Topics
              </Button>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
};

export default IntroPage;
