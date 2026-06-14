import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const designFile = path.resolve("design-ref/Pulse Fitness.dc.html");
const outDir = path.resolve("design-ref/fresh");
fs.mkdirSync(outDir, { recursive: true });
const url = pathToFileURL(designFile).href;

const pages = [
  ["Dashboard", "dashboard"],
  ["Log Workout", "logger"],
  ["History", "history"],
  ["Exercises", "exercises"],
  ["Progress", "progress"],
  ["Body", "body"],
];

const browser = await chromium.launch();

async function shoot(label, width, height, tag) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  // wait for the DC component to mount (PULSE wordmark or header title)
  await page.waitForTimeout(2500);

  for (const [name, key] of pages) {
    try {
      // click the nav button that contains this label
      const btn = page.locator(`button:has-text("${name}")`).first();
      if (await btn.count()) {
        await btn.click({ timeout: 3000 });
        await page.waitForTimeout(900);
      }
    } catch (e) {
      console.log(`  (could not navigate to ${name}: ${e.message})`);
    }
    const file = path.join(outDir, `${tag}-${key}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log("saved", file);
  }
  await ctx.close();
}

console.log("== Desktop ==");
await shoot("desktop", 1280, 900, "desk");
console.log("== Mobile ==");
await shoot("mobile", 402, 880, "mob");

await browser.close();
console.log("done");
