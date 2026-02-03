import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Search, ScanLine, Users, ArrowRight, Phone, ShieldAlert, Lock, Loader2 } from 'lucide-react';
import { useActiveSessions, useAccessSession } from '@/hooks/useAccessSession';
import { toast } from 'sonner';

const SCAN_DURATION = 5; // seconds

export default function Patients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: activeSessions } = useActiveSessions();
  
  // Scanning state
  const [scanningPatientId, setScanningPatientId] = useState<string | null>(null);
  const [scanTimer, setScanTimer] = useState(SCAN_DURATION);
  const [scanProgress, setScanProgress] = useState(0);
  const { startSession, isStarting } = useAccessSession(scanningPatientId || undefined);

  // Scan timer effect
  useEffect(() => {
    if (!scanningPatientId) return;

    const interval = setInterval(() => {
      setScanTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
      setScanProgress((prev) => Math.min(prev + (100 / SCAN_DURATION), 100));
    }, 1000);

    return () => clearInterval(interval);
  }, [scanningPatientId]);

  // Handle scan completion
  useEffect(() => {
    if (scanningPatientId && scanTimer === 0) {
      handleScanComplete(scanningPatientId);
    }
  }, [scanTimer, scanningPatientId]);

  const handlePatientCardClick = (patientId: string) => {
    setScanningPatientId(patientId);
    setScanTimer(SCAN_DURATION);
    setScanProgress(0);
  };

  const handleScanComplete = async (patientId: string) => {
    try {
      await startSession(patientId);
      toast.success('Session started successfully');
      navigate(`/patients/${patientId}`);
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start session');
    } finally {
      setScanningPatientId(null);
    }
  };

  // Get only limited patient info - no medical data
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients-limited'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, caretag_id, emergency_contact_name, emergency_contact_phone')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredPatients = patients?.filter(p => {
    const matchesSearch = 
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.caretag_id.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  // Check if patient has active session
  const hasActiveSession = (patientId: string) => {
    return activeSessions?.some(s => s.patient_id === patientId);
  };

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-medium text-amber-900">Secure Access Mode</p>
            <p className="text-sm text-amber-700">
              To access full patient records, scan their CareTag. Patient list shows limited info only for identification purposes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {patients?.length || 0} patients registered • Scan CareTag to access records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2" onClick={() => navigate('/scan')}>
            <ScanLine className="h-4 w-4" />
            Scan CareTag
          </Button>
        </div>
      </div>

      {/* Active Sessions */}
      {activeSessions && activeSessions.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Active Access Sessions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {activeSessions.map((session: any) => (
                <div 
                  key={session.id}
                  onClick={() => navigate(`/patients/${session.patient_id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background border cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-medium text-sm">
                      {session.patients?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{session.patients?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{session.patients?.caretag_id}</p>
                  </div>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name or CareTag ID..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-10"
        />
      </div>

      {/* Results - Limited Info Only */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filteredPatients && filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const isActive = hasActiveSession(patient.id);
            const isScanning = scanningPatientId === patient.id;
            return (
              <Card 
                key={patient.id} 
                className={`transition-all cursor-pointer hover:border-primary/50 hover:shadow-md ${
                  isActive ? 'border-primary/30' : ''
                } ${isScanning ? 'border-primary ring-2 ring-primary/20' : ''}`}
                onClick={() => {
                  if (isScanning) return; // Already scanning this patient
                  if (isActive) {
                    // Already have session, go directly to patient
                    navigate(`/patients/${patient.id}`);
                  } else {
                    // Start inline scan simulation
                    handlePatientCardClick(patient.id);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <span className={`font-medium text-sm ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {patient.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium truncate">{patient.full_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{patient.caretag_id}</p>
                        </div>
                        {isActive ? (
                          <Badge variant="default" className="flex-shrink-0 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      
                      {/* Emergency Contact - Always Visible */}
                      {patient.emergency_contact_name && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span className="truncate">
                            {patient.emergency_contact_name}
                            {patient.emergency_contact_phone && ` (${patient.emergency_contact_phone})`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action hint or Scanning progress */}
                  <div className="mt-2">
                    {isScanning ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-primary flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Scanning CareTag...
                          </span>
                          <span className="font-mono text-primary">{scanTimer}s</span>
                        </div>
                        <Progress value={scanProgress} className="h-1.5" />
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        {isActive ? (
                          <span className="text-xs text-primary flex items-center gap-1">
                            View Records <ArrowRight className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <ScanLine className="h-3 w-3" /> Tap to scan
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No patients found</h3>
            <p className="text-muted-foreground mt-1 max-w-md mx-auto text-sm">
              {search ? 'Try adjusting your search' : 'Scan a CareTag to register new patients'}
            </p>
            <Button className="mt-4 gap-2" onClick={() => navigate('/scan')}>
              <ScanLine className="h-4 w-4" />
              Scan CareTag
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
