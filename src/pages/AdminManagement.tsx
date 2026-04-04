import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Role, Department, DEPARTMENT_LABELS } from '../types';
import { Loader2, Shield, CheckCircle, XCircle, Edit2 } from 'lucide-react';

export const AdminManagement: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data as Profile[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSaving(true);
      setError(null);
      
      // Clear assigned departments if role is not sub_admin
      const finalDepartments = editingUser.role === 'sub_admin' 
        ? (editingUser.assigned_departments || []) 
        : [];

      const { error } = await supabase
        .from('profiles')
        .update({
          role: editingUser.role,
          is_active: editingUser.is_active,
          assigned_departments: finalDepartments,
        })
        .eq('id', editingUser.id);

      if (error) throw error;
      
      setEditingUser(null);
      await fetchUsers(false); // Fetch without full page spinner
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleDepartment = (dept: Department) => {
    if (!editingUser) return;
    
    const current = editingUser.assigned_departments || [];
    const updated = current.includes(dept)
      ? current.filter(d => d !== dept)
      : [...current, dept];
      
    setEditingUser({ ...editingUser, assigned_departments: updated });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage user roles and department access.</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm">
        <strong>How to add a new admin:</strong> Have the new user register via the public registration page. Their account will appear here as "Pending" for you to approve and assign a role.
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id}>
              <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {user.role === 'super_admin' ? (
                      <Shield className="h-10 w-10 text-indigo-600 bg-indigo-100 rounded-full p-2" />
                    ) : user.role === 'sub_admin' ? (
                      <Shield className="h-10 w-10 text-blue-600 bg-blue-100 rounded-full p-2" />
                    ) : (
                      <Shield className="h-10 w-10 text-gray-400 bg-gray-100 rounded-full p-2" />
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-indigo-600 truncate">{user.full_name}</div>
                    <div className="text-sm text-gray-500">
                      {user.email} • {user.mobile_number}
                    </div>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'super_admin' ? 'bg-indigo-100 text-indigo-800' :
                        user.role === 'sub_admin' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.role.replace('_', ' ')}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => setEditingUser(user)}
                    className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setEditingUser(null)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Edit User: {editingUser.full_name}
                </h3>
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                    >
                      <option value="pending">Pending</option>
                      <option value="sub_admin">Sub Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="is_active"
                      type="checkbox"
                      checked={editingUser.is_active}
                      onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Active Account
                    </label>
                  </div>

                  {editingUser.role === 'sub_admin' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Departments</label>
                      <div className="space-y-2 border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto">
                        {(Object.entries(DEPARTMENT_LABELS) as [Department, string][]).map(([key, label]) => (
                          <div key={key} className="flex items-center">
                            <input
                              id={`dept-${key}`}
                              type="checkbox"
                              checked={(editingUser.assigned_departments || []).includes(key)}
                              onChange={() => toggleDepartment(key)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`dept-${key}`} className="ml-2 block text-sm text-gray-900">
                              {label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setEditingUser(null)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
