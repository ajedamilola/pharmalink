import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, Wallet, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PharmacyDashboard = () => {
  const { appUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!appUser) return;
      const { data: pharmacy } = await supabase.from('pharmacies').select('*').eq('user_id', appUser.id).maybeSingle();
      if (!pharmacy) { setLoading(false); return; }

      const [inventory, orders, notifications] = await Promise.all([
        supabase.from('pharmacy_inventory').select('*, drugs(*)').eq('pharmacy_id', pharmacy.id),
        supabase.from('orders').select('*').eq('pharmacy_id', pharmacy.id),
        supabase.from('notifications').select('*').eq('user_id', appUser.id).eq('is_read', false),
      ]);

      const invItems = inventory.data || [];
      const lowStock = invItems.filter(i => i.stock_level <= (i.reorder_threshold || 10)).length;
      const now = new Date();
      const nearExpiry = invItems.filter(i => {
        const exp = new Date(i.expiry_date);
        const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 90 && diff > 0;
      }).length;

      setStats({
        totalItems: invItems.length,
        lowStock,
        nearExpiry,
        walletBalance: pharmacy.wallet_balance,
        pendingOrders: (orders.data || []).filter(o => o.status !== 'delivered').length,
        unreadNotifications: (notifications.data || []).length,
      });
      setLoading(false);
    };
    fetchStats();
  }, [appUser]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  const cards = [
    { title: 'Total Inventory', value: stats?.totalItems || 0, icon: <Package className="h-5 w-5" />, color: 'text-primary' },
    { title: 'Low Stock Items', value: stats?.lowStock || 0, icon: <AlertTriangle className="h-5 w-5" />, color: 'text-destructive' },
    { title: 'Near Expiry', value: stats?.nearExpiry || 0, icon: <AlertTriangle className="h-5 w-5" />, color: 'text-chart-3' },
    { title: 'Wallet Balance', value: `₦${Number(stats?.walletBalance || 0).toLocaleString()}`, icon: <Wallet className="h-5 w-5" />, color: 'text-accent' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <span className={c.color}>{c.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.pendingOrders || 0}</p>
            <p className="text-sm text-muted-foreground">orders in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unread Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.unreadNotifications || 0}</p>
            <p className="text-sm text-muted-foreground">new alerts</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
