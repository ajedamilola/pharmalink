import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const AdminPharmacies = () => {
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase.from('pharmacies').select('*, users(name, email)').order('created_at', { ascending: false });
    setPharmacies(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'active' ? 'suspended' : 'active';
    await supabase.from('pharmacies').update({ account_status: next }).eq('id', id);
    toast.success(`Pharmacy ${next}`);
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
              <TableHead>License</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pharmacies.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-xs">{p.users?.name}<br/>{p.users?.email}</TableCell>
                <TableCell>{p.location}</TableCell>
                <TableCell><Badge variant="secondary">{p.pcn_license_status}</Badge></TableCell>
                <TableCell>₦{Number(p.wallet_balance).toLocaleString()}</TableCell>
                <TableCell><Badge variant={p.account_status === 'active' ? 'default' : 'destructive'}>{p.account_status}</Badge></TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(p.id, p.account_status)}>
                    {p.account_status === 'active' ? 'Suspend' : 'Activate'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminPharmacies;
