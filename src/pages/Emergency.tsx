import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ScanLine, User, Activity, Clock, Heart, Droplets, CheckCircle } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

interface VitalsSnapshot {
  heart_rate?: number;
  blood_pressure?: string;
  spo2?: number;
  temperature?: number;
  blood_glucose?: number;
  respiratory_rate?: number;
}

export default function Emergency() {
  const navigate = useNavigate();

  const { data: emergencies, isLoading } = useQuery({
    queryKey: ['emergencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_records')
        .select(`
          *,
          patients:patient_id (id, full_name, caretag_id, blood_group, allergies, chronic_conditions)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const activeEmergencies = emergencies?.filter(e => !e.resolved_at);
  const resolvedEmergencies = emergencies?.filter(e => e.resolved_at);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-emergency text-emergency-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-primary text-primary-foreground';
      case 'low': return 'bg-success text-success-foreground';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emergency flex items-center gap-3">
            <AlertTriangle className="h-8 w-8" />
            Emergency Mode
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeEmergencies?.length || 0} active emergencies
          </p>
        </div>
        <Button variant="destructive" className="gap-2 shadow-lg shadow-emergency/25">
          <ScanLine className="h-4 w-4" />
          Scan Patient CareTag
        </Button>
      </div>

      {/* Active Emergencies */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emergency animate-pulse" />
          Active Emergencies
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : activeEmergencies && activeEmergencies.length > 0 ? (
          <div className="space-y-4">
            {activeEmergencies.map((emergency, index) => {
              const vitals = emergency.vitals_snapshot as VitalsSnapshot;
              const patient = emergency.patients as any;

              return (
                <Card
                  key={emergency.id}
                  className="border-emergency/50 bg-emergency/5 cursor-pointer hover:shadow-lg transition-all animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/patients/${emergency.patient_id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-emergency/20 flex items-center justify-center">
                          <User className="h-7 w-7 text-emergency" />
                        </div>
                        <div>
                          <p className="text-xl font-bold">{patient?.full_name || 'Unknown'}</p>
                          <p className="text-muted-foreground font-mono">{patient?.caretag_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDistanceToNow(parseISO(emergency.created_at), { addSuffix: true })}
                        </span>
                        <Badge className={`text-base px-3 py-1 uppercase font-bold ${getSeverityColor(emergency.severity)}`}>
                          {emergency.severity}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emergency/10 border border-emergency/30 mb-4">
                      <p className="text-lg font-semibold text-emergency flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        {emergency.description}
                      </p>
                    </div>

                    {/* Vitals */}
                    {vitals && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {vitals.heart_rate && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Heart Rate</p>
                            <p className="text-lg font-bold flex items-center gap-1">
                              <Heart className="h-4 w-4 text-emergency" />
                              {vitals.heart_rate} bpm
                            </p>
                          </div>
                        )}
                        {vitals.blood_pressure && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Blood Pressure</p>
                            <p className="text-lg font-bold">{vitals.blood_pressure}</p>
                          </div>
                        )}
                        {vitals.spo2 && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">SpO2</p>
                            <p className={`text-lg font-bold ${vitals.spo2 < 92 ? 'text-emergency' : ''}`}>{vitals.spo2}%</p>
                          </div>
                        )}
                        {vitals.blood_glucose && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">Blood Glucose</p>
                            <p className="text-lg font-bold">{vitals.blood_glucose} mg/dL</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Patient Info */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Droplets className="h-4 w-4 text-emergency" />
                        <span className="text-muted-foreground">Blood:</span>
                        <strong>{patient?.blood_group || 'Unknown'}</strong>
                      </div>
                      {patient?.allergies && patient.allergies.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <span className="text-muted-foreground">Allergies:</span>
                          <strong className="text-warning">{patient.allergies.join(', ')}</strong>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="card-elevated border-success/30">
            <CardContent className="py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-success">All Clear</h3>
              <p className="text-muted-foreground mt-1">No active emergency cases</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Resolved Emergencies */}
      {resolvedEmergencies && resolvedEmergencies.length > 0 && (
        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <CheckCircle className="h-4.5 w-4.5 text-muted-foreground" />
              </div>
              Resolved Cases
              <Badge variant="secondary" className="ml-2">{resolvedEmergencies.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolvedEmergencies.slice(0, 5).map((emergency, index) => {
              const patient = emergency.patients as any;
              return (
                <div
                  key={emergency.id}
                  onClick={() => navigate(`/patients/${emergency.patient_id}`)}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/70 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{patient?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{emergency.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={getSeverityColor(emergency.severity).replace('bg-', 'border-').replace('text-', '')}>{emergency.severity}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{emergency.outcome}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
