import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: ('super_admin' | 'sub_admin' | 'pending')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    // If user is authenticated but no profile exists yet, treat as pending
    if (allowedRoles && !allowedRoles.includes('pending')) {
      return <Navigate to="/pending" replace />;
    }
    return <Outlet />;
  }

  if (profile.role === 'pending') {
    if (location.pathname !== '/pending') {
      return <Navigate to="/pending" replace />;
    }
    return <Outlet />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
