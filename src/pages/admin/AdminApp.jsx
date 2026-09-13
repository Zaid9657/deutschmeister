// The admin panel's router. Mounted at /admin/* by src/App.jsx behind
// ProtectedRoute + EmailVerificationGate; the role check happens in
// AdminSessionProvider (server-side, via admin-session). Every route resolves
// — a module that is not built yet renders AdminPending, never a 404, and no
// previous admin URL was deleted (/admin/videos still works).
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminSessionProvider } from '../../components/admin/AdminSessionContext.jsx';
import { AdminFilterProvider } from '../../components/admin/AdminFilterContext.jsx';
import AdminShell from '../../components/admin/AdminShell.jsx';
import { Spinner } from '../../components/admin/adminUi.jsx';

const OverviewPage = lazy(() => import('./OverviewPage.jsx'));
const UsersPage = lazy(() => import('./UsersPage.jsx'));
const UserDetailPage = lazy(() => import('./UserDetailPage.jsx'));
const OperationsPage = lazy(() => import('./OperationsPage.jsx'));
const UsagePage = lazy(() => import('./UsagePage.jsx'));
const ContentPage = lazy(() => import('./ContentPage.jsx'));
const SupportPage = lazy(() => import('./SupportPage.jsx'));
const MarketingPage = lazy(() => import('./MarketingPage.jsx'));
const ReportsPage = lazy(() => import('./ReportsPage.jsx'));
const MonitoringPage = lazy(() => import('./MonitoringPage.jsx'));
const AuditPage = lazy(() => import('./AuditPage.jsx'));
const SettingsPage = lazy(() => import('./SettingsPage.jsx'));
const AdminVideosPage = lazy(() => import('../AdminVideosPage.jsx'));

export default function AdminApp() {
  return (
    <AdminSessionProvider>
      <AdminFilterProvider>
        <AdminShell>
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route index element={<OverviewPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="user/:id" element={<UserDetailPage />} />
              <Route path="operations" element={<OperationsPage />} />
              <Route path="usage" element={<UsagePage />} />
              <Route path="content" element={<ContentPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="marketing" element={<MarketingPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="monitoring" element={<MonitoringPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="videos" element={<AdminVideosPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </AdminShell>
      </AdminFilterProvider>
    </AdminSessionProvider>
  );
}
