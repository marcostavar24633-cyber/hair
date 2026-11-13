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

// Accessible gallery lightbox. The existing gallery photos remain the source of truth.
const galleryItems = [...document.querySelectorAll('.work-item')];
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.hidden = true;
lightbox.setAttribute('role', 'dialog');
lightbox.setAttribute('aria-modal', 'true');
lightbox.setAttribute('aria-label', 'Просмотр работы');
lightbox.innerHTML = `
  <button class="lightbox-close" type="button" aria-label="Закрыть просмотр">×</button>
  <button class="lightbox-prev" type="button" aria-label="Предыдущее фото">‹</button>
  <figure class="lightbox-figure">
    <img class="lightbox-image" alt="">
    <figcaption class="lightbox-caption"></figcaption>
  </figure>
  <button class="lightbox-next" type="button" aria-label="Следующее фото">›</button>
  <p class="lightbox-counter" aria-live="polite"></p>
`;
document.body.append(lightbox);

let activeGalleryIndex = 0;
let previousFocus = null;

function visibleGalleryItems() {
  return galleryItems.filter(item => !item.hidden);
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
  img.src = imageUrl || '';
  img.alt = item.querySelector('.work-label b')?.textContent || 'Пример причёски';
  lightbox.querySelector('.lightbox-caption').textContent =
    item.querySelector('.work-label b')?.textContent || '';
  lightbox.querySelector('.lightbox-counter').textContent =
    `${activeGalleryIndex + 1} / ${items.length}`;
}

function openLightbox(index) {
  previousFocus = document.activeElement;
  lightbox.hidden = false;
  document.body.classList.add('lightbox-open');
  showGalleryItem(index);
  lightbox.querySelector('.lightbox-close').focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.classList.remove('lightbox-open');
  previousFocus?.focus();
}

galleryItems.forEach((item, index) => {
  const image = item.querySelector('.work-image');
  image?.setAttribute('role', 'button');
  image?.setAttribute('tabindex', '0');
  image?.setAttribute('aria-label', `Увеличить фото: ${item.querySelector('.work-label b')?.textContent || 'работа'}`);
  image?.addEventListener('click', () => openLightbox(index));
  image?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLightbox(index);
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
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') showGalleryItem(activeGalleryIndex - 1);
  if (event.key === 'ArrowRight') showGalleryItem(activeGalleryIndex + 1);
});

const form = document.getElementById('bookingForm');
form?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const phone = String(data.get('phone') || '').trim();
  const service = String(data.get('service') || '').trim();
  const message = form.querySelector('.form-message');
  if (name.length < 2 || phone.replace(/\D/g, '').length < 10 || !service) {
    message.textContent = 'Проверьте имя, телефон и выбранную услугу.';
    message.style.color = '#9a5146';
    return;
  }
  message.textContent = 'Спасибо! Это демо-форма: подключите сервис записи для приёма заявок.';
  message.style.color = '#54704c';
  form.reset();
});
