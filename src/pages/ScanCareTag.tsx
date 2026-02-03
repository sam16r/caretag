import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, User, UserPlus, X, Keyboard, Search, Loader2, ShieldCheck, Camera, Smartphone, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccessSession } from '@/hooks/useAccessSession';
import { useQrScanner } from '@/hooks/useQrScanner';
import { useNfcScanner } from '@/hooks/useNfcScanner';

type ScanState = 'idle' | 'qr' | 'nfc' | 'manual' | 'detected' | 'loading' | 'creating' | 'session' | 'redirecting';

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
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime);
    
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    
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

const triggerHapticFeedback = () => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  } catch (e) {
    console.log('Haptic feedback not supported');
  }
};

export default function ScanCareTag() {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [patient, setPatient] = useState<{ id: string; full_name: string; caretag_id: string; blood_group?: string | null } | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [manualId, setManualId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [rfidBuffer, setRfidBuffer] = useState('');
  const rfidTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef(false);
  const { startSession } = useAccessSession();

  // Listen for RFID reader keyboard input (most USB RFID readers emulate keyboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if we're in manual mode with input focused or already processing
      if (scanState === 'manual' || processingRef.current) return;
      
      // RFID readers typically send characters quickly followed by Enter
      if (e.key === 'Enter' && rfidBuffer.length > 0) {
        e.preventDefault();
        const scannedId = rfidBuffer.trim();
        setRfidBuffer('');
        if (scannedId) {
          processScannedId(scannedId);
        }
        return;
      }

      // Only accept alphanumeric and dash characters
      if (/^[a-zA-Z0-9\-]$/.test(e.key)) {
        setRfidBuffer(prev => prev + e.key);
        
        // Clear buffer after 100ms of no input (RFID readers are fast)
        if (rfidTimeoutRef.current) {
          clearTimeout(rfidTimeoutRef.current);
        }
        rfidTimeoutRef.current = setTimeout(() => {
          setRfidBuffer('');
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (rfidTimeoutRef.current) {
        clearTimeout(rfidTimeoutRef.current);
      }
    };
  }, [scanState, rfidBuffer]);

  // Process scanned CareTag ID
  const processScannedId = useCallback(async (caretagId: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      playDetectionSound();
      triggerHapticFeedback();
      setScanState('detected');
      await new Promise(resolve => setTimeout(resolve, 600));

      setScanState('loading');

      // Search for existing patient
      const { data: existingPatient, error } = await supabase
        .from('patients')
        .select('id, full_name, caretag_id, blood_group')
        .eq('caretag_id', caretagId.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (existingPatient) {
        setPatient(existingPatient);
        setIsNewPatient(false);
        toast.success('Patient found!');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Start session
        setScanState('session');
        await startSession(existingPatient.id);
        toast.success('Access session started');
        await new Promise(resolve => setTimeout(resolve, 600));
        setScanState('redirecting');
        await new Promise(resolve => setTimeout(resolve, 400));
        navigate(`/patients/${existingPatient.id}`);
      } else {
        // Create new patient
        setScanState('creating');
        setIsNewPatient(true);
        const newPatientData = generateRandomPatient();
        newPatientData.caretag_id = caretagId.trim().toUpperCase();
        
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
        
        // Start session
        setScanState('session');
        await startSession(newPatient.id);
        toast.success('Access session started');
        await new Promise(resolve => setTimeout(resolve, 600));
        setScanState('redirecting');
        await new Promise(resolve => setTimeout(resolve, 400));
        navigate(`/patients/${newPatient.id}`);
      }
    } catch (err) {
      console.error('Scan processing error:', err);
      toast.error('Failed to process CareTag');
      setScanState('idle');
    } finally {
      processingRef.current = false;
    }
  }, [navigate, startSession]);

  // QR Scanner hook
  const {
    isScanning: qrScanning,
    error: qrError,
    startScan: startQrScan,
    stopScan: stopQrScan,
  } = useQrScanner(processScannedId);

  // NFC Scanner hook
  const {
    isSupported: nfcSupported,
    isScanning: nfcScanning,
    error: nfcError,
    startScan: startNfcScan,
    stopScan: stopNfcScan,
  } = useNfcScanner(processScannedId);

  // Start QR scanning
  const handleStartQr = async () => {
    setScanState('qr');
    setScanError(null);
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for element to mount
    await startQrScan('qr-reader');
  };

  // Start NFC scanning
  const handleStartNfc = async () => {
    setScanState('nfc');
    setScanError(null);
    await startNfcScan();
  };

  // Stop any active scan
  const handleStopScan = async () => {
    if (scanState === 'qr') {
      await stopQrScan();
    } else if (scanState === 'nfc') {
      stopNfcScan();
    }
    setScanState('idle');
  };

  // Switch to manual mode
  const switchToManual = () => {
    handleStopScan();
    setScanState('manual');
  };

  // Switch back to idle
  const switchToIdle = () => {
    setScanState('idle');
  };

  // Handle manual search
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    setIsSearching(true);
    await processScannedId(manualId.trim());
    setIsSearching(false);
  };

  // Update error state from scanners
  useEffect(() => {
    setScanError(qrError || nfcError || null);
  }, [qrError, nfcError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopQrScan();
      stopNfcScan();
    };
  }, []);

  const isSuccess = scanState === 'detected' || scanState === 'loading' || scanState === 'redirecting' || scanState === 'session';
  const isCreating = scanState === 'creating';
  const isStartingSession = scanState === 'session';

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      {/* Close button */}
      {(scanState === 'idle' || scanState === 'manual' || scanState === 'qr' || scanState === 'nfc') && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            handleStopScan();
            navigate(-1);
          }}
          className="absolute top-6 right-6 h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      <div className="flex flex-col items-center gap-8 px-6 max-w-sm w-full">
        {/* Idle state - waiting for RFID scan */}
        {scanState === 'idle' && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="absolute w-40 h-40 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute w-32 h-32 rounded-full border-2 border-primary/40 animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h1 className="text-lg font-semibold text-foreground">Ready to Scan</h1>
              <p className="text-sm text-muted-foreground">Tap the RFID CareTag on the reader</p>
              <div className="flex items-center justify-center gap-1 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              {rfidBuffer && (
                <p className="text-xs text-primary font-mono">Reading: {rfidBuffer}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {nfcSupported && (
                <Button onClick={handleStartNfc} variant="outline" className="gap-2 w-full">
                  <Smartphone className="h-4 w-4" />
                  Use Phone NFC
                </Button>
              )}
              <Button onClick={handleStartQr} variant="outline" className="gap-2 w-full">
                <Camera className="h-4 w-4" />
                Scan QR Code
              </Button>
              <Button onClick={switchToManual} variant="ghost" className="gap-2 w-full text-muted-foreground">
                <Keyboard className="h-4 w-4" />
                Enter ID manually
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Using a USB RFID reader? Just tap the card — it will be detected automatically.
            </p>
          </>
        )}

        {/* QR Scanning state */}
        {scanState === 'qr' && (
          <>
            <div className="relative w-full aspect-square max-w-xs rounded-xl overflow-hidden bg-black">
              <div id="qr-reader" className="w-full h-full" />
              {/* Scan overlay corners */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 relative">
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                </div>
              </div>
            </div>
            <div className="text-center space-y-3">
              <h1 className="text-lg font-semibold text-foreground">Scanning QR Code</h1>
              <p className="text-sm text-muted-foreground">Point camera at the CareTag QR code</p>
              <div className="flex items-center justify-center gap-1 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
            <Button variant="outline" onClick={handleStopScan} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </>
        )}

        {/* NFC Scanning state */}
        {scanState === 'nfc' && (
          <>
            <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-10 w-10 text-primary animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
            <div className="text-center space-y-3">
              <h1 className="text-lg font-semibold text-foreground">Ready to Scan NFC</h1>
              <p className="text-sm text-muted-foreground">Hold the CareTag near the device</p>
              <div className="flex items-center justify-center gap-1 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
            <Button variant="outline" onClick={handleStopScan} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </>
        )}

        {/* Manual entry state */}
        {scanState === 'manual' && (
          <div className="w-full max-w-xs space-y-6">
            <div className="relative w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Keyboard className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-foreground">Manual Entry</h1>
              <p className="text-sm text-muted-foreground">Enter the CareTag ID printed on the tag</p>
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
              <Button type="submit" className="w-full gap-2" disabled={!manualId.trim() || isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {isSearching ? 'Searching...' : 'Search Patient'}
              </Button>
            </form>
            <Button variant="ghost" size="sm" onClick={switchToIdle} className="w-full text-muted-foreground">
              Back to scanning options
            </Button>
          </div>
        )}

        {/* Error display */}
        {scanError && (scanState === 'qr' || scanState === 'nfc') && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{scanError}</p>
          </div>
        )}

        {/* Detection success states */}
        {scanState === 'detected' && (
          <>
            <div className="relative w-24 h-24 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-lg font-semibold text-success">Tag Detected</h1>
          </>
        )}

        {scanState === 'creating' && (
          <>
            <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-lg font-semibold text-foreground">Registering Patient</h1>
              <p className="text-sm text-muted-foreground">Creating new record...</p>
            </div>
          </>
        )}

        {scanState === 'session' && (
          <>
            <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-lg font-semibold text-foreground">Starting Session</h1>
              <p className="text-sm text-muted-foreground">Securing access...</p>
            </div>
          </>
        )}

        {scanState === 'loading' && patient && (
          <div className="space-y-4 text-center">
            <div className="relative w-24 h-24 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-lg font-semibold text-success">
              {isNewPatient ? 'Patient Registered' : 'Patient Found'}
            </h1>
            <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
              isNewPatient ? 'bg-primary/5 border-primary/20' : 'bg-success/5 border-success/20'
            }`}>
              <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${
                isNewPatient ? 'bg-primary/10' : 'bg-success/10'
              }`}>
                {isNewPatient ? <UserPlus className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-success" />}
              </div>
              <div className="text-left min-w-0">
                <p className="font-medium text-foreground truncate">{patient.full_name}</p>
                <p className="text-xs text-muted-foreground font-mono">{patient.caretag_id}</p>
              </div>
            </div>
          </div>
        )}

        {scanState === 'redirecting' && (
          <>
            <div className="relative w-24 h-24 rounded-full bg-success/10 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-success animate-spin" />
            </div>
            <h1 className="text-lg font-semibold text-success">Opening Patient Record...</h1>
          </>
        )}
      </div>
    </div>
  );
}
