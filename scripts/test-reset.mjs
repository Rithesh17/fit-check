import { chromium } from "playwright";

const base = process.env.BASE || "https://pulse-strength-log.netlify.app";
const ts = Date.now();
const email = process.env.EMAIL || `pulse.qa.${ts}@gmail.com`;
const pass1 = "pulsetest1234";
const pass2 = "pulsetest5678"; // the "new" password we reset to
const forgotEmail = process.env.FORGOT_EMAIL || email;

const log = (...a) => console.log(...a);
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

// capture the key Supabase auth calls
const netlog = [];
page.on("response", async (r) => {
  const u = r.url();
  if (u.includes("/auth/v1/recover") || u.includes("/auth/v1/user")) {
    let body = "";
    try { body = (await r.text()).slice(0, 200); } catch {}
    netlog.push(`${r.status()} ${u.split("/auth/v1/")[1].split("?")[0]}  ${body}`);
  }
});

let pass = 0, fail = 0;
const ok = (cond, msg) => { (cond ? pass++ : fail++); log(`  ${cond ? "PASS" : "FAIL"}  ${msg}`); };

try {
  // 1) login page shows the Forgot password link and it navigates to /forgot
  log("\n[1] login -> Forgot password link");
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  const link = page.getByRole("link", { name: /forgot password/i });
  ok(await link.count() > 0, "‘Forgot password?’ link is present on /login");
  await link.first().click();
  await page.waitForURL(/\/forgot/);
  ok(page.url().includes("/forgot"), "link navigates to /forgot");

  // 2) submit forgot form -> Supabase /recover accepts (validates redirect-url config)
  log("\n[2] /forgot submit -> Supabase recover");
  await page.fill('input[type="email"]', forgotEmail);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  const recover = netlog.find((l) => l.includes("recover"));
  ok(!!recover && recover.startsWith("200"), `recover call returned 200 (${recover || "no call seen"})`);
  const confirmed = await page.getByText(/on its way|check your inbox/i).count();
  ok(confirmed > 0, "confirmation message shown after submit");

  // 3) /reset while logged OUT should bounce to /login
  log("\n[3] /reset gating (logged out)");
  await page.context().clearCookies();
  await page.goto(base + "/reset", { waitUntil: "networkidle" });
  ok(/\/login/.test(page.url()), `logged-out /reset redirects to login (at ${new URL(page.url()).pathname})`);

  // 4) sign up a fresh user (instant session; email confirmation is OFF),
  //    then exercise the /reset password-update logic with a real session
  log("\n[4] sign up test user -> /reset updates password");
  await page.goto(base + "/signup", { waitUntil: "networkidle" });
  await page.fill('input[autocomplete="name"]', "QA Reset");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pass1);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
  ok(true, `signed up ${email} and landed on dashboard`);

  await page.goto(base + "/reset", { waitUntil: "networkidle" });
  const pwFields = page.locator('input[type="password"]');
  ok(await pwFields.count() === 2, "reset form renders (valid session detected)");

  // mismatch guard
  await pwFields.nth(0).fill(pass2);
  await pwFields.nth(1).fill("nope-different");
  await page.click('button[type="submit"]');
  ok(await page.getByText(/don't match/i).count() > 0, "mismatched passwords are rejected");

  // real update
  await pwFields.nth(1).fill(pass2);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  const userCall = netlog.find((l) => l.includes("user") && l.startsWith("200"));
  ok(!!userCall, `password update PUT /user returned 200 (${userCall || "no 200 seen"})`);

  // 5) confirm the NEW password actually works: sign out, sign in with pass2
  log("\n[5] verify new password works");
  await page.goto(base + "/dashboard", { waitUntil: "networkidle" });
  // sign out via the API route
  await page.request.post(base + "/auth/signout");
  await page.context().clearCookies();
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pass2);
  await page.click('button[type="submit"]');
  let signedIn = false;
  try { await page.waitForURL(/\/dashboard/, { timeout: 15000 }); signedIn = true; } catch {}
  ok(signedIn, "can sign in with the new password");

} catch (err) {
  fail++;
  log("  ERROR:", err.message);
} finally {
  log("\n--- Supabase auth calls seen ---");
  netlog.forEach((l) => log("  " + l));
  log("\n--- console/page errors ---");
  log(consoleErrors.length ? consoleErrors.map((e) => "  " + e).join("\n") : "  (none)");
  log(`\nRESULT: ${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
}
