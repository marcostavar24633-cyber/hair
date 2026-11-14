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
  if (pathname === '/__test__/axe.min.js') {
    fs.readFile(require.resolve('axe-core/axe.min.js'), (error, content) => {
      if (error) return response.writeHead(500).end('Test dependency unavailable');
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(content);
    });
    return;
  }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(root, relative);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) return response.writeHead(403).end('Forbidden');
  fs.readFile(filePath, (error, content) => {
    if (error) return response.writeHead(404).end('Not found');
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
  if (!Object.hasOwn(browserTypes, browserName)) throw new Error('Unsupported BROWSER value: ' + browserName);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(4173, '127.0.0.1', resolve);
  });

  let browser;
  try {
    browser = await browserTypes[browserName].launch({ headless: true, args: browserName === 'chromium' ? ['--no-sandbox'] : [] });
    console.log('Running HAIR ATELIER browser suite in: ' + browserName);
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, reducedMotion: 'reduce' });
    const pageErrors = [];
    const cssResponses = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('response', response => {
      if (new URL(response.url()).pathname.endsWith('/styles.css')) {
        cssResponses.push({ status: response.status(), contentType: response.headers()['content-type'] || '' });
      }
    });

    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
    await page.locator('#hero-title').waitFor();
    await page.waitForFunction(() => {
      const link = [...document.querySelectorAll('link[rel="stylesheet"]')]
        .find(item => new URL(item.href).pathname.endsWith('/styles.css'));
      let ruleCount = 0;
      try { ruleCount = link?.sheet?.cssRules?.length || 0; } catch (_) {}
      const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
      return Boolean(link?.sheet) && ruleCount > 0 && ink === '#21131d' &&
        getComputedStyle(document.body).marginTop === '0px';
    }, null, { timeout: 15000 }).catch(async error => {
      const state = await page.evaluate(() => {
        const link = [...document.querySelectorAll('link[rel="stylesheet"]')]
          .find(item => new URL(item.href).pathname.endsWith('/styles.css'));
        let rules = [];
        try { rules = [...(link?.sheet?.cssRules || [])].slice(0, 4).map(rule => rule.cssText); } catch (error) { rules = [error.message]; }
        return {
          href: link?.href,
          sheetAvailable: Boolean(link?.sheet),
          ruleCount: link?.sheet?.cssRules?.length ?? null,
          firstRules: rules,
          ink: getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(),
          bodyMarginTop: getComputedStyle(document.body).marginTop,
          heroDisplay: getComputedStyle(document.querySelector('.hero')).display,
          readyState: document.readyState
        };
      });
      console.error('Stylesheet readiness diagnostics (' + browserName + '): ' + JSON.stringify({ state, cssResponses }));
      throw error;
    });
    assert.ok(cssResponses.some(item => item.status === 200 && item.contentType.includes('text/css')),
      'The local stylesheet must return HTTP 200 with a CSS content type');

    const runAxe = browserName !== 'webkit';
    if (runAxe) {
      await page.addScriptTag({ url: 'http://127.0.0.1:4173/__test__/axe.min.js' });
      const audit = await page.evaluate(async () => {
        const result = await axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }
        });
        return {
          violations: result.violations.map(item => ({
            id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target)
          })),
          passes: result.passes.length,
          incomplete: result.incomplete.length
        };
      });
      console.log('Accessibility audit: ' + JSON.stringify(audit));
      assert.equal(audit.violations.length, 0, 'Initial accessibility audit must have no violations');
    } else {
      console.log('Accessibility audit skipped in WebKit; automated axe checks run in Chromium and Firefox.');
    }

    assert.equal(await page.locator('h1').count(), 1, 'The page must have exactly one H1');
    assert.equal(await page.locator('.service-card').count(), 4, 'All four signature service directions must render');
    const screenshotsDir = path.join(root, 'artifacts', browserName);
    fs.mkdirSync(screenshotsDir, { recursive: true });

    for (const width of [1440, 1024, 768, 720, 430, 390, 360, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(50);
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth
      }));
      assert.ok(dimensions.document <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1,
        'Horizontal overflow at ' + width + 'px: ' + JSON.stringify(dimensions));
      if (width === 1440) await page.screenshot({ path: path.join(screenshotsDir, 'desktop.png'), fullPage: true });
      if (width === 390) await page.screenshot({ path: path.join(screenshotsDir, 'mobile-390.png'), fullPage: true });
      if (width === 320) await page.screenshot({ path: path.join(screenshotsDir, 'mobile-320.png'), fullPage: true });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    const menuButton = page.locator('.menu-trigger');
    const menu = page.locator('#site-menu');
    await menuButton.click();
    assert.equal(await menuButton.getAttribute('aria-expanded'), 'true', 'Slide-out menu must open');
    assert.equal(await menu.getAttribute('aria-hidden'), 'false', 'Open menu must be exposed to assistive technology');
    assert.equal(await menu.evaluate(element => element.contains(document.activeElement)), true, 'Opening the menu must move focus inside');
    const submenuButton = page.locator('.menu-branch');
    await submenuButton.click();
    assert.equal(await submenuButton.getAttribute('aria-expanded'), 'true', 'Nested menu must expand');
    assert.equal(await page.locator('#menu-services').isVisible(), true, 'Nested menu links must become visible');
    await page.keyboard.press('Escape');
    assert.equal(await menuButton.getAttribute('aria-expanded'), 'false', 'Escape must close the slide-out menu');
    assert.equal(await menuButton.evaluate(element => element === document.activeElement), true, 'Closing the menu must restore focus');

    const consultationTrigger = page.locator('[data-open-consultation]:visible').first();
    await consultationTrigger.click();
    const consultation = page.locator('#consultation');
    assert.equal(await consultation.isVisible(), true, 'Guided selector must open');
    await page.locator('[data-step="0"] [data-answer="shape"]').click();
    await page.locator('.dialog-next').click();
    await page.locator('[data-step="1"] [data-answer="low"]').click();
    await page.locator('.dialog-next').click();
    assert.equal(await page.locator('[data-step="2"]').isVisible(), true, 'Guided selector must show a result');
    assert.match(await page.locator('#result-title').innerText(), /Форма и движение/);
    await page.locator('.dialog-finish').click();
    assert.equal(await consultation.isVisible(), false, 'Guided selector must close');
    assert.equal(await consultationTrigger.evaluate(element => element === document.activeElement), true, 'Closing the selector must restore focus');

    await page.locator('[data-service="colour"]').click();
    assert.equal(await consultation.isVisible(), true, 'Service card must open guided selector');
    assert.equal(await page.locator('[data-step="0"] .choice.is-selected').getAttribute('data-answer'), 'colour',
      'Service card must preselect the relevant consultation topic');
    await page.keyboard.press('Escape');

    const colourFilter = page.locator('.filter-chip[data-filter="colour"]');
    await colourFilter.click();
    assert.equal(await colourFilter.getAttribute('aria-pressed'), 'true', 'Lookbook filter state must update');
    assert.equal(await page.locator('.lookbook-item:not([hidden])').count(), 1, 'Lookbook filter must show matching reference images');
    await page.locator('.filter-chip[data-filter="all"]').click();
    assert.equal(await page.locator('.lookbook-item:not([hidden])').count(), 3, 'All filter must restore every image');

    const firstImage = page.locator('.lookbook-item').first();
    await firstImage.click();
    const lightbox = page.locator('#lightbox');
    assert.equal(await lightbox.isVisible(), true, 'Lookbook image must open in a lightbox');
    assert.equal(await lightbox.locator('button').evaluate(element => element === document.activeElement), true,
      'Opening lightbox must move focus to close control');
    await page.keyboard.press('Escape');
    assert.equal(await lightbox.isVisible(), false, 'Escape must close lightbox');
    assert.equal(await firstImage.evaluate(element => element === document.activeElement), true, 'Closing lightbox must restore focus');

    const firstFaq = page.locator('.faq-list details').first();
    await firstFaq.locator('summary').click();
    assert.equal(await firstFaq.evaluate(element => element.open), true, 'FAQ disclosure must open');
    await firstFaq.locator('summary').click();
    assert.equal(await firstFaq.evaluate(element => element.open), false, 'FAQ disclosure must close');

    assert.deepEqual(pageErrors, [], 'The page must not produce uncaught JavaScript errors');
    console.log('Browser checks passed: 8 viewport widths, CSS application, slide-out and nested navigation, guided selector, service preselection, lookbook filters, lightbox, FAQ and no uncaught JS errors.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
