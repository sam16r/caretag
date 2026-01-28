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
  Sparkles,
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
      gradient: 'from-blue-500 to-indigo-600',
      bgClass: 'stat-card-blue',
      iconBg: 'bg-blue-500',
      onClick: () => navigate('/patients'),
    },
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      change: null,
      icon: Calendar,
      gradient: 'from-violet-500 to-purple-600',
      bgClass: 'stat-card-purple',
      iconBg: 'bg-violet-500',
      onClick: () => navigate('/appointments'),
    },
    {
      title: 'Emergencies',
      value: stats?.activeEmergencies || 0,
      change: null,
      icon: AlertTriangle,
      gradient: 'from-rose-500 to-red-600',
      bgClass: 'stat-card-red',
      iconBg: (stats?.activeEmergencies || 0) > 0 ? 'bg-rose-500' : 'bg-muted',
      highlight: (stats?.activeEmergencies || 0) > 0,
      onClick: () => navigate('/emergency'),
    },
    {
      title: 'Prescriptions',
      value: stats?.activePrescriptions || 0,
      change: '+3',
      icon: FileText,
      gradient: 'from-emerald-500 to-teal-600',
      bgClass: 'stat-card-green',
      iconBg: 'bg-emerald-500',
      onClick: () => navigate('/prescriptions'),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header - Playful */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{getTimeOfDay()}, Doctor</h1>
            <span className="text-3xl animate-wiggle">👋</span>
          </div>
          <p className="text-muted-foreground font-medium">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} • Let's care for your patients today!
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Stats Grid - Colorful Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div 
            key={stat.title}
            className={cn(
              stat.bgClass,
              "animate-slide-up group"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={stat.onClick}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">{stat.title}</p>
                {statsLoading ? (
                  <Skeleton className="h-10 w-16 rounded-xl" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-4xl font-bold",
                      stat.highlight && "text-destructive"
                    )}>
                      {stat.value}
                    </span>
                    {stat.change && (
                      <Badge variant="secondary" className="bg-success/20 text-success border-0">
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                        {stat.change}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className={cn(
                "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:rotate-6 group-hover:scale-110",
                stat.iconBg
              )}>
                <stat.icon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions - Pill Buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: '➕ New Patient', icon: Plus, onClick: () => navigate('/patients?action=new') },
            { label: '📷 Scan CareTag', icon: ScanLine, onClick: () => navigate('/patients?scan=true') },
            { label: '💊 Prescription', icon: Stethoscope, onClick: () => navigate('/prescriptions?action=new') },
            { label: '📅 Schedule', icon: Calendar, onClick: () => navigate('/appointments?action=new') },
          ].map((action, i) => (
            <Button
              key={action.label}
              variant="outline"
              className="rounded-full px-5 py-2 h-auto border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover:-translate-y-1 animate-scale-in"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={action.onClick}
            >
              <span className="font-semibold">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-5 bg-gradient-to-r from-primary/5 to-accent/5">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                Today's Schedule
              </CardTitle>
              <CardDescription className="mt-1">Your upcoming appointments</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/appointments')} 
              className="gap-1 text-primary hover:text-primary rounded-full"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {appointmentsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))
            ) : todayAppointments && todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 5).map((apt, i) => (
                <div
                  key={apt.id}
                  onClick={() => navigate(`/patients/${apt.patient_id}`)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-all duration-300 cursor-pointer hover:-translate-x-1 group animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
                    {(apt.patients as any)?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">
                      {(apt.patients as any)?.full_name || 'Unknown Patient'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {apt.reason || 'General Consultation'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{format(new Date(apt.scheduled_at), 'h:mm a')}</p>
                    <Badge 
                      variant={apt.status === 'in_progress' ? 'success' : 'secondary'}
                      className="capitalize"
                    >
                      {apt.status === 'in_progress' ? '🟢 Active' : apt.status}
                    </Badge>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="h-20 w-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4 animate-float">
                  <Calendar className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <p className="text-lg font-bold">No appointments today</p>
                <p className="text-muted-foreground">Your schedule is clear! 🎉</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Emergencies */}
          <Card className={cn(
            "overflow-hidden",
            emergencies && emergencies.length > 0 && "border-2 border-destructive/30"
          )}>
            <CardHeader className={cn(
              "flex flex-row items-center justify-between py-4",
              emergencies && emergencies.length > 0 ? "bg-gradient-to-r from-destructive/10 to-destructive/5" : "bg-gradient-to-r from-success/10 to-success/5"
            )}>
              <CardTitle className={cn(
                "flex items-center gap-2",
                emergencies && emergencies.length > 0 && "text-destructive"
              )}>
                <div className={cn(
                  "h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg",
                  emergencies && emergencies.length > 0 ? "bg-destructive" : "bg-success"
                )}>
                  {emergencies && emergencies.length > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-white" />
                  ) : (
                    <Heart className="h-5 w-5 text-white" />
                  )}
                </div>
                Emergencies
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/emergency')} 
                className="rounded-full"
              >
                View all
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {emergenciesLoading ? (
                <Skeleton className="h-20 w-full rounded-2xl" />
              ) : emergencies && emergencies.length > 0 ? (
                emergencies.slice(0, 3).map((emergency, i) => (
                  <div
                    key={emergency.id}
                    onClick={() => navigate(`/patients/${emergency.patient_id}`)}
                    className="p-4 rounded-2xl bg-destructive/5 border-2 border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-all duration-300 hover:scale-[1.02] animate-slide-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">
                          {(emergency.patients as any)?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-destructive truncate">{emergency.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="destructive" className="capitalize">
                            🚨 {emergency.severity}
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
                <div className="text-center py-10">
                  <div className="h-16 w-16 rounded-3xl bg-success/10 flex items-center justify-center mx-auto mb-3 animate-float">
                    <Activity className="h-8 w-8 text-success" />
                  </div>
                  <p className="font-bold text-success">All Clear! ✨</p>
                  <p className="text-sm text-muted-foreground">No emergencies</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-gradient-to-r from-accent/10 to-accent/5">
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                Recent Patients
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/patients')} 
                className="rounded-full"
              >
                View all
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {patientsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                ))
              ) : recentPatients && recentPatients.length > 0 ? (
                recentPatients.map((patient, i) => (
                  <div
                    key={patient.id}
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/70 transition-all duration-300 cursor-pointer group hover:-translate-x-1 animate-slide-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform">
                      {patient.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{patient.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient.gender} • {patient.blood_group || 'Unknown'}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
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
