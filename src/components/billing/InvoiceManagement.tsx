import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Receipt, DollarSign, CheckCircle, Clock, XCircle, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export function InvoiceManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const [formData, setFormData] = useState({
    patient_id: '',
    tax_rate: 0,
    discount_amount: 0,
    notes: '',
    due_date: ''
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select('id, full_name').order('full_name');
      if (error) throw error;
      return data;
    }
  });

  const generateInvoiceNumber = () => {
    const date = new Date();
    return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = subtotal * (formData.tax_rate / 100);
      const total = subtotal + taxAmount - formData.discount_amount;

      const { error } = await supabase.from('invoices').insert({
        patient_id: formData.patient_id,
        doctor_id: user?.id || '',
        invoice_number: generateInvoiceNumber(),
        items: items as any,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: formData.discount_amount,
        total_amount: total,
        due_date: formData.due_date || null,
        notes: formData.notes
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsOpen(false);
      setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
      setFormData({ patient_id: '', tax_rate: 0, discount_amount: 0, notes: '', due_date: '' });
      toast.success('Invoice created successfully');
    },
    onError: () => toast.error('Failed to create invoice')
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'paid') {
        updates.paid_at = new Date().toISOString();
      }
      const { error } = await supabase.from('invoices').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice updated');
    }
  });

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (formData.tax_rate / 100);
  const total = subtotal + taxAmount - formData.discount_amount;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" />Paid</Badge>;
      case 'overdue': return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Overdue</Badge>;
      default: return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    }
  };

  const stats = {
    total: invoices?.length || 0,
    paid: invoices?.filter(i => i.status === 'paid').length || 0,
    pending: invoices?.filter(i => i.status === 'pending').length || 0,
    totalRevenue: invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0
  };

  if (isLoading) {
    return <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-64" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoices</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Create Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Patient</Label>
                    <Select value={formData.patient_id} onValueChange={v => setFormData({ ...formData, patient_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                      <SelectContent>
                        {patients?.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Items</Label>
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <Input className="col-span-5" placeholder="Description" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} />
                      <Input className="col-span-2" type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} />
                      <Input className="col-span-2" type="number" placeholder="Price" value={item.unit_price} onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} />
                      <p className="col-span-2 text-right font-medium">${item.total.toFixed(2)}</p>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(index)} disabled={items.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addItem}>Add Item</Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tax Rate (%)</Label>
                    <Input type="number" value={formData.tax_rate} onChange={e => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Discount ($)</Label>
                    <Input type="number" value={formData.discount_amount} onChange={e => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-1 text-right">
                  <p className="text-sm">Subtotal: ${subtotal.toFixed(2)}</p>
                  <p className="text-sm">Tax: ${taxAmount.toFixed(2)}</p>
                  <p className="text-sm">Discount: -${formData.discount_amount.toFixed(2)}</p>
                  <p className="text-lg font-bold">Total: ${total.toFixed(2)}</p>
                </div>

                <Button onClick={() => createMutation.mutate()} disabled={!formData.patient_id || items.every(i => !i.description)}>
                  Create Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {invoices?.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No invoices yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.map(invoice => {
                  const patient = patients?.find(p => p.id === invoice.patient_id);
                  return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                    <TableCell>{patient?.full_name || '-'}</TableCell>
                    <TableCell>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}</TableCell>
                    <TableCell className="font-medium">${invoice.total_amount?.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {invoice.status !== 'paid' && (
                          <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'paid' })}>
                            Mark Paid
                          </Button>
                        )}
                        <Button size="sm" variant="ghost"><Download className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
