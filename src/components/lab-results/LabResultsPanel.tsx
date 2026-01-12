import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, TrendingUp, TrendingDown, Minus, FlaskConical, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface LabResultsPanelProps {
  patientId: string;
}

const testCategories = [
  'Blood Chemistry',
  'Hematology',
  'Urinalysis',
  'Lipid Panel',
  'Liver Function',
  'Kidney Function',
  'Thyroid',
  'Cardiac Markers',
  'Other'
];

export function LabResultsPanel({ patientId }: LabResultsPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    test_name: '',
    test_category: '',
    result_value: '',
    result_unit: '',
    reference_min: '',
    reference_max: '',
    notes: ''
  });

  const { data: labResults, isLoading } = useQuery({
    queryKey: ['lab-results', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_results')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const addMutation = useMutation({
    mutationFn: async (newResult: typeof formData) => {
      const { error } = await supabase.from('lab_results').insert({
        patient_id: patientId,
        doctor_id: user?.id,
        test_name: newResult.test_name,
        test_category: newResult.test_category,
        result_value: parseFloat(newResult.result_value) || null,
        result_unit: newResult.result_unit,
        reference_min: parseFloat(newResult.reference_min) || null,
        reference_max: parseFloat(newResult.reference_max) || null,
        notes: newResult.notes,
        status: 'completed',
        tested_at: new Date().toISOString()
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-results', patientId] });
      setIsOpen(false);
      setFormData({ test_name: '', test_category: '', result_value: '', result_unit: '', reference_min: '', reference_max: '', notes: '' });
      toast.success('Lab result added successfully');
    },
    onError: () => toast.error('Failed to add lab result')
  });

  const getResultStatus = (value: number | null, min: number | null, max: number | null) => {
    if (value === null || (min === null && max === null)) return 'normal';
    if (min !== null && value < min) return 'low';
    if (max !== null && value > max) return 'high';
    return 'normal';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'high': return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'low': return <TrendingDown className="h-4 w-4 text-amber-500" />;
      default: return <Minus className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'high': return <Badge variant="destructive">High</Badge>;
      case 'low': return <Badge className="bg-amber-500">Low</Badge>;
      default: return <Badge className="bg-green-500">Normal</Badge>;
    }
  };

  const groupedResults = labResults?.reduce((acc, result) => {
    if (!acc[result.test_name]) acc[result.test_name] = [];
    acc[result.test_name].push(result);
    return acc;
  }, {} as Record<string, typeof labResults>);

  const selectedTestData = selectedTest && groupedResults?.[selectedTest]
    ? groupedResults[selectedTest].slice().reverse().map(r => ({
        date: format(new Date(r.tested_at || r.created_at), 'MMM d'),
        value: r.result_value,
        min: r.reference_min,
        max: r.reference_max
      }))
    : [];

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
          <FlaskConical className="h-5 w-5" />
          Lab Results
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Result
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Lab Result</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Test Name</Label>
                <Input value={formData.test_name} onChange={e => setFormData({ ...formData, test_name: e.target.value })} placeholder="e.g., Hemoglobin" />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={formData.test_category} onValueChange={v => setFormData({ ...formData, test_category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {testCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Result Value</Label>
                  <Input type="number" value={formData.result_value} onChange={e => setFormData({ ...formData, result_value: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Unit</Label>
                  <Input value={formData.result_unit} onChange={e => setFormData({ ...formData, result_unit: e.target.value })} placeholder="e.g., g/dL" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Reference Min</Label>
                  <Input type="number" value={formData.reference_min} onChange={e => setFormData({ ...formData, reference_min: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Reference Max</Label>
                  <Input type="number" value={formData.reference_max} onChange={e => setFormData({ ...formData, reference_max: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <Button onClick={() => addMutation.mutate(formData)} disabled={!formData.test_name || !formData.test_category}>
                Add Result
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {labResults?.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No lab results recorded</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {/* Trend Chart for Selected Test */}
          {selectedTest && selectedTestData.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{selectedTest} Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedTestData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      {selectedTestData[0]?.min && <ReferenceLine y={selectedTestData[0].min} stroke="orange" strokeDasharray="5 5" label="Min" />}
                      {selectedTestData[0]?.max && <ReferenceLine y={selectedTestData[0].max} stroke="red" strokeDasharray="5 5" label="Max" />}
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Grid */}
          <div className="grid gap-2">
            {Object.entries(groupedResults || {}).map(([testName, results]) => {
              const latest = results[0];
              const status = getResultStatus(latest.result_value, latest.reference_min, latest.reference_max);
              const isAbnormal = status !== 'normal';

              return (
                <Card 
                  key={testName} 
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedTest === testName ? 'ring-2 ring-primary' : ''} ${isAbnormal ? 'border-destructive/50' : ''}`}
                  onClick={() => setSelectedTest(selectedTest === testName ? null : testName)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isAbnormal && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      <div>
                        <p className="font-medium">{testName}</p>
                        <p className="text-sm text-muted-foreground">{latest.test_category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{latest.result_value} {latest.result_unit}</p>
                        <p className="text-xs text-muted-foreground">
                          Ref: {latest.reference_min}-{latest.reference_max} {latest.result_unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        {getStatusBadge(status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
