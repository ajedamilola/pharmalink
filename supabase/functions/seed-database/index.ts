import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DRUGS = [
  { name: 'Amoxicillin 500mg', category: 'Antibiotics', nafdac_number: 'A4-1234', shelf_life_months: 24, unit_price: 1500, description: 'Broad-spectrum antibiotic' },
  { name: 'Artemether-Lumefantrine', category: 'Antimalarials', nafdac_number: 'A4-2345', shelf_life_months: 36, unit_price: 2500, description: 'ACT for malaria treatment' },
  { name: 'Metformin 500mg', category: 'Antidiabetics', nafdac_number: 'A4-3456', shelf_life_months: 36, unit_price: 800, description: 'Type 2 diabetes management' },
  { name: 'Lisinopril 10mg', category: 'Antihypertensives', nafdac_number: 'A4-4567', shelf_life_months: 24, unit_price: 1200, description: 'ACE inhibitor' },
  { name: 'Ciprofloxacin 500mg', category: 'Antibiotics', nafdac_number: 'A4-5678', shelf_life_months: 30, unit_price: 1800, description: 'Fluoroquinolone antibiotic' },
  { name: 'Amlodipine 5mg', category: 'Antihypertensives', nafdac_number: 'A4-6789', shelf_life_months: 36, unit_price: 900, description: 'Calcium channel blocker' },
  { name: 'Omeprazole 20mg', category: 'GI Drugs', nafdac_number: 'A4-7890', shelf_life_months: 24, unit_price: 1100, description: 'Proton pump inhibitor' },
  { name: 'Paracetamol 500mg', category: 'Analgesics', nafdac_number: 'A4-8901', shelf_life_months: 48, unit_price: 300, description: 'Pain reliever' },
  { name: 'Ibuprofen 400mg', category: 'Analgesics', nafdac_number: 'A4-9012', shelf_life_months: 36, unit_price: 500, description: 'NSAID' },
  { name: 'Azithromycin 250mg', category: 'Antibiotics', nafdac_number: 'A4-0123', shelf_life_months: 24, unit_price: 2200, description: 'Macrolide antibiotic' },
  { name: 'Atorvastatin 20mg', category: 'Cardiovascular', nafdac_number: 'A4-1122', shelf_life_months: 36, unit_price: 1600, description: 'Statin' },
  { name: 'Losartan 50mg', category: 'Antihypertensives', nafdac_number: 'A4-2233', shelf_life_months: 30, unit_price: 1400, description: 'ARB' },
  { name: 'Ceftriaxone 1g', category: 'Antibiotics', nafdac_number: 'A4-3344', shelf_life_months: 24, unit_price: 3500, description: 'Cephalosporin' },
  { name: 'Diclofenac 50mg', category: 'Analgesics', nafdac_number: 'A4-4455', shelf_life_months: 36, unit_price: 600, description: 'NSAID analgesic' },
  { name: 'Prednisolone 5mg', category: 'Corticosteroids', nafdac_number: 'A4-5566', shelf_life_months: 24, unit_price: 700, description: 'Corticosteroid' },
];

