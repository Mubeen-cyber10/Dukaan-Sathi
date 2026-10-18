/**
 * Dukaan Saathi - Shared Application Data Store
 * Safe persistent state management across separate HTML pages.
 */

const STORAGE_KEYS = {
  CUSTOMERS: 'ds_customers_data_v2',
  ORDERS: 'ds_orders_data_v2',
  PRODUCTS: 'ds_products_data_v2',
  AUDIT: 'ds_audit_data_v2',
  DISPUTES: 'ds_disputes_data_v2',
  PLANS: 'ds_plans_data_v2'
};

// DEMO USERS WITH PRE-COMPUTED SHA-256 PASSWORDS
// Passwords hashed using Web Crypto SHA-256
// Hamza Ali: Shop@12345 -> 58c92a1b723b116f5594ff3796cbbdc92ad0246555f7d70ecfc98ae88b87491d
// Sara Khan: Admin@12345 -> 6f2cb9dd8f4b65e24e1c3f3fa5bc57982349237f11abceacd45bbcb74d621c25
const DEMO_USERS = [
  {
    id: 'user-001',
    name: 'Hamza Ali',
    email: 'shopowner@dukaansaathi.pk',
    phone: '0300-1234567',
    role: 'owner',
    shopId: 'shop-101',
    shopName: 'Bismillah General Store',
    passwordHash: '58c92a1b723b116f5594ff3796cbbdc92ad0246555f7d70ecfc98ae88b87491d'
  },
  {
    id: 'user-002',
    name: 'Sara Khan',
    email: 'admin@dukaansaathi.pk',
    phone: '0311-9876543',
    role: 'admin',
    shopId: null,
    shopName: 'Dukaan Saathi Platform Operations',
    passwordHash: '6f2cb9dd8f4b65e24e1c3f3fa5bc57982349237f11abceacd45bbcb74d621c25'
  }
];

const INITIAL_SHOP = {
  name: 'Bismillah General Store',
  location: 'Multan, Pakistan',
  owner: 'Hamza Ali',
  role: 'Shop Owner'
};

