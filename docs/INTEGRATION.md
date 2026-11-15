# VandLabs Automotive Intelligence integration (optional)

The website works on its own (see DEPLOYMENT.md). A dealership that also subscribes to Intelligence connects the two by signing in, with nothing to copy between them. The contract is documented on the Intelligence side in `docs/WEBSITE_CONNECTION.md` of `Gaurav-7489/automobile_engine_used_cars`; this page is the website's half.

## Linking (done by VandLabs)

Intelligence uses Google-only sign-in, so owners have no Intelligence password and never type credentials into their public website.

1. VandLabs opens the Intelligence admin console → the dealership → **Website**, enters this site's address, and copies the key it shows once.
2. In this website's hosting (Vercel → Settings → Environment Variables) set `VANDLABS_API_URL` (the Intelligence address) and `VANDLABS_API_KEY` (the key). Redeploy.
3. `/connect` (not linked, not indexed) now shows "Linked to <dealership>". Stock, enquiries, analytics and signed inventory webhooks all use that key; the webhook secret is the key's SHA-256, so nothing else is configured.

Relinking in the admin console replaces the key (update `VANDLABS_API_KEY`); unlinking stops the website at once. Websites connected earlier with `WEBSITE_SECRET` keep working. The old owner-password form at `/connect` exists only with `LEGACY_PASSWORD_CONNECT=enabled`, for an Intelligence deployment that still allows password sign-in.

If Intelligence cannot be reached, the site keeps treating itself as connected: it shows the last known stock (or none) and queues enquiries for Intelligence. It never falls back to demo cars or demo enquiries.

## Stock: `src/lib/inventory/vandlabs.ts`

- `GET /api/v1/inventory`, cached under the `inventory` tag. Only published cars that are available or reserved are shown.
- **Changes arrive by signed webhook**: Intelligence posts to `/api/webhooks/inventory` after the change commits. The site verifies the HMAC signature (secret = SHA-256 of its key), refuses timestamps more than 5 minutes off, acts on each event id once, then refreshes every stock page (`revalidateTag("inventory")`). Events carry stock ids only; the pages re-read stock through the authenticated API.
- The scheduled refresh (`VANDLABS_REVALIDATE_SECONDS`, default 300) remains as the fallback for a missed event.

## Enquiries: `vandlabsDestination` in `src/lib/leads/destinations.ts`

`POST /api/v1/website/enquiries` with the key and the submission's `Idempotency-Key`. Types:

| Website form | Contract type | In Intelligence |
|---|---|---|
| Car page, "Call me back" | `callback` | Lead on the car, task "Call the customer back" |
| Car page, "Test drive" | `test_drive` | Lead with the requested slot to confirm |
| Car page, "Price & finance" | `price` | Lead on the car |
| Car page, "WhatsApp me" | `whatsapp` | Lead, source WhatsApp |
| Sell your car | `sell` | Acquisition enquiry (lead with the customer's car details) |
| Showroom, book a visit | `visit` | Lead with the requested visit to confirm |
| Other forms | `general` | Lead, unspecified interest |

A customer is told "we have your enquiry" only once Intelligence accepted it, or it is in the site's durable queue (`DATABASE_URL`). A sold or unpublished car is refused by Intelligence (404) and the customer is told it is no longer available. If Intelligence predates v2 (404/405 on the new route), car enquiries use the older `/api/public/enquiry`; other types stay queued.

## Analytics: `src/components/Analytics.tsx` → `/api/analytics`

First-party and cookieless: one visit per browser tab, car views, and clicks on WhatsApp or call links (counted as clicks, never as enquiries). Visitors with Do Not Track or Global Privacy Control are not counted. The site's server forwards counts to Intelligence only while connected; otherwise they are dropped. Nothing goes to a third party. The dealer sees them in Intelligence → Reports → Website.

## Verified

`tests/ecosystem/website-journey.spec.ts` in the Intelligence repository runs both production builds on PostgreSQL: the dealer adds and publishes a car → the website shows it via the webhook → a customer on a phone requests a test drive → the lead is in Intelligence (type, car, UTM, follow-up task) → reserving the car removes it from the website → a late enquiry for it is refused.
