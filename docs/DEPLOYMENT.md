# Deployment

## Vercel (recommended)

1. Import the repository as its own Vercel project (it is independent of Intelligence). Framework: Next.js, no settings needed.
2. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
3. Choose how the dealership works (below) and set those variables for **Production** and **Preview**.
4. Add the custom domain under Project → Domains.
5. `vercel.json` schedules `/api/leads/retry` daily (allowed on every Vercel plan). Set `CRON_SECRET` so only Vercel can call it.

Any Node 20+ host also works (`npm run build && npm start`); schedule `GET /api/leads/retry` with `Authorization: Bearer $CRON_SECRET` there.

## Three ways a dealership can use the website

| | Website only | Website + Intelligence | Intelligence only |
|---|---|---|---|
| Inventory | Edit `src/data/vehicles.ts` (or add an `InventorySource`, see TEMPLATES.md) | Published stock from Intelligence | — (no website) |
| Enquiries | `LEAD_WEBHOOK_URL` → the dealer's CRM, Zapier/Make (to email, Sheets, WhatsApp Business) | Leads in Intelligence, every type | — |
| Durable queue | `DATABASE_URL` (any PostgreSQL) — recommended | `DATABASE_URL` — recommended | — |
| Needs a VandLabs subscription | No | Yes | Yes |

### Website only (production minimum)

```
NEXT_PUBLIC_SITE_URL=https://www.dealer.example
LEAD_WEBHOOK_URL=https://hooks.zapier.com/…        # or the dealer's CRM endpoint
LEAD_WEBHOOK_SECRET=<random>                       # optional, lets the receiver verify requests
DATABASE_URL=postgres://…                          # recommended: enquiries survive a CRM outage
CRON_SECRET=<random>  LEADS_ADMIN_TOKEN=<random 24+>
```

### Website + Intelligence

```
NEXT_PUBLIC_SITE_URL=https://www.dealer.example
VANDLABS_API_URL=https://<intelligence host>
WEBSITE_SECRET=<random 24+, keep stable>
DATABASE_URL=…  CRON_SECRET=…  LEADS_ADMIN_TOKEN=…
LEAD_WEBHOOK_URL=…                                 # optional: used if the site is later disconnected
```

Then the owner opens `/connect` and signs in. Deploy Intelligence (with migration 0023) **before** this website version.

## What the customer is told

- An enquiry is acknowledged only when it was delivered, or (with `DATABASE_URL`) stored in the queue for delivery.
- Without `DATABASE_URL`, a failed delivery shows "We could not send your enquiry just now…" and the form keeps what was typed; retrying uses the same key, so it is never duplicated.
- A production site with no destination shows "Online enquiries are not available…" with phone/WhatsApp. `GET /api/health` returns 503 in that state, so it fails a deployment smoke check.
- `LEAD_DESTINATION=demo` is the only way to accept enquiries without sending them, and the confirmation says "Demo mode".

## Operating the queue

- `GET /api/leads/failed` (Bearer `LEADS_ADMIN_TOKEN`): references, status, attempts and the last error of enquiries not yet delivered. No customer details.
- `POST /api/leads/failed` `{ "reference": "VL-…" }`: retry a failed one now (after fixing the destination).
- Retries back off from ~30 s to 6 h; after 8 attempts an enquiry is `failed` and waits for staff. Customer details of delivered enquiries are removed after 7 days.

## Before go-live checklist

- [ ] `src/config/dealership.ts` has the real name, contact, address, hours, social links and consent text
- [ ] Demo inventory and imagery replaced (website only), or the site connected (`/connect`)
- [ ] An enquiry destination configured; `GET /api/health` returns `200`; a test enquiry received at the destination
- [ ] `DATABASE_URL`, `CRON_SECRET`, `LEADS_ADMIN_TOKEN` set (recommended)
- [ ] `NEXT_PUBLIC_SITE_URL` set; `/sitemap.xml` submitted to Search Console
- [ ] Privacy notice published (DPDP Act 2023 in India): what the enquiry form collects, why, retention, contact for requests

## Checks

```
npm run lint && npm run typecheck && npm test && npm run build
npm start &  BASE_URL=http://127.0.0.1:3000 npm run test:browser
```
