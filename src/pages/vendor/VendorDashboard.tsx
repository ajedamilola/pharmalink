import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ClipboardList, ShieldCheck, DollarSign, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const VendorDashboard = () => {
  const { appUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!appUser) return;
      const { data: vendor } = await supabase.from('vendors').select('*').eq('user_id', appUser.id).maybeSingle();
      if (!vendor) { setLoading(false); return; }

      const [products, orders] = await Promise.all([
        supabase.from('vendor_products').select('*').eq('vendor_id', vendor.id),
        supabase.from('orders').select('*').eq('vendor_id', vendor.id),
      ]);

      const delivered = (orders.data || []).filter(o => o.status === 'delivered');
      const totalRevenue = delivered.reduce((sum, o) => sum + Number(o.total_price), 0);

      setStats({
        totalProducts: (products.data || []).length,
        activeOrders: (orders.data || []).filter(o => o.status !== 'delivered').length,
        totalOrders: (orders.data || []).length,
        revenue: totalRevenue,
        verificationStatus: vendor.verification_status,
      });
      setLoading(false);
    };
    fetch();
  }, [appUser]);

  if (loading) return <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;

  const isUnverified = stats?.verificationStatus !== 'verified';

  const cards = [
    { title: 'Products', value: stats?.totalProducts || 0, icon: <Package className="h-5 w-5" />, color: 'text-primary' },
    { title: 'Active Orders', value: stats?.activeOrders || 0, icon: <ClipboardList className="h-5 w-5" />, color: 'text-chart-3' },
    { title: 'Total Revenue', value: `₦${(stats?.revenue || 0).toLocaleString()}`, icon: <DollarSign className="h-5 w-5" />, color: 'text-accent' },
    { title: 'Verification', value: stats?.verificationStatus || 'pending', icon: <ShieldCheck className="h-5 w-5" />, color: stats?.verificationStatus === 'verified' ? 'text-accent' : 'text-chart-3' },
  ];

  return (
    <div className="space-y-4">
      {isUnverified && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your vendor account is <strong>not yet verified</strong>. Your products will not appear on the marketplace until an admin verifies your account. Please ensure all required documents (CAC, NAFDAC, License) are submitted via the Verification page.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <span className={c.color}>{c.icon}</span>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold capitalize">{c.value}</div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VendorDashboard;
