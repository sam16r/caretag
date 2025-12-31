import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Records() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Medical Records (EHR)</h1>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search records..." className="pl-10" />
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Patient Records</CardTitle></CardHeader>
        <CardContent className="p-12 text-center text-muted-foreground">Search for a patient to view their medical records</CardContent>
      </Card>
    </div>
  );
}
