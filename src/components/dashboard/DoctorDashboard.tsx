import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  ArrowUpRight,
  Heart,
  X,
  Loader2,
} from 'lucide-react';
import { useDashboardStats, useRecentPatients, useTodayAppointments, useActiveEmergencies } from '@/hooks/useDashboardData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAccessSession, useActiveSessions } from '@/hooks/useAccessSession';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const SCAN_DURATION = 5;
const DEMO_EXISTING_PATIENT_PROBABILITY = 0.7;

const generateCareTagId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `CT-${year}-${randomNum}`;
};

const generateRandomPatient = () => {
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Skyler', 'Cameron'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const birthYear = 1950 + Math.floor(Math.random() * 60);
  const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  
  return {
    full_name: `${firstName} ${lastName}`,
    caretag_id: generateCareTagId(),
    date_of_birth: `${birthYear}-${birthMonth}-${birthDay}`,
    gender: genders[Math.floor(Math.random() * genders.length)],
    blood_group: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
    phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
  };
};

export function DoctorDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentPatients, isLoading: patientsLoading } = useRecentPatients(4);
  const { data: todayAppointments, isLoading: appointmentsLoading } = useTodayAppointments();
  const { data: emergencies, isLoading: emergenciesLoading } = useActiveEmergencies();
  const { startSession } = useAccessSession();
  const { data: activeSessions } = useActiveSessions();
  
  // Check if there's already an active session
  const currentActiveSession = activeSessions?.[0];
  const hasActiveSession = !!currentActiveSession;
  
  // Demo scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanTimer, setScanTimer] = useState(SCAN_DURATION);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'processing' | 'success'>('idle');
  const [showActiveSessionDialog, setShowActiveSessionDialog] = useState(false);

  // Timer effect for demo scan
  useEffect(() => {
    if (!isScanning || scanStatus !== 'scanning') return;

    if (scanTimer > 0) {
      const timer = setTimeout(() => {
        setScanTimer(prev => prev - 1);
        setScanProgress(prev => Math.min(prev + (100 / SCAN_DURATION), 100));
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Timer complete - run demo scan
      handleDemoScanComplete();
    }
  }, [isScanning, scanTimer, scanStatus]);

  const handleScanClick = () => {
    if (hasActiveSession) {
      setShowActiveSessionDialog(true);
      return;
    }
    startDemoScan();
  };

  const startDemoScan = () => {
    setIsScanning(true);
    setScanTimer(SCAN_DURATION);
    setScanProgress(0);
    setScanStatus('scanning');
  };

  const cancelScan = () => {
    setIsScanning(false);
    setScanTimer(SCAN_DURATION);
    setScanProgress(0);
    setScanStatus('idle');
  };

  const handleDemoScanComplete = async () => {
    setScanStatus('processing');
    const shouldFindExisting = Math.random() < DEMO_EXISTING_PATIENT_PROBABILITY;

    try {
      if (shouldFindExisting) {
        const { data: patients, error } = await supabase
          .from('patients')
          .select('id, full_name, caretag_id, blood_group')
          .limit(10);

        if (error) throw error;

        if (patients && patients.length > 0) {
          const randomPatient = patients[Math.floor(Math.random() * patients.length)];
          await startSession(randomPatient.id);
          toast.success(`Session started for ${randomPatient.full_name}`);
          setScanStatus('success');
          setTimeout(() => navigate(`/patients/${randomPatient.id}`), 500);
          return;
        }
      }

      // Create new patient
      const newPatientData = generateRandomPatient();
      const { data: newPatient, error: insertError } = await supabase
        .from('patients')
        .insert(newPatientData)
        .select('id, full_name, caretag_id, blood_group')
        .single();

      if (insertError) throw insertError;

      await startSession(newPatient.id);
      toast.success(`New patient ${newPatient.full_name} registered!`);
      setScanStatus('success');
      setTimeout(() => navigate(`/patients/${newPatient.id}`), 500);

    } catch (err) {
      console.error('Demo scan error:', err);
      toast.error('Scan failed');
      cancelScan();
    }
  };

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
      iconColor: 'text-blue-700',
      iconBg: 'bg-blue-100',
      onClick: () => navigate('/patients'),
    },
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      change: null,
      icon: Calendar,
      iconColor: 'text-violet-700',
      iconBg: 'bg-violet-100',
      onClick: () => navigate('/appointments'),
    },
    {
      title: 'Emergencies',
      value: stats?.activeEmergencies || 0,
      change: null,
      icon: AlertTriangle,
      iconColor: (stats?.activeEmergencies || 0) > 0 ? 'text-red-700' : 'text-slate-400',
      iconBg: (stats?.activeEmergencies || 0) > 0 ? 'bg-red-100' : 'bg-slate-100',
      highlight: (stats?.activeEmergencies || 0) > 0,
      onClick: () => navigate('/emergency'),
    },
    {
      title: 'Prescriptions',
      value: stats?.activePrescriptions || 0,
      change: '+3',
      icon: FileText,
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      onClick: () => navigate('/prescriptions'),
    },
  ];

  // Demo scan overlay
  if (isScanning) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={cancelScan}
          className="absolute top-6 right-6 h-12 w-12 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="flex flex-col items-center gap-8 px-6 max-w-sm w-full">
          {scanStatus === 'scanning' && (
            <>
              <div className="relative flex items-center justify-center">
                <div className="h-28 w-28 rounded-full border-4 border-primary/20 flex items-center justify-center">
                  <span className="text-5xl font-bold text-primary">{scanTimer}</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-28 w-28 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
              </div>
              <div className="w-full max-w-[200px]">
                <Progress value={scanProgress} className="h-2" />
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-lg font-semibold text-foreground">Scanning CareTag...</h1>
                <p className="text-sm text-muted-foreground">Reading patient information</p>
              </div>
              <Button variant="outline" onClick={cancelScan} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </>
          )}

          {scanStatus === 'processing' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              <h1 className="text-lg font-semibold">Processing...</h1>
              <p className="text-sm text-muted-foreground">Starting session</p>
            </div>
          )}

          {scanStatus === 'success' && (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <ScanLine className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-lg font-semibold text-primary">Success!</h1>
              <p className="text-sm text-muted-foreground">Redirecting to patient...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

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
            onClick={handleScanClick} 
            disabled={hasActiveSession}
            className={cn(
              "gap-2",
              !hasActiveSession && "animate-pulse hover:animate-none border-primary/50 shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
            )}
          >
            <ScanLine className="h-4 w-4" />
            {hasActiveSession ? 'Session Active' : 'Scan CareTag'}
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

      {/* Active Session Warning Dialog */}
      <AlertDialog open={showActiveSessionDialog} onOpenChange={setShowActiveSessionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Active Session in Progress
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You already have an active session with{' '}
                <span className="font-semibold text-foreground">
                  {(currentActiveSession?.patients as any)?.full_name || 'a patient'}
                </span>.
              </p>
              <p>
                Please end your current session before scanning a new CareTag.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => navigate(`/patients/${currentActiveSession?.patient_id}`)}
            >
              Go to Current Patient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title}
            className="cursor-pointer hover:shadow-md transition-all hover:border-border/80"
            onClick={stat.onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-14" />
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "text-2xl font-semibold",
                        stat.highlight && "text-red-600"
                      )}>
                        {stat.value}
                      </span>
                      {stat.change && (
                        <span className="text-xs text-emerald-600 font-medium">
                          {stat.change}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  stat.iconBg
                )}>
                  <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'New Patient', icon: Plus, onClick: () => navigate('/patients?action=new'), disabled: false },
            { label: hasActiveSession ? 'Session Active' : 'Scan CareTag', icon: ScanLine, onClick: handleScanClick, disabled: hasActiveSession },
            { label: 'Prescription', icon: Stethoscope, onClick: () => navigate('/prescriptions?action=new'), disabled: false },
            { label: 'Schedule', icon: Calendar, onClick: () => navigate('/appointments?action=new'), disabled: false },
          ].map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              disabled={action.disabled}
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
                <Clock className="h-4 w-4 text-blue-600" />
                Today's Schedule
              </CardTitle>
              <CardDescription>Your upcoming appointments</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/appointments')} 
              className="gap-1"
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
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm">
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
                    <p className="font-medium">{format(new Date(apt.scheduled_at), 'h:mm a')}</p>
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
                  <Heart className="h-4 w-4 text-emerald-600" />
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
                  <Activity className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-medium text-emerald-700">All Clear</p>
                  <p className="text-sm text-muted-foreground">No emergencies</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-violet-600" />
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
                    <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center text-violet-700 font-medium text-sm">
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