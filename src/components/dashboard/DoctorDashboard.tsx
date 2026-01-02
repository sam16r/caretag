import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  Plus,
  Search,
  ScanLine,
  Users,
} from 'lucide-react';
import { useDashboardStats, useRecentPatients, useTodayAppointments, useActiveEmergencies } from '@/hooks/useDashboardData';
import { format } from 'date-fns';

export function DoctorDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentPatients, isLoading: patientsLoading } = useRecentPatients(4);
  const { data: todayAppointments, isLoading: appointmentsLoading } = useTodayAppointments();
  const { data: emergencies, isLoading: emergenciesLoading } = useActiveEmergencies();

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{getTimeOfDay()}, Doctor</h1>
          <p className="text-muted-foreground mt-1">Here's your overview for today, {format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/patients')} className="gap-2 shadow-sm">
            <Search className="h-4 w-4" />
            Find Patient
          </Button>
          <Button onClick={() => navigate('/emergency')} className="gap-2 bg-emergency hover:bg-emergency/90 shadow-lg shadow-emergency/25">
            <AlertTriangle className="h-4 w-4" />
            Emergency Mode
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:shadow-md transition-all"
          onClick={() => navigate('/patients?action=new')}
        >
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <span className="font-medium">New Patient</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:shadow-md transition-all"
          onClick={() => navigate('/patients?scan=true')}
        >
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <ScanLine className="h-5 w-5 text-accent" />
          </div>
          <span className="font-medium">Scan CareTag</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:shadow-md transition-all"
          onClick={() => navigate('/prescriptions?action=new')}
        >
          <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-success" />
          </div>
          <span className="font-medium">New Prescription</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:shadow-md transition-all"
          onClick={() => navigate('/appointments?action=new')}
        >
          <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-warning" />
          </div>
          <span className="font-medium">Book Appointment</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="card-interactive stat-glow-primary cursor-pointer group" onClick={() => navigate('/patients')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                {statsLoading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  <p className="text-4xl font-bold tracking-tight">{stats?.totalPatients || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Registered patients</p>
              </div>
              <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
                <Users className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive stat-glow-accent cursor-pointer group" onClick={() => navigate('/appointments')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                {statsLoading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  <p className="text-4xl font-bold tracking-tight">{stats?.todayAppointments || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Scheduled today</p>
              </div>
              <div className="h-14 w-14 rounded-2xl gradient-accent flex items-center justify-center shadow-lg shadow-accent/25 group-hover:scale-105 transition-transform">
                <Calendar className="h-7 w-7 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`card-interactive cursor-pointer group ${(stats?.activeEmergencies || 0) > 0 ? 'stat-glow-emergency border-emergency/20' : ''}`}
          onClick={() => navigate('/emergency')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Emergencies</p>
                {statsLoading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  <p className={`text-4xl font-bold tracking-tight ${(stats?.activeEmergencies || 0) > 0 ? 'text-emergency' : ''}`}>
                    {stats?.activeEmergencies || 0}
                  </p>
                )}
                <p className={`text-sm font-medium ${(stats?.activeEmergencies || 0) > 0 ? 'text-emergency' : 'text-muted-foreground'}`}>
                  {(stats?.activeEmergencies || 0) > 0 ? 'Requires attention' : 'All clear'}
                </p>
              </div>
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform ${
                (stats?.activeEmergencies || 0) > 0 ? 'bg-emergency shadow-emergency/30' : 'bg-muted'
              }`}>
                <AlertTriangle className={`h-7 w-7 ${(stats?.activeEmergencies || 0) > 0 ? 'text-emergency-foreground' : 'text-muted-foreground'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive stat-glow-success cursor-pointer group" onClick={() => navigate('/prescriptions')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Prescriptions</p>
                {statsLoading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  <p className="text-4xl font-bold tracking-tight">{stats?.activePrescriptions || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Currently active</p>
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
            {appointmentsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))
            ) : todayAppointments && todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 4).map((apt, index) => (
                <div
                  key={apt.id}
                  onClick={() => navigate(`/patients/${apt.patient_id}`)}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/70 cursor-pointer transition-all duration-200 hover:shadow-sm animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{(apt.patients as any)?.full_name || 'Unknown Patient'}</p>
                      <p className="text-sm text-muted-foreground">{apt.reason || 'General Consultation'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{format(new Date(apt.scheduled_at), 'h:mm a')}</p>
                    <Badge variant={apt.status === 'in_progress' ? 'default' : 'secondary'} className={apt.status === 'in_progress' ? 'bg-success' : ''}>
                      {apt.status === 'in_progress' ? 'In Progress' : apt.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No appointments scheduled for today</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/appointments?action=new')}>
                  Schedule Appointment
                </Button>
              </div>
            )}
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
            {patientsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))
            ) : recentPatients && recentPatients.length > 0 ? (
              recentPatients.map((patient, index) => (
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
                      <p className="font-semibold">{patient.full_name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{patient.caretag_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{patient.gender}, {patient.blood_group || 'Unknown'}</p>
                    {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
                      <Badge variant="outline" className="font-medium">{patient.chronic_conditions[0]}</Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No patients registered yet</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/patients?action=new')}>
                  Add First Patient
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Emergencies */}
        <Card className={`card-elevated ${emergencies && emergencies.length > 0 ? 'border-emergency/20' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className={`flex items-center gap-2.5 text-lg font-semibold ${emergencies && emergencies.length > 0 ? 'text-emergency' : ''}`}>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${emergencies && emergencies.length > 0 ? 'bg-emergency/10' : 'bg-muted'}`}>
                <AlertTriangle className={`h-4.5 w-4.5 ${emergencies && emergencies.length > 0 ? 'text-emergency' : 'text-muted-foreground'}`} />
              </div>
              Emergency Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/emergency')} className="text-primary hover:text-primary">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {emergenciesLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))
            ) : emergencies && emergencies.length > 0 ? (
              emergencies.slice(0, 3).map((emergency, index) => (
                <div
                  key={emergency.id}
                  onClick={() => navigate(`/patients/${emergency.patient_id}`)}
                  className="flex items-center justify-between p-4 rounded-xl bg-emergency/5 hover:bg-emergency/10 cursor-pointer transition-all duration-200 border border-emergency/15 hover:border-emergency/25 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-emergency/15 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-emergency" />
                    </div>
                    <div>
                      <p className="font-semibold">{(emergency.patients as any)?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-emergency font-medium">{emergency.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{format(new Date(emergency.created_at), 'h:mm a')}</p>
                    <Badge variant="destructive" className="font-semibold capitalize">
                      {emergency.severity}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <Activity className="h-6 w-6 text-success" />
                </div>
                <p className="font-medium text-success">All Clear</p>
                <p className="text-sm text-muted-foreground mt-1">No active emergency alerts</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Critical Vitals Placeholder */}
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Heart className="h-4.5 w-4.5 text-warning" />
              </div>
              Vital Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/devices')} className="text-primary hover:text-primary">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No abnormal vitals detected</p>
              <p className="text-sm text-muted-foreground mt-1">Patient wearables data will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
