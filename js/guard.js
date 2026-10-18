// Hiding UI is not a security control; real enforcement is done server-side in the backend phase.

/**
 * Dukaan Saathi - Page Access Guard & Idle Timeout Monitor
 * Runs synchronously in <head> to block unauthorized renders before DOM paint.
 * Enforces fail-safe defaults, role isolation (Owner vs Admin),
 * browser back-button caching prevention, and 5-minute inactivity session expiration.
 */

(function() {
  'use strict';

  // Extract page filename
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  // Public pages that do not require authentication
  const PUBLIC_PAGES = [
    'index.html',
    'features.html',
    'pricing.html',
    'security.html',
    'login.html',
    ''
  ];

  const isPublic = PUBLIC_PAGES.includes(currentPath);

  // If this is a protected page, prevent flash of protected content by hiding document root
  if (!isPublic) {
    document.documentElement.style.visibility = 'hidden';
  }

  function verifyAccess() {
    if (isPublic) {
      document.documentElement.style.visibility = '';
      return true;
    }

    // Read session from sessionStorage
    let user = null;
    try {
      const raw = sessionStorage.getItem('ds_session_user');
      if (raw) user = JSON.parse(raw);
    } catch (e) {}

    // 1. Not authenticated -> Fail-Safe Default: Redirect immediately to login.html
    if (!user || !user.role) {
      sessionStorage.setItem('ds_guard_notice', 'Access denied - please sign in');
      sessionStorage.setItem('ds_redirect_after_login', currentPath);
      window.location.replace('login.html');
      return false;
    }

    // 2. Role-Based Page Access Enforcement (RBAC)
    const isOwnerPage = currentPath.startsWith('app-');
    const isAdminPage = currentPath.startsWith('admin-');

    if (isOwnerPage && user.role !== 'owner') {
      // Non-owner trying to access owner portal
      sessionStorage.setItem('ds_guard_notice', 'Access denied: insufficient permissions');
      window.location.replace('login.html');
      return false;
    }

    if (isAdminPage && user.role !== 'admin') {
      // Non-admin trying to access admin portal
      sessionStorage.setItem('ds_guard_notice', 'Access denied: insufficient permissions');
      window.location.replace('login.html');
      return false;
    }

    // Access authorized: unhide DOM content
    document.documentElement.style.visibility = '';
    return true;
  }

  // Execute immediate synchronous verification
  const authorized = verifyAccess();

  // Listen for pageshow event (handles browser back button navigation / bfcache)
  window.addEventListener('pageshow', function(event) {
    verifyAccess();
  });

  // If page is not authorized, stop further setup
  if (!authorized && !isPublic) return;

  // 3. Idle Timeout Monitor (5 min warning, 30s countdown -> auto logout)
  // Protects unattended counters / terminals
  if (!isPublic) {
    const IDLE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
    const WARNING_COUNTDOWN_SEC = 30;
    let lastActivity = Date.now();
    let countdownTimer = null;

    function resetActivity() {
      lastActivity = Date.now();
      dismissIdleWarning();
    }

    // Activity listeners
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, resetActivity, { passive: true });
    });

    // Check idle interval every 5 seconds
    setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      if (elapsed >= IDLE_LIMIT_MS && !document.getElementById('ds-idle-modal')) {
        showIdleWarning();
      }
    }, 5000);

    function showIdleWarning() {
      let remaining = WARNING_COUNTDOWN_SEC;

      const backdrop = document.createElement('div');
      backdrop.id = 'ds-idle-modal';
      backdrop.className = 'modal-backdrop modal-backdrop--open';
      backdrop.style.zIndex = '999999';

      backdrop.innerHTML = `
        <div class="modal" style="max-width: 420px; text-align: center;">
          <div class="modal-header" style="justify-content: center;">
            <div class="brand-icon" style="background: var(--warning-soft); color: var(--warning); width: 48px; height: 48px; margin: 0 auto 12px;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <h3 class="font-bold text-lg mb-8">Session Expiring Soon</h3>
          <p class="text-sm text-muted mb-16">
            You have been inactive. For security against unattended terminals, your session will automatically terminate in 
            <strong id="ds-idle-seconds" class="text-danger" style="font-size: 1.1rem;">${remaining}</strong> seconds.
          </p>
          <div class="flex gap-12 justify-center">
            <button type="button" class="btn btn--primary" id="ds-idle-extend">Stay Signed In</button>
            <button type="button" class="btn btn--ghost" id="ds-idle-logout">Log Out Now</button>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);

      countdownTimer = setInterval(() => {
        remaining--;
        const secEl = document.getElementById('ds-idle-seconds');
        if (secEl) secEl.textContent = remaining;

        if (remaining <= 0) {
          clearInterval(countdownTimer);
          if (typeof DS_AUTH !== 'undefined') {
            DS_AUTH.logout();
          } else {
            sessionStorage.clear();
            sessionStorage.setItem('ds_guard_notice', 'Session expired due to inactivity.');
            window.location.replace('login.html');
          }
        }
      }, 1000);

      document.getElementById('ds-idle-extend').addEventListener('click', () => {
        dismissIdleWarning();
        lastActivity = Date.now();
      });

      document.getElementById('ds-idle-logout').addEventListener('click', () => {
        if (typeof DS_AUTH !== 'undefined') {
          DS_AUTH.logout();
        } else {
          sessionStorage.clear();
          window.location.replace('login.html');
        }
      });
    }

    function dismissIdleWarning() {
      if (countdownTimer) clearInterval(countdownTimer);
      const modal = document.getElementById('ds-idle-modal');
      if (modal) modal.remove();
    }
  }
})();
