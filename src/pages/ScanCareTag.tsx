import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, Wifi, CheckCircle2, Camera, Smartphone, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNfcScanner } from '@/hooks/useNfcScanner';
import { useQrScanner } from '@/hooks/useQrScanner';

type ScanState = 'idle' | 'scanning-nfc' | 'scanning-qr' | 'found' | 'redirecting' | 'not-found';
type ScanMode = 'nfc' | 'qr';

export default function ScanCareTag() {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanMode, setScanMode] = useState<ScanMode | null>(null);
  const [patient, setPatient] = useState<{ id: string; full_name: string; caretag_id: string } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchPatient = useCallback(async (caretagId: string) => {
    setScanState('scanning-nfc');
    setSearchError(null);

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, caretag_id')
        .eq('caretag_id', caretagId.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPatient(data);
        setScanState('found');
        toast.success(`Found patient: ${data.full_name}`);

        // Navigate after brief delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setScanState('redirecting');
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate(`/patients/${data.id}`);
      } else {
        setScanState('not-found');
        setSearchError(`No patient found with CareTag ID: ${caretagId}`);
      }
    } catch (err) {
      console.error('Error searching patient:', err);
      setScanState('not-found');
      setSearchError('Failed to search for patient. Please try again.');
    }
  }, [navigate]);

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
    setScanState('scanning-nfc');
    await startNfcScan();
  };

  const handleStartQr = async () => {
    setScanMode('qr');
    setScanState('scanning-qr');
    // Small delay to ensure DOM element exists
    await new Promise(resolve => setTimeout(resolve, 100));
    await startQrScan('qr-reader');
  };

  const handleStop = async () => {
    if (scanMode === 'nfc') {
      stopNfcScan();
    } else {
      await stopQrScan();
    }
    setScanState('idle');
    setScanMode(null);
  };

  const handleRetry = () => {
    setScanState('idle');
    setScanMode(null);
    setSearchError(null);
    setPatient(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopNfcScan();
      stopQrScan();
    };
  }, [stopNfcScan, stopQrScan]);

  const error = nfcError || qrError || searchError;

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      {/* Animated background waves */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {(scanState === 'scanning-nfc' || scanState === 'scanning-qr') && (
            <>
              <div className="absolute w-64 h-64 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute w-80 h-80 -ml-8 -mt-8 rounded-full border-2 border-primary/15 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
              <div className="absolute w-96 h-96 -ml-16 -mt-16 rounded-full border-2 border-primary/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
            </>
          )}
          {scanState === 'found' && (
            <div className="absolute w-64 h-64 rounded-full bg-success/10 animate-pulse" />
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-4">
        {/* Idle state - choose scan method */}
        {scanState === 'idle' && (
          <>
            <div className="p-8 rounded-full bg-primary/10">
              <ScanLine className="h-16 w-16 text-primary" />
            </div>
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold text-foreground">Scan CareTag</h1>
              <p className="text-muted-foreground">Choose a scanning method</p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              {nfcSupported && (
                <Button onClick={handleStartNfc} size="lg" className="gap-2 w-full">
                  <Smartphone className="h-5 w-5" />
                  Scan with NFC
                </Button>
              )}
              <Button 
                onClick={handleStartQr} 
                size="lg" 
                variant={nfcSupported ? 'outline' : 'default'}
                className="gap-2 w-full"
              >
                <Camera className="h-5 w-5" />
                Scan QR Code / Barcode
              </Button>
            </div>
            {!nfcSupported && (
              <p className="text-xs text-muted-foreground text-center">
                NFC scanning requires Chrome on Android device
              </p>
            )}
          </>
        )}

        {/* NFC Scanning */}
        {scanState === 'scanning-nfc' && (
          <>
            <div className="relative p-8 rounded-full bg-primary/10">
              <ScanLine className="h-16 w-16 text-primary animate-pulse" />
              <Wifi className="absolute top-2 right-2 h-6 w-6 text-primary/60 animate-bounce" />
            </div>
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold text-foreground">Scanning for NFC Tag</h1>
              <p className="text-muted-foreground">Hold the CareTag near your device...</p>
              <div className="flex items-center justify-center gap-1 mt-4">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
            <Button variant="outline" onClick={handleStop} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </>
        )}

        {/* QR Scanning */}
        {scanState === 'scanning-qr' && (
          <>
            <div className="w-full aspect-square max-w-xs rounded-2xl overflow-hidden bg-muted relative">
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
            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold text-foreground">Point camera at CareTag</h1>
              <p className="text-sm text-muted-foreground">Position the QR code or barcode in the frame</p>
            </div>
            <Button variant="outline" onClick={handleStop} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </>
        )}

        {/* Found state */}
        {scanState === 'found' && patient && (
          <>
            <div className="p-8 rounded-full bg-success/10">
              <CheckCircle2 className="h-16 w-16 text-success" />
            </div>
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold text-success">CareTag Found!</h1>
              <Card className="border-success/30 bg-success/5">
                <CardContent className="p-4">
                  <p className="font-semibold text-lg">{patient.full_name}</p>
                  <p className="text-sm text-muted-foreground">{patient.caretag_id}</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Redirecting state */}
        {scanState === 'redirecting' && (
          <>
            <div className="p-8 rounded-full bg-success/20">
              <CheckCircle2 className="h-16 w-16 text-success" />
            </div>
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold text-foreground">Opening Patient Details...</h1>
              <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mt-4">
                <div className="h-full bg-primary animate-pulse w-full" />
              </div>
            </div>
          </>
        )}

        {/* Not found / Error state */}
        {scanState === 'not-found' && (
          <>
            <div className="p-8 rounded-full bg-destructive/10">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold text-destructive">Not Found</h1>
              <p className="text-muted-foreground">{error || 'Could not find patient with this CareTag'}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Go Back
              </Button>
              <Button onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </>
        )}

        {/* Error display */}
        {error && scanState !== 'not-found' && (
          <Card className="border-destructive bg-destructive/10 w-full">
            <CardContent className="p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cancel hint */}
      {scanState === 'idle' && (
        <button 
          onClick={() => navigate(-1)}
          className="absolute bottom-12 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Press anywhere to go back
        </button>
      )}
    </div>
  );
}
