import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ScanLine, User, Heart, Activity } from 'lucide-react';

const emergencyAlerts = [
  { id: '1', patientName: 'Maria Garcia', caretagId: 'CT-2024-089', alert: 'Low SpO2 (88%)', severity: 'critical', time: '5 min ago', bloodGroup: 'O+', allergies: ['Aspirin'] },
  { id: '2', patientName: 'John Smith', caretagId: 'CT-2024-045', alert: 'High Heart Rate (125 bpm)', severity: 'high', time: '12 min ago', bloodGroup: 'A-', allergies: [] },
];

export default function Emergency() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-emergency flex items-center gap-2"><AlertTriangle className="h-8 w-8" />Emergency Mode</h1>
        <Button variant="destructive" className="gap-2"><ScanLine className="h-4 w-4" />Scan Patient CareTag</Button>
      </div>

      <div className="grid gap-4">
        {emergencyAlerts.map((alert) => (
          <Card key={alert.id} className="border-emergency/50 bg-emergency/5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/patients/${alert.id}`)}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-emergency/20 flex items-center justify-center"><User className="h-7 w-7 text-emergency" /></div>
                  <div>
                    <p className="text-xl font-bold">{alert.patientName}</p>
                    <p className="text-muted-foreground">{alert.caretagId}</p>
                  </div>
                </div>
                <Badge variant="destructive" className="text-base px-3 py-1">{alert.severity === 'critical' ? 'CRITICAL' : 'HIGH'}</Badge>
              </div>
              <div className="p-3 rounded-lg bg-emergency/10 border border-emergency/30 mb-4">
                <p className="text-lg font-semibold text-emergency flex items-center gap-2"><Activity className="h-5 w-5" />{alert.alert}</p>
                <p className="text-sm text-muted-foreground">{alert.time}</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div><span className="text-muted-foreground">Blood Group:</span> <strong>{alert.bloodGroup}</strong></div>
                <div><span className="text-muted-foreground">Allergies:</span> <strong className={alert.allergies.length ? 'text-emergency' : ''}>{alert.allergies.length ? alert.allergies.join(', ') : 'None'}</strong></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
