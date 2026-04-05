import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Role, Department, DEPARTMENT_LABELS } from '../types';
import { Loader2, Shield, Edit2 } from 'lucide-react';

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

      const finalDepartments =
        editingUser.role === 'sub_admin'
          ? editingUser.assigned_departments || []
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
      await fetchUsers(false);
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
      ? current.filter((d) => d !== dept)
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
      <h1 className="text-2xl font-bold">Admin Management</h1>

      {error && <div className="text-red-500">{error}</div>}

      {/* USERS LIST */}
      <div className="bg-white shadow rounded-lg">
        <ul>
          {users.map((user) => (
            <li key={user.id} className="p-4 flex justify-between">
              <div>
                <div className="font-semibold">{user.full_name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>

                {/* ROLE BADGE */}
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    user.role === 'super_admin'
                      ? 'bg-indigo-100 text-indigo-800'
                      : user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'sub_admin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              {/* EDIT BUTTON (super_admin ko lock kar diya) */}
              {user.role !== 'super_admin' && (
                <button onClick={() => setEditingUser(user)}>
                  <Edit2 />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">
              Edit {editingUser.full_name}
            </h2>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              
              {/* ROLE SELECT */}
              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    role: e.target.value as Role,
                  })
                }
                className="w-full border p-2 rounded"
              >
                <option value="pending">Pending</option>
                <option value="sub_admin">Sub Admin</option>
                <option value="admin">Admin</option> {/* ✅ FIX */}
                
                {/* ❌ Admin super_admin nahi bana sakta */}
                <option value="super_admin">Super Admin</option>
              </select>

              {/* ACTIVE */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingUser.is_active}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      is_active: e.target.checked,
                    })
                  }
                />
                Active
              </label>

              {/* DEPARTMENTS */}
              {editingUser.role === 'sub_admin' && (
                <div>
                  <h3 className="font-medium">Departments</h3>
                  {Object.entries(DEPARTMENT_LABELS).map(([key, label]) => (
                    <label key={key} className="block">
                      <input
                        type="checkbox"
                        checked={
                          editingUser.assigned_departments?.includes(
                            key as Department
                          ) || false
                        }
                        onChange={() =>
                          toggleDepartment(key as Department)
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded w-full"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
