# VLuce — Template 01

A dealership website template by **VandLabs Studio**: a light showroom layout with a black header, a category tab bar, an "Explore By" filter bar (price, brand, category, fuel, year, kilometres), search, and white car cards with "Request A Call Back" and WhatsApp. It runs on its own, or connects to VandLabs Automotive Intelligence by signing in.

> Luxury showroom on the outside. Powerful dealership intelligence on the inside — as a separate, optional product.

## What's included

| Page | Purpose |
|---|---|
| `/` | Cinematic hero, collection showcase, brand index, featured car, lifestyle categories, sell-your-car, dealership experience, showroom, closing CTA |
| `/collection` | Collection and search results (`/collection?q=…`): breadcrumb, "Search By" title, sorting, removable filter chips, shareable URLs, and a "No results found" state that suggests top choices |
| `/collection/[slug]` | Gallery with fullscreen lightbox (keyboard + swipe), key facts, highlights, specs, details, EMI estimate, enquiry form with intents, WhatsApp/call, similar cars, `Car` JSON-LD |
| `/sell` | Three-step selling enquiry |
| `/showroom` | Address, hours, map, directions, appointment request |
| `/shortlist` | Saved cars (stored only in the browser), sent to the showroom over WhatsApp |
| `/connect` | Private: the dealership owner signs in with their Intelligence email to connect stock and enquiries |

It also has a fullscreen menu, a WhatsApp button, UTM/referrer attribution on every enquiry, `AutoDealer` structured data, a sitemap, robots.txt, reduced-motion support, keyboard focus states and a designed fallback for missing photos.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. No environment variables are needed: the site runs on the built-in demo inventory, and enquiries are accepted in clearly labelled **demo mode**.

```bash
npm run lint && npm run typecheck && npm run build
```

```bash
BASE_URL=http://localhost:3000 npm run smoke   # end-to-end checks (needs Playwright + Chromium)
```

## Stack

Next.js 15 (App Router, static generation + ISR), React 19, TypeScript, and hand-written CSS with design tokens. The font is Outfit (open licence) via `next/font`. There's no UI framework and no paid service.

## Documentation

- [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md): rebranding for a new dealership client
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): structure, the product model, and how future templates reuse it
- [docs/INTEGRATION.md](docs/INTEGRATION.md): optional VandLabs Automotive Intelligence connection: what is verified, what is not
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Vercel, custom domains, environment variables

## Demo content

The inventory in `src/data/vehicles.ts` is realistic **demo data**, not offers. Photography is hotlinked from Unsplash under the Unsplash License to preview the layout. It's illustrative and doesn't show the specific listed vehicles. A client deployment replaces both with the dealership's own stock and photography. No third-party trademarks, logos or proprietary content are used. Brand names show up only as plain text, to describe the vehicles.
