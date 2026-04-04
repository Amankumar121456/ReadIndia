-- Run this in your Supabase SQL Editor to set up the database

-- 1. Create Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'sub_admin', 'pending')),
  is_active BOOLEAN DEFAULT true,
  assigned_departments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Students Table
CREATE TABLE public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_uid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT,
  aadhar_number TEXT NOT NULL,
  address TEXT NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('library', 'parlor', 'computer', 'tuition_school', 'tuition_under_8')),
  is_removed BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Set up Row Level Security (RLS)

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Super admins can read all profiles
CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super admins can update all profiles
CREATE POLICY "Super admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Users can insert their own profile (during registration)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Students Policies
-- Super admins have full access to students
CREATE POLICY "Super admins have full access to students" ON public.students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Sub admins can only access students in their assigned departments
CREATE POLICY "Sub admins can view assigned department students" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'sub_admin' 
      AND department = ANY(assigned_departments)
    )
  );

CREATE POLICY "Sub admins can insert assigned department students" ON public.students
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'sub_admin' 
      AND department = ANY(assigned_departments)
    )
  );

CREATE POLICY "Sub admins can update assigned department students" ON public.students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'sub_admin' 
      AND department = ANY(assigned_departments)
    )
  );

-- Note: We don't allow sub_admins to delete, only super_admin can delete.
-- If you want sub_admins to delete, add a DELETE policy similar to the UPDATE one.

-- 4. Create a trigger to automatically update 'updated_at'
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_students_modtime
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
