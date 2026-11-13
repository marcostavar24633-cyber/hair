(() => {
const menuButton=document.querySelector('.menu-button');
const mobileMenu=document.getElementById('mobile-menu');
function closeMenu(){if(!mobileMenu||!menuButton)return;const restoreFocus=mobileMenu.contains(document.activeElement);mobileMenu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');document.body.classList.remove('menu-open');if(restoreFocus&&menuButton.getClientRects().length)menuButton.focus()}
menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');mobileMenu.hidden=!open;document.body.classList.toggle('menu-open',open);if(open)mobileMenu.querySelector('a')?.focus()});
mobileMenu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
window.addEventListener('resize',()=>{if(window.innerWidth>720)closeMenu()},{passive:true});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();closeLightbox()}});
document.addEventListener('click',event=>{if(mobileMenu&&!mobileMenu.hidden&&!mobileMenu.contains(event.target)&&!menuButton?.contains(event.target))closeMenu()});
document.querySelectorAll('.filter-button').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.filter-button').forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active))});document.querySelectorAll('.portfolio-card').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.kind!==button.dataset.filter})}));
const comparison=document.getElementById('comparison');const compareRange=document.querySelector('.compare-range');const comparisonBeforeImage=comparison?.querySelector('.comparison-before img');function syncComparisonImageWidth(){if(comparison&&comparisonBeforeImage)comparisonBeforeImage.style.width=comparison.clientWidth+'px'}syncComparisonImageWidth();window.addEventListener('resize',syncComparisonImageWidth,{passive:true});
compareRange?.addEventListener('input',()=>{comparison.style.setProperty('--split',compareRange.value+'%')});
const calcService=document.getElementById('calc-service');const calcLength=document.getElementById('calc-length');const calcTotal=document.getElementById('calc-total');const lengthValue=document.getElementById('length-value');
function updateCalculator(){if(!calcService||!calcLength||!calcTotal)return;const labels=['Короткая','Средняя','Длинная'];const factors=[1,1,1.35];const total=Math.round(Number(calcService.value)*factors[Number(calcLength.value)]/100)*100;calcTotal.textContent=new Intl.NumberFormat('ru-RU').format(total)+' ₽';lengthValue.textContent=labels[Number(calcLength.value)]}
calcService?.addEventListener('change',updateCalculator);calcLength?.addEventListener('input',updateCalculator);updateCalculator();
const lightbox=document.getElementById('lightbox');const lightboxImage=lightbox?.querySelector('img');const lightboxCaption=lightbox?.querySelector('p');let previousFocus=null;
function openLightbox(card){previousFocus=document.activeElement;const image=card.dataset.image;const alt=card.querySelector('img')?.alt||'Визуальный референс';lightboxImage.src=image;lightboxImage.alt=alt;lightboxCaption.textContent=card.querySelector('span')?.textContent||'';lightbox.hidden=false;document.body.style.overflow='hidden';lightbox.querySelector('button').focus()}
function closeLightbox(){if(!lightbox||lightbox.hidden)return;lightbox.hidden=true;lightboxImage.removeAttribute('src');document.body.style.overflow='';previousFocus?.focus()}
document.querySelectorAll('.portfolio-card').forEach(card=>card.addEventListener('click',()=>openLightbox(card)));
lightbox?.querySelector('button')?.addEventListener('click',closeLightbox);lightbox?.addEventListener('click',event=>{if(event.target===lightbox)closeLightbox()});
lightbox?.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const controls=[...lightbox.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(element=>!element.disabled);if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});
const form=document.getElementById('bookingForm');const phone=form?.querySelector('[name=phone]');const status=form?.querySelector('.form-status');
function formatPhone(value){let digits=value.replace(/\D/g,'');if(!digits)return'';if(digits[0]==='8')digits='7'+digits.slice(1);else if(digits[0]!=='7')digits='7'+digits;digits=digits.slice(0,11);const local=digits.slice(1);let out='+7';if(local.length)out+=' ('+local.slice(0,3);if(local.length>=3)out+=')';if(local.length>3)out+=' '+local.slice(3,6);if(local.length>6)out+='-'+local.slice(6,8);if(local.length>8)out+='-'+local.slice(8,10);return out}
phone?.addEventListener('input',()=>{const before=phone.value;const pos=phone.selectionStart??before.length;const digitsBefore=before.slice(0,pos).replace(/\D/g,'').length;const formatted=formatPhone(before);phone.value=formatted;let caret=0,count=0;while(caret<formatted.length&&count<digitsBefore){if(/\d/.test(formatted[caret]))count++;caret++}phone.setSelectionRange(caret,caret);if(phone.value.replace(/\D/g,'').length===11)phone.removeAttribute('aria-invalid')});
form?.addEventListener('submit',event=>{event.preventDefault();const name=form.elements.name.value.trim();const digits=phone.value.replace(/\D/g,'');const service=form.elements.service.value;const date=form.elements.date.value;const time=form.elements.time.value;const invalid=[{field:form.elements.name,ok:name.length>=2,message:'Введите имя — не менее двух символов.'},{field:phone,ok:digits.length===11&&digits.startsWith('7'),message:'Введите корректный российский номер.'},{field:form.elements.service,ok:Boolean(service),message:'Выберите направление.'},{field:form.elements.date,ok:Boolean(date),message:'Выберите демонстрационный день.'},{field:form.elements.time,ok:Boolean(time),message:'Выберите демонстрационное время.'}].find(item=>!item.ok);form.querySelectorAll('[aria-invalid=true]').forEach(field=>field.removeAttribute('aria-invalid'));if(invalid){invalid.field.setAttribute('aria-invalid','true');status.dataset.state='error';status.textContent=invalid.message;invalid.field.focus();return}status.dataset.state='info';status.textContent='Сценарий пройден: '+service+', '+date.toLowerCase()+', '+time+'. Это только демонстрация — время не забронировано, данные не отправлены и не сохранены.';});
form?.querySelectorAll('input,select').forEach(field=>field.addEventListener('input',()=>{if(field.getAttribute('aria-invalid')==='true')field.removeAttribute('aria-invalid')}));
const bookingPrice=document.getElementById('booking-price');const bookingSummaryText=document.getElementById('booking-summary-text');
const demoPrices={'Стрижка':'от 2 200 ₽','Окрашивание':'от 4 600 ₽','Сложная техника':'от 8 000 ₽','Тонирование':'от 2 500 ₽','Укладка':'от 2 300 ₽','Уход':'от 3 000 ₽','Консультация':'бесплатно · демо'};
function updateBookingSummary(){if(!form||!bookingPrice||!bookingSummaryText)return;const chosenService=form.elements.service.value;const chosenDate=form.elements.date.value;const chosenTime=form.elements.time.value;bookingPrice.textContent=chosenService?(demoPrices[chosenService]||'уточняется'):'Выберите услугу';const details=[chosenService,chosenDate,chosenTime].filter(Boolean);bookingSummaryText.textContent=details.length?'Вы выбрали: '+details.join(' · ')+'. Все значения демонстрационные.':'Здесь появятся детали вашей демонстрационной записи.'}
form?.querySelectorAll('select').forEach(field=>field.addEventListener('change',updateBookingSummary));updateBookingSummary();

})();