const INITIAL_CUSTOMERS = [
  {
    id: 1,
    name: 'Ahmed Raza',
    phone: '0300-***-**45',
    fullPhone: '0300-1234545',
    balance: 4500,
    lastActivity: '2026-09-28',
    entries: [
      { id: 101, date: '2026-09-15', type: 'credit', amount: 3000, note: 'Monthly groceries ration', runningBalance: 3000, recordedBy: 'Shop Owner' },
      { id: 102, date: '2026-09-20', type: 'credit', amount: 2500, note: 'Habib oil 5L & Sufi flour', runningBalance: 5500, recordedBy: 'Shop Owner' },
      { id: 103, date: '2026-09-28', type: 'payment', amount: 1000, note: 'Partial payment received', runningBalance: 4500, recordedBy: 'Shop Owner' }
    ]
  },
  {
    id: 2,
    name: 'Sana Malik',
    phone: '0312-***-**78',
    fullPhone: '0312-9876578',
    balance: 0,
    lastActivity: '2026-09-25',
    entries: [
      { id: 104, date: '2026-09-10', type: 'credit', amount: 2000, note: 'Household detergents', runningBalance: 2000, recordedBy: 'Shop Owner' },
      { id: 105, date: '2026-09-25', type: 'payment', amount: 2000, note: 'Full account clearance', runningBalance: 0, recordedBy: 'Shop Owner' }
    ]
  },
  {
    id: 3,
    name: 'Bilal Hussain',
    phone: '0321-***-**12',
    fullPhone: '0321-4567812',
    balance: 12000,
    lastActivity: '2026-09-29',
    entries: [
      { id: 106, date: '2026-09-01', type: 'credit', amount: 8000, note: 'Bulk rice 20kg & sugar', runningBalance: 8000, recordedBy: 'Shop Owner' },
      { id: 107, date: '2026-09-15', type: 'credit', amount: 6000, note: 'Teas & dry milk packs', runningBalance: 14000, recordedBy: 'Shop Owner' },
      { id: 108, date: '2026-09-29', type: 'payment', amount: 2000, note: 'Cash payment', runningBalance: 12000, recordedBy: 'Shop Owner' }
    ]
  },
  {
    id: 4,
    name: 'Hina Fatima',
    phone: '0333-***-**90',
    fullPhone: '0333-7890190',
    balance: 2800,
    lastActivity: '2026-09-26',
    entries: [
      { id: 109, date: '2026-09-18', type: 'credit', amount: 4000, note: 'Spices & ghee', runningBalance: 4000, recordedBy: 'Shop Owner' },
      { id: 110, date: '2026-09-26', type: 'payment', amount: 1200, note: 'EasyPaisa transfer', runningBalance: 2800, recordedBy: 'Shop Owner' }
    ]
  },
  {
    id: 5,
    name: 'Usman Tariq',
    phone: '0345-***-**56',
    fullPhone: '0345-2345656',
    balance: 0,
    lastActivity: '2026-09-14',
    entries: [
      { id: 111, date: '2026-09-05', type: 'credit', amount: 3500, note: 'Beverages & snacks', runningBalance: 3500, recordedBy: 'Shop Owner' },
      { id: 112, date: '2026-09-14', type: 'payment', amount: 3500, note: 'Cleared balance', runningBalance: 0, recordedBy: 'Shop Owner' }
    ]
  },
  {
    id: 6,
    name: 'Ayesha Khan',
    phone: '0301-***-**34',
    fullPhone: '0301-3456734',
    balance: 7200,
    lastActivity: '2026-09-27',
    entries: [
      { id: 113, date: '2026-09-12', type: 'credit', amount: 7200, note: 'Festival ration package', runningBalance: 7200, recordedBy: 'Shop Owner' }
    ]
  },
  {
    id: 7,
    name: 'Imran Shah',
    phone: '0315-***-**67',
    fullPhone: '0315-6789067',
    balance: 18500,
    lastActivity: '2026-09-30',
    entries: [
      { id: 114, date: '2026-08-20', type: 'credit', amount: 15000, note: 'Bulk shop stocking', runningBalance: 15000, recordedBy: 'Shop Owner' },
      { id: 115, date: '2026-09-10', type: 'credit', amount: 6500, note: 'Additional oil crates', runningBalance: 21500, recordedBy: 'Shop Owner' },
      { id: 116, date: '2026-09-30', type: 'payment', amount: 3000, note: 'JazzCash payment', runningBalance: 18500, recordedBy: 'Shop Owner' }
    ]
  },
  {
    id: 8,
    name: 'Zainab Bibi',
    phone: '0308-***-**23',
    fullPhone: '0308-5678923',
    balance: 1500,
    lastActivity: '2026-09-27',
    entries: [
      { id: 117, date: '2026-09-22', type: 'credit', amount: 2500, note: 'Daily essentials', runningBalance: 2500, recordedBy: 'Shop Owner' },
      { id: 118, date: '2026-09-27', type: 'payment', amount: 1000, note: 'Part payment', runningBalance: 1500, recordedBy: 'Shop Owner' }
    ]
  },
  {
    id: 9,
    name: 'Tariq Mehmood',
    phone: '0346-***-**89',
    fullPhone: '0346-8901289',
    balance: 9300,
    lastActivity: '2026-09-30',
    entries: [
      { id: 119, date: '2026-09-16', type: 'credit', amount: 10300, note: 'Construction tea/snack account', runningBalance: 10300, recordedBy: 'Shop Owner' },
      { id: 120, date: '2026-09-30', type: 'payment', amount: 1000, note: 'Cash payment', runningBalance: 9300, recordedBy: 'Shop Owner' }
    ]
  },
  {
    id: 10,
    name: 'Rabia Noor',
    phone: '0334-***-**01',
    fullPhone: '0334-9012301',
    balance: 0,
    lastActivity: '2026-09-19',
    entries: [
      { id: 121, date: '2026-09-02', type: 'credit', amount: 3500, note: 'Baby formula milk', runningBalance: 3500, recordedBy: 'Shop Owner' },
      { id: 122, date: '2026-09-19', type: 'payment', amount: 3500, note: 'Settled in full', runningBalance: 0, recordedBy: 'Shop Owner' }
    ]
  }
];

const INITIAL_ORDERS = [
  { id: 'ORD-1042', customer: 'Ahmed Raza', items: 'Habib Cooking Oil 5L (x1), Tapal Danedar Tea (x2)', total: 3450, status: 'Placed', time: 'Today, 10:42 AM' },
  { id: 'ORD-1041', customer: 'Sana Malik', items: 'Olper Milk 1L Box (x6), Sufi Flour 10kg (x1)', total: 2800, status: 'Confirmed', time: 'Today, 09:15 AM' },
  { id: 'ORD-1040', customer: 'Bilal Hussain', items: 'Guard Basmati Rice 5kg (x2)', total: 3600, status: 'Packed', time: 'Yesterday' },
  { id: 'ORD-1039', customer: 'Imran Shah', items: 'Bulk Sugar 50kg (x1)', total: 7200, status: 'Out for delivery', time: 'Yesterday' },
  { id: 'ORD-1038', customer: 'Ayesha Khan', items: 'National Spices Pack (x4)', total: 1400, status: 'Delivered', time: '26 Sep 2026' },
  { id: 'ORD-1037', customer: 'Tariq Mehmood', items: 'Lipton Yellow Label 450g (x2)', total: 1950, status: 'Cancelled', time: '25 Sep 2026' }
];

