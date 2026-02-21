import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, ShoppingCart, AlertTriangle, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['hsl(220,60%,25%)', 'hsl(152,60%,42%)', 'hsl(38,92%,50%)', 'hsl(200,70%,50%)'];

const AdminOverview = () => {
  const [stats, setStats] = useState<any>(null);
  const [ordersByDate, setOrdersByDate] = useState<any[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [pharmacies, vendors, orders, buybacks, disputes] = await Promise.all([
        supabase.from('pharmacies').select('id', { count: 'exact', head: true }),
        supabase.from('vendors').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('*'),
        supabase.from('buyback_requests').select('id', { count: 'exact', head: true }),
        supabase.from('disputes').select('id', { count: 'exact', head: true }),
      ]);

      const allOrders = orders.data || [];
      const totalRevenue = allOrders.reduce((s, o) => s + Number(o.total_price), 0);
      
      // Profit calculation: logistics_fee (our charge) - actual_logistics_cost
      const totalLogisticsFees = allOrders.reduce((s, o) => s + Number(o.logistics_fee || 0), 0);
      const totalActualCost = allOrders.reduce((s, o) => s + Number(o.actual_logistics_cost || 0), 0);
      const logisticsProfit = totalLogisticsFees - totalActualCost;

      setStats({
        pharmacies: pharmacies.count || 0,
        vendors: vendors.count || 0,
        orders: allOrders.length,
        buybacks: buybacks.count || 0,
        disputes: disputes.count || 0,
        revenue: totalRevenue,
        logisticsFees: totalLogisticsFees,
        actualCost: totalActualCost,
        logisticsProfit,
      });

      // Group orders by date
      const dateMap: Record<string, number> = {};
      allOrders.forEach(o => {
        const d = new Date(o.created_at).toLocaleDateString();
        dateMap[d] = (dateMap[d] || 0) + 1;
      });
      setOrdersByDate(Object.entries(dateMap).map(([date, count]) => ({ date, orders: count })));

      // Group by status
      const statusMap: Record<string, number> = {};
      allOrders.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
      setOrdersByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="grid gap-4 md:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;

  const cards = [
    { title: 'Pharmacies', value: stats?.pharmacies, icon: <Building2 className="h-5 w-5" /> },
    { title: 'Vendors', value: stats?.vendors, icon: <Users className="h-5 w-5" /> },
    { title: 'Total Orders', value: stats?.orders, icon: <ShoppingCart className="h-5 w-5" /> },
    { title: 'Order Revenue', value: `₦${(stats?.revenue || 0).toLocaleString()}`, icon: <DollarSign className="h-5 w-5" /> },
    { title: 'Buy-Back Requests', value: stats?.buybacks, icon: <Clock className="h-5 w-5" /> },
    { title: 'Open Disputes', value: stats?.disputes, icon: <AlertTriangle className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{c.title}</CardTitle>
              <span className="text-primary">{c.icon}</span>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{c.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Logistics Profit Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Logistics Fees Collected</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">₦{(stats?.logisticsFees || 0).toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Actual Logistics Cost</CardTitle>
            <DollarSign className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">₦{(stats?.actualCost || 0).toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Logistics Profit</CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.logisticsProfit || 0) >= 0 ? 'text-accent' : 'text-destructive'}`}>
              ₦{(stats?.logisticsProfit || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Orders Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ordersByDate}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="hsl(220,60%,25%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Orders by Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
