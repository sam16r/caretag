import { useState, useEffect, useCallback } from 'react';

interface NFCReadResult {
  serialNumber: string;
  records: { type: string; data: string }[];
}

interface UseNfcScannerReturn {
  isSupported: boolean;
  isScanning: boolean;
  error: string | null;
  startScan: () => Promise<void>;
  stopScan: () => void;
  lastRead: NFCReadResult | null;
}

export function useNfcScanner(onRead?: (caretagId: string) => void): UseNfcScannerReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRead, setLastRead] = useState<NFCReadResult | null>(null);
  const [reader, setReader] = useState<any>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    // Check if Web NFC is supported (Chrome on Android only)
    setIsSupported('NDEFReader' in window);
  }, []);

  const startScan = useCallback(async () => {
    if (!isSupported) {
      setError('NFC is not supported on this device/browser');
      return;
    }

    try {
      setError(null);
      setIsScanning(true);

      const controller = new AbortController();
      setAbortController(controller);

      // @ts-ignore - NDEFReader is not in TypeScript types yet
      const ndefReader = new window.NDEFReader();
      setReader(ndefReader);

      await ndefReader.scan({ signal: controller.signal });

      ndefReader.addEventListener('reading', ({ serialNumber, message }: any) => {
        const records = Array.from(message.records).map((record: any) => {
          const decoder = new TextDecoder();
          return {
            type: record.recordType,
            data: decoder.decode(record.data),
          };
        });

        const result: NFCReadResult = { serialNumber, records };
        setLastRead(result);

        // Try to extract CareTag ID from NFC data
        // First check records for a text record containing the ID
        const textRecord = records.find(r => r.type === 'text');
        if (textRecord && textRecord.data) {
          onRead?.(textRecord.data.toUpperCase());
        } else {
          // Use serial number as fallback identifier
          onRead?.(serialNumber.toUpperCase());
        }
      });

      ndefReader.addEventListener('readingerror', () => {
        setError('Failed to read NFC tag');
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Scan was intentionally stopped
        return;
      }
      if (err.name === 'NotAllowedError') {
        setError('NFC permission denied. Please allow NFC access.');
      } else if (err.name === 'NotSupportedError') {
        setError('NFC is not supported on this device');
      } else {
        setError(err.message || 'Failed to start NFC scan');
      }
      setIsScanning(false);
    }
  }, [isSupported, onRead]);

  const stopScan = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setReader(null);
    setIsScanning(false);
  }, [abortController]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  return {
    isSupported,
    isScanning,
    error,
    startScan,
    stopScan,
    lastRead,
  };
}
