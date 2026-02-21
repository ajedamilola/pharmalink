
-- Create enum types
CREATE TYPE public.user_role AS ENUM ('pharmacy', 'vendor', 'admin');
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'dispatched', 'delivered');
CREATE TYPE public.order_source AS ENUM ('vendor', 'buyback');
CREATE TYPE public.po_trigger AS ENUM ('auto', 'manual');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'fulfilled');
CREATE TYPE public.approval_mode AS ENUM ('auto', 'manual');
CREATE TYPE public.buyback_status AS ENUM ('pending', 'admin_approved', 'vendor_matched', 'completed', 'declined');
CREATE TYPE public.listing_status AS ENUM ('active', 'sold');
CREATE TYPE public.transaction_type AS ENUM ('debit', 'credit');
CREATE TYPE public.notification_type AS ENUM ('system', 'admin_suggestion', 'order', 'restock', 'buyback');
CREATE TYPE public.dispute_status AS ENUM ('open', 'resolved', 'escalated');
CREATE TYPE public.document_type AS ENUM ('invoice', 'purchase_order', 'buyback_receipt', 'statement');
CREATE TYPE public.product_status AS ENUM ('active', 'inactive');

-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'pharmacy',
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own record" ON public.users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Admins can read all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
);
CREATE POLICY "Allow insert during seeding" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own record" ON public.users FOR UPDATE USING (auth.uid() = auth_id);

-- Pharmacies table
CREATE TABLE public.pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  pcn_license_status TEXT DEFAULT 'active',
  wallet_balance NUMERIC(12,2) DEFAULT 0,
  account_status TEXT DEFAULT 'active',
  direct_debit_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pharmacies readable by owner and admins" ON public.pharmacies FOR SELECT USING (true);
CREATE POLICY "Pharmacies insertable" ON public.pharmacies FOR INSERT WITH CHECK (true);
CREATE POLICY "Pharmacies updatable by owner" ON public.pharmacies FOR UPDATE USING (
  user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
);

-- Vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  cac_status TEXT DEFAULT 'verified',
  nafdac_status TEXT DEFAULT 'verified',
  license_status TEXT DEFAULT 'verified',
  verification_status verification_status DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendors readable" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Vendors insertable" ON public.vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Vendors updatable" ON public.vendors FOR UPDATE USING (
  user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
);

-- Drugs table
CREATE TABLE public.drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  nafdac_number TEXT,
  shelf_life_months INTEGER NOT NULL DEFAULT 24,
  unit_price NUMERIC(10,2) NOT NULL,
  description TEXT
);
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drugs readable by all" ON public.drugs FOR SELECT USING (true);
CREATE POLICY "Drugs insertable" ON public.drugs FOR INSERT WITH CHECK (true);

-- Pharmacy Inventory
CREATE TABLE public.pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE NOT NULL,
  drug_id UUID REFERENCES public.drugs(id) ON DELETE CASCADE NOT NULL,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  stock_level INTEGER NOT NULL DEFAULT 0,
  reorder_threshold INTEGER NOT NULL DEFAULT 10,
  vendor_id UUID REFERENCES public.vendors(id),
  auto_restock BOOLEAN DEFAULT false,
  approval_mode approval_mode DEFAULT 'manual',
  reorder_quantity INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inventory readable" ON public.pharmacy_inventory FOR SELECT USING (true);
CREATE POLICY "Inventory insertable" ON public.pharmacy_inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Inventory updatable" ON public.pharmacy_inventory FOR UPDATE USING (true);

-- Vendor Products
CREATE TABLE public.vendor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  drug_id UUID REFERENCES public.drugs(id) ON DELETE CASCADE NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  moq INTEGER DEFAULT 1,
  stock_available INTEGER NOT NULL DEFAULT 0,
  lead_time_days INTEGER DEFAULT 3,
  status product_status DEFAULT 'active',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendor products readable" ON public.vendor_products FOR SELECT USING (true);
CREATE POLICY "Vendor products insertable" ON public.vendor_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Vendor products updatable" ON public.vendor_products FOR UPDATE USING (true);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES public.pharmacies(id) NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id),
  drug_id UUID REFERENCES public.drugs(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  status order_status DEFAULT 'pending',
  destination_location TEXT,
  logistics_partner TEXT,
  source order_source DEFAULT 'vendor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders readable" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Orders insertable" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders updatable" ON public.orders FOR UPDATE USING (true);

-- Purchase Orders
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES public.pharmacies(id) NOT NULL,
  drug_id UUID REFERENCES public.drugs(id) NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  trigger po_trigger DEFAULT 'manual',
  approval_status approval_status DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PO readable" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "PO insertable" ON public.purchase_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "PO updatable" ON public.purchase_orders FOR UPDATE USING (true);

-- Buyback Requests
CREATE TABLE public.buyback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES public.pharmacies(id) NOT NULL,
  drug_id UUID REFERENCES public.drugs(id) NOT NULL,
  quantity INTEGER NOT NULL,
  original_unit_price NUMERIC(10,2) NOT NULL,
  buyback_unit_price NUMERIC(10,2) NOT NULL,
  expiry_date DATE NOT NULL,
  remaining_shelf_pct NUMERIC(5,2),
  status buyback_status DEFAULT 'pending',
  admin_suggestion BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.buyback_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyback readable" ON public.buyback_requests FOR SELECT USING (true);
CREATE POLICY "Buyback insertable" ON public.buyback_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Buyback updatable" ON public.buyback_requests FOR UPDATE USING (true);

-- Marketplace Listings
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_id UUID REFERENCES public.drugs(id) NOT NULL,
  source order_source DEFAULT 'vendor',
  vendor_id UUID REFERENCES public.vendors(id),
  pharmacy_id UUID REFERENCES public.pharmacies(id),
  unit_price NUMERIC(10,2) NOT NULL,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  lead_time_days INTEGER DEFAULT 3,
  status listing_status DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listings readable" ON public.marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Listings insertable" ON public.marketplace_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Listings updatable" ON public.marketplace_listings FOR UPDATE USING (true);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES public.pharmacies(id) NOT NULL,
  type transaction_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  reference TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Transactions readable" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Transactions insertable" ON public.transactions FOR INSERT WITH CHECK (true);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'system',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notifications readable by owner" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Notifications insertable" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Notifications updatable" ON public.notifications FOR UPDATE USING (true);

-- Disputes
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES public.pharmacies(id) NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id) NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  issue_type TEXT NOT NULL,
  description TEXT,
  status dispute_status DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Disputes readable" ON public.disputes FOR SELECT USING (true);
CREATE POLICY "Disputes insertable" ON public.disputes FOR INSERT WITH CHECK (true);
CREATE POLICY "Disputes updatable" ON public.disputes FOR UPDATE USING (true);

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES public.pharmacies(id) NOT NULL,
  type document_type NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Documents readable" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Documents insertable" ON public.documents FOR INSERT WITH CHECK (true);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.users(id),
  actor_role user_role,
  event_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit logs readable by admins" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Audit logs insertable" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- OTP Sessions
CREATE TABLE public.otp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.otp_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "OTP readable by owner" ON public.otp_sessions FOR SELECT USING (true);
CREATE POLICY "OTP insertable" ON public.otp_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "OTP updatable" ON public.otp_sessions FOR UPDATE USING (true);

-- Platform Config (for buyback discount tiers etc)
CREATE TABLE public.platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Config readable" ON public.platform_config FOR SELECT USING (true);
CREATE POLICY "Config insertable" ON public.platform_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Config updatable" ON public.platform_config FOR UPDATE USING (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.pharmacy_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buyback_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
CREATE POLICY "Product images publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
