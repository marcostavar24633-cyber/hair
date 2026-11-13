const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('script.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');

assert.match(html, /<html lang="ru">/);
assert.match(html, /<title>HAIR STUDIO/);
assert.match(html, /name="description"/);
assert.match(html, /rel="canonical"/);
assert.match(html, /id="bookingForm"/);
assert.match(html, /Демонстрационная форма/);
assert.match(html, /Изображения — визуальные референсы/);
assert.match(html, /Девушка с длинными распущенными каштановыми волосами/);
assert.ok(html.includes('images.pexels.com/photos/33015399'), 'Expected hero photo source');
assert.match(html, /href="styles\.css"/);
assert.match(html, /src="script\.js"/);
assert.match(html, /href="favicon\.svg"/);

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
for (const anchor of anchors) assert.ok(ids.has(anchor), `Missing anchor target: #${anchor}`);

for (const selector of ['.menu-toggle', '.nav', '.filter', '.work-item', 'bookingForm']) {
  assert.ok(js.includes(selector), `Expected interaction for ${selector}`);
}
assert.match(js, /event\.key === 'Escape'/);
assert.match(js, /aria-pressed/);
assert.match(js, /role', 'dialog'/);
assert.match(js, /aria-modal', 'true'/);
assert.match(js, /ArrowLeft/);
assert.match(js, /ArrowRight/);
assert.match(js, /lightbox-close/);
assert.match(css, /\.lightbox\[hidden\]/);
assert.match(css, /\.lightbox-image/);
assert.match(css, /body\.lightbox-open/);
assert.ok(js.includes(String.raw`phone.replace(/\D/g, '')`), 'Phone validation must strip non-digits correctly');
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /:focus-visible/);
assert.match(css, /#2b1914/);
assert.match(css, /#642849/);
assert.match(css, /border-radius:999px/);
assert.ok(css.includes('@media(max-width:370px)'), 'Expected small-screen breakpoint');

console.log('Visual theme, hero image reference, and small-screen layout checks passed.');

console.log('HAIR STUDIO quality checks passed.');


assert.match(html, /maxlength="18"/);
assert.match(html, /id="phoneHelp"/);
assert.match(html, /og:locale/);
assert.match(js, /focusables/);
assert.match(js, /setPageInert/);
assert.match(js, /aria-haspopup/);
assert.match(js, /formatRussianPhone/);
assert.match(js, /setSelectionRange/);
assert.match(js, /aria-invalid/);
assert.match(css, /top:calc\(100% \+ 1px\)/);
assert.match(css, /booking-form input\[aria-invalid="true"\]/);
