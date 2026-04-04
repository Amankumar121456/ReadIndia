import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase, syncToGoogleSheets } from '../lib/supabase';
import { Department, DEPARTMENT_LABELS, Student } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ArrowLeft } from 'lucide-react';

const studentSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  father_name: z.string().min(2, "Father's name is required"),
  mobile_number: z.string().regex(/^[0-9]{10}$/, 'Must be a valid 10-digit mobile number'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  aadhar_number: z.string().regex(/^[0-9]{12}$/, 'Must be a valid 12-digit Aadhar number'),
  address: z.string().min(5, 'Address is required'),
  department: z.enum(['library', 'parlor', 'computer', 'tuition_school', 'tuition_under_8'] as const),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export const StudentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const defaultDepartment = searchParams.get('department') as Department | null;
  
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  
  const isEditing = !!id;

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      department: defaultDepartment || undefined,
    }
  });

  useEffect(() => {
    if (isEditing) {
      fetchStudent();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Verify access
      const isSuperAdmin = profile?.role === 'super_admin';
      const hasAccess = isSuperAdmin || profile?.assigned_departments.includes(data.department);
      
      if (!hasAccess) {
        navigate('/unauthorized', { replace: true });
        return;
      }

      reset({
        name: data.name,
        father_name: data.father_name,
        mobile_number: data.mobile_number,
        email: data.email || '',
        aadhar_number: data.aadhar_number,
        address: data.address,
        department: data.department,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const generateStudentUID = async (): Promise<string> => {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Get the latest UID for this month
    const { data, error } = await supabase
      .from('students')
      .select('student_uid')
      .like('student_uid', `${yearMonth}%`)
      .order('student_uid', { ascending: false })
      .limit(1);

    if (error) throw error;

    let runningNumber = 1;
    if (data && data.length > 0) {
      const lastUID = data[0].student_uid;
      const lastNumber = parseInt(lastUID.slice(-3), 10);
      runningNumber = lastNumber + 1;
    }

    return `${yearMonth}${runningNumber.toString().padStart(3, '0')}`;
  };

  const onSubmit = async (data: StudentFormValues) => {
    try {
      setLoading(true);
      setError(null);

      // Verify access to the selected department
      const isSuperAdmin = profile?.role === 'super_admin';
      const hasAccess = isSuperAdmin || profile?.assigned_departments.includes(data.department);
      
      if (!hasAccess) {
        throw new Error('You do not have permission to add students to this department.');
      }

      let studentData: any;

      if (isEditing) {
        const { data: updatedData, error } = await supabase
          .from('students')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        studentData = updatedData;
        
        // Background sync
        syncToGoogleSheets('UPDATE', 'students', studentData);
        
      } else {
        const uid = await generateStudentUID();
        
        const { data: newData, error } = await supabase
          .from('students')
          .insert([{
            ...data,
            student_uid: uid,
            created_by: profile?.id,
            is_removed: false,
            sync_status: 'pending'
          }])
          .select()
          .single();

        if (error) throw error;
        studentData = newData;
        
        // Background sync
        syncToGoogleSheets('CREATE', 'students', studentData);
      }

      navigate(`/students/${data.department}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get available departments for this user
  const availableDepartments = profile?.role === 'super_admin' 
    ? (Object.keys(DEPARTMENT_LABELS) as Department[])
    : profile?.assigned_departments || [];

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Student' : 'Add New Student'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing ? 'Update student information.' : 'Enter details to register a new student.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 sm:p-8">
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            
            <div className="sm:col-span-2">
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department *
              </label>
              <div className="mt-1">
                <select
                  id="department"
                  {...register('department')}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                >
                  <option value="">Select a department</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {DEPARTMENT_LABELS[dept]}
                    </option>
                  ))}
                </select>
                {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Student Name *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  {...register('name')}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="father_name" className="block text-sm font-medium text-gray-700">
                Father's Name *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="father_name"
                  {...register('father_name')}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                />
                {errors.father_name && <p className="mt-1 text-sm text-red-600">{errors.father_name.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700">
                Mobile Number *
              </label>
              <div className="mt-1">
                <input
                  type="tel"
                  id="mobile_number"
                  {...register('mobile_number')}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                  placeholder="10 digit number"
                />
                {errors.mobile_number && <p className="mt-1 text-sm text-red-600">{errors.mobile_number.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address (Optional)
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="aadhar_number" className="block text-sm font-medium text-gray-700">
                Aadhar Number *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="aadhar_number"
                  {...register('aadhar_number')}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                  placeholder="12 digit Aadhar number"
                />
                {errors.aadhar_number && <p className="mt-1 text-sm text-red-600">{errors.aadhar_number.message}</p>}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Full Address *
              </label>
              <div className="mt-1">
                <textarea
                  id="address"
                  rows={3}
                  {...register('address')}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
              </div>
            </div>

          </div>

          <div className="pt-5 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
