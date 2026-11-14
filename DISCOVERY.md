# HAIR ATELIER — discovery and transformation strategy

**Research date:** 14 November 2026  
**Project:** single-page premium hair-studio concept for Ulyanovsk  
**Implementation:** HTML, CSS and vanilla JavaScript; GitHub Pages

## 1. Business model and audience

The source project describes a local, appointment-led hair studio. Its likely commercial model is service revenue from consultations, haircuts, colouring, treatments and styling; it is not an e-commerce shop.

Primary audience segments are defined by intent rather than assumed demographics:

- People who know the service they want and need clear information before choosing.
- People comparing colour techniques, price ranges and likely maintenance.
- People who need help translating an aesthetic reference into a realistic service request.
- People who value a personal consultation and a considered premium experience.

The site should support two journeys: **I know what I want** (service → details → booking) and **help me decide** (guided discovery → recommended direction → consultation).

## 2. Local market observations

Public Ulyanovsk directories show a fragmented local market with both broad full-service salons and specialist hair services. Barb lists 55 beauty salons and a separate 44 hair-salon directory page. These are directory counts, not a complete census or market-share estimate.

Examples surfaced in public listings:
- Бантик is listed with balayage, shatush and AirTouch services from approximately 3,370 ₽.
- Aqua is listed with ombré, balayage and shatush from approximately 3,000 ₽.
- Золотые ручки publishes a broad service catalogue, including colour plus haircut and long-hair styling examples.

Directory prices and profiles can be stale or incomplete; they are directional research only and must not be copied as a live price benchmark without checking the salon directly.

### Competitive implication

A generic salon landing page is not enough. The opportunity is to differentiate through a clearer specialist identity, editorial presentation, helpful service discovery, verified portfolio evidence, transparent service expectations and a low-friction route to a real booking provider.

## 3. Strategic positioning

**HAIR ATELIER — a personal hair-design experience.**

The brand direction is an editorial atelier rather than a generic beauty marketplace:
- Individuality before trends.
- Form, colour, texture and maintenance considered together.
- Warm premium tone rather than cold luxury.
- Visual restraint, generous spacing and a strong typographic hierarchy.
- Practical clarity at every decision point.

This positioning is a design hypothesis. It should be validated against the real owner, service mix, price level and customer feedback before commercial launch.

## 4. Design options considered

| Direction | Strength | Risk | Decision |
|---|---|---|---|
| Warm editorial atelier | Distinctive, tactile, premium without feeling distant | Needs strong photography and real specialist credibility | **Selected** |
| Dark cinematic couture | High impact and memorable | Can reduce readability and feel less welcoming | Used selectively in hero and CTA sections |
| Minimal clinical beauty | Clear and functional | Too generic for an expressive hair-design brand | Not selected |

### Visual system

- Aubergine / ink foundation.
- Warm cream and paper surfaces.
- Champagne / bronze accent.
- Playfair Display editorial headlines and DM Sans interface text.
- Soft radial lighting, layered image treatment and restrained movement.
- Rounded pill CTAs and circular controls; no harsh rectangular action buttons.

## 5. Information architecture

The redesigned single-page flow is:

1. Cinematic hero and primary service-discovery action.
2. Philosophy / brand promise.
3. Four signature service directions.
4. Editorial visual interlude.
5. Filterable lookbook with accessible lightbox.
6. Method / consultation process.
7. Guided service-discovery flow.
8. FAQ with clear booking and content limitations.
9. Closing CTA and concept footer.

The slide-out menu includes an expandable services submenu. Mobile uses a single-column editorial flow and large touch targets.

## 6. Interaction strategy

- **Guided selector:** asks about the visitor's goal and maintenance preference; returns a discussion direction. It does not ask for personal data.
- **Service cards:** open the selector with the relevant category preselected.
- **Lookbook:** filters by colour, shape and mood; images open in a keyboard-accessible lightbox.
- **Navigation:** slide-out panel, nested service links, Escape-to-close and focus restoration.
- **Motion:** reveal transitions, ambient light and reading progress; all motion respects `prefers-reduced-motion`.

No fake appointment confirmation or non-submitting lead form is presented as a working booking system.

## 7. Trust, SEO and accessibility

For a real launch, the highest-value trust improvements are:
- Original salon photography and verified before/after work.
- Named specialists with credentials and individual booking paths.
- Verified prices, service duration and maintenance guidance.
- Real reviews with source attribution and permission.
- Opening hours, exact address, map, accessibility information and cancellation policy.
- LocalBusiness / HairSalon structured data only after the real business identity is confirmed.

The current concept keeps WebSite structured data and clearly labels reference imagery and fictional business information. It uses semantic landmarks, one H1, accessible control names, keyboard focus management, responsive layouts and reduced-motion support.

## 8. Technical architecture and constraints

The project remains static HTML/CSS/vanilla JS on GitHub Pages. No framework or application server is introduced.

The page uses a restrictive Content Security Policy. The guided selector is entirely client-side and does not collect, transmit or store personal data.

A production booking flow cannot be honestly completed until the owner supplies verified contact details and chooses a booking provider or approved enquiry endpoint. Enabling form submission without that information would either invent a destination or create a misleading experience.

## 9. Launch blockers — owner data required

- Legal business name and approved brand identity.
- Verified address, phone, messenger and business hours.
- Actual service catalogue, pricing, duration and policies.
- Real team names, bios, qualifications and portraits.
- Original portfolio images and publication rights.
- Verified testimonials and consent to publish.
- Booking platform / enquiry destination and privacy notice.
- Confirmation of accessibility, payment and cancellation arrangements.

## 10. Sources consulted

- [Barb — Ulyanovsk beauty salons](https://barb.pro/ru-ru/ulyanovsk/beauty-salons)
- [Barb — Ulyanovsk hair salons](https://barb.pro/ru-ru/ulyanovsk/hair-salons)
- [Barb — salon listings and service examples](https://barb.pro/ru-ru/ulyanovsk/salon)
- [Золотые ручки — public salon catalogue](https://salon-zolotye-ruchki.clients.site/)
- [Mangomint — hair salon website design examples](https://www.mangomint.com/blog/7-beautiful-hair-salon-web-designs/)
- [Haug London Haus — luxury salon digital experience case study](https://www.killview.net/haug-london-haus-website/)
- [Colorlib — hair salon website examples](https://colorlib.com/wp/hair-salon-websites-design/)

**Research limitation:** this is a desk review of public directories and design references, not an in-person competitor audit, customer interview study or verified local price survey.
