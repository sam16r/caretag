import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  UserRound,
  CalendarCheck,
  Pill,
  Siren,
  ChartLine,
  Gauge,
  Droplet,
  IndianRupee,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const GENDER_COLORS = ['hsl(215, 100%, 50%)', 'hsl(340, 80%, 55%)', 'hsl(160, 60%, 45%)'];
const SEVERITY_COLORS = {
  low: 'hsl(160, 60%, 45%)',
  medium: 'hsl(45, 90%, 50%)',
  high: 'hsl(25, 90%, 55%)',
  critical: 'hsl(0, 75%, 55%)',
};

export default function Analytics() {
  const { data, isLoading, error } = useAnalyticsData();

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load analytics data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const genderData = data ? [
    { name: 'Male', value: data.genderDistribution.male },
    { name: 'Female', value: data.genderDistribution.female },
    { name: 'Other', value: data.genderDistribution.other },
  ].filter(d => d.value > 0) : [];

  const appointmentStatusData = data ? [
    { name: 'Scheduled', value: data.appointmentStatus.scheduled, color: 'hsl(215, 100%, 50%)' },
    { name: 'Completed', value: data.appointmentStatus.completed, color: 'hsl(160, 60%, 45%)' },
    { name: 'Cancelled', value: data.appointmentStatus.cancelled, color: 'hsl(0, 75%, 55%)' },
    { name: 'No Show', value: data.appointmentStatus.noShow, color: 'hsl(45, 90%, 50%)' },
  ].filter(d => d.value > 0) : [];

  const emergencyData = data ? [
    { name: 'Low', value: data.emergencySeverity.low, color: SEVERITY_COLORS.low },
    { name: 'Medium', value: data.emergencySeverity.medium, color: SEVERITY_COLORS.medium },
    { name: 'High', value: data.emergencySeverity.high, color: SEVERITY_COLORS.high },
    { name: 'Critical', value: data.emergencySeverity.critical, color: SEVERITY_COLORS.critical },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Practice Analytics</h1>
        <p className="text-muted-foreground">Comprehensive insights into your practice performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Patients"
          value={data?.totalPatients}
          icon={UserRound}
          color="primary"
          isLoading={isLoading}
          subtitle={`${data?.patientsWithConditions || 0} with chronic conditions`}
        />
        <MetricCard
          title="Appointments (30d)"
          value={data?.totalAppointments}
          icon={CalendarCheck}
          color="chart-2"
          isLoading={isLoading}
          subtitle={`${data?.appointmentStatus.completed || 0} completed`}
        />
        <MetricCard
          title="Prescriptions (30d)"
          value={data?.totalPrescriptions}
          icon={Pill}
          color="chart-3"
          isLoading={isLoading}
          subtitle="Active prescriptions"
        />
        <MetricCard
          title="Emergencies (30d)"
          value={data?.totalEmergencies}
          icon={Siren}
          color="destructive"
          isLoading={isLoading}
          subtitle={`${data?.emergencySeverity.critical || 0} critical`}
        />
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="patients">Patient Demographics</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="health">Health Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Patient Registrations Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartLine className="h-5 w-5 text-primary" />
                  Patient Registrations
                </CardTitle>
                <CardDescription>New patient registrations over the last 14 days</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data?.dailyRegistrations || []}>
                      <defs>
                        <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorRegistrations)"
                        name="Registrations"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Appointment Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                  Appointment Status
                </CardTitle>
                <CardDescription>Distribution of appointment outcomes (last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : appointmentStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={appointmentStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {appointmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No appointment data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Emergency Severity & Blood Groups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Siren className="h-5 w-5 text-destructive" />
                  Emergency Severity
                </CardTitle>
                <CardDescription>Breakdown by severity level (last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : emergencyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={emergencyData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" name="Cases">
                        {emergencyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No emergency data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplet className="h-5 w-5 text-destructive" />
                  Blood Group Distribution
                </CardTitle>
                <CardDescription>Patient blood type breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data?.bloodGroupDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="group" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Patients" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          {/* Revenue KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold text-primary">
                    ₹{(data?.totalRevenue || 0).toLocaleString('en-IN')}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold text-chart-2">
                    ₹{(data?.paidRevenue || 0).toLocaleString('en-IN')}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold text-chart-4">
                    ₹{(data?.pendingRevenue || 0).toLocaleString('en-IN')}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold text-destructive">
                    ₹{(data?.overdueRevenue || 0).toLocaleString('en-IN')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-primary" />
                Monthly Revenue Trend
              </CardTitle>
              <CardDescription>
                Revenue performance over the last 12 months
                {data?.revenueGrowth !== undefined && (
                  <Badge 
                    variant={data.revenueGrowth >= 0 ? "default" : "destructive"} 
                    className="ml-2"
                  >
                    {data.revenueGrowth >= 0 ? '+' : ''}{data.revenueGrowth.toFixed(1)}% vs last month
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : data?.monthlyRevenue && data.monthlyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={data.monthlyRevenue}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="shortMonth" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                      labelFormatter={(label) => data.monthlyRevenue.find(m => m.shortMonth === label)?.month || label}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Total Invoiced"
                    />
                    <Area
                      type="monotone"
                      dataKey="paid"
                      stroke="hsl(var(--chart-2))"
                      fillOpacity={1}
                      fill="url(#colorPaid)"
                      name="Collected"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No revenue data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Status & Collection Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-primary" />
                  Invoice Status Distribution
                </CardTitle>
                <CardDescription>Breakdown of invoice payment status</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Paid', value: data?.invoiceStatus.paid || 0, color: 'hsl(160, 60%, 45%)' },
                          { name: 'Pending', value: data?.invoiceStatus.pending || 0, color: 'hsl(45, 90%, 50%)' },
                          { name: 'Overdue', value: data?.invoiceStatus.overdue || 0, color: 'hsl(0, 75%, 55%)' },
                          { name: 'Cancelled', value: data?.invoiceStatus.cancelled || 0, color: 'hsl(220, 10%, 50%)' },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: 'Paid', value: data?.invoiceStatus.paid || 0, color: 'hsl(160, 60%, 45%)' },
                          { name: 'Pending', value: data?.invoiceStatus.pending || 0, color: 'hsl(45, 90%, 50%)' },
                          { name: 'Overdue', value: data?.invoiceStatus.overdue || 0, color: 'hsl(0, 75%, 55%)' },
                          { name: 'Cancelled', value: data?.invoiceStatus.cancelled || 0, color: 'hsl(220, 10%, 50%)' },
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collection Performance</CardTitle>
                <CardDescription>Payment collection rate analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <>
                    {/* Collection Rate */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Collection Rate</span>
                        <span className="font-medium">
                          {data?.totalRevenue
                            ? ((data.paidRevenue / data.totalRevenue) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-chart-2 transition-all"
                          style={{
                            width: `${data?.totalRevenue
                              ? (data.paidRevenue / data.totalRevenue) * 100
                              : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* This Month vs Last Month */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">This Month</p>
                        <p className="text-xl font-bold text-primary">
                          ₹{(data?.currentMonthRevenue || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Last Month</p>
                        <p className="text-xl font-bold">
                          ₹{(data?.previousMonthRevenue || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Total Invoices */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-sm text-muted-foreground">Total Invoices (12 months)</span>
                      <span className="font-semibold">{data?.totalInvoices || 0}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patient Demographics Tab */}
        <TabsContent value="patients" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gender Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-primary" />
                  Gender Distribution
                </CardTitle>
                <CardDescription>Breakdown of patients by gender</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : genderData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No gender data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Age Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  Age Distribution
                </CardTitle>
                <CardDescription>Patient age groups</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data?.ageGroups || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Patients" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">With Chronic Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {data?.patientsWithConditions || 0}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({data?.totalPatients ? ((data.patientsWithConditions / data.totalPatients) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">With Known Allergies</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {data?.patientsWithAllergies || 0}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({data?.totalPatients ? ((data.patientsWithAllergies / data.totalPatients) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Registered</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold text-primary">{data?.totalPatients || 0}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-2xl font-bold text-primary">{data?.appointmentStatus.scheduled || 0}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-2xl font-bold text-chart-2">{data?.appointmentStatus.completed || 0}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-2xl font-bold text-destructive">{data?.appointmentStatus.cancelled || 0}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">No Show</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <div className="text-2xl font-bold text-chart-4">{data?.appointmentStatus.noShow || 0}</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Completion Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment Completion Rate</CardTitle>
              <CardDescription>Based on last 30 days of data</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completion Rate</span>
                    <span className="font-medium">
                      {data?.totalAppointments
                        ? ((data.appointmentStatus.completed / data.totalAppointments) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-chart-2 transition-all"
                      style={{
                        width: `${data?.totalAppointments
                          ? (data.appointmentStatus.completed / data.totalAppointments) * 100
                          : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{data?.appointmentStatus.completed || 0} completed</span>
                    <span>{data?.totalAppointments || 0} total</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Insights Tab */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Chronic Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Top Chronic Conditions</CardTitle>
                <CardDescription>Most common conditions among patients</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : data?.topConditions && data.topConditions.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.topConditions} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        width={120}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} name="Patients" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No condition data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Allergies */}
            <Card>
              <CardHeader>
                <CardTitle>Top Allergies</CardTitle>
                <CardDescription>Most common allergies among patients</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : data?.topAllergies && data.topAllergies.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.topAllergies} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        width={120}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} name="Patients" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No allergy data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value?: number;
  icon: React.ElementType;
  color: string;
  isLoading: boolean;
  subtitle?: string;
}

function MetricCard({ title, value, icon: Icon, color, isLoading, subtitle }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-bold">{value ?? 0}</p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}/10`}>
            <Icon className={`h-6 w-6 text-${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
