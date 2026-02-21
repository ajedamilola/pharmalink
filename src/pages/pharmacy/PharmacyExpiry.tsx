import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const PharmacyExpiry = () => {
  const { appUser } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buybackItem, setBuybackItem] = useState<any>(null);
  const [bbQuantity, setBbQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!appUser) return;
      const { data: ph } = await supabase.from('pharmacies').select('id').eq('user_id', appUser.id).maybeSingle();
      if (!ph) { setLoading(false); return; }

      const { data } = await supabase
        .from('pharmacy_inventory')
        .select('*, drugs(*)')
        .eq('pharmacy_id', ph.id)
        .order('expiry_date', { ascending: true });

      const now = new Date();
      const filtered = (data || []).filter(item => {
        const exp = new Date(item.expiry_date);
        const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 90 && diff > 0;
      }).map(item => {
        const exp = new Date(item.expiry_date);
        const totalLife = (item.drugs?.shelf_life_months || 24) * 30;
        const remaining = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        const shelfPct = Math.max(0, Math.round((remaining / totalLife) * 100));
        const daysLeft = Math.round(remaining);
        const urgency = daysLeft <= 30 ? 'critical' : daysLeft <= 60 ? 'warning' : 'caution';
        return { ...item, shelfPct, daysLeft, urgency };
      });

      setItems(filtered);
      setLoading(false);
    };
    fetch();
  }, [appUser]);

  const submitBuyback = async () => {
    if (!buybackItem || !appUser) return;
    setSubmitting(true);

    const { data: ph } = await supabase.from('pharmacies').select('id').eq('user_id', appUser.id).maybeSingle();
    if (!ph) { setSubmitting(false); return; }

    const price = buybackItem.drugs?.unit_price || 0;
    const bbPrice = buybackItem.shelfPct <= 10 ? price * 0.3 : buybackItem.shelfPct <= 20 ? price * 0.35 : price * 0.4;

    await supabase.from('buyback_requests').insert({
      pharmacy_id: ph.id,
      drug_id: buybackItem.drug_id,
      quantity: bbQuantity,
      original_unit_price: price,
      buyback_unit_price: Math.round(bbPrice * 100) / 100,
      expiry_date: buybackItem.expiry_date,
      remaining_shelf_pct: buybackItem.shelfPct,
    });

    // Notify admin
    const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
    if (admins?.length) {
      await supabase.from('notifications').insert({
        user_id: admins[0].id,
        message: `Buy-back request: ${buybackItem.drugs?.name} (${bbQuantity} units) from ${appUser.name}`,
        type: 'buyback',
      });
    }

    toast.success('Buy-back request submitted!');
    setBuybackItem(null);
    setSubmitting(false);
  };

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;

  const groups = {
    critical: items.filter(i => i.urgency === 'critical'),
    warning: items.filter(i => i.urgency === 'warning'),
    caution: items.filter(i => i.urgency === 'caution'),
  };

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([urgency, group]) => (
        group.length > 0 && (
          <Card key={urgency}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge variant={urgency === 'critical' ? 'destructive' : 'secondary'}>
                  {urgency === 'critical' ? '≤30 days' : urgency === 'warning' ? '31–60 days' : '61–90 days'}
                </Badge>
                {group.length} item{group.length > 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Shelf %</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.drugs?.name}</TableCell>
                      <TableCell className="font-mono text-xs">{item.batch_number}</TableCell>
                      <TableCell>{new Date(item.expiry_date).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant={item.daysLeft <= 30 ? 'destructive' : 'secondary'}>{item.daysLeft}d</Badge></TableCell>
                      <TableCell>{item.shelfPct}%</TableCell>
                      <TableCell>{item.stock_level}</TableCell>
                      <TableCell>
                        {item.shelfPct <= 30 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => { setBuybackItem(item); setBbQuantity(1); }}>
                                Create Buy-Back Request
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Buy-Back Request</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="font-medium">{item.drugs?.name}</p>
                                  <p className="text-sm text-muted-foreground">Shelf life: {item.shelfPct}% remaining</p>
                                </div>
                                <div className="space-y-2">
                                  <Label>Quantity (max: {item.stock_level})</Label>
                                  <Input type="number" min={1} max={item.stock_level} value={bbQuantity} onChange={e => setBbQuantity(Number(e.target.value))} />
                                </div>
                                <div className="rounded-lg bg-muted p-3">
                                  <p className="text-sm">Original price: ₦{item.drugs?.unit_price?.toLocaleString()}/unit</p>
                                  <p className="text-sm font-medium text-accent">
                                    Buy-back price: ₦{Math.round((item.shelfPct <= 10 ? item.drugs?.unit_price * 0.3 : item.shelfPct <= 20 ? item.drugs?.unit_price * 0.35 : item.drugs?.unit_price * 0.4) * 100) / 100}/unit
                                  </p>
                                </div>
                                <Button onClick={submitBuyback} disabled={submitting} className="w-full">
                                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Submit Request
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ))}
      {items.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No items expiring within 90 days 🎉</CardContent></Card>
      )}
    </div>
  );
};

export default PharmacyExpiry;
