// End-to-end smoke test. Run against a running site: BASE_URL=http://localhost:3000 npm run smoke
// Uses Playwright (npx playwright install chromium if it is not installed).
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");

const base = process.env.BASE_URL ?? "http://localhost:3000";
const shots = process.env.SHOTS_DIR;
const browser = await chromium.launch();
const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failures.push(msg);
};

async function page(viewport) {
  const ctx = await browser.newContext({ viewport });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => failures.push(`page error: ${e.message}`));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource|ERR_|net::/.test(m.text()) && failures.push(`console: ${m.text()}`));
  return p;
}

const desk = await page({ width: 1440, height: 900 });
for (const path of ["/", "/collection", "/collection/2022-porsche-911-carrera-s", "/sell", "/showroom", "/shortlist", "/nope"]) {
  const res = await desk.goto(base + path, { waitUntil: "networkidle" });
  check(path === "/nope" ? res.status() === 404 : res.status() === 200, `${path} → ${res.status()}`);
  const h1 = await desk.locator("h1").first().textContent();
  check(!!h1?.trim(), `${path} has an h1 (“${h1?.trim().slice(0, 40)}”)`);
  if (shots) {
    await desk.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 80)); } scrollTo({ top: 0, behavior: "instant" }); await new Promise((r) => setTimeout(r, 1400)); });
    await desk.screenshot({ path: `${shots}/desk${path.replace(/\//g, "_") || "_home"}.png`, fullPage: true });
  }
}

// Filters
await desk.goto(base + "/collection?brand=Porsche", { waitUntil: "networkidle" });
check((await desk.locator(".results .card__brand").allTextContents()).every((t) => t.startsWith("Porsche")), "brand filter from URL");
await desk.goto(base + "/collection", { waitUntil: "networkidle" });
await desk.locator(".filter-group", { has: desk.locator("h3", { hasText: /^Fuel$/ }) }).getByRole("button", { name: /^Electric/ }).click();
await desk.waitForURL(/fuel=Electric/);
check(/fuel=Electric/.test(desk.url()), "fuel filter updates URL");
await desk.locator(".search input").fill("taycan");
await desk.waitForURL(/q=taycan/);
check((await desk.locator(".results > article").count()) >= 1, "search narrows results");
await desk.locator(".search input").fill("zzzz");
await desk.waitForSelector(".empty");
check(true, "empty state shown");

// Vehicle enquiry (validation, then success)
await desk.goto(base + "/collection/2022-porsche-911-carrera-s", { waitUntil: "networkidle" });
await desk.locator("#enq-name").fill("A");
await desk.getByRole("button", { name: /Request a viewing/ }).click();
await desk.waitForSelector(".field__error");
check(true, "enquiry validation errors shown");
await desk.locator("#enq-name").fill("Asha Rao");
await desk.locator("#enq-phone").fill("9876543210");
await desk.locator(".check input[name=consent]").check();
await desk.getByRole("button", { name: /Request a viewing/ }).click();
await desk.waitForSelector(".notice");
check(/DEMO-/.test(await desk.locator(".notice").textContent()), "vehicle enquiry accepted in demo mode");

// Shortlist
await desk.locator(".save-btn--inline").click();
await desk.goto(base + "/shortlist", { waitUntil: "networkidle" });
check((await desk.locator(".results > article").count()) === 1, "shortlist persists");

// Sell flow
await desk.goto(base + "/sell", { waitUntil: "networkidle" });
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
  await mob.goto(base + path, { waitUntil: "networkidle" });
  const overflow = await mob.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(overflow <= 0, `${path} no horizontal overflow on mobile (${overflow}px)`);
  if (shots) {
    await mob.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 80)); } scrollTo({ top: 0, behavior: "instant" }); await new Promise((r) => setTimeout(r, 1400)); });
    await mob.screenshot({ path: `${shots}/mob${path.replace(/\//g, "_") || "_home"}.png`, fullPage: true });
  }
}
await mob.goto(base + "/", { waitUntil: "networkidle" });
await mob.getByRole("button", { name: "Menu" }).click();
await mob.waitForSelector(".menu--open");
check(true, "mobile menu opens");

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nAll checks passed.");
