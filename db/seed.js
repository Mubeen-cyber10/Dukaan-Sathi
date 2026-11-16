const { randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const { appendAudit } = require('../server/audit');

const shops = [
  ['Hamza Ali', 'shopowner@dukaansaathi.pk', 'Shop@12345', 'Bismillah General Store', 'General Store', 'Multan', 'Active'],
  ['Bilal Ahmed', 'bilal@dukaansaathi.pk', 'Bilal@12345', 'Al-Madina Mart', 'General Store', 'Lahore', 'Active'],
  ['Farah Noor', 'farah@dukaansaathi.pk', null, 'Safa Textiles', 'Clothing', 'Lahore', 'Active'],
  ['Ali Tariq', 'ali@dukaansaathi.pk', null, 'Iqbal Electronics', 'Electronics', 'Karachi', 'Pending'],
  ['Fatima Shah', 'fatima@dukaansaathi.pk', null, 'Mehran Bakery', 'Food & Bakery', 'Karachi', 'Active'],
  ['Omar Khan', 'omar@dukaansaathi.pk', null, 'Pindi Hardware', 'Hardware', 'Rawalpindi', 'Rejected'],
  ['Hina Aziz', 'hina@dukaansaathi.pk', null, 'City Pharmacy', 'Pharmacy', 'Islamabad', 'Suspended'],
  ['Tariq Noor', 'tariq@dukaansaathi.pk', null, 'Chenab Market', 'General Store', 'Faisalabad', 'Pending']
];

const customerNames = [
  ['Ahmed Raza', 'Ayesha Malik', 'Usman Khan', 'Zainab Bibi', 'Bilal Tariq', 'Sadia Noor', 'Nadeem Iqbal', 'Hassan Ali'],
  ['Amna Sheikh', 'Haris Riaz', 'Mariam Abbas', 'Sami Ullah']
];

function seed(db) {
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertShop = db.prepare(`
    INSERT INTO shops (owner_id, name, category, city, address, description, status, reject_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCustomer = db.prepare('INSERT INTO customers (shop_id, name, phone) VALUES (?, ?, ?)');
  const insertEntry = db.prepare(`
    INSERT INTO khata_entries (shop_id, customer_id, type, amount, note, recorded_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const adminId = insertUser.run('Sara Khan', 'admin@dukaansaathi.pk', '03119876543',
    bcrypt.hashSync('Admin@12345', 12), 'admin', 'Active').lastInsertRowid;
  appendAudit(db, { action: 'SEED_USER', target: 'user:' + adminId });

  for (const [index, [name, email, password, shop, category, city, status]] of shops.entries()) {
    const hash = bcrypt.hashSync(password || randomBytes(32).toString('hex'), 12);
    const ownerId = insertUser.run(name, email, '0300123456' + index, hash, 'owner', status).lastInsertRowid;
    const shopId = insertShop.run(ownerId, shop, category, city, 'Shop ' + (index + 1) + ', Main Bazaar',
      'Local shop serving ' + city + '.', status, status === 'Rejected' ? 'Application incomplete.' : null).lastInsertRowid;
    appendAudit(db, { action: 'SEED_SHOP', target: 'shop:' + shopId, detail: status });

    const actor = { id: ownerId, role: 'owner' };
    for (const [position, customer] of (customerNames[index] || []).entries()) {
      const customerId = insertCustomer.run(shopId, customer, '03001234' + (545 + position)).lastInsertRowid;
      appendAudit(db, { actor, action: 'CUSTOMER_CREATED', target: 'customer:' + customerId });
      const entryCount = 3 + position % 3;
      for (let entry = 0; entry < entryCount; entry++) {
        const type = entry % 3 === 2 ? 'payment' : 'credit';
        const amount = type === 'credit' ? 450 + position * 135 + entry * 80 : 250;
        const ts = new Date(Date.now() - (entryCount - entry) * 86400000).toISOString();
        const entryId = insertEntry.run(shopId, customerId, type, amount,
          type === 'credit' ? 'Store purchase' : 'Cash received', ownerId, ts).lastInsertRowid;
        appendAudit(db, { actor, action: 'KHATA_ENTRY_CREATED', target: 'entry:' + entryId, detail: type + ':' + amount });
      }
    }
  }
}

module.exports = { seed };
