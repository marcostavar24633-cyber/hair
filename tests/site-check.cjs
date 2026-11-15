// Static regression checks for HAIR STUDIO: SEO, accessibility structure, privacy, security and design tokens.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const catalogHtml = read('services.html');
const css = read('styles.css');
const js = read('script.js');
const config = read('config.js');
const readme = read('README.md');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
const count = (source, pattern) => (source.match(pattern) || []).length;
const meta = name => html.match(new RegExp('<meta (?:name|property)="' + name.replace(':', '\\:') + '" content="([^"]+)"'))?.[1] || '';

/* ---------- Design tokens and contrast (WCAG AA) ---------- */
const rootBlock = css.match(/:root\{[\s\S]*?\n\}/)?.[0] || '';
const token = name => {
  const value = rootBlock.match(new RegExp('--' + name + ':(#[0-9a-fA-F]{6})'))?.[1];
  assert.ok(value, 'Missing colour token --' + name);
  return value;
};
const luminance = hex => {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
};
const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const blend = (fg, bg, alpha) => '#' + [1, 3, 5].map(i => Math.round(parseInt(fg.slice(i, i + 2), 16) * alpha + parseInt(bg.slice(i, i + 2), 16) * (1 - alpha)).toString(16).padStart(2, '0')).join('');
const light = ['ivory', 'paper'].map(token);
const dark = ['ink', 'ink-2', 'ink-3'].map(token);
for (const bg of light) {
  for (const fg of ['ink', 'muted', 'copper']) assert.ok(contrast(token(fg), bg) >= 4.5, `--${fg} must reach 4.5:1 on ${bg}`);
}
for (const bg of dark) {
  for (const fg of ['light-text', 'light-muted', 'copper-bright']) assert.ok(contrast(token(fg), bg) >= 4.5, `--${fg} must reach 4.5:1 on ${bg}`);
}
const wordDim = Number(rootBlock.match(/--word-dim:([\d.]+)/)?.[1]);
assert.ok(wordDim > 0 && contrast(blend(token('ink'), token('ivory'), wordDim), token('ivory')) >= 4.5, 'Dimmed manifesto words must stay readable (4.5:1) in every animation state');
assert.ok(contrast(token('ink'), token('light-text')) >= 4.5, 'Ink text on light buttons must be readable');
/* Dark luxury mode (default): espresso black + champagne gold */
for (const bg of ['night', 'ink', 'ink-2', 'ink-3']) for (const fg of ['light-text', 'light-muted', 'gold']) assert.ok(contrast(token(fg), token(bg)) >= 4.5, `--${fg} must reach 4.5:1 on --${bg} in dark mode`);
assert.ok(contrast(token('night'), token('gold')) >= 4.5, 'Text on gold buttons must be readable');
assert.ok(contrast(blend(token('light-text'), token('night'), wordDim), token('night')) >= 4.5, 'Dimmed manifesto words stay readable in dark mode');

