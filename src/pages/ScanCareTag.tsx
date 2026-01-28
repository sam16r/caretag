import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, CheckCircle2, User, UserPlus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type ScanState = 'scanning' | 'detected' | 'loading' | 'creating' | 'redirecting';

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

export default function ScanCareTag() {
  const navigate = useNavigate();
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [patient, setPatient] = useState<{ id: string; full_name: string; caretag_id: string; blood_group?: string | null } | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);

  useEffect(() => {
    const runScanSimulation = async () => {
      await new Promise(resolve => setTimeout(resolve, 4000));
      setScanState('detected');
      await new Promise(resolve => setTimeout(resolve, 600));
      setScanState('loading');

      try {
        const isNew = Math.random() > 0.3;
        
        if (isNew) {
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
          toast.success('New patient registered!');
          
          await new Promise(resolve => setTimeout(resolve, 1200));
          setScanState('redirecting');
          await new Promise(resolve => setTimeout(resolve, 400));
          navigate(`/patients/${newPatient.id}`);
        } else {
          const { data, error } = await supabase
            .from('patients')
            .select('id, full_name, caretag_id, blood_group')
            .limit(10);

          if (error) throw error;

          if (data && data.length > 0) {
            const randomPatient = data[Math.floor(Math.random() * data.length)];
            setPatient(randomPatient);
            toast.success('Patient found!');
            
            await new Promise(resolve => setTimeout(resolve, 1200));
            setScanState('redirecting');
            await new Promise(resolve => setTimeout(resolve, 400));
            navigate(`/patients/${randomPatient.id}`);
          } else {
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
            toast.success('New patient registered!');
            
            await new Promise(resolve => setTimeout(resolve, 1200));
            setScanState('redirecting');
            await new Promise(resolve => setTimeout(resolve, 400));
            navigate(`/patients/${newPatient.id}`);
          }
        }
      } catch (err) {
        console.error('Scan error:', err);
        toast.error('Failed to process CareTag');
        navigate(-1);
      }
    };

    runScanSimulation();
  }, [navigate]);

  const isActive = scanState === 'scanning';
  const isSuccess = scanState === 'detected' || scanState === 'loading' || scanState === 'redirecting';
  const isCreating = scanState === 'creating';

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      {/* Close button */}
      {scanState === 'scanning' && (
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
          {/* Outer rings */}
          <div className={`absolute w-40 h-40 rounded-full border-2 transition-all duration-500 ${
            isActive ? 'border-primary/30 animate-ping' : isSuccess ? 'border-success/20' : 'border-primary/20'
          }`} style={{ animationDuration: '2s' }} />
          
          <div className={`absolute w-32 h-32 rounded-full border-2 transition-all duration-500 ${
            isActive ? 'border-primary/40 animate-pulse' : isSuccess ? 'border-success/30' : 'border-primary/30'
          }`} />

          {/* Center circle */}
          <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            isActive ? 'bg-primary/10' : isCreating ? 'bg-primary/10' : isSuccess ? 'bg-success/10' : 'bg-muted'
          }`}>
            {isActive && (
              <Wifi className="h-10 w-10 text-primary animate-pulse" />
            )}
            {isCreating && (
              <UserPlus className="h-10 w-10 text-primary" />
            )}
            {isSuccess && !isCreating && (
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
            </>
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
