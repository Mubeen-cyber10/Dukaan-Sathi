(function () {
  'use strict';

  const byId = id => document.getElementById(id);
  const moneyDate = new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeZone: 'Asia/Karachi' });
  const revealButton = byId('btn-reveal-phone');
  const entryBackdrop = byId('modal-entry-backdrop');
  const customerBackdrop = byId('modal-customer-backdrop');
  const customerForm = byId('new-customer-form');
  const confirmEntry = byId('btn-entry-next-confirm');
  const cancelEntry = byId('btn-entry-back-cancel');
  const saveCustomer = byId('btn-save-customer');
  let customers = [];
  let activeDrawer = null;
  let maskTimer;
  let currentFilter = 'all';
  let selectedType = 'credit';
  let modalStep = 1;
  let listAvailable = false;

  function node(tag, className = '', text = '') {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function reportError(error) {
    if (error.status === 401) return;
    showToast(Object.values(error.fields || {})[0] || error.message, 'danger');
  }

  function balanceText(balance) {
    if (balance > 0) return formatMoney(balance) + ' due';
    if (balance < 0) return formatMoney(-balance) + ' in credit';
    return 'Settled';
  }

  function balanceBadge(balance) {
    return node('span', 'badge tabular-nums ' + (balance > 0 ? 'badge--due' : 'badge--settled'), balanceText(balance));
  }

  function activityText(lastActivity) {
    return lastActivity ? moneyDate.format(new Date(lastActivity)) : 'No entries yet';
  }

  async function loadCustomers() {
    customers = await apiFetch('/api/khata/customers');
    listAvailable = true;
    byId('btn-open-new-entry').disabled = customers.length === 0;
    renderCustomerList();
  }

  function renderCustomerList() {
    if (!listAvailable) return;
    const search = byId('khata-search').value.toLowerCase().trim();
    const filtered = customers.filter(customer => {
      if (!customer.name.toLowerCase().includes(search) && !customer.phone.includes(search)) return false;
      if (currentFilter === 'due') return customer.balance > 0;
      if (currentFilter === 'settled') return customer.balance <= 0;
      return true;
    });
    const sort = byId('khata-sort').value;
    if (sort === 'recent') filtered.sort((a, b) => (b.lastActivity || '').localeCompare(a.lastActivity || ''));
    else if (sort === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
    else filtered.sort((a, b) => b.balance - a.balance);

    byId('khata-empty-title').textContent = customers.length ? 'No Matching Customers Found' : 'No Customers Yet';
    byId('khata-empty-message').textContent = customers.length
      ? 'Try adjusting your search query or filter chip selection.'
      : 'Add a customer to make your first khata entry.';
    byId('khata-empty-state').classList.toggle('hidden', filtered.length > 0);
    byId('table-wrapper').classList.toggle('hidden', filtered.length === 0);
    byId('mobile-cards').classList.toggle('hidden', filtered.length === 0);
    byId('khata-tbody').replaceChildren(...filtered.map(customerRow));
    byId('mobile-cards').replaceChildren(...filtered.map(customerCard));
  }

  function customerRow(customer) {
    const row = node('tr');
    const name = node('div', 'flex items-center gap-12');
    name.append(node('div', 'avatar', getInitials(customer.name)), node('span', 'font-bold', customer.name));
    const nameCell = node('td');
    nameCell.append(name);
    const balanceCell = node('td');
    balanceCell.append(balanceBadge(customer.balance));
    const action = node('td');
    const button = node('button', 'btn btn--ghost btn--sm', 'View Ledger →');
    button.type = 'button';
    button.style.color = 'var(--primary)';
    action.append(button);
    row.append(nameCell, node('td', 'text-muted text-sm', customer.phone),
      node('td', 'text-muted text-sm', activityText(customer.lastActivity)), balanceCell, action);
    row.addEventListener('click', () => openDrawer(customer));
    return row;
  }

  function customerCard(customer) {
    const card = node('div', 'card card--interactive');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'View ledger for ' + customer.name);
    const row = node('div', 'flex justify-between items-center mb-8');
    const left = node('div', 'flex items-center gap-10');
    const name = node('div');
    name.append(node('div', 'font-bold text-sm', customer.name), node('div', 'text-xs text-muted', customer.phone));
    left.append(node('div', 'avatar', getInitials(customer.name)), name);
    row.append(left, balanceBadge(customer.balance));
    card.append(row, node('div', 'text-xs text-muted', 'Last activity: ' + activityText(customer.lastActivity)));
    card.addEventListener('click', () => openDrawer(customer));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDrawer(customer);
      }
    });
    return card;
  }

  function timelineItem(entry) {
    const isCredit = entry.type === 'credit';
    const item = node('div', 'timeline-item');
    const dot = node('div', 'timeline-dot ' + (isCredit ? 'timeline-dot--danger' : 'timeline-dot--success'));
    const card = node('div', 'timeline-card');
    const row = node('div', 'flex justify-between items-center mb-4');
    const amount = node('span', 'font-extrabold tabular-nums text-sm', formatMoney(entry.amount));
    amount.style.color = isCredit ? 'var(--danger)' : 'var(--success)';
    row.append(node('span', 'font-bold text-sm', isCredit ? '+ Credit Sale (Give)' : '- Payment Received (Get)'), amount);
    const metadata = node('div', 'flex justify-between items-center text-xs text-muted');
    metadata.append(node('span', '', activityText(entry.createdAt)),
      node('span', 'tabular-nums', 'Bal: ' + formatMoney(entry.runningBalance)));
    card.append(row, node('div', 'text-xs text-muted mb-4', entry.note || 'No transaction note'), metadata);
    item.append(dot, card);
    return item;
  }

  function maskPhone() {
    clearTimeout(maskTimer);
    byId('drawer-phone').textContent = activeDrawer?.customer.phone || '';
    revealButton.textContent = 'Reveal (10s)';
    revealButton.disabled = false;
  }

  async function openDrawer(customer) {
    const drawer = { customer };
    activeDrawer = drawer;
    maskPhone();
    byId('drawer-name').textContent = customer.name;
    byId('drawer-balance').textContent = '…';
    byId('drawer-balance').style.color = '';
    const timeline = byId('drawer-timeline');
    timeline.replaceChildren(node('p', 'text-xs text-muted', 'Loading entries…'));
    byId('drawer-backdrop').classList.add('drawer-backdrop--open');
    byId('customer-drawer').classList.add('drawer--open');

    try {
      const { entries, balance } = await apiFetch('/api/khata/customers/' + customer.id + '/entries');
      if (activeDrawer !== drawer) return;
      byId('drawer-balance').textContent = balanceText(balance);
      byId('drawer-balance').style.color = balance > 0 ? 'var(--danger)' : 'var(--success)';
      const rows = entries.slice().reverse().map(timelineItem);
      timeline.replaceChildren(...(rows.length ? rows : [node('p', 'text-xs text-muted', 'No entries yet.')]));
    } catch (error) {
      if (activeDrawer !== drawer) return;
      timeline.replaceChildren(node('p', 'text-xs text-muted', 'Could not load the ledger.'));
      reportError(error);
    }
  }

  function closeDrawer() {
    activeDrawer = null;
    maskPhone();
    byId('drawer-backdrop').classList.remove('drawer-backdrop--open');
    byId('customer-drawer').classList.remove('drawer--open');
  }

  async function revealPhone() {
    const drawer = activeDrawer;
    if (!drawer || revealButton.disabled) return;
    revealButton.disabled = true;
    try {
      const { phone } = await apiFetch('/api/khata/customers/' + drawer.customer.id + '/phone');
      if (activeDrawer !== drawer) return;
      byId('drawer-phone').textContent = phone;
      revealButton.textContent = 'Revealed (10s)';
      maskTimer = setTimeout(maskPhone, 10000);
      showToast('Customer phone unmasked for 10 seconds. Action logged in audit chain.', 'primary');
    } catch (error) {
      if (activeDrawer !== drawer) return;
      maskPhone();
      reportError(error);
    }
  }

  function toggleType(type) {
    selectedType = type;
    byId('type-credit').classList.toggle('chip--active', type === 'credit');
    byId('type-payment').classList.toggle('chip--active', type === 'payment');
  }

  function showModalStep(step) {
    modalStep = step;
    const reviewing = step === 2;
    byId('modal-entry-title').textContent = reviewing ? 'Confirm Transaction' : 'Record New Khata Entry';
    byId('entry-step-1').classList.toggle('hidden', reviewing);
    byId('entry-step-2').classList.toggle('hidden', !reviewing);
    cancelEntry.textContent = reviewing ? '← Back' : 'Cancel';
    confirmEntry.textContent = reviewing ? 'Confirm & Lock Entry' : 'Review Entry →';
  }

  function openNewEntryModal() {
    if (!customers.length || confirmEntry.disabled) return;
    const options = customers.map(customer => {
      const option = node('option', '', customer.name + ' (' + customer.phone + ')');
      option.value = customer.id;
      return option;
    });
    byId('entry-customer-select').replaceChildren(...options);
    byId('entry-amount').value = '';
    byId('entry-note').value = '';
    byId('entry-amount-err').classList.add('hidden');
    byId('note-counter').textContent = '0 / 120';
    toggleType('credit');
    showModalStep(1);
    entryBackdrop.classList.add('modal-backdrop--open');
  }

  function closeEntryModal() {
    if (!confirmEntry.disabled) entryBackdrop.classList.remove('modal-backdrop--open');
  }

  async function nextEntryStep() {
    if (confirmEntry.disabled) return;
    const body = {
      customerId: Number(byId('entry-customer-select').value),
      type: selectedType,
      amount: byId('entry-amount').valueAsNumber,
      note: byId('entry-note').value.trim()
    };
    if (modalStep === 1) {
      const validAmount = Number.isInteger(body.amount) && DS_VALIDATORS.validateAmount(body.amount);
      byId('entry-amount-err').classList.toggle('hidden', validAmount);
      if (!validAmount) return;
      if (!DS_VALIDATORS.validateNote(body.note) || /[<>]/.test(body.note)) {
        showToast('Enter a note of up to 120 characters without angle brackets.', 'danger');
        return;
      }
      const isCredit = selectedType === 'credit';
      byId('confirm-badge').className = 'badge mb-12 ' + (isCredit ? 'badge--due' : 'badge--settled');
      byId('confirm-badge').textContent = isCredit ? '+ Credit Sale (Give)' : '- Payment Received (Get)';
      byId('confirm-amount-display').textContent = formatMoney(body.amount);
      byId('confirm-customer-display').textContent = customers.find(customer => customer.id === body.customerId).name;
      byId('confirm-note-display').textContent = body.note ? 'Note: ' + body.note : 'No note provided';
      showModalStep(2);
      return;
    }

    confirmEntry.disabled = true;
    cancelEntry.disabled = true;
    try {
      const { entry, balance } = await apiFetch('/api/khata/entries', { method: 'POST', body });
      const customer = customers.find(item => item.id === body.customerId);
      customer.balance = balance;
      customer.lastActivity = entry.createdAt;
      renderCustomerList();
      entryBackdrop.classList.remove('modal-backdrop--open');
      const action = entry.type === 'credit' ? 'Credit sale' : 'Payment';
      showToast(action + ' ' + formatMoney(entry.amount) + ' recorded successfully!', 'success');
      await loadCustomers();
      if (activeDrawer?.customer.id === customer.id) {
        await openDrawer(customers.find(item => item.id === customer.id));
      }
    } catch (error) {
      reportError(error);
    } finally {
      confirmEntry.disabled = false;
      cancelEntry.disabled = false;
    }
  }

  function closeCustomerModal() {
    if (!saveCustomer.disabled) customerBackdrop.classList.remove('modal-backdrop--open');
  }

  async function submitCustomer(event) {
    event.preventDefault();
    if (saveCustomer.disabled) return;
    const body = { name: byId('customer-name').value.trim(), phone: byId('customer-phone').value.trim() };
    saveCustomer.disabled = true;
    try {
      const customer = await apiFetch('/api/khata/customers', { method: 'POST', body });
      customers.push(customer);
      listAvailable = true;
      byId('btn-open-new-entry').disabled = false;
      renderCustomerList();
      customerBackdrop.classList.remove('modal-backdrop--open');
      showToast('Customer added successfully.', 'success');
    } catch (error) {
      reportError(error);
    } finally {
      saveCustomer.disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!await DS_AUTH.ready) return;
    const user = DS_AUTH.getUser();
    byId('khata-topbar-user').textContent = user.name;
    byId('khata-user-avatar').textContent = getInitials(user.name);
    apiFetch('/api/shops/mine').then(shop => {
      byId('khata-shop-name').textContent = shop.name;
    }).catch(reportError);

    const params = new URLSearchParams(location.search);
    const chips = document.querySelectorAll('#khata-chips .chip');
    function selectFilter(filter) {
      currentFilter = filter;
      chips.forEach(chip => chip.classList.toggle('chip--active', chip.dataset.filter === filter));
      renderCustomerList();
    }
    if (['all', 'due', 'settled'].includes(params.get('filter'))) selectFilter(params.get('filter'));
    chips.forEach(chip => chip.addEventListener('click', () => selectFilter(chip.dataset.filter)));
    byId('khata-search').addEventListener('input', renderCustomerList);
    byId('khata-sort').addEventListener('change', renderCustomerList);

    byId('btn-close-drawer').addEventListener('click', closeDrawer);
    byId('drawer-backdrop').addEventListener('click', closeDrawer);
    revealButton.addEventListener('click', revealPhone);
    window.addEventListener('pagehide', closeDrawer);

    byId('btn-open-new-entry').addEventListener('click', openNewEntryModal);
    byId('btn-close-entry-modal').addEventListener('click', closeEntryModal);
    entryBackdrop.addEventListener('click', event => {
      if (event.target === entryBackdrop) closeEntryModal();
    });
    byId('type-credit').addEventListener('click', () => toggleType('credit'));
    byId('type-payment').addEventListener('click', () => toggleType('payment'));
    byId('entry-note').addEventListener('input', event => {
      byId('note-counter').textContent = event.target.value.length + ' / 120';
    });
    confirmEntry.addEventListener('click', nextEntryStep);
    cancelEntry.addEventListener('click', () => modalStep === 2 ? showModalStep(1) : closeEntryModal());

    byId('btn-open-new-customer').addEventListener('click', () => {
      customerForm.reset();
      customerBackdrop.classList.add('modal-backdrop--open');
      byId('customer-name').focus();
    });
    byId('btn-close-customer-modal').addEventListener('click', closeCustomerModal);
    customerBackdrop.addEventListener('click', event => {
      if (event.target === customerBackdrop) closeCustomerModal();
    });
    customerForm.addEventListener('submit', submitCustomer);

    const newCustomer = byId('btn-open-new-customer');
    newCustomer.disabled = true;
    try {
      await loadCustomers();
      if (params.get('openModal') === 'true') openNewEntryModal();
    } catch (error) {
      reportError(error);
      byId('khata-empty-title').textContent = 'Could Not Load Customers';
      byId('khata-empty-message').textContent = 'Reload the page to try again.';
      byId('khata-empty-state').classList.remove('hidden');
    } finally {
      byId('skeleton-loader').classList.add('hidden');
      newCustomer.disabled = false;
    }
  });
})();
