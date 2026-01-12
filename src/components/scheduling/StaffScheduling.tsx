import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Calendar, Clock, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function StaffScheduling() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    doctor_id: user?.id || '',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
    break_start: '',
    break_end: '',
    max_appointments: 20
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['staff-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_schedules')
        .select(`*, profiles:doctor_id (full_name, specialization)`)
        .order('day_of_week');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, specialization')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('staff_schedules').insert({
        ...data,
        break_start: data.break_start || null,
        break_end: data.break_end || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-schedules'] });
      setIsOpen(false);
      setFormData({
        doctor_id: user?.id || '',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        is_available: true,
        break_start: '',
        break_end: '',
        max_appointments: 20
      });
      toast.success('Schedule added successfully');
    },
    onError: () => toast.error('Failed to add schedule')
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const { error } = await supabase
        .from('staff_schedules')
        .update({ is_available })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-schedules'] });
      toast.success('Availability updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff_schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-schedules'] });
      toast.success('Schedule deleted');
    }
  });

  // Group schedules by doctor
  const groupedSchedules = schedules?.reduce((acc, schedule) => {
    const doctorId = schedule.doctor_id;
    if (!acc[doctorId]) {
      acc[doctorId] = {
        doctor: schedule.profiles,
        schedules: []
      };
    }
    acc[doctorId].schedules.push(schedule);
    return acc;
  }, {} as Record<string, { doctor: any; schedules: typeof schedules }>);

  if (isLoading) {
    return <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-4">{[1,2].map(i => <Skeleton key={i} className="h-64" />)}</div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Staff Scheduling
        </h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Schedule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Schedule</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Doctor</Label>
                <Select value={formData.doctor_id} onValueChange={v => setFormData({ ...formData, doctor_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {doctors?.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name} {d.specialization && `(${d.specialization})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Day of Week</Label>
                <Select value={formData.day_of_week.toString()} onValueChange={v => setFormData({ ...formData, day_of_week: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>End Time</Label>
                  <Input type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Break Start (Optional)</Label>
                  <Input type="time" value={formData.break_start} onChange={e => setFormData({ ...formData, break_start: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Break End (Optional)</Label>
                  <Input type="time" value={formData.break_end} onChange={e => setFormData({ ...formData, break_end: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Max Appointments</Label>
                <Input type="number" value={formData.max_appointments} onChange={e => setFormData({ ...formData, max_appointments: parseInt(e.target.value) || 20 })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_available} onCheckedChange={v => setFormData({ ...formData, is_available: v })} />
                <Label>Available</Label>
              </div>
              <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.doctor_id}>
                Add Schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(groupedSchedules || {}).length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No schedules configured</CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(groupedSchedules || {}).map(([doctorId, { doctor, schedules }]) => (
            <Card key={doctorId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {doctor?.full_name}
                  {doctor?.specialization && (
                    <span className="text-sm font-normal text-muted-foreground">({doctor.specialization})</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {schedules.map(schedule => (
                    <div 
                      key={schedule.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${schedule.is_available ? 'bg-green-50 dark:bg-green-950/20 border-green-200' : 'bg-muted border-muted'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${schedule.is_available ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <p className="font-medium">{daysOfWeek[schedule.day_of_week]}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                            {schedule.break_start && schedule.break_end && (
                              <span className="ml-2">(Break: {schedule.break_start.slice(0, 5)} - {schedule.break_end.slice(0, 5)})</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Max: {schedule.max_appointments}</span>
                        <Switch 
                          checked={schedule.is_available} 
                          onCheckedChange={v => toggleAvailabilityMutation.mutate({ id: schedule.id, is_available: v })}
                        />
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(schedule.id)}>×</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
