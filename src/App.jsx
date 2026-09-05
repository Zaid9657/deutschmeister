import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import LemonSqueezyProvider from './components/LemonSqueezyProvider';
import ProtectedRoute from './components/ProtectedRoute';
import SubscriptionGuard from './components/SubscriptionGuard';
import ExamSubscriptionGuard from './components/ExamSubscriptionGuard';
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
const ReadingLessonPage = lazy(() => import('./pages/ReadingLessonPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const SubscriptionSuccessPage = lazy(() => import('./pages/SubscriptionSuccessPage'));
const ExercisePlayer = lazy(() => import('./pages/Listening/ExercisePlayer'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
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
const VocabularySectionPage = lazy(() => import('./pages/VocabularySectionPage'));
const SentenceXRay = lazy(() => import('./pages/SentenceXRay'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const UeberUnsPage = lazy(() => import('./pages/UeberUnsPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const IntroSlides = lazy(() => import('./components/onboarding/IntroSlides'));
const TelcB1KursPage = lazy(() => import('./pages/TelcB1KursPage'));
const StartDeutsch1KursPage = lazy(() => import('./pages/StartDeutsch1KursPage'));
const ModelltestHub = lazy(() => import('./pages/Modelltest/ModelltestHub'));
const ModelltestOverview = lazy(() => import('./pages/Modelltest/ModelltestOverview'));
const ModelltestRun = lazy(() => import('./pages/Modelltest/ModelltestRun'));
const ModelltestResult = lazy(() => import('./pages/Modelltest/ModelltestResult'));
const SchreibenPage = lazy(() => import('./pages/SchreibenPage'));

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
                    {/* No /vergleich routes — the Astro-built comparison pages
                        (astro-site/src/pages/vergleich/) win in production and the
                        SPA rewrites were deliberately removed; the SPA twins were
                        dead code and got deleted in the renovation. */}
                    {/* No /leitfaden routes on purpose, for the same reason as "/" above.
                        A guide is data in astro-site/src/data/guides/ rendered by
                        pages/leitfaden/[slug].astro, and Netlify serves those real static
                        files before the non-forced /leitfaden/* rewrite below them. The SPA
                        carried a hand-written TelcB1Page twin that nothing could reach —
                        the second "two copies, one dead" pair in this file — so it was
                        deleted. Add a guide in astro-site, never here. */}
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
                    {/* Same course-area posture, but the A1 band has no
                        standalone one-time product — the plan is included
                        with Pro/trial or the A1 course, so this gates on
                        LevelSubscriptionGuard's band-top-sublevel access
                        (a1.2), not PurchaseGuard. */}
                    <Route
                      path="/start-deutsch-1-kurs"
                      element={
                        <LevelSubscriptionGuard level="a1.2">
                          <EmailVerificationGate>
                            <StartDeutsch1KursPage />
                          </EmailVerificationGate>
                        </LevelSubscriptionGuard>
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

                    {/* No /grammar routes — grammar is served ENTIRELY by the Astro
                        build (hub, level lists, and the full interactive lesson with
                        its user_grammar_progress write via
                        astro-site/src/lib/grammarProgress.js). The SPA used to carry a
                        second 1,500-line lesson implementation reachable only via
                        in-app <Link>s — two different lessons on one URL, decided by
                        how you arrived. All in-app grammar links are full-load <a>
                        tags now (trailing-slash class). Deleted in the renovation. */}

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

                    {/* Mock exams — timed practice tests behind the subscription
                        (part of the paid value; A1.1-free stays free elsewhere).
                        The hub stays Pro/trial-only (SubscriptionGuard, unchanged);
                        the three exam-specific routes below use
                        ExamSubscriptionGuard, which additionally admits a
                        band-course buyer for their own band's mock (gated on
                        the band's top sublevel — see that component's header).
                        Also in netlify.toml's SPA allow-list; noindex via the
                        app shell like /telc-b1-kurs. */}
                    <Route
                      path="/modelltest"
                      element={
                        <SubscriptionGuard>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <ModelltestHub />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </SubscriptionGuard>
                      }
                    />
                    <Route
                      path="/modelltest/:examSlug"
                      element={
                        <ExamSubscriptionGuard>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <ModelltestOverview />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </ExamSubscriptionGuard>
                      }
                    />
                    <Route
                      path="/modelltest/:examSlug/run"
                      element={
                        <ExamSubscriptionGuard>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <ModelltestRun />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </ExamSubscriptionGuard>
                      }
                    />
                    <Route
                      path="/modelltest/:examSlug/result/:attemptId"
                      element={
                        <ExamSubscriptionGuard>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <ModelltestResult />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </ExamSubscriptionGuard>
                      }
                    />

                    {/* Writing — same posture as speaking: the page renders for
                        signed-in users, the AI cost is gated server-side in
                        evaluate-writing.mjs (JWT identity + per-tier limits). */}
                    <Route
                      path="/schreiben"
                      element={
                        <ProtectedRoute>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <SchreibenPage />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/schreiben/:examSlug"
                      element={
                        <ProtectedRoute>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <SchreibenPage />
                            </OnboardingGate>
                          </EmailVerificationGate>
                        </ProtectedRoute>
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
                <Footer />
                {/* Mobile app tabs (signed-in only); pb clearance lives on the
                    wrapper so the fixed bar never covers page-end content. */}
                <BottomNav />
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
