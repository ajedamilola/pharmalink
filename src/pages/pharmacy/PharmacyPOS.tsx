import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, ShoppingBag } from 'lucide-react';

const PharmacyPOS = () => {
  const { appUser } = useAuth();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [selling, setSelling] = useState(false);

  const fetchData = useCallback(async () => {
    if (!appUser) return;
    const { data: ph } = await supabase.from('pharmacies').select('*').eq('user_id', appUser.id).maybeSingle();
    if (!ph) { setLoading(false); return; }
    setPharmacy(ph);

    const [inv, salesData] = await Promise.all([
      supabase.from('pharmacy_inventory').select('*, drugs(*)').eq('pharmacy_id', ph.id).gt('stock_level', 0).order('created_at', { ascending: false }),
      supabase.from('pos_sales').select('*, drugs(name)').eq('pharmacy_id', ph.id).order('created_at', { ascending: false }).limit(50),
    ]);
    setInventory(inv.data || []);
    setSales(salesData.data || []);
    setLoading(false);
  }, [appUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const processSale = async () => {
    if (!pharmacy || !selectedItem) return;
    setSelling(true);

    const item = inventory.find(i => i.id === selectedItem);
    if (!item) { toast.error('Item not found'); setSelling(false); return; }
    if (quantity > item.stock_level) { toast.error('Insufficient stock'); setSelling(false); return; }

    const unitPrice = item.drugs?.unit_price || 0;
    const totalPrice = unitPrice * quantity;

    // Insert POS sale
    await supabase.from('pos_sales').insert({
      pharmacy_id: pharmacy.id,
      inventory_item_id: item.id,
      drug_id: item.drug_id,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      customer_name: customerName || null,
    });

    // Reduce stock
    await supabase.from('pharmacy_inventory').update({
      stock_level: item.stock_level - quantity,
    }).eq('id', item.id);

    // Record transaction
    await supabase.from('transactions').insert({
      pharmacy_id: pharmacy.id,
      type: 'credit',
      amount: totalPrice,
      reference: `POS-${Date.now()}`,
      description: `POS sale: ${item.drugs?.name} x${quantity}`,
    });

    // Update wallet balance
    await supabase.from('pharmacies').update({
      wallet_balance: Number(pharmacy.wallet_balance) + totalPrice,
    }).eq('id', pharmacy.id);

    toast.success(`Sale processed: ${item.drugs?.name} x${quantity} — ₦${totalPrice.toLocaleString()}`);
    setSelectedItem('');
    setQuantity(1);
    setCustomerName('');
    setSelling(false);
    fetchData();
  };

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  const selectedInvItem = inventory.find(i => i.id === selectedItem);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShoppingBag className="h-5 w-5" /> New Sale</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Drug</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger><SelectValue placeholder="Select drug" /></SelectTrigger>
                <SelectContent>
                  {inventory.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.drugs?.name} (Stock: {item.stock_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min={1} max={selectedInvItem?.stock_level || 999} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Customer Name (optional)</Label>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Walk-in customer" />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={processSale} disabled={selling || !selectedItem} className="w-full">
                {selling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Process Sale {selectedInvItem ? `— ₦${((selectedInvItem.drugs?.unit_price || 0) * quantity).toLocaleString()}` : ''}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Sales</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No sales recorded yet</TableCell></TableRow>
              ) : sales.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.drugs?.name}</TableCell>
                  <TableCell>{s.quantity}</TableCell>
                  <TableCell>₦{Number(s.unit_price).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">₦{Number(s.total_price).toLocaleString()}</TableCell>
                  <TableCell>{s.customer_name || 'Walk-in'}</TableCell>
                  <TableCell className="text-xs">{new Date(s.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyPOS;
