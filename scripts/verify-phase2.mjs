import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const base = process.env.BASE || "http://localhost:3000";
const outDir = path.resolve(".verify");
fs.mkdirSync(outDir, { recursive: true });
const ts = Date.now();
const email = `pulse.p2.${ts}@gmail.com`;
const password = "pulsetest1234";

const log = (...a) => console.log(...a);
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 1000 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
const shot = async (n) => {
  await page.screenshot({ path: path.join(outDir, n + ".png"), fullPage: true });
  log("  shot:", n);
};
const step = async (name, fn) => {
  try {
    await fn();
    log("✓", name);
  } catch (e) {
    log("✗", name, "—", e.message);
  }
};

// sign up
await page.goto(base + "/signup", { waitUntil: "networkidle" });
await page.fill('input[autocomplete="name"]', "Alex Mercer");
await page.fill('input[type="email"]', email);
await page.fill('input[type="password"]', password);
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 20000 });
log("signed up:", email);
await page.waitForTimeout(1500);

await step("exercise info sheet", async () => {
  await page.goto(base + "/exercises", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.locator('[aria-label="Exercise info"]').first().click();
  await page.waitForTimeout(2500); // let video + history load
  await shot("p2-01-info-sheet");
  // close
  await page.keyboard.press("Escape").catch(() => {});
  await page.mouse.click(5, 5);
  await page.waitForTimeout(400);
});

await step("create custom exercise", async () => {
  await page.goto(base + "/exercises", { waitUntil: "networkidle" });
  await page.locator('button:has-text("New")').first().click();
  await page.waitForTimeout(500);
  await page.fill('input[placeholder*="Incline"]', "QA Cable Crossover");
  await page.locator('button:has-text("Save")').last().click();
  await page.waitForTimeout(1500);
  await page.goto(base + "/exercises", { waitUntil: "networkidle" });
  await page.fill('input[placeholder*="Search"]', "QA Cable");
  await page.waitForTimeout(600);
  await shot("p2-02-custom-exercise");
});

let routineCreated = false;
await step("create routine + add exercise", async () => {
  await page.goto(base + "/routines", { waitUntil: "networkidle" });
  await page.locator('button:has-text("New routine")').click();
  await page.waitForURL("**/routines/**", { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.fill('input[placeholder="Push Day"]', "QA Push Day");
  await page.locator('button:has-text("Add exercise")').click();
  await page.waitForTimeout(500);
  await page.locator('input[placeholder="Search exercises…"]').fill("Bench");
  await page.waitForTimeout(500);
  await page.locator('.fixed button:has-text("Bench Press")').first().click();
  await page.waitForTimeout(500);
  await shot("p2-03-routine-editor");
  await page.locator('button:has-text("Save routine")').click();
  await page.waitForURL("**/routines", { timeout: 15000 });
  routineCreated = true;
  await page.waitForTimeout(800);
});

await step("start workout from template + save", async () => {
  await page.goto(base + "/log", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot("p2-04-log-start");
  if (routineCreated) {
    await page.locator('button:has-text("Start")').first().click();
  } else {
    // fallback: empty strength
    await page.locator('button:has-text("Empty strength")').click();
    await page.waitForTimeout(400);
    await page.locator('button:has-text("Add exercise")').click();
    await page.waitForTimeout(400);
    await page.locator('.fixed button:has-text("Bench Press")').first().click();
  }
  await page.waitForTimeout(800);
  await page.locator('button:has-text("✓")').first().click();
  await page.waitForTimeout(400);
  await shot("p2-05-logger");
  await page.locator('button:has-text("Finish & save workout")').click();
  await page.waitForURL("**/history/**", { timeout: 15000 });
  await page.waitForTimeout(800);
  await shot("p2-06-detail");
});

await step("edit workout", async () => {
  await page.locator('a:has-text("Edit")').first().click();
  await page.waitForURL("**/log/edit/**", { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.locator('button:has-text("Save changes")').click();
  await page.waitForURL("**/history/**", { timeout: 15000 });
  await page.waitForTimeout(600);
});

await step("account page + goals", async () => {
  await page.goto(base + "/account", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.fill('input[placeholder="4"]', "4");
  await page.fill('input[placeholder="40000"]', "40000");
  await page.locator('button:has-text("Save profile")').click();
  await page.waitForTimeout(1200);
  await shot("p2-07-account");
});

await step("dashboard with goals", async () => {
  await page.goto(base + "/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot("p2-08-dashboard");
});

// mobile
const mctx = await browser.newContext({
  viewport: { width: 402, height: 880 },
  deviceScaleFactor: 2,
  storageState: await ctx.storageState(),
});
const mp = await mctx.newPage();
await mp.goto(base + "/log", { waitUntil: "networkidle" });
await mp.waitForTimeout(1200);
await mp.screenshot({ path: path.join(outDir, "p2-09-mobile-log.png"), fullPage: true });
log("  shot: p2-09-mobile-log");
await mctx.close();

log("\n=== RESULT ===");
log("console errors:", errors.length);
errors.slice(0, 10).forEach((e) => log("  •", e));
await browser.close();
