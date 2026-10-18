// Hiding UI is not a security control; real enforcement is done server-side in the backend phase.
// Frontend validation is not security; the backend will re-validate and enforce authorization.

/**
 * Dukaan Saathi - Module 1: Shop Registration & Verification Submission
 * Handles live input validation, duplicate detection, character counting,
 * session rate limiting, and application withdrawal.
 */

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // Form Elements
  const form = document.getElementById('shop-registration-form');
  const shopNameInput = document.getElementById('reg-shop-name');
  const categorySelect = document.getElementById('reg-category');
  const citySelect = document.getElementById('reg-city');
  const addressInput = document.getElementById('reg-address');
  const ownerInput = document.getElementById('reg-owner');
  const phoneInput = document.getElementById('reg-phone');
  const cnicInput = document.getElementById('reg-cnic');
  const descInput = document.getElementById('reg-description');
  const charCounter = document.getElementById('char-counter');
  const fileInput = document.getElementById('reg-file-upload');
  const btnBrowseFile = document.getElementById('btn-browse-file');
  const fileNameDisplay = document.getElementById('file-name-display');
  const termsCheckbox = document.getElementById('reg-terms');
  const btnSubmit = document.getElementById('btn-submit-registration');
  const generalError = document.getElementById('form-general-error');
  const rateLimitBadge = document.getElementById('rate-limit-badge');

  // Error Containers
  const nameError = document.getElementById('shop-name-error');
  const duplicateWarning = document.getElementById('shop-duplicate-warning');
  const addressError = document.getElementById('address-error');
  const ownerError = document.getElementById('owner-error');
  const phoneError = document.getElementById('phone-error');
  const cnicError = document.getElementById('cnic-error');

  // Pending Submissions Container
  const pendingContainer = document.getElementById('pending-list-container');
  const pendingCountBadge = document.getElementById('pending-count-badge');
  const noPendingMsg = document.getElementById('no-pending-msg');

  // Modal Elements
  const modalWithdraw = document.getElementById('modal-withdraw');
  const withdrawShopName = document.getElementById('withdraw-shop-name');
  const withdrawShopId = document.getElementById('withdraw-shop-id');
  const btnConfirmWithdraw = document.getElementById('btn-confirm-withdraw');
  const btnCancelWithdraw = document.getElementById('btn-cancel-withdraw');
  const btnCloseWithdrawModal = document.getElementById('btn-close-withdraw-modal');

  let pendingWithdrawalId = null;

  // 1. Initialize View
  updateRateLimitUI();
  renderPendingList();

  // 2. Character Counter for Description
  if (descInput && charCounter) {
    descInput.addEventListener('input', () => {
      const len = descInput.value.length;
      charCounter.textContent = `${len} / 250`;
      if (len >= 240) {
        charCounter.style.color = 'var(--warning)';
      } else {
        charCounter.style.color = 'var(--text-muted)';
      }
    });
  }

  // 3. Mock File Upload Handler
  if (btnBrowseFile && fileInput) {
    btnBrowseFile.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        // Enforce max 5MB mock check
        if (file.size > 5 * 1024 * 1024) {
          fileNameDisplay.textContent = 'File too large (max 5MB allowed).';
          fileNameDisplay.style.color = 'var(--danger)';
          fileInput.value = '';
          return;
        }
        fileNameDisplay.textContent = `Attached: ${file.name} (${Math.round(file.size / 1024)} KB)`;
        fileNameDisplay.style.color = 'var(--success)';
      } else {
        fileNameDisplay.textContent = 'No document chosen (simulated upload)';
        fileNameDisplay.style.color = 'var(--text-muted)';
      }
    });
  }

  // 4. Live Duplicate & Name Validation
  function checkShopName() {
    const val = shopNameInput.value.trim();
    nameError.style.display = 'none';
    duplicateWarning.style.display = 'none';

    if (val.length < 3) {
      nameError.textContent = 'Shop name must be at least 3 characters.';
      nameError.style.display = 'block';
      return false;
    }

    const city = citySelect.value;
    if (window.DS_SHOPS_STORE && window.DS_SHOPS_STORE.isDuplicateNameInCity(val, city)) {
      duplicateWarning.textContent = `Warning: A shop named "${val}" already exists in ${city}. Choose a distinct branch or name.`;
      duplicateWarning.style.display = 'block';
      return false;
    }

    return true;
  }

  shopNameInput.addEventListener('input', checkShopName);
  citySelect.addEventListener('change', checkShopName);

  // 5. Phone Input Formatting & Validation (Pakistani standard 03XX-XXXXXXX)
  function formatPhone(inputVal) {
    let numbers = inputVal.replace(/\D/g, '');
    if (numbers.length > 11) numbers = numbers.slice(0, 11);
    if (numbers.length > 4) {
      return numbers.slice(0, 4) + '-' + numbers.slice(4);
    }
    return numbers;
  }

  phoneInput.addEventListener('input', (e) => {
    e.target.value = formatPhone(e.target.value);
    validatePhone();
  });

  function validatePhone() {
    const val = phoneInput.value.trim();
    phoneError.style.display = 'none';
    const clean = val.replace(/[\s-]/g, '');
    if (!/^03\d{9}$/.test(clean)) {
      phoneError.textContent = 'Enter a valid Pakistani mobile number (e.g. 0300-1234567).';
      phoneError.style.display = 'block';
      return false;
    }
    return true;
  }

  // 6. CNIC Input Formatting (35201-1234567-1)
  function formatCnic(inputVal) {
    let numbers = inputVal.replace(/\D/g, '');
    if (numbers.length > 13) numbers = numbers.slice(0, 13);
    if (numbers.length > 12) {
      return numbers.slice(0, 5) + '-' + numbers.slice(5, 12) + '-' + numbers.slice(12);
    } else if (numbers.length > 5) {
      return numbers.slice(0, 5) + '-' + numbers.slice(5);
    }
    return numbers;
  }

  cnicInput.addEventListener('input', (e) => {
    e.target.value = formatCnic(e.target.value);
    validateCnic();
  });

  function validateCnic() {
    const val = cnicInput.value.trim();
    cnicError.style.display = 'none';
    const clean = val.replace(/\D/g, '');
    // Optional field: valid if empty
    if (clean.length === 0) {
      return true;
    }
    // If entered, must contain exactly 13 digits
    if (clean.length !== 13) {
      cnicError.textContent = 'CNIC must contain exactly 13 digits (e.g. 35201-1234567-1).';
      cnicError.style.display = 'block';
      return false;
    }
    return true;
  }

  // 7. General Address & Owner Validations
  function validateAddress() {
    const val = addressInput.value.trim();
    addressError.style.display = 'none';
    if (val.length < 5) {
      addressError.textContent = 'Please enter a complete address (at least 5 characters).';
      addressError.style.display = 'block';
      return false;
    }
    return true;
  }
  addressInput.addEventListener('blur', validateAddress);

  function validateOwner() {
    const val = ownerInput.value.trim();
    ownerError.style.display = 'none';
    if (val.length < 3) {
      ownerError.textContent = 'Owner full name must be at least 3 characters.';
      ownerError.style.display = 'block';
      return false;
    }
    return true;
  }
  ownerInput.addEventListener('blur', validateOwner);

  // 8. Rate Limit Quota Indicator
  function updateRateLimitUI() {
    if (!window.DS_SHOPS_STORE) return;
    const rate = window.DS_SHOPS_STORE.checkRateLimit();
    if (rateLimitBadge) {
      if (rate.allowed) {
        rateLimitBadge.textContent = `Quota: ${rate.remaining} left / min`;
        rateLimitBadge.className = 'badge badge--info';
      } else {
        rateLimitBadge.textContent = `Limit reached (wait ${rate.waitSeconds}s)`;
        rateLimitBadge.className = 'badge badge--due';
      }
    }
  }

  // 9. Render Pending Applications List
  function renderPendingList() {
    if (!window.DS_SHOPS_STORE || !pendingContainer) return;
    const pendingShops = window.DS_SHOPS_STORE.getUserPendingShops();

    if (pendingCountBadge) {
      pendingCountBadge.textContent = `${pendingShops.length} Pending`;
    }

    if (pendingShops.length === 0) {
      pendingContainer.innerHTML = `
        <div class="text-center py-24 text-muted text-xs" id="no-pending-msg">
          No active pending applications in this session. Fill out the form to register your shop.
        </div>`;
      return;
    }

    let html = '<div class="flex flex-col gap-12">';
    pendingShops.forEach(shop => {
      html += `
        <div class="card" style="background: var(--surface-2); padding: 14px; border: 1px solid var(--border);">
          <div class="flex justify-between items-start gap-12">
            <div>
              <div class="flex items-center gap-8 mb-4">
                <span class="font-bold text-sm" style="color:var(--text);">${escapeHtml(shop.name)}</span>
                <span class="badge badge--due" style="font-size:0.65rem;">Pending Approval</span>
              </div>
              <div class="text-xs text-muted">
                <span>${escapeHtml(shop.category)}</span> • <span>${escapeHtml(shop.city)}</span>
              </div>
              <div class="text-xs text-muted mt-2" style="font-size:0.75rem;">
                ID: <strong>${escapeHtml(shop.id)}</strong> | Submitted: ${escapeHtml(shop.submittedAt || 'Today')}
              </div>
            </div>
            <button type="button" class="btn btn--outline btn--sm btn-withdraw" data-id="${escapeHtml(shop.id)}" data-name="${escapeHtml(shop.name)}" style="color:var(--danger); border-color:var(--danger); font-size:0.75rem; padding: 4px 10px;">
              Withdraw
            </button>
          </div>
        </div>
      `;
    });
    html += '</div>';

    pendingContainer.innerHTML = html;

    // Attach withdraw button click listeners
    const withdrawBtns = pendingContainer.querySelectorAll('.btn-withdraw');
    withdrawBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        openWithdrawModal(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
      });
    });
  }

  // 10. Withdrawal Modal Controls
  function openWithdrawModal(shopId, shopName) {
    pendingWithdrawalId = shopId;
    if (withdrawShopName) withdrawShopName.textContent = shopName;
    if (withdrawShopId) withdrawShopId.textContent = shopId;
    if (modalWithdraw) modalWithdraw.classList.add('modal-backdrop--open');
  }

  function closeWithdrawModal() {
    pendingWithdrawalId = null;
    if (modalWithdraw) modalWithdraw.classList.remove('modal-backdrop--open');
  }

  if (btnCloseWithdrawModal) btnCloseWithdrawModal.addEventListener('click', closeWithdrawModal);
  if (btnCancelWithdraw) btnCancelWithdraw.addEventListener('click', closeWithdrawModal);
  
  if (btnConfirmWithdraw) {
    btnConfirmWithdraw.addEventListener('click', () => {
      if (pendingWithdrawalId && window.DS_SHOPS_STORE) {
        window.DS_SHOPS_STORE.withdrawShop(pendingWithdrawalId);
        showToast(`Application #${pendingWithdrawalId} withdrawn successfully.`, 'info');
        closeWithdrawModal();
        renderPendingList();
        updateRateLimitUI();
      }
    });
  }

  // Close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalWithdraw && modalWithdraw.classList.contains('modal-backdrop--open')) {
      closeWithdrawModal();
    }
  });

  // 11. Form Submission Handler
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    generalError.style.display = 'none';

    // Check rate limit first
    const rate = window.DS_SHOPS_STORE.checkRateLimit();
    if (!rate.allowed) {
      generalError.textContent = `Rate limit exceeded. Please wait ${rate.waitSeconds} seconds before submitting again.`;
      generalError.style.display = 'block';
      showToast('Rate limit exceeded. Please wait before submitting.', 'danger');
      updateRateLimitUI();
      return;
    }

    // Validate all fields
    const isNameOk = checkShopName();
    const isAddressOk = validateAddress();
    const isOwnerOk = validateOwner();
    const isPhoneOk = validatePhone();
    const isCnicOk = validateCnic();

    if (!termsCheckbox.checked) {
      generalError.textContent = 'Please confirm and accept the application terms.';
      generalError.style.display = 'block';
      return;
    }

    if (!isNameOk || !isAddressOk || !isOwnerOk || !isPhoneOk || !isCnicOk) {
      generalError.textContent = 'Please correct the highlighted form errors.';
      generalError.style.display = 'block';
      showToast('Please fix invalid input fields.', 'danger');
      return;
    }

    // Show loading state
    btnSubmit.classList.add('btn--loading');
    btnSubmit.disabled = true;
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `<span class="spinner" style="display:inline-block; margin-right:8px;"></span> Submitting Application...`;

    setTimeout(() => {
      try {
        const newShop = window.DS_SHOPS_STORE.registerShop({
          name: shopNameInput.value.trim(),
          category: categorySelect.value,
          city: citySelect.value,
          address: addressInput.value.trim(),
          owner: ownerInput.value.trim(),
          publicPhone: phoneInput.value.trim(),
          description: descInput.value.trim(),
          services: ['Digital Khata', 'In-Store Pickup', 'Doorstep Delivery']
        });

        // Reset form
        form.reset();
        if (charCounter) charCounter.textContent = '0 / 250';
        if (fileNameDisplay) {
          fileNameDisplay.textContent = 'No document chosen (simulated upload)';
          fileNameDisplay.style.color = 'var(--text-muted)';
        }

        showToast(`Shop application for "${newShop.name}" submitted successfully! Awaiting Admin approval.`, 'success');

        renderPendingList();
        updateRateLimitUI();
      } catch(err) {
        generalError.textContent = err.message || 'Submission failed. Please check inputs.';
        generalError.style.display = 'block';
        showToast(err.message || 'Submission failed.', 'danger');
      } finally {
        btnSubmit.classList.remove('btn--loading');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalText;
      }
    }, 450);
  });
});
