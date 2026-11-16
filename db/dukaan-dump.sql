CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Active', 'Rejected', 'Suspended')),
  failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE shops (
  id INTEGER PRIMARY KEY,
  owner_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  name TEXT NOT NULL COLLATE NOCASE,
  category TEXT NOT NULL,
  city TEXT NOT NULL COLLATE NOCASE,
  address TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  public_phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Active', 'Rejected', 'Suspended')),
  reject_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (name, city)
);

CREATE INDEX shops_status ON shops(status);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (shop_id, id)
);

CREATE TABLE khata_entries (
  id INTEGER PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  customer_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'payment')),
  amount INTEGER NOT NULL CHECK (typeof(amount) = 'integer' AND amount BETWEEN 1 AND 500000),
  note TEXT NOT NULL DEFAULT '',
  recorded_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (shop_id, customer_id) REFERENCES customers(shop_id, id)
);

CREATE INDEX khata_customer ON khata_entries(shop_id, customer_id, id);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY,
  ts TEXT NOT NULL,
  actor_id INTEGER REFERENCES users(id),
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  detail TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  hash TEXT NOT NULL
);

CREATE TRIGGER khata_no_update BEFORE UPDATE ON khata_entries
BEGIN SELECT RAISE(ABORT, 'append-only'); END;
CREATE TRIGGER khata_no_delete BEFORE DELETE ON khata_entries
BEGIN SELECT RAISE(ABORT, 'append-only'); END;
CREATE TRIGGER audit_no_update BEFORE UPDATE ON audit_log
BEGIN SELECT RAISE(ABORT, 'append-only'); END;
CREATE TRIGGER audit_no_delete BEFORE DELETE ON audit_log
BEGIN SELECT RAISE(ABORT, 'append-only'); END;

