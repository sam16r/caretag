import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ScanLine, Plus, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import { differenceInYears } from 'date-fns';

export default function Patients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const calculateAge = (dob: string) => {
    return differenceInYears(new Date(), new Date(dob));
  };

  const filteredPatients = patients?.filter(p => {
    const matchesSearch = 
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.caretag_id.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.email?.toLowerCase().includes(search.toLowerCase());

    const matchesBloodGroup = bloodGroupFilter === 'all' || p.blood_group === bloodGroupFilter;
    const matchesGender = genderFilter === 'all' || p.gender === genderFilter;
    const matchesCondition = conditionFilter === 'all' || 
      (conditionFilter === 'with' && p.chronic_conditions && p.chronic_conditions.length > 0) ||
      (conditionFilter === 'without' && (!p.chronic_conditions || p.chronic_conditions.length === 0));

    return matchesSearch && matchesBloodGroup && matchesGender && matchesCondition;
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {patients?.length || 0} patients registered • {filteredPatients?.length || 0} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/scan')}>
            <ScanLine className="h-4 w-4" />
            Scan CareTag
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, CareTag ID, phone, or email..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={bloodGroupFilter} onValueChange={setBloodGroupFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Blood Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blood</SelectItem>
              {bloodGroups.map(bg => (
                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gender</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Conditions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              <SelectItem value="with">With Conditions</SelectItem>
              <SelectItem value="without">No Conditions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : filteredPatients && filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <Card 
              key={patient.id} 
              className="cursor-pointer hover:border-primary/30 hover:shadow-md transition-all" 
              onClick={() => navigate(`/patients/${patient.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-medium text-sm">
                      {patient.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium truncate">{patient.full_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{patient.caretag_id}</p>
                      </div>
                      {patient.blood_group && (
                        <Badge variant="outline" className="flex-shrink-0 text-xs text-red-700 border-red-300 bg-red-100">
                          {patient.blood_group}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted-foreground">
                      <span>{patient.gender}</span>
                      <span>•</span>
                      <span>{calculateAge(patient.date_of_birth)} yrs</span>
                      {patient.phone && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[100px]">{patient.phone}</span>
                        </>
                      )}
                    </div>

                    {/* Conditions & Allergies */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {patient.chronic_conditions?.slice(0, 2).map((condition: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                      {patient.chronic_conditions && patient.chronic_conditions.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{patient.chronic_conditions.length - 2}
                        </Badge>
                      )}
                      {patient.allergies && patient.allergies.length > 0 && (
                        <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-100">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {patient.allergies.length} allerg{patient.allergies.length > 1 ? 'ies' : 'y'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Hover indicator */}
                <div className="flex justify-end mt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    View <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No patients found</h3>
            <p className="text-muted-foreground mt-1 max-w-md mx-auto text-sm">
              {search || bloodGroupFilter !== 'all' || genderFilter !== 'all' || conditionFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first patient to get started'}
            </p>
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}