/* ---------- Document basics and SEO ---------- */
assert.match(html, /^<!doctype html>\s*<html lang="ru" data-mode="dark">/i, 'Document must declare HTML5, Russian and the dark main theme');
assert.match(html, /<meta name="viewport" content="width=device-width,initial-scale=1">/, 'Viewport must not block zoom');
assert.equal(count(html, /<title>/g), 1);
assert.equal(count(html, /<meta name="description"/g), 1);
assert.equal(count(html, /<link rel="canonical"/g), 1);
const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || '';
const description = meta('description');
assert.ok(title.length >= 30 && title.length <= 60, 'Title length 30–60: ' + title.length);
assert.match(title, /Ульяновск/, 'Title must carry the local search intent');
assert.ok(description.length >= 70 && description.length <= 160, 'Description length 70–160: ' + description.length);
const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || '';
assert.equal(canonical, 'https://marcostavar24633-cyber.github.io/hair/');
assert.equal(meta('og:url'), canonical, 'og:url must match canonical');
assert.equal(meta('og:type'), 'website');
assert.equal(meta('og:locale'), 'ru_RU');
for (const key of ['og:site_name', 'og:title', 'og:description', 'og:image', 'og:image:alt', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) assert.ok(meta(key), 'Missing meta ' + key);
assert.equal(meta('twitter:card'), 'summary_large_image');
assert.equal(meta('twitter:image'), meta('og:image'), 'Twitter and Open Graph must share one preview image');
assert.ok(meta('og:image').startsWith('https://'), 'Preview image must be absolute HTTPS');
assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/i, 'Portfolio demo must stay indexable');
assert.match(html, /rel="icon"[^>]+href="favicon\.svg"/);
const jsonLd = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] || 'null');
assert.equal(jsonLd['@type'], 'WebSite', 'Demo must use WebSite structured data');
assert.equal(jsonLd.url, canonical);
assert.equal(jsonLd.inLanguage, 'ru-RU');
assert.match(jsonLd.description, /вымышленный демонстрационный дизайн-концепт/i);
assert.match(jsonLd.description, /не является реальным салоном/i);
assert.doesNotMatch(JSON.stringify(jsonLd), /LocalBusiness|HairSalon|BeautySalon/, 'Demo must not claim to be a real business');
assert.ok(robots.includes('User-agent: *') && robots.includes('Allow: /'));
assert.ok(robots.includes('Sitemap: https://marcostavar24633-cyber.github.io/hair/sitemap.xml'));
assert.ok(sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
assert.deepEqual(sitemap.split('<loc>').slice(1).map(part => part.split('</loc>')[0]), [canonical, canonical + 'services.html'], 'Sitemap lists the home page and the catalogue');

/* ---------- Structure and accessibility ---------- */
assert.ok(html.includes('<a class="skip-link" href="#main">'), 'Skip link to main content required');
assert.match(html, /<main id="main">/);
const levels = [...html.matchAll(/<h([1-6])\b/g)].map(match => Number(match[1]));
assert.equal(levels.filter(level => level === 1).length, 1, 'Exactly one H1');
assert.equal(levels[0], 1, 'H1 must come first');
for (let i = 1; i < levels.length; i++) assert.ok(levels[i] <= levels[i - 1] + 1, 'Heading levels must not skip');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML id');
for (const id of ['services', 'dir-tabs', 'dir-panels', 'catalog-count', 'atlas', 'works', 'philosophy', 'team', 'panel-masters', 'panel-visit', 'masters', 'principles', 'reviews', 'location', 'faq', 'cta', 'contacts', 'booking', 'wizard', 'booking-drawer', 'quiz-drawer', 'lightbox', 'mobile-menu', 'tone-panel', 'concept-note', 'sub-services', 'sub-atlas']) assert.ok(ids.includes(id), 'Missing #' + id);
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), 'Broken anchor #' + id);
for (const [, refs] of html.matchAll(/\baria-(?:labelledby|describedby|controls)="([^"]+)"/g)) for (const ref of refs.split(/\s+/)) assert.ok(ids.includes(ref), 'Broken ARIA reference ' + ref);
for (const [, attrs] of html.matchAll(/<nav\b([^>]*)>/g)) assert.match(attrs, /aria-label="[^"]+"/, 'Every nav needs a label');
for (const [, attrs, text] of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
  assert.match(attrs, /type="(?:button|submit)"/, 'Buttons must declare their type');
  const visible = text.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim();
  assert.ok(/aria-label="[^"]+"/.test(attrs) || visible, 'Button without accessible name: ' + attrs);
  if (visible && /aria-label="/.test(attrs)) assert.fail('aria-label must not override visible button text: ' + visible);
}

/* Target order of the client path: 8 content sections, comparison removed */
const order = [...html.matchAll(/<section class="([a-z-]+)"/g)].map(match => match[1]);
assert.deepEqual(order, ['hero', 'manifesto', 'services', 'atlas', 'works', 'team', 'principles', 'reviews-section', 'booking', 'location', 'faq', 'cta'], 'Home keeps the client path; the full catalogue lives on its own page');
assert.match(html, /<a class="btn btn-fill btn-catalog" href="services\.html">/, 'Home links to the catalogue page with a dedicated button');
assert.match(html, /role="tablist" aria-label="Направления услуг"/, 'Services teaser is organised in tabs');
assert.match(html, /role="tablist" aria-label="Мастера и&nbsp;первый визит"|role="tablist" aria-label="Мастера и первый визит"/, 'Masters and the first visit share tabs');
for (const id of ['atlas', 'team', 'booking', 'contacts']) assert.match(html, new RegExp('id="' + id + '" data-theme="dark"'), 'Dark rhythm section: ' + id);

/* Navigation, submenus and panels */
assert.match(html, /class="menu-button" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-menu"/);
for (const id of ['mobile-menu', 'booking-drawer', 'quiz-drawer']) assert.match(html, new RegExp('id="' + id + '" role="dialog" aria-modal="true" aria-labelledby="[^"]+" hidden'), 'Drawer must be a labelled modal dialog: ' + id);
assert.match(html, /id="lightbox" hidden role="dialog" aria-modal="true"/);
assert.equal(count(html, /class="sub-toggle" type="button" aria-expanded="false" aria-controls="sub-/g), 2, 'Services and atlas submenus need disclosure buttons');
assert.equal(count(html, /data-pick-tone="/g), 6, 'Atlas mega menu offers six tones');
for (const [tag] of html.matchAll(/<a\b[^>]*data-open-booking[^>]*>/g)) {
  assert.match(tag, /href="#booking"/, 'Booking triggers must work as plain links without JS');
  assert.match(tag, /aria-controls="booking-drawer"/, 'Booking triggers must reference the drawer');
}
assert.ok(count(html, /data-open-booking/g) >= 6, 'Header, menu, hero, atlas, final CTA and the floating button open the booking panel');
assert.equal(count(html, /<form\b[^>]*id="wizard"/g), 1, 'The booking drawer reuses the one form, it is not a copy');
assert.equal(count(html, /<form\b/g), 2, 'Only the booking wizard and the tone quiz are forms');

/* Atlas */
const tabs = [...html.matchAll(/<button\b[^>]*role="tab"[^>]*>/g)].map(match => match[0]).filter(tab => tab.includes("atlas-tab"));
assert.equal(tabs.length, 6, 'Colour atlas must expose six tabs');
assert.equal(tabs.filter(tab => tab.includes('aria-selected="true"')).length, 1, 'Exactly one atlas tab selected');
assert.match(html, /role="tablist" aria-label="[^"]+"/);
assert.match(html, /id="tone-panel" role="tabpanel" aria-labelledby="tone-tab-honey"/);
assert.match(html, /id="works-status" role="status" aria-live="polite"/);
assert.match(html, /class="reviews-track" role="region" aria-label="[^"]+" tabindex="0"/, 'Scrollable reviews must be keyboard reachable');
assert.doesNotMatch(html, /<a class="brand[^"]*" href="#top" aria-label=/, 'Brand link name must come from its visible text');

/* ---------- Images and performance ---------- */
const images = html.split('<img').slice(1).map(part => part.split('>')[0]);
for (const tag of images) {
  assert.match(tag, /\balt="/, 'Image without alt: ' + tag.slice(0, 80));
  assert.match(tag, /decoding="async"/, 'Image without async decoding');
}
const remote = images.filter(tag => /src="https:\/\/images\.(?:unsplash|pexels)\.com\//.test(tag));
assert.ok(remote.length >= 4, 'Expected remote content images');
const photoIds = remote.map(tag => tag.match(/src="https:\/\/images\.[^/]+\/(?:photos\/)?([\w-]+)/)[1]);
assert.equal(new Set(photoIds).size, photoIds.length, 'One photo — one place: no image may repeat on the page');
for (const tag of remote) {
  const candidates = [...tag.matchAll(/(https:\/\/[^,\s"]+)\s+(\d+)w/g)];
  assert.equal(candidates.length, 3, 'Each remote image needs three srcset candidates');
  assert.deepEqual(candidates.map(match => match[2]), ['480', '800', '1200'], 'srcset widths 480/800/1200');
  for (const [, url, width] of candidates) assert.ok(url.includes('w=' + width), 'srcset width mismatch');
  assert.match(tag, /\bsizes="/, 'Responsive image needs sizes');
  assert.match(tag, /\bwidth="\d+" height="\d+"/, 'Image needs intrinsic size to reserve space');
  assert.ok(/alt="[^"]{12,}"/.test(tag), 'Content images need a meaningful alt');
}
const hero = images.find(tag => tag.includes('class="hero-image"'));
assert.ok(hero, 'Hero image required');
assert.match(hero, /fetchpriority="high"/);
assert.doesNotMatch(hero, /loading="lazy"/, 'Hero must not be lazy');
assert.equal(images.filter(tag => tag.includes('fetchpriority="high"')).length, 1, 'Only the hero gets high priority');
for (const tag of remote.filter(tag => tag !== hero)) assert.match(tag, /loading="lazy"/, 'Below-the-fold images must be lazy');
const attr = (tag, name) => tag.match(new RegExp(name + '="([^"]+)"'))?.[1];
const preload = html.match(/<link rel="preload" as="image"[^>]*>/)?.[0] || '';
assert.equal(attr(preload, 'imagesrcset'), attr(hero, 'srcset'), 'Hero preload must match srcset');
assert.equal(attr(preload, 'imagesizes'), attr(hero, 'sizes'), 'Hero preload must match sizes');
assert.equal(count(html, /fonts\.googleapis\.com\/css2\?/g), 1, 'One consolidated font request');
assert.match(html, /fonts\.googleapis\.com\/css2\?family=Cormorant\+Garamond:ital,wght@[^"]*1,400[^"]*&family=Onest[^"]*display=optional/, 'Display font with italics plus Onest');
assert.match(html, /<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>/);
for (const document of [html, catalogHtml]) {
  for (const font of [
    'gNMKW3F-SZuj7xmf-HYoEoey.woff2',
    'co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7g.woff2',
    'co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrEtImSqn7B6D.woff2',
    'gNMKW3F-SZuj7xmb-HYoEoeyxMI.woff2',
    'co3bmX5slCNuHLi8bLeY9MK7whWMhyjYrXtKky2F7i6C.woff2',
    'co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrEtMmSqn7B6DxjY.woff2',
    'gNMKW3F-SZuj7xmR-HYoEoeyxMI.woff2'
  ]) assert.ok(document.includes('href="https://fonts.gstatic.com/s/') && document.includes(font), 'Preload the exact production font subset: ' + font);
  assert.equal((document.match(/<link rel="preload" as="font"[^>]*crossorigin>/g) || []).length, 7, 'Preload all critical Latin and Cyrillic font subsets');
}
assert.match(css, /--serif:"Cormorant Garamond",[^;]*Georgia/, 'Display font needs a system fallback');
assert.match(css, /--sans:"Onest",system-ui/, 'Text font needs a system fallback');
assert.doesNotMatch(css, /@import\s/i, 'No render-blocking CSS imports');
const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/g)];
assert.deepEqual(scripts.map(match => match[1].split('?')[0]), ['config.js', 'script.js'], 'Config first, then the application script');
for (const script of scripts) assert.match(script[0], /\bdefer\b/, 'Scripts must be deferred');
const cssVersion = html.match(/href="styles\.css\?v=(\d+)"/)?.[1];
const jsVersion = html.match(/src="script\.js\?v=(\d+)"/)?.[1];
assert.ok(cssVersion && jsVersion, 'CSS and JS URLs must carry a cache-busting version');
for (const selector of ['.hero-arch{', '.ref-a .ref-media{', '.ref-b .ref-media{', '.ref-d .ref-media{', '.compare{', '.strands{']) {
  const rule = css.slice(css.indexOf(selector), css.indexOf('}', css.indexOf(selector)));
  assert.match(rule, /aspect-ratio|height:/, 'Image container must reserve space: ' + selector);
}

/* ---------- CSS behaviour guarantees ---------- */
assert.match(css, /:focus-visible\{outline:2px solid var\(--focus\)/, 'Visible keyboard focus required');
assert.match(css, /\[data-theme="dark"\][^{]*\{[^}]*--focus:var\(--light-text\)/, 'Focus must stay visible on dark sections');
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/, 'Reduced motion must be respected');
for (const width of [1100, 960, 760, 600, 390, 340]) assert.ok(css.includes('@media(max-width:' + width + 'px)'), 'Missing breakpoint ' + width);
assert.match(css, /body\.is-locked\{overflow:hidden\}/);
assert.match(css, /\.ref\[hidden\]\{display:none\}/, 'Filtered references must disappear');
assert.match(css, /html:not\(\.js\) #mobile-menu\[hidden\]\{display:block/, 'Navigation must work without JavaScript');
assert.match(css, /html:not\(\.js\) \.wizard-nav,html:not\(\.js\) \.wizard-submit/, 'Without JS every step shows as one form');
assert.match(css, /\.image-fallback\{object-fit:contain/);
assert.match(css, /\.filter\{[^}]*min-width:44px;min-height:44px/, 'Touch targets at least 44px');
assert.match(css, /\.swatch\{[^}]*width:44px;height:44px/, 'Swatch touch targets at least 44px');
assert.match(css, /\.drawer-panel\{[^}]*width:min\(420px,88vw\)/, 'Off-canvas width min(420px, 88vw)');
assert.match(css, /grid-template-rows:0fr/, 'FAQ opens with a grid-rows height transition');

/* ---------- Luxury standard: tokens, restraint, symbols, typography ---------- */
const cssBody = css.replace(rootBlock, '').replace(/\[data-tone="[a-z]+"\]\{[^}]*\}/g, '');
assert.doesNotMatch(cssBody, /#[0-9a-fA-F]{3,8}\b/, 'Colours only through tokens in :root');
assert.doesNotMatch(cssBody, /rgba?\(/, 'Transparent colours only through tokens in :root');
for (const [, value] of css.matchAll(/border-radius:([^;}]+)/g)) assert.match(value.trim(), /^var\(--r(?:-arch|-round|-pill|-soft)?\)$/, 'Radius only via tokens: ' + value);
assert.equal(count(css, /cubic-bezier\(/g), 1, 'One easing curve for the whole site, defined once');
for (const [, value] of cssBody.matchAll(/transition:([^;}]+)/g)) for (const part of value.split(/,(?![^(]*\))/)) {
  if (/\b(?:width|height|top|left)\b/.test(part.split(' ')[0])) assert.fail('Do not animate layout properties: ' + part);
}
const modeBlocks = cssBody.match(/html\{--surface[\s\S]*?color-scheme:dark\}|html\[data-mode="light"\]\{[\s\S]*?color-scheme:light\}/g) || [];
assert.equal(modeBlocks.length, 2, 'Dark and light mode token blocks');
assert.match(css, /\.btn\{[^}]*border-radius:var\(--r-pill\)/, 'Buttons have rounded ends');
assert.match(css, /@keyframes drift-a/, 'Ambient background drifts slowly');
assert.match(css, /prefers-reduced-motion:reduce\)\{\n  \.ambient span\{animation:none/, 'Ambient motion stops for reduced motion');
const symbolPattern = /[←↑→↓↔↕↖↗↘↙⟵⟶⟷⇐⇒✳✦✧★☆✓✔✕✖×]|\p{Extended_Pictographic}/u;
const visibleHtml = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ');
assert.doesNotMatch(visibleHtml, symbolPattern, 'No Unicode arrows, symbol glyphs or emoji as icons in the markup');
for (const [, content] of css.matchAll(/content:("[^"]*")/g)) assert.doesNotMatch(content, symbolPattern, 'No glyph icons in CSS content');
for (const [, content] of css.matchAll(/content:("[^"]*")/g)) assert.equal(content, '""', 'Decorative CSS content only, no text glyphs');
const forbidden = /премиальн|роскошн|эксклюзивн|элитн|\bVIP\b|индивидуальный подход|команда профессионалов|высокое качество|широкий спектр|доступные цены|мы работаем для вас|лучшие мастера|lorem ipsum/i;
assert.doesNotMatch(html, forbidden, 'Luxury does not call itself luxury; no template phrases');
assert.doesNotMatch(js + config, forbidden, 'Dynamic texts follow the same tone');
assert.doesNotMatch(config.replace(/\/\/.*$/gm, ''), /!/, 'No exclamation marks in config texts');
assert.doesNotMatch(visibleHtml, /!/, 'No exclamation marks in the texts');
const headings = [...html.matchAll(/<(h[1-4])\b[^>]*>([\s\S]*?)<\/\1>/g)].map(match => match[2].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ''));
for (const heading of headings) {
  assert.doesNotMatch(heading, /(?:^|[\s(«])(?:в|и|с|к|о|у|а|на|по|до|за|от|из|не|но)\s/i, 'Non-breaking space after a short word in heading: ' + heading);
  assert.doesNotMatch(heading, / —/, 'Non-breaking space before a dash in heading: ' + heading);
}
assert.doesNotMatch(visibleHtml, /\d ₽|\d (?:ч|мин|минут|недел)(?![а-яё])/, 'Number and unit stay together');
assert.doesNotMatch(visibleHtml, /\d-\d/, 'Ranges use an en dash');
assert.doesNotMatch(visibleHtml, /"[А-Яа-яЁё]/, 'Russian quotes are guillemets');
assert.match(css, /h1,h2,h3,h4\{[^}]*text-wrap:balance/, 'Headings are balanced');
assert.match(css, /p\{margin:0;text-wrap:pretty\}/, 'Paragraphs avoid orphans');
assert.match(css, /\.num\{font-variant-numeric:tabular-nums/, 'Prices use tabular figures');
assert.doesNotMatch(css, /cursor:\s*none/, 'The custom cursor never hides the system cursor');
assert.match(css, /prefers-reduced-motion:reduce\)\{[\s\S]*animation:none!important;transition:none!important/, 'Every effect stops for reduced motion');

/* ---------- JavaScript behaviour guarantees ---------- */
for (const needle of [
  "root.classList.add('js')",
  "document.addEventListener('error'", "image.removeAttribute('srcset')", 'data:image/svg+xml',
  'function trapFocus(', 'function lockScroll()', 'window.innerWidth - root.clientWidth', 'drawerSlot.append(wizard)', 'bookingSlot.append(wizard)', 'function renderCatalog(', 'function initCarousel(', 'function renderMasters()', 'window.HAIR_STUDIO',
  'function setTone(', 'tab.tabIndex = active ? 0 : -1', "atlasPanel?.setAttribute('aria-labelledby', tab.id)", 'ArrowRight', "'Home'", "'End'",
  "swatch.setAttribute('aria-pressed'", 'function renderSteps(', 'function goToFirstIncomplete()', "setAttribute('aria-current', 'step')",
  'реальная запись не создана', "removeAttribute('disabled')", 'IntersectionObserver', 'prefers-reduced-motion', 'requestAnimationFrame', '--scroll-progress',
  "'pointerleave'", 'closeDelay', 'function setMode(', "themeToggle?.setAttribute('aria-pressed'", "classList.add('is-hidden')", "classList.toggle('is-dark'"
]) assert.ok(js.includes(needle), 'script.js must keep: ' + needle);
assert.equal(count(js, /addEventListener\('scroll'/g), 1, 'All scroll effects run in one rAF loop');

/* ---------- Privacy and security ---------- */
const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1] || '';
for (const directive of ["default-src 'self'", "base-uri 'self'", "form-action 'none'", "object-src 'none'", "frame-src 'none'", "script-src 'self'", "connect-src 'self'", 'upgrade-insecure-requests']) {
  assert.ok(csp.split(';').map(part => part.trim()).includes(directive), 'CSP must include ' + directive);
}
for (const host of ['https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://images.pexels.com', 'https://images.unsplash.com']) assert.ok(csp.includes(host), 'CSP must allow ' + host);
assert.doesNotMatch(csp, /unsafe-eval/);
assert.match(html, /<meta name="referrer" content="strict-origin-when-cross-origin">/);
for (const sink of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function']) assert.ok(!(js + config).includes(sink), 'Unsafe sink: ' + sink);
for (const channel of ['sessionStorage', 'document.cookie', 'indexedDB', 'fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket']) assert.ok(!(js + config).includes(channel), 'Demo must not send data or use other storage: ' + channel);
assert.equal(count(js, /localStorage/g), 3, 'localStorage is touched only inside the store helper');
assert.deepEqual([...new Set([...js.matchAll(/store\.(?:get|set|remove)\('([a-z]+)'/g)].map(match => match[1]))].sort(), ['draft', 'fav', 'mode'], 'Only the theme, favourite tones and the booking draft are stored');
assert.match(js, /store\.set\('draft', \{ service: value\('service'\), length: value\('length'\), shade: value\('shade'\), master: value\('master'\), day: value\('day'\), time: value\('time'\) \}\)/, 'The draft holds choices only, never personal data');
assert.ok(!html.toLowerCase().includes('javascript:'));
assert.ok(!html.includes('href="http://') && !html.includes('src="http://'));
assert.ok(!html.includes('target="_blank"'));
for (const [, url] of html.matchAll(/data-image="([^"]+)"/g)) assert.ok(/^https:\/\/images\.(?:unsplash|pexels)\.com\//.test(url), 'Lightbox images must use trusted hosts');
const form = html.match(/<form\b[\s\S]*?<\/form>/)?.[0] || '';
assert.ok(form.includes('type="submit" disabled'), 'Submit disabled until JS handler is ready');
assert.doesNotMatch(form, /name="(?:name|phone|email|tel)"|type="(?:tel|email|text|number)"|<textarea|<select/i, 'Demo form must not collect personal data');
assert.deepEqual([...new Set([...form.matchAll(/<input type="radio" name="([a-z]+)"/g)].map(match => match[1]))], ['length', 'shade'], 'Static choices: length and shade; services, masters, days and slots come from config');
assert.equal(count(form, /<input\b/g), count(form, /<input type="radio"/g), 'Only radio choices in the demo form');
assert.ok(!/\baction\s*=/i.test(form), 'Form must not declare a destination');
assert.equal(count(form, /<fieldset class="step"/g), 6, 'Six booking steps');
assert.equal(count(form, /<legend\b/g), 6, 'Every step is a labelled fieldset');
for (const [, input] of form.matchAll(/(<input\b[^>]*>)/g)) assert.ok(/<label class="option"><input/.test(form), 'Inputs sit inside labels: ' + input);
assert.doesNotMatch(form, /<fieldset[^>]*\shidden/, 'Without JS no step is hidden: steps are hidden only by script');

/* ---------- Honest demo content ---------- */
assert.ok(js.includes('демо-профиль'), 'Masters are labelled as demo profiles');
for (const phrase of ['Демонстрационный концепт', 'Демо-концепт', 'модельный ориентир', 'демо-отзыв', 'Демо-профили', '[телефон]', '[Telegram]', '[MAX]', '[реквизиты]', '[условия уточняются]', 'ул. Демонстрационная, 15', 'hello@hairstudio.example', 'данные не отправляются', 'Не портфолио выполненных работ', 'Фото после съёмки']) assert.ok(html.replace(/&nbsp;/g, ' ').includes(phrase), 'Demo disclosure missing: ' + phrase);
assert.doesNotMatch(html, /tel:|wa\.me|whatsapp|t\.me\//i, 'No call or messenger links without real contacts');
assert.match(readme, /демонстрационный проект/i);
assert.match(readme, /данные не отправляются, не хранятся и не передаются/i);
assert.match(readme, /config\.js/);
assert.match(readme, /полностью вымышленные демонстрационные данные/);
assert.match(readme, /анимац/i);

/* ---------- Config: one source of data ---------- */
const sandbox = { window: {} };
new Function('window', config)(sandbox.window);
const cfg = sandbox.window.HAIR_STUDIO;
assert.equal(cfg.services.length, 14, 'Six hair, four nail and four skin services');
assert.deepEqual(cfg.services.slice(0, 6).map(item => [item.name, item.base, item.time]), [['Стрижка и форма', 2200, '1–1,5 ч'], ['Окрашивание в один тон', 4600, '2–3 ч'], ['Сложные техники', 8000, '4–6 ч'], ['Тонирование', 2500, '1,5–2 ч'], ['Укладка', 2300, '45–60 мин'], ['Уход за волосами', 3000, '1–1,5 ч']], 'Hair prices and durations match the brief');
for (const item of cfg.services) assert.ok(item.id && cfg.directions[item.dir] && item.base > 0 && item.min <= item.max && item.includes.length, 'Service is complete: ' + item.id);
assert.deepEqual(Object.keys(cfg.tones), ['blonde', 'honey', 'copper', 'caramel', 'chestnut', 'espresso']);
assert.deepEqual(Object.keys(cfg.tones).filter(key => cfg.tones[key].price), ['honey'], 'Only «Мёд» has confirmed figures; the rest stay [уточнить]');
assert.equal(cfg.unknown, '[уточнить]');
assert.deepEqual(cfg.booking.slots, ['10:00', '11:30', '13:00', '15:30', '17:00', '19:00']);
assert.equal(cfg.booking.provider, null, 'Online booking integration point stays empty in the demo');
for (const key of ['phone', 'telegram', 'max', 'legal', 'terms']) assert.match(cfg.contacts[key], /^\[.+\]$/, 'Placeholder contact: ' + key);
for (const flag of ['cursor', 'magnetic', 'tilt', 'marquee', 'ambient', 'seal', 'confetti', 'floatingCta', 'storage']) assert.equal(typeof cfg.features[flag], 'boolean', 'Feature flag: ' + flag);
assert.ok(fs.existsSync(path.join(root, 'docs/TZ-beauty-services.md')), 'Brief for nails and cosmetology with price analysis');

/* ---------- Catalogue page ---------- */
const catalogTitle = catalogHtml.match(/<title>([^<]+)<\/title>/)?.[1] || '';
assert.ok(catalogTitle.length >= 30 && catalogTitle.length <= 60, 'Catalogue title 30–60: ' + catalogTitle.length);
const catalogDescription = catalogHtml.match(/<meta name="description" content="([^"]+)"/)?.[1] || '';
assert.ok(catalogDescription.length >= 70 && catalogDescription.length <= 160, 'Catalogue description 70–160: ' + catalogDescription.length);
const catalogSocialTitle = catalogHtml.match(/<meta property="og:title" content="([^"]+)"/)?.[1] || '';
const catalogSocialDescription = catalogHtml.match(/<meta property="og:description" content="([^"]+)"/)?.[1] || '';
const catalogTwitterTitle = catalogHtml.match(/<meta name="twitter:title" content="([^"]+)"/)?.[1] || '';
const catalogTwitterDescription = catalogHtml.match(/<meta name="twitter:description" content="([^"]+)"/)?.[1] || '';
assert.match(catalogSocialTitle, /Каталог услуг и цены/, 'Catalogue Open Graph title must be page-specific');
assert.match(catalogSocialDescription, /Каталог услуг/, 'Catalogue Open Graph description must be page-specific');
assert.equal(catalogTwitterTitle, catalogSocialTitle, 'Twitter and Open Graph titles must match');
assert.equal(catalogTwitterDescription, catalogSocialDescription, 'Twitter and Open Graph descriptions must match');
assert.match(catalogHtml, /<link rel="canonical" href="https:\/\/marcostavar24633-cyber\.github\.io\/hair\/services\.html">/);
assert.match(catalogHtml, /^<!doctype html>\s*<html lang="ru" data-mode="dark">/i);
assert.equal(catalogHtml.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1], csp, 'Same CSP on both pages');
const catalogLevels = [...catalogHtml.matchAll(/<h([1-6])\b/g)].map(match => Number(match[1]));
assert.equal(catalogLevels.filter(level => level === 1).length, 1, 'Catalogue has one H1');
for (let i = 1; i < catalogLevels.length; i++) assert.ok(catalogLevels[i] <= catalogLevels[i - 1] + 1, 'Catalogue heading levels must not skip');
const catalogIds = [...catalogHtml.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(catalogIds).size, catalogIds.length, 'Duplicate id on the catalogue page');
for (const id of ['catalog', 'filter-group', 'filter-time', 'filter-sort', 'regrowth', 'compare', 'styles', 'forms-track', 'nails-track', 'quick-drawer', 'mobile-menu']) assert.ok(catalogIds.includes(id), 'Catalogue page needs #' + id);
for (const [, id] of catalogHtml.matchAll(/href="#([^"]+)"/g)) assert.ok(catalogIds.includes(id), 'Broken anchor on the catalogue page #' + id);
for (const [, id] of catalogHtml.matchAll(/href="index\.html#([^"]+)"/g)) assert.ok(ids.includes(id), 'Catalogue links to a missing home anchor #' + id);
for (const [, refs] of catalogHtml.matchAll(/\baria-(?:labelledby|describedby|controls)="([^"]+)"/g)) for (const ref of refs.split(/\s+/)) assert.ok(catalogIds.includes(ref), 'Broken ARIA reference on the catalogue page ' + ref);
assert.doesNotMatch(catalogHtml, /data-open-booking/, 'The catalogue page sends visitors to the booking on the home page');
assert.match(catalogHtml, /Схематичная иллюстрация, не&nbsp;фото клиента/, 'The regrowth comparison is labelled as an illustration');
assert.deepEqual([...catalogHtml.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(match => match[1].split('?')[0]), ['config.js', 'script.js']);
assert.doesNotMatch(catalogHtml.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' '), forbidden);
assert.match(catalogHtml, /модельный ориентир/);

console.log('Site checks passed: SEO, structure, accessibility, images, luxury standard, privacy, security and colour contrast.');
