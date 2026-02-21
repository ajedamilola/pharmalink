import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from('disputes')
      .select('*, pharmacies(name), vendors(name), orders(drugs(name))')
      .order('created_at', { ascending: false });
    setDisputes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id: string, status: 'resolved' | 'escalated') => {
    await supabase.from('disputes').update({ status: status as any }).eq('id', id);
    toast.success(`Dispute ${status}`);
    fetch();
  };

  if (loading) return <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>Pharmacy</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disputes.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No disputes</TableCell></TableRow>
            ) : disputes.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.issue_type}</TableCell>
                <TableCell>{d.pharmacies?.name}</TableCell>
                <TableCell>{d.vendors?.name}</TableCell>
                <TableCell className="max-w-xs truncate">{d.description}</TableCell>
                <TableCell><Badge variant={d.status === 'open' ? 'destructive' : d.status === 'escalated' ? 'secondary' : 'default'}>{d.status}</Badge></TableCell>
                <TableCell className="text-xs">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {d.status === 'open' && (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => updateStatus(d.id, 'resolved')}>Resolve</Button>
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(d.id, 'escalated')}>Escalate</Button>
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

export default AdminDisputes;
