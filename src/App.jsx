import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import SubscriptionGuard from './components/SubscriptionGuard';
import TrialBanner from './components/TrialBanner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import DashboardPage from './pages/DashboardPage';
import LevelPage from './pages/LevelPage';
import ProfilePage from './pages/ProfilePage';
import GrammarSectionPage from './pages/GrammarSectionPage';
import GrammarTopicsPage from './pages/GrammarTopicsPage';
import GrammarLessonPage from './pages/GrammarLessonPage';
import ReadingSectionPage from './pages/ReadingSectionPage';
import ReadingLessonsPage from './pages/ReadingLessonsPage';
import ReadingLessonPage from './pages/ReadingLessonPage';
import SubscriptionPage from './pages/SubscriptionPage';
import PaymentPage from './pages/PaymentPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <ThemeProvider>
            <ProgressProvider>
              <div className="min-h-screen bg-slate-50">
                <Navbar />
                <TrialBanner />
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/update-password" element={<UpdatePasswordPage />} />

                  {/* Subscription page (requires auth only, not subscription) */}
                  <Route
                    path="/subscription"
                    element={
                      <ProtectedRoute>
                        <SubscriptionPage />
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

                  {/* Protected routes (require auth + subscription/trial) */}
                  <Route
                    path="/dashboard"
                    element={
                      <SubscriptionGuard>
                        <DashboardPage />
                      </SubscriptionGuard>
                    }
                  />
                  <Route
                    path="/level/:level"
                    element={
                      <SubscriptionGuard>
                        <LevelPage />
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
                  <Route
                    path="/grammar"
                    element={
                      <SubscriptionGuard>
                        <GrammarSectionPage />
                      </SubscriptionGuard>
                    }
                  />
                  <Route
                    path="/grammar/:level"
                    element={
                      <SubscriptionGuard>
                        <GrammarTopicsPage />
                      </SubscriptionGuard>
                    }
                  />
                  <Route
                    path="/grammar/:level/:topicSlug"
                    element={
                      <SubscriptionGuard>
                        <GrammarLessonPage />
                      </SubscriptionGuard>
                    }
                  />
                  <Route
                    path="/reading"
                    element={
                      <SubscriptionGuard>
                        <ReadingSectionPage />
                      </SubscriptionGuard>
                    }
                  />
                  <Route
                    path="/reading/:level"
                    element={
                      <SubscriptionGuard>
                        <ReadingLessonsPage />
                      </SubscriptionGuard>
                    }
                  />
                  <Route
                    path="/reading/:level/:lessonId"
                    element={
                      <SubscriptionGuard>
                        <ReadingLessonPage />
                      </SubscriptionGuard>
                    }
                  />

                  {/* Fallback route */}
                  <Route path="*" element={<LandingPage />} />
                </Routes>
              </div>
            </ProgressProvider>
          </ThemeProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
