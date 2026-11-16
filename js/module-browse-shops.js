document.addEventListener('DOMContentLoaded', () => {
  const element = id => document.getElementById(id);
  const search = element('shop-search-input');
  const clear = element('btn-clear-search');
  const categoryChips = element('category-chips');
  const city = element('filter-city');
  const sort = element('filter-sort');
  const grid = element('shops-grid');
  const empty = element('shops-empty-state');
  const reset = element('btn-reset-filters');
  const modal = element('modal-shop-details');
  const close = element('btn-close-shop-modal');

  let shops = [];
  let category = 'all';
  let modalTrigger;
  let loaded = false;
  let loading = false;

  function node(tag, className, text = '') {
    const item = document.createElement(tag);
    item.className = className;
    item.textContent = text;
    return item;
  }

  function shopCard(shop) {
    const card = node('div', 'card flex flex-col justify-between');
    card.style.cssText = 'box-shadow: var(--shadow-sm); border: 1px solid var(--border); cursor: pointer;';
    const info = node('div', '');
    const badge = node('span', 'badge badge--primary mb-12', shop.category);
    badge.style.fontSize = '0.7rem';
    info.append(badge, node('h3', 'text-base font-bold mb-4', shop.name),
      node('div', 'text-xs text-muted mb-8', shop.city),
      node('p', 'text-xs text-muted mb-12 line-clamp-2', shop.address));
    const actions = node('div', 'pt-12');
    actions.style.borderTop = '1px solid var(--border)';
    const button = node('button', 'btn btn--outline btn--sm w-full btn-view-dukaan', 'View Dukaan Details');
    button.type = 'button';
    card.addEventListener('click', () => openShop(shop, button));
    actions.append(button);
    card.append(info, actions);
    return card;
  }

  function openShop(shop, trigger) {
    modalTrigger = trigger;
    for (const field of ['name', 'category', 'city', 'address']) {
      element('modal-shop-' + field).textContent = shop[field];
    }
    element('modal-shop-description').textContent = shop.description || 'No description provided.';
    element('modal-shop-phone').textContent = shop.public_phone ? 'Public contact: ' + shop.public_phone : '';
    modal.classList.add('modal-backdrop--open');
    close.focus();
  }

  function closeShop() {
    modal.classList.remove('modal-backdrop--open');
    modalTrigger?.focus();
  }

  function selectCategory(value) {
    category = value;
    for (const chip of categoryChips.children) {
      const selected = chip.dataset.category === value;
      chip.classList.toggle('chip--active', selected);
      chip.setAttribute('aria-pressed', String(selected));
    }
  }

  function render() {
    if (!loaded) return;
    const query = search.value.trim().replace(/\s+/g, ' ').toLowerCase();
    clear.style.display = query ? 'inline-block' : 'none';
    const selected = shops.filter(shop => {
      const categoryMatches = category === 'all' || shop.category === category;
      const cityMatches = city.value === 'all' || shop.city.toLowerCase() === city.value.toLowerCase();
      const searchMatches = [shop.name, shop.city, shop.category, shop.address, shop.description]
        .some(value => value.toLowerCase().includes(query));
      return categoryMatches && cityMatches && searchMatches;
    });
    selected.sort((a, b) => {
      if (sort.value === 'az') return a.name.localeCompare(b.name);
      if (sort.value === 'za') return b.name.localeCompare(a.name);
      return b.id - a.id;
    });
    element('visible-count').textContent = selected.length;
    empty.style.display = selected.length ? 'none' : 'block';
    element('empty-title').textContent = 'No shops found';
    element('empty-message').textContent = 'No active shops matched your search. Try clearing filters or searching for another city.';
    reset.textContent = 'Reset All Filters';
    grid.replaceChildren(...selected.map(shopCard));
  }

  async function loadDirectory() {
    if (loading) return;
    loading = true;
    try {
      shops = await apiFetch('/api/shops/public');
      for (const value of [...new Set(shops.map(shop => shop.category))].sort()) {
        const chip = node('button', 'chip', value);
        chip.type = 'button';
        chip.dataset.category = value;
        chip.setAttribute('aria-pressed', 'false');
        categoryChips.append(chip);
      }
      const cities = new Set([...city.options].map(option => option.value.toLowerCase()));
      for (const name of [...new Set(shops.map(shop => shop.city))].sort()) {
        if (!cities.has(name.toLowerCase())) {
          city.add(new Option(name, name));
          cities.add(name.toLowerCase());
        }
      }
      loaded = true;
      render();
    } catch (error) {
      element('empty-title').textContent = 'Shop directory unavailable';
      element('empty-message').textContent = error.message;
      reset.textContent = 'Try Again';
      empty.style.display = 'block';
      showToast(error.message, 'danger');
    } finally {
      loading = false;
    }
  }

  categoryChips.addEventListener('click', event => {
    const chip = event.target.closest('[data-category]');
    if (chip) {
      selectCategory(chip.dataset.category);
      render();
    }
  });

  search.addEventListener('input', render);
  city.addEventListener('change', render);
  sort.addEventListener('change', render);
  clear.addEventListener('click', () => {
    search.value = '';
    search.focus();
    render();
  });
  reset.addEventListener('click', () => {
    if (!loaded) {
      loadDirectory();
      return;
    }
    selectCategory('all');
    city.value = 'all';
    sort.value = 'newest';
    search.value = '';
    render();
  });

  close.addEventListener('click', closeShop);
  element('btn-close-shop-modal-footer').addEventListener('click', closeShop);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeShop();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('modal-backdrop--open')) closeShop();
  });

  loadDirectory();
});
