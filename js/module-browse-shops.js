// Hiding UI is not a security control; real enforcement is done server-side in the backend phase.
// Frontend validation is not security; the backend will re-validate and enforce authorization.

/**
 * Dukaan Saathi - Module 2: Customer Shop Directory & Public Exploration
 * Handles real-time search, multi-criteria filtering, sorting,
 * privacy masking of owner PII, and storefront modal views.
 */

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // Elements
  const searchInput = document.getElementById('shop-search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const categoryChipsContainer = document.getElementById('category-chips');
  const citySelect = document.getElementById('filter-city');
  const sortSelect = document.getElementById('filter-sort');
  const visibleCountEl = document.getElementById('visible-count');
  const shopsGrid = document.getElementById('shops-grid');
  const emptyState = document.getElementById('shops-empty-state');
  const btnResetFilters = document.getElementById('btn-reset-filters');

  // Modal Elements
  const modalDetails = document.getElementById('modal-shop-details');
  const modalShopName = document.getElementById('modal-shop-name');
  const modalShopCategory = document.getElementById('modal-shop-category');
  const modalShopCity = document.getElementById('modal-shop-city');
  const modalShopAddress = document.getElementById('modal-shop-address');
  const modalShopTiming = document.getElementById('modal-shop-timing');
  const modalShopDescription = document.getElementById('modal-shop-description');
  const modalShopServices = document.getElementById('modal-shop-services');
  const modalShopRating = document.getElementById('modal-shop-rating');
  const modalShopReviews = document.getElementById('modal-shop-reviews');
  const btnCloseModal = document.getElementById('btn-close-shop-modal');
  const btnCloseModalFooter = document.getElementById('btn-close-shop-modal-footer');
  const btnContactShop = document.getElementById('btn-contact-shop');
  const contactButtonText = document.getElementById('contact-button-text');

  // State
  let currentCategory = 'all';
  let currentCity = 'all';
  let currentSort = 'rating';
  let searchQuery = '';
  let activeShopForModal = null;

  // Initialize
  renderDirectory();

  // Search Input Event
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      if (btnClearSearch) {
        btnClearSearch.style.display = searchQuery.length > 0 ? 'inline-block' : 'none';
      }
      renderDirectory();
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      btnClearSearch.style.display = 'none';
      renderDirectory();
    });
  }

  // Category Chip Clicks
  if (categoryChipsContainer) {
    categoryChipsContainer.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        categoryChipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
        chip.classList.add('chip--active');
        currentCategory = chip.getAttribute('data-category');
        renderDirectory();
      });
    });
  }

  // City & Sort Changes
  if (citySelect) {
    citySelect.addEventListener('change', () => {
      currentCity = citySelect.value;
      renderDirectory();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      renderDirectory();
    });
  }

  // Reset Filters Button
  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', () => {
      currentCategory = 'all';
      currentCity = 'all';
      currentSort = 'rating';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      if (btnClearSearch) btnClearSearch.style.display = 'none';
      if (citySelect) citySelect.value = 'all';
      if (sortSelect) sortSelect.value = 'rating';
      if (categoryChipsContainer) {
        categoryChipsContainer.querySelectorAll('.chip').forEach(c => {
          if (c.getAttribute('data-category') === 'all') c.classList.add('chip--active');
          else c.classList.remove('chip--active');
        });
      }
      renderDirectory();
    });
  }

  // Core Directory Render
  function renderDirectory() {
    if (!window.DS_SHOPS_STORE) return;

    // RULE: Retrieve Active shops only. Pending or Suspended shops are never shown to customers.
    let shops = window.DS_SHOPS_STORE.getActiveShops();

    // 1. Filter by category
    if (currentCategory !== 'all') {
      shops = shops.filter(s => s.category === currentCategory);
    }

    // 2. Filter by city
    if (currentCity !== 'all') {
      shops = shops.filter(s => s.city.toLowerCase() === currentCity.toLowerCase());
    }

    // 3. Filter by text query
    if (searchQuery.length > 0) {
      shops = shops.filter(s => {
        const nameMatch = s.name.toLowerCase().includes(searchQuery);
        const cityMatch = s.city.toLowerCase().includes(searchQuery);
        const catMatch = s.category.toLowerCase().includes(searchQuery);
        const descMatch = (s.description || '').toLowerCase().includes(searchQuery);
        const addrMatch = (s.address || '').toLowerCase().includes(searchQuery);
        return nameMatch || cityMatch || catMatch || descMatch || addrMatch;
      });
    }

    // 4. Sort
    shops.sort((a, b) => {
      if (currentSort === 'az') return a.name.localeCompare(b.name);
      if (currentSort === 'za') return b.name.localeCompare(a.name);
      if (currentSort === 'newest') return (b.joinedDate || '').localeCompare(a.joinedDate || '');
      // Default: rating desc
      return (b.rating || 0) - (a.rating || 0);
    });

    // Update count
    if (visibleCountEl) visibleCountEl.textContent = shops.length;

    // Render Grid
    if (shops.length === 0) {
      shopsGrid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    let html = '';

    shops.forEach(shop => {
      // Data minimization & Privacy: Owner PII (owner name, CNIC, internal contact) is omitted.
      const safeServices = (shop.services || ['Digital Khata']).map(srv => 
        `<span class="badge badge--info" style="font-size:0.65rem; padding: 2px 6px;">${escapeHtml(srv)}</span>`
      ).join(' ');

      html += `
        <div class="card flex flex-col justify-between" style="box-shadow: var(--shadow-sm); border: 1px solid var(--border); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer;" data-id="${escapeHtml(shop.id)}">
          <div>
            <!-- Card Top: Category & Rating -->
            <div class="flex justify-between items-center mb-12">
              <span class="badge badge--primary" style="font-size: 0.7rem;">${escapeHtml(shop.category)}</span>
              <div class="flex items-center gap-4 text-xs font-bold" style="color: var(--primary);">
                <span>★</span>
                <span>${shop.rating ? shop.rating.toFixed(1) : '5.0'}</span>
                <span class="text-muted font-normal">(${shop.reviewsCount || 0})</span>
              </div>
            </div>

            <!-- Shop Title & City -->
            <h3 class="text-base font-bold mb-4" style="color:var(--text);">${escapeHtml(shop.name)}</h3>
            <div class="flex items-center gap-6 text-xs text-muted mb-8">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>${escapeHtml(shop.city)}</span> • <span>${escapeHtml(shop.timing || 'Daily Open')}</span>
            </div>

            <!-- Address Snippet -->
            <p class="text-xs text-muted mb-12 line-clamp-2" style="font-size: 0.78rem;">
              ${escapeHtml(shop.address)}
            </p>

            <!-- Services -->
            <div class="flex flex-wrap gap-4 mb-16">
              ${safeServices}
            </div>
          </div>

          <!-- Bottom Card Action -->
          <div class="pt-12" style="border-top: 1px solid var(--border);">
            <button class="btn btn--outline btn--sm w-full btn-view-dukaan" data-id="${escapeHtml(shop.id)}">
              View Dukaan Details
            </button>
          </div>
        </div>
      `;
    });

    shopsGrid.innerHTML = html;

    // Attach card click handlers
    shopsGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent double trigger if clicking button directly
        const shopId = card.getAttribute('data-id');
        openShopModal(shopId);
      });
    });
  }

  // Open Shop Details Modal
  function openShopModal(shopId) {
    if (!window.DS_SHOPS_STORE) return;
    const shop = window.DS_SHOPS_STORE.getShopById(shopId);
    if (!shop) return;

    activeShopForModal = shop;

    modalShopName.textContent = shop.name;
    modalShopCategory.textContent = shop.category;
    modalShopCity.textContent = shop.city;
    modalShopAddress.textContent = shop.address;
    modalShopTiming.textContent = shop.timing || '8:00 AM - 10:00 PM';
    modalShopDescription.textContent = shop.description || 'Neighborhood provision store offering quality everyday goods and friendly customer credit.';
    modalShopRating.textContent = `★ ${shop.rating ? shop.rating.toFixed(1) : '5.0'}`;
    modalShopReviews.textContent = `${shop.reviewsCount || 0} reviews`;

    // Render Services
    const services = shop.services || ['Digital Khata', 'In-Store Pickup'];
    modalShopServices.innerHTML = services.map(srv => 
      `<span class="badge badge--info" style="font-size:0.75rem; padding: 4px 10px;">${escapeHtml(srv)}</span>`
    ).join(' ');

    if (contactButtonText) {
      contactButtonText.textContent = `Call ${escapeHtml(shop.publicPhone || 'Store')}`;
    }

    if (modalDetails) modalDetails.classList.add('modal-backdrop--open');
  }

  function closeShopModal() {
    activeShopForModal = null;
    if (modalDetails) modalDetails.classList.remove('modal-backdrop--open');
  }

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeShopModal);
  if (btnCloseModalFooter) btnCloseModalFooter.addEventListener('click', closeShopModal);

  if (btnContactShop) {
    btnContactShop.addEventListener('click', () => {
      if (activeShopForModal && activeShopForModal.publicPhone) {
        showToast(`Contacting ${activeShopForModal.name} at ${activeShopForModal.publicPhone}`, 'primary');
      }
    });
  }

  // Close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalDetails && modalDetails.classList.contains('modal-backdrop--open')) {
      closeShopModal();
    }
  });

  // Close modal on backdrop click
  if (modalDetails) {
    modalDetails.addEventListener('click', (e) => {
      if (e.target === modalDetails) closeShopModal();
    });
  }
});
