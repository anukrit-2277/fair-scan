import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spinner } from '../common';

const GuestRoute = ({ children }) => {
  const { isAuthenticated, initializing } = useSelector((s) => s.auth);

  if (initializing) {
    return (
      <div className="spinner--page">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GuestRoute;
