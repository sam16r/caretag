import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Heart, AlertTriangle, FileText, Pill, Activity } from 'lucide-react';

export default function PatientDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Sarah Johnson</h1>
            <p className="text-muted-foreground">CT-2024-001 • Age 34 • Female</p>
          </div>
        </div>
        <Badge variant="secondary">Stable</Badge>
      </div>

      <Card className="border-emergency/30 bg-emergency/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-emergency flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Emergency Info</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6 text-sm">
          <div><span className="text-muted-foreground">Blood:</span> <strong>A+</strong></div>
          <div><span className="text-muted-foreground">Allergies:</span> <strong className="text-emergency">Penicillin</strong></div>
          <div><span className="text-muted-foreground">Conditions:</span> <strong>Asthma</strong></div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="vitals">Vitals Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle className="text-base">Contact Info</CardTitle></CardHeader><CardContent className="text-sm space-y-1"><p>Phone: +1 555-0123</p><p>Email: sarah.j@email.com</p><p>Address: 123 Medical St, Health City</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Current Medications</CardTitle></CardHeader><CardContent className="text-sm space-y-1"><p>Albuterol Inhaler - As needed</p><p>Vitamin D - 1000IU daily</p></CardContent></Card>
          </div>
        </TabsContent>
        <TabsContent value="history" className="mt-4"><Card><CardContent className="p-6 text-center text-muted-foreground">Medical history timeline will appear here</CardContent></Card></TabsContent>
        <TabsContent value="prescriptions" className="mt-4"><Card><CardContent className="p-6 text-center text-muted-foreground">Prescription history will appear here</CardContent></Card></TabsContent>
        <TabsContent value="reports" className="mt-4"><Card><CardContent className="p-6 text-center text-muted-foreground">Lab reports will appear here</CardContent></Card></TabsContent>
        <TabsContent value="vitals" className="mt-4"><Card><CardContent className="p-6 text-center text-muted-foreground">Vitals timeline chart will appear here</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
