import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [patientsRes, appointmentsRes, prescriptionsRes, emergencyRes] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('scheduled_at', todayISO),
        supabase.from('prescriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('emergency_records').select('id', { count: 'exact', head: true }).is('resolved_at', null),
      ]);

      return {
        totalPatients: patientsRes.count || 0,
        todayAppointments: appointmentsRes.count || 0,
        activePrescriptions: prescriptionsRes.count || 0,
        activeEmergencies: emergencyRes.count || 0,
      };
    },
  });
}

export function useRecentPatients(limit = 5) {
  return useQuery({
    queryKey: ['recent-patients', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

export function useTodayAppointments() {
  return useQuery({
    queryKey: ['today-appointments'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (id, full_name, caretag_id)
        `)
        .gte('scheduled_at', today.toISOString())
        .lt('scheduled_at', tomorrow.toISOString())
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useActiveEmergencies() {
  return useQuery({
    queryKey: ['active-emergencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_records')
        .select(`
          *,
          patients:patient_id (id, full_name, caretag_id, blood_group, allergies)
        `)
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useRecentVitals(limit = 10) {
  return useQuery({
    queryKey: ['recent-vitals', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vitals')
        .select(`
          *,
          patients:patient_id (id, full_name, caretag_id)
        `)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}
