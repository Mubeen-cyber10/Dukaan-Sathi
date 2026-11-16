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