/* Scroll reveals and reading progress: native browser APIs only */
(() => {
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets=[
    '.statement-grid > *','.section-title','.service-row','.visual-break-caption',
    '.portfolio-card','.comparison','.process-grid article','.calculator-copy',
    '.calculator-panel','.team-grid article','.reviews-row > *','.review-placeholder',
    '.faq-list details','.final-cta > *','.booking-section > *'
  ].flatMap(selector=>Array.from(document.querySelectorAll(selector)));
  const uniqueTargets=[...new Set(revealTargets)];
  if(reducedMotion||!('IntersectionObserver' in window)){
    uniqueTargets.forEach(element=>element.classList.add('is-visible'));
  }else{
    const observer=new IntersectionObserver((entries,instance)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('is-visible');instance.unobserve(entry.target)}
      });
    },{threshold:.12,rootMargin:'0px 0px -36px 0px'});
    uniqueTargets.forEach((element,index)=>{
      element.classList.add('js-reveal');
      const group=element.parentElement;
      const siblings=group?Array.from(group.children).filter(child=>child.matches(selectorForReveal(child))):[];
      const position=Math.max(0,siblings.indexOf(element));
      element.style.setProperty('--reveal-delay',Math.min(position*75,300)+'ms');
      observer.observe(element);
    });
  }
  let ticking=false;
  const updateProgress=()=>{
    const scrollable=document.documentElement.scrollHeight-window.innerHeight;
    const progress=scrollable>0?Math.min(1,Math.max(0,window.scrollY/scrollable)):0;
    document.body.style.setProperty('--scroll-progress',String(progress));
    ticking=false;
  };
  const onScroll=()=>{if(!ticking){window.requestAnimationFrame(updateProgress);ticking=true}};
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',updateProgress,{passive:true});
  updateProgress();
  function selectorForReveal(element){
    return ['.service-row','.portfolio-card','.process-grid article','.team-grid article','.faq-list details'].find(selector=>element.matches(selector))||'*';
  }
})();
