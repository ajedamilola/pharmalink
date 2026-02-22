/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronLeft, ChevronRight, Plus, Loader2, Eye, Check, ChevronDown } from 'lucide-react';
import { DrugCombobox } from '@/components/ui/drug-combobox';

const PAGE_SIZE = 10;

const PharmacyInventory = () => {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<any>(null);
  const [form, setForm] = useState({
    drug_id: '', batch_number: '', expiry_date: '', stock_level: '0', reorder_threshold: '10',
  });

  const fetchInventory = useCallback(async () => {
    if (!appUser) return;
    setLoading(true);

    const { data: ph } = await supabase.from('pharmacies').select('*').eq('user_id', appUser.id).maybeSingle();
    if (!ph) { setLoading(false); return; }
    setPharmacy(ph);

    const [invResult, drugsResult] = await Promise.all([
      supabase
        .from('pharmacy_inventory')
        .select('*, drugs(*), vendors(name)', { count: 'exact' })
        .eq('pharmacy_id', ph.id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1),
      supabase.from('drugs').select('*'),
    ]);

    setInventory(invResult.data || []);
    setTotal(invResult.count || 0);
    setDrugs(drugsResult.data || []);
    setLoading(false);
  }, [appUser, page]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  useEffect(() => {
    if (!addOpen) {
      setSelectedDrug(null);
    }
  }, [addOpen]);

  useEffect(() => {
    if (!pharmacy) return;
    const channel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pharmacy_inventory', filter: `pharmacy_id=eq.${pharmacy.id}` }, () => fetchInventory())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [pharmacy, fetchInventory]);

  const toggleAutoRestock = async (itemId: string, current: boolean, isManual: boolean) => {
    if (isManual) { toast.error('Manual items are exempt from auto-restock'); return; }
    await supabase.from('pharmacy_inventory').update({ auto_restock: !current }).eq('id', itemId);
    toast.success(`Auto-restock ${!current ? 'enabled' : 'disabled'}`);
    fetchInventory();
  };

  const addManualItem = async () => {
    if (!pharmacy || !form.drug_id || !form.batch_number || !form.expiry_date) return;
    setSaving(true);
    await supabase.from('pharmacy_inventory').insert({
      pharmacy_id: pharmacy.id,
      drug_id: form.drug_id,
      batch_number: form.batch_number,
      expiry_date: form.expiry_date,
      stock_level: parseInt(form.stock_level) || 0,
      reorder_threshold: parseInt(form.reorder_threshold) || 10,
      is_manual: true,
      auto_restock: false,
    });
    toast.success('Inventory item added manually');
    setAddOpen(false);
    setForm({ drug_id: '', batch_number: '', expiry_date: '', stock_level: '0', reorder_threshold: '10' });
    setSelectedDrug(null);
    setSaving(false);
    fetchInventory();
  };

  const createNewDrug = async (name: string) => {
    // Check if drug with this name already exists
    const { data: existing } = await supabase.from('drugs').select('id').eq('name', name).maybeSingle();
    if (existing) {
      toast.error('A drug with this name already exists');
      return null;
    }

    const { data, error } = await supabase.from('drugs').insert({
      name,
      category: 'General', // Default category
      unit_price: 1000, // Default unit price
      description: 'Manually added drug',
      shelf_life_months: 24,
    }).select().single();
    if (error) {
      toast.error('Failed to create new drug');
      return null;
    }
    // Refresh drugs list
    const { data: refreshedDrugs } = await supabase.from('drugs').select('*');
    setDrugs(refreshedDrugs || []);
    toast.success('New drug created');
    return data;
  };

  const getRemainingShelfPct = (item: any) => {
    if (!item.drugs?.shelf_life_months || !item.expiry_date) return 0;
    const now = new Date();
    const expiry = new Date(item.expiry_date);
    const totalLife = item.drugs.shelf_life_months * 30;
    const remaining = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.round((remaining / totalLife) * 100));
  };

  const getStockStatus = (item: any) => {
    if (item.stock_level === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (item.stock_level <= (item.reorder_threshold || 10)) return { label: 'Low Stock', variant: 'destructive' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const filtered = inventory.filter(item => {
    if (categoryFilter !== 'all' && item.drugs?.category !== categoryFilter) return false;
    const status = getStockStatus(item);
    if (statusFilter === 'low' && status.label !== 'Low Stock') return false;
    if (statusFilter === 'ok' && status.label !== 'In Stock') return false;
    if (statusFilter === 'out' && status.label !== 'Out of Stock') return false;
    return true;
  });

  const categories = [...new Set(inventory.map(i => i.drugs?.category).filter(Boolean))];

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ok">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Manually</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Inventory Item (Manual)</DialogTitle></DialogHeader>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">Manually added items are exempt from auto-restock features.</p>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Drug</Label>
                <DrugCombobox
                  drugs={drugs}
                  value={selectedDrug}
                  onSelect={(drug) => {
                    setSelectedDrug(drug);
                    setForm({ ...form, drug_id: drug?.id || '' });
                  }}
                  allowCreate={true}
                  onCreate={createNewDrug}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Batch Number</Label><Input value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })} placeholder="BATCH-001" /></div>
                <div className="space-y-2"><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Stock Level</Label><Input type="number" value={form.stock_level} onChange={e => setForm({ ...form, stock_level: e.target.value })} /></div>
                <div className="space-y-2"><Label>Reorder Threshold</Label><Input type="number" value={form.reorder_threshold} onChange={e => setForm({ ...form, reorder_threshold: e.target.value })} /></div>
              </div>
              <Button onClick={addManualItem} disabled={saving || !form.drug_id} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Add Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Shelf Life %</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Auto-Restock</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No inventory items found</TableCell></TableRow>
                ) : filtered.map(item => {
                  const shelfPct = getRemainingShelfPct(item);
                  const status = getStockStatus(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.drugs?.name}</TableCell>
                      <TableCell>{item.drugs?.category}</TableCell>
                      <TableCell className="font-mono text-xs">{item.batch_number}</TableCell>
                      <TableCell>{new Date(item.expiry_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={shelfPct <= 30 ? 'destructive' : 'secondary'}>{shelfPct}%</Badge>
                      </TableCell>
                      <TableCell>{item.stock_level}</TableCell>
                      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={item.is_manual ? 'outline' : 'default'} className="text-xs">
                          {item.is_manual ? 'Manual' : 'Platform'}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.vendors?.name || '—'}</TableCell>
                      <TableCell>
                        <Switch
                          checked={item.auto_restock}
                          onCheckedChange={() => toggleAutoRestock(item.id, item.auto_restock, item.is_manual)}
                          disabled={item.is_manual}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/pharmacy/inventory/${item.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default PharmacyInventory;
