// Hiding UI is not a security control; real enforcement is done server-side in the backend phase.
// Frontend validation is not security; the backend will re-validate and enforce authorization.

/**
 * Dukaan Saathi - Shared Shops Data Store
 * Activity 3 - Centralized store mirroring in-memory cache, sessionStorage ('ds-shops'),
 * and synchronized with localStorage ('ds_shops_data_v2') for real-time admin workflow.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY_SESSION = 'ds-shops';
  const STORAGE_KEY_LOCAL = 'ds_shops_data_v2';
  const RATE_LIMIT_KEY = 'ds-reg-ratelimit';
  const USER_SUBMISSIONS_KEY = 'ds-user-submissions';

  // 12 Baseline realistic Pakistani local shops
  const DEFAULT_SHOPS = [
    {
      id: 'SHP-101',
      name: 'Bismillah General Store',
      category: 'Grocery & Kiryana',
      city: 'Multan',
      address: 'Shop #14, Ghanta Ghar Chowk, Old City',
      owner: 'Hamza Ali',
      publicPhone: '0300-1234567',
      documentStatus: 'CNIC: Verified',
      plan: 'Standard',
      status: 'Active',
      joinedDate: '2026-08-15',
      timing: '8:00 AM - 11:00 PM',
      rating: 4.9,
      reviewsCount: 142,
      description: 'Your trusted neighborhood grocery store offering premium flour, cooking oil, pulses, and digital khata credit for regular families.',
      services: ['Digital Khata', 'Home Delivery', 'Cash on Delivery']
    },
    {
      id: 'SHP-102',
      name: 'Madina Karyana Store',
      category: 'Grocery & Kiryana',
      city: 'Faisalabad',
      address: 'Plot 45, Susan Road, Madina Town',
      owner: 'Muhammad Usman',
      publicPhone: '0301-2345678',
      documentStatus: 'CNIC: Verified',
      plan: 'Free',
      status: 'Active',
      joinedDate: '2026-08-20',
      timing: '7:30 AM - 10:30 PM',
      rating: 4.8,
      reviewsCount: 98,
      description: 'Quality household provisions, branded spices, detergents, and dairy essentials at fair official rates.',
      services: ['Digital Khata', 'In-Store Pickup']
    },
    {
      id: 'SHP-103',
      name: 'Al-Rehman Super Store',
      category: 'Super Store',
      city: 'Lahore',
      address: 'Main Commercial Market, DHA Phase 4',
      owner: 'Rehman Malik',
      publicPhone: '0302-3456789',
      documentStatus: 'CNIC: Verified',
      plan: 'Pro',
      status: 'Active',
      joinedDate: '2026-08-25',
      timing: '8:00 AM - 12:00 AM',
      rating: 4.9,
      reviewsCount: 310,
      description: 'Multi-aisle modern departmental store stocking imported snacks, pantry items, personal hygiene, and fresh dairy.',
      services: ['Digital Khata', 'Home Delivery', 'Card & POS Accepted']
    },
    {
      id: 'SHP-104',
      name: 'Khyber Spices & Kiryana',
      category: 'Spices & Grains',
      city: 'Peshawar',
      address: 'Qissa Khwani Bazaar, Khyber Gate',
      owner: 'Gul Khan',
      publicPhone: '0303-4567890',
      documentStatus: 'CNIC: Pending Verification',
      plan: 'Standard',
      status: 'Pending Approval',
      joinedDate: '2026-09-28',
      timing: '9:00 AM - 9:30 PM',
      rating: 4.6,
      reviewsCount: 45,
      description: 'Authentic stone-ground whole spices, basmati rice varieties, dry fruits, and northern pulses.',
      services: ['Wholesale Rates', 'In-Store Pickup']
    },
    {
      id: 'SHP-105',
      name: 'Karachi Mart Gulshan',
      category: 'Super Store',
      city: 'Karachi',
      address: 'Block 13-A, University Road, Gulshan-e-Iqbal',
      owner: 'Farhan Siddiqui',
      publicPhone: '0304-5678901',
      documentStatus: 'CNIC: Pending Verification',
      plan: 'Pro',
      status: 'Pending Approval',
      joinedDate: '2026-09-29',
      timing: '8:30 AM - 11:30 PM',
      rating: 4.7,
      reviewsCount: 88,
      description: 'One-stop consumer retail hub serving residential blocks with rapid express grocery fulfillment.',
      services: ['Home Delivery', 'Digital Khata']
    },
    {
      id: 'SHP-106',
      name: 'Subhanallah Dairy & Bakers',
      category: 'Dairy & Bakery',
      city: 'Rawalpindi',
      address: 'Commercial Market, Satellite Town',
      owner: 'Naveed Akhtar',
      publicPhone: '0305-6789012',
      documentStatus: 'CNIC: Pending Verification',
      plan: 'Free',
      status: 'Pending Approval',
      joinedDate: '2026-09-30',
      timing: '6:30 AM - 11:00 PM',
      rating: 4.8,
      reviewsCount: 120,
      description: 'Fresh farm buffalo milk, daily baked bread, rusk, artisan yogurt, and traditional breakfast sweets.',
      services: ['Morning Delivery', 'In-Store Pickup']
    },
    {
      id: 'SHP-107',
      name: 'Chaudhry & Sons Traders',
      category: 'General Merchant',
      city: 'Sialkot',
      address: 'Kutchery Road, Cantt Area',
      owner: 'Tariq Chaudhry',
      publicPhone: '0306-7890123',
      documentStatus: 'CNIC: Verified',
      plan: 'Standard',
      status: 'Active',
      joinedDate: '2026-09-02',
      timing: '9:00 AM - 10:00 PM',
      rating: 4.7,
      reviewsCount: 76,
      description: 'Wholesale and retail general merchant offering cooking staples, packaging goods, and household utilities.',
      services: ['Bulk Khata', 'Credit Accounts']
    },
    {
      id: 'SHP-108',
      name: 'Bolan Provision Store',
      category: 'Grocery & Kiryana',
      city: 'Quetta',
      address: 'Liaquat Bazaar, M.A. Jinnah Road',
      owner: 'Abdul Wahab',
      publicPhone: '0307-8901234',
      documentStatus: 'CNIC: Suspended',
      plan: 'Free',
      status: 'Suspended',
      joinedDate: '2026-07-10',
      timing: '8:00 AM - 9:00 PM',
      rating: 4.2,
      reviewsCount: 34,
      description: 'Local provision store supplying ration staples.',
      services: ['In-Store Pickup']
    },
    {
      id: 'SHP-109',
      name: 'Mehran Sweet & Bakers',
      category: 'Dairy & Bakery',
      city: 'Hyderabad',
      address: 'Saddar Cantt Market',
      owner: 'Zulfiqar Ali',
      publicPhone: '0308-9012345',
      documentStatus: 'CNIC: Verified',
      plan: 'Standard',
      status: 'Active',
      joinedDate: '2026-09-12',
      timing: '8:00 AM - 11:00 PM',
      rating: 4.9,
      reviewsCount: 205,
      description: 'Famous authentic barfi, gulab jamun, rusks, cakes, and fresh buffalo butter.',
      services: ['Special Events Orders', 'Takeaway', 'Home Delivery']
    },
    {
      id: 'SHP-110',
      name: 'Al-Barkat Mart',
      category: 'Super Store',
      city: 'Gujranwala',
      address: 'Model Town, G.T. Road',
      owner: 'Shahid Butt',
      publicPhone: '0309-0123456',
      documentStatus: 'CNIC: Verified',
      plan: 'Free',
      status: 'Active',
      joinedDate: '2026-09-18',
      timing: '8:30 AM - 10:30 PM',
      rating: 4.8,
      reviewsCount: 64,
      description: 'Neighborhood supermarket offering staples, fresh poultry, dairy, and household cleaning products.',
      services: ['Digital Khata', 'Express Delivery']
    },
    {
      id: 'SHP-111',
      name: 'Ittefaq General Merchant',
      category: 'General Merchant',
      city: 'Sahiwal',
      address: 'High Street Bazaar',
      owner: 'Kashif Rasool',
      publicPhone: '0310-1234567',
      documentStatus: 'CNIC: Rejected',
      plan: 'Standard',
      status: 'Rejected',
      joinedDate: '2026-09-22',
      timing: '9:00 AM - 9:00 PM',
      rating: 4.1,
      reviewsCount: 19,
      description: 'General merchant goods.',
      services: ['In-Store Pickup']
    },
    {
      id: 'SHP-112',
      name: 'Qalandar Foods & Ration',
      category: 'Grocery & Kiryana',
      city: 'Larkana',
      address: 'Station Road, Near Jinnah Chowk',
      owner: 'Ghulam Mustafa',
      publicPhone: '0311-2345678',
      documentStatus: 'CNIC: Verified',
      plan: 'Free',
      status: 'Active',
      joinedDate: '2026-09-24',
      timing: '7:00 AM - 10:00 PM',
      rating: 4.8,
      reviewsCount: 82,
      description: 'Wholesale and retail food grains, pure desi ghee, pulses, and monthly ration family packages.',
      services: ['Monthly Ration Khata', 'Doorstep Delivery']
    }
  ];

  // In-memory cache
  let inMemoryShops = null;

  function loadInitialData() {
    // 1. Try sessionStorage first
    try {
      const sess = sessionStorage.getItem(STORAGE_KEY_SESSION);
      if (sess) {
        const parsed = JSON.parse(sess);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryShops = parsed;
          return inMemoryShops;
        }
      }
    } catch(e) {}

    // 2. Try localStorage second
    try {
      const local = localStorage.getItem(STORAGE_KEY_LOCAL);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge rich baseline fields if missing
          inMemoryShops = parsed.map(s => {
            const def = DEFAULT_SHOPS.find(d => d.id === s.id);
            return def ? Object.assign({}, def, s) : s;
          });
          persist(inMemoryShops);
          return inMemoryShops;
        }
      }
    } catch(e) {}

    // 3. Fallback to default 12 shops
    inMemoryShops = JSON.parse(JSON.stringify(DEFAULT_SHOPS));
    persist(inMemoryShops);
    return inMemoryShops;
  }

  function persist(shops) {
    inMemoryShops = shops;
    try {
      sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(shops));
    } catch(e) {}
    try {
      localStorage.setItem(STORAGE_KEY_LOCAL, JSON.stringify(shops));
    } catch(e) {}
  }

  const DS_SHOPS_STORE = {
    getAllShops() {
      if (!inMemoryShops) loadInitialData();
      return [...inMemoryShops];
    },

    getActiveShops() {
      return this.getAllShops().filter(s => s.status === 'Active');
    },

    getShopById(id) {
      if (!id) return null;
      return this.getAllShops().find(s => s.id === id) || null;
    },

    isDuplicateNameInCity(name, city) {
      if (!name || !city) return false;
      const cleanName = String(name).trim().toLowerCase();
      const cleanCity = String(city).trim().toLowerCase();
      return this.getAllShops().some(s => 
        s.city.trim().toLowerCase() === cleanCity &&
        s.name.trim().toLowerCase() === cleanName
      );
    },

    /**
     * Rate Limiting: Max 3 registration submissions per minute per browser session.
     */
    checkRateLimit() {
      const MAX_PER_MINUTE = 3;
      const WINDOW_MS = 60 * 1000;
      const now = Date.now();

      let timestamps = [];
      try {
        const stored = sessionStorage.getItem(RATE_LIMIT_KEY);
        if (stored) timestamps = JSON.parse(stored);
      } catch(e) {}

      // Keep only stamps in the last 60 seconds
      timestamps = timestamps.filter(t => (now - t) < WINDOW_MS);

      const remaining = Math.max(0, MAX_PER_MINUTE - timestamps.length);
      const allowed = timestamps.length < MAX_PER_MINUTE;
      let waitSeconds = 0;
      if (!allowed && timestamps.length > 0) {
        waitSeconds = Math.ceil((timestamps[0] + WINDOW_MS - now) / 1000);
      }

      return {
        allowed,
        remaining,
        waitSeconds: Math.max(0, waitSeconds)
      };
    },

    recordSubmission() {
      const now = Date.now();
      let timestamps = [];
      try {
        const stored = sessionStorage.getItem(RATE_LIMIT_KEY);
        if (stored) timestamps = JSON.parse(stored);
      } catch(e) {}
      timestamps.push(now);
      try {
        sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps));
      } catch(e) {}
    },

    /**
     * Registers a new shop in Pending Approval state.
     * Enforces Separation of Duties: Registered shops require Admin approval.
     */
    registerShop(data) {
      const rate = this.checkRateLimit();
      if (!rate.allowed) {
        throw new Error(`Rate limit exceeded. Please wait ${rate.waitSeconds} seconds before submitting again.`);
      }

      if (this.isDuplicateNameInCity(data.name, data.city)) {
        throw new Error(`A shop with the name "${data.name}" already exists in ${data.city}.`);
      }

      const all = this.getAllShops();
      const nextNum = all.length + 101;
      const shopId = `SHP-${nextNum}`;

      const newShop = {
        id: shopId,
        name: String(data.name).trim(),
        category: data.category || 'Grocery & Kiryana',
        city: data.city || 'Multan',
        address: String(data.address).trim(),
        owner: String(data.owner).trim(),
        publicPhone: data.publicPhone || '0300-0000000',
        documentStatus: 'CNIC: Pending Verification',
        plan: data.plan || 'Free',
        status: 'Pending Approval',
        joinedDate: new Date().toISOString().split('T')[0],
        timing: data.timing || '8:00 AM - 10:00 PM',
        rating: 5.0,
        reviewsCount: 0,
        description: data.description ? String(data.description).trim() : 'Newly registered local dukaan offering khata and friendly neighborhood service.',
        services: data.services && data.services.length > 0 ? data.services : ['Digital Khata', 'In-Store Pickup'],
        submittedAt: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) + ' Today'
      };

      all.unshift(newShop);
      persist(all);
      this.recordSubmission();

      // Track in user session submissions
      this.trackUserSubmission(newShop.id);

      return newShop;
    },

    trackUserSubmission(shopId) {
      let list = this.getUserSubmissions();
      if (!list.includes(shopId)) {
        list.unshift(shopId);
        try {
          sessionStorage.setItem(USER_SUBMISSIONS_KEY, JSON.stringify(list));
        } catch(e) {}
      }
    },

    getUserSubmissions() {
      try {
        const stored = sessionStorage.getItem(USER_SUBMISSIONS_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch(e) {
        return [];
      }
    },

    getUserPendingShops() {
      const ids = this.getUserSubmissions();
      const all = this.getAllShops();
      return all.filter(s => ids.includes(s.id) && s.status === 'Pending Approval');
    },

    withdrawShop(shopId) {
      let all = this.getAllShops();
      const idx = all.findIndex(s => s.id === shopId);
      if (idx !== -1) {
        all.splice(idx, 1);
        persist(all);
      }
      // Also remove from user submissions
      let userSubs = this.getUserSubmissions().filter(id => id !== shopId);
      try {
        sessionStorage.setItem(USER_SUBMISSIONS_KEY, JSON.stringify(userSubs));
      } catch(e) {}
      return true;
    },

    updateStatus(shopId, newStatus) {
      let all = this.getAllShops();
      const found = all.find(s => s.id === shopId);
      if (found) {
        found.status = newStatus;
        if (newStatus === 'Active') {
          found.documentStatus = 'CNIC: Verified';
        } else if (newStatus === 'Rejected') {
          found.documentStatus = 'CNIC: Rejected';
        } else if (newStatus === 'Suspended') {
          found.documentStatus = 'CNIC: Suspended';
        }
        persist(all);
        return true;
      }
      return false;
    }
  };

  // Initialize immediately
  loadInitialData();

  window.DS_SHOPS_STORE = DS_SHOPS_STORE;
})(window);
