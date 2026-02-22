import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const VendorProfile = () => {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState<any | null>(null);
  const [form, setForm] = useState({
    user_name: "",
    vendor_name: "",
    location: ""
  });

  useEffect(() => {
    const load = async () => {
      if (!appUser) return;
      setLoading(true);

      const { data: vendorRow, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", appUser.id)
        .maybeSingle();

      if (error || !vendorRow) {
        setLoading(false);
        return;
      }

      setVendor(vendorRow);
      setForm({
        user_name: appUser.name ?? "",
        vendor_name: vendorRow.name ?? "",
        location: vendorRow.location ?? ""
      });
      setLoading(false);
    };

    load();
  }, [appUser]);

  const save = async () => {
    if (!appUser || !vendor) return;
    setSaving(true);

    const { error: userErr } = await supabase
      .from("users")
      .update({ name: form.user_name })
      .eq("id", appUser.id);

    const { error: vendorErr } = await supabase
      .from("vendors")
      .update({
        name: form.vendor_name,
        location: form.location
      })
      .eq("id", vendor.id);

    if (userErr || vendorErr) {
      toast.error("Failed to update profile");
      setSaving(false);
      return;
    }

    toast.success("Profile updated");
    setSaving(false);
  };

  if (loading) {
    return <Skeleton className='h-48' />;
  }

  if (!vendor) {
    return <div>No vendor profile found.</div>;
  }

  return (
    <Card>
      <CardContent className='space-y-4 pt-6 max-w-xl'>
        <div className='space-y-2'>
          <Label>User Name</Label>
          <Input
            value={form.user_name}
            onChange={(e) => setForm({ ...form, user_name: e.target.value })}
          />
        </div>
        <div className='space-y-2'>
          <Label>Vendor Name</Label>
          <Input
            value={form.vendor_name}
            onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
          />
        </div>
        <div className='space-y-2'>
          <Label>Location</Label>
          <Input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
        <Button className='w-full' disabled={saving} onClick={save}>
          {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
};

export default VendorProfile;
