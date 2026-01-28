import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProgressProvider } from './contexts/ProgressContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ProgressProvider>
            <div className="min-h-screen bg-slate-50">
              <Navbar />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/update-password" element={<UpdatePasswordPage />} />

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/level/:level"
                  element={
                    <ProtectedRoute>
                      <LevelPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/grammar"
                  element={
                    <ProtectedRoute>
                      <GrammarSectionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/grammar/:level"
                  element={
                    <ProtectedRoute>
                      <GrammarTopicsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback route */}
                <Route path="*" element={<LandingPage />} />
              </Routes>
            </div>
          </ProgressProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
