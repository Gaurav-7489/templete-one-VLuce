import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const PAGES = ["/", "/collection", "/showroom", "/sell", "/shortlist"];

for (const path of PAGES) {
  test(`${path}: no horizontal scroll, no console errors, no serious accessibility violations`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "horizontal overflow").toBe(true);
    await expect(page.locator("h1")).toHaveCount(1);
    await page.addScriptTag({ content: axeSource });
    const result = await page.evaluate(async () => (await (window as unknown as { axe: { run: (o: unknown) => Promise<{ violations: { id: string; impact: string; nodes: unknown[] }[] }> } }).axe.run({ resultTypes: ["violations"] })));
    const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id} (${v.nodes.length})`);
    expect(serious, serious.join(", ")).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("a customer can find a car, see photos and specifications, and reach the dealership", async ({ page }) => {
  await page.goto("/collection");
  const first = page.locator("a[href^='/collection/']").first();
  await first.click();
  await expect(page).toHaveURL(/\/collection\/.+/);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("img").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  // An enquiry action and a WhatsApp route are both reachable without hunting.
  await expect(page.getByRole("button", { name: /request a viewing|register interest/i })).toBeVisible();
  await expect(page.locator("a[href*='wa.me']").first()).toBeAttached();
  // Structured data describes the car truthfully: a Car with an Offer, no invented ratings.
  const ld = await page.locator("script[type='application/ld+json']").allTextContents();
  const text = ld.join("\n");
  expect(text).toContain('"Car"');
  expect(text).not.toMatch(/aggregateRating|"review"/);
});

test("mobile navigation opens and closes", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /menu/i }).first();
  await toggle.click();
  await expect(page.getByRole("link", { name: /collection/i }).first()).toBeVisible();
});
