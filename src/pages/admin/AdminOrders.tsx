import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AdminOrders = () => {
  const { appUser } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [logistics, setLogistics] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, drugs(*), pharmacies(name), vendors(name)')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const assignLogistics = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    const updates: any = {};
    if (logistics) updates.logistics_partner = logistics;
    if (actualCost) updates.actual_logistics_cost = parseFloat(actualCost);

    await supabase.from('orders').update(updates).eq('id', selectedOrder.id);

    if (appUser) {
      await supabase.from('audit_logs').insert({
        actor_id: appUser.id,
        actor_role: 'admin',
        event_type: 'logistics_assigned',
        description: `Assigned ${logistics} to order for ${selectedOrder.drugs?.name}`,
        metadata: { order_id: selectedOrder.id, logistics_partner: logistics, actual_cost: actualCost },
      });
    }

    toast.success('Order updated');
    setSelectedOrder(null);
    setLogistics('');
    setActualCost('');
    setSaving(false);
    fetch();
  };

  if (loading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug</TableHead>
                  <TableHead>Pharmacy</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Logistics Fee</TableHead>
                  <TableHead>Actual Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Logistics</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.drugs?.name}</TableCell>
                    <TableCell>{o.pharmacies?.name}</TableCell>
                    <TableCell>{o.vendors?.name || '—'}</TableCell>
                    <TableCell>{o.quantity}</TableCell>
                    <TableCell>₦{Number(o.total_price).toLocaleString()}</TableCell>
                    <TableCell>₦{Number(o.logistics_fee || 0).toLocaleString()}</TableCell>
                    <TableCell>₦{Number(o.actual_logistics_cost || 0).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{o.status?.replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell>{o.logistics_partner || '—'}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(o); setLogistics(o.logistics_partner || ''); setActualCost(o.actual_logistics_cost?.toString() || ''); }}>Manage</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage Order Logistics</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Logistics Partner</Label>
              <Select value={logistics} onValueChange={setLogistics}>
                <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GIG Logistics">GIG Logistics</SelectItem>
                  <SelectItem value="DHL Nigeria">DHL Nigeria</SelectItem>
                  <SelectItem value="FedEx Nigeria">FedEx Nigeria</SelectItem>
                  <SelectItem value="Kwik Delivery">Kwik Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Actual Logistics Cost (₦)</Label>
              <Input type="number" value={actualCost} onChange={e => setActualCost(e.target.value)} placeholder="Enter actual cost" />
              <p className="text-xs text-muted-foreground">Logistics fee charged: ₦{Number(selectedOrder?.logistics_fee || 0).toLocaleString()} — Profit = fee − cost</p>
            </div>
            <Button onClick={assignLogistics} disabled={saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
