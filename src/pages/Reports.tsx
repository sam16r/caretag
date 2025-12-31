import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Pill } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md"><CardContent className="p-6 flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">OPD Trends</p><p className="text-2xl font-bold">View Report</p></div></CardContent></Card>
        <Card className="cursor-pointer hover:shadow-md"><CardContent className="p-6 flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-emergency/10 flex items-center justify-center"><BarChart3 className="h-6 w-6 text-emergency" /></div><div><p className="text-sm text-muted-foreground">Emergency Stats</p><p className="text-2xl font-bold">View Report</p></div></CardContent></Card>
        <Card className="cursor-pointer hover:shadow-md"><CardContent className="p-6 flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center"><Users className="h-6 w-6 text-success" /></div><div><p className="text-sm text-muted-foreground">Doctor Activity</p><p className="text-2xl font-bold">View Report</p></div></CardContent></Card>
        <Card className="cursor-pointer hover:shadow-md"><CardContent className="p-6 flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center"><Pill className="h-6 w-6 text-accent" /></div><div><p className="text-sm text-muted-foreground">Prescriptions</p><p className="text-2xl font-bold">View Report</p></div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Analytics Dashboard</CardTitle></CardHeader><CardContent className="p-12 text-center text-muted-foreground">Select a report category above to view detailed analytics</CardContent></Card>
    </div>
  );
}
