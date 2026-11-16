import { defineConfig, devices } from "@playwright/test";

/** Browser checks against a running production build (npm run build && npm start). Set BASE_URL to test a deployment. */
export default defineConfig({
  testDir: "./e2e",
  workers: 2,
  outputDir: "e2e-results",
  use: { baseURL: process.env.BASE_URL ?? "http://127.0.0.1:3000", trace: "off" },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
    { name: "tablet", use: { ...devices["iPad Mini"], defaultBrowserType: "chromium" } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
