import { supabase } from '@/integrations/supabase/client';

const SEED_USERS = [
  { email: 'pharmacy1@pharmalink.ng', password: 'password123', role: 'pharmacy' as const, name: 'MedPlus Pharmacy Lagos' },
  { email: 'pharmacy2@pharmalink.ng', password: 'password123', role: 'pharmacy' as const, name: 'HealthFirst Pharmacy Abuja' },
  { email: 'vendor1@pharmalink.ng', password: 'password123', role: 'vendor' as const, name: 'NaijaPharm Distributors' },
  { email: 'vendor2@pharmalink.ng', password: 'password123', role: 'vendor' as const, name: 'WestAfrica Medical Supplies' },
  { email: 'admin@pharmalink.ng', password: 'password123', role: 'admin' as const, name: 'System Administrator' },
];

const DRUGS = [
  { name: 'Amoxicillin 500mg', category: 'Antibiotics', nafdac_number: 'A4-1234', shelf_life_months: 24, unit_price: 1500, description: 'Broad-spectrum antibiotic' },
  { name: 'Artemether-Lumefantrine', category: 'Antimalarials', nafdac_number: 'A4-2345', shelf_life_months: 36, unit_price: 2500, description: 'ACT for malaria treatment' },
  { name: 'Metformin 500mg', category: 'Antidiabetics', nafdac_number: 'A4-3456', shelf_life_months: 36, unit_price: 800, description: 'Type 2 diabetes management' },
  { name: 'Lisinopril 10mg', category: 'Antihypertensives', nafdac_number: 'A4-4567', shelf_life_months: 24, unit_price: 1200, description: 'ACE inhibitor for blood pressure' },
  { name: 'Ciprofloxacin 500mg', category: 'Antibiotics', nafdac_number: 'A4-5678', shelf_life_months: 30, unit_price: 1800, description: 'Fluoroquinolone antibiotic' },
  { name: 'Amlodipine 5mg', category: 'Antihypertensives', nafdac_number: 'A4-6789', shelf_life_months: 36, unit_price: 900, description: 'Calcium channel blocker' },
  { name: 'Omeprazole 20mg', category: 'GI Drugs', nafdac_number: 'A4-7890', shelf_life_months: 24, unit_price: 1100, description: 'Proton pump inhibitor' },
  { name: 'Paracetamol 500mg', category: 'Analgesics', nafdac_number: 'A4-8901', shelf_life_months: 48, unit_price: 300, description: 'Pain reliever and antipyretic' },
  { name: 'Ibuprofen 400mg', category: 'Analgesics', nafdac_number: 'A4-9012', shelf_life_months: 36, unit_price: 500, description: 'NSAID for pain and inflammation' },
  { name: 'Azithromycin 250mg', category: 'Antibiotics', nafdac_number: 'A4-0123', shelf_life_months: 24, unit_price: 2200, description: 'Macrolide antibiotic' },
  { name: 'Atorvastatin 20mg', category: 'Cardiovascular', nafdac_number: 'A4-1122', shelf_life_months: 36, unit_price: 1600, description: 'Statin for cholesterol' },
  { name: 'Losartan 50mg', category: 'Antihypertensives', nafdac_number: 'A4-2233', shelf_life_months: 30, unit_price: 1400, description: 'ARB for hypertension' },
  { name: 'Ceftriaxone 1g', category: 'Antibiotics', nafdac_number: 'A4-3344', shelf_life_months: 24, unit_price: 3500, description: 'Third-gen cephalosporin' },
  { name: 'Diclofenac 50mg', category: 'Analgesics', nafdac_number: 'A4-4455', shelf_life_months: 36, unit_price: 600, description: 'NSAID analgesic' },
  { name: 'Prednisolone 5mg', category: 'Corticosteroids', nafdac_number: 'A4-5566', shelf_life_months: 24, unit_price: 700, description: 'Corticosteroid anti-inflammatory' },
];

