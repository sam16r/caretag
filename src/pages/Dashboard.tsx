import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DoctorDashboard } from '@/components/dashboard/DoctorDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { CustomizableDashboard } from '@/components/dashboard/CustomizableDashboard';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Sliders } from 'lucide-react';

export default function Dashboard() {
  const { role } = useAuth();
  const [useCustomDashboard, setUseCustomDashboard] = useState(false);

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseCustomDashboard(!useCustomDashboard)}
          className="gap-2"
        >
          {useCustomDashboard ? (
            <>
              <LayoutDashboard className="h-4 w-4" />
              Standard View
            </>
          ) : (
            <>
              <Sliders className="h-4 w-4" />
              Customizable View
            </>
          )}
        </Button>
      </div>
      {useCustomDashboard ? <CustomizableDashboard /> : <DoctorDashboard />}
    </div>
  );
}
