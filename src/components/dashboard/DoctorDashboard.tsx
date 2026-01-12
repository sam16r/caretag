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
  Heart,
  User,
  ArrowRight,
  Stethoscope,
  TrendingUp,
  Plus,
  Search,
  ScanLine,
  Users,
  FileText,
  ChevronRight,
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
      subtitle: 'in your care',
      icon: Users,
      color: 'primary' as const,
      onClick: () => navigate('/patients'),
    },
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      subtitle: 'scheduled',
      icon: Calendar,
      color: 'accent' as const,
      onClick: () => navigate('/appointments'),
    },
    {
      title: 'Active Emergencies',
      value: stats?.activeEmergencies || 0,
      subtitle: 'require attention',
      icon: AlertTriangle,
      color: 'destructive' as const,
      highlight: (stats?.activeEmergencies || 0) > 0,
      onClick: () => navigate('/emergency'),
    },
    {
      title: 'Prescriptions',
      value: stats?.activePrescriptions || 0,
      subtitle: 'active',
      icon: FileText,
      color: 'success' as const,
      onClick: () => navigate('/prescriptions'),
    },
  ];

  const getColorClasses = (color: string, highlight?: boolean) => {
    const colors: Record<string, { bg: string; iconBg: string; text: string }> = {
      primary: { bg: 'bg-primary/5', iconBg: 'bg-primary', text: 'text-primary' },
      accent: { bg: 'bg-accent/5', iconBg: 'bg-accent', text: 'text-accent' },
      success: { bg: 'bg-success/5', iconBg: 'bg-success', text: 'text-success' },
      destructive: { bg: highlight ? 'bg-destructive/10' : 'bg-muted', iconBg: highlight ? 'bg-destructive' : 'bg-muted', text: highlight ? 'text-destructive' : 'text-muted-foreground' },
    };
    return colors[color] || colors.primary;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{getTimeOfDay()}, Doctor</h1>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/patients?scan=true')} 
            className="gap-2 h-9 rounded-lg border-border/60 hover:border-primary/40 hover:bg-primary/5"
          >
            <ScanLine className="h-4 w-4 text-primary" />
            Scan CareTag
          </Button>
          <Button 
            size="sm" 
            onClick={() => navigate('/emergency')} 
            className="gap-2 h-9 rounded-lg bg-destructive hover:bg-destructive/90"
          >
            <AlertTriangle className="h-4 w-4" />
            Emergency
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const colors = getColorClasses(stat.color, stat.highlight);
          return (
            <Card 
              key={stat.title}
              className={`group cursor-pointer transition-all duration-200 hover:shadow-lg border-border/60 ${
                stat.highlight ? 'border-destructive/40 shadow-destructive/5' : 'hover:border-primary/30'
              }`}
              onClick={stat.onClick}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    {statsLoading ? (
                      <Skeleton className="h-9 w-16" />
                    ) : (
                      <p className={`text-3xl font-bold tracking-tight ${stat.highlight ? 'text-destructive' : ''}`}>
                        {stat.value}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </div>
                  <div className={`h-11 w-11 rounded-xl ${colors.iconBg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'New Patient', icon: Plus, color: 'primary', onClick: () => navigate('/patients?action=new') },
          { label: 'Scan CareTag', icon: ScanLine, color: 'accent', onClick: () => navigate('/patients?scan=true') },
          { label: 'Prescription', icon: Stethoscope, color: 'success', onClick: () => navigate('/prescriptions?action=new') },
          { label: 'Schedule', icon: Calendar, color: 'warning', onClick: () => navigate('/appointments?action=new') },
        ].map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
            onClick={action.onClick}
          >
            <div className={`h-10 w-10 rounded-xl bg-${action.color}/10 flex items-center justify-center`}>
              <action.icon className={`h-5 w-5 text-${action.color}`} />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Today's Schedule
              </CardTitle>
              <CardDescription>Your upcoming appointments</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/appointments')} 
              className="gap-1.5 text-primary hover:text-primary hover:bg-primary/5"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointmentsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))
            ) : todayAppointments && todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 5).map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => navigate(`/patients/${apt.patient_id}`)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
                >
                  <Avatar className="h-11 w-11 ring-2 ring-background">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {(apt.patients as any)?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {(apt.patients as any)?.full_name || 'Unknown Patient'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {apt.reason || 'General Consultation'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{format(new Date(apt.scheduled_at), 'h:mm a')}</p>
                      <p className="text-xs text-muted-foreground">{apt.duration_minutes} min</p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`capitalize ${
                        apt.status === 'scheduled' 
                          ? 'bg-primary/10 text-primary' 
                          : apt.status === 'in_progress'
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {apt.status === 'in_progress' ? 'Active' : apt.status}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-14 w-14 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">No appointments scheduled</p>
                <p className="text-xs text-muted-foreground mt-1">Your schedule is clear for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Emergency Alerts */}
          <Card className={`border-border/60 ${emergencies && emergencies.length > 0 ? 'border-destructive/40' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${emergencies && emergencies.length > 0 ? 'text-destructive' : ''}`}>
                <AlertTriangle className={`h-4 w-4 ${emergencies && emergencies.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                Emergencies
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/emergency')} 
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                View all
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {emergenciesLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))
              ) : emergencies && emergencies.length > 0 ? (
                emergencies.slice(0, 3).map((emergency) => (
                  <div
                    key={emergency.id}
                    onClick={() => navigate(`/patients/${emergency.patient_id}`)}
                    className="p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 cursor-pointer transition-colors border border-destructive/10"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {(emergency.patients as any)?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-destructive truncate mt-0.5">{emergency.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="destructive" className="text-[10px] capitalize">
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
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                    <Activity className="h-5 w-5 text-success" />
                  </div>
                  <p className="font-medium text-sm text-success">All Clear</p>
                  <p className="text-xs text-muted-foreground mt-1">No active emergencies</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                Recent Patients
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/patients')} 
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                View all
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {patientsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))
              ) : recentPatients && recentPatients.length > 0 ? (
                recentPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-accent/10 text-accent text-xs font-medium">
                        {patient.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{patient.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient.gender} • {patient.blood_group || 'Unknown'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
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
