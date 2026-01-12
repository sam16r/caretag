import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Pill,
  Activity,
  AlertTriangle,
  FileText,
  Stethoscope,
  Heart,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface MedicalHistoryTimelineProps {
  patientId: string;
}

type TimelineEventType = 'appointment' | 'prescription' | 'vitals' | 'emergency' | 'record';

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  date: Date;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  metadata?: Record<string, any>;
}

const eventIcons: Record<TimelineEventType, React.ReactNode> = {
  appointment: <Calendar className="h-4 w-4" />,
  prescription: <Pill className="h-4 w-4" />,
  vitals: <Heart className="h-4 w-4" />,
  emergency: <AlertTriangle className="h-4 w-4" />,
  record: <FileText className="h-4 w-4" />,
};

const eventColors: Record<TimelineEventType, string> = {
  appointment: 'bg-primary/10 text-primary border-primary/20',
  prescription: 'bg-success/10 text-success border-success/20',
  vitals: 'bg-accent/10 text-accent border-accent/20',
  emergency: 'bg-emergency/10 text-emergency border-emergency/20',
  record: 'bg-warning/10 text-warning border-warning/20',
};

export function MedicalHistoryTimeline({ patientId }: MedicalHistoryTimelineProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Fetch all patient events
  const { data: events, isLoading } = useQuery({
    queryKey: ['patient-timeline', patientId],
    queryFn: async () => {
      const timelineEvents: TimelineEvent[] = [];

      // Fetch appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('scheduled_at', { ascending: false });

      appointments?.forEach((apt) => {
        timelineEvents.push({
          id: `apt-${apt.id}`,
          type: 'appointment',
          title: apt.reason || 'General Consultation',
          description: `Status: ${apt.status} | Duration: ${apt.duration_minutes} mins`,
          date: new Date(apt.scheduled_at),
          status: apt.status,
          metadata: apt,
        });
      });

      // Fetch prescriptions
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      prescriptions?.forEach((rx) => {
        const meds = Array.isArray(rx.medications) ? rx.medications : [];
        timelineEvents.push({
          id: `rx-${rx.id}`,
          type: 'prescription',
          title: rx.diagnosis || 'Prescription',
          description: `${meds.length} medication(s) | Status: ${rx.status}`,
          date: new Date(rx.created_at),
          status: rx.status,
          metadata: rx,
        });
      });

      // Fetch vitals
      const { data: vitals } = await supabase
        .from('vitals')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });

      vitals?.forEach((vital) => {
        const readings = [];
        if (vital.heart_rate) readings.push(`HR: ${vital.heart_rate}`);
        if (vital.blood_pressure_systolic) readings.push(`BP: ${vital.blood_pressure_systolic}/${vital.blood_pressure_diastolic}`);
        if (vital.spo2) readings.push(`SpO2: ${vital.spo2}%`);
        
        timelineEvents.push({
          id: `vital-${vital.id}`,
          type: 'vitals',
          title: 'Vital Signs Recorded',
          description: readings.join(' | ') || 'Vitals recorded',
          date: new Date(vital.recorded_at),
          metadata: vital,
        });
      });

      // Fetch emergencies
      const { data: emergencies } = await supabase
        .from('emergency_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      emergencies?.forEach((em) => {
        timelineEvents.push({
          id: `em-${em.id}`,
          type: 'emergency',
          title: em.description,
          description: em.outcome || 'Emergency event',
          date: new Date(em.created_at),
          severity: em.severity,
          metadata: em,
        });
      });

      // Fetch medical records
      const { data: records } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      records?.forEach((rec) => {
        timelineEvents.push({
          id: `rec-${rec.id}`,
          type: 'record',
          title: rec.record_type,
          description: rec.diagnosis || rec.notes || 'Medical record',
          date: new Date(rec.created_at),
          metadata: rec,
        });
      });

      // Sort by date descending
      return timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
  });

  const displayedEvents = showAll ? events : events?.slice(0, 10);

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Medical History Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          Medical History Timeline
          {events && events.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {events.length} events
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!events || events.length === 0 ? (
          <div className="text-center py-8">
            <Stethoscope className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No medical history found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

              <div className="space-y-4">
                {displayedEvents?.map((event, index) => (
                  <div
                    key={event.id}
                    className="relative pl-12 animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-0 top-2 h-10 w-10 rounded-xl border-2 flex items-center justify-center ${eventColors[event.type]}`}
                    >
                      {eventIcons[event.type]}
                    </div>

                    {/* Event card */}
                    <div
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        expanded === event.id
                          ? 'bg-muted shadow-sm'
                          : 'bg-muted/40 hover:bg-muted/70'
                      }`}
                      onClick={() => setExpanded(expanded === event.id ? null : event.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{event.title}</h4>
                            {event.severity && (
                              <Badge
                                variant={event.severity === 'critical' || event.severity === 'high' ? 'destructive' : 'secondary'}
                                className="text-xs capitalize"
                              >
                                {event.severity}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <p className="text-xs font-medium">{format(event.date, 'MMM d, yyyy')}</p>
                            <p className="text-xs text-muted-foreground">{format(event.date, 'h:mm a')}</p>
                          </div>
                          {expanded === event.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {expanded === event.id && event.metadata && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <pre className="text-xs bg-background p-3 rounded-lg overflow-x-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {events && events.length > 10 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="gap-2"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show All ({events.length - 10} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
