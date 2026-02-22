-- ============================================================
-- Pharmalink — AUTO-RESTOCK ALGORITHM
-- PL/pgSQL Implementation
-- ============================================================
-- This file contains:
--   1. Helper function: get best available vendor for a drug
--   2. Core function: process auto-restock for a single inventory item
--   3. Trigger function: fires on stock level update
--   4. Trigger: attaches to pharmacy_inventory
--   5. Batch job function: sweep all items below threshold
-- ============================================================


-- ============================================================
-- FUNCTION 1: get_best_vendor
-- Finds the most suitable verified vendor for a given drug.
--
-- Routing priority:
--   1. Pharmacy's preferred vendor (vendor_id on inventory row)
--      — only if they are verified AND have sufficient stock
--   2. Fallback: best available vendor scored by:
--      - Stock availability (must cover reorder_quantity)
--      - Lowest unit price
--      - Shortest lead time
--      - Verified status (only verified vendors qualify)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_best_vendor(
  p_drug_id        uuid,
  p_preferred_vendor_id uuid,
  p_reorder_quantity    integer
)
RETURNS TABLE (
  vendor_id   uuid,
  unit_price  numeric,
  lead_time   integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id   uuid;
  v_unit_price  numeric;
  v_lead_time   integer;
BEGIN

  -- ── STEP 1: Try the pharmacy's preferred vendor first ──────────────────
  IF p_preferred_vendor_id IS NOT NULL THEN
    SELECT
      vp.vendor_id,
      vp.unit_price,
      vp.lead_time_days
    INTO v_vendor_id, v_unit_price, v_lead_time
    FROM public.vendor_products vp
    INNER JOIN public.vendors v ON v.id = vp.vendor_id
    WHERE
      vp.drug_id            = p_drug_id
      AND vp.vendor_id      = p_preferred_vendor_id
      AND vp.status         = 'active'
      AND vp.stock_available >= p_reorder_quantity
      AND v.verification_status = 'verified'
    LIMIT 1;

    -- Return preferred vendor if found
    IF v_vendor_id IS NOT NULL THEN
      RETURN QUERY SELECT v_vendor_id, v_unit_price, v_lead_time;
      RETURN;
    END IF;
  END IF;

  -- ── STEP 2: Fallback — score all eligible vendors ─────────────────────
  -- Scoring logic:
  --   Lower price  → better score
  --   Lower lead time → better score
  --   We use a composite rank: price weight 60%, lead time weight 40%
  --   Only verified vendors with sufficient stock are considered

  SELECT
    vp.vendor_id,
    vp.unit_price,
    vp.lead_time_days
  INTO v_vendor_id, v_unit_price, v_lead_time
  FROM public.vendor_products vp
  INNER JOIN public.vendors v ON v.id = vp.vendor_id
  WHERE
    vp.drug_id             = p_drug_id
    AND vp.status          = 'active'
    AND vp.stock_available >= p_reorder_quantity
    AND v.verification_status = 'verified'
  ORDER BY
    -- Composite score: normalise price and lead time into a single rank
    (vp.unit_price * 0.6) + (vp.lead_time_days * 0.4) ASC
  LIMIT 1;

  IF v_vendor_id IS NOT NULL THEN
    RETURN QUERY SELECT v_vendor_id, v_unit_price, v_lead_time;
  END IF;

  -- No eligible vendor found — return empty
  RETURN;

END;
$$;


-- ============================================================
-- FUNCTION 2: process_auto_restock
-- Core restock logic for a single inventory item.
--
-- Flow:
--   1. Validate the item is eligible for auto-restock
--   2. Check stock is genuinely below threshold
--   3. Find the best vendor via get_best_vendor()
--   4. Check pharmacy wallet has sufficient balance
--   5. Create a purchase_order record
--   6. If approval_mode = 'auto':
--        - Deduct wallet balance immediately
--        - Insert a debit transaction
--        - Update vendor stock
--        - Insert an order record with status 'pending'
--        - Insert success notification
--   7. If approval_mode = 'manual':
--        - Create PO with approval_status = 'pending'
--        - Insert notification asking pharmacist to approve
--   8. Insert audit log entry
--   9. Return result status
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_auto_restock(
  p_inventory_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Inventory item data
  v_inventory         public.pharmacy_inventory%ROWTYPE;
  v_drug              public.drugs%ROWTYPE;
  v_pharmacy          public.pharmacies%ROWTYPE;

  -- Vendor resolution
  v_vendor_id         uuid;
  v_unit_price        numeric;
  v_lead_time         integer;

  -- Order calculations
  v_total_price       numeric;
  v_logistics_fee     numeric := 1500;  -- Platform logistics fee (₦) per order
  v_grand_total       numeric;

  -- IDs for created records
  v_po_id             uuid;
  v_order_id          uuid;
  v_pharmacy_user_id  uuid;

  -- Result
  v_result            jsonb;
BEGIN

  -- ── STEP 1: Fetch and validate the inventory item ──────────────────────
  SELECT * INTO v_inventory
  FROM public.pharmacy_inventory
  WHERE id = p_inventory_id
  FOR UPDATE;  -- Lock row to prevent concurrent restock triggers

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'inventory_item_not_found');
  END IF;

  -- Skip manually added drugs — they are exempt from auto-restock
  IF v_inventory.is_manual = true THEN
    RETURN jsonb_build_object('success', false, 'reason', 'manual_item_exempt');
  END IF;

  -- Skip if auto-restock is not enabled for this item
  IF v_inventory.auto_restock = false THEN
    RETURN jsonb_build_object('success', false, 'reason', 'auto_restock_disabled');
  END IF;

  -- Skip if stock is still above or at threshold
  IF v_inventory.stock_level > v_inventory.reorder_threshold THEN
    RETURN jsonb_build_object('success', false, 'reason', 'stock_above_threshold');
  END IF;

  -- ── STEP 2: Fetch drug and pharmacy details ────────────────────────────
  SELECT * INTO v_drug FROM public.drugs WHERE id = v_inventory.drug_id;
  SELECT * INTO v_pharmacy FROM public.pharmacies WHERE id = v_inventory.pharmacy_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'pharmacy_not_found');
  END IF;

  -- Skip if pharmacy account is suspended
  IF v_pharmacy.account_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'pharmacy_account_suspended');
  END IF;

  -- ── STEP 3: Find the best vendor ──────────────────────────────────────
  SELECT t.vendor_id, t.unit_price, t.lead_time
  INTO v_vendor_id, v_unit_price, v_lead_time
  FROM public.get_best_vendor(
    v_inventory.drug_id,
    v_inventory.vendor_id,
    v_inventory.reorder_quantity
  ) t;

  IF v_vendor_id IS NULL THEN
    -- No vendor available — notify pharmacy and log
    SELECT u.id INTO v_pharmacy_user_id
    FROM public.users u WHERE u.id = v_pharmacy.user_id;

    INSERT INTO public.notifications (user_id, message, type)
    VALUES (
      v_pharmacy.user_id,
      'Auto-restock failed for ' || v_drug.name || ': No verified vendor with sufficient stock found. Please restock manually.',
      'restock'
    );

    INSERT INTO public.audit_logs (actor_role, event_type, description, metadata)
    VALUES (
      'admin',
      'auto_restock_failed',
      'No eligible vendor found for drug: ' || v_drug.name,
      jsonb_build_object(
        'inventory_id', p_inventory_id,
        'pharmacy_id', v_inventory.pharmacy_id,
        'drug_id', v_inventory.drug_id,
        'stock_level', v_inventory.stock_level,
        'threshold', v_inventory.reorder_threshold
      )
    );

    RETURN jsonb_build_object('success', false, 'reason', 'no_eligible_vendor');
  END IF;

  -- ── STEP 4: Calculate costs ────────────────────────────────────────────
  v_total_price := v_unit_price * v_inventory.reorder_quantity;
  v_grand_total := v_total_price + v_logistics_fee;

  -- ── STEP 5: Wallet check ───────────────────────────────────────────────
  IF v_pharmacy.wallet_balance < v_grand_total THEN
    -- Insufficient funds — notify pharmacy
    INSERT INTO public.notifications (user_id, message, type)
    VALUES (
      v_pharmacy.user_id,
      'Auto-restock failed for ' || v_drug.name || ': Insufficient wallet balance. Required: ₦' ||
      v_grand_total::text || ', Available: ₦' || v_pharmacy.wallet_balance::text || '. Please top up your wallet.',
      'restock'
    );

    INSERT INTO public.audit_logs (actor_role, event_type, description, metadata)
    VALUES (
      'admin',
      'auto_restock_failed',
      'Insufficient wallet balance for: ' || v_drug.name,
      jsonb_build_object(
        'pharmacy_id', v_inventory.pharmacy_id,
        'required', v_grand_total,
        'available', v_pharmacy.wallet_balance
      )
    );

    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_wallet_balance',
      'required', v_grand_total, 'available', v_pharmacy.wallet_balance);
  END IF;

  -- ── STEP 6: Create Purchase Order record ──────────────────────────────
  INSERT INTO public.purchase_orders (
    pharmacy_id, drug_id, vendor_id, quantity, unit_price, total_price,
    trigger, approval_status
  )
  VALUES (
    v_inventory.pharmacy_id,
    v_inventory.drug_id,
    v_vendor_id,
    v_inventory.reorder_quantity,
    v_unit_price,
    v_total_price,
    'auto',
    CASE WHEN v_inventory.approval_mode = 'auto' THEN 'approved' ELSE 'pending' END
  )
  RETURNING id INTO v_po_id;

  -- ── STEP 7A: AUTO approval mode — execute immediately ─────────────────
  IF v_inventory.approval_mode = 'auto' THEN

    -- Deduct from pharmacy wallet (drug cost + logistics fee)
    UPDATE public.pharmacies
    SET wallet_balance = wallet_balance - v_grand_total
    WHERE id = v_inventory.pharmacy_id;

    -- Record debit transaction
    INSERT INTO public.transactions (pharmacy_id, type, amount, reference, description)
    VALUES (
      v_inventory.pharmacy_id,
      'debit',
      v_grand_total,
      'PO-' || v_po_id::text,
      'Auto-restock: ' || v_inventory.reorder_quantity::text || ' units of ' || v_drug.name ||
      ' (incl. logistics fee ₦' || v_logistics_fee::text || ')'
    );

    -- Reduce vendor stock
    UPDATE public.vendor_products
    SET stock_available = stock_available - v_inventory.reorder_quantity
    WHERE vendor_id = v_vendor_id AND drug_id = v_inventory.drug_id;

    -- Create order record
    INSERT INTO public.orders (
      pharmacy_id, vendor_id, drug_id, quantity, unit_price,
      total_price, status, destination_location, source,
      logistics_fee
    )
    SELECT
      v_inventory.pharmacy_id,
      v_vendor_id,
      v_inventory.drug_id,
      v_inventory.reorder_quantity,
      v_unit_price,
      v_total_price,
      'pending',
      p.location,
      'vendor',
      v_logistics_fee
    FROM public.pharmacies p
    WHERE p.id = v_inventory.pharmacy_id
    RETURNING id INTO v_order_id;

    -- Generate invoice document
    INSERT INTO public.documents (pharmacy_id, type, name)
    VALUES (
      v_inventory.pharmacy_id,
      'purchase_order',
      'Auto-Restock PO — ' || v_drug.name || ' — ' || to_char(now(), 'DD Mon YYYY')
    );

    -- Notify pharmacy of successful auto-restock
    INSERT INTO public.notifications (user_id, message, type)
    VALUES (
      v_pharmacy.user_id,
      'Auto-restock triggered: ' || v_inventory.reorder_quantity::text || ' units of ' || v_drug.name ||
      ' ordered from vendor. Total charged: ₦' || v_grand_total::text || '.',
      'restock'
    );

    v_result := jsonb_build_object(
      'success',       true,
      'mode',          'auto',
      'po_id',         v_po_id,
      'order_id',      v_order_id,
      'vendor_id',     v_vendor_id,
      'quantity',      v_inventory.reorder_quantity,
      'total_charged', v_grand_total
    );

  -- ── STEP 7B: MANUAL approval mode — create pending PO only ────────────
  ELSE

    -- Notify pharmacy to review and approve the PO
    INSERT INTO public.notifications (user_id, message, type)
    VALUES (
      v_pharmacy.user_id,
      'Restock approval required: ' || v_inventory.reorder_quantity::text || ' units of ' || v_drug.name ||
      ' are ready to order. Estimated cost: ₦' || v_grand_total::text || '. Please review and approve.',
      'restock'
    );

    v_result := jsonb_build_object(
      'success',          true,
      'mode',             'manual_pending',
      'po_id',            v_po_id,
      'vendor_id',        v_vendor_id,
      'quantity',         v_inventory.reorder_quantity,
      'estimated_total',  v_grand_total
    );

  END IF;

  -- ── STEP 8: Audit log ──────────────────────────────────────────────────
  INSERT INTO public.audit_logs (actor_role, event_type, description, metadata)
  VALUES (
    'admin',
    'auto_restock_' || CASE WHEN v_inventory.approval_mode = 'auto' THEN 'executed' ELSE 'queued' END,
    v_drug.name || ' restock ' ||
    CASE WHEN v_inventory.approval_mode = 'auto' THEN 'executed automatically' ELSE 'queued for manual approval' END,
    v_result
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Catch-all: log the error and return failure
    INSERT INTO public.audit_logs (actor_role, event_type, description, metadata)
    VALUES (
      'admin',
      'auto_restock_error',
      'Unexpected error during auto-restock for inventory item: ' || p_inventory_id::text,
      jsonb_build_object('error', SQLERRM, 'inventory_id', p_inventory_id)
    );
    RETURN jsonb_build_object('success', false, 'reason', 'unexpected_error', 'detail', SQLERRM);

END;
$$;


-- ============================================================
-- FUNCTION 3: trigger_auto_restock_on_update
-- Trigger function that fires when stock_level is updated.
-- Only proceeds if the new stock_level has dropped AT or BELOW
-- the reorder_threshold to avoid firing on every update.
-- ============================================================

CREATE OR REPLACE FUNCTION public.trigger_auto_restock_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

  -- Only fire when stock has crossed the threshold downward
  -- i.e. was above before, now at or below
  IF NEW.stock_level <= NEW.reorder_threshold
     AND OLD.stock_level > OLD.reorder_threshold
     AND NEW.auto_restock = true
     AND NEW.is_manual = false
  THEN
    -- Run restock asynchronously-style by calling the core function
    PERFORM public.process_auto_restock(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;


-- ============================================================
-- TRIGGER 4: Attach trigger to pharmacy_inventory
-- Fires AFTER UPDATE on stock_level changes only
-- ============================================================

DROP TRIGGER IF EXISTS auto_restock_trigger ON public.pharmacy_inventory;

CREATE TRIGGER auto_restock_trigger
AFTER UPDATE OF stock_level
ON public.pharmacy_inventory
FOR EACH ROW
EXECUTE FUNCTION public.trigger_auto_restock_on_update();


-- ============================================================
-- FUNCTION 5: run_restock_sweep
-- Batch job — scans ALL inventory items and triggers restock
-- for any that are currently below threshold and eligible.
--
-- Intended to be run on a schedule (e.g. nightly via
-- Supabase Edge Function cron or pg_cron).
--
-- Returns a summary of items processed.
-- ============================================================

CREATE OR REPLACE FUNCTION public.run_restock_sweep()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item          RECORD;
  v_result        jsonb;
  v_processed     integer := 0;
  v_triggered     integer := 0;
  v_skipped       integer := 0;
  v_failed        integer := 0;
  v_results       jsonb[] := '{}';
BEGIN

  -- Loop through all inventory items that are candidates for restock
  FOR v_item IN
    SELECT pi.id, pi.pharmacy_id, pi.drug_id, pi.stock_level, pi.reorder_threshold
    FROM public.pharmacy_inventory pi
    INNER JOIN public.pharmacies p ON p.id = pi.pharmacy_id
    WHERE
      pi.auto_restock = true
      AND pi.is_manual = false
      AND pi.stock_level <= pi.reorder_threshold
      AND p.account_status = 'active'
    ORDER BY
      -- Prioritise most critical items (furthest below threshold) first
      (pi.reorder_threshold - pi.stock_level) DESC
  LOOP
    v_processed := v_processed + 1;

    v_result := public.process_auto_restock(v_item.id);

    IF (v_result->>'success')::boolean = true THEN
      v_triggered := v_triggered + 1;
    ELSIF v_result->>'reason' IN ('stock_above_threshold', 'auto_restock_disabled', 'manual_item_exempt') THEN
      v_skipped := v_skipped + 1;
    ELSE
      v_failed := v_failed + 1;
    END IF;

    -- Collect per-item result (limit to first 100 for performance)
    IF array_length(v_results, 1) < 100 THEN
      v_results := v_results || jsonb_build_object(
        'inventory_id', v_item.id,
        'result', v_result
      );
    END IF;

  END LOOP;

  -- Log the sweep run
  INSERT INTO public.audit_logs (actor_role, event_type, description, metadata)
  VALUES (
    'admin',
    'restock_sweep_completed',
    'Scheduled restock sweep completed. Processed: ' || v_processed::text ||
    ', Triggered: ' || v_triggered::text ||
    ', Skipped: ' || v_skipped::text ||
    ', Failed: ' || v_failed::text,
    jsonb_build_object(
      'processed', v_processed,
      'triggered', v_triggered,
      'skipped',   v_skipped,
      'failed',    v_failed,
      'run_at',    now()
    )
  );

  RETURN jsonb_build_object(
    'processed', v_processed,
    'triggered', v_triggered,
    'skipped',   v_skipped,
    'failed',    v_failed,
    'items',     to_jsonb(v_results)
  );

END;
$$;


-- ============================================================
-- FUNCTION 6: approve_manual_purchase_order
-- Called when a pharmacist manually approves a pending PO.
-- Executes the payment, creates the order, and fulfills
-- the purchase order record.
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_manual_purchase_order(
  p_po_id       uuid,
  p_actor_id    uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_po            public.purchase_orders%ROWTYPE;
  v_pharmacy      public.pharmacies%ROWTYPE;
  v_drug          public.drugs%ROWTYPE;
  v_logistics_fee numeric := 1500;
  v_grand_total   numeric;
  v_order_id      uuid;
BEGIN

  -- Fetch and lock the purchase order
  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'po_not_found');
  END IF;

  IF v_po.approval_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'po_already_processed');
  END IF;

  SELECT * INTO v_pharmacy FROM public.pharmacies WHERE id = v_po.pharmacy_id;
  SELECT * INTO v_drug FROM public.drugs WHERE id = v_po.drug_id;

  v_grand_total := v_po.total_price + v_logistics_fee;

  -- Wallet check
  IF v_pharmacy.wallet_balance < v_grand_total THEN
    RETURN jsonb_build_object('success', false, 'reason', 'insufficient_wallet_balance',
      'required', v_grand_total, 'available', v_pharmacy.wallet_balance);
  END IF;

  -- Approve the PO
  UPDATE public.purchase_orders
  SET approval_status = 'approved'
  WHERE id = p_po_id;

  -- Deduct wallet
  UPDATE public.pharmacies
  SET wallet_balance = wallet_balance - v_grand_total
  WHERE id = v_po.pharmacy_id;

  -- Transaction record
  INSERT INTO public.transactions (pharmacy_id, type, amount, reference, description)
  VALUES (
    v_po.pharmacy_id, 'debit', v_grand_total,
    'PO-' || p_po_id::text,
    'Manual restock approved: ' || v_po.quantity::text || ' units of ' || v_drug.name ||
    ' (incl. logistics fee ₦' || v_logistics_fee::text || ')'
  );

  -- Reduce vendor stock
  UPDATE public.vendor_products
  SET stock_available = stock_available - v_po.quantity
  WHERE vendor_id = v_po.vendor_id AND drug_id = v_po.drug_id;

  -- Create order
  INSERT INTO public.orders (
    pharmacy_id, vendor_id, drug_id, quantity, unit_price,
    total_price, status, destination_location, source, logistics_fee
  )
  SELECT
    v_po.pharmacy_id, v_po.vendor_id, v_po.drug_id,
    v_po.quantity, v_po.unit_price, v_po.total_price,
    'pending', p.location, 'vendor', v_logistics_fee
  FROM public.pharmacies p WHERE p.id = v_po.pharmacy_id
  RETURNING id INTO v_order_id;

  -- Mark PO fulfilled
  UPDATE public.purchase_orders SET approval_status = 'fulfilled' WHERE id = p_po_id;

  -- Generate document
  INSERT INTO public.documents (pharmacy_id, type, name)
  VALUES (v_po.pharmacy_id, 'purchase_order',
    'Approved PO — ' || v_drug.name || ' — ' || to_char(now(), 'DD Mon YYYY'));

  -- Notify pharmacy
  INSERT INTO public.notifications (user_id, message, type)
  SELECT u.id, 'Your restock order for ' || v_drug.name || ' (' || v_po.quantity::text ||
    ' units) has been approved and placed. Total: ₦' || v_grand_total::text || '.', 'restock'
  FROM public.pharmacies ph
  INNER JOIN public.users u ON u.id = ph.user_id
  WHERE ph.id = v_po.pharmacy_id;

  -- Audit
  INSERT INTO public.audit_logs (actor_id, actor_role, event_type, description, metadata)
  VALUES (p_actor_id, 'pharmacy', 'manual_po_approved',
    'Manual PO approved for ' || v_drug.name,
    jsonb_build_object('po_id', p_po_id, 'order_id', v_order_id, 'total', v_grand_total));

  RETURN jsonb_build_object(
    'success', true, 'order_id', v_order_id,
    'total_charged', v_grand_total
  );

END;
$$;


-- ============================================================
-- USAGE NOTES
-- ============================================================
--
-- Manual call (e.g. from Supabase Edge Function or admin tool):
--   SELECT public.process_auto_restock('inventory-uuid-here');
--
-- Approve a pending manual PO:
--   SELECT public.approve_manual_purchase_order('po-uuid', 'actor-user-uuid');
--
-- Run the nightly sweep (call from pg_cron or Edge Function):
--   SELECT public.run_restock_sweep();
--
-- The trigger fires automatically on any stock_level update
-- that crosses the reorder_threshold downward.
--
-- Vendor routing priority:
--   1. Pharmacy's preferred vendor (if verified + has stock)
--   2. Best available vendor by price (60%) + lead time (40%)
--
-- Logistics fee (₦1,500) is the platform's primary revenue
-- margin per order. Update the v_logistics_fee variable in
-- each function to match the platform config or fetch
-- dynamically from the platform_config table.
-- ============================================================