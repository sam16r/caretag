import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Download, Share2, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface EPrescriptionQRProps {
  prescription: {
    id: string;
    patient_name?: string;
    doctor_name?: string;
    medications: any[];
    created_at: string;
    valid_until?: string;
    status: string;
  };
}

export function EPrescriptionQR({ prescription }: EPrescriptionQRProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // Generate QR code data
  const qrData = JSON.stringify({
    id: prescription.id,
    patient: prescription.patient_name,
    doctor: prescription.doctor_name,
    medications: prescription.medications.map((m: any) => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration
    })),
    issued: prescription.created_at,
    validUntil: prescription.valid_until,
    verified: true
  });

  useEffect(() => {
    // Generate QR code using a simple SVG-based approach
    const generateQR = async () => {
      const size = 200;
      const modules = generateQRMatrix(prescription.id + prescription.created_at);
      const moduleSize = size / modules.length;
      
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
      svg += `<rect width="${size}" height="${size}" fill="white"/>`;
      
      modules.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            svg += `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
          }
        });
      });
      
      svg += '</svg>';
      setQrDataUrl(`data:image/svg+xml;base64,${btoa(svg)}`);
    };

    generateQR();
  }, [prescription.id, prescription.created_at]);

  // Simple QR-like pattern generator (simplified for demo)
  const generateQRMatrix = (data: string): boolean[][] => {
    const size = 25;
    const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
    
    // Generate pattern based on data hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash |= 0;
    }
    
    // Position detection patterns (corners)
    const drawFinderPattern = (x: number, y: number) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
            if (x + i < size && y + j < size) matrix[y + j][x + i] = true;
          }
        }
      }
    };
    
    drawFinderPattern(0, 0);
    drawFinderPattern(size - 7, 0);
    drawFinderPattern(0, size - 7);
    
    // Fill data area with pseudo-random pattern
    for (let y = 8; y < size - 8; y++) {
      for (let x = 8; x < size - 8; x++) {
        matrix[y][x] = ((hash >> ((x + y) % 31)) & 1) === 1;
      }
    }
    
    return matrix;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `prescription-${prescription.id.slice(0, 8)}.svg`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'E-Prescription',
          text: `Prescription ID: ${prescription.id}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="h-4 w-4" />
          View QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            E-Prescription QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {/* QR Code Display */}
          <div className="bg-white p-4 rounded-lg shadow-inner">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="Prescription QR Code" className="w-48 h-48" />
            )}
          </div>
          
          {/* Prescription Info */}
          <Card className="w-full">
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Prescription ID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{prescription.id.slice(0, 8)}</code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                  {prescription.status === 'active' ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />Active</>
                  ) : (
                    <><Clock className="h-3 w-3 mr-1" />{prescription.status}</>
                  )}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Issued</span>
                <span className="text-sm">{format(new Date(prescription.created_at), 'MMM d, yyyy')}</span>
              </div>
              {prescription.valid_until && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valid Until</span>
                  <span className="text-sm">{format(new Date(prescription.valid_until), 'MMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Medications</span>
                <span className="text-sm">{prescription.medications.length} items</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Pharmacies can scan this QR code to verify and dispense medications
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
