-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('doctor', 'admin');

-- Create enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');

-- Create enum for prescription status
CREATE TYPE public.prescription_status AS ENUM ('active', 'completed', 'cancelled');

-- Create enum for emergency severity
CREATE TYPE public.emergency_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    department TEXT,
    specialization TEXT,
    license_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Patients table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caretag_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL,
    blood_group TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    allergies TEXT[],
    chronic_conditions TEXT[],
    current_medications TEXT[],
    insurance_provider TEXT,
    insurance_id TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Medical records table
CREATE TABLE public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES auth.users(id) NOT NULL,
    record_type TEXT NOT NULL,
    diagnosis TEXT,
    symptoms TEXT[],
    notes TEXT,
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prescriptions table
CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES auth.users(id) NOT NULL,
    medications JSONB NOT NULL DEFAULT '[]',
    diagnosis TEXT,
    notes TEXT,
    status prescription_status NOT NULL DEFAULT 'active',
    valid_until DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES auth.users(id) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vitals table for wearable/device data
CREATE TABLE public.vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    heart_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    spo2 INTEGER,
    temperature DECIMAL(4,1),
    respiratory_rate INTEGER,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Emergency records table
CREATE TABLE public.emergency_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES auth.users(id),
    severity emergency_severity NOT NULL,
    description TEXT NOT NULL,
    vitals_snapshot JSONB,
    actions_taken TEXT[],
    outcome TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs table for admin tracking
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- RLS Policies for patients (doctors and admins can access)
CREATE POLICY "Authenticated users can view patients"
ON public.patients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Doctors and admins can insert patients"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Doctors and admins can update patients"
ON public.patients FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for medical_records
CREATE POLICY "Authenticated users can view medical records"
ON public.medical_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Doctors can insert medical records"
ON public.medical_records FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'doctor') AND doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own medical records"
ON public.medical_records FOR UPDATE
TO authenticated
USING (doctor_id = auth.uid());

-- RLS Policies for prescriptions
CREATE POLICY "Authenticated users can view prescriptions"
ON public.prescriptions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Doctors can insert prescriptions"
ON public.prescriptions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'doctor') AND doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own prescriptions"
ON public.prescriptions FOR UPDATE
TO authenticated
USING (doctor_id = auth.uid());

-- RLS Policies for appointments
CREATE POLICY "Authenticated users can view appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Doctors and admins can manage appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Doctors and admins can update appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for vitals
CREATE POLICY "Authenticated users can view vitals"
ON public.vitals FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Doctors can insert vitals"
ON public.vitals FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'doctor'));

-- RLS Policies for emergency_records
CREATE POLICY "Authenticated users can view emergency records"
ON public.emergency_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Doctors can insert emergency records"
ON public.emergency_records FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can update emergency records"
ON public.emergency_records FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'doctor'));

-- RLS Policies for audit_logs (admin only)
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'doctor'));
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_emergency_records_updated_at BEFORE UPDATE ON public.emergency_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();