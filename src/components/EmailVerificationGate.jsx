import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const EmailVerificationGate = ({ children }) => {
  const { user, isEmailVerified } = useAuth();

  if (user && !isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};

export default EmailVerificationGate;
