import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, TrendingUp, Activity, MapPin } from 'lucide-react';
import { differenceInYears } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function PatientAnalytics() {
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: appointments } = useQuery({
    queryKey: ['appointments-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
      <Skeleton className="col-span-2 h-64" />
      <Skeleton className="col-span-2 h-64" />
    </div>;
  }

  // Calculate age distribution
  const ageDistribution = patients?.reduce((acc, patient) => {
    const age = differenceInYears(new Date(), new Date(patient.date_of_birth));
    let group = '';
    if (age < 18) group = '0-17';
    else if (age < 30) group = '18-29';
    else if (age < 45) group = '30-44';
    else if (age < 60) group = '45-59';
    else group = '60+';
    
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ageData = Object.entries(ageDistribution || {}).map(([name, value]) => ({ name, value }));

  // Gender distribution
  const genderDistribution = patients?.reduce((acc, patient) => {
    const gender = patient.gender || 'Unknown';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const genderData = Object.entries(genderDistribution || {}).map(([name, value]) => ({ name, value }));

  // Blood group distribution
  const bloodGroupDistribution = patients?.reduce((acc, patient) => {
    const group = patient.blood_group || 'Unknown';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bloodGroupData = Object.entries(bloodGroupDistribution || {}).map(([name, value]) => ({ name, value }));

  // Common conditions
  const conditionCounts = patients?.reduce((acc, patient) => {
    patient.chronic_conditions?.forEach((condition: string) => {
      acc[condition] = (acc[condition] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const conditionData = Object.entries(conditionCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Stats
  const stats = {
    total: patients?.length || 0,
    withAllergies: patients?.filter(p => p.allergies && p.allergies.length > 0).length || 0,
    withConditions: patients?.filter(p => p.chronic_conditions && p.chronic_conditions.length > 0).length || 0,
    appointmentsThisMonth: appointments?.filter(a => {
      const date = new Date(a.scheduled_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length || 0
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">With Allergies</p>
                <p className="text-3xl font-bold">{stats.withAllergies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Chronic Conditions</p>
                <p className="text-3xl font-bold">{stats.withConditions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Appointments (Month)</p>
                <p className="text-3xl font-bold">{stats.appointmentsThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {genderData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Blood Group Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bloodGroupData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {bloodGroupData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conditionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
