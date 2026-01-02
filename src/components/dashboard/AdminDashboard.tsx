import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  AlertTriangle,
  Activity,
  TrendingUp,
  Pill,
  Shield,
  ArrowRight,
  FileText,
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
} from 'recharts';

// Mock data for charts
const opdTrendData = [
  { name: 'Mon', count: 45 },
  { name: 'Tue', count: 52 },
  { name: 'Wed', count: 48 },
  { name: 'Thu', count: 61 },
  { name: 'Fri', count: 55 },
  { name: 'Sat', count: 32 },
  { name: 'Sun', count: 18 },
];

const emergencyTrendData = [
  { name: 'Week 1', cases: 12 },
  { name: 'Week 2', cases: 8 },
  { name: 'Week 3', cases: 15 },
  { name: 'Week 4', cases: 10 },
];

const doctorActivityData = [
  { id: '1', name: 'Dr. Smith', patients: 28, consultations: 45 },
  { id: '2', name: 'Dr. Johnson', patients: 22, consultations: 38 },
  { id: '3', name: 'Dr. Williams', patients: 19, consultations: 32 },
  { id: '4', name: 'Dr. Brown', patients: 25, consultations: 41 },
];

const prescriptionData = [
  { category: 'Antibiotics', count: 145, color: 'hsl(var(--primary))' },
  { category: 'Analgesics', count: 210, color: 'hsl(var(--accent))' },
  { category: 'Cardiovascular', count: 98, color: 'hsl(var(--success))' },
  { category: 'Respiratory', count: 67, color: 'hsl(var(--warning))' },
];

const recentAuditLogs = [
  { id: '1', user: 'Dr. Smith', action: 'Viewed patient record', time: '2 min ago', type: 'view' },
  { id: '2', user: 'Dr. Johnson', action: 'Created prescription', time: '5 min ago', type: 'create' },
  { id: '3', user: 'Admin User', action: 'Updated settings', time: '15 min ago', type: 'update' },
  { id: '4', user: 'Dr. Williams', action: 'Emergency access', time: '1 hour ago', type: 'emergency' },
];

export function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Hospital overview and analytics</p>
        </div>
        <Button onClick={() => navigate('/settings')} variant="outline" className="gap-2 shadow-sm">
          <Shield className="h-4 w-4" />
          System Settings
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="card-interactive stat-glow-primary cursor-pointer group" onClick={() => navigate('/reports')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total OPD Today</p>
                <p className="text-4xl font-bold tracking-tight">156</p>
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+12% from yesterday</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
                <Calendar className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive stat-glow-emergency cursor-pointer group border-emergency/20" onClick={() => navigate('/emergency')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Emergency Cases</p>
                <p className="text-4xl font-bold tracking-tight text-emergency">8</p>
                <p className="text-sm text-muted-foreground">This week</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-emergency flex items-center justify-center shadow-lg shadow-emergency/30 group-hover:scale-105 transition-transform">
                <AlertTriangle className="h-7 w-7 text-emergency-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive stat-glow-success cursor-pointer group" onClick={() => navigate('/reports')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Doctors</p>
                <p className="text-4xl font-bold tracking-tight">12</p>
                <p className="text-sm text-muted-foreground">Currently on duty</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-success flex items-center justify-center shadow-lg shadow-success/25 group-hover:scale-105 transition-transform">
                <Users className="h-7 w-7 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive stat-glow-accent cursor-pointer group" onClick={() => navigate('/reports')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Prescriptions</p>
                <p className="text-4xl font-bold tracking-tight">520</p>
                <div className="flex items-center gap-1 text-success text-sm font-medium">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+8% this week</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl gradient-accent flex items-center justify-center shadow-lg shadow-accent/25 group-hover:scale-105 transition-transform">
                <Pill className="h-7 w-7 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OPD Trends Chart */}
        <Card className="card-elevated cursor-pointer" onClick={() => navigate('/reports')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5 text-primary" />
              </div>
              OPD Trends
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
              View details <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={opdTrendData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
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
                    fill="url(#colorCount)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Case Trends */}
        <Card className="card-elevated cursor-pointer" onClick={() => navigate('/reports')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-emergency/10 flex items-center justify-center">
                <AlertTriangle className="h-4.5 w-4.5 text-emergency" />
              </div>
              Emergency Cases
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
              View details <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emergencyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)'
                    }}
                  />
                  <Bar dataKey="cases" fill="hsl(var(--emergency))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Doctor Activity Stats */}
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4.5 w-4.5 text-primary" />
              </div>
              Doctor Activity
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/reports')} className="text-primary hover:text-primary">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {doctorActivityData.map((doctor, index) => (
              <div
                key={doctor.id}
                onClick={() => navigate('/reports')}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/70 cursor-pointer transition-all duration-200 hover:shadow-sm animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{doctor.name}</p>
                    <p className="text-sm text-muted-foreground">{doctor.patients} patients today</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{doctor.consultations}</p>
                  <p className="text-xs text-muted-foreground">consultations</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Prescription Patterns */}
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Pill className="h-4.5 w-4.5 text-accent" />
              </div>
              Prescription Patterns
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/reports')} className="text-primary hover:text-primary">
              View details <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {prescriptionData.map((item, index) => (
              <div
                key={index}
                onClick={() => navigate('/reports')}
                className="cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{item.category}</span>
                  <span className="text-sm font-semibold">{item.count}</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(item.count / 250) * 100}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs */}
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4.5 w-4.5 text-primary" />
            </div>
            System Access Logs
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="text-primary hover:text-primary">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAuditLogs.map((log, index) => (
              <div
                key={log.id}
                onClick={() => navigate('/settings')}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/70 cursor-pointer transition-all duration-200 hover:shadow-sm animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                    log.type === 'emergency' ? 'bg-emergency/15' : 'bg-muted'
                  }`}>
                    <Activity className={`h-5 w-5 ${
                      log.type === 'emergency' ? 'text-emergency' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold">{log.user}</p>
                    <p className="text-sm text-muted-foreground">{log.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{log.time}</p>
                  <Badge variant={log.type === 'emergency' ? 'destructive' : 'secondary'} className="font-medium capitalize">
                    {log.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
