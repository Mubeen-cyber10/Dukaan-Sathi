(function () {
  'use strict';

  const page = location.pathname.split('/').pop();
  const role = page.startsWith('admin-') ? 'admin' : 'owner';
  const root = document.documentElement;
  let lastActivity = Date.now();
  let countdownTimer;

  async function verifyAccess() {
    root.style.visibility = 'hidden';
    try {
      if (!await DS_AUTH.verify() || !DS_AUTH.requireRole(role)) return false;
      root.style.visibility = '';
      return true;
    } catch (error) {
      if (error.status !== 401) DS_AUTH.endSession('unavailable');
      return false;
    }
  }

  DS_AUTH.ready = verifyAccess();
  window.addEventListener('pagehide', () => { root.style.visibility = 'hidden'; });
  window.addEventListener('pageshow', event => {
    if (event.persisted) DS_AUTH.ready = verifyAccess();
  });

  function dismissIdleWarning() {
    clearInterval(countdownTimer);
    document.getElementById('ds-idle-modal')?.remove();
  }

  function resetActivity(event) {
    if (event.target.closest?.('#ds-idle-modal')) return;
    lastActivity = Date.now();
    dismissIdleWarning();
  }

  for (const event of ['mousedown', 'keydown', 'scroll', 'touchstart']) {
    window.addEventListener(event, resetActivity, { passive: true });
  }

  setInterval(() => {
    if (DS_AUTH.isAuthenticated() && Date.now() - lastActivity >= 5 * 60 * 1000 &&
        !document.getElementById('ds-idle-modal')) showIdleWarning();
  }, 5000);

  function showIdleWarning() {
    const backdrop = document.createElement('div');
    backdrop.id = 'ds-idle-modal';
    backdrop.className = 'modal-backdrop modal-backdrop--open';
    backdrop.style.zIndex = '999999';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'max-width: 420px; text-align: center; padding: 24px;';
    const title = document.createElement('h3');
    title.className = 'font-bold text-lg mb-8';
    title.textContent = 'Session Expiring Soon';
    const message = document.createElement('p');
    message.className = 'text-sm text-muted mb-16';
    const stay = document.createElement('button');
    stay.className = 'btn btn--primary';
    stay.textContent = 'Stay Signed In';
    const logout = document.createElement('button');
    logout.className = 'btn btn--ghost';
    logout.textContent = 'Log Out Now';
    stay.addEventListener('click', () => {
      lastActivity = Date.now();
      dismissIdleWarning();
    });
    logout.addEventListener('click', () => DS_AUTH.logout());
    modal.append(title, message, stay, logout);
    backdrop.append(modal);
    document.body.append(backdrop);

    const deadline = Date.now() + 30000;
    function update() {
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      message.textContent = 'Your session will end in ' + remaining + ' seconds due to inactivity.';
      if (remaining <= 0) {
        dismissIdleWarning();
        DS_AUTH.endSession('idle');
      }
    }
    update();
    countdownTimer = setInterval(update, 1000);
  }
})();
