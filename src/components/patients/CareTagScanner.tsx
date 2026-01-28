import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScanLine, Camera, X, User, AlertCircle, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNfcScanner } from '@/hooks/useNfcScanner';
import { useQrScanner } from '@/hooks/useQrScanner';

interface CareTagScannerProps {
  onPatientFound?: (patient: any) => void;
}

export function CareTagScanner({ onPatientFound }: CareTagScannerProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [manualId, setManualId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'idle' | 'nfc' | 'qr'>('idle');

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
    }
    setScanMode('idle');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchPatient(manualId);
  };

  const goToPatient = () => {
    if (patient) {
      setOpen(false);
      navigate(`/patients/${patient.id}`);
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
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
                <ScanLine className="h-16 w-16 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground text-center">
                  Choose a scanning method
                </p>
                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                  {nfcSupported && (
                    <Button onClick={handleStartNfc} variant="outline" className="gap-2 w-full">
                      <Smartphone className="h-4 w-4" />
                      NFC Scan
                    </Button>
                  )}
                  <Button onClick={handleStartQr} className="gap-2 w-full">
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
            <Card className="border-success bg-success/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{patient.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.caretag_id} • {patient.gender} • {patient.blood_group || 'Blood group N/A'}
                    </p>
                  </div>
                </div>
                <Button onClick={goToPatient} className="w-full mt-4 gap-2">
                  <User className="h-4 w-4" />
                  View Patient Profile
                </Button>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Note: Camera-based QR scanning requires a compatible device and browser permissions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
