import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, FileText, Award } from 'lucide-react';

const VendorVerification = () => {
  const { appUser } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!appUser) return;
      const { data } = await supabase.from('vendors').select('*').eq('user_id', appUser.id).maybeSingle();
      setVendor(data);
      setLoading(false);
    };
    fetch();
  }, [appUser]);

  if (loading) return <Skeleton className="h-64" />;
  if (!vendor) return <Card><CardContent className="py-12 text-center text-muted-foreground">Vendor profile not found</CardContent></Card>;

  const statusBadge = (s: string) => <Badge variant={s === 'verified' ? 'default' : s === 'rejected' ? 'destructive' : 'secondary'}>{s}</Badge>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Verification Status</CardTitle>
            {statusBadge(vendor.verification_status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'CAC Registration', status: vendor.cac_status, icon: <FileText className="h-5 w-5" /> },
              { label: 'NAFDAC License', status: vendor.nafdac_status, icon: <Award className="h-5 w-5" /> },
              { label: 'Business License', status: vendor.license_status, icon: <FileText className="h-5 w-5" /> },
            ].map(doc => (
              <Card key={doc.label}>
                <CardContent className="flex items-center gap-3 py-4">
                  <span className="text-muted-foreground">{doc.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{doc.label}</p>
                    {statusBadge(doc.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Vendor Information</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Name:</strong> {vendor.name}</p>
          <p><strong>Location:</strong> {vendor.location}</p>
          <p><strong>Registered:</strong> {new Date(vendor.created_at).toLocaleDateString()}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorVerification;
