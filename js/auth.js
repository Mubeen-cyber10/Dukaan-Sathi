const AUTH_STORAGE_KEY = 'ds_session_user';
let authenticatedUser = null;

const DS_AUTH = {
  ready: Promise.resolve(false),

  setUser(user) {
    authenticatedUser = user;
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ name: user.name, role: user.role }));
  },

  async login(email, password) {
    const { token, user } = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
    sessionStorage.setItem(TOKEN_KEY, token);
    this.setUser(user);
    return user.role === 'admin' ? 'admin-dashboard.html' : 'app-dashboard.html';
  },

  async verify() {
    if (!sessionStorage.getItem(TOKEN_KEY)) {
      this.endSession('signin');
      return false;
    }
    const user = await apiFetch('/api/auth/me');
    this.setUser(user);
    return true;
  },

  getUser() {
    return authenticatedUser ? { ...authenticatedUser } : null;
  },

  isAuthenticated() {
    return authenticatedUser !== null;
  },

  hasRole(role) {
    return authenticatedUser?.role === role;
  },

  // Client role checks control the UI only. The server authorizes each protected request.
  requireRole(role) {
    if (this.hasRole(role)) return true;
    this.endSession('denied');
    return false;
  },

  canDo(action, user = authenticatedUser) {
    const permissions = {
      owner: ['VIEW_KHATA', 'CREATE_CREDIT', 'RECORD_PAYMENT', 'MANAGE_INVENTORY', 'VIEW_ORDERS',
        'UPDATE_ORDERS', 'VIEW_STORE_REPORTS'],
      admin: ['MANAGE_SHOPS', 'APPROVE_SHOP', 'REJECT_SHOP', 'SUSPEND_SHOP', 'MANAGE_PLANS',
        'VIEW_AUDIT_LOG', 'RESOLVE_DISPUTES', 'VERIFY_HASH_CHAIN']
    };
    return permissions[user?.role]?.includes(action) || false;
  },

  async approveShop(shopId) {
    try {
      return await apiFetch('/api/admin/shops/' + encodeURIComponent(shopId) + '/status', {
        method: 'PATCH', body: { status: 'Active' }
      });
    } catch (error) {
      if (error.status !== 401) showToast(error.status === 403 ? 'Access Denied' : error.message, 'danger');
      return null;
    }
  },

  endSession(notice) {
    authenticatedUser = null;
    sessionStorage.clear();
    document.documentElement.style.visibility = 'hidden';
    location.replace('login.html?notice=' + encodeURIComponent(notice));
  },

  logout() {
    this.endSession('logout');
  }
};

window.requireRole = role => DS_AUTH.requireRole(role);
window.canDo = action => DS_AUTH.canDo(action);
window.approveShop = shopId => DS_AUTH.approveShop(shopId);
