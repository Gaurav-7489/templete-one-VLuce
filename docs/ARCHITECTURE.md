# Architecture

## Product model

VandLabs sells two independent products:

| | Dealership website (this repo) | Automotive Intelligence |
|---|---|---|
| Who uses it | The dealership's customers | The dealership's team |
| Works alone | **Yes**: own inventory file, enquiries to the dealer's CRM by webhook | **Yes**: no website required |
| Branding | The dealership's, entirely | VandLabs |

When a dealership buys both, the website connects through **adapters** (INTEGRATION.md). The website never imports Intelligence code and never requires it.

## Layers

```
src/
  config/dealership.ts    ← identity: name, contact, showroom, copy, imagery              (per dealership)
  data/                   ← demo / website-only inventory, brand order, categories         (per dealership)
  components/ + globals.css ← the visual design                                           (per TEMPLATE)
  app/ (pages)            ← page composition                                               (per TEMPLATE)
  app/api/                ← enquiry, connect, webhooks, analytics, health, lead queue      (shared)
  lib/                    ← business layer                                                 (shared)
    types.ts              ← the Vehicle model every source maps into
    filters.ts format.ts  ← search/filter/sort, ₹ formatting
    seo.ts                ← AutoDealer, Car/Offer, BreadcrumbList, FAQ — known facts only
    ratelimit.ts          ← shared (database) limiter, per-instance fallback, origin check
    inventory/            ← InventorySource interface; demo and Intelligence sources
    leads/
      types.ts            ← Lead, enquiry types (the integration contract), destination interface
      validate.ts         ← customer-facing validation
      config.ts           ← destination mode, demo rules, backoff
      destinations.ts     ← Intelligence, webhook, demo; resolveDestination()
      store.ts db.ts      ← durable queue on any PostgreSQL (optional)
      service.ts          ← submitLead(): idempotency, delivery, retry, dead letter
    vandlabs/             ← connection (key derivation, link state), webhook verification
```

## Enquiry flow

```
form ──POST /api/enquiry──▶ origin check · size limit · honeypot · validation · shared rate limit · car still listed?
                              │
                              ▼
                       resolveDestination()  ── none (production) ──▶ 503 "not available" (never a fake success)
                              │                └─ demo (explicit only) ─▶ "Demo mode" confirmation
                              ▼
            DATABASE_URL? ── no ──▶ deliver now ─ ok ─▶ "we have your enquiry"
                │                              └ fail ─▶ honest error, same key on retry
               yes
                ▼
       store once (Idempotency-Key, 10-minute fingerprint) ─▶ "we have your enquiry" (durably accepted)
                ▼
       deliver now ─ fail ─▶ retry with backoff (each submission, daily cron) ─▶ after 8: failed, staff requeue
```

## Inventory flow

Pages are statically generated and cached under the `inventory` tag. Intelligence's signed webhook clears that tag when published stock changes; the scheduled refresh (300 s) is the fallback. Sold and unpublished cars are never listed, and a car enquiry is refused unless the car is still listed.

## Future templates

See TEMPLATES.md.
