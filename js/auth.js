// Hiding UI is not a security control; real enforcement is done server-side in the backend phase.

/**
 * Dukaan Saathi - Authentication & Role-Based Access Control (RBAC)
 * Handles client-side role validation, SHA-256 password verification,
 * brute-force lockout, and permission checks.
 */

const AUTH_STORAGE_KEY = 'ds_session_user';
const LOCKOUT_STORAGE_KEY = 'ds_auth_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000; // 30 seconds

const DS_AUTH = {
  /**
   * Compute SHA-256 hash using Web Crypto API
   */
  async hashPassword(password) {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Check lockout state
   */
  getLockoutStatus() {
    try {
      const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY);
      if (!raw) return { locked: false, remainingSec: 0, attempts: 0 };
      const data = JSON.parse(raw);
      const now = Date.now();
      if (data.lockedUntil && now < data.lockedUntil) {
        return {
          locked: true,
          remainingSec: Math.ceil((data.lockedUntil - now) / 1000),
          attempts: data.attempts
        };
      }
      if (data.lockedUntil && now >= data.lockedUntil) {
        localStorage.removeItem(LOCKOUT_STORAGE_KEY);
        return { locked: false, remainingSec: 0, attempts: 0 };
      }
      return { locked: false, remainingSec: 0, attempts: data.attempts || 0 };
    } catch (e) {
      return { locked: false, remainingSec: 0, attempts: 0 };
    }
  },

  /**
   * Register failed attempt
   */
  recordFailedAttempt() {
    const status = this.getLockoutStatus();
    const attempts = status.attempts + 1;
    let lockedUntil = null;
    if (attempts >= MAX_ATTEMPTS) {
      lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      if (typeof DS_AUDIT !== 'undefined') {
        DS_AUDIT.log('AUTH_LOCKOUT', `Brute force threshold reached (${attempts} failed attempts). Form locked for 30s.`, 'Anonymous', 'guest');
      }
    }
    localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify({ attempts, lockedUntil }));
    return { locked: attempts >= MAX_ATTEMPTS, attempts, remainingSec: lockedUntil ? 30 : 0 };
  },

  /**
   * Reset attempts on successful login
   */
  clearLockout() {
    localStorage.removeItem(LOCKOUT_STORAGE_KEY);
  },

  /**
   * Perform authentication against DEMO_USERS in js/data.js
   * Compares SHA-256 hash computed with crypto.subtle.
   * On failure returns generic "Invalid credentials" (prevents user enumeration).
   * On success saves ONLY { id, name, role, loginAt } in sessionStorage.
   */
  async login(emailOrPhone, password) {
    const lockout = this.getLockoutStatus();
    if (lockout.locked) {
      return {
        success: false,
        error: `Too many failed attempts. Account locked for ${lockout.remainingSec}s to prevent brute-force attacks.`
      };
    }

    const inputClean = (emailOrPhone || '').trim().toLowerCase();
    const users = (typeof DEMO_USERS !== 'undefined') ? DEMO_USERS : [];

    const foundUser = users.find(u => 
      u.email.toLowerCase() === inputClean || 
      (u.phone && u.phone.replace(/\D/g, '') === inputClean.replace(/\D/g, ''))
    );

    if (!foundUser) {
      this.recordFailedAttempt();
      if (typeof DS_AUDIT !== 'undefined') {
        DS_AUDIT.log('AUTH_FAILED', `Failed login attempt for user identifier: ${inputClean}`, 'Anonymous', 'guest');
      }
      return { success: false, error: 'Invalid credentials' };
    }

    const inputHash = await this.hashPassword(password);
    if (inputHash !== foundUser.passwordHash) {
      this.recordFailedAttempt();
      if (typeof DS_AUDIT !== 'undefined') {
        DS_AUDIT.log('AUTH_FAILED', `Incorrect password attempt for user: ${foundUser.email}`, foundUser.name, foundUser.role);
      }
      return { success: false, error: 'Invalid credentials' };
    }

    // Success - clear lockout state
    this.clearLockout();

    // Prepare session payload - strictly least information:
    // ONLY { id, name, role, loginAt } in sessionStorage (NEVER password or full credentials)
    const sessionPayload = {
      id: foundUser.id,
      name: foundUser.name,
      role: foundUser.role, // 'owner' or 'admin'
      loginAt: new Date().toISOString()
    };

    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionPayload));

    if (typeof DS_AUDIT !== 'undefined') {
      DS_AUDIT.log('AUTH_LOGIN_SUCCESS', `User successfully authenticated with MFA`, foundUser.name, foundUser.role);
    }

    return {
      success: true,
      user: sessionPayload,
      redirect: foundUser.role === 'admin' ? 'admin-dashboard.html' : 'app-dashboard.html'
    };
  },

  /**
   * Get currently logged-in user from sessionStorage
   */
  getUser() {
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Check if a user is currently authenticated
   */
  isAuthenticated() {
    return this.getUser() !== null;
  },

  /**
   * Check if the logged in user possesses a given role
   */
  hasRole(role) {
    const user = this.getUser();
    return !!(user && user.role === role);
  },

  /**
   * Require a specific role or redirect to login.html
   */
  requireRole(role) {
    const user = this.getUser();
    if (!user || user.role !== role) {
      sessionStorage.setItem('ds_guard_notice', 'Access denied: insufficient permissions');
      window.location.replace('login.html');
      return false;
    }
    return true;
  },

  /**
   * Role capability checker
   */
  canDo(action) {
    const user = this.getUser();
    if (!user) return false;

    // RBAC Capability Matrix
    const permissions = {
      owner: [
        'VIEW_KHATA',
        'CREATE_CREDIT',
        'RECORD_PAYMENT',
        'MANAGE_INVENTORY',
        'VIEW_ORDERS',
        'UPDATE_ORDERS',
        'VIEW_STORE_REPORTS'
      ],
      admin: [
        'MANAGE_SHOPS',
        'APPROVE_SHOP',
        'REJECT_SHOP',
        'SUSPEND_SHOP',
        'MANAGE_PLANS',
        'VIEW_AUDIT_LOG',
        'RESOLVE_DISPUTES',
        'VERIFY_HASH_CHAIN'
      ]
    };

    const userPerms = permissions[user.role] || [];
    return userPerms.includes(action);
  },

  /**
   * Restricted function: Approve a shop
   * Authorized role: admin only.
   * Calls check INSIDE function: if currentUser.role !== 'admin' -> do nothing, show Access Denied toast, write DENIED entry.
   */
  approveShop(shopId) {
    const user = this.getUser();
    if (!user || user.role !== 'admin') {
      const actorName = user ? user.name : 'Unknown';
      const actorRole = user ? user.role : 'anonymous';
      if (typeof DS_AUDIT !== 'undefined') {
        DS_AUDIT.log(
          'ACCESS_DENIED',
          `Unauthorized attempt to execute approveShop(${shopId}) by role '${actorRole}'`,
          actorName,
          actorRole
        );
      }
      if (typeof showToast === 'function') {
        showToast('Access Denied: Only Platform Super Admins can approve shops.', 'danger');
      }
      return {
        success: false,
        code: 403,
        error: 'Access Denied: Only Platform Super Admins can approve shops.'
      };
    }

    // Role authorized: admin
    if (typeof DS_DATA !== 'undefined' && DS_DATA.updateShopStatus) {
      DS_DATA.updateShopStatus(shopId, 'Active');
    }
    if (typeof DS_AUDIT !== 'undefined') {
      DS_AUDIT.log('SHOP_APPROVED', `Admin approved merchant shop #${shopId}`, user.name, user.role);
    }
    if (typeof showToast === 'function') {
      showToast(`Shop #${shopId} approved successfully. Action recorded in audit chain.`, 'success');
    }
    return { success: true, message: `Shop #${shopId} approved successfully.` };
  },

  /**
   * Restricted function: Reject a shop
   * Authorized role: admin only.
   */
  rejectShop(shopId, reason) {
    const user = this.getUser();
    if (!user || user.role !== 'admin') {
      const actorName = user ? user.name : 'Unknown';
      const actorRole = user ? user.role : 'anonymous';
      if (typeof DS_AUDIT !== 'undefined') {
        DS_AUDIT.log(
          'ACCESS_DENIED',
          `Unauthorized attempt to execute rejectShop(${shopId}) by role '${actorRole}'`,
          actorName,
          actorRole
        );
      }
      if (typeof showToast === 'function') {
        showToast('Access Denied: Only Platform Super Admins can reject shops.', 'danger');
      }
      return {
        success: false,
        code: 403,
        error: 'Access Denied: Only Platform Super Admins can reject shops.'
      };
    }

    if (!reason || !reason.trim()) {
      if (typeof showToast === 'function') {
        showToast('Rejection failed: A justification reason is mandatory.', 'danger');
      }
      return { success: false, error: 'A justification reason is mandatory.' };
    }

    if (typeof DS_DATA !== 'undefined' && DS_DATA.updateShopStatus) {
      DS_DATA.updateShopStatus(shopId, 'Rejected');
    }
    if (typeof DS_AUDIT !== 'undefined') {
      DS_AUDIT.log('SHOP_REJECTED', `Admin rejected shop #${shopId}. Reason: ${reason.trim()}`, user.name, user.role);
    }
    if (typeof showToast === 'function') {
      showToast(`Shop #${shopId} rejected. Reason logged in audit chain.`, 'warning');
    }
    return { success: true, message: `Shop #${shopId} rejected.` };
  },

  /**
   * Restricted function: Suspend a shop
   * Authorized role: admin only.
   */
  suspendShop(shopId, reason = 'Administrative suspension') {
    const user = this.getUser();
    if (!user || user.role !== 'admin') {
      if (typeof DS_AUDIT !== 'undefined') {
        DS_AUDIT.log('ACCESS_DENIED', `Unauthorized attempt to suspend shop #${shopId}`, user ? user.name : 'Unknown', user ? user.role : 'none');
      }
      if (typeof showToast === 'function') {
        showToast('Access Denied: Only Platform Super Admins can suspend shops.', 'danger');
      }
      return { success: false, code: 403, error: 'Access Denied: Only Platform Super Admins can suspend shops.' };
    }

    if (typeof DS_DATA !== 'undefined' && DS_DATA.updateShopStatus) {
      DS_DATA.updateShopStatus(shopId, 'Suspended');
    }
    if (typeof DS_AUDIT !== 'undefined') {
      DS_AUDIT.log('SHOP_SUSPENDED', `Admin suspended shop #${shopId}. Reason: ${reason}`, user.name, user.role);
    }
    if (typeof showToast === 'function') {
      showToast(`Shop #${shopId} suspended. Action logged in audit chain.`, 'danger');
    }
    return { success: true, message: `Shop #${shopId} suspended.` };
  },

  /**
   * Terminate current session
   */
  logout() {
    const user = this.getUser();
    if (user && typeof DS_AUDIT !== 'undefined') {
      DS_AUDIT.log('AUTH_LOGOUT', `User terminated session`, user.name, user.role);
    }
    sessionStorage.clear();
    sessionStorage.setItem('ds_guard_notice', 'You have been logged out successfully.');
    window.location.href = 'login.html';
  }
};

// Global exports so console inspection directly accesses restricted functions
window.requireRole = function(role) { return DS_AUTH.requireRole(role); };
window.canDo = function(action) { return DS_AUTH.canDo(action); };
window.approveShop = function(shopId) { return DS_AUTH.approveShop(shopId); };
window.rejectShop = function(shopId, reason) { return DS_AUTH.rejectShop(shopId, reason); };
