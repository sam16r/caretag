import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Building2, MapPin, Phone, Mail, Edit, CheckCircle, XCircle } from 'lucide-react';

export function ClinicManagement() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    is_active: true
  });

  const { data: clinics, isLoading } = useQuery({
    queryKey: ['clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('clinics').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      resetForm();
      toast.success('Clinic added successfully');
    },
    onError: () => toast.error('Failed to add clinic')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('clinics').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      resetForm();
      toast.success('Clinic updated');
    },
    onError: () => toast.error('Failed to update clinic')
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('clinics').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      toast.success('Status updated');
    }
  });

  const resetForm = () => {
    setIsOpen(false);
    setEditingClinic(null);
    setFormData({ name: '', address: '', city: '', state: '', phone: '', email: '', is_active: true });
  };

  const handleEdit = (clinic: any) => {
    setEditingClinic(clinic);
    setFormData({
      name: clinic.name,
      address: clinic.address,
      city: clinic.city,
      state: clinic.state || '',
      phone: clinic.phone || '',
      email: clinic.email || '',
      is_active: clinic.is_active
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (editingClinic) {
      updateMutation.mutate({ id: editingClinic.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const stats = {
    total: clinics?.length || 0,
    active: clinics?.filter(c => c.is_active).length || 0,
    inactive: clinics?.filter(c => !c.is_active).length || 0
  };

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Clinic Locations
          </h2>
          <p className="text-muted-foreground">
            {stats.active} active • {stats.inactive} inactive
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={o => { if (!o) resetForm(); else setIsOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Clinic</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClinic ? 'Edit Clinic' : 'Add New Clinic'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Clinic Name *</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Main Street Clinic" />
              </div>
              <div className="grid gap-2">
                <Label>Address *</Label>
                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>City *</Label>
                  <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>State</Label>
                  <Input value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 234 567 8900" />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_active} onCheckedChange={v => setFormData({ ...formData, is_active: v })} />
                <Label>Active</Label>
              </div>
              <Button onClick={handleSubmit} disabled={!formData.name || !formData.address || !formData.city}>
                {editingClinic ? 'Update' : 'Add Clinic'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {clinics?.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No clinics configured yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clinics?.map(clinic => (
            <Card key={clinic.id} className={!clinic.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{clinic.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={clinic.is_active ? 'default' : 'secondary'}>
                      {clinic.is_active ? (
                        <><CheckCircle className="h-3 w-3 mr-1" />Active</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" />Inactive</>
                      )}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(clinic)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{clinic.address}</p>
                    <p className="text-muted-foreground">{clinic.city}{clinic.state && `, ${clinic.state}`}</p>
                  </div>
                </div>
                {clinic.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{clinic.phone}</span>
                  </div>
                )}
                {clinic.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{clinic.email}</span>
                  </div>
                )}
                <div className="pt-2">
                  <Switch 
                    checked={clinic.is_active} 
                    onCheckedChange={v => toggleActiveMutation.mutate({ id: clinic.id, is_active: v })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
