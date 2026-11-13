const fs=require('node:fs');const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');const js=fs.readFileSync('script.js','utf8');const css=fs.readFileSync('styles.css','utf8');const readme=fs.readFileSync('README.md','utf8');
assert.match(html,/<html lang="ru">/);assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.match(html,/HAIR STUDIO — эстетика волос в Ульяновске/);
for(const id of ['services','works','philosophy','team','contacts','booking','booking-form','comparison','calculator','lightbox'])assert.ok(html.includes('id="'+id+'"'),'Missing section '+id);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate HTML id');
const anchors=[...html.matchAll(/href="#([^"]+)"/g)].map(x=>x[1]);for(const id of anchors)assert.ok(ids.includes(id),'Broken anchor '+id);
assert.match(html,/type="application\/ld\+json"/);assert.match(html,/twitter:card/);assert.match(html,/rel="canonical"/);
assert.match(html,/Демо-режим/);assert.match(html,/ул\. Демонстрационная, 15/);assert.match(html,/hello@hairstudio\.example/);assert.match(html,/демо-отзыв/);assert.match(html,/Смоделировать запись/);assert.match(html,/decoding="async"/);assert.match(html,/booking-summary/);assert.match(html,/booking-price/);assert.match(html,/модельный ориентир/);assert.match(html,/не отправляет данные/);
assert.match(js,/const restoreFocus=mobileMenu\.contains\(document\.activeElement\)/);assert.match(js,/if\(restoreFocus\)menuButton\.focus\(\)/);
assert.match(js,/formatPhone/);assert.match(js,/form\.elements\.date/);assert.match(js,/form\.elements\.time/);assert.match(js,/время не забронировано/);assert.match(js,/updateBookingSummary/);assert.match(js,/demoPrices/);assert.match(js,/setSelectionRange/);assert.match(js,/aria-invalid/);assert.match(js,/updateCalculator/);assert.match(js,/compareRange/);assert.match(js,/syncComparisonImageWidth/);assert.match(js,/comparison\.clientWidth\+'px'/);assert.match(js,/resize',syncComparisonImageWidth/);assert.match(js,/closeLightbox/);
assert.match(js,/IntersectionObserver/);assert.match(js,/prefers-reduced-motion/);assert.match(js,/requestAnimationFrame/);assert.match(js,/--scroll-progress/);
assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie/,'Form must not send or persist data');
assert.match(css,/body\.menu-open\{overflow:hidden\}/);
assert.match(css,/@media\(max-width:720px\)/);assert.match(css,/@media\(max-width:390px\)/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/:focus-visible/);assert.ok(css.includes('@media(max-width:360px)'));assert.ok(css.includes('@media(max-width:330px)'));assert.ok(css.includes('min-height:46px'));assert.match(css,/hero-image-enter/);assert.match(css,/js-reveal/);
assert.match(readme,/демонстрационный проект/i);assert.match(readme,/данные не отправляются, не хранятся и не передаются/);assert.match(readme,/полностью вымышленные демонстрационные данные/);assert.match(readme,/анимац/i);

const imageTags=html.split('<img').slice(1).map(part=>part.split('>')[0]);
assert.ok(imageTags.length>=10,'Expected image-rich layout');
for(const tag of imageTags){assert.ok(tag.includes('alt="'),'Every image needs alt text');assert.ok(tag.includes('decoding="async"'),'Images should decode asynchronously')}
assert.equal((html.match(/fetchpriority="high"/g)||[]).length,1,'Only hero image should be high priority');
assert.ok(js.includes("lightbox?.addEventListener('keydown'"));assert.ok(js.includes('event.shiftKey'));
assert.ok(!readme.includes(String.fromCharCode(92)+'n'),'README should use actual line breaks');
console.log('HAIR STUDIO quality checks passed.');
