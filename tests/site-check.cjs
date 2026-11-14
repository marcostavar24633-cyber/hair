const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('index.html');
const css = read('styles.css');
const js = read('script.js');
const readme = read('README.md');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');

assert.match(html, /<html lang="ru">/);
assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'The page must have exactly one H1');
assert.match(html, /HAIR ATELIER/);
assert.match(html, /редакционная концепция|демонстрационная концепция/i);
assert.match(html, /Content-Security-Policy/);
assert.match(html, /form-action 'none'/);
assert.match(html, /script-src 'self'/);
assert.match(html, /connect-src 'none'/);
assert.doesNotMatch(html, /upgrade-insecure-requests/, 'Local HTTP regression server assets must not be silently upgraded');
assert.match(html, /rel="canonical"/);
assert.match(html, /property="og:title"/);
assert.match(html, /application\/ld\+json/);
assert.match(html, /<script src="script\.js" defer><\/script>/);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML IDs must be unique');
for (const href of [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1])) {
  assert.ok(ids.includes(href), 'In-page link target does not exist: #' + href);
}
for (const tag of [...html.matchAll(/<img\b[^>]*>/g)].map(match => match[0])) {
  assert.match(tag, /\balt="/, 'Every image needs alternative text');
}
for (const button of [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)]) {
  const hasAriaLabel = /\baria-label="[^"]+"/.test(button[1]);
  const textContent = button[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  assert.ok(hasAriaLabel || textContent, 'Every button must have an accessible name');
}
for (const nav of [...html.matchAll(/<nav\b([^>]*)>/gi)]) {
  assert.match(nav[1], /aria-label="[^"]+"/, 'Navigation landmarks must have accessible names');
}

assert.match(html, /id="site-menu"/);
assert.match(html, /aria-controls="site-menu"/);
assert.match(html, /aria-expanded="false"/);
assert.match(html, /id="consultation"/);
assert.match(html, /role="dialog" aria-modal="true"/);
assert.match(html, /data-open-consultation/);
assert.match(html, /data-service="colour"/);
assert.match(html, /data-filter="colour"/);
assert.match(html, /id="lightbox"/);
assert.match(html, /<details>/);
assert.doesNotMatch(html, /<form\b/i, 'The concept must not imply that a booking form sends enquiries');

for (const token of ['menu-trigger', 'menu-branch', 'data-open-consultation', 'data-service', 'data-filter', 'lightbox', 'IntersectionObserver', 'prefers-reduced-motion', 'requestAnimationFrame']) {
  assert.ok(js.includes(token), 'Expected interaction or accessibility feature missing: ' + token);
}
for (const token of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'document.cookie', 'innerHTML', 'outerHTML', 'document.write', 'eval(']) {
  assert.ok(!js.includes(token), 'Avoid data transmission, persistence or unsafe DOM sinks: ' + token);
}
assert.match(css, /:focus-visible/);
assert.match(css, /@media\(max-width:760px\)/);
assert.match(css, /@media\(max-width:430px\)/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.match(css, /\.site-menu\.is-open/);
assert.match(css, /\.js-reveal\.is-visible/);
assert.match(css, /\.service-card:hover/);
assert.match(css, /\.hero-glow/);
assert.match(css, /\.consultation-backdrop/);
assert.match(css, /\.lightbox/);
assert.match(css, /body:after/);
assert.match(readme, /демонстрационн/i);
assert.match(readme, /не собирает|не collect/i);
assert.match(robots, /User-agent: \*/);
assert.match(robots, /Allow: \//);
assert.match(sitemap, /<urlset/);
assert.match(sitemap, /https:\/\/marcostavar24633-cyber\.github\.io\/hair\//);

console.log('Site checks passed: semantic structure, SEO metadata, internal links, accessible controls, CSP, interactions, privacy, responsive CSS and reduced motion.');
