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
  TrendingUp,
} from 'lucide-react';

// Mock data
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good Morning, Doctor</h1>
          <p className="text-muted-foreground mt-1">Here's your overview for today</p>
        </div>
        <Button 
          onClick={() => navigate('/emergency')} 
          className="gap-2 bg-emergency hover:bg-emergency/90 shadow-lg shadow-emergency/25"
        >
          <AlertTriangle className="h-4 w-4" />
          Emergency Mode
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card 
          className="card-interactive stat-glow-primary cursor-pointer group"
          onClick={() => navigate('/appointments')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                <p className="text-4xl font-bold tracking-tight">8</p>
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>2 more than yesterday</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
                <Calendar className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="card-interactive stat-glow-accent cursor-pointer group"
          onClick={() => navigate('/patients')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Patients Seen</p>
                <p className="text-4xl font-bold tracking-tight">12</p>
                <p className="text-sm text-muted-foreground">Today's consultations</p>
              </div>
              <div className="h-14 w-14 rounded-2xl gradient-accent flex items-center justify-center shadow-lg shadow-accent/25 group-hover:scale-105 transition-transform">
                <User className="h-7 w-7 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="card-interactive stat-glow-emergency cursor-pointer group border-emergency/20"
          onClick={() => navigate('/emergency')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Emergency Alerts</p>
                <p className="text-4xl font-bold tracking-tight text-emergency">2</p>
                <p className="text-sm text-emergency font-medium">Requires attention</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-emergency flex items-center justify-center shadow-lg shadow-emergency/30 group-hover:scale-105 transition-transform">
                <AlertTriangle className="h-7 w-7 text-emergency-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="card-interactive stat-glow-success cursor-pointer group"
          onClick={() => navigate('/prescriptions')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Prescriptions</p>
                <p className="text-4xl font-bold tracking-tight">5</p>
                <p className="text-sm text-muted-foreground">Issued today</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-success flex items-center justify-center shadow-lg shadow-success/25 group-hover:scale-105 transition-transform">
                <Stethoscope className="h-7 w-7 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-4.5 w-4.5 text-primary" />
              </div>
              Today's Appointments
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')} className="text-primary hover:text-primary">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppointments.map((apt, index) => (
              <div
                key={apt.id}
                onClick={() => navigate(`/appointments/${apt.id}`)}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/70 cursor-pointer transition-all duration-200 hover:shadow-sm animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{apt.patientName}</p>
                    <p className="text-sm text-muted-foreground">{apt.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{apt.time}</p>
                  <Badge
                    variant={apt.status === 'in_progress' ? 'default' : 'secondary'}
                    className={apt.status === 'in_progress' ? 'bg-success text-success-foreground' : ''}
                  >
                    {apt.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <User className="h-4.5 w-4.5 text-accent" />
              </div>
              Recent Patients
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/patients')} className="text-primary hover:text-primary">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPatients.map((patient, index) => (
              <div
                key={patient.id}
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/70 cursor-pointer transition-all duration-200 hover:shadow-sm animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">{patient.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">{patient.caretagId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{patient.lastVisit}</p>
                  <Badge variant="outline" className="font-medium">{patient.condition}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Emergency Alerts */}
        <Card className="card-elevated border-emergency/20">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-emergency">
              <div className="h-8 w-8 rounded-lg bg-emergency/10 flex items-center justify-center">
                <AlertTriangle className="h-4.5 w-4.5 text-emergency" />
              </div>
              Emergency Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/emergency')} className="text-emergency hover:text-emergency">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {emergencyAlerts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No emergency alerts</p>
            ) : (
              emergencyAlerts.map((alert, index) => (
                <div
                  key={alert.id}
                  onClick={() => navigate('/emergency')}
                  className="flex items-center justify-between p-4 rounded-xl bg-emergency/5 hover:bg-emergency/10 cursor-pointer transition-all duration-200 border border-emergency/15 hover:border-emergency/25 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-emergency/15 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-emergency" />
                    </div>
                    <div>
                      <p className="font-semibold">{alert.patientName}</p>
                      <p className="text-sm text-emergency font-medium">{alert.alert}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{alert.time}</p>
                    <Badge variant="destructive" className="font-semibold">
                      {alert.severity === 'high' ? 'Critical' : 'Warning'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Critical Vitals */}
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Heart className="h-4.5 w-4.5 text-warning" />
              </div>
              Critical Vitals
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/devices')} className="text-primary hover:text-primary">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalVitals.map((vital, index) => (
              <div
                key={vital.id}
                onClick={() => navigate(`/patients/${vital.id}`)}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/70 cursor-pointer transition-all duration-200 hover:shadow-sm animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-semibold">{vital.patientName}</p>
                    <p className="text-sm text-muted-foreground">{vital.metric}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-warning">{vital.value}</p>
                  <Badge variant="outline" className="text-warning border-warning/40 font-medium">
                    {vital.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pending Follow-ups */}
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4.5 w-4.5 text-primary" />
            </div>
            Pending Follow-ups
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')} className="text-primary hover:text-primary">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingFollowups.map((followup, index) => (
              <div
                key={followup.id}
                onClick={() => navigate(`/patients/${followup.id}`)}
                className="p-5 rounded-xl bg-muted/40 hover:bg-muted/70 cursor-pointer transition-all duration-200 hover:shadow-sm animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <p className="font-semibold">{followup.patientName}</p>
                <p className="text-sm text-muted-foreground mt-1">{followup.reason}</p>
                <p className="text-xs text-muted-foreground mt-3 font-medium">Last visit: {followup.lastVisit}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
