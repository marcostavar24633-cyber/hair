// Static regression checks for HAIR STUDIO: SEO, accessibility structure, privacy, security and design tokens.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const css = read('styles.css');
const js = read('script.js');
const readme = read('README.md');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');
const count = (source, pattern) => (source.match(pattern) || []).length;
const meta = name => html.match(new RegExp('<meta (?:name|property)="' + name.replace(':', '\\:') + '" content="([^"]+)"'))?.[1] || '';

/* ---------- Design tokens and contrast (WCAG AA) ---------- */
const token = name => {
  const value = css.match(new RegExp('--' + name + ':(#[0-9a-fA-F]{6})'))?.[1];
  assert.ok(value, 'Missing colour token --' + name);
  return value;
};
const luminance = hex => {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
};
const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const light = ['ivory', 'paper'].map(token);
const dark = ['ink', 'ink-2', 'ink-3'].map(token);
for (const bg of light) {
  for (const fg of ['ink', 'muted', 'copper']) assert.ok(contrast(token(fg), bg) >= 4.5, `--${fg} must reach 4.5:1 on ${bg}`);
}
assert.ok(contrast(token('dim'), token('ivory')) >= 4.5, 'Dimmed manifesto words must stay readable (4.5:1)');
for (const bg of dark) {
  for (const fg of ['light-text', 'light-muted', 'copper-bright']) assert.ok(contrast(token(fg), bg) >= 4.5, `--${fg} must reach 4.5:1 on ${bg}`);
}
assert.ok(contrast(token('ink'), token('copper-bright')) >= 4.5, 'Text on copper buttons must be readable');

/* ---------- Document basics and SEO ---------- */
assert.match(html, /^<!doctype html>\s*<html lang="ru">/i, 'Document must declare HTML5 and Russian language');
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
assert.deepEqual(sitemap.split('<loc>').slice(1).map(part => part.split('</loc>')[0]), [canonical], 'Sitemap must list exactly the canonical URL');

