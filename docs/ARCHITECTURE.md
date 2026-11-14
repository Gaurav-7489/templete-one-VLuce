# Architecture

## Product model

VandLabs sells two independent products:

| | Dealership website (this repo) | Automotive Intelligence |
|---|---|---|
| Who uses it | The dealership's customers | The dealership's team |
| Works alone | **Yes**: demo/own inventory, enquiries by webhook | **Yes**: no website required |
| Branding | The dealership's, entirely | VandLabs |

When a dealership buys both, the website connects to Intelligence through **adapters** (see INTEGRATION.md). The website never imports Intelligence code, never requires it, and shows no VandLabs promotion to customers. A subtle "Crafted by VandLabs Studio" footer credit is controlled by `showStudioCredit` in the config.

## Layout

```
src/
  config/dealership.ts      ← everything that identifies the dealership (name, contact, showroom, copy, imagery)
  data/vehicles.ts          ← demo inventory
  data/catalog.ts           ← brand order, lifestyle categories
  lib/
    types.ts                ← the website's Vehicle model; every source maps into it
    filters.ts              ← pure filter/sort/URL logic
    format.ts               ← ₹ Lakh/Cr, km, labels
    inventory/
      source.ts             ← InventorySource interface
      demo.ts               ← built-in demo source
      vandlabs.ts           ← Intelligence Business API adapter (verified)
      index.ts              ← picks a source from INVENTORY_SOURCE
    leads/
      types.ts              ← Lead + LeadDestination interface
      validate.ts           ← server-side validation (customer-friendly messages)
      destinations.ts       ← demo / webhook / vandlabs destinations + routing
  app/
    api/enquiry/route.ts    ← single endpoint for every form (origin check, honeypot, rate limit)
    …pages
  components/               ← UI; home/ holds the homepage sections
```

## Data flow

- **Inventory**: server components call `getInventory()`, which uses the configured source. Pages are statically generated and revalidate every 5 minutes (ISR), so a connected inventory refreshes without redeploying. Sold and draft vehicles are never listed.
- **Enquiries**: forms post to `/api/enquiry`. The server validates the request, then `routeLead()` gives it to the first destination that accepts it: Intelligence (vehicle enquiries only), then the webhook, then demo. API keys stay on the server.

## Future templates (02–06)

Template-specific code is the visual layer: `globals.css` and `components/`. Everything else (config shape, Vehicle model, inventory sources, lead destinations, filters, SEO) is template-agnostic. To start Template 02, copy the repository, keep `config/`, `data/`, `lib/` and `app/api/`, and redesign `components/` and `globals.css`. A later step could extract `lib/` into a shared package once a second template exists to prove the boundary.
