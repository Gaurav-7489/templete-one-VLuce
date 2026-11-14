# VandLabs Automotive Intelligence integration (optional)

The website works without Intelligence. These adapters are for dealerships that subscribe to both products.

The details below were checked against the Intelligence source in `Gaurav-7489/automobile_engine_used_cars` (`apps/intelligence`).

## Implemented (backed by existing Intelligence APIs)

### 1. Inventory sync: `src/lib/inventory/vandlabs.ts`

- `GET {VANDLABS_API_URL}/api/v1/inventory` with `Authorization: Bearer <key>`. The key needs the `inventory:read` scope (Intelligence → Settings → API keys).
- Response `{ data: [{ stockId, make, model, variant, year, priceInr, odometerKm, fuel, transmission, owners, availability, published, photos, … }] }`.
- Only `published` vehicles that are `available` or `reserved` are shown. Pages revalidate every `VANDLABS_REVALIDATE_SECONDS` (default 300), so price, photo and availability changes reach the site automatically, and sold cars drop off.
- **Limits:** the Business API doesn't return body type, colours, specifications, highlights or descriptions. Those sections are hidden when empty, and lifestyle is inferred only for electric cars. Filling them would need Intelligence to expose those fields.
- If the API is unreachable, the site logs the error and shows an empty collection rather than demo cars.

```
INVENTORY_SOURCE=vandlabs
VANDLABS_API_URL=https://<dealer-intelligence-domain>
VANDLABS_API_KEY=<inventory:read key>
```

### 2. Website enquiries → leads: `vandlabsDestination` in `src/lib/leads/destinations.ts`

- `POST {VANDLABS_API_URL}/api/public/enquiry` with `{ tenant, stock, name, phone, message, intent, consent, marketing, utmSource, utmCampaign }`. `intent` is one of `call | whatsapp | test-drive | price`, the same values the vehicle form uses.
- Intelligence creates a lead with source **"Website"** on that vehicle, in its branch, through its normal command pipeline (follow-up rules, audit trail, lead email). It attributes the lead to a campaign when the visitor's `utm_campaign` matches one. Duplicate phone and vehicle pairs within a day return the existing lead.
- The endpoint is same-origin protected. Requests from this site's **server** carry the Bearer key and no cookie, which that check allows. The browser never talks to Intelligence directly.
- **Limit:** Intelligence accepts enquiries only for a specific published vehicle. Sell-your-car, visit and general enquiries go to `LEAD_WEBHOOK_URL` if set, otherwise to demo mode. A future Intelligence endpoint for these would be added as another destination.

```
LEAD_DESTINATION=vandlabs
VANDLABS_TENANT_ID=<workspace id>
LEAD_WEBHOOK_URL=<optional, for non-vehicle enquiries>
```

> Not tested end to end against a live Intelligence workspace in this build: no credentials were available. The request and response shapes follow the source code and its tests (`tests/intelligence-prod/public-inventory.test.ts`, `website-enquiry.test.ts`). Check them in staging before go-live.

## Not implemented (no verified API yet)

| Capability | Status |
|---|---|
| Push-based publishing / webhooks on vehicle change | ISR polling covers this for now. A revalidation webhook (`revalidateTag("inventory")`) can be added when Intelligence sends one. |
| Website traffic and conversion analytics into Intelligence | No ingestion API found. UTM source/campaign already travel with each enquiry. |
| Campaign spend attribution beyond UTM matching | Intelligence-side. |
| Customer chat (`/api/public/chat` exists in Intelligence) | Not wired: it's scoped to Intelligence's own showroom pages. |
