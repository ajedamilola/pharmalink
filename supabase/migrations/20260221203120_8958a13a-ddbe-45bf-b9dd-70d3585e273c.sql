
-- Add is_manual flag to pharmacy_inventory (manually added drugs exempt from auto-restock)
ALTER TABLE public.pharmacy_inventory ADD COLUMN IF NOT EXISTS is_manual boolean DEFAULT false;

-- Add logistics_fee to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS logistics_fee numeric DEFAULT 0;

-- Add actual_logistics_cost to orders (for admin profit calculation)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS actual_logistics_cost numeric DEFAULT 0;

-- Create POS sales table
CREATE TABLE IF NOT EXISTS public.pos_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id),
  inventory_item_id uuid NOT NULL REFERENCES public.pharmacy_inventory(id),
  drug_id uuid NOT NULL REFERENCES public.drugs(id),
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  customer_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "POS sales readable" ON public.pos_sales FOR SELECT USING (true);
CREATE POLICY "POS sales insertable" ON public.pos_sales FOR INSERT WITH CHECK (true);

-- Extend order_status enum to include more granular logistics statuses
-- We need to add: confirmed, shipped, in_transit, out_for_delivery
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'shipped';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'in_transit';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
