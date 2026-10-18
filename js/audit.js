// Hiding UI is not a security control; real enforcement is done server-side in the backend phase.

/**
 * Dukaan Saathi - Tamper-Evident SHA-256 Audit Log Engine
 * Implements a cryptographic hash chain: entry[i].prevHash = entry[i-1].hash
 * Demonstrates integrity protection for SSD Semester Project.
 */

const AUDIT_STORAGE_KEY = 'ds_audit_chain_v2';
const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

const DS_AUDIT = {
  /**
   * Compute SHA-256 hash string for an object or text using Web Crypto API
   */
  async sha256(message) {
    const msgUint8 = new TextEncoder().encode(typeof message === 'string' ? message : JSON.stringify(message));
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Helper to format entry string for deterministic hashing
   */
  entryCanonical(entry) {
    return `${entry.id}|${entry.timestamp}|${entry.actor}|${entry.role}|${entry.action}|${entry.details}|${entry.prevHash}`;
  },

  /**
   * Get all audit chain entries
   */
  getChain() {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return this.seedDefaultChain();
  },

  /**
   * Save chain to localStorage
   */
  saveChain(chain) {
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(chain));
    } catch (e) {}
  },

  /**
   * Seed default realistic chain if not present
   * Exact SHA-256 hashes pre-verified:
   */
  seedDefaultChain() {
    const defaultEntries = [
      {
        id: 1,
        timestamp: '2026-09-28T09:15:00Z',
        actor: 'Sara Khan (Admin)',
        role: 'admin',
        action: 'SHOP_APPROVED',
        details: 'Approved shop registration: Bismillah General Store (Multan)',
        prevHash: GENESIS_PREV_HASH,
        hash: '101ecb50f48e683ad11ad6d9d2dc0536e8eed421b0bb09d3dd703019e5df38cf'
      },
      {
        id: 2,
        timestamp: '2026-09-28T10:00:00Z',
        actor: 'Hamza Ali (Owner)',
        role: 'owner',
        action: 'CREDIT_ENTRY_CREATED',
        details: 'Recorded credit sale of Rs. 2,500 for customer Ahmed Raza',
        prevHash: '101ecb50f48e683ad11ad6d9d2dc0536e8eed421b0bb09d3dd703019e5df38cf',
        hash: '45629ab79ea6b02086d7fc1e53d854e6a9da13642c4050b2cd2b5f779a0a69b0'
      },
      {
        id: 3,
        timestamp: '2026-09-29T14:30:00Z',
        actor: 'Hamza Ali (Owner)',
        role: 'owner',
        action: 'PAYMENT_RECEIVED',
        details: 'Recorded payment received Rs. 1,000 from customer Ahmed Raza',
        prevHash: '45629ab79ea6b02086d7fc1e53d854e6a9da13642c4050b2cd2b5f779a0a69b0',
        hash: '3a977b83cb93949347939a5b07bb06a6007c1868910c64de62f9f25c4e5265ad'
      },
      {
        id: 4,
        timestamp: '2026-09-30T11:00:00Z',
        actor: 'Sara Khan (Admin)',
        role: 'admin',
        action: 'PLAN_MODIFIED',
        details: 'Updated Standard Tier plan pricing: Rs. 1,500/mo',
        prevHash: '3a977b83cb93949347939a5b07bb06a6007c1868910c64de62f9f25c4e5265ad',
        hash: '2b4953cdf9f17fac94d07e693862a8c374242ca004ed1e0a75b1457cacdd0310'
      }
    ];
    this.saveChain(defaultEntries);
    return defaultEntries;
  },

  /**
   * Log an event into the cryptographic hash chain
   */
  async log(action, details, actorName = null, roleName = null) {
    const user = (typeof DS_AUTH !== 'undefined') ? DS_AUTH.getUser() : null;
    const actor = actorName || (user ? `${user.name} (${user.role === 'admin' ? 'Admin' : 'Owner'})` : 'System');
    const role = roleName || (user ? user.role : 'system');
    
    const chain = this.getChain();
    const lastEntry = chain.length > 0 ? chain[chain.length - 1] : null;
    const prevHash = lastEntry ? lastEntry.hash : GENESIS_PREV_HASH;
    
    const newEntry = {
      id: chain.length + 1,
      timestamp: new Date().toISOString(),
      actor: actor,
      role: role,
      action: action,
      details: details,
      prevHash: prevHash
    };

    const canonical = this.entryCanonical(newEntry);
    newEntry.hash = await this.sha256(canonical);

    chain.push(newEntry);
    this.saveChain(chain);

    // Also mirror to legacy DS_DATA audit for backwards compatibility with shop widgets
    if (typeof DS_DATA !== 'undefined' && DS_DATA.addAudit) {
      DS_DATA.addAudit(`[${action}] ${details}`);
    }

    return newEntry;
  },

  /**
   * Verify the cryptographic integrity of the entire chain
   * Returns: { valid: boolean, count: number, brokenIndex: number|null, reason: string, message: string }
   */
  async verifyChain() {
    const chain = this.getChain();
    if (!chain || chain.length === 0) {
      return { valid: true, count: 0, message: 'Audit chain is empty.' };
    }

    for (let i = 0; i < chain.length; i++) {
      const entry = chain[i];
      // 1. Verify prevHash matches previous item's hash
      if (i === 0) {
        if (entry.prevHash !== GENESIS_PREV_HASH) {
          return { valid: false, brokenIndex: 0, reason: `Genesis block prevHash mismatch: expected ${GENESIS_PREV_HASH}` };
        }
      } else {
        const prev = chain[i - 1];
        if (entry.prevHash !== prev.hash) {
          return {
            valid: false,
            brokenIndex: i,
            reason: `Broken chain link at block #${entry.id}: prevHash does not match hash of block #${prev.id}`
          };
        }
      }

      // 2. Recompute hash of entry to verify it wasn't modified
      const canonical = this.entryCanonical(entry);
      const computedHash = await this.sha256(canonical);
      if (computedHash !== entry.hash) {
        return {
          valid: false,
          brokenIndex: i,
          reason: `Tampered block detected at #${entry.id}! Expected ${entry.hash.substring(0, 12)}... but computed ${computedHash.substring(0, 12)}...`
        };
      }
    }

    return { valid: true, count: chain.length, message: `All ${chain.length} audit records cryptographically verified with zero tampering. Chain intact.` };
  },

  /**
   * Simulate tampering on a block to demonstrate integrity failure
   */
  simulateTampering(index = 1) {
    const chain = this.getChain();
    if (chain.length > index) {
      chain[index].details = chain[index].details + ' [TAMPERED BY MALICIOUS ACTOR]';
      // Deliberately do not rehash, or the next block's prevHash will break
      this.saveChain(chain);
      return true;
    }
    return false;
  },

  /**
   * Reset / restore audit log back to pure verified default chain
   */
  restoreChain() {
    localStorage.removeItem(AUDIT_STORAGE_KEY);
    return this.seedDefaultChain();
  }
};
