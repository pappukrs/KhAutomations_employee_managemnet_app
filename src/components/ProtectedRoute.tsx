import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: 'employee' | 'admin';
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !profile) {
    return <Navigate to="/login" />;
  }

  if (profile.role !== allowedRole) {
    return <Navigate to={`/${profile.role}`} />;
  }

  return <>{children}</>;
}