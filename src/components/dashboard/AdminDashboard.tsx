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
  { category: 'Antibiotics', count: 145 },
  { category: 'Analgesics', count: 210 },
  { category: 'Cardiovascular', count: 98 },
  { category: 'Respiratory', count: 67 },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Hospital overview and analytics</p>
        </div>
        <Button onClick={() => navigate('/settings')} variant="outline" className="gap-2">
          <Shield className="h-4 w-4" />
          System Settings
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/reports')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total OPD Today</p>
                <p className="text-3xl font-bold text-foreground">156</p>
                <p className="text-sm text-success">+12% from yesterday</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/emergency')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emergency Cases</p>
                <p className="text-3xl font-bold text-emergency">8</p>
                <p className="text-sm text-muted-foreground">This week</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emergency/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-emergency" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/reports')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Doctors</p>
                <p className="text-3xl font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground">Currently on duty</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/reports')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prescriptions</p>
                <p className="text-3xl font-bold text-foreground">520</p>
                <p className="text-sm text-success">+8% this week</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Pill className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OPD Trends Chart */}
        <Card className="cursor-pointer" onClick={() => navigate('/reports')}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              OPD Trends (This Week)
            </CardTitle>
            <Button variant="ghost" size="sm">
              View details <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={opdTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Case Trends */}
        <Card className="cursor-pointer" onClick={() => navigate('/reports')}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-emergency" />
              Emergency Case Trends
            </CardTitle>
            <Button variant="ghost" size="sm">
              View details <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emergencyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="cases" fill="hsl(var(--emergency))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Doctor Activity Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Doctor Activity Stats
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {doctorActivityData.map((doctor) => (
              <div
                key={doctor.id}
                onClick={() => navigate('/reports')}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{doctor.name}</p>
                    <p className="text-sm text-muted-foreground">{doctor.patients} patients today</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{doctor.consultations}</p>
                  <p className="text-sm text-muted-foreground">consultations</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Prescription Patterns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Prescription Patterns
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
              View details <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {prescriptionData.map((item, index) => (
              <div
                key={index}
                onClick={() => navigate('/reports')}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{item.category}</span>
                  <span className="text-sm text-muted-foreground">{item.count}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(item.count / 250) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            System Access Logs
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAuditLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => navigate('/settings')}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    log.type === 'emergency' ? 'bg-emergency/10' : 'bg-muted'
                  }`}>
                    <Activity className={`h-5 w-5 ${
                      log.type === 'emergency' ? 'text-emergency' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{log.user}</p>
                    <p className="text-sm text-muted-foreground">{log.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{log.time}</p>
                  <Badge variant={log.type === 'emergency' ? 'destructive' : 'secondary'}>
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
