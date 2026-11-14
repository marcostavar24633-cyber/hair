const fs=require('node:fs');const assert=require('node:assert/strict');

function contrastRatio(foreground,background){const luminance=hex=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};const a=luminance(foreground),b=luminance(background);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)}
for(const background of ['#f5efe7','#e9ded1']){assert.ok(contrastRatio('#76574d',background)>=4.5,'Dark section labels and disclaimers must meet WCAG AA');}
for(const background of ['#f5efe7','#e9ded1']){assert.ok(contrastRatio('#6f6058',background)>=4.5,'Muted body text must meet WCAG AA on light surfaces');}
assert.ok(contrastRatio('#6f6058','#e9ded1')>=4.5,'Form status text must meet WCAG AA on sand background');
assert.ok(contrastRatio('#59263f','#f5efe7')>=3&&contrastRatio('#59263f','#e9ded1')>=3,'Light-surface keyboard focus indicators must meet 3:1');
for(const background of ['#25131f','#34202e','#59263f','#160c16'])assert.ok(contrastRatio('#e6d6c9',background)>=3,'Dark-surface keyboard focus indicators must meet 3:1');
const html=fs.readFileSync('index.html','utf8');const js=fs.readFileSync('script.js','utf8');const css=fs.readFileSync('styles.css','utf8');const readme=fs.readFileSync('README.md','utf8');const robots=fs.readFileSync('robots.txt','utf8');const sitemap=fs.readFileSync('sitemap.xml','utf8');
assert.match(html,/<html lang="ru">/);assert.ok(html.includes('<a class="skip-link" href="#main">Перейти к содержимому</a>'));assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.match(html,/HAIR STUDIO — эстетика волос в Ульяновске/);
for(const id of ['services','works','philosophy','team','contacts','booking','booking-form','comparison','calculator','lightbox'])assert.ok(html.includes('id="'+id+'"'),'Missing section '+id);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate HTML id');
const anchors=[...html.matchAll(/href="#([^"]+)"/g)].map(x=>x[1]);for(const id of anchors)assert.ok(ids.includes(id),'Broken anchor '+id);
assert.match(html,/type="application\/ld\+json"/);assert.match(html,/twitter:card/);assert.match(html,/rel="canonical"/);assert.match(html,/@type":"WebSite"/);assert.match(html,/og:image:alt/);assert.match(html,/twitter:image/);assert.match(html,/twitter:description/);
assert.match(html,/Демо-режим/);assert.match(html,/ул\. Демонстрационная, 15/);assert.match(html,/hello@hairstudio\.example/);assert.match(html,/демо-отзыв/);assert.match(html,/Смоделировать запись/);assert.match(html,/decoding="async"/);assert.match(html,/rel="preconnect" href="https:\/\/images\.pexels\.com"/);assert.match(html,/rel="preconnect" href="https:\/\/images\.unsplash\.com"/);assert.match(html,/fonts\.googleapis\.com[^"]*display=swap/);assert.match(html,/booking-summary/);assert.match(html,/booking-price/);assert.match(html,/модельный ориентир/);assert.match(html,/не отправляет данные/);
assert.match(js,/const restoreFocus=mobileMenu\.contains\(document\.activeElement\)/);assert.match(js,/if\(restoreFocus&&menuButton\.getClientRects\(\)\.length\)menuButton\.focus\(\)/);assert.match(js,/window\.innerWidth>720\)closeMenu\(\)/);assert.match(js,/mobileMenu\?\.addEventListener\('keydown'/);assert.match(js,/event\.shiftKey&&document\.activeElement===first/);
assert.match(js,/formatPhone/);assert.match(js,/form\.elements\.date/);assert.match(js,/form\.elements\.time/);assert.match(js,/время не забронировано/);assert.match(js,/updateBookingSummary/);assert.match(js,/demoPrices/);assert.match(js,/setSelectionRange/);assert.match(js,/aria-invalid/);assert.match(js,/function isBookingFieldValid\(field\)/);assert.match(js,/\['input','change'\]/);assert.match(js,/status\?\.dataset\.state==='error'/);assert.match(js,/updateCalculator/);assert.match(js,/compareRange/);assert.match(js,/function updateComparison\(\)/);assert.match(js,/aria-valuetext/);assert.match(js,/До: '\+value\+'%; после:/);assert.match(js,/syncComparisonImageWidth/);assert.match(js,/comparison\.clientWidth\+'px'/);assert.match(js,/resize',syncComparisonImageWidth/);assert.match(js,/closeLightbox/);assert.match(js,/previousFocus\?\.focus\(\)/);assert.match(js,/lightbox\?\.addEventListener\('keydown'/);assert.match(js,/event\.target===lightbox/);assert.match(js,/item\.setAttribute\('aria-pressed',String\(active\)\)/);assert.match(html,/id="lightbox" hidden role="dialog" aria-modal="true"/);assert.match(html,/id="portfolio-status" role="status" aria-live="polite"/);
assert.match(js,/IntersectionObserver/);assert.match(js,/prefers-reduced-motion/);assert.match(js,/requestAnimationFrame/);assert.match(js,/--scroll-progress/);
assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie/,'Form must not send or persist data');
assert.match(css,/body\.menu-open\{overflow:hidden\}/);
assert.match(css,/@media\(max-width:720px\)/);assert.match(css,/\.dark-eyebrow\{color:#76574d\}/);assert.match(css,/\.disclaimer\{[^}]*color:#76574d/);assert.match(css,/\.form-status\{[^}]*color:#6f6058/);assert.match(css,/@media\(max-width:390px\)/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/:focus-visible/);assert.match(css,/\.filter-button\{[^}]*min-width:44px;min-height:44px/);assert.match(css,/\.filter-button\{min-height:44px;padding:8px 13px\}/);assert.match(css,/@media\(max-width:720px\)\{[\s\S]*?\.header-book\{min-height:44px\}[\s\S]*?\.service-row>a\{width:44px;height:44px;min-width:44px;min-height:44px\}/);assert.match(css,/@media\(max-width:360px\)\{\.service-row\{grid-template-columns:22px minmax\(0,1fr\) 44px\}/);assert.match(css,/\.booking-form input:focus-visible,.booking-form select:focus-visible\{outline:2px solid var\(--aub\)/);assert.match(css,/\.comparison:focus-within\{outline:2px solid var\(--aub\);outline-offset:4px\}/);assert.match(css,/\.comparison:focus-within \.compare-handle\{box-shadow:/);assert.ok(css.includes('@media(max-width:360px)'));assert.ok(css.includes('@media(max-width:330px)'));assert.ok(css.includes('min-height:46px'));assert.match(css,/hero-image-enter/);assert.match(css,/js-reveal/);
assert.match(readme,/демонстрационный проект/i);assert.match(readme,/данные не отправляются, не хранятся и не передаются/);assert.match(readme,/полностью вымышленные демонстрационные данные/);assert.match(readme,/анимац/i);
assert.ok(robots.includes('User-agent: *'));assert.ok(robots.includes('Allow: /'));assert.ok(robots.includes('Sitemap: https://marcostavar24633-cyber.github.io/hair/sitemap.xml'));
assert.ok(sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));assert.ok(sitemap.includes('<loc>https://marcostavar24633-cyber.github.io/hair/</loc>'));
const imageTags=html.split('<img').slice(1).map(part=>part.split('>')[0]);assert.ok(imageTags.length>=1);for(const tag of imageTags){assert.ok(tag.includes('alt='),'Image missing alt attribute: '+tag);assert.ok(tag.includes('decoding="async"'),'Image missing async decoding: '+tag)}
assert.ok(html.includes('class="hero-image"'));assert.ok(html.includes('fetchpriority="high"'));assert.ok(html.includes('loading="lazy"'));
const canonical=html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];const ogUrl=html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];const sitemapUrl=sitemap.split('<loc>')[1]?.split('</loc>')[0];assert.ok(canonical);assert.equal(ogUrl,canonical,'og:url must match canonical');assert.equal(sitemapUrl,canonical,'sitemap URL must match canonical');
assert.ok(css.includes(':focus-visible'));assert.ok(css.includes(':focus-visible{outline-color:#59263f}'));assert.ok(css.includes('.lightbox :focus-visible{outline-color:#e6d6c9}'));assert.ok(css.includes('prefers-reduced-motion:reduce'));assert.ok(css.includes('max-width:330px'));assert.match(css,/@media\(max-width:390px\)\{\.concept-bar\{font-size:7px;letter-spacing:\.16em\}\.concept-bar span\{display:none\}\}/);assert.match(css,/@media\(max-width:720px\)\{[\s\S]*?\.filter-button\{min-height:44px\}/);


assert.match(html,/og:site_name/);assert.match(html,/twitter:image:alt/);

const responsiveImages=imageTags.filter(tag=>/src="https:\/\/images\.(?:unsplash|pexels)\.com\//.test(tag));
assert.ok(responsiveImages.length>=10,'Expected all remote content images to use responsive image candidates');
for(const tag of responsiveImages){assert.match(tag,/\bsrcset="[^"]+480w[^"]+800w[^"]+1200w/,'Responsive image candidates missing');assert.match(tag,/\bsizes="/,'Responsive image sizes missing');}

assert.doesNotMatch(html,/>\s+srcset=/,'Duplicate responsive attributes must not appear outside img tags');
assert.equal((html.match(/\bsrcset=/g)||[]).length,10,'Exactly ten responsive image srcsets expected');

const portfolioTags=imageTags.filter(tag=>tag.includes('src="https://images.unsplash.com/photo-1560066984-138dadb4c035')||tag.includes('src="https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1')||tag.includes('src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e'));
assert.ok(html.includes('sizes="(max-width: 720px) 88vw, (max-width: 1000px) 40vw, 40vw"'),'Featured portfolio card sizes should match its wide grid span');
assert.ok(html.includes('sizes="(max-width: 720px) 44vw, (max-width: 1000px) 30vw, 30vw"'),'Regular portfolio card sizes should match grid columns');
assert.ok(html.includes('sizes="(max-width: 720px) 88vw, 80vw"'),'Comparison images should use the content width, not full viewport width');

// Structural HTML and responsive-image regression checks.
const startTags=[...html.matchAll(/<([a-z][a-z0-9:-]*)\b([^<>]*?)>/gi)];
for(const match of startTags){
  const tagName=match[1].toLowerCase();
  const attributeText=match[2];
  const names=[...attributeText.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g)].map(item=>item[1].toLowerCase());
  assert.equal(new Set(names).size,names.length,'Duplicate attribute on <'+tagName+'>: '+names.join(', '));
}
for(const tag of imageTags.filter(item=>/\bsrc=/.test(item))){
  assert.match(tag,/\balt="[^"]*"/,'Content image must have an alt attribute');
  assert.match(tag,/\bdecoding="async"/,'Content image must opt into async decoding');
}
assert.equal(responsiveImages.length,10,'Every remote content image should be responsive');
for(const tag of responsiveImages){
  const candidates=[...tag.matchAll(/(https:\/\/[^,\s"]+)\s+(\d+)w/g)];
  assert.equal(candidates.length,3,'Each responsive image should expose three width candidates');
  for(const candidate of candidates){
    assert.ok(candidate[1].includes('w='+candidate[2]),'Image URL width must match its srcset descriptor');
  }
}
const heroTag=imageTags.find(tag=>tag.includes('class="hero-image"'));
assert.ok(heroTag,'Hero image must exist');
assert.match(heroTag,/fetchpriority="high"/,'Hero image should have high fetch priority');
assert.doesNotMatch(heroTag,/loading="lazy"/,'Hero image must not be lazy-loaded');
for(const tag of imageTags.filter(item=>!item.includes('class="hero-image"')&&/\bsrc="[^"]+"/.test(item))){
  assert.match(tag,/loading="lazy"/,'Below-the-fold images should be lazy-loaded');
}


// Accessibility structure regression checks.
const formMarkup=html.match(/<form\b[\s\S]*?<\/form>/i)?.[0]||'';
const labelBlocks=[...html.matchAll(/<label\b[^>]*>[\s\S]*?<\/label>/gi)].map(match=>match[0]);
const formControls=[...formMarkup.matchAll(/<(input|select|textarea)\b[^>]*>/gi)];
for(const control of formControls){
  assert.ok(labelBlocks.some(label=>label.includes(control[0])),'Every form control must be contained by a label: '+control[0]);
}
const buttonTags=[...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
for(const button of buttonTags){
  const hasLabel=/\baria-label="[^"]+"/.test(button[1]);
  const textContent=button[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  assert.ok(hasLabel||textContent.length>0,'Every button must have an accessible name: '+button[1]);
}
for(const nav of html.matchAll(/<nav\b([^>]*)>/gi)){
  assert.match(nav[1],/\baria-label="[^"]+"/,'Every navigation landmark must have an accessible label');
}
const ariaReferences=[...html.matchAll(/\b(?:aria-labelledby|aria-describedby|aria-controls)="([^"]+)"/g)].flatMap(match=>match[1].split(/\s+/));
for(const reference of ariaReferences){
  assert.ok(ids.includes(reference),'ARIA reference must resolve to an existing ID: '+reference);
}
