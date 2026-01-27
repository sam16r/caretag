import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileAudio, Clock, User, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface VoiceNotesHistoryProps {
  patientId: string;
}

interface VoiceNote {
  id: string;
  notes: string | null;
  created_at: string;
  doctor_id: string;
}

export function VoiceNotesHistory({ patientId }: VoiceNotesHistoryProps) {
  const { data: voiceNotes, isLoading } = useQuery({
    queryKey: ['voice-notes', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_records')
        .select('id, notes, created_at, doctor_id')
        .eq('patient_id', patientId)
        .eq('record_type', 'Voice Note')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VoiceNote[];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['current-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileAudio className="h-4 w-4 text-primary" />
            </div>
            Voice Notes History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileAudio className="h-4 w-4 text-primary" />
          </div>
          Voice Notes History
          {voiceNotes && voiceNotes.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {voiceNotes.length} note{voiceNotes.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!voiceNotes || voiceNotes.length === 0 ? (
          <div className="text-center py-8">
            <FileAudio className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No voice notes recorded yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Use the dictation feature above to record clinical notes
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {voiceNotes.map((note, index) => (
                <div
                  key={note.id}
                  className="p-4 rounded-xl border bg-muted/40 hover:bg-muted/70 transition-all animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(note.created_at), 'MMM d, yyyy')}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(note.created_at), 'h:mm a')}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                    </Badge>
                  </div>
                  
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {note.notes || 'No content'}
                  </p>
                  
                  <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Recorded by {profile?.full_name || 'Doctor'}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
