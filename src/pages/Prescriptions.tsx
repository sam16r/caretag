import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pill, Plus, User, FileText, Calendar, RefreshCw } from 'lucide-react';
import { format, parseISO, isToday, isThisWeek, isThisMonth, subMonths, isAfter } from 'date-fns';
import { PrescriptionPDFExport } from '@/components/prescriptions/PrescriptionPDFExport';
import { DrugInteractionChecker } from '@/components/prescriptions/DrugInteractionChecker';
import { PrescriptionTemplates } from '@/components/prescriptions/PrescriptionTemplates';
import { DosageCalculator } from '@/components/prescriptions/DosageCalculator';
import { PrescriptionFilters, PrescriptionFiltersState } from '@/components/prescriptions/PrescriptionFilters';
import { NewPrescriptionForm } from '@/components/prescriptions/NewPrescriptionForm';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export default function Prescriptions() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<PrescriptionFiltersState>({
    search: '',
    status: 'all',
    dateRange: 'all'
  });

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

  // Apply filters
  const filteredPrescriptions = useMemo(() => {
    if (!prescriptions) return [];

    return prescriptions.filter(rx => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const patientName = ((rx.patients as any)?.full_name || '').toLowerCase();
        const diagnosis = (rx.diagnosis || '').toLowerCase();
        if (!patientName.includes(searchLower) && !diagnosis.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && rx.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const createdAt = parseISO(rx.created_at);
        switch (filters.dateRange) {
          case 'today':
            if (!isToday(createdAt)) return false;
            break;
          case 'week':
            if (!isThisWeek(createdAt)) return false;
            break;
          case 'month':
            if (!isThisMonth(createdAt)) return false;
            break;
          case 'quarter':
            if (!isAfter(createdAt, subMonths(new Date(), 3))) return false;
            break;
        }
      }

      return true;
    });
  }, [prescriptions, filters]);

  const stats = {
    total: prescriptions?.length || 0,
    active: prescriptions?.filter(p => p.status === 'active').length || 0,
    completed: prescriptions?.filter(p => p.status === 'completed').length || 0,
    refillsDue: prescriptions?.filter(p => p.next_refill_reminder && isAfter(new Date(), parseISO(p.next_refill_reminder))).length || 0
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground mt-1">{stats.active} active prescriptions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DrugInteractionChecker />
          <DosageCalculator />
          <PrescriptionTemplates />
          <NewPrescriptionForm />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <Card className="card-elevated stat-glow-warning">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Refills Due</p>
              <p className="text-2xl font-bold text-warning">{stats.refillsDue}</p>
            </div>
            <RefreshCw className="h-5 w-5 text-warning" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <PrescriptionFilters filters={filters} onFiltersChange={setFilters} />

      <Card className="card-elevated">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Pill className="h-4.5 w-4.5 text-success" />
            </div>
            All Prescriptions
            {filteredPrescriptions.length !== prescriptions?.length && (
              <Badge variant="secondary" className="ml-2">
                {filteredPrescriptions.length} of {prescriptions?.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          ) : filteredPrescriptions.length > 0 ? (
            filteredPrescriptions.map((rx, index) => {
              const medications = (rx.medications as unknown) as Medication[];
              const patient = rx.patients as any;
              return (
                <div
                  key={rx.id}
                  className="p-5 rounded-xl bg-muted/40 hover:bg-muted/70 cursor-pointer transition-all duration-200 hover:shadow-sm animate-slide-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4" onClick={() => navigate(`/patients/${rx.patient_id}`)}>
                      <div className="h-11 w-11 rounded-xl bg-success/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold">{patient?.full_name || 'Unknown Patient'}</p>
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
                      <PrescriptionPDFExport
                        variant="icon"
                        prescription={{
                          id: rx.id,
                          patientName: patient?.full_name || 'Unknown',
                          caretagId: patient?.caretag_id || 'N/A',
                          diagnosis: rx.diagnosis,
                          medications: medications || [],
                          notes: rx.notes,
                          createdAt: rx.created_at,
                          validUntil: rx.valid_until
                        }}
                      />
                    </div>
                  </div>

                  {/* Refill info */}
                  {rx.max_refills && rx.max_refills > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Refills: {rx.refill_count || 0}/{rx.max_refills}
                      </span>
                      {rx.next_refill_reminder && isAfter(new Date(), parseISO(rx.next_refill_reminder)) && (
                        <Badge variant="outline" className="text-warning border-warning text-xs">
                          Refill Due
                        </Badge>
                      )}
                    </div>
                  )}

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
              <h3 className="text-lg font-semibold">
                {prescriptions?.length === 0 ? 'No prescriptions' : 'No matching prescriptions'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {prescriptions?.length === 0 
                  ? 'Create your first prescription'
                  : 'Try adjusting your filters'}
              </p>
              {prescriptions?.length === 0 && (
                <Button className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  New Prescription
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
