import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: ('super_admin' | 'admin' | 'sub_admin' | 'pending')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // 🔄 Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ⚠️ No profile (treat as pending)
  if (!profile) {
    if (allowedRoles && !allowedRoles.includes('pending')) {
      return <Navigate to="/pending" replace />;
    }
    return <Outlet />;
  }

  // ⛔ Pending user
  if (profile.role === 'pending') {
    if (location.pathname !== '/pending') {
      return <Navigate to="/pending" replace />;
    }
    return <Outlet />;
  }

  // ✅ MAIN FIX (admin add kiya + clean logic)
  const defaultAllowedRoles = ['super_admin', 'admin', 'sub_admin'];

  const rolesToCheck = allowedRoles || defaultAllowedRoles;

  if (!rolesToCheck.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ All good
  return <Outlet />;
};
