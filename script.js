/* HAIR STUDIO — interactions. Native browser APIs only; nothing is sent or stored. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const formatRub = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';

  /* Self-contained fallback for remote images that fail to load */
  const fallbackSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#211a15"/><path d="M520 560V330a80 80 0 0 1 160 0v230" fill="none" stroke="#e0a57d" stroke-opacity=".6" stroke-width="3"/><text x="600" y="640" text-anchor="middle" fill="#efe7dc" font-family="Georgia,serif" font-size="40" letter-spacing="6">HAIR STUDIO</text><text x="600" y="690" text-anchor="middle" fill="#c9bcae" font-family="Arial,sans-serif" font-size="20" letter-spacing="3">ИЗОБРАЖЕНИЕ ВРЕМЕННО НЕДОСТУПНО</text></svg>';
  const fallbackImage = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(fallbackSvg);
  document.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied) return;
    image.dataset.fallbackApplied = 'true';
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.src = fallbackImage;
    image.classList.add('image-fallback');
  }, true);
  /* Images that failed before this script ran (e.g. the high-priority hero) */
  document.querySelectorAll('img').forEach(image => {
    if (image.complete && image.naturalWidth === 0 && !image.src.startsWith('data:')) image.dispatchEvent(new Event('error'));
  });

  /* Header state */
  const header = $('.site-header');
  const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);

  /* Mobile menu */
  const menuButton = $('.menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  function syncMobileMenuPosition() {
    if (!mobileMenu || mobileMenu.hidden || !header) return;
    mobileMenu.style.setProperty('--mobile-menu-top', header.getBoundingClientRect().bottom + 'px');
  }
  function closeMenu() {
    if (!mobileMenu || !menuButton || mobileMenu.hidden) return;
    const restoreFocus = mobileMenu.contains(document.activeElement);
    mobileMenu.hidden = true;
    mobileMenu.style.removeProperty('--mobile-menu-top');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
    document.body.classList.remove('menu-open');
    if (restoreFocus && menuButton.getClientRects().length) menuButton.focus();
  }
  menuButton?.addEventListener('click', () => {
    if (!mobileMenu) return;
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    if (!open) { closeMenu(); return; }
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Закрыть меню');
    mobileMenu.hidden = false;
    document.body.classList.add('menu-open');
    syncMobileMenuPosition();
    $('a', mobileMenu)?.focus();
  });
  $$('a', mobileMenu || document.createElement('div')).forEach(link => link.addEventListener('click', closeMenu));
  mobileMenu?.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || mobileMenu.hidden) return;
    const items = $$('a[href],button:not([disabled])', mobileMenu).filter(item => item.getClientRects().length);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 960) closeMenu(); else syncMobileMenuPosition(); }, { passive: true });
  document.addEventListener('click', event => {
    if (mobileMenu && !mobileMenu.hidden && !mobileMenu.contains(event.target) && !menuButton?.contains(event.target)) closeMenu();
  });

  /* Tones: hero swatches + colour atlas share one state */
  const tones = {
    blonde: { index: '01 / 06', name: 'Холодный блонд', text: 'Светлые оттенки с пепельным или жемчужным нюансом. Обычно требуют осветления, поэтому начинаются с честной диагностики исходной базы и состояния длины.', technique: 'Осветление и тонирование', care: 'Тонирование раз в 4–6 недель — ориентир концепта', service: 8000 },
    honey: { index: '02 / 06', name: 'Мёд', text: 'Тёплое золотистое свечение без резкой желтизны. Часто выбирают, когда хочется освежить русый или светло-каштановый цвет и добавить волосам света.', technique: 'Мягкие переходы, тонирование', care: 'Тонирование раз в 6–8 недель — ориентир концепта', service: 8000 },
    copper: { index: '03 / 06', name: 'Медь', text: 'Рыжие и медные нюансы — самый выразительный тёплый цвет. Пигмент вымывается быстрее других, поэтому яркость поддерживают тонированием и бережным уходом.', technique: 'Окрашивание в один тон или мягкий переход', care: 'Тонирование раз в 4–6 недель — ориентир концепта', service: 4600 },
    caramel: { index: '04 / 06', name: 'Карамель', text: 'Золотисто-коричневый оттенок между тёплым русым и каштаном. Хорошо работает в технике мягких переходов и спокойно отрастает.', technique: 'Мягкие переходы, многомерный цвет', care: 'Обновление цвета раз в 8–10 недель — ориентир концепта', service: 8000 },
    chestnut: { index: '05 / 06', name: 'Каштан', text: 'Глубокий натуральный коричневый с тёплым или нейтральным нюансом. Подходит, когда нужен спокойный цвет с блеском без радикальных перемен.', technique: 'Окрашивание в один тон', care: 'Обновление корней раз в 6–8 недель — ориентир концепта', service: 4600 },
    espresso: { index: '06 / 06', name: 'Эспрессо', text: 'Самый тёмный оттенок атласа: насыщенный, почти чёрный, с мягким коричневым подтоном и зеркальным блеском.', technique: 'Окрашивание в один тон, тонирование', care: 'Тонирование для блеска раз в 6–8 недель — ориентир концепта', service: 4600 }
  };
  const atlasTabs = $$('.atlas-tab');
  const atlasPanel = document.getElementById('tone-panel');
  const atlasInfo = $('.atlas-info');
  const toneCalc = document.getElementById('tone-calc');
  const setText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
  function setTone(tone, { focusTab = false } = {}) {
    const data = tones[tone];
    if (!data) return;
    document.documentElement.dataset.tone = tone;
    $$('.swatch').forEach(swatch => swatch.setAttribute('aria-pressed', String(swatch.dataset.tone === tone)));
    atlasTabs.forEach(tab => {
      const active = tab.dataset.tone === tone;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active) { atlasPanel?.setAttribute('aria-labelledby', tab.id); if (focusTab) tab.focus(); }
    });
    if (atlasPanel) atlasPanel.dataset.tone = tone;
    setText('tone-index', data.index);
    setText('tone-name', data.name);
    setText('tone-text', data.text);
    setText('tone-technique', data.technique);
    setText('tone-care', data.care);
    setText('tone-price', 'от ' + formatRub(data.service));
    if (toneCalc) toneCalc.dataset.service = String(data.service);
    if (atlasInfo && !reducedMotion) {
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
  setTone('honey');

  /* Services: sticky visual follows the hovered / focused row */
  const serviceVisuals = $$('.service-visual');
  $$('.service-row').forEach(row => {
    const activate = () => serviceVisuals.forEach(image => image.classList.toggle('is-active', image.dataset.visual === row.dataset.visual));
    row.addEventListener('pointerenter', activate);
    row.addEventListener('focusin', activate);
  });

  /* Portfolio filter */
  const portfolioStatus = document.getElementById('portfolio-status');
  $$('.filter-button').forEach(button => button.addEventListener('click', () => {
    $$('.filter-button').forEach(item => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    let visible = 0;
    $$('.portfolio-card').forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.kind !== button.dataset.filter;
      if (!card.hidden) visible++;
    });
    if (portfolioStatus) portfolioStatus.textContent = 'Показано изображений: ' + visible + '. Фильтр: ' + button.textContent.trim() + '.';
  }));

  /* Before / after comparison */
  const comparison = document.getElementById('comparison');
  const compareRange = $('.compare-range');
  const syncComparisonWidth = () => { if (comparison) comparison.style.setProperty('--compare-width', comparison.clientWidth + 'px'); };
  function updateComparison() {
    if (!comparison || !compareRange) return;
    const rawValue = Number(compareRange.value);
    const value = Number.isFinite(rawValue) ? Math.min(100, Math.max(0, rawValue)) : 50;
    comparison.style.setProperty('--split', value + '%');
    compareRange.setAttribute('aria-valuetext', 'Референс A: ' + value + '%; референс B: ' + (100 - value) + '%');
  }
  compareRange?.addEventListener('input', updateComparison);
  window.addEventListener('resize', syncComparisonWidth, { passive: true });
  syncComparisonWidth();
  updateComparison();

  /* Calculator */
  const calcService = document.getElementById('calc-service');
  const calcLength = document.getElementById('calc-length');
  const calcTotal = document.getElementById('calc-total');
  const lengthValue = document.getElementById('length-value');
  const calcBreakdown = document.getElementById('calc-breakdown');
  function updateCalculator() {
    if (!calcService || !calcLength || !calcTotal || !lengthValue) return;
    const labels = ['Короткая', 'Средняя', 'Длинная'];
    const factors = [1, 1, 1.35];
    const step = Math.min(2, Math.max(0, Number(calcLength.value) || 0));
    const base = Number(calcService.value);
    const total = Math.round(base * factors[step] / 100) * 100;
    calcTotal.textContent = formatRub(total);
    lengthValue.textContent = labels[step];
    calcLength.setAttribute('aria-valuetext', labels[step] + ' длина');
    if (calcBreakdown) calcBreakdown.textContent = 'База ' + formatRub(base) + ' × коэффициент длины ' + new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1 }).format(factors[step]) + '. Не является публичной офертой.';
  }
  calcService?.addEventListener('change', updateCalculator);
  calcLength?.addEventListener('input', updateCalculator);
  updateCalculator();
  toneCalc?.addEventListener('click', () => {
    if (!calcService) return;
    calcService.value = toneCalc.dataset.service || calcService.value;
    updateCalculator();
  });

  /* Reviews slider */
  const reviewsTrack = $('.reviews-track');
  $$('[data-scroll]').forEach(button => button.addEventListener('click', () => {
    if (!reviewsTrack) return;
    const card = $('.review', reviewsTrack);
    const distance = (card ? card.getBoundingClientRect().width + 20 : 320) * Number(button.dataset.scroll);
    reviewsTrack.scrollBy({ left: distance, behavior: reducedMotion ? 'auto' : 'smooth' });
  }));

  /* Lightbox */
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = $('img', lightbox || document.createElement('div'));
  const lightboxCaption = $('.lightbox-caption', lightbox || document.createElement('div'));
  const blankImage = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
  let previousFocus = null;
  let previousBodyOverflow = '';
  function openLightbox(card) {
    if (!lightbox || !lightboxImage) return;
    previousFocus = document.activeElement;
    previousBodyOverflow = document.body.style.overflow;
    delete lightboxImage.dataset.fallbackApplied;
    lightboxImage.classList.remove('image-fallback');
    lightboxImage.src = card.dataset.image;
    lightboxImage.alt = $('img', card)?.alt || 'Визуальный референс';
    if (lightboxCaption) lightboxCaption.textContent = $('.card-caption', card)?.textContent || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    $('button', lightbox)?.focus();
  }
  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    if (lightboxImage) lightboxImage.src = blankImage;
    document.body.style.overflow = previousBodyOverflow;
    previousFocus?.focus();
  }
  $$('.portfolio-card').forEach(card => card.addEventListener('click', () => openLightbox(card)));
  $('button', lightbox || document.createElement('div'))?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
  lightbox?.addEventListener('keydown', event => { if (event.key === 'Tab') { event.preventDefault(); $('button', lightbox)?.focus(); } });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); closeLightbox(); } });

  /* Demo booking: selection only, no personal data, nothing sent */
  const form = document.getElementById('bookingForm');
  const status = $('.form-status[role="status"]', form || document.createElement('div'));
  const bookingPrice = document.getElementById('booking-price');
  const bookingSummaryText = document.getElementById('booking-summary-text');
  const demoPrices = { 'Стрижка': 'от 2 200 ₽', 'Окрашивание': 'от 4 600 ₽', 'Сложная техника': 'от 8 000 ₽', 'Тонирование': 'от 2 500 ₽', 'Укладка': 'от 2 300 ₽', 'Уход': 'от 3 000 ₽', 'Консультация': 'бесплатно · демо' };
  function updateBookingSummary() {
    if (!form || !bookingPrice || !bookingSummaryText) return;
    const chosen = [form.elements.service.value, form.elements.date.value, form.elements.time.value].filter(Boolean);
    bookingPrice.textContent = form.elements.service.value ? (demoPrices[form.elements.service.value] || 'уточняется') : 'Выберите услугу';
    bookingSummaryText.textContent = chosen.length ? 'Вы выбрали: ' + chosen.join(' · ') + '. Все значения демонстрационные.' : 'Здесь появятся детали демонстрационного сценария.';
  }
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!status) return;
    const fields = [form.elements.service, form.elements.date, form.elements.time];
    fields.forEach(field => field.removeAttribute('aria-invalid'));
    const invalid = fields.find(field => !field.value);
    if (invalid) {
      invalid.setAttribute('aria-invalid', 'true');
      status.dataset.state = 'error';
      status.textContent = 'Выберите услугу, демонстрационный день и время.';
      invalid.focus();
      return;
    }
    status.dataset.state = 'info';
    status.textContent = 'Демонстрационный сценарий просмотрен: ' + form.elements.service.value + ', ' + form.elements.date.value.toLowerCase() + ', ' + form.elements.time.value + '. Никакие данные не отправлены и не сохранены; реальная запись не создана.';
  });
  $$('select', form || document.createElement('div')).forEach(field => field.addEventListener('change', () => {
    if (field.getAttribute('aria-invalid') === 'true' && field.value) {
      field.removeAttribute('aria-invalid');
      if (status?.dataset.state === 'error') { status.textContent = ''; delete status.dataset.state; }
    }
    updateBookingSummary();
  }));
  updateBookingSummary();
  $('button[type="submit"]', form || document.createElement('div'))?.removeAttribute('disabled');

  /* Mobile CTA hides while the booking section is on screen */
  const mobileCta = $('.mobile-cta');
  const bookingSection = document.getElementById('booking');
  if (mobileCta && bookingSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => entries.forEach(entry => mobileCta.classList.toggle('is-hidden', entry.isIntersecting)), { threshold: 0.05 }).observe(bookingSection);
  }

  /* Magnetic buttons (precise pointers only) */
  if (finePointer && !reducedMotion) {
    $$('.magnetic').forEach(element => {
      element.addEventListener('pointermove', event => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.22;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.3;
        element.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      element.addEventListener('pointerleave', () => { element.style.transform = ''; });
    });
  }

  /* Manifesto: words light up as the paragraph scrolls through the viewport */
  const manifesto = $('[data-words]');
  let words = [];
  if (manifesto && !reducedMotion) {
    const text = manifesto.textContent.trim();
    manifesto.textContent = '';
    text.split(/\s+/).forEach((word, index) => {
      if (index) manifesto.append(' ');
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      manifesto.append(span);
    });
    words = $$('.word', manifesto);
  }

  /* Scroll reveals */
  const revealTargets = [...new Set($$('.section-head > *, .service-row, .atlas-panel, .portfolio-card, .comparison, .process-list li, .calculator-copy, .calculator-panel, .team-card, .review, .faq-list details, .booking-copy, .booking-form-wrap, .manifesto-sign'))];
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(element => element.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); instance.unobserve(entry.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(element => {
      element.classList.add('js-reveal');
      const siblings = element.parentElement ? Array.from(element.parentElement.children) : [];
      element.style.setProperty('--reveal-delay', Math.min(Math.max(0, siblings.indexOf(element)) * 70, 280) + 'ms');
      observer.observe(element);
    });
  }

  /* Scroll-linked effects in one rAF loop */
  const heroImage = $('.hero-image');
  const processList = $('.process-list');
  let ticking = false;
  function onFrame() {
    ticking = false;
    const viewport = window.innerHeight;
    const scrollable = document.documentElement.scrollHeight - viewport;
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    document.body.style.setProperty('--scroll-progress', String(progress));
    syncHeader();
    if (reducedMotion) return;
    if (heroImage && window.scrollY < viewport * 1.2) heroImage.style.setProperty('--parallax', (window.scrollY * 0.08).toFixed(1) + 'px');
    if (processList) {
      const rect = processList.getBoundingClientRect();
      const value = Math.min(1, Math.max(0, (viewport * 0.85 - rect.top) / (rect.height + viewport * 0.4)));
      processList.style.setProperty('--process', value.toFixed(3));
    }
    if (words.length && manifesto) {
      const rect = manifesto.getBoundingClientRect();
      const visible = Math.min(1, Math.max(0, (viewport * 0.85 - rect.top) / (rect.height + viewport * 0.35)));
      const lit = visible * words.length;
      words.forEach((word, index) => word.classList.toggle('is-lit', index < lit));
    }
  }
  const requestFrame = () => { if (!ticking) { ticking = true; window.requestAnimationFrame(onFrame); } };
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame, { passive: true });
  onFrame();
})();
