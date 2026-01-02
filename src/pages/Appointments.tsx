import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, User, Plus, Check, X, AlertCircle } from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

export default function Appointments() {
  const navigate = useNavigate();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (id, full_name, caretag_id)
        `)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-success text-success-foreground">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-success border-success/40"><Check className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-muted-foreground"><X className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'no_show':
        return <Badge variant="outline" className="text-warning border-warning/40"><AlertCircle className="h-3 w-3 mr-1" />No Show</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDateLabel = (date: string) => {
    const parsed = parseISO(date);
    if (isToday(parsed)) return 'Today';
    if (isTomorrow(parsed)) return 'Tomorrow';
    if (isYesterday(parsed)) return 'Yesterday';
    return format(parsed, 'MMM d, yyyy');
  };

  const groupedAppointments = appointments?.reduce((acc, apt) => {
    const dateKey = format(parseISO(apt.scheduled_at), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(apt);
    return acc;
  }, {} as Record<string, typeof appointments>);

  const todayAppointments = appointments?.filter(apt => isToday(parseISO(apt.scheduled_at)));
  const stats = {
    total: appointments?.length || 0,
    scheduled: appointments?.filter(a => a.status === 'scheduled').length || 0,
    completed: appointments?.filter(a => a.status === 'completed').length || 0,
    inProgress: appointments?.filter(a => a.status === 'in_progress').length || 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">{todayAppointments?.length || 0} appointments today</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/25">
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-elevated">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Scheduled</p>
            <p className="text-2xl font-bold text-primary">{stats.scheduled}</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-accent">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-success">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : groupedAppointments && Object.keys(groupedAppointments).length > 0 ? (
        Object.entries(groupedAppointments)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([dateKey, dayAppointments]) => (
            <Card key={dateKey} className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-4.5 w-4.5 text-primary" />
                  </div>
                  {getDateLabel(dateKey + 'T00:00:00')}
                  <Badge variant="secondary" className="ml-2">{dayAppointments?.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dayAppointments?.map((apt, index) => (
                  <div
                    key={apt.id}
                    onClick={() => navigate(`/patients/${apt.patient_id}`)}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/70 cursor-pointer transition-all duration-200 hover:shadow-sm animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{(apt.patients as any)?.full_name || 'Unknown Patient'}</p>
                        <p className="text-sm text-muted-foreground">{apt.reason || 'General Consultation'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {format(parseISO(apt.scheduled_at), 'h:mm a')}
                        </p>
                        <p className="text-sm text-muted-foreground">{apt.duration_minutes} min</p>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
      ) : (
        <Card className="card-elevated">
          <CardContent className="py-16 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No appointments</h3>
            <p className="text-muted-foreground mt-1">Schedule your first appointment</p>
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              New Appointment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
