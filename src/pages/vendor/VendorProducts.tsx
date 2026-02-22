import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";

const VendorProducts = () => {
  const { appUser } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    drug_id: "",
    unit_price: "",
    moq: "10",
    stock_available: "100",
    lead_time_days: "3"
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    unit_price: "",
    moq: "",
    stock_available: "",
    lead_time_days: ""
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  const getDrugImageUrl = (drugId: string | undefined) => {
    if (!drugId) return null;
    const {
      data: { publicUrl }
    } = supabase.storage.from("product-images").getPublicUrl(`${drugId}.jpg`);
    return publicUrl;
  };

  const fetchProducts = async () => {
    if (!appUser) return;
    const { data: v } = await supabase
      .from("vendors")
      .select("*")
      .eq("user_id", appUser.id)
      .maybeSingle();
    if (!v) {
      setLoading(false);
      return;
    }
    setVendor(v);

    const [prods, allDrugs] = await Promise.all([
      supabase
        .from("vendor_products")
        .select("*, drugs(*)")
        .eq("vendor_id", v.id)
        .order("created_at", { ascending: false }),
      supabase.from("drugs").select("*")
    ]);
    setProducts(prods.data || []);
    setDrugs(allDrugs.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [appUser]);

  const addProduct = async () => {
    if (!vendor || !form.drug_id) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("vendor_products")
      .insert({
        vendor_id: vendor.id,
        drug_id: form.drug_id,
        unit_price: parseFloat(form.unit_price),
        moq: parseInt(form.moq),
        stock_available: parseInt(form.stock_available),
        lead_time_days: parseInt(form.lead_time_days),
        status: "active"
      })
      .select("drug_id")
      .single();

    if (error) {
      console.error(error);
      toast.error("Failed to add product");
      setSaving(false);
      return;
    }

    if (imageFile && data?.drug_id) {
      const path = `${data.drug_id}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, imageFile, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) {
        console.error(uploadError);
        toast.error("Product created but image upload failed");
      }
    }

    toast.success("Product added!");
    setAddOpen(false);
    setForm({
      drug_id: "",
      unit_price: "",
      moq: "10",
      stock_available: "100",
      lead_time_days: "3"
    });
    setImageFile(null);
    setSaving(false);
    fetchProducts();
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setEditForm({
      unit_price: product.unit_price?.toString() || "",
      moq: product.moq?.toString() || "",
      stock_available: product.stock_available?.toString() || "",
      lead_time_days: product.lead_time_days?.toString() || ""
    });
    setEditImageFile(null);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editingProduct) return;
    setEditSaving(true);
    const { data, error } = await supabase
      .from("vendor_products")
      .update({
        unit_price: parseFloat(editForm.unit_price),
        moq: parseInt(editForm.moq),
        stock_available: parseInt(editForm.stock_available),
        lead_time_days: parseInt(editForm.lead_time_days)
      })
      .eq("id", editingProduct.id)
      .select("drug_id")
      .single();

    if (error) {
      console.error(error);
      toast.error("Failed to update product");
      setEditSaving(false);
      return;
    }

    if (editImageFile && (data?.drug_id || editingProduct.drug_id)) {
      const drugIdForImage = data?.drug_id || editingProduct.drug_id;
      const path = `${drugIdForImage}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, editImageFile, {
          upsert: true,
          contentType: "image/jpeg"
        });
      if (uploadError) {
        console.error(uploadError);
        toast.error("Product updated but image upload failed");
      }
    }

    toast.success("Product updated");
    setEditOpen(false);
    setEditingProduct(null);
    setEditImageFile(null);
    setEditSaving(false);
    fetchProducts();
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "active" ? "inactive" : "active";
    await supabase
      .from("vendor_products")
      .update({ status: next as any })
      .eq("id", id);
    toast.success(`Product ${next}`);
    fetchProducts();
  };

  if (loading)
    return (
      <div className='space-y-3'>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className='h-16' />
        ))}
      </div>
    );

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label>Drug</Label>
                <Select
                  value={form.drug_id}
                  onValueChange={(v) => {
                    const d = drugs.find((dr) => dr.id === v);
                    setForm({
                      ...form,
                      drug_id: v,
                      unit_price: d?.unit_price?.toString() || ""
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select drug' />
                  </SelectTrigger>
                  <SelectContent>
                    {drugs.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-2'>
                  <Label>Unit Price (₦)</Label>
                  <Input
                    type='number'
                    value={form.unit_price}
                    onChange={(e) =>
                      setForm({ ...form, unit_price: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>MOQ</Label>
                  <Input
                    type='number'
                    value={form.moq}
                    onChange={(e) => setForm({ ...form, moq: e.target.value })}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Stock Available</Label>
                  <Input
                    type='number'
                    value={form.stock_available}
                    onChange={(e) =>
                      setForm({ ...form, stock_available: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Lead Time (days)</Label>
                  <Input
                    type='number'
                    value={form.lead_time_days}
                    onChange={(e) =>
                      setForm({ ...form, lead_time_days: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label>Product Image</Label>
                <Input
                  type='file'
                  accept='image/*'
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button
                onClick={addProduct}
                disabled={saving || !form.drug_id}
                className='w-full'
              >
                {saving ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : null}
                Save Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>MOQ</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Product active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className='text-center py-8 text-muted-foreground'
                  >
                    No products yet
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className='font-medium'>
                      {p.drugs?.name}
                    </TableCell>
                    <TableCell>{p.drugs?.category}</TableCell>
                    <TableCell>
                      {getDrugImageUrl(p.drug_id) ? (
                        <img
                          src={getDrugImageUrl(p.drug_id) || ""}
                          alt={p.drugs?.name}
                          className='h-12 w-12 object-cover rounded-md'
                        />
                      ) : (
                        <span className='text-xs text-muted-foreground'>
                          No image
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      ₦{Number(p.unit_price).toLocaleString()}
                    </TableCell>
                    <TableCell>{p.moq}</TableCell>
                    <TableCell>{p.stock_available}</TableCell>
                    <TableCell>{p.lead_time_days}d</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "active" ? "default" : "secondary"
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={p.status === "active"}
                        onCheckedChange={() => toggleStatus(p.id, p.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label>Unit Price (₦)</Label>
                <Input
                  type='number'
                  value={editForm.unit_price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, unit_price: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>MOQ</Label>
                <Input
                  type='number'
                  value={editForm.moq}
                  onChange={(e) =>
                    setEditForm({ ...editForm, moq: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>Stock Available</Label>
                <Input
                  type='number'
                  value={editForm.stock_available}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      stock_available: e.target.value
                    })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>Lead Time (days)</Label>
                <Input
                  type='number'
                  value={editForm.lead_time_days}
                  onChange={(e) =>
                    setEditForm({ ...editForm, lead_time_days: e.target.value })
                  }
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Product Image</Label>
              <Input
                type='file'
                accept='image/*'
                onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button onClick={saveEdit} disabled={editSaving} className='w-full'>
              {editSaving ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorProducts;
