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
import { Plus, UserCheck, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface ReferralManagementProps {
  patientId?: string;
}

const specialistTypes = [
  'Cardiologist',
  'Dermatologist',
  'Endocrinologist',
  'Gastroenterologist',
  'Neurologist',
  'Oncologist',
  'Ophthalmologist',
  'Orthopedic Surgeon',
  'Psychiatrist',
  'Pulmonologist',
  'Rheumatologist',
  'Urologist',
  'Other'
];

const priorityLevels = [
  { value: 'low', label: 'Low', color: 'bg-gray-500' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-500' },
  { value: 'high', label: 'High', color: 'bg-amber-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-destructive' }
];

const statusOptions = [
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'accepted', label: 'Accepted', icon: CheckCircle },
  { value: 'completed', label: 'Completed', icon: UserCheck },
  { value: 'declined', label: 'Declined', icon: XCircle }
];

export function ReferralManagement({ patientId }: ReferralManagementProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: patientId || '',
    specialist_name: '',
    specialist_type: '',
    reason: '',
    priority: 'normal',
    notes: '',
    appointment_date: ''
  });

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals', patientId],
    queryFn: async () => {
      let query = supabase.from('referrals').select('*').order('created_at', { ascending: false });
      
      if (patientId) {
        query = query.eq('patient_id', patientId);
      }
      
      const { data, error } = await query;
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
    },
    enabled: !patientId
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('referrals').insert({
        patient_id: data.patient_id,
        referring_doctor_id: user?.id,
        specialist_name: data.specialist_name,
        specialist_type: data.specialist_type,
        reason: data.reason,
        priority: data.priority,
        notes: data.notes,
        appointment_date: data.appointment_date || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setIsOpen(false);
      setFormData({ patient_id: patientId || '', specialist_name: '', specialist_type: '', reason: '', priority: 'normal', notes: '', appointment_date: '' });
      toast.success('Referral created successfully');
    },
    onError: () => toast.error('Failed to create referral')
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('referrals').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast.success('Status updated');
    }
  });

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(s => s.value === status);
    const Icon = option?.icon || Clock;
    return (
      <Badge variant={status === 'completed' ? 'default' : status === 'declined' ? 'destructive' : 'secondary'} className="gap-1">
        <Icon className="h-3 w-3" />
        {option?.label || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const level = priorityLevels.find(p => p.value === priority);
    return <Badge className={level?.color}>{level?.label || priority}</Badge>;
  };

  if (isLoading) {
    return <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Referrals
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> New Referral
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Referral</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!patientId && (
                <div className="grid gap-2">
                  <Label>Patient</Label>
                  <Select value={formData.patient_id} onValueChange={v => setFormData({ ...formData, patient_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients?.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Specialist Type</Label>
                  <Select value={formData.specialist_type} onValueChange={v => setFormData({ ...formData, specialist_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {specialistTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Specialist Name</Label>
                <Input value={formData.specialist_name} onChange={e => setFormData({ ...formData, specialist_name: e.target.value })} placeholder="Dr. John Smith" />
              </div>
              <div className="grid gap-2">
                <Label>Reason for Referral</Label>
                <Textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="Describe the reason..." />
              </div>
              <div className="grid gap-2">
                <Label>Appointment Date (Optional)</Label>
                <Input type="datetime-local" value={formData.appointment_date} onChange={e => setFormData({ ...formData, appointment_date: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Additional Notes</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.patient_id || !formData.specialist_type || !formData.specialist_name || !formData.reason}>
                Create Referral
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {referrals?.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No referrals found</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {referrals?.map(referral => {
            const patient = patients?.find(p => p.id === referral.patient_id);
            return (
            <Card key={referral.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{patient?.full_name || 'Unknown'}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{referral.specialist_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{referral.specialist_type}</p>
                    <p className="text-sm">{referral.reason}</p>
                    {referral.appointment_date && (
                      <p className="text-xs text-muted-foreground">
                        Appointment: {format(new Date(referral.appointment_date), 'PPp')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      {getPriorityBadge(referral.priority)}
                      {getStatusBadge(referral.status)}
                    </div>
                    <Select value={referral.status} onValueChange={v => updateStatusMutation.mutate({ id: referral.id, status: v })}>
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
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
    </div>
  );
}
