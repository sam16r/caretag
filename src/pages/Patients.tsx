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
import { Search, ScanLine, User, Plus, Users, AlertTriangle, Heart, Sparkles, ArrowRight } from 'lucide-react';
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
    <div className="space-y-8 animate-fade-in">
      {/* Header - Playful */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Patient Search
            <span className="text-2xl">👥</span>
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            <span className="text-primary font-bold">{patients?.length || 0}</span> patients registered • <span className="text-accent font-bold">{filteredPatients?.length || 0}</span> shown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-full px-5" onClick={() => navigate('/scan')}>
            <ScanLine className="h-4 w-4" />
            📷 Scan CareTag
          </Button>
          <Button className="gap-2 rounded-full px-5">
            <Plus className="h-4 w-4" />
            ➕ Add Patient
          </Button>
        </div>
      </div>

      {/* Search and Filters - Playful */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Search by name, CareTag ID, phone, or email... 🔍" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-12 h-12 rounded-2xl bg-secondary border-2 border-transparent focus:border-primary/50 font-medium"
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <Select value={bloodGroupFilter} onValueChange={setBloodGroupFilter}>
            <SelectTrigger className="w-[140px] h-12 rounded-2xl border-2 font-semibold">
              <SelectValue placeholder="🩸 Blood" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2">
              <SelectItem value="all">🩸 All Blood</SelectItem>
              {bloodGroups.map(bg => (
                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[130px] h-12 rounded-2xl border-2 font-semibold">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2">
              <SelectItem value="all">All Gender</SelectItem>
              <SelectItem value="Male">👨 Male</SelectItem>
              <SelectItem value="Female">👩 Female</SelectItem>
            </SelectContent>
          </Select>
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-[170px] h-12 rounded-2xl border-2 font-semibold">
              <SelectValue placeholder="Conditions" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2">
              <SelectItem value="all">All Patients</SelectItem>
              <SelectItem value="with">❤️ With Conditions</SelectItem>
              <SelectItem value="without">✅ No Conditions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results - Playful Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-3xl" />
          ))}
        </div>
      ) : filteredPatients && filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPatients.map((patient, index) => (
            <Card 
              key={patient.id} 
              className="cursor-pointer group hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up overflow-hidden" 
              style={{ animationDelay: `${Math.min(index, 20) * 30}ms` }}
              onClick={() => navigate(`/patients/${patient.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <span className="text-white font-bold text-lg">
                      {patient.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-lg truncate">{patient.full_name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{patient.caretag_id}</p>
                      </div>
                      {patient.blood_group && (
                        <Badge variant="outline" className="font-bold text-destructive border-destructive/40 flex-shrink-0 rounded-xl">
                          🩸 {patient.blood_group}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span className="font-semibold">{patient.gender === 'Male' ? '👨' : '👩'} {patient.gender}</span>
                      <span>•</span>
                      <span className="font-semibold">{calculateAge(patient.date_of_birth)} yrs</span>
                      {patient.phone && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">📞 {patient.phone}</span>
                        </>
                      )}
                    </div>

                    {/* Conditions & Allergies */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {patient.chronic_conditions?.slice(0, 2).map((condition: string, i: number) => (
                        <Badge key={i} variant="secondary" className="rounded-xl font-semibold">
                          <Heart className="h-3 w-3 mr-1 text-destructive" />
                          {condition}
                        </Badge>
                      ))}
                      {patient.chronic_conditions && patient.chronic_conditions.length > 2 && (
                        <Badge variant="secondary" className="rounded-xl font-semibold">
                          +{patient.chronic_conditions.length - 2} more
                        </Badge>
                      )}
                      {patient.allergies && patient.allergies.length > 0 && (
                        <Badge variant="outline" className="rounded-xl font-semibold text-warning border-warning/40">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {patient.allergies.length} allerg{patient.allergies.length > 1 ? 'ies' : 'y'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Hover indicator */}
                <div className="flex justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-primary font-bold flex items-center gap-1">
                    View Profile <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="py-20 text-center">
            <div className="h-24 w-24 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6 animate-float">
              <Users className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold">No patients found</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {search || bloodGroupFilter !== 'all' || genderFilter !== 'all' || conditionFilter !== 'all'
                ? 'Try adjusting your search or filters to find what you\'re looking for 🔍'
                : 'Add your first patient to get started! 🚀'}
            </p>
            <Button className="mt-6 gap-2 rounded-full px-6">
              <Plus className="h-4 w-4" />
              ➕ Add Patient
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