/* ---------- Structure and accessibility ---------- */
assert.ok(html.includes('<a class="skip-link" href="#main">'), 'Skip link to main content required');
assert.match(html, /<main id="main">/);
const levels = [...html.matchAll(/<h([1-6])\b/g)].map(match => Number(match[1]));
assert.equal(levels.filter(level => level === 1).length, 1, 'Exactly one H1');
assert.equal(levels[0], 1, 'H1 must come first');
for (let i = 1; i < levels.length; i++) assert.ok(levels[i] <= levels[i - 1] + 1, 'Heading levels must not skip');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML id');
for (const id of ['services', 'atlas', 'works', 'philosophy', 'team', 'faq', 'contacts', 'booking', 'booking-form', 'comparison', 'calculator', 'lightbox', 'mobile-menu', 'tone-panel']) assert.ok(ids.includes(id), 'Missing section #' + id);
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), 'Broken anchor #' + id);
for (const [, refs] of html.matchAll(/\baria-(?:labelledby|describedby|controls)="([^"]+)"/g)) for (const ref of refs.split(/\s+/)) assert.ok(ids.includes(ref), 'Broken ARIA reference ' + ref);
for (const [, attrs] of html.matchAll(/<nav\b([^>]*)>/g)) assert.match(attrs, /aria-label="[^"]+"/, 'Every nav needs a label');
for (const [, attrs, text] of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
  assert.match(attrs, /type="(?:button|submit)"/, 'Buttons must declare their type');
  assert.ok(/aria-label="[^"]+"/.test(attrs) || text.replace(/<[^>]+>/g, '').trim(), 'Button without accessible name: ' + attrs);
}
const tabs = [...html.matchAll(/<button\b[^>]*role="tab"[^>]*>/g)].map(match => match[0]);
assert.equal(tabs.length, 6, 'Colour atlas must expose six tabs');
assert.equal(tabs.filter(tab => tab.includes('aria-selected="true"')).length, 1, 'Exactly one atlas tab selected');
assert.match(html, /role="tablist" aria-label="[^"]+"/);
assert.match(html, /id="tone-panel" role="tabpanel" aria-labelledby="tone-tab-honey"/);
assert.match(html, /id="lightbox" hidden role="dialog" aria-modal="true"/);
assert.match(html, /id="portfolio-status" role="status" aria-live="polite"/);
assert.match(html, /class="menu-button" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobile-menu"/);
assert.match(html, /class="reviews-track" role="region" aria-label="[^"]+" tabindex="0"/, 'Scrollable reviews must be keyboard reachable');

assert.doesNotMatch(html, /<a class="brand[^"]*" href="#top" aria-label=/, 'Brand link name must come from its visible text (label-content-name-mismatch)');
assert.match(html.slice(html.indexOf('<footer')), /class="mobile-cta"/, 'Mobile CTA must live inside the footer landmark');

/* ---------- Images and performance ---------- */
const images = html.split('<img').slice(1).map(part => part.split('>')[0]);
for (const tag of images) {
  assert.match(tag, /\balt="/, 'Image without alt: ' + tag.slice(0, 80));
  assert.match(tag, /decoding="async"/, 'Image without async decoding');
}
const remote = images.filter(tag => /src="https:\/\/images\.(?:unsplash|pexels)\.com\//.test(tag));
assert.ok(remote.length >= 10, 'Expected remote content images');
for (const tag of remote) {
  const candidates = [...tag.matchAll(/(https:\/\/[^,\s"]+)\s+(\d+)w/g)];
  assert.equal(candidates.length, 3, 'Each remote image needs three srcset candidates');
  for (const [, url, width] of candidates) assert.ok(url.includes('w=' + width), 'srcset width mismatch');
  assert.match(tag, /\bsizes="/, 'Responsive image needs sizes');
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
assert.match(html, /fonts\.googleapis\.com\/css2\?[^"]*display=swap/);
assert.match(html, /<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>/);
assert.match(css, /--serif:"Prata",Georgia/, 'Display font needs a system fallback');
assert.match(css, /--sans:"Onest",system-ui/, 'Text font needs a system fallback');
assert.doesNotMatch(css, /@import\s/i, 'No render-blocking CSS imports');
const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/g)];
assert.equal(scripts.length, 1, 'Only one local script');
assert.match(scripts[0][0], /\bdefer\b/, 'Application script must be deferred');
for (const selector of ['.hero-arch{position:relative;aspect-ratio', '.arch-frame{position:relative;aspect-ratio', '.team-photo{aspect-ratio', '.comparison{position:relative;height:']) assert.ok(css.includes(selector), 'Image container must reserve space: ' + selector);

/* ---------- CSS behaviour guarantees ---------- */
assert.match(css, /:focus-visible\{outline:2px solid var\(--copper\)/, 'Visible keyboard focus required');
assert.match(css, /\.lightbox :focus-visible/, 'Focus must stay visible on dark overlays');
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/, 'Reduced motion must be respected');
for (const width of [1100, 960, 760, 390, 340]) assert.ok(css.includes('@media(max-width:' + width + 'px)'), 'Missing breakpoint ' + width);
assert.match(css, /body\.menu-open\{overflow:hidden\}/);
assert.match(css, /\.portfolio-card\[hidden\]\{display:none\}/, 'Filtered cards must disappear');
assert.match(css, /html:not\(\.js\) \.mobile-menu\[hidden\]\{display:block/, 'Navigation must work without JavaScript');
assert.match(css, /html:not\(\.js\) \.booking-form button\[type="submit"\]\{display:none\}/);
assert.match(css, /\.image-fallback\{object-fit:contain/);
assert.match(css, /\.filter-button\{min-width:44px;min-height:44px/, 'Touch targets at least 44px');
assert.match(css, /\.swatch\{width:44px;height:44px/, 'Swatch touch targets at least 44px');

/* ---------- JavaScript behaviour guarantees ---------- */
for (const needle of [
  "document.documentElement.classList.add('js')",
  "document.addEventListener('error'", "image.removeAttribute('srcset')", 'data:image/svg+xml',
  'function syncMobileMenuPosition()', "mobileMenu.style.removeProperty('--mobile-menu-top')", 'restoreFocus && menuButton.getClientRects().length',
  "event.shiftKey && document.activeElement === first", "if (event.key === 'Escape') { closeMenu(); closeLightbox(); }",
  'function setTone(', "tab.tabIndex = active ? 0 : -1", "atlasPanel?.setAttribute('aria-labelledby', tab.id)", "ArrowRight", "'Home'", "'End'",
  "item.setAttribute('aria-pressed', String(active))", 'Number.isFinite(rawValue) ? Math.min(100, Math.max(0, rawValue)) : 50', "aria-valuetext",
  'function updateCalculator()', 'previousFocus?.focus()', 'previousBodyOverflow = document.body.style.overflow',
  'реальная запись не создана', "removeAttribute('disabled')", 'IntersectionObserver', 'prefers-reduced-motion', 'requestAnimationFrame', '--scroll-progress', '(pointer: fine)'
]) assert.ok(js.includes(needle), 'script.js must keep: ' + needle);

/* ---------- Privacy and security ---------- */
const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1] || '';
for (const directive of ["default-src 'self'", "base-uri 'self'", "form-action 'none'", "object-src 'none'", "frame-src 'none'", "script-src 'self'", "connect-src 'none'", 'upgrade-insecure-requests']) {
  assert.ok(csp.split(';').map(part => part.trim()).includes(directive), 'CSP must include ' + directive);
}
for (const host of ['https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://images.pexels.com', 'https://images.unsplash.com']) assert.ok(csp.includes(host), 'CSP must allow ' + host);
assert.doesNotMatch(csp, /unsafe-eval/);
assert.match(html, /<meta name="referrer" content="strict-origin-when-cross-origin">/);
for (const sink of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function']) assert.ok(!js.includes(sink), 'Unsafe sink: ' + sink);
for (const channel of ['localStorage', 'sessionStorage', 'document.cookie', 'fetch(', 'XMLHttpRequest', 'sendBeacon']) assert.ok(!js.includes(channel), 'Demo must not store or send data: ' + channel);
assert.ok(!html.toLowerCase().includes('javascript:'));
assert.ok(!html.includes('href="http://') && !html.includes('src="http://'));
assert.ok(!html.includes('target="_blank"'));
for (const [, url] of html.matchAll(/data-image="([^"]+)"/g)) assert.ok(/^https:\/\/images\.(?:unsplash|pexels)\.com\//.test(url), 'Lightbox images must use trusted hosts');
const form = html.match(/<form\b[\s\S]*?<\/form>/)?.[0] || '';
assert.ok(form.includes('type="submit" disabled'), 'Submit disabled until JS handler is ready');
assert.doesNotMatch(form, /name="(?:name|phone|email)"|type="(?:tel|email|text)"/i, 'Demo form must not collect personal data');
assert.equal(count(form, /<select\b/g), 3, 'Only service, date and time');
assert.ok(!/\baction\s*=/i.test(form), 'Form must not declare a destination');
const labels = [...html.matchAll(/<label\b[^>]*>[\s\S]*?<\/label>/g)].map(match => match[0]);
for (const [control] of form.matchAll(/<select\b[^>]*>/g)) assert.ok(labels.some(label => label.includes(control)), 'Form control must sit inside a label');
for (const id of ['calc-service', 'calc-length']) assert.ok(html.includes('<label for="' + id + '"'), 'Calculator control needs a label: ' + id);

/* ---------- Honest demo content ---------- */
for (const phrase of ['Демонстрационный концепт', 'модельный ориентир', 'демо-отзыв', 'демо-профиль', 'ул. Демонстрационная, 15', 'hello@hairstudio.example', 'данные не отправляются', 'Не портфолио выполненных работ']) assert.ok(html.includes(phrase), 'Demo disclosure missing: ' + phrase);
assert.doesNotMatch(html, /\+7 \(8422\) 00-00-00|tel:/, 'No placeholder phone numbers or call links without a real number');
assert.match(readme, /демонстрационный проект/i);
assert.match(readme, /данные не отправляются, не хранятся и не передаются/i);
assert.match(readme, /полностью вымышленные демонстрационные данные/);
assert.match(readme, /анимац/i);

console.log('Site checks passed: SEO, structure, accessibility, images, privacy, security and colour contrast.');
