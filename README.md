# HAIR ATELIER — editorial concept

A premium, single-page beauty-studio website concept for Ulyanovsk, built with semantic HTML, CSS and vanilla JavaScript.

**Live preview:** https://marcostavar24633-cyber.github.io/hair/

## Experience

- Cinematic aubergine-and-champagne visual system with responsive editorial layouts.
- Slide-out navigation with an expandable services submenu.
- Guided service-discovery flow that recommends a discussion direction without collecting personal data.
- Filterable visual lookbook and accessible image lightbox.
- Scroll reveals, subtle ambient lighting and reading progress, with reduced-motion support.
- Responsive service cards, FAQ and keyboard-accessible overlays.

## Project status and content integrity

This repository is a **design and interaction concept**, not a representation of an operating salon. The name, sample service descriptions and visual direction are conceptual. The lookbook uses editorial reference photography, not verified client results. No real team, address, phone number, reviews, prices, appointment availability or booking provider have been supplied.

The guided selector runs entirely in the browser. It does not collect, transmit or store personal data and does not create an appointment. The website intentionally does not pretend that a booking has been made.

Before a real commercial launch, the owner must provide verified business details, actual services and prices, original photography with publication rights, contact channels, privacy/legal copy, and an approved booking or enquiry integration. Those cannot safely be fabricated.

## Technology

- HTML5
- CSS (responsive layout, custom properties, motion and reduced-motion handling)
- Vanilla JavaScript (no framework and no runtime API)
- GitHub Pages deployment
- Playwright browser regression checks and axe-core accessibility checks in Chromium and Firefox

## Local preview

Because this is a static site, serve the repository root with any static HTTP server, for example:

```bash
python -m http.server 4173
```

Then open http://127.0.0.1:4173/.

## Quality checks

The GitHub Actions workflow checks JavaScript syntax, site structure, navigation targets, responsive behaviour, interactive flows, keyboard access and browser console errors. Automated axe-core scans run in Chromium and Firefox. WebKit runs the functional suite; axe-core is not injected in WebKit in this configuration.

The browser regression script expects Playwright and axe-core to be installed by the workflow:

```bash
npm install --no-save playwright axe-core
npx playwright install --with-deps chromium firefox webkit
for browser in chromium firefox webkit; do BROWSER="$browser" node tests/browser-check.cjs; done
```
