import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

const PharmacyProductDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const [item, setItem] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [poHistory, setPoHistory] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!itemId || !appUser) return;

      const { data: ph } = await supabase.from('pharmacies').select('id').eq('user_id', appUser.id).maybeSingle();
      if (!ph) { setLoading(false); return; }

      const { data: invItem } = await supabase
        .from('pharmacy_inventory')
        .select('*, drugs(*), vendors(name)')
        .eq('id', itemId)
        .maybeSingle();
      setItem(invItem);

      if (invItem) {
        const [ordersData, poData, salesData] = await Promise.all([
          supabase.from('orders').select('*, vendors(name)').eq('pharmacy_id', ph.id).eq('drug_id', invItem.drug_id).order('created_at', { ascending: false }),
          supabase.from('purchase_orders').select('*, vendors(name)').eq('pharmacy_id', ph.id).eq('drug_id', invItem.drug_id).order('created_at', { ascending: false }),
          supabase.from('pos_sales').select('*').eq('pharmacy_id', ph.id).eq('drug_id', invItem.drug_id).order('created_at', { ascending: false }),
        ]);
        setOrders(ordersData.data || []);
        setPoHistory(poData.data || []);
        setSales(salesData.data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [itemId, appUser]);

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  if (!item) return <div className="text-center py-12 text-muted-foreground">Item not found</div>;

  const shelfPct = (() => {
    const totalLife = (item.drugs?.shelf_life_months || 24) * 30;
    const remaining = (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.round((remaining / totalLife) * 100));
  })();

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/pharmacy/inventory')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Inventory
      </Button>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Drug</CardTitle></CardHeader><CardContent><p className="text-lg font-bold">{item.drugs?.name}</p><p className="text-xs text-muted-foreground">{item.drugs?.category}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Stock Level</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{item.stock_level}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Shelf Life</CardTitle></CardHeader><CardContent><Badge variant={shelfPct <= 30 ? 'destructive' : 'secondary'} className="text-lg">{shelfPct}%</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Source</CardTitle></CardHeader><CardContent><Badge variant={item.is_manual ? 'secondary' : 'default'}>{item.is_manual ? 'Manual' : 'Platform'}</Badge><p className="text-xs text-muted-foreground mt-1">{item.vendors?.name || '—'}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Batch Number</p><p className="font-mono">{item.batch_number}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Expiry Date</p><p>{new Date(item.expiry_date).toLocaleDateString()}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Unit Price</p><p>₦{Number(item.drugs?.unit_price || 0).toLocaleString()}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="purchase_orders">Purchase Orders ({poHistory.length})</TabsTrigger>
          <TabsTrigger value="sales">POS Sales ({sales.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Qty</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {orders.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No orders</TableCell></TableRow> :
                orders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell>{o.vendors?.name || '—'}</TableCell>
                    <TableCell>{o.quantity}</TableCell>
                    <TableCell>₦{Number(o.total_price).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="secondary">{o.status}</Badge></TableCell>
                    <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="purchase_orders">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Qty</TableHead><TableHead>Total</TableHead><TableHead>Trigger</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {poHistory.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No purchase orders</TableCell></TableRow> :
                poHistory.map(po => (
                  <TableRow key={po.id}>
                    <TableCell>{po.vendors?.name || '—'}</TableCell>
                    <TableCell>{po.quantity}</TableCell>
                    <TableCell>₦{Number(po.total_price).toLocaleString()}</TableCell>
                    <TableCell><Badge variant={po.trigger === 'auto' ? 'default' : 'secondary'}>{po.trigger}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{po.approval_status}</Badge></TableCell>
                    <TableCell className="text-xs">{new Date(po.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Qty</TableHead><TableHead>Total</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {sales.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No sales</TableCell></TableRow> :
                sales.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.quantity}</TableCell>
                    <TableCell>₦{Number(s.total_price).toLocaleString()}</TableCell>
                    <TableCell>{s.customer_name || 'Walk-in'}</TableCell>
                    <TableCell className="text-xs">{new Date(s.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PharmacyProductDetail;
