/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Wallet as WalletIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import axios from 'axios';
import { usePaystackPayment } from 'react-paystack';
import CurrencyInput from 'react-currency-input-field';

const PharmacyWallet = () => {
  const { appUser } = useAuth();
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!appUser) return;
      const { data: ph } = await supabase.from('pharmacies').select('*').eq('user_id', appUser.id).maybeSingle();
      if (!ph) { setLoading(false); return; }
      setPharmacy(ph);

      const { data: txns } = await supabase
        .from('transactions')
        .select('*')
        .eq('pharmacy_id', ph.id)
        .order('created_at', { ascending: false });
      setTransactions(txns || []);
      setLoading(false);
    };
    fetch();
  }, [appUser]);

  const config = useMemo(() => ({
    reference: (new Date()).getTime().toString(),
    email: "user@example.com",
    amount: parseFloat(topUpAmount.replace(/,/g, '')) * 100 || 0,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  }), [topUpAmount]);


  const initializePayment = usePaystackPayment(config);

  // you can call this function anything
  const onSuccess = async (reference) => {
    if (!pharmacy || !topUpAmount) return;
    setTopUpLoading(true);
    const amount = parseFloat(topUpAmount.replace(/,/g, ''));
    await supabase.from('pharmacies').update({ wallet_balance: Number(pharmacy.wallet_balance) + amount }).eq('id', pharmacy.id);
    await supabase.from('transactions').insert({
      pharmacy_id: pharmacy.id,
      type: 'credit',
      amount,
      reference: `TXN-TOPUP-${Date.now()}`,
      description: 'Wallet top-up',
    });
    setPharmacy({ ...pharmacy, wallet_balance: Number(pharmacy.wallet_balance) + amount });
    setTransactions(prev => [{ type: 'credit', amount, description: 'Wallet top-up', created_at: new Date().toISOString(), reference: `TXN-TOPUP-${Date.now()}` }, ...prev]);
    setTopUpAmount('');
    setTopUpLoading(false);
    toast.success(`₦${amount.toLocaleString()} added to wallet`);
  };

  // you can call this function anything
  const onClose = () => {
    // implementation for  whatever you want to do when the Paystack dialog closed.
    console.log('closed')
  }

  const handleTopUp = async () => {
    initializePayment({
      onClose,
      onSuccess
    });
  };

  const handlePaymentInit = async () => {
    const resp = await axios.post('/api/payment/init', {
      amount: topUpAmount,

    }, {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SQUADCO_SECRET_KEY}`,
      },
    });

  }

  const toggleDirectDebit = async () => {
    if (!pharmacy) return;
    await supabase.from('pharmacies').update({ direct_debit_enabled: !pharmacy.direct_debit_enabled }).eq('id', pharmacy.id);
    setPharmacy({ ...pharmacy, direct_debit_enabled: !pharmacy.direct_debit_enabled });
    toast.success(`Direct debit ${!pharmacy.direct_debit_enabled ? 'enabled' : 'disabled'}`);
  };

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Wallet Balance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <WalletIcon className="h-6 w-6 text-accent" />
              <span className="text-3xl font-bold">₦{Number(pharmacy?.wallet_balance || 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Top Up Wallet</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <CurrencyInput
              value={topUpAmount}
              onValueChange={(value) => setTopUpAmount(value || '')}
              placeholder="Amount (₦)"
              prefix="₦"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button onClick={handleTopUp} disabled={topUpLoading || !topUpAmount} className="w-full" size="sm">
              {topUpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Top Up
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Direct Debit</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch checked={pharmacy?.direct_debit_enabled} onCheckedChange={toggleDirectDebit} />
              <Label>{pharmacy?.direct_debit_enabled ? 'Enabled' : 'Disabled'}</Label>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Auto-debit for approved purchase orders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Transaction History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No transactions yet</TableCell></TableRow>
              ) : transactions.map((txn, i) => (
                <TableRow key={txn.id || i}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {txn.type === 'credit' ? <ArrowDownRight className="h-4 w-4 text-accent" /> : <ArrowUpRight className="h-4 w-4 text-destructive" />}
                      <Badge variant={txn.type === 'credit' ? 'default' : 'destructive'}>{txn.type}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">₦{Number(txn.amount).toLocaleString()}</TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell className="font-mono text-xs">{txn.reference}</TableCell>
                  <TableCell>{new Date(txn.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyWallet;
