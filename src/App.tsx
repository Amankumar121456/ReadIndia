/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PendingApproval } from './pages/PendingApproval';
import { Unauthorized } from './pages/Unauthorized';
import { Dashboard } from './pages/Dashboard';
import { AdminManagement } from './pages/AdminManagement';
import { StudentList } from './pages/StudentList';
import { StudentForm } from './pages/StudentForm';
import { StudentDetails } from './pages/StudentDetails';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Pending Route */}
          <Route element={<ProtectedRoute allowedRoles={['pending']} />}>
            <Route path="/pending" element={<PendingApproval />} />
          </Route>

          {/* Unauthorized Route */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin', 'sub_admin']} />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/students/:department" element={<StudentList />} />
              <Route path="/students/new" element={<StudentForm />} />
              <Route path="/students/:department/:id" element={<StudentDetails />} />
              <Route path="/students/:department/:id/edit" element={<StudentForm />} />
              <Route path="/settings" element={<Settings />} />
              
              {/* Super Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                <Route path="/admin/users" element={<AdminManagement />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}




