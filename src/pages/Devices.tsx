import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Heart, Activity, User } from 'lucide-react';

const deviceData = [
  { id: '1', patientName: 'Thomas Lee', device: 'CareTag Band Pro', heartRate: 112, spo2: 96, status: 'elevated' },
  { id: '2', patientName: 'Nancy White', device: 'CareTag Band', heartRate: 78, spo2: 98, status: 'normal' },
  { id: '3', patientName: 'James Brown', device: 'CareTag Band Pro', heartRate: 85, spo2: 94, status: 'monitoring' },
];

export default function Devices() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Devices & Wearables</h1>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" />Connected Devices</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {deviceData.map((device) => (
            <div key={device.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-medium">{device.patientName}</p>
                  <p className="text-sm text-muted-foreground">{device.device}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-emergency" /><span className={device.status === 'elevated' ? 'text-warning font-medium' : ''}>{device.heartRate} bpm</span></div>
                <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /><span>{device.spo2}%</span></div>
                <Badge variant={device.status === 'elevated' ? 'destructive' : device.status === 'monitoring' ? 'secondary' : 'outline'}>{device.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
