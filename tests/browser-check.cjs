const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, firefox, webkit } = require('playwright');

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
    fs.readFile(require.resolve('axe-core/axe.min.js'), (error, content) => {
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

    const runAxe = browserName !== 'webkit';
    if (runAxe) {
      await page.addScriptTag({ url: 'http://127.0.0.1:4173/__test__/axe.min.js' });
    }
    const auditAccessibilityState = async state => {
      if (!runAxe) {
        console.log('Accessibility state ' + state + ': skipped for WebKit; automated axe checks run in Chromium and Firefox.');
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
      console.log('Accessibility audit: skipped for WebKit; automated axe checks run in Chromium and Firefox.');
    }
    assert.equal(await page.locator('h1').count(), 1, 'The page must render one main heading');

    const screenshotsDir = path.join(root, 'artifacts', browserName);
    fs.mkdirSync(screenshotsDir, { recursive: true });

    for (const width of [1365, 1024, 768, 720, 390, 360, 320]) {
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

    await page.locator('.filter-button[data-filter="color"]').click();
    assert.equal(await page.locator('.portfolio-card:not([hidden])').count(), 1, 'Portfolio color filter must show matching cards only');

    const comparison = page.locator('#comparison');
    await page.locator('.compare-range').evaluate(element => {
      element.value = '25';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    assert.equal(await comparison.evaluate(element => element.style.getPropertyValue('--split')), '25%', 'Comparison slider must update its split');

    const initialTotal = await page.locator('#calc-total').innerText();
    await page.locator('#calc-service').selectOption('4600');
    await page.locator('#calc-length').evaluate(element => {
      element.value = '2';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const updatedTotal = await page.locator('#calc-total').innerText();
    assert.notEqual(updatedTotal, initialTotal, 'Calculator must update when service and length change');
    assert.match(updatedTotal, /₽/, 'Calculator must display a ruble total');

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
    console.log('Browser checks passed: 7 viewport widths, mobile navigation, portfolio filter, comparison slider, calculator, demo form, lightbox, and no uncaught JS errors.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
