import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const AdminBuyback = () => {
  const { appUser } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from('buyback_requests')
      .select('*, drugs(*), pharmacies(name, user_id)')
      .order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const approve = async (req: any) => {
    await supabase.from('buyback_requests').update({ status: 'admin_approved' as any }).eq('id', req.id);
    
    // Create marketplace listing
    await supabase.from('marketplace_listings').insert({
      drug_id: req.drug_id,
      source: 'buyback',
      pharmacy_id: req.pharmacy_id,
      unit_price: req.buyback_unit_price,
      discount_pct: Math.round((1 - req.buyback_unit_price / req.original_unit_price) * 100),
      quantity_available: req.quantity,
      status: 'active',
    });

    // Notify pharmacy
    const { data: phUsers } = await supabase.from('users').select('id').eq('id', req.pharmacies?.user_id);
    if (phUsers?.length) {
      await supabase.from('notifications').insert({
        user_id: phUsers[0].id,
        message: `Your buy-back request for ${req.drugs?.name} has been approved`,
        type: 'buyback',
      });
    }

    await supabase.from('audit_logs').insert({
      actor_id: appUser?.id,
      actor_role: 'admin',
      event_type: 'buyback_approved',
      description: `Approved buy-back for ${req.drugs?.name}`,
      metadata: { request_id: req.id },
    });

    toast.success('Buy-back approved and listed on marketplace');
    fetch();
  };

  const decline = async (req: any) => {
    await supabase.from('buyback_requests').update({ status: 'declined' as any }).eq('id', req.id);
    toast.success('Buy-back declined');
    fetch();
  };

  const sendSuggestion = async (pharmacyUserId: string, drugName: string) => {
    await supabase.from('notifications').insert({
      user_id: pharmacyUserId,
      message: `Admin suggests buy-back for ${drugName} (expiring soon)`,
      type: 'admin_suggestion',
    });
    toast.success('Suggestion sent');
  };

  if (loading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Drug</TableHead>
              <TableHead>Pharmacy</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Original Price</TableHead>
              <TableHead>Buyback Price</TableHead>
              <TableHead>Shelf %</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No buy-back requests</TableCell></TableRow>
            ) : requests.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.drugs?.name}</TableCell>
                <TableCell>{r.pharmacies?.name}</TableCell>
                <TableCell>{r.quantity}</TableCell>
                <TableCell>₦{Number(r.original_unit_price).toLocaleString()}</TableCell>
                <TableCell>₦{Number(r.buyback_unit_price).toLocaleString()}</TableCell>
                <TableCell><Badge variant={Number(r.remaining_shelf_pct) <= 10 ? 'destructive' : 'secondary'}>{r.remaining_shelf_pct}%</Badge></TableCell>
                <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                <TableCell>
                  {r.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => approve(r)}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => decline(r)}>Decline</Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminBuyback;
