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
assert.match(html,/type="application\/ld\+json"/);
const seoTitle=html.match(/<title>([^<]+)<\/title>/)?.[1]||'';
const seoDescription=html.match(/<meta name="description" content="([^"]+)"/)?.[1]||'';
assert.ok(seoTitle.length>=30&&seoTitle.length<=60,'SEO title should remain concise and descriptive');
assert.ok(seoDescription.length>=70&&seoDescription.length<=160,'SEO description should remain within a useful snippet length');
const jsonLd=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]||'null');
assert.equal(jsonLd['@type'],'WebSite','Demo site must use accurate WebSite structured data');
const seoCanonical=html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]||'';
assert.equal(jsonLd.url,seoCanonical,'Structured-data URL must match the canonical page URL');
assert.equal(jsonLd.inLanguage,'ru-RU','Structured data must declare the page language');
assert.match(jsonLd.description,/вымышленный демонстрационный дизайн-концепт/i,'Structured data must clearly identify the project as a fictional demo');
assert.match(jsonLd.description,/не является реальным салоном/i,'Structured data must not imply that this demo is a real salon');
assert.ok(robots.includes('User-agent: *')&&robots.includes('Allow: /'),'Robots policy must allow public crawling');
assert.ok(robots.includes('Sitemap: https://marcostavar24633-cyber.github.io/hair/sitemap.xml'),'Robots policy must advertise the canonical sitemap');
assert.ok(sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'),'Sitemap must use the standard XML sitemap namespace');
const sitemapLocations=sitemap.split('<loc>').slice(1).map(entry=>entry.split('</loc>')[0]);
assert.deepEqual(sitemapLocations,[seoCanonical],'The one-page demo sitemap must contain exactly its canonical URL');

assert.doesNotMatch(JSON.stringify(jsonLd),/LocalBusiness|HairSalon|BeautySalon/,'Demo must not claim to be a real local business');assert.match(html,/twitter:card/);assert.match(html,/rel="canonical"/);assert.match(html,/@type":"WebSite"/);assert.match(html,/og:image:alt/);assert.match(html,/twitter:image/);assert.match(html,/twitter:description/);
assert.match(html,/Демо-режим/);assert.match(html,/ул\. Демонстрационная, 15/);assert.match(html,/hello@hairstudio\.example/);assert.match(html,/демо-отзыв/);assert.match(html,/Посмотреть демо/);assert.match(html,/decoding="async"/);assert.match(html,/rel="preconnect" href="https:\/\/images\.pexels\.com"/);assert.match(html,/rel="preconnect" href="https:\/\/images\.unsplash\.com"/);assert.match(html,/fonts\.googleapis\.com[^"]*display=swap/);assert.match(html,/booking-summary/);assert.match(html,/booking-price/);assert.match(html,/модельный ориентир/);assert.match(html,/не отправляет данные/);
assert.match(js,/const restoreFocus=mobileMenu\.contains\(document\.activeElement\)/);
assert.match(js,/function syncMobileMenuPosition\(\)[\s\S]*?header\.getBoundingClientRect\(\)\.bottom/,'Mobile menu must align with the sticky header position');
assert.match(js,/mobileMenu\.style\.removeProperty\('--mobile-menu-top'\)/,'Closing mobile menu must clear its measured offset');
assert.match(css,/\.mobile-menu\{inset:var\(--mobile-menu-top,97px\) 0 0\}/,'Mobile menu offset must be driven by the live header position');assert.match(js,/if\(restoreFocus&&menuButton\.getClientRects\(\)\.length\)menuButton\.focus\(\)/);assert.match(js,/window\.innerWidth>720\)closeMenu\(\)/);assert.match(js,/mobileMenu\?\.addEventListener\('keydown'/);assert.match(js,/event\.shiftKey&&document\.activeElement===first/);
assert.match(js,/form\.elements\.date/);assert.match(js,/form\.elements\.time/);assert.match(js,/реальная запись не создана/);assert.match(js,/updateBookingSummary/);assert.match(js,/demoPrices/);assert.match(js,/aria-invalid/);assert.match(js,/status\?\.dataset\.state==='error'/);assert.doesNotMatch(js,/formatPhone|setSelectionRange|form\.elements\.name|\[name=phone\]/,'Demo booking flow must not request or process personal contact details');assert.match(js,/updateCalculator/);assert.match(js,/compareRange/);assert.match(js,/function updateComparison\(\)/);assert.match(js,/aria-valuetext/);assert.match(js,/До: '\+value\+'%; после:/);assert.match(js,/syncComparisonImageWidth/);assert.match(js,/comparison\.clientWidth\+'px'/);assert.match(js,/resize',syncComparisonImageWidth/);assert.match(js,/closeLightbox/);assert.match(js,/previousFocus\?\.focus\(\)/);assert.match(js,/lightbox\?\.addEventListener\('keydown'/);assert.match(js,/event\.target===lightbox/);assert.match(js,/item\.setAttribute\('aria-pressed',String\(active\)\)/);assert.match(html,/id="lightbox" hidden role="dialog" aria-modal="true"/);assert.match(html,/id="portfolio-status" role="status" aria-live="polite"/);
assert.match(js,/IntersectionObserver/);assert.match(js,/prefers-reduced-motion/);assert.match(js,/requestAnimationFrame/);assert.match(js,/--scroll-progress/);
assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie/,'Form must not send or persist data');
assert.match(css,/body\.menu-open\{overflow:hidden\}/);
assert.match(css,/@media\(max-width:720px\)/);assert.match(css,/\.dark-eyebrow\{color:#76574d\}/);assert.match(css,/\.disclaimer\{[^}]*color:#76574d/);assert.match(css,/\.form-status\{[^}]*color:#6f6058/);assert.match(css,/@media\(max-width:390px\)/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/:focus-visible/);assert.match(css,/\.filter-button\{[^}]*min-width:44px;min-height:44px/);assert.match(css,/\.filter-button\{min-height:44px;padding:8px 13px\}/);assert.match(css,/@media\(max-width:720px\)\{[\s\S]*?\.header-book\{min-height:44px\}[\s\S]*?\.service-row>a\{width:44px;height:44px;min-width:44px;min-height:44px\}/);assert.match(css,/@media\(max-width:360px\)\{\.service-row\{grid-template-columns:22px minmax\(0,1fr\) 44px\}/);assert.match(css,/\.booking-form input:focus-visible,.booking-form select:focus-visible\{outline:2px solid var\(--aub\)/);assert.match(css,/\.comparison:focus-within\{outline:2px solid var\(--aub\);outline-offset:4px\}/);assert.match(css,/\.comparison:focus-within \.compare-handle\{box-shadow:/);assert.ok(css.includes('@media(max-width:360px)'));assert.ok(css.includes('@media(max-width:330px)'));assert.ok(css.includes('min-height:46px'));assert.match(css,/hero-image-enter/);assert.match(css,/js-reveal/);
assert.match(css,/\.service-row\{transition:opacity \.65s cubic-bezier\(\.2,\.7,\.2,1\) var\(--reveal-delay,0ms\),transform \.65s cubic-bezier\(\.2,\.7,\.2,1\) var\(--reveal-delay,0ms\),padding \.25s,background-color \.25s\}/,'Service rows must preserve reveal transitions and stagger delay without delaying hover padding');
assert.match(readme,/демонстрационный проект/i);assert.match(readme,/данные не отправляются, не хранятся и не передаются/);assert.match(readme,/полностью вымышленные демонстрационные данные/);assert.match(readme,/анимац/i);
assert.ok(robots.includes('User-agent: *'));assert.ok(robots.includes('Allow: /'));assert.ok(robots.includes('Sitemap: https://marcostavar24633-cyber.github.io/hair/sitemap.xml'));
assert.ok(sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));assert.ok(sitemap.includes('<loc>https://marcostavar24633-cyber.github.io/hair/</loc>'));
const imageTags=html.split('<img').slice(1).map(part=>part.split('>')[0]);assert.ok(imageTags.length>=1);for(const tag of imageTags){assert.ok(tag.includes('alt='),'Image missing alt attribute: '+tag);assert.ok(tag.includes('decoding="async"'),'Image missing async decoding: '+tag)}
assert.ok(html.includes('class="hero-image"'));assert.ok(html.includes('fetchpriority="high"'));assert.ok(html.includes('loading="lazy"'));
const canonical=html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];const ogUrl=html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];const sitemapUrl=sitemap.split('<loc>')[1]?.split('</loc>')[0];assert.ok(canonical);assert.equal(ogUrl,canonical,'og:url must match canonical');assert.equal(sitemapUrl,canonical,'sitemap URL must match canonical');
assert.ok(css.includes(':focus-visible'));assert.ok(css.includes(':focus-visible{outline-color:#59263f}'));assert.ok(css.includes('.lightbox :focus-visible{outline-color:#e6d6c9}'));assert.ok(css.includes('prefers-reduced-motion:reduce'));assert.ok(css.includes('max-width:330px'));assert.match(css,/@media\(max-width:390px\)\{\.concept-bar\{font-size:7px;letter-spacing:\.16em\}\.concept-bar span\{display:none\}\}/);assert.match(css,/@media\(max-width:720px\)\{[\s\S]*?\.filter-button\{min-height:44px\}/);



const countMatches=(source,pattern)=>(source.match(pattern)||[]).length;
assert.equal(countMatches(html,/<link rel="canonical"/g),1,'The document must declare exactly one canonical URL');
assert.equal(countMatches(html,/<meta name="description"/g),1,'The document must declare exactly one meta description');
assert.equal(countMatches(html,/<title>/g),1,'The document must declare exactly one title');
const metaContent=(property)=>html.match(new RegExp('<meta (?:property|name)="'+property+'" content="([^"]+)"'))?.[1]||'';
const canonicalUrl=html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]||'';
const ogImage=metaContent('og:image');
assert.ok(/^https:\/\//.test(canonicalUrl),'Canonical URL must be absolute HTTPS');
assert.equal(metaContent('og:type'),'website','Open Graph type must describe a website');
assert.equal(metaContent('og:locale'),'ru_RU','Open Graph locale must match the Russian-language site');
assert.ok(metaContent('og:site_name')&&metaContent('og:title')&&metaContent('og:description'),'Open Graph title, description and site name must be present');
assert.ok(/^https:\/\//.test(ogImage),'Open Graph preview image must be an absolute HTTPS URL');
assert.ok(metaContent('og:image:alt'),'Open Graph image must have descriptive alternative text');
assert.equal(metaContent('og:url'),canonicalUrl,'Open Graph URL must match canonical URL');
assert.equal(metaContent('twitter:card'),'summary_large_image','Twitter card must use a large image preview');
assert.ok(metaContent('twitter:title')&&metaContent('twitter:description')&&metaContent('twitter:image:alt'),'Twitter preview must include title, description and image alternative text');
assert.equal(metaContent('twitter:image'),ogImage,'Twitter and Open Graph previews must use the same image');
assert.doesNotMatch(html,/<meta name="robots" content="[^"]*noindex/i,'Published portfolio demo must remain indexable');
assert.match(html,/rel="icon"[^>]+href="favicon\.svg"/,'A favicon must be available for browser tabs and bookmarks');
assert.equal(countMatches(html,/<h1\b/g),1,'The page must have exactly one primary heading');
assert.ok(sitemap.includes(canonicalUrl),'Sitemap must contain the canonical page URL');

const headingLevels=[...html.matchAll(/<h([1-6])\b/gi)].map(match=>Number(match[1]));
assert.equal(headingLevels.filter(level=>level===1).length,1,'Use exactly one H1');
for(let index=1;index<headingLevels.length;index++){
  assert.ok(headingLevels[index]<=headingLevels[index-1]+1,'Heading levels must not skip a level');
}
for(const photo of ['photo-1580618672591-eb180b1a973f','photo-1595152772835-219674b2a8a6','photo-1551836022-d5d88e9218df']){
  const image=html.match(new RegExp('<img\\b(?=[^>]*'+photo+')[^>]*>'))?.[0]||'';
  assert.ok(image.includes('sizes="(max-width: 720px) 46vw, 30vw"'),'Team image sizes must match the two-column mobile and three-column desktop layout');
}
assert.match(html,/og:site_name/);assert.match(html,/twitter:image:alt/);
assert.ok(js.includes("document.addEventListener('error'")&&js.includes('image.dataset.fallbackApplied'),'Failed remote images must receive a one-time local fallback');
assert.ok(js.includes('data:image/svg+xml'),'Image fallback must be self-contained and must not depend on another external host');
assert.ok(js.includes("image.removeAttribute('srcset')"),'Fallback must remove remote responsive candidates to prevent retry loops');
assert.ok(css.includes('.image-fallback{')&&css.includes('object-fit:contain'),'Fallback image should use contained rendering and preserve its composition');

assert.ok(js.includes("document.documentElement.classList.add('js')"),'Enhancement state must be added only after JavaScript starts');
assert.ok(html.includes('<noscript><p class="form-status">Интерактивная демонстрационная форма требует JavaScript.'),'No-script users must be told why the demo form is unavailable');
assert.ok(css.includes('html:not(.js) .mobile-menu[hidden]{display:block'),'Mobile navigation must remain visible without JavaScript');
assert.ok(css.includes('html:not(.js) .booking-form button[type="submit"]{display:none}'),'The demo form must not submit personal data when JavaScript is unavailable');
assert.ok(css.includes('--serif:"Playfair Display",Georgia,serif')&&css.includes('--sans:"DM Sans",Arial,sans-serif'),'Typography must have local system font fallbacks if Google Fonts fail');

assert.ok(js.includes("lightbox?.addEventListener('focusin'"),'Lightbox must keep keyboard focus inside the modal');
assert.ok(js.includes('delete lightboxImage.dataset.fallbackApplied'),'Each newly opened lightbox image must be eligible for its own one-time fallback');
assert.ok(js.includes("lightboxImage.classList.remove('image-fallback')"),'A previous image fallback style must not leak into the next lightbox image');
assert.ok(js.includes("if(!mobileMenu)return;const open="),'The mobile-menu toggle must safely no-op if its controlled panel is absent');
assert.ok(js.includes("Number.isFinite(rawValue)?Math.min(100,Math.max(0,rawValue)):50"),'Comparison input must be clamped to a finite percentage');
assert.ok(js.includes("!calcTotal||!lengthValue"),'Calculator updates must guard all required output elements');
assert.ok(js.includes("function openLightbox(card){if(!lightbox||!lightboxImage)return;"),'Portfolio cards must not throw if the lightbox markup is unavailable');
assert.ok(js.includes("lightbox.querySelector('button')?.focus()"),'Lightbox focus must tolerate a missing close control');

assert.ok(js.includes("previousBodyOverflow=document.body.style.overflow"),'Lightbox must remember the previous scroll-lock style');
assert.ok(js.includes("document.body.style.overflow=previousBodyOverflow"),'Closing the lightbox must restore the previous scroll-lock style');
assert.ok(js.includes("if(event.key==='Escape'){closeMenu();closeLightbox()}"),'Escape must close open overlays');
assert.match(html,/<meta name="viewport" content="width=device-width,initial-scale=1">/,'Viewport must allow user zoom without a restrictive maximum-scale');
assert.ok(css.includes(':focus-visible{outline:2px solid var(--bronze);outline-offset:4px}'),'Keyboard users must have a visible focus indicator');
assert.ok(css.includes('.site-header :focus-visible')&&css.includes('.lightbox :focus-visible'),'Focus indicators must remain visible on dark surfaces');
const appScripts=[...html.matchAll(/<script\b([^>]*)src="([^"]+)"([^>]*)>/g)];
assert.equal(appScripts.length,1,'The landing should load only one local application script');
assert.match(appScripts[0][0],/\bdefer\b/,'The local application script must be deferred so HTML parsing is not blocked');
assert.doesNotMatch(css,/@import\s/i,'Stylesheets must not introduce render-blocking CSS imports');
assert.equal(html.split('fonts.googleapis.com/css2?').length-1,1,'Web fonts should be requested through one consolidated stylesheet');

const fontStylesheet=html.match(/<link href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)" rel="stylesheet">/)?.[1]||'';
assert.ok(fontStylesheet.includes('family=DM+Sans:wght@400;500;600;700'),'DM Sans must load the four weights used by the design');
assert.ok(fontStylesheet.includes('family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500'),'Playfair Display must load the regular and italic weights used by headings');
assert.ok(fontStylesheet.includes('display=swap'),'Web fonts must not block text rendering');
assert.match(html,/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>/,'Google font files should use a crossorigin preconnect');

assert.match(html,/<link rel="preload" as="image" fetchpriority="high" imagesrcset="[^"]+480w[^"]+800w[^"]+1200w" imagesizes="\(max-width: 720px\) 90vw, 45vw">/,"Hero image should have a responsive high-priority preload matching its rendered sizes");

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
const heroPreload=html.match(/<link rel="preload" as="image"[^>]*>/)?.[0]||'';
const getAttribute=(tag,name)=>{const key=name+'="';const index=tag.indexOf(key);return index<0?undefined:tag.slice(index+key.length).split('"')[0]};
assert.equal(getAttribute(heroPreload,'imagesrcset'),getAttribute(heroTag,'srcset'),'Hero preload candidates must exactly match the rendered image srcset to avoid duplicate downloads');
assert.equal(getAttribute(heroPreload,'imagesizes'),getAttribute(heroTag,'sizes'),'Hero preload sizes must exactly match the rendered image sizes');
assert.equal(getAttribute(heroPreload,'fetchpriority'),'high','Hero preload must retain high fetch priority');
assert.ok(heroTag,'Hero image must exist');
assert.match(heroTag,/fetchpriority="high"/,'Hero image should have high fetch priority');
assert.doesNotMatch(heroTag,/loading="lazy"/,'Hero image must not be lazy-loaded');

assert.equal(imageTags.filter(tag=>/fetchpriority="high"/.test(tag)).length,1,'Only the primary hero image element should receive high fetch priority');
assert.ok(css.includes('.hero-art{position:relative;min-height:560px'),'Hero image container must reserve vertical space before image load');
assert.ok(css.includes('.visual-break{height:min(680px,75vw);min-height:420px'),'Editorial image section must reserve vertical space before image load');
assert.ok(css.includes('.portfolio-card img{display:block;width:100%;height:340px'),'Portfolio image cards must reserve image height');
assert.ok(css.includes('.team-grid article img{width:100%;height:360px'),'Team portraits must reserve image height');
assert.ok(css.includes('.comparison{position:relative;height:clamp(300px,48vw,570px)'),'Comparison component must reserve image height');

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


// Security and privacy regression checks.
for(const token of ['innerHTML','outerHTML','insertAdjacentHTML','document.write','eval(','new Function']){
  assert.ok(!js.includes(token),'Avoid unsafe DOM or dynamic-code sink: '+token);
}
for(const token of ['localStorage','sessionStorage','document.cookie','fetch(','XMLHttpRequest','sendBeacon']){
  assert.ok(!js.includes(token),'The demo must not store or transmit visitor data: '+token);
}
assert.ok(!html.toLowerCase().includes('javascript:'),'HTML must not contain javascript: URLs');
assert.ok(!html.includes('href="http://')&&!html.includes('src="http://'),'External HTML resources must use HTTPS');
assert.ok(!html.includes('target="_blank"'),'No new-tab links should be introduced without an explicit safe rel policy');
const demoImageUrls=[...html.matchAll(/data-image="([^"]+)"/g)].map(match=>match[1]);
assert.ok(demoImageUrls.length>0,'Portfolio lightbox images must remain explicitly declared in HTML');
for(const url of demoImageUrls)assert.ok(url.startsWith('https://images.unsplash.com/'),'Lightbox image URLs must use the trusted HTTPS image host');
assert.ok(formMarkup.includes('type="submit" disabled'),'Demo form submit control must be disabled until its JavaScript handler is ready');assert.doesNotMatch(formMarkup,/name="(?:name|phone|email)"|type="(?:tel|email)"/i,'Demo form must not collect personal contact details');assert.equal((formMarkup.match(/<select\\b/g)||[]).length,3,'Demo form must contain only service, date and time selectors');
assert.ok(js.includes("form?.querySelector('button[type=\"submit\"]')?.removeAttribute('disabled')"),'Enable demo submission only after the client-side handler is registered');
assert.ok(!/\baction\s*=/i.test(formMarkup),'Demo form must not declare a network submission destination');
