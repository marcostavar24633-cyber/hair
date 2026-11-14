/* HAIR STUDIO — interactions. Native browser APIs only. Data lives in config.js.
   Nothing is sent anywhere; the browser stores only the theme, favourite tones and a booking draft. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const CFG = window.HAIR_STUDIO || {};
  const FX = CFG.features || {};
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const fancy = finePointer && !reducedMotion;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const formatRub = value => new Intl.NumberFormat('ru-RU').format(value).replace(/\s/g, ' ') + ' ₽';
  /* Russian typography for dynamic text */
  const typo = text => String(text)
    .replace(/(^|[\s«(])([А-Яа-яЁё]{1,2}) /g, '$1$2 ')
    .replace(/(^|[\s«( ])([А-Яа-яЁё]{1,2}) /g, '$1$2 ')
    .replace(/ —/g, ' —')
    .replace(/(\d)–(\d)/g, '$1⁠–⁠$2')
    .replace(/(\d) (ч|мин|недел)/g, '$1 $2');
  const setText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = typo(value); };
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = typo(text);
    return node;
  };
  const svgIcon = id => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + id);
    svg.append(use);
    return svg;
  };

  /* ---------- Local storage: theme, favourite tones, booking draft. No personal data ---------- */
  const store = {
    get(key) { if (!FX.storage) return null; try { return JSON.parse(window.localStorage.getItem('hs-' + key)); } catch (error) { return null; } },
    set(key, value) { if (!FX.storage) return; try { window.localStorage.setItem('hs-' + key, JSON.stringify(value)); } catch (error) { /* private mode */ } },
    remove(key) { try { window.localStorage.removeItem('hs-' + key); } catch (error) { /* private mode */ } }
  };

  /* ---------- Data ---------- */
  const services = Object.fromEntries((CFG.services || []).map(item => [item.id, item]));
  const serviceList = CFG.services || [];
  const lengths = CFG.lengths || {};
  const tones = CFG.tones || {};
  const toneKeys = Object.keys(tones);
  const masters = CFG.masters || [];
  const directions = CFG.directions || {};
  const contacts = CFG.contacts || {};
  const duration = service => service.min === service.max ? service.time : service.time;
  $$('[data-contact]').forEach(node => { const value = contacts[node.dataset.contact]; if (value) node.textContent = typo(value); });

  /* ---------- Theme: dark is the main mode ---------- */
  const themeToggle = $('.theme-toggle');
  const themeColor = $('meta[name="theme-color"]');
  function setMode(mode, { animate = false, save = false } = {}) {
    if (animate && !reducedMotion) {
      root.classList.add('mode-fade');
      window.setTimeout(() => root.classList.remove('mode-fade'), 900);
    }
    root.dataset.mode = mode;
    themeToggle?.setAttribute('aria-pressed', String(mode === 'light'));
    themeToggle?.setAttribute('aria-label', 'Светлая тема');
    themeColor?.setAttribute('content', mode === 'light' ? '#f4efe7' : '#0d0b09');
    if (save) store.set('mode', mode);
  }
  themeToggle?.addEventListener('click', () => {
    setMode(root.dataset.mode === 'light' ? 'dark' : 'light', { animate: true, save: true });
    window.dispatchEvent(new Event('scroll')); /* the header re-checks which variant it needs */
  });
  setMode(store.get('mode') === 'light' ? 'light' : 'dark');

  /* ---------- Fallback for remote images that fail to load ---------- */
  const fallbackSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500"><rect width="1200" height="1500" fill="#211a15"/><path d="M420 1500V640a180 180 0 0 1 360 0v860" fill="none" stroke="#c9bcae" stroke-opacity=".5" stroke-width="2"/><text x="600" y="1160" text-anchor="middle" fill="#efe7dc" font-family="Georgia,serif" font-size="44" letter-spacing="8">HAIR STUDIO</text><text x="600" y="1220" text-anchor="middle" fill="#c9bcae" font-family="Arial,sans-serif" font-size="22" letter-spacing="3">ИЗОБРАЖЕНИЕ НЕДОСТУПНО</text></svg>';
  const fallbackImage = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(fallbackSvg);
  document.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied || image.closest('.lightbox')) return;
    image.dataset.fallbackApplied = 'true';
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.src = fallbackImage;
    image.classList.add('image-fallback');
  }, true);
  $$('img').forEach(image => {
    if (image.complete && image.naturalWidth === 0 && !image.src.startsWith('data:')) image.dispatchEvent(new Event('error'));
  });

  /* ---------- Open now (studio time zone from config) ---------- */
  const openNow = document.getElementById('open-now');
  if (openNow && Number.isFinite(contacts.open)) {
    const now = new Date();
    const hour = (now.getUTCHours() + contacts.utcOffset + 24) % 24;
    const isOpen = hour >= contacts.open && hour < contacts.close;
    openNow.textContent = isOpen ? 'Сейчас открыто · демо' : 'Откроемся в ' + contacts.open + ':00 · демо';
    openNow.classList.toggle('is-open', isOpen);
  }

  /* ---------- Scroll lock with scrollbar compensation ---------- */
  const header = $('.site-header');
  let lockCount = 0;
  function lockScroll() {
    if (lockCount++ > 0) return;
    const scrollbar = window.innerWidth - root.clientWidth;
    document.body.style.paddingRight = scrollbar ? scrollbar + 'px' : '';
    if (header) header.style.paddingRight = scrollbar ? scrollbar + 'px' : '';
    document.body.classList.add('is-locked');
  }
  function unlockScroll() {
    if (lockCount === 0 || --lockCount > 0) return;
    document.body.classList.remove('is-locked');
    document.body.style.paddingRight = '';
    if (header) header.style.paddingRight = '';
  }

  /* ---------- Focus trap shared by every dialog ---------- */
  const focusables = scope => $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', scope)
    .filter(item => item.getClientRects().length && !item.closest('[hidden]'));
  function trapFocus(event, scope) {
    if (event.key !== 'Tab') return;
    const items = focusables(scope);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  /* ---------- Drawers ---------- */
  const openDrawers = [];
  function makeDrawer(element, { onOpen, onClose, triggers = [] } = {}) {
    if (!element) return null;
    const drawer = { element, trigger: null, isOpen: false };
    const setExpanded = value => triggers.forEach(trigger => trigger.setAttribute('aria-expanded', String(value)));
    drawer.open = (trigger, focusTarget) => {
      if (drawer.isOpen) return;
      drawer.isOpen = true;
      drawer.trigger = trigger || document.activeElement;
      onOpen?.();
      element.hidden = false;
      lockScroll();
      setExpanded(true);
      openDrawers.push(drawer);
      void element.offsetWidth;
      element.classList.add('is-open');
      (focusTarget?.() || focusables(element)[0])?.focus({ preventScroll: true });
    };
    drawer.close = ({ restoreFocus = true } = {}) => {
      if (!drawer.isOpen) return;
      drawer.isOpen = false;
      element.classList.remove('is-open');
      setExpanded(false);
      openDrawers.splice(openDrawers.indexOf(drawer), 1);
      unlockScroll();
      const finish = () => { if (!drawer.isOpen) { element.hidden = true; onClose?.(); } };
      if (reducedMotion) finish(); else window.setTimeout(finish, element.classList.contains('drawer-menu') ? 720 : 400);
      if (restoreFocus && drawer.trigger && drawer.trigger.getClientRects().length) drawer.trigger.focus({ preventScroll: true });
    };
    element.addEventListener('keydown', event => trapFocus(event, element));
    $$('[data-close]', element).forEach(item => item.addEventListener('click', () => drawer.close()));
    element.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#"]');
      if (link && !link.hasAttribute('data-open-booking')) drawer.close({ restoreFocus: false });
    });
    return drawer;
  }

  /* Fullscreen menu */
  const menuButton = $('.menu-button');
  const menu = makeDrawer(document.getElementById('mobile-menu'), {
    triggers: menuButton ? [menuButton] : [],
    onOpen: () => menuButton?.setAttribute('aria-label', 'Закрыть меню'),
    onClose: () => menuButton?.setAttribute('aria-label', 'Открыть меню')
  });
  if (menu) menu.element.hidden = true;
  menuButton?.addEventListener('click', () => (menu.isOpen ? menu.close() : menu.open(menuButton, () => $('.menu-nav a'))));
  window.addEventListener('resize', () => { if (window.innerWidth > 960 && menu?.isOpen) menu.close({ restoreFocus: false }); }, { passive: true });

  /* ---------- Mega menu «Услуги» from config ---------- */
  const megaServices = document.getElementById('mega-services');
  if (megaServices) Object.entries(directions).forEach(([dir, title]) => {
    const column = el('div');
    column.append(el('h3', '', title));
    serviceList.filter(item => item.dir === dir).forEach(item => {
      const link = el('a');
      link.href = '#services';
      link.dataset.goService = item.id;
      link.append(el('b', '', item.name), el('span', 'num', 'от ' + formatRub(item.base)), el('small', 'num', item.time));
      column.append(link);
    });
    megaServices.append(column);
  });

  /* ---------- Desktop submenus ---------- */
  const subs = $$('[data-sub]');
  const closeDelay = parseFloat(getComputedStyle(root).getPropertyValue('--sub-close-delay')) || 180;
  function setSub(item, open) {
    item.classList.toggle('is-open', open);
    $('.sub-toggle', item)?.setAttribute('aria-expanded', String(open));
  }
  subs.forEach(item => {
    let timer = 0;
    const toggle = $('.sub-toggle', item);
    item.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      window.clearTimeout(timer);
      subs.forEach(other => other !== item && setSub(other, false));
      setSub(item, true);
    });
    item.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse') return;
      timer = window.setTimeout(() => setSub(item, false), closeDelay);
    });
    toggle?.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      subs.forEach(other => setSub(other, false));
      setSub(item, open);
      if (open) {
        const first = $('.sub-panel a', item);
        let frames = 0;
        const focusWhenVisible = () => {
          if (!first || !item.classList.contains('is-open')) return;
          if (getComputedStyle(first).visibility === 'visible' || frames++ > 20) first.focus();
          else window.requestAnimationFrame(focusWhenVisible);
        };
        focusWhenVisible();
      }
    });
    item.addEventListener('keydown', event => {
      if (event.key === 'Escape' && item.classList.contains('is-open')) { event.stopPropagation(); setSub(item, false); toggle?.focus(); }
    });
    item.addEventListener('focusout', event => { if (!item.contains(event.relatedTarget)) setSub(item, false); });
    item.addEventListener('click', event => { if (event.target.closest('.sub-panel a')) setSub(item, false); });
  });
  document.addEventListener('click', event => subs.forEach(item => { if (!item.contains(event.target)) setSub(item, false); }));

  /* ---------- Services catalogue: filters, sorting, cards ---------- */
  const catalog = document.getElementById('catalog');
  const catalogStatus = document.getElementById('catalog-status');
  const catalogEmpty = document.getElementById('catalog-empty');
  const groupBox = document.getElementById('filter-group');
  const state = { group: 'all', time: 'all', sort: 'order' };
  const timeMatch = { all: () => true, short: item => item.max <= 90, mid: item => item.max > 90 && item.max <= 180, long: item => item.max >= 240 };
  const groupMatch = (item, group) => group === 'all' || item.group === group;
  (CFG.groups || []).forEach(group => {
    const button = el('button', 'chip-btn', group.name);
    button.type = 'button';
    button.dataset.group = group.id;
    button.setAttribute('aria-pressed', String(group.id === 'all'));
    groupBox?.append(button);
  });
  const cards = new Map();
  serviceList.forEach((item, index) => {
    const card = el('li', 'card');
    card.id = 'service-' + item.id;
    card.dataset.order = String(index);
    const title = el('h3', '', item.name);
    const meta = el('p', 'card-meta');
    meta.append(el('span', 'card-price num', 'от ' + formatRub(item.base)), el('span', 'card-time num', item.time));
    const actions = el('div', 'card-actions');
    const book = el('a', 'text-link', 'Записаться');
    book.href = '#booking';
    book.dataset.openBooking = '';
    book.dataset.bookService = item.id;
    book.setAttribute('aria-haspopup', 'dialog');
    book.setAttribute('aria-controls', 'booking-drawer');
    book.append(el('span', 'visually-hidden', ': ' + item.name.toLowerCase()));
    const more = el('button', 'text-link', 'Подробнее');
    more.type = 'button';
    more.dataset.quick = item.id;
    more.setAttribute('aria-haspopup', 'dialog');
    more.setAttribute('aria-controls', 'quick-drawer');
    more.append(el('span', 'visually-hidden', ': ' + item.name.toLowerCase()));
    actions.append(book, more);
    card.append(el('p', 'card-dir', directions[item.dir]), title, el('p', 'card-note', item.note), meta, actions);
    catalog?.append(card);
    cards.set(item.id, card);
  });
  function renderCatalog({ announce = true } = {}) {
    if (!catalog) return;
    const visible = serviceList.filter(item => groupMatch(item, state.group) && timeMatch[state.time](item));
    const sorted = visible.slice().sort((a, b) => state.sort === 'asc' ? a.base - b.base : state.sort === 'desc' ? b.base - a.base : serviceList.indexOf(a) - serviceList.indexOf(b));
    serviceList.forEach(item => { cards.get(item.id).hidden = !visible.includes(item); });
    sorted.forEach((item, index) => {
      const card = cards.get(item.id);
      card.style.setProperty('--i', String(Math.min(index, 8)));
      catalog.append(card);
      if (announce && !reducedMotion) { card.classList.remove('is-enter'); void card.offsetWidth; card.classList.add('is-enter'); }
    });
    if (catalogEmpty) catalogEmpty.hidden = visible.length > 0;
    if (catalogStatus && announce) catalogStatus.textContent = 'Показано услуг: ' + visible.length + '.';
  }
  function bindChips(boxId, key, attr) {
    const box = document.getElementById(boxId);
    box?.addEventListener('click', event => {
      const button = event.target.closest('.chip-btn');
      if (!button) return;
      state[key] = button.dataset[attr];
      $$('.chip-btn', box).forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      renderCatalog();
    });
  }
  bindChips('filter-group', 'group', 'group');
  bindChips('filter-time', 'time', 'time');
  bindChips('filter-sort', 'sort', 'sort');
  renderCatalog({ announce: false });
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-go-service]');
    if (!link) return;
    event.preventDefault();
    state.group = 'all'; state.time = 'all';
    $$('#filter-group .chip-btn').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.group === 'all')));
    $$('#filter-time .chip-btn').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.time === 'all')));
    renderCatalog({ announce: false });
    const card = cards.get(link.dataset.goService);
    card?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    $('a', card)?.focus({ preventScroll: true });
  });

  /* Quick view */
  const quick = makeDrawer(document.getElementById('quick-drawer'));
  const quickBook = document.getElementById('quick-book');
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-quick]');
    const item = button && services[button.dataset.quick];
    if (!item || !quick) return;
    setText('quick-title', item.name);
    setText('quick-note', item.note);
    setText('quick-price', 'от ' + formatRub(item.base));
    setText('quick-time', item.time);
    setText('quick-includes', item.includes.join(', '));
    setText('quick-fine', item.dir === 'hair' ? 'Цена «от»: зависит от длины, густоты и исходной базы. Модельный ориентир, не оферта.' : 'Цена «от». Модельный ориентир концепта, не оферта.');
    if (quickBook) quickBook.dataset.bookService = item.id;
    quick.open(button);
  });

  /* ---------- Carousels: drag, buttons, keyboard (native scroll) ---------- */
  function initCarousel(box) {
    const track = $('.carousel-track', box);
    if (!track) return;
    let startX = 0, startLeft = 0, dragging = false, moved = false;
    track.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      dragging = true; moved = false; startX = event.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener('pointermove', event => {
      if (!dragging) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 4 && !moved) { moved = true; track.classList.add('is-dragging'); }
      if (moved) track.scrollLeft = startLeft - delta;
    });
    window.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
    });
    track.addEventListener('click', event => { if (moved) { event.preventDefault(); event.stopPropagation(); moved = false; } }, true);
    $$('[data-dir]', box).forEach(button => button.addEventListener('click', () => {
      const first = track.firstElementChild;
      const step = first ? first.getBoundingClientRect().width + 24 : track.clientWidth;
      track.scrollBy({ left: Number(button.dataset.dir) * step * 2, behavior: reducedMotion ? 'auto' : 'smooth' });
    }));
  }
  const formsTrack = document.getElementById('forms-track');
  (CFG.forms || []).forEach(form => {
    const card = el('li', 'form-card');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 120');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const face = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    face.setAttribute('d', 'M38 50c0-14 24-14 24 0v10c0 10-6 18-12 18s-12-8-12-18zM44 78v8c-8 2-16 6-18 16M56 78v8c8 2 16 6 18 16');
    const hair = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hair.setAttribute('class', 'form-hair');
    hair.setAttribute('d', form.hair);
    svg.append(face, hair);
    card.append(svg, el('span', '', form.len), el('b', '', form.name), el('p', '', form.text));
    formsTrack?.append(card);
  });
  const nailsTrack = document.getElementById('nails-track');
  (CFG.nails || []).forEach(nail => {
    const card = el('li', 'nail-card');
    const swatch = el('i');
    swatch.style.setProperty('--nail', nail.color);
    card.append(swatch, el('span', '', nail.name));
    nailsTrack?.append(card);
  });
  $$('[data-carousel]').forEach(initCarousel);

  /* ---------- Tones: hero, mega menu, atlas, compare and wizard share one state ---------- */
  const atlasTabs = $$('.atlas-tab');
  const atlasPanel = document.getElementById('tone-panel');
  const atlasInfo = $('.atlas-info');
  const atlasSection = document.getElementById('atlas');
  const strandLayers = $$('.strand-layer');
  const favButton = document.getElementById('tone-fav');
  let favourites = (store.get('fav') || []).filter(key => tones[key]);
  let currentTone = 'honey';
  function renderFavourites() {
    favButton?.setAttribute('aria-pressed', String(favourites.includes(currentTone)));
    setText('fav-list', favourites.length ? 'Избранное: ' + favourites.map(key => tones[key].name).join(', ') + '.' : '');
  }
  function setTone(tone, { focusTab = false } = {}) {
    const data = tones[tone];
    if (!data) return;
    const changed = tone !== currentTone;
    currentTone = tone;
    root.dataset.tone = tone;
    if (atlasSection) atlasSection.dataset.tone = tone;
    $$('.swatch').forEach(swatch => swatch.setAttribute('aria-pressed', String(swatch.dataset.tone === tone)));
    atlasTabs.forEach(tab => {
      const active = tab.dataset.tone === tone;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active) {
        atlasPanel?.setAttribute('aria-labelledby', tab.id);
        if (focusTab) tab.focus();
        if (changed) tab.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
      }
    });
    if (changed && strandLayers.length === 2) {
      const back = strandLayers.find(layer => !layer.classList.contains('is-front'));
      const front = strandLayers.find(layer => layer.classList.contains('is-front'));
      back.dataset.tone = tone;
      back.classList.add('is-front');
      front.classList.remove('is-front');
    }
    const index = toneKeys.indexOf(tone) + 1;
    setText('tone-index', String(index).padStart(2, '0') + ' / ' + String(toneKeys.length).padStart(2, '0'));
    setText('tone-name', data.name);
    setText('tone-text', data.text);
    setText('tone-technique', data.technique || CFG.unknown);
    setText('tone-care', data.care || CFG.unknown);
    setText('tone-price', data.price ? 'от ' + formatRub(data.price) : CFG.unknown);
    renderFavourites();
    if (atlasInfo && changed && !reducedMotion) {
      atlasInfo.classList.remove('is-changing');
      void atlasInfo.offsetWidth;
      atlasInfo.classList.add('is-changing');
    }
  }
  $$('.swatch').forEach(swatch => swatch.addEventListener('click', () => setTone(swatch.dataset.tone)));
  atlasTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setTone(tab.dataset.tone));
    tab.addEventListener('keydown', event => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let next = null;
      if (event.key in keys) next = (index + keys[event.key] + atlasTabs.length) % atlasTabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = atlasTabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      setTone(atlasTabs[next].dataset.tone, { focusTab: true });
    });
  });
  $$('[data-pick-tone]').forEach(link => link.addEventListener('click', () => setTone(link.dataset.pickTone)));
  favButton?.addEventListener('click', () => {
    favourites = favourites.includes(currentTone) ? favourites.filter(key => key !== currentTone) : favourites.concat(currentTone);
    store.set('fav', favourites);
    renderFavourites();
  });
  setTone('honey');

  /* Regrowth comparison */
  const compare = document.getElementById('compare');
  const compareRange = $('.compare-range');
  function updateCompare() {
    if (!compare || !compareRange) return;
    const raw = Number(compareRange.value);
    const value = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 50;
    compare.style.setProperty('--split', value + '%');
    compareRange.setAttribute('aria-valuetext', 'Свежий цвет: ' + value + '%, через 6–8 недель: ' + (100 - value) + '%');
  }
  compareRange?.addEventListener('input', updateCompare);
  updateCompare();

  /* ---------- Step-by-step booking (one component: section or drawer) ---------- */
  const wizard = document.getElementById('wizard');
  const optService = document.getElementById('opt-service');
  const optMaster = document.getElementById('opt-master');
  const option = (name, value, title, meta) => {
    const label = el('label', 'option');
    const input = document.createElement('input');
    input.type = 'radio'; input.name = name; input.value = value;
    label.append(input, el('span', 'option-name', title));
    if (meta) label.append(el('span', 'option-meta num', meta));
    return label;
  };
  Object.entries(directions).forEach(([dir, title]) => {
    optService?.append(el('p', 'option-group', title));
    serviceList.filter(item => item.dir === dir).forEach(item => optService?.append(option('service', item.id, item.name, 'от ' + formatRub(item.base) + ' · ' + item.time)));
  });
  (CFG.booking?.days || []).forEach(day => document.getElementById('opt-day')?.append(option('day', day, day.replace(' день', ''))));
  (CFG.booking?.slots || []).forEach(slot => document.getElementById('opt-time')?.append(option('time', slot, slot)));
  const steps = $$('.step', wizard || document.createElement('div'));
  const stepItems = $$('.wizard-steps li', wizard || document);
  const backButton = $('.wizard-back', wizard || document);
  const nextButton = $('.wizard-next', wizard || document);
  const submitButton = $('.wizard-submit', wizard || document);
  const errorBox = document.getElementById('wizard-error');
  const liveBox = document.getElementById('wizard-live');
  const statusBox = document.getElementById('form-status');
  const stepNames = { service: 'услуга', length: 'длина волос', shade: 'оттенок', master: 'мастер', time: 'день и время', summary: 'итог' };
  let stepIndex = 0;
  const value = name => wizard?.querySelector('input[name="' + name + '"]:checked')?.value || '';
  const check = (name, val) => {
    const input = wizard?.querySelector('input[name="' + name + '"][value="' + CSS.escape(val) + '"]');
    if (input) input.checked = true;
    return Boolean(input);
  };
  const current = () => services[value('service')];
  const needsShade = () => Boolean(current()?.shade);
  const needsLength = () => current()?.dir === 'hair';
  function renderMasters() {
    if (!optMaster) return;
    const chosen = value('master');
    optMaster.textContent = '';
    optMaster.append(option('master', 'any', 'Любой мастер', 'подберём по услуге'));
    const dir = current()?.dir;
    masters.filter(master => !dir || master.dir === dir).forEach(master => optMaster.append(option('master', master.id, master.name, master.role + ' · демо')));
    if (!check('master', chosen)) check('master', 'any');
  }
  const activeSteps = () => steps.filter(step => (step.dataset.step !== 'shade' || needsShade()) && (step.dataset.step !== 'length' || !current() || needsLength()));
  const isComplete = step => {
    switch (step.dataset.step) {
      case 'service': return Boolean(value('service'));
      case 'length': return Boolean(value('length'));
      case 'shade': return Boolean(value('shade'));
      case 'master': return Boolean(value('master'));
      case 'time': return Boolean(value('day') && value('time'));
      default: return true;
    }
  };
  function estimate() {
    const service = current();
    if (!service) return null;
    const length = needsLength() ? lengths[value('length')] : null;
    const ready = !needsLength() || Boolean(length);
    const factor = length ? length.factor : 1;
    return { total: Math.round(service.base * factor / 100) * 100, service, length, ready };
  }
  function saveDraft() {
    store.set('draft', { service: value('service'), length: value('length'), shade: value('shade'), master: value('master'), day: value('day'), time: value('time') });
  }
  function updateSummary() {
    const result = estimate();
    const priceOut = document.getElementById('wizard-price');
    if (priceOut) priceOut.textContent = result && result.length ? formatRub(result.total) : 'Выберите услугу и длину';
    if (result && result.length) setText('wizard-breakdown', 'База ' + formatRub(result.service.base) + ' × ' + result.length.label + ' за длину «' + result.length.name.toLowerCase() + '». Модельный ориентир, не оферта.');
    setText('sum-service', result ? result.service.name : '—');
    setText('sum-length', !result ? '—' : !needsLength() ? 'Не требуется' : result.length ? result.length.name : '—');
    setText('sum-shade', !result ? '—' : needsShade() ? (tones[value('shade')]?.name || '—') : 'Не требуется');
    const master = masters.find(item => item.id === value('master'));
    setText('sum-master', master ? master.name + ' · демо' : value('master') === 'any' ? 'Любой мастер' : '—');
    setText('sum-time', value('day') && value('time') ? value('day') + ', ' + value('time') : '—');
    const price = document.getElementById('sum-price');
    if (price) price.textContent = result && result.ready ? 'от ' + formatRub(result.total) + ' · около ' + typo(result.service.time) : '—';
  }
  function renderSteps({ focus = true } = {}) {
    if (!wizard) return;
    const list = activeSteps();
    stepIndex = Math.min(stepIndex, list.length - 1);
    const active = list[stepIndex];
    steps.forEach(step => { step.hidden = step !== active; });
    stepItems.forEach(item => {
      const step = steps.find(candidate => candidate.dataset.step === item.dataset.for);
      const position = list.indexOf(step);
      item.removeAttribute('aria-current');
      if (position === -1 && value('service')) item.dataset.state = 'skip';
      else if (position !== -1 && position < stepIndex) item.dataset.state = 'done';
      else item.dataset.state = '';
      if (step === active) item.setAttribute('aria-current', 'step');
    });
    wizard.style.setProperty('--progress', ((stepIndex + 1) / list.length).toFixed(3));
    if (backButton) backButton.hidden = stepIndex === 0;
    if (nextButton) nextButton.hidden = active.dataset.step === 'summary';
    if (errorBox) errorBox.textContent = '';
    updateSummary();
    if (liveBox) liveBox.textContent = 'Шаг ' + (stepIndex + 1) + ' из ' + list.length + ': ' + stepNames[active.dataset.step];
    if (focus) $('legend', active)?.focus({ preventScroll: wizard.closest('.drawer') === null });
  }
  function goToFirstIncomplete() {
    const list = activeSteps();
    const index = list.findIndex(step => !isComplete(step));
    stepIndex = index === -1 ? list.length - 1 : index;
  }
  function confetti(origin) {
    if (!FX.confetti || reducedMotion || !origin) return;
    const rect = origin.getBoundingClientRect();
    for (let i = 0; i < 26; i++) {
      const piece = el('span', 'confetti');
      piece.style.left = rect.left + rect.width / 2 + 'px';
      piece.style.top = rect.top + 'px';
      piece.style.setProperty('--dx', (Math.random() * 360 - 180).toFixed(0) + 'px');
      piece.style.setProperty('--dy', (-Math.random() * 260 - 40).toFixed(0) + 'px');
      piece.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
      piece.dataset.tone = toneKeys[i % toneKeys.length];
      document.body.append(piece);
      window.setTimeout(() => piece.remove(), 1500);
    }
  }
  if (wizard) {
    const draft = store.get('draft');
    if (draft) ['service', 'length', 'shade', 'day', 'time'].forEach(name => draft[name] && check(name, draft[name]));
    renderMasters();
    if (draft?.master) check('master', draft.master);
    nextButton?.addEventListener('click', () => {
      const active = activeSteps()[stepIndex];
      if (!isComplete(active)) {
        if (errorBox) errorBox.textContent = active.dataset.step === 'time' ? 'Выберите день и время, чтобы продолжить.' : 'Выберите вариант, чтобы продолжить.';
        $('input', active)?.focus();
        return;
      }
      stepIndex++;
      renderSteps();
    });
    backButton?.addEventListener('click', () => { stepIndex = Math.max(0, stepIndex - 1); renderSteps(); });
    wizard.addEventListener('change', event => {
      if (event.target.name === 'shade') setTone(event.target.value);
      if (event.target.name === 'service') renderMasters();
      if (errorBox) errorBox.textContent = '';
      saveDraft();
      renderSteps({ focus: false });
    });
    wizard.addEventListener('submit', event => {
      event.preventDefault();
      if (!activeSteps().every(isComplete)) { goToFirstIncomplete(); renderSteps(); return; }
      const result = estimate();
      if (statusBox) statusBox.textContent = typo('Демо готово: ' + result.service.name + ', ' + value('day').toLowerCase() + ' в ' + value('time') + ', ориентир от ' + formatRub(result.total) + '. Это демонстрация: данные не отправлены, реальная запись не создана.');
      confetti(submitButton);
      store.remove('draft');
    });
    submitButton?.removeAttribute('disabled');
    renderSteps({ focus: false });
  }

  /* Booking drawer: moves the same form into the panel and back */
  const bookingSlot = document.getElementById('booking-slot');
  const drawerSlot = document.getElementById('drawer-slot');
  const movedNote = $('.booking-moved');
  const booking = makeDrawer(document.getElementById('booking-drawer'), {
    onOpen: () => { if (wizard && drawerSlot) { drawerSlot.append(wizard); if (movedNote) movedNote.hidden = false; } },
    onClose: () => { if (wizard && bookingSlot) { bookingSlot.append(wizard); if (movedNote) movedNote.hidden = true; } $$('[data-open-booking]').forEach(item => item.setAttribute('aria-expanded', 'false')); }
  });
  $$('[data-open-booking]').forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-open-booking]');
    if (!trigger || !booking || !wizard) return;
    event.preventDefault();
    if (trigger.dataset.bookService) { check('service', trigger.dataset.bookService); renderMasters(); }
    if (trigger.hasAttribute('data-book-tone')) {
      check('shade', currentTone);
      if (!current()?.shade) { check('service', tones[currentTone].service); renderMasters(); }
    }
    if (trigger.dataset.bookMaster) {
      const master = masters.find(item => item.id === trigger.dataset.bookMaster);
      if (master && current()?.dir !== master.dir) { $$('input[name="service"]', wizard).forEach(input => { input.checked = false; }); }
      renderMasters();
      if (master && !check('master', master.id)) { optMaster?.append(option('master', master.id, master.name, master.role + ' · демо')); check('master', master.id); }
    }
    saveDraft();
    [menu, quick].forEach(other => other?.isOpen && other.close({ restoreFocus: false }));
    goToFirstIncomplete();
    renderSteps({ focus: false });
    trigger.setAttribute('aria-expanded', 'true');
    booking.open(trigger.closest('.drawer') ? null : trigger, () => $('legend', activeSteps()[stepIndex]));
  });

  /* Masters from config */
  const mastersBox = document.getElementById('masters');
  masters.forEach(master => {
    const card = el('li', 'master');
    const monogram = el('div', 'monogram');
    monogram.dataset.tone = master.tone;
    monogram.setAttribute('aria-hidden', 'true');
    monogram.append(el('span', '', master.initials));
    const book = el('a', 'text-link', 'Записаться к мастеру');
    book.href = '#booking';
    book.dataset.openBooking = '';
    book.dataset.bookMaster = master.id;
    book.setAttribute('aria-haspopup', 'dialog');
    book.setAttribute('aria-controls', 'booking-drawer');
    book.setAttribute('aria-expanded', 'false');
    book.append(el('span', 'visually-hidden', ': ' + master.name));
    card.append(monogram, el('p', 'master-role', master.role + ' · демо-профиль'), el('h3', '', master.name), el('p', 'master-text', master.text), book);
    mastersBox?.append(card);
  });

  /* ---------- Quiz: 2–3 tone families ---------- */
  const quizForm = document.getElementById('quiz');
  const quizResult = document.getElementById('quiz-result');
  const quizTriggers = $$('[data-open-quiz]');
  const quiz = makeDrawer(document.getElementById('quiz-drawer'), { triggers: quizTriggers });
  quizTriggers.forEach(trigger => trigger.addEventListener('click', () => quiz?.open(trigger)));
  quizForm?.addEventListener('submit', event => {
    event.preventDefault();
    const answer = name => quizForm.querySelector('input[name="' + name + '"]:checked')?.value;
    const score = Object.fromEntries(toneKeys.map(key => [key, 0]));
    const add = (keys, points) => keys.forEach(key => { if (key in score) score[key] += points; });
    add({ light: ['blonde', 'honey'], mid: ['honey', 'caramel', 'copper'], dark: ['chestnut', 'espresso', 'caramel'] }[answer('base')] || [], 3);
    add({ warm: ['honey', 'copper', 'caramel'], cool: ['blonde', 'espresso', 'chestnut'], any: ['honey', 'chestnut'] }[answer('temp')] || [], 2);
    add(answer('refresh') === 'often' ? ['blonde', 'copper'] : ['caramel', 'chestnut', 'honey'], 1);
    add(answer('visit') === 'long' ? ['blonde', 'honey', 'caramel'] : ['chestnut', 'espresso', 'copper'], 1);
    const best = toneKeys.slice().sort((a, b) => score[b] - score[a]).slice(0, 3);
    if (!quizResult) return;
    quizResult.textContent = '';
    quizResult.append(el('p', 'group-label', 'Посмотрите эти семейства'));
    best.forEach(key => {
      const pick = el('button', 'quiz-pick');
      pick.type = 'button';
      const chip = el('span', 'chip');
      chip.dataset.tone = key;
      chip.setAttribute('aria-hidden', 'true');
      pick.append(chip, el('span', '', tones[key].name));
      pick.addEventListener('click', () => {
        setTone(key);
        quiz?.close({ restoreFocus: false });
        atlasSection?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
        document.getElementById('tone-tab-' + key)?.focus({ preventScroll: true });
      });
      quizResult.append(pick);
    });
    $('button', quizResult)?.focus();
  });

  /* Escape closes the top-most layer */
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (lightbox && !lightbox.hidden) { closeLightbox(); return; }
    const top = openDrawers[openDrawers.length - 1];
    if (top) top.close();
  });

  /* ---------- References: filter + lightbox ---------- */
  const worksGrid = $('.works-grid');
  const worksStatus = document.getElementById('works-status');
  $$('.filter').forEach(button => button.addEventListener('click', () => {
    $$('.filter').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const filter = button.dataset.filter;
    let visible = 0;
    $$('.ref').forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.kind !== filter;
      if (!card.hidden) visible++;
    });
    worksGrid?.classList.toggle('is-filtered', filter !== 'all');
    if (worksStatus) worksStatus.textContent = 'Показано референсов: ' + visible + '. Фильтр: ' + button.textContent.trim() + '.';
  }));
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = $('img', lightbox || document);
  const lightboxCaption = $('.lightbox-caption', lightbox || document);
  const lightboxClose = $('.lightbox-close', lightbox || document);
  let lightboxTrigger = null;
  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    unlockScroll();
    lightboxTrigger?.focus();
  }
  $$('.ref[data-image]').forEach(card => card.addEventListener('click', () => {
    if (!lightbox || !lightboxImage) return;
    const url = card.dataset.image || '';
    if (!/^https:\/\/images\.(?:unsplash|pexels)\.com\//.test(url)) return;
    lightboxTrigger = card;
    lightboxImage.src = url;
    lightboxImage.alt = $('img', card)?.alt || '';
    if (lightboxCaption) lightboxCaption.textContent = $('.ref-caption', card)?.textContent.trim() + ' · визуальный референс';
    lightbox.hidden = false;
    lockScroll();
    lightboxClose?.focus();
  }));
  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
  lightbox?.addEventListener('keydown', event => trapFocus(event, lightbox));

  /* ---------- Reviews slider ---------- */
  const track = $('.reviews-track');
  $$('[data-scroll]').forEach(button => button.addEventListener('click', () => {
    if (!track) return;
    const card = $('.review', track);
    const step = card ? card.getBoundingClientRect().width + 24 : track.clientWidth;
    track.scrollBy({ left: Number(button.dataset.scroll) * step, behavior: reducedMotion ? 'auto' : 'smooth' });
  }));

  /* ---------- FAQ accordion ---------- */
  $$('.faq-q').forEach(button => button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    button.closest('.faq-item')?.classList.toggle('is-open', open);
  }));

  /* ---------- Manifesto words ---------- */
  const manifesto = $('[data-words]');
  let words = [];
  if (manifesto) {
    const text = manifesto.textContent.trim();
    manifesto.textContent = '';
    text.split(/ +/).forEach((word, index, all) => {
      const span = el('span', 'word');
      span.textContent = word;
      manifesto.append(span);
      if (index < all.length - 1) manifesto.append(document.createTextNode(' '));
    });
    words = $$('.word', manifesto);
  }

  /* ---------- Reveal on scroll ---------- */
  ['.theses', '.catalog', '.masters', '.timeline', '.facts', '.faq-list', '.footer-grid', '.stack'].forEach(selector => $$(selector).forEach(group => Array.from(group.children).forEach((child, index) => {
    if (child.classList.contains('stack-card') || child.classList.contains('card')) return;
    child.dataset.reveal = '';
    child.style.setProperty('--i', String(Math.min(index, 6)));
  })));
  $$('.section-top, .atlas-top, .strands, .works-head, .ref, .team-head, .visit-intro, .booking-intro, .faq-head, .footer-top, .regrowth-copy, .compare, .location-copy, .map, .principles-head, .cta .wrap, .carousel').forEach(element => { element.dataset.reveal = ''; });
  $$('.hero h1 .line').forEach((line, index) => $('span', line)?.style.setProperty('--i', String(index)));
  const hero = $('.hero');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    $$('[data-reveal]').forEach(element => element.classList.add('is-in'));
    hero?.classList.add('is-ready');
  } else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('[data-reveal]').forEach(element => observer.observe(element));
    window.setTimeout(() => hero?.classList.add('is-ready'), 1500);
  }

  /* ---------- Pointer effects: cursor, magnetic buttons, card tilt, hero layers ---------- */
  if (!FX.seal) $('.seal')?.remove();
  if (!FX.ambient) $('.ambient')?.remove();
  if (!FX.floatingCta) $('.floating-cta')?.remove();
  const cursor = $('.cursor');
  let pointerX = -100, pointerY = -100, cursorX = -100, cursorY = -100, pointerDirty = false;
  if (fancy) {
    if (FX.cursor && cursor) root.classList.add('has-cursor');
    const cursorLabel = $('.cursor-label', cursor || document);
    window.addEventListener('pointermove', event => {
      pointerX = event.clientX; pointerY = event.clientY; pointerDirty = true;
      requestFrame();
    }, { passive: true });
    document.addEventListener('pointerover', event => {
      if (!cursor || !FX.cursor) return;
      const labelled = event.target.closest('[data-cursor]');
      const cut = event.target.closest('[data-open-booking]');
      cursor.classList.toggle('is-label', Boolean(labelled));
      cursor.classList.toggle('is-cut', !labelled && Boolean(cut));
      if (labelled && cursorLabel) cursorLabel.textContent = labelled.dataset.cursor;
    });
    if (FX.magnetic) document.addEventListener('pointermove', event => {
      const button = event.target.closest?.('.btn-fill, .floating-cta, .theme-toggle');
      $$('.is-magnet').forEach(item => { if (item !== button) { item.classList.remove('is-magnet'); item.style.removeProperty('transform'); item.style.removeProperty('--mgx'); item.style.removeProperty('--mgy'); } });
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const dx = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
      const dy = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
      button.classList.add('is-magnet');
      if (button.classList.contains('floating-cta')) { button.style.setProperty('--mgx', dx.toFixed(1) + 'px'); button.style.setProperty('--mgy', dy.toFixed(1) + 'px'); }
      else button.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
    }, { passive: true });
    if (FX.tilt) catalog?.addEventListener('pointermove', event => {
      const card = event.target.closest('.card');
      $$('.card', catalog).forEach(item => { if (item !== card) { item.style.removeProperty('--rx'); item.style.removeProperty('--ry'); } });
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--ry', (((event.clientX - rect.left) / rect.width - 0.5) * 7).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((0.5 - (event.clientY - rect.top) / rect.height) * 7).toFixed(2) + 'deg');
    }, { passive: true });
    catalog?.addEventListener('pointerleave', () => $$('.card', catalog).forEach(item => { item.style.removeProperty('--rx'); item.style.removeProperty('--ry'); }));
  }

  /* ---------- One rAF loop for scroll and pointer effects ---------- */
  const heroVisual = $('[data-parallax]');
  const heroImage = $('.hero-image');
  const darkSections = $$('[data-theme="dark"]');
  const marqueeTrack = $('.marquee-track');
  const floating = $('.floating-cta');
  const timeline = document.getElementById('timeline');
  const bookingSection = document.getElementById('booking');
  let lastY = window.scrollY, frameY = window.scrollY, marqueeX = 0, velocity = 0, ticking = false;
  function onFrame() {
    ticking = false;
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--scroll-progress', max > 0 ? (y / max).toFixed(4) : '0');
    if (header) {
      const heroBottom = hero ? hero.offsetTop + hero.offsetHeight - header.offsetHeight : 400;
      const locked = document.body.classList.contains('is-locked');
      header.classList.toggle('is-compact', y > 8);
      const delta = y - lastY;
      /* Ignore tiny shifts (lazy images, scroll anchoring) so the header does not flicker */
      if (y <= heroBottom || delta < -6) header.classList.remove('is-hidden');
      else if (delta > 6 && !locked && !header.contains(document.activeElement)) header.classList.add('is-hidden');
      const probe = y + header.offsetHeight / 2;
      const dark = root.dataset.mode !== 'light' || darkSections.some(section => probe >= section.offsetTop && probe < section.offsetTop + section.offsetHeight);
      header.classList.toggle('is-dark', dark);
      root.classList.toggle('header-dark', dark);
      if (floating) {
        const nearBooking = bookingSection && y + window.innerHeight > bookingSection.offsetTop + 120 && y < bookingSection.offsetTop + bookingSection.offsetHeight;
        floating.classList.toggle('is-shown', y > heroBottom && !nearBooking && !locked);
      }
    }
    if (!reducedMotion) {
      root.style.setProperty('--ambient-shift', (Math.sin(y / 1400) * 70).toFixed(1) + 'px');
      if (heroImage && y < window.innerHeight * 1.2) heroImage.style.setProperty('--parallax', (y * 0.06).toFixed(1) + 'px');
      if (words.length && manifesto) {
        const rect = manifesto.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.85 - rect.top) / (rect.height + window.innerHeight * 0.35)));
        const lit = Math.round(progress * words.length);
        words.forEach((word, index) => word.classList.toggle('is-lit', index < lit));
      }
      if (timeline) {
        const rect = timeline.getBoundingClientRect();
        timeline.style.setProperty('--line', Math.min(1, Math.max(0, (window.innerHeight * 0.8 - rect.top) / rect.height)).toFixed(3));
      }
      if (pointerDirty && fancy) {
        pointerDirty = false;
        cursorX = pointerX; cursorY = pointerY;
        cursor?.style.setProperty('--cx', cursorX + 'px');
        cursor?.style.setProperty('--cy', cursorY + 'px');
        if (heroVisual && y < window.innerHeight) {
          heroVisual.style.setProperty('--px', ((pointerX / window.innerWidth - 0.5) * -10).toFixed(1) + 'px');
          heroVisual.style.setProperty('--py', ((pointerY / window.innerHeight - 0.5) * -10).toFixed(1) + 'px');
        }
      }
    }
    if (Math.abs(y - lastY) > 6 || y <= 0) lastY = y;
  }
  const requestFrame = () => { if (!ticking) { ticking = true; window.requestAnimationFrame(onFrame); } };
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame, { passive: true });
  onFrame();

  /* Marquee: steady drift, faster while the page scrolls */
  if (marqueeTrack && FX.marquee && !reducedMotion) {
    let half = 0;
    const tick = () => {
      if (!half) half = marqueeTrack.scrollWidth / 2;
      const y = window.scrollY;
      velocity += (Math.min(40, Math.abs(y - frameY)) - velocity) * 0.1;
      frameY = y;
      marqueeX -= 0.6 + velocity * 0.35;
      if (half && -marqueeX >= half) marqueeX += half;
      marqueeTrack.style.setProperty('--mx', marqueeX.toFixed(1) + 'px');
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  }
})();
