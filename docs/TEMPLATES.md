# Building Template 02 (and later templates) from Template 01

A template is a **visual design** on top of a **shared business layer**. Every template speaks the same integration contract, so Intelligence, webhooks and CRMs never need to know which template a dealership chose.

| Keep exactly (shared business layer) | Redesign freely (visual layer) |
|---|---|
| `src/lib/**` (types, filters, format, seo, ratelimit, inventory, leads, vandlabs) | `src/components/**` |
| `src/app/api/**` (enquiry, connect, webhooks/inventory, analytics, health, leads/*) | `src/app/globals.css` |
| `src/config/dealership.ts` shape (`DealershipConfig`) | Page layouts under `src/app/**/page.tsx` |
| `src/app/sitemap.ts`, `robots.ts`, `/connect` page logic | Hero, navigation, cards, galleries, animation |
| `tests/**`, `e2e/**` (adjust selectors only) | Fonts, colours, imagery |

## Procedure

1. Create the new repository from Template 01 (copy the files; keep its git history if you want upstream fixes).
2. Rename in `package.json` and the README. Keep `.env.example`, `vercel.json` and `docs/` (update names).
3. Redesign `components/` and `globals.css`. Rules every template keeps:
   - Forms post through `postEnquiry()` with `useSubmissionKey()` (idempotency), show the honeypot field, the consent checkbox with `dealership.consentText`, field errors from the server, and `Received` only on success.
   - Car pages render `<TrackView stockId>` and put `data-stock-id` on the page root; layout renders `<Attribution />` and `<Analytics />`.
   - Car pages emit `vehicleJsonLd` + `breadcrumbJsonLd`; the layout emits `dealerJsonLd` (from `lib/seo.ts`).
   - One `<h1>` per page, visible focus, 4.5:1 text contrast (including over photos while they load), no horizontal scroll at 320 px.
4. Run `npm run lint && npm run typecheck && npm test && npm run build`, then `npm start` and `npm run test:browser` (mobile, tablet, desktop, axe).
5. Deploy as its own Vercel project (DEPLOYMENT.md). Connecting to Intelligence needs nothing template-specific.

## When to extract a shared package

Not yet. Once Template 02 exists and `src/lib` + `src/app/api` are still identical in both, move them into a versioned package (for example `@vandlabs/website-core`) consumed by every template. Doing it before a second template exists would guess at the boundary.

## Adding an inventory source for website-only dealers

Implement `InventorySource` (`src/lib/inventory/source.ts`): `list()` returns publicly listable `Vehicle`s (never sold or draft). A Google Sheet, a CMS or a DMS export are all one file. Wire it in `src/lib/inventory/index.ts` behind `INVENTORY_SOURCE=<id>`, and tag its fetch with `inventory` so `revalidateTag` refreshes it.
