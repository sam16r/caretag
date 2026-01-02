import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pill, Plus, User, FileText, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export default function Prescriptions() {
  const navigate = useNavigate();

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patients:patient_id (id, full_name, caretag_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const stats = {
    total: prescriptions?.length || 0,
    active: prescriptions?.filter(p => p.status === 'active').length || 0,
    completed: prescriptions?.filter(p => p.status === 'completed').length || 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">{stats.active} active prescriptions</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/25">
          <Plus className="h-4 w-4" />
          New Prescription
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="card-elevated">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="card-elevated stat-glow-success">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-success">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-elevated">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Pill className="h-4.5 w-4.5 text-success" />
            </div>
            All Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          ) : prescriptions && prescriptions.length > 0 ? (
            prescriptions.map((rx, index) => {
              const medications = (rx.medications as unknown) as Medication[];
              return (
                <div
                  key={rx.id}
                  onClick={() => navigate(`/patients/${rx.patient_id}`)}
                  className="p-5 rounded-xl bg-muted/40 hover:bg-muted/70 cursor-pointer transition-all duration-200 hover:shadow-sm animate-slide-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-success/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold">{(rx.patients as any)?.full_name || 'Unknown Patient'}</p>
                        <p className="text-sm text-muted-foreground">{rx.diagnosis}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(parseISO(rx.created_at), 'MMM d, yyyy')}
                        </p>
                        {rx.valid_until && (
                          <p className="text-muted-foreground">
                            Valid until {format(parseISO(rx.valid_until), 'MMM d')}
                          </p>
                        )}
                      </div>
                      <Badge variant={rx.status === 'active' ? 'default' : 'secondary'} className={rx.status === 'active' ? 'bg-success' : ''}>
                        {rx.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Medications list */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {medications?.map((med, i) => (
                      <Badge key={i} variant="outline" className="font-normal">
                        <Pill className="h-3 w-3 mr-1.5" />
                        {med.name} {med.dosage}
                      </Badge>
                    ))}
                  </div>

                  {rx.notes && (
                    <p className="text-sm text-muted-foreground mt-3 flex items-start gap-1.5">
                      <FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      {rx.notes}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center">
              <Pill className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No prescriptions</h3>
              <p className="text-muted-foreground mt-1">Create your first prescription</p>
              <Button className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                New Prescription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
