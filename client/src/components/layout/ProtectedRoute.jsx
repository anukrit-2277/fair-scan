import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spinner } from '../common';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, initializing } = useSelector((s) => s.auth);
  const location = useLocation();

  if (initializing) {
    return (
      <div className="spinner--page">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
