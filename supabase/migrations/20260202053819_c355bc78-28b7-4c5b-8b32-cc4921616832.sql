-- Create access_sessions table to track scan-based access
CREATE TABLE public.access_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for access_sessions
CREATE POLICY "Doctors can view their own sessions"
ON public.access_sessions FOR SELECT
USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can create sessions"
ON public.access_sessions FOR INSERT
WITH CHECK (doctor_id = auth.uid() AND has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can end their own sessions"
ON public.access_sessions FOR UPDATE
USING (doctor_id = auth.uid());

-- Admins can view all sessions for audit purposes
CREATE POLICY "Admins can view all sessions"
ON public.access_sessions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for quick lookups
CREATE INDEX idx_access_sessions_doctor_patient ON public.access_sessions(doctor_id, patient_id);
CREATE INDEX idx_access_sessions_active ON public.access_sessions(doctor_id, status) WHERE status = 'active';

-- Create a function to check if doctor has active session for a patient
CREATE OR REPLACE FUNCTION public.has_active_session(_doctor_id UUID, _patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.access_sessions
    WHERE doctor_id = _doctor_id
      AND patient_id = _patient_id
      AND status = 'active'
      AND (ended_at IS NULL OR ended_at > now())
  )
$$;

-- Now update RLS policies on sensitive tables to require active session

-- MEDICAL_RECORDS: Drop existing SELECT policy and create session-based one
DROP POLICY IF EXISTS "Doctors and admins can view medical records" ON public.medical_records;

CREATE POLICY "Doctors can view records with active session"
ON public.medical_records FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    has_role(auth.uid(), 'doctor'::app_role) 
    AND has_active_session(auth.uid(), patient_id)
  )
);

-- VITALS: Update SELECT policy to require session
DROP POLICY IF EXISTS "Authenticated users can view vitals" ON public.vitals;

CREATE POLICY "Doctors can view vitals with active session"
ON public.vitals FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'doctor'::app_role) 
    AND has_active_session(auth.uid(), patient_id)
  )
);

-- PRESCRIPTIONS: Update SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view prescriptions" ON public.prescriptions;

CREATE POLICY "Doctors can view prescriptions with active session"
ON public.prescriptions FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'doctor'::app_role) 
    AND has_active_session(auth.uid(), patient_id)
  )
);

-- LAB_RESULTS: Update SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view lab results" ON public.lab_results;

CREATE POLICY "Doctors can view lab results with active session"
ON public.lab_results FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'doctor'::app_role) 
    AND has_active_session(auth.uid(), patient_id)
  )
);

-- EMERGENCY_RECORDS: Update SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view emergency records" ON public.emergency_records;

CREATE POLICY "Doctors can view emergency records with active session"
ON public.emergency_records FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'doctor'::app_role) 
    AND has_active_session(auth.uid(), patient_id)
  )
);

-- PATIENTS: Update to show limited info OR full info with active session
-- Keep existing policy for basic info, but we'll handle sensitive fields in the app
-- The patients table itself can still be viewed, but medical data requires session

-- UPDATE policies also need session check for medical tables
DROP POLICY IF EXISTS "Doctors can update their own medical records" ON public.medical_records;

CREATE POLICY "Doctors can update records with active session"
ON public.medical_records FOR UPDATE
USING (
  doctor_id = auth.uid() 
  AND has_active_session(auth.uid(), patient_id)
);

-- INSERT policies for medical tables need session check
DROP POLICY IF EXISTS "Doctors can insert medical records" ON public.medical_records;

CREATE POLICY "Doctors can insert records with active session"
ON public.medical_records FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND doctor_id = auth.uid()
  AND has_active_session(auth.uid(), patient_id)
);

DROP POLICY IF EXISTS "Doctors can insert vitals" ON public.vitals;

CREATE POLICY "Doctors can insert vitals with active session"
ON public.vitals FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND has_active_session(auth.uid(), patient_id)
);

DROP POLICY IF EXISTS "Doctors can insert prescriptions" ON public.prescriptions;

CREATE POLICY "Doctors can insert prescriptions with active session"
ON public.prescriptions FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND doctor_id = auth.uid()
  AND has_active_session(auth.uid(), patient_id)
);

DROP POLICY IF EXISTS "Doctors can update their own prescriptions" ON public.prescriptions;

CREATE POLICY "Doctors can update prescriptions with active session"
ON public.prescriptions FOR UPDATE
USING (
  doctor_id = auth.uid()
  AND has_active_session(auth.uid(), patient_id)
);

DROP POLICY IF EXISTS "Doctors can insert lab results" ON public.lab_results;

CREATE POLICY "Doctors can insert lab results with active session"
ON public.lab_results FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role)
  AND has_active_session(auth.uid(), patient_id)
);

DROP POLICY IF EXISTS "Doctors can update lab results" ON public.lab_results;

CREATE POLICY "Doctors can update lab results with active session"
ON public.lab_results FOR UPDATE
USING (
  has_role(auth.uid(), 'doctor'::app_role)
  AND has_active_session(auth.uid(), patient_id)
);

DROP POLICY IF EXISTS "Doctors can insert emergency records" ON public.emergency_records;

CREATE POLICY "Doctors can insert emergency records with active session"
ON public.emergency_records FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role)
  AND has_active_session(auth.uid(), patient_id)
);

DROP POLICY IF EXISTS "Doctors can update emergency records" ON public.emergency_records;

CREATE POLICY "Doctors can update emergency records with active session"
ON public.emergency_records FOR UPDATE
USING (
  has_role(auth.uid(), 'doctor'::app_role)
  AND has_active_session(auth.uid(), patient_id)
);