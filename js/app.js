/**
 * Dukaan Saathi – Main Application Logic
 * =======================================
 * Hiding UI is not a security control; real enforcement arrives with the backend.
 * This prototype demonstrates front-end interactions only.
 */

(function () {
  'use strict';

  // ─── CONSTANTS ──────────────────────────────────────────────────
  const TOAST_DURATION = 3500;
  const LOGIN_DELAY = 800;
  const PAGES = ['page-home', 'page-login', 'page-dashboard'];
  const VALID_HASHES = ['#/', '#/login', '#/dashboard'];

  // ─── STATE ──────────────────────────────────────────────────────
  let isLoggedIn = false;
  let currentFilter = 'all';
  let currentSort = 'highest-due';
  let searchQuery = '';
  let selectedEntryType = 'credit';
  let entryStep = 'form'; // 'form' | 'confirm'

  // ─── DOM REFS ───────────────────────────────────────────────────
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  // Pages
  const pageHome = $('#page-home');
  const pageLogin = $('#page-login');
  const pageDashboard = $('#page-dashboard');

  // Theme toggles
  const themeToggles = $$('.theme-toggle');

  // Navbar
  const landingNavbar = $('#landing-navbar');
  const hamburgerBtn = $('#hamburger-btn');
  const mobileMenu = $('#mobile-menu');

  // Login
  const loginForm = $('#login-form');
  const loginEmail = $('#login-email');
  const loginPassword = $('#login-password');
  const togglePasswordBtn = $('#toggle-password');
  const loginSubmit = $('#login-submit');
  const loginStepCredentials = $('#login-step-credentials');
  const loginStepMfa = $('#login-step-mfa');
  const mfaInputs = $$('.mfa-input');
  const mfaSubmit = $('#mfa-submit');
  const forgotPasswordBtn = $('#forgot-password-btn');

  // Dashboard
  const searchInput = $('#search-input');
  const filterChips = $('#filter-chips');
  const sortSelect = $('#sort-select');
  const newEntryBtn = $('#new-entry-btn');
  const customerTbody = $('#customer-tbody');
  const customerCards = $('#customer-cards');
  const emptyState = $('#empty-state');
  const activityLogList = $('#activity-log-list');

  // Summary
  const summaryTotalDue = $('#summary-total-due');
  const summaryReceivedToday = $('#summary-received-today');
  const summaryCustomersDues = $('#summary-customers-dues');
  const summaryEntriesToday = $('#summary-entries-today');

  // Drawer
  const drawerOverlay = $('#drawer-overlay');
  const customerDrawer = $('#customer-drawer');
  const drawerClose = $('#drawer-close');
  const drawerCustomerName = $('#drawer-customer-name');
  const drawerNameDisplay = $('#drawer-name-display');
  const drawerAvatar = $('#drawer-avatar');
  const drawerPhone = $('#drawer-phone');
  const drawerBalance = $('#drawer-balance');
  const drawerBalanceCard = $('#drawer-balance-card');
  const ledgerTimeline = $('#ledger-timeline');

  // New Entry Modal
  const newEntryOverlay = $('#new-entry-overlay');
  const newEntryModal = $('#new-entry-modal');
  const newEntryClose = $('#new-entry-close');
  const entryCustomer = $('#entry-customer');
  const entryAmount = $('#entry-amount');
  const entryNote = $('#entry-note');
  const entryNoteCounter = $('#entry-note-counter');
  const entryFormStep = $('#entry-form-step');
  const entryConfirmStep = $('#entry-confirm-step');
  const entryCancel = $('#entry-cancel');
  const entryNext = $('#entry-next');
  const entryConfirm = $('#entry-confirm');
  const entryBack = $('#entry-back');

  // Forgot password
  const forgotPasswordOverlay = $('#forgot-password-overlay');
  const forgotPasswordClose = $('#forgot-password-close');
  const forgotPasswordOk = $('#forgot-password-ok');

  // User menu
  const userMenuTrigger = $('#user-menu-trigger');
  const userMenuDropdown = $('#user-menu-dropdown');
  const logoutBtn = $('#logout-btn');

  // Toast
  const toastContainer = $('#toast-container');

  // Sidebar / Tab bar nav items
  const sidebarNavItems = $$('.sidebar__nav-item');
  const tabBarItems = $$('.tab-bar__item');


  // ─── THEME ──────────────────────────────────────────────────────
  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('ds-theme', theme);
    } catch (e) {
      // localStorage blocked — ignore
    }
    updateThemeIcons(theme);
  }

  function toggleTheme() {
    var current = getCurrentTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  function updateThemeIcons(theme) {
    themeToggles.forEach(function (btn) {
      var sunIcon = btn.querySelector('.icon-sun');
      var moonIcon = btn.querySelector('.icon-moon');
      if (sunIcon && moonIcon) {
        if (theme === 'dark') {
          sunIcon.style.display = 'block';
          moonIcon.style.display = 'none';
        } else {
          sunIcon.style.display = 'none';
          moonIcon.style.display = 'block';
        }
      }
    });
  }

  function initTheme() {
    var theme = getCurrentTheme();
    updateThemeIcons(theme);
    themeToggles.forEach(function (btn) {
      btn.addEventListener('click', toggleTheme);
    });
  }


  // ─── ROUTER ─────────────────────────────────────────────────────
  function getHash() {
    var hash = window.location.hash || '#/';
    if (hash === '#' || hash === '') hash = '#/';
    return hash;
  }

  function navigateTo(hash) {
    window.location.hash = hash;
  }

  function handleRoute() {
    var hash = getHash();

    // Guard: redirect to home if trying to access dashboard without login
    if (hash === '#/dashboard' && !isLoggedIn) {
      navigateTo('#/login');
      return;
    }

    // 404 fallback
    if (VALID_HASHES.indexOf(hash) === -1) {
      navigateTo('#/');
      return;
    }

    // Hide all pages
    PAGES.forEach(function (id) {
      var page = document.getElementById(id);
      if (page) {
        page.classList.remove('page--active');
      }
    });

    // Show active page
    var pageMap = {
      '#/': 'page-home',
      '#/login': 'page-login',
      '#/dashboard': 'page-dashboard'
    };
    var activeId = pageMap[hash];
    if (activeId) {
      var activePage = document.getElementById(activeId);
      if (activePage) {
        activePage.classList.add('page--active');
      }
    }

    // Page-specific init
    if (hash === '#/dashboard' && isLoggedIn) {
      initDashboard();
    }
    if (hash === '#/login') {
      resetLoginForm();
    }
    if (hash === '#/') {
      // Reset scroll on home
      window.scrollTo(0, 0);
    }

    // Close mobile menu on navigate
    closeMobileMenu();
  }


  // ─── LANDING PAGE ───────────────────────────────────────────────
  function initLanding() {
    // Navbar scroll effect
    window.addEventListener('scroll', function () {
      if (landingNavbar) {
        if (window.scrollY > 20) {
          landingNavbar.classList.add('navbar--scrolled');
        } else {
          landingNavbar.classList.remove('navbar--scrolled');
        }
      }
    });

    // Hamburger menu
    if (hamburgerBtn) {
      hamburgerBtn.addEventListener('click', function () {
        toggleMobileMenu();
      });
    }

    // Mobile menu links close menu
    if (mobileMenu) {
      $$('a', mobileMenu).forEach(function (link) {
        link.addEventListener('click', function () {
          closeMobileMenu();
        });
      });
    }

    // Smooth scroll for anchor links
    $$('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        // Only handle section anchors like #features, #pricing etc.
        if (href && href.charAt(0) === '#' && href.charAt(1) !== '/') {
          var target = document.getElementById(href.substring(1));
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            closeMobileMenu();
          }
        }
      });
    });
  }

  function toggleMobileMenu() {
    if (!mobileMenu || !hamburgerBtn) return;
    var isOpen = mobileMenu.classList.contains('mobile-menu--active');
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  function openMobileMenu() {
    if (!mobileMenu || !hamburgerBtn) return;
    mobileMenu.classList.add('mobile-menu--active');
    mobileMenu.setAttribute('aria-hidden', 'false');
    hamburgerBtn.classList.add('hamburger--active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (!mobileMenu || !hamburgerBtn) return;
    mobileMenu.classList.remove('mobile-menu--active');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburgerBtn.classList.remove('hamburger--active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
  }


  // ─── LOGIN ──────────────────────────────────────────────────────
  function initLogin() {
    if (!loginForm) return;

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      handleLoginSubmit();
    });

    // Password toggle
    if (togglePasswordBtn && loginPassword) {
      togglePasswordBtn.addEventListener('click', function () {
        var isPassword = loginPassword.type === 'password';
        loginPassword.type = isPassword ? 'text' : 'password';
        togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        // Toggle icon
        var eyeOpen = togglePasswordBtn.querySelector('.icon-eye');
        var eyeOff = togglePasswordBtn.querySelector('.icon-eye-off');
        if (eyeOpen && eyeOff) {
          eyeOpen.style.display = isPassword ? 'none' : 'block';
          eyeOff.style.display = isPassword ? 'block' : 'none';
        }
      });
    }

    // Forgot password
    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener('click', function () {
        openModal(forgotPasswordOverlay);
      });
    }
    if (forgotPasswordClose) {
      forgotPasswordClose.addEventListener('click', function () {
        closeModal(forgotPasswordOverlay);
      });
    }
    if (forgotPasswordOk) {
      forgotPasswordOk.addEventListener('click', function () {
        closeModal(forgotPasswordOverlay);
      });
    }

    // MFA input auto-advance
    mfaInputs.forEach(function (input, idx) {
      input.addEventListener('input', function (e) {
        var val = this.value.replace(/\D/g, '');
        this.value = val;
        if (val && idx < mfaInputs.length - 1) {
          mfaInputs[idx + 1].focus();
        }
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !this.value && idx > 0) {
          mfaInputs[idx - 1].focus();
        }
      });
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        var paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        for (var i = 0; i < Math.min(paste.length, mfaInputs.length - idx); i++) {
          mfaInputs[idx + i].value = paste[i];
        }
        var nextIdx = Math.min(idx + paste.length, mfaInputs.length - 1);
        mfaInputs[nextIdx].focus();
      });
    });

    // MFA submit
    if (mfaSubmit) {
      mfaSubmit.addEventListener('click', function () {
        handleMfaSubmit();
      });
    }

    // Live validation
    if (loginEmail) {
      loginEmail.addEventListener('input', function () {
        clearFieldError('login-email');
      });
    }
    if (loginPassword) {
      loginPassword.addEventListener('input', function () {
        clearFieldError('login-password');
      });
    }
  }

  function validateLoginFields() {
    var valid = true;
    var emailVal = loginEmail ? loginEmail.value.trim() : '';
    var passVal = loginPassword ? loginPassword.value : '';

    // Email or mobile validation
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var mobileRegex = /^03\d{2}-?\d{7}$/;
    if (!emailVal) {
      showFieldError('login-email', 'Email or mobile number is required');
      valid = false;
    } else if (!emailRegex.test(emailVal) && !mobileRegex.test(emailVal)) {
      showFieldError('login-email', 'Enter a valid email or Pakistani mobile (03XX-XXXXXXX)');
      valid = false;
    }

    // Password validation
    if (!passVal) {
      showFieldError('login-password', 'Password is required');
      valid = false;
    } else if (passVal.length < 8) {
      showFieldError('login-password', 'Password must be at least 8 characters');
      valid = false;
    }

    return valid;
  }

  function handleLoginSubmit() {
    clearAllLoginErrors();

    if (!validateLoginFields()) return;

    // Show loading state
    if (loginSubmit) {
      loginSubmit.classList.add('btn--loading');
      loginSubmit.disabled = true;
      loginSubmit.textContent = '';
      var spinner = document.createElement('span');
      spinner.className = 'spinner';
      loginSubmit.appendChild(spinner);
      var loadingText = document.createElement('span');
      loadingText.textContent = 'Verifying...';
      loginSubmit.appendChild(loadingText);
    }

    // Simulate verification delay
    setTimeout(function () {
      if (loginSubmit) {
        loginSubmit.classList.remove('btn--loading');
        loginSubmit.disabled = false;
        loginSubmit.textContent = 'Sign in';
      }

      // Show MFA step
      if (loginStepCredentials) loginStepCredentials.classList.add('hidden');
      if (loginStepMfa) loginStepMfa.classList.remove('hidden');

      // Focus first MFA input
      if (mfaInputs.length > 0) mfaInputs[0].focus();
    }, LOGIN_DELAY);
  }

  function handleMfaSubmit() {
    var code = mfaInputs.map(function (input) { return input.value; }).join('');
    if (code.length < 6) {
      showFieldError('mfa', 'Please enter all 6 digits');
      return;
    }

    // Show loading
    if (mfaSubmit) {
      mfaSubmit.classList.add('btn--loading');
      mfaSubmit.disabled = true;
      mfaSubmit.textContent = '';
      var spinner = document.createElement('span');
      spinner.className = 'spinner';
      mfaSubmit.appendChild(spinner);
      var loadingText = document.createElement('span');
      loadingText.textContent = 'Verifying...';
      mfaSubmit.appendChild(loadingText);
    }

    setTimeout(function () {
      isLoggedIn = true;
      if (mfaSubmit) {
        mfaSubmit.classList.remove('btn--loading');
        mfaSubmit.disabled = false;
        mfaSubmit.textContent = 'Verify & Continue';
      }
      navigateTo('#/dashboard');
      showToast('Welcome back, ' + SHOP.owner + '!', 'success');
    }, LOGIN_DELAY);
  }

  function resetLoginForm() {
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) {
      loginPassword.value = '';
      loginPassword.type = 'password';
    }
    if (togglePasswordBtn) {
      var eyeOpen = togglePasswordBtn.querySelector('.icon-eye');
      var eyeOff = togglePasswordBtn.querySelector('.icon-eye-off');
      if (eyeOpen) eyeOpen.style.display = 'block';
      if (eyeOff) eyeOff.style.display = 'none';
    }
    clearAllLoginErrors();
    if (loginStepCredentials) loginStepCredentials.classList.remove('hidden');
    if (loginStepMfa) loginStepMfa.classList.add('hidden');
    mfaInputs.forEach(function (input) { input.value = ''; });
    if (loginSubmit) {
      loginSubmit.classList.remove('btn--loading');
      loginSubmit.disabled = false;
      loginSubmit.textContent = 'Sign in';
    }
    if (mfaSubmit) {
      mfaSubmit.classList.remove('btn--loading');
      mfaSubmit.disabled = false;
      mfaSubmit.textContent = 'Verify & Continue';
    }
  }


  // ─── FIELD ERRORS ───────────────────────────────────────────────
  function showFieldError(fieldId, message) {
    var errorEl = document.getElementById(fieldId + '-error');
    var inputEl = document.getElementById(fieldId === 'mfa' ? 'mfa-inputs' : ('login-' + fieldId));
    if (errorEl) {
      errorEl.textContent = '';
      // Create error icon
      var iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('width', '14');
      iconSvg.setAttribute('height', '14');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.setAttribute('fill', 'none');
      iconSvg.setAttribute('stroke', 'currentColor');
      iconSvg.setAttribute('stroke-width', '2');
      iconSvg.setAttribute('stroke-linecap', 'round');
      iconSvg.setAttribute('stroke-linejoin', 'round');
      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12');
      circle.setAttribute('cy', '12');
      circle.setAttribute('r', '10');
      var line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', '12');
      line1.setAttribute('x2', '12');
      line1.setAttribute('y1', '8');
      line1.setAttribute('y2', '12');
      var line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', '12');
      line2.setAttribute('x2', '12.01');
      line2.setAttribute('y1', '16');
      line2.setAttribute('y2', '16');
      iconSvg.appendChild(circle);
      iconSvg.appendChild(line1);
      iconSvg.appendChild(line2);
      errorEl.appendChild(iconSvg);
      var span = document.createElement('span');
      span.textContent = message;
      errorEl.appendChild(span);
    }
    if (inputEl) {
      inputEl.classList.add('input--error');
    }
    // Also try the direct input
    var directInput = document.getElementById('login-' + fieldId);
    if (directInput) directInput.classList.add('input--error');
  }

  function clearFieldError(fieldId) {
    var errorEl = document.getElementById(fieldId + '-error') ||
                  document.getElementById('login-' + fieldId + '-error');
    var inputEl = document.getElementById(fieldId) ||
                  document.getElementById('login-' + fieldId);
    if (errorEl) errorEl.textContent = '';
    if (inputEl) inputEl.classList.remove('input--error');
  }

  function clearAllLoginErrors() {
    ['login-email', 'login-password', 'login-general', 'mfa'].forEach(function (id) {
      var el = document.getElementById(id + '-error');
      if (el) el.textContent = '';
    });
    if (loginEmail) loginEmail.classList.remove('input--error');
    if (loginPassword) loginPassword.classList.remove('input--error');
  }


  // ─── DASHBOARD ──────────────────────────────────────────────────
  function initDashboard() {
    updateSummaryCards();
    renderCustomerList();
    renderActivityLog();
    populateCustomerSelect();
    updateGreeting();
  }

  function updateGreeting() {
    var greetingEl = $('#dashboard-greeting');
    if (greetingEl) {
      var hour = new Date().getHours();
      var timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      greetingEl.textContent = 'Assalam o Alaikum, ' + SHOP.owner + ' — ' + timeGreeting;
    }
  }

  function updateSummaryCards() {
    var totalDue = 0;
    var customersWithDues = 0;
    var todayPayments = 0;
    var todayPaymentCount = 0;
    var todayEntries = 0;
    var todayCredits = 0;
    var todayPaymentsCount = 0;
    var today = new Date().toISOString().slice(0, 10);

    CUSTOMERS.forEach(function (c) {
      if (c.balance > 0) {
        totalDue += c.balance;
        customersWithDues++;
      }
      c.entries.forEach(function (e) {
        if (e.date === today) {
          todayEntries++;
          if (e.type === 'payment') {
            todayPayments += e.amount;
            todayPaymentsCount++;
          } else {
            todayCredits++;
          }
        }
      });
    });

    if (summaryTotalDue) summaryTotalDue.textContent = formatMoney(totalDue);
    if (summaryReceivedToday) summaryReceivedToday.textContent = formatMoney(todayPayments);
    if (summaryCustomersDues) summaryCustomersDues.textContent = customersWithDues.toString();
    if (summaryEntriesToday) summaryEntriesToday.textContent = todayEntries.toString();

    // Update hint texts
    var totalHint = summaryTotalDue ? summaryTotalDue.closest('.summary-card__content') : null;
    if (totalHint) {
      var hintEl = totalHint.querySelector('.summary-card__hint');
      if (hintEl) hintEl.textContent = 'From ' + customersWithDues + ' customers';
    }
    var receivedHint = summaryReceivedToday ? summaryReceivedToday.closest('.summary-card__content') : null;
    if (receivedHint) {
      var hintEl2 = receivedHint.querySelector('.summary-card__hint');
      if (hintEl2) hintEl2.textContent = todayPaymentsCount + ' payment' + (todayPaymentsCount !== 1 ? 's' : '');
    }
    var duesHint = summaryCustomersDues ? summaryCustomersDues.closest('.summary-card__content') : null;
    if (duesHint) {
      var hintEl3 = duesHint.querySelector('.summary-card__hint');
      if (hintEl3) hintEl3.textContent = 'Out of ' + CUSTOMERS.length + ' total';
    }
    var entriesHint = summaryEntriesToday ? summaryEntriesToday.closest('.summary-card__content') : null;
    if (entriesHint) {
      var hintEl4 = entriesHint.querySelector('.summary-card__hint');
      if (hintEl4) hintEl4.textContent = todayCredits + ' credit, ' + todayPaymentsCount + ' payments';
    }
  }


  // ─── CUSTOMER LIST ──────────────────────────────────────────────
  function getFilteredCustomers() {
    var filtered = CUSTOMERS.slice();

    // Search filter
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      filtered = filtered.filter(function (c) {
        return c.name.toLowerCase().indexOf(q) !== -1 ||
               c.phone.indexOf(q) !== -1;
      });
    }

    // Category filter
    if (currentFilter === 'has-dues') {
      filtered = filtered.filter(function (c) { return c.balance > 0; });
    } else if (currentFilter === 'settled') {
      filtered = filtered.filter(function (c) { return c.balance === 0; });
    } else if (currentFilter === 'overdue') {
      var thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      var cutoff = thirtyDaysAgo.toISOString().slice(0, 10);
      filtered = filtered.filter(function (c) {
        return c.balance > 0 && c.lastActivity < cutoff;
      });
    }

    // Sort
    if (currentSort === 'highest-due') {
      filtered.sort(function (a, b) { return b.balance - a.balance; });
    } else if (currentSort === 'recent') {
      filtered.sort(function (a, b) { return b.lastActivity.localeCompare(a.lastActivity); });
    } else if (currentSort === 'name-az') {
      filtered.sort(function (a, b) { return a.name.localeCompare(b.name); });
    }

    return filtered;
  }

  function renderCustomerList() {
    var customers = getFilteredCustomers();

    // Render desktop table
    if (customerTbody) {
      customerTbody.textContent = '';
      customers.forEach(function (c) {
        var tr = document.createElement('tr');
        tr.className = 'customer-row';
        tr.setAttribute('tabindex', '0');
        tr.setAttribute('role', 'button');
        tr.setAttribute('aria-label', 'View ledger for ' + c.name);

        // Name cell
        var tdName = document.createElement('td');
        var nameWrap = document.createElement('div');
        nameWrap.className = 'customer-row__name';
        var avatar = document.createElement('div');
        avatar.className = 'customer-avatar';
        avatar.textContent = getInitials(c.name);
        var nameSpan = document.createElement('span');
        nameSpan.className = 'font-medium';
        nameSpan.textContent = c.name;
        nameWrap.appendChild(avatar);
        nameWrap.appendChild(nameSpan);
        tdName.appendChild(nameWrap);

        // Phone cell
        var tdPhone = document.createElement('td');
        tdPhone.className = 'text-muted text-sm';
        tdPhone.textContent = c.phone;

        // Last activity cell
        var tdActivity = document.createElement('td');
        tdActivity.className = 'text-muted text-sm';
        tdActivity.textContent = formatDate(c.lastActivity);

        // Balance cell
        var tdBalance = document.createElement('td');
        var badge = document.createElement('span');
        if (c.balance > 0) {
          badge.className = 'badge badge--due';
          badge.textContent = formatMoney(c.balance) + ' due';
        } else {
          badge.className = 'badge badge--ok';
          badge.textContent = 'Settled';
        }
        tdBalance.appendChild(badge);

        // Action cell
        var tdAction = document.createElement('td');
        var viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn--ghost btn--sm';
        viewBtn.textContent = 'View';
        viewBtn.setAttribute('aria-label', 'View ledger for ' + c.name);
        tdAction.appendChild(viewBtn);

        tr.appendChild(tdName);
        tr.appendChild(tdPhone);
        tr.appendChild(tdActivity);
        tr.appendChild(tdBalance);
        tr.appendChild(tdAction);

        // Click handler
        tr.addEventListener('click', function () {
          openCustomerDrawer(c.id);
        });
        tr.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openCustomerDrawer(c.id);
          }
        });

        customerTbody.appendChild(tr);
      });
    }

    // Render mobile cards
    if (customerCards) {
      customerCards.textContent = '';
      customers.forEach(function (c) {
        var card = document.createElement('div');
        card.className = 'customer-card card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'View ledger for ' + c.name);

        var cardTop = document.createElement('div');
        cardTop.className = 'customer-card__top';

        var cardLeft = document.createElement('div');
        cardLeft.className = 'customer-card__left';
        var avatar = document.createElement('div');
        avatar.className = 'customer-avatar';
        avatar.textContent = getInitials(c.name);
        var info = document.createElement('div');
        info.className = 'customer-card__info';
        var nameEl = document.createElement('span');
        nameEl.className = 'font-medium';
        nameEl.textContent = c.name;
        var phoneEl = document.createElement('span');
        phoneEl.className = 'text-sm text-muted';
        phoneEl.textContent = c.phone;
        info.appendChild(nameEl);
        info.appendChild(phoneEl);
        cardLeft.appendChild(avatar);
        cardLeft.appendChild(info);

        var badge = document.createElement('span');
        if (c.balance > 0) {
          badge.className = 'badge badge--due';
          badge.textContent = formatMoney(c.balance) + ' due';
        } else {
          badge.className = 'badge badge--ok';
          badge.textContent = 'Settled';
        }

        cardTop.appendChild(cardLeft);
        cardTop.appendChild(badge);

        var cardBottom = document.createElement('div');
        cardBottom.className = 'customer-card__bottom';
        var dateEl = document.createElement('span');
        dateEl.className = 'text-xs text-muted';
        dateEl.textContent = 'Last activity: ' + formatDate(c.lastActivity);
        cardBottom.appendChild(dateEl);

        card.appendChild(cardTop);
        card.appendChild(cardBottom);

        card.addEventListener('click', function () {
          openCustomerDrawer(c.id);
        });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openCustomerDrawer(c.id);
          }
        });

        customerCards.appendChild(card);
      });
    }

    // Empty state
    if (emptyState) {
      if (customers.length === 0) {
        emptyState.classList.remove('hidden');
        if (customerTbody) customerTbody.closest('.table-wrapper').style.display = 'none';
        if (customerCards) customerCards.style.display = 'none';
      } else {
        emptyState.classList.add('hidden');
        if (customerTbody) customerTbody.closest('.table-wrapper').style.display = '';
        if (customerCards) customerCards.style.display = '';
      }
    }
  }


  // ─── SEARCH, FILTER, SORT ──────────────────────────────────────
  function initSearchFilterSort() {
    // Search
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = this.value.trim();
        renderCustomerList();
      });
    }

    // Filter chips
    if (filterChips) {
      $$('.chip', filterChips).forEach(function (chip) {
        chip.addEventListener('click', function () {
          currentFilter = this.getAttribute('data-filter');
          $$('.chip', filterChips).forEach(function (c) { c.classList.remove('chip--active'); });
          this.classList.add('chip--active');
          renderCustomerList();
        });
      });
    }

    // Sort
    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        currentSort = this.value;
        renderCustomerList();
      });
    }
  }


  // ─── CUSTOMER DRAWER ───────────────────────────────────────────
  var drawerFocusTrap = null;

  function openCustomerDrawer(customerId) {
    var customer = CUSTOMERS.find(function (c) { return c.id === customerId; });
    if (!customer || !drawerOverlay) return;

    // Populate drawer
    if (drawerCustomerName) drawerCustomerName.textContent = customer.name;
    if (drawerNameDisplay) drawerNameDisplay.textContent = customer.name;
    if (drawerAvatar) drawerAvatar.textContent = getInitials(customer.name);
    if (drawerPhone) drawerPhone.textContent = customer.phone;

    if (drawerBalance) {
      if (customer.balance > 0) {
        drawerBalance.textContent = formatMoney(customer.balance) + ' due';
        drawerBalance.className = 'drawer__balance-amount tabular-nums drawer__balance--due';
      } else {
        drawerBalance.textContent = 'Settled';
        drawerBalance.className = 'drawer__balance-amount tabular-nums drawer__balance--ok';
      }
    }

    if (drawerBalanceCard) {
      if (customer.balance > 0) {
        drawerBalanceCard.className = 'drawer__balance-card drawer__balance-card--due';
      } else {
        drawerBalanceCard.className = 'drawer__balance-card drawer__balance-card--ok';
      }
    }

    // Render timeline
    if (ledgerTimeline) {
      ledgerTimeline.textContent = '';
      // Show entries newest first
      var entries = customer.entries.slice().reverse();
      entries.forEach(function (entry) {
        var entryEl = document.createElement('div');
        entryEl.className = 'ledger-entry ledger-entry--' + entry.type;

        var marker = document.createElement('div');
        marker.className = 'ledger-entry__marker';
        // Create arrow icon for marker
        var markerSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        markerSvg.setAttribute('width', '12');
        markerSvg.setAttribute('height', '12');
        markerSvg.setAttribute('viewBox', '0 0 24 24');
        markerSvg.setAttribute('fill', 'none');
        markerSvg.setAttribute('stroke', 'currentColor');
        markerSvg.setAttribute('stroke-width', '2.5');
        markerSvg.setAttribute('stroke-linecap', 'round');
        markerSvg.setAttribute('stroke-linejoin', 'round');
        if (entry.type === 'credit') {
          // Arrow up-right
          var p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          p1.setAttribute('d', 'M7 7h10v10');
          var p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          p2.setAttribute('d', 'M7 17 17 7');
          markerSvg.appendChild(p1);
          markerSvg.appendChild(p2);
        } else {
          // Arrow down-left
          var p3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          p3.setAttribute('d', 'M17 7 7 17');
          var p4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          p4.setAttribute('d', 'M17 17H7V7');
          markerSvg.appendChild(p3);
          markerSvg.appendChild(p4);
        }
        marker.appendChild(markerSvg);

        var content = document.createElement('div');
        content.className = 'ledger-entry__content';

        var topRow = document.createElement('div');
        topRow.className = 'ledger-entry__top';

        var typeLabel = document.createElement('span');
        typeLabel.className = 'ledger-entry__type';
        typeLabel.textContent = entry.type === 'credit' ? 'Credit sale' : 'Payment received';

        var amount = document.createElement('span');
        amount.className = 'ledger-entry__amount ledger-entry__amount--' + entry.type + ' tabular-nums';
        amount.textContent = (entry.type === 'credit' ? '+' : '-') + ' ' + formatMoney(entry.amount);

        topRow.appendChild(typeLabel);
        topRow.appendChild(amount);

        var meta = document.createElement('div');
        meta.className = 'ledger-entry__meta';
        var dateSpan = document.createElement('span');
        dateSpan.textContent = formatDate(entry.date);
        var sep = document.createElement('span');
        sep.textContent = '·';
        var recorder = document.createElement('span');
        recorder.textContent = 'Recorded by: ' + entry.recordedBy;
        meta.appendChild(dateSpan);
        meta.appendChild(sep);
        meta.appendChild(recorder);

        var balanceRow = document.createElement('div');
        balanceRow.className = 'ledger-entry__balance text-sm text-muted tabular-nums';
        balanceRow.textContent = 'Balance: ' + formatMoney(entry.runningBalance);

        if (entry.note) {
          var noteEl = document.createElement('div');
          noteEl.className = 'ledger-entry__note text-sm text-muted';
          noteEl.textContent = entry.note;
          content.appendChild(topRow);
          content.appendChild(noteEl);
          content.appendChild(meta);
          content.appendChild(balanceRow);
        } else {
          content.appendChild(topRow);
          content.appendChild(meta);
          content.appendChild(balanceRow);
        }

        entryEl.appendChild(marker);
        entryEl.appendChild(content);
        ledgerTimeline.appendChild(entryEl);
      });
    }

    // Open drawer
    drawerOverlay.classList.add('drawer-overlay--active');
    drawerOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus trap
    setupFocusTrap(customerDrawer);

    // Focus close button
    if (drawerClose) drawerClose.focus();
  }

  function closeCustomerDrawer() {
    if (!drawerOverlay) return;
    drawerOverlay.classList.remove('drawer-overlay--active');
    drawerOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    removeFocusTrap();
  }

  function initDrawer() {
    if (drawerClose) {
      drawerClose.addEventListener('click', closeCustomerDrawer);
    }
    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', function (e) {
        if (e.target === drawerOverlay) {
          closeCustomerDrawer();
        }
      });
    }
  }


  // ─── NEW ENTRY MODAL ───────────────────────────────────────────
  function populateCustomerSelect() {
    if (!entryCustomer) return;
    // Clear existing options except first
    while (entryCustomer.options.length > 1) {
      entryCustomer.remove(1);
    }
    CUSTOMERS.forEach(function (c) {
      var option = document.createElement('option');
      option.value = c.id.toString();
      option.textContent = c.name + ' (' + c.phone + ')';
      entryCustomer.appendChild(option);
    });
  }

  function openNewEntryModal() {
    if (!newEntryOverlay) return;
    resetEntryForm();
    newEntryOverlay.classList.add('modal-overlay--active');
    document.body.style.overflow = 'hidden';
    setupFocusTrap(newEntryModal);
    if (entryCustomer) entryCustomer.focus();
  }

  function closeNewEntryModal() {
    if (!newEntryOverlay) return;
    newEntryOverlay.classList.remove('modal-overlay--active');
    document.body.style.overflow = '';
    removeFocusTrap();
  }

  function resetEntryForm() {
    entryStep = 'form';
    selectedEntryType = 'credit';
    if (entryCustomer) entryCustomer.value = '';
    if (entryAmount) entryAmount.value = '';
    if (entryNote) entryNote.value = '';
    if (entryNoteCounter) entryNoteCounter.textContent = '0 / 120';
    if (entryNoteCounter) {
      entryNoteCounter.className = 'char-counter';
    }
    if (entryFormStep) entryFormStep.classList.remove('hidden');
    if (entryConfirmStep) entryConfirmStep.classList.add('hidden');
    if (entryNext) entryNext.classList.remove('hidden');
    if (entryCancel) entryCancel.classList.remove('hidden');
    if (entryConfirm) entryConfirm.classList.add('hidden');
    if (entryBack) entryBack.classList.add('hidden');

    // Reset segmented buttons
    $$('.segmented__btn').forEach(function (btn) {
      btn.classList.remove('segmented__btn--active');
      if (btn.getAttribute('data-type') === 'credit') {
        btn.classList.add('segmented__btn--active');
      }
    });

    // Clear errors
    ['entry-customer', 'entry-amount'].forEach(function (id) {
      var errEl = document.getElementById(id + '-error');
      if (errEl) errEl.textContent = '';
      var inp = document.getElementById(id);
      if (inp) inp.classList.remove('input--error');
    });
  }

  function validateEntryForm() {
    var valid = true;

    if (!entryCustomer || !entryCustomer.value) {
      var err1 = document.getElementById('entry-customer-error');
      if (err1) err1.textContent = 'Please select a customer';
      if (entryCustomer) entryCustomer.classList.add('input--error');
      valid = false;
    }

    var amount = entryAmount ? parseFloat(entryAmount.value) : 0;
    if (!amount || amount <= 0) {
      var err2 = document.getElementById('entry-amount-error');
      if (err2) err2.textContent = 'Enter a valid amount greater than 0';
      if (entryAmount) entryAmount.classList.add('input--error');
      valid = false;
    } else if (amount > 500000) {
      var err3 = document.getElementById('entry-amount-error');
      if (err3) err3.textContent = 'Amount cannot exceed Rs. 500,000';
      if (entryAmount) entryAmount.classList.add('input--error');
      valid = false;
    }

    return valid;
  }

  function showConfirmationStep() {
    if (!validateEntryForm()) return;

    var customerId = parseInt(entryCustomer.value);
    var customer = CUSTOMERS.find(function (c) { return c.id === customerId; });
    if (!customer) return;

    var amount = parseFloat(entryAmount.value);
    var note = entryNote ? entryNote.value.trim() : '';

    // Update confirmation UI
    var confirmTypeLabel = document.getElementById('confirm-type-label');
    var confirmAmount = document.getElementById('confirm-amount');
    var confirmDetail = document.getElementById('confirm-detail');
    var confirmNote = document.getElementById('confirm-note');
    var confirmIcon = document.getElementById('confirm-icon');

    if (confirmTypeLabel) {
      confirmTypeLabel.textContent = selectedEntryType === 'credit' ? 'Credit sale' : 'Payment received';
    }
    if (confirmAmount) {
      confirmAmount.textContent = formatMoney(amount);
      confirmAmount.className = 'confirmation__amount tabular-nums';
    }
    if (confirmDetail) {
      confirmDetail.textContent = (selectedEntryType === 'credit' ? 'to ' : 'from ') + customer.name;
    }
    if (confirmNote && note) {
      confirmNote.textContent = 'Note: ' + note;
      confirmNote.style.display = '';
    } else if (confirmNote) {
      confirmNote.style.display = 'none';
    }

    // Set icon color based on type
    if (confirmIcon) {
      confirmIcon.textContent = '';
      var iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('width', '48');
      iconSvg.setAttribute('height', '48');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.setAttribute('fill', 'none');
      iconSvg.setAttribute('stroke', 'currentColor');
      iconSvg.setAttribute('stroke-width', '1.5');
      iconSvg.setAttribute('stroke-linecap', 'round');
      iconSvg.setAttribute('stroke-linejoin', 'round');
      if (selectedEntryType === 'credit') {
        confirmIcon.style.color = 'var(--credit-due)';
        var p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p1.setAttribute('d', 'M7 7h10v10');
        var p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p2.setAttribute('d', 'M7 17 17 7');
        iconSvg.appendChild(p1);
        iconSvg.appendChild(p2);
      } else {
        confirmIcon.style.color = 'var(--payment-received)';
        var p3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p3.setAttribute('d', 'M17 7 7 17');
        var p4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p4.setAttribute('d', 'M17 17H7V7');
        iconSvg.appendChild(p3);
        iconSvg.appendChild(p4);
      }
      confirmIcon.appendChild(iconSvg);
    }

    // Toggle steps
    entryStep = 'confirm';
    if (entryFormStep) entryFormStep.classList.add('hidden');
    if (entryConfirmStep) entryConfirmStep.classList.remove('hidden');
    if (entryNext) entryNext.classList.add('hidden');
    if (entryCancel) entryCancel.classList.add('hidden');
    if (entryConfirm) entryConfirm.classList.remove('hidden');
    if (entryBack) entryBack.classList.remove('hidden');
  }

  function confirmEntry() {
    var customerId = parseInt(entryCustomer.value);
    var customer = CUSTOMERS.find(function (c) { return c.id === customerId; });
    if (!customer) return;

    var amount = parseFloat(entryAmount.value);
    var note = entryNote ? entryNote.value.trim() : '';

    // Calculate new running balance
    var lastEntry = customer.entries[customer.entries.length - 1];
    var lastBalance = lastEntry ? lastEntry.runningBalance : 0;
    var newBalance;
    if (selectedEntryType === 'credit') {
      newBalance = lastBalance + amount;
    } else {
      newBalance = lastBalance - amount;
    }

    // Create new entry
    var newEntry = {
      id: nextEntryId++,
      date: new Date().toISOString().slice(0, 10),
      type: selectedEntryType,
      amount: amount,
      note: note,
      runningBalance: newBalance,
      recordedBy: 'Owner'
    };

    // Append entry
    customer.entries.push(newEntry);
    customer.balance = newBalance;
    customer.lastActivity = newEntry.date;

    // Update audit log
    var now = new Date();
    var timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
    var actionText = (selectedEntryType === 'credit' ? 'Credit sale ' : 'Payment ') +
                     formatMoney(amount) + ' recorded for ' + customer.name;
    AUDIT_LOG.unshift({
      time: timeStr,
      text: actionText,
      actor: 'Owner'
    });
    // Keep only last 10
    if (AUDIT_LOG.length > 10) AUDIT_LOG.length = 10;

    // Close modal
    closeNewEntryModal();

    // Refresh UI
    updateSummaryCards();
    renderCustomerList();
    renderActivityLog();

    // Show toast
    var toastMsg = (selectedEntryType === 'credit' ? 'Credit sale of ' : 'Payment of ') +
                   formatMoney(amount) + (selectedEntryType === 'credit' ? ' recorded for ' : ' received from ') +
                   customer.name;
    showToast(toastMsg, 'success');
  }

  function initNewEntryModal() {
    // Open button
    if (newEntryBtn) {
      newEntryBtn.addEventListener('click', openNewEntryModal);
    }

    // Close
    if (newEntryClose) {
      newEntryClose.addEventListener('click', closeNewEntryModal);
    }
    if (newEntryOverlay) {
      newEntryOverlay.addEventListener('click', function (e) {
        if (e.target === newEntryOverlay) {
          closeNewEntryModal();
        }
      });
    }

    // Cancel
    if (entryCancel) {
      entryCancel.addEventListener('click', closeNewEntryModal);
    }

    // Next (to confirmation)
    if (entryNext) {
      entryNext.addEventListener('click', showConfirmationStep);
    }

    // Back (to form)
    if (entryBack) {
      entryBack.addEventListener('click', function () {
        entryStep = 'form';
        if (entryFormStep) entryFormStep.classList.remove('hidden');
        if (entryConfirmStep) entryConfirmStep.classList.add('hidden');
        if (entryNext) entryNext.classList.remove('hidden');
        if (entryCancel) entryCancel.classList.remove('hidden');
        if (entryConfirm) entryConfirm.classList.add('hidden');
        if (entryBack) entryBack.classList.add('hidden');
      });
    }

    // Confirm
    if (entryConfirm) {
      entryConfirm.addEventListener('click', confirmEntry);
    }

    // Segmented control
    $$('.segmented__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.segmented__btn').forEach(function (b) { b.classList.remove('segmented__btn--active'); });
        this.classList.add('segmented__btn--active');
        selectedEntryType = this.getAttribute('data-type');
      });
    });

    // Character counter
    if (entryNote && entryNoteCounter) {
      entryNote.addEventListener('input', function () {
        var len = this.value.length;
        entryNoteCounter.textContent = len + ' / 120';
        if (len >= 120) {
          entryNoteCounter.className = 'char-counter char-counter--limit';
        } else if (len >= 100) {
          entryNoteCounter.className = 'char-counter char-counter--warn';
        } else {
          entryNoteCounter.className = 'char-counter';
        }
      });
    }

    // Clear errors on input
    if (entryCustomer) {
      entryCustomer.addEventListener('change', function () {
        var err = document.getElementById('entry-customer-error');
        if (err) err.textContent = '';
        this.classList.remove('input--error');
      });
    }
    if (entryAmount) {
      entryAmount.addEventListener('input', function () {
        var err = document.getElementById('entry-amount-error');
        if (err) err.textContent = '';
        this.classList.remove('input--error');
      });
    }
  }


  // ─── ACTIVITY LOG ───────────────────────────────────────────────
  function renderActivityLog() {
    if (!activityLogList) return;
    activityLogList.textContent = '';
    var items = AUDIT_LOG.slice(0, 5);
    items.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'activity-log__item';

      var time = document.createElement('span');
      time.className = 'activity-log__time';
      time.textContent = item.time;

      var text = document.createElement('span');
      text.className = 'activity-log__text';
      text.textContent = item.text;

      var actor = document.createElement('span');
      actor.className = 'activity-log__actor badge badge--role';
      actor.textContent = item.actor;

      div.appendChild(time);
      div.appendChild(text);
      div.appendChild(actor);

      activityLogList.appendChild(div);
    });
  }


  // ─── USER MENU ──────────────────────────────────────────────────
  function initUserMenu() {
    if (userMenuTrigger && userMenuDropdown) {
      userMenuTrigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = userMenuDropdown.classList.contains('user-menu__dropdown--active');
        if (isOpen) {
          closeUserMenu();
        } else {
          userMenuDropdown.classList.add('user-menu__dropdown--active');
          userMenuTrigger.setAttribute('aria-expanded', 'true');
        }
      });

      // Close on outside click
      document.addEventListener('click', function (e) {
        if (!userMenuDropdown.contains(e.target) && !userMenuTrigger.contains(e.target)) {
          closeUserMenu();
        }
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        isLoggedIn = false;
        closeUserMenu();
        navigateTo('#/');
        showToast('You have been logged out', 'info');
      });
    }

    // Coming soon nav items
    sidebarNavItems.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var nav = this.getAttribute('data-nav');
        if (nav !== 'khata') {
          showToast(capitalize(nav) + ' module is coming soon!', 'info');
        }
      });
    });

    tabBarItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var nav = this.getAttribute('data-nav');
        if (nav !== 'khata') {
          showToast(capitalize(nav) + ' module is coming soon!', 'info');
        }
      });
    });
  }

  function closeUserMenu() {
    if (userMenuDropdown) {
      userMenuDropdown.classList.remove('user-menu__dropdown--active');
    }
    if (userMenuTrigger) {
      userMenuTrigger.setAttribute('aria-expanded', 'false');
    }
  }


  // ─── MODALS & OVERLAYS (generic) ───────────────────────────────
  function openModal(overlay) {
    if (!overlay) return;
    overlay.classList.add('modal-overlay--active');
    document.body.style.overflow = 'hidden';
    var modal = overlay.querySelector('.modal');
    if (modal) setupFocusTrap(modal);
  }

  function closeModal(overlay) {
    if (!overlay) return;
    overlay.classList.remove('modal-overlay--active');
    document.body.style.overflow = '';
    removeFocusTrap();
  }

  // Close modals on overlay click
  function initModalOverlays() {
    $$('.modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          closeModal(overlay);
        }
      });
    });
  }


  // ─── FOCUS TRAP ─────────────────────────────────────────────────
  function setupFocusTrap(container) {
    removeFocusTrap();
    drawerFocusTrap = function (e) {
      if (e.key === 'Escape') {
        // Close whatever is open
        if (drawerOverlay && drawerOverlay.classList.contains('drawer-overlay--active')) {
          closeCustomerDrawer();
        } else if (newEntryOverlay && newEntryOverlay.classList.contains('modal-overlay--active')) {
          closeNewEntryModal();
        } else if (forgotPasswordOverlay && forgotPasswordOverlay.classList.contains('modal-overlay--active')) {
          closeModal(forgotPasswordOverlay);
        }
        return;
      }

      if (e.key !== 'Tab') return;

      var focusables = container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;

      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', drawerFocusTrap);
  }

  function removeFocusTrap() {
    if (drawerFocusTrap) {
      document.removeEventListener('keydown', drawerFocusTrap);
      drawerFocusTrap = null;
    }
  }


  // ─── TOAST ──────────────────────────────────────────────────────
  function showToast(message, type) {
    if (!toastContainer) return;
    type = type || 'success';

    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.setAttribute('role', 'status');

    // Icon
    var iconWrap = document.createElement('span');
    iconWrap.className = 'toast__icon';
    var iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('width', '20');
    iconSvg.setAttribute('height', '20');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.setAttribute('stroke', 'currentColor');
    iconSvg.setAttribute('stroke-width', '2');
    iconSvg.setAttribute('stroke-linecap', 'round');
    iconSvg.setAttribute('stroke-linejoin', 'round');

    if (type === 'success') {
      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12');
      circle.setAttribute('cy', '12');
      circle.setAttribute('r', '10');
      var checkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      checkPath.setAttribute('d', 'm9 12 2 2 4-4');
      iconSvg.appendChild(circle);
      iconSvg.appendChild(checkPath);
    } else if (type === 'error') {
      var circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle2.setAttribute('cx', '12');
      circle2.setAttribute('cy', '12');
      circle2.setAttribute('r', '10');
      var x1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      x1.setAttribute('d', 'm15 9-6 6');
      var x2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      x2.setAttribute('d', 'm9 9 6 6');
      iconSvg.appendChild(circle2);
      iconSvg.appendChild(x1);
      iconSvg.appendChild(x2);
    } else {
      // info
      var circle3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle3.setAttribute('cx', '12');
      circle3.setAttribute('cy', '12');
      circle3.setAttribute('r', '10');
      var line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', '12');
      line1.setAttribute('x2', '12');
      line1.setAttribute('y1', '8');
      line1.setAttribute('y2', '12');
      var line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', '12');
      line2.setAttribute('x2', '12.01');
      line2.setAttribute('y1', '16');
      line2.setAttribute('y2', '16');
      iconSvg.appendChild(circle3);
      iconSvg.appendChild(line1);
      iconSvg.appendChild(line2);
    }
    iconWrap.appendChild(iconSvg);

    // Message
    var msgSpan = document.createElement('span');
    msgSpan.className = 'toast__message';
    msgSpan.textContent = message;

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.className = 'toast__close';
    closeBtn.setAttribute('aria-label', 'Dismiss');
    var closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    closeSvg.setAttribute('width', '16');
    closeSvg.setAttribute('height', '16');
    closeSvg.setAttribute('viewBox', '0 0 24 24');
    closeSvg.setAttribute('fill', 'none');
    closeSvg.setAttribute('stroke', 'currentColor');
    closeSvg.setAttribute('stroke-width', '2');
    closeSvg.setAttribute('stroke-linecap', 'round');
    closeSvg.setAttribute('stroke-linejoin', 'round');
    var cp1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    cp1.setAttribute('d', 'M18 6 6 18');
    var cp2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    cp2.setAttribute('d', 'm6 6 12 12');
    closeSvg.appendChild(cp1);
    closeSvg.appendChild(cp2);
    closeBtn.appendChild(closeSvg);

    toast.appendChild(iconWrap);
    toast.appendChild(msgSpan);
    toast.appendChild(closeBtn);

    toastContainer.appendChild(toast);

    // Close on click
    closeBtn.addEventListener('click', function () {
      dismissToast(toast);
    });

    // Auto dismiss
    setTimeout(function () {
      dismissToast(toast);
    }, TOAST_DURATION);
  }

  function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('toast--dismissing');
    setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  }


  // ─── HELPERS ────────────────────────────────────────────────────
  function getInitials(name) {
    var parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  }

  function formatDate(dateStr) {
    var date = new Date(dateStr + 'T00:00:00');
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    }
    if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }

    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }


  // ─── GLOBAL KEYBOARD ───────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      // Close mobile menu
      if (mobileMenu && mobileMenu.classList.contains('mobile-menu--active')) {
        closeMobileMenu();
        return;
      }
      // Close user menu
      if (userMenuDropdown && userMenuDropdown.classList.contains('user-menu__dropdown--active')) {
        closeUserMenu();
        return;
      }
    }
  });


  // ─── INIT ───────────────────────────────────────────────────────
  function init() {
    initTheme();
    initLanding();
    initLogin();
    initDrawer();
    initNewEntryModal();
    initSearchFilterSort();
    initUserMenu();
    initModalOverlays();

    // Listen for hash changes
    window.addEventListener('hashchange', handleRoute);

    // Initial route
    handleRoute();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
