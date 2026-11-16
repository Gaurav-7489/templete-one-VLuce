import { test } from "node:test";
import assert from "node:assert/strict";
import { availabilityUrl, breadcrumbJsonLd, dealerId, dealerJsonLd, faqJsonLd, ldScript, showroomFaq, vehicleJsonLd } from "../src/lib/seo";
import { demoVehicles as vehicles } from "../src/data/vehicles";

test("structured data publishes only known facts", () => {
  const car = vehicles.find((v) => v.availability === "reserved") ?? vehicles[0];
  const ld = vehicleJsonLd({ ...car, availability: "reserved" }, "Test car");
  assert.equal(ld.offers?.availability, "https://schema.org/Reserved", "a reserved car is not offered as in stock");
  assert.deepEqual(ld.offers?.seller, { "@id": dealerId });
  assert.ok(!JSON.stringify(ld).match(/aggregateRating|review/i));
  assert.equal(vehicleJsonLd({ ...car, price: null }, "x").offers, undefined, "no price, no Offer");
  assert.equal(availabilityUrl("available"), "https://schema.org/InStock");
  const dealer = dealerJsonLd();
  assert.equal(dealer["@id"], dealerId);
  assert.ok(dealer.sameAs.every((h) => !/^https:\/\/(www\.)?[a-z]+\.com\/?$/.test(h)), "placeholder social roots are not claimed as the dealer's profiles");
  assert.equal(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Collection", path: "/collection" }]).itemListElement[1].position, 2);
  const faq = showroomFaq();
  assert.equal(faqJsonLd(faq).mainEntity.length, faq.length);
  assert.ok(!ldScript({ x: "</script><script>alert(1)" }).__html.includes("</script>"));
});