const SEED_USERS = [
  { email: 'pharmacy1@pharmalink.ng', password: 'password123', role: 'pharmacy', name: 'MedPlus Pharmacy Lagos' },
  { email: 'pharmacy2@pharmalink.ng', password: 'password123', role: 'pharmacy', name: 'HealthFirst Pharmacy Abuja' },
  { email: 'vendor1@pharmalink.ng', password: 'password123', role: 'vendor', name: 'NaijaPharm Distributors' },
  { email: 'vendor2@pharmalink.ng', password: 'password123', role: 'vendor', name: 'WestAfrica Medical Supplies' },
  { email: 'admin@pharmalink.ng', password: 'password123', role: 'admin', name: 'System Administrator' },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if already seeded
    const { data: existingUsers } = await supabaseAdmin.from('users').select('id').limit(1);
    if (existingUsers && existingUsers.length > 0) {
      return new Response(JSON.stringify({ message: "Already seeded" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert drugs (may already exist)
    const { data: existingDrugs } = await supabaseAdmin.from('drugs').select('id').limit(1);
    let drugs;
    if (!existingDrugs || existingDrugs.length === 0) {
      const { data } = await supabaseAdmin.from('drugs').insert(DRUGS).select();
      drugs = data;
    } else {
      const { data } = await supabaseAdmin.from('drugs').select('*');
      drugs = data;
    }
    if (!drugs) throw new Error('Failed to get drugs');

    // Create auth users using admin API (no rate limits)
    const userRecords: any[] = [];
    for (const u of SEED_USERS) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      });
      
      if (authError) {
        console.error(`Failed to create user ${u.email}:`, authError.message);
        // Try to find existing user
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existing = users?.find(eu => eu.email === u.email);
        if (existing) {
          const { data: appUser } = await supabaseAdmin.from('users').insert({
            auth_id: existing.id,
            email: u.email,
            role: u.role,
            name: u.name,
          }).select().single();
          if (appUser) userRecords.push({ ...appUser, originalRole: u.role });
        }
        continue;
      }

      if (authData?.user) {
        const { data: appUser } = await supabaseAdmin.from('users').insert({
          auth_id: authData.user.id,
          email: u.email,
          role: u.role,
          name: u.name,
        }).select().single();
        if (appUser) userRecords.push({ ...appUser, originalRole: u.role });
      }
    }

    const pharmacyUsers = userRecords.filter(u => u.originalRole === 'pharmacy');
    const vendorUsers = userRecords.filter(u => u.originalRole === 'vendor');
    const adminUser = userRecords.find(u => u.originalRole === 'admin');

    // Create pharmacies
    const pharmacyData = [
      { user_id: pharmacyUsers[0]?.id, name: 'MedPlus Pharmacy', location: 'Victoria Island, Lagos', wallet_balance: 500000 },
      { user_id: pharmacyUsers[1]?.id, name: 'HealthFirst Pharmacy', location: 'Wuse 2, Abuja', wallet_balance: 350000 },
    ].filter(p => p.user_id);
    const { data: pharmacies } = await supabaseAdmin.from('pharmacies').insert(pharmacyData).select();

    // Create vendors
    const vendorData = [
      { user_id: vendorUsers[0]?.id, name: 'NaijaPharm Distributors', location: 'Ikeja, Lagos', verification_status: 'verified' },
      { user_id: vendorUsers[1]?.id, name: 'WestAfrica Medical Supplies', location: 'Garki, Abuja', verification_status: 'pending' },
    ].filter(v => v.user_id);
    const { data: vendors } = await supabaseAdmin.from('vendors').insert(vendorData).select();

    if (!pharmacies || !vendors) throw new Error('Failed to create pharmacies/vendors');

    // Vendor products
    const vendorProducts = drugs.slice(0, 10).map((drug: any, i: number) => ({
      vendor_id: vendors[i % 2].id,
      drug_id: drug.id,
      unit_price: drug.unit_price,
      moq: 10,
      stock_available: Math.floor(Math.random() * 500) + 100,
      lead_time_days: Math.floor(Math.random() * 5) + 1,
      status: 'active',
    }));
    await supabaseAdmin.from('vendor_products').insert(vendorProducts);

    // Inventory
    const now = new Date();
    const inventoryItems = drugs.slice(0, 12).map((drug: any, i: number) => {
      const isLowStock = i % 4 === 0;
      const isNearExpiry = i % 3 === 0;
      const expiryDate = new Date(now);
      if (isNearExpiry) {
        expiryDate.setDate(expiryDate.getDate() + Math.floor(Math.random() * 45) + 15);
      } else {
        expiryDate.setMonth(expiryDate.getMonth() + Math.floor(Math.random() * 18) + 6);
      }
      return {
        pharmacy_id: pharmacies[i % 2].id,
        drug_id: drug.id,
        batch_number: `BN-2024${String(i + 1).padStart(4, '0')}`,
        expiry_date: expiryDate.toISOString().split('T')[0],
        stock_level: isLowStock ? Math.floor(Math.random() * 8) + 2 : Math.floor(Math.random() * 200) + 50,
        reorder_threshold: 15,
        vendor_id: vendors[i % 2].id,
        auto_restock: i % 5 === 0,
        approval_mode: i % 3 === 0 ? 'auto' : 'manual',
        reorder_quantity: 50,
      };
    });
    await supabaseAdmin.from('pharmacy_inventory').insert(inventoryItems);

    // Orders
    const orderStatuses = ['pending', 'processing', 'dispatched', 'delivered'];
    const locations = ['Victoria Island, Lagos', 'Wuse 2, Abuja', 'Sabon Gari, Kano', 'GRA, Port Harcourt', 'Bodija, Ibadan'];
    const orders = drugs.slice(0, 8).map((drug: any, i: number) => {
      const qty = Math.floor(Math.random() * 50) + 10;
      return {
        pharmacy_id: pharmacies[i % 2].id,
        vendor_id: vendors[i % 2].id,
        drug_id: drug.id,
        quantity: qty,
        unit_price: drug.unit_price,
        total_price: drug.unit_price * qty,
        status: orderStatuses[i % 4],
        destination_location: locations[i % 5],
        logistics_partner: i % 2 === 0 ? 'GIG Logistics' : 'DHL Nigeria',
        source: 'vendor',
      };
    });
    const { data: createdOrders } = await supabaseAdmin.from('orders').insert(orders).select();

    // Marketplace listings
    const listings = drugs.slice(0, 6).map((drug: any, i: number) => ({
      drug_id: drug.id,
      source: i % 3 === 0 ? 'buyback' : 'vendor',
      vendor_id: i % 3 !== 0 ? vendors[i % 2].id : null,
      pharmacy_id: i % 3 === 0 ? pharmacies[0].id : null,
      unit_price: drug.unit_price * (i % 3 === 0 ? 0.4 : 0.95),
      discount_pct: i % 3 === 0 ? 60 : 5,
      quantity_available: Math.floor(Math.random() * 100) + 20,
      lead_time_days: Math.floor(Math.random() * 5) + 1,
      status: 'active',
    }));
    await supabaseAdmin.from('marketplace_listings').insert(listings);

    // Notifications
    const notifications = [
      { user_id: pharmacyUsers[0]?.id, message: 'Low stock alert: Amoxicillin 500mg is below reorder threshold', type: 'restock' },
      { user_id: pharmacyUsers[0]?.id, message: 'Your order #ORD-001 has been dispatched', type: 'order' },
      { user_id: pharmacyUsers[0]?.id, message: 'Admin suggests buy-back for Ciprofloxacin 500mg (expiring soon)', type: 'admin_suggestion' },
      { user_id: pharmacyUsers[1]?.id, message: 'New marketplace listing: Paracetamol 500mg at 5% discount', type: 'system' },
      { user_id: vendorUsers[0]?.id, message: 'New order received from MedPlus Pharmacy', type: 'order' },
      { user_id: vendorUsers[1]?.id, message: 'Your verification is pending review', type: 'system' },
    ].filter(n => n.user_id);
    await supabaseAdmin.from('notifications').insert(notifications);

    // Buyback requests
    await supabaseAdmin.from('buyback_requests').insert([
      { pharmacy_id: pharmacies[0].id, drug_id: drugs[4].id, quantity: 20, original_unit_price: drugs[4].unit_price, buyback_unit_price: drugs[4].unit_price * 0.35, expiry_date: new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0], remaining_shelf_pct: 15, status: 'pending' },
      { pharmacy_id: pharmacies[1].id, drug_id: drugs[6].id, quantity: 30, original_unit_price: drugs[6].unit_price, buyback_unit_price: drugs[6].unit_price * 0.4, expiry_date: new Date(now.getTime() + 45 * 86400000).toISOString().split('T')[0], remaining_shelf_pct: 22, status: 'admin_approved' },
    ]);

    // Transactions
    await supabaseAdmin.from('transactions').insert([
      { pharmacy_id: pharmacies[0].id, type: 'credit', amount: 500000, reference: 'TXN-TOPUP-001', description: 'Wallet top-up via bank transfer' },
      { pharmacy_id: pharmacies[0].id, type: 'debit', amount: 75000, reference: 'TXN-ORD-001', description: 'Order payment - Amoxicillin 500mg' },
      { pharmacy_id: pharmacies[1].id, type: 'credit', amount: 350000, reference: 'TXN-TOPUP-002', description: 'Wallet top-up via bank transfer' },
    ]);

    // Disputes
    if (createdOrders?.length) {
      await supabaseAdmin.from('disputes').insert([{
        pharmacy_id: pharmacies[0].id,
        vendor_id: vendors[0].id,
        order_id: createdOrders[0].id,
        issue_type: 'Quality Issue',
        description: 'Received damaged packaging for Amoxicillin batch',
        status: 'open',
      }]);
    }

    // Documents
    await supabaseAdmin.from('documents').insert([
      { pharmacy_id: pharmacies[0].id, type: 'invoice', name: 'INV-2024-001 - Amoxicillin Order' },
      { pharmacy_id: pharmacies[0].id, type: 'purchase_order', name: 'PO-2024-001 - Monthly Restock' },
      { pharmacy_id: pharmacies[1].id, type: 'statement', name: 'STMT-2024-Jan - Monthly Statement' },
    ]);

    // Audit logs
    const auditLogs = [
      { actor_id: adminUser?.id, actor_role: 'admin', event_type: 'vendor_verified', description: 'Verified NaijaPharm Distributors', metadata: { vendor_name: 'NaijaPharm Distributors' } },
      { actor_id: pharmacyUsers[0]?.id, actor_role: 'pharmacy', event_type: 'order_placed', description: 'Placed order for Amoxicillin 500mg', metadata: { quantity: 50 } },
      { actor_id: adminUser?.id, actor_role: 'admin', event_type: 'buyback_approved', description: 'Approved buy-back for Ciprofloxacin', metadata: {} },
    ].filter(a => a.actor_id);
    await supabaseAdmin.from('audit_logs').insert(auditLogs);

    // Platform config
    await supabaseAdmin.from('platform_config').insert([
      { key: 'buyback_discount_tiers', value: { tier1: { max_shelf_pct: 10, discount: 70 }, tier2: { max_shelf_pct: 20, discount: 60 }, tier3: { max_shelf_pct: 30, discount: 50 } } },
    ]);

    return new Response(
      JSON.stringify({ success: true, message: "Database seeded successfully", users: userRecords.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
