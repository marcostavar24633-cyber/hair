(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const fallbackSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#21131d"/><stop offset="1" stop-color="#805069"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><circle cx="600" cy="330" r="170" fill="none" stroke="#d8b99b" stroke-opacity=".45" stroke-width="2"/><text x="600" y="355" text-anchor="middle" fill="#fbf8f3" font-family="Georgia,serif" font-size="62" letter-spacing="8">HAIR ATELIER</text><text x="600" y="430" text-anchor="middle" fill="#e6d9cc" font-family="Arial,sans-serif" font-size="22" letter-spacing="3">EDITORIAL REFERENCE</text></svg>';
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

  const menu = document.getElementById('site-menu');
  const menuButton = document.querySelector('.menu-trigger');
  const menuClose = document.querySelector('.menu-close');
  const menuBackdrop = document.getElementById('menu-backdrop');
  let menuReturnFocus = null;

  function openMenu() {
    if (!menu || !menuButton || menu.classList.contains('is-open')) return;
    menuReturnFocus = document.activeElement;
    menu.classList.add('is-open');
    void menu.offsetWidth;
    menu.setAttribute('aria-hidden', 'false');
    menu.inert = false;
    menu.removeAttribute('inert');
    menuBackdrop.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Закрыть меню');
    document.body.classList.add('menu-open');
    window.setTimeout(() => {
      (menu.querySelector('.menu-close') || menu.querySelector('a,button'))?.focus({ preventScroll: true });
    }, 50);
  }

  function closeMenu(restoreFocus = true) {
    if (!menu || !menuButton || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menu.inert = true;
    menuBackdrop.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
    document.body.classList.remove('menu-open');
    if (restoreFocus) menuReturnFocus?.focus();
  }

  menuButton?.addEventListener('click', () => {
    if (menuButton.getAttribute('aria-expanded') === 'true') closeMenu();
    else openMenu();
  });
  menuClose?.addEventListener('click', () => closeMenu());
  menuBackdrop?.addEventListener('click', () => closeMenu());
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu(false)));
  menu?.querySelectorAll('.menu-branch, .menu-subbranch').forEach(button => {
    button.addEventListener('click', () => {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      button.querySelector('i').textContent = expanded ? '＋' : '−';
      if (panel) panel.hidden = expanded;
    });
  });

  const consultation = document.getElementById('consultation');
  const dialog = consultation?.querySelector('.consultation-dialog');
  const dialogClose = consultation?.querySelector('.dialog-close');
  const steps = [...(consultation?.querySelectorAll('.quiz-step') || [])];
  const nextButton = consultation?.querySelector('.dialog-next');
  const backButton = consultation?.querySelector('.dialog-back');
  const finishButton = consultation?.querySelector('.dialog-finish');
  const stepCounter = document.getElementById('step-counter');
  const progress = document.getElementById('quiz-progress');
  const resultTitle = document.getElementById('result-title');
  const resultDetail = document.getElementById('result-detail');
  const resultCopy = document.getElementById('result-copy');
  let activeStep = 0;
  let selectedNeed = '';
  let selectedPace = '';
  let dialogReturnFocus = null;
  

  const recommendations = {
    shape: { title: 'Форма и движение', detail: 'Обсудите стрижку и силуэт, которые поддерживают естественную текстуру и не требуют сложной ежедневной укладки.', service: 'Форма и стрижка' },
    colour: { title: 'Цвет и глубина', detail: 'Начните с истории окрашивания, желаемого оттенка и оценки состояния длины. Это поможет определить бережный сценарий изменения цвета.', service: 'Окрашивание и тонирование' },
    care: { title: 'Уход и баланс', detail: 'Сфокусируйтесь на ощущении длины, привычках ухода и задачах, которые действительно важны именно вашим волосам.', service: 'Уход за волосами' },
    style: { title: 'Укладка и образ', detail: 'Подберите форму укладки под событие и привычный ритм — от естественной текстуры до более выразительного объёма.', service: 'Укладка и стайлинг' }
  };

  function selectedChoice(step) {
    return step?.querySelector('.choice.is-selected')?.dataset.answer || '';
  }

  function renderStep(index) {
    activeStep = Math.max(0, Math.min(2, index));
    steps.forEach((step, position) => { step.hidden = position !== activeStep; });
    if (stepCounter) stepCounter.textContent = String(activeStep + 1).padStart(2, '0') + ' / 03';
    if (progress) progress.style.width = ((activeStep + 1) / 3 * 100) + '%';
    if (backButton) backButton.disabled = activeStep === 0;
    if (nextButton) {
      nextButton.hidden = activeStep === 2;
      nextButton.disabled = activeStep === 0 ? !selectedNeed : !selectedPace;
      nextButton.textContent = activeStep === 1 ? 'Показать результат →' : 'Продолжить →';
    }
    const controls = consultation?.querySelector('.dialog-controls');
    if (controls) controls.hidden = activeStep === 2;
    if (activeStep === 2) finishButton?.focus();
    else (steps[activeStep]?.querySelector('.choice.is-selected') || steps[activeStep]?.querySelector('.choice'))?.focus();
  }

  function selectChoice(button) {
    const group = button.closest('.quiz-step');
    group?.querySelectorAll('.choice').forEach(item => {
      const active = item === button;
      item.classList.toggle('is-selected', active);
      item.setAttribute('aria-pressed', String(active));
    });
    if (activeStep === 0) selectedNeed = button.dataset.answer;
    if (activeStep === 1) selectedPace = button.dataset.answer;
    if (nextButton) nextButton.disabled = activeStep === 0 ? !selectedNeed : !selectedPace;
  }

  function showRecommendation() {
    const recommendation = recommendations[selectedNeed] || recommendations.shape;
    const paceText = selectedPace === 'low'
      ? 'Учитывайте минимальный уход и простую укладку.'
      : selectedPace === 'high'
        ? 'Можно рассмотреть более выразительную форму или сложную технику, если состояние волос это позволяет.'
        : 'Выбирайте баланс выразительности и удобства в повседневной жизни.';
    resultTitle.textContent = recommendation.title;
    resultDetail.textContent = recommendation.detail + ' ' + paceText;
    resultCopy.textContent = 'Первое направление для разговора — «' + recommendation.service + '». Это ориентир для консультации, а не персональное профессиональное заключение.';
    renderStep(2);
  }

  function openConsultation(need = '') {
    if (!consultation || !dialog) return;
    const activeElement = document.activeElement;
    dialogReturnFocus = menu?.contains(activeElement) ? menuButton : activeElement;
    closeMenu(false);
    activeStep = 0;
    selectedNeed = '';
    selectedPace = '';
    consultation.querySelectorAll('.choice').forEach(button => {
      button.classList.remove('is-selected');
      button.setAttribute('aria-pressed', 'false');
    });
    if (need) {
      const choice = consultation.querySelector('[data-step="0"] [data-answer="' + need + '"]');
      if (choice) selectChoice(choice);
    }
    consultation.hidden = false;
    document.body.classList.add('dialog-open');
    renderStep(0);
    (consultation.querySelector('.choice.is-selected') || consultation.querySelector('.choice'))?.focus();
  }

  function closeConsultation() {
    if (!consultation || consultation.hidden) return;
    consultation.hidden = true;
    document.body.classList.remove('dialog-open');
    dialogReturnFocus?.focus();
  }

  document.querySelectorAll('[data-open-consultation]').forEach(button => button.addEventListener('click', () => openConsultation()));
  document.querySelectorAll('[data-service]').forEach(button => button.addEventListener('click', () => {
    const mapping = { cut: 'shape', colour: 'colour', care: 'care', style: 'style' };
    openConsultation(mapping[button.dataset.service] || '');
  }));
  consultation?.querySelectorAll('.choice').forEach(button => button.addEventListener('click', () => selectChoice(button)));
  nextButton?.addEventListener('click', () => {
    if (activeStep === 0 && selectedNeed) renderStep(1);
    else if (activeStep === 1 && selectedPace) showRecommendation();
  });
  backButton?.addEventListener('click', () => renderStep(activeStep - 1));
  dialogClose?.addEventListener('click', closeConsultation);
  finishButton?.addEventListener('click', closeConsultation);
  consultation?.addEventListener('click', event => { if (event.target === consultation) closeConsultation(); });

  const focusable = container => [...container.querySelectorAll('button:not([disabled]):not([hidden]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.closest('[hidden]') && element.getClientRects().length);
  function trapFocus(event, container) {
    if (event.key !== 'Tab') return;
    const items = focusable(container);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeConsultation();
      closeMenu();
      closeLightbox();
    }
    if (consultation && !consultation.hidden) trapFocus(event, dialog);
    if (menu?.classList.contains('is-open')) trapFocus(event, menu);
    if (lightbox && !lightbox.hidden) trapFocus(event, lightbox);
  });

  const filterButtons = [...document.querySelectorAll('.filter-chip')];
  const lookbookItems = [...document.querySelectorAll('.lookbook-item')];
  filterButtons.forEach(button => button.addEventListener('click', () => {
    filterButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    lookbookItems.forEach(item => {
      item.hidden = button.dataset.filter !== 'all' && item.dataset.category !== button.dataset.filter;
    });
  }));

  const lightbox = document.getElementById('lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const lightboxCaption = lightbox?.querySelector('p');
  const lightboxClose = lightbox?.querySelector('.lightbox-close');
  let lightboxReturnFocus = null;
  let bodyOverflowBeforeLightbox = '';

  function openLightbox(item) {
    if (!lightbox || !lightboxImage) return;
    lightboxReturnFocus = document.activeElement;
    bodyOverflowBeforeLightbox = document.body.style.overflow;
    delete lightboxImage.dataset.fallbackApplied;
    lightboxImage.classList.remove('image-fallback');
    lightboxImage.src = item.dataset.image;
    lightboxImage.alt = item.querySelector('img')?.alt || 'Визуальный референс';
    if (lightboxCaption) lightboxCaption.textContent = item.dataset.caption || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightboxClose?.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    lightboxImage?.removeAttribute('src');
    document.body.style.overflow = bodyOverflowBeforeLightbox;
    lightboxReturnFocus?.focus();
  }

  lookbookItems.forEach(item => item.addEventListener('click', () => openLightbox(item)));
  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });

  const revealSelectors = ['.philosophy-grid > *', '.section-heading', '.service-card', '.interlude-copy', '.lookbook-item', '.approach-head', '.steps article', '.estimate-copy', '.estimate-card', '.faq-list details'];
  const revealItems = [...new Set(revealSelectors.flatMap(selector => [...document.querySelectorAll(selector)]))];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(item => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealItems.forEach((item, index) => {
      item.classList.add('js-reveal');
      item.style.setProperty('--reveal-delay', Math.min((index % 4) * 70, 210) + 'ms');
      observer.observe(item);
    });
  }

  let progressFrame = false;
  function updateScrollProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const value = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    document.body.style.setProperty('--scroll-progress', String(value));
    progressFrame = false;
  }
  window.addEventListener('scroll', () => {
    if (!progressFrame) {
      window.requestAnimationFrame(updateScrollProgress);
      progressFrame = true;
    }
  }, { passive: true });
  window.addEventListener('resize', updateScrollProgress, { passive: true });
  updateScrollProgress();
})();