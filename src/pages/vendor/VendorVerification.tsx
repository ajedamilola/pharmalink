import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, FileText, Award, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const VendorVerification = () => {
  const { appUser } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<{
    cac: File | null;
    nafdac: File | null;
    license: File | null;
  }>({
    cac: null,
    nafdac: null,
    license: null
  });

  const [docs, setDocs] = useState<any[]>([]);

  const loadVendorAndDocs = async () => {
    if (!appUser) return;
    setLoading(true);
    const { data: v } = await (supabase as any)
      .from("vendors")
      .select("*")
      .eq("user_id", appUser.id)
      .maybeSingle();

    setVendor(v);

    if (v) {
      const { data: d } = await (supabase as any)
        .from("vendor_verification_documents")
        .select("*")
        .eq("vendor_id", v.id)
        .order("uploaded_at", { ascending: false });
      setDocs(d || []);
    } else {
      setDocs([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadVendorAndDocs();
  }, [appUser]);

  if (loading) return <Skeleton className='h-64' />;
  if (!vendor)
    return (
      <Card>
        <CardContent className='py-12 text-center text-muted-foreground'>
          Vendor profile not found
        </CardContent>
      </Card>
    );

  const statusBadge = (s: string) => (
    <Badge
      variant={
        s === "verified"
          ? "default"
          : s === "rejected"
            ? "destructive"
            : "secondary"
      }
    >
      {s}
    </Badge>
  );

  const uploadDoc = async (type: "cac" | "nafdac" | "license", file: File) => {
    if (!vendor) return;
    const ext = file.name.split(".").pop();
    const path = `${vendor.id}/${type}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("vendor-verifications")
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { error: insertError } = await (supabase as any)
      .from("vendor_verification_documents")
      .insert({
        vendor_id: vendor.id,
        type,
        file_path: path,
        uploaded_by: appUser?.id ?? null
      });

    if (insertError) throw insertError;
  };

  return (
    <div className='space-y-6'>
      {docs.length > 0 && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <ShieldCheck className='h-5 w-5' />
                Verification Status
              </CardTitle>
              {statusBadge(vendor.verification_status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-3'>
              {[
                {
                  label: "CAC Registration",
                  status: vendor.cac_status,
                  icon: <FileText className='h-5 w-5' />
                },
                {
                  label: "NAFDAC License",
                  status: vendor.nafdac_status,
                  icon: <Award className='h-5 w-5' />
                },
                {
                  label: "Business License",
                  status: vendor.license_status,
                  icon: <FileText className='h-5 w-5' />
                }
              ].map((doc) => (
                <Card key={doc.label}>
                  <CardContent className='flex items-center gap-3 py-4'>
                    <span className='text-muted-foreground'>{doc.icon}</span>
                    <div>
                      <p className='text-sm font-medium'>{doc.label}</p>
                      {statusBadge(doc.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <p>
            <strong>Name:</strong> {vendor.name}
          </p>
          <p>
            <strong>Location:</strong> {vendor.location}
          </p>
          <p>
            <strong>Registered:</strong>{" "}
            {new Date(vendor.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>
            Upload Verification Documents
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <p className='text-sm font-medium'>CAC Registration Document</p>
            <Input
              type='file'
              accept='application/pdf,image/*'
              onChange={(e) =>
                setFiles((prev) => ({
                  ...prev,
                  cac: e.target.files?.[0] || null
                }))
              }
            />
          </div>
          <div className='space-y-2'>
            <p className='text-sm font-medium'>NAFDAC License</p>
            <Input
              type='file'
              accept='application/pdf,image/*'
              onChange={(e) =>
                setFiles((prev) => ({
                  ...prev,
                  nafdac: e.target.files?.[0] || null
                }))
              }
            />
          </div>
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Business License</p>
            <Input
              type='file'
              accept='application/pdf,image/*'
              onChange={(e) =>
                setFiles((prev) => ({
                  ...prev,
                  license: e.target.files?.[0] || null
                }))
              }
            />
          </div>
          <Button
            className='w-full'
            disabled={
              uploading || (!files.cac && !files.nafdac && !files.license)
            }
            onClick={async () => {
              try {
                setUploading(true);
                if (files.cac) await uploadDoc("cac", files.cac);
                if (files.nafdac) await uploadDoc("nafdac", files.nafdac);
                if (files.license) await uploadDoc("license", files.license);
                toast.success("Documents uploaded, waiting for admin approval");
                await loadVendorAndDocs();
              } catch (err) {
                console.error(err);
                toast.error("Failed to upload documents");
              } finally {
                setUploading(false);
              }
            }}
          >
            {uploading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Submit Documents
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorVerification;
