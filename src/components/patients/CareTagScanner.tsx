import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScanLine, Camera, X, User, AlertCircle, Smartphone, Plus, FileText, Pill, Activity, FlaskConical, Timer, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNfcScanner } from '@/hooks/useNfcScanner';
import { useQrScanner } from '@/hooks/useQrScanner';
import { useAccessSession } from '@/hooks/useAccessSession';
import { Progress } from '@/components/ui/progress';

interface CareTagScannerProps {
  onPatientFound?: (patient: any) => void;
  showQuickActions?: boolean;
  /** Probability (0-1) of finding an existing patient during demo scan. Default: 0.7 (70%) */
  existingPatientProbability?: number;
}

export function CareTagScanner({ 
  onPatientFound, 
  showQuickActions = true,
  existingPatientProbability = 0.7 
}: CareTagScannerProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [manualId, setManualId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'idle' | 'nfc' | 'qr' | 'simulated'>('idle');
  const [simulatedTimer, setSimulatedTimer] = useState(5);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showNewPatientPrompt, setShowNewPatientPrompt] = useState(false);
  const [generatedCaretagId, setGeneratedCaretagId] = useState<string | null>(null);
  
  // Access session management
  const { startSession, isStarting, hasActiveSession } = useAccessSession(patient?.id);

  const searchPatient = useCallback(async (caretagId: string) => {
    if (!caretagId.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setPatient(null);

    try {
      const { data, error: queryError } = await supabase
        .from('patients')
        .select('*')
        .eq('caretag_id', caretagId.trim().toUpperCase())
        .maybeSingle();

      if (queryError) throw queryError;

      if (!data) {
        setError(`No patient found with CareTag ID: ${caretagId}`);
        return;
      }

      setPatient(data);
      toast.success(`Found patient: ${data.full_name}`);
      if (onPatientFound) {
        onPatientFound(data);
      }
    } catch (err) {
      console.error('Error searching patient:', err);
      setError('Failed to search for patient. Please try again.');
    } finally {
      setIsSearching(false);
      setScanMode('idle');
    }
  }, [onPatientFound]);

  const {
    isSupported: nfcSupported,
    isScanning: nfcScanning,
    error: nfcError,
    startScan: startNfcScan,
    stopScan: stopNfcScan,
  } = useNfcScanner(searchPatient);

  const {
    isScanning: qrScanning,
    error: qrError,
    startScan: startQrScan,
    stopScan: stopQrScan,
  } = useQrScanner(searchPatient);

  const handleStartNfc = async () => {
    setScanMode('nfc');
    setError(null);
    await startNfcScan();
  };

  const handleStartQr = async () => {
    setScanMode('qr');
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 100));
    await startQrScan('dialog-qr-reader');
  };

  const handleStopScan = async () => {
    if (scanMode === 'nfc') {
      stopNfcScan();
    } else if (scanMode === 'qr') {
      await stopQrScan();
    } else if (scanMode === 'simulated') {
      setIsSimulating(false);
    }
    setScanMode('idle');
    setSimulatedTimer(5);
  };

  // Simulated scan with 5-second timer
  const handleSimulatedScan = async () => {
    setScanMode('simulated');
    setIsSimulating(true);
    setSimulatedTimer(5);
    setError(null);
    setPatient(null);
    setShowNewPatientPrompt(false);
  };

  // Timer effect for simulated scan
  useEffect(() => {
    if (!isSimulating || scanMode !== 'simulated') return;

    if (simulatedTimer > 0) {
      const timer = setTimeout(() => {
        setSimulatedTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Timer finished - decide outcome
      handleSimulatedScanComplete();
    }
  }, [isSimulating, simulatedTimer, scanMode]);

  const handleSimulatedScanComplete = async () => {
    setIsSimulating(false);
    
    // Use configurable probability for existing vs new patient
    const shouldFindExisting = Math.random() < existingPatientProbability;
    
    if (shouldFindExisting) {
      // Fetch a random existing patient
      try {
        const { data: patients, error: queryError } = await supabase
          .from('patients')
          .select('*')
          .limit(10);

        if (queryError) throw queryError;

        if (patients && patients.length > 0) {
          const randomPatient = patients[Math.floor(Math.random() * patients.length)];
          setPatient(randomPatient);
          toast.success(`Found patient: ${randomPatient.full_name}`);
          if (onPatientFound) {
            onPatientFound(randomPatient);
          }
        } else {
          // No patients exist, show new patient prompt
          const newId = `CT-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`;
          setGeneratedCaretagId(newId);
          setShowNewPatientPrompt(true);
        }
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError('Failed to complete scan. Please try again.');
      }
    } else {
      // Show new patient prompt
      const newId = `CT-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`;
      setGeneratedCaretagId(newId);
      setShowNewPatientPrompt(true);
      toast.info('New CareTag detected! Register patient to continue.');
    }
    
    setScanMode('idle');
  };

  const goToNewPatient = () => {
    setOpen(false);
    navigate(`/patients/new?caretag=${generatedCaretagId}`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchPatient(manualId);
  };

  const handleStartSession = async () => {
    if (patient) {
      try {
        await startSession(patient.id);
        toast.success('Access session started');
      } catch (err) {
        console.error('Failed to start session:', err);
      }
    }
  };

  const goToPatient = () => {
    if (patient) {
      setOpen(false);
      navigate(`/patients/${patient.id}`);
    }
  };

  const goToNewPrescription = async () => {
    if (patient) {
      if (!hasActiveSession) {
        await handleStartSession();
      }
      setOpen(false);
      navigate(`/patients/${patient.id}?tab=prescriptions&action=new`);
    }
  };

  const goToAddRecord = async () => {
    if (patient) {
      if (!hasActiveSession) {
        await handleStartSession();
      }
      setOpen(false);
      navigate(`/patients/${patient.id}?tab=history&action=new`);
    }
  };

  const goToLabResults = async () => {
    if (patient) {
      if (!hasActiveSession) {
        await handleStartSession();
      }
      setOpen(false);
      navigate(`/patients/${patient.id}?tab=lab-results`);
    }
  };

  const goToVitals = async () => {
    if (patient) {
      if (!hasActiveSession) {
        await handleStartSession();
      }
      setOpen(false);
      navigate(`/patients/${patient.id}?tab=vitals`);
    }
  };

  useEffect(() => {
    if (!open) {
      stopNfcScan();
      stopQrScan();
      setPatient(null);
      setError(null);
      setManualId('');
      setScanMode('idle');
      setIsSimulating(false);
      setSimulatedTimer(5);
      setShowNewPatientPrompt(false);
      setGeneratedCaretagId(null);
    }
  }, [open, stopNfcScan, stopQrScan]);

  const displayError = error || nfcError || qrError;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ScanLine className="h-4 w-4" />
          Scan CareTag
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            CareTag Scanner
          </DialogTitle>
          <DialogDescription>
            Scan a CareTag QR code or enter the ID manually
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scan options or active scan */}
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
            {scanMode === 'qr' ? (
              <>
                <div id="dialog-qr-reader" className="w-full h-full" />
                {/* Scan overlay corners */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 relative">
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleStopScan}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : scanMode === 'nfc' ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                <div className="relative">
                  <Smartphone className="h-16 w-16 text-primary animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Hold CareTag near device...
                </p>
                <Button variant="outline" onClick={handleStopScan} className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            ) : scanMode === 'simulated' ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full border-4 border-primary/20 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">{simulatedTimer}</span>
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <div className="w-full max-w-[200px]">
                  <Progress value={(5 - simulatedTimer) * 20} className="h-2" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scanning CareTag...
                </p>
                <Button variant="outline" onClick={handleStopScan} className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                <ScanLine className="h-16 w-16 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground text-center">
                  Choose a scanning method
                </p>
                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                  {/* Demo/Simulated Scan - Primary option */}
                  <Button onClick={handleSimulatedScan} className="gap-2 w-full">
                    <Timer className="h-4 w-4" />
                    Demo Scan (5s)
                  </Button>
                  {nfcSupported && (
                    <Button onClick={handleStartNfc} variant="outline" className="gap-2 w-full">
                      <Smartphone className="h-4 w-4" />
                      NFC Scan
                    </Button>
                  )}
                  <Button onClick={handleStartQr} variant="outline" className="gap-2 w-full">
                    <Camera className="h-4 w-4" />
                    QR / Barcode Scan
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Manual entry */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or enter manually
              </span>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              placeholder="Enter CareTag ID (e.g., CT-001)"
              value={manualId}
              onChange={(e) => setManualId(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button type="submit" disabled={!manualId.trim() || isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>

          {/* Error */}
          {displayError && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{displayError}</p>
              </CardContent>
            </Card>
          )}

          {/* Patient found */}
          {patient && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{patient.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.caretag_id} • {patient.gender} • {patient.blood_group || 'Blood group N/A'}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                {showQuickActions && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={goToNewPrescription} 
                        className="gap-2 justify-start"
                        disabled={isStarting}
                      >
                        <Pill className="h-4 w-4 text-primary" />
                        New Prescription
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={goToAddRecord} 
                        className="gap-2 justify-start"
                        disabled={isStarting}
                      >
                        <Plus className="h-4 w-4 text-primary" />
                        Add Record
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={goToLabResults} 
                        className="gap-2 justify-start"
                        disabled={isStarting}
                      >
                        <FlaskConical className="h-4 w-4 text-primary" />
                        Lab Results
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={goToVitals} 
                        className="gap-2 justify-start"
                        disabled={isStarting}
                      >
                        <Activity className="h-4 w-4 text-primary" />
                        Vitals
                      </Button>
                    </div>
                  </div>
                )}

                {/* View Full Profile */}
                <Button onClick={goToPatient} className="w-full gap-2" disabled={isStarting}>
                  <FileText className="h-4 w-4" />
                  {isStarting ? 'Starting Session...' : 'View Full Patient Record'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* New Patient Prompt */}
          {showNewPatientPrompt && !patient && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">New CareTag Detected</p>
                    <p className="text-sm text-muted-foreground">
                      ID: {generatedCaretagId} • Not registered
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  This CareTag is not linked to any patient. Register a new patient to continue.
                </p>
                <Button onClick={goToNewPatient} className="w-full gap-2">
                  <UserPlus className="h-4 w-4" />
                  Register New Patient
                </Button>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Demo mode: {Math.round(existingPatientProbability * 100)}% existing patient, {Math.round((1 - existingPatientProbability) * 100)}% new patient
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
