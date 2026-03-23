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
import TrialBanner from './components/TrialBanner';
import FloatingIntroButton from './components/FloatingIntroButton';
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

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
    </div>
  );
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
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/intro" element={<IntroPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/update-password" element={<UpdatePasswordPage />} />

                    {/* Subscription/pricing pages (require auth only, not subscription) */}
                    <Route
                      path="/subscription"
                      element={
                        <ProtectedRoute>
                          <SubscriptionPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/video-library" element={<VideoLibraryPage />} />
                    <Route path="/video-library/:id" element={<VideoDetailPage />} />
                    <Route
                      path="/level-test"
                      element={
                        <ProtectedRoute>
                          <LevelTest />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/subscription/success"
                      element={
                        <ProtectedRoute>
                          <SubscriptionSuccessPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payment/:planType"
                      element={
                        <ProtectedRoute>
                          <PaymentPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Dashboard & Profile (require auth + subscription/trial) */}
                    <Route
                      path="/dashboard"
                      element={
                        <SubscriptionGuard>
                          <DashboardPage />
                        </SubscriptionGuard>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <SubscriptionGuard>
                          <ProfilePage />
                        </SubscriptionGuard>
                      }
                    />

                    {/* Level-aware routes — A1.1 is free, others require auth + subscription */}
                    <Route
                      path="/level/:level"
                      element={
                        <LevelSubscriptionGuard>
                          <LevelPage />
                        </LevelSubscriptionGuard>
                      }
                    />

                    {/* Grammar — section & topic list are public, lessons are level-gated */}
                    <Route path="/grammar" element={<GrammarSectionPage />} />
                    <Route path="/grammar/:level" element={<GrammarTopicsPage />} />
                    <Route
                      path="/grammar/:level/:topicSlug"
                      element={
                        <LevelSubscriptionGuard>
                          <GrammarLessonPage />
                        </LevelSubscriptionGuard>
                      }
                    />

                    {/* Reading — section overview is public, level pages are level-gated */}
                    <Route path="/reading" element={<ReadingSectionPage />} />
                    <Route
                      path="/reading/:level"
                      element={
                        <LevelSubscriptionGuard>
                          <ReadingLessonsPage />
                        </LevelSubscriptionGuard>
                      }
                    />
                    <Route
                      path="/reading/:level/:lessonId"
                      element={
                        <LevelSubscriptionGuard>
                          <ReadingLessonPage />
                        </LevelSubscriptionGuard>
                      }
                    />

                    {/* Listening — section overview is public, level pages are level-gated */}
                    <Route path="/listening" element={<ListeningHome />} />
                    <Route
                      path="/listening/:level"
                      element={
                        <LevelSubscriptionGuard>
                          <LevelExercises />
                        </LevelSubscriptionGuard>
                      }
                    />
                    <Route
                      path="/listening/:level/:exerciseNumber"
                      element={
                        <LevelSubscriptionGuard>
                          <ExercisePlayer />
                        </LevelSubscriptionGuard>
                      }
                    />

                    {/* Speaking — fully gated (AI costs) */}
                    <Route
                      path="/speaking"
                      element={
                        <SubscriptionGuard>
                          <SpeakingPage />
                        </SubscriptionGuard>
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