export async function seedDatabase() {
  // Check if already seeded
  const { data: existingDrugs } = await supabase.from('drugs').select('id').limit(1);
  if (existingDrugs && existingDrugs.length > 0) return false;

  // Insert drugs
  const { data: drugs } = await supabase.from('drugs').insert(DRUGS).select();
  if (!drugs) return false;

  // Create auth users and app users
  const userRecords: any[] = [];
  for (const u of SEED_USERS) {
    const { data: authData } = await supabase.auth.signUp({ email: u.email, password: u.password });
    if (authData?.user) {
      const { data: appUser } = await supabase.from('users').insert({
        auth_id: authData.user.id,
        email: u.email,
        role: u.role,
        name: u.name,
      }).select().single();
      if (appUser) userRecords.push({ ...appUser, originalRole: u.role });
    }
  }

  // Sign out after seeding users
  await supabase.auth.signOut();

  const pharmacyUsers = userRecords.filter(u => u.originalRole === 'pharmacy');
  const vendorUsers = userRecords.filter(u => u.originalRole === 'vendor');

  // Create pharmacies
  const pharmacyData = [
    { user_id: pharmacyUsers[0]?.id, name: 'MedPlus Pharmacy', location: 'Victoria Island, Lagos', wallet_balance: 500000 },
    { user_id: pharmacyUsers[1]?.id, name: 'HealthFirst Pharmacy', location: 'Wuse 2, Abuja', wallet_balance: 350000 },
  ].filter(p => p.user_id);

  const { data: pharmacies } = await supabase.from('pharmacies').insert(pharmacyData).select();

  // Create vendors
  const vendorData = [
    { user_id: vendorUsers[0]?.id, name: 'NaijaPharm Distributors', location: 'Ikeja, Lagos', verification_status: 'verified' as const },
    { user_id: vendorUsers[1]?.id, name: 'WestAfrica Medical Supplies', location: 'Garki, Abuja', verification_status: 'pending' as const },
  ].filter(v => v.user_id);

  const { data: vendors } = await supabase.from('vendors').insert(vendorData).select();

  if (!pharmacies || !vendors) return false;

  // Create vendor products
  const vendorProducts = drugs.slice(0, 10).map((drug, i) => ({
    vendor_id: vendors[i % 2].id,
    drug_id: drug.id,
    unit_price: drug.unit_price,
    moq: 10,
    stock_available: Math.floor(Math.random() * 500) + 100,
    lead_time_days: Math.floor(Math.random() * 5) + 1,
    status: 'active' as const,
  }));
  await supabase.from('vendor_products').insert(vendorProducts);

  // Create pharmacy inventory - some low stock, some near expiry
  const now = new Date();
  const inventoryItems = drugs.slice(0, 12).map((drug, i) => {
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
      batch_number: `BN-${2024}${String(i + 1).padStart(4, '0')}`,
      expiry_date: expiryDate.toISOString().split('T')[0],
      stock_level: isLowStock ? Math.floor(Math.random() * 8) + 2 : Math.floor(Math.random() * 200) + 50,
      reorder_threshold: 15,
      vendor_id: vendors[i % 2].id,
      auto_restock: i % 5 === 0,
      approval_mode: (i % 3 === 0 ? 'auto' : 'manual') as 'auto' | 'manual',
      reorder_quantity: 50,
    };
  });
  await supabase.from('pharmacy_inventory').insert(inventoryItems);

  // Create orders
  const orderStatuses: Array<'pending' | 'processing' | 'dispatched' | 'delivered'> = ['pending', 'processing', 'dispatched', 'delivered'];
  const locations = ['Victoria Island, Lagos', 'Wuse 2, Abuja', 'Sabon Gari, Kano', 'GRA, Port Harcourt', 'Bodija, Ibadan'];
  const orders = drugs.slice(0, 8).map((drug, i) => ({
    pharmacy_id: pharmacies[i % 2].id,
    vendor_id: vendors[i % 2].id,
    drug_id: drug.id,
    quantity: Math.floor(Math.random() * 50) + 10,
    unit_price: drug.unit_price,
    total_price: drug.unit_price * (Math.floor(Math.random() * 50) + 10),
    status: orderStatuses[i % 4],
    destination_location: locations[i % 5],
    logistics_partner: i % 2 === 0 ? 'GIG Logistics' : 'DHL Nigeria',
    source: 'vendor' as const,
  }));
  const { data: createdOrders } = await supabase.from('orders').insert(orders).select();

  // Create marketplace listings
  const listings = drugs.slice(0, 6).map((drug, i) => ({
    drug_id: drug.id,
    source: (i % 3 === 0 ? 'buyback' : 'vendor') as 'vendor' | 'buyback',
    vendor_id: i % 3 !== 0 ? vendors[i % 2].id : null,
    pharmacy_id: i % 3 === 0 ? pharmacies[0].id : null,
    unit_price: drug.unit_price * (i % 3 === 0 ? 0.4 : 0.95),
    discount_pct: i % 3 === 0 ? 60 : 5,
    quantity_available: Math.floor(Math.random() * 100) + 20,
    lead_time_days: Math.floor(Math.random() * 5) + 1,
    status: 'active' as const,
  }));
  await supabase.from('marketplace_listings').insert(listings);

  // Create notifications
  const adminUser = userRecords.find(u => u.originalRole === 'admin');
  const notifications = [
    { user_id: pharmacyUsers[0]?.id, message: 'Low stock alert: Amoxicillin 500mg is below reorder threshold', type: 'restock' as const },
    { user_id: pharmacyUsers[0]?.id, message: 'Your order #ORD-001 has been dispatched', type: 'order' as const },
    { user_id: pharmacyUsers[0]?.id, message: 'Admin suggests buy-back for Ciprofloxacin 500mg (expiring soon)', type: 'admin_suggestion' as const },
    { user_id: pharmacyUsers[1]?.id, message: 'New marketplace listing: Paracetamol 500mg at 5% discount', type: 'system' as const },
    { user_id: vendorUsers[0]?.id, message: 'New order received from MedPlus Pharmacy', type: 'order' as const },
    { user_id: vendorUsers[1]?.id, message: 'Your verification is pending review', type: 'system' as const },
  ].filter(n => n.user_id);
  await supabase.from('notifications').insert(notifications);

  // Create buyback requests
  const buybacks = [
    {
      pharmacy_id: pharmacies[0].id,
      drug_id: drugs[4].id,
      quantity: 20,
      original_unit_price: drugs[4].unit_price,
      buyback_unit_price: drugs[4].unit_price * 0.35,
      expiry_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      remaining_shelf_pct: 15,
      status: 'pending' as const,
    },
    {
      pharmacy_id: pharmacies[1].id,
      drug_id: drugs[6].id,
      quantity: 30,
      original_unit_price: drugs[6].unit_price,
      buyback_unit_price: drugs[6].unit_price * 0.4,
      expiry_date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      remaining_shelf_pct: 22,
      status: 'admin_approved' as const,
    },
  ];
  await supabase.from('buyback_requests').insert(buybacks);

  // Create transactions
  const transactions = [
    { pharmacy_id: pharmacies[0].id, type: 'credit' as const, amount: 500000, reference: 'TXN-TOPUP-001', description: 'Wallet top-up via bank transfer' },
    { pharmacy_id: pharmacies[0].id, type: 'debit' as const, amount: 75000, reference: 'TXN-ORD-001', description: 'Order payment - Amoxicillin 500mg' },
    { pharmacy_id: pharmacies[1].id, type: 'credit' as const, amount: 350000, reference: 'TXN-TOPUP-002', description: 'Wallet top-up via bank transfer' },
  ];
  await supabase.from('transactions').insert(transactions);

  // Create disputes
  if (createdOrders && createdOrders.length > 0) {
    await supabase.from('disputes').insert([
      {
        pharmacy_id: pharmacies[0].id,
        vendor_id: vendors[0].id,
        order_id: createdOrders[0].id,
        issue_type: 'Quality Issue',
        description: 'Received damaged packaging for Amoxicillin batch',
        status: 'open' as const,
      },
    ]);
  }

  // Create documents
  await supabase.from('documents').insert([
    { pharmacy_id: pharmacies[0].id, type: 'invoice' as const, name: 'INV-2024-001 - Amoxicillin Order' },
    { pharmacy_id: pharmacies[0].id, type: 'purchase_order' as const, name: 'PO-2024-001 - Monthly Restock' },
    { pharmacy_id: pharmacies[1].id, type: 'statement' as const, name: 'STMT-2024-Jan - Monthly Statement' },
  ]);

  // Create audit logs
  await supabase.from('audit_logs').insert([
    { actor_id: adminUser?.id, actor_role: 'admin' as const, event_type: 'vendor_verified', description: 'Verified NaijaPharm Distributors', metadata: { vendor_name: 'NaijaPharm Distributors' } },
    { actor_id: pharmacyUsers[0]?.id, actor_role: 'pharmacy' as const, event_type: 'order_placed', description: 'Placed order for Amoxicillin 500mg', metadata: { quantity: 50 } },
    { actor_id: adminUser?.id, actor_role: 'admin' as const, event_type: 'buyback_approved', description: 'Approved buy-back request for Ciprofloxacin', metadata: {} },
  ].filter(a => a.actor_id));

  // Platform config
  await supabase.from('platform_config').insert([
    { key: 'buyback_discount_tiers', value: { tier1: { max_shelf_pct: 10, discount: 70 }, tier2: { max_shelf_pct: 20, discount: 60 }, tier3: { max_shelf_pct: 30, discount: 50 } } },
  ]);

  return true;
}
