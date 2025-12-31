import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ScanLine, User, Plus } from 'lucide-react';

const mockPatients = [
  { id: '1', name: 'Sarah Johnson', caretagId: 'CT-2024-001', phone: '+1 555-0123', bloodGroup: 'A+', age: 34, condition: 'Stable' },
  { id: '2', name: 'Michael Chen', caretagId: 'CT-2024-015', phone: '+1 555-0456', bloodGroup: 'O-', age: 45, condition: 'Monitoring' },
  { id: '3', name: 'Emily Davis', caretagId: 'CT-2024-023', phone: '+1 555-0789', bloodGroup: 'B+', age: 28, condition: 'Stable' },
  { id: '4', name: 'Robert Wilson', caretagId: 'CT-2024-042', phone: '+1 555-0147', bloodGroup: 'AB+', age: 52, condition: 'Critical' },
];

export default function Patients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredPatients = mockPatients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.caretagId.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Patient Search</h1>
        <Button className="gap-2"><Plus className="h-4 w-4" />Add Patient</Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, CareTag ID, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2"><ScanLine className="h-4 w-4" />Scan CareTag</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/patients/${patient.id}`)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{patient.name}</p>
                  <p className="text-sm text-muted-foreground">{patient.caretagId}</p>
                </div>
                <Badge variant={patient.condition === 'Critical' ? 'destructive' : 'secondary'}>{patient.condition}</Badge>
              </div>
              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                <span>Age: {patient.age}</span>
                <span>Blood: {patient.bloodGroup}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
