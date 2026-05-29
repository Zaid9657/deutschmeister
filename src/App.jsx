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
import LevelSubscriptionGuard from './components/LevelSubscriptionGuard';
import EmailVerificationGate from './components/EmailVerificationGate';
import OnboardingGate from './components/onboarding/OnboardingGate';
import TrialBanner from './components/TrialBanner';
import FloatingIntroButton from './components/FloatingIntroButton';
import SessionTimeoutModal from './components/SessionTimeoutModal';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { Loader2 } from 'lucide-react';

// Lazy-loaded page components for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
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
const PricingPage = lazy(() => import('./pages/PricingPage'));
const SubscriptionSuccessPage = lazy(() => import('./pages/SubscriptionSuccessPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
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
const TelcB1Page = lazy(() => import('./pages/leitfaden/TelcB1Page'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
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
              <div className="min-h-screen bg-slate-50">
                <Navbar />
                <TrialBanner />
                <FloatingIntroButton />
                <SessionTimeoutWrapper />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LandingPage />} />
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
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/ueber-uns" element={<UeberUnsPage />} />
                    <Route path="/vergleich" element={<VergleichHubPage />} />
                    <Route path="/vergleich/:slug" element={<ComparisonPage />} />
                    <Route path="/leitfaden/telc-b1" element={<TelcB1Page />} />
                    <Route path="/video-library" element={<VideoLibraryPage />} />
                    <Route path="/video-library/:id" element={<VideoDetailPage />} />
                    <Route path="/podcasts" element={<PodcastsPage />} />
                    <Route path="/level-test" element={<LevelTest />} />
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
                    <Route
                      path="/payment/:planType"
                      element={
                        <ProtectedRoute>
                          <EmailVerificationGate>
                            <OnboardingGate>
                              <PaymentPage />
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
