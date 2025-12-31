import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Shield, Users, FileText, Bell } from 'lucide-react';

export default function Settings() {
  const { role } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5" />General Settings</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Configure application preferences</p></CardContent></Card>
        <Card className="cursor-pointer hover:shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notifications</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Manage alert preferences</p></CardContent></Card>
        {role === 'admin' && (
          <>
            <Card className="cursor-pointer hover:shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />User Management</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Manage doctors and staff access</p></CardContent></Card>
            <Card className="cursor-pointer hover:shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Security & Compliance</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Audit logs and data access controls</p></CardContent></Card>
            <Card className="cursor-pointer hover:shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Audit Logs</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">View system access history</p></CardContent></Card>
          </>
        )}
      </div>
    </div>
  );
}
