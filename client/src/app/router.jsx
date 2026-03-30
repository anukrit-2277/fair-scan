import { createBrowserRouter } from 'react-router-dom';
import LandingPage from '../features/landing/LandingPage';
import LoginPage from '../features/auth/LoginPage';
import SignupPage from '../features/auth/SignupPage';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHome from '../features/dashboard/DashboardHome';
import UploadPage from '../features/upload/UploadPage';
import DatasetsPage from '../features/datasets/DatasetsPage';
import DatasetDetailPage from '../features/datasets/DatasetDetailPage';
import ConfigReviewPage from '../features/analysis/ConfigReviewPage';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import GuestRoute from '../components/layout/GuestRoute';

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
      { path: 'upload', element: <UploadPage /> },
      { path: 'datasets', element: <DatasetsPage /> },
      { path: 'datasets/:id', element: <DatasetDetailPage /> },
      { path: 'datasets/:id/analyze', element: <ConfigReviewPage /> },
    ],
  },
]);

export default router;