const INITIAL_PRODUCTS = [
  { id: 1, name: 'Habib Cooking Oil 5L', category: 'Oil & Ghee', price: 2650, stock: 14, minStock: 5 },
  { id: 2, name: 'Sufi Super Gold Ghee 1kg', category: 'Oil & Ghee', price: 580, stock: 3, minStock: 10 },
  { id: 3, name: 'Guard Rice Supreme 5kg', category: 'Grains & Pulses', price: 1800, stock: 22, minStock: 8 },
  { id: 4, name: 'Tapal Danedar Tea 450g', category: 'Beverages', price: 950, stock: 18, minStock: 6 },
  { id: 5, name: 'Olper\'s Milk 1L Pack', category: 'Dairy', price: 290, stock: 45, minStock: 15 },
  { id: 6, name: 'National Chili Powder 200g', category: 'Spices', price: 240, stock: 2, minStock: 5 },
  { id: 7, name: 'Surf Excel Washing Powder 1kg', category: 'Household', price: 680, stock: 11, minStock: 5 },
  { id: 8, name: 'Lux Soap 140g Pack of 3', category: 'Personal Care', price: 420, stock: 16, minStock: 4 }
];

const INITIAL_AUDIT = [
  { id: 1, time: '10:42 AM Today', text: 'Payment Rs. 1,000 received from Ahmed Raza', actor: 'Shop Owner' },
  { id: 2, time: '09:30 AM Today', text: 'Order #ORD-1041 marked Confirmed', actor: 'Shop Owner' },
  { id: 3, time: 'Yesterday', text: 'Payment Rs. 3,000 received from Imran Shah', actor: 'Shop Owner' },
  { id: 4, time: '28 Sep 2026', text: 'Credit sale Rs. 2,500 logged for Ahmed Raza', actor: 'Shop Owner' }
];

// 12 REALISTIC PAKISTANI SHOPS FOR SUPER ADMIN PORTAL
// Data minimization: Document status shown as words only ("CNIC: Verified"), never actual or masked numbers
const INITIAL_SHOPS = [
  { id: 'SHP-101', name: 'Bismillah General Store', city: 'Multan', owner: 'Hamza Ali', documentStatus: 'CNIC: Verified', plan: 'Standard', status: 'Active', joinedDate: '2026-08-15' },
  { id: 'SHP-102', name: 'Madina Karyana Store', city: 'Faisalabad', owner: 'Muhammad Usman', documentStatus: 'CNIC: Verified', plan: 'Free', status: 'Active', joinedDate: '2026-08-20' },
  { id: 'SHP-103', name: 'Al-Rehman Super Store', city: 'Lahore', owner: 'Rehman Malik', documentStatus: 'CNIC: Verified', plan: 'Pro', status: 'Active', joinedDate: '2026-08-25' },
  { id: 'SHP-104', name: 'Khyber Spices & Kiryana', city: 'Peshawar', owner: 'Gul Khan', documentStatus: 'CNIC: Pending Verification', plan: 'Standard', status: 'Pending Approval', joinedDate: '2026-09-28' },
  { id: 'SHP-105', name: 'Karachi Mart Gulshan', city: 'Karachi', owner: 'Farhan Siddiqui', documentStatus: 'CNIC: Pending Verification', plan: 'Pro', status: 'Pending Approval', joinedDate: '2026-09-29' },
  { id: 'SHP-106', name: 'Subhanallah Dairy & Bakers', city: 'Rawalpindi', owner: 'Naveed Akhtar', documentStatus: 'CNIC: Pending Verification', plan: 'Free', status: 'Pending Approval', joinedDate: '2026-09-30' },
  { id: 'SHP-107', name: 'Chaudhry & Sons Traders', city: 'Sialkot', owner: 'Tariq Chaudhry', documentStatus: 'CNIC: Verified', plan: 'Standard', status: 'Active', joinedDate: '2026-09-02' },
  { id: 'SHP-108', name: 'Bolan Provision Store', city: 'Quetta', owner: 'Abdul Wahab', documentStatus: 'CNIC: Suspended', plan: 'Free', status: 'Suspended', joinedDate: '2026-07-10' },
  { id: 'SHP-109', name: 'Mehran Sweet & Bakers', city: 'Hyderabad', owner: 'Zulfiqar Ali', documentStatus: 'CNIC: Verified', plan: 'Standard', status: 'Active', joinedDate: '2026-09-12' },
  { id: 'SHP-110', name: 'Al-Barkat Mart', city: 'Gujranwala', owner: 'Shahid Butt', documentStatus: 'CNIC: Verified', plan: 'Free', status: 'Active', joinedDate: '2026-09-18' },
  { id: 'SHP-111', name: 'Ittefaq General Merchant', city: 'Sahiwal', owner: 'Kashif Rasool', documentStatus: 'CNIC: Rejected', plan: 'Standard', status: 'Rejected', joinedDate: '2026-09-22' },
  { id: 'SHP-112', name: 'Qalandar Foods & Ration', city: 'Larkana', owner: 'Ghulam Mustafa', documentStatus: 'CNIC: Verified', plan: 'Free', status: 'Active', joinedDate: '2026-09-24' }
];

