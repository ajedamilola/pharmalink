import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 15;

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];

const PharmacyOrders = () => {
  const { appUser } = useAuth();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = useCallback(async () => {
    if (!appUser) return;
    setLoading(true);
    const { data: ph } = await supabase.from('pharmacies').select('id').eq('user_id', appUser.id).maybeSingle();
    if (!ph) { setLoading(false); return; }
    setPharmacy(ph);

    let query = supabase
      .from('orders')
      .select('*, drugs(name), vendors(name)', { count: 'exact' })
      .eq('pharmacy_id', ph.id)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter as any);
    }

    const { data, count } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setOrders(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [appUser, page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const confirmDelivery = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'delivered' as any }).eq('id', orderId);
    toast.success('Delivery confirmed');
    fetchOrders();
  };

  if (loading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusSteps.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Logistics Fee</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Logistics</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No orders found</TableCell></TableRow>
              ) : orders.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.drugs?.name}</TableCell>
                  <TableCell>{o.vendors?.name || '—'}</TableCell>
                  <TableCell>{o.quantity}</TableCell>
                  <TableCell>₦{Number(o.total_price).toLocaleString()}</TableCell>
                  <TableCell>₦{Number(o.logistics_fee || 0).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">₦{(Number(o.total_price) + Number(o.logistics_fee || 0)).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{o.status?.replace(/_/g, ' ')}</Badge></TableCell>
                  <TableCell className="text-xs">{o.logistics_partner || '—'}</TableCell>
                  <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {o.status === 'out_for_delivery' && (
                      <Button size="sm" onClick={() => confirmDelivery(o.id)}>Confirm Delivery</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

export default PharmacyOrders;
