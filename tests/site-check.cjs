const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('script.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const readme = fs.readFileSync('README.md', 'utf8');

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
assert.ok(js.includes(String.raw`value.replace(/\D/g, '')`), 'Phone formatting must strip non-digits correctly');
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


assert.match(html, /концепт сайта парикмахерской/);
assert.match(html, /демонстрационный макет показывает структуру сайта/i);
assert.match(html, /Изображения — визуальные референсы/);
assert.match(html, /Проверить демо-форму/);
assert.match(html, /Стоимость уточняется/);

assert.match(html, /id="bookingForm" novalidate/);
assert.match(html, /id="nameInput"/);
assert.match(html, /id="serviceInput"/);
assert.match(js, /digitsBeforeCaret/);
assert.match(js, /targetDigitCount/);
assert.match(js, /Введите имя не короче двух символов/);
assert.match(js, /Выберите интересующую услугу/);
assert.match(js, /failed\.field\?\.focus\(\)/);
assert.doesNotMatch(readme, /\\n-/);


// Structural and privacy regression checks.
const allIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(allIds).size, allIds.length, 'HTML IDs must be unique');
assert.equal([...html.matchAll(/<h1\b/g)].length, 1, 'The page must have exactly one H1');
assert.match(html, /name="twitter:card" content="summary_large_image"/);
assert.match(html, /name="twitter:image:alt"/);
assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie/, 'Demo form must not send or persist form data');

// WCAG AA normal-text contrast checks for the revised light-section palette.
function relativeLuminance(hex) {
  const channels = hex.replace('#', '').match(/.{2}/g).map(value => parseInt(value, 16) / 255);
  const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrastRatio(foreground, background) {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
const contrastPairs = [
  ['#65574e', '#f3e9df'],
  ['#6e594f', '#eaded2'],
  ['#62584f', '#f3e9df'],
  ['#70584d', '#eaded2'],
  ['#6f5a50', '#eaded2'],
  ['#48613f', '#eaded2'],
  ['#8d4037', '#eaded2']
];
for (const [foreground, background] of contrastPairs) {
  assert.ok(contrastRatio(foreground, background) >= 4.5,
    'Insufficient WCAG AA contrast: ' + foreground + ' on ' + background);
}
assert.match(css, /\.eyebrow\{color:#65574e\}/);
assert.match(css, /\.service-card p\{color:#62584f\}/);
assert.match(css, /\.form-message\{color:#48613f\}/);

console.log('Structure, privacy, social metadata, and WCAG AA contrast checks passed.');
