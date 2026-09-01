import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import Navbar from './components/Navbar';
import LemonSqueezyProvider from './components/LemonSqueezyProvider';
import ProtectedRoute from './components/ProtectedRoute';
import SubscriptionGuard from './components/SubscriptionGuard';
import PurchaseGuard from './components/PurchaseGuard';
import LevelSubscriptionGuard from './components/LevelSubscriptionGuard';
import EmailVerificationGate from './components/EmailVerificationGate';
import OnboardingGate from './components/onboarding/OnboardingGate';
import TrialBanner from './components/TrialBanner';
import FloatingIntroButton from './components/FloatingIntroButton';
import SessionTimeoutModal from './components/SessionTimeoutModal';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { Loader2 } from 'lucide-react';

// Lazy-loaded page components for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LevelPage = lazy(() => import('./pages/LevelPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const GrammarLessonPage = lazy(() => import('./pages/GrammarLessonPage'));
const ReadingLessonPage = lazy(() => import('./pages/ReadingLessonPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const SubscriptionSuccessPage = lazy(() => import('./pages/SubscriptionSuccessPage'));
const ExercisePlayer = lazy(() => import('./pages/Listening/ExercisePlayer'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const GrammarSectionPage = lazy(() => import('./pages/GrammarSectionPage'));
const GrammarTopicsPage = lazy(() => import('./pages/GrammarTopicsPage'));
const ReadingSectionPage = lazy(() => import('./pages/ReadingSectionPage'));
const ReadingLessonsPage = lazy(() => import('./pages/ReadingLessonsPage'));
const ListeningHome = lazy(() => import('./pages/Listening/ListeningHome'));
const LevelExercises = lazy(() => import('./pages/Listening/LevelExercises'));
const SpeakingPage = lazy(() => import('./pages/SpeakingPage'));
const LevelTest = lazy(() => import('./pages/LevelTest'));
const VideoLibraryPage = lazy(() => import('./pages/VideoLibraryPage'));
const VideoDetailPage = lazy(() => import('./pages/VideoDetailPage'));
const IntroPage = lazy(() => import('./pages/IntroPage'));
const AdminVideosPage = lazy(() => import('./pages/AdminVideosPage'));
const PodcastsPage = lazy(() => import('./pages/PodcastsPage'));
const GrammarOverviewPage = lazy(() => import('./pages/GrammarOverviewPage'));
const VocabularySectionPage = lazy(() => import('./pages/VocabularySectionPage'));
const SentenceXRay = lazy(() => import('./pages/SentenceXRay'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const UeberUnsPage = lazy(() => import('./pages/UeberUnsPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const IntroSlides = lazy(() => import('./components/onboarding/IntroSlides'));
const VergleichHubPage = lazy(() => import('./pages/VergleichHubPage'));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'));
const TelcB1KursPage = lazy(() => import('./pages/TelcB1KursPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-graphite" />
    </div>
  );
}

function SessionTimeoutWrapper() {
  const { showWarning, stayLoggedIn } = useSessionTimeout();
  return <SessionTimeoutModal show={showWarning} onStay={stayLoggedIn} />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <LemonSqueezyProvider>
          <ThemeProvider>
            <ProgressProvider>
              <div className="min-h-screen bg-paper">
                {/* Keyboard users land here first and can jump the nav. The SPA
                    had no skip link and no <main> landmark at all. */}
                <a
                  href="#main"
                  className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-ink focus:shadow-overlay focus:ring-2 focus:ring-siegel"
                >
                  Skip to content
                </a>
                <Navbar />
                <TrialBanner />
                <FloatingIntroButton />
                <SessionTimeoutWrapper />
                <main id="main">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes */}
                    {/* No "/" route on purpose. In production netlify.toml serves the
                        Astro-built homepage (astro-site/src/pages/index.astro) at "/", and
                        the SPA only ever handles the allow-listed routes below. The SPA
                        used to carry its own divergent LandingPage here, which no link
                        could reach after the August remediation made every in-app "/"
                        link a full page load — two homepages, one of them dead. On the
                        Vite dev server "/" now falls through to NotFoundPage; open
                        astro-site to work on the real homepage. */}
                    <Route path="/intro" element={<IntroPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/update-password" element={<UpdatePasswordPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute>
                          <EmailVerificationGate>
                            <IntroSlides />
                          </EmailVerificationGate>
                        </ProtectedRoute>
                      }
                    />

                    {/* Subscription/pricing pages (require auth only, not subscription) */}
                    <Route
                      path="/subscription"
                      element={
                        <ProtectedRoute>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <SubscriptionPage />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/ueber-uns" element={<UeberUnsPage />} />
                    <Route path="/vergleich" element={<VergleichHubPage />} />
                    <Route path="/vergleich/:slug" element={<ComparisonPage />} />
                    {/* No /leitfaden routes on purpose, for the same reason as "/" above.
                        A guide is data in astro-site/src/data/guides/ rendered by
                        pages/leitfaden/[slug].astro, and Netlify serves those real static
                        files. The SPA carried a hand-written TelcB1Page twin that nothing
                        could reach — the second "two copies, one dead" pair in this file —
                        so it was deleted. Add a guide in astro-site, never here.

                        There is no /leitfaden/* rewrite in netlify.toml any more either:
                        static files already win, so the rule could only ever catch a slug
                        that does not exist, and answered it 200 + shell + NotFoundPage.
                        Unknown guide slugs now reach the /* catch-all and return a real
                        404. The two /vergleich routes above are in the same position —
                        Astro owns those URLs; the components are only reachable via
                        client-side navigation and are queued for deletion. */}
                    <Route path="/video-library" element={<VideoLibraryPage />} />
                    <Route path="/video-library/:id" element={<VideoDetailPage />} />
                    <Route path="/podcasts" element={<PodcastsPage />} />
                    <Route path="/level-test" element={<LevelTest />} />
                    {/* Course areas — one-time product entitlements, gated by
                        PurchaseGuard (purchases table), not the subscription:
                        a bought course stays reachable after its included Pro
                        window expires. Also in netlify.toml's SPA allow-list. */}
                    <Route
                      path="/telc-b1-kurs"
                      element={
                        <PurchaseGuard productKey="telc_b1_komplett">
                          <EmailVerificationGate>
                            <TelcB1KursPage />
                          </EmailVerificationGate>
                        </PurchaseGuard>
                      }
                    />
                    <Route
                      path="/subscription/success"
                      element={
                        <ProtectedRoute>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <SubscriptionSuccessPage />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </ProtectedRoute>
                      }
                    />

                    {/* Dashboard & Profile (require auth + email verification + subscription/trial) */}
                    <Route
                      path="/dashboard"
                      element={
                        <SubscriptionGuard>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <DashboardPage />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </SubscriptionGuard>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <SubscriptionGuard>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <ProfilePage />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </SubscriptionGuard>
                      }
                    />

                    {/* Level-aware routes — A1.1 is free, others require auth + email verification + subscription */}
                    <Route
                      path="/level/:level"
                      element={
                        <LevelSubscriptionGuard>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <LevelPage />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </LevelSubscriptionGuard>
                      }
                    />

                    {/* Grammar — section & topic list are public, lessons are level-gated */}
                    <Route path="/grammar" element={<GrammarSectionPage />} />
                    <Route path="/grammar/overview" element={<GrammarOverviewPage />} />
                    <Route path="/grammar/:level" element={<GrammarTopicsPage />} />
                    <Route
                      path="/grammar/:level/:topicSlug"
                      element={
                        <LevelSubscriptionGuard>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <GrammarLessonPage />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </LevelSubscriptionGuard>
                      }
                    />

                    {/* Reading — section overview is public, level pages are level-gated */}
                    <Route path="/reading" element={<ReadingSectionPage />} />
                    <Route
                      path="/reading/:level"
                      element={
                        <LevelSubscriptionGuard>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <ReadingLessonsPage />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </LevelSubscriptionGuard>
                      }
                    />
                    <Route
                      path="/reading/:level/:lessonId"
                      element={
                        <LevelSubscriptionGuard>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <ReadingLessonPage />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </LevelSubscriptionGuard>
                      }
                    />

                    {/* Vocabulary — section overview is public */}
                    <Route path="/vocabulary" element={<VocabularySectionPage />} />

                    {/* Listening — section overview is public, level pages are level-gated */}
                    <Route path="/listening" element={<ListeningHome />} />
                    <Route
                      path="/listening/:level"
                      element={
                        <LevelSubscriptionGuard>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <LevelExercises />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </LevelSubscriptionGuard>
                      }
                    />
                    <Route
                      path="/listening/:level/:exerciseNumber"
                      element={
                        <LevelSubscriptionGuard>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <ExercisePlayer />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </LevelSubscriptionGuard>
                      }
                    />

                    {/* Speaking — fully gated (AI costs) */}
                    <Route
                      path="/speaking"
                      element={
                        <EmailVerificationGate>
                          <OnboardingGate>
                            <SpeakingPage />
                          </OnboardingGate>
                        </EmailVerificationGate>
                      }
                    />

                    {/* Sentence X-Ray — public tool */}
                    <Route path="/analyze" element={<SentenceXRay />} />

                    {/* Admin */}
                    <Route
                      path="/admin/videos"
                      element={
                        <ProtectedRoute>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <AdminVideosPage />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 page */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
                </main>
              </div>
            </ProgressProvider>
          </ThemeProvider>
          </LemonSqueezyProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
