const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

menuButton?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
});

nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Открыть меню');
}));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav?.classList.contains('open')) {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Открыть меню');
    menuButton?.focus();
  }
});

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(filterButton => {
      const active = filterButton === button;
      filterButton.classList.toggle('active', active);
      filterButton.setAttribute('aria-pressed', String(active));
    });
    const filter = button.dataset.filter;
    document.querySelectorAll('.work-item').forEach(item => {
      item.hidden = filter !== 'all' && item.dataset.category !== filter;
    });
  });
});

// Accessible gallery lightbox with focus management.
const galleryItems = [...document.querySelectorAll('.work-item')];
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.id = 'galleryLightbox';
lightbox.hidden = true;
lightbox.setAttribute('role', 'dialog');
lightbox.setAttribute('aria-modal', 'true');
lightbox.setAttribute('aria-labelledby', 'lightboxCaption');
lightbox.innerHTML = '<button class="lightbox-close" type="button" aria-label="Закрыть просмотр">×</button>' +
  '<button class="lightbox-prev" type="button" aria-label="Предыдущее фото">‹</button>' +
  '<figure class="lightbox-figure"><img class="lightbox-image" alt="">' +
  '<figcaption class="lightbox-caption" id="lightboxCaption"></figcaption></figure>' +
  '<button class="lightbox-next" type="button" aria-label="Следующее фото">›</button>' +
  '<p class="lightbox-counter" aria-live="polite"></p>';
document.body.append(lightbox);

const pageElements = [...document.body.children].filter(element => element !== lightbox);
const previousInertStates = new Map();
let activeGalleryIndex = 0;
let previousFocus = null;

function visibleGalleryItems() {
  return galleryItems.filter(item => !item.hidden);
}

function setPageInert(isInert) {
  pageElements.forEach(element => {
    if (isInert) {
      previousInertStates.set(element, element.inert);
      element.inert = true;
    } else {
      element.inert = previousInertStates.get(element) || false;
    }
  });
  if (!isInert) previousInertStates.clear();
}

function showGalleryItem(index) {
  const items = visibleGalleryItems();
  if (!items.length) return;
  activeGalleryIndex = (index + items.length) % items.length;
  const item = items[activeGalleryIndex];
  const image = item.querySelector('.work-image');
  const imageStyle = getComputedStyle(image).backgroundImage;
  const imageUrl = imageStyle.match(/url\(["']?(.*?)["']?\)/)?.[1];
  const img = lightbox.querySelector('.lightbox-image');
  if (imageUrl) img.src = imageUrl;
  else img.removeAttribute('src');
  img.alt = item.querySelector('.work-label b')?.textContent || 'Пример причёски';
  lightbox.querySelector('.lightbox-caption').textContent = item.querySelector('.work-label b')?.textContent || '';
  lightbox.querySelector('.lightbox-counter').textContent = String(activeGalleryIndex + 1) + ' / ' + String(items.length);
}

function openLightbox(item) {
  const items = visibleGalleryItems();
  const index = items.indexOf(item);
  if (index < 0) return;
  previousFocus = document.activeElement;
  setPageInert(true);
  lightbox.hidden = false;
  document.body.classList.add('lightbox-open');
  showGalleryItem(index);
  lightbox.querySelector('.lightbox-close').focus();
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  document.body.classList.remove('lightbox-open');
  setPageInert(false);
  previousFocus?.focus();
}

galleryItems.forEach(item => {
  const image = item.querySelector('.work-image');
  image?.setAttribute('role', 'button');
  image?.setAttribute('tabindex', '0');
  image?.setAttribute('aria-haspopup', 'dialog');
  image?.setAttribute('aria-controls', 'galleryLightbox');
  image?.setAttribute('aria-label', 'Увеличить фото: ' + (item.querySelector('.work-label b')?.textContent || 'работа'));
  image?.addEventListener('click', () => openLightbox(item));
  image?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLightbox(item);
    }
  });
});

lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
lightbox.querySelector('.lightbox-prev').addEventListener('click', () => showGalleryItem(activeGalleryIndex - 1));
lightbox.querySelector('.lightbox-next').addEventListener('click', () => showGalleryItem(activeGalleryIndex + 1));
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', event => {
  if (lightbox.hidden) return;
  if (event.key === 'Escape') {
    closeLightbox();
    return;
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showGalleryItem(activeGalleryIndex + (event.key === 'ArrowRight' ? 1 : -1));
    return;
  }
  if (event.key === 'Tab') {
    const focusables = [...lightbox.querySelectorAll('button:not([disabled])')];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// Russian +7 phone formatting. No form data is sent anywhere.
const form = document.getElementById('bookingForm');
const nameInput = form?.querySelector('[name="name"]');
const phoneInput = form?.querySelector('[name="phone"]');
const serviceInput = form?.querySelector('[name="service"]');
const formMessage = form?.querySelector('.form-message');
const validatedFields = [nameInput, phoneInput, serviceInput].filter(Boolean);

function formatRussianPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits[0] === '8') digits = '7' + digits.slice(1);
  else if (digits[0] !== '7') digits = '7' + digits;
  digits = digits.slice(0, 11);

  const local = digits.slice(1);
  let formatted = '+7';
  if (local.length) formatted += ' (' + local.slice(0, 3);
  if (local.length >= 3) formatted += ')';
  if (local.length > 3) formatted += ' ' + local.slice(3, 6);
  if (local.length > 6) formatted += '-' + local.slice(6, 8);
  if (local.length > 8) formatted += '-' + local.slice(8, 10);
  return formatted;
}

function isValidRussianPhone(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('7');
}

function clearFormMessageWhenValid() {
  if (validatedFields.every(field => field.getAttribute('aria-invalid') !== 'true') && formMessage) {
    formMessage.textContent = '';
    delete formMessage.dataset.state;
  }
}

function clearFieldError(field) {
  field?.removeAttribute('aria-invalid');
  clearFormMessageWhenValid();
}

nameInput?.addEventListener('input', () => {
  if (nameInput.value.trim().length >= 2) clearFieldError(nameInput);
});

phoneInput?.addEventListener('input', () => {
  const oldValue = phoneInput.value;
  const selectionStart = phoneInput.selectionStart ?? oldValue.length;
  const digitsBeforeCaret = oldValue.slice(0, selectionStart).replace(/\D/g, '').length;
  const oldDigits = oldValue.replace(/\D/g, '');
  const addedCountryPrefix = oldDigits.length > 0 && oldDigits[0] !== '7' && oldDigits[0] !== '8' ? 1 : 0;
  const targetDigitCount = digitsBeforeCaret + (digitsBeforeCaret > 0 ? addedCountryPrefix : 0);
  const formatted = formatRussianPhone(oldValue);
  phoneInput.value = formatted;

  let caret = 0;
  let digitCount = 0;
  while (caret < formatted.length && digitCount < targetDigitCount) {
    if (/\d/.test(formatted[caret])) digitCount += 1;
    caret += 1;
  }
  phoneInput.setSelectionRange(caret, caret);

  if (isValidRussianPhone(formatted)) clearFieldError(phoneInput);
});

serviceInput?.addEventListener('change', () => {
  if (serviceInput.value) clearFieldError(serviceInput);
});

form?.addEventListener('submit', event => {
  event.preventDefault();
  const name = String(nameInput?.value || '').trim();
  const phone = String(phoneInput?.value || '').trim();
  const service = String(serviceInput?.value || '').trim();

  const validations = [
    { field: nameInput, valid: name.length >= 2, message: 'Введите имя не короче двух символов.' },
    { field: phoneInput, valid: isValidRussianPhone(phone), message: 'Проверьте номер: введите 10 цифр российского номера.' },
    { field: serviceInput, valid: Boolean(service), message: 'Выберите интересующую услугу.' }
  ];

  validatedFields.forEach(field => field.removeAttribute('aria-invalid'));
  const failed = validations.find(item => !item.valid);
  if (failed) {
    failed.field?.setAttribute('aria-invalid', 'true');
    if (formMessage) {
      formMessage.dataset.state = 'error';
      formMessage.textContent = failed.message;
    }
    failed.field?.focus();
    return;
  }

  form.reset();
  if (formMessage) {
    formMessage.dataset.state = 'success';
    formMessage.textContent = 'Это демонстрация: данные не отправлены. Для приёма заявок подключите сервис записи.';
  }
});

form?.addEventListener('reset', () => {
  validatedFields.forEach(field => field.removeAttribute('aria-invalid'));
});
