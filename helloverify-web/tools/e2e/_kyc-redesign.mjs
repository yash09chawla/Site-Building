import { chromium } from "@playwright/test";

const CONSENT = JSON.stringify({ v: 1, c: "granted", t: "2026-10-27T00:00:00.000Z" });

async function prep(page) {
  await page.addInitScript((record) => localStorage.setItem("hv.consent", record), CONSENT);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await prep(page);
const res = await page.goto("http://localhost:3000/en/products/customer-kyc", { waitUntil: "load", timeout: 180000 });
console.log("status", res.status());
await page.waitForTimeout(400);

const shots = [
  [".kz-hero", "hero"],
  [".kz-why", "why"],
  [".kz-fork", "fork"],
  [".kz-ops", "ops"],
  [".kz-bundle", "bundle"],
  [".kz-law", "law"],
  [".kz-plats", "plats"],
  [".kz-rbi", "rbi"],
  [".kz-close", "close"],
];
for (const [sel, name] of shots) {
  const el = page.locator(sel).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await el.screenshot({ path: `tools/e2e/_kyc-rd-${name}.png` });
}

const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
await prep(m);
await m.goto("http://localhost:3000/en/products/customer-kyc", { waitUntil: "load", timeout: 180000 });
await m.waitForTimeout(400);
for (const [sel, name] of [
  [".kz-why", "m-why"],
  [".kz-ops", "m-ops"],
  [".kz-law", "m-law"],
  [".kz-bundle", "m-bundle"],
]) {
  const el = m.locator(sel).first();
  await el.scrollIntoViewIfNeeded();
  await m.waitForTimeout(700);
  await el.screenshot({ path: `tools/e2e/_kyc-rd-${name}.png` });
}
await browser.close();
console.log("ok");
