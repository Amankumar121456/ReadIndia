import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DEPARTMENT_LABELS, Department } from '../types';
import { 
  BookOpen, 
  Coffee, 
  Monitor, 
  GraduationCap, 
  Baby,
  Users,
  PlusCircle,
  Search,
  ShieldAlert
} from 'lucide-react';

const departmentIcons: Record<Department, React.ElementType> = {
  library: BookOpen,
  parlor: Coffee,
  computer: Monitor,
  tuition_school: GraduationCap,
  tuition_under_8: Baby,
};

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();

  if (!profile) return null;

  const isSuperAdmin = profile.role === 'super_admin';
  
  // Super admin sees all, sub admin sees only assigned
  const visibleDepartments = isSuperAdmin 
    ? (Object.keys(DEPARTMENT_LABELS) as Department[])
    : profile.assigned_departments;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {profile.full_name}. You are logged in as a {profile.role.replace('_', ' ')}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleDepartments.map((dept) => {
          const Icon = departmentIcons[dept];
          return (
            <div key={dept} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-indigo-100 rounded-md p-3">
                      <Icon className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Department
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {DEPARTMENT_LABELS[dept]}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex flex-wrap gap-2">
                <Link
                  to={`/students/${dept}`}
                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-md transition-colors"
                >
                  <Users className="h-4 w-4 mr-1.5" />
                  View Students
                </Link>
                <Link
                  to={`/students/new?department=${dept}`}
                  className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-900 bg-green-50 px-3 py-1.5 rounded-md transition-colors"
                >
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  Add Student
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {visibleDepartments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-100">
          <ShieldAlert className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Departments Assigned</h3>
          <p className="mt-1 text-sm text-gray-500">
            You have not been assigned to any departments yet. Please contact the Super Admin.
          </p>
        </div>
      )}
    </div>
  );
};
