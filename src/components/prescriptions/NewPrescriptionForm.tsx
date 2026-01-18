import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, FileText, Pill, Search, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { format, addMonths } from 'date-fns';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Template {
  id: string;
  name: string;
  diagnosis: string | null;
  medications: Medication[];
  notes: string | null;
  is_favorite: boolean;
}

interface Patient {
  id: string;
  full_name: string;
  caretag_id: string;
}

interface NewPrescriptionFormProps {
  preselectedPatientId?: string;
  preselectedPatientName?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function NewPrescriptionForm({ 
  preselectedPatientId, 
  preselectedPatientName,
  trigger,
  onSuccess 
}: NewPrescriptionFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    preselectedPatientId && preselectedPatientName 
      ? { id: preselectedPatientId, full_name: preselectedPatientName, caretag_id: '' } 
      : null
  );
  const [form, setForm] = useState({
    diagnosis: '',
    notes: '',
    validMonths: 3,
    maxRefills: 0,
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }] as Medication[]
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (preselectedPatientId && preselectedPatientName) {
        setSelectedPatient({ id: preselectedPatientId, full_name: preselectedPatientName, caretag_id: '' });
      }
    } else {
      // Reset form when closing
      setForm({
        diagnosis: '',
        notes: '',
        validMonths: 3,
        maxRefills: 0,
        medications: [{ name: '', dosage: '', frequency: '', duration: '' }]
      });
      if (!preselectedPatientId) {
        setSelectedPatient(null);
        setPatientSearch('');
      }
    }
  }, [open, preselectedPatientId, preselectedPatientName]);

  // Fetch patients for search
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('id, full_name, caretag_id')
        .order('full_name')
        .limit(10);
      
      if (patientSearch) {
        query = query.or(`full_name.ilike.%${patientSearch}%,caretag_id.ilike.%${patientSearch}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Patient[];
    },
    enabled: open && !selectedPatient
  });

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['prescription-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescription_templates')
        .select('*')
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(t => ({
        ...t,
        medications: (t.medications as unknown) as Medication[]
      })) as Template[];
    },
    enabled: open && !!user
  });

  // Create prescription mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedPatient) throw new Error('Missing required data');
      
      const validUntil = addMonths(new Date(), form.validMonths);
      const medicationsJson = JSON.parse(JSON.stringify(form.medications.filter(m => m.name)));
      
      const { error } = await supabase.from('prescriptions').insert([{
        patient_id: selectedPatient.id,
        doctor_id: user.id,
        diagnosis: form.diagnosis || null,
        medications: medicationsJson,
        notes: form.notes || null,
        valid_until: format(validUntil, 'yyyy-MM-dd'),
        max_refills: form.maxRefills,
        status: 'active'
      }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast.success('Prescription created successfully');
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Error creating prescription:', error);
      toast.error('Failed to create prescription');
    }
  });

  const applyTemplate = (template: Template) => {
    setForm({
      ...form,
      diagnosis: template.diagnosis || '',
      notes: template.notes || '',
      medications: template.medications.length > 0 
        ? template.medications 
        : [{ name: '', dosage: '', frequency: '', duration: '' }]
    });
    toast.success(`Applied template: ${template.name}`);
  };

  const addMedication = () => {
    setForm({
      ...form,
      medications: [...form.medications, { name: '', dosage: '', frequency: '', duration: '' }]
    });
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const meds = [...form.medications];
    meds[index] = { ...meds[index], [field]: value };
    setForm({ ...form, medications: meds });
  };

  const removeMedication = (index: number) => {
    if (form.medications.length > 1) {
      setForm({
        ...form,
        medications: form.medications.filter((_, i) => i !== index)
      });
    }
  };

  const canSubmit = selectedPatient && form.medications.some(m => m.name);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 shadow-lg shadow-primary/25">
            <Plus className="h-4 w-4" />
            New Prescription
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Create New Prescription
          </DialogTitle>
          <DialogDescription>
            Fill in the prescription details or use a template to get started quickly
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Patient Selection */}
            <div>
              <Label className="text-base font-semibold">Patient *</Label>
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg mt-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{selectedPatient.full_name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{selectedPatient.full_name}</p>
                      {selectedPatient.caretag_id && (
                        <p className="text-sm text-muted-foreground">{selectedPatient.caretag_id}</p>
                      )}
                    </div>
                  </div>
                  {!preselectedPatientId && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>
                      Change
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patients by name or CareTag ID..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="border rounded-lg max-h-40 overflow-y-auto">
                    {patientsLoading ? (
                      <div className="p-2 space-y-2">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}
                      </div>
                    ) : patients && patients.length > 0 ? (
                      patients.map(p => (
                        <button
                          key={p.id}
                          className="w-full text-left p-3 hover:bg-muted transition-colors flex items-center gap-3"
                          onClick={() => setSelectedPatient(p)}
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">{p.full_name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{p.full_name}</p>
                            <p className="text-xs text-muted-foreground">{p.caretag_id}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="p-3 text-sm text-muted-foreground text-center">
                        {patientSearch ? 'No patients found' : 'Start typing to search'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Diagnosis */}
            <div>
              <Label>Diagnosis</Label>
              <Input
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                placeholder="e.g., Upper respiratory infection"
                className="mt-1"
              />
            </div>

            {/* Medications */}
            <div>
              <Label className="text-base font-semibold">Medications *</Label>
              <div className="space-y-3 mt-2">
                {form.medications.map((med, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-end">
                    <div>
                      {i === 0 && <Label className="text-xs text-muted-foreground">Drug Name</Label>}
                      <Input
                        placeholder="Medication"
                        value={med.name}
                        onChange={(e) => updateMedication(i, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      {i === 0 && <Label className="text-xs text-muted-foreground">Dosage</Label>}
                      <Input
                        placeholder="500mg"
                        value={med.dosage}
                        onChange={(e) => updateMedication(i, 'dosage', e.target.value)}
                      />
                    </div>
                    <div>
                      {i === 0 && <Label className="text-xs text-muted-foreground">Frequency</Label>}
                      <Input
                        placeholder="Twice daily"
                        value={med.frequency}
                        onChange={(e) => updateMedication(i, 'frequency', e.target.value)}
                      />
                    </div>
                    <div>
                      {i === 0 && <Label className="text-xs text-muted-foreground">Duration</Label>}
                      <Input
                        placeholder="7 days"
                        value={med.duration}
                        onChange={(e) => updateMedication(i, 'duration', e.target.value)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMedication(i)}
                      disabled={form.medications.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addMedication} className="gap-1">
                  <Plus className="h-3 w-3" /> Add Medication
                </Button>
              </div>
            </div>

            {/* Validity & Refills */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valid For</Label>
                <Select
                  value={String(form.validMonths)}
                  onValueChange={(v) => setForm({ ...form, validMonths: parseInt(v) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 month</SelectItem>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Max Refills</Label>
                <Select
                  value={String(form.maxRefills)}
                  onValueChange={(v) => setForm({ ...form, maxRefills: parseInt(v) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No refills</SelectItem>
                    <SelectItem value="1">1 refill</SelectItem>
                    <SelectItem value="2">2 refills</SelectItem>
                    <SelectItem value="3">3 refills</SelectItem>
                    <SelectItem value="5">5 refills</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes / Instructions</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional instructions for the patient..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createMutation.mutate()} 
                disabled={!canSubmit || createMutation.isPending}
                className="gap-2"
              >
                <Pill className="h-4 w-4" />
                {createMutation.isPending ? 'Creating...' : 'Create Prescription'}
              </Button>
            </div>
          </div>

          {/* Templates Sidebar */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Quick Templates
            </Label>
            <p className="text-sm text-muted-foreground">
              Click a template to auto-fill the prescription
            </p>
            
            {templatesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {templates.map(template => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => applyTemplate(template)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        {template.is_favorite && (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      {template.diagnosis && (
                        <p className="text-xs text-muted-foreground mb-2">{template.diagnosis}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {template.medications.slice(0, 2).map((med, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {med.name}
                          </Badge>
                        ))}
                        {template.medications.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.medications.length - 2}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No templates yet</p>
                  <p className="text-xs mt-1">Create templates from the Prescriptions page</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
