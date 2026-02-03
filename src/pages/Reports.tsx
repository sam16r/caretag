import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UserRound,
  CalendarCheck,
  Siren,
  Pill,
  ChartLine,
  Stethoscope,
  HeartPulse,
  Droplet,
  UserCheck,
  CircleAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--emergency))',
  'hsl(215, 70%, 60%)',
  'hsl(175, 60%, 50%)',
  'hsl(38, 80%, 55%)',
];

export default function Reports() {
  const { data: analytics, isLoading } = useAnalyticsData();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">Comprehensive healthcare analytics dashboard</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const genderData = [
    { name: 'Male', value: analytics?.genderDistribution.male || 0, fill: 'hsl(var(--primary))' },
    { name: 'Female', value: analytics?.genderDistribution.female || 0, fill: 'hsl(var(--accent))' },
  ];

  const appointmentData = [
    { name: 'Scheduled', value: analytics?.appointmentStatus.scheduled || 0, fill: 'hsl(var(--primary))' },
    { name: 'Completed', value: analytics?.appointmentStatus.completed || 0, fill: 'hsl(var(--success))' },
    { name: 'Cancelled', value: analytics?.appointmentStatus.cancelled || 0, fill: 'hsl(var(--warning))' },
    { name: 'No Show', value: analytics?.appointmentStatus.noShow || 0, fill: 'hsl(var(--emergency))' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1">Comprehensive healthcare analytics dashboard</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="card-elevated stat-glow-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                <p className="text-4xl font-bold tracking-tight">{analytics?.totalPatients}</p>
                <p className="text-sm text-success font-medium flex items-center gap-1">
                  <ChartLine className="h-3.5 w-3.5" /> Registered
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <UserRound className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated stat-glow-accent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">With Conditions</p>
                <p className="text-4xl font-bold tracking-tight">{analytics?.patientsWithConditions}</p>
                <p className="text-sm text-muted-foreground">
                  {analytics?.totalPatients ? Math.round((analytics.patientsWithConditions / analytics.totalPatients) * 100) : 0}% of patients
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">With Allergies</p>
                <p className="text-4xl font-bold tracking-tight">{analytics?.patientsWithAllergies}</p>
                <p className="text-sm text-warning font-medium flex items-center gap-1">
                  <CircleAlert className="h-3.5 w-3.5" /> Documented
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <HeartPulse className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated stat-glow-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Prescriptions</p>
                <p className="text-4xl font-bold tracking-tight">{analytics?.totalPrescriptions}</p>
                <p className="text-sm text-muted-foreground">Last 30 days</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Pill className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Registration Trend */}
        <Card className="card-elevated lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ChartLine className="h-4.5 w-4.5 text-primary" />
              </div>
              Patient Registration Trend (Last 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.dailyRegistrations}>
                  <defs>
                    <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    fill="url(#colorRegistrations)"
                    strokeWidth={2.5}
                    name="Patients"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <UserCheck className="h-4.5 w-4.5 text-accent" />
              </div>
              Gender Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-sm font-medium">Male: {analytics?.genderDistribution.male}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-accent" />
                <span className="text-sm font-medium">Female: {analytics?.genderDistribution.female}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                <UserRound className="h-4.5 w-4.5 text-success" />
              </div>
              Age Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.ageGroups} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={50} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--success))" radius={[0, 8, 8, 0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Blood Group Distribution */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-emergency/10 flex items-center justify-center">
                <Droplet className="h-4.5 w-4.5 text-emergency" />
              </div>
              Blood Group Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.bloodGroupDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="group" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--emergency))" radius={[8, 8, 0, 0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Chronic Conditions */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Stethoscope className="h-4.5 w-4.5 text-warning" />
              </div>
              Top Chronic Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topConditions.slice(0, 6).map((condition, index) => (
                <div key={condition.name} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium truncate max-w-[200px]">{condition.name}</span>
                    <Badge variant="secondary" className="font-semibold">{condition.count}</Badge>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(condition.count / (analytics?.topConditions[0]?.count || 1)) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
              {(!analytics?.topConditions || analytics.topConditions.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No chronic conditions recorded</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Allergies */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-emergency/10 flex items-center justify-center">
                <Siren className="h-4.5 w-4.5 text-emergency" />
              </div>
              Common Allergies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topAllergies.slice(0, 6).map((allergy, index) => (
                <div key={allergy.name} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{allergy.name}</span>
                    <Badge variant="outline" className="font-semibold border-emergency/40 text-emergency">{allergy.count}</Badge>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emergency/70 transition-all duration-500"
                      style={{ 
                        width: `${(allergy.count / (analytics?.topAllergies[0]?.count || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
              {(!analytics?.topAllergies || analytics.topAllergies.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No allergies recorded</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appointment Status */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarCheck className="h-4.5 w-4.5 text-primary" />
              </div>
              Appointment Status (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {appointmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
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
    </div>
  );
}
