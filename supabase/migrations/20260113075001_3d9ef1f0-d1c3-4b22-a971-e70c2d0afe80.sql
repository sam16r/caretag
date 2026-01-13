-- Fix 1: Restrict patients table to doctors and admins only
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;

CREATE POLICY "Doctors and admins can view patients"
ON public.patients FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 2: Restrict profiles table - users see their own full profile, doctors/admins see basic info
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view profiles with appropriate access"
ON public.profiles FOR SELECT
USING (
  (id = auth.uid()) OR -- Full access to own profile
  has_role(auth.uid(), 'admin'::app_role) OR -- Admins see all
  has_role(auth.uid(), 'doctor'::app_role) -- Doctors see all profiles (for referrals, messaging)
);

-- Fix 3: Restrict medical_records table to doctors and admins only
DROP POLICY IF EXISTS "Authenticated users can view medical records" ON public.medical_records;

CREATE POLICY "Doctors and admins can view medical records"
ON public.medical_records FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);