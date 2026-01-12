import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Clock, Bell, CheckCircle, XCircle, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

const timeSlots = [
  'Morning (9AM-12PM)',
  'Afternoon (12PM-3PM)',
  'Late Afternoon (3PM-6PM)',
  'Evening (6PM-8PM)',
  'Any Time'
];

export function AppointmentWaitlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: user?.id || '',
    preferred_date: '',
    preferred_time_slot: '',
    reason: '',
    priority: 0
  });

  const { data: waitlist, isLoading } = useQuery({
    queryKey: ['waitlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointment_waitlist')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select('id, full_name').order('full_name');
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('appointment_waitlist').insert({
        ...data,
        preferred_date: data.preferred_date || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      setIsOpen(false);
      setFormData({ patient_id: '', doctor_id: user?.id || '', preferred_date: '', preferred_time_slot: '', reason: '', priority: 0 });
      toast.success('Added to waitlist');
    },
    onError: () => toast.error('Failed to add to waitlist')
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'notified') {
        updates.notified_at = new Date().toISOString();
      }
      const { error } = await supabase.from('appointment_waitlist').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast.success('Status updated');
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" />Scheduled</Badge>;
      case 'notified': return <Badge className="bg-blue-500 gap-1"><Bell className="h-3 w-3" />Notified</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Cancelled</Badge>;
      default: return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Waiting</Badge>;
    }
  };

  const stats = {
    total: waitlist?.length || 0,
    waiting: waitlist?.filter(w => w.status === 'waiting').length || 0,
    notified: waitlist?.filter(w => w.status === 'notified').length || 0,
    scheduled: waitlist?.filter(w => w.status === 'scheduled').length || 0
  };

  if (isLoading) {
    return <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Waiting</p>
                <p className="text-2xl font-bold">{stats.waiting}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Notified</p>
                <p className="text-2xl font-bold">{stats.notified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waitlist */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Appointment Waitlist</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add to Waitlist</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Waitlist</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Patient</Label>
                  <Select value={formData.patient_id} onValueChange={v => setFormData({ ...formData, patient_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients?.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Preferred Date</Label>
                    <Input type="date" value={formData.preferred_date} onChange={e => setFormData({ ...formData, preferred_date: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Preferred Time</Label>
                    <Select value={formData.preferred_time_slot} onValueChange={v => setFormData({ ...formData, preferred_time_slot: v })}>
                      <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Priority (0-10)</Label>
                  <Input type="number" min="0" max="10" value={formData.priority} onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="grid gap-2">
                  <Label>Reason</Label>
                  <Textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="Why does this patient need an appointment?" />
                </div>
                <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.patient_id}>
                  Add to Waitlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {waitlist?.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No patients on waitlist</p>
          ) : (
            <div className="space-y-3">
              {waitlist?.map((item, index) => {
                const patient = patients?.find(p => p.id === item.patient_id);
                return (
                <Card key={item.id} className={`${item.priority > 5 ? 'border-amber-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{patient?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.preferred_date && format(new Date(item.preferred_date), 'MMM d, yyyy')}
                            {item.preferred_time_slot && ` • ${item.preferred_time_slot}`}
                          </p>
                          {item.reason && <p className="text-sm mt-1">{item.reason}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          {item.priority > 0 && (
                            <Badge variant="outline">Priority: {item.priority}</Badge>
                          )}
                          {getStatusBadge(item.status)}
                        </div>
                        <Select value={item.status} onValueChange={v => updateStatusMutation.mutate({ id: item.id, status: v })}>
                          <SelectTrigger className="h-7 text-xs w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="waiting">Waiting</SelectItem>
                            <SelectItem value="notified">Notified</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
