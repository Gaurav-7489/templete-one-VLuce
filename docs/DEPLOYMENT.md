# Deployment

## Vercel (recommended)

1. Import the repository in Vercel. The framework is detected as Next.js and no settings are needed.
2. Set `NEXT_PUBLIC_SITE_URL` to the production URL (used for canonical URLs, the sitemap and Open Graph).
3. Optional: set the enquiry and inventory variables from `.env.example`.
4. Add the dealership's custom domain under Project → Domains.

Any Node 20+ host also works (`npm run build && npm start`).

## Before go-live checklist

- [ ] `src/config/dealership.ts` has the real name, contact, address, hours and consent text
- [ ] Demo inventory and Unsplash imagery replaced with the dealership's own
- [ ] Enquiry destination configured (`webhook` or `vandlabs`), and a test enquiry received
- [ ] `NEXT_PUBLIC_SITE_URL` set; `/sitemap.xml` submitted to Search Console
- [ ] For multi-instance hosting, replace the in-memory enquiry rate limiter in `app/api/enquiry/route.ts` with a shared store
