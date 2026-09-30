/**
 * Dukaan Saathi - Shared Application Data Store
 * Safe persistent state management across separate HTML pages.
 */

const STORAGE_KEYS = {
  CUSTOMERS: 'ds_customers_data_v2',
  ORDERS: 'ds_orders_data_v2',
  PRODUCTS: 'ds_products_data_v2',
  AUDIT: 'ds_audit_data_v2'
};

const INITIAL_SHOP = {
  name: 'Bismillah General Store',
  location: 'Multan, Pakistan',
  owner: 'Hamza Sahab',
  role: 'Shop Owner'
};

const INITIAL_CUSTOMERS = [
  {
    id: 1,
    name: 'Ahmed Raza',
    phone: '0300-***-**45',
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
