import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, Wifi, CheckCircle2, User, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

type ScanState = 'scanning' | 'detected' | 'loading' | 'creating' | 'redirecting';

// Generate a unique CareTag ID
const generateCareTagId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `CT-${year}-${randomNum}`;
};

// Generate random patient data for simulation
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

export default function ScanCareTag() {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [patient, setPatient] = useState<{ id: string; full_name: string; caretag_id: string; blood_group?: string | null } | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [pulseRing, setPulseRing] = useState(0);

  // Animate the scanning rings
  useEffect(() => {
    if (scanState === 'scanning') {
      const interval = setInterval(() => {
        setPulseRing(prev => (prev + 1) % 3);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [scanState]);

  useEffect(() => {
    const runScanSimulation = async () => {
      // Wait 5 seconds simulating NFC scan
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setScanState('detected');

      // Brief pause to show "detected" state
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setScanState('loading');

      try {
        // Simulate: 70% chance of new patient, 30% chance of existing patient
        const isNew = Math.random() > 0.3;
        
        if (isNew) {
          // Create a new patient
          setScanState('creating');
          setIsNewPatient(true);
          
          const newPatientData = generateRandomPatient();
          
          const { data: newPatient, error: insertError } = await supabase
            .from('patients')
            .insert(newPatientData)
            .select('id, full_name, caretag_id, blood_group')
            .single();
          
          if (insertError) throw insertError;
          
          setPatient(newPatient);
          toast.success('New patient registered from CareTag!');
          
          // Show created state briefly
          await new Promise(resolve => setTimeout(resolve, 1500));
          setScanState('redirecting');
          
          // Navigate to patient details
          await new Promise(resolve => setTimeout(resolve, 500));
          navigate(`/patients/${newPatient.id}`);
        } else {
          // Fetch an existing patient
          const { data, error } = await supabase
            .from('patients')
            .select('id, full_name, caretag_id, blood_group')
            .limit(10);

          if (error) throw error;

          if (data && data.length > 0) {
            const randomPatient = data[Math.floor(Math.random() * data.length)];
            setPatient(randomPatient);
            
            toast.success('Existing patient found!');
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            setScanState('redirecting');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            navigate(`/patients/${randomPatient.id}`);
          } else {
            // No existing patients, create a new one
            setScanState('creating');
            setIsNewPatient(true);
            
            const newPatientData = generateRandomPatient();
            
            const { data: newPatient, error: insertError } = await supabase
              .from('patients')
              .insert(newPatientData)
              .select('id, full_name, caretag_id, blood_group')
              .single();
            
            if (insertError) throw insertError;
            
            setPatient(newPatient);
            toast.success('New patient registered from CareTag!');
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            setScanState('redirecting');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            navigate(`/patients/${newPatient.id}`);
          }
        }
      } catch (err) {
        console.error('Scan error:', err);
        toast.error('Failed to process CareTag. Please try again.');
        navigate(-1);
      }
    };

    runScanSimulation();
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      {/* Animated scanning waves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {scanState === 'scanning' && (
            <>
              {/* Multiple expanding rings */}
              <div 
                className="absolute w-48 h-48 -ml-24 -mt-24 rounded-full border-2 border-primary/40 animate-ping"
                style={{ animationDuration: '2s' }}
              />
              <div 
                className="absolute w-72 h-72 -ml-36 -mt-36 rounded-full border-2 border-primary/25 animate-ping"
                style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}
              />
              <div 
                className="absolute w-96 h-96 -ml-48 -mt-48 rounded-full border-2 border-primary/15 animate-ping"
                style={{ animationDuration: '3s', animationDelay: '0.6s' }}
              />
              {/* Static rings that pulse */}
              <div className={`absolute w-32 h-32 -ml-16 -mt-16 rounded-full border-2 transition-all duration-300 ${pulseRing === 0 ? 'border-primary scale-110' : 'border-primary/20'}`} />
              <div className={`absolute w-48 h-48 -ml-24 -mt-24 rounded-full border-2 transition-all duration-300 ${pulseRing === 1 ? 'border-primary scale-105' : 'border-primary/15'}`} />
              <div className={`absolute w-64 h-64 -ml-32 -mt-32 rounded-full border-2 transition-all duration-300 ${pulseRing === 2 ? 'border-primary scale-105' : 'border-primary/10'}`} />
            </>
          )}
          {(scanState === 'detected' || scanState === 'loading' || scanState === 'creating' || scanState === 'redirecting') && (
            <div className="absolute w-48 h-48 -ml-24 -mt-24 rounded-full bg-success/20 animate-pulse" />
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4 max-w-sm w-full">
        {/* Icon */}
        <div className={`relative p-6 rounded-full transition-all duration-500 ${
          scanState === 'scanning' 
            ? 'bg-primary/10' 
            : scanState === 'creating'
            ? 'bg-primary/10'
            : 'bg-success/10'
        }`}>
          {scanState === 'scanning' && (
            <>
              <ScanLine className="h-14 w-14 text-primary" />
              <Wifi className="absolute -top-1 -right-1 h-5 w-5 text-primary/70 animate-bounce" />
              {/* NFC waves indicator */}
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                <div className="w-3 h-0.5 bg-primary/60 rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-4 h-0.5 bg-primary/50 rounded animate-pulse" style={{ animationDelay: '100ms' }} />
                <div className="w-5 h-0.5 bg-primary/40 rounded animate-pulse" style={{ animationDelay: '200ms' }} />
              </div>
            </>
          )}
          {scanState === 'detected' && (
            <ScanLine className="h-14 w-14 text-success animate-scale-in" />
          )}
          {scanState === 'creating' && (
            <UserPlus className="h-14 w-14 text-primary animate-pulse" />
          )}
          {(scanState === 'loading' || scanState === 'redirecting') && (
            <CheckCircle2 className="h-14 w-14 text-success" />
          )}
        </div>

        {/* Status text */}
        <div className="text-center space-y-2">
          {scanState === 'scanning' && (
            <>
              <h1 className="text-xl font-bold text-foreground">
                Scanning for CareTag...
              </h1>
              <p className="text-muted-foreground text-sm">
                Ask patient to tap their CareTag card on the NFC reader
              </p>
              {/* Scanning indicator dots */}
              <div className="flex items-center justify-center gap-1.5 pt-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </>
          )}

          {scanState === 'detected' && (
            <>
              <h1 className="text-xl font-bold text-success animate-scale-in">
                CareTag Detected!
              </h1>
              <p className="text-muted-foreground text-sm">
                Reading patient information...
              </p>
            </>
          )}

          {scanState === 'creating' && (
            <>
              <h1 className="text-xl font-bold text-primary">
                New CareTag Found
              </h1>
              <p className="text-muted-foreground text-sm">
                Registering new patient in the system...
              </p>
              <div className="flex items-center justify-center gap-1.5 pt-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </>
          )}

          {scanState === 'loading' && patient && (
            <>
              <h1 className="text-xl font-bold text-success">
                {isNewPatient ? 'Patient Registered!' : 'Patient Found'}
              </h1>
              <Card className={`mt-3 animate-fade-in ${isNewPatient ? 'border-primary/30 bg-primary/5' : 'border-success/30 bg-success/5'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isNewPatient ? 'bg-primary/20' : 'bg-success/20'}`}>
                      {isNewPatient ? (
                        <UserPlus className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-success" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{patient.full_name}</p>
                        {isNewPatient && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">NEW</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {patient.caretag_id} {patient.blood_group && `• ${patient.blood_group}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {isNewPatient && (
                <p className="text-xs text-muted-foreground mt-2">
                  Patient added to database successfully
                </p>
              )}
            </>
          )}

          {scanState === 'redirecting' && (
            <>
              <h1 className="text-xl font-bold text-foreground">
                Opening Patient Details...
              </h1>
              <div className="w-40 h-1 bg-muted rounded-full overflow-hidden mt-3 mx-auto">
                <div className="h-full bg-primary rounded-full animate-[pulse_0.8s_ease-in-out_infinite] w-full" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cancel hint */}
      {scanState === 'scanning' && (
        <button 
          onClick={() => navigate(-1)}
          className="absolute bottom-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Tap to cancel
        </button>
      )}
    </div>
  );
}
