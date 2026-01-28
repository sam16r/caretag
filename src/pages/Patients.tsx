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
import { Search, ScanLine, User, Plus, Users, Filter, AlertTriangle, Heart } from 'lucide-react';
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Search</h1>
          <p className="text-muted-foreground mt-1">
            {patients?.length || 0} patients registered • {filteredPatients?.length || 0} shown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 shadow-sm" onClick={() => navigate('/scan')}>
            <ScanLine className="h-4 w-4" />
            Scan CareTag
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/25">
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, CareTag ID, phone, or email..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10 h-11 rounded-xl bg-muted/50 border-transparent focus:border-primary"
          />
        </div>
        <div className="flex gap-3">
          <Select value={bloodGroupFilter} onValueChange={setBloodGroupFilter}>
            <SelectTrigger className="w-[130px] h-11 rounded-xl">
              <SelectValue placeholder="Blood Group" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Blood</SelectItem>
              {bloodGroups.map(bg => (
                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[120px] h-11 rounded-xl">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Gender</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-[160px] h-11 rounded-xl">
              <SelectValue placeholder="Conditions" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
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
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredPatients && filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient, index) => (
            <Card 
              key={patient.id} 
              className="card-interactive cursor-pointer group animate-slide-up" 
              style={{ animationDelay: `${Math.min(index, 20) * 30}ms` }}
              onClick={() => navigate(`/patients/${patient.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold truncate">{patient.full_name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{patient.caretag_id}</p>
                      </div>
                      {patient.blood_group && (
                        <Badge variant="outline" className="font-semibold text-emergency border-emergency/40 flex-shrink-0">
                          {patient.blood_group}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{patient.gender}</span>
                      </span>
                      <span>•</span>
                      <span>{calculateAge(patient.date_of_birth)} yrs</span>
                      {patient.phone && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">{patient.phone}</span>
                        </>
                      )}
                    </div>

                    {/* Conditions & Allergies */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {patient.chronic_conditions?.slice(0, 2).map((condition: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs font-medium">
                          <Heart className="h-3 w-3 mr-1" />
                          {condition}
                        </Badge>
                      ))}
                      {patient.chronic_conditions && patient.chronic_conditions.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{patient.chronic_conditions.length - 2} more
                        </Badge>
                      )}
                      {patient.allergies && patient.allergies.length > 0 && (
                        <Badge variant="outline" className="text-xs font-medium text-warning border-warning/40">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {patient.allergies.length} allerg{patient.allergies.length > 1 ? 'ies' : 'y'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="card-elevated">
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No patients found</h3>
            <p className="text-muted-foreground mt-1">
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
