// Hiding UI is not a security control; real enforcement is done server-side in the backend phase.

/**
 * Dukaan Saathi - Global UI Interactions & Sanitization Utilities
 * Implements input validation, output encoding, CSV neutralization, and UI components.
 */

/* ─── OUTPUT ENCODING & INPUT VALIDATION (Principle 7) ───────────────── */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeNumber(val, fallback = 0) {
  const parsed = Number(val);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Shared Validators
 */
const DS_VALIDATORS = {
  // Amount > 0 and <= Rs. 500,000
  validateAmount(val) {
    const num = Number(val);
    return !isNaN(num) && num > 0 && num <= 500000;
  },

  // Pakistani mobile format e.g. 0300-1234567 or 03001234567
  validatePhone(phone) {
    if (!phone) return false;
    const clean = phone.replace(/[\s-]/g, '');
    return /^03\d{9}$/.test(clean);
  },

  // Customer or merchant name (2-50 characters)
  validateName(name) {
    if (!name || typeof name !== 'string') return false;
    const clean = name.trim();
    return clean.length >= 2 && clean.length <= 50;
  },

  // Ledger note (max 120 characters)
  validateNote(note) {
    if (!note) return true; // Optional
    return String(note).trim().length <= 120;
  },

  // CSV Formula Injection Neutralization (=, +, -, @)
  neutralizeCsvCell(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (/^[=+\-@]/.test(str)) {
      return "'" + str;
    }
    return str;
  }
};

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // 1. Theme Toggle Setup
  initThemeToggles();

  // 2. Public Navbar Sticky Scroll & Mobile Menu
  initPublicHeader();

  // 3. Highlight Active Nav Item
  highlightActiveNav();

  // 4. Scroll Reveal Animations
  initScrollReveal();

  // 5. Stat Counter Animations
  initStatCounters();

  // 6. Accordions
  initAccordions();

  // 7. Ripple Effects
  initRipples();

  // 8. Password Eye Toggle
  initPasswordToggles();

  // 9. User Menu Dropdown & Logout
  initUserMenu();
});

/* Theme Toggles */
function initThemeToggles() {
  const toggles = document.querySelectorAll('.theme-toggle');
  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try {
        localStorage.setItem('ds-theme', next);
      } catch(e) {}
    });
  });
}

/* Public Header Scroll & Mobile Hamburger */
function initPublicHeader() {
  const header = document.querySelector('.pub-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        header.classList.add('pub-header--scrolled');
      } else {
        header.classList.remove('pub-header--scrolled');
      }
    });
  }

  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-nav-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('mobile-nav-menu--open');
      if (isOpen) {
        mobileMenu.classList.remove('mobile-nav-menu--open');
      } else {
        mobileMenu.classList.add('mobile-nav-menu--open');
      }
    });

    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('mobile-nav-menu--open');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') mobileMenu.classList.remove('mobile-nav-menu--open');
    });
  }
}

/* Active Nav Highlighting */
function highlightActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .sidebar-link, .tab-item').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(path)) {
      if (link.classList.contains('nav-link')) link.classList.add('nav-link--active');
      if (link.classList.contains('sidebar-link')) link.classList.add('sidebar-link--active');
      if (link.classList.contains('tab-item')) link.classList.add('tab-item--active');
    }
  });
}

/* Scroll Reveal */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach(el => observer.observe(el));
}

/* Count Up Numbers */
function initStatCounters() {
  const counters = document.querySelectorAll('.count-up');
  if (!counters.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.getAttribute('data-target') || '0', 10);
        const prefix = entry.target.getAttribute('data-prefix') || '';
        const suffix = entry.target.getAttribute('data-suffix') || '';
        let count = 0;
        const speed = Math.max(1, Math.floor(target / 40));
        const timer = setInterval(() => {
          count += speed;
          if (count >= target) {
            count = target;
            clearInterval(timer);
          }
          entry.target.textContent = prefix + count.toLocaleString('en-PK') + suffix;
        }, 30);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  counters.forEach(el => observer.observe(el));
}

/* Accordions */
function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      if (item) {
        item.classList.toggle('accordion-item--open');
      }
    });
  });
}

/* Ripples */
function initRipples() {
  document.querySelectorAll('.btn--primary, .btn--outline').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const circle = document.createElement('span');
      circle.className = 'btn-ripple';
      const rect = this.getBoundingClientRect();
      const diameter = Math.max(rect.width, rect.height);
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - diameter / 2}px`;
      circle.style.top = `${e.clientY - rect.top - diameter / 2}px`;
      this.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  });
}

/* Password eye toggle */
function initPasswordToggles() {
  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
      }
    });
  });
}

/* User Menu Dropdown & Global Logout */
function initUserMenu() {
  const trigger = document.querySelector('.user-menu-trigger');
  const dropdown = document.querySelector('.user-menu-dropdown');
  if (trigger && dropdown) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('user-menu-dropdown--open');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('user-menu-dropdown--open');
    });
  }

  // Hook logout buttons across pages
  document.querySelectorAll('.logout-btn, a[href="login.html"].dropdown-item--danger').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof DS_AUTH !== 'undefined') {
        DS_AUTH.logout();
      } else {
        sessionStorage.clear();
        window.location.href = 'login.html';
      }
    });
  });
}

/* Global Toast Notification Helper (XSS-Safe via textContent) */
function showToast(message, type = 'primary') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  
  const span = document.createElement('span');
  span.textContent = message; // Safe textContent preventing XSS

  const btn = document.createElement('button');
  btn.style.cssText = 'color:var(--text-muted); padding:4px; background:none; border:none; cursor:pointer; font-size:16px; margin-left:8px;';
  btn.setAttribute('aria-label', 'Close');
  btn.textContent = '×';
  btn.addEventListener('click', () => toast.remove());

  toast.appendChild(span);
  toast.appendChild(btn);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}
