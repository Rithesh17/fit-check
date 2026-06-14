import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const base = process.env.BASE || "http://localhost:3000";
const outDir = path.resolve(".verify");
fs.mkdirSync(outDir, { recursive: true });

// targets: [name, path, width, height, fullPage]
const targets = JSON.parse(process.env.TARGETS || "[]");
const storage = process.env.STORAGE || "";

const browser = await chromium.launch();
for (const [name, urlPath, width, height, full] of targets) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    ...(storage && fs.existsSync(storage) ? { storageState: storage } : {}),
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => {
    if (m.type() === "error") errs.push(m.text());
  });
  const resp = await page.goto(base + urlPath, {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await page.waitForTimeout(800);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: !!full });
  console.log(
    `${name}: ${resp?.status()} -> ${file}${errs.length ? " | console errors: " + errs.slice(0, 3).join(" ; ") : ""}`,
  );
  await ctx.close();
}
await browser.close();
