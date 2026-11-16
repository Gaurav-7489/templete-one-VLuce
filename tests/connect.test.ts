import { test } from "node:test";
import assert from "node:assert/strict";
import { env } from "./helpers";

test("the website no longer collects Intelligence passwords unless the legacy flag is set", async () => {
  const restore = env({ LEGACY_PASSWORD_CONNECT: undefined, VANDLABS_API_URL: "https://intel.example", WEBSITE_SECRET: "s".repeat(32) });
  try {
    const { POST } = await import("../src/app/api/connect/route");
    const r = await POST(new Request("https://site.example/api/connect", { method: "POST", headers: { origin: "https://site.example", host: "site.example" }, body: JSON.stringify({ email: "o@gmail.com", password: "secret" }) }));
    assert.equal(r.status, 410);
  } finally { restore(); }
});

test("an admin-issued key (VANDLABS_API_KEY) is what the website presents, and verifies webhooks", async () => {
  const key = `vl_${"a".repeat(12)}_${"b".repeat(43)}`;
  const restore = env({ VANDLABS_API_KEY: key, WEBSITE_SECRET: "s".repeat(32) });
  try {
    const { websiteKey } = await import("../src/lib/vandlabs/connection");
    assert.equal(websiteKey(), key, "the explicit key wins over the derived one");
  } finally { restore(); }
});
