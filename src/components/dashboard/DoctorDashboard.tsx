import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Activity,
  Heart,
  User,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';

// Mock data - will be replaced with real data from Supabase
const todayAppointments = [
  { id: '1', patientName: 'Sarah Johnson', time: '09:00 AM', reason: 'Follow-up', status: 'upcoming' },
  { id: '2', patientName: 'Michael Chen', time: '10:30 AM', reason: 'Consultation', status: 'in_progress' },
  { id: '3', patientName: 'Emily Davis', time: '11:30 AM', reason: 'Lab Review', status: 'upcoming' },
  { id: '4', patientName: 'Robert Wilson', time: '02:00 PM', reason: 'Chronic Care', status: 'upcoming' },
];

const recentPatients = [
  { id: '1', name: 'James Brown', caretagId: 'CT-2024-001', lastVisit: '2 hours ago', condition: 'Stable' },
  { id: '2', name: 'Lisa Anderson', caretagId: 'CT-2024-015', lastVisit: '4 hours ago', condition: 'Monitoring' },
  { id: '3', name: 'David Martinez', caretagId: 'CT-2024-023', lastVisit: 'Yesterday', condition: 'Stable' },
];

const emergencyAlerts = [
  { id: '1', patientName: 'Maria Garcia', alert: 'Low SpO2 (88%)', severity: 'high', time: '5 min ago' },
  { id: '2', patientName: 'John Smith', alert: 'Missed medication', severity: 'medium', time: '15 min ago' },
];

const criticalVitals = [
  { id: '1', patientName: 'Thomas Lee', metric: 'Heart Rate', value: '112 bpm', status: 'elevated' },
  { id: '2', patientName: 'Nancy White', metric: 'Blood Pressure', value: '155/95', status: 'high' },
];

const pendingFollowups = [
  { id: '1', patientName: 'Kevin Taylor', lastVisit: 'Dec 20, 2024', reason: 'Post-surgery check' },
  { id: '2', patientName: 'Amanda Clark', lastVisit: 'Dec 18, 2024', reason: 'Lab results review' },
];

export function DoctorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Doctor</p>
        </div>
        <Button onClick={() => navigate('/emergency')} variant="destructive" className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          Emergency Mode
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/appointments')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Appointments</p>
                <p className="text-3xl font-bold text-foreground">8</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/patients')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Patients Seen Today</p>
                <p className="text-3xl font-bold text-foreground">12</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/emergency')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emergency Alerts</p>
                <p className="text-3xl font-bold text-emergency">2</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emergency/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-emergency" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/prescriptions')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prescriptions Today</p>
                <p className="text-3xl font-bold text-foreground">5</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Appointments
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')}>
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => navigate(`/appointments/${apt.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{apt.patientName}</p>
                    <p className="text-sm text-muted-foreground">{apt.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{apt.time}</p>
                  <Badge
                    variant={apt.status === 'in_progress' ? 'default' : 'secondary'}
                    className={apt.status === 'in_progress' ? 'bg-success' : ''}
                  >
                    {apt.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Recent Patients
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/patients')}>
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">{patient.caretagId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{patient.lastVisit}</p>
                  <Badge variant="outline">{patient.condition}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Emergency Alerts */}
        <Card className="border-emergency/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-emergency">
              <AlertTriangle className="h-5 w-5" />
              Emergency Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/emergency')}>
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {emergencyAlerts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No emergency alerts</p>
            ) : (
              emergencyAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => navigate('/emergency')}
                  className="flex items-center justify-between p-3 rounded-lg bg-emergency/5 hover:bg-emergency/10 cursor-pointer transition-colors border border-emergency/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emergency/20 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-emergency" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{alert.patientName}</p>
                      <p className="text-sm text-emergency">{alert.alert}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{alert.time}</p>
                    <Badge variant="destructive">
                      {alert.severity === 'high' ? 'Critical' : 'Warning'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Critical Vitals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Critical Vitals Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/devices')}>
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalVitals.map((vital) => (
              <div
                key={vital.id}
                onClick={() => navigate(`/patients/${vital.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{vital.patientName}</p>
                    <p className="text-sm text-muted-foreground">{vital.metric}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-warning">{vital.value}</p>
                  <Badge variant="outline" className="text-warning border-warning">
                    {vital.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pending Follow-ups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Pending Follow-ups
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')}>
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingFollowups.map((followup) => (
              <div
                key={followup.id}
                onClick={() => navigate(`/patients/${followup.id}`)}
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
              >
                <p className="font-medium text-foreground">{followup.patientName}</p>
                <p className="text-sm text-muted-foreground mt-1">{followup.reason}</p>
                <p className="text-xs text-muted-foreground mt-2">Last visit: {followup.lastVisit}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
