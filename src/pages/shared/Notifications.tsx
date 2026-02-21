import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Info, ShoppingCart, Package, Clock, Star } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  system: <Info className="h-4 w-4" />,
  order: <ShoppingCart className="h-4 w-4" />,
  restock: <Package className="h-4 w-4" />,
  buyback: <Clock className="h-4 w-4" />,
  admin_suggestion: <Star className="h-4 w-4" />,
};

const Notifications = () => {
  const { appUser } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!appUser) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', appUser.id)
      .order('created_at', { ascending: false });
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, [appUser]);

  useEffect(() => {
    if (!appUser) return;
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${appUser.id}` }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [appUser]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-3">
      {notifications.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Bell className="h-8 w-8" />
          <p>No notifications</p>
        </CardContent></Card>
      )}
      {notifications.map(n => (
        <Card key={n.id} className={n.is_read ? 'opacity-60' : 'border-l-4 border-l-primary'} onClick={() => !n.is_read && markRead(n.id)} role="button">
          <CardContent className="flex items-start gap-3 py-4">
            <span className={n.type === 'admin_suggestion' ? 'text-chart-3' : 'text-primary'}>{iconMap[n.type] || iconMap.system}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">{n.type}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Notifications;