// SUBSCRIPTION PLANS MOCK DATA
const INITIAL_PLANS = [
  { id: 'plan-free', name: 'Free Starter', price: 0, period: 'Forever', shopsLimit: 1, staffLimit: 1, activeSubscribers: 420, features: ['1 Shop Storefront', 'Up to 25 Customers', 'Digital Khata', 'Basic Reports'] },
  { id: 'plan-standard', name: 'Standard Dukaan', price: 1500, period: 'per month', shopsLimit: 1, staffLimit: 3, activeSubscribers: 860, isPopular: true, features: ['1 Shop Storefront', 'Unlimited Customers', 'All 6 Modules', '3 Staff Accounts', 'SMS Reminders'] },
  { id: 'plan-pro', name: 'Pro Merchant', price: 3500, period: 'per month', shopsLimit: 5, staffLimit: 10, activeSubscribers: 140, features: ['Up to 5 Shops', 'Unlimited Everything', 'Advanced Analytics', '10 Staff Accounts', 'Priority Support'] }
];

// 8 REALISTIC PLATFORM DISPUTES MOCK DATA FOR SUPER ADMIN
const INITIAL_DISPUTES = [
  { id: 'DSP-201', shopId: 'SHP-101', shopName: 'Bismillah General Store', customerName: 'Ahmed Raza', amount: 2500, type: 'Credit Entry Dispute', description: 'Customer claims Rs. 2,500 cooking oil entry was paid in cash on 20 Sep.', status: 'Open', filedDate: '2026-09-28' },
  { id: 'DSP-202', shopId: 'SHP-103', shopName: 'Al-Rehman Super Store', customerName: 'Kamran Akmal', amount: 5000, type: 'Payment Sync Issue', description: 'Bank transfer receipt uploaded but not reflected in customer balance.', status: 'Under Review', filedDate: '2026-09-27' },
  { id: 'DSP-203', shopId: 'SHP-107', shopName: 'Chaudhry & Sons Traders', customerName: 'Nasir Jamshed', amount: 1200, type: 'Calculation Discrepancy', description: 'Running balance calculation mismatch reported after returning 2 items.', status: 'Resolved', filedDate: '2026-09-20', resolution: 'Verified physical return voucher #4412. Shopkeeper adjusted ledger balance.' },
  { id: 'DSP-204', shopId: 'SHP-105', shopName: 'Karachi Mart Gulshan', customerName: 'Murtaza Hashmi', amount: 3200, type: 'Duplicate Credit Entry', description: 'Customer billed twice for 10kg flour bag on 22 Sep.', status: 'Open', filedDate: '2026-09-29' },
  { id: 'DSP-205', shopId: 'SHP-102', shopName: 'Madina Karyana Store', customerName: 'Sohail Tanvir', amount: 580, type: 'Return Refund Discrepancy', description: 'Defective ghee tin returned; credit note of Rs. 580 not credited to ledger.', status: 'Under Review', filedDate: '2026-09-28' },
  { id: 'DSP-206', shopId: 'SHP-106', shopName: 'Subhanallah Dairy & Bakers', customerName: 'Waqar Younis', amount: 1800, type: 'Pricing Mismatch', description: 'Milk crate charged at Rs. 320/L instead of agreed Rs. 290/L promotional rate.', status: 'Open', filedDate: '2026-09-30' },
  { id: 'DSP-207', shopId: 'SHP-108', shopName: 'Bolan Provision Store', customerName: 'Sarfaraz Ahmed', amount: 4000, type: 'Payment Allocation Error', description: 'Cash installment of Rs. 4,000 recorded under wrong customer profile.', status: 'Resolved', filedDate: '2026-09-18', resolution: 'Audit log trace confirmed cashier miskeyed customer ID. Reallocated.' },
  { id: 'DSP-208', shopId: 'SHP-104', shopName: 'Khyber Spices & Kiryana', customerName: 'Umar Gul', amount: 1450, type: 'Unauthorized Credit Request', description: 'Walk-in relative requested credit without account holder PIN authorization.', status: 'Open', filedDate: '2026-09-30' }
];

