import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Download, FileText } from 'lucide-react';

const PharmacyDocuments = () => {
  const { appUser } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      if (!appUser) return;
      const { data: ph } = await supabase.from('pharmacies').select('id').eq('user_id', appUser.id).maybeSingle();
      if (!ph) { setLoading(false); return; }

      let query = supabase.from('documents').select('*').eq('pharmacy_id', ph.id).order('created_at', { ascending: false });
      if (typeFilter !== 'all') query = query.eq('type', typeFilter as any);

      const { data } = await query;
      setDocuments(data || []);
      setLoading(false);
    };
    fetch();
  }, [appUser, typeFilter]);

  const mockDownload = (name: string) => {
    toast.success(`Downloading ${name}...`);
    setTimeout(() => toast.info('Download complete (mock)'), 1500);
  };

  if (loading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="space-y-4">
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Document Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="invoice">Invoice</SelectItem>
          <SelectItem value="purchase_order">Purchase Order</SelectItem>
          <SelectItem value="buyback_receipt">Buy-Back Receipt</SelectItem>
          <SelectItem value="statement">Statement</SelectItem>
        </SelectContent>
      </Select>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />No documents found
                </TableCell></TableRow>
              ) : documents.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell><Badge variant="secondary">{doc.type}</Badge></TableCell>
                  <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => mockDownload(doc.name)}>
                      <Download className="mr-1 h-4 w-4" />Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyDocuments;
