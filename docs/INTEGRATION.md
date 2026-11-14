# VandLabs Automotive Intelligence integration (optional)

The website works on its own with its demo collection. A dealership that also subscribes to Intelligence connects the two by signing in, with nothing to copy between them.

Checked against `Gaurav-7489/automobile_engine_used_cars` (`apps/intelligence`), and run end to end against a local Intelligence build on PostgreSQL (see "Verified" below).

## Connecting (the owner signs in with their Intelligence email)

1. In the website's hosting settings, set `VANDLABS_API_URL` (the Intelligence address) and `WEBSITE_SECRET` (random text, 24+ characters, unique to this deployment). Redeploy.
2. The dealership owner opens **`/connect`** on the website (not linked anywhere, not indexed), enters their Intelligence email and password (and authenticator code if they use one), and presses **Connect Website**.
3. Done. Every page switches to the cars published in that workspace on the next visit. Enquiries about a car become leads in Intelligence.

How it works:

- The website derives a read-only key from `WEBSITE_SECRET` (`src/lib/vandlabs/connection.ts`). It never stores a key or the password.
- `/api/connect` (this site's server) sends the email, password, key and site address to Intelligence `POST /api/public/website/connect`. Intelligence signs the owner in exactly like its own sign-in page (same lockout and rate limits), checks they are the workspace **owner**, and stores the key's SHA-256 as an `inventory:read` API key named `Website: <host>`, valid for a year. Connecting again renews it.
- The connection appears in Intelligence → Settings → API with a **Website** label. Revoking it there disconnects the website; **Disconnect** on `/connect` does the same. Both are in the Intelligence audit log.
- The website checks the link at `GET /api/v1/website` (which workspace, renewal date) every `VANDLABS_REVALIDATE_SECONDS` (default 300).

## Stock: `src/lib/inventory/vandlabs.ts`

- `GET {VANDLABS_API_URL}/api/v1/inventory` with the key. Only `published` cars that are `available` or `reserved` are shown, and demo cars are never mixed in.
- Besides make, model, price, kilometres, fuel, transmission, owners and photos, Intelligence now also sends body type, colours, description, features (shown as highlights), categories (the site's lifestyle tabs), registration state (never the number) and headline specifications when they are recorded. Missing ones are hidden.
- If Intelligence cannot be reached, the site shows an empty collection rather than demo cars.

## Enquiries: `vandlabsDestination` in `src/lib/leads/destinations.ts`

- Car enquiries go to `POST {VANDLABS_API_URL}/api/public/enquiry` with the workspace from the connection. They become leads with source **Website** on that car, in its branch, through Intelligence's normal follow-up rules and lead emails.
- Each car enquiry carries the visitor's address (`X-Visitor-Address`, never sent to webhooks), so Intelligence limits each visitor to 6 per 10 minutes instead of limiting the whole website as one address.
- Sell-your-car, visit and general enquiries go to `LEAD_WEBHOOK_URL` if set, otherwise demo mode (Intelligence has no endpoint for those yet).

## Same demo cars in both products

`packages/demo-data/src/vluce.ts` in the Intelligence repository is generated from this site's `src/data/vehicles.ts`. To show a dealership both products with the same 25 cars, create a demo workspace and run there:

```
OWNER_PASSWORD=... pnpm intelligence:load-vluce-demo --owner-email owner@example.com
```

It adds the cars with their photos, descriptions and prices, publishes the 23 that are available or reserved, keeps the 2 "arriving soon" cars unpublished, and skips cars already loaded. Then connect this website from `/connect`.

## Verified

Local run, Intelligence production build plus this site's production build, Intelligence on PostgreSQL 16:

- `/connect` with a wrong password: refused with Intelligence's message; nothing created.
- Correct password: "Connected to VLuce Motor House"; `/collection` changed from the 25 demo cars to the workspace's 23 published cars (stock IDs `V-10xx`), with highlights and specifications on the detail page.
- An enquiry on a connected car became lead `L-1001`, source `Website`, in Intelligence.
- **Disconnect**: the site returned to the demo collection.

## Not implemented yet

| Capability | Status |
|---|---|
| Instant refresh when stock changes in Intelligence | Pages refresh within `VANDLABS_REVALIDATE_SECONDS`. A push from Intelligence could call `revalidateTag("inventory")`. |
| Sell, visit and general enquiries into Intelligence | Needs a new Intelligence endpoint. |
| Website traffic analytics into Intelligence | No ingestion API; UTM source and campaign already travel with each enquiry. |