// Data Store Helper API
const DS_DATA = {
  getCustomers: function() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : INITIAL_CUSTOMERS;
    } catch(e) {
      return INITIAL_CUSTOMERS;
    }
  },
  saveCustomers: function(customers) {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch(e) {}
  },
  getOrders: function() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return data ? JSON.parse(data) : INITIAL_ORDERS;
    } catch(e) {
      return INITIAL_ORDERS;
    }
  },
  saveOrders: function(orders) {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch(e) {}
  },
  getProducts: function() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : INITIAL_PRODUCTS;
    } catch(e) {
      return INITIAL_PRODUCTS;
    }
  },
  saveProducts: function(products) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch(e) {}
  },
  getAudit: function() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT);
      return data ? JSON.parse(data) : INITIAL_AUDIT;
    } catch(e) {
      return INITIAL_AUDIT;
    }
  },
  addAudit: function(text) {
    const audit = this.getAudit();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) + ' Today';
    audit.unshift({ id: Date.now(), time: timeStr, text: text, actor: 'Shop Owner' });
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(audit.slice(0, 15)));
    } catch(e) {}
  },
  getShops: function() {
    if (typeof window !== 'undefined' && window.DS_SHOPS_STORE) {
      return window.DS_SHOPS_STORE.getAllShops();
    }
    try {
      const data = sessionStorage.getItem('ds-shops');
      return data ? JSON.parse(data) : INITIAL_SHOPS;
    } catch(e) {
      return INITIAL_SHOPS;
    }
  },
  saveShops: function(shops) {
    try {
      sessionStorage.setItem('ds-shops', JSON.stringify(shops));
    } catch(e) {}
  },
  updateShopStatus: function(shopId, newStatus) {
    const shops = this.getShops();
    const found = shops.find(s => s.id === shopId);
    if (found) {
      found.status = newStatus;
      if (newStatus === 'Active') {
        found.documentStatus = 'CNIC: Verified';
      } else if (newStatus === 'Rejected') {
        found.documentStatus = 'CNIC: Rejected';
      } else if (newStatus === 'Suspended') {
        found.documentStatus = 'CNIC: Suspended';
      }
      this.saveShops(shops);
      if (typeof window !== 'undefined' && window.DS_SHOPS_STORE) {
        window.DS_SHOPS_STORE.updateStatus(shopId, newStatus);
      }
      return true;
    }
    return false;
  },
  getPlans: function() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLANS);
      return data ? JSON.parse(data) : INITIAL_PLANS;
    } catch(e) {
      return INITIAL_PLANS;
    }
  },
  savePlans: function(plans) {
    try {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
    } catch(e) {}
  },
  updatePlan: function(planId, newPrice, newStaffLimit) {
    const plans = this.getPlans();
    const found = plans.find(p => p.id === planId);
    if (found) {
      found.price = Number(newPrice);
      found.staffLimit = Number(newStaffLimit);
      this.savePlans(plans);
      return true;
    }
    return false;
  },
  getDisputes: function() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DISPUTES);
      return data ? JSON.parse(data) : INITIAL_DISPUTES;
    } catch(e) {
      return INITIAL_DISPUTES;
    }
  },
  saveDisputes: function(disputes) {
    try {
      localStorage.setItem(STORAGE_KEYS.DISPUTES, JSON.stringify(disputes));
    } catch(e) {}
  },
  resolveDispute: function(disputeId, resolutionNote) {
    const disputes = this.getDisputes();
    const item = disputes.find(d => d.id === disputeId);
    if (item) {
      item.status = 'Resolved';
      item.resolution = resolutionNote;
      this.saveDisputes(disputes);
      return true;
    }
    return false;
  }
};

function formatMoney(amount) {
  return 'Rs. ' + Number(amount || 0).toLocaleString('en-PK');
}

function getInitials(name) {
  if (!name) return 'DS';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
