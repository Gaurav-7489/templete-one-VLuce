// End-to-end smoke test. Run against a running site: BASE_URL=http://localhost:3000 npm run smoke
// Uses Playwright (npx playwright install chromium if it is not installed).
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");

const base = process.env.BASE_URL ?? "http://localhost:3000";
const shots = process.env.SHOTS_DIR;
const browser = await chromium.launch();
// Remote photos are optional for these checks; block them so slow image hosts never stall a run.
const blockImages = process.env.BLOCK_IMAGES === "1";
const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failures.push(msg);
};

async function page(viewport) {
  const ctx = await browser.newContext({ viewport });
  if (blockImages) await ctx.route(/images\.unsplash\.com/, (r) => r.abort());
  // The opening curtain plays once per visit; skip it so checks start immediately.
  await ctx.addInitScript(() => { try { sessionStorage.setItem("vluce:intro", "1"); } catch {} });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => failures.push(`page error: ${e.message}`));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource|ERR_|net::/.test(m.text()) && failures.push(`console: ${m.text()}`));
  return p;
}

const desk = await page({ width: 1440, height: 900 });
for (const path of ["/", "/collection", "/collection/2022-porsche-911-carrera-s", "/sell", "/showroom", "/shortlist", "/compare", "/nope"]) {
  const res = await desk.goto(base + path, { waitUntil: "load" });
  check(path === "/nope" ? res.status() === 404 : res.status() === 200, `${path} → ${res.status()}`);
  const h1 = await desk.locator("h1").first().textContent();
  check(!!h1?.trim(), `${path} has an h1 (“${h1?.trim().slice(0, 40)}”)`);
  if (shots) {
    await desk.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 80)); } scrollTo({ top: 0, behavior: "instant" }); await new Promise((r) => setTimeout(r, 1400)); });
    await desk.screenshot({ path: `${shots}/desk${path.replace(/\//g, "_") || "_home"}.png`, fullPage: true });
  }
}

// Filters
await desk.goto(base + "/collection?brand=Porsche", { waitUntil: "load" });
check((await desk.locator(".lgrid .lcard__title").allTextContents()).every((t) => /^Porsche/i.test(t)), "brand filter from URL");
await desk.goto(base + "/collection", { waitUntil: "load" });
await desk.locator(".fbtn").click();
await desk.locator(".filter-group", { has: desk.locator("h3", { hasText: /^Fuel$/ }) }).getByRole("button", { name: /^Electric/ }).click();
await desk.waitForURL(/fuel=Electric/);
check(/fuel=Electric/.test(desk.url()), "fuel filter updates URL");
await desk.locator(".fdrawer .search input").fill("taycan");
await desk.waitForURL(/q=taycan/);
check((await desk.locator(".lgrid article").count()) >= 1, "search narrows results");
await desk.locator(".fdrawer .search input").fill("zzzz");
await desk.waitForSelector(".lempty");
check(true, "empty state shown");
// Header search and brand panel
await desk.goto(base + "/", { waitUntil: "load" });
await desk.fill("#hsearch", "defender");
await desk.press("#hsearch", "Enter");
await desk.waitForURL(/q=defender/);
check((await desk.locator(".lgrid article").count()) === 1, "header search finds the Defender");
await desk.getByRole("button", { name: /^Brand/ }).click();
await desk.waitForSelector(".hmega");
await desk.locator(".hmega a", { hasText: "Audi" }).click();
await desk.waitForURL(/brand=Audi/);
check(true, "brand panel links to filtered collection");

// Vehicle page: reserve enquiry (validation, then success), compare, shortlist
await desk.goto(base + "/collection/2022-porsche-911-carrera-s", { waitUntil: "load" });
await desk.getByRole("button", { name: /Reserve Your Car/ }).click();
await desk.waitForSelector(".modal");
await desk.locator("#reserve-name").fill("A");
await desk.getByRole("button", { name: /Request reservation/ }).click();
await desk.waitForSelector(".field__error");
check(true, "enquiry validation errors shown");
await desk.locator("#reserve-name").fill("Asha Rao");
await desk.locator("#reserve-phone").fill("9876543210");
await desk.locator(".modal input[name=consent]").check();
await desk.getByRole("button", { name: /Request reservation/ }).click();
await desk.waitForSelector(".modal .notice");
check(/DEMO-/.test(await desk.locator(".modal .notice").textContent()), "reservation enquiry accepted in demo mode");
await desk.keyboard.press("Escape");
await desk.getByRole("button", { name: /Compare Car/ }).click();
await desk.goto(base + "/collection/2022-range-rover-autobiography-lwb", { waitUntil: "load" });
await desk.getByRole("button", { name: /Compare Car/ }).click();
await desk.goto(base + "/compare", { waitUntil: "load" });
check((await desk.locator(".cmp thead th").count()) === 3, "compare shows two cars side by side");
await desk.goto(base + "/collection?brand=Volvo", { waitUntil: "load" });
await desk.locator(".lgrid article .save-btn").first().click();
await desk.goto(base + "/shortlist", { waitUntil: "load" });
check((await desk.locator(".lgrid article").count()) === 1, "shortlist persists");

// Sell flow
await desk.goto(base + "/sell", { waitUntil: "load" });
await desk.selectOption("#s-brand", "BMW");
await desk.fill("#s-model", "X5");
await desk.selectOption("#s-year", "2021");
await desk.getByRole("button", { name: /Continue/ }).click();
await desk.fill("#s-km", "30000");
await desk.getByRole("button", { name: /Continue/ }).click();
await desk.fill("#s-name", "Asha Rao");
await desk.fill("#s-phone", "9876543210");
await desk.locator("input[name=consent]").check();
await desk.getByRole("button", { name: /Submit enquiry/ }).click();
await desk.waitForSelector(".notice");
check(true, "sell enquiry submitted");

// Mobile
const mob = await page({ width: 390, height: 844 });
for (const path of ["/", "/collection", "/collection/2022-range-rover-autobiography-lwb"]) {
  await mob.goto(base + path, { waitUntil: "load" });
  const overflow = await mob.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(overflow <= 0, `${path} no horizontal overflow on mobile (${overflow}px)`);
  if (shots) {
    await mob.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 80)); } scrollTo({ top: 0, behavior: "instant" }); await new Promise((r) => setTimeout(r, 1400)); });
    await mob.screenshot({ path: `${shots}/mob${path.replace(/\//g, "_") || "_home"}.png`, fullPage: true });
  }
}
await mob.goto(base + "/", { waitUntil: "load" });
await mob.getByRole("button", { name: "Menu" }).click();
await mob.waitForSelector(".menu--open");
check(true, "mobile menu opens");

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nAll checks passed.");
