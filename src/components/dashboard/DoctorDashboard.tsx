import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Activity,
  User,
  ArrowRight,
  Stethoscope,
  Plus,
  ScanLine,
  Users,
  FileText,
  TrendingUp,
  ArrowUpRight,
  Heart,
} from 'lucide-react';
import { useDashboardStats, useRecentPatients, useTodayAppointments, useActiveEmergencies } from '@/hooks/useDashboardData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function DoctorDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentPatients, isLoading: patientsLoading } = useRecentPatients(4);
  const { data: todayAppointments, isLoading: appointmentsLoading } = useTodayAppointments();
  const { data: emergencies, isLoading: emergenciesLoading } = useActiveEmergencies();

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.totalPatients || 0,
      change: '+12%',
      icon: Users,
      bgClass: 'stat-card-blue',
      iconBg: 'bg-primary',
      onClick: () => navigate('/patients'),
    },
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      change: null,
      icon: Calendar,
      bgClass: 'stat-card-indigo',
      iconBg: 'bg-accent',
      onClick: () => navigate('/appointments'),
    },
    {
      title: 'Emergencies',
      value: stats?.activeEmergencies || 0,
      change: null,
      icon: AlertTriangle,
      bgClass: 'stat-card-red',
      iconBg: (stats?.activeEmergencies || 0) > 0 ? 'bg-destructive' : 'bg-muted',
      highlight: (stats?.activeEmergencies || 0) > 0,
      onClick: () => navigate('/emergency'),
    },
    {
      title: 'Prescriptions',
      value: stats?.activePrescriptions || 0,
      change: '+3',
      icon: FileText,
      bgClass: 'stat-card-green',
      iconBg: 'bg-success',
      onClick: () => navigate('/prescriptions'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{getTimeOfDay()}, Doctor</h1>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/patients?scan=true')} 
            className="gap-2"
          >
            <ScanLine className="h-4 w-4" />
            Scan CareTag
          </Button>
          <Button 
            onClick={() => navigate('/emergency')} 
            variant="destructive"
            className="gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Emergency
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div 
            key={stat.title}
            className={cn(stat.bgClass, "cursor-pointer hover:shadow-md transition-shadow")}
            onClick={stat.onClick}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-14" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-3xl font-semibold",
                      stat.highlight && "text-destructive"
                    )}>
                      {stat.value}
                    </span>
                    {stat.change && (
                      <Badge variant="secondary" className="bg-success/10 text-success border-0 text-xs">
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                        {stat.change}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                stat.iconBg
              )}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'New Patient', icon: Plus, onClick: () => navigate('/patients?action=new') },
            { label: 'Scan CareTag', icon: ScanLine, onClick: () => navigate('/patients?scan=true') },
            { label: 'Prescription', icon: Stethoscope, onClick: () => navigate('/prescriptions?action=new') },
            { label: 'Schedule', icon: Calendar, onClick: () => navigate('/appointments?action=new') },
          ].map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={action.onClick}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" />
                Today's Schedule
              </CardTitle>
              <CardDescription>Your upcoming appointments</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/appointments')} 
              className="gap-1 text-primary"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {appointmentsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : todayAppointments && todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 5).map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => navigate(`/patients/${apt.patient_id}`)}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                    {(apt.patients as any)?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {(apt.patients as any)?.full_name || 'Unknown Patient'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {apt.reason || 'General Consultation'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">{format(new Date(apt.scheduled_at), 'h:mm a')}</p>
                    <Badge 
                      variant={apt.status === 'in_progress' ? 'default' : 'secondary'}
                      className="capitalize text-xs"
                    >
                      {apt.status === 'in_progress' ? 'Active' : apt.status}
                    </Badge>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="font-medium">No appointments today</p>
                <p className="text-sm text-muted-foreground">Your schedule is clear</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Emergencies */}
          <Card className={cn(
            emergencies && emergencies.length > 0 && "border-destructive/30"
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={cn(
                "flex items-center gap-2 text-base",
                emergencies && emergencies.length > 0 && "text-destructive"
              )}>
                {emergencies && emergencies.length > 0 ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Heart className="h-4 w-4 text-success" />
                )}
                Emergencies
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/emergency')}
              >
                View all
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {emergenciesLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : emergencies && emergencies.length > 0 ? (
                emergencies.slice(0, 3).map((emergency) => (
                  <div
                    key={emergency.id}
                    onClick={() => navigate(`/patients/${emergency.patient_id}`)}
                    className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {(emergency.patients as any)?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-destructive truncate">{emergency.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="destructive" className="capitalize text-xs">
                            {emergency.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(emergency.created_at), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="font-medium text-success">All Clear</p>
                  <p className="text-sm text-muted-foreground">No emergencies</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-accent" />
                Recent Patients
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/patients')}
              >
                View all
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {patientsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))
              ) : recentPatients && recentPatients.length > 0 ? (
                recentPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-medium text-sm">
                      {patient.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{patient.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient.gender} • {patient.blood_group || 'Unknown'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
        </div>
      </div>
    </div>
  );
}