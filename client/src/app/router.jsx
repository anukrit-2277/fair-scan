import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import LandingPage from '../features/landing/LandingPage';
import LoginPage from '../features/auth/LoginPage';
import SignupPage from '../features/auth/SignupPage';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHome from '../features/dashboard/DashboardHome';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import GuestRoute from '../components/layout/GuestRoute';
import { Spinner } from '../components/common';

const UploadPage = lazy(() => import('../features/upload/UploadPage'));
const DatasetsPage = lazy(() => import('../features/datasets/DatasetsPage'));
const DatasetDetailPage = lazy(() => import('../features/datasets/DatasetDetailPage'));
const ConfigReviewPage = lazy(() => import('../features/analysis/ConfigReviewPage'));
const AuditsListPage = lazy(() => import('../features/audits/AuditsListPage'));
const AuditDashboard = lazy(() => import('../features/audits/AuditDashboard'));
const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));
const MitigationPage = lazy(() => import('../features/mitigation/MitigationPage'));
const MonitoringPage = lazy(() => import('../features/monitoring/MonitoringPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));

const Lazy = ({ children }) => (
  <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner size="lg" /></div>}>
    {children}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <GuestRoute>
        <SignupPage />
      </GuestRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'upload', element: <Lazy><UploadPage /></Lazy> },
      { path: 'datasets', element: <Lazy><DatasetsPage /></Lazy> },
      { path: 'datasets/:id', element: <Lazy><DatasetDetailPage /></Lazy> },
      { path: 'datasets/:id/analyze', element: <Lazy><ConfigReviewPage /></Lazy> },
      { path: 'audits', element: <Lazy><AuditsListPage /></Lazy> },
      { path: 'audits/:id', element: <Lazy><AuditDashboard /></Lazy> },
      { path: 'reports', element: <Lazy><ReportsPage /></Lazy> },
      { path: 'mitigation', element: <Lazy><MitigationPage /></Lazy> },
      { path: 'monitoring', element: <Lazy><MonitoringPage /></Lazy> },
      { path: 'settings', element: <Lazy><SettingsPage /></Lazy> },
    ],
  },
]);

export default router;
