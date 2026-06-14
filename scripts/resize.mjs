import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const names = process.argv.slice(2);
const dir = path.resolve(".verify");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
for (const n of names) {
  const src = path.join(dir, n + ".png");
  if (!fs.existsSync(src)) {
    console.log("missing", n);
    continue;
  }
  const b64 = fs.readFileSync(src).toString("base64");
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.setContent(
    `<body style="margin:0"><img id="i" src="data:image/png;base64,${b64}" style="width:1000px;display:block"></body>`,
  );
  await page.locator("#i").evaluate(
    (img) =>
      new Promise((res) => {
        if (img.complete) res();
        else img.onload = () => res();
      }),
  );
  const box = await page.locator("#i").boundingBox();
  await page.setViewportSize({
    width: 1000,
    height: Math.min(1850, Math.ceil(box.height)),
  });
  await page.locator("#i").screenshot({ path: path.join(dir, n + "-sm.png") });
  console.log("resized", n, Math.ceil(box.height));
}
await browser.close();
