import { useState, useCallback, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface UseQrScannerReturn {
  isScanning: boolean;
  error: string | null;
  startScan: (elementId: string) => Promise<void>;
  stopScan: () => Promise<void>;
}

export function useQrScanner(onScan?: (result: string) => void): UseQrScannerReturn {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScan = useCallback(async (elementId: string) => {
    try {
      setError(null);

      // Stop any existing scanner
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      }

      const html5QrCode = new Html5Qrcode(elementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Successfully scanned
          onScan?.(decodedText.toUpperCase());
        },
        () => {
          // Ignore scan failures (no QR code in frame)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(err.message || 'Failed to start camera');
      }
      setIsScanning(false);
    }
  }, [onScan]);

  const stopScan = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
    setIsScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          scannerRef.current.stop().catch(console.error);
        }
        scannerRef.current.clear();
      }
    };
  }, []);

  return {
    isScanning,
    error,
    startScan,
    stopScan,
  };
}
