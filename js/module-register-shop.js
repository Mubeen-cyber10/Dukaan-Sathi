document.addEventListener('DOMContentLoaded', () => {
  const element = id => document.getElementById(id);
  const form = element('shop-registration-form');
  const shopName = element('reg-shop-name');
  const category = element('reg-category');
  const city = element('reg-city');
  const address = element('reg-address');
  const ownerName = element('reg-owner');
  const mobile = element('reg-phone');
  const email = element('reg-email');
  const password = element('reg-password');
  const confirmPassword = element('reg-confirm-password');
  const cnic = element('reg-cnic');
  const description = element('reg-description');
  const fileInput = element('reg-file-upload');
  const fileName = element('file-name-display');
  const terms = element('reg-terms');
  const submit = element('btn-submit-registration');
  const badge = element('rate-limit-badge');
  const applications = new Map();

  function showError(id, message = '') {
    const target = element(id);
    target.textContent = message;
    target.style.display = message ? 'block' : 'none';
    return !message;
  }

  function textRule(input, errorId, min, max, label) {
    const value = input.value.trim().replace(/\s+/g, ' ');
    const valid = value.length >= min && value.length <= max && !/[<>\u0000-\u001f\u007f]/.test(value);
    return showError(errorId, valid ? '' : label + ' must be ' + min + '–' + max + ' characters without angle brackets.');
  }

  function validatePhone() {
    return showError('phone-error', DS_VALIDATORS.validatePhone(mobile.value) ? '' :
      'Enter a valid Pakistani mobile number (e.g. 0300-1234567).');
  }

  function validateCnic() {
    const length = cnic.value.replace(/\D/g, '').length;
    return showError('cnic-error', length === 0 || length === 13 ? '' : 'Enter a 13-digit CNIC.');
  }

  function validateEmail() {
    return showError('reg-email-error', email.validity.valid ? '' : 'Enter a valid email address.');
  }

  function updatePassword() {
    const value = password.value;
    const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d\s]/].filter(pattern => pattern.test(value)).length;
    const valid = value.length >= 8 && value.length <= 64 && new TextEncoder().encode(value).length <= 72 &&
      kinds >= 3 && !/[<>\u0000-\u001f\u007f]/.test(value);
    const strength = element('reg-password-strength');
    if (typeof checkPasswordStrength === 'function') {
      const result = checkPasswordStrength(value);
      strength.textContent = value ? 'Strength: ' + result.level + '. ' + result.message : '';
      strength.style.color = result.level === 'Strong' ? 'var(--success)' :
        result.level === 'Moderate' ? 'var(--warning)' : 'var(--danger)';
    } else {
      strength.textContent = 'Password checker file not found';
      strength.style.color = 'var(--danger)';
    }
    return valid;
  }

  function validateConfirmation() {
    return showError('reg-confirm-password-error', confirmPassword.value === password.value && confirmPassword.value ? '' :
      'Passwords must match.');
  }

  function validatePassword() {
    return showError('reg-password-error', updatePassword() ? '' :
      'Enter 8–64 characters using three of lowercase, uppercase, numbers, or symbols. Avoid angle brackets and keep it within 72 UTF-8 bytes.');
  }

  function updateDescription() {
    const length = description.value.length;
    const counter = element('char-counter');
    counter.textContent = length + ' / 250';
    counter.style.color = length >= 240 ? 'var(--warning)' : 'var(--text-muted)';
  }

  function formatPhone() {
    const digits = mobile.value.replace(/\D/g, '').slice(0, 11);
    mobile.value = digits.length > 4 ? digits.slice(0, 4) + '-' + digits.slice(4) : digits;
    validatePhone();
  }

  function formatCnic() {
    const digits = cnic.value.replace(/\D/g, '').slice(0, 13);
    cnic.value = [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12)].filter(Boolean).join('-');
    validateCnic();
  }

  const checkName = () => textRule(shopName, 'shop-name-error', 3, 60, 'Shop name');
  const checkOwner = () => textRule(ownerName, 'owner-error', 3, 50, 'Owner name');
  const checkAddress = () => textRule(address, 'address-error', 5, 120, 'Address');
  const checkDescription = () => textRule(description, 'reg-description-error', 0, 250, 'Description');

  shopName.addEventListener('input', checkName);
  ownerName.addEventListener('blur', checkOwner);
  address.addEventListener('blur', checkAddress);
  email.addEventListener('blur', validateEmail);
  password.addEventListener('input', () => {
    showError('reg-password-error');
    updatePassword();
    if (confirmPassword.value) validateConfirmation();
  });
  confirmPassword.addEventListener('input', validateConfirmation);
  for (const [field, buttonId] of [[password, 'reg-password-toggle'], [confirmPassword, 'reg-confirm-password-toggle']]) {
    element(buttonId).addEventListener('click', () => {
      field.type = field.type === 'password' ? 'text' : 'password';
      element(buttonId).textContent = field.type === 'password' ? 'Show' : 'Hide';
    });
  }
  mobile.addEventListener('input', formatPhone);
  cnic.addEventListener('input', formatCnic);
  description.addEventListener('input', () => {
    updateDescription();
    showError('reg-description-error');
  });

  function setFileNotice(message, color) {
    fileName.textContent = message;
    fileName.style.color = color;
  }

  element('btn-browse-file').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) {
      setFileNotice('No document chosen (local check only)', 'var(--text-muted)');
      return;
    }
    const extension = file.name.split('.').pop().toLowerCase();
    const expectedType = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf' }[extension];
    const doubleExtension = /\.(?:exe|php|js|html?|bat|cmd|ps1|sh)\.(?:jpe?g|png|pdf)$/i.test(file.name);
    const message = file.name.length > 100 ? 'Filename must be 100 characters or fewer.' :
      file.size === 0 ? 'Choose a non-empty file.' :
      file.size > 2 * 1024 * 1024 ? 'File is larger than 2 MB.' :
      !expectedType || doubleExtension || file.type !== expectedType ? 'Unsupported file type. Allowed: JPG, PNG, PDF.' : '';
    if (message) {
      fileInput.value = '';
      setFileNotice(message, 'var(--danger)');
      return;
    }
    setFileNotice('Checked locally: ' + file.name + ' (' + Math.round(file.size / 1024) + ' KB). The server must re-check content.', 'var(--success)');
  });

  function showApplication(id, status) {
    const card = document.createElement('div');
    card.className = 'card flex justify-between items-center gap-12 mb-8';
    card.style.background = 'var(--surface-2)';
    const label = document.createElement('span');
    label.className = 'font-bold text-sm';
    label.textContent = 'Application #' + id;
    const statusBadge = document.createElement('span');
    statusBadge.className = 'badge ' + (status === 'Active' ? 'badge--settled' : 'badge--due');
    statusBadge.textContent = status;
    card.append(label, statusBadge);
    applications.set(id, { card, status });
    const items = [...applications.values()].reverse();
    element('pending-list-container').replaceChildren(...items.map(item => item.card));
    element('pending-count-badge').textContent = items.filter(item => item.status === 'Pending').length + ' Pending';
  }

  if (sessionStorage.getItem(TOKEN_KEY)) {
    DS_AUTH.verify().then(async verified => {
      if (!verified || !DS_AUTH.hasRole('owner')) return;
      const shop = await apiFetch('/api/shops/mine');
      showApplication(shop.id, shop.status);
    }).catch(error => {
      if (![401, 404].includes(error.status)) showToast(error.message, 'danger');
    });
  }

  const fieldErrors = {
    shopName: 'shop-name-error',
    address: 'address-error',
    ownerName: 'owner-error',
    mobile: 'phone-error',
    email: 'reg-email-error',
    password: 'reg-password-error',
    description: 'reg-description-error'
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    showError('form-general-error');
    const valid = [
      checkName(), checkOwner(), checkAddress(), validatePhone(), validateCnic(),
      validateEmail(), validatePassword(), validateConfirmation(), checkDescription()
    ].every(Boolean);
    if (!valid) return;
    if (!terms.checked) {
      showError('form-general-error', 'Accept the declaration to submit your application.');
      return;
    }

    submit.disabled = true;
    submit.classList.add('btn--loading');
    submit.textContent = 'Submitting…';
    try {
      const request = apiFetch('/api/shops/register', {
        method: 'POST',
        body: {
          ownerName: ownerName.value, email: email.value, mobile: mobile.value,
          shopName: shopName.value, category: category.value, city: city.value,
          address: address.value, description: description.value, password: password.value
        }
      });
      password.value = '';
      confirmPassword.value = '';
      updatePassword();
      const { shopId, status } = await request;
      showApplication(shopId, status);
      form.reset();
      updateDescription();
      setFileNotice('No document chosen (local check only)', 'var(--text-muted)');
      showToast('Application submitted for approval.', 'success');
    } catch (error) {
      for (const [field, message] of Object.entries(error.fields || {})) {
        if (Object.hasOwn(fieldErrors, field)) showError(fieldErrors[field], message);
      }
      if (error.status === 429 && error.retryAfter > 0) {
        badge.textContent = 'Limit reached. Try again in ' + Math.ceil(error.retryAfter / 60) + ' min.';
        badge.className = 'badge badge--due';
      }
      showError('form-general-error', error.message);
      showToast(error.message, 'danger');
    } finally {
      submit.disabled = false;
      submit.classList.remove('btn--loading');
      submit.textContent = 'Submit Shop Application';
    }
  });
});
