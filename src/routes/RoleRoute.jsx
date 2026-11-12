import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RoleRoute({ allowedRole, children }) {
  const { role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    // Redirect to matching role dashboard
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'Perusahaan') return <Navigate to="/perusahaan" replace />;
    return <Navigate to="/pencari-kerja" replace />;
  }

  return children ? children : <Outlet />;
}

export default RoleRoute;
