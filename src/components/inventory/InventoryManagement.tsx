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
import { Plus, Package, AlertTriangle, Search, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const categories = [
  'Medications',
  'Medical Supplies',
  'Equipment',
  'Lab Supplies',
  'PPE',
  'Consumables',
  'Other'
];

export function InventoryManagement() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    quantity: 0,
    unit: '',
    min_stock_level: 10,
    cost_per_unit: 0,
    supplier: '',
    expiry_date: '',
    location: '',
    notes: ''
  });

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('inventory').insert({
        ...data,
        expiry_date: data.expiry_date || null,
        cost_per_unit: data.cost_per_unit || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      resetForm();
      toast.success('Item added successfully');
    },
    onError: () => toast.error('Failed to add item')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('inventory').update({
        ...data,
        expiry_date: data.expiry_date || null,
        cost_per_unit: data.cost_per_unit || null
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      resetForm();
      toast.success('Item updated');
    },
    onError: () => toast.error('Failed to update item')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item deleted');
    },
    onError: () => toast.error('Failed to delete item')
  });

  const resetForm = () => {
    setIsOpen(false);
    setEditingItem(null);
    setFormData({ name: '', category: '', sku: '', quantity: 0, unit: '', min_stock_level: 10, cost_per_unit: 0, supplier: '', expiry_date: '', location: '', notes: '' });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku || '',
      quantity: item.quantity,
      unit: item.unit,
      min_stock_level: item.min_stock_level,
      cost_per_unit: item.cost_per_unit || 0,
      supplier: item.supplier || '',
      expiry_date: item.expiry_date || '',
      location: item.location || '',
      notes: item.notes || ''
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredInventory = inventory?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory?.filter(item => item.quantity <= item.min_stock_level) || [];
  const expiringItems = inventory?.filter(item => {
    if (!item.expiry_date) return false;
    const daysUntilExpiry = Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }) || [];

  const stats = {
    total: inventory?.length || 0,
    lowStock: lowStockItems.length,
    expiring: expiringItems.length,
    totalValue: inventory?.reduce((sum, item) => sum + (item.quantity * (item.cost_per_unit || 0)), 0) || 0
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
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.lowStock > 0 ? 'border-amber-500' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold">{stats.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.expiring > 0 ? 'border-destructive' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">{stats.expiring}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Inventory</CardTitle>
          <div className="flex gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={isOpen} onOpenChange={o => { if (!o) resetForm(); else setIsOpen(true); }}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> Add Item</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Name *</Label>
                      <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Category *</Label>
                      <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Quantity *</Label>
                      <Input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Unit *</Label>
                      <Input value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="pcs, boxes" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Min Stock</Label>
                      <Input type="number" value={formData.min_stock_level} onChange={e => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>SKU</Label>
                      <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Cost per Unit</Label>
                      <Input type="number" step="0.01" value={formData.cost_per_unit} onChange={e => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Supplier</Label>
                      <Input value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Expiry Date</Label>
                      <Input type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Location</Label>
                    <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Room A, Shelf 3" />
                  </div>
                  <Button onClick={handleSubmit} disabled={!formData.name || !formData.category || !formData.unit}>
                    {editingItem ? 'Update' : 'Add Item'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInventory?.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No items found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory?.map(item => {
                  const isLowStock = item.quantity <= item.min_stock_level;
                  const isExpiring = item.expiry_date && new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <TableRow key={item.id} className={isLowStock || isExpiring ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                      <TableCell className="font-mono text-sm">{item.sku || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.quantity} {item.unit}
                          {isLowStock && <Badge variant="destructive" className="text-xs">Low</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{item.location || '-'}</TableCell>
                      <TableCell>
                        {item.expiry_date ? (
                          <span className={isExpiring ? 'text-destructive font-medium' : ''}>
                            {format(new Date(item.expiry_date), 'MMM d, yyyy')}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
