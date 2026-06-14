import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const base = process.env.BASE || "http://localhost:3000";
const outDir = path.resolve(".verify");
fs.mkdirSync(outDir, { recursive: true });

const ts = Date.now();
const email = process.env.EMAIL || `pulse.qa.${ts}@gmail.com`;
const password = process.env.PASSWORD || "pulsetest1234";
const name = "Alex Mercer";

const log = (...a) => console.log(...a);
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

async function shot(name, full = true) {
  await page.screenshot({ path: path.join(outDir, name + ".png"), fullPage: full });
  log("  shot:", name);
}

try {
  // ---- sign up ----
  log("signing up as", email);
  await page.goto(base + "/signup", { waitUntil: "networkidle" });
  await page.fill('input[autocomplete="name"]', name);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // wait for redirect to dashboard (or fall through to login)
  let url = page.url();
  try {
    await page.waitForURL("**/dashboard", { timeout: 20000 });
    url = page.url();
  } catch {
    url = page.url();
  }
  log("after signup url:", url);

  if (!url.includes("/dashboard")) {
    // maybe confirmation required, or already exists -> try login
    log("not on dashboard, attempting login");
    await page.goto(base + "/login", { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    url = page.url();
    log("after login url:", url);
  }

  if (!url.includes("/dashboard")) {
    await shot("ZZ-auth-stuck");
    throw new Error("Could not reach dashboard after auth. URL=" + url);
  }

  await page.waitForTimeout(2500); // let seed + render settle
  await shot("01-dashboard");

  // ---- desktop pages ----
  const pages = [
    ["02-log", "/log"],
    ["03-history", "/history"],
    ["04-exercises", "/exercises"],
    ["05-progress", "/progress"],
    ["06-body", "/body"],
  ];
  for (const [n, p] of pages) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(n);
  }

  // ---- open a workout detail from history ----
  await page.goto(base + "/history", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const firstWorkout = page.locator('a[href^="/history/"]').first();
  if (await firstWorkout.count()) {
    await firstWorkout.click();
    await page.waitForTimeout(1500);
    await shot("07-detail");
  }

  // ---- exercise the logger: add exercise, log a set, finish & save ----
  log("exercising logger");
  await page.goto(base + "/log", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.click('button:has-text("Add exercise")');
  await page.waitForTimeout(600);
  const pick = page.locator('button:has-text("Bench Press")').first();
  if (await pick.count()) await pick.click();
  else await page.locator(".fixed button").nth(3).click();
  await page.waitForTimeout(600);
  // mark first set done (the green check is the last button in the set row)
  const checks = page.locator('button:has-text("✓")');
  if (await checks.count()) await checks.first().click();
  await page.waitForTimeout(500);
  await shot("08-logger-active");
  // finish & save
  await page.click('button:has-text("Finish & save workout")');
  await page.waitForTimeout(4000);
  log("after save url:", page.url());
  await shot("09-after-save");
  const saved = page.url().includes("/history/");

  // ---- mobile dashboard ----
  const mctx = await browser.newContext({
    viewport: { width: 402, height: 880 },
    deviceScaleFactor: 2,
    storageState: await ctx.storageState(),
  });
  const mp = await mctx.newPage();
  await mp.goto(base + "/dashboard", { waitUntil: "networkidle" });
  await mp.waitForTimeout(2000);
  await mp.screenshot({ path: path.join(outDir, "10-mobile-dashboard.png"), fullPage: true });
  log("  shot: 10-mobile-dashboard");
  await mp.goto(base + "/log", { waitUntil: "networkidle" });
  await mp.waitForTimeout(1200);
  await mp.screenshot({ path: path.join(outDir, "11-mobile-log.png"), fullPage: true });
  await mctx.close();

  log("\n=== RESULT ===");
  log("logger save reached detail:", saved);
  log("console errors:", consoleErrors.length);
  consoleErrors.slice(0, 8).forEach((e) => log("  •", e));
} catch (e) {
  log("VERIFY ERROR:", e.message);
  log("console errors:", consoleErrors.slice(0, 8));
  process.exitCode = 1;
} finally {
  await browser.close();
}
