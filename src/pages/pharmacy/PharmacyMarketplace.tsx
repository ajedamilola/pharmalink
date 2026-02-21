import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, ShoppingCart, Trash2 } from 'lucide-react';

interface CartItem {
  listing: any;
  quantity: number;
}

const LOGISTICS_FEE_RATE = 0.05; // 5% of order value

const PharmacyMarketplace = () => {
  const { appUser } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from('marketplace_listings')
        .select('*, drugs(*), vendors(name, verification_status), pharmacies(name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter as any);
      }

      const { data } = await query;
      // Filter out listings from unverified vendors
      const filtered = (data || []).filter(l =>
        l.source === 'buyback' || !l.vendor_id || l.vendors?.verification_status === 'verified'
      );
      setListings(filtered);
      setLoading(false);
    };
    fetch();
  }, [sourceFilter]);

  const addToCart = (listing: any) => {
    const existing = cart.find(c => c.listing.id === listing.id);
    if (existing) {
      setCart(cart.map(c => c.listing.id === listing.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { listing, quantity: 1 }]);
    }
    toast.success(`Added ${listing.drugs?.name} to cart`);
  };

  const removeFromCart = (listingId: string) => {
    setCart(cart.filter(c => c.listing.id !== listingId));
  };

  const cartSubtotal = cart.reduce((sum, c) => sum + c.listing.unit_price * c.quantity, 0);
  const logisticsFee = Math.round(cartSubtotal * LOGISTICS_FEE_RATE * 100) / 100;
  const cartTotal = cartSubtotal + logisticsFee;

  const checkout = async () => {
    if (!appUser) return;
    setCheckingOut(true);

    const { data: ph } = await supabase.from('pharmacies').select('*').eq('user_id', appUser.id).maybeSingle();
    if (!ph) { toast.error('Pharmacy not found'); setCheckingOut(false); return; }
    if (Number(ph.wallet_balance) < cartTotal) { toast.error('Insufficient wallet balance'); setCheckingOut(false); return; }

    for (const item of cart) {
      const itemSubtotal = item.listing.unit_price * item.quantity;
      const itemLogistics = Math.round(itemSubtotal * LOGISTICS_FEE_RATE * 100) / 100;

      await supabase.from('orders').insert({
        pharmacy_id: ph.id,
        vendor_id: item.listing.vendor_id,
        drug_id: item.listing.drug_id,
        quantity: item.quantity,
        unit_price: item.listing.unit_price,
        total_price: itemSubtotal,
        logistics_fee: itemLogistics,
        destination_location: ph.location,
        source: item.listing.source,
      });

      await supabase.from('transactions').insert({
        pharmacy_id: ph.id,
        type: 'debit',
        amount: itemSubtotal + itemLogistics,
        reference: `TXN-MKT-${Date.now()}`,
        description: `Marketplace: ${item.listing.drugs?.name} (incl. ₦${itemLogistics.toLocaleString()} logistics)`,
      });

      await supabase.from('documents').insert({
        pharmacy_id: ph.id,
        type: 'invoice',
        name: `INV-MKT-${Date.now()} - ${item.listing.drugs?.name}`,
      });
    }

    await supabase.from('pharmacies').update({ wallet_balance: Number(ph.wallet_balance) - cartTotal }).eq('id', ph.id);

    setCart([]);
    setCheckoutOpen(false);
    setCheckingOut(false);
    toast.success('Order placed successfully!');
  };

  if (loading) return <div className="grid gap-4 md:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
            <SelectItem value="buyback">Buy-Back</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => setCheckoutOpen(true)} disabled={cart.length === 0}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Cart ({cart.length}) — ₦{cartTotal.toLocaleString()}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {listings.map(listing => (
          <Card key={listing.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm">{listing.drugs?.name}</CardTitle>
                <Badge variant={listing.source === 'buyback' ? 'secondary' : 'default'}>
                  {listing.source}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold">₦{Number(listing.unit_price).toLocaleString()}</div>
              {listing.discount_pct > 0 && <Badge variant="secondary">{listing.discount_pct}% off</Badge>}
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Available: {listing.quantity_available} units</p>
                <p>Lead time: {listing.lead_time_days} days</p>
                <p>From: {listing.vendors?.name || listing.pharmacies?.name || '—'}</p>
              </div>
              <Button size="sm" className="w-full" onClick={() => addToCart(listing)}>Add to Cart</Button>
            </CardContent>
          </Card>
        ))}
        {listings.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">No marketplace listings available</CardContent></Card>
        )}
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Shopping Cart</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.listing.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">{item.listing.drugs?.name}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity} × ₦{Number(item.listing.unit_price).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">₦{(item.listing.unit_price * item.quantity).toLocaleString()}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.listing.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <p className="text-center text-muted-foreground py-4">Cart is empty</p>}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>₦{cartSubtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm text-muted-foreground"><span>Logistics Fee (5%)</span><span>₦{logisticsFee.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>₦{cartTotal.toLocaleString()}</span></div>
            </div>
            <Button onClick={checkout} disabled={checkingOut || cart.length === 0} className="w-full">
              {checkingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Place Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PharmacyMarketplace;
