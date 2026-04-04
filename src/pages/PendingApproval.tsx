import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, LogOut } from 'lucide-react';

export const PendingApproval: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Clock className="h-16 w-16 text-yellow-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Account Pending
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your account is pending approval.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <p className="text-gray-700 mb-6">
            Please contact the administrator to assign your role and departments. You will not be able to access the dashboard until your account is approved.
          </p>
          <button
            onClick={signOut}
            className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
