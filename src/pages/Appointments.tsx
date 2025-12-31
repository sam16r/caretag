import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Plus } from 'lucide-react';

const appointments = [
  { id: '1', patientName: 'Sarah Johnson', time: '09:00 AM', duration: 30, reason: 'Follow-up', status: 'scheduled' },
  { id: '2', patientName: 'Michael Chen', time: '10:30 AM', duration: 45, reason: 'Consultation', status: 'in_progress' },
  { id: '3', patientName: 'Emily Davis', time: '11:30 AM', duration: 30, reason: 'Lab Review', status: 'scheduled' },
  { id: '4', patientName: 'Robert Wilson', time: '02:00 PM', duration: 60, reason: 'Chronic Care', status: 'scheduled' },
];

export default function Appointments() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">OPD / Appointments</h1>
        <Button className="gap-2"><Plus className="h-4 w-4" />New Appointment</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Today's Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {appointments.map((apt) => (
            <div key={apt.id} onClick={() => navigate(`/patients/${apt.id}`)} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-medium">{apt.patientName}</p>
                  <p className="text-sm text-muted-foreground">{apt.reason}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium flex items-center gap-1"><Clock className="h-4 w-4" />{apt.time}</p>
                  <p className="text-sm text-muted-foreground">{apt.duration} min</p>
                </div>
                <Badge variant={apt.status === 'in_progress' ? 'default' : 'secondary'}>{apt.status === 'in_progress' ? 'In Progress' : 'Scheduled'}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
