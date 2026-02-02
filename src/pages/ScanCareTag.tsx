import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, CheckCircle2, User, UserPlus, X, Keyboard, Search, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccessSession } from '@/hooks/useAccessSession';

type ScanState = 'scanning' | 'manual' | 'detected' | 'loading' | 'creating' | 'session' | 'redirecting';

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

// Play a subtle success sound using Web Audio API
const playDetectionSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create two oscillators for a pleasant two-tone "ding"
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant frequencies (C5 and E5 - major third)
    oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime);
    
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    
    // Quick fade in and out for a soft sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.3);
    oscillator2.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log('Audio not supported');
  }
};

// Trigger haptic feedback if available
const triggerHapticFeedback = () => {
  try {
    if ('vibrate' in navigator) {
      // Short double vibration pattern
      navigator.vibrate([50, 30, 50]);
    }
  } catch (e) {
    console.log('Haptic feedback not supported');
  }
};

export default function ScanCareTag() {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [patient, setPatient] = useState<{ id: string; full_name: string; caretag_id: string; blood_group?: string | null } | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [manualId, setManualId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const simulationCancelledRef = useRef(false);
  const { startSession } = useAccessSession();

  // Helper to start session before navigating
  const startSessionAndNavigate = async (patientId: string) => {
    try {
      setScanState('session');
      await startSession(patientId);
      toast.success('Access session started');
      await new Promise(resolve => setTimeout(resolve, 600));
      setScanState('redirecting');
      await new Promise(resolve => setTimeout(resolve, 400));
      navigate(`/patients/${patientId}`);
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start access session');
      navigate(`/patients/${patientId}`);
    }
  };
  // Cancel simulation when switching to manual mode
  const switchToManual = useCallback(() => {
    simulationCancelledRef.current = true;
    setScanState('manual');
  }, []);

  // Resume scanning mode
  const switchToScanning = useCallback(() => {
    simulationCancelledRef.current = false;
    setScanState('scanning');
  }, []);

  const onTagDetected = useCallback(() => {
    playDetectionSound();
    triggerHapticFeedback();
  }, []);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;

    setIsSearching(true);
    try {
      // Search for existing patient
      const { data: existingPatient, error } = await supabase
        .from('patients')
        .select('id, full_name, caretag_id, blood_group')
        .eq('caretag_id', manualId.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      onTagDetected();
      setScanState('detected');
      await new Promise(resolve => setTimeout(resolve, 600));

      if (existingPatient) {
        setPatient(existingPatient);
        setIsNewPatient(false);
        setScanState('loading');
        toast.success('Patient found!');
        await new Promise(resolve => setTimeout(resolve, 800));
        await startSessionAndNavigate(existingPatient.id);
      } else {
        // Create new patient
        setScanState('creating');
        setIsNewPatient(true);
        const newPatientData = generateRandomPatient();
        newPatientData.caretag_id = manualId.trim().toUpperCase();
        
        const { data: newPatient, error: insertError } = await supabase
          .from('patients')
          .insert(newPatientData)
          .select('id, full_name, caretag_id, blood_group')
          .single();

        if (insertError) throw insertError;

        setPatient(newPatient);
        toast.success('New patient registered!');
        setScanState('loading');
        await new Promise(resolve => setTimeout(resolve, 800));
        await startSessionAndNavigate(newPatient.id);
      }
    } catch (err) {
      console.error('Manual search error:', err);
      toast.error('Failed to search for patient');
      setScanState('manual');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const runScanSimulation = async () => {
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Stop if user switched to manual mode
      if (simulationCancelledRef.current) return;
      
      setScanState('detected');
      onTagDetected();
      await new Promise(resolve => setTimeout(resolve, 600));
      
      if (simulationCancelledRef.current) return;
      setScanState('loading');

      try {
        const isNew = Math.random() > 0.3;
        
        if (isNew) {
          if (simulationCancelledRef.current) return;
          setScanState('creating');
          setIsNewPatient(true);
          
          const newPatientData = generateRandomPatient();
          const { data: newPatient, error: insertError } = await supabase
            .from('patients')
            .insert(newPatientData)
            .select('id, full_name, caretag_id, blood_group')
            .single();
          
          if (insertError) throw insertError;
          if (simulationCancelledRef.current) return;
          
          setPatient(newPatient);
          toast.success('New patient registered!');
          
          await new Promise(resolve => setTimeout(resolve, 800));
          if (simulationCancelledRef.current) return;
          await startSessionAndNavigate(newPatient.id);
        } else {
          const { data, error } = await supabase
            .from('patients')
            .select('id, full_name, caretag_id, blood_group')
            .limit(10);

          if (error) throw error;
          if (simulationCancelledRef.current) return;

          if (data && data.length > 0) {
            const randomPatient = data[Math.floor(Math.random() * data.length)];
            setPatient(randomPatient);
            toast.success('Patient found!');
            
            await new Promise(resolve => setTimeout(resolve, 800));
            if (simulationCancelledRef.current) return;
            await startSessionAndNavigate(randomPatient.id);
          } else {
            if (simulationCancelledRef.current) return;
            setScanState('creating');
            setIsNewPatient(true);
            
            const newPatientData = generateRandomPatient();
            const { data: newPatient, error: insertError } = await supabase
              .from('patients')
              .insert(newPatientData)
              .select('id, full_name, caretag_id, blood_group')
              .single();
            
            if (insertError) throw insertError;
            if (simulationCancelledRef.current) return;
            
            setPatient(newPatient);
            toast.success('New patient registered!');
            
            await new Promise(resolve => setTimeout(resolve, 800));
            if (simulationCancelledRef.current) return;
            await startSessionAndNavigate(newPatient.id);
          }
        }
      } catch (err) {
        console.error('Scan error:', err);
        if (!simulationCancelledRef.current) {
          toast.error('Failed to process CareTag');
          navigate(-1);
        }
      }
    };

    // Only run simulation when in scanning mode
    if (scanState === 'scanning') {
      runScanSimulation();
    }
  }, [navigate, scanState, onTagDetected]);

  const isActive = scanState === 'scanning';
  const isSuccess = scanState === 'detected' || scanState === 'loading' || scanState === 'redirecting' || scanState === 'session';
  const isCreating = scanState === 'creating';
  const isStartingSession = scanState === 'session';

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      {/* Close button */}
      {(scanState === 'scanning' || scanState === 'manual') && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-6 right-6 h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      <div className="flex flex-col items-center gap-8 px-6 max-w-sm w-full">
        {/* Scanner visual */}
        <div className="relative flex items-center justify-center">
          {/* Outer rings - hide in manual mode */}
          {scanState !== 'manual' && (
            <>
              <div className={`absolute w-40 h-40 rounded-full border-2 transition-all duration-500 ${
                isActive ? 'border-primary/30 animate-ping' : isSuccess ? 'border-success/20' : 'border-primary/20'
              }`} style={{ animationDuration: '2s' }} />
              
              <div className={`absolute w-32 h-32 rounded-full border-2 transition-all duration-500 ${
                isActive ? 'border-primary/40 animate-pulse' : isSuccess ? 'border-success/30' : 'border-primary/30'
              }`} />
            </>
          )}

          {/* Center circle */}
          <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            scanState === 'manual' ? 'bg-muted' : isActive ? 'bg-primary/10' : isCreating ? 'bg-primary/10' : isStartingSession ? 'bg-primary/10' : isSuccess ? 'bg-success/10' : 'bg-muted'
          }`}>
            {scanState === 'manual' && (
              <Keyboard className="h-10 w-10 text-muted-foreground" />
            )}
            {isActive && (
              <Wifi className="h-10 w-10 text-primary animate-pulse" />
            )}
            {isCreating && (
              <UserPlus className="h-10 w-10 text-primary" />
            )}
            {isStartingSession && (
              <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
            )}
            {isSuccess && !isCreating && !isStartingSession && (
              <CheckCircle2 className="h-10 w-10 text-success" />
            )}
          </div>
        </div>

        {/* Status content */}
        <div className="text-center space-y-3">
          {scanState === 'scanning' && (
            <>
              <h1 className="text-lg font-semibold text-foreground">
                Ready to Scan
              </h1>
              <p className="text-sm text-muted-foreground">
                Hold the CareTag near the device
              </p>
              <div className="flex items-center justify-center gap-1 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={switchToManual}
                className="mt-4 text-muted-foreground"
              >
                <Keyboard className="h-4 w-4 mr-2" />
                Enter ID manually
              </Button>
            </>
          )}

          {scanState === 'manual' && (
            <div className="w-full max-w-xs space-y-4">
              <div className="text-center">
                <h1 className="text-lg font-semibold text-foreground">
                  Manual Entry
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter the CareTag ID printed on the tag
                </p>
              </div>
              <form onSubmit={handleManualSearch} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="caretag-id" className="text-sm">CareTag ID</Label>
                  <Input
                    id="caretag-id"
                    placeholder="e.g., CT-2026-1234"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value.toUpperCase())}
                    className="text-center font-mono"
                    autoFocus
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gap-2" 
                  disabled={!manualId.trim() || isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {isSearching ? 'Searching...' : 'Search Patient'}
                </Button>
              </form>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={switchToScanning}
                className="w-full text-muted-foreground"
              >
                Back to scanning
              </Button>
            </div>
          )}

          {scanState === 'detected' && (
            <h1 className="text-lg font-semibold text-success">
              Tag Detected
            </h1>
          )}

          {scanState === 'creating' && (
            <>
              <h1 className="text-lg font-semibold text-foreground">
                Registering Patient
              </h1>
              <p className="text-sm text-muted-foreground">
                Creating new record...
              </p>
            </>
          )}

          {scanState === 'loading' && patient && (
            <div className="space-y-4">
              <h1 className="text-lg font-semibold text-success">
                {isNewPatient ? 'Patient Registered' : 'Patient Found'}
              </h1>
              
              <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                isNewPatient 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-success/5 border-success/20'
              }`}>
                <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${
                  isNewPatient ? 'bg-primary/10' : 'bg-success/10'
                }`}>
                  {isNewPatient ? (
                    <UserPlus className="h-5 w-5 text-primary" />
                  ) : (
                    <User className="h-5 w-5 text-success" />
                  )}
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{patient.full_name}</p>
                    {isNewPatient && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {patient.caretag_id}
                    {patient.blood_group && <span className="ml-1.5">• {patient.blood_group}</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

          {scanState === 'redirecting' && (
            <>
              <h1 className="text-lg font-semibold text-foreground">
                Opening Record
              </h1>
              <div className="w-32 h-1 bg-muted rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-primary rounded-full animate-pulse w-full" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
