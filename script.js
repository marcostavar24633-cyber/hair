(() => {
document.documentElement.classList.add('js');
const fallbackSvg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#25131f"/><stop offset="1" stop-color="#76505d"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><circle cx="600" cy="330" r="170" fill="none" stroke="#d8b7a4" stroke-opacity=".35" stroke-width="2"/><text x="600" y="355" text-anchor="middle" fill="#f5efe7" font-family="Georgia,serif" font-size="62" letter-spacing="8">HAIR STUDIO</text><text x="600" y="430" text-anchor="middle" fill="#e6d6c9" font-family="Arial,sans-serif" font-size="22" letter-spacing="3">ИЗОБРАЖЕНИЕ ВРЕМЕННО НЕДОСТУПНО</text></svg>';
const fallbackImage='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(fallbackSvg);
document.addEventListener('error',event=>{
  const image=event.target;
  if(!(image instanceof HTMLImageElement)||image.dataset.fallbackApplied)return;
  image.dataset.fallbackApplied='true';
  image.removeAttribute('srcset');
  image.removeAttribute('sizes');
  image.src=fallbackImage;
  image.classList.add('image-fallback');
},true);
const menuButton=document.querySelector('.menu-button');
const mobileMenu=document.getElementById('mobile-menu');
function syncMobileMenuPosition(){if(!mobileMenu||mobileMenu.hidden)return;const header=menuButton?.closest('.site-header');if(header)mobileMenu.style.setProperty('--mobile-menu-top',header.getBoundingClientRect().bottom+'px')}
function closeMenu(){if(!mobileMenu||!menuButton)return;const restoreFocus=mobileMenu.contains(document.activeElement);mobileMenu.hidden=true;mobileMenu.style.removeProperty('--mobile-menu-top');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');document.body.classList.remove('menu-open');if(restoreFocus&&menuButton.getClientRects().length)menuButton.focus()}
menuButton?.addEventListener('click',()=>{if(!mobileMenu)return;const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');mobileMenu.hidden=!open;document.body.classList.toggle('menu-open',open);if(open){syncMobileMenuPosition();mobileMenu.querySelector('a')?.focus()}});
window.addEventListener('scroll',syncMobileMenuPosition,{passive:true});
mobileMenu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
mobileMenu?.addEventListener('keydown',event=>{
if(event.key!=='Tab'||mobileMenu.hidden)return;
const items=[...mobileMenu.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(item=>item.getClientRects().length);
if(!items.length)return;
const first=items[0],last=items[items.length-1];
if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
});
window.addEventListener('resize',()=>{if(window.innerWidth>720)closeMenu();else syncMobileMenuPosition()},{passive:true});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();closeLightbox()}});
document.addEventListener('click',event=>{if(mobileMenu&&!mobileMenu.hidden&&!mobileMenu.contains(event.target)&&!menuButton?.contains(event.target))closeMenu()});
const portfolioStatus=document.getElementById('portfolio-status');document.querySelectorAll('.filter-button').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.filter-button').forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active))});let visible=0;document.querySelectorAll('.portfolio-card').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.kind!==button.dataset.filter;if(!card.hidden)visible++});if(portfolioStatus)portfolioStatus.textContent='Показано изображений: '+visible+'. Фильтр: '+button.textContent.trim()+'.'}));
const comparison=document.getElementById('comparison');const compareRange=document.querySelector('.compare-range');const comparisonBeforeImage=comparison?.querySelector('.comparison-before img');function syncComparisonImageWidth(){if(comparison&&comparisonBeforeImage)comparisonBeforeImage.style.width=comparison.clientWidth+'px'}syncComparisonImageWidth();window.addEventListener('resize',syncComparisonImageWidth,{passive:true});
function updateComparison(){if(!comparison||!compareRange)return;const rawValue=Number(compareRange.value);const value=Number.isFinite(rawValue)?Math.min(100,Math.max(0,rawValue)):50;comparison.style.setProperty('--split',value+'%');compareRange.setAttribute('aria-valuetext','До: '+value+'%; после: '+(100-value)+'%')}compareRange?.addEventListener('input',updateComparison);updateComparison();
const calcService=document.getElementById('calc-service');const calcLength=document.getElementById('calc-length');const calcTotal=document.getElementById('calc-total');const lengthValue=document.getElementById('length-value');
function updateCalculator(){if(!calcService||!calcLength||!calcTotal||!lengthValue)return;const labels=['Короткая','Средняя','Длинная'];const factors=[1,1,1.35];const total=Math.round(Number(calcService.value)*factors[Number(calcLength.value)]/100)*100;calcTotal.textContent=new Intl.NumberFormat('ru-RU').format(total)+' ₽';lengthValue.textContent=labels[Number(calcLength.value)]}
calcService?.addEventListener('change',updateCalculator);calcLength?.addEventListener('input',updateCalculator);updateCalculator();
const lightbox=document.getElementById('lightbox');const lightboxImage=lightbox?.querySelector('img');const lightboxCaption=lightbox?.querySelector('p');let previousFocus=null;let previousBodyOverflow='';
function openLightbox(card){if(!lightbox||!lightboxImage)return;previousFocus=document.activeElement;previousBodyOverflow=document.body.style.overflow;delete lightboxImage.dataset.fallbackApplied;lightboxImage.classList.remove('image-fallback');const image=card.dataset.image;const alt=card.querySelector('img')?.alt||'Визуальный референс';lightboxImage.src=image;lightboxImage.alt=alt;if(lightboxCaption)lightboxCaption.textContent=card.querySelector('span')?.textContent||'';lightbox.hidden=false;document.body.style.overflow='hidden';lightbox.querySelector('button')?.focus()}
function closeLightbox(){if(!lightbox||lightbox.hidden)return;lightbox.hidden=true;lightboxImage?.removeAttribute('src');document.body.style.overflow=previousBodyOverflow;previousFocus?.focus()}
lightbox?.addEventListener('focusin',event=>{if(!lightbox.hidden&&!lightbox.contains(event.target))lightbox.querySelector('button')?.focus()});
document.querySelectorAll('.portfolio-card').forEach(card=>card.addEventListener('click',()=>openLightbox(card)));
lightbox?.querySelector('button')?.addEventListener('click',closeLightbox);lightbox?.addEventListener('click',event=>{if(event.target===lightbox)closeLightbox()});
lightbox?.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const controls=[...lightbox.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(element=>!element.disabled);if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});
const form=document.getElementById('bookingForm');const status=form?.querySelector('.form-status');
form?.addEventListener('submit',event=>{
  event.preventDefault();
  const requiredFields=[form.elements.service,form.elements.date,form.elements.time];
  const invalid=requiredFields.find(field=>!field.value);
  requiredFields.forEach(field=>field.removeAttribute('aria-invalid'));
  if(invalid){
    invalid.setAttribute('aria-invalid','true');
    status.dataset.state='error';
    status.textContent='Выберите услугу, демонстрационный день и время.';
    invalid.focus();
    return;
  }
  status.dataset.state='info';
  status.textContent='Демонстрационный сценарий просмотрен: '+form.elements.service.value+', '+form.elements.date.value.toLowerCase()+', '+form.elements.time.value+'. Никакие данные не отправлены и не сохранены; реальная запись не создана.';
});
form?.querySelector('button[type="submit"]')?.removeAttribute('disabled');
form?.querySelectorAll('select').forEach(field=>field.addEventListener('change',()=>{
  if(field.getAttribute('aria-invalid')==='true'&&field.value){
    field.removeAttribute('aria-invalid');
    if(status?.dataset.state==='error'){status.textContent='';delete status.dataset.state}
  }
}));
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
