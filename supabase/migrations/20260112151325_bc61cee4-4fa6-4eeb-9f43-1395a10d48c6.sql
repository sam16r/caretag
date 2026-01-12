-- Lab Results table
CREATE TABLE public.lab_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  test_name TEXT NOT NULL,
  test_category TEXT NOT NULL,
  result_value NUMERIC,
  result_unit TEXT,
  reference_min NUMERIC,
  reference_max NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  tested_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  referring_doctor_id UUID NOT NULL,
  specialist_name TEXT NOT NULL,
  specialist_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Secure Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  patient_id UUID,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Appointment Waitlist table
CREATE TABLE public.appointment_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  preferred_date DATE,
  preferred_time_slot TEXT,
  reason TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Patient Feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  appointment_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  categories JSONB DEFAULT '{}'::jsonb,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  appointment_id UUID,
  invoice_number TEXT NOT NULL UNIQUE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inventory table
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sku TEXT UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  cost_per_unit NUMERIC,
  supplier TEXT,
  expiry_date DATE,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Staff Schedules table
CREATE TABLE public.staff_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  break_start TIME,
  break_end TIME,
  max_appointments INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Clinics table (multi-clinic support)
CREATE TABLE public.clinics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lab_results
CREATE POLICY "Authenticated users can view lab results" ON public.lab_results FOR SELECT USING (true);
CREATE POLICY "Doctors can insert lab results" ON public.lab_results FOR INSERT WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));
CREATE POLICY "Doctors can update lab results" ON public.lab_results FOR UPDATE USING (has_role(auth.uid(), 'doctor'::app_role));

-- RLS Policies for referrals
CREATE POLICY "Authenticated users can view referrals" ON public.referrals FOR SELECT USING (true);
CREATE POLICY "Doctors can manage referrals" ON public.referrals FOR INSERT WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));
CREATE POLICY "Doctors can update referrals" ON public.referrals FOR UPDATE USING (has_role(auth.uid(), 'doctor'::app_role));

-- RLS Policies for messages
CREATE POLICY "Users can view their messages" ON public.messages FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Recipients can update message read status" ON public.messages FOR UPDATE USING (recipient_id = auth.uid());

-- RLS Policies for waitlist
CREATE POLICY "Authenticated users can view waitlist" ON public.appointment_waitlist FOR SELECT USING (true);
CREATE POLICY "Doctors can manage waitlist" ON public.appointment_waitlist FOR INSERT WITH CHECK (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Doctors can update waitlist" ON public.appointment_waitlist FOR UPDATE USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for feedback
CREATE POLICY "Doctors can view feedback" ON public.feedback FOR SELECT USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can submit feedback" ON public.feedback FOR INSERT WITH CHECK (true);

-- RLS Policies for invoices
CREATE POLICY "Authenticated users can view invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Doctors can manage invoices" ON public.invoices FOR INSERT WITH CHECK (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Doctors can update invoices" ON public.invoices FOR UPDATE USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for inventory
CREATE POLICY "Authenticated users can view inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Admins can manage inventory" ON public.inventory FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update inventory" ON public.inventory FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete inventory" ON public.inventory FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for staff_schedules
CREATE POLICY "Authenticated users can view schedules" ON public.staff_schedules FOR SELECT USING (true);
CREATE POLICY "Doctors can manage their schedules" ON public.staff_schedules FOR INSERT WITH CHECK (doctor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Doctors can update their schedules" ON public.staff_schedules FOR UPDATE USING (doctor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for clinics
CREATE POLICY "Authenticated users can view clinics" ON public.clinics FOR SELECT USING (true);
CREATE POLICY "Admins can manage clinics" ON public.clinics FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update clinics" ON public.clinics FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Triggers for updated_at
CREATE TRIGGER update_lab_results_updated_at BEFORE UPDATE ON public.lab_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON public.staff_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();