BEGIN TRANSACTION;
INSERT INTO users (id, name, email, phone, password_hash, role, status, failed_attempts, locked_until, created_at) VALUES (1, 'Sara Khan', 'admin@dukaansaathi.pk', '03119876543', '$2b$12$1RMxkqLurwwGEuEe.v7E/.cL5taOQc16mx7aOuhvuTYYH3OSPfL4S', 'admin', 'Active', 0, NULL, '2026-11-16T08:24:22.126Z');
INSERT INTO users (id, name, email, phone, password_hash, role, status, failed_attempts, locked_until, created_at) VALUES (2, 'Hamza Ali', 'shopowner@dukaansaathi.pk', '03001234560', '$2b$12$/bc7i/6vhEQ4sHnU4eNovOw64XGbpEqMto0sPPPE02kI30CPLbg6.', 'owner', 'Active', 0, NULL, '2026-11-16T08:24:22.430Z');
INSERT INTO users (id, name, email, phone, password_hash, role, status, failed_attempts, locked_until, created_at) VALUES (3, 'Bilal Ahmed', 'bilal@dukaansaathi.pk', '03001234561', '$2b$12$L/XNMHPQrRerXLlUxciIN.8HleKuMDEzFSuDIFC4qRcjjuSpEAKP.', 'owner', 'Active', 0, NULL, '2026-11-16T08:24:22.735Z');
INSERT INTO users (id, name, email, phone, password_hash, role, status, failed_attempts, locked_until, created_at) VALUES (4, 'Farah Noor', 'farah@dukaansaathi.pk', '03001234562', '$2b$12$vAbUaM5oKXnx3hq9cjeLoe0zePGzQJ.4YrGWtRcufXNuenPnKhuIi', 'owner', 'Active', 0, NULL, '2026-11-16T08:24:23.017Z');
INSERT INTO users (id, name, email, phone, password_hash, role, status, failed_attempts, locked_until, created_at) VALUES (5, 'Ali Tariq', 'ali@dukaansaathi.pk', '03001234563', '$2b$12$kBv3Ox6RRyekq5jUm5OFg.8bvAl7F6csAZzPaq3f0bvXr2cwkROda', 'owner', 'Pending', 0, NULL, '2026-11-16T08:24:23.318Z');
INSERT INTO users (id, name, email, phone, password_hash, role, status, failed_attempts, locked_until, created_at) VALUES (6, 'Fatima Shah', 'fatima@dukaansaathi.pk', '03001234564', '$2b$12$ujXuBHpNdWV7WiDHTN.2ves/sk54p0ywR3ZkxMQy2L4nKZDpEn3Ai', 'owner', 'Active', 0, NULL, '2026-11-16T08:24:23.596Z');
INSERT INTO users (id, name, email, phone, password_hash, role, status, failed_attempts, locked_until, created_at) VALUES (7, 'Omar Khan', 'omar@dukaansaathi.pk', '03001234565', '$2b$12$nyhuC7bwJPYIbxf6owp7Se2oWS5LVzKPqiXGty8OqT0GLg9IFb5CG', 'owner', 'Rejected', 0, NULL, '2026-11-16T08:24:23.875Z');
INSERT INTO users (id, name, email, phone, password_hash, role, status, failed_attempts, locked_until, created_at) VALUES (8, 'Hina Aziz', 'hina@dukaansaathi.pk', '03001234566', '$2b$12$SS99Dzk3lqG4nsOWK2/K0eNG8rKnij5DJsc155hdpiesjavFRCt2.', 'owner', 'Suspended', 0, NULL, '2026-11-16T08:24:24.149Z');
INSERT INTO users (id, name, email, phone, password_hash, role, status, failed_attempts, locked_until, created_at) VALUES (9, 'Tariq Noor', 'tariq@dukaansaathi.pk', '03001234567', '$2b$12$YXbHPUuVzQigjSecHTHEJOPFGXbXRja3jJaJxN2N.i4fUtgZXIPbG', 'owner', 'Pending', 0, NULL, '2026-11-16T08:24:24.418Z');
INSERT INTO shops (id, owner_id, name, category, city, address, description, public_phone, status, reject_reason, created_at) VALUES (1, 2, 'Bismillah General Store', 'General Store', 'Multan', 'Shop 1, Main Bazaar', 'Local shop serving Multan.', NULL, 'Active', NULL, '2026-11-16T08:24:22.430Z');
INSERT INTO shops (id, owner_id, name, category, city, address, description, public_phone, status, reject_reason, created_at) VALUES (2, 3, 'Al-Madina Mart', 'General Store', 'Lahore', 'Shop 2, Main Bazaar', 'Local shop serving Lahore.', NULL, 'Active', NULL, '2026-11-16T08:24:22.735Z');
INSERT INTO shops (id, owner_id, name, category, city, address, description, public_phone, status, reject_reason, created_at) VALUES (3, 4, 'Safa Textiles', 'Clothing', 'Lahore', 'Shop 3, Main Bazaar', 'Local shop serving Lahore.', NULL, 'Active', NULL, '2026-11-16T08:24:23.017Z');
INSERT INTO shops (id, owner_id, name, category, city, address, description, public_phone, status, reject_reason, created_at) VALUES (4, 5, 'Iqbal Electronics', 'Electronics', 'Karachi', 'Shop 4, Main Bazaar', 'Local shop serving Karachi.', NULL, 'Pending', NULL, '2026-11-16T08:24:23.318Z');
INSERT INTO shops (id, owner_id, name, category, city, address, description, public_phone, status, reject_reason, created_at) VALUES (5, 6, 'Mehran Bakery', 'Food & Bakery', 'Karachi', 'Shop 5, Main Bazaar', 'Local shop serving Karachi.', NULL, 'Active', NULL, '2026-11-16T08:24:23.596Z');
INSERT INTO shops (id, owner_id, name, category, city, address, description, public_phone, status, reject_reason, created_at) VALUES (6, 7, 'Pindi Hardware', 'Hardware', 'Rawalpindi', 'Shop 6, Main Bazaar', 'Local shop serving Rawalpindi.', NULL, 'Rejected', 'Application incomplete.', '2026-11-16T08:24:23.875Z');
INSERT INTO shops (id, owner_id, name, category, city, address, description, public_phone, status, reject_reason, created_at) VALUES (7, 8, 'City Pharmacy', 'Pharmacy', 'Islamabad', 'Shop 7, Main Bazaar', 'Local shop serving Islamabad.', NULL, 'Suspended', NULL, '2026-11-16T08:24:24.149Z');
INSERT INTO shops (id, owner_id, name, category, city, address, description, public_phone, status, reject_reason, created_at) VALUES (8, 9, 'Chenab Market', 'General Store', 'Faisalabad', 'Shop 8, Main Bazaar', 'Local shop serving Faisalabad.', NULL, 'Pending', NULL, '2026-11-16T08:24:24.418Z');
INSERT INTO customers (id, shop_id, name, phone, created_at) VALUES (1, 1, 'Ahmed Raza', '03001234545', '2026-11-16T08:24:22.431Z');
INSERT INTO customers (id, shop_id, name, phone, created_at) VALUES (2, 1, 'Ayesha Malik', '03001234546', '2026-11-16T08:24:22.431Z');
INSERT INTO customers (id, shop_id, name, phone, created_at) VALUES (3, 1, 'Usman Khan', '03001234547', '2026-11-16T08:24:22.431Z');
INSERT INTO customers (id, shop_id, name, phone, created_at) VALUES (4, 1, 'Zainab Bibi', '03001234548', '2026-11-16T08:24:22.431Z');
INSERT INTO customers (id, shop_id, name, phone, created_at) VALUES (5, 1, 'Bilal Tariq', '03001234549', '2026-11-16T08:24:22.432Z');
INSERT INTO customers (id, shop_id, name, phone, created_at) VALUES (6, 1, 'Sadia Noor', '03001234550', '2026-11-16T08:24:22.432Z');
INSERT INTO customers (id, shop_id, name, phone, created_at) VALUES (7, 1, 'Nadeem Iqbal', '03001234551', '2026-11-16T08:24:22.432Z');
INSERT INTO customers (id, shop_id, name, phone, created_at) VALUES (8, 1, 'Hassan Ali', '03001234552', '2026-11-16T08:24:22.432Z');
INSERT INTO customers (id, shop_id, name, phone, created_at) VALUES (9, 2, 'Amna Sheikh', '03001234545', '2026-11-16T08:24:22.735Z');
INSERT INTO customers (id, shop_id, name, phone, created_at) VALUES (10, 2, 'Haris Riaz', '03001234546', '2026-11-16T08:24:22.735Z');
INSERT INTO customers (id, shop_id, name, phone, created_at) VALUES (11, 2, 'Mariam Abbas', '03001234547', '2026-11-16T08:24:22.736Z');
INSERT INTO customers (id, shop_id, name, phone, created_at) VALUES (12, 2, 'Sami Ullah', '03001234548', '2026-11-16T08:24:22.736Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (1, 1, 1, 'credit', 450, 'Store purchase', 2, '2026-11-13T08:24:22.431Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (2, 1, 1, 'credit', 530, 'Store purchase', 2, '2026-11-14T08:24:22.431Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (3, 1, 1, 'payment', 250, 'Cash received', 2, '2026-11-15T08:24:22.431Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (4, 1, 2, 'credit', 585, 'Store purchase', 2, '2026-11-12T08:24:22.431Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (5, 1, 2, 'credit', 665, 'Store purchase', 2, '2026-11-13T08:24:22.431Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (6, 1, 2, 'payment', 250, 'Cash received', 2, '2026-11-14T08:24:22.431Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (7, 1, 2, 'credit', 825, 'Store purchase', 2, '2026-11-15T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (8, 1, 3, 'credit', 720, 'Store purchase', 2, '2026-11-11T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (9, 1, 3, 'credit', 800, 'Store purchase', 2, '2026-11-12T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (10, 1, 3, 'payment', 250, 'Cash received', 2, '2026-11-13T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (11, 1, 3, 'credit', 960, 'Store purchase', 2, '2026-11-14T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (12, 1, 3, 'credit', 1040, 'Store purchase', 2, '2026-11-15T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (13, 1, 4, 'credit', 855, 'Store purchase', 2, '2026-11-13T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (14, 1, 4, 'credit', 935, 'Store purchase', 2, '2026-11-14T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (15, 1, 4, 'payment', 250, 'Cash received', 2, '2026-11-15T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (16, 1, 5, 'credit', 990, 'Store purchase', 2, '2026-11-12T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (17, 1, 5, 'credit', 1070, 'Store purchase', 2, '2026-11-13T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (18, 1, 5, 'payment', 250, 'Cash received', 2, '2026-11-14T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (19, 1, 5, 'credit', 1230, 'Store purchase', 2, '2026-11-15T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (20, 1, 6, 'credit', 1125, 'Store purchase', 2, '2026-11-11T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (21, 1, 6, 'credit', 1205, 'Store purchase', 2, '2026-11-12T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (22, 1, 6, 'payment', 250, 'Cash received', 2, '2026-11-13T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (23, 1, 6, 'credit', 1365, 'Store purchase', 2, '2026-11-14T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (24, 1, 6, 'credit', 1445, 'Store purchase', 2, '2026-11-15T08:24:22.432Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (25, 1, 7, 'credit', 1260, 'Store purchase', 2, '2026-11-13T08:24:22.433Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (26, 1, 7, 'credit', 1340, 'Store purchase', 2, '2026-11-14T08:24:22.433Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (27, 1, 7, 'payment', 250, 'Cash received', 2, '2026-11-15T08:24:22.433Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (28, 1, 8, 'credit', 1395, 'Store purchase', 2, '2026-11-12T08:24:22.433Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (29, 1, 8, 'credit', 1475, 'Store purchase', 2, '2026-11-13T08:24:22.433Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (30, 1, 8, 'payment', 250, 'Cash received', 2, '2026-11-14T08:24:22.433Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (31, 1, 8, 'credit', 1635, 'Store purchase', 2, '2026-11-15T08:24:22.433Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (32, 2, 9, 'credit', 450, 'Store purchase', 3, '2026-11-13T08:24:22.735Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (33, 2, 9, 'credit', 530, 'Store purchase', 3, '2026-11-14T08:24:22.735Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (34, 2, 9, 'payment', 250, 'Cash received', 3, '2026-11-15T08:24:22.735Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (35, 2, 10, 'credit', 585, 'Store purchase', 3, '2026-11-12T08:24:22.735Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (36, 2, 10, 'credit', 665, 'Store purchase', 3, '2026-11-13T08:24:22.735Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (37, 2, 10, 'payment', 250, 'Cash received', 3, '2026-11-14T08:24:22.735Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (38, 2, 10, 'credit', 825, 'Store purchase', 3, '2026-11-15T08:24:22.735Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (39, 2, 11, 'credit', 720, 'Store purchase', 3, '2026-11-11T08:24:22.735Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (40, 2, 11, 'credit', 800, 'Store purchase', 3, '2026-11-12T08:24:22.735Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (41, 2, 11, 'payment', 250, 'Cash received', 3, '2026-11-13T08:24:22.735Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (42, 2, 11, 'credit', 960, 'Store purchase', 3, '2026-11-14T08:24:22.736Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (43, 2, 11, 'credit', 1040, 'Store purchase', 3, '2026-11-15T08:24:22.736Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (44, 2, 12, 'credit', 855, 'Store purchase', 3, '2026-11-13T08:24:22.736Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (45, 2, 12, 'credit', 935, 'Store purchase', 3, '2026-11-14T08:24:22.736Z');
INSERT INTO khata_entries (id, shop_id, customer_id, type, amount, note, recorded_by, created_at) VALUES (46, 2, 12, 'payment', 250, 'Cash received', 3, '2026-11-15T08:24:22.736Z');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (1, '2026-11-16T08:24:22.139Z', NULL, 'system', 'SEED_USER', 'user:1', '', '0000000000000000000000000000000000000000000000000000000000000000', '18597a17e648cd7e980f127c446f58cca3539ff0d5958090448ce8e526a673e7');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (2, '2026-11-16T08:24:22.431Z', NULL, 'system', 'SEED_SHOP', 'shop:1', 'Active', '18597a17e648cd7e980f127c446f58cca3539ff0d5958090448ce8e526a673e7', 'd5cfcac1543ecb703a0fde0e5329bd62df3ab2a7fe6b6aecb5c2c02a0049ed88');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (3, '2026-11-16T08:24:22.431Z', 2, 'owner', 'CUSTOMER_CREATED', 'customer:1', '', 'd5cfcac1543ecb703a0fde0e5329bd62df3ab2a7fe6b6aecb5c2c02a0049ed88', '6b51c4395a5d2c6182029dcca9535e78fbe57b0a68680a7095e9f49e182c56b1');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (4, '2026-11-16T08:24:22.431Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:1', 'credit:450', '6b51c4395a5d2c6182029dcca9535e78fbe57b0a68680a7095e9f49e182c56b1', '2bbe5c40d0901ccaecabc2b2b5dc7c107df497e663ef3c5e08c47a7629592447');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (5, '2026-11-16T08:24:22.431Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:2', 'credit:530', '2bbe5c40d0901ccaecabc2b2b5dc7c107df497e663ef3c5e08c47a7629592447', '1bb3ff0c522063850cc9a94774793eb09141d15a0740f2449a3c6450ff7eca55');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (6, '2026-11-16T08:24:22.431Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:3', 'payment:250', '1bb3ff0c522063850cc9a94774793eb09141d15a0740f2449a3c6450ff7eca55', '5ac9416074e77dbd663ddb186c7d6a15e15dbd2eab913390da3651b9f16d0eb8');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (7, '2026-11-16T08:24:22.431Z', 2, 'owner', 'CUSTOMER_CREATED', 'customer:2', '', '5ac9416074e77dbd663ddb186c7d6a15e15dbd2eab913390da3651b9f16d0eb8', 'e60c7b6eaaddc542d51ee74887647f10aefc9f8a40b89c10fa22dcca0f8d0c8e');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (8, '2026-11-16T08:24:22.431Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:4', 'credit:585', 'e60c7b6eaaddc542d51ee74887647f10aefc9f8a40b89c10fa22dcca0f8d0c8e', '130287b7a145be84c16f6ac16f8133bd6074892683d1664436af7c7b7a39f5b8');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (9, '2026-11-16T08:24:22.431Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:5', 'credit:665', '130287b7a145be84c16f6ac16f8133bd6074892683d1664436af7c7b7a39f5b8', '4909d0fe842f0a79db901b09bc66b89dbada2718d82ff3c29fc9ee0ba2593c37');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (10, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:6', 'payment:250', '4909d0fe842f0a79db901b09bc66b89dbada2718d82ff3c29fc9ee0ba2593c37', 'dea3fb0afe8c0298fc63f2287d02d10431e8b58bcc1f5252e1366d0e3c60bc2d');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (11, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:7', 'credit:825', 'dea3fb0afe8c0298fc63f2287d02d10431e8b58bcc1f5252e1366d0e3c60bc2d', 'e1244dfea26f5e369d3e11fe141b57ac6497103cca68e897359331f2cb3c1a64');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (12, '2026-11-16T08:24:22.432Z', 2, 'owner', 'CUSTOMER_CREATED', 'customer:3', '', 'e1244dfea26f5e369d3e11fe141b57ac6497103cca68e897359331f2cb3c1a64', 'f2bc32deec72870b3b09b25533e1cbc80a424e6822b26c65a0598686e21b86ac');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (13, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:8', 'credit:720', 'f2bc32deec72870b3b09b25533e1cbc80a424e6822b26c65a0598686e21b86ac', '6032229d294d8258b0821e0999f4cc92c0ad8ebdec3ee134dac87bda661c0786');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (14, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:9', 'credit:800', '6032229d294d8258b0821e0999f4cc92c0ad8ebdec3ee134dac87bda661c0786', '593a817fb1e8f8884b029ee432b65b2ed53dc38375cd7e60d7bf6b9beb6c371c');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (15, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:10', 'payment:250', '593a817fb1e8f8884b029ee432b65b2ed53dc38375cd7e60d7bf6b9beb6c371c', '8a0ab3880952babe4ec4e7c8b71a5253aa82510bf61ab2d137aca9dba7b8879b');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (16, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:11', 'credit:960', '8a0ab3880952babe4ec4e7c8b71a5253aa82510bf61ab2d137aca9dba7b8879b', '4e3d57ddc0355bdc7c406367257086f989689e7abe80f42badc3433c17d2223b');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (17, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:12', 'credit:1040', '4e3d57ddc0355bdc7c406367257086f989689e7abe80f42badc3433c17d2223b', '85a96c5ee527255363b4e939725cc6ee47adf6d4f113f45537a9b459ba7a7aaf');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (18, '2026-11-16T08:24:22.432Z', 2, 'owner', 'CUSTOMER_CREATED', 'customer:4', '', '85a96c5ee527255363b4e939725cc6ee47adf6d4f113f45537a9b459ba7a7aaf', 'f3f897d6a53cfb60d102f19baa1e5ab53e24b15ce4609ca1641774b3edb9eb39');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (19, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:13', 'credit:855', 'f3f897d6a53cfb60d102f19baa1e5ab53e24b15ce4609ca1641774b3edb9eb39', '6e249b85a936dbbe0cfdea70694c31bfbb400a47c2e286a3b628542a5da66c3e');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (20, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:14', 'credit:935', '6e249b85a936dbbe0cfdea70694c31bfbb400a47c2e286a3b628542a5da66c3e', 'd37b2b070bec2501afb5dadd54d4e7d6386ff0f7bc9c86d70d43afbd2fdb52f6');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (21, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:15', 'payment:250', 'd37b2b070bec2501afb5dadd54d4e7d6386ff0f7bc9c86d70d43afbd2fdb52f6', 'e8c702dca62937db5267aa654d897fe99250d706c12ba56c68b63c8ee856b9b4');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (22, '2026-11-16T08:24:22.432Z', 2, 'owner', 'CUSTOMER_CREATED', 'customer:5', '', 'e8c702dca62937db5267aa654d897fe99250d706c12ba56c68b63c8ee856b9b4', '861f4a2be8f07c017b0c9b423aa32e47564a84ed0cc9df6c1d94d969e94b00d6');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (23, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:16', 'credit:990', '861f4a2be8f07c017b0c9b423aa32e47564a84ed0cc9df6c1d94d969e94b00d6', 'bfd047bc0128caddb33bf9c31af21110710170ccf2c3285438a46e24ee7a99c0');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (24, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:17', 'credit:1070', 'bfd047bc0128caddb33bf9c31af21110710170ccf2c3285438a46e24ee7a99c0', 'f09cc944d183c0909586d6aa33d62fe2e61c70541a8140d059befccc6eb68c24');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (25, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:18', 'payment:250', 'f09cc944d183c0909586d6aa33d62fe2e61c70541a8140d059befccc6eb68c24', '8f98dc50f30e6fa8f9d5f60080f6de517224be285a113ec28bdf110749a5900f');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (26, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:19', 'credit:1230', '8f98dc50f30e6fa8f9d5f60080f6de517224be285a113ec28bdf110749a5900f', '701022f00bd4f15f30b45aa285c3dc9a3ee9c6efa23e7f22fbf8ca9418160615');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (27, '2026-11-16T08:24:22.432Z', 2, 'owner', 'CUSTOMER_CREATED', 'customer:6', '', '701022f00bd4f15f30b45aa285c3dc9a3ee9c6efa23e7f22fbf8ca9418160615', 'afb287f83c65da321e1d51ded23c5a9de1048b6226ac0069567dd4e5e8dca1b3');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (28, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:20', 'credit:1125', 'afb287f83c65da321e1d51ded23c5a9de1048b6226ac0069567dd4e5e8dca1b3', '5b1747fa5b6b566a90abd547ea0ba4af967c1f8b6a610a292d948b8d17d5ad6f');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (29, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:21', 'credit:1205', '5b1747fa5b6b566a90abd547ea0ba4af967c1f8b6a610a292d948b8d17d5ad6f', 'd704c169333de29a90d9823b57d6f17807b8273fd7aa14c49fe4a65abbd32d4e');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (30, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:22', 'payment:250', 'd704c169333de29a90d9823b57d6f17807b8273fd7aa14c49fe4a65abbd32d4e', '89ee145ba2dd5a62ea8dd5d3b5bf7c6559c3ae3a5175c1e73ce81c4a440428a9');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (31, '2026-11-16T08:24:22.432Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:23', 'credit:1365', '89ee145ba2dd5a62ea8dd5d3b5bf7c6559c3ae3a5175c1e73ce81c4a440428a9', '515c1e998d928b54f9637cda9a4075af7dfb24024d2d4a05e96bbae16302698a');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (32, '2026-11-16T08:24:22.433Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:24', 'credit:1445', '515c1e998d928b54f9637cda9a4075af7dfb24024d2d4a05e96bbae16302698a', '435eb48983eb5d32e219649d31df93f3c96ffeade1114fe0d40eda086b9c8121');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (33, '2026-11-16T08:24:22.433Z', 2, 'owner', 'CUSTOMER_CREATED', 'customer:7', '', '435eb48983eb5d32e219649d31df93f3c96ffeade1114fe0d40eda086b9c8121', '1e6f21ae369a4cdb9ae7d5c2bbf2563d3e46dde5172d9d4ec3f9fcd571cecf7c');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (34, '2026-11-16T08:24:22.433Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:25', 'credit:1260', '1e6f21ae369a4cdb9ae7d5c2bbf2563d3e46dde5172d9d4ec3f9fcd571cecf7c', '8c49882de598fd90c0dab86d559d081f605ffb1a16913901a3bce75ef2cdb097');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (35, '2026-11-16T08:24:22.433Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:26', 'credit:1340', '8c49882de598fd90c0dab86d559d081f605ffb1a16913901a3bce75ef2cdb097', '286b8ad65408b6ed101d85f73fa6f08e121cceb3d26c623bd4bef932f66eed42');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (36, '2026-11-16T08:24:22.433Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:27', 'payment:250', '286b8ad65408b6ed101d85f73fa6f08e121cceb3d26c623bd4bef932f66eed42', '2f55d38b8f6818934ff97651c3ca30596ea49852833c93ede4f7e2c89b7f6413');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (37, '2026-11-16T08:24:22.433Z', 2, 'owner', 'CUSTOMER_CREATED', 'customer:8', '', '2f55d38b8f6818934ff97651c3ca30596ea49852833c93ede4f7e2c89b7f6413', '97888fe966c4393ebd60746a8d0bf176abd4cce98f7a9775d33aa104c84a3029');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (38, '2026-11-16T08:24:22.433Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:28', 'credit:1395', '97888fe966c4393ebd60746a8d0bf176abd4cce98f7a9775d33aa104c84a3029', '78944e5a5b8b7b185057a8f17697115cbe5f917708f8f009c79af262cd554b8d');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (39, '2026-11-16T08:24:22.433Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:29', 'credit:1475', '78944e5a5b8b7b185057a8f17697115cbe5f917708f8f009c79af262cd554b8d', '1be04ee1f7f0758c87d71f147d1e772d0b1620b109ca652183bb49658204aa74');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (40, '2026-11-16T08:24:22.433Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:30', 'payment:250', '1be04ee1f7f0758c87d71f147d1e772d0b1620b109ca652183bb49658204aa74', '7b0be9b27d2bbbda6fdbca1dc5a60e637df5ce9a9a6829a8a4f244a4cdad6d40');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (41, '2026-11-16T08:24:22.433Z', 2, 'owner', 'KHATA_ENTRY_CREATED', 'entry:31', 'credit:1635', '7b0be9b27d2bbbda6fdbca1dc5a60e637df5ce9a9a6829a8a4f244a4cdad6d40', '71fd49e28a514f798bd0196f0cffd19794cf12532955c71bd79fe81a0835d5e0');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (42, '2026-11-16T08:24:22.735Z', NULL, 'system', 'SEED_SHOP', 'shop:2', 'Active', '71fd49e28a514f798bd0196f0cffd19794cf12532955c71bd79fe81a0835d5e0', '9da347867e56b62e4c5c6da2d03331bbcfdd171e1830f53283181f7ceaf5bf3c');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (43, '2026-11-16T08:24:22.735Z', 3, 'owner', 'CUSTOMER_CREATED', 'customer:9', '', '9da347867e56b62e4c5c6da2d03331bbcfdd171e1830f53283181f7ceaf5bf3c', '32580e8342efc1715d4630902620502c5fa826120cefc5949ca63e62d5c2958d');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (44, '2026-11-16T08:24:22.735Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:32', 'credit:450', '32580e8342efc1715d4630902620502c5fa826120cefc5949ca63e62d5c2958d', '9d7def5b37173a44e3ba8906c263b38b36ea11c9f975baad560e71a8fbf8fffd');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (45, '2026-11-16T08:24:22.735Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:33', 'credit:530', '9d7def5b37173a44e3ba8906c263b38b36ea11c9f975baad560e71a8fbf8fffd', '4dd2a30509068a1dde5f74bfd7a53604db21d2f723f2c2c932a188035e444bab');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (46, '2026-11-16T08:24:22.735Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:34', 'payment:250', '4dd2a30509068a1dde5f74bfd7a53604db21d2f723f2c2c932a188035e444bab', 'cd4b5419381ffbf8b5beca5754b572218f481ba88b33a6d1850d5143bc23763e');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (47, '2026-11-16T08:24:22.735Z', 3, 'owner', 'CUSTOMER_CREATED', 'customer:10', '', 'cd4b5419381ffbf8b5beca5754b572218f481ba88b33a6d1850d5143bc23763e', 'aabf1a66c75b16004049abf844f41cbff9f83f20873cea0b354394ac1857ce89');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (48, '2026-11-16T08:24:22.735Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:35', 'credit:585', 'aabf1a66c75b16004049abf844f41cbff9f83f20873cea0b354394ac1857ce89', 'f84a691b28745effda80dfae73de163b836d3990927160ecd787491d90b2ee4f');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (49, '2026-11-16T08:24:22.735Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:36', 'credit:665', 'f84a691b28745effda80dfae73de163b836d3990927160ecd787491d90b2ee4f', '2eb53f3a687a7f44ddf28b516664c4c300bdcf97a75863e3e03bb4fd37a737c4');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (50, '2026-11-16T08:24:22.735Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:37', 'payment:250', '2eb53f3a687a7f44ddf28b516664c4c300bdcf97a75863e3e03bb4fd37a737c4', '40707d78c8215c0bb1d3d0d9aceef8a37885d2738a44e41849e3d4b121bde36c');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (51, '2026-11-16T08:24:22.735Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:38', 'credit:825', '40707d78c8215c0bb1d3d0d9aceef8a37885d2738a44e41849e3d4b121bde36c', '464434c099ef0d353e1574e505fc2ea383a211ff9780af135cbe17ef5612b571');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (52, '2026-11-16T08:24:22.735Z', 3, 'owner', 'CUSTOMER_CREATED', 'customer:11', '', '464434c099ef0d353e1574e505fc2ea383a211ff9780af135cbe17ef5612b571', 'ee914c5256b301e7af8244f4cca11de0c364267b050186ce222125f63590976b');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (53, '2026-11-16T08:24:22.735Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:39', 'credit:720', 'ee914c5256b301e7af8244f4cca11de0c364267b050186ce222125f63590976b', '1ea4c1e43299362a4d95f834034c1d534c8879b3cccf2a7cc081be262016826f');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (54, '2026-11-16T08:24:22.735Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:40', 'credit:800', '1ea4c1e43299362a4d95f834034c1d534c8879b3cccf2a7cc081be262016826f', '1aa4db7c83017071b358c8cfd9d18afda67c6f9728bbe264a498cc40957376c9');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (55, '2026-11-16T08:24:22.735Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:41', 'payment:250', '1aa4db7c83017071b358c8cfd9d18afda67c6f9728bbe264a498cc40957376c9', 'f0ec4f0364d86012d6326f5e746e0adedacc035af6858f9ebd0cb764c13d66b6');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (56, '2026-11-16T08:24:22.736Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:42', 'credit:960', 'f0ec4f0364d86012d6326f5e746e0adedacc035af6858f9ebd0cb764c13d66b6', 'e114cf58f9c299f1ae670086ec347198ff26c0880953d6f3c43476faf4a73666');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (57, '2026-11-16T08:24:22.736Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:43', 'credit:1040', 'e114cf58f9c299f1ae670086ec347198ff26c0880953d6f3c43476faf4a73666', '3cb49dd9346140dc61544a21c301e8a53f73cc15e5dfb5e43625eeb4eed3e9a7');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (58, '2026-11-16T08:24:22.736Z', 3, 'owner', 'CUSTOMER_CREATED', 'customer:12', '', '3cb49dd9346140dc61544a21c301e8a53f73cc15e5dfb5e43625eeb4eed3e9a7', 'e1b6a9cf5402ae7da376c1020c225b1a3f62b6278cff54c23580d9119f70d6d5');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (59, '2026-11-16T08:24:22.736Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:44', 'credit:855', 'e1b6a9cf5402ae7da376c1020c225b1a3f62b6278cff54c23580d9119f70d6d5', '2d769d4654c6f354885274f9b4f3c827450d07f27578767ff922e1e794af1499');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (60, '2026-11-16T08:24:22.736Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:45', 'credit:935', '2d769d4654c6f354885274f9b4f3c827450d07f27578767ff922e1e794af1499', 'e6e72c0c1aa36cfe73ea39d21e5fe3a9e6b2a16b6728e2d16b7b3290d3ebf89b');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (61, '2026-11-16T08:24:22.736Z', 3, 'owner', 'KHATA_ENTRY_CREATED', 'entry:46', 'payment:250', 'e6e72c0c1aa36cfe73ea39d21e5fe3a9e6b2a16b6728e2d16b7b3290d3ebf89b', '9e8882a606f981d6d5a67b5de410c3031ecd5165546cd3acdf2e70e6fc8325b0');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (62, '2026-11-16T08:24:23.017Z', NULL, 'system', 'SEED_SHOP', 'shop:3', 'Active', '9e8882a606f981d6d5a67b5de410c3031ecd5165546cd3acdf2e70e6fc8325b0', 'f36342e925ac15defdaea03e7105927ca64e8665d14a266fa8ec9b815fa36ae4');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (63, '2026-11-16T08:24:23.319Z', NULL, 'system', 'SEED_SHOP', 'shop:4', 'Pending', 'f36342e925ac15defdaea03e7105927ca64e8665d14a266fa8ec9b815fa36ae4', '10287eaae29f4a14a8498b02ca470181df3d37246c0aab1728e9fe116765ce95');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (64, '2026-11-16T08:24:23.596Z', NULL, 'system', 'SEED_SHOP', 'shop:5', 'Active', '10287eaae29f4a14a8498b02ca470181df3d37246c0aab1728e9fe116765ce95', 'da0cd91a8db3fd4d4e8dc8dc3a91eded9e946c365c68d286fcf5982de564ee20');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (65, '2026-11-16T08:24:23.875Z', NULL, 'system', 'SEED_SHOP', 'shop:6', 'Rejected', 'da0cd91a8db3fd4d4e8dc8dc3a91eded9e946c365c68d286fcf5982de564ee20', '56b8c476dae65ee3ee6c778b658c88d387fc5c844ca2c9c415ce1fd297d0f2b7');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (66, '2026-11-16T08:24:24.149Z', NULL, 'system', 'SEED_SHOP', 'shop:7', 'Suspended', '56b8c476dae65ee3ee6c778b658c88d387fc5c844ca2c9c415ce1fd297d0f2b7', '2a51a89621f0946d9016a2eb4c88ae52cead0e00df1b61073f32b0cef2978338');
INSERT INTO audit_log (id, ts, actor_id, actor_role, action, target, detail, prev_hash, hash) VALUES (67, '2026-11-16T08:24:24.418Z', NULL, 'system', 'SEED_SHOP', 'shop:8', 'Pending', '2a51a89621f0946d9016a2eb4c88ae52cead0e00df1b61073f32b0cef2978338', 'cf20c9234d1a2cea879ebad603d8521f4c7d4427d7aec6f8047f0c4563a91c18');
COMMIT;
