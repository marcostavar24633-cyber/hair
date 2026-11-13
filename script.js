const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
menuButton.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('.filter.active')?.classList.remove('active');
    button.classList.add('active');
    const filter = button.dataset.filter;
    document.querySelectorAll('.work-item').forEach(item => {
      item.hidden = filter !== 'all' && item.dataset.category !== filter;
    });
  });
});

const form = document.getElementById('bookingForm');
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const phone = String(data.get('phone') || '').trim();
  const message = form.querySelector('.form-message');
  if (name.length < 2 || phone.replace(/\D/g, '').length < 10) {
    message.textContent = 'Проверьте имя и номер телефона.';
    message.style.color = '#9a5146';
    return;
  }
  message.textContent = 'Спасибо! Это демо-форма: подключите сервис записи для приёма заявок.';
  message.style.color = '#54704c';
  form.reset();
});
