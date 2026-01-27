import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Heart, AlertTriangle, FileText, Pill, Activity, Calendar, Phone, Mail, MapPin, Clock, Mic, FlaskConical, UserCheck, Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInYears } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AIHealthInsights } from '@/components/patients/AIHealthInsights';
import { Telemedicine } from '@/components/telemedicine/Telemedicine';
import { MedicalHistoryTimeline } from '@/components/patients/MedicalHistoryTimeline';
import { VoiceToText } from '@/components/voice/VoiceToText';
import { LabResultsPanel } from '@/components/lab-results/LabResultsPanel';
import { ReferralManagement } from '@/components/referrals/ReferralManagement';
import { NewPrescriptionForm } from '@/components/prescriptions/NewPrescriptionForm';

export default function PatientDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: medicalRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ['medical-records', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['prescriptions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: vitals, isLoading: vitalsLoading } = useQuery({
    queryKey: ['vitals', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vitals')
        .select('*')
        .eq('patient_id', id)
        .order('recorded_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: emergencyRecords } = useQuery({
    queryKey: ['emergency-records', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_records')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (patientLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!patient) {
    return <div className="text-center py-12 text-muted-foreground">Patient not found</div>;
  }

  const age = differenceInYears(new Date(), new Date(patient.date_of_birth));

  const vitalsChartData = vitals?.map(v => ({
    date: format(new Date(v.recorded_at), 'MMM d'),
    heartRate: v.heart_rate,
    systolic: v.blood_pressure_systolic,
    diastolic: v.blood_pressure_diastolic,
    spo2: v.spo2,
    temperature: v.temperature ? Number(v.temperature) : null,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{patient.full_name}</h1>
            <p className="text-muted-foreground">{patient.caretag_id} • Age {age} • {patient.gender}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NewPrescriptionForm
            preselectedPatientId={id}
            preselectedPatientName={patient.full_name}
            trigger={
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                New Prescription
              </Button>
            }
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['prescriptions', id] })}
          />
          <AIHealthInsights patientId={id!} patientName={patient.full_name} />
          <Telemedicine patientName={patient.full_name} patientId={id} />
          <Badge variant="secondary">{patient.chronic_conditions?.length ? 'Has Conditions' : 'Healthy'}</Badge>
        </div>
      </div>

      {/* Emergency Info Card */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />Emergency Info
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 text-sm">
          <div><span className="text-muted-foreground">Blood:</span> <strong>{patient.blood_group || 'Unknown'}</strong></div>
          <div><span className="text-muted-foreground">Allergies:</span> <strong className={patient.allergies?.length ? 'text-destructive' : ''}>{patient.allergies?.join(', ') || 'None'}</strong></div>
          <div><span className="text-muted-foreground">Conditions:</span> <strong>{patient.chronic_conditions?.join(', ') || 'None'}</strong></div>
          <div><span className="text-muted-foreground">Emergency Contact:</span> <strong>{patient.emergency_contact_name || 'N/A'} {patient.emergency_contact_phone ? `(${patient.emergency_contact_phone})` : ''}</strong></div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="h-auto gap-1 bg-muted/50 p-1.5 flex-wrap">
          <TabsTrigger value="overview" className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Timeline</TabsTrigger>
          <TabsTrigger value="lab-results" className="rounded-full px-4 py-1.5 text-xs font-medium gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><FlaskConical className="h-3 w-3" />Lab Results</TabsTrigger>
          <TabsTrigger value="referrals" className="rounded-full px-4 py-1.5 text-xs font-medium gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><UserCheck className="h-3 w-3" />Referrals</TabsTrigger>
          <TabsTrigger value="history" className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Medical History</TabsTrigger>
          <TabsTrigger value="prescriptions" className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Prescriptions</TabsTrigger>
          <TabsTrigger value="vitals" className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Vitals Timeline</TabsTrigger>
          <TabsTrigger value="notes" className="rounded-full px-4 py-1.5 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Voice Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" /> Contact Info</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" /> {patient.phone || 'No phone'}</p>
                <p className="flex items-center gap-2"><Mail className="h-3 w-3 text-muted-foreground" /> {patient.email || 'No email'}</p>
                <p className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground" /> {patient.address || 'No address'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Pill className="h-4 w-4" /> Current Medications</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                {patient.current_medications?.length ? (
                  patient.current_medications.map((med, i) => <p key={i}>• {med}</p>)
                ) : (
                  <p className="text-muted-foreground">No current medications</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Insurance</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>Provider: {patient.insurance_provider || 'N/A'}</p>
                <p>ID: {patient.insurance_id || 'N/A'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Latest Vitals</CardTitle></CardHeader>
              <CardContent className="text-sm">
                {vitals && vitals.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    <p>HR: <strong>{vitals[vitals.length - 1].heart_rate || '-'} bpm</strong></p>
                    <p>BP: <strong>{vitals[vitals.length - 1].blood_pressure_systolic}/{vitals[vitals.length - 1].blood_pressure_diastolic || '-'}</strong></p>
                    <p>SpO2: <strong>{vitals[vitals.length - 1].spo2 || '-'}%</strong></p>
                    <p>Temp: <strong>{vitals[vitals.length - 1].temperature || '-'}°F</strong></p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No vitals recorded</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab - Visual Medical History */}
        <TabsContent value="timeline" className="mt-4">
          <MedicalHistoryTimeline patientId={id!} />
        </TabsContent>

        {/* Lab Results Tab */}
        <TabsContent value="lab-results" className="mt-4">
          <LabResultsPanel patientId={id!} />
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="mt-4">
          <ReferralManagement patientId={id!} />
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Medical Records</CardTitle></CardHeader>
            <CardContent>
              {recordsLoading ? (
                <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : medicalRecords?.length ? (
                <div className="space-y-4">
                  {medicalRecords.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{record.record_type}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {format(new Date(record.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {record.diagnosis && <p><strong>Diagnosis:</strong> {record.diagnosis}</p>}
                      {record.symptoms?.length > 0 && <p><strong>Symptoms:</strong> {record.symptoms.join(', ')}</p>}
                      {record.notes && <p className="text-sm text-muted-foreground">{record.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No medical records found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5" /> Prescriptions</CardTitle></CardHeader>
            <CardContent>
              {prescriptionsLoading ? (
                <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : prescriptions?.length ? (
                <div className="space-y-4">
                  {prescriptions.map((rx) => {
                    const meds = Array.isArray(rx.medications) ? rx.medications : [];
                    return (
                      <div key={rx.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={rx.status === 'active' ? 'default' : rx.status === 'completed' ? 'secondary' : 'outline'}>
                            {rx.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {format(new Date(rx.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {rx.diagnosis && <p><strong>For:</strong> {rx.diagnosis}</p>}
                        <div className="space-y-1">
                          {meds.map((med: any, i: number) => (
                            <p key={i} className="text-sm bg-muted/50 rounded px-2 py-1">
                              <strong>{med.name}</strong> - {med.dosage}, {med.frequency} {med.duration && `for ${med.duration}`}
                            </p>
                          ))}
                        </div>
                        {rx.notes && <p className="text-sm text-muted-foreground">{rx.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No prescriptions found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vitals Timeline Tab */}
        <TabsContent value="vitals" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Vitals Timeline</CardTitle></CardHeader>
            <CardContent>
              {vitalsLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : vitalsChartData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vitalsChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Legend />
                      <Line type="monotone" dataKey="heartRate" stroke="hsl(var(--destructive))" name="Heart Rate" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="systolic" stroke="hsl(var(--primary))" name="Systolic BP" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="spo2" stroke="hsl(var(--chart-3))" name="SpO2" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
              <p className="text-center py-8 text-muted-foreground">No vitals recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Notes Tab */}
        <TabsContent value="notes" className="mt-4">
          <VoiceToText
            placeholder="Dictate clinical notes for this patient..."
            onTranscriptChange={(text) => console.log('Notes:', text)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
