import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, ShoppingBag } from 'lucide-react';
import { DrugCombobox } from '@/components/ui/drug-combobox';

interface CartLine {
  inventoryId: string;
  quantity: number;
}

const PharmacyPOS = () => {
  const { appUser } = useAuth();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrug, setSelectedDrug] = useState<any>(null);
  const [lineQuantity, setLineQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [selling, setSelling] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);

  const selectedItem = selectedDrug ? inventory.find(i => i.drug_id === selectedDrug.id)?.id : '';

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

  const addLineToCart = () => {
    if (!selectedItem || lineQuantity <= 0) return;
    const item = inventory.find(i => i.id === selectedItem);
    if (!item) return;

    // Check total quantity in cart against stock
    const existingQty = cart
      .filter(l => l.inventoryId === selectedItem)
      .reduce((sum, l) => sum + l.quantity, 0);
    if (existingQty + lineQuantity > item.stock_level) {
      toast.error('Insufficient stock for this quantity');
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(l => l.inventoryId === selectedItem);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + lineQuantity,
        };
        return next;
      }
      return [...prev, { inventoryId: selectedItem, quantity: lineQuantity }];
    });

    setSelectedDrug(null);
    setLineQuantity(1);
  };

  const removeCartLine = (inventoryId: string) => {
    setCart(prev => prev.filter(l => l.inventoryId !== inventoryId));
  };

  const updateCartLineQuantity = (inventoryId: string, quantity: number) => {
    if (quantity <= 0) {
      removeCartLine(inventoryId);
      return;
    }
    const item = inventory.find(i => i.id === inventoryId);
    if (!item) return;

    if (quantity > item.stock_level) {
      toast.error('Insufficient stock for this quantity');
      return;
    }

    setCart(prev => prev.map(l => l.inventoryId === inventoryId ? { ...l, quantity } : l));
  };

  const cartWithDetails = cart.map(line => {
    const item = inventory.find(i => i.id === line.inventoryId);
    return { line, item };
  }).filter(entry => !!entry.item);

  const cartTotal = cartWithDetails.reduce((sum, { line, item }: any) => {
    const unitPrice = item.drugs?.unit_price || 0;
    return sum + unitPrice * line.quantity;
  }, 0);

  const processSale = async () => {
    if (!pharmacy || cartWithDetails.length === 0) return;
    setSelling(true);

    const reference = `POS-${Date.now()}`;

    for (const { line, item } of cartWithDetails as any) {
      const unitPrice = item.drugs?.unit_price || 0;
      const totalPrice = unitPrice * line.quantity;

      // Insert POS sale per line
      await supabase.from('pos_sales').insert({
        pharmacy_id: pharmacy.id,
        inventory_item_id: item.id,
        drug_id: item.drug_id,
        quantity: line.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        customer_name: customerName || null,
      });

      // Reduce stock per line
      await supabase.from('pharmacy_inventory').update({
        stock_level: item.stock_level - line.quantity,
      }).eq('id', item.id);
    }

    // Record single aggregate transaction
    await supabase.from('transactions').insert({
      pharmacy_id: pharmacy.id,
      type: 'credit',
      amount: cartTotal,
      reference,
      description: `POS sale: ${cartWithDetails.length} item(s)`,
    });

    // Update wallet balance once
    await supabase.from('pharmacies').update({
      wallet_balance: Number(pharmacy.wallet_balance) + cartTotal,
    }).eq('id', pharmacy.id);

    toast.success(`Sale processed — ₦${cartTotal.toLocaleString()}`);
    setCart([]);
    setSelectedDrug(null);
    setLineQuantity(1);
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
              <DrugCombobox
                drugs={inventory.map(i => i.drugs).filter(Boolean)}
                value={selectedDrug}
                onSelect={setSelectedDrug}
                allowCreate={false}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                max={selectedInvItem?.stock_level || 999}
                value={lineQuantity}
                onChange={e => setLineQuantity(Number(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Customer Name (optional)</Label>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Walk-in customer" />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={addLineToCart} disabled={!selectedItem || lineQuantity <= 0} className="w-full">
                Add Line
              </Button>
            </div>
          </div>

          {cartWithDetails.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Current Cart</p>
                <p className="text-sm font-semibold">Total: ₦{cartTotal.toLocaleString()}</p>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                {cartWithDetails.map(({ line, item }: any) => (
                  <div key={line.inventoryId} className="flex items-center justify-between text-sm gap-2">
                    <div>
                      <p className="font-medium">{item.drugs?.name}</p>
                      <p className="text-xs text-muted-foreground">Stock: {item.stock_level}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={item.stock_level}
                        value={line.quantity}
                        className="w-16 h-8"
                        onChange={e => updateCartLineQuantity(line.inventoryId, Number(e.target.value) || 1)}
                      />
                      <span className="whitespace-nowrap font-medium">
                        ₦{((item.drugs?.unit_price || 0) * line.quantity).toLocaleString()}
                      </span>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeCartLine(line.inventoryId)}>
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={processSale} disabled={selling || cartWithDetails.length === 0} className="w-full">
                {selling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Process Sale — ₦{cartTotal.toLocaleString()}
              </Button>
            </div>
          )}
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
