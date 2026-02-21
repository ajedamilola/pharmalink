import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  confirmed: 'default',
  processing: 'default',
  shipped: 'default',
  in_transit: 'default',
  out_for_delivery: 'default',
  delivered: 'default',
};

const VendorOrders = () => {
  const { appUser } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    if (!appUser) return;
    const { data: v } = await supabase.from('vendors').select('id').eq('user_id', appUser.id).maybeSingle();
    if (!v) { setLoading(false); return; }

    const { data } = await supabase
      .from('orders')
      .select('*, drugs(*), pharmacies(name, location)')
      .eq('vendor_id', v.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [appUser]);

  const updateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setUpdating(true);
    await supabase.from('orders').update({ status: newStatus as any }).eq('id', selectedOrder.id);
    toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
    setSelectedOrder(null);
    setUpdating(false);
    fetchOrders();
  };

  if (loading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug</TableHead>
                <TableHead>Pharmacy</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No orders yet</TableCell></TableRow>
              ) : orders.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.drugs?.name}</TableCell>
                  <TableCell>{o.pharmacies?.name}</TableCell>
                  <TableCell>{o.quantity}</TableCell>
                  <TableCell>₦{Number(o.total_price).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{o.destination_location}</TableCell>
                  <TableCell><Badge variant={statusColors[o.status] || 'secondary'} className="capitalize">{o.status?.replace(/_/g, ' ')}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {o.status !== 'delivered' && (
                      <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(o); setNewStatus(o.status); }}>Update</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Order Status</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm"><strong>Drug:</strong> {selectedOrder?.drugs?.name}</p>
            <p className="text-sm"><strong>Pharmacy:</strong> {selectedOrder?.pharmacies?.name}</p>
            <p className="text-xs text-muted-foreground">Note: Only the destination pharmacy can confirm delivery.</p>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                {/* Delivered is only confirmable by pharmacy */}
              </SelectContent>
            </Select>
            <Button onClick={updateStatus} disabled={updating} className="w-full">
              {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorOrders;
