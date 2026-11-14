# Customizing VLuce for a dealership

1. **Identity & contact**: edit `src/config/dealership.ts`: name, wordmark, phone/WhatsApp (digits only for `phoneE164`/`whatsappE164`), email, showroom address, hours, map query, social links, consent wording.
2. **Homepage copy & imagery**: `dealership.home` sets the hero headline, lead, hero image or optional `heroVideo` (muted, looped; the hero still works without it), and sell/experience images. Use the dealership's own photography. Put files in `public/` and reference them as `/images/hero.jpg`.
3. **Colours & type**: the royal palette is set by tokens at the top of `src/app/globals.css`: `--midnight` and `--sapphire` (dark surfaces, header), `--ivory` and `--sand` (light surfaces, borders), `--gold`, `--gold-2` and `--gold-deep` (accents, primary buttons), and `--oxblood` (Booked ribbons). Change those to rebrand. Fonts are set in `src/app/layout.tsx`.
   The palette now follows Apple-style neutrals with one blue accent: the v4 block at the end of `globals.css` remaps the tokens (`--blue`, `--ivory`, `--sapphire`, …), so edit that block to rebrand. Headlines use Instrument Serif via `--font-display`.
   **Motion**: smooth scrolling (Lenis) lives in `components/motion/SmoothScroll.tsx`; the opening curtain, magnetic buttons, staggered reveals and scroll progress bar are in `components/motion/`. Everything switches off for visitors who prefer reduced motion. Remove `<Intro />` from `app/layout.tsx` to drop the opening curtain.
4. **Inventory**: replace `src/data/vehicles.ts`, or connect a source (see INTEGRATION.md). Each vehicle needs a unique `slug` and `stockId`. Never put registration numbers in `registration`; it holds the state code only.
5. **Brands & lifestyles**: `src/data/catalog.ts` sets the brand display order and the lifestyle tiles. Brands in the list with no stock show as "arriving soon" rather than linking to an empty page.
6. **Enquiries**: set `LEAD_DESTINATION=webhook` and `LEAD_WEBHOOK_URL` to send every form to the dealership's CRM, Zapier/Make, or email automation.
7. **Credit**: set `showStudioCredit: false` for a fully white-label site.
8. **Claims**: the Experience section deliberately makes no claims about certification, inspections, warranties or awards. Add them only with dealer-provided, verifiable evidence.
