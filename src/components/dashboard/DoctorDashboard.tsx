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
    <div className="space-y-5 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{getTimeOfDay()}, Doctor</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/patients')} className="gap-1.5 h-8 text-sm">
            <Search className="h-3.5 w-3.5" />
            Find Patient
          </Button>
          <Button size="sm" onClick={() => navigate('/emergency')} className="gap-1.5 h-8 text-sm bg-emergency hover:bg-emergency/90">
            <AlertTriangle className="h-3.5 w-3.5" />
            Emergency
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="outline"
          className="h-auto py-3 flex flex-col items-center gap-1.5 text-sm"
          onClick={() => navigate('/patients?action=new')}
        >
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">New Patient</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3 flex flex-col items-center gap-1.5 text-sm"
          onClick={() => navigate('/patients?scan=true')}
        >
          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <ScanLine className="h-4 w-4 text-accent" />
          </div>
          <span className="font-medium">Scan CareTag</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3 flex flex-col items-center gap-1.5 text-sm"
          onClick={() => navigate('/prescriptions?action=new')}
        >
          <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
            <Stethoscope className="h-4 w-4 text-success" />
          </div>
          <span className="font-medium">Prescription</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3 flex flex-col items-center gap-1.5 text-sm"
          onClick={() => navigate('/appointments?action=new')}
        >
          <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-warning" />
          </div>
          <span className="font-medium">Appointment</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="card-interactive cursor-pointer" onClick={() => navigate('/patients')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Patients</p>
                {statsLoading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold mt-0.5">{stats?.totalPatients || 0}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive cursor-pointer" onClick={() => navigate('/appointments')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Today's Appointments</p>
                {statsLoading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold mt-0.5">{stats?.todayAppointments || 0}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-lg gradient-accent flex items-center justify-center">
                <Calendar className="h-5 w-5 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`card-interactive cursor-pointer ${(stats?.activeEmergencies || 0) > 0 ? 'border-emergency/30' : ''}`}
          onClick={() => navigate('/emergency')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Emergencies</p>
                {statsLoading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className={`text-2xl font-semibold mt-0.5 ${(stats?.activeEmergencies || 0) > 0 ? 'text-emergency' : ''}`}>
                    {stats?.activeEmergencies || 0}
                  </p>
                )}
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                (stats?.activeEmergencies || 0) > 0 ? 'bg-emergency' : 'bg-muted'
              }`}>
                <AlertTriangle className={`h-5 w-5 ${(stats?.activeEmergencies || 0) > 0 ? 'text-emergency-foreground' : 'text-muted-foreground'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive cursor-pointer" onClick={() => navigate('/prescriptions')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Prescriptions</p>
                {statsLoading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold mt-0.5">{stats?.activePrescriptions || 0}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-lg bg-success flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-primary" />
              Today's Appointments
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')} className="h-7 text-xs text-muted-foreground hover:text-foreground">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {appointmentsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : todayAppointments && todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 4).map((apt, index) => (
                <div
                  key={apt.id}
                  onClick={() => navigate(`/patients/${apt.patient_id}`)}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{(apt.patients as any)?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{apt.reason || 'Consultation'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{format(new Date(apt.scheduled_at), 'h:mm a')}</p>
                    <Badge variant={apt.status === 'in_progress' ? 'default' : 'secondary'} className={`text-[10px] ${apt.status === 'in_progress' ? 'bg-success' : ''}`}>
                      {apt.status === 'in_progress' ? 'Active' : apt.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No appointments today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-accent" />
              Recent Patients
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/patients')} className="h-7 text-xs text-muted-foreground hover:text-foreground">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {patientsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : recentPatients && recentPatients.length > 0 ? (
              recentPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{patient.full_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{patient.caretag_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{patient.gender}, {patient.blood_group || '-'}</p>
                    {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
                      <Badge variant="outline" className="text-[10px]">{patient.chronic_conditions[0]}</Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No patients yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Emergencies */}
        <Card className={emergencies && emergencies.length > 0 ? 'border-emergency/30' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className={`flex items-center gap-2 text-sm font-medium ${emergencies && emergencies.length > 0 ? 'text-emergency' : ''}`}>
              <AlertTriangle className={`h-4 w-4 ${emergencies && emergencies.length > 0 ? 'text-emergency' : 'text-muted-foreground'}`} />
              Emergency Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/emergency')} className="h-7 text-xs text-muted-foreground hover:text-foreground">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {emergenciesLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : emergencies && emergencies.length > 0 ? (
              emergencies.slice(0, 3).map((emergency) => (
                <div
                  key={emergency.id}
                  onClick={() => navigate(`/patients/${emergency.patient_id}`)}
                  className="flex items-center justify-between p-3 rounded-lg bg-emergency/5 hover:bg-emergency/10 cursor-pointer transition-colors border border-emergency/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emergency/10 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-emergency" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{(emergency.patients as any)?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-emergency">{emergency.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{format(new Date(emergency.created_at), 'h:mm a')}</p>
                    <Badge variant="destructive" className="text-[10px] capitalize">
                      {emergency.severity}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                  <Activity className="h-4 w-4 text-success" />
                </div>
                <p className="text-sm font-medium text-success">All Clear</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vital Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Heart className="h-4 w-4 text-warning" />
              Vital Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/devices')} className="h-7 text-xs text-muted-foreground hover:text-foreground">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No abnormal vitals</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
