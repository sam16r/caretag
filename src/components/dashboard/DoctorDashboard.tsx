import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
      color: 'bg-primary',
      onClick: () => navigate('/patients'),
    },
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      change: null,
      icon: Calendar,
      color: 'bg-accent',
      onClick: () => navigate('/appointments'),
    },
    {
      title: 'Emergencies',
      value: stats?.activeEmergencies || 0,
      change: null,
      icon: AlertTriangle,
      color: (stats?.activeEmergencies || 0) > 0 ? 'bg-destructive' : 'bg-muted',
      highlight: (stats?.activeEmergencies || 0) > 0,
      onClick: () => navigate('/emergency'),
    },
    {
      title: 'Prescriptions',
      value: stats?.activePrescriptions || 0,
      change: '+3',
      icon: FileText,
      color: 'bg-success',
      onClick: () => navigate('/prescriptions'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{getTimeOfDay()}, Doctor</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/patients?scan=true')} 
            className="gap-2 h-9"
          >
            <ScanLine className="h-4 w-4" />
            Scan CareTag
          </Button>
          <Button 
            size="sm" 
            onClick={() => navigate('/emergency')} 
            variant="destructive"
            className="gap-2 h-9"
          >
            <AlertTriangle className="h-4 w-4" />
            Emergency
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              stat.highlight && "border-destructive/50"
            )}
            onClick={stat.onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-14" />
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "text-2xl font-bold",
                        stat.highlight && "text-destructive"
                      )}>
                        {stat.value}
                      </span>
                      {stat.change && (
                        <span className="text-xs font-medium text-success flex items-center">
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                          {stat.change}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", stat.color)}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'New Patient', icon: Plus, onClick: () => navigate('/patients?action=new') },
          { label: 'Scan CareTag', icon: ScanLine, onClick: () => navigate('/patients?scan=true') },
          { label: 'Prescription', icon: Stethoscope, onClick: () => navigate('/prescriptions?action=new') },
          { label: 'Schedule', icon: Calendar, onClick: () => navigate('/appointments?action=new') },
        ].map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
            onClick={action.onClick}
          >
            <action.icon className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Today's Schedule
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Your upcoming appointments</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/appointments')} 
              className="gap-1 text-xs h-8 text-primary hover:text-primary"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {appointmentsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : todayAppointments && todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 5).map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => navigate(`/patients/${apt.patient_id}`)}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {(apt.patients as any)?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {(apt.patients as any)?.full_name || 'Unknown Patient'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {apt.reason || 'General Consultation'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{format(new Date(apt.scheduled_at), 'h:mm a')}</p>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-[10px] capitalize",
                        apt.status === 'in_progress' && "bg-success/10 text-success"
                      )}
                    >
                      {apt.status === 'in_progress' ? 'Active' : apt.status}
                    </Badge>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium">No appointments today</p>
                <p className="text-xs text-muted-foreground">Your schedule is clear</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Emergencies */}
          <Card className={cn(emergencies && emergencies.length > 0 && "border-destructive/50")}>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className={cn(
                "text-base font-semibold flex items-center gap-2",
                emergencies && emergencies.length > 0 && "text-destructive"
              )}>
                <AlertTriangle className={cn(
                  "h-4 w-4",
                  emergencies && emergencies.length > 0 ? "text-destructive" : "text-muted-foreground"
                )} />
                Emergencies
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/emergency')} 
                className="h-7 text-xs"
              >
                View all
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
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
                      <div className="h-8 w-8 rounded bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {(emergency.patients as any)?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-destructive truncate">{emergency.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="destructive" className="text-[10px] capitalize h-5">
                            {emergency.severity}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(emergency.created_at), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                    <Activity className="h-5 w-5 text-success" />
                  </div>
                  <p className="text-sm font-medium text-success">All Clear</p>
                  <p className="text-xs text-muted-foreground">No emergencies</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                Recent Patients
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/patients')} 
                className="h-7 text-xs"
              >
                View all
              </Button>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {patientsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))
              ) : recentPatients && recentPatients.length > 0 ? (
                recentPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent/10 text-accent text-xs font-medium">
                        {patient.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{patient.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {patient.gender} • {patient.blood_group || 'Unknown'}
                      </p>
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
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
