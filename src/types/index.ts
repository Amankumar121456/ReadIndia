export type Role = 'super_admin' | 'sub_admin' | 'pending';

export type Department = 
  | 'library' 
  | 'parlor' 
  | 'computer' 
  | 'tuition_school' 
  | 'tuition_under_8';

export const DEPARTMENT_LABELS: Record<Department, string> = {
  library: 'Library',
  parlor: 'Parlor',
  computer: 'Computer',
  tuition_school: 'Tuition for School Students',
  tuition_under_8: 'Tuition for Children Age Less Than 8',
};

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  role: Role;
  is_active: boolean;
  assigned_departments: Department[];
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  student_uid: string;
  name: string;
  father_name: string;
  mobile_number: string;
  email?: string;
  aadhar_number: string;
  address: string;
  department: Department;
  is_removed: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  sync_status: 'pending' | 'synced' | 'failed';
}
