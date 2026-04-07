import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid #334155', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Authenticating...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles) {
    const userRole = user.role?.toLowerCase();
    const hasPermission = allowedRoles.some(role => role.toLowerCase() === userRole);

    if (!hasPermission) {
      let redirect = '/login';
      if (userRole === 'admin' || userRole === 'receptionist') redirect = '/admin';
      else if (userRole === 'doctor') redirect = '/doctor';
      else if (userRole === 'patient') redirect = '/patient/dashboard';
      
      return <Navigate to={redirect} replace />;
    }
  }

  return children;
}
