import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const AdminVendors = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase.from('vendors').select('*, users(name, email, id)').order('created_at', { ascending: false });
    setVendors(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const updateVerification = async (vendorId: string, userId: string, status: 'verified' | 'rejected') => {
    await supabase.from('vendors').update({ verification_status: status }).eq('id', vendorId);
    await supabase.from('notifications').insert({
      user_id: userId,
      message: `Your vendor verification has been ${status}`,
      type: 'system',
    });
    await supabase.from('audit_logs').insert({
      event_type: `vendor_${status}`,
      description: `Vendor verification ${status}`,
      metadata: { vendor_id: vendorId },
    });
    toast.success(`Vendor ${status}`);
    fetch();
  };

  if (loading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>CAC</TableHead>
              <TableHead>NAFDAC</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map(v => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell className="text-xs">{v.users?.name}</TableCell>
                <TableCell>{v.location}</TableCell>
                <TableCell><Badge variant="secondary">{v.cac_status}</Badge></TableCell>
                <TableCell><Badge variant="secondary">{v.nafdac_status}</Badge></TableCell>
                <TableCell><Badge variant="secondary">{v.license_status}</Badge></TableCell>
                <TableCell>
                  <Badge variant={v.verification_status === 'verified' ? 'default' : v.verification_status === 'rejected' ? 'destructive' : 'secondary'}>
                    {v.verification_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {v.verification_status === 'pending' && (
                    <div className="flex gap-1">
                      <Button variant="default" size="sm" onClick={() => updateVerification(v.id, v.users?.id, 'verified')}>Approve</Button>
                      <Button variant="destructive" size="sm" onClick={() => updateVerification(v.id, v.users?.id, 'rejected')}>Reject</Button>
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

export default AdminVendors;
