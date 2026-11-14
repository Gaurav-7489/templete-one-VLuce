# Customizing VLuce for a dealership

1. **Identity & contact**: edit `src/config/dealership.ts`: name, wordmark, phone/WhatsApp (digits only for `phoneE164`/`whatsappE164`), email, showroom address, hours, map query, social links, consent wording.
2. **Homepage copy & imagery**: `dealership.home` sets the hero headline, lead, hero image or optional `heroVideo` (muted, looped; the hero still works without it), and sell/experience images. Use the dealership's own photography. Put files in `public/` and reference them as `/images/hero.jpg`.
3. **Colours & type**: change the tokens in `:root` at the top of `src/app/globals.css` (`--ink`, `--paper`, `--accent` …). Fonts are set in `src/app/layout.tsx`.
4. **Inventory**: replace `src/data/vehicles.ts`, or connect a source (see INTEGRATION.md). Each vehicle needs a unique `slug` and `stockId`. Never put registration numbers in `registration`; it holds the state code only.
5. **Brands & lifestyles**: `src/data/catalog.ts` sets the brand display order and the lifestyle tiles. Brands in the list with no stock show as "arriving soon" rather than linking to an empty page.
6. **Enquiries**: set `LEAD_DESTINATION=webhook` and `LEAD_WEBHOOK_URL` to send every form to the dealership's CRM, Zapier/Make, or email automation.
7. **Credit**: set `showStudioCredit: false` for a fully white-label site.
8. **Claims**: the Experience section deliberately makes no claims about certification, inspections, warranties or awards. Add them only with dealer-provided, verifiable evidence.
