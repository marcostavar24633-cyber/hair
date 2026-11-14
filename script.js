/* HAIR STUDIO — interactions. Native browser APIs only; nothing is sent or stored. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const formatRub = value => new Intl.NumberFormat('ru-RU').format(value).replace(/\s/g, '\u00a0') + '\u00a0₽';
  /* Russian typography for dynamic text: no short word left at a line end */
  const typo = text => text
    .replace(/(^|[\s«(])([А-Яа-яЁё]{1,2}) /g, '$1$2\u00a0')
    .replace(/(^|[\s«(])([А-Яа-яЁё]{1,2}) /g, '$1$2\u00a0')
    .replace(/ —/g, '\u00a0—')
    .replace(/(\d)–(\d)/g, '$1\u2060–\u2060$2')
    .replace(/(\d) (ч|мин|недел)/g, '$1\u00a0$2');
  const setText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = typo(value); };

  /* ---------- Self-contained fallback for remote images that fail to load ---------- */
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

  /* ---------- Data (concept model prices) ---------- */
  const services = {
    cut: { name: 'Стрижка и форма', base: 2200, time: '1–1,5 ч', color: false },
    color: { name: 'Окрашивание в один тон', base: 4600, time: '2–3 ч', color: true },
    complex: { name: 'Сложные техники', base: 8000, time: '4–6 ч', color: true },
    tone: { name: 'Тонирование', base: 2500, time: '1,5–2 ч', color: true },
    style: { name: 'Укладка', base: 2300, time: '45–60 мин', color: false },
    care: { name: 'Уход за волосами', base: 3000, time: '1–1,5 ч', color: false }
  };
  const lengths = {
    short: { name: 'Короткие', factor: 1, label: '1,0' },
    medium: { name: 'Средние', factor: 1.2, label: '1,2' },
    long: { name: 'Длинные', factor: 1.45, label: '1,45' }
  };
  const tones = {
    blonde: { index: '01 / 06', name: 'Холодный блонд', text: 'Светлые оттенки с пепельным или жемчужным нюансом. Почти всегда требуют осветления, поэтому начинаются с честной диагностики.', technique: 'Осветление и тонирование', care: 'Тонирование раз в 4–6 недель', service: 'complex' },
    honey: { index: '02 / 06', name: 'Мёд', text: 'Тёплое золотистое свечение без резкой желтизны. Освежает русый и светло-каштановый цвет.', technique: 'Мягкие переходы, тонирование', care: 'Тонирование раз в 6–8 недель', service: 'complex' },
    copper: { index: '03 / 06', name: 'Медь', text: 'Самый выразительный тёплый цвет. Пигмент вымывается быстрее других, поэтому яркость держат тонированием и бережным уходом.', technique: 'Окрашивание в один тон', care: 'Тонирование раз в 4–6 недель', service: 'color' },
    caramel: { index: '04 / 06', name: 'Карамель', text: 'Золотисто-коричневый оттенок между тёплым русым и каштаном. Хорошо работает в мягких переходах и спокойно отрастает.', technique: 'Мягкие переходы, многомерный цвет', care: 'Обновление раз в 8–10 недель', service: 'complex' },
    chestnut: { index: '05 / 06', name: 'Каштан', text: 'Глубокий натуральный коричневый с тёплым или нейтральным нюансом. Спокойный цвет с блеском без резких перемен.', technique: 'Окрашивание в один тон', care: 'Обновление корней раз в 6–8 недель', service: 'color' },
    espresso: { index: '06 / 06', name: 'Эспрессо', text: 'Самый тёмный оттенок атласа: насыщенный, почти чёрный, с мягким коричневым подтоном и зеркальным блеском.', technique: 'Окрашивание в один тон, тонирование', care: 'Тонирование для блеска раз в 6–8 недель', service: 'color' }
  };

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

  /* ---------- Off-canvas drawers ---------- */
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
      if (reducedMotion) finish(); else window.setTimeout(finish, 400);
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

  /* Mobile menu */
  const menuButton = $('.menu-button');
  const menu = makeDrawer(document.getElementById('mobile-menu'), {
    triggers: menuButton ? [menuButton] : [],
    onOpen: () => menuButton?.setAttribute('aria-label', 'Закрыть меню'),
    onClose: () => menuButton?.setAttribute('aria-label', 'Открыть меню')
  });
  if (menu) menu.element.hidden = true;
  menuButton?.addEventListener('click', () => (menu.isOpen ? menu.close() : menu.open(menuButton, () => $('.menu-nav a'))));
  window.addEventListener('resize', () => { if (window.innerWidth > 960 && menu?.isOpen) menu.close({ restoreFocus: false }); }, { passive: true });

  /* ---------- Desktop submenus: hover with a close delay, click / Enter / Space ---------- */
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
    $$('.sub-panel a', item).forEach(link => link.addEventListener('click', () => setSub(item, false)));
  });
  document.addEventListener('click', event => subs.forEach(item => { if (!item.contains(event.target)) setSub(item, false); }));

  /* ---------- Tones: hero swatches, mega menu, atlas and wizard share one state ---------- */
  const atlasTabs = $$('.atlas-tab');
  const atlasPanel = document.getElementById('tone-panel');
  const atlasInfo = $('.atlas-info');
  const strandLayers = $$('.strand-layer');
  let currentTone = 'honey';
  function setTone(tone, { focusTab = false } = {}) {
    const data = tones[tone];
    if (!data) return;
    const changed = tone !== currentTone;
    currentTone = tone;
    root.dataset.tone = tone;
    $$('.swatch').forEach(swatch => swatch.setAttribute('aria-pressed', String(swatch.dataset.tone === tone)));
    atlasTabs.forEach(tab => {
      const active = tab.dataset.tone === tone;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active) { atlasPanel?.setAttribute('aria-labelledby', tab.id); if (focusTab) tab.focus(); }
    });
    if (changed && strandLayers.length === 2) {
      const back = strandLayers.find(layer => !layer.classList.contains('is-front'));
      const front = strandLayers.find(layer => layer.classList.contains('is-front'));
      back.dataset.tone = tone;
      back.classList.add('is-front');
      front.classList.remove('is-front');
    }
    setText('tone-index', data.index);
    setText('tone-name', data.name);
    setText('tone-text', data.text);
    setText('tone-technique', data.technique);
    setText('tone-care', data.care + ' — ориентир концепта');
    setText('tone-price', 'от ' + formatRub(services[data.service].base));
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
  setTone('honey');

  /* ---------- Step-by-step booking (one component: section or drawer) ---------- */
  const wizard = document.getElementById('wizard');
  const steps = $$('.step', wizard || document);
  const stepItems = $$('.wizard-steps li', wizard || document);
  const backButton = $('.wizard-back', wizard || document);
  const nextButton = $('.wizard-next', wizard || document);
  const submitButton = $('.wizard-submit', wizard || document);
  const errorBox = document.getElementById('wizard-error');
  const liveBox = document.getElementById('wizard-live');
  const statusBox = document.getElementById('form-status');
  const stepNames = { service: 'услуга', length: 'длина волос', shade: 'оттенок', time: 'день и время', summary: 'итог' };
  let stepIndex = 0;
  const value = name => wizard?.querySelector('input[name="' + name + '"]:checked')?.value || '';
  const check = (name, val) => {
    const input = wizard?.querySelector('input[name="' + name + '"][value="' + CSS.escape(val) + '"]');
    if (input) input.checked = true;
  };
  const needsShade = () => Boolean(services[value('service')]?.color);
  const activeSteps = () => steps.filter(step => step.dataset.step !== 'shade' || needsShade());
  const isComplete = step => {
    switch (step.dataset.step) {
      case 'service': return Boolean(value('service'));
      case 'length': return Boolean(value('length'));
      case 'shade': return Boolean(value('shade'));
      case 'time': return Boolean(value('day') && value('time'));
      default: return true;
    }
  };
  function estimate() {
    const service = services[value('service')];
    const length = lengths[value('length')];
    if (!service) return null;
    const factor = length ? length.factor : 1;
    return { total: Math.round(service.base * factor / 100) * 100, service, length };
  }
  function updateSummary() {
    const result = estimate();
    const priceOut = document.getElementById('wizard-price');
    if (priceOut) priceOut.textContent = result && result.length ? formatRub(result.total) : 'Выберите услугу и длину';
    if (result && result.length) {
      setText('wizard-breakdown', 'База ' + formatRub(result.service.base) + ' × ' + result.length.label + ' за длину «' + result.length.name.toLowerCase() + '». Модельный ориентир, не оферта.');
    }
    setText('sum-service', result ? result.service.name + ' · ' + result.service.time : '—');
    setText('sum-length', result?.length ? result.length.name : '—');
    setText('sum-shade', needsShade() ? (tones[value('shade')]?.name || '—') : 'Не требуется');
    setText('sum-time', value('day') && value('time') ? value('day') + ', ' + value('time') : '—');
    const price = document.getElementById('sum-price');
    if (price) price.textContent = result && result.length ? 'от ' + formatRub(result.total) : '—';
  }
  function renderSteps({ focus = true } = {}) {
    if (!wizard) return;
    const list = activeSteps();
    stepIndex = Math.min(stepIndex, list.length - 1);
    const current = list[stepIndex];
    steps.forEach(step => { step.hidden = step !== current; });
    stepItems.forEach(item => {
      const step = steps.find(candidate => candidate.dataset.step === item.dataset.for);
      const position = list.indexOf(step);
      item.removeAttribute('aria-current');
      if (position === -1 && value('service')) item.dataset.state = 'skip';
      else if (position < stepIndex) item.dataset.state = 'done';
      else item.dataset.state = '';
      if (step === current) item.setAttribute('aria-current', 'step');
    });
    if (backButton) backButton.hidden = stepIndex === 0;
    if (nextButton) nextButton.hidden = current.dataset.step === 'summary';
    if (errorBox) errorBox.textContent = '';
    updateSummary();
    if (liveBox) liveBox.textContent = 'Шаг ' + (stepIndex + 1) + ' из ' + list.length + ': ' + stepNames[current.dataset.step];
    if (focus) $('legend', current)?.focus({ preventScroll: wizard.closest('.drawer') === null });
  }
  function goToFirstIncomplete() {
    const list = activeSteps();
    const index = list.findIndex(step => !isComplete(step));
    stepIndex = index === -1 ? list.length - 1 : index;
  }
  if (wizard) {
    nextButton?.addEventListener('click', () => {
      const current = activeSteps()[stepIndex];
      if (!isComplete(current)) {
        if (errorBox) errorBox.textContent = current.dataset.step === 'time' ? 'Выберите день и время, чтобы продолжить.' : 'Выберите вариант, чтобы продолжить.';
        $('input', current)?.focus();
        return;
      }
      stepIndex++;
      renderSteps();
    });
    backButton?.addEventListener('click', () => { stepIndex = Math.max(0, stepIndex - 1); renderSteps(); });
    wizard.addEventListener('change', event => {
      if (event.target.name === 'shade') setTone(event.target.value);
      if (errorBox) errorBox.textContent = '';
      updateSummary();
      renderSteps({ focus: false });
    });
    wizard.addEventListener('submit', event => {
      event.preventDefault();
      if (!activeSteps().every(isComplete)) { goToFirstIncomplete(); renderSteps(); return; }
      const result = estimate();
      if (statusBox) statusBox.textContent = typo('Демо готово: ' + result.service.name + ', ' + value('day').toLowerCase() + ' в ' + value('time') + ', ориентир от ' + formatRub(result.total) + '. Это демонстрация: данные не отправлены, реальная запись не создана.');
    });
    submitButton?.removeAttribute('disabled');
    renderSteps({ focus: false });
  }

  /* Booking drawer: moves the same form into the panel and back */
  const bookingSlot = document.getElementById('booking-slot');
  const drawerSlot = document.getElementById('drawer-slot');
  const movedNote = $('.booking-moved');
  const bookingTriggers = $$('[data-open-booking]');
  const booking = makeDrawer(document.getElementById('booking-drawer'), {
    triggers: bookingTriggers,
    onOpen: () => { if (wizard && drawerSlot) { drawerSlot.append(wizard); if (movedNote) movedNote.hidden = false; } },
    onClose: () => { if (wizard && bookingSlot) { bookingSlot.append(wizard); if (movedNote) movedNote.hidden = true; } }
  });
  bookingTriggers.forEach(trigger => {
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', event => {
      if (!booking || !wizard) return;
      event.preventDefault();
      if (trigger.dataset.bookService) check('service', trigger.dataset.bookService);
      if (trigger.hasAttribute('data-book-tone')) {
        check('shade', currentTone);
        if (!value('service') || !services[value('service')].color) check('service', tones[currentTone].service);
      }
      if (menu?.isOpen) menu.close({ restoreFocus: false });
      goToFirstIncomplete();
      renderSteps({ focus: false });
      booking.open(trigger, () => $('legend', activeSteps()[stepIndex]));
    });
  });

  /* Escape closes the top-most layer */
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!lightbox?.hidden) { closeLightbox(); return; }
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

  /* ---------- Manifesto words light up while scrolling ---------- */
  const manifesto = $('[data-words]');
  let words = [];
  if (manifesto) {
    const text = manifesto.textContent.trim();
    manifesto.textContent = '';
    text.split(/ +/).forEach((word, index, all) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      manifesto.append(span);
      if (index < all.length - 1) manifesto.append(document.createTextNode(' '));
    });
    words = $$('.word', manifesto);
  }

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  const revealGroups = ['.theses', '.service-list', '.process', '.masters', '.timeline', '.facts', '.faq-list', '.footer-grid'];
  revealGroups.forEach(selector => $$(selector).forEach(group => Array.from(group.children).forEach((child, index) => {
    child.dataset.reveal = '';
    child.style.setProperty('--i', String(Math.min(index, 6)));
  })));
  $$('.services-aside, .atlas-top, .strands, .works-head, .ref, .team-head, .visit-intro, .reviews, .booking-intro, .faq-head, .footer-top').forEach(element => { element.dataset.reveal = ''; });
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
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => hero?.classList.add('is-ready')));
  }

  /* ---------- One rAF loop for every scroll effect ---------- */
  const heroImage = $('.hero-image');
  const darkSections = $$('[data-theme="dark"]');
  let lastY = window.scrollY;
  let ticking = false;
  function onFrame() {
    ticking = false;
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    root.style.setProperty('--scroll-progress', max > 0 ? (y / max).toFixed(4) : '0');
    if (header) {
      const heroBottom = hero ? hero.offsetTop + hero.offsetHeight - header.offsetHeight : 400;
      const locked = document.body.classList.contains('is-locked');
      header.classList.toggle('is-compact', y > 8);
      if (!locked && !header.contains(document.activeElement)) header.classList.toggle('is-hidden', y > lastY && y > heroBottom);
      if (y < lastY || y < heroBottom) header.classList.remove('is-hidden');
      const probe = y + header.offsetHeight / 2;
      const dark = darkSections.some(section => probe >= section.offsetTop && probe < section.offsetTop + section.offsetHeight);
      header.classList.toggle('is-dark', dark);
      root.classList.toggle('header-dark', dark);
    }
    if (!reducedMotion && heroImage && y < window.innerHeight * 1.2) heroImage.style.setProperty('--parallax', (y * 0.06).toFixed(1) + 'px');
    if (!reducedMotion && words.length && manifesto) {
      const rect = manifesto.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.85 - rect.top) / (rect.height + window.innerHeight * 0.35)));
      const lit = Math.round(progress * words.length);
      words.forEach((word, index) => word.classList.toggle('is-lit', index < lit));
    }
    lastY = y;
  }
  const requestFrame = () => { if (!ticking) { ticking = true; window.requestAnimationFrame(onFrame); } };
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame, { passive: true });
  onFrame();

  /* Fine pointers only: nothing else follows the cursor (no custom cursor, no tilt) */
  if (!finePointer) root.classList.add('touch');
})();
