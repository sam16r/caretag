import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, Plus, User } from 'lucide-react';

const prescriptions = [
  { id: '1', patientName: 'Sarah Johnson', date: 'Dec 30, 2024', medications: 3, status: 'active' },
  { id: '2', patientName: 'Michael Chen', date: 'Dec 28, 2024', medications: 2, status: 'active' },
  { id: '3', patientName: 'Emily Davis', date: 'Dec 25, 2024', medications: 4, status: 'completed' },
];

export default function Prescriptions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Prescriptions</h1>
        <Button className="gap-2"><Plus className="h-4 w-4" />New Prescription</Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5" />Recent Prescriptions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-medium">{rx.patientName}</p>
                  <p className="text-sm text-muted-foreground">{rx.medications} medications</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{rx.date}</span>
                <Badge variant={rx.status === 'active' ? 'default' : 'secondary'}>{rx.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
