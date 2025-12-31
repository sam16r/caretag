import { useAuth } from '@/hooks/useAuth';
import { DoctorDashboard } from '@/components/dashboard/DoctorDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

export default function Dashboard() {
  const { role } = useAuth();

  return role === 'admin' ? <AdminDashboard /> : <DoctorDashboard />;
}
