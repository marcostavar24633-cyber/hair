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

    for (const width of [1440, 1365, 1024, 960, 768, 720, 390, 360, 320]) {
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

    await page.setViewportSize({ width: 390, height: 844 });
    const menuButton = page.locator('.menu-button');
    const mobileMenu = page.locator('#mobile-menu');
    await menuButton.click();
    assert.equal(await menuButton.getAttribute('aria-expanded'), 'true', 'Mobile menu must open');
    assert.equal(await mobileMenu.locator('a').first().evaluate(element => element === document.activeElement), true, 'Opening the mobile menu must move focus to its first link');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await mobileMenu.locator('a').last().evaluate(element => element === document.activeElement), true, 'Shift+Tab from the first menu link must wrap to the last link');
    await page.keyboard.press('Tab');
    assert.equal(await mobileMenu.locator('a').first().evaluate(element => element === document.activeElement), true, 'Tab from the last menu link must wrap to the first link');
    await auditAccessibilityState('mobile menu open');
    assert.equal(await mobileMenu.isVisible(), true, 'Opened mobile menu must be visible');
    await page.keyboard.press('Escape');
    assert.equal(await menuButton.getAttribute('aria-expanded'), 'false', 'Escape must close mobile menu');
    assert.equal(await menuButton.evaluate(element => element === document.activeElement), true, 'Closing the mobile menu must restore focus to its trigger');
    assert.equal(await mobileMenu.isVisible(), false, 'Closed mobile menu must be hidden');

    // Colour atlas: tabs, keyboard navigation, shared state with hero swatches and calculator hand-off
    await page.locator('#tone-tab-copper').click();
    assert.equal(await page.locator('#tone-tab-copper').getAttribute('aria-selected'), 'true', 'Clicking an atlas tab must select it');
    assert.equal(await page.locator('#tone-name').innerText(), 'Медь', 'Atlas panel must show the selected tone');
    assert.equal(await page.locator('#tone-panel').getAttribute('aria-labelledby'), 'tone-tab-copper', 'Panel must be labelled by the active tab');
    assert.equal(await page.locator('.swatch[data-tone="copper"]').getAttribute('aria-pressed'), 'true', 'Hero swatches must follow the atlas');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tone-tab-caramel').evaluate(element => element === document.activeElement), true, 'ArrowRight must move focus to the next tab');
    assert.equal(await page.locator('#tone-name').innerText(), 'Карамель', 'Arrow keys must switch the tone');
    await page.keyboard.press('End');
    assert.equal(await page.locator('#tone-name').innerText(), 'Эспрессо', 'End must jump to the last tone');
    await page.locator('.swatch[data-tone="blonde"]').click();
    assert.equal(await page.locator('#tone-tab-blonde').getAttribute('aria-selected'), 'true', 'Hero swatch must select the atlas tab');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.tone), 'blonde', 'Tone must be applied to the page');
    await page.locator('#tone-calc').click();
    assert.equal(await page.locator('#calc-service').inputValue(), '8000', 'Atlas must hand the matching service to the calculator');
    await auditAccessibilityState('atlas changed');

    await page.locator('.filter-button[data-filter="color"]').click();
    assert.equal(await page.locator('.portfolio-card:not([hidden])').count(), 2, 'Portfolio color filter must show matching cards only');

    const comparison = page.locator('#comparison');
    await page.locator('.compare-range').evaluate(element => {
      element.value = '25';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    assert.equal(await comparison.evaluate(element => element.style.getPropertyValue('--split')), '25%', 'Comparison slider must update its split');

    const initialTotal = await page.locator('#calc-total').innerText();
    await page.locator('#calc-service').selectOption('2200');
    await page.locator('#calc-length').evaluate(element => {
      element.value = '2';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const updatedTotal = await page.locator('#calc-total').innerText();
    assert.notEqual(updatedTotal, initialTotal, 'Calculator must update when service and length change');
    assert.match(updatedTotal, /₽/, 'Calculator must display a ruble total');
    assert.match(await page.locator('#calc-breakdown').innerText(), /1,35/, 'Calculator must explain the length factor');

    const track = page.locator('.reviews-track');
    await track.evaluate(element => { element.style.scrollBehavior = 'auto'; element.scrollLeft = 0; });
    await page.locator('[data-scroll="1"]').click();
    await page.waitForTimeout(150);
    assert.ok(await track.evaluate(element => element.scrollLeft) > 0, 'Next button must scroll the reviews');

    await page.locator('#bookingForm select[name="service"]').selectOption({ label: 'Стрижка' });
    await page.locator('#bookingForm select[name="date"]').selectOption({ label: 'Ближайший рабочий день' });
    await page.locator('#bookingForm select[name="time"]').selectOption({ label: '10:00' });
    await page.locator('#bookingForm button[type="submit"]').click();
    const formStatus = await page.locator('#bookingForm .form-status').innerText();
    assert.match(formStatus, /данные не отправлены/i, 'Demo form must explicitly state that data is not sent');
    assert.match(formStatus, /реальная запись не создана/i, 'Demo form must not imply that a real booking was made');

    await page.locator('.portfolio-card:not([hidden])').first().click();
    const lightbox = page.locator('#lightbox');
    assert.equal(await lightbox.isVisible(), true, 'Portfolio card must open the lightbox');
    assert.equal(await lightbox.locator('button').evaluate(element => element === document.activeElement), true, 'Opening the lightbox must move focus to its close button');
    await auditAccessibilityState('lightbox open');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.portfolio-card:not([hidden])').first().evaluate(element => element === document.activeElement), true, 'Closing the lightbox must restore focus to its trigger');
    assert.equal(await lightbox.isVisible(), false, 'Escape must close the lightbox');

    assert.deepEqual(pageErrors, [], 'The page must not produce uncaught JavaScript errors');
    console.log('Browser checks passed: 9 viewport widths, mobile navigation, colour atlas, portfolio filter, comparison slider, calculator, reviews, demo form, lightbox, and no uncaught JS errors.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
