-- Fix overly permissive RLS policies for sensitive tables
-- Restricting access to assigned doctors and admins only

-- ============================================
-- 1. FIX APPOINTMENTS TABLE (HIGH PRIORITY)
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;

CREATE POLICY "Doctors can view their own appointments"
ON public.appointments FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid())
);

-- ============================================
-- 2. FIX INVOICES TABLE (CRITICAL - Financial Data)
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;

CREATE POLICY "Doctors can view their own invoices"
ON public.invoices FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid())
);

-- ============================================
-- 3. FIX APPOINTMENT_WAITLIST TABLE (MEDIUM PRIORITY)
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view waitlist" ON public.appointment_waitlist;

CREATE POLICY "Doctors can view their own waitlist"
ON public.appointment_waitlist FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid())
);

-- ============================================
-- 4. FIX REFERRALS TABLE (MEDIUM PRIORITY)
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view referrals" ON public.referrals;

CREATE POLICY "Doctors can view their own referrals"
ON public.referrals FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'doctor'::app_role) AND referring_doctor_id = auth.uid())
);