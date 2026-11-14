const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, firefox, webkit } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
let axePath = null;
try { axePath = require.resolve('axe-core/axe.min.js'); } catch (error) {
  if (process.env.CI) throw error;
  console.warn('axe-core is not installed locally: accessibility audits are skipped (CI always runs them).');
}

const root = path.resolve(__dirname, '..');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  const relative = pathname === '/' ? 'index.html' : (pathname.startsWith('/') ? pathname.slice(1) : pathname);
  if (pathname === '/__test__/axe.min.js') {
    fs.readFile(axePath || '', (error, content) => {
      if (error) {
        response.writeHead(500).end('Test dependency unavailable');
        return;
      }
      response.writeHead(200, {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      response.end(content);
    });
    return;
  }
  const filePath = path.resolve(root, relative);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    // WebKit applies upgrade-insecure-requests even to http://127.0.0.1 and then fails to load
    // local CSS/JS. The directive only matters on the HTTPS production host and is verified
    // statically in site-check.cjs, so the local WebKit run serves the page without it.
    if (process.env.BROWSER === 'webkit' && filePath.endsWith('.html')) {
      content = Buffer.from(content.toString('utf8').replace('; upgrade-insecure-requests', ''));
    }
    response.end(content);
  });
});

async function main() {
  const browserName = process.env.BROWSER || 'chromium';
  const browserTypes = { chromium, firefox, webkit };
  if (!Object.hasOwn(browserTypes, browserName)) {
    throw new Error('Unsupported BROWSER value: ' + browserName);
  }
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(4173, '127.0.0.1', resolve);
  });

  let browser;
  try {
    browser = await browserTypes[browserName].launch({ headless: true, args: browserName === 'chromium' ? ['--no-sandbox'] : [] });
    console.log('Running browser regression suite in: ' + browserName);
    const page = await browser.newPage({
      viewport: { width: 1365, height: 900 },
      reducedMotion: 'reduce'
    });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
    await page.locator('h1').waitFor();
    try {
      await page.waitForFunction(() => {
        const stylesheetLink = [...document.querySelectorAll('link[rel="stylesheet"]')]
          .some(link => new URL(link.href).pathname.endsWith('/styles.css'));
        return stylesheetLink && getComputedStyle(document.body).marginTop === '0px';
      }, null, { timeout: 15000 });
    } catch (error) {
      const cssState = await page.evaluate(() => ({
        links: [...document.querySelectorAll('link[rel="stylesheet"]')].map(link => ({
          href: link.href,
          rel: link.rel,
          disabled: link.disabled,
          sheetAvailable: Boolean(link.sheet)
        })),
        bodyMarginTop: getComputedStyle(document.body).marginTop,
        bodyFontFamily: getComputedStyle(document.body).fontFamily,
        readyState: document.readyState
      }));
      console.error('Stylesheet readiness diagnostics (' + browserName + '): ' + JSON.stringify(cssState));
      throw error;
    }

    const runAxe = browserName !== 'webkit' && Boolean(axePath);
    if (runAxe) {
      await page.addScriptTag({ url: 'http://127.0.0.1:4173/__test__/axe.min.js' });
    }
    const auditAccessibilityState = async state => {
      if (!runAxe) {
        console.log('Accessibility state ' + state + ': skipped (' + (axePath ? 'WebKit' : 'axe-core not installed') + '); CI runs axe in Chromium and Firefox.');
        return;
      }
      const violations = await page.evaluate(async () => {
        const result = await axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
          }
        });
        return result.violations.map(item => ({
          id: item.id,
          impact: item.impact,
          targets: item.nodes.map(node => node.target)
        }));
      });
      console.log('Accessibility state ' + state + ': ' + JSON.stringify(violations));
      assert.equal(violations.length, 0, 'Accessibility violations in state: ' + state);
    };
    if (runAxe) {
      const accessibilityResults = await page.evaluate(async () => {
        const result = await axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
          }
        });
        return {
          violations: result.violations.map(item => ({
            id: item.id,
            impact: item.impact,
            description: item.description,
            nodes: item.nodes.map(node => ({
              target: node.target,
              summary: node.failureSummary
            }))
          })),
          passes: result.passes.length,
          incomplete: result.incomplete.length
        };
      });
      console.log('Accessibility audit: ' + JSON.stringify(accessibilityResults));
      assert.equal(accessibilityResults.violations.length, 0, 'The page must pass the initial WCAG accessibility audit');
    } else {
      console.log('Accessibility audit: skipped (' + (axePath ? 'WebKit' : 'axe-core not installed') + '); CI runs axe in Chromium and Firefox.');
    }
    assert.equal(await page.locator('h1').count(), 1, 'The page must render one main heading');

    const screenshotsDir = path.join(root, 'artifacts', browserName);
    fs.mkdirSync(screenshotsDir, { recursive: true });

    for (const width of [1920, 1440, 1365, 1024, 960, 768, 720, 390, 360, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(80);
      const dimensions = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        const overflow = [...document.querySelectorAll('body *')]
          .map(element => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName.toLowerCase(),
              id: element.id,
              className: typeof element.className === 'string' ? element.className : '',
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width)
            };
          })
          .filter(item => item.width > 0 && (item.right > viewport + 1 || item.left < -1))
          .slice(0, 20);
        return {
          viewport,
          document: document.documentElement.scrollWidth,
          overflow
        };
      });
      assert.ok(
        dimensions.document <= dimensions.viewport + 1,
        'Horizontal overflow at ' + width + 'px: document ' +
          dimensions.document + 'px, viewport ' + dimensions.viewport + 'px; elements: ' + JSON.stringify(dimensions.overflow)
      );
      if (width <= 960) {
        const outside = await page.evaluate(() => ['.brand', '.menu-button'].filter(selector => {
          const rect = document.querySelector(selector).getBoundingClientRect();
          return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
        }));
        assert.deepEqual(outside, [], 'Header controls must stay inside the viewport at ' + width + 'px');
        assert.equal(await page.locator('.demo-badge:visible').count(), 1, 'The demo badge stays visible once at ' + width + 'px');
      }
      if (width === 1440) {
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        console.log('Page length at 1440px: ' + height);
        assert.ok(height < 10000, 'Desktop page must stay about a third shorter than the 13 600px original: ' + height);
        const lines = await page.locator('#hero-title .line').evaluateAll(items => items.map(item => Math.round(item.getBoundingClientRect().height)));
        const titleHeight = await page.locator('#hero-title').evaluate(element => element.getBoundingClientRect().height);
        assert.ok(titleHeight < lines.reduce((sum, value) => sum + value, 0) * 1.1, 'Hero title must sit on exactly three lines');
      }
      if (width === 390) {
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        console.log('Page length at 390px: ' + height);
        assert.ok(height < 12000, 'Mobile page must stay about a third shorter than the 16 500px original: ' + height);
      }
      if (width === 1365) {
        await page.screenshot({ path: path.join(screenshotsDir, 'desktop.png'), fullPage: true });
      }
      if (width === 390) {
        await page.screenshot({ path: path.join(screenshotsDir, 'mobile-390.png'), fullPage: true });
      }
      if (width === 320) {
        await page.screenshot({ path: path.join(screenshotsDir, 'mobile-320.png'), fullPage: true });
      }
    }

    const isFocused = locator => locator.evaluate(element => element === document.activeElement);
    const settle = () => page.waitForTimeout(450);

    /* ---------- Mobile off-canvas menu ---------- */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const menuButton = page.locator('.menu-button');
    const mobileMenu = page.locator('#mobile-menu');
    await menuButton.click();
    await settle();
    assert.equal(await menuButton.getAttribute('aria-expanded'), 'true', 'Mobile menu must open');
    assert.equal(await mobileMenu.isVisible(), true, 'Opened mobile menu must be visible');
    assert.equal(await isFocused(mobileMenu.locator('.menu-nav a').first()), true, 'Opening the menu must move focus to its first link');
    assert.equal(await page.evaluate(() => document.body.classList.contains('is-locked')), true, 'Page scroll must be locked while the menu is open');
    const panelBox = await mobileMenu.locator('.drawer-panel').boundingBox();
    assert.ok(panelBox.x + panelBox.width >= 389 && panelBox.width <= 390 * 0.88 + 1, 'Menu slides in from the right at min(420px, 88vw)');
    await mobileMenu.locator('.menu-foot a').focus();
    await page.keyboard.press('Tab');
    assert.equal(await isFocused(mobileMenu.locator('.drawer-close')), true, 'Tab from the last item must wrap to the first');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await isFocused(mobileMenu.locator('.menu-foot a')), true, 'Shift+Tab from the first item must wrap to the last');
    await auditAccessibilityState('mobile menu open');
    await page.keyboard.press('Escape');
    await settle();
    assert.equal(await menuButton.getAttribute('aria-expanded'), 'false', 'Escape must close the menu');
    assert.equal(await isFocused(menuButton), true, 'Closing the menu must restore focus to its trigger');
    assert.equal(await mobileMenu.isVisible(), false, 'Closed menu must be hidden');
    assert.equal(await page.evaluate(() => document.body.classList.contains('is-locked')), false, 'Scroll unlocks after closing');
    await menuButton.click();
    await settle();
    await page.mouse.click(10, 400);
    await settle();
    assert.equal(await mobileMenu.isVisible(), false, 'Clicking the dimmed backdrop must close the menu');
    await menuButton.click();
    await settle();
    await mobileMenu.locator('a[href="#faq"]').click();
    await settle();
    assert.equal(await mobileMenu.isVisible(), false, 'Following a link inside the menu must close it');

    /* ---------- Desktop submenus ---------- */
    await page.setViewportSize({ width: 1365, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    const servicesItem = page.locator('.has-sub').first();
    const servicesToggle = servicesItem.locator('.sub-toggle');
    await servicesItem.locator('.nav-link').hover();
    await page.waitForTimeout(120);
    assert.equal(await page.locator('#sub-services').isVisible(), true, 'Services submenu opens on hover');
    assert.equal(await servicesToggle.getAttribute('aria-expanded'), 'true', 'Hover syncs aria-expanded');
    await page.mouse.move(700, 600);
    await page.waitForTimeout(60);
    assert.equal(await servicesToggle.getAttribute('aria-expanded'), 'true', 'Submenu waits before closing so it does not collapse mid-move');
    await page.waitForTimeout(400);
    assert.equal(await servicesToggle.getAttribute('aria-expanded'), 'false', 'Submenu closes after the delay');
    await servicesToggle.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    assert.equal(await servicesToggle.getAttribute('aria-expanded'), 'true', 'Enter opens the submenu');
    assert.equal(await isFocused(page.locator('#sub-services a').first()), true, 'Opening by keyboard focuses the first item');
    assert.equal(await page.locator('#sub-services a').count(), 6, 'All six services are listed');
    await auditAccessibilityState('services submenu open');
    await page.keyboard.press('Escape');
    assert.equal(await servicesToggle.getAttribute('aria-expanded'), 'false', 'Escape closes the submenu');
    assert.equal(await isFocused(servicesToggle), true, 'Focus returns to the submenu toggle');
    const atlasToggle = page.locator('.sub-toggle[aria-controls="sub-atlas"]');
    await atlasToggle.focus();
    await page.keyboard.press('Space');
    assert.equal(await atlasToggle.getAttribute('aria-expanded'), 'true', 'Space opens the atlas mega menu');
    await page.locator('#sub-atlas a[data-pick-tone="copper"]').click();
    assert.equal(await page.locator('#tone-tab-copper').getAttribute('aria-selected'), 'true', 'Mega menu selects the tone in the atlas');

    /* ---------- Header behaviour ---------- */
    const header = page.locator('.site-header');
    const atlasTop = await page.locator('#atlas').evaluate(element => element.offsetTop);
    await page.evaluate(y => window.scrollTo(0, y), atlasTop + 200);
    await page.waitForTimeout(150);
    assert.equal(await header.evaluate(element => element.classList.contains('is-hidden')), true, 'Header hides while scrolling down');
    await page.evaluate(y => window.scrollTo(0, y), atlasTop + 100);
    await page.waitForTimeout(150);
    assert.equal(await header.evaluate(element => element.classList.contains('is-hidden')), false, 'Header returns while scrolling up');
    assert.equal(await header.evaluate(element => element.classList.contains('is-dark')), true, 'Header switches to its dark variant over dark sections');
    assert.equal(await header.evaluate(element => element.classList.contains('is-compact')), true, 'Header becomes compact after the first screen');
    const progress = await page.evaluate(() => Number(getComputedStyle(document.documentElement).getPropertyValue('--scroll-progress')));
    assert.ok(progress > 0 && progress < 1, 'Reading progress follows the scroll');

    /* ---------- Colour atlas ---------- */
    await page.locator('#tone-tab-copper').click();
    assert.equal(await page.locator('#tone-name').innerText(), 'Медь', 'Atlas panel must show the selected tone');
    assert.equal(await page.locator('#tone-panel').getAttribute('aria-labelledby'), 'tone-tab-copper', 'Panel must be labelled by the active tab');
    assert.equal(await page.locator('.swatch[data-tone="copper"]').getAttribute('aria-pressed'), 'true', 'Hero swatches must follow the atlas');
    await page.keyboard.press('ArrowRight');
    assert.equal(await isFocused(page.locator('#tone-tab-caramel')), true, 'ArrowRight must move focus to the next tab');
    assert.equal(await page.locator('#tone-name').innerText(), 'Карамель', 'Arrow keys must switch the tone');
    await page.keyboard.press('End');
    assert.equal(await page.locator('#tone-name').innerText(), 'Эспрессо', 'End must jump to the last tone');
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#tone-name').innerText(), 'Холодный блонд', 'Home must jump to the first tone');
    await page.locator('.swatch[data-tone="honey"]').click();
    assert.equal(await page.locator('#tone-tab-honey').getAttribute('aria-selected'), 'true', 'Hero swatch must select the atlas tab');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.tone), 'honey', 'Tone must be applied to the page');
    await auditAccessibilityState('atlas changed');

    /* ---------- Step-by-step booking in the side panel ---------- */
    const drawer = page.locator('#booking-drawer');
    const currentStep = () => page.locator('#wizard .step:not([hidden])').getAttribute('data-step');
    const next = page.locator('#wizard .wizard-next');
    const back = page.locator('#wizard .wizard-back');
    const bookComplex = page.locator('[data-book-service="complex"]');
    await bookComplex.scrollIntoViewIfNeeded();
    await bookComplex.click();
    await settle();
    assert.equal(await drawer.isVisible(), true, 'Service button opens the booking panel');
    assert.equal(await bookComplex.getAttribute('aria-expanded'), 'true', 'Trigger reports the open panel');
    assert.equal(await page.evaluate(() => document.getElementById('drawer-slot').contains(document.getElementById('wizard'))), true, 'The same form moves into the panel');
    assert.equal(await page.locator('form').count(), 1, 'Only one booking form exists');
    assert.equal(await page.locator('#wizard input[name="service"][value="complex"]').isChecked(), true, 'Chosen service is pre-filled');
    assert.equal(await currentStep(), 'length', 'Panel opens on the next unfilled step');
    assert.equal(await isFocused(page.locator('#wizard .step:not([hidden]) legend')), true, 'Focus moves to the step heading');
    assert.equal(await page.locator('.wizard-steps li[aria-current="step"]').getAttribute('data-for'), 'length', 'Step indicator marks the current step');
    await auditAccessibilityState('booking panel open');
    await next.click();
    assert.equal(await currentStep(), 'length', 'Next does not skip an empty step');
    assert.match(await page.locator('#wizard-error').innerText(), /Выберите/, 'An empty step explains what is missing');
    await page.locator('#wizard input[name="length"][value="long"]').check();
    assert.match(await page.locator('#wizard-price').innerText(), /11\s600\s₽/, 'Live estimate: 8 000 × 1,45 rounded');
    assert.match(await page.locator('#wizard-breakdown').innerText(), /1,45/, 'Estimate explains the length factor');
    await next.click();
    assert.equal(await currentStep(), 'shade', 'Colour services include the shade step');
    await back.click();
    assert.equal(await currentStep(), 'length', 'Back returns to the previous step');
    await next.click();
    await page.locator('#wizard input[name="shade"][value="copper"]').focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#wizard input[name="shade"][value="copper"]').isChecked(), true, 'Shade can be chosen from the keyboard');
    assert.equal(await page.locator('#tone-tab-copper').getAttribute('aria-selected'), 'true', 'Shade choice syncs with the atlas');
    await next.click();
    assert.equal(await currentStep(), 'time');
    await page.locator('#wizard input[name="day"][value="Суббота"]').check();
    await page.locator('#wizard input[name="time"][value="13:00"]').check();
    await next.click();
    assert.equal(await currentStep(), 'summary');
    assert.match(await page.locator('#sum-service').innerText(), /Сложные техники/);
    assert.equal(await page.locator('#sum-length').innerText(), 'Длинные');
    assert.equal(await page.locator('#sum-shade').innerText(), 'Медь');
    assert.match(await page.locator('#sum-time').innerText(), /Суббота, 13:00/);
    assert.match(await page.locator('#sum-price').innerText(), /11\s600\s₽/);
    await page.locator('#wizard .wizard-submit').click();
    const formStatus = await page.locator('#form-status').innerText();
    assert.match(formStatus, /данные не\sотправлены/i, 'Demo must state that data is not sent');
    assert.match(formStatus, /реальная запись не\sсоздана/i, 'Demo must not imply a real booking');
    await page.keyboard.press('Escape');
    await settle();
    assert.equal(await drawer.isVisible(), false, 'Escape closes the booking panel');
    assert.equal(await isFocused(bookComplex), true, 'Focus returns to the trigger');
    assert.equal(await page.evaluate(() => document.getElementById('booking-slot').contains(document.getElementById('wizard'))), true, 'The form returns to the page section');

    /* Non-colour service skips the shade step; atlas hands over its tone */
    const bookCut = page.locator('[data-book-service="cut"]');
    await bookCut.click();
    await settle();
    assert.equal(await currentStep(), 'summary', 'Everything is already chosen, so the panel opens on the summary');
    assert.equal(await page.locator('#sum-shade').innerText(), 'Не\u00a0требуется', 'Haircut needs no shade');
    assert.equal(await page.locator('.wizard-steps li[data-for="shade"]').getAttribute('data-state'), 'skip', 'Indicator marks the skipped step');
    await back.click();
    assert.equal(await currentStep(), 'time', 'Back skips the shade step for a haircut');
    await page.locator('#booking-drawer .drawer-scrim').click({ position: { x: 20, y: 20 } });
    await settle();
    assert.equal(await drawer.isVisible(), false, 'Backdrop click closes the panel');
    await page.locator('#tone-tab-espresso').click();
    await page.locator('#tone-book').click();
    await settle();
    assert.equal(await page.locator('#wizard input[name="shade"][value="espresso"]').isChecked(), true, 'Atlas passes its tone to the booking');
    assert.equal(await page.locator('#wizard input[name="service"][value="color"]').isChecked(), true, 'A non-colour service is replaced by the tone’s colour service');
    await page.locator('#booking-drawer .drawer-close').click();
    await settle();

    /* ---------- References, lightbox, reviews, FAQ ---------- */
    await page.locator('.filter[data-filter="color"]').click();
    assert.equal(await page.locator('.ref:not([hidden])').count(), 2, 'Colour filter shows matching references only');
    await page.locator('.filter[data-filter="all"]').click();
    assert.equal(await page.locator('.ref:not([hidden])').count(), 4);
    const firstPhoto = page.locator('.ref[data-image]').first();
    await firstPhoto.click();
    const lightbox = page.locator('#lightbox');
    assert.equal(await lightbox.isVisible(), true, 'Reference opens the lightbox');
    assert.equal(await isFocused(lightbox.locator('button')), true, 'Lightbox focuses its close button');
    await auditAccessibilityState('lightbox open');
    await page.keyboard.press('Escape');
    assert.equal(await lightbox.isVisible(), false, 'Escape closes the lightbox');
    assert.equal(await isFocused(firstPhoto), true, 'Closing the lightbox restores focus');

    const track = page.locator('.reviews-track');
    await track.evaluate(element => { element.style.scrollBehavior = 'auto'; element.scrollLeft = 0; });
    await page.locator('[data-scroll="1"]').click();
    await page.waitForTimeout(150);
    assert.ok(await track.evaluate(element => element.scrollLeft) > 0, 'Next button scrolls the reviews');

    const faq = page.locator('.faq-q').first();
    await faq.click();
    assert.equal(await faq.getAttribute('aria-expanded'), 'true', 'FAQ question expands');
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#faq-a1 p').isVisible(), true, 'FAQ answer is visible when open');

    /* ---------- One photo, one place ---------- */
    const sources = await page.locator('main img').evaluateAll(items => items.map(item => (item.getAttribute('src') || '').split('?')[0]).filter(src => !src.startsWith('data:')));
    assert.equal(new Set(sources).size, sources.length, 'No photo repeats on the page');

    /* ---------- Without JavaScript ---------- */
    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const plain = await noJs.newPage();
    await plain.goto('http://127.0.0.1:4173/', { waitUntil: 'load' });
    assert.equal(await plain.locator('#wizard .step:visible').count(), 5, 'Without JS every booking step shows as one form');
    assert.equal(await plain.locator('.menu-nav a').first().isVisible(), true, 'Without JS navigation stays available as plain links');
    assert.equal(await plain.locator('.wizard-nav').isVisible(), false, 'Without JS step buttons are hidden');
    await noJs.close();

    assert.deepEqual(pageErrors, [], 'The page must not produce uncaught JavaScript errors');
    console.log('Browser checks passed: 10 viewport widths, page length, off-canvas menu, submenus, header, atlas, step-by-step booking panel, references, lightbox, reviews, FAQ, no-JS mode, no uncaught JS errors.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
